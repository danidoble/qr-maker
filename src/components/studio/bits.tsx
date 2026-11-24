import { AnimatePresence, motion } from "motion/react";
import { memo, type CSSProperties, type ReactNode } from "react";
import type { ScanStatus } from "../../lib/scan";
import type { IconName } from "../../lib/icons";
import { Icon } from "../ui/Icon";
import { cx } from "../ui/controls";

/** Renders a composed SVG string inline (so page fonts apply). */
export const SvgView = memo(function SvgView({
  svg,
  className,
  style,
}: {
  svg: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cx("qr-svg", className)}
      style={style}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
});

export function StepHeader({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-6">
      <p className="font-mono text-[11.5px] uppercase tracking-[0.18em] text-accent mb-2">
        Step {step} of 4
      </p>
      <h2 className="font-display text-[28px] sm:text-[32px] leading-[1.05] font-bold tracking-tight text-fg text-balance">
        {title}
      </h2>
      {children && (
        <p className="mt-2 text-[14.5px] text-muted text-pretty">{children}</p>
      )}
    </header>
  );
}

const SCAN: Record<ScanStatus, { icon: IconName; text: string; tone: string }> =
  {
    idle: { icon: "scan", text: "Waiting for content", tone: "text-subtle" },
    checking: { icon: "scan", text: "Checking scan…", tone: "text-muted" },
    ok: { icon: "shield", text: "Scan verified", tone: "text-success" },
    mismatch: { icon: "alert", text: "Reads wrong data", tone: "text-danger" },
    fail: { icon: "alert", text: "Hard to scan", tone: "text-warn" },
  };

export function ScanBadge({
  status,
  className,
}: {
  status: ScanStatus;
  className?: string;
}) {
  const s = SCAN[status];
  return (
    <div
      className={cx(
        "inline-flex items-center gap-2 h-8 pl-2.5 pr-3 rounded-full border border-line bg-surface/80 backdrop-blur text-[12.5px] font-medium",
        s.tone,
        className,
      )}
      title={
        status === "fail"
          ? "Our decoder couldn't read it. Try more contrast, a simpler dot style, a smaller logo or a higher error correction."
          : status === "ok"
            ? "We rendered your design and decoded it successfully."
            : undefined
      }
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={status}
          initial={{ scale: 0.4, opacity: 0, rotate: -30 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.4, opacity: 0 }}
          transition={{ type: "spring", stiffness: 600, damping: 28 }}
          className="relative grid place-items-center"
        >
          {status === "checking" ? (
            <motion.span
              className="block size-3.5 rounded-full border-2 border-current border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
            />
          ) : (
            <Icon name={s.icon} size={15} stroke={2.1} />
          )}
        </motion.span>
      </AnimatePresence>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={status}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
        >
          {s.text}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

/** Little QR-module confetti, fired after a download. */
export function Burst({
  trigger,
  color = "var(--accent)",
}: {
  trigger: number;
  color?: string;
}) {
  if (!trigger) return null;
  const bits = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2 + (trigger % 7) * 0.2;
    const d = 70 + ((i * 37) % 50);
    return {
      x: Math.cos(a) * d,
      y: Math.sin(a) * d * 0.7 - 20,
      r: ((i * 53) % 180) - 90,
      s: 6 + (i % 3) * 3,
      round: i % 3 === 0,
    };
  });
  return (
    <span
      key={trigger}
      className="pointer-events-none absolute inset-0 grid place-items-center overflow-visible"
      aria-hidden
    >
      {bits.map((b, i) => (
        <motion.span
          key={i}
          className="absolute"
          style={{
            width: b.s,
            height: b.s,
            background: i % 4 === 0 ? "var(--success)" : color,
            borderRadius: b.round ? 99 : 2,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.4, rotate: 0 }}
          animate={{ x: b.x, y: b.y, opacity: 0, scale: 1, rotate: b.r }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </span>
  );
}

/** Animated logo mark: a mini finder pattern that "assembles". */
export function LogoMark({ size = 30 }: { size?: number }) {
  const cells = [0, 1, 2, 3, 5, 6, 7, 8];
  return (
    <span
      className="relative grid place-items-center rounded-[10px] bg-accent"
      style={{ width: size, height: size }}
    >
      <span
        className="grid grid-cols-3 gap-[2px]"
        style={{ width: size * 0.56 }}
      >
        {Array.from({ length: 9 }, (_, i) => (
          <motion.span
            key={i}
            className="aspect-square rounded-[2px] bg-on-accent"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: cells.includes(i) ? 1 : 0.55, opacity: 1 }}
            transition={{
              delay: 0.15 + i * 0.045,
              type: "spring",
              stiffness: 500,
              damping: 20,
            }}
          />
        ))}
      </span>
    </span>
  );
}
