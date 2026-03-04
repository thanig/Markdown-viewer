import { useCallback, useRef } from 'react';
import { readTextFile } from '@tauri-apps/api/fs';
import { FileTab } from '../types';

interface SessionData {
  tabs: Array<{
    path: string;
    name: string;
    language: string;
  }>;
  sidebarVisible: boolean;
  sidebarWidth: number;
  folderPath: string | null;
}

const STORAGE_KEY = 'markdown-viewer-session';

function getLanguageViewMode(language: string): 'rendered' | 'raw' {
  return (language === 'markdown' || language === 'html') ? 'rendered' : 'raw';
}

export const useSessionPersistence = () => {
  const hasRestoredRef = useRef(false);

  const saveSession = useCallback((
    tabs: FileTab[],
    sidebarVisible: boolean,
    sidebarWidth: number,
    folderPath: string | null,
  ) => {
    const session: SessionData = {
      tabs: tabs
        .filter(t => !t.path.startsWith('untitled://'))
        .map(t => ({ path: t.path, name: t.name, language: t.language })),
      sidebarVisible,
      sidebarWidth,
      folderPath,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }, []);

  const restoreSession = useCallback(async (): Promise<{
    tabs: FileTab[];
    sidebarVisible: boolean;
    sidebarWidth: number;
    folderPath: string | null;
  } | null> => {
    if (hasRestoredRef.current) return null;
    hasRestoredRef.current = true;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const session: SessionData = JSON.parse(stored);
      const restoredTabs: FileTab[] = [];

      for (const tabInfo of session.tabs) {
        try {
          const content = await readTextFile(tabInfo.path);
          restoredTabs.push({
            id: `${tabInfo.path}-${Date.now()}-${Math.random()}`,
            path: tabInfo.path,
            name: tabInfo.name,
            content,
            isDirty: false,
            language: tabInfo.language,
            viewMode: getLanguageViewMode(tabInfo.language),
          });
        } catch {
          // File no longer exists, skip it
        }
      }

      return {
        tabs: restoredTabs,
        sidebarVisible: session.sidebarVisible,
        sidebarWidth: session.sidebarWidth,
        folderPath: session.folderPath,
      };
    } catch {
      return null;
    }
  }, []);

  return { saveSession, restoreSession };
};
