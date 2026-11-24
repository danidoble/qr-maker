import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import type { PointerEvent } from "react";
import { contrast } from "../../lib/color";
import type { Composition } from "../../lib/compose";
import type { ResolvedContent } from "../../lib/content";
import type { Design } from "../../lib/design";
import type { ScanStatus } from "../../lib/scan";
import { Button, cx } from "../ui/controls";
import { Icon } from "../ui/Icon";
import { ScanBadge, SvgView } from "./bits";

interface StageProps {
  design: Design;
  comp: Composition;
  resolved: ResolvedContent;
  scan: ScanStatus;
  onQuickDownload: () => void;
  quickLabel: string;
  emptyHint?: string;
  className?: string;
}

export function Stage({
  design,
  comp,
  resolved,
  scan,
  onQuickDownload,
  quickLabel,
  emptyHint,
  className,
}: StageProps) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [7, -7]), {
    stiffness: 200,
    damping: 20,
  });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-9, 9]), {
    stiffness: 200,
    damping: 20,
  });

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  const { qr, frame } = design;
  const ratio = comp.width / comp.height;
  const empty = !resolved.valid;
  const behind = qr.bgTransparent
    ? frame.id !== "none" && frame.paper !== "none"
      ? frame.paper
      : "#ffffff"
    : qr.bg;
  const worst = Math.min(
    contrast(qr.fill.a, behind),
    qr.fill.kind === "solid" ? 99 : contrast(qr.fill.b, behind),
  );
  const glowA =
    qr.fill.kind === "solid"
      ? frame.id !== "none"
        ? frame.color
        : qr.fill.a
      : qr.fill.a;
  const glowB =
    qr.fill.kind === "solid"
      ? frame.id !== "none"
        ? frame.accent
        : "#8b7bff"
      : qr.fill.b;

  return (
    <section
      aria-label="Live preview"
      className={cx(
        "relative isolate overflow-hidden flex flex-col",
        className,
      )}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      {/* Ambient background that follows the design colors */}
      <div className="absolute inset-0 -z-10 stage-grid" />
      <motion.div
        aria-hidden
        className="absolute -z-10 size-[46vmax] rounded-full blur-[90px] opacity-[0.22] left-[10%] top-[5%]"
        animate={{ backgroundColor: glowA }}
        transition={{ duration: 0.8 }}
      />
      <motion.div
        aria-hidden
        className="absolute -z-10 size-[40vmax] rounded-full blur-[100px] opacity-[0.18] right-[5%] bottom-[0%]"
        animate={{ backgroundColor: glowB }}
        transition={{ duration: 0.8 }}
      />

      <div className="flex-1 min-h-0 grid place-items-center p-6 sm:p-10 [perspective:1400px]">
        <motion.div
          style={{
            rotateX: rx,
            rotateY: ry,
            aspectRatio: `${comp.width} / ${comp.height}`,
            width: `min(100%, calc(var(--stage-h) * ${ratio.toFixed(4)}))`,
          }}
          className="relative [--stage-h:min(34svh,330px)] lg:[--stage-h:min(64vh,640px)]"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={frame.id}
              initial={{ opacity: 0, scale: 0.9, y: 12, filter: "blur(6px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              exit={{
                opacity: 0,
                scale: 0.94,
                filter: "blur(4px)",
                transition: { duration: 0.15 },
              }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="absolute inset-0"
            >
              <div
                className={cx(
                  "relative size-full drop-shadow-[0_30px_40px_rgb(0_0_0/0.28)]",
                  qr.bgTransparent &&
                    frame.id === "none" &&
                    "checker rounded-xl",
                )}
              >
                <SvgView
                  svg={comp.svg}
                  className={cx(
                    "size-full transition-[opacity,filter] duration-300",
                    empty && "opacity-25 blur-[1.5px] grayscale",
                  )}
                />
              </div>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {(empty || comp.error) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="absolute inset-0 grid place-items-center p-4"
              >
                <div className="max-w-64 text-center rounded-2xl border border-line-strong bg-surface/90 backdrop-blur-xl px-5 py-4 shadow-card">
                  <div
                    className={cx(
                      "mx-auto mb-2 grid place-items-center size-9 rounded-full",
                      comp.error
                        ? "bg-danger/15 text-danger"
                        : "bg-accent-soft text-accent",
                    )}
                  >
                    <Icon name={comp.error ? "alert" : "sparkles"} size={18} />
                  </div>
                  <p className="text-[14px] font-semibold text-fg">
                    {comp.error ? "Too much content" : "Your QR appears here"}
                  </p>
                  <p className="mt-1 text-[12.5px] text-muted text-pretty">
                    {comp.error ??
                      emptyHint ??
                      `Fill in the ${resolved.def.label.toLowerCase()} details to generate it.`}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Status bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-center lg:justify-between gap-2 px-4 pb-4 lg:px-8 lg:pb-7">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <ScanBadge status={empty ? "idle" : scan} />
          {comp.matrix && !empty && (
            <span
              className="hidden sm:inline-flex items-center h-8 px-3 rounded-full border border-line bg-surface/80 backdrop-blur font-mono text-[11.5px] text-muted"
              title="QR version · modules per side · error correction"
            >
              v{comp.matrix.version} · {comp.matrix.size}×{comp.matrix.size} ·
              ECC {comp.matrix.ec}
            </span>
          )}
          {!empty && worst < 3 && (
            <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-warn/30 bg-warn/10 text-warn text-[12px] font-medium">
              <Icon name="alert" size={13} /> Low contrast
            </span>
          )}
        </div>
        <div className="hidden lg:block">
          <Button
            variant="primary"
            size="sm"
            icon="download"
            onClick={onQuickDownload}
            disabled={empty || !!comp.error}
          >
            {quickLabel}
          </Button>
        </div>
      </div>
    </section>
  );
}
