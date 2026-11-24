import { motion } from "motion/react";
import {
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
} from "react";
import { contrast } from "../../lib/color";
import { compose } from "../../lib/compose";
import type {
  Design,
  DotStyle,
  EyeBallStyle,
  EyeFrameStyle,
  Fill,
  Logo,
  PlateShape,
  QRStyle,
} from "../../lib/design";
import { LOGO_ICONS, type IconName } from "../../lib/icons";
import { PRESETS, surprise } from "../../lib/presets";
import { eyeBallPath, eyeFramePath, modulesPath } from "../../lib/qr/render";
import type { DesignApi } from "../../hooks/useDesign";
import {
  ColorField,
  Field,
  Section,
  Segmented,
  Slider,
  Switch,
  TileGrid,
  cx,
} from "../ui/controls";
import { Icon } from "../ui/Icon";
import { useToast } from "../ui/Toast";
import { StepHeader, SvgView } from "../studio/bits";

const INKS = [
  "#15151b",
  "#5b47f5",
  "#0b5cad",
  "#1f4d3a",
  "#c0392b",
  "#b5179e",
  "#6b4e0f",
  "#0a7d8c",
];
const PAPERS = [
  "#ffffff",
  "#fffaf0",
  "#f4f8ef",
  "#f2f8ff",
  "#fff5f7",
  "#0d0d14",
];

const DOTS: { value: DotStyle; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Fluid" },
  { value: "soft", label: "Soft" },
  { value: "dots", label: "Dots" },
  { value: "tiny", label: "Tiny" },
  { value: "classy", label: "Classy" },
  { value: "diamond", label: "Diamond" },
  { value: "plus", label: "Plus" },
  { value: "bars-v", label: "Bars" },
  { value: "bars-h", label: "Lines" },
];
const EYE_FRAMES: { value: EyeFrameStyle; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "soft", label: "Soft" },
  { value: "rounded", label: "Round" },
  { value: "circle", label: "Circle" },
  { value: "leaf", label: "Leaf" },
  { value: "cut", label: "Cut" },
];
const EYE_BALLS: { value: EyeBallStyle; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Round" },
  { value: "circle", label: "Circle" },
  { value: "leaf", label: "Leaf" },
  { value: "diamond", label: "Diamond" },
  { value: "cut", label: "Cut" },
];

const SAMPLE = ["11011", "10110", "01101", "11011", "10111"];
const sampleOn = (r: number, c: number) =>
  r >= 0 && c >= 0 && r < 5 && c < 5 && SAMPLE[r][c] === "1";

interface Props {
  design: Design;
  api: DesignApi;
  data: string;
}

export function StyleStep({ design, api, data }: Props) {
  const { qr } = design;
  const set = api.setQR;
  const toast = useToast();
  const [spin, setSpin] = useState(0);

  const presetViews = useMemo(
    () =>
      PRESETS.map((p) => ({
        ...p,
        svg: compose(
          {
            data,
            qr: { ...qr, ...p.qr },
            frame: { ...design.frame, id: "none" },
          },
          { idPrefix: `ps-${p.id}` },
        ).svg,
      })),
    // Thumbnails only depend on data, logo and margin — not on the current colors.
    [data, qr.logo, qr.margin, design.frame],
  );

  const activePreset = PRESETS.find(
    (p) =>
      p.qr.dot === qr.dot &&
      p.qr.eyeFrame === qr.eyeFrame &&
      p.qr.fill?.a === qr.fill.a &&
      p.qr.fill?.kind === qr.fill.kind,
  )?.id;

  const behind = qr.bgTransparent ? "#ffffff" : qr.bg;
  const ratio = Math.min(
    contrast(qr.fill.a, behind),
    qr.fill.kind === "solid" ? 99 : contrast(qr.fill.b, behind),
  );

  return (
    <div>
      <StepHeader step={2} title="Make it yours">
        Start from a preset, then fine-tune shapes, colors and a logo.
      </StepHeader>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-5">
        <motion.button
          type="button"
          onClick={() => {
            set(surprise(), null);
            setSpin((s) => s + 1);
          }}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.95 }}
          className="group relative flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong bg-surface-2/40 p-2 aspect-[4/5] text-muted hover:text-fg hover:border-accent transition-colors"
        >
          <motion.span
            animate={{ rotate: spin * 180 }}
            transition={{ type: "spring", stiffness: 200, damping: 14 }}
            className="grid place-items-center size-10 rounded-xl bg-accent-soft text-accent"
          >
            <Icon name="dice" size={20} />
          </motion.span>
          <span className="text-[12px] font-medium">Surprise me</span>
        </motion.button>
        {presetViews.map((p, i) => {
          const active = p.id === activePreset;
          return (
            <motion.button
              key={p.id}
              type="button"
              onClick={() => set(p.qr, null)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.03 * i }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.95 }}
              aria-pressed={active}
              className={cx(
                "relative flex flex-col items-center gap-1.5 rounded-2xl border p-2 pb-2 transition-colors",
                active
                  ? "border-accent ring-2 ring-accent bg-accent-soft"
                  : "border-line bg-surface-2/40 hover:border-line-strong",
              )}
            >
              <SvgView svg={p.svg} className="w-full aspect-square" />
              <span className="text-[12px] font-medium text-fg">{p.name}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        <Section
          title="Pattern"
          icon="grid"
          defaultOpen
          summary={DOTS.find((d) => d.value === qr.dot)?.label}
        >
          <TileGrid
            label="Dot style"
            columns={5}
            options={DOTS}
            value={qr.dot}
            onChange={(v) => set({ dot: v })}
            render={(v) => (
              <svg viewBox="-0.4 -0.4 5.8 5.8" className="w-full aspect-square">
                <path d={modulesPath(sampleOn, 5, v)} fill="currentColor" />
              </svg>
            )}
          />
        </Section>

        <Section
          title="Corners"
          icon="scan"
          summary={`${EYE_FRAMES.find((e) => e.value === qr.eyeFrame)?.label} · ${EYE_BALLS.find((e) => e.value === qr.eyeBall)?.label}`}
        >
          <Field label="Outer">
            <TileGrid
              label="Corner frame"
              columns={6}
              options={EYE_FRAMES}
              value={qr.eyeFrame}
              onChange={(v) => set({ eyeFrame: v })}
              render={(v) => (
                <svg
                  viewBox="-0.6 -0.6 8.2 8.2"
                  className="w-full aspect-square"
                >
                  <path
                    d={eyeFramePath(v, 0, 0)}
                    fill="currentColor"
                    fillRule="evenodd"
                  />
                  <path
                    d={eyeBallPath(qr.eyeBall, 0, 0)}
                    fill="currentColor"
                    opacity={0.35}
                  />
                </svg>
              )}
            />
          </Field>
          <Field label="Inner">
            <TileGrid
              label="Corner dot"
              columns={6}
              options={EYE_BALLS}
              value={qr.eyeBall}
              onChange={(v) => set({ eyeBall: v })}
              render={(v) => (
                <svg
                  viewBox="-0.6 -0.6 8.2 8.2"
                  className="w-full aspect-square"
                >
                  <path
                    d={eyeFramePath(qr.eyeFrame, 0, 0)}
                    fill="currentColor"
                    fillRule="evenodd"
                    opacity={0.35}
                  />
                  <path d={eyeBallPath(v, 0, 0)} fill="currentColor" />
                </svg>
              )}
            />
          </Field>
        </Section>

        <Section
          title="Colors"
          icon="palette"
          defaultOpen
          summary={
            qr.fill.kind === "solid"
              ? qr.fill.a
              : `${qr.fill.kind} · ${qr.fill.a} → ${qr.fill.b}`
          }
        >
          <ColorsPanel qr={qr} set={set} />
          <div
            className={cx(
              "flex items-center gap-2 rounded-xl px-3 py-2 text-[12.5px]",
              ratio < 3 ? "bg-warn/10 text-warn" : "bg-success/10 text-success",
            )}
          >
            <Icon name={ratio < 3 ? "alert" : "check"} size={14} />
            <span className="flex-1">
              {ratio < 3
                ? "Low contrast — some phones may struggle. Darken the code or lighten the background."
                : luminanceHint(qr, behind)}
            </span>
            <span className="font-mono tabular-nums">{ratio.toFixed(1)}:1</span>
          </div>
        </Section>

        <Section
          title="Logo"
          icon="image"
          summary={
            qr.logo
              ? qr.logo.kind === "icon"
                ? `Icon · ${qr.logo.icon}`
                : "Custom image"
              : "None"
          }
        >
          <LogoPanel qr={qr} set={set} onError={(m) => toast(m, "error")} />
        </Section>

        <Section
          title="Advanced"
          icon="sparkles"
          summary={`ECC ${qr.ec === "auto" ? "auto" : qr.ec} · margin ${qr.margin}`}
        >
          <Field
            label="Error correction"
            hint={
              qr.ec === "auto"
                ? `Auto picks ${qr.logo ? "H (30%) because you have a logo" : "M (15%) — a good balance"}.`
                : {
                    L: "Recovers ~7% damage. Smallest code.",
                    M: "Recovers ~15%. Good default.",
                    Q: "Recovers ~25%.",
                    H: "Recovers ~30%. Best with logos.",
                  }[qr.ec]
            }
          >
            <Segmented
              label="Error correction"
              value={qr.ec}
              onChange={(v) => set({ ec: v })}
              options={[
                { value: "auto", label: "Auto" },
                { value: "L", label: "L" },
                { value: "M", label: "M" },
                { value: "Q", label: "Q" },
                { value: "H", label: "H" },
              ]}
            />
          </Field>
          <Slider
            label="Quiet zone"
            value={qr.margin}
            min={0}
            max={6}
            onChange={(v) => set({ margin: v }, "margin")}
            format={(v) => `${v} mod`}
            hint={
              qr.margin < 2
                ? "Scanners like empty space around the code — keep some if it sits on a busy background."
                : undefined
            }
          />
          <Slider
            label="Background corners"
            value={Math.round(qr.radius * 100)}
            min={0}
            max={20}
            onChange={(v) => set({ radius: v / 100 }, "radius")}
            format={(v) => `${v}%`}
          />
        </Section>
      </div>
    </div>
  );
}

function luminanceHint(qr: QRStyle, behind: string) {
  const inverted = contrast(qr.fill.a, "#000") > contrast(behind, "#000");
  return inverted
    ? "Good contrast. Light-on-dark codes work on most modern phones."
    : "Great contrast — easy to scan.";
}

function ColorsPanel({ qr, set }: { qr: QRStyle; set: DesignApi["setQR"] }) {
  const fill = qr.fill;
  const setFill = (p: Partial<Fill>, key: string | null = "fill") =>
    set({ fill: { ...fill, ...p } }, key);
  const customEyes = qr.eyeFrameColor !== null || qr.eyeBallColor !== null;

  return (
    <>
      <Segmented
        label="Fill type"
        value={fill.kind}
        onChange={(k) => setFill({ kind: k }, null)}
        options={[
          { value: "solid", label: "Solid" },
          { value: "linear", label: "Linear" },
          { value: "radial", label: "Radial" },
        ]}
      />
      <div className={cx("grid gap-3", fill.kind !== "solid" && "grid-cols-2")}>
        <ColorField
          label={fill.kind === "solid" ? "Code color" : "From"}
          value={fill.a}
          onChange={(v) => setFill({ a: v }, "fill-a")}
          swatches={fill.kind === "solid" ? INKS : undefined}
        />
        {fill.kind !== "solid" && (
          <ColorField
            label="To"
            value={fill.b}
            onChange={(v) => setFill({ b: v }, "fill-b")}
          />
        )}
      </div>
      {fill.kind !== "solid" && (
        <div className="flex flex-col gap-3">
          <div
            className="h-3 rounded-full ring-1 ring-line"
            style={{
              background:
                fill.kind === "linear"
                  ? `linear-gradient(${fill.angle}deg, ${fill.a}, ${fill.b})`
                  : `radial-gradient(circle, ${fill.a}, ${fill.b})`,
            }}
          />
          {fill.kind === "linear" && (
            <Slider
              label="Angle"
              value={fill.angle}
              min={0}
              max={360}
              step={5}
              onChange={(v) => setFill({ angle: v }, "angle")}
              format={(v) => `${v}°`}
            />
          )}
        </div>
      )}

      <Switch
        checked={customEyes}
        onChange={(on) =>
          set(
            on
              ? {
                  eyeFrameColor: fill.a,
                  eyeBallColor: fill.kind === "solid" ? fill.a : fill.b,
                }
              : { eyeFrameColor: null, eyeBallColor: null },
            null,
          )
        }
        label="Custom corner colors"
        description="Color the three big squares separately."
      />
      {customEyes && (
        <div className="grid grid-cols-2 gap-3">
          <ColorField
            label="Outer"
            value={qr.eyeFrameColor ?? fill.a}
            onChange={(v) => set({ eyeFrameColor: v }, "eye-frame-color")}
          />
          <ColorField
            label="Inner"
            value={qr.eyeBallColor ?? fill.a}
            onChange={(v) => set({ eyeBallColor: v }, "eye-ball-color")}
          />
        </div>
      )}

      <div className="h-px bg-line" />

      <Switch
        checked={qr.bgTransparent}
        onChange={(v) => set({ bgTransparent: v }, null)}
        label="Transparent background"
        description="For placing on colored surfaces."
      />
      {!qr.bgTransparent && (
        <ColorField
          label="Background"
          value={qr.bg}
          onChange={(v) => set({ bg: v }, "bg")}
          swatches={PAPERS}
        />
      )}
    </>
  );
}

const PLATES: { value: PlateShape; label: string }[] = [
  { value: "none", label: "None" },
  { value: "square", label: "Square" },
  { value: "rounded", label: "Rounded" },
  { value: "circle", label: "Circle" },
];

function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(new Error("Couldn't read that file"));
    fr.onload = () => {
      const src = fr.result as string;
      if (file.type === "image/svg+xml" || file.size < 400_000)
        return resolve(src);
      // Downscale big rasters so the design stays light (and fits in storage).
      const img = new Image();
      img.onload = () => {
        const max = 512;
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/png"));
      };
      img.onerror = () => reject(new Error("That image couldn't be loaded"));
      img.src = src;
    };
    fr.readAsDataURL(file);
  });
}

function LogoPanel({
  qr,
  set,
  onError,
}: {
  qr: QRStyle;
  set: DesignApi["setQR"];
  onError: (m: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const logo = qr.logo;
  const base: Omit<Logo, "kind"> = {
    size: logo?.size ?? 0.22,
    plate: logo?.plate ?? "rounded",
    plateColor: logo?.plateColor ?? "#ffffff",
    color: logo?.color ?? null,
  };

  const upload = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return onError("Please choose an image file");
    try {
      const src = await readImage(file);
      set({ logo: { ...base, kind: "image", src } }, null);
    } catch (e) {
      onError((e as Error).message);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    upload(e.dataTransfer.files?.[0]);
  };

  return (
    <>
      <div className="grid grid-cols-6 gap-1.5">
        <LogoTile
          active={!logo}
          onClick={() => set({ logo: null }, null)}
          label="No logo"
        >
          <Icon name="slash" size={18} />
        </LogoTile>
        <LogoTile
          active={logo?.kind === "image"}
          onClick={() => fileRef.current?.click()}
          label="Upload image"
        >
          {logo?.kind === "image" && logo.src ? (
            <img
              src={logo.src}
              alt=""
              className="size-6 object-contain rounded"
            />
          ) : (
            <Icon name="upload" size={18} />
          )}
        </LogoTile>
        {LOGO_ICONS.map((name: IconName) => (
          <LogoTile
            key={name}
            active={logo?.kind === "icon" && logo.icon === name}
            onClick={() =>
              set({ logo: { ...base, kind: "icon", icon: name } }, null)
            }
            label={name}
          >
            <Icon name={name} size={18} />
          </LogoTile>
        ))}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="sr-only"
        onChange={(e) => upload(e.target.files?.[0])}
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) =>
          (e.key === "Enter" || e.key === " ") && fileRef.current?.click()
        }
        className={cx(
          "flex items-center justify-center gap-2 rounded-xl border-2 border-dashed py-4 text-[13px] cursor-pointer transition-colors",
          drag
            ? "border-accent bg-accent-soft text-fg"
            : "border-line text-muted hover:border-line-strong hover:text-fg",
        )}
      >
        <Icon name="upload" size={16} /> Drop your logo here, or click to browse
      </div>

      {logo && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4"
        >
          <Slider
            label="Size"
            value={Math.round(logo.size * 100)}
            min={12}
            max={32}
            onChange={(v) =>
              set({ logo: { ...logo, size: v / 100 } }, "logo-size")
            }
            format={(v) => `${v}%`}
          />
          <Field label="Backdrop">
            <Segmented
              label="Logo backdrop"
              value={logo.plate}
              onChange={(v) => set({ logo: { ...logo, plate: v } }, null)}
              options={PLATES}
              size="sm"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            {logo.plate !== "none" && (
              <ColorField
                label="Backdrop color"
                value={logo.plateColor}
                onChange={(v) =>
                  set({ logo: { ...logo, plateColor: v } }, "plate-color")
                }
                compact
              />
            )}
            {logo.kind === "icon" && (
              <ColorField
                label="Icon color"
                value={logo.color ?? qr.fill.a}
                onChange={(v) =>
                  set({ logo: { ...logo, color: v } }, "logo-color")
                }
                compact
              />
            )}
          </div>
          {qr.ec !== "auto" && qr.ec !== "H" && (
            <button
              type="button"
              onClick={() => set({ ec: "H" }, null)}
              className="flex items-center gap-2 rounded-xl bg-warn/10 px-3 py-2 text-left text-[12.5px] text-warn"
            >
              <Icon name="alert" size={14} /> Logos hide part of the code. Tap
              to switch error correction to H.
            </button>
          )}
        </motion.div>
      )}
    </>
  );
}

function LogoTile({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <motion.button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.92 }}
      className={cx(
        "aspect-square grid place-items-center rounded-xl border transition-colors",
        active
          ? "border-accent ring-2 ring-accent bg-accent-soft text-accent"
          : "border-line bg-surface-2/50 text-muted hover:text-fg hover:border-line-strong",
      )}
    >
      {children}
    </motion.button>
  );
}
