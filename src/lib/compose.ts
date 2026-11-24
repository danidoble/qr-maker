import {
  resolveEC,
  type FontId,
  type FrameStyle,
  type QRStyle,
} from "./design";
import { buildFrame } from "./frames";
import { encode, QRTooLongError, type QRMatrix } from "./qr/encode";
import { renderQR } from "./qr/render";

/** QR side length inside a composition, in SVG units. */
export const QR_UNITS = 1000;

export interface ComposeInput {
  data: string;
  qr: QRStyle;
  frame: FrameStyle;
}

export interface Composition {
  svg: string;
  width: number;
  height: number;
  matrix: QRMatrix | null;
  error: string | null;
  fonts: FontId[];
}

export interface ComposeOptions {
  /** Prefix for every id inside the SVG (inline SVGs share a namespace). */
  idPrefix: string;
  /** Extra CSS injected in <defs> (embedded @font-face for exports). */
  css?: string;
  /** Skip the frame entirely (used for scan checks). */
  bare?: boolean;
}

/** Design → one standalone SVG document. Used by preview, thumbnails and every export. */
export function compose(
  { data, qr, frame }: ComposeInput,
  opts: ComposeOptions,
): Composition {
  const ec = resolveEC(qr);
  let matrix: QRMatrix | null = null;
  let error: string | null = null;
  try {
    matrix = encode(data, ec);
  } catch (e) {
    error =
      e instanceof QRTooLongError
        ? e.message
        : "This content can't be encoded.";
  }

  const layout = opts.bare ? null : buildFrame(frame, QR_UNITS, opts.idPrefix);
  const W = layout?.width ?? QR_UNITS;
  const H = layout?.height ?? QR_UNITS;
  const qx = layout?.qrX ?? 0;
  const qy = layout?.qrY ?? 0;

  let qrSvg = "";
  if (matrix) {
    const r = renderQR(matrix, qr, opts.idPrefix);
    qrSvg = `<svg x="${qx}" y="${qy}" width="${QR_UNITS}" height="${QR_UNITS}" viewBox="0 0 ${r.units} ${r.units}" overflow="visible">${r.markup}</svg>`;
  }

  const defs =
    (opts.css ? `<style>${opts.css}</style>` : "") + (layout?.defs ?? "");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
    (defs ? `<defs>${defs}</defs>` : "") +
    (layout?.back ?? "") +
    qrSvg +
    (layout?.front ?? "") +
    `</svg>`;

  return {
    svg,
    width: W,
    height: H,
    matrix,
    error,
    fonts: layout?.fonts ?? [],
  };
}
