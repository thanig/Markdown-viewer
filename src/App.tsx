import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTabs } from './hooks/useTabs';
import { useFile } from './hooks/useFile';
import { TabBar } from './components/TabBar/TabBar';
import { MarkdownViewer } from './components/Viewers/MarkdownViewer';
import { JsonViewer } from './components/Viewers/JsonViewer';
import { HtmlViewer } from './components/Viewers/HtmlViewer';
import { CodeEditor, MonacoAction } from './components/Viewers/CodeEditor';
import { FileBrowser } from './components/FileBrowser/FileBrowser';
import './App.css';

function App() {
  const {
    tabs,
    activeTabId,
    setActiveTabId,
    addTab,
    closeTab,
    updateTabContent,
    toggleViewMode,
    markTabSaved,
    getActiveTab,
  } = useTabs();

  const { openFile, saveFile, openFolder, readDirectory, readFileContent, createNewFile } = useFile();

  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const activeTab = getActiveTab();

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

    // Add save action if there's an active tab
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
        run: () => closeTab(activeTab.id),
      });

      // Add view mode toggle based on file type
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
  }, [activeTab, activeTabId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Cmd+N or Ctrl+N - New file
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setShowNewFileModal(true);
      }

      // Cmd+O or Ctrl+O - Open file
      if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
        e.preventDefault();
        await handleOpenFile();
      }

      // Cmd+S or Ctrl+S - Save file
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        await handleSaveFile();
      }

      // Cmd+W or Ctrl+W - Close tab
      if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
        e.preventDefault();
        if (activeTabId) {
          closeTab(activeTabId);
        }
      }

      // Cmd+Shift+M - Toggle Markdown view mode
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        if (activeTab && activeTab.language === 'markdown') {
          toggleViewMode(activeTab.id);
        }
      }

      // Cmd+Shift+J - Toggle JSON view mode
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        if (activeTab && activeTab.language === 'json') {
          toggleViewMode(activeTab.id);
        }
      }

      // Cmd+Shift+H - Toggle HTML view mode
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'H') {
        e.preventDefault();
        if (activeTab && activeTab.language === 'html') {
          toggleViewMode(activeTab.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, activeTab]);

  const handleNewFile = async (fileType: string) => {
    setShowNewFileModal(false);
    const file = await createNewFile(fileType);
    if (file) {
      addTab(file.path, file.name, file.content, file.language);
    }
  };

  const handleOpenFile = async () => {
    const file = await openFile();
    if (file) {
      addTab(file.path, file.name, file.content, file.language);
    }
  };

  const handleSaveFile = async () => {
    if (!activeTab) return;

    const success = await saveFile(activeTab.path, activeTab.content);
    if (success) {
      markTabSaved(activeTab.id);
    }
  };

  const handleContentChange = (content: string) => {
    if (activeTab) {
      updateTabContent(activeTab.id, content);
    }
  };

  const handleToggleViewMode = () => {
    if (activeTab) {
      toggleViewMode(activeTab.id);
    }
  };

  const renderViewer = () => {
    if (!activeTab) {
      return (
        <div className="empty-state">
          <div className="empty-state-content">
            <h2>No File Open</h2>
            <p>Press <kbd>Cmd+N</kbd> to create a new file or <kbd>Cmd+O</kbd> to open an existing file</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => setShowNewFileModal(true)} className="open-button">
                New File
              </button>
              <button onClick={handleOpenFile} className="open-button">
                Open File
              </button>
            </div>
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
        />
      </div>
    );
  };

  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [isResizing, setIsResizing] = useState(false);

  // Resize handlers
  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent: { clientX: number }) => {
      if (isResizing) {
        setSidebarWidth(mouseMoveEvent.clientX);
      }
    },
    [isResizing]
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  const handleFileOpen = async (path: string, preview: boolean) => {
    // If preview is true, we might want to reuse a "preview" tab if one exists
    // For now, let's just open it as a normal tab, but maybe mark it as preview?
    // The current Tab system doesn't support 'preview' state explicitly yet.
    // We'll just open it. Improved "preview vs pin" logic would require Tab state updates.

    // Suppress unused warning
    console.debug('Opening file (preview: ' + preview + ')', path);

    // Check if tab already exists
    const existingTab = tabs.find(t => t.path === path);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }

    const file = await readFileContent(path);
    if (file) {
      addTab(file.path, file.name, file.content, file.language);
    }
  };

  return (
    <div className="app">
      <div style={{ width: sidebarWidth, flexShrink: 0, display: 'flex' }}>
        <FileBrowser
          onFileOpen={handleFileOpen}
          onOpenFolder={openFolder}
          onReadDirectory={readDirectory}
        />
        <div
          className="sidebar-resizer"
          onMouseDown={startResizing}
          style={{
            width: '5px',
            cursor: 'col-resize',
            backgroundColor: isResizing ? '#007acc' : 'transparent',
            height: '100%',
            borderRight: '1px solid #333'
          }}
        />
      </div>
      <div className="main-column">
        <div className="header">
          <div className="menu-bar">
            <button onClick={() => setShowNewFileModal(true)} className="menu-button">
              New File
            </button>
            <button onClick={handleOpenFile} className="menu-button">
              Open File
            </button>
            {activeTab && (
              <button onClick={handleSaveFile} className="menu-button">
                Save {activeTab.isDirty && '•'}
              </button>
            )}
            {activeTab && activeTab.language === 'markdown' && (
              <button onClick={handleToggleViewMode} className="menu-button">
                {activeTab.viewMode === 'rendered' ? 'Edit Raw' : 'Show Rendered'}
              </button>
            )}
          </div>
        </div>
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onTabClick={setActiveTabId}
          onTabClose={closeTab}
        />
        <div className="content">
          {renderViewer()}
        </div>
      </div>

      {/* New File Modal */}
      {
        showNewFileModal && (
          <div className="modal-overlay" onClick={() => setShowNewFileModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Create New File</h2>
              <p>Select file type:</p>
              <div className="file-type-grid">
                <button className="file-type-button" onClick={() => handleNewFile('markdown')}>
                  <span className="file-type-icon">📝</span>
                  <span className="file-type-name">Markdown</span>
                  <span className="file-type-ext">.md</span>
                </button>
                <button className="file-type-button" onClick={() => handleNewFile('html')}>
                  <span className="file-type-icon">🌐</span>
                  <span className="file-type-name">HTML</span>
                  <span className="file-type-ext">.html</span>
                </button>
                <button className="file-type-button" onClick={() => handleNewFile('json')}>
                  <span className="file-type-icon">📋</span>
                  <span className="file-type-name">JSON</span>
                  <span className="file-type-ext">.json</span>
                </button>
                <button className="file-type-button" onClick={() => handleNewFile('javascript')}>
                  <span className="file-type-icon">⚡</span>
                  <span className="file-type-name">JavaScript</span>
                  <span className="file-type-ext">.js</span>
                </button>
                <button className="file-type-button" onClick={() => handleNewFile('typescript')}>
                  <span className="file-type-icon">💠</span>
                  <span className="file-type-name">TypeScript</span>
                  <span className="file-type-ext">.ts</span>
                </button>
                <button className="file-type-button" onClick={() => handleNewFile('css')}>
                  <span className="file-type-icon">🎨</span>
                  <span className="file-type-name">CSS</span>
                  <span className="file-type-ext">.css</span>
                </button>
                <button className="file-type-button" onClick={() => handleNewFile('python')}>
                  <span className="file-type-icon">🐍</span>
                  <span className="file-type-name">Python</span>
                  <span className="file-type-ext">.py</span>
                </button>
                <button className="file-type-button" onClick={() => handleNewFile('text')}>
                  <span className="file-type-icon">📄</span>
                  <span className="file-type-name">Text</span>
                  <span className="file-type-ext">.txt</span>
                </button>
              </div>
              <button className="modal-close-button" onClick={() => setShowNewFileModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        )
      }
    </div >
  );
}

export default App;
