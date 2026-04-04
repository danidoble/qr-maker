import React from "react";

interface ShapeOption {
  id: string;
  label: string;
  svg: React.ReactNode;
}

interface ShapeGridProps {
  label: string;
  options: ShapeOption[];
  value: string;
  onChange: (id: string) => void;
  columns?: number;
}

export function ShapeGrid({
  label,
  options,
  value,
  onChange,
  columns = 3,
}: ShapeGridProps) {
  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    const total = options.length;
    const arrowKeys = ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"];
    if (!arrowKeys.includes(e.key)) return;
    const next =
      e.key === "ArrowRight" ? (idx + 1) % total
      : e.key === "ArrowLeft" ? (idx - 1 + total) % total
      : e.key === "ArrowDown" ? Math.min(idx + columns, total - 1)
      : Math.max(idx - columns, 0);
    e.preventDefault();
    onChange(options[next].id);
    (
      document.querySelector(
        `[data-shape-id="${options[next].id}"]`,
      ) as HTMLButtonElement
    )?.focus();
  };

  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col gap-2">
      <span className="text-xs font-mono text-(--text-secondary) uppercase tracking-widest">
        {label}
      </span>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {options.map((opt, idx) => {
          const selected = value === opt.id;
          return (
            <button
              key={opt.id}
              role="radio"
              aria-checked={selected}
              data-shape-id={opt.id}
              title={opt.label}
              onClick={() => onChange(opt.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className="flex flex-col items-center justify-center gap-1 p-2 rounded-sm border transition-all duration-150 outline-none focus-visible:ring-1 focus-visible:ring-(--accent)"
              style={{
                background: selected
                  ? "color-mix(in srgb, var(--accent) 15%, transparent)"
                  : "var(--surface-2)",
                borderColor: selected ? "var(--accent)" : "var(--border)",
                color: selected ? "var(--accent)" : "var(--text-secondary)",
              }}
            >
              <div className="w-7 h-7 flex items-center justify-center">
                {opt.svg}
              </div>
              <span className="text-[9px] font-mono uppercase tracking-wider leading-none text-center">
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── QR Dot Shape SVGs ──────────────────────────────────────────────────

export const DOT_SHAPES: ShapeOption[] = [
  {
    id: "square",
    label: "Square",
    svg: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <rect x="2" y="2" width="8" height="8" />
        <rect x="14" y="2" width="8" height="8" />
        <rect x="2" y="14" width="8" height="8" />
        <rect x="14" y="14" width="8" height="8" />
      </svg>
    ),
  },
  {
    id: "dot",
    label: "Dot",
    svg: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <circle cx="6" cy="6" r="4" />
        <circle cx="18" cy="6" r="4" />
        <circle cx="6" cy="18" r="4" />
        <circle cx="18" cy="18" r="4" />
      </svg>
    ),
  },
  {
    id: "rounded",
    label: "Round",
    svg: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <rect x="2" y="2" width="8" height="8" rx="2" />
        <rect x="14" y="2" width="8" height="8" rx="2" />
        <rect x="2" y="14" width="8" height="8" rx="2" />
        <rect x="14" y="14" width="8" height="8" rx="2" />
      </svg>
    ),
  },
  {
    id: "classy",
    label: "Classy",
    svg: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <rect x="2" y="2" width="8" height="8" rx="0" ry="0" />
        <rect x="14" y="2" width="8" height="8" rx="4" ry="0" />
        <rect x="2" y="14" width="8" height="8" rx="0" ry="4" />
        <rect x="14" y="14" width="8" height="8" rx="4" ry="4" />
      </svg>
    ),
  },
  {
    id: "classy-rounded",
    label: "Classy+",
    svg: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <rect x="2" y="2" width="8" height="8" rx="2" ry="2" />
        <rect x="14" y="2" width="8" height="8" rx="4" ry="2" />
        <rect x="2" y="14" width="8" height="8" rx="2" ry="4" />
        <rect x="14" y="14" width="8" height="8" rx="4" ry="4" />
      </svg>
    ),
  },
  {
    id: "extra-rounded",
    label: "Extra",
    svg: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <rect x="2" y="2" width="8" height="8" rx="4" />
        <rect x="14" y="2" width="8" height="8" rx="4" />
        <rect x="2" y="14" width="8" height="8" rx="4" />
        <rect x="14" y="14" width="8" height="8" rx="4" />
      </svg>
    ),
  },
];

export const CORNER_SQUARE_SHAPES: ShapeOption[] = [
  {
    id: "square",
    label: "Square",
    svg: (
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="18" height="18" />
        <rect
          x="7"
          y="7"
          width="10"
          height="10"
          fill="currentColor"
          stroke="none"
        />
      </svg>
    ),
  },
  {
    id: "extra-rounded",
    label: "Rounded",
    svg: (
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <rect
          x="7"
          y="7"
          width="10"
          height="10"
          rx="3"
          fill="currentColor"
          stroke="none"
        />
      </svg>
    ),
  },
  {
    id: "dot",
    label: "Dot",
    svg: (
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

export const CORNER_DOT_SHAPES: ShapeOption[] = [
  {
    id: "square",
    label: "Square",
    svg: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <rect x="7" y="7" width="10" height="10" />
      </svg>
    ),
  },
  {
    id: "dot",
    label: "Dot",
    svg: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <circle cx="12" cy="12" r="5" />
      </svg>
    ),
  },
];
