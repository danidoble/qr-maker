import type { FrameLayout } from "./types";

const PAD_H_RATIO = 0.15;
const PAD_TOP_RATIO = 100 / 300;
const PAD_BOTTOM_RATIO = 120 / 300;

export interface FrameCanvasLayout extends FrameLayout {
  padH: number;
  padTop: number;
  padBottom: number;
}

export function getFrameLayout(qrSize: number): FrameCanvasLayout {
  const padH = Math.round(qrSize * PAD_H_RATIO);
  const padTop = Math.round(qrSize * PAD_TOP_RATIO);
  const padBottom = Math.round(qrSize * PAD_BOTTOM_RATIO);

  return {
    width: qrSize + padH * 2,
    height: qrSize + padTop + padBottom,
    qrX: padH,
    qrY: padTop,
    qrSize,
    padH,
    padTop,
    padBottom,
  };
}