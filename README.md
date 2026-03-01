# Yang-MarkD

<p align="center">
  <img src="public/yang-markd.png" width="128" alt="Yang-MarkD icon" />
</p>

<p align="center">
  A clean, distraction-free Markdown viewer built with <strong>Tauri v2</strong> and <strong>React</strong>.
</p>

## Features

- **Drag & drop** or open `.md` files via native file dialog
- **File association** — set as default app for `.md` files and double-click to open
- **Light / Dark** theme toggle with CSS custom properties
- **Table of Contents** sidebar with heading navigation
- **Font size** adjustment (12–24px)
- **Raw / Rich** view toggle
- **Word count** and estimated read time
- Full GFM support: tables, task lists, fenced code blocks, strikethrough

## Screenshot

![Yang-MarkD screenshot](Yang-MarkD%20screenshot.png)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop runtime | [Tauri v2](https://tauri.app/) (Rust) |
| Frontend | [React 19](https://react.dev/) + [Vite](https://vite.dev/) |
| Markdown | [marked](https://marked.js.org/) + [DOMPurify](https://github.com/cure53/DOMPurify) |
| Package manager | [bun](https://bun.sh/) |
| Styling | CSS custom properties (no CSS-in-JS) |

## Getting Started

### Prerequisites

- [bun](https://bun.sh/) (v1.0+)
- [Rust](https://rustup.rs/) (stable)

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

| Format | Location |
|--------|----------|
| Standalone `.exe` | `src-tauri/target/release/yang-markd.exe` |
| NSIS installer | `src-tauri/target/release/bundle/nsis/Yang-MarkD_*_x64-setup.exe` |
| MSI installer | `src-tauri/target/release/bundle/msi/Yang-MarkD_*_x64_en-US.msi` |

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
  src/main.rs     App entry with dialog + fs plugins
```

## License

[MIT](LICENSE)
