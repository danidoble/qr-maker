import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_RANDOM,
  MAX_BULK,
  analyze,
  displayText,
  formatBytes,
  generateRandom,
  itemFrame,
  parseList,
  renderBulk,
  type Analysis,
  type BulkItem,
  type BulkProgress,
  type LabelMode,
  type LabelSlot,
  type NameMode,
  type RandomOptions,
  type Separator,
} from "../lib/bulk";
import type { FrameStyle, QRStyle } from "../lib/design";
import { downloadBlob, type ExportFormat } from "../lib/export";

export type BulkSource = "random" | "list";

export interface BulkSettings {
  enabled: boolean;
  source: BulkSource;
  random: RandomOptions;
  text: string;
  sep: Separator;
  uniqueList: boolean;
  labelMode: LabelMode;
  labelSlot: LabelSlot;
  format: ExportFormat;
  width: number;
  nameMode: NameMode;
}

const KEY = "qr-maker:bulk:v1";
const DEFAULTS: BulkSettings = {
  enabled: false,
  source: "random",
  random: DEFAULT_RANDOM,
  text: "",
  sep: "lines",
  uniqueList: false,
  labelMode: "value",
  labelSlot: "label",
  format: "png",
  width: 1024,
  nameMode: "index-value",
};
// Don't persist huge pastes.
const MAX_SAVED_TEXT = 200_000;

function load(): BulkSettings {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return {
      ...DEFAULTS,
      ...raw,
      random: { ...DEFAULT_RANDOM, ...(raw.random ?? {}) },
    };
  } catch {
    return DEFAULTS;
  }
}

export type Toast = (
  message: string,
  tone?: "success" | "error" | "info",
) => void;

export function useBulk(toast: Toast) {
  const [s, setS] = useState<BulkSettings>(load);
  const set = useCallback(
    (p: Partial<BulkSettings>) => setS((o) => ({ ...o, ...p })),
    [],
  );
  const setRandom = useCallback(
    (p: Partial<RandomOptions>) =>
      setS((o) => ({ ...o, random: { ...o.random, ...p } })),
    [],
  );
  const [seed, setSeed] = useState(0);
  const regenerate = useCallback(() => setSeed((n) => n + 1), []);

  useEffect(() => {
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({
          ...s,
          text: s.text.length > MAX_SAVED_TEXT ? "" : s.text,
        }),
      );
    } catch {
      /* ignore */
    }
  }, [s]);

  // ── Source → items ──
  const random = useMemo(
    () => generateRandom(s.random),
    // `seed` isn't read: bumping it forces a fresh batch on "Regenerate".
    [s.random, seed],
  );
  const parsed = useMemo(() => parseList(s.text, s.sep), [s.text, s.sep]);

  const raw = s.source === "random" ? random.codes : parsed;
  const unique = s.source === "random" ? s.random.unique : s.uniqueList;
  const values = useMemo(
    () => (s.source === "list" && s.uniqueList ? [...new Set(parsed)] : raw),
    [s.source, s.uniqueList, parsed, raw],
  );

  const items: BulkItem[] = useMemo(() => {
    if (s.source === "random") {
      const { prefix, suffix } = s.random;
      return values.map((data) => ({
        data,
        text: data.slice(prefix.length, data.length - suffix.length) || data,
      }));
    }
    return values.map((data) => ({ data, text: displayText(data) }));
  }, [values, s.source, s.random]);

  const error =
    s.source === "random"
      ? random.error
      : values.length > MAX_BULK
        ? `${values.length.toLocaleString()} items — the max per batch is ${MAX_BULK.toLocaleString()}.`
        : null;
  const ready = !error && items.length > 0;

  const analysisFor = useCallback(
    (qr: QRStyle): Analysis => analyze(raw, qr),
    [raw],
  );

  const frameFor = useCallback(
    (frame: FrameStyle, item: BulkItem) =>
      itemFrame(frame, item, s.labelMode, s.labelSlot),
    [s.labelMode, s.labelSlot],
  );

  // ── Run ──
  const [progress, setProgress] = useState<BulkProgress | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);
  const cancel = useCallback(() => abortRef.current?.abort(), []);

  const run = useCallback(
    async (qr: QRStyle, frame: FrameStyle, baseName: string) => {
      if (!ready || abortRef.current) return;
      const ctl = new AbortController();
      abortRef.current = ctl;
      setProgress({ done: 0, total: items.length, phase: "render" });
      try {
        const res = await renderBulk({
          items,
          qr,
          frameFor: (it) => frameFor(frame, it),
          format: s.format,
          width: s.width,
          baseName,
          nameMode: s.nameMode,
          onProgress: setProgress,
          signal: ctl.signal,
        });
        downloadBlob(res.zip, `${baseName}-bulk.zip`);
        toast(
          res.failed.length
            ? `ZIP ready: ${res.files} codes, ${res.failed.length} skipped (too long) · ${formatBytes(res.zip.size)}`
            : `ZIP ready: ${res.files} codes · ${formatBytes(res.zip.size)}`,
          res.failed.length ? "info" : "success",
        );
      } catch (e) {
        if ((e as Error).name === "AbortError")
          toast("Bulk export cancelled", "info");
        else toast((e as Error).message || "Bulk export failed", "error");
      } finally {
        abortRef.current = null;
        setProgress(null);
      }
    },
    [ready, items, frameFor, s.format, s.width, s.nameMode, toast],
  );

  return {
    settings: s,
    set,
    setRandom,
    regenerate,
    parsedCount: parsed.length,
    removed:
      s.source === "list" && s.uniqueList ? parsed.length - values.length : 0,
    unique,
    items,
    error,
    ready,
    analysisFor,
    frameFor,
    progress,
    running: progress !== null,
    run,
    cancel,
  };
}

export type BulkApi = ReturnType<typeof useBulk>;
