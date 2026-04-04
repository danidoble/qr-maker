import React, { useReducer, useEffect, useCallback, useState } from "react";
import { QRPreview } from "./QRPreview";
import { ThemeToggle } from "./ThemeToggle";
import { FrameSelector } from "./FrameSelector";
import { ColorPicker, GradientPicker } from "./controls/ColorPicker";
import { Slider } from "./controls/Slider";
import {
  ShapeGrid,
  DOT_SHAPES,
  CORNER_SQUARE_SHAPES,
  CORNER_DOT_SHAPES,
} from "./controls/ShapeGrid";
import { Toggle } from "./controls/Toggle";
import { Tooltip } from "./controls/Tooltip";
import { useDownload } from "../hooks/useDownload";
import type { FrameId } from "./frames/types";

// ── State ────────────────────────────────────────────────────────────────────

export interface QREditorState {
  content: string;
  dotShape: string;
  dotColor: string;
  dotGradient: {
    enabled: boolean;
    type: "linear" | "radial";
    color1: string;
    color2: string;
  };
  cornerSquareShape: string;
  cornerSquareColor: string;
  cornerDotShape: string;
  cornerDotColor: string;
  bgColor: string;
  bgTransparent: boolean;
  errorCorrection: string;
  logo: string | null;
  logoSize: number;
  logoMargin: number;
  logoShape: "square" | "circle" | "rounded";
  hideLogo: boolean;
}

const DEFAULT_STATE: QREditorState = {
  content: "https://example.com",
  dotShape: "square",
  dotColor: "#000000",
  dotGradient: {
    enabled: false,
    type: "linear",
    color1: "#000000",
    color2: "#333333",
  },
  cornerSquareShape: "square",
  cornerSquareColor: "#000000",
  cornerDotShape: "square",
  cornerDotColor: "#000000",
  bgColor: "#ffffff",
  bgTransparent: false,
  errorCorrection: "M",
  logo: null,
  logoSize: 20,
  logoMargin: 5,
  logoShape: "square",
  hideLogo: false,
};

type Action =
  | { type: "SET_CONTENT"; payload: string }
  | { type: "SET_DOT_SHAPE"; payload: string }
  | { type: "SET_DOT_COLOR"; payload: string }
  | { type: "SET_DOT_GRADIENT"; payload: Partial<QREditorState["dotGradient"]> }
  | { type: "SET_CORNER_SQUARE_SHAPE"; payload: string }
  | { type: "SET_CORNER_SQUARE_COLOR"; payload: string }
  | { type: "SET_CORNER_DOT_SHAPE"; payload: string }
  | { type: "SET_CORNER_DOT_COLOR"; payload: string }
  | { type: "SET_BG_COLOR"; payload: string }
  | { type: "SET_BG_TRANSPARENT"; payload: boolean }
  | { type: "SET_ERROR_CORRECTION"; payload: string }
  | { type: "SET_LOGO"; payload: string | null }
  | { type: "SET_LOGO_SIZE"; payload: number }
  | { type: "SET_LOGO_MARGIN"; payload: number }
  | { type: "SET_LOGO_SHAPE"; payload: "square" | "circle" | "rounded" }
  | { type: "SET_HIDE_LOGO"; payload: boolean }
  | { type: "LOAD"; payload: QREditorState };

function reducer(state: QREditorState, action: Action): QREditorState {
  switch (action.type) {
    case "SET_CONTENT":
      return { ...state, content: action.payload };
    case "SET_DOT_SHAPE":
      return { ...state, dotShape: action.payload };
    case "SET_DOT_COLOR":
      return {
        ...state,
        dotColor: action.payload,
        dotGradient: { ...state.dotGradient, color1: action.payload },
      };
    case "SET_DOT_GRADIENT":
      return {
        ...state,
        dotGradient: { ...state.dotGradient, ...action.payload },
      };
    case "SET_CORNER_SQUARE_SHAPE":
      return { ...state, cornerSquareShape: action.payload };
    case "SET_CORNER_SQUARE_COLOR":
      return { ...state, cornerSquareColor: action.payload };
    case "SET_CORNER_DOT_SHAPE":
      return { ...state, cornerDotShape: action.payload };
    case "SET_CORNER_DOT_COLOR":
      return { ...state, cornerDotColor: action.payload };
    case "SET_BG_COLOR":
      return { ...state, bgColor: action.payload };
    case "SET_BG_TRANSPARENT":
      return { ...state, bgTransparent: action.payload };
    case "SET_ERROR_CORRECTION":
      return { ...state, errorCorrection: action.payload };
    case "SET_LOGO":
      return { ...state, logo: action.payload };
    case "SET_LOGO_SIZE":
      return { ...state, logoSize: action.payload };
    case "SET_LOGO_MARGIN":
      return { ...state, logoMargin: action.payload };
    case "SET_LOGO_SHAPE":
      return { ...state, logoShape: action.payload };
    case "SET_HIDE_LOGO":
      return { ...state, hideLogo: action.payload };
    case "LOAD":
      return action.payload;
    default:
      return state;
  }
}

// ── QR Content Types ──────────────────────────────────────────────────────────

type QRType = "url" | "text" | "wifi" | "vcard" | "email" | "phone" | "sms";

const QR_TYPES: { id: QRType; label: string }[] = [
  { id: "url", label: "URL" },
  { id: "text", label: "Text" },
  { id: "wifi", label: "WiFi" },
  { id: "vcard", label: "Contact" },
  { id: "email", label: "Email" },
  { id: "phone", label: "Phone" },
  { id: "sms", label: "SMS" },
];

const DEFAULT_FIELDS: Record<string, string> = {
  url: "https://example.com",
  text: "",
  wifi_ssid: "",
  wifi_pass: "",
  wifi_enc: "WPA",
  wifi_hidden: "false",
  vcard_name: "",
  vcard_phone: "",
  vcard_email: "",
  vcard_org: "",
  vcard_url: "",
  vcard_addr: "",
  email_to: "",
  email_subj: "",
  email_body: "",
  tel: "",
  sms_to: "",
  sms_msg: "",
};

function buildQRContent(type: QRType, f: Record<string, string>): string {
  switch (type) {
    case "url":
      return f.url ?? "";
    case "text":
      return f.text ?? "";
    case "wifi": {
      const enc = f.wifi_enc ?? "WPA";
      const hidden = f.wifi_hidden === "true";
      return `WIFI:T:${enc};S:${f.wifi_ssid ?? ""};P:${f.wifi_pass ?? ""};H:${hidden ? "true" : ""};`;
    }
    case "vcard": {
      const lines = ["BEGIN:VCARD", "VERSION:3.0"];
      if (f.vcard_name) lines.push(`FN:${f.vcard_name}`);
      if (f.vcard_phone) lines.push(`TEL:${f.vcard_phone}`);
      if (f.vcard_email) lines.push(`EMAIL:${f.vcard_email}`);
      if (f.vcard_org) lines.push(`ORG:${f.vcard_org}`);
      if (f.vcard_url) lines.push(`URL:${f.vcard_url}`);
      if (f.vcard_addr) lines.push(`ADR:;;${f.vcard_addr};;;`);
      lines.push("END:VCARD");
      return lines.join("\n");
    }
    case "email": {
      const params: string[] = [];
      if (f.email_subj)
        params.push(`subject=${encodeURIComponent(f.email_subj)}`);
      if (f.email_body)
        params.push(`body=${encodeURIComponent(f.email_body)}`);
      return `mailto:${f.email_to ?? ""}${params.length ? "?" + params.join("&") : ""}`;
    }
    case "phone":
      return `tel:${f.tel ?? ""}`;
    case "sms":
      return `SMSTO:${f.sms_to ?? ""}:${f.sms_msg ?? ""}`;
  }
}

// ── Content Section Component ─────────────────────────────────────────────────

interface ContentSectionProps {
  qrType: QRType;
  fields: Record<string, string>;
  onTypeChange: (type: QRType) => void;
  onFieldChange: (key: string, value: string) => void;
}

function ContentSection({
  qrType,
  fields,
  onTypeChange,
  onFieldChange,
}: ContentSectionProps) {
  const content = buildQRContent(qrType, fields);
  const lbl =
    "text-[10px] font-mono text-(--text-secondary) uppercase tracking-widest";
  const inputCls =
    "w-full px-3 py-2 text-sm font-mono border border-(--border) bg-(--surface-2) " +
    "text-(--text-primary) placeholder:text-(--text-secondary) outline-none " +
    "focus:border-(--accent) transition-colors rounded-sm";

  return (
    <Section title="Content">
      {/* Type selector */}
      <div className="flex flex-wrap gap-1">
        {QR_TYPES.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onTypeChange(id)}
            className="px-2.5 py-1 text-[10px] font-mono rounded-sm border transition-all outline-none focus-visible:ring-1 focus-visible:ring-(--accent)"
            style={{
              background:
                qrType === id
                  ? "color-mix(in srgb, var(--accent) 15%, transparent)"
                  : "var(--surface-2)",
              borderColor: qrType === id ? "var(--accent)" : "var(--border)",
              color: qrType === id ? "var(--accent)" : "var(--text-secondary)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Fields */}
      <div className="flex flex-col gap-2.5">
        {qrType === "url" && (
          <div className="flex flex-col gap-1">
            <label className={lbl}>URL</label>
            <input
              type="url"
              value={fields.url ?? ""}
              onChange={(e) => onFieldChange("url", e.target.value)}
              placeholder="https://example.com"
              className={`${inputCls} h-8`}
            />
          </div>
        )}

        {qrType === "text" && (
          <div className="flex flex-col gap-1">
            <label className={lbl}>Text</label>
            <textarea
              value={fields.text ?? ""}
              onChange={(e) => onFieldChange("text", e.target.value)}
              placeholder="Your text here..."
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>
        )}

        {qrType === "wifi" && (
          <>
            <div className="flex flex-col gap-1">
              <label className={lbl}>Network Name (SSID)</label>
              <input
                type="text"
                value={fields.wifi_ssid ?? ""}
                onChange={(e) => onFieldChange("wifi_ssid", e.target.value)}
                placeholder="MyNetwork"
                className={`${inputCls} h-8`}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={lbl}>Password</label>
              <input
                type="text"
                value={fields.wifi_pass ?? ""}
                onChange={(e) => onFieldChange("wifi_pass", e.target.value)}
                placeholder="password"
                className={`${inputCls} h-8`}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={lbl}>Security</label>
              <div className="flex gap-1">
                {(["WPA", "WEP", "nopass"] as const).map((enc) => (
                  <button
                    key={enc}
                    onClick={() => onFieldChange("wifi_enc", enc)}
                    className="flex-1 py-1.5 text-xs font-mono rounded-sm border transition-all"
                    style={{
                      background:
                        (fields.wifi_enc ?? "WPA") === enc
                          ? "color-mix(in srgb, var(--accent) 15%, transparent)"
                          : "var(--surface-2)",
                      borderColor:
                        (fields.wifi_enc ?? "WPA") === enc
                          ? "var(--accent)"
                          : "var(--border)",
                      color:
                        (fields.wifi_enc ?? "WPA") === enc
                          ? "var(--accent)"
                          : "var(--text-secondary)",
                    }}
                  >
                    {enc}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={fields.wifi_hidden === "true"}
                onChange={(e) =>
                  onFieldChange(
                    "wifi_hidden",
                    e.target.checked ? "true" : "false",
                  )
                }
                className="rounded-sm accent-(--accent)"
              />
              <span className={lbl}>Hidden network</span>
            </label>
          </>
        )}

        {qrType === "vcard" && (
          <>
            {[
              { id: "vcard_name", label: "Full Name", ph: "John Doe" },
              { id: "vcard_phone", label: "Phone", ph: "+1 555 000 1234" },
              { id: "vcard_email", label: "Email", ph: "john@example.com" },
              { id: "vcard_org", label: "Organization", ph: "Acme Inc." },
              { id: "vcard_url", label: "Website", ph: "https://example.com" },
              {
                id: "vcard_addr",
                label: "Address",
                ph: "123 Main St, City",
              },
            ].map(({ id, label, ph }) => (
              <div key={id} className="flex flex-col gap-1">
                <label className={lbl}>{label}</label>
                <input
                  type="text"
                  value={fields[id] ?? ""}
                  onChange={(e) => onFieldChange(id, e.target.value)}
                  placeholder={ph}
                  className={`${inputCls} h-8`}
                />
              </div>
            ))}
          </>
        )}

        {qrType === "email" && (
          <>
            <div className="flex flex-col gap-1">
              <label className={lbl}>To</label>
              <input
                type="email"
                value={fields.email_to ?? ""}
                onChange={(e) => onFieldChange("email_to", e.target.value)}
                placeholder="recipient@example.com"
                className={`${inputCls} h-8`}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={lbl}>Subject</label>
              <input
                type="text"
                value={fields.email_subj ?? ""}
                onChange={(e) => onFieldChange("email_subj", e.target.value)}
                placeholder="Subject line"
                className={`${inputCls} h-8`}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={lbl}>Body</label>
              <textarea
                value={fields.email_body ?? ""}
                onChange={(e) => onFieldChange("email_body", e.target.value)}
                placeholder="Message body"
                rows={3}
                className={`${inputCls} resize-none`}
              />
            </div>
          </>
        )}

        {qrType === "phone" && (
          <div className="flex flex-col gap-1">
            <label className={lbl}>Phone number</label>
            <input
              type="tel"
              value={fields.tel ?? ""}
              onChange={(e) => onFieldChange("tel", e.target.value)}
              placeholder="+1 555 000 1234"
              className={`${inputCls} h-8`}
            />
          </div>
        )}

        {qrType === "sms" && (
          <>
            <div className="flex flex-col gap-1">
              <label className={lbl}>Phone number</label>
              <input
                type="tel"
                value={fields.sms_to ?? ""}
                onChange={(e) => onFieldChange("sms_to", e.target.value)}
                placeholder="+1 555 000 1234"
                className={`${inputCls} h-8`}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={lbl}>Message</label>
              <textarea
                value={fields.sms_msg ?? ""}
                onChange={(e) => onFieldChange("sms_msg", e.target.value)}
                placeholder="Message text"
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3">
        <span className="text-xs font-mono text-(--text-secondary)">
          {content.length} chars
        </span>
      </div>
    </Section>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="toast-enter fixed bottom-24 right-6 z-100 px-4 py-2.5 rounded-sm border border-(--border) shadow-2xl
      bg-(--surface-2) text-(--text-primary) text-sm font-mono flex items-center gap-2"
    >
      <span className="text-(--accent)">✓</span>
      {message}
    </div>
  );
}

// ── Collapsible Section ───────────────────────────────────────────────────────

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen}>
      <summary className="flex items-center justify-between py-2 select-none">
        <span className="text-xs font-mono font-medium text-(--text-primary) uppercase tracking-widest">
          {title}
        </span>
        <svg
          className="w-3 h-3 text-(--text-secondary) transition-transform details-arrow"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M2 4l4 4 4-4" />
        </svg>
      </summary>
      <div className="pt-3 pb-1 flex flex-col gap-4">{children}</div>
    </details>
  );
}

// ── Mobile Tab ────────────────────────────────────────────────────────────────

type MobileTab = "design" | "preview" | "download";

// ── Main Component ────────────────────────────────────────────────────────────

export function QREditor() {
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);
  const [exportSize, setExportSize] = useState(1024);
  const [frameId, setFrameId] = useState<FrameId>("none");
  // Default frame/label colors adapt to the stored/preferred theme at init time.
  const [frameColor, setFrameColor] = useState(() => {
    if (typeof window === "undefined") return "#000000";
    const stored = localStorage.getItem("qr-maker-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = stored ?? (prefersDark ? "dark" : "light");
    return theme === "dark" ? "#ffffff" : "#000000";
  });
  const [frameLabelText, setFrameLabelText] = useState("Scan me");
  const [frameLabelColor, setFrameLabelColor] = useState(() => {
    if (typeof window === "undefined") return "#000000";
    const stored = localStorage.getItem("qr-maker-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = stored ?? (prefersDark ? "dark" : "light");
    return theme === "dark" ? "#ffffff" : "#000000";
  });
  const [frameBgColor, setFrameBgColor] = useState(() => {
    if (typeof window === "undefined") return "#ffffff";
    const stored = localStorage.getItem("qr-maker-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = stored ?? (prefersDark ? "dark" : "light");
    return theme === "dark" ? "#111111" : "#ffffff";
  });
  const [frameFontSize, setFrameFontSize] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("design");

  // ── QR content type state ──
  const [qrType, setQrType] = useState<QRType>("url");
  const [fields, setFields] = useState<Record<string, string>>(DEFAULT_FIELDS);

  // ── Persist state ──
  useEffect(() => {
    const saved = localStorage.getItem("qr-maker-state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as QREditorState;
        dispatch({
          type: "LOAD",
          payload: { ...DEFAULT_STATE, ...parsed, logo: null },
        });
      } catch (e) {
        void e;
      }
    }
    const savedType = localStorage.getItem("qr-maker-type") as QRType | null;
    if (savedType && QR_TYPES.some((t) => t.id === savedType)) {
      setQrType(savedType);
    }
    const savedFields = localStorage.getItem("qr-maker-fields");
    if (savedFields) {
      try {
        setFields(JSON.parse(savedFields) as Record<string, string>);
      } catch (e) {
        void e;
      }
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { logo, ...toSave } = state;
    localStorage.setItem("qr-maker-state", JSON.stringify(toSave));
  }, [state]);

  useEffect(() => {
    localStorage.setItem("qr-maker-type", qrType);
  }, [qrType]);

  useEffect(() => {
    localStorage.setItem("qr-maker-fields", JSON.stringify(fields));
  }, [fields]);

  // Track loading on content/option change
  const changeTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  useEffect(() => {
    setIsLoading(true);
    if (changeTimeoutRef.current) clearTimeout(changeTimeoutRef.current);
    changeTimeoutRef.current = setTimeout(() => setIsLoading(false), 500);
    return () => {
      if (changeTimeoutRef.current) clearTimeout(changeTimeoutRef.current);
    };
  }, [state]);

  const showToast = useCallback((msg: string) => setToast(msg), []);

  // ── QR content type handlers ──
  const handleTypeChange = useCallback(
    (type: QRType) => {
      setQrType(type);
      dispatch({ type: "SET_CONTENT", payload: buildQRContent(type, fields) });
    },
    [fields],
  );

  const handleFieldChange = useCallback(
    (key: string, value: string) => {
      const next = { ...fields, [key]: value };
      setFields(next);
      dispatch({ type: "SET_CONTENT", payload: buildQRContent(qrType, next) });
    },
    [fields, qrType],
  );

  const { downloadSVG, downloadCanvas } = useDownload({
    state,
    exportSize,
    frameId,
    frameColor,
    frameBgColor,
    frameLabelText,
    frameLabelColor,
    frameFontSize,
    onToast: showToast,
  });

  // ── Logo upload ──
  const handleLogoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        dispatch({ type: "SET_LOGO", payload: ev.target?.result as string });
      };
      reader.readAsDataURL(file);
    },
    [],
  );

  // ── Sidebar controls ──
  const sidebar = (
    <aside
      className="w-[320px] shrink-0 h-screen sticky top-0 overflow-y-auto bg-(--surface) border-r border-(--border) flex flex-col"
      aria-label="QR Editor Controls"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-(--border) shrink-0">
        <div>
          <h1
            className="text-base font-bold text-(--text-primary) leading-none"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            QR Maker
          </h1>
          <p className="text-xs font-mono text-(--text-secondary) mt-0.5">
            Advanced Generator
          </p>
        </div>
        <ThemeToggle />
      </div>

      {/* Scroll area */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-1">
        {/* ── Content ── */}
        <ContentSection
          qrType={qrType}
          fields={fields}
          onTypeChange={handleTypeChange}
          onFieldChange={handleFieldChange}
        />

        <div className="h-px bg-(--border) my-1" />

        {/* ── QR Dots ── */}
        <Section title="Dot Style">
          <ShapeGrid
            label="Shape"
            options={DOT_SHAPES}
            value={state.dotShape}
            onChange={(v) => dispatch({ type: "SET_DOT_SHAPE", payload: v })}
            columns={3}
          />
          <GradientPicker
            label="Color"
            color1={state.dotGradient.color1}
            color2={state.dotGradient.color2}
            gradientType={state.dotGradient.type}
            enabled={state.dotGradient.enabled}
            onToggle={(v) =>
              dispatch({ type: "SET_DOT_GRADIENT", payload: { enabled: v } })
            }
            onColor1={(v) =>
              dispatch({ type: "SET_DOT_GRADIENT", payload: { color1: v } })
            }
            onColor2={(v) =>
              dispatch({ type: "SET_DOT_GRADIENT", payload: { color2: v } })
            }
            onTypeChange={(v) =>
              dispatch({ type: "SET_DOT_GRADIENT", payload: { type: v } })
            }
          />
        </Section>

        <div className="h-px bg-(--border) my-1" />

        {/* ── Corner Squares ── */}
        <Section title="Corner Squares" defaultOpen={false}>
          <ShapeGrid
            label="Shape"
            options={CORNER_SQUARE_SHAPES}
            value={state.cornerSquareShape}
            onChange={(v) =>
              dispatch({ type: "SET_CORNER_SQUARE_SHAPE", payload: v })
            }
            columns={3}
          />
          <ColorPicker
            label="Color"
            value={state.cornerSquareColor}
            onChange={(v) =>
              dispatch({ type: "SET_CORNER_SQUARE_COLOR", payload: v })
            }
          />
        </Section>

        <div className="h-px bg-(--border) my-1" />

        {/* ── Corner Dots ── */}
        <Section title="Corner Dots" defaultOpen={false}>
          <ShapeGrid
            label="Shape"
            options={CORNER_DOT_SHAPES}
            value={state.cornerDotShape}
            onChange={(v) =>
              dispatch({ type: "SET_CORNER_DOT_SHAPE", payload: v })
            }
            columns={2}
          />
          <ColorPicker
            label="Color"
            value={state.cornerDotColor}
            onChange={(v) =>
              dispatch({ type: "SET_CORNER_DOT_COLOR", payload: v })
            }
          />
        </Section>

        <div className="h-px bg-(--border) my-1" />

        {/* ── Background ── */}
        <Section title="Background" defaultOpen={false}>
          <Toggle
            id="bg-transparent"
            checked={state.bgTransparent}
            onChange={(v) =>
              dispatch({ type: "SET_BG_TRANSPARENT", payload: v })
            }
            label="Transparent background"
          />
          {!state.bgTransparent && (
            <ColorPicker
              label="Background Color"
              value={state.bgColor}
              onChange={(v) => dispatch({ type: "SET_BG_COLOR", payload: v })}
            />
          )}
        </Section>

        <div className="h-px bg-(--border) my-1" />

        {/* ── Error Correction ── */}
        <Section title="Error Correction" defaultOpen={false}>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono text-(--text-secondary) uppercase tracking-widest">
                Level
              </span>
              <Tooltip text="Higher correction means more redundancy. Use H when adding a logo. L produces cleaner looking QR in ideal conditions.">
                <span className="text-(--text-secondary) text-[10px] border border-(--border) rounded-full w-3.5 h-3.5 flex items-center justify-center cursor-help ml-1">
                  ?
                </span>
              </Tooltip>
            </div>
            <div
              role="radiogroup"
              aria-label="Error correction level"
              className="grid grid-cols-4 gap-1.5"
            >
              {[
                { id: "L", label: "7%" },
                { id: "M", label: "15%" },
                { id: "Q", label: "25%" },
                { id: "H", label: "30%" },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  role="radio"
                  aria-checked={state.errorCorrection === id}
                  onClick={() =>
                    dispatch({ type: "SET_ERROR_CORRECTION", payload: id })
                  }
                  className="flex flex-col items-center py-2 rounded-sm border text-xs transition-all duration-150 outline-none focus-visible:ring-1 focus-visible:ring-(--accent)"
                  style={{
                    background:
                      state.errorCorrection === id
                        ? "color-mix(in srgb, var(--accent) 15%, transparent)"
                        : "var(--surface-2)",
                    borderColor:
                      state.errorCorrection === id
                        ? "var(--accent)"
                        : "var(--border)",
                    color:
                      state.errorCorrection === id
                        ? "var(--accent)"
                        : "var(--text-secondary)",
                  }}
                >
                  <span className="font-mono font-bold text-sm">{id}</span>
                  <span className="font-mono text-[10px] mt-0.5">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </Section>

        <div className="h-px bg-(--border) my-1" />

        {/* ── Logo ── */}
        <Section title="Logo / Image" defaultOpen={false}>
          <div className="flex flex-col gap-3">
            {/* Upload */}
            <label
              htmlFor="logo-upload"
              className="flex items-center justify-center gap-2 py-3 rounded-sm border-2 border-dashed border-(--border)
                cursor-pointer hover:border-(--accent) transition-colors text-(--text-secondary) text-xs font-mono"
              aria-label="Upload logo image"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              {state.logo ? "Replace image" : "Upload PNG / SVG / JPG"}
            </label>
            <input
              id="logo-upload"
              type="file"
              accept="image/png,image/svg+xml,image/jpeg"
              className="sr-only"
              onChange={handleLogoUpload}
            />

            {state.logo && (
              <>
                <div className="flex items-center gap-3">
                  <img
                    src={state.logo}
                    alt="Logo preview"
                    className="w-12 h-12 object-contain border border-(--border) rounded-sm bg-white"
                    style={{
                      borderRadius:
                        state.logoShape === "circle"
                          ? "50%"
                          : state.logoShape === "rounded"
                            ? "6px"
                            : "2px",
                    }}
                  />
                  <button
                    onClick={() =>
                      dispatch({ type: "SET_LOGO", payload: null })
                    }
                    className="text-xs font-mono text-(--text-secondary) hover:text-(--text-primary) border border-(--border) px-2 py-1 rounded-sm transition-colors"
                  >
                    Remove
                  </button>
                </div>

                <Toggle
                  id="hide-logo"
                  checked={state.hideLogo}
                  onChange={(v) =>
                    dispatch({ type: "SET_HIDE_LOGO", payload: v })
                  }
                  label="Hide logo"
                />

                {!state.hideLogo && (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-mono text-(--text-secondary) uppercase tracking-widest">
                        Shape
                      </span>
                      <div className="flex gap-1.5">
                        {(["square", "circle", "rounded"] as const).map(
                          (shape) => (
                            <button
                              key={shape}
                              onClick={() =>
                                dispatch({
                                  type: "SET_LOGO_SHAPE",
                                  payload: shape,
                                })
                              }
                              className="flex-1 py-1.5 text-xs font-mono rounded-sm border transition-all"
                              style={{
                                background:
                                  state.logoShape === shape
                                    ? "color-mix(in srgb, var(--accent) 15%, transparent)"
                                    : "var(--surface-2)",
                                borderColor:
                                  state.logoShape === shape
                                    ? "var(--accent)"
                                    : "var(--border)",
                                color:
                                  state.logoShape === shape
                                    ? "var(--accent)"
                                    : "var(--text-secondary)",
                              }}
                            >
                              {shape.charAt(0).toUpperCase() + shape.slice(1)}
                            </button>
                          ),
                        )}
                      </div>
                    </div>

                    <Slider
                      id="logo-size"
                      label="Size"
                      value={state.logoSize}
                      min={10}
                      max={40}
                      unit="%"
                      onChange={(v) =>
                        dispatch({ type: "SET_LOGO_SIZE", payload: v })
                      }
                      tooltip="Logo size as % of QR code area"
                    />
                    <Slider
                      id="logo-margin"
                      label="Margin"
                      value={state.logoMargin}
                      min={0}
                      max={20}
                      unit="px"
                      onChange={(v) =>
                        dispatch({ type: "SET_LOGO_MARGIN", payload: v })
                      }
                      tooltip="White space around the logo"
                    />
                  </>
                )}
              </>
            )}
          </div>
        </Section>

        <div className="h-px bg-(--border) my-1" />

        {/* ── Frames ── */}
        <Section title="Frame" defaultOpen={false}>
          <FrameSelector value={frameId} onChange={setFrameId} />

          {frameId !== "none" && (
            <div className="flex flex-col gap-4 label-fade-in">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="frame-label"
                  className="text-xs font-mono text-(--text-secondary) uppercase tracking-widest"
                >
                  Label Text
                </label>
                <input
                  id="frame-label"
                  type="text"
                  value={frameLabelText}
                  onChange={(e) => setFrameLabelText(e.target.value)}
                  className="h-8 px-2.5 text-sm font-mono bg-(--surface-2) border border-(--border)
                    text-(--text-primary) rounded-sm outline-none focus:border-(--accent) transition-colors"
                  placeholder="Scan me"
                />
              </div>
              <ColorPicker
                label="Frame Color"
                value={frameColor}
                onChange={setFrameColor}
              />
              <ColorPicker
                label="Background Color"
                value={frameBgColor}
                onChange={setFrameBgColor}
              />
              <ColorPicker
                label="Label Color"
                value={frameLabelColor}
                onChange={setFrameLabelColor}
              />
              <Slider
                id="frame-font-size"
                label="Font Size"
                value={frameFontSize}
                min={10}
                max={36}
                unit="px"
                onChange={setFrameFontSize}
              />
            </div>
          )}
        </Section>

        <div className="h-px bg-(--border) my-1" />

        {/* ── Output size ── */}
        <Section title="Export Size" defaultOpen={false}>
          <Slider
            id="export-size"
            label="Size"
            value={exportSize}
            min={256}
            max={2048}
            step={128}
            unit="px"
            onChange={setExportSize}
          />
          <p className="text-xs font-mono text-(--text-secondary)">
            {exportSize} × {exportSize} px
          </p>
        </Section>
      </div>
    </aside>
  );

  // ── Download panel ──
  const downloadPanel = (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 p-4 rounded-sm
        bg-(--surface) border border-(--border) shadow-2xl"
      aria-label="Download options"
      style={{ boxShadow: "0 8px 32px var(--shadow)" }}
    >
      <p className="text-[10px] font-mono text-(--text-secondary) uppercase tracking-widest mb-1">
        Download
      </p>

      {/* SVG */}
      {frameId !== "none" ? (
        <Tooltip text="SVG export not available with frames">
          <button
            disabled
            className="flex items-center gap-2 px-4 py-2 text-xs font-mono rounded-sm border border-(--border)
              text-(--text-secondary) cursor-not-allowed opacity-40 w-full"
            aria-disabled="true"
          >
            <span className="w-4 text-center font-bold">SVG</span>
            <span>Vector</span>
          </button>
        </Tooltip>
      ) : (
        <button
          onClick={downloadSVG}
          className="flex items-center gap-2 px-4 py-2 text-xs font-mono rounded-sm border border-(--border)
            hover:border-(--accent) hover:text-(--accent) text-(--text-secondary) transition-colors w-full"
        >
          <span className="w-4 text-center font-bold">SVG</span>
          <span>Vector</span>
        </button>
      )}

      {/* PNG */}
      <button
        onClick={() => downloadCanvas("png")}
        className="flex items-center gap-2 px-4 py-2 text-xs font-mono rounded-sm border border-(--border)
          hover:border-(--accent) hover:text-(--accent) text-(--text-secondary) transition-colors w-full"
      >
        <span className="w-4 text-center font-bold">PNG</span>
        <span>Raster{state.bgTransparent ? " (transparent)" : ""}</span>
      </button>

      {/* WebP */}
      <button
        onClick={() => downloadCanvas("webp")}
        className="flex items-center gap-2 px-4 py-2 text-xs font-mono rounded-sm
          bg-(--accent) text-(--accent-fg) hover:opacity-90 transition-opacity w-full"
      >
        <span className="w-6 text-center font-bold">WebP</span>
        <span>Optimized</span>
      </button>

      <p className="text-[10px] font-mono text-(--text-secondary) mt-1">
        {exportSize} × {exportSize} px
      </p>
    </div>
  );

  // ── Mobile bottom tabs ──
  const mobileTabs = (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-(--border) bg-(--surface) md:hidden">
      {(["design", "preview", "download"] as MobileTab[]).map((tab) => (
        <button
          key={tab}
          onClick={() => setMobileTab(tab)}
          className="flex-1 py-3 text-xs font-mono uppercase tracking-widest transition-colors"
          style={{
            color:
              mobileTab === tab ? "var(--accent)" : "var(--text-secondary)",
            borderBottom:
              mobileTab === tab
                ? "2px solid var(--accent)"
                : "2px solid transparent",
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  );

  return (
    <>
      {/* Desktop layout */}
      <div className="hidden md:flex h-screen overflow-hidden bg-(--bg)">
        {sidebar}

        {/* Preview area */}
        <main className="flex-1 flex items-center justify-center bg-(--bg) overflow-hidden relative">
          {/* Subtle grid background */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle, var(--border) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <QRPreview
            state={state.hideLogo ? { ...state, logo: null } : state}
            frameId={frameId}
            frameColor={frameColor}
            frameBgColor={frameBgColor}
            frameLabelText={frameLabelText}
            frameLabelColor={frameLabelColor}
            frameFontSize={frameFontSize}
            isLoading={isLoading}
          />
        </main>
      </div>

      {/* Mobile layout */}
      <div className="flex flex-col md:hidden min-h-screen bg-(--bg) pb-14">
        {/* Mobile header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-(--border) bg-(--surface) sticky top-0 z-40">
          <h1
            className="text-sm font-bold text-(--text-primary)"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            QR Maker
          </h1>
          <ThemeToggle />
        </div>

        {/* Mobile content */}
        {mobileTab === "design" && (
          <div className="px-4 py-4 flex flex-col gap-3 overflow-y-auto">
            {/* Reuse sidebar content sections without the sticky wrapper */}
            <MobileSidebarContent
              state={state}
              dispatch={dispatch}
              qrType={qrType}
              fields={fields}
              onTypeChange={handleTypeChange}
              onFieldChange={handleFieldChange}
              frameId={frameId}
              setFrameId={setFrameId}
              frameColor={frameColor}
              setFrameColor={setFrameColor}
              frameBgColor={frameBgColor}
              setFrameBgColor={setFrameBgColor}
              frameLabelText={frameLabelText}
              setFrameLabelText={setFrameLabelText}
              frameLabelColor={frameLabelColor}
              setFrameLabelColor={setFrameLabelColor}
              frameFontSize={frameFontSize}
              setFrameFontSize={setFrameFontSize}
              exportSize={exportSize}
              setExportSize={setExportSize}
            />
          </div>
        )}

        {mobileTab === "preview" && (
          <div className="flex-1 flex items-center justify-center p-6 relative">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle, var(--border) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />
            <QRPreview
              state={state.hideLogo ? { ...state, logo: null } : state}
              frameId={frameId}
              frameColor={frameColor}
              frameBgColor={frameBgColor}
              frameLabelText={frameLabelText}
              frameLabelColor={frameLabelColor}
              frameFontSize={frameFontSize}
              isLoading={isLoading}
            />
          </div>
        )}

        {mobileTab === "download" && (
          <div className="p-6 flex flex-col gap-3 max-w-sm mx-auto w-full">
            <p className="text-xs font-mono text-(--text-secondary) uppercase tracking-widest">
              Download
            </p>

            {frameId !== "none" ? (
              <Tooltip text="SVG export not available with frames">
                <button
                  disabled
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-mono rounded-sm border border-(--border) text-(--text-secondary) cursor-not-allowed opacity-40"
                >
                  SVG — Vector
                </button>
              </Tooltip>
            ) : (
              <button
                onClick={downloadSVG}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-mono rounded-sm border border-(--border) hover:border-(--accent) text-(--text-secondary) hover:text-(--accent) transition-colors"
              >
                SVG — Vector
              </button>
            )}

            <button
              onClick={() => downloadCanvas("png")}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-mono rounded-sm border border-(--border) hover:border-(--accent) text-(--text-secondary) hover:text-(--accent) transition-colors"
            >
              PNG — Raster
            </button>

            <button
              onClick={() => downloadCanvas("webp")}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-mono rounded-sm bg-(--accent) text-(--accent-fg) hover:opacity-90 transition-opacity"
            >
              WebP — Optimized
            </button>

            <p className="text-xs font-mono text-(--text-secondary) text-center mt-2">
              {exportSize} × {exportSize} px
            </p>
          </div>
        )}
      </div>

      {/* Download panel (desktop) */}
      <div className="hidden md:block">{downloadPanel}</div>

      {/* Mobile tabs */}
      {mobileTabs}

      {/* Toast */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  );
}

// ── Mobile sidebar content (reuses same logic, different layout) ──────────────

interface MobileSidebarContentProps {
  state: QREditorState;
  dispatch: React.Dispatch<Action>;
  qrType: QRType;
  fields: Record<string, string>;
  onTypeChange: (type: QRType) => void;
  onFieldChange: (key: string, value: string) => void;
  frameId: FrameId;
  setFrameId: (id: FrameId) => void;
  frameColor: string;
  setFrameColor: (c: string) => void;
  frameBgColor: string;
  setFrameBgColor: (c: string) => void;
  frameLabelText: string;
  setFrameLabelText: (t: string) => void;
  frameLabelColor: string;
  setFrameLabelColor: (c: string) => void;
  frameFontSize: number;
  setFrameFontSize: (n: number) => void;
  exportSize: number;
  setExportSize: (n: number) => void;
}

function MobileSidebarContent({
  state,
  dispatch,
  qrType,
  fields,
  onTypeChange,
  onFieldChange,
  frameId,
  setFrameId,
  frameColor,
  setFrameColor,
  frameBgColor,
  setFrameBgColor,
  frameLabelText,
  setFrameLabelText,
  frameLabelColor,
  setFrameLabelColor,
  frameFontSize,
  setFrameFontSize,
  exportSize,
  setExportSize,
}: MobileSidebarContentProps) {
  return (
    <div className="flex flex-col gap-3">
      <ContentSection
        qrType={qrType}
        fields={fields}
        onTypeChange={onTypeChange}
        onFieldChange={onFieldChange}
      />

      <div className="h-px bg-(--border)" />

      <Section title="Dot Style">
        <ShapeGrid
          label="Shape"
          options={DOT_SHAPES}
          value={state.dotShape}
          onChange={(v) => dispatch({ type: "SET_DOT_SHAPE", payload: v })}
          columns={3}
        />
        <GradientPicker
          label="Color"
          color1={state.dotGradient.color1}
          color2={state.dotGradient.color2}
          gradientType={state.dotGradient.type}
          enabled={state.dotGradient.enabled}
          onToggle={(v) =>
            dispatch({ type: "SET_DOT_GRADIENT", payload: { enabled: v } })
          }
          onColor1={(v) =>
            dispatch({ type: "SET_DOT_GRADIENT", payload: { color1: v } })
          }
          onColor2={(v) =>
            dispatch({ type: "SET_DOT_GRADIENT", payload: { color2: v } })
          }
          onTypeChange={(v) =>
            dispatch({ type: "SET_DOT_GRADIENT", payload: { type: v } })
          }
        />
      </Section>

      <div className="h-px bg-(--border)" />

      <Section title="Corner Squares" defaultOpen={false}>
        <ShapeGrid
          label="Shape"
          options={CORNER_SQUARE_SHAPES}
          value={state.cornerSquareShape}
          onChange={(v) =>
            dispatch({ type: "SET_CORNER_SQUARE_SHAPE", payload: v })
          }
          columns={3}
        />
        <ColorPicker
          label="Color"
          value={state.cornerSquareColor}
          onChange={(v) =>
            dispatch({ type: "SET_CORNER_SQUARE_COLOR", payload: v })
          }
        />
      </Section>

      <div className="h-px bg-(--border)" />

      <Section title="Background" defaultOpen={false}>
        <Toggle
          id="m-bg-transparent"
          checked={state.bgTransparent}
          onChange={(v) => dispatch({ type: "SET_BG_TRANSPARENT", payload: v })}
          label="Transparent"
        />
        {!state.bgTransparent && (
          <ColorPicker
            label="Color"
            value={state.bgColor}
            onChange={(v) => dispatch({ type: "SET_BG_COLOR", payload: v })}
          />
        )}
      </Section>

      <div className="h-px bg-(--border)" />

      <Section title="Frame" defaultOpen={false}>
        <FrameSelector value={frameId} onChange={setFrameId} />
        {frameId !== "none" && (
          <div className="flex flex-col gap-3 label-fade-in">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-(--text-secondary) uppercase tracking-widest">
                Label
              </label>
              <input
                type="text"
                value={frameLabelText}
                onChange={(e) => setFrameLabelText(e.target.value)}
                className="h-8 px-2.5 text-sm font-mono bg-(--surface-2) border border-(--border) text-(--text-primary) rounded-sm outline-none focus:border-(--accent) transition-colors"
                placeholder="Scan me"
              />
            </div>
            <ColorPicker
              label="Frame Color"
              value={frameColor}
              onChange={setFrameColor}
            />
            <ColorPicker
              label="Background Color"
              value={frameBgColor}
              onChange={setFrameBgColor}
            />
            <ColorPicker
              label="Label Color"
              value={frameLabelColor}
              onChange={setFrameLabelColor}
            />
            <Slider
              id="m-frame-font-size"
              label="Font Size"
              value={frameFontSize}
              min={10}
              max={36}
              unit="px"
              onChange={setFrameFontSize}
            />
          </div>
        )}
      </Section>

      <div className="h-px bg-(--border)" />

      <Section title="Export Size" defaultOpen={false}>
        <Slider
          id="m-export-size"
          label="Size"
          value={exportSize}
          min={256}
          max={2048}
          step={128}
          unit="px"
          onChange={setExportSize}
        />
        <p className="text-xs font-mono text-(--text-secondary)">
          {exportSize} × {exportSize} px
        </p>
      </Section>
    </div>
  );
}
