import { compose, type ComposeInput } from "./compose";
import { embeddedFontCSS } from "./fonts";

export type ExportFormat = "png" | "svg" | "webp" | "jpeg";

export const FORMATS: {
  id: ExportFormat;
  label: string;
  note: string;
  mime: string;
  ext: string;
}[] = [
  {
    id: "png",
    label: "PNG",
    note: "Best for most uses",
    mime: "image/png",
    ext: "png",
  },
  {
    id: "svg",
    label: "SVG",
    note: "Vector · print & design",
    mime: "image/svg+xml",
    ext: "svg",
  },
  {
    id: "webp",
    label: "WebP",
    note: "Smallest file for web",
    mime: "image/webp",
    ext: "webp",
  },
  {
    id: "jpeg",
    label: "JPG",
    note: "No transparency",
    mime: "image/jpeg",
    ext: "jpg",
  },
];

export interface ExportResult {
  blob: Blob;
  width: number;
  height: number;
  ext: string;
}

/** Full SVG with fonts inlined, so it renders the same anywhere. */
export async function standaloneSVG(
  input: ComposeInput,
): Promise<{ svg: string; width: number; height: number }> {
  const probe = compose(input, { idPrefix: "qrm" });
  const css = probe.fonts.length ? await embeddedFontCSS(probe.fonts) : "";
  const c = css ? compose(input, { idPrefix: "qrm", css }) : probe;
  return { svg: c.svg, width: c.width, height: c.height };
}

export function loadSVGImage(svg: string): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        await img.decode();
      } catch {
        /* decode() is best-effort */
      }
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not render the SVG"));
    };
    img.src = url;
  });
}

export async function renderExport(
  input: ComposeInput,
  format: ExportFormat,
  width: number,
): Promise<ExportResult> {
  const { svg, width: w0, height: h0 } = await standaloneSVG(input);
  const fmt = FORMATS.find((f) => f.id === format)!;

  if (format === "svg") {
    return {
      blob: new Blob([svg], { type: fmt.mime }),
      width: w0,
      height: h0,
      ext: fmt.ext,
    };
  }

  const scale = width / w0;
  const W = Math.round(w0 * scale);
  const H = Math.round(h0 * scale);
  const img = await loadSVGImage(svg);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  if (format === "jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, W, H);

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Export failed"))),
      fmt.mime,
      0.95,
    ),
  );
  return { blob, width: W, height: H, ext: fmt.ext };
}

export function downloadBlob(blob: Blob, filename: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export async function copyPNG(
  input: ComposeInput,
  width = 1024,
): Promise<void> {
  if (!("ClipboardItem" in window) || !navigator.clipboard?.write)
    throw new Error("Clipboard images aren't supported in this browser");
  // Safari requires the ClipboardItem to be created synchronously inside the gesture.
  const blob = renderExport(input, "png", width).then((r) => r.blob);
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}

export function canShareFiles(): boolean {
  try {
    return (
      typeof navigator !== "undefined" &&
      !!navigator.canShare?.({
        files: [new File([""], "x.png", { type: "image/png" })],
      })
    );
  } catch {
    return false;
  }
}

export async function sharePNG(
  input: ComposeInput,
  filename: string,
  width = 1024,
) {
  const { blob } = await renderExport(input, "png", width);
  const file = new File([blob], `${filename}.png`, { type: "image/png" });
  await navigator.share({ files: [file], title: "QR code" });
}
