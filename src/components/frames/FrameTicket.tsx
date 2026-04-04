import React, { useId } from "react";
import type { FrameProps } from "./types";

export function FrameTicket({
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
  const maskId = useId().replaceAll(":", "");
  const pad = qrX;
  const bx = qrX - pad * 0.5;
  const by = qrY - pad * 0.5;
  const bw = qrSize + pad;
  const bh = qrSize + pad + pad * 1.8;
  const perf = 8; // perforation radius
  const perfCount = 5;
  const gap = bh / (perfCount + 1);
  const strokeW = Math.max(2, pad * 0.08);

  // Divider line y position
  const dividerY = qrY + qrSize + pad * 0.4;

  // Perforation circles on left and right edges
  const perfs: number[] = Array.from(
    { length: perfCount },
    (_, i) => by + gap * (i + 1),
  );

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      {bgFill && <rect width={width} height={height} fill={bgFill} rx={10} ry={10} />}
      <defs>
        <mask id={maskId}>
          <rect x={bx} y={by} width={bw} height={bh} rx={4} fill="white" />
          {/* Perforation cut-outs left */}
          {perfs.map((cy, i) => (
            <circle key={`l-${i}`} cx={bx} cy={cy} r={perf} fill="black" />
          ))}
          {/* Perforation cut-outs right */}
          {perfs.map((cy, i) => (
            <circle key={`r-${i}`} cx={bx + bw} cy={cy} r={perf} fill="black" />
          ))}
        </mask>
      </defs>

      {/* Ticket body */}
      <rect
        x={bx}
        y={by}
        width={bw}
        height={bh}
        rx={4}
        fill="none"
        stroke={color}
        strokeWidth={strokeW}
        mask={`url(#${maskId})`}
      />

      {/* Dashed divider */}
      <line
        x1={bx + perf + 4}
        y1={dividerY}
        x2={bx + bw - perf - 4}
        y2={dividerY}
        stroke={color}
        strokeWidth={strokeW * 0.7}
        strokeDasharray="4 3"
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
          y={dividerY + (by + bh - dividerY) / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="'DM Mono', 'Courier New', monospace"
          fontSize={fontSize}
          fontWeight="500"
          letterSpacing="0.08em"
          fill={labelColor}
        >
          {labelText}
        </text>
      )}
    </svg>
  );
}
