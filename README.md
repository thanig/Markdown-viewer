# Markdown Viewer

A lightweight macOS code viewer application with special support for Markdown and JSON files.

## Features

- **Tabbed Interface**: Open multiple files simultaneously with tab management
- **Markdown Viewer**:
  - Renders GitHub-flavored Markdown by default
  - Toggle to raw edit mode with `Cmd+Shift+M`
  - Syntax highlighting in code blocks
- **JSON Viewer**:
  - Structured tree view by default
  - Toggle to raw edit mode with `Cmd+Shift+J`
  - Format and minify options
- **Code Editor**: Monaco-based editor with syntax highlighting for common languages
- **File Operations**: Open and save files (no file creation)
- **Keyboard Shortcuts**:
  - `Cmd+O`: Open file
  - `Cmd+S`: Save file
  - `Cmd+W`: Close tab
  - `Cmd+Shift+M`: Toggle Markdown view mode
  - `Cmd+Shift+J`: Toggle JSON view mode

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Tauri (Rust)
- **Editor**: Monaco Editor
- **Markdown**: marked.js with highlight.js
- **JSON**: react-json-view-lite

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

## Project Structure

```
├── src/                    # React frontend
│   ├── components/        # UI components
│   │   ├── TabBar/       # Tab management
│   │   └── Viewers/      # File viewers (Markdown, JSON, Code)
│   ├── hooks/            # React hooks
│   ├── types/            # TypeScript types
│   └── styles/           # CSS styles
├── src-tauri/            # Rust backend
│   ├── src/             # Rust source code
│   └── Cargo.toml       # Rust dependencies
└── package.json          # npm dependencies
```

## Supported File Types

- Markdown (`.md`)
- JSON (`.json`)
- JavaScript (`.js`, `.jsx`)
- TypeScript (`.ts`, `.tsx`)
- CSS (`.css`)
- HTML (`.html`)
- YAML (`.yml`, `.yaml`)
- Python (`.py`)
- Rust (`.rs`)
- Go (`.go`)
- Java (`.java`)
- XML (`.xml`)
- Plain text (`.txt`)

## Build Output

- **App Bundle**: ~5-10MB (production build)
- **Memory Usage**: <100MB with multiple files open
- **Platform**: macOS 11+

## Note on Icons

Before building for production, generate app icons:

```bash
# You'll need to create an app icon (1024x1024 PNG) first
npm run tauri icon path/to/icon.png
```

## License

MIT
