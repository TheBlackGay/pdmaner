import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Graph, Shape, Node, Edge, Cell } from '@antv/x6';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@store/index';
import { setCurrentProject } from '@store/slices/appSlice';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { Diagram, TableCell, EdgeCell, Position } from '../../models/diagram';
import './DiagramEditor.css';

// 定义Stencil类型，避免导入错误
interface Stencil {
  dispose(): void;
}

// 用于跟踪全局节点注册状态
let nodesRegistered = false;

// 注册自定义节点的全局函数
const registerCustomNodes = () => {
  // 如果节点已经注册，则直接返回
  if (nodesRegistered) {
    return;
  }

  try {
    // 注册ER表格节点，使用类型断言
    (Graph.registerNode as any)('er-table', {
      inherit: 'rect',
      width: 200,
      height: 'auto',
      attrs: {
        body: {
          fill: 'rgba(16, 18, 38, 0.8)',
          stroke: 'rgba(5, 217, 232, 0.4)',
          strokeWidth: 1,
          rx: 6,
          ry: 6,
          filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))',
        },
        headerLabel: {
          text: '',
          refX: 10,
          refY: 15,
          fontSize: 14,
          fontWeight: 'bold',
          fill: '#05d9e8',
          textShadow: '0 0 4px rgba(5, 217, 232, 0.4)',
        },
      },
      markup: [
        {
          tagName: 'rect',
          selector: 'body',
        },
        {
          tagName: 'text',
          selector: 'headerLabel',
        },
        {
          tagName: 'g',
          selector: 'fieldGroup',
        },
      ],
    });
    
    // 标记节点已注册
    nodesRegistered = true;
  } catch (err) {
    console.warn('节点 er-table 已经注册，忽略此错误');
    // 即使出错也标记为已注册，避免再次尝试
    nodesRegistered = true;
  }
};

// 导出的接口，用于父组件调用
export interface DiagramEditorRef {
  addTable: (tableData: any, position: Position) => Node | null;
  addAssociation: (sourceId: string, targetId: string, relation?: string) => Edge | null;
  autoLayout: () => void;
  exportAsPNG: () => void;
  exportAsSVG: () => void;
  saveCanvasData: () => void;
  graph: Graph | null;
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

const DiagramEditor = forwardRef<DiagramEditorRef, DiagramEditorProps>(({ 
  diagramId, 
  entities,
  currentDiagram: propCurrentDiagram,
  setCurrentDiagram: propSetCurrentDiagram,
  onSave,
  onChangeHistory,
  onChangeSelection,
  onChangePaste,
  style
}, ref) => {
  console.log(`DiagramEditor组件渲染 - diagramId: ${diagramId}`);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const graphContainerRef = useRef<HTMLDivElement | null>(null); // 独立的图形容器引用
  const graphRef = useRef<Graph | null>(null);
  const stencilRef = useRef<Stencil | null>(null);
  const isNodesRegistered = useRef<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  // 添加内部状态来管理当前图表
  const [internalCurrentDiagram, setInternalCurrentDiagram] = useState<Diagram | null>(propCurrentDiagram || null);
  
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
  
  // 创建图形容器
  const createGraphContainer = () => {
    // 如果容器已存在，直接返回
    if (graphContainerRef.current) return graphContainerRef.current;
    
    // 如果主容器不存在，返回null
    if (!containerRef.current) return null;
    
    // 创建新的div用于X6图形
    const graphContainer = document.createElement('div');
    graphContainer.className = 'x6-graph-container';
    graphContainer.style.width = '100%';
    graphContainer.style.height = '100%';
    graphContainer.style.background = '#1a1d31';
    
    // 添加到React管理的容器中
    containerRef.current.appendChild(graphContainer);
    graphContainerRef.current = graphContainer;
    
    return graphContainer;
  };
  
  // 初始化函数
  const initGraph = () => {
    const graphContainer = createGraphContainer();
    if (!graphContainer) {
      // 如果创建容器失败，关闭加载状态
      setIsLoading(false);
      return;
    }
    
    try {
      // 创建画布
      graphRef.current = new Graph({
        container: graphContainer,
        grid: true,
        // @ts-ignore - scroller属性在类型定义中缺失
        scroller: {
          enabled: true,
          pageVisible: true,
          pageBreak: true,
          pannable: true,
        },
        mousewheel: {
          enabled: true,
          modifiers: ['ctrl', 'meta'],
        },
        connecting: {
          router: 'manhattan',
          connector: {
            name: 'rounded',
            args: {
              radius: 8,
            },
          },
          anchor: 'center',
          connectionPoint: 'anchor',
          allowBlank: false,
          snap: {
            radius: 20,
          },
          createEdge() {
            return new Shape.Edge({
              attrs: {
                line: {
                  stroke: '#A2B1C3',
                  strokeWidth: 2,
                  targetMarker: {
                    name: 'block',
                    width: 12,
                    height: 8,
                  },
                },
              },
              zIndex: 0,
            });
          },
        },
        highlighting: {
          magnetAdsorbed: {
            name: 'stroke',
            args: {
              attrs: {
                fill: '#5F95FF',
                stroke: '#5F95FF',
              },
            },
          },
        },
        background: {
          color: '#1a1d31',
        },
        history: true,
        clipboard: {
          enabled: true,
        },
      });

      // 注册自定义节点
      registerCustomNodes();
      
      // 载入数据
      loadCanvasData();
      
      // 无论如何，延迟1秒后关闭加载状态，避免永久显示加载状态
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    } catch (err) {
      console.error('初始化画布失败:', err);
      // 确保出错时也关闭加载状态
      setIsLoading(false);
    }
  };

  // 渲染表节点的字段
  const renderFieldsOnNode = (node: Node, entityData: any) => {
    if (!node) return;
    
    try {
      const fields = entityData.fields || [];
      const headerHeight = 40;
      const fieldHeight = 30;
      
      // 逐个渲染字段
      fields.forEach((field: any, index: number) => {
        const y = headerHeight + index * fieldHeight + 20;
        
        // 添加字段名称
        node.attr(`field-${index}`, {
          text: `${field.defName || field.defKey || field.name || field.code || '未命名'} (${field.type || 'unknown'})`,
          x: 10,
          y,
          fontSize: 12,
          fill: field.primaryKey ? '#ff2a6d' : '#e0e0ff'
        });
        
        // 如果是主键，添加PK标识
        if (field.primaryKey) {
          node.attr(`pk-${index}`, {
            text: 'PK',
            x: 185,
            y,
            fontSize: 10,
            fill: '#ff2a6d',
            textAnchor: 'end'
          });
        }
        
        // 如果不是第一个字段，添加分隔线
        if (index > 0) {
          node.attr(`separator-${index}`, {
            line: true,
            x1: 5,
            y1: headerHeight + index * fieldHeight,
            x2: 195, 
            y2: headerHeight + index * fieldHeight,
            stroke: 'rgba(5, 217, 232, 0.2)',
            strokeWidth: 1
          });
        }
      });
    } catch (err) {
      console.error('渲染字段时出错:', err);
    }
  };
  
  // 创建表节点
  const createTableNode = (entityData: any, position: Position): Node | null => {
    if (!graphRef.current) return null;
    
    try {
      // 准备字段数据
      const fields = entityData.fields || [];
      const headerHeight = 40;
      const fieldHeight = 30;
      const nodeHeight = headerHeight + fields.length * fieldHeight;
      
      // 创建简单节点（无字段）
      const node = graphRef.current.addNode({
        shape: 'er-table',
        position,
        size: { width: 200, height: Math.max(nodeHeight, 100) },
        // 使用最基本的标题属性
        attrs: {
          body: {
            fill: 'rgba(16, 18, 38, 0.8)',
            stroke: 'rgba(5, 217, 232, 0.4)',
            strokeWidth: 1,
            rx: 6,
            ry: 6
          },
          headerLabel: {
            text: entityData.defName || entityData.defKey || entityData.name || entityData.code || '未命名表',
            refX: 10,
            refY: 20,
            fontSize: 14,
            fontWeight: 'bold',
            fill: '#05d9e8'
          }
        },
        data: {
          ...entityData,
          // 添加附加信息
          tableType: 'er-table',
          fieldsCount: fields.length
        }
      });
      
      // 添加表头分隔线
      if (node) {
        // 表头分隔线
        node.attr({
          'headerLine': {
            line: true,
            x1: 0,
            y1: headerHeight,
            x2: 200,
            y2: headerHeight,
            stroke: 'rgba(5, 217, 232, 0.3)',
            strokeWidth: 1
          }
        });
        
        // 渲染字段
        renderFieldsOnNode(node, entityData);
        
        // 保存画布数据
        setTimeout(() => {
          saveCanvasData();
        }, 100);
      }
      
      return node;
    } catch (err) {
      console.error('创建表节点时出错:', err);
      return null;
    }
  };
  
  // 加载图表数据
  const loadDiagramData = async () => {
    if (!currentProject || !diagramId || !graphRef.current) return;
    
    try {
      setIsLoading(true);
      
      // 查找当前图表
      const diagram = currentProject.diagrams?.find(d => d.id === diagramId);
      
      if (!diagram) {
        error('找不到指定的关系图');
        setIsLoading(false);
        return;
      }
      
      // 使用统一的setter函数更新当前图表
      setCurrentDiagram(diagram);
      
      // 加载画布数据
      if (diagram.canvasData && diagram.canvasData.cells) {
        try {
          // 从JSON加载单元格
          const cells = diagram.canvasData.cells;
          graphRef.current.fromJSON(cells);
          
          success('关系图加载成功');
        } catch (err) {
          console.error('加载关系图数据失败:', err);
        }
      } else {
        // 如果没有现有数据，创建空画布
        console.log('创建新的关系图');
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('加载关系图数据时出错:', err);
      error('加载关系图数据时出错');
      setIsLoading(false);
    }
  };
  
  // 保存画布数据
  const saveCanvasData = () => {
    if (!graphRef.current || !currentDiagram || !currentProject) return;
    
    try {
      // 获取画布JSON数据
      const cells = graphRef.current.toJSON().cells;
      
      // 更新关系图数据
      const updatedDiagram = {
        ...currentDiagram,
        canvasData: {
          cells
        },
        lastModified: Date.now()
      };
      
      // 使用统一的setter函数更新当前图表
      setCurrentDiagram(updatedDiagram as Diagram);
      
      // 如果提供了保存回调，则调用
      if (onSave) {
        onSave(updatedDiagram as Diagram);
      }
    } catch (err) {
      console.error('保存关系图数据时出错:', err);
      error('保存关系图数据失败');
    }
  };
  
  // 使用useEffect来初始化和管理画布
  useEffect(() => {
    console.log(`DiagramEditor组件挂载 - diagramId: ${diagramId}`);
    
    // 初始化画布
    initGraph();
    
    // 注册事件监听器
    if (graphRef.current && graphContainerRef.current) {
      const graph = graphRef.current;
      const graphContainer = graphContainerRef.current;
      
      // 拖拽放置事件处理
      const dragOverHandler = (e: DragEvent) => {
        e.preventDefault();
      };
      
      const dropHandler = (e: DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer) {
          const entityData = JSON.parse(e.dataTransfer.getData('text/plain'));
          const { clientX, clientY } = e;
          
          if (containerRef.current && graphRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const position = graphRef.current.clientToLocal(
              clientX - containerRect.left,
              clientY - containerRect.top
            );
            createTableNode(entityData, position);
          }
        }
      };
      
      // 节点悬停事件
      const nodeMouseEnterHandler = ({ node }: { node: Cell }) => {
        node.addTools([
          {
            name: 'boundary',
            args: {
              padding: 5,
              attrs: {
                fill: '#7c68fc',
                stroke: '#333',
                'stroke-width': 1,
                'fill-opacity': 0.2,
              },
            },
          },
        ]);
      };
      
      const nodeMouseLeaveHandler = ({ node }: { node: Cell }) => {
        node.removeTools();
      };
      
      // 历史记录变更事件
      const historyChangeHandler = () => {
        // 可以在这里添加undo/redo按钮状态更新
      };
      
      // 选择变更事件
      const selectionChangedHandler = () => {
        // 可以在这里添加选择工具栏项目的状态更新
      };
      
      // 剪贴板事件
      const clipboardHandler = () => {
        // 可以在这里添加复制/粘贴按钮状态更新
      };
      
      // 添加事件监听器
      graphContainer.addEventListener('dragover', dragOverHandler);
      graphContainer.addEventListener('drop', dropHandler);
      
      graph.on('node:mouseenter', nodeMouseEnterHandler);
      graph.on('node:mouseleave', nodeMouseLeaveHandler);
      graph.on('history:change', historyChangeHandler);
      graph.on('selection:changed', selectionChangedHandler);
      graph.on('clipboard:changed', clipboardHandler);
      
      // 清理函数
      return () => {
        console.log(`DiagramEditor组件卸载 - diagramId: ${diagramId}`);
        
        try {
          // 移除事件监听器
          if (graphContainer) {
            graphContainer.removeEventListener('dragover', dragOverHandler);
            graphContainer.removeEventListener('drop', dropHandler);
          }
          
          // 解绑图形事件
          if (graph) {
            // 在移除事件前先确保所有工具都被移除
            graph.getNodes().forEach(node => {
              node.removeTools();
            });
            
            graph.off('node:mouseenter', nodeMouseEnterHandler);
            graph.off('node:mouseleave', nodeMouseLeaveHandler);
            graph.off('history:change', historyChangeHandler);
            graph.off('selection:changed', selectionChangedHandler);
            graph.off('clipboard:changed', clipboardHandler);
          }
          
          // 清理图形实例 - 重要的顺序调整
          if (graphRef.current) {
            // 1. 先清除所有单元格
            graphRef.current.clearCells();
            
            // 2. 移除所有事件监听器
            graphRef.current.off();
            
            // 3. 确保所有引用都被释放
            graphRef.current.view.undelegateEvents();
            
            // 4. 销毁图形
            graphRef.current.dispose();
            
            // 5. 最后清空引用
            graphRef.current = null;
          }
          
          // 移除图形容器
          if (graphContainerRef.current && containerRef.current) {
            try {
              containerRef.current.removeChild(graphContainerRef.current);
            } catch (e) {
              console.error('移除图形容器时出错:', e);
            }
            graphContainerRef.current = null;
          }
          
          // 清理辅助工具实例
          if (stencilRef.current) {
            stencilRef.current.dispose();
            stencilRef.current = null;
          }
          
          console.log('DiagramEditor组件资源清理完成');
        } catch (err) {
          console.error('清理图表资源时出错:', err);
        }
      };
    }
  }, [diagramId]); // 重要: 当diagramId变化时，我们需要完全重建图表
  
  // 当propCurrentDiagram变化时重新载入数据
  useEffect(() => {
    if (propCurrentDiagram && graphRef.current) {
      setInternalCurrentDiagram(propCurrentDiagram);
      
      try {
        // 清空单元格
        graphRef.current.clearCells();
        
        // 重新载入数据
        loadCanvasData();
      } catch (err) {
        console.error('更新图表数据时出错:', err);
      }
    }
  }, [propCurrentDiagram]);
  
  // 载入画布数据
  const loadCanvasData = () => {
    try {
      if (!graphRef.current || !currentDiagram) {
        console.log('无法加载画布数据: graphRef.current或currentDiagram为空');
        setIsLoading(false);
        return;
      }
      
      // 清除当前画布内容
      graphRef.current.clearCells();
      
      // 如果有保存的画布数据
      if (currentDiagram.canvasData && Array.isArray(currentDiagram.canvasData.cells)) {
        console.log(`加载${currentDiagram.canvasData.cells.length}个单元格`);
        
        // 将用户保存的数据还原到画布上
        const cells = currentDiagram.canvasData.cells.map((cellData: any) => {
          // 根据类型创建节点或连线
          if (cellData.shape === 'er-table') {
            // 表节点
            const node = graphRef.current?.createNode({
              shape: 'er-table',
              position: cellData.position,
              size: cellData.size,
              attrs: cellData.attrs,
              data: cellData.data,
            });
            
            // 渲染字段
            if (node) {
              renderFieldsOnNode(node, cellData.data);
            }
            
            return node;
          } else if (cellData.shape === 'edge') {
            // 连线
            return graphRef.current?.createEdge({
              source: cellData.source,
              target: cellData.target,
              vertices: cellData.vertices,
              attrs: cellData.attrs,
              data: cellData.data,
            });
          }
          return null;
        }).filter(Boolean) as Cell[];
        
        // 添加到画布 - 使用forEach单独添加每个cell
        if (graphRef.current) {
          cells.forEach(cell => {
            if (graphRef.current) {
              graphRef.current.addCell(cell);
            }
          });
        }
        
        console.log(`成功添加${cells.length}个单元格到画布`);
      } else if (entities && entities.length > 0) {
        // 如果是新建图，可以自动放置所有实体
        console.log(`新建图，自动添加${entities.length}个实体`);
        entities.forEach((entity, index) => {
          const row = Math.floor(index / 3);
          const col = index % 3;
          createTableNode(entity, { x: 100 + col * 250, y: 100 + row * 200 });
        });
      } else {
        console.log('没有可加载的画布数据或实体');
      }
      
      // 加载完毕，设置isLoading为false
      setIsLoading(false);
    } catch (err) {
      console.error('载入画布数据失败:', err);
      // 确保出错时也关闭加载状态
      setIsLoading(false);
    }
  };
  
  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    addTable: (entityData: any, position: Position) => {
      if (!graphRef.current) return null;
      
      try {
        // 创建表节点
        const tableNode = createTableNode(entityData, position);
        return tableNode;
      } catch (err) {
        console.error('添加表时出错:', err);
        error('添加表失败');
        return null;
      }
    },
    addAssociation: (sourceId: string, targetId: string, relationType?: string) => {
      if (!graphRef.current) return null;
      
      try {
        // 查找源节点和目标节点
        const source = graphRef.current.getCellById(sourceId);
        const target = graphRef.current.getCellById(targetId);
        
        if (!source || !target) {
          error('找不到指定的节点');
          return null;
        }
        
        // 创建连接
        const edge = graphRef.current.addEdge({
          shape: 'edge',
          source: { cell: sourceId, port: 'out' },
          target: { cell: targetId, port: 'in' },
          attrs: {
            line: {
              stroke: '#05d9e8',
              strokeWidth: 2,
              targetMarker: {
                name: 'classic',
                size: 8,
              },
            },
          },
          data: {
            relation: relationType || 'oneToMany'
          }
        });
        
        return edge;
      } catch (err) {
        console.error('添加关联时出错:', err);
        error('添加关联失败');
        return null;
      }
    },
    autoLayout: () => {
      if (!graphRef.current) return;
      
      try {
        // 执行自动布局
        // 这里使用简单的网格布局
        const nodes = graphRef.current.getNodes();
        if (nodes.length === 0) return;
        
        let x = 50;
        let y = 50;
        const columnWidth = 250;
        const rowHeight = 200;
        const maxX = 1000;
        
        nodes.forEach((node, index) => {
          node.position(x, y);
          
          x += columnWidth;
          if (x > maxX) {
            x = 50;
            y += rowHeight;
          }
        });
        
        graphRef.current.centerContent();
      } catch (err) {
        console.error('执行自动布局时出错:', err);
        error('自动布局失败');
      }
    },
    exportAsPNG: () => {
      if (!graphRef.current) return;
      
      try {
        // 创建和导出PNG
        const svg = graphRef.current.container.querySelector('svg');
        if (!svg) {
          error('找不到SVG元素');
          return;
        }
        
        // 创建一个临时的画布
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          error('无法创建Canvas上下文');
          return;
        }
        
        // 设置画布大小
        canvas.width = svg.clientWidth;
        canvas.height = svg.clientHeight;
        
        // 创建一个临时图片
        const img = new Image();
        img.onload = () => {
          // 绘制到画布
          ctx.fillStyle = '#0c0c14'; // 背景颜色
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          
          // 转换为数据URL并下载
          const dataUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = `${currentDiagram?.defName || '关系图'}.png`;
          link.href = dataUrl;
          link.click();
        };
        
        // 将SVG转换为数据URL
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        img.src = url;
      } catch (err) {
        console.error('导出PNG时出错:', err);
        error('导出PNG失败');
      }
    },
    exportAsSVG: () => {
      if (!graphRef.current) return;
      
      try {
        // 导出SVG
        const svg = graphRef.current.container.querySelector('svg');
        if (!svg) {
          error('找不到SVG元素');
          return;
        }
        
        // 克隆SVG并添加命名空间
        const clonedSvg = svg.cloneNode(true) as SVGElement;
        if (!clonedSvg.getAttribute('xmlns')) {
          clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        }
        
        // 添加背景
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', '100%');
        rect.setAttribute('height', '100%');
        rect.setAttribute('fill', '#0c0c14');
        clonedSvg.insertBefore(rect, clonedSvg.firstChild);
        
        // 序列化SVG并创建下载链接
        const svgData = new XMLSerializer().serializeToString(clonedSvg);
        const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`;
        const link = document.createElement('a');
        link.download = `${currentDiagram?.defName || '关系图'}.svg`;
        link.href = dataUri;
        link.click();
      } catch (err) {
        console.error('导出SVG时出错:', err);
        error('导出SVG失败');
      }
    },
    saveCanvasData: saveCanvasData,
    graph: graphRef.current
  }));
  
  return (
    <div 
      className="diagram-editor"
      ref={containerRef}
      key={`diagram-editor-${diagramId}`}
      style={style}
    >
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