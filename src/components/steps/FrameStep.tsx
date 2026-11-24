import { AnimatePresence, motion } from "motion/react";
import { useId, useMemo } from "react";
import { compose } from "../../lib/compose";
import type { ResolvedContent } from "../../lib/content";
import type { Design, FontId, FrameId } from "../../lib/design";
import { FONT_LIST } from "../../lib/fonts";
import { FRAME_MAP, FRAME_PALETTES, FRAMES } from "../../lib/frames";
import type { DesignApi } from "../../hooks/useDesign";
import {
  Chip,
  ColorField,
  Field,
  TileGrid,
  cx,
  inputCls,
} from "../ui/controls";
import { Icon } from "../ui/Icon";
import { StepHeader, SvgView } from "../studio/bits";

interface Props {
  design: Design;
  api: DesignApi;
  data: string;
  resolved: ResolvedContent;
}

const COMMON_CTAS = [
  "Scan me",
  "Menu",
  "Follow us",
  "Leave a review",
  "Get the app",
  "Free Wi‑Fi",
  "Pay here",
  "Learn more",
];

export function FrameStep({ design, api, data, resolved }: Props) {
  const { frame, qr } = design;
  const set = api.setFrame;
  const def = frame.id !== "none" ? FRAME_MAP[frame.id] : null;
  const gid = useId();

  const thumbs = useMemo(
    () =>
      [{ id: "none" as FrameId, name: "None" }, ...FRAMES].map((f) => ({
        id: f.id,
        name: f.name,
        svg: compose(
          {
            data,
            qr,
            frame: {
              ...frame,
              id: f.id,
              font: f.id === "none" ? frame.font : FRAME_MAP[f.id].font,
            },
          },
          { idPrefix: `fr-${f.id}` },
        ).svg,
      })),
    [data, qr, frame],
  );

  const pick = (id: FrameId) => {
    if (id === frame.id) return;
    set({ id, ...(id !== "none" ? { font: FRAME_MAP[id].font } : {}) }, null);
  };

  const ctas = [...new Set([resolved.def.cta, ...COMMON_CTAS])];

  return (
    <div>
      <StepHeader step={3} title="Frame it">
        A clear call to action tells people why they should scan. Pick a frame
        and say it your way.
      </StepHeader>

      <div
        role="radiogroup"
        aria-label="Frame"
        className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6"
      >
        {thumbs.map((t, i) => {
          const active = t.id === frame.id;
          return (
            <motion.button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => pick(t.id)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.95 }}
              className={cx(
                "relative flex flex-col items-center gap-1.5 rounded-2xl border p-2 transition-colors",
                active
                  ? "border-transparent"
                  : "border-line bg-surface-2/40 hover:border-line-strong",
              )}
            >
              {active && (
                <motion.span
                  layoutId={`frame-${gid}`}
                  className="absolute inset-0 rounded-2xl bg-accent-soft ring-2 ring-accent"
                  transition={{ type: "spring", stiffness: 480, damping: 36 }}
                />
              )}
              <span className="relative w-full aspect-square">
                <SvgView
                  svg={t.svg}
                  className={cx(
                    "absolute",
                    t.id === "none" ? "inset-[14%]" : "inset-0",
                  )}
                />
              </span>
              <span
                className={cx(
                  "relative text-[12px] font-medium",
                  active ? "text-fg" : "text-muted",
                )}
              >
                {t.name}
              </span>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {def ? (
          <motion.div
            key="controls"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex flex-col gap-5"
          >
            <Field label="Call to action" htmlFor="frame-label">
              <input
                id="frame-label"
                value={frame.label}
                maxLength={40}
                onChange={(e) => set({ label: e.target.value }, "label")}
                placeholder="Scan me"
                className={cx(inputCls, "h-11")}
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {ctas.map((c) => (
                  <Chip
                    key={c}
                    active={frame.label === c}
                    onClick={() => set({ label: c }, null)}
                  >
                    {c}
                  </Chip>
                ))}
              </div>
            </Field>

            {def.usesSub && (
              <Field
                label="Small print"
                htmlFor="frame-sub"
                hint="Shown in a smaller size — great for a URL or a short detail."
              >
                <input
                  id="frame-sub"
                  value={frame.sub}
                  maxLength={48}
                  onChange={(e) => set({ sub: e.target.value }, "sub")}
                  placeholder={resolved.summary || "example.com"}
                  className={cx(inputCls, "h-11")}
                />
                {resolved.valid &&
                  resolved.summary &&
                  frame.sub !== resolved.summary && (
                    <div className="pt-1">
                      <Chip
                        onClick={() => set({ sub: resolved.summary }, null)}
                      >
                        <span className="inline-flex items-center gap-1">
                          <Icon name="sparkles" size={12} /> Use “
                          {resolved.summary.slice(0, 28)}”
                        </span>
                      </Chip>
                    </div>
                  )}
              </Field>
            )}

            <Field label="Typeface">
              <TileGrid
                label="Typeface"
                columns={6}
                options={FONT_LIST.map((f) => ({ value: f.id, label: f.name }))}
                value={frame.font}
                onChange={(v: FontId) => set({ font: v }, null)}
                render={(v) => {
                  const f = FONT_LIST.find((x) => x.id === v)!;
                  return (
                    <span
                      className="block text-center text-[22px] leading-8 text-fg"
                      style={{ fontFamily: f.stack, fontWeight: f.weight }}
                    >
                      Aa
                    </span>
                  );
                }}
              />
            </Field>

            <Field
              label="Palette"
              aside={
                <button
                  type="button"
                  onClick={() =>
                    set(
                      {
                        color: qr.fill.a,
                        accent:
                          qr.fill.kind === "solid" ? frame.accent : qr.fill.b,
                      },
                      null,
                    )
                  }
                  className="inline-flex items-center gap-1 text-[12px] text-accent hover:underline"
                >
                  <Icon name="sparkles" size={12} /> Match my QR
                </button>
              }
            >
              <div className="grid grid-cols-4 gap-1.5">
                {FRAME_PALETTES.map((p) => {
                  const active =
                    p.color === frame.color &&
                    p.paper === frame.paper &&
                    p.ink === frame.ink;
                  return (
                    <motion.button
                      key={p.name}
                      type="button"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        set(
                          {
                            color: p.color,
                            accent: p.accent,
                            paper: p.paper,
                            ink: p.ink,
                          },
                          null,
                        )
                      }
                      className={cx(
                        "flex items-center gap-2 rounded-xl border px-2 h-10 text-[12px] transition-colors",
                        active
                          ? "border-accent ring-2 ring-accent bg-accent-soft text-fg"
                          : "border-line text-muted hover:text-fg hover:border-line-strong",
                      )}
                    >
                      <span className="flex -space-x-1.5">
                        {[p.color, p.accent, p.paper].map((c, i) => (
                          <span
                            key={i}
                            className="size-4 rounded-full ring-2 ring-surface"
                            style={{ background: c }}
                          />
                        ))}
                      </span>
                      <span className="truncate">{p.name}</span>
                    </motion.button>
                  );
                })}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <ColorField
                label="Frame"
                value={frame.color}
                onChange={(v) => set({ color: v }, "frame-color")}
                compact
              />
              <ColorField
                label="Paper"
                value={frame.paper}
                onChange={(v) => set({ paper: v }, "frame-paper")}
                allowNone
                compact
              />
              <ColorField
                label="Text"
                value={frame.ink}
                onChange={(v) => set({ ink: v }, "frame-ink")}
                compact
              />
              {def.usesAccent && (
                <ColorField
                  label="Accent"
                  value={frame.accent}
                  onChange={(v) => set({ accent: v }, "frame-accent")}
                  compact
                />
              )}
            </div>
          </motion.div>
        ) : (
          <motion.p
            key="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-dashed border-line px-4 py-5 text-center text-[13.5px] text-muted"
          >
            No frame — just the code. Pick one above to add a call to action.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
