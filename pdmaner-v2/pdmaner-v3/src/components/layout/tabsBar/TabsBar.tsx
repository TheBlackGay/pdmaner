import React from 'react';
import './TabsBar.css';

interface Tab {
  id: string;
  title: string;
  type: string;
  icon: React.ReactNode;
}

interface TabsBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabClick: (type: string) => void;
  onCloseTab: (id: string, e: React.MouseEvent) => void;
}

const TabsBar: React.FC<TabsBarProps> = ({
  tabs,
  activeTab,
  onTabClick,
  onCloseTab
}) => {
  return (
    <div className="tabs-bar">
      {tabs.map(tab => (
        <div
          key={tab.id}
          className={`tab ${tab.type === activeTab ? 'active' : ''}`}
          onClick={() => onTabClick(tab.type)}
        >
          {React.isValidElement(tab.icon) ? tab.icon : null}
          <span>{tab.title}</span>
          <button className="close-tab" onClick={(e) => onCloseTab(tab.id, e)}>×</button>
        </div>
      ))}
    </div>
  );
};

export default TabsBar; 