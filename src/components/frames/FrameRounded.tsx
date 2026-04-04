import React from "react";
import type { FrameProps } from "./types";

export function FrameRounded({
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
  const rx = pad * 0.6;
  const badgeH = fontSize * 2.2;
  const badgeW = Math.min(
    qrSize * 0.8,
    measureText(labelText, fontSize) + fontSize * 1.5,
  );
  const badgeX = (width - badgeW) / 2;
  const badgeY = qrY + qrSize + pad * 0.35;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      {bgFill && <rect width={width} height={height} fill={bgFill} rx={10} ry={10} />}
      {/* Rounded border */}
      <rect
        x={qrX - pad * 0.5}
        y={qrY - pad * 0.5}
        width={qrSize + pad}
        height={qrSize + pad + pad * 1.8}
        rx={rx}
        ry={rx}
        fill="none"
        stroke={color}
        strokeWidth={Math.max(2, pad * 0.08)}
      />
      {children && (
        <foreignObject x={qrX} y={qrY} width={qrSize} height={qrSize}>
          {children}
        </foreignObject>
      )}
      {/* Badge */}
      {labelText && (
        <>
          <rect
            x={badgeX}
            y={badgeY}
            width={badgeW}
            height={badgeH}
            rx={badgeH / 2}
            ry={badgeH / 2}
            fill={color}
          />
          <text
            x={width / 2}
            y={badgeY + badgeH / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="'Syne', sans-serif"
            fontSize={fontSize}
            fontWeight="600"
            fill={labelColor}
          >
            {labelText}
          </text>
        </>
      )}
    </svg>
  );
}

function measureText(text: string, fontSize: number) {
  return text.length * fontSize * 0.58;
}
