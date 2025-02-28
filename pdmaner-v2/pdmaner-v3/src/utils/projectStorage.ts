import { generateUUID } from './uuid';

// 项目基本信息类型
export interface ProjectInfo {
  id: string;
  name: string;
  path: string; // localStorage中的存储路径
  createTime: number;
  lastModified: number;
  description?: string;
}

// 完整项目数据类型
export interface ProjectData {
  info: ProjectInfo;
  domains: DomainData[]; // 主题域数据
  tables: TableData[]; // 数据表
  diagrams: any[]; // 关系图
  dictionaries: any[]; // 数据字典
  config: any; // 项目配置
}

// 主题域数据类型
export interface DomainData {
  id: string;
  name: string;
  code: string;
  description?: string;
  createTime: number;
  lastModified: number;
}

// 数据表类型
export interface TableData {
  id: string;
  name: string; // 表显示名
  code: string; // 表代码
  comment?: string; // 表备注
  domainId: string; // 所属主题域ID
  type: string; // 表类型
  fields: any[]; // 字段数组
  createTime: number;
  lastModified: number;
}

// 本地存储键
const STORAGE_KEYS = {
  CURRENT_PROJECT: 'pdmaner_current_project',
  RECENT_PROJECTS: 'pdmaner_recent_projects',
  PROJECT_PREFIX: 'pdmaner_project_'
};

/**
 * 获取当前打开的项目ID
 */
export const getCurrentProjectId = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.CURRENT_PROJECT);
};

/**
 * 设置当前打开的项目ID
 */
export const setCurrentProjectId = (projectId: string | null): void => {
  if (projectId) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_PROJECT, projectId);
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_PROJECT);
  }
};

/**
 * 获取最近的项目列表
 */
export const getRecentProjects = (): ProjectInfo[] => {
  const recentProjects = localStorage.getItem(STORAGE_KEYS.RECENT_PROJECTS);
  return recentProjects ? JSON.parse(recentProjects) : [];
};

/**
 * 添加到最近项目列表
 */
export const addToRecentProjects = (project: ProjectInfo): void => {
  const recentProjects = getRecentProjects();
  
  // 如果已存在，则移除旧的
  const filteredProjects = recentProjects.filter(p => p.id !== project.id);
  
  // 添加到列表开头
  filteredProjects.unshift(project);
  
  // 只保留最近10个项目
  const updatedProjects = filteredProjects.slice(0, 10);
  
  localStorage.setItem(STORAGE_KEYS.RECENT_PROJECTS, JSON.stringify(updatedProjects));
};

/**
 * 根据ID获取完整项目数据
 */
export const getProjectById = (projectId: string): ProjectData | null => {
  const projectKey = `${STORAGE_KEYS.PROJECT_PREFIX}${projectId}`;
  const projectData = localStorage.getItem(projectKey);
  return projectData ? JSON.parse(projectData) : null;
};

/**
 * 保存项目数据
 */
export const saveProject = (project: ProjectData): void => {
  // 创建一个深拷贝，避免修改原始对象
  const projectCopy = JSON.parse(JSON.stringify(project));
  
  // 更新最后修改时间
  projectCopy.info.lastModified = Date.now();
  
  // 确保必要的数组属性总是存在
  projectCopy.tables = projectCopy.tables || [];
  projectCopy.diagrams = projectCopy.diagrams || [];
  projectCopy.dictionaries = projectCopy.dictionaries || [];
  
  // 保存完整项目数据
  const projectKey = `${STORAGE_KEYS.PROJECT_PREFIX}${projectCopy.info.id}`;
  localStorage.setItem(projectKey, JSON.stringify(projectCopy));
  
  // 添加到最近项目
  addToRecentProjects(projectCopy.info);
  
  // 设置为当前项目
  setCurrentProjectId(projectCopy.info.id);
};

/**
 * 创建新项目
 */
export const createNewProject = (name: string, description: string = ''): ProjectData => {
  const now = Date.now();
  const projectId = generateUUID();
  
  // 创建项目信息
  const projectInfo: ProjectInfo = {
    id: projectId,
    name,
    path: `${STORAGE_KEYS.PROJECT_PREFIX}${projectId}`,
    createTime: now,
    lastModified: now,
    description
  };
  
  // 创建默认主题域
  const defaultDomain: DomainData = {
    id: generateUUID(),
    name: '默认主题域',
    code: 'default',
    createTime: now,
    lastModified: now
  };
  
  // 创建新项目数据
  const newProject: ProjectData = {
    info: projectInfo,
    domains: [defaultDomain],
    tables: [], // 初始化一个空的表数组
    diagrams: [],
    dictionaries: [],
    config: {
      defaultDb: 'MYSQL',
      version: '5.0.0'
    }
  };
  
  // 保存项目
  saveProject(newProject);
  
  return newProject;
};

/**
 * 删除项目
 */
export const deleteProject = (projectId: string): void => {
  // 移除项目数据
  const projectKey = `${STORAGE_KEYS.PROJECT_PREFIX}${projectId}`;
  localStorage.removeItem(projectKey);
  
  // 更新最近项目列表
  const recentProjects = getRecentProjects();
  const updatedProjects = recentProjects.filter(p => p.id !== projectId);
  localStorage.setItem(STORAGE_KEYS.RECENT_PROJECTS, JSON.stringify(updatedProjects));
  
  // 如果是当前项目，清除当前项目ID
  if (getCurrentProjectId() === projectId) {
    setCurrentProjectId(null);
  }
};

/**
 * 创建新主题域
 */
export const createNewDomain = (projectId: string, name: string, code: string): DomainData | null => {
  const project = getProjectById(projectId);
  if (!project) return null;
  
  const now = Date.now();
  const newDomain: DomainData = {
    id: generateUUID(),
    name,
    code,
    createTime: now,
    lastModified: now
  };
  
  project.domains.push(newDomain);
  saveProject(project);
  
  return newDomain;
};

/**
 * 清空所有项目数据（慎用）
 */
export const clearAllProjectData = (): void => {
  // 获取所有项目ID
  const recentProjects = getRecentProjects();
  
  // 逐个删除项目数据
  recentProjects.forEach(project => {
    const projectKey = `${STORAGE_KEYS.PROJECT_PREFIX}${project.id}`;
    localStorage.removeItem(projectKey);
  });
  
  // 清除列表和当前项目
  localStorage.removeItem(STORAGE_KEYS.RECENT_PROJECTS);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_PROJECT);
};

export default {
  getCurrentProjectId,
  setCurrentProjectId,
  getRecentProjects,
  getProjectById,
  saveProject,
  createNewProject,
  deleteProject,
  createNewDomain,
  clearAllProjectData
}; 