/**
 * 实体（数据表）相关类型定义
 */

// 字段类型定义
export interface Field {
  id: string;
  defKey: string;
  defName: string;
  comment: string;
  type: string;
  len?: number;
  scale?: number;
  primaryKey: boolean;
  notNull: boolean;
  autoIncrement: boolean;
  defaultValue?: string;
  hideInGraph?: boolean;
  refDict?: string;
  domain?: string;
  uiHint?: string;
}

// 索引类型定义
export interface Index {
  id: string;
  defKey: string;
  defName: string;
  comment: string;
  isUnique: boolean;
  fields: string[]; // 字段ID数组
}

// 关系源目标定义
export interface RelationRef {
  entityId: string;
  fieldId: string;
}

// 实体关系类型定义
export interface Relation {
  id: string;
  type: string; // 关系类型：一对一、一对多等
  source: RelationRef;
  target: RelationRef;
  relationmentId: string;
}

// 图形配置类型定义
export interface GraphConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 实体类型定义
export interface Entity {
  id: string;
  defKey: string;
  defName: string;
  comment: string;
  fields: Field[];
  indexes: Index[];
  relations: Relation[];
  graphConfig?: GraphConfig;
}

// 实体实用工具类型
export type EntityId = Entity['id'];
export type EntityWithoutRelations = Omit<Entity, 'relations'>; 