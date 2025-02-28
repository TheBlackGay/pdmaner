import React from 'react';
import './StatusBar.css';

interface StatusBarProps {
  projectStatus: string;
  autoSaveEnabled: boolean;
  defaultDb?: string;
  version: string;
}

const StatusBar: React.FC<StatusBarProps> = ({
  projectStatus,
  autoSaveEnabled,
  defaultDb = 'MySQL',
  version = 'v5.0.0'
}) => {
  return (
    <footer className="status-bar">
      <div className="status-message">
        {projectStatus}
        {autoSaveEnabled && <span className="auto-save-status"> (自动保存已开启)</span>}
      </div>
      <div className="status-info">
        <span>版本: {version}</span>
        <span>|</span>
        <span>目标数据库: {defaultDb}</span>
        <span>|</span>
        <span>内存使用: 124MB</span>
      </div>
    </footer>
  );
};

export default StatusBar; 