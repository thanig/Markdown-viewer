import { useState, useCallback, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import './FileTree.css';

interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
}

interface FileTreeProps {
  onFileSelect: (path: string) => void;
  rootPath: string | null;
  onRootPathChange: (path: string | null) => void;
  width: number;
  onWidthChange: (width: number) => void;
}

interface TreeNodeProps {
  entry: FileEntry;
  onFileSelect: (path: string) => void;
  level: number;
}

const TreeNode = ({ entry, onFileSelect, level }: TreeNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState<FileEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadChildren = useCallback(async () => {
    if (!entry.is_dir || children.length > 0) return;

    setIsLoading(true);
    try {
      const entries = await invoke<FileEntry[]>('read_directory', { path: entry.path });
      setChildren(entries);
    } catch (error) {
      console.error('Failed to load directory:', error);
    } finally {
      setIsLoading(false);
    }
  }, [entry.is_dir, entry.path, children.length]);

  const handleClick = async () => {
    if (entry.is_dir) {
      if (!isExpanded) {
        await loadChildren();
      }
      setIsExpanded(!isExpanded);
    } else {
      onFileSelect(entry.path);
    }
  };

  const getFileIcon = () => {
    if (entry.is_dir) {
      return isExpanded ? '📂' : '📁';
    }

    const ext = entry.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'md':
      case 'markdown':
        return '📝';
      case 'json':
        return '📋';
      case 'html':
      case 'htm':
        return '🌐';
      case 'js':
      case 'jsx':
        return '⚡';
      case 'ts':
      case 'tsx':
        return '💠';
      case 'css':
        return '🎨';
      case 'py':
        return '🐍';
      default:
        return '📄';
    }
  };

  return (
    <div className="tree-node">
      <div
        className={`tree-item ${entry.is_dir ? 'directory' : 'file'}`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
      >
        <span className="tree-icon">{getFileIcon()}</span>
        <span className="tree-name">{entry.name}</span>
        {isLoading && <span className="tree-loading">...</span>}
      </div>
      {isExpanded && children.length > 0 && (
        <div className="tree-children">
          {children.map((child) => (
            <TreeNode
              key={child.path}
              entry={child}
              onFileSelect={onFileSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileTree = ({
  onFileSelect,
  rootPath,
  onRootPathChange,
  width,
  onWidthChange,
}: FileTreeProps) => {
  const [rootEntries, setRootEntries] = useState<FileEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isResizing = useRef(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const loadDirectory = useCallback(async (path: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const entries = await invoke<FileEntry[]>('read_directory', { path });
      setRootEntries(entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load directory');
      setRootEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load directory when rootPath changes
  useEffect(() => {
    if (rootPath) {
      loadDirectory(rootPath);
    } else {
      setRootEntries([]);
    }
  }, [rootPath, loadDirectory]);

  const handleOpenFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });

      if (selected && typeof selected === 'string') {
        onRootPathChange(selected);
      }
    } catch (err) {
      console.error('Failed to open folder:', err);
    }
  };

  const handleCloseFolder = () => {
    onRootPathChange(null);
    setRootEntries([]);
    setError(null);
  };

  // Resize handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;

      const newWidth = Math.min(Math.max(150, e.clientX), 500);
      onWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onWidthChange]);

  const folderName = rootPath?.split('/').pop() || rootPath?.split('\\').pop() || 'Folder';

  return (
    <div className="file-tree" ref={sidebarRef} style={{ width: `${width}px` }}>
      <div className="file-tree-header">
        <span className="file-tree-title">Explorer</span>
        <div className="file-tree-actions">
          <button
            className="file-tree-action"
            onClick={handleOpenFolder}
            title="Open Folder"
          >
            📂
          </button>
          {rootPath && (
            <button
              className="file-tree-action"
              onClick={handleCloseFolder}
              title="Close Folder"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="file-tree-content">
        {isLoading && (
          <div className="file-tree-loading">Loading...</div>
        )}

        {error && (
          <div className="file-tree-error">{error}</div>
        )}

        {!rootPath && !isLoading && (
          <div className="file-tree-empty">
            <p>No folder open</p>
            <button onClick={handleOpenFolder} className="open-folder-button">
              Open Folder
            </button>
          </div>
        )}

        {rootPath && !isLoading && (
          <>
            <div className="file-tree-root">
              <span className="root-icon">📂</span>
              <span className="root-name">{folderName}</span>
            </div>
            <div className="file-tree-entries">
              {rootEntries.map((entry) => (
                <TreeNode
                  key={entry.path}
                  entry={entry}
                  onFileSelect={onFileSelect}
                  level={0}
                />
              ))}
              {rootEntries.length === 0 && (
                <div className="file-tree-empty-folder">Empty folder</div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="resize-handle" onMouseDown={handleMouseDown} />
    </div>
  );
};
