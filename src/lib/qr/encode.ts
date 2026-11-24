import qrcode from "qrcode-generator";

// qrcode-generator defaults to Latin-1. Encode as UTF-8 so accents/emoji survive.
const utf8 = new TextEncoder();
qrcode.stringToBytes = (s: string) => Array.from(utf8.encode(s));

export type ECLevel = "L" | "M" | "Q" | "H";

export interface QRMatrix {
  /** Modules per side (without quiet zone). */
  size: number;
  version: number;
  ec: ECLevel;
  bytes: number;
  isDark(row: number, col: number): boolean;
}

/** Max payload in bytes for version 40 in byte mode. */
export const BYTE_CAPACITY: Record<ECLevel, number> = {
  L: 2953,
  M: 2331,
  Q: 1663,
  H: 1273,
};

export class QRTooLongError extends Error {
  constructor(
    public bytes: number,
    public ec: ECLevel,
  ) {
    super(
      `Content is too long for a QR code (${bytes} bytes, max ${BYTE_CAPACITY[ec]} at level ${ec}).`,
    );
  }
}

const cache = new Map<string, QRMatrix>();

export function encode(data: string, ec: ECLevel): QRMatrix {
  const key = ec + "\u0000" + data;
  const hit = cache.get(key);
  if (hit) return hit;

  const bytes = utf8.encode(data).length;
  if (bytes > BYTE_CAPACITY[ec]) throw new QRTooLongError(bytes, ec);

  const qr = qrcode(0, ec);
  qr.addData(data, "Byte");
  qr.make();

  const size = qr.getModuleCount();
  const grid = new Uint8Array(size * size);
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) grid[r * size + c] = qr.isDark(r, c) ? 1 : 0;

  const matrix: QRMatrix = {
    size,
    version: (size - 17) / 4,
    ec,
    bytes,
    isDark: (r, c) => grid[r * size + c] === 1,
  };

  if (cache.size > 64) cache.delete(cache.keys().next().value!);
  cache.set(key, matrix);
  return matrix;
}
