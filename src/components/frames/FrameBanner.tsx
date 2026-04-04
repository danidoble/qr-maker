import React from "react";
import type { FrameProps } from "./types";

export function FrameBanner({
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
  const bannerH = fontSize * 2.4;
  const bx = qrX - pad * 0.5;
  const bw = qrSize + pad;

  // Top banner
  const topBannerY = qrY - bannerH - pad * 0.3;
  // Bottom banner
  const bottomBannerY = qrY + qrSize + pad * 0.3;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      {bgFill && <rect width={width} height={height} fill={bgFill} rx={10} ry={10} />}
      {/* Top banner stripe */}
      <rect
        x={bx}
        y={topBannerY}
        width={bw}
        height={bannerH}
        rx={2}
        fill={color}
      />

      {/* Bottom banner stripe */}
      <rect
        x={bx}
        y={bottomBannerY}
        width={bw}
        height={bannerH}
        rx={2}
        fill={color}
      />

      {/* Side borders connecting banners */}
      <line
        x1={bx}
        y1={topBannerY + bannerH}
        x2={bx}
        y2={bottomBannerY}
        stroke={color}
        strokeWidth={strokeW}
      />
      <line
        x1={bx + bw}
        y1={topBannerY + bannerH}
        x2={bx + bw}
        y2={bottomBannerY}
        stroke={color}
        strokeWidth={strokeW}
      />

      {/* Brand top text */}
      <text
        x={width / 2}
        y={topBannerY + bannerH / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="'Syne', sans-serif"
        fontSize={fontSize * 0.75}
        fontWeight="800"
        letterSpacing="0.15em"
        fill={labelColor}
      >
        QR MAKER
      </text>

      {children && (
        <foreignObject x={qrX} y={qrY} width={qrSize} height={qrSize}>
          {children}
        </foreignObject>
      )}

      {/* Label bottom */}
      {labelText && (
        <text
          x={width / 2}
          y={bottomBannerY + bannerH / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="'DM Mono', 'Courier New', monospace"
          fontSize={fontSize}
          fontWeight="500"
          fill={labelColor}
        >
          {labelText}
        </text>
      )}
    </svg>
  );
}
