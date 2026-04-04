import React, { useState } from "react";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const [hexInput, setHexInput] = useState(value);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setHexInput(v);
    onChange(v);
  };

  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setHexInput(v);
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
      onChange(v);
    }
  };

  // Sync external changes
  React.useEffect(() => {
    setHexInput(value);
  }, [value]);

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-mono text-(--text-secondary) uppercase tracking-widest">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <div className="relative w-8 h-8 rounded overflow-hidden border border-(--border) shrink-0">
          <input
            type="color"
            value={value}
            onChange={handleColorChange}
            aria-label={`${label} color picker`}
            className="absolute inset-0 w-full h-full cursor-pointer opacity-100"
          />
        </div>
        <input
          type="text"
          value={hexInput}
          onChange={handleHexInput}
          maxLength={7}
          aria-label={`${label} hex value`}
          className="flex-1 h-8 px-2 text-xs font-mono bg-(--surface-2) border border-(--border)
            text-(--text-primary) rounded-sm outline-none
            focus:border-(--accent) transition-colors"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

interface GradientPickerProps {
  label: string;
  color1: string;
  color2: string;
  gradientType: "linear" | "radial";
  enabled: boolean;
  onToggle: (v: boolean) => void;
  onColor1: (v: string) => void;
  onColor2: (v: string) => void;
  onTypeChange: (v: "linear" | "radial") => void;
}

export function GradientPicker({
  label,
  color1,
  color2,
  gradientType,
  enabled,
  onToggle,
  onColor1,
  onColor2,
  onTypeChange,
}: GradientPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-(--text-secondary) uppercase tracking-widest">
          {label}
        </span>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            className="sr-only"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
          />
          <div
            className="text-xs font-mono px-2 py-0.5 rounded-sm border border-(--border) transition-colors cursor-pointer"
            style={{
              background: enabled ? "var(--accent)" : "var(--surface-2)",
              color: enabled ? "var(--accent-fg)" : "var(--text-secondary)",
            }}
          >
            Gradient
          </div>
        </label>
      </div>

      {enabled ? (
        <div className="flex flex-col gap-2">
          <div className="flex gap-1 items-center">
            <button
              onClick={() => onTypeChange("linear")}
              className="flex-1 py-1 text-xs font-mono rounded-sm border border-(--border) transition-colors"
              style={{
                background:
                  gradientType === "linear"
                    ? "var(--accent)"
                    : "var(--surface-2)",
                color:
                  gradientType === "linear"
                    ? "var(--accent-fg)"
                    : "var(--text-secondary)",
              }}
            >
              Linear
            </button>
            <button
              onClick={() => onTypeChange("radial")}
              className="flex-1 py-1 text-xs font-mono rounded-sm border border-(--border) transition-colors"
              style={{
                background:
                  gradientType === "radial"
                    ? "var(--accent)"
                    : "var(--surface-2)",
                color:
                  gradientType === "radial"
                    ? "var(--accent-fg)"
                    : "var(--text-secondary)",
              }}
            >
              Radial
            </button>
          </div>
          <div className="flex gap-2">
            <ColorPicker label="From" value={color1} onChange={onColor1} />
            <ColorPicker label="To" value={color2} onChange={onColor2} />
          </div>
          <div
            className="h-5 w-full rounded-sm border border-(--border)"
            style={{
              background:
                gradientType === "linear"
                  ? `linear-gradient(to right, ${color1}, ${color2})`
                  : `radial-gradient(circle, ${color1}, ${color2})`,
            }}
          />
        </div>
      ) : (
        <ColorPicker label="Color" value={color1} onChange={onColor1} />
      )}
    </div>
  );
}
