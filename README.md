# Yang-MarkD

<p align="center">
  <img src="public/yang-markd.png" width="128" alt="Yang-MarkD icon" />
</p>

<p align="center">
  <strong>The Markdown viewer for AI-generated docs.</strong><br/>
  A 3 MB portable app that renders what Claude, ChatGPT and Copilot write — box-drawing diagrams, tables, local SVG images and Chinese text — exactly as intended.
</p>

<p align="center">
  <a href="https://github.com/xiaojunyang0805/Yang-MarkD/releases/latest"><strong>Download</strong></a> ·
  <a href="README_CN.md">中文说明</a>
</p>

<p align="center">
  <img src="docs/images/screenshot-light.png" width="720" alt="Yang-MarkD showing an AI-generated design note with an SVG architecture diagram and an aligned box-drawing diagram" />
</p>

## Why Yang-MarkD?

AI assistants increasingly hand you `.md` files instead of chat replies: design notes, reports, plans. Most viewers get the hard parts wrong:

- **Box-drawing diagrams** (`┌─┐ │ └─┘ ▶`) drift out of alignment, especially when labels contain Chinese characters. Yang-MarkD lays them out on a true character grid, with CJK characters taking two columns.
- **Local images** like `![](figures/diagram.svg)` don't load. Yang-MarkD loads SVG/PNG/JPG files relative to the `.md` file — no server needed.
- **Mixed Chinese/English** text and tables render cleanly.

And it stays out of your way: it's a **viewer, not an editor**. Double-click a `.md` file and read.

## Download

Go to the [**Releases page**](https://github.com/xiaojunyang0805/Yang-MarkD/releases/latest) and download for your platform.

### Windows

**Portable (no install):**

1. Download **Yang-MarkD_1.0.4_x64_portable.zip** (3 MB)
2. Extract the zip — you'll get a `Yang-MarkD` folder
3. Double-click **`yang-markd.exe`** to run

**Installer:** download **Yang-MarkD_1.0.4_x64_en-US.msi** to install it and associate it with `.md` files.

> Requires Windows 10/11 (x64) with WebView2 (pre-installed on modern Windows).
>
> **"Windows protected your PC"?** The app is not code-signed yet, so SmartScreen may warn on first run. Click **More info → Run anyway**. The source is all here, and every release is built from it.

### Linux

| Format | File |
|--------|------|
| AppImage (portable) | `Yang-MarkD_1.0.4_amd64.AppImage` |
| Debian/Ubuntu | `Yang-MarkD_1.0.4_amd64.deb` |
| Fedora/RHEL | `Yang-MarkD-1.0.4-1.x86_64.rpm` |

For the AppImage, make it executable and run:
```bash
chmod +x Yang-MarkD_*.AppImage
./Yang-MarkD_*.AppImage
```

> Requires a Linux distribution with WebKitGTK 4.1 (Ubuntu 22.04+, Fedora 36+, etc.).

## Features

- **Box-drawing diagrams** rendered on a fixed character grid (CJK-aware)
- **Local images** (SVG, PNG, JPG, GIF, WebP) loaded relative to the Markdown file
- **Drag & drop** or open `.md` files via native file dialog
- **File association** — set as default app for `.md` files and double-click to open
- **Light / Dark** theme
- **Table of Contents** sidebar with heading navigation
- **Font size** adjustment (12–24px)
- **Raw / Rich** view toggle
- **Export to PDF**
- **Word count** and estimated read time
- Full GFM support: tables, task lists, fenced code blocks, strikethrough
- External links open in your system browser

Try it with the demo document: [`docs/demo/AI_Design_Note.md`](docs/demo/AI_Design_Note.md).

## Screenshots

| Light | Dark |
|-------|------|
| ![Light theme](docs/images/screenshot-light.png) | ![Dark theme](docs/images/screenshot-dark.png) |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop runtime | [Tauri v2](https://tauri.app/) (Rust) |
| Frontend | [React 19](https://react.dev/) + [Vite](https://vite.dev/) |
| Markdown | [marked](https://marked.js.org/) + [DOMPurify](https://github.com/cure53/DOMPurify) |
| Package manager | [bun](https://bun.sh/) |
| Styling | CSS custom properties (no CSS-in-JS) |

## Development

### Prerequisites

- [bun](https://bun.sh/) (v1.0+)
- [Rust](https://rustup.rs/) (stable)
- **Linux only:** `libwebkit2gtk-4.1-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`

### Development

```bash
# Install dependencies
bun install

# Run in development mode (opens Tauri window with hot reload)
bun run tauri dev
```

### Build

```bash
# Build production executable and installers
bun run tauri build
```

Output files:

**Windows:**

| Format | Location |
|--------|----------|
| Standalone `.exe` | `src-tauri/target/release/yang-markd.exe` |
| NSIS installer | `src-tauri/target/release/bundle/nsis/Yang-MarkD_*_x64-setup.exe` |
| MSI installer | `src-tauri/target/release/bundle/msi/Yang-MarkD_*_x64_en-US.msi` |

**Linux:**

| Format | Location |
|--------|----------|
| AppImage | `src-tauri/target/release/bundle/appimage/*.AppImage` |
| Debian package | `src-tauri/target/release/bundle/deb/*.deb` |
| RPM package | `src-tauri/target/release/bundle/rpm/*.rpm` |

> Linux builds are also available via GitHub Actions — see `.github/workflows/build-linux.yml`.

## Project Structure

```
src/
  components/     Toolbar, TableOfContents, ContentView, DropOverlay
  hooks/          useFileHandler (file open + drag-drop logic)
  lib/            markdown renderer (marked + DOMPurify), utilities
  styles/         themes.css, global.css, markdown.css
  App.jsx         Root component
  main.jsx        Entry point

src-tauri/        Tauri Rust backend
  src/main.rs     App entry with dialog, fs + opener plugins

.github/workflows/  CI/CD
  build-linux.yml   Linux build (deb, AppImage, rpm)
```

## License

[MIT](LICENSE)
