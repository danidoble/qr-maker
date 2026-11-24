import type { FontId } from "./design";

import displayUrl from "@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2?url";
import sansUrl from "@fontsource-variable/geist/files/geist-latin-wght-normal.woff2?url";
import groteskUrl from "@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2?url";
import monoUrl from "@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2?url";
import serifUrl from "@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2?url";
import handUrl from "@fontsource/caveat/files/caveat-latin-700-normal.woff2?url";

export interface FontDef {
  id: FontId;
  name: string;
  family: string;
  /** CSS font-family value (with fallbacks). */
  stack: string;
  weight: number;
  /** @font-face weight descriptor (ranges for variable fonts). */
  weightRange: string;
  url: string;
  /** Average glyph width / font size; used to auto-fit labels. */
  widthFactor: number;
}

export const FONTS: Record<FontId, FontDef> = {
  display: {
    id: "display",
    name: "Bricolage",
    family: "Bricolage Grotesque Variable",
    stack:
      "'Bricolage Grotesque Variable', 'Bricolage Grotesque', system-ui, sans-serif",
    weight: 700,
    weightRange: "200 800",
    url: displayUrl,
    widthFactor: 0.56,
  },
  sans: {
    id: "sans",
    name: "Geist",
    family: "Geist Variable",
    stack: "'Geist Variable', 'Geist', system-ui, sans-serif",
    weight: 600,
    weightRange: "100 900",
    url: sansUrl,
    widthFactor: 0.58,
  },
  grotesk: {
    id: "grotesk",
    name: "Space",
    family: "Space Grotesk Variable",
    stack: "'Space Grotesk Variable', 'Space Grotesk', system-ui, sans-serif",
    weight: 700,
    weightRange: "300 700",
    url: groteskUrl,
    widthFactor: 0.6,
  },
  mono: {
    id: "mono",
    name: "Mono",
    family: "Geist Mono Variable",
    stack: "'Geist Mono Variable', 'Geist Mono', ui-monospace, monospace",
    weight: 600,
    weightRange: "100 900",
    url: monoUrl,
    widthFactor: 0.62,
  },
  serif: {
    id: "serif",
    name: "Serif",
    family: "Instrument Serif",
    stack: "'Instrument Serif', Georgia, serif",
    weight: 400,
    weightRange: "400",
    url: serifUrl,
    widthFactor: 0.45,
  },
  hand: {
    id: "hand",
    name: "Hand",
    family: "Caveat",
    stack: "'Caveat', 'Comic Sans MS', cursive",
    weight: 700,
    weightRange: "700",
    url: handUrl,
    widthFactor: 0.43,
  },
};

export const FONT_LIST = Object.values(FONTS);

const dataUrlCache = new Map<FontId, Promise<string>>();

function toDataUrl(id: FontId): Promise<string> {
  let p = dataUrlCache.get(id);
  if (!p) {
    p = fetch(FONTS[id].url)
      .then((r) => r.blob())
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = () => resolve(fr.result as string);
            fr.onerror = reject;
            fr.readAsDataURL(blob);
          }),
      );
    dataUrlCache.set(id, p);
    p.catch(() => dataUrlCache.delete(id));
  }
  return p;
}

/**
 * @font-face rules with the fonts inlined. SVGs drawn through <img>/canvas
 * can't see page fonts, so exports must carry their own.
 */
export async function embeddedFontCSS(ids: FontId[]): Promise<string> {
  const unique = [...new Set(ids)];
  const rules = await Promise.all(
    unique.map(async (id) => {
      try {
        const src = await toDataUrl(id);
        const f = FONTS[id];
        return `@font-face{font-family:'${f.family}';font-style:normal;font-weight:${f.weightRange};src:url(${src}) format('woff2');}`;
      } catch {
        return "";
      }
    }),
  );
  return rules.join("");
}
