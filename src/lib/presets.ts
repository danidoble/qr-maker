import { contrast } from "./color";
import type {
  DotStyle,
  EyeBallStyle,
  EyeFrameStyle,
  Fill,
  QRStyle,
} from "./design";

export interface Preset {
  id: string;
  name: string;
  qr: Partial<QRStyle>;
}

const solid = (a: string): Fill => ({ kind: "solid", a, b: a, angle: 135 });
const linear = (a: string, b: string, angle = 135): Fill => ({
  kind: "linear",
  a,
  b,
  angle,
});
const radial = (a: string, b: string): Fill => ({
  kind: "radial",
  a,
  b,
  angle: 0,
});

/** Only the visual bits; content, logo and margin are left untouched. */
export const PRESETS: Preset[] = [
  {
    id: "classic",
    name: "Classic",
    qr: {
      dot: "square",
      eyeFrame: "square",
      eyeBall: "square",
      fill: solid("#000000"),
      bg: "#ffffff",
      radius: 0,
      eyeFrameColor: null,
      eyeBallColor: null,
    },
  },
  {
    id: "ink",
    name: "Ink",
    qr: {
      dot: "rounded",
      eyeFrame: "rounded",
      eyeBall: "rounded",
      fill: solid("#15151b"),
      bg: "#ffffff",
      radius: 0.06,
      eyeFrameColor: null,
      eyeBallColor: null,
    },
  },
  {
    id: "violet",
    name: "Violet",
    qr: {
      dot: "dots",
      eyeFrame: "circle",
      eyeBall: "circle",
      fill: linear("#3b1fd1", "#a23bff"),
      bg: "#ffffff",
      radius: 0.08,
      eyeFrameColor: null,
      eyeBallColor: null,
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    qr: {
      dot: "soft",
      eyeFrame: "leaf",
      eyeBall: "leaf",
      fill: linear("#e8381b", "#c2185b", 160),
      bg: "#fff8f1",
      radius: 0.08,
      eyeFrameColor: null,
      eyeBallColor: null,
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    qr: {
      dot: "classy",
      eyeFrame: "rounded",
      eyeBall: "rounded",
      fill: radial("#0b3d6b", "#0a7d8c"),
      bg: "#f2fbff",
      radius: 0.06,
      eyeFrameColor: null,
      eyeBallColor: null,
    },
  },
  {
    id: "forest",
    name: "Forest",
    qr: {
      dot: "dots",
      eyeFrame: "circle",
      eyeBall: "circle",
      fill: solid("#1f4d3a"),
      bg: "#f4f8ef",
      radius: 0.06,
      eyeFrameColor: "#2f6b4f",
      eyeBallColor: "#4d7c0f",
    },
  },
  {
    id: "candy",
    name: "Candy",
    qr: {
      dot: "tiny",
      eyeFrame: "circle",
      eyeBall: "circle",
      fill: linear("#6a11cb", "#e1306c", 90),
      bg: "#ffffff",
      radius: 0.1,
      eyeFrameColor: null,
      eyeBallColor: null,
    },
  },
  {
    id: "blueprint",
    name: "Blueprint",
    qr: {
      dot: "diamond",
      eyeFrame: "cut",
      eyeBall: "diamond",
      fill: solid("#0b3d91"),
      bg: "#eef3ff",
      radius: 0.03,
      eyeFrameColor: null,
      eyeBallColor: null,
    },
  },
  {
    id: "gold",
    name: "Gold",
    qr: {
      dot: "classy",
      eyeFrame: "leaf",
      eyeBall: "leaf",
      fill: linear("#6b4e0f", "#b8901f", 120),
      bg: "#fffaf0",
      radius: 0.06,
      eyeFrameColor: null,
      eyeBallColor: null,
    },
  },
  {
    id: "barcode",
    name: "Barcode",
    qr: {
      dot: "bars-v",
      eyeFrame: "soft",
      eyeBall: "rounded",
      fill: solid("#111114"),
      bg: "#ffffff",
      radius: 0.04,
      eyeFrameColor: null,
      eyeBallColor: null,
    },
  },
  {
    id: "lattice",
    name: "Lattice",
    qr: {
      dot: "plus",
      eyeFrame: "square",
      eyeBall: "square",
      fill: solid("#22223b"),
      bg: "#f6f5ee",
      radius: 0.04,
      eyeFrameColor: null,
      eyeBallColor: "#e85d04",
    },
  },
  {
    id: "mint",
    name: "Mint",
    qr: {
      dot: "soft",
      eyeFrame: "rounded",
      eyeBall: "rounded",
      fill: solid("#0f766e"),
      bg: "#effcf8",
      radius: 0.08,
      eyeFrameColor: null,
      eyeBallColor: "#14b8a6",
    },
  },
  {
    id: "ruby",
    name: "Ruby",
    qr: {
      dot: "dots",
      eyeFrame: "circle",
      eyeBall: "circle",
      fill: radial("#7f0a1f", "#c1121f"),
      bg: "#fff7f7",
      radius: 0.08,
      eyeFrameColor: null,
      eyeBallColor: null,
    },
  },
  {
    id: "grape",
    name: "Grape",
    qr: {
      dot: "classy",
      eyeFrame: "cut",
      eyeBall: "cut",
      fill: linear("#3c096c", "#7b2cbf", 45),
      bg: "#faf5ff",
      radius: 0.04,
      eyeFrameColor: null,
      eyeBallColor: null,
    },
  },
  {
    id: "neon",
    name: "Neon",
    qr: {
      dot: "rounded",
      eyeFrame: "rounded",
      eyeBall: "circle",
      fill: linear("#00f5d4", "#9b5de5", 135),
      bg: "#0d0d14",
      radius: 0.08,
      eyeFrameColor: null,
      eyeBallColor: null,
    },
  },
];

// Curated so "Surprise me" never produces something that fails the scan check.
const DOTS: DotStyle[] = [
  "rounded",
  "soft",
  "dots",
  "classy",
  "square",
  "bars-v",
];
const EYES: [EyeFrameStyle, EyeBallStyle][] = [
  ["square", "square"],
  ["soft", "rounded"],
  ["rounded", "rounded"],
  ["circle", "circle"],
  ["leaf", "leaf"],
  ["cut", "cut"],
  ["soft", "leaf"],
  ["circle", "cut"],
];
const INKS = [
  "#15151b",
  "#3b1fd1",
  "#b5179e",
  "#0b5cad",
  "#1f4d3a",
  "#c0392b",
  "#6b4e0f",
  "#5f0f40",
  "#0a7d8c",
  "#7b2cbf",
  "#d1495b",
  "#2b2d42",
];
const PAPERS = [
  "#ffffff",
  "#fffaf0",
  "#f4f8ef",
  "#f2f8ff",
  "#fff5f7",
  "#f6f5ee",
];

const pick = <T>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];

/** A random, still-scannable style. */
export function surprise(): Partial<QRStyle> {
  const bg = pick(PAPERS);
  const inks = INKS.filter((c) => contrast(c, bg) >= 5);
  const a = pick(inks);
  const b = pick(inks);
  const kind = pick(["solid", "solid", "linear", "radial"] as const);
  const eye = pick(EYES);
  return {
    dot: pick(DOTS),
    eyeFrame: eye[0],
    eyeBall: eye[1],
    fill: {
      kind,
      a,
      b: kind === "solid" ? a : b === a ? pick(inks) : b,
      angle: Math.round(Math.random() * 8) * 45,
    },
    bg,
    bgTransparent: false,
    radius: pick([0, 0.04, 0.08, 0.12]),
    eyeFrameColor: null,
    eyeBallColor: Math.random() < 0.3 ? pick(inks) : null,
  };
}
