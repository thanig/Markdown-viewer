import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { appWindow } from '@tauri-apps/api/window';
import { getMatches } from '@tauri-apps/api/cli';
import { confirm } from '@tauri-apps/api/dialog';
import { useTabs } from './hooks/useTabs';
import { useFile, isUntitledPath } from './hooks/useFile';
import { useRecentFiles } from './hooks/useRecentFiles';
import { useSessionPersistence } from './hooks/useSessionPersistence';
import { TabBar } from './components/TabBar/TabBar';
import { FileTree } from './components/FileTree/FileTree';
import { StatusBar } from './components/StatusBar/StatusBar';
import { MarkdownViewer } from './components/Viewers/MarkdownViewer';
import { JsonViewer } from './components/Viewers/JsonViewer';
import { HtmlViewer } from './components/Viewers/HtmlViewer';
import { CodeEditor, MonacoAction, CursorPosition } from './components/Viewers/CodeEditor';
import {
  FilePlusIcon,
  MarkdownIcon,
  HtmlIcon,
  JsonIcon,
  CodeIcon,
  TypeScriptIcon,
  CssIcon,
  PythonIcon,
  FileIcon,
} from './components/Icons/Icons';
import './App.css';

function App() {
  const {
    tabs,
    activeTabId,
    setActiveTabId,
    addTab,
    closeTab,
    closeOtherTabs,
    closeAllTabs,
    updateTabContent,
    toggleViewMode,
    markTabSaved,
    updateTabPathAndName,
    getActiveTab,
  } = useTabs();

  const { openFile, openFilePath, saveFile, saveFileAs, createUntitledFile, saveUntitledFile } = useFile();
  const { recentFiles, addRecentFile } = useRecentFiles();
  const { saveSession, restoreSession } = useSessionPersistence();
  const untitledCounter = useRef(1);

  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [folderPath, setFolderPath] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<CursorPosition | null>(null);
  const activeTab = getActiveTab();

  // Refs for stable access in event listeners
  const tabsRef = useRef(tabs);
  const activeTabRef = useRef(activeTab);
  const activeTabIdRef = useRef(activeTabId);
  const sidebarVisibleRef = useRef(sidebarVisible);
  const sidebarWidthRef = useRef(sidebarWidth);
  const folderPathRef = useRef(folderPath);

  useEffect(() => { tabsRef.current = tabs; }, [tabs]);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
  useEffect(() => { activeTabIdRef.current = activeTabId; }, [activeTabId]);
  useEffect(() => { sidebarVisibleRef.current = sidebarVisible; }, [sidebarVisible]);
  useEffect(() => { sidebarWidthRef.current = sidebarWidth; }, [sidebarWidth]);
  useEffect(() => { folderPathRef.current = folderPath; }, [folderPath]);

  // Define handler functions with useCallback
  const handleNewFile = useCallback((fileType: string) => {
    setShowNewFileModal(false);
    const file = createUntitledFile(fileType, untitledCounter.current);
    untitledCounter.current += 1;
    addTab(file.path, file.name, file.content, file.language);
  }, [createUntitledFile, addTab]);

  const handleOpenFile = useCallback(async () => {
    const file = await openFile();
    if (file) {
      addTab(file.path, file.name, file.content, file.language);
      addRecentFile(file.path, file.name);
    }
  }, [openFile, addTab, addRecentFile]);

  const handleSaveFile = useCallback(async () => {
    const tab = activeTabRef.current;
    if (!tab) return;

    if (isUntitledPath(tab.path)) {
      const fileTypeMap: { [key: string]: string } = {
        'markdown': 'markdown',
        'json': 'json',
        'javascript': 'javascript',
        'typescript': 'typescript',
        'html': 'html',
        'css': 'css',
        'python': 'python',
        'plaintext': 'text',
      };
      const fileType = fileTypeMap[tab.language] || 'text';

      const result = await saveUntitledFile(tab.content, fileType);
      if (result) {
        updateTabPathAndName(tab.id, result.path, result.name, result.language);
        addRecentFile(result.path, result.name);
      }
    } else {
      const success = await saveFile(tab.path, tab.content);
      if (success) {
        markTabSaved(tab.id);
      }
    }
  }, [saveFile, saveUntitledFile, markTabSaved, updateTabPathAndName, addRecentFile]);

  const handleSaveAs = useCallback(async () => {
    const tab = activeTabRef.current;
    if (!tab) return;

    const path = await saveFileAs(tab.content);
    if (path) {
      const name = path.split('/').pop() || path.split('\\').pop() || 'Untitled';
      updateTabPathAndName(tab.id, path, name);
      addRecentFile(path, name);
    }
  }, [saveFileAs, updateTabPathAndName, addRecentFile]);

  const handleContentChange = useCallback((content: string) => {
    if (activeTab) {
      updateTabContent(activeTab.id, content);
    }
  }, [activeTab, updateTabContent]);

  const handleToggleViewMode = useCallback(() => {
    if (activeTab) {
      toggleViewMode(activeTab.id);
    }
  }, [activeTab, toggleViewMode]);

  const handleFileSelect = useCallback(async (path: string) => {
    const existingTab = tabsRef.current.find(tab => tab.path === path);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }

    const file = await openFilePath(path);
    if (file) {
      addTab(file.path, file.name, file.content, file.language);
      addRecentFile(file.path, file.name);
    }
  }, [openFilePath, addTab, setActiveTabId, addRecentFile]);

  const handleToggleSidebar = useCallback(() => {
    setSidebarVisible(prev => !prev);
  }, []);

  // Check if tab is dirty before closing
  const handleCloseTab = useCallback(async (id: string) => {
    const tab = tabsRef.current.find(t => t.id === id);
    if (tab && tab.isDirty) {
      const shouldClose = await confirm(
        `"${tab.name}" has unsaved changes. Close anyway?`,
        { title: 'Unsaved Changes', type: 'warning' }
      );
      if (!shouldClose) return;
    }
    closeTab(id);
  }, [closeTab]);

  // Build Monaco command palette actions
  const editorActions = useMemo((): MonacoAction[] => {
    const actions: MonacoAction[] = [
      {
        id: 'file.new',
        label: 'New File',
        keybindings: [],
        contextMenuGroupId: '0_file',
        contextMenuOrder: 1,
        run: () => setShowNewFileModal(true),
      },
      {
        id: 'file.open',
        label: 'Open File',
        keybindings: [],
        contextMenuGroupId: '0_file',
        contextMenuOrder: 2,
        run: handleOpenFile,
      },
    ];

    if (activeTab) {
      actions.push({
        id: 'file.save',
        label: 'Save File',
        keybindings: [],
        contextMenuGroupId: '0_file',
        contextMenuOrder: 3,
        run: handleSaveFile,
      });

      actions.push({
        id: 'file.close',
        label: 'Close Tab',
        keybindings: [],
        contextMenuGroupId: '0_file',
        contextMenuOrder: 4,
        run: () => handleCloseTab(activeTab.id),
      });

      if (activeTab.language === 'markdown') {
        actions.push({
          id: 'view.toggleMarkdown',
          label: activeTab.viewMode === 'rendered' ? 'Edit Raw Markdown' : 'Show Rendered Markdown',
          keybindings: [],
          contextMenuGroupId: '1_view',
          contextMenuOrder: 1,
          run: handleToggleViewMode,
        });
      } else if (activeTab.language === 'json') {
        actions.push({
          id: 'view.toggleJson',
          label: activeTab.viewMode === 'rendered' ? 'Edit Raw JSON' : 'Show JSON Tree View',
          keybindings: [],
          contextMenuGroupId: '1_view',
          contextMenuOrder: 1,
          run: handleToggleViewMode,
        });
      } else if (activeTab.language === 'html') {
        actions.push({
          id: 'view.toggleHtml',
          label: activeTab.viewMode === 'rendered' ? 'Edit Raw HTML' : 'Show Rendered HTML',
          keybindings: [],
          contextMenuGroupId: '1_view',
          contextMenuOrder: 1,
          run: handleToggleViewMode,
        });
      }
    }

    return actions;
  }, [activeTab, activeTabId, handleOpenFile, handleSaveFile, handleToggleViewMode, handleCloseTab]);

  // Keyboard shortcuts (only those NOT handled by the native menu)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+Shift+M - Toggle Markdown view mode
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        const tab = activeTabRef.current;
        if (tab && tab.language === 'markdown') {
          toggleViewMode(tab.id);
        }
      }

      // Cmd+Shift+J - Toggle JSON view mode
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        const tab = activeTabRef.current;
        if (tab && tab.language === 'json') {
          toggleViewMode(tab.id);
        }
      }

      // Cmd+Shift+H - Toggle HTML view mode
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'H') {
        e.preventDefault();
        const tab = activeTabRef.current;
        if (tab && tab.language === 'html') {
          toggleViewMode(tab.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleViewMode]);

  // Menu event listener from native menu bar
  useEffect(() => {
    const unlisten = listen<string>('menu-event', async (event) => {
      switch (event.payload) {
        case 'new_file':
          setShowNewFileModal(true);
          break;
        case 'open_file':
          handleOpenFile();
          break;
        case 'save':
          handleSaveFile();
          break;
        case 'save_as':
          handleSaveAs();
          break;
        case 'close_tab': {
          const tabId = activeTabIdRef.current;
          if (tabId) handleCloseTab(tabId);
          break;
        }
        case 'toggle_sidebar':
          handleToggleSidebar();
          break;
        case 'quit':
          appWindow.close();
          break;
      }
    });

    return () => { unlisten.then(fn => fn()); };
  }, [handleOpenFile, handleSaveFile, handleSaveAs, handleCloseTab, handleToggleSidebar]);

  // CLI argument support - open files passed as arguments
  useEffect(() => {
    getMatches().then(matches => {
      const fileArgs = matches.args['file'];
      if (fileArgs && fileArgs.value) {
        const files = Array.isArray(fileArgs.value) ? fileArgs.value : [fileArgs.value];
        files.forEach((filePath: string | boolean) => {
          if (typeof filePath === 'string' && filePath) handleFileSelect(filePath);
        });
      }
    }).catch(() => {
      // CLI not available (e.g., in dev mode), ignore
    });
  }, []);

  // Drag & drop support
  useEffect(() => {
    const unlisten = appWindow.onFileDropEvent((event) => {
      if (event.payload.type === 'hover') {
        setIsDragging(true);
      } else if (event.payload.type === 'drop') {
        setIsDragging(false);
        event.payload.paths.forEach(path => handleFileSelect(path));
      } else if (event.payload.type === 'cancel') {
        setIsDragging(false);
      }
    });

    return () => { unlisten.then(fn => fn()); };
  }, [handleFileSelect]);

  // Unsaved changes warning on close
  useEffect(() => {
    const unlisten = appWindow.onCloseRequested(async (event) => {
      const hasDirty = tabsRef.current.some(t => t.isDirty);
      if (hasDirty) {
        const shouldClose = await confirm(
          'You have unsaved changes. Are you sure you want to quit?',
          { title: 'Unsaved Changes', type: 'warning' }
        );
        if (!shouldClose) {
          event.preventDefault();
        }
      }
    });

    return () => { unlisten.then(fn => fn()); };
  }, []);

  // Window title update
  useEffect(() => {
    if (activeTab) {
      const modifier = activeTab.isDirty ? ' (modified)' : '';
      appWindow.setTitle(`${activeTab.name}${modifier} - Markdown Viewer`);
    } else {
      appWindow.setTitle('Markdown Viewer');
    }
  }, [activeTab?.name, activeTab?.isDirty, activeTabId]);

  // Session persistence - save on changes
  useEffect(() => {
    saveSession(tabs, sidebarVisible, sidebarWidth, folderPath);
  }, [tabs, sidebarVisible, sidebarWidth, folderPath, saveSession]);

  // Session persistence - restore on mount
  useEffect(() => {
    restoreSession().then(session => {
      if (session && session.tabs.length > 0) {
        session.tabs.forEach(tab => {
          addTab(tab.path, tab.name, tab.content, tab.language);
        });
        setSidebarVisible(session.sidebarVisible);
        setSidebarWidth(session.sidebarWidth);
        if (session.folderPath) setFolderPath(session.folderPath);
      }
    });
  }, []);

  // Reset cursor position when switching tabs
  useEffect(() => {
    setCursorPosition(null);
  }, [activeTabId]);

  const handleCursorChange = useCallback((position: CursorPosition) => {
    setCursorPosition(position);
  }, []);

  const renderViewer = () => {
    if (!activeTab) {
      return (
        <div className="empty-state">
          <div className="empty-state-content">
            <h2>No File Open</h2>
            <p>Press <kbd>Cmd+N</kbd> to create a new file or <kbd>Cmd+O</kbd> to open an existing file</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
              <button onClick={() => setShowNewFileModal(true)} className="open-button">
                <FilePlusIcon size={16} />
                New File
              </button>
              <button onClick={handleOpenFile} className="open-button">
                Open File
              </button>
            </div>
            {recentFiles.length > 0 && (
              <div className="recent-files">
                <h3>Recent Files</h3>
                <ul>
                  {recentFiles.map(f => (
                    <li key={f.path}>
                      <button onClick={() => handleFileSelect(f.path)} className="recent-file-button">
                        {f.name}
                        <span className="recent-file-path">{f.path}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (activeTab.language === 'markdown') {
      return (
        <MarkdownViewer
          content={activeTab.content}
          viewMode={activeTab.viewMode}
          onChange={handleContentChange}
          onToggleMode={handleToggleViewMode}
          editorActions={editorActions}
        />
      );
    }

    if (activeTab.language === 'json') {
      return (
        <JsonViewer
          content={activeTab.content}
          viewMode={activeTab.viewMode}
          onChange={handleContentChange}
          onToggleMode={handleToggleViewMode}
          editorActions={editorActions}
        />
      );
    }

    if (activeTab.language === 'html') {
      return (
        <HtmlViewer
          content={activeTab.content}
          viewMode={activeTab.viewMode}
          onChange={handleContentChange}
          onToggleMode={handleToggleViewMode}
          editorActions={editorActions}
        />
      );
    }

    return (
      <div className="code-viewer">
        <CodeEditor
          content={activeTab.content}
          language={activeTab.language}
          onChange={handleContentChange}
          actions={editorActions}
          onCursorChange={handleCursorChange}
        />
      </div>
    );
  };

  return (
    <div className={`app ${isDragging ? 'dragging' : ''}`}>
      <div className="main-container">
        {sidebarVisible && (
          <FileTree
            onFileSelect={handleFileSelect}
            rootPath={folderPath}
            onRootPathChange={setFolderPath}
            width={sidebarWidth}
            onWidthChange={setSidebarWidth}
          />
        )}
        <div className="editor-container">
          <TabBar
            tabs={tabs}
            activeTabId={activeTabId}
            onTabClick={setActiveTabId}
            onTabClose={handleCloseTab}
            onCloseOtherTabs={closeOtherTabs}
            onCloseAllTabs={closeAllTabs}
          />
          <div className="content">
            {renderViewer()}
          </div>
        </div>
      </div>
      <StatusBar
        language={activeTab?.language || null}
        cursorPosition={cursorPosition}
        tabCount={tabs.length}
      />

      {isDragging && (
        <div className="drag-overlay">
          <div className="drag-overlay-content">
            Drop files to open
          </div>
        </div>
      )}

      {/* New File Modal */}
      {showNewFileModal && (
        <div className="modal-overlay" onClick={() => setShowNewFileModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New File</h2>
            <p>Select file type:</p>
            <div className="file-type-grid">
              <button className="file-type-button" onClick={() => handleNewFile('markdown')}>
                <span className="file-type-icon"><MarkdownIcon size={28} className="icon-markdown" /></span>
                <span className="file-type-name">Markdown</span>
                <span className="file-type-ext">.md</span>
              </button>
              <button className="file-type-button" onClick={() => handleNewFile('html')}>
                <span className="file-type-icon"><HtmlIcon size={28} className="icon-html" /></span>
                <span className="file-type-name">HTML</span>
                <span className="file-type-ext">.html</span>
              </button>
              <button className="file-type-button" onClick={() => handleNewFile('json')}>
                <span className="file-type-icon"><JsonIcon size={28} className="icon-json" /></span>
                <span className="file-type-name">JSON</span>
                <span className="file-type-ext">.json</span>
              </button>
              <button className="file-type-button" onClick={() => handleNewFile('javascript')}>
                <span className="file-type-icon"><CodeIcon size={28} className="icon-javascript" /></span>
                <span className="file-type-name">JavaScript</span>
                <span className="file-type-ext">.js</span>
              </button>
              <button className="file-type-button" onClick={() => handleNewFile('typescript')}>
                <span className="file-type-icon"><TypeScriptIcon size={28} className="icon-typescript" /></span>
                <span className="file-type-name">TypeScript</span>
                <span className="file-type-ext">.ts</span>
              </button>
              <button className="file-type-button" onClick={() => handleNewFile('css')}>
                <span className="file-type-icon"><CssIcon size={28} className="icon-css" /></span>
                <span className="file-type-name">CSS</span>
                <span className="file-type-ext">.css</span>
              </button>
              <button className="file-type-button" onClick={() => handleNewFile('python')}>
                <span className="file-type-icon"><PythonIcon size={28} className="icon-python" /></span>
                <span className="file-type-name">Python</span>
                <span className="file-type-ext">.py</span>
              </button>
              <button className="file-type-button" onClick={() => handleNewFile('text')}>
                <span className="file-type-icon"><FileIcon size={28} /></span>
                <span className="file-type-name">Text</span>
                <span className="file-type-ext">.txt</span>
              </button>
            </div>
            <button className="modal-close-button" onClick={() => setShowNewFileModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
