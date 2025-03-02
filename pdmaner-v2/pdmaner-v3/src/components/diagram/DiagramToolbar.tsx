import React from 'react';
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  UndoOutlined,
  RedoOutlined,
  SaveOutlined,
  ExportOutlined,
  TableOutlined,
  NodeIndexOutlined,
  LayoutOutlined,
  DeleteOutlined,
  CopyOutlined,
  ScissorOutlined,
  SnippetsOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  ReloadOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  AppstoreOutlined,
  RadarChartOutlined,
  ApartmentOutlined,
  DotChartOutlined
} from '@ant-design/icons';
import './DiagramToolbar.css';

interface DiagramToolbarProps {
  onToggleFullscreen: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onExportPNG: () => void;
  onExportSVG: () => void;
  onAutoLayout: (layoutType?: string) => void;
  onDelete: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onToggleSidebar: () => void;
  isFullscreen: boolean;
  showSidebar: boolean;
  canUndo: boolean;
  canRedo: boolean;
  canCopy: boolean;
  canCut: boolean;
  canPaste: boolean;
  canDelete: boolean;
}

const DiagramToolbar: React.FC<DiagramToolbarProps> = ({
  onToggleFullscreen,
  onUndo,
  onRedo,
  onSave,
  onExportPNG,
  onExportSVG,
  onAutoLayout,
  onDelete,
  onCopy,
  onCut,
  onPaste,
  onToggleSidebar,
  isFullscreen,
  showSidebar,
  canUndo,
  canRedo,
  canCopy,
  canCut,
  canPaste,
  canDelete
}) => {
  return (
    <div className="diagram-toolbar">
      <div className="toolbar-group">
        <button
          className="toolbar-button"
          onClick={onToggleSidebar}
          title={showSidebar ? "隐藏侧边栏" : "显示侧边栏"}
        >
          {showSidebar ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
        </button>
        
        <div className="toolbar-divider"></div>
        
        <button
          className="toolbar-button"
          onClick={onSave}
          title="保存"
        >
          <SaveOutlined />
        </button>
        
        <div className="toolbar-divider"></div>
        
        <button
          className="toolbar-button"
          onClick={onUndo}
          disabled={!canUndo}
          title="撤销"
        >
          <UndoOutlined />
        </button>
        
        <button
          className="toolbar-button"
          onClick={onRedo}
          disabled={!canRedo}
          title="重做"
        >
          <RedoOutlined />
        </button>
        
        <div className="toolbar-divider"></div>
        
        <button
          className="toolbar-button"
          onClick={onCopy}
          disabled={!canCopy}
          title="复制"
        >
          <CopyOutlined />
        </button>
        
        <button
          className="toolbar-button"
          onClick={onCut}
          disabled={!canCut}
          title="剪切"
        >
          <ScissorOutlined />
        </button>
        
        <button
          className="toolbar-button"
          onClick={onPaste}
          disabled={!canPaste}
          title="粘贴"
        >
          <SnippetsOutlined />
        </button>
        
        <button
          className="toolbar-button"
          onClick={onDelete}
          disabled={!canDelete}
          title="删除"
        >
          <DeleteOutlined />
        </button>
        
        <div className="toolbar-divider"></div>
        
        <div className="toolbar-dropdown">
          <button
            className="toolbar-button"
            title="自动布局"
            onClick={() => onAutoLayout('grid')}
          >
            <LayoutOutlined />
          </button>
          <div className="toolbar-dropdown-content">
            <button
              className="dropdown-item"
              onClick={() => onAutoLayout('grid')}
            >
              <AppstoreOutlined /> 网格布局
            </button>
            <button
              className="dropdown-item"
              onClick={() => onAutoLayout('circle')}
            >
              <RadarChartOutlined /> 环形布局
            </button>
            <button
              className="dropdown-item"
              onClick={() => onAutoLayout('tree')}
            >
              <ApartmentOutlined /> 树形布局
            </button>
            <button
              className="dropdown-item"
              onClick={() => onAutoLayout('force')}
            >
              <DotChartOutlined /> 力导向布局
            </button>
          </div>
        </div>
        
        <div className="toolbar-divider"></div>
        
        <div className="toolbar-dropdown">
          <button
            className="toolbar-button"
            title="导出"
          >
            <ExportOutlined />
          </button>
          <div className="toolbar-dropdown-content">
            <button
              className="dropdown-item"
              onClick={onExportPNG}
            >
              导出为PNG
            </button>
            <button
              className="dropdown-item"
              onClick={onExportSVG}
            >
              导出为SVG
            </button>
          </div>
        </div>
        
        <div className="toolbar-divider"></div>
        
        <button
          className="toolbar-button"
          onClick={onToggleFullscreen}
          title={isFullscreen ? "退出全屏" : "全屏"}
        >
          {isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
        </button>
      </div>
    </div>
  );
};

export default DiagramToolbar; 