import { FileTab } from '../../types';
import './TabBar.css';

interface TabBarProps {
  tabs: FileTab[];
  activeTabId: string | null;
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ tabs, activeTabId, onTabClick, onTabClose }) => {
  const handleClose = (e: React.MouseEvent, id: string) => {
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
          <span className="tab-name">
            {tab.name}
            {tab.isDirty && <span className="dirty-indicator">•</span>}
          </span>
          <button
            className="tab-close"
            onClick={(e) => handleClose(e, tab.id)}
            aria-label="Close tab"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};
