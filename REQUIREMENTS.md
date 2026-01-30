# Markdown Viewer - Requirements Document

## Document Information
- **Project Name**: Markdown Viewer - Lightweight Mac Code Editor
- **Version**: 1.0
- **Last Updated**: 2026-01-30
- **Purpose**: Complete requirements specification for building a lightweight macOS code viewer application

---

## 1. Executive Summary

### 1.1 Project Vision
Build a lightweight, native macOS application for viewing and editing code files, with specialized rendering capabilities for Markdown and JSON files. The application should be similar to Notepad++ on Windows but optimized for macOS with a focus on minimal resource usage and fast performance.

### 1.2 Key Objectives
- **Lightweight**: App bundle size under 10MB (target: 5-10MB)
- **Fast**: Cold start under 1 second, minimal memory footprint (<100MB with 5 files)
- **Native**: macOS-native look, feel, and integration
- **Simple**: No file creation, focus on viewing and editing existing files
- **Specialized**: Advanced rendering for Markdown and JSON formats

### 1.3 Success Criteria
- [ ] Successfully opens and displays files in tabbed interface
- [ ] Markdown files render with full GitHub-flavored Markdown support
- [ ] JSON files display in structured tree view with editing capability
- [ ] All keyboard shortcuts work as specified
- [ ] App bundle size is under 10MB
- [ ] Memory usage stays under 100MB with 5 files open
- [ ] Application works on macOS 11 and above

---

## 2. Functional Requirements

### 2.1 File Operations

#### FR-2.1.1: Open Files
- **Priority**: CRITICAL
- **Description**: User must be able to open files from the file system
- **Requirements**:
  - Use native macOS file picker dialog
  - Support multiple file selections (opens each in separate tab)
  - Filter by supported file types in dialog
  - Keyboard shortcut: `Cmd+O`
  - Display error message if file cannot be read
  - Support files up to 10MB in size (warn for larger files)

#### FR-2.1.2: Save Files
- **Priority**: CRITICAL
- **Description**: User must be able to save modifications to files
- **Requirements**:
  - Save to original file path
  - Keyboard shortcut: `Cmd+S`
  - Visual feedback when save completes
  - Mark tab as "clean" (remove dirty indicator) after successful save
  - Display error message if save fails
  - Preserve original file permissions

#### FR-2.1.3: No File Creation
- **Priority**: CRITICAL
- **Description**: Application intentionally does NOT support creating new files
- **Requirements**:
  - No "New File" menu option
  - No "Save As" functionality (only save to existing path)
  - Application focus is viewing/editing existing files only

#### FR-2.1.4: Supported File Types
- **Priority**: HIGH
- **Description**: Application must recognize and appropriately handle these file types
- **Supported Extensions**:
  - **Markdown**: `.md`, `.markdown`
  - **JSON**: `.json`
  - **JavaScript**: `.js`, `.jsx`
  - **TypeScript**: `.ts`, `.tsx`
  - **Styling**: `.css`, `.scss`, `.sass`, `.less`
  - **Markup**: `.html`, `.xml`, `.svg`
  - **Config**: `.yml`, `.yaml`, `.toml`, `.ini`, `.env`
  - **Code**: `.py`, `.rs`, `.go`, `.java`, `.c`, `.cpp`, `.h`
  - **Plain text**: `.txt`, `.log`

### 2.2 Tabbed Interface

#### FR-2.2.1: Tab Creation
- **Priority**: CRITICAL
- **Description**: Each opened file appears in a new tab
- **Requirements**:
  - Create new tab automatically when file is opened
  - Tab shows file name (not full path)
  - Tab becomes active (focused) upon creation
  - Maximum 20 tabs can be open simultaneously
  - Display warning when attempting to open 21st tab

#### FR-2.2.2: Tab Display
- **Priority**: HIGH
- **Description**: Tabs must provide clear visual feedback
- **Requirements**:
  - Display file name in tab label
  - Show "dirty" indicator (bullet/dot) when file has unsaved changes
  - Active tab has distinct visual styling (highlighted)
  - Inactive tabs are visually subdued
  - Tab width: minimum 120px, maximum 200px
  - Long file names are truncated with ellipsis (...)
  - Tabs overflow with horizontal scroll if needed

#### FR-2.2.3: Tab Switching
- **Priority**: HIGH
- **Description**: User can switch between open tabs
- **Requirements**:
  - Click on tab to activate it
  - Keyboard shortcuts:
    - `Cmd+1` through `Cmd+9`: Switch to tab 1-9
    - `Cmd+Shift+[`: Previous tab
    - `Cmd+Shift+]`: Next tab
  - Only one tab can be active at a time
  - Switching tabs preserves scroll position and cursor location

#### FR-2.2.4: Tab Closing
- **Priority**: HIGH
- **Description**: User can close tabs
- **Requirements**:
  - Close button (×) on each tab
  - Keyboard shortcut: `Cmd+W` closes active tab
  - If tab has unsaved changes, show confirmation dialog:
    - "Do you want to save changes to [filename]?"
    - Options: "Save", "Don't Save", "Cancel"
  - Closing a tab activates the next tab to the right (or last tab if closing rightmost)
  - Can close all tabs (resulting in empty state)

### 2.3 Markdown Viewer

#### FR-2.3.1: Rendered View (Default)
- **Priority**: CRITICAL
- **Description**: Markdown files display in rendered HTML format by default
- **Requirements**:
  - Use GitHub-flavored Markdown (GFM) specification
  - Support all standard Markdown syntax:
    - Headers (H1-H6)
    - Bold, italic, strikethrough
    - Lists (ordered, unordered, nested)
    - Links (inline, reference)
    - Images (inline, reference)
    - Code blocks with syntax highlighting
    - Inline code
    - Blockquotes
    - Horizontal rules
    - Tables
    - Task lists (checkboxes)
  - Apply syntax highlighting to code blocks
  - Support 50+ programming languages for code block highlighting
  - Render should update in real-time when switching to rendered view

#### FR-2.3.2: Raw Edit Mode
- **Priority**: CRITICAL
- **Description**: User can toggle to raw Markdown editing mode
- **Requirements**:
  - Toggle between rendered and raw view
  - Keyboard shortcut: `Cmd+Shift+M`
  - Button in toolbar: "Edit Raw" (when in rendered) or "Show Rendered" (when in raw)
  - Raw mode shows Markdown syntax with syntax highlighting
  - Edits in raw mode are immediately reflected when switching back to rendered
  - Preserve scroll position when toggling (as much as possible)
  - Line numbers displayed in raw mode

#### FR-2.3.3: Markdown Styling
- **Priority**: MEDIUM
- **Description**: Rendered Markdown should have professional, readable styling
- **Requirements**:
  - Consistent typography with proper hierarchy
  - H1, H2 headers have bottom border
  - Code blocks have distinct background color
  - Links are colored (blue/accent color) and underlined on hover
  - Tables have borders and alternating row colors
  - Blockquotes have left border and muted text color
  - Proper spacing between elements
  - Max content width for readability (not full window width)
  - Responsive to theme (light/dark mode)

### 2.4 JSON Viewer

#### FR-2.4.1: Tree View (Default)
- **Priority**: CRITICAL
- **Description**: JSON files display in structured tree format by default
- **Requirements**:
  - Parse JSON and display as collapsible tree
  - Root level expanded by default
  - Show type indicators for values:
    - Strings: green color, quoted
    - Numbers: blue color
    - Booleans: red/pink color
    - Null: purple, italicized
    - Objects: show `{...}` when collapsed, `{` ... `}` when expanded
    - Arrays: show `[...]` when collapsed, `[` ... `]` when expanded
  - Click to expand/collapse nodes
  - Expand all / Collapse all functionality
  - Display key names in distinct color
  - Handle nested structures up to 100 levels deep
  - Display error message for invalid JSON with error details

#### FR-2.4.2: Raw Edit Mode
- **Priority**: CRITICAL
- **Description**: User can toggle to raw JSON editing mode
- **Requirements**:
  - Toggle between tree and raw view
  - Keyboard shortcut: `Cmd+Shift+J`
  - Button in toolbar: "Edit Raw" (when in tree) or "Show Tree View" (when in raw)
  - Raw mode shows JSON with syntax highlighting
  - Edits in raw mode update tree view when switching back
  - Show inline validation errors for invalid JSON
  - Display parse error messages with line/column information

#### FR-2.4.3: JSON Tools
- **Priority**: MEDIUM
- **Description**: Provide tools for working with JSON
- **Requirements**:
  - **Format button**: Pretty-print JSON with 2-space indentation
  - **Minify button**: Remove all whitespace to create compact JSON
  - **Copy path**: Copy JSON path to selected node (e.g., `data.users[0].name`)
  - Toolbar visible in both tree and raw modes
  - Format/Minify affect the raw content (and tree view)
  - Show temporary success indicator after format/minify

### 2.5 Code Editor

#### FR-2.5.1: Editor Functionality
- **Priority**: CRITICAL
- **Description**: Files that are not Markdown or JSON display in code editor
- **Requirements**:
  - Use Monaco Editor (VS Code's editor component)
  - Syntax highlighting based on file extension
  - Line numbers on left side
  - Current line highlighting
  - Automatic indentation detection
  - Tab size: 2 spaces (default)
  - Word wrap: enabled
  - Show whitespace characters: only on selection
  - Scroll beyond last line: disabled
  - Minimap: disabled (for performance)
  - Auto-closing brackets/quotes: enabled

#### FR-2.5.2: Editor Theme
- **Priority**: MEDIUM
- **Description**: Editor theme matches system preference
- **Requirements**:
  - Light theme when system is in light mode
  - Dark theme (`vs-dark`) when system is in dark mode
  - Automatically switch when system theme changes
  - Consistent with application theme

#### FR-2.5.3: Supported Languages
- **Priority**: MEDIUM
- **Description**: Syntax highlighting for common programming languages
- **Supported Languages**:
  - JavaScript, TypeScript, JSX, TSX
  - Python, Rust, Go, Java, C, C++
  - HTML, CSS, SCSS
  - JSON, YAML, TOML
  - Markdown (in raw mode)
  - Shell scripts
  - SQL
  - Fallback: Plain text for unknown extensions

### 2.6 Keyboard Shortcuts

#### FR-2.6.1: Global Shortcuts
- **Priority**: HIGH
- **Description**: Application-wide keyboard shortcuts
- **Shortcuts**:
  | Shortcut | Action |
  |----------|--------|
  | `Cmd+O` | Open file |
  | `Cmd+S` | Save current file |
  | `Cmd+W` | Close current tab |
  | `Cmd+Q` | Quit application |
  | `Cmd+,` | Open preferences (if implemented) |
  | `Cmd+1` to `Cmd+9` | Switch to tab 1-9 |
  | `Cmd+Shift+[` | Previous tab |
  | `Cmd+Shift+]` | Next tab |

#### FR-2.6.2: Context-Specific Shortcuts
- **Priority**: HIGH
- **Description**: Shortcuts that work in specific contexts
- **Shortcuts**:
  | Shortcut | Action | Context |
  |----------|--------|---------|
  | `Cmd+Shift+M` | Toggle Markdown view mode | Markdown files only |
  | `Cmd+Shift+J` | Toggle JSON view mode | JSON files only |
  | `Cmd+F` | Find in file | Code editor mode |
  | `Cmd+G` | Go to line | Code editor mode |
  | `Cmd++` | Increase font size | All viewers |
  | `Cmd+-` | Decrease font size | All viewers |
  | `Cmd+0` | Reset font size | All viewers |

### 2.7 User Interface

#### FR-2.7.1: Application Layout
- **Priority**: CRITICAL
- **Description**: Overall application structure
- **Requirements**:
  - **Header bar**: Contains menu buttons (Open, Save)
  - **Tab bar**: Shows all open tabs, fixed height (36px)
  - **Content area**: Displays active file content (fills remaining space)
  - No traditional sidebar (minimalist approach)
  - No status bar (keep it simple)
  - All areas respond to window resizing

#### FR-2.7.2: Empty State
- **Priority**: MEDIUM
- **Description**: Display when no files are open
- **Requirements**:
  - Centered message: "No File Open"
  - Instruction: "Press Cmd+O to open a file"
  - Large "Open File" button
  - Visually clean and uncluttered
  - Keyboard shortcut hints styled as keyboard keys

#### FR-2.7.3: Theme Support
- **Priority**: HIGH
- **Description**: Application supports light and dark themes
- **Requirements**:
  - Automatically detect system theme (light/dark)
  - Update theme when system preference changes
  - All UI components support both themes
  - Code editor theme matches app theme
  - Color variables defined for:
    - Background colors (primary, secondary, tertiary)
    - Text colors (primary, secondary)
    - Border colors
    - Accent colors (blue for actions)
    - Danger colors (red for destructive actions)

#### FR-2.7.4: Toolbar (Context-Specific)
- **Priority**: MEDIUM
- **Description**: Toolbar appears for Markdown and JSON files
- **Requirements**:
  - Appears below tab bar, above content area
  - Height: 40px
  - Background: Secondary background color
  - Border bottom: 1px
  - Contains view mode toggle button
  - For JSON: Also contains Format and Minify buttons
  - Not displayed for regular code files

### 2.8 Error Handling

#### FR-2.8.1: File Read Errors
- **Priority**: HIGH
- **Description**: Handle errors when opening files
- **Error Scenarios**:
  - File not found: "Could not find file: [path]"
  - Permission denied: "Permission denied reading: [filename]"
  - File too large: "File is too large (>10MB)"
  - Encoding error: "Could not read file encoding"
- **Requirements**:
  - Display error as system notification or dialog
  - Do not create tab if file cannot be read
  - Log error to console for debugging

#### FR-2.8.2: File Write Errors
- **Priority**: HIGH
- **Description**: Handle errors when saving files
- **Error Scenarios**:
  - Permission denied: "Permission denied writing to: [filename]"
  - Disk full: "Could not save file: Disk full"
  - File was deleted: "Original file no longer exists"
- **Requirements**:
  - Display error dialog with retry option
  - Keep file in "dirty" state if save fails
  - Log error to console for debugging

#### FR-2.8.3: Parse Errors
- **Priority**: MEDIUM
- **Description**: Handle invalid file content
- **Error Scenarios**:
  - Invalid JSON: Show error panel with parse error message
  - Corrupted Markdown: Render as much as possible, don't crash
- **Requirements**:
  - Display errors inline where possible
  - Provide option to view in raw mode
  - Never crash the application

---

## 3. Non-Functional Requirements

### 3.1 Performance

#### NFR-3.1.1: Startup Time
- **Requirement**: Application cold start must complete in under 1 second
- **Measurement**: Time from launch to window visible and interactive
- **Target**: 800ms average

#### NFR-3.1.2: Memory Usage
- **Requirement**: Memory footprint must stay under 100MB with 5 files open
- **Measurement**: Resident memory (RSS) on macOS Activity Monitor
- **Target**: 50-80MB with 5 medium-sized files

#### NFR-3.1.3: File Opening Speed
- **Requirement**: Files under 1MB must open instantly
- **Measurement**: Time from file selection to content visible
- **Target**: <100ms for files under 1MB

#### NFR-3.1.4: Rendering Performance
- **Requirement**: Markdown/JSON rendering must be smooth
- **Measurement**: No visible lag when switching view modes
- **Target**: <50ms to switch view modes

### 3.2 Size and Resources

#### NFR-3.2.1: Bundle Size
- **Requirement**: macOS .app bundle must be under 10MB
- **Target**: 5-10MB for production build
- **Excludes**: System frameworks (WebKit, etc.)

#### NFR-3.2.2: Dependency Minimalism
- **Requirement**: Use minimal external dependencies
- **Guideline**: Only include dependencies that provide significant value
- **Bundle optimization**: Tree-shaking and code splitting enabled

### 3.3 Compatibility

#### NFR-3.3.1: macOS Version Support
- **Requirement**: Support macOS 11 (Big Sur) and newer
- **Target**: macOS 11.0+
- **Architecture**: Universal binary (Intel + Apple Silicon)

#### NFR-3.3.2: File Encoding
- **Requirement**: Support UTF-8 encoded files
- **Also support**: UTF-16, ASCII (auto-detect)
- **Line endings**: Handle LF, CRLF, CR

### 3.4 Usability

#### NFR-3.4.1: Accessibility
- **Requirement**: Basic keyboard navigation support
- **Requirements**:
  - All interactive elements accessible via keyboard
  - Focus indicators visible
  - ARIA labels where appropriate (future enhancement)

#### NFR-3.4.2: Visual Design
- **Requirement**: Native macOS look and feel
- **Guidelines**:
  - Use system fonts where appropriate
  - Follow macOS HIG (Human Interface Guidelines)
  - Consistent spacing and alignment
  - Professional appearance

### 3.5 Reliability

#### NFR-3.5.1: Stability
- **Requirement**: Application must not crash during normal operation
- **Target**: Zero crashes during standard usage
- **Error recovery**: Graceful degradation when errors occur

#### NFR-3.5.2: Data Integrity
- **Requirement**: Never lose user edits
- **Requirements**:
  - Unsaved changes clearly indicated
  - Warning before closing tab with unsaved changes
  - Atomic file writes (write to temp file, then rename)

---

## 4. User Stories

### 4.1 Primary Use Cases

#### US-4.1.1: Viewing Markdown Documentation
**As a** developer
**I want to** view Markdown README files in rendered format
**So that** I can read documentation more easily

**Acceptance Criteria**:
- Open .md file via Cmd+O
- File displays in rendered HTML format by default
- Code blocks have syntax highlighting
- Links are clickable
- Tables render correctly

#### US-4.1.2: Editing Configuration Files
**As a** developer
**I want to** edit JSON configuration files with structure visibility
**So that** I can navigate complex configs easily

**Acceptance Criteria**:
- Open .json file
- See tree structure with collapsible nodes
- Toggle to raw mode to edit
- Format JSON with one click
- Save changes with Cmd+S

#### US-4.1.3: Quickly Reviewing Code
**As a** developer
**I want to** quickly open and review code files
**So that** I can inspect code without opening a full IDE

**Acceptance Criteria**:
- Open code file (.js, .py, .ts, etc.)
- See syntax highlighting
- Read line numbers
- Make quick edits
- Save changes

#### US-4.1.4: Working with Multiple Files
**As a** user
**I want to** have multiple files open in tabs
**So that** I can reference multiple files simultaneously

**Acceptance Criteria**:
- Open multiple files
- Each appears in separate tab
- Click tabs to switch between files
- Use Cmd+1-9 to quickly switch tabs
- Close individual tabs

### 4.2 Secondary Use Cases

#### US-4.2.1: Comparing Markdown Rendered vs Source
**As a** technical writer
**I want to** toggle between rendered and source Markdown
**So that** I can verify formatting while editing

**Acceptance Criteria**:
- View rendered Markdown
- Press Cmd+Shift+M to see source
- Edit source
- Press Cmd+Shift+M to see rendered result
- Changes are visible immediately

#### US-4.2.2: Validating JSON
**As a** developer
**I want to** see if my JSON is valid
**So that** I can fix syntax errors

**Acceptance Criteria**:
- Open JSON file with syntax error
- See error message displayed
- Error shows line and column number
- Switch to raw mode to fix error
- Switch back to tree view when fixed

---

## 5. Constraints and Assumptions

### 5.1 Technical Constraints
- Must use Tauri framework (not Electron) for size requirements
- Must use React for UI framework
- Must target macOS only (no Windows/Linux)
- Must use TypeScript for type safety
- Monaco Editor must be used for code editing

### 5.2 Business Constraints
- No file creation functionality (viewing/editing only)
- No cloud sync or collaboration features
- No plugin system (keep it simple)
- No auto-update mechanism (v1.0 scope)

### 5.3 Assumptions
- Users have macOS 11 or newer
- Users work with UTF-8 encoded text files
- Users primarily work with files under 10MB
- Users are familiar with standard text editor keyboard shortcuts
- Users have Rust and Node.js installed for development

---

## 6. Future Enhancements (Out of Scope for v1.0)

### 6.1 Potential Future Features
- File tree sidebar for folder navigation
- Find and replace (Cmd+F, Cmd+H)
- Recent files list
- Quick file opener (Cmd+P)
- Split view (side-by-side editing)
- Settings/Preferences panel
- Custom color themes
- Git integration (show modified files)
- Bookmark/favorite files
- Export Markdown to PDF
- Diff view for file comparison
- Terminal integration

### 6.2 Not Planned
- Multi-platform support (Windows/Linux)
- File creation or project management
- Integrated debugging
- Version control operations
- Remote file editing
- Extension/plugin system

---

## 7. Acceptance Testing

### 7.1 Critical Path Tests
1. **Open and view file**
   - Launch app
   - Press Cmd+O
   - Select .md file
   - Verify file opens in new tab
   - Verify rendered Markdown displays correctly

2. **Edit and save file**
   - Open any file
   - Make edits
   - Verify dirty indicator appears on tab
   - Press Cmd+S
   - Verify dirty indicator disappears
   - Verify file is saved to disk

3. **Toggle view modes**
   - Open .md file
   - Press Cmd+Shift+M
   - Verify raw mode shows Markdown source
   - Press Cmd+Shift+M again
   - Verify rendered mode displays

4. **Manage tabs**
   - Open 3 files
   - Verify 3 tabs appear
   - Click on second tab
   - Verify it becomes active
   - Press Cmd+W
   - Verify tab closes
   - Verify another tab becomes active

### 7.2 Performance Tests
1. Measure cold start time (should be <1s)
2. Open 5 files, check memory usage (should be <100MB)
3. Open 5MB file, measure load time (should be <500ms)
4. Toggle Markdown view 10 times, verify smooth rendering

### 7.3 Error Handling Tests
1. Attempt to open non-existent file
2. Attempt to save to read-only file
3. Open invalid JSON file
4. Open binary file
5. Fill disk and attempt save

---

## 8. Glossary

- **Tab**: A UI element representing an open file
- **Dirty**: A file with unsaved changes
- **View Mode**: Rendered vs Raw display mode
- **Tree View**: Structured JSON display with collapsible nodes
- **Monaco Editor**: VS Code's editor component
- **GFM**: GitHub-Flavored Markdown
- **Tauri**: Rust-based framework for building native desktop apps

---

## 9. Appendix

### 9.1 Keyboard Shortcut Reference

| Shortcut | Action | Scope |
|----------|--------|-------|
| Cmd+O | Open file | Global |
| Cmd+S | Save file | Global |
| Cmd+W | Close tab | Global |
| Cmd+Q | Quit app | Global |
| Cmd+1-9 | Switch to tab | Global |
| Cmd+Shift+[ | Previous tab | Global |
| Cmd+Shift+] | Next tab | Global |
| Cmd+Shift+M | Toggle Markdown mode | Markdown only |
| Cmd+Shift+J | Toggle JSON mode | JSON only |
| Cmd+F | Find in file | Editor only |
| Cmd++ | Increase font | All viewers |
| Cmd+- | Decrease font | All viewers |
| Cmd+0 | Reset font | All viewers |

### 9.2 File Type Detection Logic

```
File Extension → Language Mapping:
.md, .markdown → markdown
.json → json
.js → javascript
.jsx → javascript (JSX)
.ts → typescript
.tsx → typescript (TSX)
.css → css
.html → html
.xml → xml
.yml, .yaml → yaml
.py → python
.rs → rust
.go → go
.java → java
.txt → plaintext
(default) → plaintext
```

### 9.3 Color Scheme Variables

**Light Theme:**
- Background Primary: #ffffff
- Background Secondary: #f5f5f5
- Background Tertiary: #e0e0e0
- Text Primary: #000000
- Text Secondary: #666666
- Border: #d0d0d0
- Accent: #007aff
- Danger: #ff3b30

**Dark Theme:**
- Background Primary: #1e1e1e
- Background Secondary: #252526
- Background Tertiary: #2d2d30
- Text Primary: #cccccc
- Text Secondary: #858585
- Border: #3e3e42
- Accent: #0a84ff
- Danger: #ff453a

---

**Document End**
