import React from "react";
import type { FrameProps } from "./types";

export function FrameSpeechBubble({
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

  // Bubble body
  const bx = qrX - pad * 0.5;
  const by = qrY - pad * 1.5; // extra top for label
  const bw = qrSize + pad;
  const labelAreaH = fontSize * 2.5;
  const bh = qrSize + pad + labelAreaH;
  const rx = pad * 0.4;

  // Tail pointing down
  const tailW = pad * 0.6;
  const tailH = pad * 0.5;
  const tailX1 = width / 2 - tailW / 2;
  const tailX2 = width / 2 + tailW / 2;
  const tailY1 = by + bh;
  const tailY2 = by + bh + tailH;

  // Bubble outline path
  const path = `
    M ${bx + rx} ${by}
    H ${bx + bw - rx}
    Q ${bx + bw} ${by} ${bx + bw} ${by + rx}
    V ${tailY1 - rx}
    Q ${bx + bw} ${tailY1} ${bx + bw - rx} ${tailY1}
    H ${tailX2}
    L ${width / 2} ${tailY2}
    L ${tailX1} ${tailY1}
    H ${bx + rx}
    Q ${bx} ${tailY1} ${bx} ${tailY1 - rx}
    V ${by + rx}
    Q ${bx} ${by} ${bx + rx} ${by}
    Z
  `;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      {bgFill && <rect width={width} height={height} fill={bgFill} rx={10} ry={10} />}
      <path d={path} fill="none" stroke={color} strokeWidth={strokeW} />

      {/* Label inside bubble top */}
      {labelText && (
        <text
          x={width / 2}
          y={by + labelAreaH / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="'Syne', sans-serif"
          fontSize={fontSize}
          fontWeight="700"
          fill={labelColor}
        >
          {labelText}
        </text>
      )}

      {children && (
        <foreignObject x={qrX} y={qrY} width={qrSize} height={qrSize}>
          {children}
        </foreignObject>
      )}
    </svg>
  );
}
