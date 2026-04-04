import React from "react";

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

export function Tooltip({ text, children }: TooltipProps) {
  return (
    <span className="relative group inline-flex items-center">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
          w-max max-w-55 rounded-sm px-2.5 py-1.5 text-xs font-mono
          bg-(--surface-2) text-(--text-primary) border border-(--border)
          opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-normal text-center
          shadow-lg"
      >
        {text}
      </span>
    </span>
  );
}
