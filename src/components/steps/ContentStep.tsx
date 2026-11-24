import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";
import {
  CONTENT_TYPES,
  fieldKey,
  typeFields,
  type FieldDef,
  type ResolvedContent,
} from "../../lib/content";
import type { Design } from "../../lib/design";
import type { QRMatrix } from "../../lib/qr/encode";
import { BYTE_CAPACITY } from "../../lib/qr/encode";
import { resolveEC } from "../../lib/design";
import type { DesignApi } from "../../hooks/useDesign";
import type { BulkApi } from "../../hooks/useBulk";
import { BulkSource } from "./Bulk";
import { Field, Segmented, Switch, cx, inputCls } from "../ui/controls";
import { Icon } from "../ui/Icon";
import { useToast } from "../ui/Toast";
import { StepHeader } from "../studio/bits";

interface Props {
  design: Design;
  api: DesignApi;
  resolved: ResolvedContent;
  matrix: QRMatrix | null;
  showErrors: boolean;
  onTypeChange: (t: Design["content"]["type"]) => void;
  bulk: BulkApi;
}

export function ContentStep(p: Props) {
  const { bulk } = p;
  const on = bulk.settings.enabled;
  return (
    <div>
      <StepHeader
        step={1}
        title={on ? "Which codes do you need?" : "What should your QR open?"}
      >
        {on
          ? "Generate random codes or paste your own list. They all get the design you build in the next steps."
          : "Pick a type and fill in the details. The preview updates as you type."}
      </StepHeader>

      <Segmented
        label="How many QR codes"
        className="mb-5"
        value={on ? "bulk" : "single"}
        onChange={(v) => bulk.set({ enabled: v === "bulk" })}
        options={[
          { value: "single", label: "One QR", icon: "scan" },
          { value: "bulk", label: "Many QRs (bulk)", icon: "grid" },
        ]}
      />

      {on ? (
        <BulkSource bulk={bulk} qr={p.design.qr} />
      ) : (
        <SingleContent {...p} />
      )}
    </div>
  );
}

function SingleContent({
  design,
  api,
  resolved,
  matrix,
  showErrors,
  onTypeChange,
}: Props) {
  const type = design.content.type;
  const fields = typeFields(type, design.content.fields);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const groupId = useId();

  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Content type"
        className="grid grid-cols-5 gap-1.5 mb-6"
      >
        {CONTENT_TYPES.map((t, i) => {
          const active = t.id === type;
          return (
            <motion.button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => {
                onTypeChange(t.id);
                setTouched({});
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.025 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.94 }}
              className={cx(
                "relative flex flex-col items-center justify-center gap-1.5 h-[68px] rounded-xl border text-[11.5px] font-medium transition-colors",
                active
                  ? "border-transparent text-fg"
                  : "border-line text-muted hover:text-fg hover:border-line-strong bg-surface-2/50",
              )}
              title={t.tagline}
            >
              {active && (
                <motion.span
                  layoutId={`type-${groupId}`}
                  className="absolute inset-0 rounded-xl bg-accent-soft ring-2 ring-accent"
                  transition={{ type: "spring", stiffness: 480, damping: 36 }}
                />
              )}
              <Icon
                name={t.icon}
                size={19}
                className={cx("relative", active && "text-accent")}
              />
              <span className="relative leading-none">{t.label}</span>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={type}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-2 gap-x-3 gap-y-4"
        >
          <div className="col-span-2 -mb-1 flex items-center gap-2 text-[13px] text-subtle">
            <span className="grid place-items-center size-6 rounded-md bg-surface-2 text-muted">
              <Icon name={resolved.def.icon} size={14} />
            </span>
            {resolved.def.tagline}
          </div>
          {resolved.def.fields.map((f) => (
            <FieldInput
              key={f.key}
              def={f}
              value={fields[f.key] ?? ""}
              error={
                (touched[f.key] || showErrors) && resolved.errors[f.key]
                  ? resolved.errors[f.key]
                  : null
              }
              onChange={(v) => api.setField(fieldKey(type, f.key), v)}
              onBlur={() => setTouched((t) => ({ ...t, [f.key]: true }))}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      <Payload resolved={resolved} matrix={matrix} ec={resolveEC(design.qr)} />
    </div>
  );
}

function FieldInput({
  def,
  value,
  error,
  onChange,
  onBlur,
}: {
  def: FieldDef;
  value: string;
  error: string | null;
  onChange: (v: string) => void;
  onBlur: () => void;
}) {
  const id = useId();
  const [reveal, setReveal] = useState(false);
  const span = def.half ? "col-span-2 sm:col-span-1" : "col-span-2";
  const invalid = error
    ? "!border-danger focus:!shadow-[0_0_0_4px_rgb(255_107_107/0.15)]"
    : "";

  if (def.kind === "toggle") {
    return (
      <div className={span}>
        <Switch
          checked={value === "true"}
          onChange={(v) => onChange(v ? "true" : "false")}
          label={def.label}
        />
      </div>
    );
  }

  if (def.kind === "choice" && def.options) {
    return (
      <Field label={def.label} className={span}>
        <Segmented
          label={def.label}
          options={def.options}
          value={value || def.options[0].value}
          onChange={onChange}
        />
      </Field>
    );
  }

  const label = (
    <>
      {def.label}
      {def.required && <span className="text-accent ml-0.5">*</span>}
    </>
  );

  if (def.kind === "textarea") {
    return (
      <Field
        label={label}
        htmlFor={id}
        hint={def.hint}
        error={error}
        className={span}
      >
        <textarea
          id={id}
          value={value}
          rows={3}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={def.placeholder}
          className={cx(inputCls, "py-2.5 resize-y min-h-24", invalid)}
        />
      </Field>
    );
  }

  const type =
    def.kind === "password"
      ? reveal
        ? "text"
        : "password"
      : def.kind === "datetime"
        ? "datetime-local"
        : def.kind === "url"
          ? "url"
          : def.kind;

  return (
    <Field
      label={label}
      htmlFor={id}
      hint={def.hint}
      error={error}
      className={span}
    >
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          inputMode={
            def.kind === "tel"
              ? "tel"
              : def.kind === "url"
                ? "url"
                : def.kind === "email"
                  ? "email"
                  : undefined
          }
          autoComplete={def.autoComplete ?? "off"}
          autoCapitalize={
            def.kind === "url" || def.kind === "email" ? "none" : undefined
          }
          spellCheck={def.kind === "text"}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={def.placeholder}
          className={cx(
            inputCls,
            "h-11",
            def.kind === "password" && "pr-11",
            invalid,
          )}
        />
        {def.kind === "password" && (
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            className="absolute right-1.5 top-1.5 size-8 grid place-items-center rounded-lg text-subtle hover:text-fg"
            aria-label={reveal ? "Hide password" : "Show password"}
          >
            <Icon name={reveal ? "eyeOff" : "eye"} size={16} />
          </button>
        )}
      </div>
    </Field>
  );
}

function Payload({
  resolved,
  matrix,
  ec,
}: {
  resolved: ResolvedContent;
  matrix: QRMatrix | null;
  ec: keyof typeof BYTE_CAPACITY;
}) {
  const [open, setOpen] = useState(false);
  const toast = useToast();
  const bytes = new TextEncoder().encode(resolved.data).length;
  const pct = Math.min(100, (bytes / BYTE_CAPACITY[ec]) * 100);
  const density = !matrix
    ? "—"
    : matrix.version <= 6
      ? "Light"
      : matrix.version <= 12
        ? "Medium"
        : matrix.version <= 20
          ? "Dense"
          : "Very dense";
  if (!resolved.valid) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-6 rounded-2xl border border-line bg-surface/60 overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-[12.5px]">
            <span className="text-muted">
              Encoded data · <span className="text-fg">{density}</span>
            </span>
            <span className="font-mono text-subtle tabular-nums">
              {bytes} B
            </span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-surface-3 overflow-hidden">
            <motion.div
              className={cx(
                "h-full rounded-full",
                pct > 60 ? "bg-warn" : "bg-accent",
              )}
              animate={{ width: `${Math.max(2, pct)}%` }}
              transition={{ type: "spring", stiffness: 200, damping: 30 }}
            />
          </div>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          className="text-subtle"
        >
          <Icon name="chevronDown" size={16} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <pre className="max-h-40 overflow-auto rounded-xl bg-surface-2 border border-line p-3 font-mono text-[12px] text-muted whitespace-pre-wrap break-all">
                {resolved.data}
              </pre>
              <div className="mt-2 flex items-center justify-between text-[12px] text-subtle">
                <span>Shorter content → bigger, easier-to-scan modules.</span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-muted hover:text-fg"
                  onClick={() =>
                    navigator.clipboard
                      ?.writeText(resolved.data)
                      .then(() => toast("Copied raw data"))
                  }
                >
                  <Icon name="copy" size={13} /> Copy
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
