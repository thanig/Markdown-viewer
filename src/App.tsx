import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useTabs } from './hooks/useTabs';
import { useFile, isUntitledPath } from './hooks/useFile';
import { TabBar } from './components/TabBar/TabBar';
import { FileTree } from './components/FileTree/FileTree';
import { MarkdownViewer } from './components/Viewers/MarkdownViewer';
import { JsonViewer } from './components/Viewers/JsonViewer';
import { HtmlViewer } from './components/Viewers/HtmlViewer';
import { CodeEditor, MonacoAction } from './components/Viewers/CodeEditor';
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
    updateTabPathAndName,
    getActiveTab,
  } = useTabs();

  const { openFile, openFilePath, saveFile, createUntitledFile, saveUntitledFile } = useFile();
  const untitledCounter = useRef(1);

  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [folderPath, setFolderPath] = useState<string | null>(null);
  const activeTab = getActiveTab();

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
    }
  }, [openFile, addTab]);

  const handleSaveFile = useCallback(async () => {
    if (!activeTab) return;

    // Check if this is an untitled file
    if (isUntitledPath(activeTab.path)) {
      // Get file type from language
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
      const fileType = fileTypeMap[activeTab.language] || 'text';

      const result = await saveUntitledFile(activeTab.content, fileType);
      if (result) {
        updateTabPathAndName(activeTab.id, result.path, result.name, result.language);
      }
    } else {
      const success = await saveFile(activeTab.path, activeTab.content);
      if (success) {
        markTabSaved(activeTab.id);
      }
    }
  }, [activeTab, saveFile, saveUntitledFile, markTabSaved, updateTabPathAndName]);

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
    // Check if file is already open
    const existingTab = tabs.find(tab => tab.path === path);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }

    const file = await openFilePath(path);
    if (file) {
      addTab(file.path, file.name, file.content, file.language);
    }
  }, [tabs, openFilePath, addTab, setActiveTabId]);

  const handleToggleSidebar = useCallback(() => {
    setSidebarVisible(prev => !prev);
  }, []);

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
  }, [activeTab, activeTabId, handleOpenFile, handleSaveFile, handleToggleViewMode, closeTab]);

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

      // Cmd+B or Ctrl+B - Toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        handleToggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, activeTab, handleOpenFile, handleSaveFile, handleToggleSidebar]);

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
        />
      </div>
    );
  };

  return (
    <div className="app">
      <div className="header">
        <div className="menu-bar">
          <button onClick={handleToggleSidebar} className="menu-button" title="Toggle Sidebar (Cmd+B)">
            {sidebarVisible ? '◀' : '▶'}
          </button>
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
        </div>
      </div>
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
            onTabClose={closeTab}
          />
          <div className="content">
            {renderViewer()}
          </div>
        </div>
      </div>

      {/* New File Modal */}
      {showNewFileModal && (
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
      )}
    </div>
  );
}

export default App;
