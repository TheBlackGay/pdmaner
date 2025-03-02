import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@store/index';
import { setCurrentProject } from '@store/slices/appSlice';
import { useNotificationContext } from '../contexts/NotificationContext';
import DiagramEditor, { DiagramEditorRef } from '../components/diagram/DiagramEditor';
import DiagramToolbar from '../components/diagram/DiagramToolbar';
import TableSidebar from '../components/diagram/TableSidebar';
import { Diagram } from '../models/diagram';
import { Entity } from '../models/entity';
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
  const [showSidebar, setShowSidebar] = useState(true);

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

      // 设置当前关系图
      setCurrentDiagram(diagram);
      setIsLoading(false);
    } catch (err) {
      console.error('加载关系图时出错:', err);
      error('加载关系图时出错');
      setIsLoading(false);
    }
  }, [currentProject, diagramId, navigate, error]);

  // 保存关系图
  const handleSave = (updatedDiagram: Diagram) => {
    if (!currentProject) return;

    try {
      // 更新项目中的关系图
      const updatedDiagrams = currentProject.diagrams?.map(d =>
        d.id === updatedDiagram.id ? updatedDiagram : d
      ) || [];

      // 更新Redux中的项目数据
      dispatch(setCurrentProject({
        ...currentProject,
        diagrams: updatedDiagrams
      }));

      // success('关系图已保存');
    } catch (err) {
      console.error('保存关系图时出错:', err);
      error('保存关系图失败');
    }
  };

  // 处理添加表
  const handleAddTable = (entity: Entity, position: { x: number, y: number }) => {
    if (!editorRef.current) return;

    // 使用DiagramEditor的addTable方法添加表
    const node = editorRef.current.addTable(entity, position);

    if (node && currentDiagram) {
      // 如果添加成功，更新关系图的entityIds列表
      const updatedEntityIds = [...(currentDiagram.entityIds || [])];
      if (!updatedEntityIds.includes(entity.id)) {
        updatedEntityIds.push(entity.id);
      }

      const updatedDiagram = {
        ...currentDiagram,
        entityIds: updatedEntityIds,
      };

      setCurrentDiagram(updatedDiagram);
      editorRef.current.saveCanvasData();
    }
  };

  // 切换侧边栏显示状态
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  return (
    <div className="diagram-design-page" ref={containerRef}>
      <DiagramToolbar
        canUndo={canUndo}
        canRedo={canRedo}
        canCopy={canCopy}
        canCut={canCut}
        canPaste={canPaste}
        canDelete={canDelete}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        onUndo={() => {
          if (editorRef.current?.graph) {
            try {
              // @ts-ignore - X6的类型定义可能不完整
              editorRef.current.graph.history.undo();
            } catch (err) {
              console.error('撤销操作失败:', err);
            }
          }
        }}
        onRedo={() => {
          if (editorRef.current?.graph) {
            try {
              // @ts-ignore - X6的类型定义可能不完整
              editorRef.current.graph.history.redo();
            } catch (err) {
              console.error('重做操作失败:', err);
            }
          }
        }}
        onCopy={() => {
          if (editorRef.current?.graph) {
            try {
              // @ts-ignore - X6的类型定义可能不完整
              editorRef.current.graph.copy(editorRef.current.graph.getSelectedCells());
            } catch (err) {
              console.error('复制操作失败:', err);
            }
          }
        }}
        onCut={() => {
          if (editorRef.current?.graph) {
            try {
              // @ts-ignore - X6的类型定义可能不完整
              editorRef.current.graph.cut(editorRef.current.graph.getSelectedCells());
            } catch (err) {
              console.error('剪切操作失败:', err);
            }
          }
        }}
        onPaste={() => {
          if (editorRef.current?.graph) {
            try {
              // @ts-ignore - X6的类型定义可能不完整
              editorRef.current.graph.paste();
            } catch (err) {
              console.error('粘贴操作失败:', err);
            }
          }
        }}
        onDelete={() => {
          if (editorRef.current?.graph) {
            try {
              // @ts-ignore - X6的类型定义可能不完整
              const cells = editorRef.current.graph.getSelectedCells();
              if (cells.length > 0) {
                editorRef.current.graph.removeCells(cells);
              }
            } catch (err) {
              console.error('删除操作失败:', err);
            }
          }
        }}
        onSave={() => editorRef.current?.saveCanvasData()}
        onAutoLayout={(layoutType) => editorRef.current?.autoLayout(layoutType)}
        onExportPNG={() => editorRef.current?.exportAsPNG()}
        onExportSVG={() => editorRef.current?.exportAsSVG()}
        onToggleSidebar={toggleSidebar}
        showSidebar={showSidebar}
      />

      <div className="diagram-content">
        {showSidebar && diagramId && (
          <TableSidebar
            onAddTable={handleAddTable}
            diagramId={diagramId}
          />
        )}

        <div className="diagram-container">
          {diagramId && (
            <DiagramEditor
              ref={editorRef}
              diagramId={diagramId}
              currentDiagram={currentDiagram || undefined}
              setCurrentDiagram={setCurrentDiagram}
              entities={currentProject?.entities || []}
              onSave={handleSave}
              onChangeHistory={(undo, redo) => {
                setCanUndo(undo);
                setCanRedo(redo);
              }}
              onChangeSelection={(copy, cut, del) => {
                setCanCopy(copy);
                setCanCut(cut);
                setCanDelete(del);
              }}
              onChangePaste={(paste) => setCanPaste(paste)}
            />
          )}
        </div>
      </div>

      {isLoading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">加载关系图...</div>
        </div>
      )}
    </div>
  );
};

export default DiagramDesign;
