# QR Maker

A guided QR code design studio that runs entirely in your browser. Pick what the code opens, style it, frame it, and export it. Every design is decoded back before you download it, so you know it scans.

**Live:** [danidoble.github.io/qr-maker](https://danidoble.github.io/qr-maker)

## What it does

- **Guided flow in 4 steps**: Content → Style → Frame → Export, with a live 3D preview and validation at each step.
- **10 content types**: Website, Wi‑Fi, Contact (vCard), Text, Email, Call, SMS, WhatsApp, Location, Event (iCalendar). Fields are validated, and each type keeps its own data when you switch between them.
- **Scan verification**: the design is rendered to pixels and decoded with `jsQR` (with simulated camera blur). The preview shows _Scan verified_ or _Hard to scan_.
- **Styling**: 10 dot patterns, 6 corner frames × 6 corner dots, solid/linear/radial fills, custom corner colors, background, quiet zone and error correction. Includes 15 presets and a _Surprise me_ button that only picks combinations that pass the scan check.
- **Logos**: upload (drag & drop, auto-downscaled) or use one of 14 built-in vector icons, with a backdrop shape. Error correction switches to H automatically.
- **15 frames**: Card, Button, Speech, Ticket, Polaroid, Phone, Viewfinder, Seal, Ribbon, Stamp, Tag, Doodle, Aura, Editorial, Browser. Each has 6 typefaces, palettes, and a "Match my QR" option.
- **Export**: PNG, SVG, WebP or JPG at up to 4K. SVG export works with frames too, and fonts are embedded. You can also copy the image, use the native share sheet, or copy an **edit link** that reopens the exact design.
- **Undo/redo**, autosave, light/dark theme, reduced-motion support, and keyboard shortcuts (`⌘/Ctrl+Z`, `⌘/Ctrl+Shift+Z`, `⌘/Ctrl+Enter` next step, `⌘/Ctrl+S` download).

## Stack

Astro 6 (static) · React 19 · Tailwind CSS 4 · [Motion](https://motion.dev) · [`qrcode-generator`](https://github.com/kazuhikoarase/qrcode-generator) (encoding) · [`jsQR`](https://github.com/cozmo/jsQR) (verification) · Fontsource.

## Architecture

All rendering is done with **pure functions that return SVG strings**. The preview, the thumbnails and every export go through the same `compose()` call, so what you see is exactly what you download.

```
src/
├── lib/                     # framework-free, pure TS
│   ├── qr/encode.ts         # data → module matrix (UTF‑8, cached)
│   ├── qr/render.ts         # matrix + style → SVG (dots, eyes, alignment, logo)
│   ├── frames.ts            # 15 frames: (qr size, style) → layout + SVG
│   ├── compose.ts           # design → one standalone SVG document
│   ├── content.ts           # content types: fields, validation, payload
│   ├── presets.ts           # style presets + "surprise me"
│   ├── export.ts            # PNG/SVG/WebP/JPG, clipboard, share
│   ├── scan.ts              # render → jsQR decode round-trip
│   ├── fonts.ts             # typefaces + @font-face embedding for exports
│   ├── design.ts            # Design types, defaults, sanitizing
│   └── color.ts, svg.ts, icons.ts
├── hooks/
│   ├── useDesign.ts         # state + undo/redo + autosave + share links
│   ├── useScanCheck.ts      # debounced verification
│   └── useTheme.ts
└── components/
    ├── Studio.tsx           # layout, step flow, shortcuts, export actions
    ├── studio/              # Stage (preview), Stepper, small shared bits
    ├── steps/               # ContentStep, StyleStep, FrameStep, ExportStep
    └── ui/                  # Button, Segmented, TileGrid, ColorField, Slider…
```

### Extending

- **New frame**: add a `FrameDef` to `src/lib/frames.ts` and include it in `FRAMES`. It receives the QR size (always 1000 units) and returns `{ width, height, qrX, qrY, back, front }`. The gallery picks it up automatically.
- **New content type**: add an entry to `CONTENT_TYPES` in `src/lib/content.ts` with `fields`, `validate` and `build`. The form is generated from it.
- **New preset**: add one to `PRESETS` in `src/lib/presets.ts`.

## Development

```sh
pnpm install
pnpm dev        # http://localhost:4321/qr-maker
pnpm check      # type-check
pnpm lint
pnpm build      # → dist/
```

Pushing to `main` deploys to GitHub Pages (`.github/workflows/deploy.yml`).

## License

Apache-2.0 — see [LICENSE](LICENSE).
