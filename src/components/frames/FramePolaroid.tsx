import React from "react";
import type { FrameProps } from "./types";

export function FramePolaroid({
  width,
  height,
  qrX,
  qrY,
  qrSize,
  color,
  labelText,
  labelColor,
  fontSize,
  bgFill,
  children,
}: FrameProps) {
  const pad = qrX;
  const strokeW = Math.max(2, pad * 0.08);
  const topPad = pad * 0.4;
  const sidePad = pad * 0.4;
  const bottomPad = fontSize * 4.5;

  const bx = qrX - sidePad;
  const by = qrY - topPad;
  const bw = qrSize + sidePad * 2;
  const bh = qrSize + topPad + bottomPad;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      {bgFill && <rect width={width} height={height} fill={bgFill} rx={10} ry={10} />}
      {/* Polaroid border */}
      <rect
        x={bx}
        y={by}
        width={bw}
        height={bh}
        rx={3}
        ry={3}
        fill="none"
        stroke={color}
        strokeWidth={strokeW}
      />

      {/* Bottom fill */}
      <rect
        x={bx + strokeW / 2}
        y={qrY + qrSize}
        width={bw - strokeW}
        height={bottomPad - strokeW / 2}
        fill={color}
        opacity="0.12"
      />

      {children && (
        <foreignObject x={qrX} y={qrY} width={qrSize} height={qrSize}>
          {children}
        </foreignObject>
      )}

      {/* Label in cursive/italic */}
      {labelText && (
        <text
          x={width / 2}
          y={qrY + qrSize + bottomPad * 0.55}
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontStyle="italic"
          fontSize={fontSize * 1.1}
          fill={labelColor}
          className="mt-12"
        >
          {labelText}
        </text>
      )}
    </svg>
  );
}