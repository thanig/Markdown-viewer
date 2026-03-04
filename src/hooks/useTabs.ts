import { useState, useCallback } from 'react';
import { FileTab } from '../types';

export const useTabs = () => {
  const [tabs, setTabs] = useState<FileTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const addTab = useCallback((path: string, name: string, content: string, language: string) => {
    const id = `${path}-${Date.now()}`;
    const viewMode = (language === 'markdown' || language === 'html') ? 'rendered' : 'raw';

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

  // Update tab path and name after saving untitled file
  const updateTabPathAndName = useCallback((id: string, path: string, name: string, language?: string) => {
    setTabs(prev =>
      prev.map(tab =>
        tab.id === id ? { ...tab, path, name, isDirty: false, ...(language && { language }) } : tab
      )
    );
  }, []);

  const getActiveTab = useCallback(() => {
    return tabs.find(tab => tab.id === activeTabId) || null;
  }, [tabs, activeTabId]);

  return {
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
  };
};
