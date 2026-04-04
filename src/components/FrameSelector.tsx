import React, { useCallback } from "react";
import type { FrameId } from "./frames/types";

interface FrameSelectorProps {
  value: FrameId;
  onChange: (id: FrameId) => void;
}

interface FrameOption {
  id: FrameId;
  label: string;
  thumbnail: React.FC<{ color: string; size: number }>;
}

const FRAMES: FrameOption[] = [
  {
    id: "none",
    label: "None",
    thumbnail: ({ size }) => (
      <svg width={size} height={size} viewBox="0 0 48 48">
        <rect
          x="8"
          y="8"
          width="32"
          height="32"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 2"
          opacity="0.3"
        />
        <line
          x1="14"
          y1="14"
          x2="34"
          y2="34"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.2"
        />
        <line
          x1="34"
          y1="14"
          x2="14"
          y2="34"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.2"
        />
      </svg>
    ),
  },
  {
    id: "simple",
    label: "Simple",
    thumbnail: ({ color, size }) => (
      <svg width={size} height={size} viewBox="0 0 48 56">
        <rect
          x="4"
          y="4"
          width="40"
          height="48"
          rx="2"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
        />
        <rect
          x="10"
          y="10"
          width="28"
          height="28"
          fill="none"
          stroke={color}
          strokeWidth="1"
          opacity="0.3"
        />
        <text
          x="24"
          y="49"
          textAnchor="middle"
          fontSize="5"
          fill={color}
          fontFamily="monospace"
        >
          SCAN ME
        </text>
      </svg>
    ),
  },
  {
    id: "rounded",
    label: "Rounded",
    thumbnail: ({ color, size }) => (
      <svg width={size} height={size} viewBox="0 0 48 58">
        <rect
          x="4"
          y="4"
          width="40"
          height="46"
          rx="8"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
        />
        <rect
          x="10"
          y="10"
          width="28"
          height="28"
          fill="none"
          stroke={color}
          strokeWidth="1"
          opacity="0.3"
        />
        <rect x="10" y="42" width="28" height="11" rx="5.5" fill={color} />
        <text
          x="24"
          y="48.5"
          textAnchor="middle"
          fontSize="5"
          fill="white"
          fontFamily="sans-serif"
          fontWeight="bold"
        >
          SCAN
        </text>
      </svg>
    ),
  },
  {
    id: "ticket",
    label: "Ticket",
    thumbnail: ({ color, size }) => (
      <svg width={size} height={size} viewBox="0 0 48 58">
        <rect
          x="4"
          y="4"
          width="40"
          height="50"
          rx="2"
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
        <circle cx="4" cy="14" r="3" fill="var(--bg)" />
        <circle cx="4" cy="26" r="3" fill="var(--bg)" />
        <circle cx="4" cy="38" r="3" fill="var(--bg)" />
        <circle cx="44" cy="14" r="3" fill="var(--bg)" />
        <circle cx="44" cy="26" r="3" fill="var(--bg)" />
        <circle cx="44" cy="38" r="3" fill="var(--bg)" />
        <line
          x1="8"
          y1="44"
          x2="40"
          y2="44"
          stroke={color}
          strokeWidth="1"
          strokeDasharray="3 2"
        />
        <rect
          x="10"
          y="9"
          width="28"
          height="28"
          fill="none"
          stroke={color}
          strokeWidth="1"
          opacity="0.3"
        />
        <text
          x="24"
          y="51"
          textAnchor="middle"
          fontSize="5"
          fill={color}
          fontFamily="monospace"
        >
          SCAN ME
        </text>
      </svg>
    ),
  },
  {
    id: "speech-bubble",
    label: "Bubble",
    thumbnail: ({ color, size }) => (
      <svg width={size} height={size} viewBox="0 0 48 62">
        <path
          d="M4 8 Q4 4 8 4 H40 Q44 4 44 8 V50 Q44 54 40 54 H28 L24 60 L20 54 H8 Q4 54 4 50 Z"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
        />
        <text
          x="24"
          y="12"
          textAnchor="middle"
          fontSize="5"
          fill={color}
          fontFamily="sans-serif"
          fontWeight="bold"
        >
          SCAN ME
        </text>
        <rect
          x="10"
          y="16"
          width="28"
          height="32"
          fill="none"
          stroke={color}
          strokeWidth="1"
          opacity="0.3"
        />
      </svg>
    ),
  },
  {
    id: "banner",
    label: "Banner",
    thumbnail: ({ color, size }) => (
      <svg width={size} height={size} viewBox="0 0 48 60">
        <rect x="4" y="4" width="40" height="9" rx="1.5" fill={color} />
        <rect x="4" y="47" width="40" height="9" rx="1.5" fill={color} />
        <line x1="4" y1="13" x2="4" y2="47" stroke={color} strokeWidth="1.5" />
        <line
          x1="44"
          y1="13"
          x2="44"
          y2="47"
          stroke={color}
          strokeWidth="1.5"
        />
        <rect
          x="12"
          y="16"
          width="24"
          height="26"
          fill="none"
          stroke={color}
          strokeWidth="1"
          opacity="0.3"
        />
        <text
          x="24"
          y="9.5"
          textAnchor="middle"
          fontSize="4"
          fill="white"
          fontFamily="sans-serif"
          fontWeight="bold"
        >
          QR MAKER
        </text>
        <text
          x="24"
          y="52"
          textAnchor="middle"
          fontSize="4.5"
          fill="white"
          fontFamily="monospace"
        >
          SCAN ME
        </text>
      </svg>
    ),
  },
  {
    id: "polaroid",
    label: "Polaroid",
    thumbnail: ({ color, size }) => (
      <svg width={size} height={size} viewBox="0 0 48 62">
        <rect
          x="5"
          y="5"
          width="38"
          height="52"
          rx="2"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
        />
        <rect x="5" y="44" width="38" height="13" fill={color} opacity="0.12" />
        <rect
          x="10"
          y="9"
          width="28"
          height="32"
          fill="none"
          stroke={color}
          strokeWidth="1"
          opacity="0.3"
        />
        <text
          x="24"
          y="52.5"
          textAnchor="middle"
          fontSize="5.5"
          fill={color}
          fontFamily="Georgia,serif"
          fontStyle="italic"
        >
          Scan me
        </text>
      </svg>
    ),
  },
];

export function FrameSelector({ value, onChange }: FrameSelectorProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, idx: number) => {
      const total = FRAMES.length;
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const next =
        e.key === "ArrowRight" ? (idx + 1) % total : (idx - 1 + total) % total;
      e.preventDefault();
      onChange(FRAMES[next].id);
      (
        document.querySelector(
          `[data-frame-id="${FRAMES[next].id}"]`,
        ) as HTMLButtonElement
      )?.focus();
    },
    [onChange],
  );

  return (
    <div
      role="radiogroup"
      aria-label="Frame style"
      className="flex flex-col gap-2"
    >
      <span className="text-xs font-mono text-(--text-secondary) uppercase tracking-widest">
        Frame Style
      </span>
      <div className="grid grid-cols-4 gap-1.5">
        {FRAMES.map((frame, idx) => {
          const selected = value === frame.id;
          const ThumbnailComp = frame.thumbnail;
          return (
            <button
              key={frame.id}
              role="radio"
              aria-checked={selected}
              data-frame-id={frame.id}
              title={frame.label}
              onClick={() => onChange(frame.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className="flex flex-col items-center justify-center gap-1 p-1.5 rounded-sm border transition-all duration-150 outline-none focus-visible:ring-1 focus-visible:ring-(--accent)"
              style={{
                background: selected
                  ? "color-mix(in srgb, var(--accent) 15%, transparent)"
                  : "var(--surface-2)",
                borderColor: selected ? "var(--accent)" : "var(--border)",
                color: selected ? "var(--accent)" : "var(--text-secondary)",
              }}
            >
              <ThumbnailComp
                color={selected ? "var(--accent)" : "var(--text-secondary)"}
                size={40}
              />
              <span className="text-[9px] font-mono uppercase tracking-wider leading-none">
                {frame.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
