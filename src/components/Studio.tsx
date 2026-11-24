import {
  AnimatePresence,
  MotionConfig,
  motion,
  useAnimationControls,
  useInView,
} from "motion/react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { compose } from "../lib/compose";
import {
  CONTENT_MAP,
  PLACEHOLDER_DATA,
  resolveContent,
  slugify,
  type ContentType,
} from "../lib/content";
import {
  copyPNG,
  downloadBlob,
  renderExport,
  sharePNG,
  FORMATS,
} from "../lib/export";
import { useDesign, shareUrl } from "../hooks/useDesign";
import { useScanCheck } from "../hooks/useScanCheck";
import { useTheme } from "../hooks/useTheme";
import { ContentStep } from "./steps/ContentStep";
import { StyleStep } from "./steps/StyleStep";
import { FrameStep } from "./steps/FrameStep";
import { ExportStep, type ExportSettings } from "./steps/ExportStep";
import { Stage } from "./studio/Stage";
import { STEPS, Stepper } from "./studio/Stepper";
import { LogoMark, ScanBadge, SvgView } from "./studio/bits";
import { Button, IconButton, cx } from "./ui/controls";
import { Icon } from "./ui/Icon";
import { ToastProvider, useToast } from "./ui/Toast";

export function Studio() {
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <StudioInner />
      </ToastProvider>
    </MotionConfig>
  );
}

const EXPORT_KEY = "qr-maker:export:v1";
const DEFAULT_EXPORT: ExportSettings = {
  format: "png",
  width: 1024,
  filename: "",
};

function loadExport(): ExportSettings {
  try {
    return {
      ...DEFAULT_EXPORT,
      ...JSON.parse(localStorage.getItem(EXPORT_KEY) ?? "{}"),
    };
  } catch {
    return DEFAULT_EXPORT;
  }
}

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement &&
  (el.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

function StudioInner() {
  const api = useDesign();
  const { design } = api;
  const toast = useToast();

  // ── Derived ──
  const resolved = useMemo(
    () => resolveContent(design.content.type, design.content.fields),
    [design.content],
  );
  const data = resolved.valid ? resolved.data : PLACEHOLDER_DATA;
  const input = useMemo(
    () => ({ data, qr: design.qr, frame: design.frame }),
    [data, design.qr, design.frame],
  );
  const comp = useMemo(() => compose(input, { idPrefix: "pv" }), [input]);
  const scan = useScanCheck(input, resolved.valid);

  // ── Steps ──
  const [step, setStep] = useState(() => (api.openedFromLink ? 3 : 0));
  const [dir, setDir] = useState(1);
  const [showErrors, setShowErrors] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const nextCtl = useAnimationControls();

  const go = useCallback(
    (i: number) => {
      const target = Math.max(0, Math.min(STEPS.length - 1, i));
      if (target === step) return;
      if (target > 0 && !resolved.valid) {
        setShowErrors(true);
        setStep(0);
        nextCtl.start({
          x: [0, -8, 8, -5, 5, 0],
          transition: { duration: 0.4 },
        });
        toast("Fill in the highlighted fields first", "error");
        return;
      }
      setDir(target > step ? 1 : -1);
      setStep(target);
      panelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      if (window.innerWidth < 1024)
        window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [step, resolved.valid, nextCtl, toast],
  );

  const announced = useRef(false);
  useEffect(() => {
    if (announced.current || !api.openedFromLink) return;
    announced.current = true;
    toast("Design loaded from link", "info");
  }, [api.openedFromLink, toast]);

  // Smart default: when the content type changes, swap a stock CTA for the new type's one.
  const onTypeChange = useCallback(
    (t: ContentType) =>
      api.update((d) => {
        const stock =
          Object.values(CONTENT_MAP).some((c) => c.cta === d.frame.label) ||
          d.frame.label === "Scan me";
        return {
          ...d,
          content: { ...d.content, type: t },
          frame: stock ? { ...d.frame, label: CONTENT_MAP[t].cta } : d.frame,
        };
      }),
    [api],
  );

  // ── Export ──
  const [exp, setExp] = useState<ExportSettings>(loadExport);
  const [busy, setBusy] = useState(false);
  const [burst, setBurst] = useState(0);
  useEffect(() => {
    try {
      localStorage.setItem(
        EXPORT_KEY,
        JSON.stringify({ ...exp, filename: "" }),
      );
    } catch {
      /* ignore */
    }
  }, [exp]);

  const defaultName = `qr-${slugify(resolved.summary || resolved.def.label)}`;
  const filename = exp.filename.trim() || defaultName;

  const download = useCallback(async () => {
    if (!resolved.valid) return go(1);
    setBusy(true);
    try {
      const r = await renderExport(input, exp.format, exp.width);
      downloadBlob(r.blob, `${filename}.${r.ext}`);
      setBurst((b) => b + 1);
      toast(`Downloaded ${filename}.${r.ext}`);
    } catch (e) {
      toast((e as Error).message || "Export failed", "error");
    } finally {
      setBusy(false);
    }
  }, [input, exp, filename, resolved.valid, go, toast]);

  const copy = useCallback(async () => {
    try {
      await copyPNG(input);
      toast("Image copied to clipboard");
    } catch (e) {
      toast((e as Error).message || "Couldn't copy", "error");
    }
  }, [input, toast]);

  const share = useCallback(async () => {
    try {
      await sharePNG(input, filename);
    } catch (e) {
      if ((e as Error).name !== "AbortError") toast("Sharing failed", "error");
    }
  }, [input, filename, toast]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl(design));
      toast(
        design.qr.logo?.kind === "image"
          ? "Link copied (uploaded logos aren't included)"
          : "Edit link copied",
      );
    } catch {
      toast("Couldn't copy the link", "error");
    }
  }, [design, toast]);

  const startNew = useCallback(() => {
    api.update((d) => ({ ...d, content: { ...d.content, fields: {} } }));
    setShowErrors(false);
    setDir(-1);
    setStep(0);
  }, [api]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k === "s") {
        e.preventDefault();
        download();
      } else if (k === "enter") {
        e.preventDefault();
        go(step + 1);
      } else if (!isTyping(e.target) && k === "z") {
        e.preventDefault();
        if (e.shiftKey) api.redo();
        else api.undo();
      } else if (!isTyping(e.target) && k === "y") {
        e.preventDefault();
        api.redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [api, download, go, step]);

  // ── Mobile: floating mini preview when the stage scrolls away ──
  const stageRef = useRef<HTMLDivElement>(null);
  const stageVisible = useInView(stageRef, { amount: 0.25 });

  const fmt = FORMATS.find((f) => f.id === exp.format)!;

  let panel: ReactNode;
  if (step === 0)
    panel = (
      <ContentStep
        design={design}
        api={api}
        resolved={resolved}
        matrix={comp.matrix}
        showErrors={showErrors}
        onTypeChange={onTypeChange}
      />
    );
  else if (step === 1)
    panel = <StyleStep design={design} api={api} data={data} />;
  else if (step === 2)
    panel = (
      <FrameStep design={design} api={api} data={data} resolved={resolved} />
    );
  else
    panel = (
      <ExportStep
        settings={exp}
        onSettings={(p) => setExp((s) => ({ ...s, ...p }))}
        comp={comp}
        resolved={resolved}
        scan={scan}
        busy={busy}
        burst={burst}
        defaultName={defaultName}
        onDownload={download}
        onCopy={copy}
        onShare={share}
        onCopyLink={copyLink}
        onNew={startNew}
      />
    );

  return (
    <div className="min-h-dvh lg:h-dvh flex flex-col bg-bg text-fg">
      <TopBar api={api} />

      <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-[minmax(420px,500px)_1fr]">
        {/* Controls */}
        <aside className="order-2 lg:order-1 flex flex-col min-h-0 lg:border-r border-line bg-bg">
          <div className="sticky top-[56px] z-20 lg:static px-4 sm:px-6 pt-3 lg:pt-5 pb-3 bg-bg/85 backdrop-blur-xl lg:bg-transparent lg:backdrop-blur-none">
            <Stepper step={step} onGo={go} />
          </div>
          <div
            ref={panelRef}
            className="flex-1 min-h-0 lg:overflow-y-auto overflow-x-hidden px-4 sm:px-6 pt-4 pb-32 lg:pb-8"
          >
            <AnimatePresence mode="wait" custom={dir} initial={false}>
              <motion.div
                key={step}
                custom={dir}
                variants={{
                  enter: (d: number) => ({
                    opacity: 0,
                    x: d * 28,
                    filter: "blur(4px)",
                  }),
                  center: { opacity: 1, x: 0, filter: "blur(0px)" },
                  exit: (d: number) => ({
                    opacity: 0,
                    x: d * -28,
                    filter: "blur(4px)",
                  }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 34,
                  opacity: { duration: 0.18 },
                }}
              >
                {panel}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Step navigation */}
          <div className="fixed lg:static inset-x-0 bottom-0 z-30 border-t border-line bg-surface/85 backdrop-blur-xl lg:bg-bg px-4 sm:px-6 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)] lg:pb-3">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                icon="arrowLeft"
                onClick={() => go(step - 1)}
                disabled={step === 0}
              >
                Back
              </Button>
              <div className="flex-1 hidden sm:flex items-center justify-center gap-1.5 text-[11.5px] text-subtle font-mono">
                <kbd className="px-1.5 py-0.5 rounded-md border border-line">
                  ⌘ ↵
                </kbd>{" "}
                next
                <kbd className="ml-2 px-1.5 py-0.5 rounded-md border border-line">
                  ⌘ S
                </kbd>{" "}
                save
              </div>
              <div className="flex-1 sm:hidden" />
              <motion.div animate={nextCtl}>
                {step < STEPS.length - 1 ? (
                  <Button
                    variant="primary"
                    iconRight="arrowRight"
                    onClick={() => go(step + 1)}
                  >
                    {STEPS[step + 1].label}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    icon="download"
                    onClick={download}
                    disabled={busy || !resolved.valid}
                  >
                    {fmt.label}
                  </Button>
                )}
              </motion.div>
            </div>
          </div>
        </aside>

        {/* Live preview */}
        <div ref={stageRef} className="order-1 lg:order-2 min-h-0 flex">
          <Stage
            className="flex-1 min-h-[44svh] lg:min-h-0"
            design={design}
            comp={comp}
            resolved={resolved}
            scan={scan}
            onQuickDownload={download}
            quickLabel={`Download ${fmt.label}`}
          />
        </div>
      </div>

      {/* Mobile mini preview */}
      <AnimatePresence>
        {!stageVisible && (
          <motion.button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 26 }}
            className="lg:hidden fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+80px)] z-40 size-24 rounded-2xl border border-line-strong bg-surface/90 backdrop-blur-xl p-2 shadow-card"
            aria-label="Show preview"
          >
            <SvgView
              svg={comp.svg}
              className={cx("size-full", !resolved.valid && "opacity-30")}
            />
            {resolved.valid && (
              <ScanBadge
                status={scan}
                className="absolute -top-3 left-1/2 -translate-x-1/2 scale-75 whitespace-nowrap"
              />
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function TopBar({ api }: { api: ReturnType<typeof useDesign> }) {
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-40 h-14 shrink-0 flex items-center gap-3 px-4 sm:px-6 border-b border-line bg-bg/80 backdrop-blur-xl">
      <a
        href={import.meta.env.BASE_URL}
        className="flex items-center gap-2.5 mr-auto"
        aria-label="QR Maker home"
      >
        <LogoMark />
        <span className="flex flex-col leading-none">
          <span className="font-display text-[17px] font-bold tracking-tight">
            QR Maker
          </span>
          <span className="hidden sm:block text-[11px] text-subtle mt-0.5">
            Design studio · free & private
          </span>
        </span>
      </a>
      <div className="flex items-center gap-0.5">
        <IconButton
          icon="undo"
          label="Undo (⌘Z)"
          onClick={api.undo}
          disabled={!api.canUndo}
        />
        <IconButton
          icon="redo"
          label="Redo (⌘⇧Z)"
          onClick={api.redo}
          disabled={!api.canRedo}
        />
        <span className="mx-1.5 h-5 w-px bg-line" />
        <motion.button
          type="button"
          onClick={toggle}
          whileTap={{ scale: 0.9 }}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          title="Toggle theme"
          className="relative grid place-items-center size-9 rounded-xl text-muted hover:text-fg hover:bg-surface-2 overflow-hidden"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={theme}
              initial={{ y: 18, rotate: -90, opacity: 0 }}
              animate={{ y: 0, rotate: 0, opacity: 1 }}
              exit={{ y: -18, rotate: 90, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <Icon name={theme === "dark" ? "moon" : "sun"} size={17} />
            </motion.span>
          </AnimatePresence>
        </motion.button>
        <a
          href="https://github.com/danidoble/qr-maker"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:grid place-items-center size-9 rounded-xl text-muted hover:text-fg hover:bg-surface-2"
          aria-label="Source on GitHub"
          title="Source on GitHub"
        >
          <Icon name="github" size={17} />
        </a>
      </div>
    </header>
  );
}
