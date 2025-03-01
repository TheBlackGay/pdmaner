import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  HomeOutlined,
  TableOutlined,
  ProjectOutlined,
  BranchesOutlined,
  DatabaseOutlined,
  BookOutlined,
  CodeOutlined,
  FolderOpenOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { toggleDarkMode, setLoading, setCurrentProject, updateCurrentProject } from '@store/slices/appSlice';
import { RootState } from '@store/index';
import { ProjectData as ProjectDataImport, DomainData as DomainDataImport, saveProject, createNewDomain } from '@utils/projectStorage';
import { generateUUID } from '@utils/uuid';
import { useNotificationContext } from '../../contexts/NotificationContext';

// 导入拆分的组件
import Header from './header/Header';
import MainToolbar from './mainToolbar/MainToolbar';
import TabsBar from './tabsBar/TabsBar';
import SideMenu, { MenuItem } from './sideMenu/SideMenu';
import StatusBar from './statusBar/StatusBar';
import ContextMenu, { ContextMenuPosition } from './contextMenu/ContextMenu';
import ProjectOverview, { ProjectStats, ProjectDetails } from './projectOverview/ProjectOverview';
import StandardFieldsLibrary from '../standardFields/StandardFieldsLibrary';

// 导入模态框组件
import NewDomainModal from '@components/modals/NewDomainModal';
import NewTableModal from '@components/modals/NewTableModal';
import RenameTableModal from '@components/modals/RenameTableModal';
import EditTableModal from '@components/modals/EditTableModal';
import ImportSQLModal from '@components/modals/ImportSQLModal';
import PopConfirm from '@components/common/PopConfirm';

// 样式
import './MainLayout.css';

// 定义接口
interface TableDataType {
  id: string;
  name: string;
  code: string;
  comment?: string;
  domainId: string;
  type: string;
  fields: any[];
  createTime: number;
  lastModified: number;
}

interface DomainDataType {
  id: string;
  code: string;
  name: string;
  createTime: number;
  lastModified: number;
  tables?: TableDataType[];
}

interface ProjectInfo {
  name: string;
  description?: string;
  createTime: number;
  lastModified: number;
}

interface ProjectDataType {
  id: string;
  info: ProjectInfo;
  domains: DomainDataType[];
}

// 标签页数据接口
interface TabData {
  id: string;
  title: string;
  type: string;
  icon: React.ReactNode;
}

const MainLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // 从Redux获取当前项目和暗黑模式状态
  const currentProject = useSelector((state: RootState) => state.app.currentProject);
  const darkMode = useSelector((state: RootState) => state.app.darkMode);
  
  // 通知系统
  const { success, error } = useNotificationContext();

  // 状态
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [rightPanelVisible, setRightPanelVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(''); // 当前激活的标签页
  const [tabs, setTabs] = useState<TabData[]>([]);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition>({
    visible: false,
    x: 0,
    y: 0,
    type: ''
  });
  const [isNewDomainModalOpen, setIsNewDomainModalOpen] = useState(false);
  const [selectedTableKey, setSelectedTableKey] = useState<string>('');
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]); // 添加展开的组状态
  
  // 标准字段库显示状态
  const [showStandardFields, setShowStandardFields] = useState(false);

  // 添加新建表模态框状态
  const [isNewTableModalOpen, setIsNewTableModalOpen] = useState(false);
  const [currentDomainId, setCurrentDomainId] = useState<string>('');
  const [currentDomainName, setCurrentDomainName] = useState<string>('');
  
  // 重命名表模态框状态
  const [isRenameTableModalOpen, setIsRenameTableModalOpen] = useState(false);
  const [tableToRename, setTableToRename] = useState<{id: string, name: string} | null>(null);
  
  // 编辑表模态框状态
  const [isEditTableModalOpen, setIsEditTableModalOpen] = useState(false);
  const [tableToEdit, setTableToEdit] = useState<{id: string, name: string, code: string, comment?: string, domainId: string, type: string} | null>(null);
  
  // 冒泡确认状态
  const [popConfirm, setPopConfirm] = useState({
    visible: false,
    title: '',
    action: '',
    position: { x: 0, y: 0 },
    targetId: ''
  });
  
  // 项目概览显示状态
  const [showProjectOverview, setShowProjectOverview] = useState(true);

  // 菜单引用，用于点击外部关闭
  const menuRef = useRef<HTMLDivElement>(null);

  // 当前选中的菜单项
  const [selectedMenuKey, setSelectedMenuKey] = useState<string>('');

  // 添加本地存储键常量
  const EXPANDED_GROUPS_STORAGE_KEY = 'pdmaner_expanded_menu_groups';

  // 使用单独的useMemo来处理表项，这样就不会导致整个菜单重新渲染
  const domainTables = useMemo(() => {
    // 从项目中提取表项信息
    const result: {[domainId: string]: MenuItem[]} = {};
    
    if (currentProject?.tables && currentProject.tables.length > 0) {
      // 按domainId分组表
      currentProject.tables.forEach(table => {
        if (!result[table.domainId]) {
          result[table.domainId] = [];
        }
        
        result[table.domainId].push({
          key: table.id,
          title: table.name,
          icon: <TableOutlined />,
          path: `/app/table/${table.id}`,
          comment: table.comment,
          code: table.code,
          parentDomainId: table.domainId
        });
      });
    }
    
    return result;
  }, [currentProject?.tables]);

  // 从当前项目获取主题域信息
  useEffect(() => {
    if (currentProject) {
      // 从localStorage加载保存的展开状态
      const savedExpandedGroups = localStorage.getItem(EXPANDED_GROUPS_STORAGE_KEY);
      let defaultExpandedGroups: string[] = [];
      
      if (savedExpandedGroups) {
        try {
          // 如果存在保存的状态，则使用它
          defaultExpandedGroups = JSON.parse(savedExpandedGroups);
          console.log('从localStorage恢复菜单展开状态:', defaultExpandedGroups);
        } catch (e) {
          console.error('解析菜单展开状态出错:', e);
          // 如果解析出错，使用默认值
          defaultExpandedGroups = ['model'];
        }
      } else {
        // 如果没有保存的状态，使用默认值
        defaultExpandedGroups = ['model']; // 默认展开模型组
        
        // 如果项目中有表数据，则默认展开第一个主题域及其数据表菜单
        if (currentProject.tables && currentProject.tables.length > 0) {
          // 获取第一个有表的主题域
          const firstDomainWithTables = currentProject.domains.find(domain => 
            currentProject.tables.some(table => table.domainId === domain.id)
          );
          
          if (firstDomainWithTables) {
            // 添加主题域到展开列表
            const domainKey = `domain_${firstDomainWithTables.id}`;
            defaultExpandedGroups.push(domainKey);
            
            // 添加该主题域下的数据表菜单到展开列表
            defaultExpandedGroups.push(`tables_${firstDomainWithTables.id}`);
          }
        }
      }
      
      setExpandedGroups(defaultExpandedGroups);
      
      // 初始化为项目概览首页
      if (location.pathname === '/app') {
        setShowProjectOverview(true);
      } else {
        setShowProjectOverview(false);
      }
      
      // 根据URL路径设置当前激活的标签页
      const pathSegments = location.pathname.split('/');
      // 如果路径是/app/entity/tables，则设置activeTab为'entity_tables'
      if (pathSegments[2] === 'entity' && pathSegments[3] === 'tables') {
        setActiveTab('entity_tables');
      } else if (pathSegments[2] === 'entity' && pathSegments[3] === 'entities') {
        setActiveTab('entity_entities');
      } else if (pathSegments[2] === 'entity' && pathSegments[3] === 'views') {
        setActiveTab('entity_views');
      } else if (pathSegments[2] === 'diagram') {
        setActiveTab('diagram');
      } else if (pathSegments[2] === 'dict') {
        setActiveTab('dict');
      } else if (pathSegments[2] === 'code') {
        setActiveTab('code');
      } else if (pathSegments[2] === 'table' && pathSegments[3]) {
        // 如果是表详情页，则设置选中的表
        setSelectedTableKey(pathSegments[3]);
      }
    }
  }, [currentProject, location.pathname]);

  // 保存菜单展开状态到localStorage
  useEffect(() => {
    // 只在expandedGroups变化且不为空时保存
    if (expandedGroups.length > 0) {
      localStorage.setItem(EXPANDED_GROUPS_STORAGE_KEY, JSON.stringify(expandedGroups));
      console.log('保存菜单展开状态到localStorage:', expandedGroups);
    }
  }, [expandedGroups]);

  // 设置自动保存
  useEffect(() => {
    let autoSaveInterval: NodeJS.Timeout | null = null;
    
    if (autoSaveEnabled && currentProject) {
      // 设置自动保存，每5分钟保存一次
      autoSaveInterval = setInterval(() => {
        handleSaveProject(true);
      }, 5 * 60 * 1000);
    }
    
    return () => {
      if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
      }
    };
  }, [autoSaveEnabled, currentProject]);

  // 处理点击其他地方关闭上下文菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setContextMenu(prev => ({ ...prev, visible: false }));
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 深度克隆对象（排除React组件）
  const deepCloneWithoutReactElements = (obj: any): any => {
    if (obj === null || typeof obj !== 'object' || React.isValidElement(obj)) {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => deepCloneWithoutReactElements(item));
    }
    
    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (React.isValidElement(obj[key])) {
          // 如果是React元素，只保存一个标记
          result[key] = '[ReactElement]';
        } else {
          result[key] = deepCloneWithoutReactElements(obj[key]);
        }
      }
    }
    
    return result;
  };

  // 将菜单生成逻辑完全重构
  // 使用useMemo优化菜单项的生成
  const menuItems = useMemo(() => {
    return [
      {
        key: 'home',
        title: '项目首页',
        icon: <HomeOutlined />,
        path: '/app'
      },
      {
        key: 'model',
        title: '数据模型',
        icon: <DatabaseOutlined />,
        expanded: expandedGroups.includes('model'),
        children: [
          ...(currentProject?.domains || []).map(domain => ({
            key: `domain_${domain.id}`,
            title: domain.name,
            icon: <FolderOpenOutlined />,
            expanded: expandedGroups.includes(`domain_${domain.id}`),
            id: domain.id,
            code: domain.code,
            children: [
              {
                key: `tables_${domain.id}`,
                title: '数据表',
                icon: <TableOutlined />,
                path: `/app/entity/${domain.id}/tables`,
                expanded: expandedGroups.includes(`tables_${domain.id}`),
                parentDomainId: domain.id,
                // 使用特殊标记而不是直接包含表项
                tablesDomainId: domain.id
              },
              {
                key: `entities_${domain.id}`,
                title: '逻辑实体',
                icon: <TableOutlined />,
                path: `/app/entity/${domain.id}/entities`,
                expanded: expandedGroups.includes(`entities_${domain.id}`),
                parentDomainId: domain.id
              },
              {
                key: `views_${domain.id}`,
                title: '多表透视',
                icon: <TableOutlined />,
                path: `/app/entity/${domain.id}/views`,
                expanded: expandedGroups.includes(`views_${domain.id}`),
                parentDomainId: domain.id
              },
              {
                key: `diagrams_${domain.id}`,
                title: '关系图',
                icon: <BranchesOutlined />,
                path: `/app/diagram/${domain.id}`,
                expanded: expandedGroups.includes(`diagrams_${domain.id}`),
                parentDomainId: domain.id
              },
              {
                key: `dictionaries_${domain.id}`,
                title: '数据字典',
                icon: <BookOutlined />,
                path: `/app/dict/${domain.id}`,
                expanded: expandedGroups.includes(`dictionaries_${domain.id}`),
                parentDomainId: domain.id
              }
            ]
          }))
        ]
      },
      {
        key: 'code',
        title: '代码生成',
        icon: <CodeOutlined />,
        path: '/app/code'
      },
      {
        key: 'projects',
        title: '项目管理',
        icon: <ProjectOutlined />,
        path: '/app/projects'
      }
    ];
  }, [
    // 只有当这些依赖变化时才重新计算，不依赖于表数据
    currentProject?.domains,
    expandedGroups
  ]);

  // 切换菜单项的展开/折叠状态
  const toggleMenuExpand = (menuKey: string) => {
    // 更新expandedGroups状态
    setExpandedGroups(prev => {
      if (prev.includes(menuKey)) {
        // 如果已经展开，则折叠
        return prev.filter(key => key !== menuKey);
      } else {
        // 如果是展开操作，简单添加到展开列表中，不影响其他菜单
        return [...prev, menuKey];
      }
    });
  };

  // 切换侧边栏折叠状态
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  // 切换右侧面板显示状态
  const toggleRightPanel = () => {
    setRightPanelVisible(!rightPanelVisible);
  };

  // 切换暗黑模式
  const handleToggleDarkMode = () => {
    dispatch(toggleDarkMode());
  };

  // 切换自动保存
  const toggleAutoSave = () => {
    setAutoSaveEnabled(!autoSaveEnabled);
  };

  // 返回欢迎页面
  const handleBackToWelcome = () => {
    navigate('/');
  };

  // 保存项目
  const handleSaveProject = (isAutoSave = false) => {
    if (!currentProject) return;

    try {
      // 保存项目数据
      saveProject(currentProject);
      
      // 更新最后保存时间
      setLastSaved(new Date());
      
      if (!isAutoSave) {
        // 显示成功通知
        success('项目保存成功');
      }
    } catch (error) {
      console.error('保存项目失败:', error);
    }
  };

  // 添加主题域
  const handleAddDomain = (code: string, name: string) => {
    if (!currentProject) return;
    
    const domainId = generateUUID();
    const now = Date.now();
    
    // 创建新的主题域
    const newDomain: DomainDataType = {
      id: domainId,
      code,
      name,
      createTime: now,
      lastModified: now
    };
    
    // 更新项目数据
    const updatedProject = {
      ...currentProject,
      domains: [...currentProject.domains, newDomain]
    };
    
    // 更新Redux状态
    dispatch(setCurrentProject(updatedProject));
    
    // 保存到localStorage
    saveProject(updatedProject);
    
    // 添加至expandedGroups
    setExpandedGroups(prev => [...prev, `domain_${domainId}`]);
    
    // 显示成功通知
    success(`主题域 "${name}" 创建成功`);
    
    // 关闭模态框
    setIsNewDomainModalOpen(false);
  };

  // 关闭标签页
  const closeTab = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // 移除该标签
    setTabs(prev => prev.filter(tab => tab.id !== id));
    
    // 如果关闭的是当前激活的标签，则切换到下一个标签
    if (activeTab === id) {
      const remainingTabs = tabs.filter(tab => tab.id !== id);
      if (remainingTabs.length > 0) {
        const newActiveTab = remainingTabs[0];
        setActiveTab(newActiveTab.type);
        navigate(findPathByTabType(newActiveTab.type) || '/app');
      } else {
        // 没有剩余标签，返回首页
        setActiveTab('');
        navigate('/app');
      }
    }
  };

  // 根据标签类型查找对应的路径
  const findPathByTabType = (tabType: string): string | undefined => {
    // 分解tabType，例如'tables_123'分解为['tables', '123']
    const parts = tabType.split('_');
    if (parts.length < 2) return undefined;
    
    const type = parts[0];
    const id = parts.slice(1).join('_'); // 处理ID可能包含下划线的情况
    
    switch (type) {
      case 'tables':
        return `/app/entity/${id}/tables`;
      case 'entities':
        return `/app/entity/${id}/entities`;
      case 'views':
        return `/app/entity/${id}/views`;
      case 'diagrams':
        return `/app/diagram/${id}`;
      case 'dictionaries':
        return `/app/dict/${id}`;
      default:
        return undefined;
    }
  };

  // 菜单项点击导航
  const navigateToMenuItem = (item: MenuItem) => {
    // 如果是首页，直接导航到/app
    if (item.key === 'home') {
      navigate('/app');
      setActiveTab(item.key);
      setTabs([]);
      setShowProjectOverview(true); // 显示项目概览
      return;
    }
    
    // 检查是否是可展开的菜单项（model、domain或子菜单组）
    const isExpandableItem = 
      item.key === 'model' || 
      item.key.startsWith('domain_') || 
      item.key.startsWith('tables_') || 
      item.key.startsWith('entities_') || 
      item.key.startsWith('views_') || 
      item.key.startsWith('diagrams_') || 
      item.key.startsWith('dictionaries_');
    
    // 如果是可展开的菜单项，则切换其展开状态
    if (isExpandableItem) {
      toggleMenuExpand(item.key);
      return;
    }
    
    // 如果有path属性，导航到指定路径
    if (item.path) {
      navigate(item.path);
      setActiveTab(item.key);
      setShowProjectOverview(false); // 隐藏项目概览
      
      // 检查标签页是否已存在
      const existingTab = tabs.find(tab => tab.type === item.key);
      if (!existingTab) {
        // 添加新标签页
        setTabs(prev => [
          ...prev,
          {
            id: item.key,
            title: item.title,
            type: item.key,
            icon: item.icon
          }
        ]);
      }
    }
  };

  // 显示上下文菜单
  const showContextMenu = (event: React.MouseEvent, type: string, targetId?: string) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      type,
      targetId
    });
  };

  // 获取主题域名称
  const getDomainNameById = (id: string): string => {
    if (!currentProject) return '';
    
    const domain = currentProject.domains.find(d => d.id === id);
    return domain ? domain.name : '';
  };

  // 处理上下文菜单操作
  const handleContextMenuAction = (action: string) => {
    // 隐藏上下文菜单
    setContextMenu(prev => ({ ...prev, visible: false }));
    
    // 根据菜单操作类型执行相应的动作
    switch (action) {
      case 'addDomain':
        // 打开添加主题域模态框
        setIsNewDomainModalOpen(true);
        break;
      
      case 'addTable':
        if (contextMenu.targetId) {
          // 从targetId中提取domainId
          const domainId = contextMenu.targetId.split('_').slice(1).join('_');
          const domainName = getDomainNameById(domainId);
          
          // 设置当前主题域ID和名称
          setCurrentDomainId(domainId);
          setCurrentDomainName(domainName);
          
          // 打开添加表模态框
          setIsNewTableModalOpen(true);
        }
        break;
      
      case 'edit':
        // 表编辑操作 - 打开编辑表模态框
        if (contextMenu.targetId && contextMenu.type === 'table' && currentProject) {
          const tableId = contextMenu.targetId;
          
          // 查找表数据
          const table = currentProject.tables.find(t => t.id === tableId);
          if (table) {
            // 设置要编辑的表信息
            setTableToEdit({
              id: table.id,
              name: table.name,
              code: table.code,
              comment: table.comment,
              domainId: table.domainId,
              type: table.type
            });
            
            // 打开编辑表模态框
            setIsEditTableModalOpen(true);
          }
        }
        break;
      
      case 'rename':
        // 表重命名操作
        if (contextMenu.targetId && contextMenu.type === 'table') {
          const tableId = contextMenu.targetId;
          
          // 查找表数据
          const table = currentProject?.tables?.find(t => t.id === tableId);
          if (table) {
            // 设置要重命名的表信息
            setTableToRename({ id: table.id, name: table.name });
            
            // 打开重命名模态框
            setIsRenameTableModalOpen(true);
          }
        }
        break;
      
      case 'copy':
        // 表复制操作
        if (contextMenu.targetId && contextMenu.type === 'table' && currentProject) {
          const tableId = contextMenu.targetId;
          
          // 查找表数据
          const tableToCopy = currentProject.tables.find(t => t.id === tableId);
          if (!tableToCopy) return;
          
          try {
            // 创建表的副本
            const now = Date.now();
            const newTableId = generateUUID();
            
            // 创建新的表对象（深拷贝）
            const newTable = {
              ...JSON.parse(JSON.stringify(tableToCopy)),
              id: newTableId,
              name: `${tableToCopy.name}_copy`, // 名称添加_copy后缀
              code: `${tableToCopy.code}_copy`, // 代码添加_copy后缀
              createTime: now,
              lastModified: now
            };
            
            // 更新项目数据
            const updatedTables = [...currentProject.tables, newTable];
            const updatedProject = {
              ...currentProject,
              tables: updatedTables,
              lastModified: now
            };
            
            // 更新Redux状态
            dispatch(setCurrentProject(updatedProject));
            
            // 保存到localStorage
            saveProject(updatedProject);
            
            // 确保相关菜单展开
            const domainId = newTable.domainId;
            const needExpandDomain = !expandedGroups.includes(`domain_${domainId}`);
            const needExpandTables = !expandedGroups.includes(`tables_${domainId}`);
            
            if (needExpandDomain || needExpandTables) {
              setExpandedGroups(prev => {
                const newExpandedGroups = [...prev];
                
                if (needExpandDomain) {
                  newExpandedGroups.push(`domain_${domainId}`);
                }
                
                if (needExpandTables) {
                  newExpandedGroups.push(`tables_${domainId}`);
                }
                
                return newExpandedGroups;
              });
            }
            
            // 显示成功消息
            success(`表 "${tableToCopy.name}" 已成功复制`);
          } catch (err) {
            console.error('复制表失败:', err);
            error('复制表失败，请检查控制台错误日志');
          }
        }
        break;
      
      case 'delete':
        // 表删除操作
        if (contextMenu.targetId && contextMenu.type === 'table' && currentProject) {
          const tableId = contextMenu.targetId;
          
          // 查找表数据
          const tableToDelete = currentProject.tables.find(t => t.id === tableId);
          if (!tableToDelete) return;
          
          // 显示确认弹窗
          setPopConfirm({
            visible: true,
            title: `确定要删除表 "${tableToDelete.name}" 吗？此操作不可恢复。`,
            action: 'delete',
            position: { x: contextMenu.x, y: contextMenu.y },
            targetId: tableId
          });
        }
        break;
      
      case 'deleteDomain':
        // 主题域删除
        if (contextMenu.targetId && contextMenu.type === 'domain' && currentProject) {
          const domainId = contextMenu.targetId.split('_').slice(1).join('_');
          const domainName = getDomainNameById(domainId);
          
          // 显示确认弹窗
          setPopConfirm({
            visible: true,
            title: `确定要删除主题域 "${domainName}" 吗？删除主题域将同时删除其下所有数据表。`,
            action: 'deleteDomain',
            position: { x: contextMenu.x, y: contextMenu.y },
            targetId: contextMenu.targetId
          });
        }
        break;
      
      // 其他上下文菜单操作...
      
      default:
        // 未实现的操作
        console.log('未实现的菜单操作:', action);
    }
  };

  // 处理表项点击
  const handleTableItemClick = (tableKey: string) => {
    // 防止重复点击同一个表，避免不必要的状态更新和路由切换
    if (selectedTableKey === tableKey) {
      console.log('当前表已选中:', tableKey);
      return;
    }
    
    // 批量更新状态，减少重渲染次数
    const batchedUpdates = () => {
      // 更新选中的表
      setSelectedTableKey(tableKey);
      
      // 查找表数据
      const table = currentProject?.tables?.find(t => t.id === tableKey);
      
      // 检查标签页是否已存在
      const existingTab = tabs.find(tab => tab.type === tableKey);
      if (!existingTab && table) {
        // 添加新标签页
        setTabs(prev => [
          ...prev,
          {
            id: tableKey,
            title: table.name,
            type: tableKey,
            icon: <TableOutlined />
          }
        ]);
      }
      
      // 设置当前激活的标签页
      setActiveTab(tableKey);
    };
    
    // 执行批量更新
    batchedUpdates();
    
    // 导航到表详情页 - 路由变化会在最后执行
    navigate(`/app/table/${tableKey}`);
  };

  // 项目统计信息
  const getProjectStats = (): ProjectStats => {
    if (!currentProject) {
      return {
        entityCount: 0,
        relationCount: 0,
        domainCount: 0,
        diagramCount: 0,
        dictionaryCount: 0
      };
    }
    
    return {
      entityCount: currentProject.tables?.length || 0,
      relationCount: 0, // 需要实现关系计数逻辑
      domainCount: currentProject.domains?.length || 0,
      diagramCount: currentProject.diagrams?.length || 0,
      dictionaryCount: currentProject.dicts?.length || 0
    };
  };

  // 格式化最后保存时间
  const formattedLastSaved = () => {
    if (!lastSaved) return '未保存';
    
    const now = new Date();
    const diff = now.getTime() - lastSaved.getTime();
    
    // 不到一分钟
    if (diff < 60000) {
      return '刚刚';
    }
    
    // 不到一小时
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}分钟前`;
    }
    
    // 不到一天
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}小时前`;
    }
    
    // 否则返回日期
    return lastSaved.toLocaleString();
  };

  // 最大化窗口
  const handleMaximize = () => {
    // 实现窗口最大化逻辑
    if (window.document.fullscreenElement) {
      window.document.exitFullscreen().catch(err => {
        console.error(`Error attempting to exit full-screen mode: ${err.message}`);
      });
    } else {
      const rootElement = document.documentElement;
      if (rootElement.requestFullscreen) {
        rootElement.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
      }
    }
  };

  // 关闭项目
  const handleCloseProject = () => {
    setPopConfirm({
      visible: true,
      title: '确定要关闭当前项目吗？未保存的更改将丢失。',
      action: 'closeProject',
      position: { x: window.innerWidth / 2 - 150, y: window.innerHeight / 2 - 80 },
      targetId: ''
    });
  };

  // 检查当前是否在数据模型相关页面
  const isDataModelPage = () => {
    // 检查路径是否包含 entity, table, diagram 等数据模型相关路径
    const modelRelatedPaths = ['/app/entity', '/app/table', '/app/diagram'];
    return modelRelatedPaths.some(path => location.pathname.startsWith(path));
  };

  // 根据当前路径判断是否显示标准字段库
  useEffect(() => {
    setShowStandardFields(isDataModelPage());
  }, [location.pathname]);

  // 添加导入SQL模态框状态
  const [isImportSQLModalOpen, setIsImportSQLModalOpen] = useState(false);
  
  // 处理导入SQL
  const handleImportSQL = () => {
    setIsImportSQLModalOpen(true);
  };
  
  // 处理导入解析后的SQL结果
  const handleImportSQLResult = (statements: any[], dbType: string) => {
    if (!currentProject) return;
    
    try {
      // 复制当前项目
      const updatedProject = { ...currentProject };
      
      // 查找默认主题域
      let defaultDomain = updatedProject.domains.find(d => d.code === 'default');
      
      // 如果不存在，则创建一个默认主题域
      if (!defaultDomain) {
        const newDomainId = generateUUID();
        defaultDomain = {
          id: newDomainId,
          name: '默认主题域',
          code: 'default',
          createTime: Date.now(),
          lastModified: Date.now()
        };
        
        updatedProject.domains = [...updatedProject.domains, defaultDomain];
      }
      
      // 创建新表并添加到项目
      const newTables = statements.map(stmt => {
        const tableId = generateUUID();
        const now = Date.now();
        
        return {
          id: tableId,
          name: stmt.name,
          code: stmt.code,
          comment: stmt.comment || '',
          domainId: defaultDomain.id,
          type: 'table',
          fields: stmt.fields.map((field: any) => ({
            ...field,
            id: generateUUID() // 确保字段有唯一ID
          })),
          indexes: stmt.indexes.map((index: any) => ({
            ...index,
            id: generateUUID() // 确保索引有唯一ID
          })),
          createTime: now,
          lastModified: now
        };
      });
      
      // 添加新表到项目
      updatedProject.tables = [...updatedProject.tables, ...newTables];
      updatedProject.lastModified = Date.now();
      
      // 更新Redux状态
      dispatch(setCurrentProject(updatedProject));
      
      // 保存到localStorage
      saveProject(updatedProject);
      
      // 确保模型组展开
      if (!expandedGroups.includes('model')) {
        setExpandedGroups(prev => [...prev, 'model']);
      }
      
      // 确保默认主题域展开
      if (!expandedGroups.includes(`domain_${defaultDomain.id}`)) {
        setExpandedGroups(prev => [...prev, `domain_${defaultDomain.id}`]);
      }
      
      // 确保表组展开
      if (!expandedGroups.includes(`tables_${defaultDomain.id}`)) {
        setExpandedGroups(prev => [...prev, `tables_${defaultDomain.id}`]);
      }
      
      // 显示成功消息
      success(`成功导入 ${newTables.length} 个表`);
    } catch (err) {
      console.error('导入SQL失败', err);
      error('导入SQL失败，请检查控制台错误日志');
    }
  };

  return (
    <div className={`app-layout ${darkMode ? 'dark-mode' : ''}`}>
      {/* 头部组件 */}
      <Header 
        projectName={currentProject?.info.name || '未打开项目'}
        onBackToWelcome={handleBackToWelcome}
        onMaximize={handleMaximize}
        onCloseProject={handleCloseProject}
      />

      {/* 主工具栏 */}
      <MainToolbar 
        onSaveProject={() => handleSaveProject()}
        onToggleAutoSave={toggleAutoSave}
        onToggleDarkMode={handleToggleDarkMode}
        onImportSQL={handleImportSQL}
        autoSaveEnabled={autoSaveEnabled}
        darkMode={darkMode}
      />

      <div className="main-container">
        {/* 侧边菜单 - 使用缓存的menuItems而不是每次重新生成 */}
        <SideMenu 
          menuItems={menuItems}
          collapsed={collapsed}
          selectedTableKey={selectedTableKey}
          activeTab={activeTab}
          onToggleCollapsed={toggleCollapsed}
          onToggleMenuExpand={toggleMenuExpand}
          onMenuItemClick={navigateToMenuItem}
          onTableItemClick={handleTableItemClick}
          onContextMenu={showContextMenu}
          domainTables={domainTables}
        />

        <div className="content-area">
          {/* 标签栏 */}
          <TabsBar 
            tabs={tabs}
            activeTab={activeTab}
            onTabClick={(type) => {
              setActiveTab(type);
              navigate(findPathByTabType(type) || '/app');
            }}
            onCloseTab={closeTab}
          />

          {/* 主要内容区域 */}
          <div className="content-container">
            {/* 项目概览 */}
            {showProjectOverview && currentProject && (
              <ProjectOverview 
                projectDetails={{
                  name: currentProject.info.name,
                  desc: currentProject.info.description,
                  version: currentProject.info.version || '1.0.0',
                  createdAt: new Date(currentProject.info.createTime).toISOString(),
                  updatedAt: new Date(currentProject.info.lastModified).toISOString()
                }}
                stats={getProjectStats()}
                isVisible={showProjectOverview}
              />
            )}

            {/* 路由输出内容 */}
            <Outlet />
          </div>
        </div>

        {/* 右侧属性面板 */}
        {rightPanelVisible && (
          <div className="properties-panel">
            <div className="properties-content">
              {/* 属性面板内容 */}
              <div className="property-group">
                <h4>项目属性</h4>
                {/* 项目属性内容 */}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 标准字段库 */}
      {currentProject && showStandardFields && (
        <StandardFieldsLibrary />
      )}

      {/* 状态栏 */}
      <StatusBar 
        projectStatus={`项目状态: ${formattedLastSaved()}`}
        autoSaveEnabled={autoSaveEnabled}
        defaultDb={currentProject?.config?.defaultDb || 'MySQL'}
        version={currentProject?.config?.version || 'v5.0.0'}
      />

      {/* 上下文菜单 */}
      <ContextMenu 
        position={contextMenu}
        onMenuItemClick={handleContextMenuAction}
        onHideMenu={() => setContextMenu(prev => ({ ...prev, visible: false }))}
      />

      {/* 新增主题域模态框 */}
      <NewDomainModal 
        isOpen={isNewDomainModalOpen}
        onClose={() => setIsNewDomainModalOpen(false)}
        onConfirm={handleAddDomain}
      />

      {/* 新增表模态框 */}
      <NewTableModal 
        isOpen={isNewTableModalOpen}
        onClose={() => setIsNewTableModalOpen(false)}
        onConfirm={(code, name, comment, tableType, domainId) => {
          // 处理添加表逻辑
          if (!currentProject) return;
          
          try {
            // 生成表ID
            const tableId = generateUUID();
            const now = Date.now();
            
            // 创建新表对象
            const newTable = {
              id: tableId,
              name,
              code,
              comment,
              domainId,  // 确保使用正确的domainId
              type: tableType,
              fields: [],  // 初始化空字段数组
              indexes: [], // 初始化空索引数组
              createTime: now,
              lastModified: now
            };
            
            // 更新项目数据，添加新表
            const updatedTables = [...currentProject.tables, newTable];
            
            const updatedProject = {
              ...currentProject,
              tables: updatedTables,
              lastModified: Date.now()
            };
            
            // 检查相关菜单项是否已经展开，避免不必要的状态更新
            const needExpandDomain = !expandedGroups.includes(`domain_${domainId}`);
            const needExpandTables = !expandedGroups.includes(`tables_${domainId}`);
            const needExpandModel = !expandedGroups.includes('model');
            
            // 只有在需要展开时才更新expandedGroups状态
            if (needExpandDomain || needExpandTables || needExpandModel) {
              setExpandedGroups(prev => {
                const newExpandedGroups = [...prev];
                
                // 确保模型组展开
                if (needExpandModel) {
                  newExpandedGroups.push('model');
                }
                
                // 确保主题域展开
                if (needExpandDomain) {
                  newExpandedGroups.push(`domain_${domainId}`);
                }
                
                // 确保数据表菜单展开
                if (needExpandTables) {
                  newExpandedGroups.push(`tables_${domainId}`);
                }
                
                return newExpandedGroups;
              });
            }
            
            // 先更新Redux状态，以便domainTables可以获取到最新数据
            dispatch(setCurrentProject(updatedProject));
            
            // 保存到localStorage
            saveProject(updatedProject);
            
            // 添加成功后导航到新建的表页面
            navigate(`/app/table/${tableId}`);
            
            success('表创建成功');
          } catch (err) {
            console.error('创建表失败', err);
            error('创建表失败，请检查控制台错误日志');
          }
          
          // 关闭模态框
          setIsNewTableModalOpen(false);
        }}
        domainId={currentDomainId}
        domainName={currentDomainName}
        existingTableCodes={currentProject?.tables?.map(t => t.code) || []} // 填充已存在的表代码列表
      />

      {/* 重命名表模态框 */}
      <RenameTableModal 
        isOpen={isRenameTableModalOpen}
        onClose={() => setIsRenameTableModalOpen(false)}
        onConfirm={(newName) => {
          // 处理重命名表逻辑
          if (!tableToRename || !currentProject) {
            setIsRenameTableModalOpen(false);
            return;
          }
          
          try {
            // 查找要重命名的表
            const tableIndex = currentProject.tables.findIndex(t => t.id === tableToRename.id);
            if (tableIndex === -1) {
              error('找不到要重命名的表');
              setIsRenameTableModalOpen(false);
              return;
            }
            
            // 创建更新后的表对象
            const updatedTable = {
              ...currentProject.tables[tableIndex],
              name: newName,
              lastModified: Date.now()
            };
            
            // 更新项目数据
            const updatedTables = [...currentProject.tables];
            updatedTables[tableIndex] = updatedTable;
            
            const updatedProject = {
              ...currentProject,
              tables: updatedTables,
              lastModified: Date.now()
            };
            
            // 更新Redux状态
            dispatch(setCurrentProject(updatedProject));
            
            // 保存到localStorage
            saveProject(updatedProject);
            
            // 如果有相关的标签页，也需要更新标签页标题
            setTabs(prev => prev.map(tab => 
              tab.id === tableToRename.id 
                ? { ...tab, title: newName }
                : tab
            ));
            
            // 显示成功消息
            success(`表已重命名为 "${newName}"`);
          } catch (err) {
            console.error('重命名表失败:', err);
            error('重命名表失败，请检查控制台错误日志');
          }
          
          // 关闭模态框并清除状态
          setIsRenameTableModalOpen(false);
          setTableToRename(null);
        }}
        currentName={tableToRename?.name || ''}
      />

      {/* 编辑表模态框 */}
      <EditTableModal 
        isOpen={isEditTableModalOpen}
        onClose={() => setIsEditTableModalOpen(false)}
        onConfirm={(newName, newCode, newComment, newDomainId, newType) => {
          // 处理编辑表逻辑
          if (!tableToEdit || !currentProject) {
            setIsEditTableModalOpen(false);
            return;
          }
          
          try {
            // 查找要编辑的表
            const tableIndex = currentProject.tables.findIndex(t => t.id === tableToEdit.id);
            if (tableIndex === -1) {
              error('找不到要编辑的表');
              setIsEditTableModalOpen(false);
              return;
            }
            
            // 创建更新后的表对象
            const updatedTable = {
              ...currentProject.tables[tableIndex],
              name: newName,
              code: newCode,
              comment: newComment,
              domainId: newDomainId,
              type: newType,
              lastModified: Date.now()
            };
            
            // 更新项目数据
            const updatedTables = [...currentProject.tables];
            updatedTables[tableIndex] = updatedTable;
            
            const updatedProject = {
              ...currentProject,
              tables: updatedTables,
              lastModified: Date.now()
            };
            
            // 更新Redux状态
            dispatch(setCurrentProject(updatedProject));
            
            // 保存到localStorage
            saveProject(updatedProject);
            
            // 如果有相关的标签页，也需要更新标签页标题
            setTabs(prev => prev.map(tab => 
              tab.id === tableToEdit.id 
                ? { ...tab, title: newName }
                : tab
            ));
            
            // 显示成功消息
            success(`表已成功编辑`);
          } catch (err) {
            console.error('编辑表失败:', err);
            error('编辑表失败，请检查控制台错误日志');
          }
          
          // 关闭模态框并清除状态
          setIsEditTableModalOpen(false);
          setTableToEdit(null);
        }}
        table={tableToEdit}
      />
      
      {/* 冒泡确认 */}
      <PopConfirm
        visible={popConfirm.visible}
        title={popConfirm.title}
        position={popConfirm.position}
        onConfirm={() => {
          // 根据操作类型处理确认逻辑
          switch (popConfirm.action) {
            case 'delete':
              // 执行删除表操作
              if (popConfirm.targetId && currentProject) {
                const tableId = popConfirm.targetId;
                const tableToDelete = currentProject.tables.find(t => t.id === tableId);
                
                if (tableToDelete) {
                  try {
                    // 筛选出要保留的表
                    const filteredTables = currentProject.tables.filter(t => t.id !== tableId);
                    
                    // 更新项目数据
                    const updatedProject = {
                      ...currentProject,
                      tables: filteredTables,
                      lastModified: Date.now()
                    };
                    
                    // 更新Redux状态
                    dispatch(setCurrentProject(updatedProject));
                    
                    // 保存到localStorage
                    saveProject(updatedProject);
                    
                    // 如果当前选中的表就是被删除的表，需要清除选中状态
                    if (selectedTableKey === tableId) {
                      setSelectedTableKey('');
                    }
                    
                    // 从标签页中移除该表
                    setTabs(prev => prev.filter(tab => tab.id !== tableId));
                    
                    // 如果当前激活的标签页是被删除的表，需要导航到首页
                    if (activeTab === tableId) {
                      setActiveTab('');
                      navigate('/app');
                    }
                    
                    // 显示成功消息
                    success(`表 "${tableToDelete.name}" 已成功删除`);
                  } catch (err) {
                    console.error('删除表失败:', err);
                    error('删除表失败，请检查控制台错误日志');
                  }
                }
              }
              break;
              
            case 'deleteDomain':
              // 执行删除主题域操作
              if (popConfirm.targetId && currentProject) {
                const domainId = popConfirm.targetId.split('_').slice(1).join('_');
                const domainToDelete = currentProject.domains.find(d => d.id === domainId);
                
                if (domainToDelete) {
                  try {
                    // 筛选出不属于该主题域的表
                    const filteredTables = currentProject.tables.filter(table => table.domainId !== domainId);
                    
                    // 筛选出不是该要删除的主题域
                    const filteredDomains = currentProject.domains.filter(domain => domain.id !== domainId);
                    
                    // 更新项目数据
                    const updatedProject = {
                      ...currentProject,
                      domains: filteredDomains,
                      tables: filteredTables,
                      lastModified: Date.now()
                    };
                    
                    // 更新Redux状态
                    dispatch(setCurrentProject(updatedProject));
                    
                    // 保存到localStorage
                    saveProject(updatedProject);
                    
                    // 关闭所有与该域相关的标签页
                    const domainTables = currentProject.tables.filter(t => t.domainId === domainId);
                    const tableIds = domainTables.map(t => t.id);
                    
                    // 筛选出不在要删除的表中的标签页
                    const filteredTabs = tabs.filter(tab => !tableIds.includes(tab.id));
                    setTabs(filteredTabs);
                    
                    // 如果正在显示的标签页属于被删除的，就切换到首页
                    if (activeTab && tableIds.includes(activeTab)) {
                      setActiveTab('dashboard');
                      navigate('/app/dashboard');
                    }
                    
                    // 展示成功消息
                    success(`主题域 "${domainToDelete.name}" 及其所有数据表已成功删除`);
                  } catch (err) {
                    console.error('删除主题域失败:', err);
                    error('删除主题域失败，请检查控制台错误日志');
                  }
                }
              }
              break;
              
            case 'closeProject':
              // 执行关闭项目操作
              dispatch(setCurrentProject(null));
              // 返回欢迎页面
              navigate('/');
              break;
              
            // 可以添加其他需要确认的操作
              
            default:
              console.log('未处理的确认操作:', popConfirm.action);
          }
          
          // 关闭确认框
          setPopConfirm(prev => ({ ...prev, visible: false }));
        }}
        onCancel={() => {
          // 关闭确认框
          setPopConfirm(prev => ({ ...prev, visible: false }));
        }}
      />

      {/* 导入SQL模态框 */}
      <ImportSQLModal
        isOpen={isImportSQLModalOpen}
        onClose={() => setIsImportSQLModalOpen(false)}
        onImport={handleImportSQLResult}
      />
    </div>
  );
};

export default MainLayout;
