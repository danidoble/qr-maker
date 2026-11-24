import { motion } from "motion/react";
import { useState } from "react";
import type { Composition } from "../../lib/compose";
import type { ResolvedContent } from "../../lib/content";
import type { FrameStyle, QRStyle } from "../../lib/design";
import { FORMATS, canShareFiles, type ExportFormat } from "../../lib/export";
import type { ScanStatus } from "../../lib/scan";
import { Button, Field, Segmented, cx, inputCls } from "../ui/controls";
import { Icon } from "../ui/Icon";
import { Burst, StepHeader } from "../studio/bits";
import type { BulkApi } from "../../hooks/useBulk";
import { BulkOutput } from "./Bulk";

export interface ExportSettings {
  format: ExportFormat;
  width: number;
  filename: string;
}

interface Props {
  settings: ExportSettings;
  onSettings: (p: Partial<ExportSettings>) => void;
  comp: Composition;
  qr: QRStyle;
  frame: FrameStyle;
  resolved: ResolvedContent;
  scan: ScanStatus;
  busy: boolean;
  burst: number;
  defaultName: string;
  onDownload: () => void;
  onCopy: () => void;
  onShare: () => void;
  onCopyLink: () => void;
  onNew: () => void;
  bulk: BulkApi;
  onBulk: () => void;
}

const SIZES = [512, 1024, 2048, 4096];

export function ExportStep(p: Props) {
  const { settings, comp, resolved, scan } = p;
  const [canShare] = useState(canShareFiles);
  const raster = settings.format !== "svg";
  const h = Math.round((comp.height / comp.width) * settings.width);
  const ext = FORMATS.find((f) => f.id === settings.format)!.ext;

  if (p.bulk.settings.enabled)
    return (
      <div>
        <StepHeader step={4} title="Ready to ship">
          {p.bulk.items.length.toLocaleString()} codes with this design, packed
          in one ZIP. Everything is generated right here in your browser —
          nothing is uploaded.
        </StepHeader>
        <ScanCard
          scan={resolved.valid ? scan : "idle"}
          resolved={resolved}
          note="Checked on code #1. Every code shares this design."
        />
        <div className="mt-5">
          <BulkOutput
            bulk={p.bulk}
            qr={p.qr}
            frame={p.frame}
            baseName={settings.filename.trim() || "qr"}
          />
        </div>
      </div>
    );

  return (
    <div>
      <StepHeader step={4} title="Ready to ship">
        Pick a format and download. Everything is generated right here in your
        browser.
      </StepHeader>

      <ScanCard scan={resolved.valid ? scan : "idle"} resolved={resolved} />

      <div className="flex flex-col gap-5 mt-5">
        <Field label="Format">
          <div
            role="radiogroup"
            aria-label="Format"
            className="grid grid-cols-2 gap-2"
          >
            {FORMATS.map((f) => {
              const active = f.id === settings.format;
              return (
                <motion.button
                  key={f.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => p.onSettings({ format: f.id })}
                  className={cx(
                    "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                    active
                      ? "border-accent ring-2 ring-accent bg-accent-soft"
                      : "border-line bg-surface-2/40 hover:border-line-strong",
                  )}
                >
                  <span
                    className={cx(
                      "grid place-items-center h-9 w-11 rounded-lg font-mono text-[11.5px] font-semibold",
                      active
                        ? "bg-accent text-on-accent"
                        : "bg-surface-3 text-muted",
                    )}
                  >
                    {f.label}
                  </span>
                  <span className="text-[12.5px] leading-tight text-muted">
                    {f.note}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </Field>

        <Field
          label="Size"
          hint={
            raster
              ? `${settings.width} × ${h} px — ${settings.width >= 2048 ? "print ready" : "screens & web"}`
              : "Vectors scale to any size without losing quality."
          }
        >
          <div className={cx(!raster && "opacity-40 pointer-events-none")}>
            <Segmented
              label="Export width"
              value={String(settings.width)}
              onChange={(v) => p.onSettings({ width: Number(v) })}
              options={SIZES.map((s) => ({
                value: String(s),
                label: s >= 1024 ? `${s / 1024}K` : `${s}`,
              }))}
            />
          </div>
        </Field>

        <Field label="File name" htmlFor="filename">
          <div className="flex items-center rounded-xl border border-line bg-surface-2 focus-within:border-accent focus-within:shadow-[0_0_0_4px_var(--accent-soft)] transition-[border-color,box-shadow]">
            <input
              id="filename"
              value={settings.filename}
              onChange={(e) =>
                p.onSettings({
                  filename: e.target.value.replace(/[\\/:*?"<>|]/g, ""),
                })
              }
              placeholder={p.defaultName}
              className={cx(
                inputCls,
                "h-11 border-0 bg-transparent focus:shadow-none",
              )}
              spellCheck={false}
            />
            <span className="pr-3.5 font-mono text-[13px] text-subtle">
              .{ext}
            </span>
          </div>
        </Field>

        <div className="relative">
          <Button
            variant="primary"
            size="lg"
            icon={p.busy ? undefined : "download"}
            className="w-full"
            onClick={p.onDownload}
            disabled={p.busy || !resolved.valid || !!comp.error}
          >
            {p.busy ? (
              <motion.span
                className="block size-4 rounded-full border-2 border-current border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
              />
            ) : null}
            Download {FORMATS.find((f) => f.id === settings.format)!.label}
          </Button>
          <Burst trigger={p.burst} />
        </div>

        <div
          className={cx("grid gap-2", canShare ? "grid-cols-3" : "grid-cols-2")}
        >
          <Button
            size="md"
            icon="copy"
            onClick={p.onCopy}
            disabled={!resolved.valid}
          >
            Copy image
          </Button>
          {canShare && (
            <Button
              size="md"
              icon="share"
              onClick={p.onShare}
              disabled={!resolved.valid}
            >
              Share
            </Button>
          )}
          <Button
            size="md"
            icon="link"
            onClick={p.onCopyLink}
            title="A link that reopens this exact design"
          >
            Edit link
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1 pt-2">
          <Button variant="ghost" size="sm" icon="plus" onClick={p.onNew}>
            Start a new QR with this style
          </Button>
          <Button variant="ghost" size="sm" icon="grid" onClick={p.onBulk}>
            Make many with this design
          </Button>
        </div>
      </div>
    </div>
  );
}

function ScanCard({
  scan,
  resolved,
  note,
}: {
  scan: ScanStatus;
  resolved: ResolvedContent;
  note?: string;
}) {
  const ok = scan === "ok";
  const bad = scan === "fail" || scan === "mismatch";
  return (
    <div
      className={cx(
        "relative overflow-hidden rounded-2xl border p-4 flex gap-3.5",
        ok
          ? "border-success/30 bg-success/[0.07]"
          : bad
            ? "border-warn/30 bg-warn/[0.07]"
            : "border-line bg-surface/60",
      )}
    >
      <motion.span
        key={scan}
        initial={{ scale: 0.5, rotate: -20, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 22 }}
        className={cx(
          "grid place-items-center size-10 shrink-0 rounded-xl",
          ok
            ? "bg-success text-bg"
            : bad
              ? "bg-warn text-bg"
              : "bg-surface-3 text-muted",
        )}
      >
        {scan === "checking" ? (
          <motion.span
            className="block size-4 rounded-full border-2 border-current border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
          />
        ) : (
          <Icon
            name={ok ? "shield" : bad ? "alert" : "scan"}
            size={20}
            stroke={2}
          />
        )}
      </motion.span>
      <div className="min-w-0">
        <p className="text-[14.5px] font-semibold text-fg">
          {ok
            ? "Verified — it scans"
            : scan === "mismatch"
              ? "Scans, but reads different data"
              : scan === "fail"
                ? "Might be hard to scan"
                : scan === "checking"
                  ? "Testing your design…"
                  : "Add content to test it"}
        </p>
        <p className="mt-0.5 text-[12.5px] text-muted text-pretty">
          {ok
            ? "We rendered your design and decoded it back. Still, test with a real phone before printing thousands."
            : bad
              ? "Our decoder couldn't read it reliably. Try more contrast, a simpler pattern, a smaller logo or error correction H."
              : "We decode every design to make sure it works."}
        </p>
        {note && resolved.valid && (
          <p className="mt-1 text-[12px] text-subtle">{note}</p>
        )}
        {resolved.valid && resolved.summary && (
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-subtle min-w-0">
            <Icon name={resolved.def.icon} size={13} />
            <span className="truncate font-mono">{resolved.summary}</span>
          </p>
        )}
      </div>
    </div>
  );
}
