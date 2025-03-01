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
  ReloadOutlined
} from '@ant-design/icons';
import './DiagramToolbar.css';

interface DiagramToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onExportPNG: () => void;
  onExportSVG: () => void;
  onAddTable: () => void;
  onAddAssociation: () => void;
  onAutoLayout: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onToggleFullscreen: () => void;
  onResetView: () => void;
  isFullscreen: boolean;
  canUndo: boolean;
  canRedo: boolean;
  canCopy: boolean;
  canCut: boolean;
  canPaste: boolean;
  canDelete: boolean;
}

const DiagramToolbar: React.FC<DiagramToolbarProps> = ({
  onZoomIn,
  onZoomOut,
  onUndo,
  onRedo,
  onSave,
  onExportPNG,
  onExportSVG,
  onAddTable,
  onAddAssociation,
  onAutoLayout,
  onDelete,
  onCopy,
  onCut,
  onPaste,
  onToggleFullscreen,
  onResetView,
  isFullscreen,
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
          onClick={onZoomIn}
          title="放大"
        >
          <ZoomInOutlined />
        </button>
        <button
          className="toolbar-button"
          onClick={onZoomOut}
          title="缩小"
        >
          <ZoomOutOutlined />
        </button>
        <button
          className="toolbar-button"
          onClick={onResetView}
          title="重置视图"
        >
          <ReloadOutlined />
        </button>
      </div>

      <div className="toolbar-group">
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
      </div>

      <div className="toolbar-group">
        <button
          className="toolbar-button"
          onClick={onAddTable}
          title="添加表"
        >
          <TableOutlined />
        </button>
        <button
          className="toolbar-button"
          onClick={onAddAssociation}
          title="添加关联"
        >
          <NodeIndexOutlined />
        </button>
        <button
          className="toolbar-button"
          onClick={onAutoLayout}
          title="自动布局"
        >
          <LayoutOutlined />
        </button>
      </div>

      <div className="toolbar-group">
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
      </div>

      <div className="toolbar-group">
        <button
          className="toolbar-button"
          onClick={onSave}
          title="保存"
        >
          <SaveOutlined />
        </button>
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