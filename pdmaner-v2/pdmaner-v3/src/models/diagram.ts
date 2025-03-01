/**
 * 关系图相关类型定义
 */

// 位置信息
export interface Position {
  x: number;
  y: number;
}

// 大小信息
export interface Size {
  width: number;
  height: number;
}

// 连接点引用
export interface PortRef {
  cell: string;
  port: string;
}

// 图形单元格基础类型
export interface Cell {
  id: string;
  shape: string;
  position: Position;
  size: Size;
  ports?: any[];
  [key: string]: any;
}

// 节点单元格（实体表）
export interface TableCell extends Cell {
  shape: 'table';
  data: {
    id: string;
    defKey: string;
    defName: string;
    comment: string;
    fields: any[];
  };
}

// 边（关系线）
export interface EdgeCell extends Cell {
  shape: 'edge';
  source: PortRef;
  target: PortRef;
  data?: {
    relation?: any;
  };
}

// 画布数据
export interface CanvasData {
  cells: Cell[];
}

// 关系图定义
export interface Diagram {
  id: string;
  defKey: string;
  defName: string;
  comment: string;
  canvasData: CanvasData;
  entityIds: string[];
  associations: any[];
  domainId: string;          // 所属主题域ID
  createTime: number;        // 创建时间戳
  lastModified: number;      // 最后修改时间戳
}

// 关系图实用工具类型
export type DiagramId = Diagram['id']; 