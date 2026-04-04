# QR Maker

A fully client-side QR code generator with custom styles, frames, gradients, logo embedding, and PNG/WebP export. Built with Astro, React 19, and TypeScript.

**Live demo:** [danidoble.github.io/qr-maker](https://danidoble.github.io/qr-maker)

## Features

- Custom dot and corner shapes
- Solid color or linear/radial gradient dots
- Transparent or solid background
- Logo/image embedding with size and margin controls
- 6 decorative frames (Simple, Rounded, Ticket, Speech Bubble, Banner, Polaroid)
- Custom frame color, background color, label text, and font size
- Error correction level selection (L / M / Q / H)
- Dark/light theme toggle
- Export as PNG or WebP at configurable resolution
- Zero server — fully static, works offline

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | [Astro 6](https://astro.build) (static output) |
| UI | [React 19](https://react.dev) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) |
| QR engine | [qr-code-styling](https://github.com/kozakdenys/qr-code-styling) |
| Language | TypeScript (strict) |
| Deploy | GitHub Pages via GitHub Actions |

## Project Structure

```
src/
├── components/
│   ├── QREditor.tsx          # Main editor — state, controls, layout
│   ├── QRPreview.tsx         # Live preview with frame overlay
│   ├── FrameSelector.tsx     # Frame picker UI
│   ├── ThemeToggle.tsx       # Dark/light toggle
│   ├── controls/             # Reusable controls (ColorPicker, Slider, Toggle…)
│   └── frames/
│       ├── FrameRenderer.tsx # Dispatches to the correct frame component
│       ├── frameLayout.ts    # Shared layout calculator (padding ratios)
│       ├── types.ts          # FrameId, FrameProps, FrameLayout types
│       ├── FrameSimple.tsx
│       ├── FrameRounded.tsx
│       ├── FrameTicket.tsx
│       ├── FrameSpeechBubble.tsx
│       ├── FrameBanner.tsx
│       ├── FramePolaroid.tsx
│       └── renderFrameSVG.ts # Serializes frame to SVG string for export
├── hooks/
│   ├── useQRCode.ts          # QRCodeStyling instance lifecycle
│   ├── useDownload.ts        # PNG/WebP export pipeline
│   └── useTheme.ts           # Theme persistence
├── layouts/Layout.astro
└── pages/index.astro
```

## Getting Started

```bash
npm install
npm run dev
```

Open [localhost:4321/qr-maker](http://localhost:4321/qr-maker).

## Commands

| Command | Action |
| --- | --- |
| `npm run dev` | Start dev server at `localhost:4321` |
| `npm run build` | Build static site to `./dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |

## Deployment

The project deploys automatically to GitHub Pages on every push to `main` via `.github/workflows/deploy.yml`.

To enable it in your fork:
1. Go to **Settings → Pages**
2. Set **Source** to **GitHub Actions**

## License

[Apache 2.0](LICENSE)
