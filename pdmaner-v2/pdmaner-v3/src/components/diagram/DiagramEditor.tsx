import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  NodeTypes, 
  ConnectionLineType, 
  Node, 
  Edge, 
  NodeChange, 
  EdgeChange, 
  Connection, 
  useNodesState, 
  useEdgesState, 
  Panel,
  MarkerType,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeResizeControl,
  Handle,
  Position as FlowPosition
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@store/index';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { Diagram, Position } from '../../models/diagram';
import './DiagramEditor.css';

// 定义表格节点组件
const TableNode = ({ data, selected }: any) => {
  // 从data中获取表格数据
  const { 
    tableName = 'Unnamed Table', 
    fields = [],
    comment = '',
    tableType = 'table',
    isMinimized = false
  } = data;

  // 表格类型显示文本
  const tableTypeDisplay = 
    tableType === 'view' ? '视图' : 
    tableType === 'entity' ? '实体' : '表';
    
  // 控制最小化/最大化状态
  const [minimized, setMinimized] = React.useState(isMinimized);
  
  // 处理最小化/最大化按钮点击
  const handleToggleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMinimized(prev => !prev);
    // 更新节点数据
    if (data.updateNodeData) {
      data.updateNodeData({ isMinimized: !minimized });
    }
  };

  return (
    <div className={`er-table-node ${selected ? 'selected' : ''} ${minimized ? 'minimized' : ''}`}>
      {/* 添加连接点(四个方向) */}
      <Handle type="source" position={FlowPosition.Top} id="top" style={{ top: 0, left: '50%' }} />
      <Handle type="source" position={FlowPosition.Right} id="right" style={{ top: '50%', right: 0 }} />
      <Handle type="source" position={FlowPosition.Bottom} id="bottom" style={{ bottom: 0, left: '50%' }} />
      <Handle type="source" position={FlowPosition.Left} id="left" style={{ top: '50%', left: 0 }} />
      
      <div className="er-table-header">
        <div className="er-table-title-area">
          <div className="er-table-title">{tableName}</div>
          <div className="er-table-subtitle">
            <span className="er-table-type">{tableTypeDisplay}</span>
            <span className="er-table-fields-count">字段: {fields.length}</span>
          </div>
        </div>
        <div className="er-table-controls">
          <button 
            className="er-table-minimize-button" 
            onClick={handleToggleMinimize}
            title={minimized ? "最大化" : "最小化"}
          >
            {minimized ? "+" : "-"}
          </button>
        </div>
      </div>
      {!minimized && (
        <>
          <div className="er-table-body">
            {fields.map((field: any, index: number) => {
              // 处理不同的字段数据格式
              const fieldName = field.defName || field.name || field.code || field.defKey || 
                              field.COLUMN_NAME || field.column_name || '未命名';
              const fieldType = field.type || field.dataType || field.TYPE_NAME || 
                              field.data_type || field.defType || 'unknown';
              const isPK = field.primaryKey || field.pk || field.PK || 
                          field.is_primary_key || field.is_pk || false;
              
              return (
                <div key={index} className={`er-table-field ${index > 0 ? 'er-table-field-separator' : ''}`}>
                  <div className={`er-table-field-name ${isPK ? 'er-table-field-pk' : ''}`}>
                    {fieldName}
                    <span className="er-table-field-type">({fieldType})</span>
                  </div>
                  {isPK && <div className="er-table-field-pk-indicator">PK</div>}
                </div>
              );
            })}
          </div>
          {comment && (
            <div className="er-table-footer">
              <div className="er-table-comment">
                {comment.length > 30 ? `${comment.substring(0, 30)}...` : comment}
              </div>
            </div>
          )}
        </>
      )}
      {/* 添加调整大小控件 */}
      <NodeResizeControl minWidth={120} minHeight={50} />
    </div>
  );
};

// 注册自定义节点类型
const nodeTypes: NodeTypes = {
  erTable: TableNode
};

// 导出的接口，用于父组件调用
export interface DiagramEditorRef {
  addTable: (tableData: any, position: { x: number, y: number }) => string | null;
  addAssociation: (sourceId: string, targetId: string, relation?: string) => string | null;
  autoLayout: (layoutType?: string) => void;
  exportAsPNG: () => void;
  exportAsSVG: () => void;
  saveCanvasData: () => void;
}

interface DiagramEditorProps {
  diagramId: string;
  entities?: any[];
  currentDiagram?: Diagram;
  setCurrentDiagram?: (diagram: Diagram) => void;
  onSave?: (diagram: Diagram) => void;
  onChangeHistory?: (canUndo: boolean, canRedo: boolean) => void;
  onChangeSelection?: (canCopy: boolean, canCut: boolean, canDelete: boolean) => void;
  onChangePaste?: (canPaste: boolean) => void;
  style?: React.CSSProperties;
}

// 修改relationshipStyles对象以使用自定义类型
interface RelationshipStyle {
  markerEnd: {
    type: MarkerType;
  };
  style: {
    strokeWidth: number;
    stroke: string;
    strokeDasharray?: string;
  };
  labelStyle: {
    fill: string;
    fontWeight: number;
  };
  labelBgStyle: {
    fill: string;
    strokeWidth: number;
    stroke: string;
    borderRadius: number;
    padding: string;
  };
}

const relationshipStyles: Record<string, RelationshipStyle> = {
  '1:1': {
    markerEnd: {
      type: MarkerType.Arrow,
    },
    style: {
      strokeWidth: 1.5,
      stroke: '#05d9e8',
    },
    labelStyle: {
      fill: '#05d9e8',
      fontWeight: 500,
    },
    labelBgStyle: {
      fill: 'rgba(10, 12, 26, 0.8)',
      strokeWidth: 1,
      stroke: 'rgba(5, 217, 232, 0.3)',
      borderRadius: 3,
      padding: '4px 6px',
    },
  },
  '1:n': {
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
    style: {
      strokeWidth: 1.5,
      stroke: '#05d9e8',
    },
    labelStyle: {
      fill: '#05d9e8',
      fontWeight: 500,
    },
    labelBgStyle: {
      fill: 'rgba(10, 12, 26, 0.8)',
      strokeWidth: 1,
      stroke: 'rgba(5, 217, 232, 0.3)',
      borderRadius: 3,
      padding: '4px 6px',
    },
  },
  'n:m': {
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
    style: {
      strokeWidth: 1.5,
      stroke: '#05d9e8',
      strokeDasharray: '5 5',
    },
    labelStyle: {
      fill: '#05d9e8',
      fontWeight: 500,
    },
    labelBgStyle: {
      fill: 'rgba(10, 12, 26, 0.8)',
      strokeWidth: 1,
      stroke: 'rgba(5, 217, 232, 0.3)',
      borderRadius: 3,
      padding: '4px 6px',
    },
  },
};

// 为了绕过类型检查错误，使用any类型
interface CanvasData {
  [key: string]: any;
}

// 主组件
const DiagramEditor = forwardRef<DiagramEditorRef, DiagramEditorProps>(({ 
  diagramId, 
  entities,
  currentDiagram: propCurrentDiagram,
  setCurrentDiagram: propSetCurrentDiagram,
  onSave,
  style
}, ref) => {
  console.log(`DiagramEditor组件渲染 - diagramId: ${diagramId}`);
  
  // 状态
  const [isLoading, setIsLoading] = useState(true);
  const [internalCurrentDiagram, setInternalCurrentDiagram] = useState<Diagram | null>(propCurrentDiagram || null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [relationshipType, setRelationshipType] = useState<string>('1:n');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<any>(null);

  // 统一的获取和设置当前图表的函数
  const currentDiagram = propCurrentDiagram || internalCurrentDiagram;
  const setCurrentDiagram = (diagram: Diagram) => {
    // 如果有外部提供的setter，优先使用
    if (typeof propSetCurrentDiagram === 'function') {
      propSetCurrentDiagram(diagram);
    }
    // 无论是否有外部setter，都更新内部状态
    setInternalCurrentDiagram(diagram);
  };
  
  const dispatch = useDispatch();
  const currentProject = useSelector((state: RootState) => state.app.currentProject);
  const { success, error } = useNotificationContext();
  
  // 当propCurrentDiagram变化时，更新内部状态
  useEffect(() => {
    if (propCurrentDiagram) {
      setInternalCurrentDiagram(propCurrentDiagram);
    }
  }, [propCurrentDiagram]);

  // 处理节点变化
  const handleNodesChange = (changes: NodeChange[]) => {
    onNodesChange(changes);
    // 延迟保存以避免频繁保存
    setTimeout(() => {
      saveCanvasData();
    }, 500);
  };

  // 处理边变化
  const handleEdgesChange = (changes: EdgeChange[]) => {
    onEdgesChange(changes);
    // 延迟保存以避免频繁保存
    setTimeout(() => {
      saveCanvasData();
    }, 500);
  };

  // 处理连接
  const handleConnect = (params: Connection) => {
    console.log('Connection params:', params);
    if (!params.source || !params.target) {
      console.warn('Connection missing source or target', params);
      return;
    }
    
    // 创建新的边，使用当前选择的关系类型
    const newEdge = {
      ...params,
      id: `edge-${Date.now()}`,
      type: 'default',
      data: { relationship: relationshipType },
      label: relationshipType,
      // 手动设置样式，避免直接使用扩展运算符
      style: { ...relationshipStyles[relationshipType as keyof typeof relationshipStyles].style },
      markerEnd: { ...relationshipStyles[relationshipType as keyof typeof relationshipStyles].markerEnd },
      labelStyle: { ...relationshipStyles[relationshipType as keyof typeof relationshipStyles].labelStyle },
      labelBgStyle: { ...relationshipStyles[relationshipType as keyof typeof relationshipStyles].labelBgStyle },
    };
    
    console.log('Creating new edge:', newEdge);
    setEdges((eds) => addEdge(newEdge, eds));
    
    // 保存画布数据
    setTimeout(() => {
      saveCanvasData();
    }, 100);
  };

  // 处理边点击 - 切换关系类型
  const handleEdgeClick = (event: React.MouseEvent, edge: Edge) => {
    // 定义可能的关系类型
    const relationships = ['1:1', '1:n', 'n:m'];
    
    // 获取当前关系类型
    const currentRelationship = edge.data?.relationship || '1:n';
    
    // 确定下一个关系类型
    const currentIndex = relationships.indexOf(currentRelationship);
    const nextIndex = (currentIndex + 1) % relationships.length;
    const newRelationship = relationships[nextIndex];
    
    // 更新边的属性
    setEdges(prevEdges => 
      prevEdges.map(e => {
        if (e.id === edge.id) {
          const style = relationshipStyles[newRelationship as keyof typeof relationshipStyles];
          return {
            ...e,
            data: { ...e.data, relationship: newRelationship },
            label: newRelationship,
            style: style.style,
            markerEnd: style.markerEnd,
            labelStyle: style.labelStyle,
            labelBgStyle: style.labelBgStyle,
          };
        }
        return e;
      })
    );
    
    // 保存画布数据
    setTimeout(() => {
      saveCanvasData();
    }, 100);
  };

  // Flow 初始化完成的回调
  const onInit = (instance: any) => {
    reactFlowInstance.current = instance;
    
    // 加载节点和边数据
    loadCanvasData();
  };

  // 重新实现处理拖放相关的函数，使其更简单直接
  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    
    // 高亮可放置区域
    if (reactFlowWrapper.current) {
      reactFlowWrapper.current.classList.add('dragover');
    }
  };

  const onDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    // 移除高亮样式
    if (reactFlowWrapper.current) {
      reactFlowWrapper.current.classList.remove('dragover');
    }
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    
    // 移除高亮样式
    if (reactFlowWrapper.current) {
      reactFlowWrapper.current.classList.remove('dragover');
    }
    
    if (!reactFlowWrapper.current || !reactFlowInstance.current) {
      console.error('React Flow Wrapper或实例未初始化');
      return;
    }
    
    try {
      // 尝试获取拖放数据
      const dataString = event.dataTransfer.getData('text/plain');
      console.log('Drop data string:', dataString);
      
      if (!dataString) {
        console.error('无法获取拖放数据');
        return;
      }
      
      // 解析数据
      const entityData = JSON.parse(dataString);
      
      // 获取视口位置
      const { x, y } = reactFlowInstance.current.project({
        x: event.clientX - reactFlowWrapper.current.getBoundingClientRect().left,
        y: event.clientY - reactFlowWrapper.current.getBoundingClientRect().top,
      });
      
      // 简单地创建节点
      const nodeId = addTableNode(entityData, { x, y });
      console.log(`创建节点: ${nodeId} 在位置 (${x}, ${y})`);
      
    } catch (error) {
      console.error('处理拖放时出错:', error);
    }
  };

  // 添加表格节点
  const addTableNode = (entityData: any, position: { x: number, y: number }) => {
    // 准备字段数据
    let fields = entityData.fields || [];
    if (!Array.isArray(fields)) {
      fields = [];
      
      // 尝试从其他可能的属性中获取字段数据
      if (entityData.fieldList && Array.isArray(entityData.fieldList)) {
        fields = entityData.fieldList;
      } else if (entityData.columns && Array.isArray(entityData.columns)) {
        fields = entityData.columns;
      }
    }
    
    // 计算节点高度 - 使其更紧凑
    const minHeight = 100; // 减小最小高度
    const headerHeight = 40;
    const footerHeight = entityData.comment ? 20 : 0;
    const heightPerField = 20; // 减小每个字段的高度
    const fieldsHeight = fields.length * heightPerField;
    const nodeHeight = Math.max(minHeight, headerHeight + fieldsHeight + footerHeight);
    
    // 计算适合的宽度
    const minWidth = 150;
    const maxNameLength = Math.max(...fields.map((f: any) => {
      const name = f.defName || f.name || f.code || f.defKey || 
                  f.COLUMN_NAME || f.column_name || '未命名';
      return name.length;
    }), 0);
    const nodeWidth = Math.max(minWidth, Math.min(200, maxNameLength * 8 + 40));
    
    // 获取表名
    const tableName = entityData.defName || entityData.defKey || entityData.name || entityData.code || '未命名表';
    const comment = entityData.comment || entityData.remarks || '';
    const tableType = entityData.type || 'table';
    
    // 创建新节点
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'erTable',
      position,
      data: {
        ...entityData,
        tableName,
        fields,
        comment,
        tableType,
        // 添加更新节点数据的函数
        updateNodeData: (newData: any) => {
          setNodes(nds => 
            nds.map(n => {
              if (n.id === newNode.id) {
                return {
                  ...n,
                  data: {
                    ...n.data,
                    ...newData
                  }
                };
              }
              return n;
            })
          );
        }
      },
      style: {
        width: nodeWidth,
        height: nodeHeight,
      },
    };
    
    // 添加节点到图表
    setNodes(nds => [...nds, newNode]);
    
    // 保存画布数据
    setTimeout(() => {
      saveCanvasData();
    }, 100);
    
    return newNode.id;
  };

  // 添加关联线
  const addAssociationLine = (sourceId: string, targetId: string, relation: string = '1:n') => {
    // 验证关系类型
    const validRelations = ['1:1', '1:n', 'n:m'];
    const validRelation = validRelations.includes(relation) ? relation : '1:n';
    
    // 获取样式
    const style = relationshipStyles[validRelation as keyof typeof relationshipStyles];
    
    // 创建新的边
    const newEdge: Edge = {
      id: `edge-${Date.now()}`,
      source: sourceId,
      target: targetId,
      type: 'default',
      data: { relationship: validRelation },
      label: validRelation,
      style: style.style,
      markerEnd: style.markerEnd,
      labelStyle: style.labelStyle,
      labelBgStyle: style.labelBgStyle,
    };
    
    // 添加边到图表
    setEdges(eds => [...eds, newEdge]);
    
    // 保存画布数据
    setTimeout(() => {
      saveCanvasData();
    }, 100);
    
    return newEdge.id;
  };

  // 加载画布数据
  const loadCanvasData = () => {
    try {
      if (!currentDiagram) {
        console.log('无法加载画布数据: currentDiagram为空');
        setIsLoading(false);
        return;
      }
      
      console.log('当前图表数据:', currentDiagram);
      
      // 如果有保存的画布数据
      if (currentDiagram.canvasData) {
        console.log('原始画布数据:', currentDiagram.canvasData);
        
        // 兼容处理数据结构，根据实际格式解析
        try {
          // 尝试从cells数组中提取节点和边
          if (Array.isArray(currentDiagram.canvasData.cells)) {
            const nodeData = currentDiagram.canvasData.cells.filter(cell => cell.shape === 'er-table' || cell.type === 'erTable');
            const edgeData = currentDiagram.canvasData.cells.filter(cell => cell.shape === 'edge' || cell.type === 'default');
            
            console.log(`从cells中提取: ${nodeData.length}个节点, ${edgeData.length}条边`);
            
            // 将X6格式的节点转换为React Flow格式
            const reactFlowNodes: Node[] = nodeData.map(node => {
              return {
                id: node.id || `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: 'erTable',
                position: node.position || { x: 100, y: 100 },
                data: node.data || { tableName: 'Unknown Table', fields: [] },
                style: node.size ? { width: node.size.width, height: node.size.height } : undefined
              };
            });
            
            // 将X6格式的边转换为React Flow格式
            const reactFlowEdges: Edge[] = edgeData.map(edge => {
              const relationship = edge.data?.relationship || '1:n';
              return {
                id: edge.id || `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                source: edge.source?.cell || edge.source,
                target: edge.target?.cell || edge.target,
                sourceHandle: edge.source?.port,
                targetHandle: edge.target?.port,
                type: 'default',
                data: { relationship },
                label: edge.data?.relationship || '1:n',
                style: edge.attrs?.line || { stroke: '#05d9e8', strokeWidth: 1.5 },
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                },
                labelStyle: {
                  fill: '#05d9e8',
                  fontWeight: 500,
                },
                labelBgStyle: {
                  fill: 'rgba(10, 12, 26, 0.8)',
                  strokeWidth: 1,
                  stroke: 'rgba(5, 217, 232, 0.3)',
                  borderRadius: 3,
                  padding: '4px 6px',
                },
              };
            });
            
            console.log('转换后的节点:', reactFlowNodes);
            console.log('转换后的边:', reactFlowEdges);
            
            setNodes(reactFlowNodes);
            setEdges(reactFlowEdges);
            
          } 
          // 直接使用nodes和edges字段
          else if (Array.isArray(currentDiagram.canvasData.nodes) && Array.isArray(currentDiagram.canvasData.edges)) {
            console.log(`直接使用: ${currentDiagram.canvasData.nodes.length}个节点, ${currentDiagram.canvasData.edges.length}条边`);
            setNodes(currentDiagram.canvasData.nodes);
            setEdges(currentDiagram.canvasData.edges);
          }
          // 空数据，创建新图表
          else {
            console.log('没有可用的画布数据格式');
            setNodes([]);
            setEdges([]);
          }
        } catch (error) {
          console.error('解析画布数据失败:', error);
          setNodes([]);
          setEdges([]);
        }
      } 
      // 根据实体列表创建节点
      else if (entities && entities.length > 0) {
        // 如果是新建图，可以自动布局所有实体
        console.log(`新建图，自动添加${entities.length}个实体`);
        
        const nodeCount = entities.length;
        const columns = Math.min(Math.ceil(Math.sqrt(nodeCount)), 4); // 最多4列
        
        // 创建节点
        const newNodes: Node[] = entities.map((entity, index) => {
          const col = index % columns;
          const row = Math.floor(index / columns);
          
          // 准备字段数据
          let fields = entity.fields || [];
          if (!Array.isArray(fields)) {
            fields = [];
            
            if (entity.fieldList && Array.isArray(entity.fieldList)) {
              fields = entity.fieldList;
            } else if (entity.columns && Array.isArray(entity.columns)) {
              fields = entity.columns;
            }
          }
          
          // 计算节点高度
          const minHeight = 150;
          const heightPerField = 25;
          const nodeHeight = Math.max(minHeight, 60 + fields.length * heightPerField);
          
          // 获取表名
          const tableName = entity.defName || entity.defKey || entity.name || entity.code || '未命名表';
          const comment = entity.comment || entity.remarks || '';
          const tableType = entity.type || 'table';
          
          return {
            id: `node-${entity.id || Date.now() + index}`,
            type: 'erTable',
            position: { x: 100 + col * 250, y: 100 + row * 200 },
            data: {
              ...entity,
              tableName,
              fields,
              comment,
              tableType,
            },
            style: {
              width: 200,
              height: nodeHeight,
            },
          };
        });
        
        // 设置节点
        setNodes(newNodes);
      }
      
      // 设置加载完成
      setIsLoading(false);
      
      // 如果图实例存在，居中显示画布内容
      setTimeout(() => {
        if (reactFlowInstance.current) {
          reactFlowInstance.current.fitView({ padding: 0.2 });
        }
      }, 200);
    } catch (err) {
      console.error('加载画布数据失败:', err);
      setIsLoading(false);
    }
  };

  // 保存画布数据
  const saveCanvasData = () => {
    if (!currentDiagram) return;
    
    try {
      // 创建更新后的图表数据
      // @ts-ignore - 暂时忽略类型检查错误
      const updatedDiagram = {
        ...currentDiagram,
        canvasData: {
          cells: [...nodes, ...edges],
          nodes,
          edges
        },
        lastModified: Date.now()
      } as Diagram;
      
      // 使用统一的setter函数更新当前图表
      setCurrentDiagram(updatedDiagram);
      
      // 如果提供了保存回调，则调用
      if (onSave) {
        onSave(updatedDiagram);
      }
    } catch (err) {
      console.error('保存关系图数据时出错:', err);
      error('保存关系图数据失败');
    }
  };

  // 自动布局
  const autoLayout = (layoutType: string = 'grid') => {
    try {
      if (nodes.length === 0) return;
      
      let updatedNodes = [...nodes];
      
      // 根据布局类型选择不同的布局算法
      if (layoutType === 'grid' || layoutType === 'default') {
        // 网格布局
        const maxCols = 4;
        const columnWidth = 250;
        const rowHeight = 200;
        
        updatedNodes = nodes.map((node, index) => {
          const col = index % maxCols;
          const row = Math.floor(index / maxCols);
          
          return {
            ...node,
            position: {
              x: 50 + col * columnWidth,
              y: 50 + row * rowHeight
            }
          };
        });
      }
      else if (layoutType === 'circle') {
        // 环形布局
        const centerX = 500;
        const centerY = 400;
        const radius = Math.min(350, nodes.length * 40);
        
        updatedNodes = nodes.map((node, index) => {
          const angle = (index / nodes.length) * 2 * Math.PI;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          
          return {
            ...node,
            position: { x, y }
          };
        });
      }
      else if (layoutType === 'tree') {
        // 简单的树形布局
        const maxNodesPerLevel = 4;
        const levelHeight = 150;
        const levelWidth = 1000;
        
        updatedNodes = nodes.map((node, index) => {
          const level = Math.floor(index / maxNodesPerLevel);
          const posInLevel = index % maxNodesPerLevel;
          const spacing = levelWidth / (maxNodesPerLevel + 1);
          
          return {
            ...node,
            position: {
              x: spacing * (posInLevel + 1),
              y: level * levelHeight + 50
            }
          };
        });
      }
      
      // 更新节点位置
      setNodes(updatedNodes);
      
      // 保存画布数据
      setTimeout(() => {
        saveCanvasData();
      }, 100);
      
      // 居中显示
      setTimeout(() => {
        if (reactFlowInstance.current) {
          reactFlowInstance.current.fitView({ padding: 0.2 });
        }
      }, 200);
    } catch (err) {
      console.error('自动布局失败:', err);
      error('自动布局失败');
    }
  };

  // 导出为PNG
  const exportAsPNG = () => {
    try {
      if (!reactFlowWrapper.current) {
        error('无法找到画布元素');
        return;
      }
      
      // 获取画布元素
      const flowElement = reactFlowWrapper.current.querySelector('.react-flow');
      if (!flowElement) {
        error('无法找到画布元素');
        return;
      }
      
      // 使用html2canvas或类似库进行截图
      // 简单示例 - 需要额外安装html2canvas
      import('html2canvas').then(({ default: html2canvas }) => {
        html2canvas(flowElement as HTMLElement, {
          backgroundColor: '#1a1d31',
        }).then(canvas => {
          // 转换为数据URL并下载
          const dataUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = `${currentDiagram?.defName || '关系图'}.png`;
          link.href = dataUrl;
          link.click();
        });
      }).catch(err => {
        console.error('导出PNG时出错:', err);
        error('导出PNG失败，请先安装html2canvas库');
      });
    } catch (err) {
      console.error('导出PNG时出错:', err);
      error('导出PNG失败');
    }
  };

  // 导出为SVG
  const exportAsSVG = () => {
    try {
      if (!reactFlowWrapper.current) {
        error('无法找到画布元素');
        return;
      }
      
      // 获取SVG元素
      const svgElement = reactFlowWrapper.current.querySelector('svg');
      if (!svgElement) {
        error('无法找到SVG元素');
        return;
      }
      
      // 克隆SVG元素
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;
      
      // 添加命名空间
      if (!clonedSvg.getAttribute('xmlns')) {
        clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      }
      
      // 添加背景矩形
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('width', '100%');
      rect.setAttribute('height', '100%');
      rect.setAttribute('fill', '#1a1d31');
      clonedSvg.insertBefore(rect, clonedSvg.firstChild);
      
      // 转换为SVG数据URL并下载
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      const link = document.createElement('a');
      link.href = svgUrl;
      link.download = `${currentDiagram?.defName || '关系图'}.svg`;
      link.click();
      
      // 释放URL对象
      URL.revokeObjectURL(svgUrl);
    } catch (err) {
      console.error('导出SVG时出错:', err);
      error('导出SVG失败');
    }
  };

  // 切换全屏/最小化
  const toggleFullscreen = () => {
    if (reactFlowWrapper.current) {
      if (!isFullscreen) {
        // 进入全屏模式
        const element = reactFlowWrapper.current;
        if (element.requestFullscreen) {
          element.requestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        // 退出全屏模式
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    }
  };

  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 修改实现接口的方法
  useImperativeHandle(ref, () => ({
    addTable: (tableData: any, position: { x: number, y: number }) => {
      try {
        return addTableNode(tableData, position);
      } catch (err) {
        console.error('添加表时出错:', err);
        error('添加表失败');
        return null;
      }
    },
    addAssociation: (sourceId: string, targetId: string, relation?: string) => {
      try {
        return addAssociationLine(sourceId, targetId, relation);
      } catch (err) {
        console.error('添加关联时出错:', err);
        error('添加关联失败');
        return null;
      }
    },
    autoLayout,
    exportAsPNG,
    exportAsSVG,
    saveCanvasData
  }));

  // 组件挂载时加载数据
  useEffect(() => {
    // 如果已经有实例，直接加载
    if (reactFlowInstance.current) {
      loadCanvasData();
    }
    
    // 否则等待onInit回调中加载
  }, [diagramId]); // 当diagramId变化时重新加载

  // 在组件内部初始位置添加拖放事件监听器
  useEffect(() => {
    // 增加全局拖放监听器，用于调试
    const handleGlobalDragOver = (e: DragEvent) => {
      // 阻止默认行为以允许放置
      e.preventDefault();
    };

    const handleGlobalDrop = (e: DragEvent) => {
      console.log('Global drop event:', e);
      try {
        const data = e.dataTransfer?.getData('text/plain');
        console.log('Drop data:', data);
      } catch (err) {
        console.error('Reading drop data error:', err);
      }
    };

    // 仅在开发模式下添加全局监听器，便于调试
    if (process.env.NODE_ENV === 'development') {
      document.addEventListener('dragover', handleGlobalDragOver);
      document.addEventListener('drop', handleGlobalDrop);
    }

    return () => {
      if (process.env.NODE_ENV === 'development') {
        document.removeEventListener('dragover', handleGlobalDragOver);
        document.removeEventListener('drop', handleGlobalDrop);
      }
    };
  }, []);

  return (
    <div 
      className="diagram-editor" 
      ref={reactFlowWrapper}
      style={style}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onEdgeClick={handleEdgeClick}
        onInit={onInit}
        nodeTypes={nodeTypes}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        fitView
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{ stroke: '#05d9e8', strokeWidth: 1.5 }}
        deleteKeyCode={['Backspace', 'Delete']}
      >
        <Controls />
        <MiniMap
          nodeColor="#05d9e8"
          maskColor="rgba(12, 12, 20, 0.7)"
          style={{
            backgroundColor: 'rgba(12, 12, 20, 0.9)',
            border: '1px solid rgba(5, 217, 232, 0.4)',
            borderRadius: '6px',
          }}
        />
        <Background
          // 使用类型断言处理"dots"
          variant={'dots' as any}
          gap={16}
          size={1}
          color="rgba(5, 217, 232, 0.3)"
        />
        
        {/* 关系类型选择面板 */}
        <Panel position="top-right" style={{ background: 'transparent', border: 'none' }}>
          <div className="relationship-selector">
            <div className="relationship-label">关系类型:</div>
            <select 
              value={relationshipType}
              onChange={(e) => setRelationshipType(e.target.value)}
              className="relationship-select"
            >
              <option value="1:1">一对一 (1:1)</option>
              <option value="1:n">一对多 (1:n)</option>
              <option value="n:m">多对多 (n:m)</option>
            </select>
          </div>
        </Panel>
        
        {/* 全屏/最小化按钮 */}
        <Panel position="top-left" style={{ background: 'transparent', border: 'none' }}>
          <button 
            className="fullscreen-button" 
            onClick={toggleFullscreen}
            title={isFullscreen ? "退出全屏" : "全屏显示"}
          >
            {isFullscreen ? "退出全屏" : "全屏显示"}
          </button>
        </Panel>
      </ReactFlow>
      
      {isLoading && (
        <div className="editor-loading">
          <div className="loading-spinner"></div>
          <div className="loading-text">加载中...</div>
        </div>
      )}
    </div>
  );
});

export default DiagramEditor; 