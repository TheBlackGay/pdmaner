import React from 'react';
import { ArrowLeftOutlined, FullscreenOutlined } from '@ant-design/icons';
import './Header.css';

interface HeaderProps {
  projectName: string;
  onBackToWelcome: () => void;
  onMaximize: () => void;
  onCloseProject: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  projectName,
  onBackToWelcome,
  onMaximize,
  onCloseProject
}) => {
  return (
    <header className="title-bar">
      <button className="back-btn" title="返回欢迎页面" onClick={onBackToWelcome}>
        <ArrowLeftOutlined />
      </button>
      <div className="app-title">PDManer</div>
      <div className="project-title">
        {projectName || '未打开项目'}
      </div>
      <div className="window-controls">
        <button title="最大化" onClick={onMaximize}><FullscreenOutlined /></button>
        <button title="关闭项目" onClick={onCloseProject}>✕</button>
      </div>
    </header>
  );
};

export default Header; 