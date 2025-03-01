import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@store/index';
import { setCurrentProject } from '@store/slices/appSlice';
import { useNotificationContext } from '../contexts/NotificationContext';
import DiagramEditor, { DiagramEditorRef } from '../components/diagram/DiagramEditor';
import DiagramToolbar from '../components/diagram/DiagramToolbar';
import { Diagram } from '../models/diagram';
import { Graph } from '@antv/x6';
import './DiagramDesign.css';

interface DiagramDesignProps {}

const DiagramDesign: React.FC<DiagramDesignProps> = () => {
  // 获取URL参数
  const { diagramId } = useParams<{ diagramId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // 从Redux获取当前项目
  const currentProject = useSelector((state: RootState) => state.app.currentProject);
  const { success, error } = useNotificationContext();
  
  // 状态
  const [isLoading, setIsLoading] = useState(true);
  const [currentDiagram, setCurrentDiagram] = useState<Diagram | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [canCopy, setCanCopy] = useState(false);
  const [canCut, setCanCut] = useState(false);
  const [canPaste, setCanPaste] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  
  // 引用
  const editorRef = useRef<DiagramEditorRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Graph | null>(null);
  
  // 在组件加载时获取关系图数据
  useEffect(() => {
    if (!currentProject || !diagramId) {
      error('无法加载关系图，请检查项目和关系图ID');
      navigate('/app');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // 查找当前图表
      const diagram = currentProject.diagrams?.find(d => d.id === diagramId);
      
      if (!diagram) {
        error('找不到指定的关系图');
        navigate('/app/diagram');
        return;
      }
      
      setCurrentDiagram(diagram);
      setIsLoading(false);
    } catch (err) {
      console.error('加载关系图失败:', err);
      error('加载关系图失败');
      navigate('/app/diagram');
    }
  }, [currentProject, diagramId, navigate]);
  
  // 处理全屏切换
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };
  
  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // 处理保存
  const handleSave = () => {
    if (editorRef.current) {
      editorRef.current.saveCanvasData();
      success('关系图已保存');
    }
  };
  
  // 处理缩放
  const handleZoomIn = () => {
    if (graphRef.current) {
      const zoom = graphRef.current.zoom();
      graphRef.current.zoom(zoom + 0.1);
    }
  };
  
  const handleZoomOut = () => {
    if (graphRef.current) {
      const zoom = graphRef.current.zoom();
      graphRef.current.zoom(Math.max(0.1, zoom - 0.1));
    }
  };
  
  // 处理撤销/重做
  const handleUndo = () => {
    if (graphRef.current) {
      graphRef.current.undo();
      updateHistoryState();
    }
  };
  
  const handleRedo = () => {
    if (graphRef.current) {
      graphRef.current.redo();
      updateHistoryState();
    }
  };
  
  // 更新历史状态
  const updateHistoryState = () => {
    if (graphRef.current) {
      setCanUndo(graphRef.current.canUndo());
      setCanRedo(graphRef.current.canRedo());
    }
  };
  
  // 处理添加表
  const handleAddTable = () => {
    if (!currentProject) return;
    
    // 获取可用的表
    const tables = currentProject.tables || [];
    
    if (tables.length === 0) {
      error('没有可用的表，请先创建表');
      return;
    }
    
    // 这里应该显示一个表选择对话框
    // 暂时简化为添加第一个表
    if (editorRef.current) {
      const position = { x: 100, y: 100 };
      editorRef.current.addTable(tables[0], position);
      success('已添加表');
    }
  };
  
  // 处理添加关联
  const handleAddAssociation = () => {
    // 这里应该显示一个关联创建对话框
    // 暂时简化为提示用户
    error('请使用鼠标连接两个表创建关联');
  };
  
  // 处理自动布局
  const handleAutoLayout = () => {
    if (editorRef.current) {
      editorRef.current.autoLayout();
    }
  };
  
  // 处理删除
  const handleDelete = () => {
    if (graphRef.current) {
      const cells = graphRef.current.getSelectedCells();
      if (cells.length > 0) {
        graphRef.current.removeCells(cells);
        updateSelectionState();
      }
    }
  };
  
  // 处理复制
  const handleCopy = () => {
    if (graphRef.current) {
      graphRef.current.copy(graphRef.current.getSelectedCells());
      setCanPaste(true);
    }
  };
  
  // 处理剪切
  const handleCut = () => {
    if (graphRef.current) {
      graphRef.current.cut(graphRef.current.getSelectedCells());
      setCanPaste(true);
      updateSelectionState();
    }
  };
  
  // 处理粘贴
  const handlePaste = () => {
    if (graphRef.current) {
      graphRef.current.paste();
      updateSelectionState();
    }
  };
  
  // 更新选择状态
  const updateSelectionState = () => {
    if (graphRef.current) {
      const hasSelection = graphRef.current.getSelectedCells().length > 0;
      setCanCopy(hasSelection);
      setCanCut(hasSelection);
      setCanDelete(hasSelection);
    }
  };
  
  // 处理导出PNG
  const handleExportPNG = () => {
    if (editorRef.current) {
      editorRef.current.exportAsPNG();
    }
  };
  
  // 处理导出SVG
  const handleExportSVG = () => {
    if (editorRef.current) {
      editorRef.current.exportAsSVG();
    }
  };
  
  // 重置视图
  const handleResetView = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit();
      graphRef.current.centerContent();
    }
  };
  
  // 设置图表引用
  const setGraphRef = (graph: Graph) => {
    graphRef.current = graph;
    
    // 设置事件监听
    graph.on('selection:changed', updateSelectionState);
    graph.on('history:change', updateHistoryState);
    
    // 初始化状态
    updateHistoryState();
    updateSelectionState();
  };
  
  return (
    <div className="diagram-design-page" ref={containerRef}>
      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">加载关系图...</div>
        </div>
      ) : (
        <>
          <DiagramToolbar
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onSave={handleSave}
            onExportPNG={handleExportPNG}
            onExportSVG={handleExportSVG}
            onAddTable={handleAddTable}
            onAddAssociation={handleAddAssociation}
            onAutoLayout={handleAutoLayout}
            onDelete={handleDelete}
            onCopy={handleCopy}
            onCut={handleCut}
            onPaste={handlePaste}
            onToggleFullscreen={handleToggleFullscreen}
            onResetView={handleResetView}
            isFullscreen={isFullscreen}
            canUndo={canUndo}
            canRedo={canRedo}
            canCopy={canCopy}
            canCut={canCut}
            canPaste={canPaste}
            canDelete={canDelete}
          />
          
          <div className="diagram-container">
            {diagramId && (
              <DiagramEditor
                ref={editorRef}
                diagramId={diagramId}
                onSave={(diagram) => {
                  setCurrentDiagram(diagram);
                }}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DiagramDesign; 