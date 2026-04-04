import React from "react";
import type { FrameProps } from "./types";

export function FrameSimple({
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
  const labelY = qrY + qrSize + pad * 0.6;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", overflow: "visible" }}
    >
      {bgFill && <rect width={width} height={height} fill={bgFill} rx={10} ry={10} />}
      {/* Border */}
      <rect
        x={qrX - pad * 0.5}
        y={qrY - pad * 0.5}
        width={qrSize + pad}
        height={qrSize + pad + pad * 1.5}
        rx={4}
        ry={4}
        fill="none"
        stroke={color}
        strokeWidth={Math.max(2, pad * 0.08)}
      />
      {children && (
        <foreignObject x={qrX} y={qrY} width={qrSize} height={qrSize}>
          {children}
        </foreignObject>
      )}
      {/* Label */}
      {labelText && (
        <text
          x={width / 2}
          y={labelY}
          textAnchor="middle"
          dominantBaseline="hanging"
          fontFamily="'DM Mono', 'Courier New', monospace"
          fontSize={fontSize}
          fontWeight="500"
          fill={labelColor}
          className="label-fade-in"
        >
          {labelText}
        </text>
      )}
    </svg>
  );
}
