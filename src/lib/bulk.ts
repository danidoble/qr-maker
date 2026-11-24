import { compose } from "./compose";
import { resolveEC, type FrameStyle, type QRStyle } from "./design";
import { FORMATS, loadSVGImage, type ExportFormat } from "./export";
import { embeddedFontCSS } from "./fonts";
import { BYTE_CAPACITY } from "./qr/encode";
import { ZipWriter } from "./zip";

/**
 * Bulk generation runs entirely on the main thread (SVG → <img> → canvas isn't
 * available in workers everywhere), so it's capped to keep the tab responsive
 * and the ZIP within memory.
 */
export const MAX_BULK = 2000;
export const MAX_CODE_LENGTH = 256;

const utf8 = new TextEncoder();

// ── Random codes ────────────────────────────────────────────────────────────

export const CHARSETS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  digits: "0123456789",
} as const;
export const DEFAULT_SYMBOLS = "-_.~!*";
const AMBIGUOUS = new Set("0OoIl1|");

export interface RandomOptions {
  count: number;
  length: number;
  upper: boolean;
  lower: boolean;
  digits: boolean;
  symbols: boolean;
  symbolChars: string;
  noAmbiguous: boolean;
  prefix: string;
  suffix: string;
  unique: boolean;
}

export const DEFAULT_RANDOM: RandomOptions = {
  count: 100,
  length: 8,
  upper: true,
  lower: false,
  digits: true,
  symbols: false,
  symbolChars: DEFAULT_SYMBOLS,
  noAmbiguous: true,
  prefix: "",
  suffix: "",
  unique: true,
};

export function alphabet(o: RandomOptions): string[] {
  let s = "";
  if (o.upper) s += CHARSETS.upper;
  if (o.lower) s += CHARSETS.lower;
  if (o.digits) s += CHARSETS.digits;
  if (o.symbols) s += o.symbolChars;
  let chars = [...new Set([...s])].filter((c) => c.trim() !== "");
  if (o.noAmbiguous) chars = chars.filter((c) => !AMBIGUOUS.has(c));
  return chars;
}

/** How many distinct codes the options can produce (may be Infinity). */
export function combinations(o: RandomOptions): number {
  return Math.pow(alphabet(o).length, o.length);
}

function randomIndex(
  n: number,
  buf: Uint32Array<ArrayBuffer>,
  state: { i: number },
) {
  // Rejection sampling → no modulo bias.
  const limit = Math.floor(0x100000000 / n) * n;
  for (;;) {
    if (state.i >= buf.length) {
      crypto.getRandomValues(buf);
      state.i = 0;
    }
    const v = buf[state.i++];
    if (v < limit) return v % n;
  }
}

export interface RandomResult {
  codes: string[];
  error: string | null;
}

export function generateRandom(o: RandomOptions): RandomResult {
  const chars = alphabet(o);
  if (!chars.length)
    return { codes: [], error: "Pick at least one character set." };
  if (o.length < 1 || o.length > MAX_CODE_LENGTH)
    return { codes: [], error: `Length must be 1–${MAX_CODE_LENGTH}.` };
  if (o.count < 1 || o.count > MAX_BULK)
    return { codes: [], error: `Quantity must be 1–${MAX_BULK}.` };
  if (o.unique && combinations(o) < o.count)
    return {
      codes: [],
      error: `Only ${combinations(o).toLocaleString()} unique codes are possible with ${chars.length} characters × ${o.length}. Increase the length or add character sets.`,
    };

  const buf = new Uint32Array(new ArrayBuffer(4096));
  crypto.getRandomValues(buf);
  const state = { i: 0 };
  const seen = new Set<string>();
  const codes: string[] = [];
  let tries = 0;
  const maxTries = o.count * 200;
  while (codes.length < o.count) {
    if (++tries > maxTries)
      return {
        codes: [],
        error: "Couldn't find enough unique codes. Increase the length.",
      };
    let s = "";
    for (let k = 0; k < o.length; k++)
      s += chars[randomIndex(chars.length, buf, state)];
    const code = o.prefix + s + o.suffix;
    if (o.unique) {
      if (seen.has(code)) continue;
      seen.add(code);
    }
    codes.push(code);
  }
  return { codes, error: null };
}

// ── List input ──────────────────────────────────────────────────────────────

export type Separator = "lines" | "lines-commas";

export function parseList(text: string, sep: Separator): string[] {
  const re = sep === "lines" ? /\r?\n/ : /\r?\n|,/;
  return text
    .split(re)
    .map((s) => s.trim())
    .filter(Boolean);
}

// ── Analysis ────────────────────────────────────────────────────────────────

export interface Analysis {
  total: number;
  unique: number;
  /** value → occurrences, only for values that appear more than once. */
  duplicates: [string, number][];
  /** Values that don't fit in a QR at the design's error correction level. */
  tooLong: string[];
}

export function analyze(values: string[], qr: QRStyle): Analysis {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  const duplicates = [...counts].filter(([, n]) => n > 1);
  duplicates.sort((a, b) => b[1] - a[1]);
  const cap = BYTE_CAPACITY[resolveEC(qr)];
  const tooLong = [...counts.keys()].filter((v) => utf8.encode(v).length > cap);
  return { total: values.length, unique: counts.size, duplicates, tooLong };
}

export const dedupe = (values: string[]) => [...new Set(values)];

// ── Per-item frame text ─────────────────────────────────────────────────────

/**
 * What the frame says on every bulk code:
 * - design: the label/subtitle from the Frame step, unchanged
 * - value:  each code's own value (title or subtitle)
 * - none:   keep the frame, drop all text
 * - bare:   no frame at all, just the QR
 */
export type LabelMode = "design" | "value" | "none" | "bare";
export type LabelSlot = "label" | "sub";

export interface BulkItem {
  /** What gets encoded. */
  data: string;
  /** Short, human-readable version (random code without prefix/suffix, URL without scheme). */
  text: string;
}

export function displayText(value: string): string {
  return value
    .replace(/^[a-z][a-z0-9+.-]*:\/\/(www\.)?/i, "")
    .replace(/\/$/, "");
}

export function itemFrame(
  frame: FrameStyle,
  item: BulkItem,
  mode: LabelMode,
  slot: LabelSlot,
): FrameStyle {
  switch (mode) {
    case "design":
      return frame;
    case "none":
      return { ...frame, label: "", sub: "" };
    case "bare":
      return { ...frame, id: "none" };
    case "value":
      return { ...frame, [slot]: item.text };
  }
}

// ── Rendering ───────────────────────────────────────────────────────────────

export type NameMode = "index-value" | "index";

function safeName(s: string): string {
  return (
    s
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/^[a-z]+:\/\/(www\.)?/i, "")
      .replace(/[^A-Za-z0-9._-]+/g, "-")
      .replace(/^[-.]+|[-.]+$/g, "")
      .slice(0, 60) || "qr"
  );
}

function csvCell(s: string) {
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export interface BulkProgress {
  done: number;
  total: number;
  phase: "render" | "zip";
}

export interface BulkResult {
  zip: Blob;
  files: number;
  failed: { index: number; data: string; reason: string }[];
}

export async function renderBulk(opts: {
  items: BulkItem[];
  qr: QRStyle;
  frameFor: (item: BulkItem) => FrameStyle;
  format: ExportFormat;
  width: number;
  baseName: string;
  nameMode: NameMode;
  onProgress: (p: BulkProgress) => void;
  signal: AbortSignal;
}): Promise<BulkResult> {
  const { items, qr, frameFor, format, width, signal } = opts;
  const values = items.map((it) => it.data);
  if (!values.length) throw new Error("Nothing to generate.");
  if (values.length > MAX_BULK)
    throw new Error(`Max ${MAX_BULK} codes per batch.`);

  const fmt = FORMATS.find((f) => f.id === format)!;
  const pad = String(values.length).length;
  const base = safeName(opts.baseName) || "qr";
  const zip = new ZipWriter();
  const failed: BulkResult["failed"] = [];
  const manifest = ["index,file,data"];

  // Fonts are identical for every item → embed them once.
  const probe = compose(
    { data: values[0], qr, frame: frameFor(items[0]) },
    { idPrefix: "qrm" },
  );
  const css = probe.fonts.length ? await embeddedFontCSS(probe.fonts) : "";

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  let lastTick = 0;
  for (let i = 0; i < values.length; i++) {
    if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
    const data = values[i];
    const idx = String(i + 1).padStart(pad, "0");
    const name =
      opts.nameMode === "index"
        ? `${base}-${idx}.${fmt.ext}`
        : `${idx}-${safeName(data)}.${fmt.ext}`;

    const c = compose(
      { data, qr, frame: frameFor(items[i]) },
      { idPrefix: "qrm", css },
    );
    if (c.error || !c.matrix) {
      failed.push({ index: i + 1, data, reason: c.error ?? "Can't encode" });
      manifest.push(`${i + 1},,${csvCell(data)}`);
      continue;
    }

    let blob: Blob;
    if (format === "svg") {
      blob = new Blob([c.svg], { type: fmt.mime });
    } else {
      const W = Math.round(width);
      const H = Math.round((c.height / c.width) * width);
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W;
        canvas.height = H;
      }
      ctx.clearRect(0, 0, W, H);
      if (format === "jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, W, H);
      }
      ctx.imageSmoothingQuality = "high";
      const img = await loadSVGImage(c.svg);
      ctx.drawImage(img, 0, 0, W, H);
      blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Export failed"))),
          fmt.mime,
          0.95,
        ),
      );
    }

    await zip.add(name, blob);
    manifest.push(`${i + 1},${csvCell(name)},${csvCell(data)}`);

    const now = performance.now();
    if (now - lastTick > 80 || i === values.length - 1) {
      lastTick = now;
      opts.onProgress({ done: i + 1, total: values.length, phase: "render" });
      // Let React paint & the user hit Cancel.
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  opts.onProgress({ done: values.length, total: values.length, phase: "zip" });
  // BOM so Excel opens UTF-8 correctly.
  await zip.add("manifest.csv", "﻿" + manifest.join("\r\n") + "\r\n");
  return { zip: zip.finish(), files: values.length - failed.length, failed };
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}
