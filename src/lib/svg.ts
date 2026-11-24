/**
 * Tiny SVG string helpers. Everything the app renders (preview, thumbnails,
 * exports) goes through plain strings, so the preview is pixel-identical to
 * what gets downloaded.
 */

/** Round to 3 decimals to keep path strings short. */
export const n = (v: number) => Math.round(v * 1000) / 1000;

export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export type Radii = number | [tl: number, tr: number, br: number, bl: number];

/** Rounded rectangle path with independent corner radii. */
export function rrect(
  x: number,
  y: number,
  w: number,
  h: number,
  r: Radii = 0,
): string {
  const max = Math.min(w, h) / 2;
  const [tl, tr, br, bl] = (typeof r === "number" ? [r, r, r, r] : r).map((v) =>
    Math.max(0, Math.min(v, max)),
  );
  let d = `M${n(x + tl)} ${n(y)}H${n(x + w - tr)}`;
  if (tr) d += `A${n(tr)} ${n(tr)} 0 0 1 ${n(x + w)} ${n(y + tr)}`;
  d += `V${n(y + h - br)}`;
  if (br) d += `A${n(br)} ${n(br)} 0 0 1 ${n(x + w - br)} ${n(y + h)}`;
  d += `H${n(x + bl)}`;
  if (bl) d += `A${n(bl)} ${n(bl)} 0 0 1 ${n(x)} ${n(y + h - bl)}`;
  d += `V${n(y + tl)}`;
  if (tl) d += `A${n(tl)} ${n(tl)} 0 0 1 ${n(x + tl)} ${n(y)}`;
  return d + "Z";
}

export function circle(cx: number, cy: number, r: number): string {
  return `M${n(cx - r)} ${n(cy)}a${n(r)} ${n(r)} 0 1 0 ${n(2 * r)} 0a${n(r)} ${n(r)} 0 1 0 ${n(-2 * r)} 0Z`;
}

/** Rectangle with 45° cut corners. */
export function chamfer(
  x: number,
  y: number,
  w: number,
  h: number,
  c: number,
): string {
  return (
    `M${n(x + c)} ${n(y)}H${n(x + w - c)}L${n(x + w)} ${n(y + c)}V${n(y + h - c)}` +
    `L${n(x + w - c)} ${n(y + h)}H${n(x + c)}L${n(x)} ${n(y + h - c)}V${n(y + c)}Z`
  );
}

export function diamond(cx: number, cy: number, r: number): string {
  return `M${n(cx)} ${n(cy - r)}L${n(cx + r)} ${n(cy)}L${n(cx)} ${n(cy + r)}L${n(cx - r)} ${n(cy)}Z`;
}

/** Four-point sparkle, handy for decorative doodles. */
export function sparkle(cx: number, cy: number, r: number): string {
  const k = r * 0.22;
  return (
    `M${n(cx)} ${n(cy - r)}Q${n(cx + k)} ${n(cy - k)} ${n(cx + r)} ${n(cy)}` +
    `Q${n(cx + k)} ${n(cy + k)} ${n(cx)} ${n(cy + r)}Q${n(cx - k)} ${n(cy + k)} ${n(cx - r)} ${n(cy)}` +
    `Q${n(cx - k)} ${n(cy - k)} ${n(cx)} ${n(cy - r)}Z`
  );
}

export function attrs(
  a: Record<string, string | number | undefined | null | false>,
): string {
  return Object.entries(a)
    .filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => `${k}="${typeof v === "number" ? n(v) : esc(String(v))}"`)
    .join(" ");
}
