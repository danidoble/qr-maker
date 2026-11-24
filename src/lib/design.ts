import type { ECLevel } from "./qr/encode";
import type { IconName } from "./icons";
import type { ContentType } from "./content";

// ── QR style ─────────────────────────────────────────────────────────────────

export type DotStyle =
  | "square"
  | "rounded"
  | "soft"
  | "dots"
  | "tiny"
  | "classy"
  | "diamond"
  | "plus"
  | "bars-v"
  | "bars-h";

export type EyeFrameStyle =
  | "square"
  | "soft"
  | "rounded"
  | "circle"
  | "leaf"
  | "cut";
export type EyeBallStyle =
  | "square"
  | "rounded"
  | "circle"
  | "leaf"
  | "diamond"
  | "cut";

export interface Fill {
  kind: "solid" | "linear" | "radial";
  a: string;
  b: string;
  /** Degrees, linear only. */
  angle: number;
}

export type PlateShape = "none" | "square" | "rounded" | "circle";

export interface Logo {
  kind: "icon" | "image";
  icon?: IconName;
  /** data: URL for uploaded images. */
  src?: string;
  /** Fraction of the QR width (0.12–0.32). */
  size: number;
  plate: PlateShape;
  plateColor: string;
  /** Icon stroke color; null = follow the QR color. */
  color: string | null;
}

export interface QRStyle {
  dot: DotStyle;
  eyeFrame: EyeFrameStyle;
  eyeBall: EyeBallStyle;
  fill: Fill;
  /** null = same as the dots. */
  eyeFrameColor: string | null;
  eyeBallColor: string | null;
  bg: string;
  bgTransparent: boolean;
  /** Quiet zone, in modules. */
  margin: number;
  /** Background corner radius as a fraction of the size (0–0.2). */
  radius: number;
  ec: "auto" | ECLevel;
  logo: Logo | null;
}

// ── Frame ────────────────────────────────────────────────────────────────────

export type FrameId =
  | "none"
  | "card"
  | "button"
  | "bubble"
  | "ticket"
  | "polaroid"
  | "phone"
  | "viewfinder"
  | "seal"
  | "ribbon"
  | "stamp"
  | "tag"
  | "doodle"
  | "aura"
  | "editorial"
  | "browser";

export type FontId = "display" | "sans" | "grotesk" | "mono" | "serif" | "hand";

export interface FrameStyle {
  id: FrameId;
  label: string;
  sub: string;
  font: FontId;
  /** Main frame color. */
  color: string;
  /** Secondary color (gradients, doodles). */
  accent: string;
  /** Paper / background. "none" = transparent. */
  paper: string;
  /** Text drawn on the paper. Text on `color` picks black/white automatically. */
  ink: string;
}

// ── Whole design ─────────────────────────────────────────────────────────────

export interface ContentState {
  type: ContentType;
  fields: Record<string, string>;
}

export interface Design {
  content: ContentState;
  qr: QRStyle;
  frame: FrameStyle;
}

export const DEFAULT_QR: QRStyle = {
  dot: "rounded",
  eyeFrame: "rounded",
  eyeBall: "rounded",
  fill: { kind: "solid", a: "#15151b", b: "#6d5dfc", angle: 135 },
  eyeFrameColor: null,
  eyeBallColor: null,
  bg: "#ffffff",
  bgTransparent: false,
  margin: 2,
  radius: 0.06,
  ec: "auto",
  logo: null,
};

export const DEFAULT_FRAME: FrameStyle = {
  id: "none",
  label: "Scan me",
  sub: "",
  font: "display",
  color: "#15151b",
  accent: "#6d5dfc",
  paper: "#ffffff",
  ink: "#15151b",
};

export const DEFAULT_DESIGN: Design = {
  content: { type: "url", fields: {} },
  qr: DEFAULT_QR,
  frame: DEFAULT_FRAME,
};

/** Merge an untrusted/partial object (localStorage, share link) onto defaults. */
export function sanitizeDesign(raw: unknown): Design {
  const d = (raw && typeof raw === "object" ? raw : {}) as Partial<Design>;
  const content = (d.content ?? {}) as Partial<ContentState>;
  return {
    content: {
      type: (content.type as ContentType) ?? DEFAULT_DESIGN.content.type,
      fields:
        content.fields && typeof content.fields === "object"
          ? { ...content.fields }
          : {},
    },
    qr: {
      ...DEFAULT_QR,
      ...(d.qr ?? {}),
      fill: { ...DEFAULT_QR.fill, ...(d.qr?.fill ?? {}) },
    },
    frame: { ...DEFAULT_FRAME, ...(d.frame ?? {}) },
  };
}

export function resolveEC(qr: QRStyle): ECLevel {
  if (qr.ec !== "auto") return qr.ec;
  return qr.logo ? "H" : "M";
}
