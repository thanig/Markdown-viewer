import { MouseEvent, useState, useEffect, useRef } from 'react';
import { FileTab } from '../../types';
import { getFileIcon, XIcon } from '../Icons/Icons';
import './TabBar.css';

interface TabBarProps {
  tabs: FileTab[];
  activeTabId: string | null;
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
  onCloseOtherTabs?: (id: string) => void;
  onCloseAllTabs?: () => void;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  tabId: string;
  tabPath: string;
}

export const TabBar = ({ tabs, activeTabId, onTabClick, onTabClose, onCloseOtherTabs, onCloseAllTabs }: TabBarProps) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleClose = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    onTabClose(id);
  };

  const handleMiddleClick = (e: React.MouseEvent, id: string) => {
    if (e.button === 1) {
      e.preventDefault();
      onTabClose(id);
    }
  };

  const handleContextMenu = (e: MouseEvent, tab: FileTab) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      tabId: tab.id,
      tabPath: tab.path,
    });
  };

  const closeContextMenu = () => setContextMenu(null);

  const handleCopyPath = () => {
    if (contextMenu) {
      navigator.clipboard.writeText(contextMenu.tabPath);
    }
    closeContextMenu();
  };

  // Close context menu on click outside
  useEffect(() => {
    if (!contextMenu) return;
    const handler = (e: Event) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [contextMenu]);

  return (
    <div className="tab-bar">
      {tabs.map(tab => (
        <div
          key={tab.id}
          className={`tab ${tab.id === activeTabId ? 'active' : ''}`}
          onClick={() => onTabClick(tab.id)}
          onAuxClick={(e) => handleMiddleClick(e, tab.id)}
          onContextMenu={(e) => handleContextMenu(e, tab)}
        >
          <span className="tab-icon">
            {getFileIcon(tab.name)}
          </span>
          <span className="tab-name">{tab.name}</span>
          {tab.isDirty && <span className="dirty-indicator" />}
          <button
            className="tab-close"
            onClick={(e) => handleClose(e, tab.id)}
            aria-label="Close tab"
          >
            <XIcon size={14} />
          </button>
        </div>
      ))}

      {contextMenu && (
        <div
          ref={menuRef}
          className="tab-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button onClick={() => { onTabClose(contextMenu.tabId); closeContextMenu(); }}>
            Close
          </button>
          {onCloseOtherTabs && (
            <button onClick={() => { onCloseOtherTabs(contextMenu.tabId); closeContextMenu(); }}>
              Close Others
            </button>
          )}
          {onCloseAllTabs && (
            <button onClick={() => { onCloseAllTabs(); closeContextMenu(); }}>
              Close All
            </button>
          )}
          <div className="context-menu-separator" />
          <button onClick={handleCopyPath}>
            Copy Path
          </button>
        </div>
      )}
    </div>
  );
};
