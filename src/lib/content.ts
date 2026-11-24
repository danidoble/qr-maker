import type { IconName } from "./icons";

export type ContentType =
  | "url"
  | "text"
  | "wifi"
  | "contact"
  | "email"
  | "phone"
  | "sms"
  | "whatsapp"
  | "location"
  | "event";

export type FieldKind =
  | "text"
  | "textarea"
  | "url"
  | "email"
  | "tel"
  | "password"
  | "datetime"
  | "choice"
  | "toggle";

export interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  /** Occupies half a row on wide panels. */
  half?: boolean;
  options?: { value: string; label: string }[];
  autoComplete?: string;
}

export interface ContentTypeDef {
  id: ContentType;
  label: string;
  tagline: string;
  icon: IconName;
  fields: FieldDef[];
  /** Field-level validation. Returns errors keyed by field. */
  validate: (f: Fields) => Errors;
  build: (f: Fields) => string;
  /** Short human summary (used for file names and frame sublabels). */
  summary: (f: Fields) => string;
  /** Suggested call-to-action label for frames. */
  cta: string;
}

type Fields = Record<string, string>;
type Errors = { [field: string]: string | undefined };

const v = (f: Fields, k: string) => (f[k] ?? "").trim();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s().-]{5,}$/;

/** Escape `\ ; , : "` as required by the WIFI: and MECARD-like formats. */
const wifiEsc = (s: string) => s.replace(/([\\;,:"])/g, "\\$1");
/** vCard / iCalendar text escaping. */
const icsEsc = (s: string) =>
  s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/([,;])/g, "\\$1");

export function normalizeUrl(raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  if (/^[a-z][a-z\d+.-]*:/i.test(s)) return s;
  return `https://${s}`;
}

function looksLikeUrl(raw: string): boolean {
  try {
    const u = new URL(normalizeUrl(raw));
    return (
      !!u.hostname &&
      (u.hostname.includes(".") ||
        u.hostname === "localhost" ||
        !/^https?:$/.test(u.protocol))
    );
  } catch {
    return false;
  }
}

function hostOf(raw: string): string {
  try {
    const u = new URL(normalizeUrl(raw));
    return (
      u.hostname.replace(/^www\./, "") + (u.pathname !== "/" ? u.pathname : "")
    ).replace(/\/$/, "");
  } catch {
    return raw;
  }
}

const digits = (s: string) => s.replace(/[^\d+]/g, "");

/** "2026-11-24T18:30" → "20261124T183000" (floating local time). */
function icsDate(s: string): string {
  return s.replace(/[-:]/g, "").padEnd(13, "0").slice(0, 13) + "00";
}

export const CONTENT_TYPES: ContentTypeDef[] = [
  {
    id: "url",
    label: "Website",
    tagline: "Open a link",
    icon: "link",
    cta: "Scan me",
    fields: [
      {
        key: "url",
        label: "URL",
        kind: "url",
        placeholder: "example.com/menu",
        hint: "We'll add https:// if you leave it out.",
        required: true,
        autoComplete: "url",
      },
    ],
    validate: (f) =>
      !v(f, "url")
        ? { url: "Add a link" }
        : looksLikeUrl(v(f, "url"))
          ? {}
          : { url: "That doesn't look like a link" },
    build: (f) => normalizeUrl(v(f, "url")),
    summary: (f) => hostOf(v(f, "url")),
  },
  {
    id: "wifi",
    label: "Wi‑Fi",
    tagline: "Join a network",
    icon: "wifi",
    cta: "Scan for Wi‑Fi",
    fields: [
      {
        key: "ssid",
        label: "Network name",
        kind: "text",
        placeholder: "Cafe Guest",
        required: true,
      },
      {
        key: "password",
        label: "Password",
        kind: "password",
        placeholder: "••••••••",
      },
      {
        key: "security",
        label: "Security",
        kind: "choice",
        options: [
          { value: "WPA", label: "WPA/WPA2" },
          { value: "WEP", label: "WEP" },
          { value: "nopass", label: "Open" },
        ],
      },
      { key: "hidden", label: "Hidden network", kind: "toggle" },
    ],
    validate: (f) => {
      const e: Record<string, string> = {};
      if (!v(f, "ssid")) e.ssid = "Add the network name";
      if ((f.security ?? "WPA") !== "nopass" && !v(f, "password"))
        e.password = "Add the password, or choose Open";
      return e;
    },
    build: (f) => {
      const sec = f.security ?? "WPA";
      const pass = sec === "nopass" ? "" : `P:${wifiEsc(f.password ?? "")};`;
      return `WIFI:T:${sec};S:${wifiEsc(f.ssid ?? "")};${pass}${f.hidden === "true" ? "H:true;" : ""};`;
    },
    summary: (f) => v(f, "ssid") || "Wi‑Fi",
  },
  {
    id: "contact",
    label: "Contact",
    tagline: "Save a vCard",
    icon: "user",
    cta: "Save my contact",
    fields: [
      {
        key: "first",
        label: "First name",
        kind: "text",
        placeholder: "Ada",
        half: true,
        autoComplete: "given-name",
      },
      {
        key: "last",
        label: "Last name",
        kind: "text",
        placeholder: "Lovelace",
        half: true,
        autoComplete: "family-name",
      },
      {
        key: "phone",
        label: "Phone",
        kind: "tel",
        placeholder: "+52 55 1234 5678",
        half: true,
        autoComplete: "tel",
      },
      {
        key: "email",
        label: "Email",
        kind: "email",
        placeholder: "ada@example.com",
        half: true,
        autoComplete: "email",
      },
      {
        key: "org",
        label: "Company",
        kind: "text",
        placeholder: "Analytical Engines",
        half: true,
        autoComplete: "organization",
      },
      {
        key: "title",
        label: "Job title",
        kind: "text",
        placeholder: "Engineer",
        half: true,
      },
      {
        key: "website",
        label: "Website",
        kind: "url",
        placeholder: "example.com",
      },
      {
        key: "address",
        label: "Address",
        kind: "text",
        placeholder: "Street, City, Country",
      },
    ],
    validate: (f) => {
      const e: Record<string, string> = {};
      if (!v(f, "first") && !v(f, "last") && !v(f, "org"))
        e.first = "Add at least a name or company";
      if (v(f, "email") && !EMAIL_RE.test(v(f, "email")))
        e.email = "Check the email";
      if (v(f, "phone") && !PHONE_RE.test(v(f, "phone")))
        e.phone = "Check the number";
      return e;
    },
    build: (f) => {
      const L = ["BEGIN:VCARD", "VERSION:3.0"];
      L.push(`N:${icsEsc(v(f, "last"))};${icsEsc(v(f, "first"))};;;`);
      L.push(
        `FN:${icsEsc([v(f, "first"), v(f, "last")].filter(Boolean).join(" ") || v(f, "org"))}`,
      );
      if (v(f, "org")) L.push(`ORG:${icsEsc(v(f, "org"))}`);
      if (v(f, "title")) L.push(`TITLE:${icsEsc(v(f, "title"))}`);
      if (v(f, "phone")) L.push(`TEL;TYPE=CELL:${v(f, "phone")}`);
      if (v(f, "email")) L.push(`EMAIL:${v(f, "email")}`);
      if (v(f, "website")) L.push(`URL:${normalizeUrl(v(f, "website"))}`);
      if (v(f, "address")) L.push(`ADR:;;${icsEsc(v(f, "address"))};;;;`);
      L.push("END:VCARD");
      return L.join("\n");
    },
    summary: (f) =>
      [v(f, "first"), v(f, "last")].filter(Boolean).join(" ") ||
      v(f, "org") ||
      "Contact",
  },
  {
    id: "text",
    label: "Text",
    tagline: "Plain message",
    icon: "text",
    cta: "Scan to read",
    fields: [
      {
        key: "text",
        label: "Text",
        kind: "textarea",
        placeholder: "Anything you want to share…",
        required: true,
      },
    ],
    validate: (f) => (v(f, "text") ? {} : { text: "Write something" }),
    build: (f) => f.text ?? "",
    summary: (f) => v(f, "text").slice(0, 32) || "Text",
  },
  {
    id: "email",
    label: "Email",
    tagline: "Draft a message",
    icon: "mail",
    cta: "Email us",
    fields: [
      {
        key: "to",
        label: "To",
        kind: "email",
        placeholder: "hello@example.com",
        required: true,
      },
      {
        key: "subject",
        label: "Subject",
        kind: "text",
        placeholder: "Hi there",
      },
      {
        key: "body",
        label: "Message",
        kind: "textarea",
        placeholder: "Optional message",
      },
    ],
    validate: (f) =>
      !v(f, "to")
        ? { to: "Add an email address" }
        : EMAIL_RE.test(v(f, "to"))
          ? {}
          : { to: "Check the email" },
    build: (f) => {
      const q = [
        v(f, "subject") && `subject=${encodeURIComponent(v(f, "subject"))}`,
        v(f, "body") && `body=${encodeURIComponent(f.body ?? "")}`,
      ].filter(Boolean);
      return `mailto:${v(f, "to")}${q.length ? "?" + q.join("&") : ""}`;
    },
    summary: (f) => v(f, "to") || "Email",
  },
  {
    id: "phone",
    label: "Call",
    tagline: "Dial a number",
    icon: "phone",
    cta: "Call us",
    fields: [
      {
        key: "tel",
        label: "Phone number",
        kind: "tel",
        placeholder: "+52 55 1234 5678",
        required: true,
      },
    ],
    validate: (f) =>
      !v(f, "tel")
        ? { tel: "Add a number" }
        : PHONE_RE.test(v(f, "tel"))
          ? {}
          : { tel: "Check the number" },
    build: (f) => `tel:${digits(v(f, "tel"))}`,
    summary: (f) => v(f, "tel") || "Phone",
  },
  {
    id: "sms",
    label: "SMS",
    tagline: "Prefilled text",
    icon: "message",
    cta: "Text us",
    fields: [
      {
        key: "to",
        label: "Phone number",
        kind: "tel",
        placeholder: "+52 55 1234 5678",
        required: true,
      },
      {
        key: "body",
        label: "Message",
        kind: "textarea",
        placeholder: "Optional message",
      },
    ],
    validate: (f) =>
      !v(f, "to")
        ? { to: "Add a number" }
        : PHONE_RE.test(v(f, "to"))
          ? {}
          : { to: "Check the number" },
    build: (f) => `SMSTO:${digits(v(f, "to"))}:${f.body ?? ""}`,
    summary: (f) => v(f, "to") || "SMS",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    tagline: "Start a chat",
    icon: "chat",
    cta: "Chat with us",
    fields: [
      {
        key: "to",
        label: "Phone number",
        kind: "tel",
        placeholder: "+52 55 1234 5678",
        hint: "Include the country code.",
        required: true,
      },
      {
        key: "body",
        label: "Message",
        kind: "textarea",
        placeholder: "Hi! I'd like to know more…",
      },
    ],
    validate: (f) => {
      const d = digits(v(f, "to")).replace("+", "");
      return !d
        ? { to: "Add a number" }
        : d.length < 8
          ? { to: "Include the country code" }
          : {};
    },
    build: (f) => {
      const d = digits(v(f, "to")).replace("+", "");
      return `https://wa.me/${d}${v(f, "body") ? `?text=${encodeURIComponent(f.body ?? "")}` : ""}`;
    },
    summary: (f) => v(f, "to") || "WhatsApp",
  },
  {
    id: "location",
    label: "Location",
    tagline: "Pin on a map",
    icon: "pin",
    cta: "Find us",
    fields: [
      {
        key: "query",
        label: "Address or coordinates",
        kind: "text",
        placeholder: "Palacio de Bellas Artes, CDMX  or  19.4352,-99.1412",
        hint: "Opens in the phone's maps app.",
        required: true,
      },
    ],
    validate: (f) => (v(f, "query") ? {} : { query: "Add a place" }),
    build: (f) =>
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v(f, "query"))}`,
    summary: (f) => v(f, "query") || "Location",
  },
  {
    id: "event",
    label: "Event",
    tagline: "Add to calendar",
    icon: "calendar",
    cta: "Save the date",
    fields: [
      {
        key: "title",
        label: "Event name",
        kind: "text",
        placeholder: "Launch party",
        required: true,
      },
      {
        key: "start",
        label: "Starts",
        kind: "datetime",
        half: true,
        required: true,
      },
      { key: "end", label: "Ends", kind: "datetime", half: true },
      {
        key: "where",
        label: "Location",
        kind: "text",
        placeholder: "Rooftop, 5th floor",
      },
      {
        key: "notes",
        label: "Notes",
        kind: "textarea",
        placeholder: "Optional details",
      },
    ],
    validate: (f) => {
      const e: Record<string, string> = {};
      if (!v(f, "title")) e.title = "Name your event";
      if (!v(f, "start")) e.start = "Pick a start time";
      if (v(f, "start") && v(f, "end") && v(f, "end") < v(f, "start"))
        e.end = "Ends before it starts";
      return e;
    },
    build: (f) => {
      const L = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "BEGIN:VEVENT",
        `SUMMARY:${icsEsc(v(f, "title"))}`,
      ];
      if (v(f, "start")) L.push(`DTSTART:${icsDate(v(f, "start"))}`);
      if (v(f, "end")) L.push(`DTEND:${icsDate(v(f, "end"))}`);
      if (v(f, "where")) L.push(`LOCATION:${icsEsc(v(f, "where"))}`);
      if (v(f, "notes")) L.push(`DESCRIPTION:${icsEsc(f.notes ?? "")}`);
      L.push("END:VEVENT", "END:VCALENDAR");
      return L.join("\n");
    },
    summary: (f) => v(f, "title") || "Event",
  },
];

export const CONTENT_MAP = Object.fromEntries(
  CONTENT_TYPES.map((t) => [t.id, t]),
) as Record<ContentType, ContentTypeDef>;

export interface ResolvedContent {
  data: string;
  valid: boolean;
  errors: Record<string, string>;
  summary: string;
  def: ContentTypeDef;
}

/** Shown (dimmed) while the user hasn't entered anything yet. */
export const PLACEHOLDER_DATA = "https://danidoble.github.io/qr-maker";

/** Fields are stored namespaced per type ("wifi.ssid") so switching types never loses data. */
export const fieldKey = (type: ContentType, key: string) => `${type}.${key}`;

export function typeFields(type: ContentType, all: Fields): Fields {
  const prefix = type + ".";
  const out: Fields = {};
  for (const [k, val] of Object.entries(all))
    if (k.startsWith(prefix)) out[k.slice(prefix.length)] = val;
  return out;
}

export function resolveContent(
  type: ContentType,
  all: Fields,
): ResolvedContent {
  const def = CONTENT_MAP[type] ?? CONTENT_MAP.url;
  const fields = typeFields(def.id, all);
  const errors = Object.fromEntries(
    Object.entries(def.validate(fields)).filter(
      (e): e is [string, string] => !!e[1],
    ),
  );
  const valid = Object.keys(errors).length === 0;
  return {
    def,
    errors,
    valid,
    data: valid ? def.build(fields) : "",
    summary: def.summary(fields),
  };
}

export function slugify(s: string): string {
  return (
    s
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "qr"
  );
}
