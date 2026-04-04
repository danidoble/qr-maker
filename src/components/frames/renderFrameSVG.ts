import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FrameRenderer } from "./FrameRenderer";
import type { FrameId, FrameProps, FrameRendererProps } from "./types";

interface RenderFrameSVGOptions extends Omit<FrameProps, "children"> {
  frameId: FrameId;
}

/** Returns the export SVG using the same React frame components as the preview. */
export function renderFrameSVG(opts: RenderFrameSVGOptions): string {
  if (opts.frameId === "none") {
    const bg = opts.bgFill
      ? `<rect width="${opts.width}" height="${opts.height}" fill="${opts.bgFill}" rx="10" ry="10"/>`
      : "";
    return `<svg viewBox="0 0 ${opts.width} ${opts.height}" width="${opts.width}" height="${opts.height}" xmlns="http://www.w3.org/2000/svg">${bg}</svg>`;
  }

  return renderToStaticMarkup(
    React.createElement(FrameRenderer, opts as FrameRendererProps),
  );
}
