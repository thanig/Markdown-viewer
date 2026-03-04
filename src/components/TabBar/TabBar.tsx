import { MouseEvent } from 'react';
import { FileTab } from '../../types';
import { getFileIcon, XIcon } from '../Icons/Icons';
import './TabBar.css';

interface TabBarProps {
  tabs: FileTab[];
  activeTabId: string | null;
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
}

export const TabBar = ({ tabs, activeTabId, onTabClick, onTabClose }: TabBarProps) => {
  const handleClose = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    onTabClose(id);
  };

  return (
    <div className="tab-bar">
      {tabs.map(tab => (
        <div
          key={tab.id}
          className={`tab ${tab.id === activeTabId ? 'active' : ''}`}
          onClick={() => onTabClick(tab.id)}
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
    </div>
  );
};
