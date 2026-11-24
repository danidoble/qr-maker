import { AnimatePresence, motion, type HTMLMotionProps } from "motion/react";
import { useEffect, useId, useState, type ReactNode } from "react";
import { isHex } from "../../lib/color";
import type { IconName } from "../../lib/icons";
import { Icon } from "./Icon";

export const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

// ── Button ──────────────────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  icon?: IconName;
  iconRight?: IconName;
  children?: ReactNode;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-on-accent hover:bg-accent-strong shadow-[0_8px_24px_-8px_var(--accent)]",
  secondary:
    "bg-surface-2 text-fg border border-line hover:border-line-strong hover:bg-surface-3",
  ghost: "text-muted hover:text-fg hover:bg-surface-2",
  danger: "text-danger hover:bg-danger/10",
};

const SIZES = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-5 text-[15px] gap-2.5 rounded-2xl",
};

export function Button({
  variant = "secondary",
  size = "md",
  icon,
  iconRight,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <motion.button
      type="button"
      whileTap={rest.disabled ? undefined : { scale: 0.97 }}
      className={cx(
        "relative inline-flex items-center justify-center font-medium whitespace-nowrap select-none transition-colors",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === "lg" ? 19 : 16} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === "lg" ? 19 : 16} />}
    </motion.button>
  );
}

export function IconButton({
  icon,
  label,
  className,
  ...rest
}: { icon: IconName; label: string } & Omit<
  HTMLMotionProps<"button">,
  "children"
>) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      whileTap={rest.disabled ? undefined : { scale: 0.9 }}
      className={cx(
        "grid place-items-center size-9 rounded-xl text-muted hover:text-fg hover:bg-surface-2 transition-colors disabled:opacity-30 disabled:pointer-events-none",
        className,
      )}
      {...rest}
    >
      <Icon name={icon} size={17} />
    </motion.button>
  );
}

// ── Labels & fields ─────────────────────────────────────────────────────────

export function Label({
  children,
  htmlFor,
  aside,
}: {
  children: ReactNode;
  htmlFor?: string;
  aside?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 min-h-5">
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-muted">
        {children}
      </label>
      {aside}
    </div>
  );
}

export const inputCls =
  "w-full rounded-xl border border-line bg-surface-2 px-3.5 text-[15px] text-fg placeholder:text-subtle " +
  "outline-none transition-[border-color,box-shadow] hover:border-line-strong " +
  "focus:border-accent focus:shadow-[0_0_0_4px_var(--accent-soft)]";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  aside,
  children,
  className,
}: {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string | null;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor} aside={aside}>
        {label}
      </Label>
      {children}
      <AnimatePresence initial={false} mode="popLayout">
        {error ? (
          <motion.p
            key="err"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-[12.5px] text-danger flex items-center gap-1.5"
            role="alert"
          >
            <Icon name="alert" size={13} />
            {error}
          </motion.p>
        ) : hint ? (
          <motion.p
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-[12.5px] text-subtle"
          >
            {hint}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// ── Segmented control ───────────────────────────────────────────────────────

export interface SegOption<T extends string> {
  value: T;
  label: ReactNode;
  icon?: IconName;
  title?: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  size = "md",
  className,
}: {
  options: SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const id = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cx(
        "relative flex p-1 rounded-xl bg-surface-2 border border-line",
        className,
      )}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={cx(
              "relative flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors",
              size === "sm" ? "h-7 text-[12.5px] px-2" : "h-8 text-[13px] px-3",
              active ? "text-fg" : "text-muted hover:text-fg",
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-lg bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.15),0_0_0_1px_var(--line-strong)]"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative inline-flex items-center gap-1.5">
              {o.icon && <Icon name={o.icon} size={14} />}
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Tile grid (visual radio) ────────────────────────────────────────────────

export function TileGrid<T extends string>({
  options,
  value,
  onChange,
  label,
  columns = 4,
  render,
  className,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  columns?: number;
  render: (v: T, active: boolean) => ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cx("grid gap-2", className)}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <motion.button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={o.label}
            onClick={() => onChange(o.value)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            className={cx(
              "group relative flex flex-col items-center gap-1.5 rounded-xl p-2 pb-1.5 border transition-colors",
              active
                ? "border-transparent text-fg"
                : "border-line bg-surface-2/60 text-muted hover:text-fg hover:border-line-strong",
            )}
          >
            {active && (
              <motion.span
                layoutId={`tile-${id}`}
                className="absolute inset-0 rounded-xl bg-accent-soft ring-2 ring-accent"
                transition={{ type: "spring", stiffness: 480, damping: 36 }}
              />
            )}
            <span className="relative w-full">{render(o.value, active)}</span>
            <span className="relative text-[11px] font-medium leading-none truncate max-w-full">
              {o.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ── Switch ──────────────────────────────────────────────────────────────────

export function Switch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4">
      <label htmlFor={id} className="flex flex-col cursor-pointer">
        <span className="text-[14px] text-fg">{label}</span>
        {description && (
          <span className="text-[12.5px] text-subtle">{description}</span>
        )}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx(
          "relative shrink-0 h-6 w-11 rounded-full p-0.5 flex transition-colors",
          checked ? "bg-accent justify-end" : "bg-surface-3 justify-start",
        )}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 700, damping: 40 }}
          className="size-5 rounded-full bg-white shadow"
        />
      </button>
    </div>
  );
}

// ── Slider ──────────────────────────────────────────────────────────────────

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format = (v) => String(v),
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  hint?: string;
}) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex flex-col gap-1">
      <Label
        htmlFor={id}
        aside={
          <span className="font-mono text-[12px] text-fg tabular-nums">
            {format(value)}
          </span>
        }
      >
        {label}
      </Label>
      <input
        id={id}
        type="range"
        className="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ["--fill" as string]: `${pct}%` }}
      />
      {hint && <p className="text-[12px] text-subtle">{hint}</p>}
    </div>
  );
}

// ── Color field ─────────────────────────────────────────────────────────────

export function ColorField({
  label,
  value,
  onChange,
  swatches,
  allowNone,
  compact,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  swatches?: string[];
  /** Adds a "transparent" option; value becomes "none". */
  allowNone?: boolean;
  compact?: boolean;
}) {
  const id = useId();
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const none = value === "none";

  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2 h-10 rounded-xl border border-line bg-surface-2 pl-1.5 pr-2 focus-within:border-accent focus-within:shadow-[0_0_0_4px_var(--accent-soft)] transition-[border-color,box-shadow]">
        <span
          className={cx(
            "relative size-7 shrink-0 rounded-lg overflow-hidden ring-1 ring-line-strong",
            none && "checker",
          )}
        >
          <input
            type="color"
            className="swatch absolute -inset-1 size-9"
            value={isHex(value) ? value : "#ffffff"}
            onChange={(e) => onChange(e.target.value)}
            aria-label={`${label} picker`}
            style={{ opacity: none ? 0 : 1 }}
          />
        </span>
        <input
          id={id}
          value={none ? "Transparent" : text}
          spellCheck={false}
          readOnly={none}
          onFocus={() => {
            if (none) onChange("#ffffff");
          }}
          onChange={(e) => {
            const v = e.target.value.startsWith("#")
              ? e.target.value
              : "#" + e.target.value;
            setText(v);
            if (isHex(v)) onChange(v.toLowerCase());
          }}
          onBlur={() => setText(value)}
          className="min-w-0 flex-1 bg-transparent font-mono text-[13px] uppercase text-fg outline-none"
          maxLength={7}
        />
        {allowNone && (
          <button
            type="button"
            onClick={() => onChange(none ? "#ffffff" : "none")}
            title={none ? "Use a color" : "Make transparent"}
            className={cx(
              "size-6 grid place-items-center rounded-md transition-colors",
              none ? "text-accent bg-accent-soft" : "text-subtle hover:text-fg",
            )}
          >
            <Icon name="slash" size={14} />
          </button>
        )}
      </div>
      {swatches && !compact && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {swatches.map((c) => (
            <motion.button
              key={c}
              type="button"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onChange(c)}
              aria-label={`Use ${c}`}
              className={cx(
                "size-5 rounded-full ring-1 ring-line-strong",
                value.toLowerCase() === c &&
                  "ring-2 ring-accent ring-offset-2 ring-offset-surface",
              )}
              style={{ background: c }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Collapsible section ─────────────────────────────────────────────────────

export function Section({
  title,
  icon,
  summary,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon?: IconName;
  summary?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <section className="rounded-2xl border border-line bg-surface/60">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 h-14 text-left"
      >
        {icon && (
          <span className="grid place-items-center size-8 rounded-lg bg-surface-2 text-muted">
            <Icon name={icon} size={16} />
          </span>
        )}
        <span className="flex-1 min-w-0">
          <span className="block text-[14.5px] font-semibold text-fg">
            {title}
          </span>
          {summary && !open && (
            <span className="block text-[12px] text-subtle truncate">
              {summary}
            </span>
          )}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          className="text-subtle"
        >
          <Icon name="chevronDown" size={18} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 40 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 flex flex-col gap-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export function Chip({
  children,
  onClick,
  active,
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cx(
        "h-7 px-2.5 rounded-full text-[12.5px] border transition-colors max-w-full truncate",
        active
          ? "bg-accent-soft border-accent text-fg"
          : "border-line text-muted hover:text-fg hover:border-line-strong",
      )}
    >
      {children}
    </motion.button>
  );
}
