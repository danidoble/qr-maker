import { useCallback, useEffect, useMemo, useReducer } from "react";
import {
  DEFAULT_DESIGN,
  sanitizeDesign,
  type ContentState,
  type Design,
  type FrameStyle,
  type QRStyle,
} from "../lib/design";

const STORAGE_KEY = "qr-maker:design:v2";
const HASH_KEY = "#d=";
const LIMIT = 80;
/** Edits with the same key inside this window collapse into one undo step. */
const COALESCE_MS = 700;

interface History {
  past: Design[];
  present: Design;
  future: Design[];
  lastKey: string | null;
  lastAt: number;
}

type Action =
  | { type: "update"; fn: (d: Design) => Design; key: string | null }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "replace"; design: Design };

function reducer(h: History, a: Action): History {
  switch (a.type) {
    case "update": {
      const next = a.fn(h.present);
      if (next === h.present) return h;
      const now = Date.now();
      const coalesce =
        a.key !== null && a.key === h.lastKey && now - h.lastAt < COALESCE_MS;
      return {
        past: coalesce ? h.past : [...h.past, h.present].slice(-LIMIT),
        present: next,
        future: [],
        lastKey: a.key,
        lastAt: now,
      };
    }
    case "undo": {
      if (!h.past.length) return h;
      return {
        past: h.past.slice(0, -1),
        present: h.past[h.past.length - 1],
        future: [h.present, ...h.future],
        lastKey: null,
        lastAt: 0,
      };
    }
    case "redo": {
      if (!h.future.length) return h;
      return {
        past: [...h.past, h.present],
        present: h.future[0],
        future: h.future.slice(1),
        lastKey: null,
        lastAt: 0,
      };
    }
    case "replace":
      return {
        past: [...h.past, h.present].slice(-LIMIT),
        present: a.design,
        future: [],
        lastKey: null,
        lastAt: 0,
      };
  }
}

// ── Share links: the design (minus uploaded images) in the URL hash ──

function encodeShare(d: Design): string {
  const lite: Design = {
    ...d,
    qr: { ...d.qr, logo: d.qr.logo?.kind === "image" ? null : d.qr.logo },
  };
  const bytes = new TextEncoder().encode(JSON.stringify(lite));
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeShare(s: string): Design | null {
  try {
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return sanitizeDesign(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}

export function shareUrl(d: Design): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}${HASH_KEY}${encodeShare(d)}`;
}

function initial(): { design: Design; fromLink: boolean } {
  if (typeof window === "undefined")
    return { design: DEFAULT_DESIGN, fromLink: false };
  if (window.location.hash.startsWith(HASH_KEY)) {
    const d = decodeShare(window.location.hash.slice(HASH_KEY.length));
    history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
    if (d) return { design: d, fromLink: true };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw)
      return { design: sanitizeDesign(JSON.parse(raw)), fromLink: false };
  } catch {
    /* storage unavailable */
  }
  return { design: DEFAULT_DESIGN, fromLink: false };
}

export function useDesign() {
  const [{ boot, ...h }, dispatch] = useReducer(
    (s: History & { boot: { fromLink: boolean } }, a: Action) => ({
      ...reducer(s, a),
      boot: s.boot,
    }),
    null,
    () => {
      const { design, fromLink } = initial();
      return {
        past: [],
        present: design,
        future: [],
        lastKey: null,
        lastAt: 0,
        boot: { fromLink },
      };
    },
  );

  // Persist (best effort — big uploaded logos may exceed quota).
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(h.present));
      } catch {
        try {
          const lite = { ...h.present, qr: { ...h.present.qr, logo: null } };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(lite));
        } catch {
          /* ignore */
        }
      }
    }, 250);
    return () => clearTimeout(t);
  }, [h.present]);

  const update = useCallback(
    (fn: (d: Design) => Design, key: string | null = null) =>
      dispatch({ type: "update", fn, key }),
    [],
  );

  const api = useMemo(
    () => ({
      update,
      setContent: (patch: Partial<ContentState>, key: string | null = null) =>
        update((d) => ({ ...d, content: { ...d.content, ...patch } }), key),
      setField: (field: string, value: string) =>
        update(
          (d) => ({
            ...d,
            content: {
              ...d.content,
              fields: { ...d.content.fields, [field]: value },
            },
          }),
          `field:${field}`,
        ),
      setQR: (patch: Partial<QRStyle>, key: string | null = null) =>
        update((d) => ({ ...d, qr: { ...d.qr, ...patch } }), key),
      setFrame: (patch: Partial<FrameStyle>, key: string | null = null) =>
        update((d) => ({ ...d, frame: { ...d.frame, ...patch } }), key),
      undo: () => dispatch({ type: "undo" }),
      redo: () => dispatch({ type: "redo" }),
      replace: (design: Design) => dispatch({ type: "replace", design }),
    }),
    [update],
  );

  return {
    design: h.present,
    canUndo: h.past.length > 0,
    canRedo: h.future.length > 0,
    openedFromLink: boot.fromLink,
    ...api,
  };
}

export type DesignApi = ReturnType<typeof useDesign>;
