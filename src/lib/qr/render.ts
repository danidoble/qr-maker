import type {
  DotStyle,
  EyeBallStyle,
  EyeFrameStyle,
  Fill,
  QRStyle,
} from "../design";
import { ICONS } from "../icons";
import {
  attrs,
  chamfer,
  circle,
  diamond,
  n as num,
  rrect,
  type Radii,
} from "../svg";
import type { QRMatrix } from "./encode";

type Corner = "tl" | "tr" | "br" | "bl";

export interface RenderedQR {
  /** Side of the square viewBox, in modules (includes quiet zone). */
  units: number;
  /** Inner SVG markup (defs + shapes) in module units. */
  markup: string;
}

/** Radii where every corner is `r` except the one facing the QR center. */
function leaf(
  r: number,
  small: number,
  facing: Corner,
): [number, number, number, number] {
  const order: Corner[] = ["tl", "tr", "br", "bl"];
  return order.map((c) => (c === facing ? small : r)) as [
    number,
    number,
    number,
    number,
  ];
}

/** Alignment pattern centers per version (ISO/IEC 18004 Annex E). */
const ALIGN: number[][] = [
  [],
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
  [6, 30, 54],
  [6, 32, 58],
  [6, 34, 62],
  [6, 26, 46, 66],
  [6, 26, 48, 70],
  [6, 26, 50, 74],
  [6, 30, 54, 78],
  [6, 30, 56, 82],
  [6, 30, 58, 86],
  [6, 34, 62, 90],
  [6, 28, 50, 72, 94],
  [6, 26, 50, 74, 98],
  [6, 30, 54, 78, 102],
  [6, 28, 54, 80, 106],
  [6, 32, 58, 84, 110],
  [6, 30, 58, 86, 114],
  [6, 34, 62, 90, 118],
  [6, 26, 50, 74, 98, 122],
  [6, 30, 54, 78, 102, 126],
  [6, 26, 52, 78, 104, 130],
  [6, 30, 56, 82, 108, 134],
  [6, 34, 60, 86, 112, 138],
  [6, 30, 58, 86, 114, 142],
  [6, 34, 62, 90, 118, 146],
  [6, 30, 54, 78, 102, 126, 150],
  [6, 24, 50, 76, 102, 128, 154],
  [6, 28, 54, 80, 106, 132, 158],
  [6, 32, 58, 84, 110, 136, 162],
  [6, 26, 54, 82, 110, 138, 166],
  [6, 30, 58, 86, 114, 142, 170],
];

/** Centers of alignment patterns that don't overlap the finder patterns. */
export function alignmentCenters(
  version: number,
  n: number,
): [number, number][] {
  const pos = ALIGN[version] ?? [];
  const out: [number, number][] = [];
  for (const r of pos)
    for (const c of pos) {
      if ((r < 9 && c < 9) || (r < 9 && c > n - 10) || (r > n - 10 && c < 9))
        continue;
      out.push([r, c]);
    }
  return out;
}

/** 5×5 alignment pattern drawn as one solid shape, styled after the eyes. */
function alignmentPath(style: EyeBallStyle, x: number, y: number): string {
  const round =
    style === "square" || style === "cut" || style === "diamond" ? 0 : 1;
  return (
    rrect(x, y, 5, 5, round ? 1.4 : 0) +
    rrect(x + 1, y + 1, 3, 3, round ? 0.7 : 0) +
    (round ? circle(x + 2.5, y + 2.5, 0.55) : rrect(x + 2, y + 2, 1, 1, 0))
  );
}

export function eyeFramePath(
  style: EyeFrameStyle,
  x: number,
  y: number,
  facing: Corner = "br",
): string {
  switch (style) {
    case "square":
      return rrect(x, y, 7, 7, 0) + rrect(x + 1, y + 1, 5, 5, 0);
    case "soft":
      return rrect(x, y, 7, 7, 1.3) + rrect(x + 1, y + 1, 5, 5, 0.6);
    case "rounded":
      return rrect(x, y, 7, 7, 2.6) + rrect(x + 1, y + 1, 5, 5, 1.7);
    case "circle":
      return circle(x + 3.5, y + 3.5, 3.5) + circle(x + 3.5, y + 3.5, 2.5);
    case "leaf":
      return (
        rrect(x, y, 7, 7, leaf(3.2, 0.5, facing)) +
        rrect(x + 1, y + 1, 5, 5, leaf(2.2, 0.2, facing))
      );
    case "cut":
      return chamfer(x, y, 7, 7, 2) + chamfer(x + 1, y + 1, 5, 5, 1.4);
  }
}

export function eyeBallPath(
  style: EyeBallStyle,
  x: number,
  y: number,
  facing: Corner = "br",
): string {
  const bx = x + 2;
  const by = y + 2;
  switch (style) {
    case "square":
      return rrect(bx, by, 3, 3, 0);
    case "rounded":
      return rrect(bx, by, 3, 3, 0.9);
    case "circle":
      return circle(x + 3.5, y + 3.5, 1.5);
    case "leaf":
      return rrect(bx, by, 3, 3, leaf(1.5, 0.15, facing));
    case "diamond":
      return diamond(x + 3.5, y + 3.5, 1.9);
    case "cut":
      return chamfer(bx, by, 3, 3, 0.9);
  }
}

/** Path for a single data module, given which neighbours are dark. */
export function modulePath(
  style: Exclude<DotStyle, "bars-v" | "bars-h">,
  x: number,
  y: number,
  nb: { t: boolean; r: boolean; b: boolean; l: boolean },
): string {
  switch (style) {
    case "square":
      return `M${x} ${y}h1v1h-1z`;
    case "dots":
      return circle(x + 0.5, y + 0.5, 0.46);
    case "tiny":
      return circle(x + 0.5, y + 0.5, 0.32);
    case "diamond":
      return `M${num(x + 0.5)} ${num(y - 0.06)}L${num(x + 1.06)} ${num(y + 0.5)}L${num(x + 0.5)} ${num(y + 1.06)}L${num(x - 0.06)} ${num(y + 0.5)}Z`;
    case "plus": {
      const a = 0.3;
      const b = 0.7;
      return (
        `M${num(x + a)} ${y}H${num(x + b)}V${num(y + a)}H${x + 1}V${num(y + b)}H${num(x + b)}V${y + 1}` +
        `H${num(x + a)}V${num(y + b)}H${x}V${num(y + a)}H${num(x + a)}Z`
      );
    }
    case "rounded":
    case "soft":
    case "classy": {
      const R = style === "soft" ? 0.3 : 0.5;
      const radii: Radii = [
        !nb.t && !nb.l ? R : 0,
        style === "classy" ? 0 : !nb.t && !nb.r ? R : 0,
        !nb.b && !nb.r ? R : 0,
        style === "classy" ? 0 : !nb.b && !nb.l ? R : 0,
      ];
      return rrect(x, y, 1, 1, radii);
    }
  }
}

/** One path for all data modules. `on(r, c)` says whether a module is drawn. */
export function modulesPath(
  on: (r: number, c: number) => boolean,
  n: number,
  style: DotStyle,
  M = 0,
): string {
  let d = "";
  if (style === "bars-v" || style === "bars-h") {
    const vertical = style === "bars-v";
    const w = 0.78;
    for (let a = 0; a < n; a++) {
      let start = -1;
      for (let b = 0; b <= n; b++) {
        const dark = b < n && (vertical ? on(b, a) : on(a, b));
        if (dark && start < 0) start = b;
        if (!dark && start >= 0) {
          const len = b - start;
          d += vertical
            ? rrect(M + a + (1 - w) / 2, M + start + 0.06, w, len - 0.12, w / 2)
            : rrect(
                M + start + 0.06,
                M + a + (1 - w) / 2,
                len - 0.12,
                w,
                w / 2,
              );
          start = -1;
        }
      }
    }
    return d;
  }
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!on(r, c)) continue;
      d += modulePath(style, M + c, M + r, {
        t: on(r - 1, c),
        r: on(r, c + 1),
        b: on(r + 1, c),
        l: on(r, c - 1),
      });
    }
  }
  return d;
}

function paint(
  fill: Fill,
  id: string,
  N: number,
): { def: string; ref: string } {
  if (fill.kind === "solid") return { def: "", ref: fill.a };
  const stops = `<stop offset="0" stop-color="${fill.a}"/><stop offset="1" stop-color="${fill.b}"/>`;
  if (fill.kind === "radial") {
    return {
      def: `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" ${attrs({ cx: N / 2, cy: N / 2, r: N * 0.72 })}>${stops}</radialGradient>`,
      ref: `url(#${id})`,
    };
  }
  // CSS semantics: 0deg points up, 90deg points right.
  const rad = (fill.angle * Math.PI) / 180;
  const dx = (Math.sin(rad) * N) / 2;
  const dy = (-Math.cos(rad) * N) / 2;
  return {
    def: `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" ${attrs({
      x1: N / 2 - dx,
      y1: N / 2 - dy,
      x2: N / 2 + dx,
      y2: N / 2 + dy,
    })}>${stops}</linearGradient>`,
    ref: `url(#${id})`,
  };
}

export function renderQR(m: QRMatrix, s: QRStyle, idp: string): RenderedQR {
  const n = m.size;
  const M = Math.max(0, Math.round(s.margin));
  const N = n + 2 * M;

  const inEye = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);

  // ── Logo footprint (modules hidden behind the logo) ──
  let hidden: (r: number, c: number) => boolean = () => false;
  let logoMarkup = "";
  const defs: string[] = [];
  const fg = paint(s.fill, `${idp}-fill`, N);
  if (fg.def) defs.push(fg.def);

  if (s.logo && (s.logo.kind === "icon" ? s.logo.icon : s.logo.src)) {
    const logo = s.logo;
    const L = n * Math.min(0.34, Math.max(0.1, logo.size));
    const pad = logo.plate === "none" ? 0.5 : Math.max(0.8, L * 0.12);
    const P = L + pad * 2;
    const half = P / 2;
    const center = n / 2;
    hidden =
      logo.plate === "circle"
        ? (r, c) => Math.hypot(c + 0.5 - center, r + 0.5 - center) < half + 0.35
        : (r, c) =>
            Math.abs(c + 0.5 - center) < half + 0.35 &&
            Math.abs(r + 0.5 - center) < half + 0.35;

    const px = M + center - half;
    const ix = M + center - L / 2;
    if (logo.plate !== "none") {
      const d =
        logo.plate === "circle"
          ? circle(M + center, M + center, half)
          : rrect(px, px, P, P, logo.plate === "rounded" ? P * 0.24 : P * 0.06);
      logoMarkup += `<path d="${d}" fill="${logo.plateColor}"/>`;
    }

    if (logo.kind === "image" && logo.src) {
      const clipId = `${idp}-logo-clip`;
      const round = logo.plate === "circle";
      if (round)
        defs.push(
          `<clipPath id="${clipId}"><path d="${circle(M + center, M + center, L / 2)}"/></clipPath>`,
        );
      logoMarkup += `<image ${attrs({
        href: logo.src,
        x: ix,
        y: ix,
        width: L,
        height: L,
        preserveAspectRatio: round ? "xMidYMid slice" : "xMidYMid meet",
        "clip-path": round ? `url(#${clipId})` : undefined,
      })}/>`;
    } else if (logo.kind === "icon" && logo.icon) {
      const inner = logo.plate === "circle" ? L * 0.78 : L;
      const ox = M + center - inner / 2;
      const k = inner / 24;
      logoMarkup +=
        `<g transform="translate(${num(ox)} ${num(ox)}) scale(${num(k)})">` +
        `<path d="${ICONS[logo.icon]}" fill="none" stroke="${logo.color ?? fg.ref}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></g>`;
    }
  }

  // Alignment patterns are drawn as solid shapes: decoders rely on their 1:1:1 ratio.
  const aligns = alignmentCenters(m.version, n).filter(
    ([r, c]) => !hidden(r, c),
  );
  const inAlign = (r: number, c: number) =>
    aligns.some(([ar, ac]) => Math.abs(r - ar) <= 2 && Math.abs(c - ac) <= 2);

  const on = (r: number, c: number) =>
    r >= 0 &&
    c >= 0 &&
    r < n &&
    c < n &&
    m.isDark(r, c) &&
    !inEye(r, c) &&
    !inAlign(r, c) &&
    !hidden(r, c);

  const dots = modulesPath(on, n, s.dot, M);

  // ── Finder patterns ──
  const eyes: [number, number, Corner][] = [
    [M, M, "br"],
    [M + n - 7, M, "bl"],
    [M, M + n - 7, "tr"],
  ];
  const frames = eyes
    .map(([x, y, f]) => eyeFramePath(s.eyeFrame, x, y, f))
    .join("");
  const balls = eyes
    .map(([x, y, f]) => eyeBallPath(s.eyeBall, x, y, f))
    .join("");
  const alignD = aligns
    .map(([r, c]) => alignmentPath(s.eyeBall, M + c - 2, M + r - 2))
    .join("");

  const bg = s.bgTransparent
    ? ""
    : `<path d="${rrect(0, 0, N, N, N * Math.min(0.2, Math.max(0, s.radius)))}" fill="${s.bg}"/>`;

  const markup =
    (defs.length ? `<defs>${defs.join("")}</defs>` : "") +
    bg +
    `<path d="${dots}" fill="${fg.ref}"/>` +
    `<path d="${frames}" fill-rule="evenodd" fill="${s.eyeFrameColor ?? fg.ref}"/>` +
    `<path d="${balls}" fill="${s.eyeBallColor ?? fg.ref}"/>` +
    (alignD
      ? `<path d="${alignD}" fill-rule="evenodd" fill="${s.eyeFrameColor ?? fg.ref}"/>`
      : "") +
    logoMarkup;

  return { units: N, markup };
}
