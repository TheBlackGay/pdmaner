import React from 'react';
import {
  SaveOutlined,
  ImportOutlined,
  ExportOutlined,
  CopyOutlined,
  DeleteOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  QuestionCircleOutlined,
  SearchOutlined
} from '@ant-design/icons';
import './MainToolbar.css';

interface MainToolbarProps {
  onSaveProject: () => void;
  onToggleAutoSave: () => void;
  onToggleDarkMode: () => void;
  autoSaveEnabled: boolean;
  darkMode: boolean;
  onOpenSqlImport?: () => void;
}

const MainToolbar: React.FC<MainToolbarProps> = ({
  onSaveProject,
  onToggleAutoSave,
  onToggleDarkMode,
  autoSaveEnabled,
  darkMode,
  onOpenSqlImport
}) => {
  return (
    <div className="main-toolbar">
      <div className="toolbar-group">
        <button title="保存项目" onClick={onSaveProject}><SaveOutlined /></button>
        <button title="导入"><ImportOutlined /></button>
        <button title="导出"><ExportOutlined /></button>
        <button 
          title="导入SQL为表" 
          onClick={onOpenSqlImport}
          className={onOpenSqlImport ? "action-highlight" : "disabled"}
        >
          <span className="sql-import-icon">SQL</span>
        </button>
      </div>
      <div className="toolbar-group">
        <button title="撤销"><span>↩</span></button>
        <button title="重做"><span>↪</span></button>
        <button title="复制"><CopyOutlined /></button>
        <button title="删除"><DeleteOutlined /></button>
      </div>
      <div className="toolbar-group">
        <button title="全局搜索"><SearchOutlined /></button>
        <button title="设置"><SettingOutlined /></button>
        <button title={`自动保存: ${autoSaveEnabled ? '已开启' : '已关闭'}`} onClick={onToggleAutoSave}>
          {autoSaveEnabled ? <CheckCircleOutlined /> : <SyncOutlined />}
        </button>
        <button title="帮助"><QuestionCircleOutlined /></button>
        <button title="切换暗黑模式" onClick={onToggleDarkMode}>
          {darkMode ? '🌞' : '🌙'}
        </button>
      </div>
    </div>
  );
};

export default MainToolbar; 