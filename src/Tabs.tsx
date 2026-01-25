import { useState } from 'react';
import './Tabs.css';

interface Tab {
  id: string;
  label: string;
  icon?: string;
}

interface TabsProps {
  tabs: Tab[];
  children: React.ReactNode[];
}

export default function Tabs({ tabs, children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || '');

  return (
    <div className="tabs-container">
      <div className="tabs-header">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon && <span className="tab-icon">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tabs-content">
        {children.map((child, index) => (
          <div
            key={tabs[index]?.id}
            className={`tab-panel ${activeTab === tabs[index]?.id ? 'active' : ''}`}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
