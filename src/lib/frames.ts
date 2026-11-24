import { readableOn, shade } from "./color";
import type { FontId, FrameId, FrameStyle } from "./design";
import { FONTS, type FontDef } from "./fonts";
import { attrs, circle, esc, n, rrect, sparkle } from "./svg";

/**
 * Frames are pure functions: given the QR size (always 1000 units) and the
 * frame style, they return the canvas size, where the QR goes and the SVG
 * drawn behind/in front of it. Adding a frame = adding one entry below.
 */

export interface FrameCtx {
  Q: number;
  s: FrameStyle;
  font: FontDef;
  mono: FontDef;
  /** Paper color, or null when transparent. */
  paper: string | null;
  /** Readable text color on top of `s.color`. */
  onColor: string;
  /** Unique id generator (inline SVGs share one id namespace). */
  id: (key: string) => string;
}

export interface FrameLayout {
  width: number;
  height: number;
  qrX: number;
  qrY: number;
  defs?: string;
  back: string;
  front?: string;
  fonts: FontId[];
}

export interface FrameDef {
  id: FrameId;
  name: string;
  /** Font applied when the frame is picked. */
  font: FontId;
  usesSub?: boolean;
  usesAccent?: boolean;
  build: (ctx: FrameCtx) => FrameLayout;
}

// ── Text helpers ────────────────────────────────────────────────────────────

interface TextOpts {
  size: number;
  font: FontDef;
  fill: string;
  anchor?: "start" | "middle" | "end";
  maxW?: number;
  /** Letter spacing in em. */
  ls?: number;
  weight?: number;
  opacity?: number;
  transform?: string;
}

/** Shrink `size` until the estimated text width fits `maxW`. */
function fit(
  str: string,
  size: number,
  font: FontDef,
  maxW = Infinity,
  ls = 0,
) {
  const est = str.length * size * (font.widthFactor + ls);
  const s = est > maxW ? (size * maxW) / est : size;
  return { size: s, width: str.length * s * (font.widthFactor + ls) };
}

function text(str: string, x: number, y: number, o: TextOpts): string {
  if (!str) return "";
  const { size } = fit(str, o.size, o.font, o.maxW, o.ls);
  return `<text ${attrs({
    x,
    y,
    "font-family": o.font.stack,
    "font-size": size,
    "font-weight": o.weight ?? o.font.weight,
    fill: o.fill,
    "text-anchor": o.anchor ?? "middle",
    "dominant-baseline": "central",
    "letter-spacing": o.ls ? n(o.ls * size) : undefined,
    opacity: o.opacity,
    transform: o.transform,
  })}>${esc(str)}</text>`;
}

const path = (d: string, a: Record<string, string | number | undefined> = {}) =>
  `<path d="${d}" ${attrs(a)}/>`;

// ── Frames ──────────────────────────────────────────────────────────────────

const card: FrameDef = {
  id: "card",
  name: "Card",
  font: "display",
  build: ({ Q, s, font, paper, onColor }) => {
    const p = 80;
    const W = Q + p * 2;
    const band = 250;
    const H = Q + p + band;
    return {
      width: W,
      height: H,
      qrX: p,
      qrY: p,
      back:
        path(rrect(0, 0, W, H, 96), { fill: s.color }) +
        (paper
          ? path(rrect(p - 22, p - 22, Q + 44, Q + 44, 64), { fill: paper })
          : ""),
      front: text(s.label, W / 2, Q + p + band / 2 - 8, {
        size: 124,
        font,
        fill: onColor,
        maxW: W - 160,
      }),
      fonts: [s.font],
    };
  },
};

const button: FrameDef = {
  id: "button",
  name: "Button",
  font: "sans",
  build: ({ Q, s, font, paper, onColor }) => {
    const p = 80;
    const W = Q + p * 2;
    const pillY = Q + p + 56;
    const pillH = 184;
    const H = pillY + pillH + p;
    const t = fit(s.label, 100, font, Q - 260);
    const tx = W / 2 - 40;
    const ax = tx + t.width / 2 + 36;
    const ay = pillY + pillH / 2;
    return {
      width: W,
      height: H,
      qrX: p,
      qrY: p,
      back: paper
        ? path(rrect(3, 3, W - 6, H - 6, 96), {
            fill: paper,
            stroke: s.color,
            "stroke-opacity": 0.14,
            "stroke-width": 6,
          })
        : "",
      front:
        path(rrect(p, pillY, Q, pillH, pillH / 2), { fill: s.color }) +
        text(s.label, tx, ay, { size: t.size, font, fill: onColor }) +
        path(`M${n(ax)} ${ay}h62M${n(ax + 36)} ${ay - 27}l27 27-27 27`, {
          fill: "none",
          stroke: onColor,
          "stroke-width": 15,
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
        }),
      fonts: [s.font],
    };
  },
};

const bubble: FrameDef = {
  id: "bubble",
  name: "Speech",
  font: "display",
  build: ({ Q, s, font, paper, onColor }) => {
    const W = Q + 160;
    const bh = 250;
    const tail = 72;
    const cardY = bh + tail + 16;
    const qrY = cardY + 80;
    const H = qrY + Q + 80;
    const c = W / 2;
    return {
      width: W,
      height: H,
      qrX: 80,
      qrY,
      back:
        path(rrect(0, 0, W, bh, bh / 2), { fill: s.color }) +
        path(
          `M${c - 86} ${bh - 4}Q${c - 20} ${bh + 16} ${c} ${bh + tail}Q${c + 20} ${bh + 16} ${c + 86} ${bh - 4}Z`,
          {
            fill: s.color,
          },
        ) +
        (paper ? path(rrect(0, cardY, W, H - cardY, 96), { fill: paper }) : ""),
      front: text(s.label, c, bh / 2, {
        size: 118,
        font,
        fill: onColor,
        maxW: W - 180,
      }),
      fonts: [s.font],
    };
  },
};

const ticket: FrameDef = {
  id: "ticket",
  name: "Ticket",
  font: "grotesk",
  usesSub: true,
  build: ({ Q, s, font, mono, paper, onColor, id }) => {
    const W = Q + 200;
    const perfY = Q + 170;
    const H = perfY + 310;
    const mask = id("ticket-mask");
    return {
      width: W,
      height: H,
      qrX: 100,
      qrY: 100,
      defs:
        `<mask id="${mask}"><rect width="${W}" height="${H}" fill="#fff"/>` +
        [
          [0, perfY, 62],
          [W, perfY, 62],
          [0, 0, 46],
          [W, 0, 46],
          [0, H, 46],
          [W, H, 46],
        ]
          .map(
            ([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#000"/>`,
          )
          .join("") +
        `</mask>`,
      back:
        path(rrect(0, 0, W, H, 20), { fill: s.color, mask: `url(#${mask})` }) +
        (paper
          ? path(rrect(66, 66, Q + 68, Q + 68, 40), { fill: paper })
          : "") +
        `<line ${attrs({
          x1: 100,
          x2: W - 100,
          y1: perfY,
          y2: perfY,
          stroke: onColor,
          "stroke-opacity": 0.45,
          "stroke-width": 8,
          "stroke-dasharray": "26 22",
          "stroke-linecap": "round",
        })}/>`,
      front:
        text(s.label, W / 2, perfY + (s.sub ? 115 : 155), {
          size: 116,
          font,
          fill: onColor,
          maxW: W - 220,
        }) +
        text(s.sub.toUpperCase(), W / 2, perfY + 225, {
          size: 42,
          font: mono,
          fill: onColor,
          ls: 0.2,
          opacity: 0.7,
          maxW: W - 220,
        }),
      fonts: [s.font, "mono"],
    };
  },
};

const polaroid: FrameDef = {
  id: "polaroid",
  name: "Polaroid",
  font: "hand",
  usesAccent: true,
  build: ({ Q, s, font, paper, id }) => {
    const m = 60;
    const cw = Q + 200;
    const ch = Q + 480;
    const W = cw + m * 2;
    const H = ch + m * 2;
    const shadow = id("polaroid-shadow");
    return {
      width: W,
      height: H,
      qrX: m + 100,
      qrY: m + 100,
      defs: `<filter id="${shadow}" x="-10%" y="-10%" width="120%" height="125%"><feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000" flood-opacity="0.2"/></filter>`,
      back: path(rrect(m, m, cw, ch, 14), {
        fill: paper ?? "#fbfaf6",
        filter: `url(#${shadow})`,
      }),
      front:
        text(s.label, W / 2, m + Q + 100 + (ch - Q - 100) / 2, {
          size: 190,
          font,
          fill: s.ink,
          maxW: cw - 160,
        }) +
        `<rect ${attrs({
          x: W / 2 - 180,
          y: m - 48,
          width: 360,
          height: 108,
          rx: 6,
          fill: s.accent,
          opacity: 0.55,
          transform: `rotate(-4 ${W / 2} ${m + 6})`,
        })}/>`,
      fonts: [s.font],
    };
  },
};

const phone: FrameDef = {
  id: "phone",
  name: "Phone",
  font: "sans",
  usesSub: true,
  build: ({ Q, s, font, mono, paper }) => {
    const W = Q + 240;
    const H = 1740;
    const qrY = 290;
    return {
      width: W,
      height: H,
      qrX: 120,
      qrY,
      back:
        path(rrect(0, 0, W, H, 180), { fill: s.color }) +
        path(rrect(44, 44, W - 88, H - 88, 140), { fill: paper ?? "#ffffff" }) +
        path(rrect(W / 2 - 130, 84, 260, 70, 35), { fill: s.color }) +
        path(rrect(W / 2 - 170, H - 104, 340, 14, 7), {
          fill: s.ink,
          opacity: 0.22,
        }),
      front:
        text(s.label, W / 2, qrY + Q + 140, {
          size: 108,
          font,
          fill: s.ink,
          maxW: W - 260,
        }) +
        text(s.sub, W / 2, qrY + Q + 250, {
          size: 44,
          font: mono,
          fill: s.ink,
          opacity: 0.55,
          maxW: W - 260,
        }),
      fonts: [s.font, "mono"],
    };
  },
};

const viewfinder: FrameDef = {
  id: "viewfinder",
  name: "Viewfinder",
  font: "mono",
  usesAccent: true,
  build: ({ Q, s, font, paper }) => {
    const q = 150;
    const g = 70;
    const W = Q + q * 2;
    const a = q - g;
    const b = q + Q + g;
    const L = 240;
    const r = 80;
    const H = b + 250;
    const brackets = [
      `M${a} ${a + L}V${a + r}Q${a} ${a} ${a + r} ${a}H${a + L}`,
      `M${b - L} ${a}H${b - r}Q${b} ${a} ${b} ${a + r}V${a + L}`,
      `M${b} ${b - L}V${b - r}Q${b} ${b} ${b - r} ${b}H${b - L}`,
      `M${a + L} ${b}H${a + r}Q${a} ${b} ${a} ${b - r}V${b - L}`,
    ].join("");
    const mid = q + Q / 2;
    return {
      width: W,
      height: H,
      qrX: q,
      qrY: q,
      back: paper ? path(rrect(0, 0, W, H, 96), { fill: paper }) : "",
      front:
        path(brackets, {
          fill: "none",
          stroke: s.color,
          "stroke-width": 30,
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
        }) +
        path(`M18 ${mid}h36M${W - 54} ${mid}h36`, {
          stroke: s.accent,
          "stroke-width": 12,
          "stroke-linecap": "round",
        }) +
        text(s.label, W / 2, b + 130, {
          size: 92,
          font,
          fill: s.ink,
          ls: 0.14,
          maxW: W - 220,
        }),
      fonts: [s.font],
    };
  },
};

const seal: FrameDef = {
  id: "seal",
  name: "Seal",
  font: "grotesk",
  usesSub: true,
  build: ({ Q, s, font, paper, onColor, id }) => {
    const R = 1010;
    const inner = 760;
    const C = R + 10;
    const W = C * 2;
    const rt = (inner + R) / 2;
    const label = s.label.toUpperCase();
    const top = fit(label, 120, font, 2300, 0.12);
    const sub = s.sub.toUpperCase();
    const bot = fit(sub, 84, font, 1500, 0.2);
    const topR = rt - top.size * 0.36;
    const botR = rt + bot.size * 0.36;
    const tId = id("seal-top");
    const bId = id("seal-bottom");
    const arcText = (str: string, href: string, size: number, ls: number) =>
      str
        ? `<text ${attrs({
            "font-family": font.stack,
            "font-size": size,
            "font-weight": font.weight,
            fill: onColor,
            "letter-spacing": n(size * ls),
          })}><textPath href="#${href}" startOffset="50%" text-anchor="middle">${esc(str)}</textPath></text>`
        : "";
    return {
      width: W,
      height: W,
      qrX: C - Q / 2,
      qrY: C - Q / 2,
      defs:
        `<path id="${tId}" d="M${n(C - topR)} ${C}A${n(topR)} ${n(topR)} 0 0 1 ${n(C + topR)} ${C}" fill="none"/>` +
        `<path id="${bId}" d="M${n(C - botR)} ${C}A${n(botR)} ${n(botR)} 0 0 0 ${n(C + botR)} ${C}" fill="none"/>`,
      back:
        path(circle(C, C, R), { fill: s.color }) +
        path(circle(C, C, R - 26), {
          fill: "none",
          stroke: onColor,
          "stroke-opacity": 0.3,
          "stroke-width": 6,
        }) +
        path(circle(C, C, inner + 26), {
          fill: "none",
          stroke: onColor,
          "stroke-opacity": 0.3,
          "stroke-width": 6,
        }) +
        (paper ? path(circle(C, C, inner), { fill: paper }) : ""),
      front:
        arcText(label, tId, top.size, 0.12) +
        (sub
          ? arcText(sub, bId, bot.size, 0.2)
          : path(
              sparkle(C, C + rt, 36) +
                sparkle(C - 110, C + rt - 8, 22) +
                sparkle(C + 110, C + rt - 8, 22),
              {
                fill: onColor,
              },
            )) +
        path(circle(C - rt, C, 16) + circle(C + rt, C, 16), { fill: onColor }),
      fonts: [s.font],
    };
  },
};

const ribbon: FrameDef = {
  id: "ribbon",
  name: "Ribbon",
  font: "display",
  build: ({ Q, s, font, paper, onColor }) => {
    const W = Q + 280;
    const bandY = Q + 120;
    const bandH = 190;
    const cardH = bandY + bandH - 70;
    const fold = 46;
    const H = bandY + bandH + fold;
    const dark = shade(s.color, -0.4);
    return {
      width: W,
      height: H,
      qrX: 140,
      qrY: 80,
      back:
        (paper ? path(rrect(60, 0, W - 120, cardH, 84), { fill: paper }) : "") +
        path(
          `M60 ${bandY + bandH}h70v${fold}zM${W - 60} ${bandY + bandH}h-70v${fold}z`,
          { fill: dark },
        ),
      front:
        path(
          `M0 ${bandY}H${W}L${W - 74} ${bandY + bandH / 2}L${W} ${bandY + bandH}H0L74 ${bandY + bandH / 2}Z`,
          { fill: s.color },
        ) +
        text(s.label, W / 2, bandY + bandH / 2, {
          size: 108,
          font,
          fill: onColor,
          maxW: W - 320,
        }),
      fonts: [s.font],
    };
  },
};

const stamp: FrameDef = {
  id: "stamp",
  name: "Stamp",
  font: "serif",
  usesSub: true,
  build: ({ Q, s, font, mono, paper, id }) => {
    const W = Q + 240;
    const H = Q + 520;
    const r = 24;
    const mask = id("stamp-mask");
    const holes: string[] = [];
    const nx = Math.round(W / 64);
    const ny = Math.round(H / 64);
    for (let i = 0; i < nx; i++) {
      const x = (W / nx) * (i + 0.5);
      holes.push(
        `<circle cx="${n(x)}" cy="0" r="${r}"/><circle cx="${n(x)}" cy="${H}" r="${r}"/>`,
      );
    }
    for (let i = 0; i < ny; i++) {
      const y = (H / ny) * (i + 0.5);
      holes.push(
        `<circle cx="0" cy="${n(y)}" r="${r}"/><circle cx="${W}" cy="${n(y)}" r="${r}"/>`,
      );
    }
    return {
      width: W,
      height: H,
      qrX: 120,
      qrY: 120,
      defs: `<mask id="${mask}"><rect width="${W}" height="${H}" fill="#fff"/><g fill="#000">${holes.join("")}</g></mask>`,
      back:
        path(`M0 0H${W}V${H}H0Z`, {
          fill: paper ?? "#fffdf7",
          mask: `url(#${mask})`,
        }) +
        path(rrect(64, 64, W - 128, H - 128, 6), {
          fill: s.color,
          "fill-opacity": 0.08,
          stroke: s.color,
          "stroke-width": 8,
        }),
      front:
        text(s.label, W / 2, Q + 120 + 150, {
          size: 150,
          font,
          fill: s.ink,
          maxW: W - 260,
        }) +
        text(s.sub.toUpperCase(), W / 2, Q + 120 + 270, {
          size: 40,
          font: mono,
          fill: s.color,
          ls: 0.24,
          maxW: W - 260,
        }),
      fonts: [s.font, "mono"],
    };
  },
};

const tag: FrameDef = {
  id: "tag",
  name: "Tag",
  font: "grotesk",
  usesAccent: true,
  build: ({ Q, s, font, paper, onColor, id }) => {
    const top = 150;
    const W = Q + 200;
    const holeY = top + 150;
    const qrY = top + 370;
    const H = qrY + Q + 290;
    const mask = id("tag-mask");
    const c = W / 2;
    return {
      width: W,
      height: H,
      qrX: 100,
      qrY,
      defs: `<mask id="${mask}"><rect width="${W}" height="${H}" fill="#fff"/><circle cx="${c}" cy="${holeY}" r="50" fill="#000"/></mask>`,
      back:
        path(
          `M300 ${top}H${W - 300}L${W} ${top + 300}V${H - 80}Q${W} ${H} ${W - 80} ${H}H80Q0 ${H} 0 ${H - 80}V${top + 300}Z`,
          { fill: s.color, mask: `url(#${mask})` },
        ) +
        path(circle(c, holeY, 76), {
          fill: "none",
          stroke: onColor,
          "stroke-opacity": 0.35,
          "stroke-width": 16,
        }) +
        (paper
          ? path(rrect(70, qrY - 30, Q + 60, Q + 60, 48), { fill: paper })
          : ""),
      front:
        path(
          `M${c} ${holeY - 46}C${c - 60} ${top - 30} ${c + 120} 70 ${c + 30} 0`,
          {
            fill: "none",
            stroke: s.accent,
            "stroke-width": 14,
            "stroke-linecap": "round",
          },
        ) +
        text(s.label, c, qrY + Q + 155, {
          size: 112,
          font,
          fill: onColor,
          maxW: W - 220,
        }),
      fonts: [s.font],
    };
  },
};

const doodle: FrameDef = {
  id: "doodle",
  name: "Doodle",
  font: "hand",
  usesAccent: true,
  build: ({ Q, s, font, paper }) => {
    const W = Q + 300;
    const qrX = 150;
    const qrY = 440;
    const H = qrY + Q + 140;
    const t = fit(s.label, 190, font, 780);
    const x0 = 130;
    const ux = x0 + Math.max(160, t.width);
    const sx = Math.min(x0 + t.width + 70, 1010);
    return {
      width: W,
      height: H,
      qrX,
      qrY,
      back: paper ? path(rrect(0, 0, W, H, 96), { fill: paper }) : "",
      front:
        text(s.label, x0, 200, {
          size: t.size,
          font,
          fill: s.ink,
          anchor: "start",
          transform: `rotate(-5 ${x0} 200)`,
        }) +
        path(
          `M${x0} 300Q${n(x0 + (ux - x0) / 4)} 330 ${n(x0 + (ux - x0) / 2)} 300T${n(ux)} 290`,
          {
            fill: "none",
            stroke: s.accent,
            "stroke-width": 13,
            "stroke-linecap": "round",
          },
        ) +
        path(
          `M${n(sx)} 170C${n(sx + 160)} 140 ${W - 170} 220 ${W - 200} 400M${W - 250} 350L${W - 198} 404L${W - 146} 352`,
          {
            fill: "none",
            stroke: s.color,
            "stroke-width": 15,
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
          },
        ) +
        path(sparkle(W - 90, 120, 44) + sparkle(70, H - 90, 34), {
          fill: s.accent,
        }) +
        path(sparkle(W - 50, 230, 22), { fill: s.color }),
      fonts: [s.font],
    };
  },
};

const aura: FrameDef = {
  id: "aura",
  name: "Aura",
  font: "display",
  usesAccent: true,
  build: ({ Q, s, font, paper, id }) => {
    const m = 150;
    const inset = 64;
    const cw = Q + inset * 2;
    const label = 230;
    const ch = cw + label;
    const W = cw + m * 2;
    const H = ch + m * 2;
    const g = id("aura-grad");
    const blur = id("aura-blur");
    return {
      width: W,
      height: H,
      qrX: m + inset,
      qrY: m + inset,
      defs:
        `<linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${s.color}"/><stop offset="1" stop-color="${s.accent}"/></linearGradient>` +
        `<filter id="${blur}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="46"/></filter>`,
      back:
        path(rrect(m + 30, m + 50, cw - 60, ch - 40, 100), {
          fill: `url(#${g})`,
          filter: `url(#${blur})`,
          opacity: 0.8,
        }) +
        path(rrect(m, m, cw, ch, 100), { fill: paper ?? "#ffffff" }) +
        path(rrect(m + 10, m + 10, cw - 20, ch - 20, 90), {
          fill: "none",
          stroke: `url(#${g})`,
          "stroke-width": 20,
        }),
      front: text(s.label, W / 2, m + inset + Q + label / 2 + 20, {
        size: 116,
        font,
        fill: `url(#${g})`,
        maxW: cw - 160,
      }),
      fonts: [s.font],
    };
  },
};

const editorial: FrameDef = {
  id: "editorial",
  name: "Editorial",
  font: "serif",
  usesSub: true,
  build: ({ Q, s, font, mono, paper }) => {
    const W = Q + 200;
    const qrY = 300;
    const H = qrY + Q + 210;
    return {
      width: W,
      height: H,
      qrX: 100,
      qrY,
      back:
        (paper ? path(`M0 0H${W}V${H}H0Z`, { fill: paper }) : "") +
        path(`M38 38H${W - 38}V${H - 38}H38Z`, {
          fill: "none",
          stroke: s.color,
          "stroke-width": 4,
        }) +
        path(`M100 248H${W - 100}`, {
          stroke: s.color,
          "stroke-opacity": 0.25,
          "stroke-width": 3,
        }),
      front:
        text(s.label, 100, 160, {
          size: 160,
          font,
          fill: s.ink,
          anchor: "start",
          maxW: W - 340,
        }) +
        path(`M${W - 190} 196L${W - 110} 116M${W - 170} 116H${W - 110}V176`, {
          fill: "none",
          stroke: s.color,
          "stroke-width": 9,
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
        }) +
        text(s.sub.toUpperCase(), 100, H - 110, {
          size: 38,
          font: mono,
          fill: s.ink,
          anchor: "start",
          ls: 0.18,
          opacity: 0.75,
          maxW: W - 520,
        }) +
        text("SCAN TO OPEN", W - 100, H - 110, {
          size: 38,
          font: mono,
          fill: s.color,
          anchor: "end",
          ls: 0.18,
        }),
      fonts: [s.font, "mono"],
    };
  },
};

const browser: FrameDef = {
  id: "browser",
  name: "Browser",
  font: "sans",
  usesSub: true,
  build: ({ Q, s, font, mono, paper, onColor }) => {
    const W = Q + 240;
    const bar = 140;
    const qrY = bar + 100;
    const H = qrY + Q + 250;
    return {
      width: W,
      height: H,
      qrX: 120,
      qrY,
      back:
        path(rrect(3, 3, W - 6, H - 6, 56), {
          fill: paper ?? "#ffffff",
          stroke: s.color,
          "stroke-opacity": 0.16,
          "stroke-width": 6,
        }) +
        path(rrect(0, 0, W, bar, [56, 56, 0, 0]), { fill: s.color }) +
        `<circle cx="80" cy="70" r="18" fill="#ff5f57"/><circle cx="140" cy="70" r="18" fill="#febc2e"/><circle cx="200" cy="70" r="18" fill="#28c840"/>` +
        path(rrect(270, 38, W - 330, 64, 32), {
          fill: onColor,
          "fill-opacity": 0.14,
        }),
      front:
        text(s.sub || "your-site.com", 310, 70, {
          size: 34,
          font: mono,
          fill: onColor,
          anchor: "start",
          opacity: s.sub ? 0.9 : 0.5,
          maxW: W - 420,
        }) +
        text(s.label, W / 2, qrY + Q + 125, {
          size: 104,
          font,
          fill: s.ink,
          maxW: W - 260,
        }),
      fonts: [s.font, "mono"],
    };
  },
};

export const FRAMES: FrameDef[] = [
  card,
  button,
  bubble,
  ticket,
  polaroid,
  phone,
  viewfinder,
  seal,
  ribbon,
  stamp,
  tag,
  doodle,
  aura,
  editorial,
  browser,
];

export const FRAME_MAP = Object.fromEntries(
  FRAMES.map((f) => [f.id, f]),
) as Record<Exclude<FrameId, "none">, FrameDef>;

export function buildFrame(
  s: FrameStyle,
  Q: number,
  idp: string,
): FrameLayout | null {
  if (s.id === "none") return null;
  const def = FRAME_MAP[s.id];
  if (!def) return null;
  return def.build({
    Q,
    s,
    font: FONTS[s.font] ?? FONTS.display,
    mono: FONTS.mono,
    paper: s.paper === "none" ? null : s.paper,
    onColor: readableOn(s.color),
    id: (k) => `${idp}-${k}`,
  });
}

/** Ready-made frame palettes. */
export const FRAME_PALETTES: {
  name: string;
  color: string;
  accent: string;
  paper: string;
  ink: string;
}[] = [
  {
    name: "Ink",
    color: "#15151b",
    accent: "#6d5dfc",
    paper: "#ffffff",
    ink: "#15151b",
  },
  {
    name: "Violet",
    color: "#5b47f5",
    accent: "#ff7ab6",
    paper: "#ffffff",
    ink: "#1d1650",
  },
  {
    name: "Coral",
    color: "#ff5a3c",
    accent: "#ffc53d",
    paper: "#fff8f3",
    ink: "#2b130c",
  },
  {
    name: "Forest",
    color: "#1f4d3a",
    accent: "#b6e36b",
    paper: "#f6f8f1",
    ink: "#13261d",
  },
  {
    name: "Ocean",
    color: "#0b5cad",
    accent: "#36d6c3",
    paper: "#f2f8ff",
    ink: "#0a2340",
  },
  {
    name: "Sun",
    color: "#ffc531",
    accent: "#ff6a3d",
    paper: "#fffbeb",
    ink: "#2a2000",
  },
  {
    name: "Blush",
    color: "#f6b8c8",
    accent: "#8a5cf6",
    paper: "#fff7f9",
    ink: "#3d1622",
  },
  {
    name: "Night",
    color: "#0f1020",
    accent: "#8b7bff",
    paper: "#1a1b2e",
    ink: "#f1f0ff",
  },
];
