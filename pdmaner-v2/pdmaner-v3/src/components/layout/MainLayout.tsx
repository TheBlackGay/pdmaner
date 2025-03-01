import React, { useState, useEffect, useRef } from 'react';
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
  PlusOutlined,
  SettingOutlined,
  FileTextOutlined,
  DeleteOutlined,
  EditOutlined,
  KeyOutlined,
  BulbOutlined
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
  const [tableItems, setTableItems] = useState<{[domainId: string]: MenuItem[]}>({});
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
  
  // 项目概览显示状态
  const [showProjectOverview, setShowProjectOverview] = useState(true);

  // 菜单引用，用于点击外部关闭
  const menuRef = useRef<HTMLDivElement>(null);

  // 当前选中的菜单项
  const [selectedMenuKey, setSelectedMenuKey] = useState<string>('');

  // 从当前项目获取主题域信息
  useEffect(() => {
    if (currentProject) {
      // 初始化必要的菜单项展开状态
      const defaultExpandedGroups = ['model']; // 默认展开模型组
      
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
      
      setExpandedGroups(defaultExpandedGroups);
      
      // 初始化项目中的表项
      const domainTables: {[domainId: string]: MenuItem[]} = {};
      
      // 表应该从project.tables中获取，而不是domain的属性
      if (currentProject.tables && currentProject.tables.length > 0) {
        // 按domainId分组表
        currentProject.tables.forEach(table => {
          if (!domainTables[table.domainId]) {
            domainTables[table.domainId] = [];
          }
          
          domainTables[table.domainId].push({
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
      
      // 更新tableItems状态
      setTableItems(domainTables);
      
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

  // 获取基础菜单项
  const getFixedMenuItems = (): MenuItem[] => {
    console.log('获取菜单项，当前展开状态:', expandedGroups);
    
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
                children: tableItems[domain.id] || []
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
  };

  // 将菜单分组为固定菜单项
  const getMenuItems = (existingMenuItems?: MenuItem[]): MenuItem[] => {
    // 如果已有菜单项，则优先使用现有的
    if (existingMenuItems) {
      return existingMenuItems;
    }

    return getFixedMenuItems();
  };

  // 检查菜单项是否已展开
  const isMenuItemExpanded = (menuKey: string): boolean => {
    // 找到菜单项
    const findMenuItem = (items: MenuItem[]): boolean => {
      for (const item of items) {
        if (item.key === menuKey) {
          return !!item.expanded;
        }
        if (item.children) {
          const found = findMenuItem(item.children);
          if (found) return true;
        }
      }
      return false;
    };
    
    return findMenuItem(getMenuItems());
  };

  // 切换菜单展开状态
  const toggleMenuExpand = (menuKey: string) => {
    console.log('toggleMenuExpand 被调用:', menuKey);
    
    setExpandedGroups(prevExpandedGroups => {
      // 检查当前菜单是否已经展开
      const isExpanded = prevExpandedGroups.includes(menuKey);
      let newExpandedGroups: string[];

      if (isExpanded) {
        // 如果已展开，则折叠
        console.log('折叠菜单:', menuKey);
        newExpandedGroups = prevExpandedGroups.filter(key => key !== menuKey);
      } else {
        // 如果未展开，则展开
        console.log('展开菜单:', menuKey);

        // 首先，将当前菜单项添加到展开列表
        newExpandedGroups = [...prevExpandedGroups, menuKey];
        
        // 如果是domain_前缀的菜单项，同时展开其下的tables项
        if (menuKey.startsWith('domain_')) {
          const domainId = menuKey.split('_')[1];
          const tablesKey = `tables_${domainId}`;
          if (!newExpandedGroups.includes(tablesKey)) {
            console.log('自动展开数据表菜单:', tablesKey);
            newExpandedGroups.push(tablesKey);
          }
        }
        
        // 特殊处理主题域下的各类菜单项
        const categoryMenuPrefixes = ['tables_', 'entities_', 'views_', 'diagrams_', 'dictionaries_'];
        const clickedPrefix = categoryMenuPrefixes.find(prefix => menuKey.startsWith(prefix));
        
        if (clickedPrefix) {
          // 提取domainId
          const domainId = menuKey.substring(clickedPrefix.length);
          
          // 保持domain菜单的展开状态
          const domainKey = `domain_${domainId}`;
          if (!newExpandedGroups.includes(domainKey)) {
            console.log('确保主题域保持展开:', domainKey);
            newExpandedGroups.push(domainKey);
          }
          
          // 不再关闭同一主题域下的其他菜单项
          // 用户希望能够同时展开多个菜单项
        }
      }
      
      console.log('新的展开状态:', newExpandedGroups);
      return newExpandedGroups;
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
    console.log('导航到菜单项:', item.key, '路径:', item.path);
    
    // 如果是首页，直接导航到/app
    if (item.key === 'home') {
      navigate('/app');
      setActiveTab(item.key);
      setTabs([]);
      setShowProjectOverview(true); // 显示项目概览
      return;
    }
    
    // 如果有path属性，导航到指定路径
    if (item.path) {
      // 记录导航前的展开状态
      const currentExpandedGroups = [...expandedGroups];
      console.log('导航前的展开状态:', currentExpandedGroups);
      
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
      
      // 确保导航后保持相同的展开状态
      if (!expandedGroups.includes(item.key) && item.key.startsWith('domain_')) {
        // 如果导航到主题域相关页面，确保该主题域保持展开
        console.log('确保主题域保持展开:', item.key);
        setExpandedGroups(currentExpandedGroups);
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
      
      case 'rename':
        // 表重命名
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
      
      case 'deleteDomain':
        // 主题域删除
        if (contextMenu.targetId && contextMenu.type === 'domain' && currentProject) {
          const domainId = contextMenu.targetId.split('_').slice(1).join('_');
          
          // 确认是否要删除
          if (window.confirm(`确定要删除主题域 "${getDomainNameById(domainId)}" 吗？删除主题域将同时删除其下所有数据表。`)) {
            // 获取要删除的主题域
            const domainToDelete = currentProject.domains.find(d => d.id === domainId);
            if (!domainToDelete) return;
            
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
      
      // 其他上下文菜单操作...
      
      default:
        // 未实现的操作
        console.log('未实现的菜单操作:', action);
    }
  };

  // 处理表项点击
  const handleTableItemClick = (tableKey: string) => {
    // 记录点击前的展开状态
    const currentExpandedGroups = [...expandedGroups];
    console.log('表项点击前的展开状态:', currentExpandedGroups);
    
    // 防止重复点击同一个表，避免不必要的状态更新和路由切换
    if (selectedTableKey === tableKey) {
      console.log('当前表已选中:', tableKey);
      return;
    }
    
    // 更新选中的表
    setSelectedTableKey(tableKey);
    
    // 查找表数据
    const table = currentProject?.tables?.find(t => t.id === tableKey);
    if (!table) {
      console.error('未找到表数据:', tableKey);
      return;
    }
    
    // 检查标签页是否已存在
    const existingTab = tabs.find(tab => tab.type === tableKey);
    if (!existingTab) {
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
    
    // 导航到表详情页
    navigate(`/app/table/${tableKey}`);
    
    // 确保表所属主题域保持展开
    const domainKey = `domain_${table.domainId}`;
    const tablesKey = `tables_${table.domainId}`;
    
    // 组合新的展开状态，确保包含必要的项并保留其他已展开的项
    let newExpandedGroups = [...currentExpandedGroups];
    
    // 确保必要的项被展开
    if (!newExpandedGroups.includes(domainKey)) {
      newExpandedGroups.push(domainKey);
    }
    if (!newExpandedGroups.includes(tablesKey)) {
      newExpandedGroups.push(tablesKey);
    }
    
    console.log('表项点击后的展开状态:', newExpandedGroups);
    setExpandedGroups(newExpandedGroups);
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
    if (window.confirm('确定要关闭当前项目吗？未保存的更改将丢失。')) {
      // 清除当前项目
      dispatch(setCurrentProject(null));
      // 返回欢迎页面
      navigate('/');
    }
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

  // 导入SQL模态框处理
  const handleOpenSqlImport = () => {
    // 定义SQL导入模态框
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-backdrop visible';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-container';
    modalContent.style.width = '800px';
    modalContent.style.maxWidth = '90vw';
    modalContainer.appendChild(modalContent);
    
    // 添加模态框头部
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    modalHeader.innerHTML = '<h3>解析SQL为数据表</h3>';
    modalContent.appendChild(modalHeader);
    
    // 添加关闭按钮
    const closeButton = document.createElement('button');
    closeButton.className = 'close-btn';
    closeButton.innerHTML = '×';
    closeButton.onclick = () => document.body.removeChild(modalContainer);
    modalHeader.appendChild(closeButton);
    
    // 添加模态框内容
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    modalContent.appendChild(modalBody);
    
    // 添加表单
    const form = document.createElement('form');
    modalBody.appendChild(form);
    
    // 添加SQL输入区
    const formSection = document.createElement('div');
    formSection.className = 'form-section';
    form.appendChild(formSection);
    
    const textareaLabel = document.createElement('label');
    textareaLabel.innerHTML = 'SQL CREATE TABLE语句:';
    textareaLabel.style.display = 'block';
    textareaLabel.style.marginBottom = '8px';
    formSection.appendChild(textareaLabel);
    
    const textareaWrapper = document.createElement('div');
    textareaWrapper.style.position = 'relative';
    formSection.appendChild(textareaWrapper);
    
    const textarea = document.createElement('textarea');
    textarea.style.width = '100%';
    textarea.style.height = '300px';
    textarea.style.padding = '12px';
    textarea.style.fontSize = '14px';
    textarea.style.fontFamily = 'monospace';
    textarea.style.border = '1px solid var(--cyber-neon-blue, #05d9e8)';
    textarea.style.borderRadius = '4px';
    textarea.style.backgroundColor = 'rgba(10, 12, 26, 0.7)';
    textarea.style.color = '#e0e0ff';
    textarea.placeholder = `请输入CREATE TABLE语句，例如：
CREATE TABLE user (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`;
    textareaWrapper.appendChild(textarea);
    
    // 添加SQL示例按钮
    const exampleWrapper = document.createElement('div');
    exampleWrapper.style.marginTop = '8px';
    exampleWrapper.style.textAlign = 'right';
    formSection.appendChild(exampleWrapper);
    
    const exampleButton = document.createElement('button');
    exampleButton.type = 'button';
    exampleButton.className = 'cyber-btn-link';
    exampleButton.innerHTML = '插入示例SQL';
    exampleButton.onclick = () => {
      textarea.value = `CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  date_of_birth DATE,
  gender CHAR(1),
  phone_number VARCHAR(20),
  address TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME,
  role ENUM('admin', 'user', 'guest') DEFAULT 'user',
  CONSTRAINT chk_gender CHECK (gender IN ('M', 'F', 'O'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户信息表';`;
    };
    exampleWrapper.appendChild(exampleButton);
    
    // 添加说明
    const helpText = document.createElement('div');
    helpText.style.marginTop = '16px';
    helpText.style.padding = '12px';
    helpText.style.backgroundColor = 'rgba(5, 217, 232, 0.05)';
    helpText.style.border = '1px solid rgba(5, 217, 232, 0.2)';
    helpText.style.borderRadius = '4px';
    helpText.style.fontSize = '14px';
    helpText.style.lineHeight = '1.5';
    helpText.innerHTML = `
      <p><strong>支持的SQL格式:</strong></p>
      <ul style="padding-left: 20px; margin-top: 8px;">
        <li>标准CREATE TABLE语法</li>
        <li>字段定义 (名称、类型、长度、约束等)</li>
        <li>支持提取PRIMARY KEY、NOT NULL、AUTO_INCREMENT等约束</li>
        <li>支持COMMENT提取为字段注释</li>
      </ul>
      <p style="margin-top: 8px;"><strong>注意:</strong> 解析生成的表将添加到默认主题域</p>
    `;
    formSection.appendChild(helpText);
    
    // 添加模态框底部
    const modalFooter = document.createElement('div');
    modalFooter.className = 'modal-footer';
    modalContent.appendChild(modalFooter);
    
    // 添加取消按钮
    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'cancel-btn';
    cancelButton.innerHTML = '取消';
    cancelButton.onclick = () => document.body.removeChild(modalContainer);
    modalFooter.appendChild(cancelButton);
    
    // 添加解析按钮
    const parseButton = document.createElement('button');
    parseButton.type = 'button';
    parseButton.className = 'confirm-btn';
    parseButton.innerHTML = '解析并创建表';
    parseButton.onclick = () => {
      if (!textarea.value.trim()) {
        error('请输入SQL语句');
        return;
      }
      
      parseSqlToTable(textarea.value);
      document.body.removeChild(modalContainer);
    };
    modalFooter.appendChild(parseButton);
    
    // 添加模态框到body
    document.body.appendChild(modalContainer);
  };
  
  // 解析SQL DDL语句生成表结构
  const parseSqlToTable = (sqlText: string) => {
    try {
      if (!currentProject) {
        error('项目未打开，无法创建表');
        return;
      }
      
      const trimmedSql = sqlText.trim();
      
      // 简单验证是否是CREATE TABLE语句
      if (!trimmedSql.toUpperCase().includes('CREATE TABLE')) {
        error('无效的SQL语句，请使用CREATE TABLE语句');
        return;
      }

      // 从SQL中提取表名
      const tableNameMatch = trimmedSql.match(/CREATE\s+TABLE\s+(?:\w+\.)?([`"']?)(\w+)\1/i);
      const tableName = tableNameMatch ? tableNameMatch[2] : '新建表';
      
      // 提取字段定义
      const fieldsSection = trimmedSql.substring(
        trimmedSql.indexOf('(') + 1, 
        trimmedSql.lastIndexOf(')')
      );
      
      // 按逗号分隔各个字段定义，但忽略括号内的逗号
      const fieldDefinitions: string[] = [];
      let currentField = '';
      let parenthesesCount = 0;
      
      for (let i = 0; i < fieldsSection.length; i++) {
        const char = fieldsSection[i];
        
        if (char === '(') parenthesesCount++;
        else if (char === ')') parenthesesCount--;
        
        if (char === ',' && parenthesesCount === 0) {
          fieldDefinitions.push(currentField.trim());
          currentField = '';
        } else {
          currentField += char;
        }
      }
      
      if (currentField.trim()) {
        fieldDefinitions.push(currentField.trim());
      }
      
      // 过滤掉非字段定义（如约束、索引等）
      const realFieldDefinitions = fieldDefinitions.filter(def => {
        const upperDef = def.toUpperCase();
        return !upperDef.startsWith('PRIMARY KEY') &&
               !upperDef.startsWith('UNIQUE') &&
               !upperDef.startsWith('CONSTRAINT') &&
               !upperDef.startsWith('FOREIGN KEY') &&
               !upperDef.startsWith('CHECK') &&
               !upperDef.startsWith('INDEX');
      });
      
      // 解析字段定义为字段对象
      const fields: any[] = realFieldDefinitions.map(fieldDef => {
        const parts = fieldDef.trim().split(/\s+/);
        const fieldName = parts[0].replace(/[`'"]/g, '');
        
        // 提取类型信息
        const typeMatch = fieldDef.match(/\s+([A-Za-z]+)(?:\(([^)]+)\))?/);
        const fieldType = typeMatch ? typeMatch[1].toUpperCase() : 'VARCHAR';
        
        // 提取长度和小数位
        let fieldLength: number | undefined;
        let fieldScale: number | undefined;
        
        if (typeMatch && typeMatch[2]) {
          const sizeParts = typeMatch[2].split(',');
          fieldLength = parseInt(sizeParts[0]);
          if (sizeParts.length > 1) {
            fieldScale = parseInt(sizeParts[1]);
          }
        }
        
        // 检查是否主键
        const isPrimaryKey = fieldDef.toUpperCase().includes('PRIMARY KEY');
        
        // 检查是否非空
        const isNotNull = fieldDef.toUpperCase().includes('NOT NULL');
        
        // 检查是否自增
        const isAutoIncrement = (
          fieldDef.toUpperCase().includes('AUTO_INCREMENT') ||
          fieldDef.toUpperCase().includes('IDENTITY') ||
          fieldDef.toUpperCase().includes('SERIAL')
        );
        
        // 提取默认值
        const defaultMatch = fieldDef.match(/DEFAULT\s+([^,\s]+)/i);
        const defaultValue = defaultMatch ? defaultMatch[1] : undefined;
        
        // 提取注释
        const commentMatch = fieldDef.match(/COMMENT\s+['"]([^'"]+)['"]/i);
        const comment = commentMatch ? commentMatch[1] : '';
        
        // 生成字段ID
        const fieldId = generateUUID();
        
        return {
          id: fieldId,
          name: fieldName,
          code: fieldName.toLowerCase(),
          type: fieldType,
          length: fieldLength,
          scale: fieldScale,
          primaryKey: isPrimaryKey,
          notNull: isNotNull,
          autoIncrement: isAutoIncrement,
          defaultValue: defaultValue,
          comment: comment
        };
      });
      
      // 创建表并添加到项目
      createTableFromParsedStructure(tableName, fields);
      
    } catch (err) {
      console.error('解析SQL失败:', err);
      error('解析SQL失败，请检查SQL语法');
    }
  };

  // 创建表并添加到默认主题域
  const createTableFromParsedStructure = (tableName: string, fields: any[]) => {
    if (!currentProject) {
      error('项目未打开，无法创建表');
      return;
    }
    
    try {
      // 获取默认主题域
      const defaultDomain = currentProject.domains.find(d => d.code === 'default') || currentProject.domains[0];
      
      if (!defaultDomain) {
        error('未找到默认主题域');
        return;
      }
      
      // 生成表ID和表代码
      const tableId = generateUUID();
      const tableCode = tableName.toLowerCase().replace(/\s+/g, '_');
      const now = Date.now();
      
      // 创建新表对象
      const newTable = {
        id: tableId,
        name: tableName,
        code: tableCode,
        comment: `解析自SQL - ${new Date().toLocaleString()}`,
        domainId: defaultDomain.id,
        type: '业务表',
        fields: fields,
        indexes: [],
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
      
      // 提示成功并跳转到新表
      success(`表 "${tableName}" 成功导入，已添加到 "${defaultDomain.name}" 主题域`);
      navigate(`/app/table/${tableId}`);
      
    } catch (err) {
      console.error('创建表失败:', err);
      error('创建表失败，请检查控制台错误日志');
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
        autoSaveEnabled={autoSaveEnabled}
        darkMode={darkMode}
        onOpenSqlImport={handleOpenSqlImport}
      />

      <div className="main-container">
        {/* 侧边菜单 */}
        <SideMenu 
          menuItems={getMenuItems()}
          collapsed={collapsed}
          selectedTableKey={selectedTableKey}
          activeTab={activeTab}
          onToggleCollapsed={toggleCollapsed}
          onToggleMenuExpand={toggleMenuExpand}
          onMenuItemClick={navigateToMenuItem}
          onTableItemClick={handleTableItemClick}
          onContextMenu={showContextMenu}
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
            // 记录操作前的展开状态
            const currentExpandedGroups = [...expandedGroups];
            console.log('添加表前的展开状态:', currentExpandedGroups);
            
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
            
            // 更新Redux状态
            dispatch(setCurrentProject(updatedProject));
            
            // 保存到localStorage
            saveProject(updatedProject);
            
            // 更新tableItems状态，添加新表项到对应主题域
            const updatedTableItems = { ...tableItems };
            if (!updatedTableItems[domainId]) {
              updatedTableItems[domainId] = [];
            }
            
            updatedTableItems[domainId].push({
              key: tableId,
              title: name,
              icon: <TableOutlined />,
              path: `/app/table/${tableId}`,
              comment: comment,
              code: code,
              parentDomainId: domainId
            });
            
            setTableItems(updatedTableItems);
            
            // 组合新的展开状态，确保包含必要的项
            let newExpandedGroups = [...currentExpandedGroups];
            const domainKey = `domain_${domainId}`;
            const tablesKey = `tables_${domainId}`;
            
            // 确保必要的项被展开
            if (!newExpandedGroups.includes(domainKey)) {
              newExpandedGroups.push(domainKey);
            }
            if (!newExpandedGroups.includes(tablesKey)) {
              newExpandedGroups.push(tablesKey);
            }
            
            console.log('添加表后的展开状态:', newExpandedGroups);
            setExpandedGroups(newExpandedGroups);
            
            // 关闭模态框
            setIsNewTableModalOpen(false);
            
            // 添加成功后导航到新建的表页面
            navigate(`/app/table/${tableId}`);
            
            // 设置当前激活的标签页
            setActiveTab(tableId);
            
            // 添加新标签页
            setTabs(prev => [
              ...prev,
              {
                id: tableId,
                title: name,
                type: tableId,
                icon: <TableOutlined />
              }
            ]);
            
            success('表创建成功');
          } catch (err) {
            console.error('创建表失败', err);
            error('创建表失败，请检查控制台错误日志');
            // 关闭模态框
            setIsNewTableModalOpen(false);
          }
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
          // 这里需要实现重命名表的逻辑
          console.log('重命名表:', tableToRename?.id, newName);
          setIsRenameTableModalOpen(false);
        }}
        currentName={tableToRename?.name || ''}
      />
    </div>
  );
};

export default MainLayout;
