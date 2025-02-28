import React, { useState } from 'react';
import { 
  SaveOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  UndoOutlined,
  RedoOutlined,
  FullscreenOutlined,
  TableOutlined,
  BranchesOutlined,
  ExportOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import './DiagramDesign.css';

const DiagramDesign: React.FC = () => {
  const [zoom, setZoom] = useState(100);
  
  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 10, 200));
  };
  
  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 10, 50));
  };
  
  return (
    <div className="diagram-design-page">
      <div className="diagram-header">
        <div className="diagram-info">
          <h2>示例关系图</h2>
          <span className="diagram-meta">
            包含 0 个实体 | 0 个关系
          </span>
        </div>
        
        <div className="diagram-tools">
          <div className="tool-group">
            <button title="撤销">
              <UndoOutlined />
            </button>
            <button title="重做">
              <RedoOutlined />
            </button>
          </div>
          
          <div className="tool-group">
            <button title="缩小" onClick={handleZoomOut}>
              <ZoomOutOutlined />
            </button>
            <span className="zoom-value">{zoom}%</span>
            <button title="放大" onClick={handleZoomIn}>
              <ZoomInOutlined />
            </button>
          </div>
          
          <div className="tool-group">
            <button title="全屏">
              <FullscreenOutlined />
            </button>
            <button title="导出">
              <ExportOutlined />
            </button>
            <button title="保存" className="save-btn">
              <SaveOutlined />
            </button>
          </div>
        </div>
      </div>
      
      <div className="diagram-workspace">
        <div className="sidebar-tools">
          <div className="tool-section">
            <h3>对象</h3>
            <button className="tool-btn">
              <TableOutlined /> 数据表
            </button>
            <button className="tool-btn">
              <BranchesOutlined /> 关系线
            </button>
          </div>
          
          <div className="tool-section">
            <h3>选择</h3>
            <div className="entity-list-container">
              <p className="empty-message">暂无实体</p>
            </div>
          </div>
        </div>
        
        <div className="canvas-container">
          <div 
            className="diagram-canvas" 
            style={{ transform: `scale(${zoom / 100})` }}
          >
            <div className="canvas-placeholder">
              <img 
                src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTYgMkgxMi4wMUMxMS4zNCAyIDEwLjY5IDIuMjYgMTAuMjEgMi43M0wzLjczIDkuMjJDMy4yNiA5LjY5IDMgMTAuMzQgMyAxMS4wMVYxOUMzIDIwLjEgMy45IDIxIDUgMjFIMTlDMjAuMSAyMSAyMSAyMC4xIDIxIDE5VjdDMjEgNC4yNCAxOC43NiAyIDE2IDJaTTE1IDExSDE1Ljk5VjEzSDEzVjE4TDkgMTRIMTJWOUwxNSAxM1YxMVoiIGZpbGw9IiNjY2NjY2MiLz48L3N2Zz4=" 
                alt="Placeholder" 
              />
              <p>从左侧工具栏中选择元素，或从实体列表中拖拽实体到画布</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagramDesign; 