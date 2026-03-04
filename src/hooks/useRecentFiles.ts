import { useState, useCallback, useEffect } from 'react';

interface RecentFile {
  path: string;
  name: string;
  timestamp: number;
}

const STORAGE_KEY = 'markdown-viewer-recent-files';
const MAX_RECENT = 10;

export const useRecentFiles = () => {
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecentFiles(JSON.parse(stored));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const addRecentFile = useCallback((path: string, name: string) => {
    // Don't track untitled files
    if (path.startsWith('untitled://')) return;

    setRecentFiles(prev => {
      const filtered = prev.filter(f => f.path !== path);
      const updated = [{ path, name, timestamp: Date.now() }, ...filtered].slice(0, MAX_RECENT);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearRecentFiles = useCallback(() => {
    setRecentFiles([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { recentFiles, addRecentFile, clearRecentFiles };
};
