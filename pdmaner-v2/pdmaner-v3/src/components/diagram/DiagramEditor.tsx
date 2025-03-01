import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Graph, Shape, Node, Edge, Cell } from '@antv/x6';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@store/index';
import { setCurrentProject } from '@store/slices/appSlice';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { Diagram, TableCell, EdgeCell, Position } from '../../models/diagram';
import './DiagramEditor.css';

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

interface DiagramEditorProps {
  diagramId: string;
  onSave?: (diagram: Diagram) => void;
}

// 导出的接口，用于父组件调用
export interface DiagramEditorRef {
  addTable: (tableData: any, position: Position) => Node | null;
  addAssociation: (sourceId: string, targetId: string, relation?: string) => Edge | null;
  autoLayout: () => void;
  exportAsPNG: () => void;
  exportAsSVG: () => void;
  saveCanvasData: () => void;
}

const DiagramEditor = forwardRef<DiagramEditorRef, DiagramEditorProps>(({ diagramId, onSave }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Graph | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDiagram, setCurrentDiagram] = useState<Diagram | null>(null);
  
  const dispatch = useDispatch();
  const currentProject = useSelector((state: RootState) => state.app.currentProject);
  const { success, error } = useNotificationContext();
  
  // 初始化图表
  useEffect(() => {
    if (!containerRef.current) return;
    
    // 注册自定义节点（使用全局状态检查）
    registerCustomNodes();
    
    // 创建图表实例
    const graph = new Graph({
      container: containerRef.current,
      width: containerRef.current.offsetWidth,
      height: containerRef.current.offsetHeight,
      grid: {
        visible: true,
        type: 'dot',
        size: 10,
        color: 'rgba(5, 217, 232, 0.1)',
      },
      connecting: {
        router: 'manhattan',
        connector: {
          name: 'rounded',
          args: { radius: 8 },
        },
        allowBlank: false,
        createEdge() {
          return new Shape.Edge({
            attrs: {
              line: {
                stroke: 'rgba(5, 217, 232, 0.6)',
                strokeWidth: 1.5,
                targetMarker: {
                  name: 'block',
                  width: 8,
                  height: 8,
                  fill: '#05d9e8',
                },
              },
            },
            zIndex: 0,
            data: {
              relation: '1:n', // 默认关系
            },
          });
        },
      },
      background: {
        color: '#0c0c14',
      },
      mousewheel: {
        enabled: true,
        zoomAtMousePosition: true,
        modifiers: 'ctrl',
        minScale: 0.5,
        maxScale: 3,
      },
      highlighting: {
        magnetAdsorbed: {
          name: 'stroke',
          args: {
            attrs: {
              stroke: '#05d9e8',
              strokeWidth: 4,
              opacity: 0.5,
            },
          },
        },
      },
      clipboard: {
        enabled: true,
      },
      keyboard: {
        enabled: true,
      },
      history: {
        enabled: true,
      },
    } as any);
    
    graphRef.current = graph;
    
    // 设置事件监听
    setupEventListeners(graph);
    
    // 加载图表数据
    loadDiagramData();
    
    // 窗口大小变化时调整图表大小
    const handleResize = () => {
      if (containerRef.current && graph) {
        graph.resize(
          containerRef.current.offsetWidth,
          containerRef.current.offsetHeight
        );
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      graph.dispose();
      graphRef.current = null;
    };
  }, []);
  
  // 当diagramId变化时，加载对应的图表数据
  useEffect(() => {
    loadDiagramData();
  }, [diagramId, currentProject]);
  
  // 加载图表数据
  const loadDiagramData = () => {
    if (!currentProject || !diagramId || !graphRef.current) return;
    
    setIsLoading(true);
    
    try {
      // 查找当前图表
      const diagram = currentProject.diagrams?.find(d => d.id === diagramId);
      
      if (!diagram) {
        error('找不到指定的关系图');
        setIsLoading(false);
        return;
      }
      
      setCurrentDiagram(diagram);
      
      // 清空现有图表
      graphRef.current.clearCells();
      
      // 如果有画布数据，加载它
      if (diagram.canvasData && diagram.canvasData.cells && diagram.canvasData.cells.length > 0) {
        graphRef.current.fromJSON(diagram.canvasData);
      } else {
        // 如果没有画布数据，但有实体ID，则自动创建节点
        if (diagram.entityIds && diagram.entityIds.length > 0) {
          createNodesFromEntities(diagram.entityIds);
        }
      }
      
      success('关系图加载成功');
    } catch (err) {
      console.error('加载关系图失败:', err);
      error('加载关系图失败');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 从实体ID创建节点
  const createNodesFromEntities = (entityIds: string[]) => {
    if (!currentProject || !graphRef.current) return;
    
    // 获取表数据
    const tables = currentProject.tables || [];
    
    // 筛选出要显示的表
    const tablesToShow = tables.filter(table => entityIds.includes(table.id));
    
    // 计算布局位置
    const positions = calculateAutoLayout(tablesToShow.length);
    
    // 创建节点
    tablesToShow.forEach((table, index) => {
      const position = positions[index] || { x: 100, y: 100 };
      
      // 创建表节点
      const tableNode = graphRef.current!.addNode({
        shape: 'er-table',
        position,
        size: { width: 200, height: 40 + table.fields.length * 30 },
        attrs: {
          headerLabel: {
            text: table.name,
          },
        },
        data: {
          id: table.id,
          defKey: table.code,
          defName: table.name,
          comment: table.comment,
          fields: table.fields,
        },
      });
      
      // 添加字段
      addFieldsToTableNode(tableNode, table.fields);
    });
    
    // 自动创建关联关系
    createAssociations();
    
    // 保存画布数据
    saveCanvasData();
  };
  
  // 计算自动布局位置
  const calculateAutoLayout = (count: number): Position[] => {
    const positions: Position[] = [];
    const cols = Math.ceil(Math.sqrt(count));
    const spacing = 250;
    
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      
      positions.push({
        x: 100 + col * spacing,
        y: 100 + row * spacing,
      });
    }
    
    return positions;
  };
  
  // 添加字段到表节点
  const addFieldsToTableNode = (node: Node, fields: any[]) => {
    if (!fields || fields.length === 0) return;
    
    try {
      // 获取节点的SVG元素
      const nodeEl = document.getElementById(node.id);
      if (!nodeEl) return;
      
      // 查找或创建字段组
      let fieldGroup = nodeEl.querySelector('g.fieldGroup');
      if (!fieldGroup) {
        // 如果找不到字段组，则创建一个
        fieldGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        fieldGroup.classList.add('fieldGroup');
        nodeEl.appendChild(fieldGroup);
      } else {
        // 清空现有字段
        while (fieldGroup.firstChild) {
          fieldGroup.removeChild(fieldGroup.firstChild);
        }
      }
    
      // 添加字段分隔线
      const separator = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      separator.setAttribute('x1', '0');
      separator.setAttribute('y1', '30');
      separator.setAttribute('x2', '200');
      separator.setAttribute('y2', '30');
      separator.setAttribute('stroke', 'rgba(5, 217, 232, 0.3)');
      separator.setAttribute('stroke-width', '1');
      fieldGroup.appendChild(separator);
    
      // 添加字段
      fields.forEach((field, index) => {
        const y = 50 + index * 30;
        
        // 字段名
        const fieldName = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        fieldName.setAttribute('x', '10');
        fieldName.setAttribute('y', y.toString());
        fieldName.setAttribute('fill', field.primaryKey ? '#ffc107' : '#e0e0ff');
        fieldName.setAttribute('font-size', '12');
        fieldName.textContent = field.name;
        
        // 字段类型
        const fieldType = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        fieldType.setAttribute('x', '120');
        fieldType.setAttribute('y', y.toString());
        fieldType.setAttribute('fill', '#8d8dba');
        fieldType.setAttribute('font-size', '12');
        fieldType.textContent = field.type;
        
        // 主键图标
        if (field.primaryKey) {
          const pkIcon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          pkIcon.setAttribute('x', '180');
          pkIcon.setAttribute('y', y.toString());
          pkIcon.setAttribute('fill', '#ffc107');
          pkIcon.setAttribute('font-size', '12');
          pkIcon.setAttribute('text-anchor', 'middle');
          pkIcon.textContent = '🔑';
          fieldGroup.appendChild(pkIcon);
        }
        
        fieldGroup.appendChild(fieldName);
        fieldGroup.appendChild(fieldType);
      });
    
      // 调整节点高度
      node.resize(200, 40 + fields.length * 30);
    } catch (err) {
      console.error('处理字段组时出错:', err);
    }
  };
  
  // 创建关联关系
  const createAssociations = () => {
    if (!currentProject || !currentDiagram || !graphRef.current) return;
    
    const { associations } = currentDiagram;
    
    if (!associations || associations.length === 0) return;
    
    associations.forEach(assoc => {
      const sourceNode = graphRef.current!.getNodes().find(
        node => (node.getData() as any).id === assoc.sourceId
      );
      
      const targetNode = graphRef.current!.getNodes().find(
        node => (node.getData() as any).id === assoc.targetId
      );
      
      if (sourceNode && targetNode) {
        graphRef.current!.addEdge({
          source: { cell: sourceNode.id, anchor: 'right' },
          target: { cell: targetNode.id, anchor: 'left' },
          attrs: {
            line: {
              stroke: 'rgba(5, 217, 232, 0.6)',
              strokeWidth: 1.5,
              targetMarker: {
                name: 'block',
                width: 8,
                height: 8,
                fill: '#05d9e8',
              },
            },
          },
          data: {
            relation: assoc.relation || '1:n',
            sourceField: assoc.sourceField,
            targetField: assoc.targetField,
          },
        });
      }
    });
  };
  
  // 设置事件监听
  const setupEventListeners = (graph: Graph) => {
    // 节点移动后保存画布
    graph.on('node:moved', () => {
      saveCanvasData();
    });
    
    // 连接创建后保存画布
    graph.on('edge:connected', () => {
      saveCanvasData();
    });
    
    // 单元格移除后保存画布
    graph.on('cell:removed', () => {
      saveCanvasData();
    });
    
    // 节点选择事件
    graph.on('node:selected', ({ node }) => {
      // 处理节点选择逻辑
      console.log('选中节点:', node.getData());
    });
    
    // 边选择事件
    graph.on('edge:selected', ({ edge }) => {
      // 处理边选择逻辑
      console.log('选中连接:', edge.getData());
    });
  };
  
  // 保存画布数据
  const saveCanvasData = () => {
    if (!graphRef.current || !currentDiagram || !currentProject) return;
    
    try {
      // 获取画布数据
      const canvasData = graphRef.current.toJSON();
      
      // 更新当前图表
      const updatedDiagram = {
        ...currentDiagram,
        canvasData,
        lastModified: Date.now(),
      };
      
      // 更新项目中的图表数据
      const updatedDiagrams = currentProject.diagrams?.map(d =>
        d.id === diagramId ? updatedDiagram : d
      ) || [];
      
      // 更新项目
      const updatedProject = {
        ...currentProject,
        diagrams: updatedDiagrams,
        lastModified: Date.now(),
      };
      
      // 更新Redux状态
      dispatch(setCurrentProject(updatedProject));
      
      // 更新本地状态
      setCurrentDiagram(updatedDiagram as any);
      
      // 调用保存回调
      if (onSave) {
        onSave(updatedDiagram as any);
      }
    } catch (err) {
      console.error('保存画布数据失败:', err);
      error('保存画布数据失败');
    }
  };
  
  // 添加新表
  const addTable = (tableData: any, position: Position) => {
    if (!graphRef.current) return null;
    
    try {
      // 创建表节点
      const tableNode = graphRef.current.addNode({
        shape: 'er-table',
        position,
        size: { width: 200, height: 40 + (tableData.fields?.length || 0) * 30 },
        attrs: {
          headerLabel: {
            text: tableData.name,
          },
        },
        data: {
          id: tableData.id,
          defKey: tableData.code,
          defName: tableData.name,
          comment: tableData.comment,
          fields: tableData.fields || [],
        },
      });
      
      // 添加字段
      if (tableData.fields && tableData.fields.length > 0) {
        addFieldsToTableNode(tableNode, tableData.fields);
      }
      
      // 保存画布数据
      saveCanvasData();
      
      return tableNode;
    } catch (err) {
      console.error('添加表失败:', err);
      error('添加表失败');
      return null;
    }
  };
  
  // 添加关联关系
  const addAssociation = (sourceId: string, targetId: string, relation: string = '1:n') => {
    if (!graphRef.current) return null;
    
    try {
      const sourceNode = graphRef.current.getNodes().find(
        node => (node.getData() as any).id === sourceId
      );
      
      const targetNode = graphRef.current.getNodes().find(
        node => (node.getData() as any).id === targetId
      );
      
      if (!sourceNode || !targetNode) {
        error('找不到关联的表节点');
        return null;
      }
      
      const edge = graphRef.current.addEdge({
        source: { cell: sourceNode.id, anchor: 'right' },
        target: { cell: targetNode.id, anchor: 'left' },
        attrs: {
          line: {
            stroke: 'rgba(5, 217, 232, 0.6)',
            strokeWidth: 1.5,
            targetMarker: {
              name: 'block',
              width: 8,
              height: 8,
              fill: '#05d9e8',
            },
          },
        },
        data: {
          relation,
        },
      });
      
      // 保存画布数据
      saveCanvasData();
      
      return edge;
    } catch (err) {
      console.error('添加关联关系失败:', err);
      error('添加关联关系失败');
      return null;
    }
  };
  
  // 自动布局
  const autoLayout = () => {
    if (!graphRef.current) return;
    
    try {
      const nodes = graphRef.current.getNodes();
      const positions = calculateAutoLayout(nodes.length);
      
      nodes.forEach((node, index) => {
        const position = positions[index] || { x: 100, y: 100 };
        node.position(position.x, position.y);
      });
      
      // 保存画布数据
      saveCanvasData();
      
      success('自动布局完成');
    } catch (err) {
      console.error('自动布局失败:', err);
      error('自动布局失败');
    }
  };
  
  // 导出为PNG
  const exportAsPNG = () => {
    if (!graphRef.current || !containerRef.current) return;
    
    try {
      // 使用html-to-image或dom-to-image等方式
      // 这里使用一个简单的方法，实际项目中可能需要引入专门的库
      const svg = containerRef.current.querySelector('svg');
      if (!svg) {
        error('找不到SVG元素');
        return;
      }
      
      // 创建一个临时canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        error('无法创建canvas上下文');
        return;
      }
      
      // 设置canvas大小
      canvas.width = svg.clientWidth;
      canvas.height = svg.clientHeight;
      
      // 创建image元素
      const image = new Image();
      
      // SVG数据转换为base64
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const DOMURL = window.URL || window.webkitURL || window;
      const url = DOMURL.createObjectURL(svgBlob);
      
      // 图像加载后绘制到canvas
      image.onload = () => {
        ctx.fillStyle = '#0c0c14'; // 背景颜色
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0);
        DOMURL.revokeObjectURL(url);
        
        // 转换为PNG并下载
        const imgURI = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${currentDiagram?.defName || 'diagram'}.png`;
        link.href = imgURI;
        link.click();
        
        success('导出PNG成功');
      };
      
      image.onerror = () => {
        console.error('加载SVG失败');
        error('导出PNG失败');
        DOMURL.revokeObjectURL(url);
      };
      
      image.src = url;
    } catch (err) {
      console.error('导出PNG失败:', err);
      error('导出PNG失败');
    }
  };
  
  // 导出为SVG
  const exportAsSVG = () => {
    if (!graphRef.current || !containerRef.current) return;
    
    try {
      const svg = containerRef.current.querySelector('svg');
      if (!svg) {
        error('找不到SVG元素');
        return;
      }
      
      // 克隆SVG以便修改
      const clonedSvg = svg.cloneNode(true) as SVGElement;
      
      // 确保SVG有正确的命名空间
      if (!clonedSvg.getAttribute('xmlns')) {
        clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      }
      
      // 添加背景矩形
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('width', '100%');
      rect.setAttribute('height', '100%');
      rect.setAttribute('fill', '#0c0c14');
      
      // 将背景矩形插入到SVG的最前面
      clonedSvg.insertBefore(rect, clonedSvg.firstChild);
      
      // 序列化SVG为字符串
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      // 创建下载链接
      const link = document.createElement('a');
      link.download = `${currentDiagram?.defName || 'diagram'}.svg`;
      link.href = svgUrl;
      link.click();
      
      // 释放URL
      setTimeout(() => {
        URL.revokeObjectURL(svgUrl);
      }, 100);
      
      success('导出SVG成功');
    } catch (err) {
      console.error('导出SVG失败:', err);
      error('导出SVG失败');
    }
  };
  
  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    addTable,
    addAssociation,
    autoLayout,
    exportAsPNG,
    exportAsSVG,
    saveCanvasData,
  }), [currentDiagram, currentProject]);
  
  return (
    <div className="diagram-editor">
      {isLoading && (
        <div className="diagram-loading">
          <div className="loading-spinner"></div>
          <div className="loading-text">加载关系图...</div>
        </div>
      )}
      <div className="diagram-canvas" ref={containerRef}></div>
    </div>
  );
});

export default DiagramEditor; 