import { motion } from "motion/react";
import type { IconName } from "../../lib/icons";
import { Icon } from "../ui/Icon";
import { cx } from "../ui/controls";

export const STEPS: { id: string; label: string; icon: IconName }[] = [
  { id: "content", label: "Content", icon: "link" },
  { id: "style", label: "Style", icon: "palette" },
  { id: "frame", label: "Frame", icon: "frame" },
  { id: "export", label: "Export", icon: "download" },
];

export function Stepper({
  step,
  onGo,
}: {
  step: number;
  onGo: (i: number) => void;
}) {
  return (
    <nav aria-label="Steps" className="relative">
      <ol className="relative grid grid-cols-4 gap-1 p-1 rounded-2xl bg-surface-2/70 border border-line">
        {STEPS.map((s, i) => {
          const active = i === step;
          const done = i < step;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onGo(i)}
                aria-current={active ? "step" : undefined}
                className={cx(
                  "relative w-full h-11 rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 font-medium transition-colors",
                  active ? "text-fg" : "text-muted hover:text-fg",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="stepper-pill"
                    className="absolute inset-0 rounded-xl bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.2),0_0_0_1px_var(--line-strong)]"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span
                  className={cx(
                    "relative hidden min-[400px]:grid place-items-center size-5 rounded-full text-[11px] font-mono transition-colors",
                    active
                      ? "bg-accent text-on-accent"
                      : done
                        ? "bg-success/15 text-success"
                        : "bg-surface-3 text-muted",
                  )}
                >
                  {done ? <Icon name="check" size={12} stroke={3} /> : i + 1}
                </span>
                <span className="relative text-[12px] sm:text-[13px]">
                  {s.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
