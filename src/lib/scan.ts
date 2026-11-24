import { compose, type ComposeInput } from "./compose";
import { loadSVGImage } from "./export";

export type ScanStatus = "idle" | "checking" | "ok" | "mismatch" | "fail";

/**
 * Renders the QR to pixels and decodes it with jsQR — a real round-trip, not a
 * guess. jsQR is stricter than phone cameras, so "fail" means "risky", not
 * "broken".
 */
export async function verifyScan(
  input: ComposeInput,
  expected: string,
): Promise<Exclude<ScanStatus, "idle" | "checking">> {
  const { default: jsQR } = await import("jsqr");
  const c = compose(input, { idPrefix: "scan", bare: true });
  if (!c.matrix) return "fail";

  const size = 720;
  const pad = 48;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size + pad * 2;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

  // What will realistically sit behind the code.
  const paper =
    input.frame.id !== "none" && input.frame.paper !== "none"
      ? input.frame.paper
      : "#ffffff";
  ctx.fillStyle = input.qr.bgTransparent ? paper : input.qr.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const img = await loadSVGImage(c.svg);
  const bg = ctx.fillStyle;
  const modulePx = size / (c.matrix.size + 2 * input.qr.margin);

  // 1st try: crisp pixels. 2nd/3rd: soften like a phone camera does, which
  // merges dot-style modules the way real optics do.
  for (const blur of [0, modulePx * 0.18, modulePx * 0.3]) {
    ctx.filter = "none";
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.filter = blur ? `blur(${blur.toFixed(1)}px)` : "none";
    ctx.drawImage(img, pad, pad, size, size);
    const { data, width, height } = ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height,
    );
    const res = jsQR(data, width, height, { inversionAttempts: "attemptBoth" });
    if (res) return res.data === expected ? "ok" : "mismatch";
  }
  return "fail";
}
