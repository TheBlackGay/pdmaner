import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  TableOutlined,
  ProjectOutlined,
  SettingOutlined,
  BranchesOutlined,
  DatabaseOutlined,
  BookOutlined,
  CodeOutlined,
  FullscreenOutlined,
  SaveOutlined,
  FileAddOutlined,
  FolderOpenOutlined,
  ExportOutlined,
  ImportOutlined,
  ReloadOutlined,
  QuestionCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  SearchOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  AppstoreOutlined,
  ToolOutlined,
  HistoryOutlined,
  AuditOutlined,
  DownOutlined,
  RightOutlined,
  CaretDownOutlined,
  CaretRightOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  EyeOutlined,
  UpOutlined
} from '@ant-design/icons';
import { toggleDarkMode, setLoading, setCurrentProject, updateCurrentProject } from '@store/slices/appSlice';
import { RootState } from '@store/index';
import { ProjectData, DomainData, saveProject, createNewDomain } from '@utils/projectStorage';
import { generateUUID } from '@utils/uuid';
import NewDomainModal from '@components/modals/NewDomainModal';
import NewTableModal from '@components/modals/NewTableModal';
import RenameTableModal from '@components/modals/RenameTableModal';
import './MainLayout.css';

// 菜单项类型定义
interface MenuItem {
  key: string;
  title: string;
  icon: React.ReactNode;
  path?: string;
  children?: MenuItem[];
  expanded?: boolean;
  code?: string; // 表代码
  comment?: string; // 表备注
  parentDomainId?: string; // 所属主题域ID
  id?: string; // 表的唯一ID
}

// 定义表的数据结构
interface TableData {
  id: string;
  name: string; // 表显示名
  code: string; // 表代码
  comment?: string; // 表备注
  domainId: string; // 所属主题域ID
  type: string; // 表类型
  fields: any[]; // 字段数组，暂时为空
  createTime: number;
  lastModified: number;
}

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [rightPanelVisible, setRightPanelVisible] = useState(false);
  const [activeTab, setActiveTab] = useState(''); // 当前激活的标签页
  const [tabs, setTabs] = useState<Array<{id: string, title: string, type: string, icon: React.ReactNode}>>([]);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [contextMenu, setContextMenu] = useState<{visible: boolean, x: number, y: number, type: string, targetId?: string}>({
    visible: false,
    x: 0,
    y: 0,
    type: ''
  });
  const [isNewDomainModalOpen, setIsNewDomainModalOpen] = useState(false);
  const [tableItems, setTableItems] = useState<{[domainId: string]: MenuItem[]}>({});
  const [selectedTableKey, setSelectedTableKey] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]); // 添加展开的组状态

  // 添加新建表模态框状态
  const [isNewTableModalOpen, setIsNewTableModalOpen] = useState(false);
  const [newTableDomainId, setNewTableDomainId] = useState('');
  const [newTableDomainName, setNewTableDomainName] = useState('');

  // 添加重命名表模态框状态
  const [isRenameTableModalOpen, setIsRenameTableModalOpen] = useState(false);
  const [tableToRename, setTableToRename] = useState<{id: string, name: string} | null>(null);

  const darkMode = useSelector((state: RootState) => state.app.darkMode);
  const currentProject = useSelector((state: RootState) => state.app.currentProject);
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // 如果没有选择项目，重定向到欢迎页面
  if (!currentProject) {
    return <Navigate to="/" replace />;
  }

  // 定义固定的菜单项（模型外的其他项）
  const getFixedMenuItems = (): MenuItem[] => {
    return [
      {
        key: 'typeSettings',
        title: '类型设置',
        icon: <SettingOutlined />,
        expanded: false,
        children: [
          {
            key: 'datatype',
            title: '数据类型',
            icon: <AppstoreOutlined />,
            path: '/app/datatype'
          },
          {
            key: 'domains',
            title: '数据域',
            icon: <AppstoreOutlined />,
            path: '/app/domains'
          }
        ]
      },
      {
        key: 'codeGenerator',
        title: '代码生成器',
        icon: <CodeOutlined />,
        expanded: false,
        children: [
          {
            key: 'codeGen',
            title: '生成设置',
            icon: <ToolOutlined />,
            path: '/app/code'
          },
          {
            key: 'templates',
            title: '模板管理',
            icon: <FileAddOutlined />,
            path: '/app/templates'
          }
        ]
      },
      {
        key: 'versionControl',
        title: '版本管理',
        icon: <HistoryOutlined />,
        expanded: false,
        children: [
          {
            key: 'history',
            title: '历史版本',
            icon: <HistoryOutlined />,
            path: '/app/history'
          }
        ]
      },
      {
        key: 'standardCheck',
        title: '规范检查',
        icon: <AuditOutlined />,
        expanded: false,
        children: [
          {
            key: 'checker',
            title: '规范检查器',
            icon: <AuditOutlined />,
            path: '/app/checker'
          },
          {
            key: 'rules',
            title: '规则管理',
            icon: <ToolOutlined />,
            path: '/app/rules'
          }
        ]
      }
    ];
  };

  // 获取完整菜单项，包括主题域
  const getMenuItems = (existingMenuItems?: MenuItem[]): MenuItem[] => {
    // 默认的菜单项
    const menuItems: MenuItem[] = [
      {
        key: 'model',
        title: '模型',
        icon: <DatabaseOutlined />,
        expanded: true,
        children: currentProject.domains.map(domain => {
          // 创建主题域项
          const domainItem: MenuItem = {
            key: `domain_${domain.id}`,
            title: domain.name,
            code: domain.code,
            icon: <FolderOpenOutlined />,
            expanded: false,
            children: [
              {
                key: `tables_${domain.id}`,
                title: '数据表',
                icon: <TableOutlined />,
                path: `/app/entity/${domain.id}/tables`,
                expanded: false,
                children: tableItems[domain.id] || [],
                parentDomainId: domain.id
              },
              {
                key: `entities_${domain.id}`,
                title: '逻辑实体',
                icon: <TableOutlined />,
                path: `/app/entity/${domain.id}/entities`,
                expanded: false,
                children: [],
                parentDomainId: domain.id
              },
              {
                key: `views_${domain.id}`,
                title: '多表透视',
                icon: <TableOutlined />,
                path: `/app/entity/${domain.id}/views`,
                expanded: false,
                children: [],
                parentDomainId: domain.id
              },
              {
                key: `diagrams_${domain.id}`,
                title: '关系图',
                icon: <BranchesOutlined />,
                path: `/app/diagram/${domain.id}`,
                expanded: false,
                children: [],
                parentDomainId: domain.id
              },
              {
                key: `dictionaries_${domain.id}`,
                title: '数据字典',
                icon: <BookOutlined />,
                path: `/app/dict/${domain.id}`,
                expanded: false,
                children: [],
                parentDomainId: domain.id
              }
            ]
          };

          // 检查菜单项的展开状态，保持原有状态
          if (existingMenuItems && existingMenuItems.length > 0) {
            const existingDomainItem = existingMenuItems.find(item => item.key === 'model')
              ?.children?.find(item => item.key === `domain_${domain.id}`);

            if (existingDomainItem?.expanded) {
              domainItem.expanded = true;

              // 同时保持子项的展开状态
              if (existingDomainItem.children && domainItem.children) {
                for (let i = 0; i < existingDomainItem.children.length; i++) {
                  if (i < domainItem.children.length) {
                    const existingChild = existingDomainItem.children[i];
                    const newChild = domainItem.children[i];

                    if (existingChild?.key === newChild?.key) {
                      newChild.expanded = existingChild.expanded;
                    }
                  }
                }
              }
            }
          }

          return domainItem;
        })
      },
      ...getFixedMenuItems()
    ];

    return menuItems;
  };

  // 生成菜单项
  const [menuItems, setMenuItems] = useState<MenuItem[]>(getMenuItems());

  // 更新菜单项
  useEffect(() => {
    console.log('更新菜单项', currentProject?.domains?.length);
    setMenuItems(prevItems => getMenuItems(prevItems));
  }, [currentProject?.domains, tableItems]); // 添加tableItems作为依赖项，确保表数据更新时菜单也更新

  // 监听路由变化，处理表详情页面的加载
  useEffect(() => {
    const path = location.pathname;
    console.log('路由变化:', path);
    
    // 首页重定向到实体列表
    if (path === '/app') {
      navigate('/app/entity/tables');
      return;
    }
    
    // 如果是表详情页面
    if (path.startsWith('/app/table/')) {
      const tableId = path.split('/').pop();
      if (tableId && currentProject?.tables) {
        // 查找对应的表
        const table = currentProject.tables.find(t => t.id === tableId);
        if (table) {
          console.log('找到对应表数据:', table.name);
          
          // 设置选中的表
          const tableKey = `table_${tableId}`;
          
          // 只有表项发生变化时才更新选中状态和创建新标签页
          if (selectedTableKey !== tableKey) {
            console.log('选中表项变化，更新状态', selectedTableKey, '->', tableKey);
            setSelectedTableKey(tableKey);
          
            // 创建对应的标签页
            const tabExists = tabs.some(t => t.type === tableKey);
            if (!tabExists) {
              const newTab = {
                id: `tab_${Date.now()}`,
                title: table.name,
                type: tableKey,
                icon: <TableOutlined />
              };
              setTabs(prev => [...prev, newTab]);
              setActiveTab(tableKey);
            } else {
              // 切换到已有标签页
              setActiveTab(tableKey);
            }
            
            // 展开对应的菜单项（仅在表发生变化时执行）
            const domainId = table.domainId;
            if (domainId) {
              // 使用setTimeout避免菜单重复展开导致的闪烁
              setTimeout(() => {
                // 展开模型菜单
                const modelKey = 'model';
                if (!isMenuItemExpanded(modelKey)) {
                  toggleMenuExpand(modelKey);
                }
                
                // 展开主题域菜单
                const domainKey = `domain_${domainId}`;
                if (!isMenuItemExpanded(domainKey)) {
                  toggleMenuExpand(domainKey);
                }
                
                // 展开表菜单
                const tablesKey = `tables_${domainId}`;
                if (!isMenuItemExpanded(tablesKey)) {
                  toggleMenuExpand(tablesKey);
                }
              }, 50);
            }
          } else {
            console.log('表项未变化，不更新菜单状态');
          }
        } else {
          console.error(`找不到ID为 ${tableId} 的表`);
          alert(`找不到ID为 ${tableId} 的表，可能已被删除`);
          navigate('/app/entity/tables');
        }
      }
    }
  }, [location.pathname]); // 只在路径变化时触发，不再依赖currentProject

  // 判断菜单项是否已展开
  const isMenuItemExpanded = (menuKey: string): boolean => {
    // 递归查找菜单项
    const findMenuItem = (items: MenuItem[]): boolean => {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
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
    
    return findMenuItem(menuItems);
  };

  // 自动保存功能
  useEffect(() => {
    if (!autoSaveEnabled || !currentProject) return;

    const autoSaveInterval = setInterval(() => {
      if (currentProject) {
        console.log('自动保存项目...');
        handleSaveProject(true);
      }
    }, 30000); // 每30秒自动保存一次

    return () => clearInterval(autoSaveInterval);
  }, [autoSaveEnabled, currentProject]);

  // 监听点击事件关闭上下文菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(prev => ({...prev, visible: false}));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 安全的深拷贝函数，排除React元素等不可序列化的属性
  const deepCloneWithoutReactElements = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    // 特殊处理数组
    if (Array.isArray(obj)) {
      return obj.map(item => deepCloneWithoutReactElements(item));
    }

    // 创建新对象
    const cloned: any = {};
    for (const key in obj) {
      // 跳过React元素和函数
      if (key === 'icon' || typeof obj[key] === 'function' || React.isValidElement(obj[key])) {
        cloned[key] = obj[key]; // 直接引用，不深拷贝
      } else {
        cloned[key] = deepCloneWithoutReactElements(obj[key]);
      }
    }
    return cloned;
  };

  // 切换菜单展开状态
  const toggleMenuExpand = (menuKey: string) => {
    setMenuItems(prevItems => {
      // 使用安全的深拷贝函数
      const newItems = deepCloneWithoutReactElements(prevItems);

      // 递归处理菜单项
      const processItems = (items: MenuItem[]): boolean => {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];

          // 如果找到匹配的菜单项，则切换其展开状态
          if (item.key === menuKey) {
            item.expanded = !item.expanded;
            return true;
          }

          // 递归处理子菜单项
          if (item.children && item.children.length > 0) {
            if (processItems(item.children)) {
              return true;
            }
          }
        }
        return false;
      };

      processItems(newItems);
      return newItems;
    });
  };

  // 切换菜单组展开状态
  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      if (prev.includes(groupKey)) {
        return prev.filter(key => key !== groupKey);
      } else {
        return [...prev, groupKey];
      }
    });
  };

  const getTabIcon = (type: string) => {
    // 查找菜单项对应的图标
    for (const group of menuItems) {
      if (group.children) {
        for (const item of group.children) {
          if (item.key === type) {
            return item.icon;
          }
          if (item.children) {
            const subItem = item.children.find(sub => sub.key === type);
            if (subItem) {
              return subItem.icon;
            }
          }
        }
      }
    }

    // 默认图标
    return <HomeOutlined />;
  };

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const toggleRightPanel = () => {
    setRightPanelVisible(!rightPanelVisible);
  };

  const handleToggleDarkMode = () => {
    dispatch(toggleDarkMode());
  };

  const toggleAutoSave = () => {
    setAutoSaveEnabled(!autoSaveEnabled);
  };

  // 返回欢迎页面
  const handleBackToWelcome = () => {
    navigate('/');
  };

  // 保存项目
  const handleSaveProject = (isAutoSave = false) => {
    console.log(`${isAutoSave ? '自动' : ''}保存项目`);
    if (!isAutoSave) dispatch(setLoading(true));

    // 保存项目数据
    if (currentProject) {
      try {
        saveProject(currentProject);
        setLastSaved(new Date());
      } catch (error) {
        console.error('保存项目失败', error);
      } finally {
        if (!isAutoSave) dispatch(setLoading(false));
      }
    }
  };

  // 新建主题域
  const handleAddDomain = (code: string, name: string) => {
    if (currentProject) {
      try {
        // 检查是否存在相同代码或名称的主题域
        const domainCodeExists = currentProject.domains.some(domain => domain.code === code);
        const domainNameExists = currentProject.domains.some(domain => domain.name === name);

        if (domainCodeExists) {
          alert(`主题域代码 "${code}" 已存在，请使用其他代码`);
          return;
        }

        if (domainNameExists) {
          alert(`主题域名称 "${name}" 已存在，请使用其他名称`);
          return;
        }

        const newDomain = createNewDomain(currentProject.info.id, name, code);
        if (newDomain) {
          // 创建新的项目对象（安全拷贝）
          const updatedProject = {
            ...currentProject,
            domains: [...currentProject.domains, newDomain]
          };

          console.log('添加新主题域:', newDomain);
          console.log('当前主题域数量:', currentProject.domains.length);
          console.log('更新后主题域数量:', updatedProject.domains.length);

          // 更新Redux状态
          dispatch(setCurrentProject(updatedProject));

          // 保存到localStorage
          saveProject(updatedProject);
          setLastSaved(new Date());
          console.log('保存项目成功，已添加新主题域');

          // 关闭模态框
          setIsNewDomainModalOpen(false);
        } else {
          throw new Error('创建主题域失败');
        }
      } catch (error) {
        console.error('保存项目失败:', error);
        alert('创建主题域失败，请检查控制台错误日志');
      }
    }
  };

  // 关闭标签页
  const closeTab = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const newTabs = tabs.filter(tab => tab.id !== id);
    setTabs(newTabs);

    // 如果关闭的是当前激活的标签，则激活最后一个标签
    if (tabs.find(tab => tab.id === id)?.type === activeTab) {
      if (newTabs.length > 0) {
        const lastTab = newTabs[newTabs.length - 1];
        setActiveTab(lastTab.type);

        // 查找该标签对应的路径并导航
        const path = findPathByTabType(lastTab.type);
        if (path) {
          navigate(path);
        } else {
          navigate('/app/entity/tables');
        }
      } else {
        navigate('/app/entity/tables');
      }
    }
  };

  // 根据标签类型查找路径
  const findPathByTabType = (tabType: string): string | undefined => {
    for (const group of menuItems) {
      if (group.children) {
        for (const item of group.children) {
          if (item.key === tabType && item.path) {
            return item.path;
          }
          if (item.children) {
            const subItem = item.children.find(sub => sub.key === tabType);
            if (subItem && subItem.path) {
              return subItem.path;
            }
          }
        }
      }
    }
    return undefined;
  };

  // 根据菜单项导航
  const navigateToMenuItem = (item: MenuItem) => {
    if (item.path) {
      navigate(item.path);
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
    if (!currentProject) {
      console.error('当前项目为空，无法获取主题域');
      return '';
    }

    if (!Array.isArray(currentProject.domains)) {
      console.error('currentProject.domains 不是一个数组:', currentProject.domains);
      return '';
    }

    console.log('查找主题域:', id);
    console.log('可用主题域:', currentProject.domains.map(d => `${d.name}(${d.id})`).join(', '));

    const domain = currentProject.domains.find(d => d.id === id);
    if (!domain) {
      console.error(`找不到ID为 ${id} 的主题域`);
      return '';
    }

    return domain.name;
  };

  // 处理新建表确认
  const handleAddTableConfirm = (code: string, name: string, comment: string, tableType: string, domainId: string) => {
    if (!currentProject) {
      console.error('当前项目为空，无法添加新表');
      alert('当前没有打开的项目，请先创建或打开一个项目');
      return;
    }

    try {
      // 生成唯一ID
      const tableId = generateUUID();
      const now = Date.now();

      // 创建新表数据
      const newTableData: TableData = {
        id: tableId,
        name: name,
        code: code,
        comment: comment,
        domainId: domainId,
        type: tableType,
        fields: [],
        createTime: now,
        lastModified: now
      };

      // 创建新表菜单项
      const newTable: MenuItem = {
        key: `table_${tableId}`,
        id: tableId,
        title: name,
        code: code,
        comment: comment,
        icon: <TableOutlined />,
        parentDomainId: domainId
      };

      // 更新tableItems状态
      setTableItems(prev => {
        const newTableItems = { ...prev };
        if (!newTableItems[domainId]) {
          newTableItems[domainId] = [];
        }
        newTableItems[domainId] = [...newTableItems[domainId], newTable];
        return newTableItems;
      });

      // 确保对应的"数据表"菜单是展开的
      toggleMenuExpand(`tables_${domainId}`);

      // 安全地创建项目更新数据
      const currentTablesCopy = [...(currentProject.tables || [])];
      const updatedTables = [...currentTablesCopy, newTableData];

      console.log('添加新表:', newTableData);
      console.log('当前表数量:', currentTablesCopy.length);
      console.log('更新后表数量:', updatedTables.length);

      // 更新项目数据
      const updatedProject = {
        ...currentProject,
        tables: updatedTables,
        lastModified: now
      };

      // 更新Redux状态
      dispatch(setCurrentProject(updatedProject));

      // 保存到localStorage
      saveProject(updatedProject);
      setLastSaved(new Date());
      console.log('保存项目成功，已添加新表');

      // 关闭新建表模态框
      setIsNewTableModalOpen(false);

      // 等待状态更新后，确保菜单被正确展开
      setTimeout(() => {
        const domainKey = `domain_${domainId}`;
        const tablesKey = `tables_${domainId}`;

        // 确保主题域和表菜单都是展开的
        toggleMenuExpand(domainKey);
        toggleMenuExpand(tablesKey);
      }, 300);
    } catch (error) {
      console.error('保存项目失败:', error);
      alert('创建表失败，请检查控制台错误日志');
    }
  };

  // 处理上下文菜单项点击
  const handleContextMenuAction = (action: string) => {
    const { type, targetId } = contextMenu;
    console.log(`执行操作: ${action}, 类型: ${type}, 目标ID: ${targetId}`);

    // 隐藏上下文菜单
    setContextMenu(prev => ({...prev, visible: false}));

    // 根据动作类型执行不同操作
    switch(action) {
      case 'addDomain':
        setIsNewDomainModalOpen(true);
        break;
      case 'copy':
        // 复制实体/关系图等
        if (type === 'table' && targetId) {
          const tableId = targetId.split('_')[1];
          if (tableId && currentProject) {
            // 找到要复制的表
            const tableToCopy = currentProject.tables.find(table => table.id === tableId);
            if (tableToCopy) {
              // 生成新的唯一ID
              const newTableId = generateUUID();
              const now = Date.now();

              // 创建新表的复制品
              const newTable = {
                ...tableToCopy,
                id: newTableId,
                name: `${tableToCopy.name} (副本)`,
                code: `${tableToCopy.code}_copy`,
                createTime: now,
                lastModified: now
              };

              // 更新项目表数据
              const updatedTables = [...currentProject.tables, newTable];

              // 创建更新后的项目对象
              const updatedProject = {
                ...currentProject,
                tables: updatedTables,
                lastModified: now
              };

              // 更新Redux状态
              dispatch(setCurrentProject(updatedProject));

              // 保存到localStorage
              saveProject(updatedProject);

              // 创建新表菜单项
              const newTableMenuItem: MenuItem = {
                key: `table_${newTableId}`,
                id: newTableId,
                title: newTable.name,
                code: newTable.code,
                comment: newTable.comment,
                icon: <TableOutlined />,
                parentDomainId: newTable.domainId
              };

              // 更新tableItems，添加复制的表
              setTableItems(prev => {
                const newTableItems = {...prev};
                if (!newTableItems[newTable.domainId]) {
                  newTableItems[newTable.domainId] = [];
                }
                newTableItems[newTable.domainId] = [...newTableItems[newTable.domainId], newTableMenuItem];
                return newTableItems;
              });

              // 确保对应的"数据表"菜单是展开的
              toggleMenuExpand(`tables_${newTable.domainId}`);

              console.log(`表 ${tableId} 已复制为 ${newTableId}`);
            }
          }
        }
        break;
      case 'delete':
        if (type === 'table' && targetId) {
          // 删除表
          if (window.confirm('确定要删除这个表吗？此操作不可恢复。')) {
            const tableId = targetId.split('_')[1];
            if (tableId && currentProject) {
              // 过滤掉要删除的表
              const updatedTables = currentProject.tables.filter(table => table.id !== tableId);

              // 创建更新后的项目对象
              const updatedProject = {
                ...currentProject,
                tables: updatedTables,
                lastModified: Date.now()
              };

              // 更新Redux状态
              dispatch(setCurrentProject(updatedProject));

              // 保存到localStorage
              saveProject(updatedProject);

              // 更新tableItems，移除被删除的表
              setTableItems(prev => {
                const newTableItems = {...prev};
                for (const domainId in newTableItems) {
                  newTableItems[domainId] = newTableItems[domainId].filter(item => item.id !== tableId);
                }
                return newTableItems;
              });

              // 如果当前在该表的详情页，则返回到实体列表页
              if (location.pathname.includes(`/app/table/${tableId}`)) {
                const tableInfo = getSelectedTable();
                if (tableInfo && tableInfo.parentDomainId) {
                  navigate(`/app/entity/${tableInfo.parentDomainId}/tables`);
                } else {
                  navigate('/app/entity/tables');
                }
              }

              console.log(`表 ${tableId} 已删除`);
            }
          }
        }
        break;
      case 'rename':
        if (type === 'table' && targetId) {
          const tableId = targetId.split('_')[1];
          if (tableId && currentProject) {
            // 找到要重命名的表
            const tableToRename = currentProject.tables.find(table => table.id === tableId);
            if (tableToRename) {
              // 设置要重命名的表信息并打开模态框
              setTableToRename({
                id: tableId,
                name: tableToRename.name
              });
              setIsRenameTableModalOpen(true);
            }
          }
        }
        break;
      case 'edit':
        if (type === 'table' && targetId) {
          // 编辑表 - 导航到表详情页
          const tableId = targetId.split('_')[1];
          if (tableId) {
            navigate(`/app/table/${tableId}`);
          }
        } else {
          // 其他类型的编辑
          navigate(`/app/${type}`);
        }
        break;
      case 'addSubItem':
        // 新增子项
        break;
      case 'editDomain':
        // 编辑主题域
        break;
      case 'clearDomain':
        // 清空主题域
        break;
      case 'deleteDomain':
        // 删除主题域
        break;
      case 'addTable':
        // 提取所属主题域ID
        if (targetId && targetId.includes('_')) {
          console.log('添加表的targetId:', targetId);
          let domainId: string | undefined;

          // 处理不同情况的targetId格式
          if (targetId.startsWith('tables_')) {
            // 如果是形如tables_123这样的格式
            domainId = targetId.split('_')[1];
          } else if (targetId.startsWith('domain_')) {
            // 如果是形如domain_123这样的格式
            domainId = targetId.split('_')[1];
          } else {
            // 尝试获取父级主题域ID
            const parts = targetId.split('_');
            if (parts.length >= 2) {
              domainId = parts[1];
            }
          }

          if (domainId) {
            const domainName = getDomainNameById(domainId);

            if (domainName) {
              console.log(`为主题域 ${domainName}(${domainId}) 添加新表`);
              // 设置新表所属主题域
              setNewTableDomainId(domainId);
              setNewTableDomainName(domainName);

              // 打开新建表模态框
              setIsNewTableModalOpen(true);
            } else {
              console.error(`找不到ID为 ${domainId} 的主题域`);
              alert('无法找到指定的主题域，请尝试刷新页面');
            }
          } else {
            console.error('无法从targetId解析出domainId:', targetId);
            alert('无法识别所选主题域，请尝试刷新页面');
          }
        }
        break;
      case 'copyTables':
        // 复制数据表
        break;
      case 'cutTables':
        // 剪切数据表
        break;
      case 'pasteTables':
        // 粘贴数据表
        break;
      case 'deleteTables':
        // 删除数据表
        break;
      case 'addEntity':
        // 新增逻辑实体
        break;
      case 'copyEntities':
        // 复制逻辑实体
        break;
      case 'cutEntities':
        // 剪切逻辑实体
        break;
      case 'pasteEntities':
        // 粘贴逻辑实体
        break;
      case 'deleteEntities':
        // 删除逻辑实体
        break;
      case 'addView':
        // 新增多表透视
        break;
      case 'copyViews':
        // 复制多表透视
        break;
      case 'cutViews':
        // 剪切多表透视
        break;
      case 'pasteViews':
        // 粘贴多表透视
        break;
      case 'deleteViews':
        // 删除多表透视
        break;
      case 'addDiagram':
        // 新增关系图
        break;
      case 'copyDiagrams':
        // 复制关系图
        break;
      case 'cutDiagrams':
        // 剪切关系图
        break;
      case 'pasteDiagrams':
        // 粘贴关系图
        break;
      case 'exportDiagramsPNG':
        // 导出为PNG关系图
        break;
      case 'exportDiagramsSVG':
        // 导出为SVG关系图
        break;
      case 'addDictionary':
        // 新增数据字典
        break;
      case 'copyDictionaries':
        // 复制数据字典
        break;
      case 'cutDictionaries':
        // 剪切数据字典
        break;
      case 'pasteDictionaries':
        // 粘贴数据字典
        break;
      case 'deleteDictionaries':
        // 删除数据字典
        break;
      default:
        break;
    }
  };

  // 获取当前路径对应的面包屑文本
  const getBreadcrumbText = () => {
    const path = location.pathname;

    for (const group of menuItems) {
      if (group.children) {
        for (const item of group.children) {
          if (item.path && path.startsWith(item.path)) {
            return `${group.title} / ${item.title}`;
          }
          if (item.children) {
            for (const subItem of item.children) {
              if (subItem.path && path.startsWith(subItem.path)) {
                return `${group.title} / ${item.title} / ${subItem.title}`;
              }
            }
          }
        }
      }
    }

    return '未知页面';
  };

  // 格式化最后保存时间
  const formattedLastSaved = () => {
    if (!lastSaved) return '尚未保存';

    const now = new Date();
    const diff = now.getTime() - lastSaved.getTime();

    if (diff < 60000) { // 小于1分钟
      return '刚刚保存';
    } else if (diff < 3600000) { // 小于1小时
      return `${Math.floor(diff / 60000)}分钟前保存`;
    } else if (diff < 86400000) { // 小于1天
      return `${Math.floor(diff / 3600000)}小时前保存`;
    } else {
      return `${lastSaved.getMonth() + 1}月${lastSaved.getDate()}日 ${lastSaved.getHours()}:${lastSaved.getMinutes().toString().padStart(2, '0')}保存`;
    }
  };

  // 渲染三级菜单项
  const renderMenuItems = (items: MenuItem[], parentKey?: string) => {
    return items.map(item => (
      <div
        key={item.key}
        className={`menu-item ${activeTab === item.key ? 'active' : ''}`}
        onClick={() => navigateToMenuItem(item)}
      >
        {React.isValidElement(item.icon) ? item.icon : null}
        <span>{item.title}</span>
      </div>
    ));
  };

  // 添加处理表项点击的函数
  const handleTableItemClick = (tableKey: string) => {
    // 如果点击的是已经选中的表，不需要执行后续操作
    if (selectedTableKey === tableKey) {
      return;
    }
    
    console.log('表格点击事件:', tableKey);
    setSelectedTableKey(tableKey);
    // 显示右侧属性面板
    setRightPanelVisible(true);

    // 从tableKey中提取tableId，tableKey格式为table_xxx
    const tableId = tableKey.split('_')[1];
    if (tableId) {
      console.log('提取到表ID:', tableId);
      
      // 查找表数据以获取表名
      let tableName = '';
      if (currentProject && currentProject.tables) {
        const tableData = currentProject.tables.find(t => t.id === tableId);
        if (tableData) {
          tableName = tableData.name;
        }
      }
      
      // 创建或激活标签页
      const existingTabIndex = tabs.findIndex(tab => tab.type === tableKey);
      if (existingTabIndex === -1) {
        // 创建新标签页
        const newTab = {
          id: `tab_${Date.now()}`,
          title: tableName || `表${tableId}`,
          type: tableKey,
          icon: <TableOutlined />
        };
        setTabs(prev => [...prev, newTab]);
      }
      
      // 设置当前激活的标签页
      setActiveTab(tableKey);
      
      // 导航到表设计详情页面
      console.log('导航到表详情页:', `/app/table/${tableId}`);
      navigate(`/app/table/${tableId}`);
    } else {
      console.error('无法从tableKey中提取tableId:', tableKey);
    }
  };

  // 从tableItems中获取选中表的信息
  const getSelectedTable = (): MenuItem | null => {
    if (!selectedTableKey) return null;

    // 遍历所有主题域下的表项
    for (const domainId in tableItems) {
      const foundTable = tableItems[domainId].find(table => table.key === selectedTableKey);
      if (foundTable) return foundTable;
    }

    return null;
  };

  // 右侧面板展示当前选中表的详细信息
  const renderTableProperties = () => {
    const selectedTable = getSelectedTable();
    if (!selectedTable) return null;

    return (
      <div className="properties-content">
        <div className="property-group">
          <h4>基本信息</h4>
          <div className="property-item">
            <label>表名:</label>
            <input type="text" value={selectedTable.code || ''} onChange={() => {}} />
          </div>
          <div className="property-item">
            <label>显示名:</label>
            <input type="text" value={selectedTable.title || ''} onChange={() => {}} />
          </div>
          <div className="property-item">
            <label>备注:</label>
            <input type="text" value={selectedTable.comment || ''} onChange={() => {}} />
          </div>
        </div>

        <div className="property-group">
          <h4>字段信息</h4>
          <div className="field-list">
            <table className="field-table">
              <thead>
                <tr>
                  <th>字段名</th>
                  <th>类型</th>
                  <th>长度</th>
                  <th>主键</th>
                  <th>不为空</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={5} style={{textAlign: 'center', padding: '10px'}}>
                    暂无字段，请添加
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="add-field-button" style={{marginTop: '10px', textAlign: 'center'}}>
              <button
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#1890ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                <PlusOutlined /> 添加字段
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 在组件加载后从当前项目数据中初始化tableItems
  useEffect(() => {
    if (currentProject) {
      console.log('初始化项目数据: ', currentProject.info.name);

      // 确保tables数组存在
      if (!currentProject.tables) {
        const updatedProject = {...currentProject, tables: []};
        dispatch(setCurrentProject(updatedProject));
        return; // 等待下一次渲染循环
      }

      // 确保diagrams数组存在
      if (!currentProject.diagrams) {
        const updatedProject = {...currentProject, diagrams: []};
        dispatch(setCurrentProject(updatedProject));
        return; // 等待下一次渲染循环
      }

      // 确保dictionaries数组存在
      if (!currentProject.dictionaries) {
        const updatedProject = {...currentProject, dictionaries: []};
        dispatch(setCurrentProject(updatedProject));
        return; // 等待下一次渲染循环
      }

      // 将项目中的表按主题域分组
      const tablesByDomain: {[domainId: string]: MenuItem[]} = {};

      console.log('项目表数据:', currentProject.tables?.length || 0);

      if (currentProject.tables && currentProject.tables.length > 0) {
        currentProject.tables.forEach(table => {
          const menuItem: MenuItem = {
            key: `table_${table.id}`,
            id: table.id,
            title: table.name,
            code: table.code,
            comment: table.comment,
            icon: <TableOutlined />,
            parentDomainId: table.domainId
          };

          if (!tablesByDomain[table.domainId]) {
            tablesByDomain[table.domainId] = [];
          }

          tablesByDomain[table.domainId].push(menuItem);
        });

        console.log('按主题域分组后的表:', Object.keys(tablesByDomain).map(k => `${k}: ${tablesByDomain[k].length}表`));
      }

      setTableItems(tablesByDomain);

      // 检查当前URL是否为表详情页
      const path = location.pathname;
      const match = path.match(/\/app\/table\/([^\/]+)/);
      if (match && match[1]) {
        const tableId = match[1];
        console.log('当前URL是表详情页，tableId:', tableId);

        // 找到对应的表菜单项
        for (const domainId in tablesByDomain) {
          const foundTable = tablesByDomain[domainId].find(item => item.id === tableId);
          if (foundTable) {
            console.log('找到当前表的菜单项:', foundTable);
            setSelectedTableKey(foundTable.key);

            // 确保主题域和表列表被展开
            setTimeout(() => {
              const domainKey = `domain_${domainId}`;
              const tablesKey = `tables_${domainId}`;

              console.log('自动展开菜单:', domainKey, tablesKey);
              toggleMenuExpand(domainKey);
              toggleMenuExpand(tablesKey);
            }, 100);

            break;
          }
        }
      }

      // 使用setTimeout确保在下一个渲染周期执行
      setTimeout(() => {
        // 更新菜单项并默认展开"模型"和第一个主题域
        setMenuItems(prevItems => {
          // 创建一个安全的深拷贝
          const newItems = deepCloneWithoutReactElements(prevItems);

          // 找到并展开模型菜单
          const modelItem = newItems.find(item => item.key === 'model');
          if (modelItem) {
            modelItem.expanded = true;

            // 如果有主题域，默认展开第一个
            if (currentProject.domains.length > 0 && modelItem.children) {
              const firstDomain = currentProject.domains[0];
              const domainItem = modelItem.children.find(item => item.key === `domain_${firstDomain.id}`);

              if (domainItem) {
                domainItem.expanded = true;

                // 展开数据表节点
                if (domainItem.children) {
                  const tablesItem = domainItem.children.find(item => item.key === `tables_${firstDomain.id}`);
                  if (tablesItem) {
                    tablesItem.expanded = true;
                    console.log('自动展开节点:', `domain_${firstDomain.id}`, `tables_${firstDomain.id}`);
                  }
                }
              }
            }
          }

          return newItems;
        });
      }, 100);
    }
  }, [currentProject?.info.id, currentProject?.tables, location.pathname]); // 添加location.pathname作为依赖项

  // 获取已经存在的表代码列表
  const getExistingTableCodes = (domainId?: string): string[] => {
    if (!currentProject || !currentProject.tables) return [];

    // 如果指定了domainId，则只返回该域下的表代码
    if (domainId) {
      return currentProject.tables
        .filter(table => table.domainId === domainId)
        .map(table => table.code);
    }

    // 否则返回所有表代码
    return currentProject.tables.map(table => table.code);
  };

  // 在点击数据表菜单项时确保展开该项
  const handleTablesMenuClick = (domainId: string) => {
    const tablesKey = `tables_${domainId}`;

    // 获取当前菜单项的展开状态
    let isExpanded = false;
    const findAndCheckExpanded = (items: MenuItem[]): boolean => {
      for (const item of items) {
        if (item.key === tablesKey) {
          isExpanded = !!item.expanded;
          return true;
        }
        if (item.children) {
          if (findAndCheckExpanded(item.children)) {
            return true;
          }
        }
      }
      return false;
    };

    findAndCheckExpanded(menuItems);

    // 如果没有展开，则展开它
    if (!isExpanded) {
      toggleMenuExpand(tablesKey);
    }

    // 导航到对应路径
    navigate(`/app/entity/${domainId}/tables`);
  };

  // 创建默认的项目概览内容
  const renderProjectOverview = () => {
    if (!currentProject) return null;

    return (
      <div className="project-overview">
        <div className="overview-header">
          <h2>{currentProject.info.name} - 项目概览</h2>
          <p className="project-description">{currentProject.info.description || '无项目描述'}</p>
        </div>

        <div className="overview-stats">
          <div className="stat-card">
            <h3>主题域</h3>
            <div className="stat-value">{currentProject.domains.length}</div>
          </div>
          <div className="stat-card">
            <h3>数据表</h3>
            <div className="stat-value">{currentProject.tables ? currentProject.tables.length : 0}</div>
          </div>
          <div className="stat-card">
            <h3>关系图</h3>
            <div className="stat-value">{currentProject.diagrams ? currentProject.diagrams.length : 0}</div>
          </div>
          <div className="stat-card">
            <h3>数据字典</h3>
            <div className="stat-value">{currentProject.dictionaries ? currentProject.dictionaries.length : 0}</div>
          </div>
        </div>

        <div className="overview-domains">
          <h3>主题域列表</h3>
          <div className="domains-grid">
            {currentProject.domains.map(domain => (
              <div key={domain.id} className="domain-card" onClick={() => handleTablesMenuClick(domain.id)}>
                <div className="domain-icon"><FolderOpenOutlined /></div>
                <h4>{domain.name}</h4>
                <p>代码: {domain.code}</p>
                <p>表数量: {
                  currentProject.tables
                    ? currentProject.tables.filter(t => t.domainId === domain.id).length
                    : 0
                }</p>
              </div>
            ))}
            <div className="domain-card add-domain" onClick={() => setIsNewDomainModalOpen(true)}>
              <div className="domain-icon"><PlusOutlined /></div>
              <h4>添加新主题域</h4>
            </div>
          </div>
        </div>

        <div className="overview-recent">
          <h3>最近操作</h3>
          <p>项目创建于: {new Date(currentProject.info.createTime).toLocaleString()}</p>
          <p>最后修改于: {new Date(currentProject.info.lastModified).toLocaleString()}</p>
          <p>最后保存于: {lastSaved ? lastSaved.toLocaleString() : '尚未保存'}</p>
        </div>
      </div>
    );
  };

  // 添加处理重命名表确认的函数
  const handleRenameTableConfirm = (newName: string) => {
    if (!tableToRename || !currentProject) return;

    // 创建更新后的表对象
    const tableId = tableToRename.id;
    const tableData = currentProject.tables.find(table => table.id === tableId);

    if (tableData) {
      const updatedTable = {
        ...tableData,
        name: newName.trim(),
        lastModified: Date.now()
      };

      // 更新项目表数据
      const updatedTables = currentProject.tables.map(table =>
        table.id === tableId ? updatedTable : table
      );

      // 创建更新后的项目对象
      const updatedProject = {
        ...currentProject,
        tables: updatedTables,
        lastModified: Date.now()
      };

      // 更新Redux状态
      dispatch(setCurrentProject(updatedProject));

      // 保存到localStorage
      saveProject(updatedProject);

      // 更新tableItems中的表名
      setTableItems(prev => {
        const newTableItems = {...prev};
        for (const domainId in newTableItems) {
          newTableItems[domainId] = newTableItems[domainId].map(item =>
            item.id === tableId ? {...item, title: newName.trim()} : item
          );
        }
        return newTableItems;
      });

      console.log(`表 ${tableId} 已重命名为 ${newName}`);
    }

    // 重置状态
    setTableToRename(null);
  };

  // 添加标签页
  const addTab = (tab: {key: string, title: string, path: string, closable: boolean}) => {
    // 检查是否已存在相同key的标签页
    const tabExists = tabs.some(t => t.type === tab.key);
    if (!tabExists) {
      // 添加新标签页
      const icon = getTabIcon(tab.key);
      const newTab = {
        id: `tab_${Date.now()}`,
        title: tab.title,
        type: tab.key,
        icon: icon
      };
      
      setTabs(prev => [...prev, newTab]);
      setActiveTab(tab.key);
    } else {
      // 如果标签页已存在，则切换到该标签页
      setActiveTab(tab.key);
    }
    
    // 导航到对应路径
    navigate(tab.path);
  };

  return (
    <div className={`app-layout ${darkMode ? 'dark-mode' : ''}`}>
      {/* 标题栏 */}
      <header className="title-bar">
        <button className="back-btn" title="返回欢迎页面" onClick={handleBackToWelcome}>
          <ArrowLeftOutlined />
        </button>
        <div className="app-title">PDManer</div>
        <div className="project-title">
          {currentProject ? currentProject.info.name : '未打开项目'}
        </div>
        <div className="window-controls">
          <button title="最小化">_</button>
          <button title="最大化"><FullscreenOutlined /></button>
          <button title="关闭">✕</button>
        </div>
      </header>

      {/* 主工具栏 */}
      <div className="main-toolbar">
        <div className="toolbar-group">
          <button title="保存项目" onClick={() => handleSaveProject()}><SaveOutlined /></button>
          <button title="导入"><ImportOutlined /></button>
          <button title="导出"><ExportOutlined /></button>
        </div>
        <div className="toolbar-group">
          <button title="撤销"><span>↩</span></button>
          <button title="重做"><span>↪</span></button>
          <button title="复制"><CopyOutlined /></button>
          <button title="删除"><DeleteOutlined /></button>
        </div>
        <div className="toolbar-group">
          <button title="设置"><SettingOutlined /></button>
          <button title={`自动保存: ${autoSaveEnabled ? '已开启' : '已关闭'}`} onClick={toggleAutoSave}>
            {autoSaveEnabled ? <CheckCircleOutlined /> : <SyncOutlined />}
          </button>
          <button title="帮助"><QuestionCircleOutlined /></button>
          <button title="切换暗黑模式" onClick={handleToggleDarkMode}>
            {darkMode ? '🌞' : '🌙'}
          </button>
        </div>
      </div>

      <div className="main-container">
        {/* 左侧菜单面板 */}
        <aside className={`menu-panel ${collapsed ? 'collapsed' : ''}`}>
          <div className="panel-header">
            <h3>{collapsed ? '' : 'PDManer'}</h3>
            <div className="panel-actions">
              <button className="collapse-btn" onClick={toggleCollapsed}>
                {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              </button>
            </div>
          </div>

          <div className="menu-tree">
            {menuItems.map(menuGroup => (
              <div className="menu-group" key={menuGroup.key}>
                <div
                  className="menu-group-header"
                  onClick={() => toggleMenuExpand(menuGroup.key)}
                  onContextMenu={menuGroup.key === 'model' ? (e) => {
                    e.preventDefault();
                    setContextMenu({
                      visible: true,
                      x: e.clientX,
                      y: e.clientY,
                      type: 'model',
                      targetId: menuGroup.key
                    });
                  } : undefined}
                >
                  <div className="menu-group-title">
                    {React.isValidElement(menuGroup.icon) ? menuGroup.icon : null}
                    {!collapsed && <span>{menuGroup.title}</span>}
                  </div>
                  {!collapsed && (
                    menuGroup.expanded ?
                    <CaretDownOutlined className="expand-icon" /> :
                    <CaretRightOutlined className="expand-icon" />
                  )}
                </div>

                {!collapsed && menuGroup.expanded && (
                  <div className="menu-items">
                    {menuGroup.children?.map(item => (
                      <div key={item.key}>
                        {/* 如果是主题域，它也可以展开 */}
                        {item.children ? (
                          <>
                            <div
                              className="domain-header"
                              onClick={(e) => {
                                // 如果有子项，则切换展开/折叠状态
                                if (item.children && item.children.length > 0) {
                                  e.stopPropagation();
                                  toggleMenuExpand(item.key);
                                } else {
                                  navigateToMenuItem(item);
                                }
                              }}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                // 获取菜单类型
                                let menuType = 'domain';
                                if (item.key.startsWith('domain_')) menuType = 'domain';

                                console.log('主题域右键点击:', item.key, menuType);

                                setContextMenu({
                                  visible: true,
                                  x: e.clientX,
                                  y: e.clientY,
                                  type: menuType,
                                  targetId: item.key
                                });
                              }}
                            >
                              <div className="domain-title">
                                {React.isValidElement(item.icon) ? item.icon : null}
                                <span>{item.title}</span>
                              </div>
                              {
                                item.expanded ?
                                <CaretDownOutlined className="expand-icon" /> :
                                <CaretRightOutlined className="expand-icon" />
                              }
                            </div>

                            {/* 显示主题域下的子菜单项 */}
                            {item.expanded && (
                              <div className="domain-items">
                                {item.children.map(subItem => (
                                  <div key={subItem.key}>
                                    <div
                                      className={`menu-item ${activeTab === subItem.key ? 'active' : ''}`}
                                      onClick={(e) => {
                                        // 如果有子项，则切换展开/折叠状态
                                        if (subItem.children && subItem.children.length > 0) {
                                          e.stopPropagation();
                                          toggleMenuExpand(subItem.key);
                                        } else {
                                          navigateToMenuItem(subItem);
                                        }
                                      }}
                                      onContextMenu={(e) => {
                                        e.preventDefault();
                                        // 获取菜单类型
                                        let menuType = 'tables';
                                        if (subItem.key.startsWith('entities_')) menuType = 'entities';
                                        else if (subItem.key.startsWith('views_')) menuType = 'views';
                                        else if (subItem.key.startsWith('diagrams_')) menuType = 'diagrams';
                                        else if (subItem.key.startsWith('dictionaries_')) menuType = 'dictionaries';

                                        // 确保将完整的subItem.key作为targetId
                                        console.log('子菜单右键点击:', subItem.key, menuType);

                                        setContextMenu({
                                          visible: true,
                                          x: e.clientX,
                                          y: e.clientY,
                                          type: menuType,
                                          targetId: subItem.key
                                        });
                                      }}
                                    >
                                      {React.isValidElement(subItem.icon) ? subItem.icon : null}
                                      <span>{subItem.title}</span>
                                      {subItem.children && subItem.children.length > 0 && (
                                        subItem.expanded ?
                                        <CaretDownOutlined className="expand-icon-small" style={{marginLeft: 'auto'}} /> :
                                        <CaretRightOutlined className="expand-icon-small" style={{marginLeft: 'auto'}} />
                                      )}
                                    </div>

                                    {/* 子菜单项的子项 */}
                                    {subItem.expanded && subItem.children && subItem.children.length > 0 && (
                                      <div className="table-items" style={{paddingLeft: '20px'}}>
                                        {subItem.children.map(tableItem => (
                                          <div
                                            key={tableItem.key}
                                            className={`menu-item ${selectedTableKey === tableItem.key ? 'selected' : ''}`}
                                            onClick={() => handleTableItemClick(tableItem.key)}
                                            onContextMenu={(e) => {
                                              e.preventDefault();
                                              setContextMenu({
                                                visible: true,
                                                x: e.clientX,
                                                y: e.clientY,
                                                type: 'table',
                                                targetId: tableItem.key
                                              });
                                            }}
                                          >
                                            {React.isValidElement(tableItem.icon) ? tableItem.icon : <TableOutlined />}
                                            <span>{`${tableItem.title}${tableItem.comment ? ` [${tableItem.comment}]` : ''}`}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <div
                            className={`menu-item ${activeTab === item.key ? 'active' : ''}`}
                            onClick={() => navigateToMenuItem(item)}
                          >
                            {React.isValidElement(item.icon) ? item.icon : null}
                            <span>{item.title}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* 内容区域 */}
        <div className="content-area">
          {/* 标签页栏 */}
          <div className="tabs-bar">
            {tabs.map(tab => (
              <div
                key={tab.id}
                className={`tab ${tab.type === activeTab ? 'active' : ''}`}
                onClick={() => {
                  // 设置当前活动标签页
                  setActiveTab(tab.type);
                  
                  // 如果是表类型的标签页，提取tableId并导航到对应的表详情页
                  if (tab.type.startsWith('table_')) {
                    const tableId = tab.type.split('_')[1];
                    if (tableId) {
                      navigate(`/app/table/${tableId}`);
                    }
                  } else {
                    // 其他类型的标签页，查找对应的路径并导航
                    const path = findPathByTabType(tab.type);
                    if (path) {
                      navigate(path);
                    }
                  }
                }}
              >
                {React.isValidElement(tab.icon) ? tab.icon : null}
                <span>{tab.title}</span>
                <button className="close-tab" onClick={(e) => closeTab(tab.id, e)}>×</button>
              </div>
            ))}
          </div>

          {/* 内容容器 */}
          <div className="content-container">
            {tabs.length === 0 ? renderProjectOverview() : <Outlet />}
          </div>
        </div>

        {/* 上下文菜单 */}
        {contextMenu.visible && (
          <div
            ref={contextMenuRef}
            className="context-menu"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            {/* 模型右键菜单 */}
            {contextMenu.type === 'model' && (
              <div className="context-menu-item" onClick={() => handleContextMenuAction('addDomain')}>
                <PlusOutlined /> 新增主题域
              </div>
            )}

            {/* 主题域右键菜单 */}
            {contextMenu.type === 'domain' && (
              <>
                <div className="context-menu-item" onClick={() => handleContextMenuAction('addSubItem')}>
                  <PlusOutlined /> 新增
                </div>
                <div className="context-menu-item" onClick={() => handleContextMenuAction('editDomain')}>
                  <EditOutlined /> 编辑
                </div>
                <div className="context-menu-item" onClick={() => handleContextMenuAction('clearDomain')}>
                  <DeleteOutlined /> 清空
                </div>
                <div className="context-menu-item danger" onClick={() => handleContextMenuAction('deleteDomain')}>
                  <DeleteOutlined /> 删除
                </div>
              </>
            )}

            {/* 数据表右键菜单 */}
            {contextMenu.type === 'tables' && (
              <>
                <div className="context-menu-item" onClick={() => handleContextMenuAction('addTable')}>
                  <PlusOutlined /> 新增数据表
                </div>
                <div className="context-menu-item" onClick={() => handleContextMenuAction('copyTables')}>
                  <CopyOutlined /> 复制这些数据表
                </div>
                <div className="context-menu-item" onClick={() => handleContextMenuAction('cutTables')}>
                  <EditOutlined /> 剪切这些数据表
                </div>
                <div className="context-menu-item" onClick={() => handleContextMenuAction('pasteTables')}>
                  <EditOutlined /> 粘贴这些数据表
                </div>
                <div className="context-menu-item danger" onClick={() => handleContextMenuAction('deleteTables')}>
                  <DeleteOutlined /> 删除这些数据表
                </div>
              </>
            )}

            {/* 逻辑实体右键菜单 */}
            {contextMenu.type === 'entities' && (
              <>
                <div className="context-menu-item" onClick={() => handleContextMenuAction('addEntity')}>
                  <PlusOutlined /> 新增逻辑实体
                </div>
                <div className="context-menu-item" onClick={() => handleContextMenuAction('copyEntities')}>
                  <CopyOutlined /> 复制这些逻辑实体
                </div>
                <div className="context-menu-item" onClick={() => handleContextMenuAction('cutEntities')}>
                  <EditOutlined /> 剪切这些逻辑实体
                </div>
                <div className="context-menu-item" onClick={() => handleContextMenuAction('pasteEntities')}>
                  <EditOutlined /> 粘贴这些逻辑实体
                </div>
                <div className="context-menu-item danger" onClick={() => handleContextMenuAction('deleteEntities')}>
                  <DeleteOutlined /> 删除这些逻辑实体
                </div>
              </>
            )}

            {/* 多表透视右键菜单 */}
            {contextMenu.type === 'views' && (
              <>
                <div className="context-menu-item" onClick={() => handleContextMenuAction('addView')}>
                  <PlusOutlined /> 新增多表透视
                </div>
                <div className="context-menu-item" onClick={() => handleContextMenuAction('copyViews')}>
                  <CopyOutlined /> 复制这些多表透视
                </div>
                <div className="context-menu-item" onClick={() => handleContextMenuAction('cutViews')}>
                  <EditOutlined /> 剪切这些多表透视
                </div>
                <div className="context-menu-item" onClick={() => handleContextMenuAction('pasteViews')}>
                  <EditOutlined /> 粘贴这些多表透视
                </div>
                <div className="context-menu-item danger" onClick={() => handleContextMenuAction('deleteViews')}>
                  <DeleteOutlined /> 删除这些多表透视
                </div>
              </>
            )}

            {/* 关系图右键菜单 */}
            {contextMenu.type === 'diagrams' && (
              <>
                <div className="context-menu-item" onClick={() => handleContextMenuAction('addDiagram')}>
                  <PlusOutlined /> 新增关系图
                </div>
                <div className="context-menu-item" onClick={() => handleContextMenuAction('copyDiagrams')}>
                  <CopyOutlined /> 复制这些关系图
                </div>
                <div className="context-menu-item" onClick={() => handleContextMenuAction('cutDiagrams')}>
                  <EditOutlined /> 剪切这些关系图
                </div>
                <div className="context-menu-item" onClick={() => handleContextMenuAction('pasteDiagrams')}>
                  <EditOutlined /> 粘贴这些关系图
                </div>
                <div className="context-menu-item danger" onClick={() => handleContextMenuAction('deleteDiagrams')}>
                  <DeleteOutlined /> 删除这些关系图
                </div>
                <div className="context-menu-divider"></div>
                <div className="context-menu-item" onClick={() => handleContextMenuAction('exportDiagramsPNG')}>
                  <ExportOutlined /> 导出为PNG这些关系图
                </div>
                <div className="context-menu-item" onClick={() => handleContextMenuAction('exportDiagramsSVG')}>
                  <ExportOutlined /> 导出为SVG这些关系图
                </div>
              </>
            )}

            {/* 数据字典右键菜单 */}
            {contextMenu.type === 'dictionaries' && (
              <>
                <div className="context-menu-item" onClick={() => handleContextMenuAction('addDictionary')}>
                  <PlusOutlined /> 新增数据字典
                </div>
                <div className="context-menu-item" onClick={() => handleContextMenuAction('copyDictionaries')}>
                  <CopyOutlined /> 复制这些数据字典
                </div>
                <div className="context-menu-item" onClick={() => handleContextMenuAction('cutDictionaries')}>
                  <EditOutlined /> 剪切这些数据字典
                </div>
                <div className="context-menu-item" onClick={() => handleContextMenuAction('pasteDictionaries')}>
                  <EditOutlined /> 粘贴这些数据字典
                </div>
                <div className="context-menu-item danger" onClick={() => handleContextMenuAction('deleteDictionaries')}>
                  <DeleteOutlined /> 删除这些数据字典
                </div>
              </>
            )}

            {/* 表类型的菜单 */}
            {contextMenu.type === 'table' && (
              <>
                <div className="context-menu-item" onClick={() => handleContextMenuAction('edit')}>
                  <EditOutlined /> 编辑表
                </div>
                <div className="context-menu-item" onClick={() => handleContextMenuAction('rename')}>
                  <EditOutlined /> 重命名
                </div>
                <div className="context-menu-item" onClick={() => handleContextMenuAction('copy')}>
                  <CopyOutlined /> 复制表
                </div>
                <div className="context-menu-item danger" onClick={() => handleContextMenuAction('delete')}>
                  <DeleteOutlined /> 删除表
                </div>
              </>
            )}

            {/* 其他类型的菜单 - 仅在不是前面任何类型时显示 */}
            {!['model', 'domain', 'tables', 'entities', 'views', 'diagrams', 'dictionaries', 'table'].includes(contextMenu.type) && (
              <>
                <div className="context-menu-item" onClick={() => handleContextMenuAction('edit')}>
                  <EditOutlined /> 编辑
                </div>
                <div className="context-menu-item" onClick={() => handleContextMenuAction('rename')}>
                  <EditOutlined /> 重命名
                </div>
                <div className="context-menu-item" onClick={() => handleContextMenuAction('copy')}>
                  <CopyOutlined /> 复制
                </div>
                <div className="context-menu-item danger" onClick={() => handleContextMenuAction('delete')}>
                  <DeleteOutlined /> 删除
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* 底部状态栏 */}
      <footer className="status-bar">
        <div className="status-message">
          {currentProject ? formattedLastSaved() : '就绪'}
          {autoSaveEnabled && currentProject && <span className="auto-save-status"> (自动保存已开启)</span>}
        </div>
        <div className="status-info">
          <span>版本: v5.0.0</span>
          <span>|</span>
          <span>目标数据库: {currentProject?.config?.defaultDb || 'MySQL'}</span>
          <span>|</span>
          <span>内存使用: 124MB</span>
        </div>
      </footer>

      {/* 新增主题域弹窗 */}
      <NewDomainModal
        isOpen={isNewDomainModalOpen}
        onClose={() => setIsNewDomainModalOpen(false)}
        onConfirm={handleAddDomain}
      />

      {/* 新增数据表弹窗 */}
      <NewTableModal
        isOpen={isNewTableModalOpen}
        onClose={() => setIsNewTableModalOpen(false)}
        onConfirm={handleAddTableConfirm}
        domainId={newTableDomainId}
        domainName={newTableDomainName}
        existingTableCodes={getExistingTableCodes(newTableDomainId)}
      />

      {/* 重命名表弹窗 */}
      <RenameTableModal
        isOpen={isRenameTableModalOpen}
        onClose={() => setIsRenameTableModalOpen(false)}
        onConfirm={handleRenameTableConfirm}
        currentName={tableToRename?.name || ''}
      />
    </div>
  );
};

export default MainLayout;
