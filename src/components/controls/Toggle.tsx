import React from "react";

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  id: string;
}

export function Toggle({ checked, onChange, label, id }: ToggleProps) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-3 cursor-pointer select-none group"
    >
      <div className="relative">
        <input
          id={id}
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div
          className="w-10 h-5 rounded-full border border-(--border) transition-colors duration-200"
          style={{ background: checked ? "var(--accent)" : "var(--surface-2)" }}
        />
        <div
          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-200 shadow-sm"
          style={{
            background: checked ? "var(--accent-fg)" : "var(--text-secondary)",
            transform: checked ? "translateX(20px)" : "translateX(0)",
          }}
        />
      </div>
      <span className="text-sm text-(--text-secondary) font-mono group-hover:text-(--text-primary) transition-colors">
        {label}
      </span>
    </label>
  );
}
