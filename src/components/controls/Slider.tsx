import React from "react";

interface SliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  tooltip?: string;
}

export function Slider({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
  tooltip,
}: SliderProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-xs font-mono text-(--text-secondary) uppercase tracking-widest"
        >
          {label}
          {tooltip && (
            <span className="relative group inline-flex ml-1 cursor-help">
              <span className="text-(--text-secondary) text-[10px] border border-(--border) rounded-full w-3.5 h-3.5 flex items-center justify-center">
                ?
              </span>
              <span
                className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
                w-max max-w-50 rounded-sm px-2.5 py-1.5 text-xs font-mono
                bg-(--surface-2) text-(--text-primary) border border-(--border)
                opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-normal text-center shadow-lg"
              >
                {tooltip}
              </span>
            </span>
          )}
        </label>
        <span className="text-xs font-mono text-(--accent)">
          {value}
          {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        style={{
          background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${((value - min) / (max - min)) * 100}%, var(--border) ${((value - min) / (max - min)) * 100}%, var(--border) 100%)`,
        }}
      />
    </div>
  );
}
