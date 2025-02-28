/**
 * 项目相关类型定义
 */
import { Entity } from './entity';
import { Diagram } from './diagram';

// 项目配置信息
export interface ProjectProfile {
  defaultFields?: any[];
  javaHome?: string;
  sqlPath?: string;
  sqlConfig?: {
    [key: string]: any;
  };
  [key: string]: any;
}

// 数据字典项定义
export interface DictItem {
  id: string;
  defKey: string;
  defName: string;
  comment: string;
  value: string;
  parentKey?: string;
}

// 数据字典分组定义
export interface DictGroup {
  id: string;
  defKey: string;
  defName: string;
  items: string[]; // DictItem的ID数组
}

// 数据字典定义
export interface Dict {
  id: string;
  defKey: string;
  defName: string;
  comment: string;
  items: DictItem[];
  groups: DictGroup[];
}

// 数据域定义
export interface Domain {
  id: string;
  defKey: string;
  defName: string;
  comment: string;
  type: string;
  len?: number;
  scale?: number;
  defaultValue?: string;
  notNull?: boolean;
  autoIncrement?: boolean;
  uiHint?: string;
  refDict?: string;
}

// 数据类型映射定义
export interface DataTypeMapping {
  [databaseType: string]: {
    [dataType: string]: string;
  };
}

// 视图分组定义
export interface ViewGroup {
  id: string;
  defKey: string;
  defName: string;
  refEntities: string[];
  refDiagrams: string[];
  refViews: string[];
  refDicts: string[];
}

// 项目数据定义
export interface Project {
  name: string;
  type: string;
  defaultDb: string;
  profile: ProjectProfile;
  entities: Entity[];
  diagrams: Diagram[];
  dicts: Dict[];
  domains: Domain[];
  dataTypeMapping: DataTypeMapping;
  viewGroups: ViewGroup[];
  version: string;
}

// 项目历史记录项定义
export interface ProjectHistoryItem {
  path: string;
  name: string;
  date: number;
  type: string;
  thumbnail?: string;
} 