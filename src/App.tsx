import { useEffect, useState, useCallback } from 'react';
import { useTabs } from './hooks/useTabs';
import { useFile } from './hooks/useFile';
import { TabBar } from './components/TabBar/TabBar';
import { MarkdownViewer } from './components/Viewers/MarkdownViewer';
import { JsonViewer } from './components/Viewers/JsonViewer';
import { CodeEditor } from './components/Viewers/CodeEditor';
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

  const { openFile, saveFile, openFolder, readDirectory, readFileContent } = useFile();

  const activeTab = getActiveTab();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, activeTab]);

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
            <p>Press <kbd>Cmd+O</kbd> to open a file</p>
            <button onClick={handleOpenFile} className="open-button">
              Open File
            </button>
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
        />
      );
    }

    return (
      <div className="code-viewer">
        <CodeEditor
          content={activeTab.content}
          language={activeTab.language}
          onChange={handleContentChange}
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
    </div>
  );
}

export default App;
