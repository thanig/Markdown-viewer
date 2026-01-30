import React, { useEffect } from 'react';
import { useTabs } from './hooks/useTabs';
import { useFile } from './hooks/useFile';
import { TabBar } from './components/TabBar/TabBar';
import { MarkdownViewer } from './components/Viewers/MarkdownViewer';
import { JsonViewer } from './components/Viewers/JsonViewer';
import { CodeEditor } from './components/Viewers/CodeEditor';
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

  const { openFile, saveFile } = useFile();

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
          onToggleMode={handleToggleViewMode}
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

  return (
    <div className="app">
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
  );
}

export default App;
