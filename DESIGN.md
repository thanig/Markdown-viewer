# Markdown Viewer - Design Document

## Document Information
- **Project Name**: Markdown Viewer - Technical Design Specification
- **Version**: 1.0
- **Last Updated**: 2026-01-30
- **Purpose**: Complete technical design for implementing the Markdown Viewer application

---

## Table of Contents
1. [System Architecture](#1-system-architecture)
2. [Technology Stack](#2-technology-stack)
3. [Component Design](#3-component-design)
4. [Data Models](#4-data-models)
5. [File Structure](#5-file-structure)
6. [Implementation Specifications](#6-implementation-specifications)
7. [Build and Deployment](#7-build-and-deployment)
8. [Testing Strategy](#8-testing-strategy)

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Tauri Window (macOS)               │
│  ┌───────────────────────────────────────────────┐  │
│  │          React Application Layer              │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │  App.tsx (Main Component)               │  │  │
│  │  │  ├── Header (Menu Bar)                  │  │  │
│  │  │  ├── TabBar                              │  │  │
│  │  │  └── Content Area                        │  │  │
│  │  │      ├── MarkdownViewer                  │  │  │
│  │  │      ├── JsonViewer                      │  │  │
│  │  │      └── CodeEditor                      │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  │                                                 │  │
│  │  State Management: React Hooks                 │  │
│  │  ├── useTabs (tab state)                       │  │
│  │  └── useFile (file operations)                 │  │
│  └───────────────────────────────────────────────┘  │
│                         ↕                            │
│              Tauri API Bridge                        │
│                         ↕                            │
│  ┌───────────────────────────────────────────────┐  │
│  │          Rust Backend (Tauri Core)            │  │
│  │  - File system access (read/write)            │  │
│  │  - Native dialogs (open/save)                 │  │
│  │  - System integration                         │  │
│  └───────────────────────────────────────────────┘  │
│                         ↕                            │
│                   macOS APIs                         │
│  - WebKit (rendering)                                │
│  - File System                                       │
│  - Native UI (dialogs)                               │
└─────────────────────────────────────────────────────┘
```

### 1.2 Data Flow

```
User Action → React Component → Tauri API → Rust Backend → macOS
                    ↓                                  ↓
              State Update ← React Hook ← Result ← Response
                    ↓
            UI Re-render
```

**Example: Opening a File**
1. User clicks "Open File" button or presses Cmd+O
2. React handler calls `useFile.openFile()`
3. `useFile` calls Tauri API `dialog.open()`
4. Tauri shows native macOS file picker
5. User selects file
6. Tauri calls Rust backend to read file
7. Rust reads file from disk and returns content
8. React receives file data
9. `useTabs.addTab()` creates new tab
10. Component re-renders with new tab and content

### 1.3 Architecture Decisions

#### Decision 1: Tauri vs Electron
- **Choice**: Tauri
- **Rationale**:
  - 95% smaller bundle size (5-10MB vs 150MB+)
  - Uses system WebView instead of bundling Chromium
  - Lower memory footprint
  - Better macOS integration
  - Meets performance requirements

#### Decision 2: React vs Vue/Svelte
- **Choice**: React
- **Rationale**:
  - Mature ecosystem
  - Excellent TypeScript support
  - Large component library compatibility
  - Monaco Editor has first-class React support

#### Decision 3: State Management (Redux vs Hooks)
- **Choice**: React Hooks (useState, useCallback)
- **Rationale**:
  - Application state is simple (tabs, active tab)
  - No need for global state management complexity
  - Hooks provide sufficient functionality
  - Reduces bundle size

#### Decision 4: Monaco Editor vs CodeMirror
- **Choice**: Monaco Editor
- **Rationale**:
  - Same editor as VS Code (familiar to developers)
  - Excellent TypeScript/JavaScript support
  - Better syntax highlighting
  - Built-in language detection

---

## 2. Technology Stack

### 2.1 Frontend Stack

#### Core Framework
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "typescript": "^5.3.3"
}
```

#### Build Tool
```json
{
  "vite": "^5.0.11",
  "@vitejs/plugin-react": "^4.2.1"
}
```

#### Editor and Rendering
```json
{
  "@monaco-editor/react": "^4.6.0",
  "marked": "^11.1.1",
  "marked-highlight": "^2.1.0",
  "highlight.js": "^11.9.0",
  "react-json-view-lite": "^1.2.0"
}
```

#### Tauri Integration
```json
{
  "@tauri-apps/api": "^1.5.3",
  "@tauri-apps/cli": "^1.5.9"
}
```

### 2.2 Backend Stack

#### Tauri (Rust)
```toml
[dependencies]
tauri = { version = "1.5", features = ["dialog-all", "fs-all", "shell-open"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

[build-dependencies]
tauri-build = { version = "1.5", features = [] }
```

### 2.3 Development Tools

```json
{
  "@types/react": "^18.2.47",
  "@types/react-dom": "^18.2.18"
}
```

### 2.4 Version Requirements

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Rust**: 1.70 or higher
- **macOS**: 11.0 or higher (for development)

---

## 3. Component Design

### 3.1 Component Hierarchy

```
App (Root)
├── Header
│   └── MenuBar
│       ├── OpenButton
│       └── SaveButton
├── TabBar
│   └── Tab[] (array of tabs)
│       ├── TabName
│       ├── DirtyIndicator
│       └── CloseButton
└── ContentArea
    ├── EmptyState (when no tabs)
    ├── MarkdownViewer (for .md files)
    │   ├── Toolbar
    │   │   └── ToggleModeButton
    │   ├── RenderedView
    │   └── RawEditor (CodeEditor)
    ├── JsonViewer (for .json files)
    │   ├── Toolbar
    │   │   ├── ToggleModeButton
    │   │   ├── FormatButton
    │   │   └── MinifyButton
    │   ├── TreeView
    │   └── RawEditor (CodeEditor)
    └── CodeEditor (for other files)
```

### 3.2 Component Specifications

#### 3.2.1 App Component

**File**: `src/App.tsx`

**Responsibilities**:
- Root component of application
- Manages global state (tabs, active tab)
- Handles keyboard shortcuts
- Orchestrates file operations
- Routes content to appropriate viewer

**State**:
```typescript
// Managed via custom hooks
const { tabs, activeTabId, addTab, closeTab, ... } = useTabs();
const { openFile, saveFile } = useFile();
const activeTab = getActiveTab();
```

**Key Methods**:
```typescript
handleOpenFile(): Promise<void>
handleSaveFile(): Promise<void>
handleContentChange(content: string): void
handleToggleViewMode(): void
renderViewer(): JSX.Element
```

**Props**: None (root component)

**Styling**: `src/App.css`

---

#### 3.2.2 TabBar Component

**File**: `src/components/TabBar/TabBar.tsx`

**Responsibilities**:
- Display all open tabs
- Handle tab click events
- Render close buttons
- Show dirty indicators

**Props**:
```typescript
interface TabBarProps {
  tabs: FileTab[];
  activeTabId: string | null;
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
}
```

**Rendering Logic**:
```typescript
{tabs.map(tab => (
  <div
    key={tab.id}
    className={`tab ${tab.id === activeTabId ? 'active' : ''}`}
    onClick={() => onTabClick(tab.id)}
  >
    <span className="tab-name">
      {tab.name}
      {tab.isDirty && <span className="dirty-indicator">•</span>}
    </span>
    <button
      className="tab-close"
      onClick={(e) => handleClose(e, tab.id)}
    >×</button>
  </div>
))}
```

**Styling**: `src/components/TabBar/TabBar.css`

**CSS Classes**:
- `.tab-bar`: Container
- `.tab`: Individual tab
- `.tab.active`: Active tab
- `.tab-name`: File name display
- `.dirty-indicator`: Unsaved changes dot
- `.tab-close`: Close button

---

#### 3.2.3 MarkdownViewer Component

**File**: `src/components/Viewers/MarkdownViewer.tsx`

**Responsibilities**:
- Render Markdown to HTML
- Toggle between rendered and raw mode
- Apply syntax highlighting to code blocks
- Handle user edits in raw mode

**Props**:
```typescript
interface MarkdownViewerProps {
  content: string;
  viewMode: 'rendered' | 'raw';
  onChange: (content: string) => void;
  onToggleMode: () => void;
}
```

**State**:
```typescript
const [html, setHtml] = useState('');
```

**Key Methods**:
```typescript
useEffect(() => {
  if (viewMode === 'rendered') {
    const rendered = marked.parse(content) as string;
    setHtml(rendered);
  }
}, [content, viewMode]);
```

**Markdown Configuration**:
```typescript
import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';

marked.use(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    }
  })
);

marked.setOptions({
  gfm: true,      // GitHub-flavored Markdown
  breaks: true,   // Convert \n to <br>
});
```

**Rendering**:
- **Rendered Mode**: `<div dangerouslySetInnerHTML={{ __html: html }} />`
- **Raw Mode**: `<CodeEditor language="markdown" ... />`

**Styling**: `src/components/Viewers/MarkdownViewer.css`

**Import Highlight.js Theme**:
```typescript
import 'highlight.js/styles/github-dark.css';
```

---

#### 3.2.4 JsonViewer Component

**File**: `src/components/Viewers/JsonViewer.tsx`

**Responsibilities**:
- Parse and display JSON in tree format
- Toggle between tree and raw mode
- Format and minify JSON
- Show parse errors

**Props**:
```typescript
interface JsonViewerProps {
  content: string;
  viewMode: 'rendered' | 'raw';
  onChange: (content: string) => void;
  onToggleMode: () => void;
}
```

**State**:
```typescript
const [jsonData, setJsonData] = useState<any>(null);
const [error, setError] = useState<string | null>(null);
const [formatted, setFormatted] = useState(false);
```

**Key Methods**:
```typescript
// Parse JSON
useEffect(() => {
  if (viewMode === 'rendered') {
    try {
      const parsed = JSON.parse(content);
      setJsonData(parsed);
      setError(null);
    } catch (err) {
      setError(err.message);
      setJsonData(null);
    }
  }
}, [content, viewMode]);

// Format JSON
const handleFormat = () => {
  try {
    const parsed = JSON.parse(content);
    const formatted = JSON.stringify(parsed, null, 2);
    onChange(formatted);
  } catch (err) {
    setError(err.message);
  }
};

// Minify JSON
const handleMinify = () => {
  try {
    const parsed = JSON.parse(content);
    const minified = JSON.stringify(parsed);
    onChange(minified);
  } catch (err) {
    setError(err.message);
  }
};
```

**Tree View Library**:
```typescript
import { JsonView, allExpanded, defaultStyles } from 'react-json-view-lite';

<JsonView
  data={jsonData}
  shouldExpandNode={allExpanded}
  style={defaultStyles}
/>
```

**Styling**: `src/components/Viewers/JsonViewer.css`

---

#### 3.2.5 CodeEditor Component

**File**: `src/components/Viewers/CodeEditor.tsx`

**Responsibilities**:
- Provide Monaco-based code editing
- Apply syntax highlighting based on language
- Handle content changes

**Props**:
```typescript
interface CodeEditorProps {
  content: string;
  language: string;
  onChange: (value: string) => void;
}
```

**Monaco Configuration**:
```typescript
import Editor from '@monaco-editor/react';

<Editor
  height="100%"
  language={language}
  value={content}
  onChange={handleChange}
  theme={isDarkMode ? 'vs-dark' : 'light'}
  options={{
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    automaticLayout: true,
    wordWrap: 'on',
    tabSize: 2,
    renderWhitespace: 'selection',
    fontFamily: 'SF Mono, Monaco, Cascadia Code, Consolas, monospace',
  }}
/>
```

**Theme Detection**:
```typescript
const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
```

**Styling**: `src/components/Viewers/CodeEditor.css`

---

### 3.3 Custom Hooks

#### 3.3.1 useTabs Hook

**File**: `src/hooks/useTabs.ts`

**Purpose**: Manage tab state and operations

**State**:
```typescript
const [tabs, setTabs] = useState<FileTab[]>([]);
const [activeTabId, setActiveTabId] = useState<string | null>(null);
```

**Methods**:
```typescript
interface UseTabsReturn {
  tabs: FileTab[];
  activeTabId: string | null;
  setActiveTabId: (id: string) => void;
  addTab: (path: string, name: string, content: string, language: string) => void;
  closeTab: (id: string) => void;
  updateTabContent: (id: string, content: string) => void;
  toggleViewMode: (id: string) => void;
  markTabSaved: (id: string) => void;
  getActiveTab: () => FileTab | null;
}
```

**Implementation Details**:

```typescript
const addTab = useCallback((path: string, name: string, content: string, language: string) => {
  const id = `${path}-${Date.now()}`;
  const viewMode = language === 'markdown' ? 'rendered' : 'raw';

  const newTab: FileTab = {
    id,
    path,
    name,
    content,
    isDirty: false,
    language,
    viewMode,
  };

  setTabs(prev => [...prev, newTab]);
  setActiveTabId(id);
}, []);

const closeTab = useCallback((id: string) => {
  setTabs(prev => {
    const filtered = prev.filter(tab => tab.id !== id);
    if (activeTabId === id && filtered.length > 0) {
      setActiveTabId(filtered[filtered.length - 1].id);
    } else if (filtered.length === 0) {
      setActiveTabId(null);
    }
    return filtered;
  });
}, [activeTabId]);

const updateTabContent = useCallback((id: string, content: string) => {
  setTabs(prev =>
    prev.map(tab =>
      tab.id === id ? { ...tab, content, isDirty: true } : tab
    )
  );
}, []);

const toggleViewMode = useCallback((id: string) => {
  setTabs(prev =>
    prev.map(tab =>
      tab.id === id
        ? { ...tab, viewMode: tab.viewMode === 'rendered' ? 'raw' : 'rendered' }
        : tab
    )
  );
}, []);

const markTabSaved = useCallback((id: string) => {
  setTabs(prev =>
    prev.map(tab =>
      tab.id === id ? { ...tab, isDirty: false } : tab
    )
  );
}, []);

const getActiveTab = useCallback(() => {
  return tabs.find(tab => tab.id === activeTabId) || null;
}, [tabs, activeTabId]);
```

---

#### 3.3.2 useFile Hook

**File**: `src/hooks/useFile.ts`

**Purpose**: Handle file operations via Tauri APIs

**Tauri Imports**:
```typescript
import { open, save } from '@tauri-apps/api/dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/api/fs';
```

**Methods**:
```typescript
interface UseFileReturn {
  openFile: () => Promise<FileData | null>;
  saveFile: (path: string, content: string) => Promise<boolean>;
  saveFileAs: (content: string) => Promise<string | null>;
}

interface FileData {
  path: string;
  content: string;
  name: string;
  language: string;
}
```

**Implementation**:

```typescript
const openFile = async (): Promise<FileData | null> => {
  try {
    // Show native file picker
    const selected = await open({
      multiple: false,
      filters: [
        {
          name: 'All Supported',
          extensions: ['md', 'json', 'js', 'ts', 'tsx', 'jsx', 'css', 'html', 'txt', 'yml', 'yaml', 'xml', 'py', 'rs', 'go', 'java'],
        },
      ],
    });

    if (!selected || Array.isArray(selected)) return null;

    // Read file content
    const content = await readTextFile(selected);

    // Extract file name
    const name = selected.split('/').pop() || selected.split('\\').pop() || 'Untitled';

    // Detect language
    const language = getLanguageFromPath(selected);

    return { path: selected, content, name, language };
  } catch (error) {
    console.error('Failed to open file:', error);
    return null;
  }
};

const saveFile = async (path: string, content: string): Promise<boolean> => {
  try {
    await writeTextFile(path, content);
    return true;
  } catch (error) {
    console.error('Failed to save file:', error);
    return false;
  }
};
```

**Language Detection**:
```typescript
function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();

  const languageMap: Record<string, string> = {
    'md': 'markdown',
    'markdown': 'markdown',
    'json': 'json',
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'css': 'css',
    'html': 'html',
    'xml': 'xml',
    'py': 'python',
    'rs': 'rust',
    'go': 'go',
    'java': 'java',
    'yml': 'yaml',
    'yaml': 'yaml',
    'txt': 'plaintext',
  };

  return languageMap[ext || ''] || 'plaintext';
}
```

---

## 4. Data Models

### 4.1 TypeScript Types

**File**: `src/types/index.ts`

```typescript
export interface FileTab {
  id: string;              // Unique identifier: "{path}-{timestamp}"
  path: string;            // Full file path on disk
  name: string;            // File name only (for display)
  content: string;         // Current file content
  isDirty: boolean;        // Has unsaved changes
  language: string;        // Language identifier (markdown, json, javascript, etc.)
  viewMode: 'rendered' | 'raw';  // Current view mode
}

export interface FileNode {
  name: string;            // File/folder name
  path: string;            // Full path
  is_dir: boolean;         // Is directory
  children?: FileNode[];   // Child nodes (for directories)
}

export type ViewerMode = 'markdown' | 'json' | 'code';
```

### 4.2 State Structure

```typescript
// Application State (in App component)
interface AppState {
  tabs: FileTab[];           // Array of all open tabs
  activeTabId: string | null;  // ID of currently active tab
}

// No global state - all state managed locally via hooks
```

---

## 5. File Structure

### 5.1 Complete Directory Structure

```
Markdown-viewer/
├── public/                          # Static assets
│   └── vite.svg                     # Favicon (optional)
│
├── src/                             # Frontend source code
│   ├── components/                  # React components
│   │   ├── TabBar/
│   │   │   ├── TabBar.tsx          # Tab bar component
│   │   │   └── TabBar.css          # Tab bar styles
│   │   │
│   │   └── Viewers/
│   │       ├── MarkdownViewer.tsx  # Markdown viewer component
│   │       ├── MarkdownViewer.css  # Markdown styles
│   │       ├── JsonViewer.tsx      # JSON viewer component
│   │       ├── JsonViewer.css      # JSON styles
│   │       ├── CodeEditor.tsx      # Monaco editor wrapper
│   │       └── CodeEditor.css      # Editor styles
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── useTabs.ts              # Tab management hook
│   │   └── useFile.ts              # File operations hook
│   │
│   ├── types/                       # TypeScript type definitions
│   │   └── index.ts                # Shared types
│   │
│   ├── styles/                      # Global styles
│   │   └── globals.css             # Global CSS variables and resets
│   │
│   ├── App.tsx                      # Root application component
│   ├── App.css                      # App component styles
│   └── main.tsx                     # React entry point
│
├── src-tauri/                       # Tauri (Rust) backend
│   ├── src/
│   │   └── main.rs                 # Rust application entry
│   │
│   ├── icons/                       # Application icons
│   │   ├── 32x32.png
│   │   ├── 128x128.png
│   │   ├── 128x128@2x.png
│   │   ├── icon.icns               # macOS icon
│   │   └── icon.ico                # Windows icon (unused)
│   │
│   ├── Cargo.toml                  # Rust dependencies
│   ├── build.rs                    # Rust build script
│   └── tauri.conf.json             # Tauri configuration
│
├── index.html                       # HTML entry point
├── package.json                     # npm dependencies and scripts
├── package-lock.json               # Locked dependency versions
├── tsconfig.json                   # TypeScript configuration
├── tsconfig.node.json              # TypeScript config for Node
├── vite.config.ts                  # Vite build configuration
├── .gitignore                      # Git ignore rules
├── README.md                       # Project documentation
├── REQUIREMENTS.md                 # Requirements specification
└── DESIGN.md                       # This design document
```

### 5.2 File Purposes

| File | Purpose |
|------|---------|
| `src/main.tsx` | React application entry point, mounts App to DOM |
| `src/App.tsx` | Root component, orchestrates all features |
| `src/App.css` | Styles for app layout and empty state |
| `src/components/TabBar/TabBar.tsx` | Renders tabs and handles tab interactions |
| `src/components/Viewers/MarkdownViewer.tsx` | Markdown rendering and editing |
| `src/components/Viewers/JsonViewer.tsx` | JSON tree view and editing |
| `src/components/Viewers/CodeEditor.tsx` | Monaco editor wrapper |
| `src/hooks/useTabs.ts` | Tab state management logic |
| `src/hooks/useFile.ts` | File I/O operations via Tauri |
| `src/types/index.ts` | TypeScript type definitions |
| `src/styles/globals.css` | CSS variables, resets, theming |
| `src-tauri/src/main.rs` | Tauri application setup (minimal) |
| `src-tauri/Cargo.toml` | Rust dependencies configuration |
| `src-tauri/tauri.conf.json` | Tauri app settings, permissions |
| `vite.config.ts` | Vite build tool configuration |
| `tsconfig.json` | TypeScript compiler options |
| `package.json` | npm scripts and dependencies |

---

## 6. Implementation Specifications

### 6.1 Configuration Files

#### 6.1.1 package.json

```json
{
  "name": "markdown-viewer",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tauri-apps/api": "^1.5.3",
    "marked": "^11.1.1",
    "marked-highlight": "^2.1.0",
    "highlight.js": "^11.9.0",
    "react-json-view-lite": "^1.2.0",
    "@monaco-editor/react": "^4.6.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^1.5.9",
    "@types/react": "^18.2.47",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.11"
  }
}
```

**Script Purposes**:
- `dev`: Start Vite dev server (frontend only)
- `build`: Compile TypeScript and build frontend
- `tauri:dev`: Run app in development mode (hot reload)
- `tauri:build`: Build production .app bundle

---

#### 6.1.2 vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // Prevent vite from obscuring rust errors
  clearScreen: false,

  // Tauri expects a fixed port
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // Ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
  },

  // Environment variables
  envPrefix: ['VITE_', 'TAURI_'],

  build: {
    // Tauri uses Chromium on Windows, WebKit on macOS
    target: process.env.TAURI_PLATFORM == 'windows' ? 'chrome105' : 'safari13',
    // Minify for production
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    // Sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_DEBUG,
  },
});
```

---

#### 6.1.3 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Key Settings**:
- `strict: true` - Enable all strict type checking
- `jsx: "react-jsx"` - Use React 17+ JSX transform
- `noUnusedLocals: true` - Catch unused variables

---

#### 6.1.4 src-tauri/tauri.conf.json

```json
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devPath": "http://localhost:1420",
    "distDir": "../dist",
    "withGlobalTauri": false
  },
  "package": {
    "productName": "Markdown Viewer",
    "version": "0.1.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "fs": {
        "all": true,
        "readFile": true,
        "writeFile": true,
        "readDir": true,
        "scope": ["**"]
      },
      "dialog": {
        "all": true,
        "open": true,
        "save": true
      },
      "shell": {
        "all": false,
        "open": true
      }
    },
    "bundle": {
      "active": true,
      "targets": "all",
      "identifier": "com.markdown-viewer.app",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ]
    },
    "security": {
      "csp": null
    },
    "windows": [
      {
        "fullscreen": false,
        "resizable": true,
        "title": "Markdown Viewer",
        "width": 1200,
        "height": 800,
        "minWidth": 600,
        "minHeight": 400
      }
    ]
  }
}
```

**Key Settings**:
- `allowlist.fs.all: true` - Enable file system access
- `allowlist.dialog.all: true` - Enable native dialogs
- `windows[0].width: 1200` - Default window size
- `identifier: "com.markdown-viewer.app"` - Unique app ID

---

#### 6.1.5 src-tauri/Cargo.toml

```toml
[package]
name = "markdown-viewer"
version = "0.1.0"
description = "A lightweight code viewer for macOS"
authors = ["you"]
license = ""
repository = ""
edition = "2021"

[build-dependencies]
tauri-build = { version = "1.5", features = [] }

[dependencies]
tauri = { version = "1.5", features = ["dialog-all", "fs-all", "shell-open"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

[features]
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]
```

---

#### 6.1.6 src-tauri/src/main.rs

```rust
// Prevents additional console window on Windows
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Note**: This is a minimal Rust backend. All file operations are handled by Tauri's built-in APIs, accessed from the frontend via `@tauri-apps/api`.

---

#### 6.1.7 src-tauri/build.rs

```rust
fn main() {
    tauri_build::build()
}
```

---

### 6.2 Styling Specifications

#### 6.2.1 CSS Variables (globals.css)

```css
:root {
  /* Light theme */
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --bg-tertiary: #e0e0e0;
  --text-primary: #000000;
  --text-secondary: #666666;
  --border-color: #d0d0d0;
  --accent: #007aff;
  --accent-hover: #0051d5;
  --danger: #ff3b30;

  /* Dimensions */
  --sidebar-width: 250px;
  --tab-height: 36px;

  /* Fonts */
  --font-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
}

@media (prefers-color-scheme: dark) {
  :root {
    /* Dark theme overrides */
    --bg-primary: #1e1e1e;
    --bg-secondary: #252526;
    --bg-tertiary: #2d2d30;
    --text-primary: #cccccc;
    --text-secondary: #858585;
    --border-color: #3e3e42;
    --accent: #0a84ff;
    --accent-hover: #409cff;
    --danger: #ff453a;
  }
}
```

**Usage**: All components reference these CSS variables for consistent theming.

---

#### 6.2.2 Global Resets

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  overflow: hidden;
}

#root {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
}
```

---

### 6.3 Keyboard Shortcut Implementation

**Location**: `src/App.tsx`

```typescript
useEffect(() => {
  const handleKeyDown = async (e: KeyboardEvent) => {
    const cmdOrCtrl = e.metaKey || e.ctrlKey;

    // Cmd+O - Open file
    if (cmdOrCtrl && e.key === 'o') {
      e.preventDefault();
      await handleOpenFile();
    }

    // Cmd+S - Save file
    if (cmdOrCtrl && e.key === 's') {
      e.preventDefault();
      await handleSaveFile();
    }

    // Cmd+W - Close tab
    if (cmdOrCtrl && e.key === 'w') {
      e.preventDefault();
      if (activeTabId) {
        closeTab(activeTabId);
      }
    }

    // Cmd+Shift+M - Toggle Markdown view
    if (cmdOrCtrl && e.shiftKey && e.key === 'M') {
      e.preventDefault();
      if (activeTab && activeTab.language === 'markdown') {
        toggleViewMode(activeTab.id);
      }
    }

    // Cmd+Shift+J - Toggle JSON view
    if (cmdOrCtrl && e.shiftKey && e.key === 'J') {
      e.preventDefault();
      if (activeTab && activeTab.language === 'json') {
        toggleViewMode(activeTab.id);
      }
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [activeTabId, activeTab]);
```

**Note**: Must include dependencies (`activeTabId`, `activeTab`) in `useEffect` dependency array to ensure handlers have access to latest state.

---

### 6.4 Empty State Implementation

**Location**: `src/App.tsx` (in `renderViewer()` method)

```typescript
if (!activeTab) {
  return (
    <div className="empty-state">
      <div className="empty-state-content">
        <h2>No File Open</h2>
        <p>Press <kbd>Cmd+O</kbd> to open a file</p>
        <button onClick={handleOpenFile} className="open-button">
          Open File
        </button>
      </div>
    </div>
  );
}
```

**CSS** (in `App.css`):
```css
.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-primary);
}

.empty-state-content {
  text-align: center;
  max-width: 400px;
}

.empty-state-content h2 {
  font-size: 24px;
  margin-bottom: 12px;
}

.empty-state-content p {
  color: var(--text-secondary);
  margin-bottom: 24px;
}

.empty-state-content kbd {
  padding: 3px 8px;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 12px;
}

.open-button {
  padding: 12px 24px;
  font-size: 14px;
  border: none;
  background-color: var(--accent);
  color: white;
  border-radius: 6px;
  cursor: pointer;
}
```

---

## 7. Build and Deployment

### 7.1 Development Workflow

```bash
# Install dependencies
npm install

# Start development mode (with hot reload)
npm run tauri dev

# This will:
# 1. Start Vite dev server on localhost:1420
# 2. Compile Rust backend
# 3. Launch macOS app window
# 4. Enable hot module replacement
```

### 7.2 Production Build

```bash
# Build for production
npm run tauri build

# This will:
# 1. Run `npm run build` (compile TypeScript, bundle with Vite)
# 2. Compile Rust in release mode
# 3. Create .app bundle
# 4. Output: src-tauri/target/release/bundle/macos/Markdown-viewer.app
```

### 7.3 Build Outputs

**Development**:
- No bundled output (runs from dev server)
- Rust compiled in debug mode

**Production**:
```
src-tauri/target/release/bundle/macos/
└── Markdown-viewer.app/           # macOS application bundle
    ├── Contents/
    │   ├── Info.plist            # App metadata
    │   ├── MacOS/
    │   │   └── markdown-viewer   # Binary executable
    │   └── Resources/
    │       ├── icon.icns         # App icon
    │       └── ...               # Frontend assets
```

**Bundle Size**: Approximately 5-10MB

### 7.4 Icons

**Creating Icons**:
```bash
# Generate icon set from a 1024x1024 PNG
npm run tauri icon path/to/icon.png
```

**Manual Icon Creation** (if needed):
- Create PNG files: 32x32, 128x128, 128x128@2x
- Create ICNS file for macOS
- Place in `src-tauri/icons/`

---

## 8. Testing Strategy

### 8.1 Manual Testing Checklist

#### File Operations
- [ ] Open file via button
- [ ] Open file via Cmd+O
- [ ] Open .md file displays rendered Markdown
- [ ] Open .json file displays tree view
- [ ] Open .js file displays in code editor
- [ ] Save file via button
- [ ] Save file via Cmd+S
- [ ] Dirty indicator appears on edit
- [ ] Dirty indicator disappears after save

#### Tab Management
- [ ] New tab created when file opened
- [ ] Tab shows correct file name
- [ ] Click tab to switch
- [ ] Cmd+W closes active tab
- [ ] Closing tab activates next tab
- [ ] Close button (×) works

#### Markdown Features
- [ ] Headers render correctly (H1-H6)
- [ ] Bold, italic, strikethrough work
- [ ] Links are clickable
- [ ] Code blocks have syntax highlighting
- [ ] Tables render correctly
- [ ] Cmd+Shift+M toggles to raw mode
- [ ] Edits in raw mode update rendered view

#### JSON Features
- [ ] Valid JSON shows tree view
- [ ] Invalid JSON shows error
- [ ] Expand/collapse nodes work
- [ ] Format button pretty-prints JSON
- [ ] Minify button compacts JSON
- [ ] Cmd+Shift+J toggles to raw mode

#### Code Editor
- [ ] Syntax highlighting works for .js, .ts, .py
- [ ] Line numbers display
- [ ] Word wrap enabled
- [ ] Edits update content

#### Theme
- [ ] App matches system theme (light/dark)
- [ ] All UI elements support both themes
- [ ] Monaco editor theme switches with system

#### Performance
- [ ] App launches in <1 second
- [ ] Files under 1MB open instantly
- [ ] No lag when switching tabs
- [ ] No lag when toggling view modes

### 8.2 Error Testing

- [ ] Open non-existent file
- [ ] Open binary file
- [ ] Open very large file (>10MB)
- [ ] Save to read-only location
- [ ] Open invalid JSON file
- [ ] Open corrupted Markdown file

### 8.3 Edge Cases

- [ ] Open 20 tabs (should work)
- [ ] Attempt to open 21st tab (should warn)
- [ ] Close all tabs (empty state)
- [ ] Open file with very long name
- [ ] Open file with special characters in name
- [ ] Open empty file
- [ ] Edit file then close without saving (should warn)

---

## 9. Implementation Phases

### Phase 1: Project Setup (30 minutes)
1. Initialize npm project with package.json
2. Install dependencies (React, Vite, Tauri, etc.)
3. Configure TypeScript (tsconfig.json)
4. Configure Vite (vite.config.ts)
5. Initialize Tauri backend
6. Create basic file structure

### Phase 2: Core Layout (1 hour)
1. Create App.tsx with basic layout
2. Create globals.css with CSS variables
3. Implement Header with menu buttons
4. Create empty state UI
5. Test basic rendering

### Phase 3: Tab System (1 hour)
1. Create FileTab type definition
2. Implement useTabs hook
3. Create TabBar component
4. Implement tab creation, switching, closing
5. Test tab management

### Phase 4: File Operations (1 hour)
1. Implement useFile hook
2. Integrate Tauri file APIs
3. Implement open file functionality
4. Implement save file functionality
5. Test file I/O

### Phase 5: Code Editor (1 hour)
1. Create CodeEditor component
2. Integrate Monaco Editor
3. Configure editor options
4. Implement theme detection
5. Test with various file types

### Phase 6: Markdown Viewer (1.5 hours)
1. Create MarkdownViewer component
2. Integrate marked.js
3. Configure syntax highlighting
4. Implement rendered view
5. Implement raw mode toggle
6. Style rendered Markdown
7. Test with complex Markdown files

### Phase 7: JSON Viewer (1 hour)
1. Create JsonViewer component
2. Integrate react-json-view-lite
3. Implement tree view
4. Implement raw mode toggle
5. Add format/minify buttons
6. Handle parse errors
7. Test with various JSON files

### Phase 8: Keyboard Shortcuts (30 minutes)
1. Implement global shortcuts in App.tsx
2. Implement context-specific shortcuts
3. Test all shortcuts

### Phase 9: Polish and Testing (1 hour)
1. Refine styling and spacing
2. Test all features end-to-end
3. Fix bugs
4. Optimize performance
5. Test build process

### Phase 10: Documentation (30 minutes)
1. Write README.md
2. Add code comments
3. Create build instructions

**Total Estimated Time**: 8-10 hours

---

## 10. Optimization Considerations

### 10.1 Bundle Size Optimization

**Vite Configuration**:
```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'monaco': ['@monaco-editor/react'],
        'markdown': ['marked', 'marked-highlight', 'highlight.js'],
      }
    }
  }
}
```

**Import Only Needed Highlight.js Languages**:
```typescript
// Instead of importing all languages
import hljs from 'highlight.js';

// Import specific languages
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
// ... register only needed languages
```

### 10.2 Performance Optimization

**Lazy Load Monaco Editor**:
```typescript
const MonacoEditor = React.lazy(() => import('@monaco-editor/react'));

// In component
<Suspense fallback={<div>Loading editor...</div>}>
  <MonacoEditor ... />
</Suspense>
```

**Limit Tab Count**:
```typescript
if (tabs.length >= 20) {
  alert('Maximum 20 tabs allowed');
  return;
}
```

**Debounce Content Updates**:
```typescript
const debouncedUpdate = useMemo(
  () => debounce((content: string) => {
    updateTabContent(activeTab.id, content);
  }, 300),
  [activeTab]
);
```

---

## 11. Troubleshooting

### 11.1 Common Issues

**Issue**: Tauri dev fails to start
- **Solution**: Ensure Rust is installed (`rustc --version`)
- **Solution**: Run `npm install` again

**Issue**: Monaco Editor not loading
- **Solution**: Check browser console for errors
- **Solution**: Verify `@monaco-editor/react` is installed

**Issue**: File operations fail
- **Solution**: Check `tauri.conf.json` allowlist settings
- **Solution**: Verify file permissions

**Issue**: App bundle too large
- **Solution**: Enable production optimizations
- **Solution**: Remove unused dependencies
- **Solution**: Use code splitting

---

## 12. Future Architecture Considerations

### 12.1 File Tree Sidebar (Future)

If implementing file tree sidebar:

**Component Structure**:
```
App
└── Layout
    ├── Sidebar (resizable)
    │   └── FileTree
    │       └── FileTreeItem (recursive)
    └── MainArea
        ├── TabBar
        └── ContentArea
```

**State**:
```typescript
const [sidebarWidth, setSidebarWidth] = useState(250);
const [isFileTreeVisible, setIsFileTreeVisible] = useState(true);
```

**Rust Backend Command**:
```rust
#[tauri::command]
async fn read_directory(path: String) -> Result<Vec<FileNode>, String> {
  // Read directory contents
  // Return tree structure
}
```

### 12.2 Settings/Preferences (Future)

**State**:
```typescript
interface Settings {
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  theme: 'auto' | 'light' | 'dark';
}
```

**Storage**: Use Tauri's `store` plugin or `localStorage`

---

**Document End**

## Appendix: Quick Reference

### Component Import Map
```typescript
// Main App
import App from './App';

// Components
import { TabBar } from './components/TabBar/TabBar';
import { MarkdownViewer } from './components/Viewers/MarkdownViewer';
import { JsonViewer } from './components/Viewers/JsonViewer';
import { CodeEditor } from './components/Viewers/CodeEditor';

// Hooks
import { useTabs } from './hooks/useTabs';
import { useFile } from './hooks/useFile';

// Types
import type { FileTab, FileNode } from './types';

// Tauri APIs
import { open, save } from '@tauri-apps/api/dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/api/fs';
```

### CSS Class Naming Convention
- Use kebab-case for class names
- Prefix with component name for scoping
- Example: `.tab-bar`, `.markdown-content`, `.json-tree`

### TypeScript Conventions
- Use interfaces for object shapes
- Use type for unions/aliases
- Export types from `src/types/index.ts`
- Enable strict mode

---

This design document provides complete technical specifications for implementing the Markdown Viewer application. Follow the structure, configurations, and code samples exactly as specified to recreate the application.
