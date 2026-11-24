import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  MAX_BULK,
  MAX_CODE_LENGTH,
  alphabet,
  combinations,
  generateRandom,
  type Analysis,
  type LabelMode,
  type RandomOptions,
  type Separator,
} from "../../lib/bulk";
import type { FrameStyle, QRStyle } from "../../lib/design";
import { FORMATS } from "../../lib/export";
import { FRAMES } from "../../lib/frames";
import type { BulkApi } from "../../hooks/useBulk";
import {
  Button,
  Chip,
  Field,
  Segmented,
  Switch,
  cx,
  inputCls,
} from "../ui/controls";
import { Icon } from "../ui/Icon";
import { useToast } from "../ui/Toast";

const BULK_SIZES = [256, 512, 1024, 2048];
const PREVIEW = 6;

// ── Step 1: where the codes come from ───────────────────────────────────────

export function BulkSource({ bulk, qr }: { bulk: BulkApi; qr: QRStyle }) {
  const toast = useToast();
  const s = bulk.settings;
  const info = useMemo(() => bulk.analysisFor(qr), [bulk, qr]);
  const { items, error } = bulk;

  const copyValues = async () => {
    try {
      await navigator.clipboard.writeText(items.map((i) => i.data).join("\n"));
      toast(`${items.length} values copied`);
    } catch {
      toast("Couldn't copy", "error");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Segmented
        label="Bulk source"
        value={s.source}
        onChange={(source) => bulk.set({ source })}
        options={[
          { value: "random", label: "Random codes", icon: "dice" },
          { value: "list", label: "From a list", icon: "text" },
        ]}
      />

      {s.source === "random" ? (
        <RandomForm ro={s.random} patch={bulk.setRandom} />
      ) : (
        <ListForm
          text={s.text}
          setText={(text) => bulk.set({ text })}
          sep={s.sep}
          setSep={(sep) => bulk.set({ sep })}
          count={bulk.parsedCount}
        />
      )}

      <DuplicateNotice
        info={info}
        unique={bulk.unique}
        onUnique={(v) =>
          s.source === "random"
            ? bulk.setRandom({ unique: v })
            : bulk.set({ uniqueList: v })
        }
        removed={bulk.removed}
      />

      {info.tooLong.length > 0 && (
        <Notice tone="warn">
          {info.tooLong.length} value{info.tooLong.length > 1 && "s"} too long
          for a QR at this error-correction level — they will be skipped.
        </Notice>
      )}
      {error && <Notice tone="danger">{error}</Notice>}

      {items.length > 0 && !error && (
        <div className="rounded-xl border border-line bg-surface-2/50 p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[12.5px] text-muted">
              <b className="text-fg tabular-nums">
                {items.length.toLocaleString()}
              </b>{" "}
              code{items.length > 1 && "s"} · preview shows #1
            </span>
            <div className="flex gap-1">
              {s.source === "random" && (
                <Button
                  size="sm"
                  variant="ghost"
                  icon="refresh"
                  onClick={bulk.regenerate}
                  disabled={bulk.running}
                >
                  Regenerate
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                icon="copy"
                onClick={copyValues}
              >
                Copy
              </Button>
            </div>
          </div>
          <ul className="font-mono text-[12px] text-fg/90 space-y-0.5">
            {items.slice(0, PREVIEW).map((v, i) => (
              <li key={i} className="truncate">
                <span className="text-subtle tabular-nums mr-2">{i + 1}.</span>
                {v.data}
              </li>
            ))}
            {items.length > PREVIEW && (
              <li className="text-subtle">
                … {(items.length - PREVIEW).toLocaleString()} more
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Step 4: frame text, format and the ZIP ──────────────────────────────────

const LABEL_MODES: { value: LabelMode; label: string; hint: string }[] = [
  {
    value: "value",
    label: "Its code",
    hint: "Each QR shows its own code on the frame.",
  },
  {
    value: "design",
    label: "Same text",
    hint: "Every QR shows the text you set in the Frame step.",
  },
  { value: "none", label: "No text", hint: "Keep the frame, drop all text." },
  { value: "bare", label: "QR only", hint: "No frame — just the code." },
];

export function BulkOutput({
  bulk,
  qr,
  frame,
  baseName,
}: {
  bulk: BulkApi;
  qr: QRStyle;
  frame: FrameStyle;
  baseName: string;
}) {
  const s = bulk.settings;
  const { progress } = bulk;
  const raster = s.format !== "svg";
  const n = bulk.items.length;
  const heavy = raster && s.width >= 2048 && n > 500;
  const ext = FORMATS.find((f) => f.id === s.format)!.ext;
  const frameDef = FRAMES.find((f) => f.id === frame.id);
  const hasFrame = frame.id !== "none";
  const slotOk = s.labelSlot === "label" || !!frameDef?.usesSub;

  return (
    <div className="flex flex-col gap-5">
      <Field
        label="Text on each QR"
        hint={
          !hasFrame && s.labelMode !== "bare"
            ? "Your design has no frame, so there's no text. Pick a frame in step 3 to show each code under its QR."
            : LABEL_MODES.find((m) => m.value === s.labelMode)!.hint
        }
      >
        <Segmented
          label="Text on each QR"
          size="sm"
          value={s.labelMode}
          onChange={(labelMode) => bulk.set({ labelMode })}
          options={LABEL_MODES.map(({ value, label }) => ({ value, label }))}
        />
      </Field>

      {s.labelMode === "value" && hasFrame && (
        <Field
          label="Show the code as"
          hint={
            slotOk
              ? s.labelSlot === "label"
                ? "Replaces the main label. The small print stays as designed."
                : "Replaces the small print. The main label stays as designed."
              : "This frame has no small print — pick another frame or use the title."
          }
        >
          <Segmented
            label="Show the code as"
            size="sm"
            value={s.labelSlot}
            onChange={(labelSlot) => bulk.set({ labelSlot })}
            options={[
              { value: "label", label: "Title" },
              { value: "sub", label: "Small print" },
            ]}
          />
        </Field>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Format">
          <Segmented
            label="Bulk format"
            size="sm"
            value={s.format}
            onChange={(format) => bulk.set({ format })}
            options={FORMATS.map((f) => ({ value: f.id, label: f.label }))}
          />
        </Field>
        <Field label="Size">
          <div className={cx(!raster && "opacity-40 pointer-events-none")}>
            <Segmented
              label="Bulk width"
              size="sm"
              value={String(s.width)}
              onChange={(v) => bulk.set({ width: Number(v) })}
              options={BULK_SIZES.map((w) => ({
                value: String(w),
                label: w >= 1024 ? `${w / 1024}K` : `${w}`,
              }))}
            />
          </div>
        </Field>
      </div>

      <Field
        label="File names"
        hint={`${s.nameMode === "index" ? `${baseName}-0001` : "0001-<value>"}.${ext} · a manifest.csv maps each file to its data`}
      >
        <Segmented
          label="File names"
          size="sm"
          value={s.nameMode}
          onChange={(nameMode) => bulk.set({ nameMode })}
          options={[
            { value: "index-value", label: "Number + value" },
            { value: "index", label: "Number only" },
          ]}
        />
      </Field>

      {heavy && (
        <Notice tone="info">
          Large batch at 2K — this can take a few minutes and a lot of memory.
          512 or 1K is plenty for most prints up to ~10 cm.
        </Notice>
      )}
      {bulk.error && <Notice tone="danger">{bulk.error}</Notice>}

      <AnimatePresence mode="wait" initial={false}>
        {progress ? (
          <motion.div
            key="progress"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center justify-between text-[12.5px] text-muted">
              <span>
                {progress.phase === "zip"
                  ? "Packing ZIP…"
                  : `Rendering ${progress.done.toLocaleString()} / ${progress.total.toLocaleString()}`}
              </span>
              <span className="font-mono tabular-nums">
                {Math.round((progress.done / progress.total) * 100)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-surface-3 overflow-hidden">
              <motion.div
                className="h-full bg-accent rounded-full"
                animate={{
                  width: `${(progress.done / progress.total) * 100}%`,
                }}
                transition={{ ease: "linear", duration: 0.1 }}
              />
            </div>
            <Button variant="danger" size="md" icon="x" onClick={bulk.cancel}>
              Cancel
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="go"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            <Button
              variant="primary"
              size="lg"
              icon="download"
              className="w-full"
              onClick={() => bulk.run(qr, frame, baseName)}
              disabled={!bulk.ready}
            >
              Download ZIP{bulk.ready ? ` · ${n.toLocaleString()} codes` : ""}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Pieces ──────────────────────────────────────────────────────────────────

function NumberInput({
  id,
  value,
  min,
  max,
  onChange,
}: {
  id: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = (s: string) => {
    const n = Math.round(Number(s));
    const v = Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : value;
    setDraft(String(v));
    if (v !== value) onChange(v);
  };
  return (
    <input
      id={id}
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
        const n = Number(e.target.value);
        if (e.target.value !== "" && n >= min && n <= max)
          onChange(Math.round(n));
      }}
      onBlur={(e) => commit(e.target.value)}
      className={cx(inputCls, "h-10 font-mono tabular-nums")}
    />
  );
}

function RandomForm({
  ro,
  patch,
}: {
  ro: RandomOptions;
  patch: (q: Partial<RandomOptions>) => void;
}) {
  const chars = alphabet(ro);
  const combos = combinations(ro);
  const sample = useMemo(
    () => generateRandom({ ...ro, count: 1, unique: false }).codes[0] ?? "",
    [ro],
  );
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Quantity"
          htmlFor="bulk-count"
          hint={`Max ${MAX_BULK.toLocaleString()}`}
        >
          <NumberInput
            id="bulk-count"
            value={ro.count}
            min={1}
            max={MAX_BULK}
            onChange={(count) => patch({ count })}
          />
        </Field>
        <Field label="Length" htmlFor="bulk-length" hint="Characters per code">
          <NumberInput
            id="bulk-length"
            value={ro.length}
            min={1}
            max={MAX_CODE_LENGTH}
            onChange={(length) => patch({ length })}
          />
        </Field>
      </div>

      <Field
        label="Characters"
        hint={
          chars.length
            ? `${chars.length} characters · ${combos > 1e15 ? "virtually unlimited" : combos.toLocaleString()} combinations`
            : undefined
        }
      >
        <div className="flex flex-wrap gap-1.5">
          <Chip active={ro.upper} onClick={() => patch({ upper: !ro.upper })}>
            A–Z
          </Chip>
          <Chip active={ro.lower} onClick={() => patch({ lower: !ro.lower })}>
            a–z
          </Chip>
          <Chip
            active={ro.digits}
            onClick={() => patch({ digits: !ro.digits })}
          >
            0–9
          </Chip>
          <Chip
            active={ro.symbols}
            onClick={() => patch({ symbols: !ro.symbols })}
          >
            Symbols
          </Chip>
        </div>
      </Field>

      {ro.symbols && (
        <Field label="Symbols to use" htmlFor="bulk-symbols">
          <input
            id="bulk-symbols"
            value={ro.symbolChars}
            onChange={(e) => patch({ symbolChars: e.target.value })}
            className={cx(inputCls, "h-10 font-mono")}
            spellCheck={false}
            placeholder="-_.~!*"
          />
        </Field>
      )}

      <Switch
        label="Unique codes only"
        description="Never repeat a code within the batch"
        checked={ro.unique}
        onChange={(unique) => patch({ unique })}
      />
      <Switch
        label="Skip look-alike characters"
        description="Leaves out 0 O o I l 1 | so codes are easy to read and type"
        checked={ro.noAmbiguous}
        onChange={(noAmbiguous) => patch({ noAmbiguous })}
      />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Prefix" htmlFor="bulk-prefix">
          <input
            id="bulk-prefix"
            value={ro.prefix}
            onChange={(e) => patch({ prefix: e.target.value })}
            className={cx(inputCls, "h-10 font-mono text-[13.5px]")}
            placeholder="https://site.com/c/"
            spellCheck={false}
          />
        </Field>
        <Field label="Suffix" htmlFor="bulk-suffix">
          <input
            id="bulk-suffix"
            value={ro.suffix}
            onChange={(e) => patch({ suffix: e.target.value })}
            className={cx(inputCls, "h-10 font-mono text-[13.5px]")}
            placeholder="optional"
            spellCheck={false}
          />
        </Field>
      </div>
      {sample && (
        <p className="-mt-2 text-[12px] text-subtle truncate">
          Example: <span className="font-mono text-fg">{sample}</span>
        </p>
      )}
    </>
  );
}

function ListForm({
  text,
  setText,
  sep,
  setSep,
  count,
}: {
  text: string;
  setText: (s: string) => void;
  sep: Separator;
  setSep: (s: Separator) => void;
  count: number;
}) {
  return (
    <>
      <Field
        label="Values"
        htmlFor="bulk-list"
        aside={
          <span className="text-[12px] text-subtle tabular-nums">
            {count.toLocaleString()} / {MAX_BULK.toLocaleString()}
          </span>
        }
      >
        <textarea
          id="bulk-list"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={7}
          placeholder={
            "https://example.com/a\nhttps://example.com/b\nTICKET-0003"
          }
          className={cx(
            inputCls,
            "py-2.5 font-mono text-[13px] leading-relaxed resize-y",
          )}
          spellCheck={false}
        />
      </Field>
      <Field
        label="Split by"
        hint={
          sep === "lines"
            ? "One QR per line. Commas stay part of the value."
            : "Commas also separate values — don't use if your data contains commas."
        }
      >
        <Segmented
          label="Split by"
          size="sm"
          value={sep}
          onChange={setSep}
          options={[
            { value: "lines", label: "New lines" },
            { value: "lines-commas", label: "New lines & commas" },
          ]}
        />
      </Field>
    </>
  );
}

function DuplicateNotice({
  info,
  unique,
  onUnique,
  removed,
}: {
  info: Analysis;
  unique: boolean;
  onUnique: (v: boolean) => void;
  removed: number;
}) {
  const extra = info.total - info.unique;
  if (!extra && !removed) return null;
  const shown = info.duplicates.slice(0, 4);
  return (
    <div
      className={cx(
        "rounded-xl border p-3 flex flex-col gap-2.5",
        unique
          ? "border-line bg-surface-2/40"
          : "border-warn/30 bg-warn/[0.07]",
      )}
    >
      <div className="flex gap-2.5">
        <Icon
          name={unique ? "check" : "alert"}
          size={16}
          className={cx(
            "mt-0.5 shrink-0",
            unique ? "text-success" : "text-warn",
          )}
        />
        <div className="min-w-0 text-[12.5px]">
          <p className="font-semibold text-fg">
            {unique
              ? removed
                ? `${removed.toLocaleString()} duplicate${removed > 1 ? "s" : ""} removed`
                : "All codes are unique"
              : `${extra.toLocaleString()} repeated value${extra > 1 ? "s" : ""}`}
          </p>
          {!unique && (
            <ul className="mt-1 font-mono text-muted space-y-0.5">
              {shown.map(([v, n]) => (
                <li key={v} className="truncate">
                  <span className="text-warn">×{n}</span> {v}
                </li>
              ))}
              {info.duplicates.length > shown.length && (
                <li className="text-subtle">
                  … {info.duplicates.length - shown.length} more
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
      <Switch
        label="Make every code unique"
        description="Drop repeats so each QR is different"
        checked={unique}
        onChange={onUnique}
      />
    </div>
  );
}

function Notice({
  tone,
  children,
}: {
  tone: "warn" | "danger" | "info";
  children: ReactNode;
}) {
  return (
    <p
      className={cx(
        "flex gap-2 rounded-xl border px-3 py-2.5 text-[12.5px] text-pretty",
        tone === "danger" && "border-danger/30 bg-danger/[0.07] text-danger",
        tone === "warn" && "border-warn/30 bg-warn/[0.07] text-fg",
        tone === "info" && "border-line bg-surface-2/40 text-muted",
      )}
      role={tone === "danger" ? "alert" : undefined}
    >
      <Icon
        name={tone === "info" ? "info" : "alert"}
        size={15}
        className={cx(
          "mt-px shrink-0",
          tone === "warn" && "text-warn",
          tone === "info" && "text-accent",
        )}
      />
      <span>{children}</span>
    </p>
  );
}
