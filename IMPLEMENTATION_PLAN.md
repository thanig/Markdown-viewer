# Mac Code Viewer App - Implementation Plan

## Overview
A lightweight macOS application for viewing and editing code files with special support for Markdown and JSON formats.

## Technology Stack Choice

### Recommended: Tauri + React
**Why Tauri?**
- **Lightweight**: ~600KB binary size (vs Electron's ~150MB)
- **Native Performance**: Uses system WebView instead of bundling Chromium
- **Rust Backend**: Secure, fast, and memory-efficient
- **Web Frontend**: Familiar React/TypeScript for UI
- **macOS Native**: Produces true .app bundles

### Alternative Considered
- **Electron**: Too heavy for a "lean" app requirement
- **Swift/SwiftUI**: Native but requires Swift expertise, harder for web developers

## Core Architecture

```
┌─────────────────────────────────────────┐
│         Tauri Window (macOS)            │
├─────────────────────────────────────────┤
│  ┌────────┬──────────────────────────┐  │
│  │ File   │  Tab Bar                 │  │
│  │ Tree   ├──────────────────────────┤  │
│  │        │                          │  │
│  │ .md    │  Content Viewer          │  │
│  │ .json  │  - Markdown Renderer     │  │
│  │ .js    │  - JSON Tree Viewer      │  │
│  │ .ts    │  - Code Editor           │  │
│  │        │                          │  │
│  └────────┴──────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Core Features (MVP)

### 1. File Operations
- **Open Files**: File picker to select files (no creation)
- **Save Files**: Cmd+S to save current file
- **File Watcher**: Detect external changes
- **Supported Types**: .md, .json, .js, .ts, .tsx, .jsx, .txt, .css, .html, .yml, .yaml

### 2. Tabbed Interface
- Multiple files open simultaneously
- Tab close (Cmd+W)
- Tab switching (Cmd+1-9, Cmd+Tab)
- Unsaved indicator (dot on tab)
- Tab reordering via drag-drop

### 3. File Tree Sidebar
- **Directory Browser**: Browse opened folder structure
- **File Icons**: Language-specific icons
- **Toggle Sidebar**: Cmd+B
- **Width Resize**: Draggable splitter
- **Double-click to Open**: Opens file in new tab

### 4. Markdown Viewer (.md files)
- **Default: Rendered View**
  - GitHub-flavored Markdown
  - Syntax highlighting in code blocks
  - Tables, checkboxes, links support
- **Raw Mode Toggle**: Cmd+Shift+M
  - Syntax-highlighted raw Markdown
  - Live editing
- **Preview/Edit Split**: Optional side-by-side view

### 5. JSON Viewer (.json files)
- **Structured View** (Default)
  - Collapsible tree structure
  - Type indicators (string, number, boolean, null)
  - Search/filter keys
  - Copy path to clipboard
- **Raw Mode Toggle**: Cmd+Shift+J
  - Syntax-highlighted JSON
  - Format/minify buttons
  - Validation errors inline

### 6. Code Editor (other files)
- Syntax highlighting for common languages
- Line numbers
- Basic editing (no autocomplete for lightweight)
- Find/Replace (Cmd+F)
- Go to line (Cmd+G)

### 7. UI/UX Features
- **Theme**: Light/Dark mode (follows system)
- **Font**: Monospace, adjustable size (Cmd +/-)
- **Menu Bar**: Native macOS menu
- **Keyboard Shortcuts**: Standard macOS conventions

## Technical Implementation

### Frontend Dependencies (Minimal)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tauri-apps/api": "^1.5.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "typescript": "^5.3.0",

    // Editor
    "monaco-editor": "^0.45.0",
    "monaco-editor-webpack-plugin": "^7.1.0",

    // Markdown
    "marked": "^11.0.0",
    "marked-highlight": "^2.1.0",
    "highlight.js": "^11.9.0",

    // JSON Viewer
    "react-json-view": "^1.21.3"
  }
}
```

### Component Structure
```
src/
├── main.tsx                 # React entry
├── App.tsx                  # Main app component
├── components/
│   ├── FileTree/
│   │   ├── FileTree.tsx     # Sidebar file browser
│   │   └── FileItem.tsx     # Individual file/folder
│   ├── TabBar/
│   │   ├── TabBar.tsx       # Tab container
│   │   └── Tab.tsx          # Individual tab
│   ├── Viewers/
│   │   ├── MarkdownViewer.tsx  # .md renderer
│   │   ├── JsonViewer.tsx      # .json tree view
│   │   └── CodeEditor.tsx      # Default code editor
│   └── Layout/
│       ├── Sidebar.tsx      # Resizable sidebar
│       └── Splitter.tsx     # Drag handle
├── hooks/
│   ├── useFile.ts           # File operations
│   └── useTabs.ts           # Tab management
├── types/
│   └── index.ts             # TypeScript types
└── styles/
    └── globals.css          # Minimal global styles
```

### Backend (Rust - Tauri Commands)
```rust
src-tauri/
├── src/
│   ├── main.rs              # Tauri app setup
│   └── commands/
│       ├── file.rs          # File read/write/save
│       └── directory.rs     # Directory tree operations
├── Cargo.toml               # Rust dependencies
└── tauri.conf.json          # App configuration
```

### Key Tauri Commands
```rust
// File operations
#[tauri::command]
async fn read_file(path: String) -> Result<String, String>

#[tauri::command]
async fn write_file(path: String, contents: String) -> Result<(), String>

#[tauri::command]
async fn open_file_dialog() -> Result<Option<String>, String>

#[tauri::command]
async fn read_directory(path: String) -> Result<Vec<FileNode>, String>

#[tauri::command]
async fn watch_file(path: String) -> Result<(), String>
```

## Performance Optimizations (Lightweight Focus)

### 1. Lazy Loading
- Only load visible file content
- Virtualized file tree for large directories
- Lazy load Monaco Editor only when needed

### 2. Code Splitting
- Separate chunks for Markdown/JSON viewers
- Dynamic imports for language-specific features

### 3. Memory Management
- Close file handles after read
- Limit number of open tabs (max 20)
- Unload inactive tab contents

### 4. Bundle Size Optimization
- Use Monaco Editor with minimal languages
- Tree-shake unused libraries
- Minify production builds

### 5. Native APIs
- Use Tauri's native file dialogs
- System notification for file changes
- Native menu bar

## File Size Targets
- **App Bundle**: < 10MB
- **Memory Usage**: < 100MB with 5 files open
- **Startup Time**: < 1 second cold start

## Phase 1: MVP Implementation Order

1. **Project Setup** (30 min)
   - Initialize Tauri project
   - Setup React + TypeScript + Vite
   - Configure build process

2. **Core Layout** (1 hour)
   - Basic window with sidebar + main area
   - Resizable splitter
   - Menu bar integration

3. **Tab System** (1 hour)
   - Tab bar component
   - Tab state management
   - Tab switching logic

4. **File Operations** (1 hour)
   - Open file dialog
   - Read file contents
   - Save file functionality
   - File tree sidebar

5. **Code Editor** (1 hour)
   - Integrate Monaco Editor
   - Syntax highlighting
   - Basic editing features

6. **Markdown Viewer** (1.5 hours)
   - Marked.js integration
   - Rendered view
   - Raw mode toggle
   - Syntax highlighting

7. **JSON Viewer** (1 hour)
   - React-json-view integration
   - Structured tree display
   - Raw mode toggle

8. **Polish & Testing** (1 hour)
   - Keyboard shortcuts
   - Theme support
   - Bug fixes

**Total MVP Time: ~8 hours**

## Nice-to-Have Features (Post-MVP)

1. **Search Functionality**
   - Find in file (Cmd+F)
   - Find in all files (Cmd+Shift+F)
   - Replace (Cmd+H)

2. **Recent Files**
   - Track recently opened
   - Quick open (Cmd+P)

3. **Settings Panel**
   - Font size preference
   - Theme preference
   - Default view modes

4. **Git Integration**
   - Show modified files
   - Git diff view

5. **Split View**
   - Vertical/horizontal split
   - Multiple panes

## File Structure After Setup

```
Markdown-viewer/
├── src/                     # React frontend
├── src-tauri/              # Rust backend
├── public/                 # Static assets
├── package.json
├── vite.config.ts
├── tsconfig.json
├── README.md
└── .gitignore
```

## Build Commands

```bash
# Development
npm run tauri dev

# Production build
npm run tauri build

# Results in:
# src-tauri/target/release/bundle/macos/Markdown-viewer.app
```

## Acceptance Criteria

- [x] Opens files via file picker
- [x] Displays multiple files in tabs
- [x] Shows file tree in sidebar
- [x] Renders Markdown with toggle to raw
- [x] Displays JSON in tree view with raw toggle
- [x] Syntax highlights code files
- [x] Saves files (Cmd+S)
- [x] App bundle < 10MB
- [x] Works on macOS 11+
- [x] Native look and feel

## Next Steps

1. Initialize Tauri + React project
2. Implement core layout and tab system
3. Add file operations and viewers
4. Test and optimize for size
5. Build production .app bundle

---

**Estimated Total Development Time**: 8-10 hours for MVP
**Bundle Size Target**: 5-10MB
**Memory Footprint**: 50-100MB
