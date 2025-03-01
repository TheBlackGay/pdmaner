import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  CopyOutlined,
  SaveOutlined,
  KeyOutlined,
  InfoCircleOutlined,
  UpOutlined,
  DownOutlined,
  SearchOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  CodeOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignBottomOutlined,
  DatabaseOutlined,
  ImportOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { RootState } from '@store/index';
import { setCurrentProject } from '@store/slices/appSlice';
import { saveProject } from '@utils/projectStorage';
import { generateUUID } from '@utils/uuid';
import './TableDetails.css';
import { useNotificationContext } from '../contexts/NotificationContext';
import SelectGroupModal from '../components/modals/SelectGroupModal';

// 标准字段库的localStorage键前缀，实际key应该是 prefix + projectId
const KEY_STANDARD_FIELDS_PREFIX = 'pdmaner_project_';

// 字段接口定义
interface FieldData {
  id: string;
  name: string;        // 字段名
  code: string;        // 字段代码
  type: string;        // 数据类型
  length?: number;     // 长度
  scale?: number;      // 小数位数
  primaryKey: boolean; // 是否主键
  notNull: boolean;    // 是否非空
  autoIncrement: boolean; // 是否自增
  defaultValue?: string; // 默认值
  comment?: string;    // 备注
}

// 索引定义
interface IndexData {
  id: string;
  name: string;       // 索引名称
  fields: string[];   // 字段ID数组
  unique: boolean;    // 是否唯一索引
  comment?: string;   // 索引备注
}

// 表数据接口定义
interface TableData {
  id: string;
  name: string;        // 表显示名
  code: string;        // 表代码
  comment?: string;    // 表备注
  domainId: string;    // 所属主题域ID
  type: string;        // 表类型
  fields: FieldData[]; // 字段数组
  indexes: IndexData[]; // 索引数组
  createTime: number;
  lastModified: number;
}

// 表标签页类型
type TableTabType = 'fields' | 'indexes' | 'sql' | 'code' | 'check';

// 定义一个字段组接口类型
interface FieldGroup {
  id: string;
  name: string;
  code: string;
  expanded?: boolean;
  fields: any[];
}

const TableDetails: React.FC = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentProject = useSelector((state: RootState) => state.app.currentProject);
  const { success, error: showError } = useNotificationContext();

  const [tableData, setTableData] = useState<TableData | null>(null);
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<FieldData | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // 当前激活的表标签页
  const [activeTableTab, setActiveTableTab] = useState<TableTabType>('fields');

  // 是否显示更多设置
  const [showMoreSettings, setShowMoreSettings] = useState(false);

  // 搜索状态
  const [searchTerm, setSearchTerm] = useState('');

  // 添加索引相关状态
  const [isIndexModalOpen, setIsIndexModalOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<IndexData | null>(null);
  const [isEditingIndex, setIsEditingIndex] = useState(false);

  // 添加字段入库分组选择模态框状态
  const [isSelectGroupModalOpen, setIsSelectGroupModalOpen] = useState(false);
  const [standardFieldToAdd, setStandardFieldToAdd] = useState<any>(null);
  const [fieldGroups, setFieldGroups] = useState<any[]>([]);

  // 数据类型选项
  const dataTypeOptions = [
    { value: "BIGINT", label: "BIGINT" },
    { value: "INT", label: "INT" },
    { value: "SMALLINT", label: "SMALLINT" },
    { value: "VARCHAR", label: "VARCHAR" },
    { value: "CHAR", label: "CHAR" },
    { value: "TEXT", label: "TEXT" },
    { value: "DATETIME", label: "DATETIME" },
    { value: "DATE", label: "DATE" },
    { value: "DECIMAL", label: "DECIMAL" },
    { value: "FLOAT", label: "FLOAT" },
    { value: "BOOLEAN", label: "BOOLEAN" }
  ];

  // 加载表数据
  useEffect(() => {
    if (currentProject && tableId) {
      const table = currentProject.tables?.find(t => t.id === tableId);
      if (table) {
        // 创建一个新的表对象，确保有索引数组
        const tableWithIndexes = {
          ...table,
          indexes: table.indexes || []
        };

        // 把tableData设置为新的表数据前先清除旧状态，避免UI闪烁
        setTableData(null);
        setTimeout(() => {
          setTableData(tableWithIndexes);
        }, 0);
      } else {
        showError(`找不到ID为 ${tableId} 的表`);
        // 如果找不到表，返回到实体列表页
        navigate('/app/entity/tables');
      }
    }
  }, [currentProject, tableId, navigate, showError]);

  // 初始化标准字段库
  useEffect(() => {
    // 初始化标准字段库
    try {
      console.log('初始化标准字段库并预加载字段分组数据...');
      
      // 直接使用getStandardFieldsGroups获取分组数据
      const groupsData = getStandardFieldsGroups();
      console.log('字段分组数据加载完成:', groupsData);
      
      // 更新UI状态
      setFieldGroups(groupsData);
    } catch (error) {
      console.error('初始化标准字段库失败:', error);
    }
  }, [currentProject?.info?.id]); // 依赖项添加currentProject.info.id，确保项目变化时重新加载

  // 定制success通知的显示时间为1秒
  const successNotification = (message: string) => {
    success(message);
  };

  // 保存表数据
  const handleSaveTable = () => {
    if (!tableData || !currentProject) return;

    try {
      // 创建更新后的表数据对象
      const updatedTableData = {
        ...tableData,
        // 确保code字段作为表名，name字段作为表备注
        code: tableData.code,
        name: tableData.name,
        comment: tableData.comment,
        lastModified: Date.now()
      };

      // 更新项目中的表数据
      const updatedTables = currentProject.tables.map(table =>
        table.id === tableData.id ? updatedTableData : table
      );

      const updatedProject = {
        ...currentProject,
        tables: updatedTables,
        lastModified: Date.now()
      };

      // 更新Redux状态
      dispatch(setCurrentProject(updatedProject));

      // 保存到localStorage
      saveProject(updatedProject);

      successNotification('表保存成功');
    } catch (error) {
      console.error('保存表失败:', error);
      showError('保存表失败，请检查控制台错误日志');
    }
  };

  // 添加新字段
  const handleAddField = () => {
    console.log('添加字段按钮被点击'); // 添加调试输出
    setSelectedField(null);
    setIsEditing(false);
    setIsFieldModalOpen(true);
    console.log('isFieldModalOpen 设置为:', true); // 添加调试输出
  };

  // 编辑字段
  const handleEditField = (field: FieldData) => {
    setSelectedField(field);
    setIsEditing(true);
    setIsFieldModalOpen(true);
  };

  // 删除字段
  const handleDeleteField = (fieldId: string) => {
    if (!tableData || !currentProject) return;

    if (window.confirm('确定要删除这个字段吗？')) {
      const updatedFields = tableData.fields.filter(field => field.id !== fieldId);

      // 更新本地表数据
      const updatedTableData = {
        ...tableData,
        fields: updatedFields,
        lastModified: Date.now()
      };

      setTableData(updatedTableData);

      // 自动保存到项目信息
      try {
        // 更新项目中的表数据
        const updatedTables = currentProject.tables.map(table =>
          table.id === updatedTableData.id ? updatedTableData : table
        );

        const updatedProject = {
          ...currentProject,
          tables: updatedTables,
          lastModified: Date.now()
        };

        // 更新Redux状态
        dispatch(setCurrentProject(updatedProject));

        // 保存到localStorage
        saveProject(updatedProject);

        successNotification('字段删除成功，项目已自动更新');
      } catch (error) {
        console.error('删除字段并保存项目失败:', error);
        showError('删除字段失败，请检查控制台错误日志');
      }
    }
  };

  // 修改 handleMoveField 函数支持更多操作类型
  const handleMoveField = (fieldId: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
    if (!tableData || !currentProject) return;

    const fieldIndex = tableData.fields.findIndex(field => field.id === fieldId);
    if (fieldIndex === -1) return;

    const newFields = [...tableData.fields];
    const fieldToMove = newFields[fieldIndex];

    // 根据移动方向处理
    switch (direction) {
      case 'up':
        // 上移一位，如果不是第一个
        if (fieldIndex > 0) {
          newFields.splice(fieldIndex, 1);
          newFields.splice(fieldIndex - 1, 0, fieldToMove);
        }
        break;
      case 'down':
        // 下移一位，如果不是最后一个
        if (fieldIndex < newFields.length - 1) {
          newFields.splice(fieldIndex, 1);
          newFields.splice(fieldIndex + 1, 0, fieldToMove);
        }
        break;
      case 'top':
        // 置顶，移到数组第一位
        if (fieldIndex > 0) {
          newFields.splice(fieldIndex, 1);
          newFields.unshift(fieldToMove);
        }
        break;
      case 'bottom':
        // 置底，移到数组最后一位
        if (fieldIndex < newFields.length - 1) {
          newFields.splice(fieldIndex, 1);
          newFields.push(fieldToMove);
        }
        break;
    }

    // 更新本地表数据
    const updatedTableData = {
      ...tableData,
      fields: newFields,
      lastModified: Date.now()
    };

    setTableData(updatedTableData);

    // 自动保存到项目信息
    try {
      // 更新项目中的表数据
      const updatedTables = currentProject.tables.map(table =>
        table.id === updatedTableData.id ? updatedTableData : table
      );

      const updatedProject = {
        ...currentProject,
        tables: updatedTables,
        lastModified: Date.now()
      };

      // 更新Redux状态
      dispatch(setCurrentProject(updatedProject));

      // 保存到localStorage
      saveProject(updatedProject);

      const moveTypeText = {
        'up': '上移',
        'down': '下移',
        'top': '置顶',
        'bottom': '置底'
      };
      successNotification(`字段${moveTypeText[direction]}成功，项目已自动更新`);
    } catch (error) {
      console.error('更新字段排序并保存项目失败:', error);
    }
  };

  // 处理字段复制
  const handleCopyField = (field: FieldData) => {
    if (!tableData || !currentProject) return;

    // 创建字段副本
    const newField: FieldData = {
      ...field,
      id: Date.now().toString(), // 生成新的ID
      name: `${field.name}_copy`, // 名称添加_copy后缀
    };

    // 更新本地表数据
    const updatedFields = [...tableData.fields, newField];

    // 更新表数据
    const updatedTableData = {
      ...tableData,
      fields: updatedFields,
      lastModified: Date.now()
    };

    setTableData(updatedTableData);

    // 自动保存到项目信息
    try {
      // 更新项目中的表数据
      const updatedTables = currentProject.tables.map(table =>
        table.id === updatedTableData.id ? updatedTableData : table
      );

      const updatedProject = {
        ...currentProject,
        tables: updatedTables,
        lastModified: Date.now()
      };

      // 更新Redux状态
      dispatch(setCurrentProject(updatedProject));

      // 保存到localStorage
      saveProject(updatedProject);

      successNotification('字段复制成功，项目已自动更新');
    } catch (error) {
      console.error('复制字段并保存项目失败:', error);
      showError('复制字段失败，请检查控制台错误日志');
    }
  };

  // 过滤字段
  const getFilteredFields = () => {
    if (!tableData) return [];

    // 直接返回所有字段，不再进行搜索过滤
    return tableData.fields;
  };

  // 保存字段信息
  const handleSaveField = (field: FieldData) => {
    if (!tableData || !currentProject) return;

    let updatedFields: FieldData[];

    if (isEditing && selectedField) {
      // 更新现有字段
      updatedFields = tableData.fields.map(f =>
        f.id === selectedField.id ? { ...field, id: selectedField.id } : f
      );
    } else {
      // 添加新字段
      const newField = {
        ...field,
        id: Date.now().toString() // 简单的ID生成
      };
      updatedFields = [...tableData.fields, newField];
    }

    // 更新本地表数据状态
    const updatedTableData = {
      ...tableData,
      fields: updatedFields,
      lastModified: Date.now()
    };

    setTableData(updatedTableData);

    // 自动保存到项目信息
    try {
      // 更新项目中的表数据
      const updatedTables = currentProject.tables.map(table =>
        table.id === updatedTableData.id ? updatedTableData : table
      );

      const updatedProject = {
        ...currentProject,
        tables: updatedTables,
        lastModified: Date.now()
      };

      // 更新Redux状态
      dispatch(setCurrentProject(updatedProject));

      // 保存到localStorage
      saveProject(updatedProject);

      successNotification('字段保存成功，项目已自动更新');
    } catch (error) {
      console.error('保存字段到项目失败:', error);
      showError('保存字段失败，但字段已添加到表编辑器中，请手动点击"保存表"按钮进行保存');
    }

    setIsFieldModalOpen(false);
  };

  // 获取当前主题域名称
  const getDomainName = (domainId: string): string => {
    if (!currentProject) return '';

    const domain = currentProject.domains.find(d => d.id === domainId);
    return domain ? domain.name : '未知主题域';
  };

  // 切换表详情页标签
  const handleTableTabChange = (tabType: TableTabType) => {
    setActiveTableTab(tabType);
  };

  // 添加新索引
  const handleAddIndex = () => {
    setSelectedIndex(null);
    setIsEditingIndex(false);
    setIsIndexModalOpen(true);
  };

  // 编辑索引
  const handleEditIndex = (index: IndexData) => {
    setSelectedIndex(index);
    setIsEditingIndex(true);
    setIsIndexModalOpen(true);
  };

  // 删除索引
  const handleDeleteIndex = (indexId: string) => {
    if (!tableData || !currentProject) return;

    if (window.confirm('确定要删除这个索引吗？')) {
      const updatedIndexes = tableData.indexes.filter(index => index.id !== indexId);

      // 更新本地表数据
      const updatedTableData = {
        ...tableData,
        indexes: updatedIndexes,
        lastModified: Date.now()
      };

      setTableData(updatedTableData);

      // 自动保存到项目信息
      try {
        // 更新项目中的表数据
        const updatedTables = currentProject.tables.map(table =>
          table.id === updatedTableData.id ? updatedTableData : table
        );

        const updatedProject = {
          ...currentProject,
          tables: updatedTables,
          lastModified: Date.now()
        };

        // 更新Redux状态
        dispatch(setCurrentProject(updatedProject));

        // 保存到localStorage
        saveProject(updatedProject);

        successNotification('索引删除成功，项目已自动更新');
      } catch (error) {
        console.error('删除索引并保存项目失败:', error);
        showError('删除索引失败，请检查控制台错误日志');
      }
    }
  };

  // 保存索引信息
  const handleSaveIndex = (index: IndexData) => {
    if (!tableData || !currentProject) return;

    let updatedIndexes: IndexData[];

    if (isEditingIndex && selectedIndex) {
      // 更新现有索引
      updatedIndexes = tableData.indexes.map(idx =>
        idx.id === selectedIndex.id ? { ...index, id: selectedIndex.id } : idx
      );
    } else {
      // 添加新索引
      const newIndex = {
        ...index,
        id: Date.now().toString() // 简单的ID生成
      };
      updatedIndexes = [...tableData.indexes, newIndex];
    }

    // 更新本地表数据状态
    const updatedTableData = {
      ...tableData,
      indexes: updatedIndexes,
      lastModified: Date.now()
    };

    setTableData(updatedTableData);

    // 自动保存到项目信息
    try {
      // 更新项目中的表数据
      const updatedTables = currentProject.tables.map(table =>
        table.id === updatedTableData.id ? updatedTableData : table
      );

      const updatedProject = {
        ...currentProject,
        tables: updatedTables,
        lastModified: Date.now()
      };

      // 更新Redux状态
      dispatch(setCurrentProject(updatedProject));

      // 保存到localStorage
      saveProject(updatedProject);

      successNotification('索引保存成功，项目已自动更新');
    } catch (error) {
      console.error('保存索引到项目失败:', error);
      showError('保存索引失败，但索引已添加到表编辑器中，请手动点击"保存表"按钮进行保存');
    }

    setIsIndexModalOpen(false);
  };

  // 处理索引排序
  const handleMoveIndex = (indexId: string, direction: 'up' | 'down') => {
    if (!tableData || !currentProject) return;

    const indexIndex = tableData.indexes.findIndex(index => index.id === indexId);
    if (indexIndex === -1) return;

    const newIndexes = [...tableData.indexes];

    if (direction === 'up' && indexIndex > 0) {
      [newIndexes[indexIndex], newIndexes[indexIndex - 1]] = [newIndexes[indexIndex - 1], newIndexes[indexIndex]];
    } else if (direction === 'down' && indexIndex < newIndexes.length - 1) {
      [newIndexes[indexIndex], newIndexes[indexIndex + 1]] = [newIndexes[indexIndex + 1], newIndexes[indexIndex]];
    }

    // 更新本地表数据
    const updatedTableData = {
      ...tableData,
      indexes: newIndexes,
      lastModified: Date.now()
    };

    setTableData(updatedTableData);

    // 自动保存到项目信息
    try {
      // 更新项目中的表数据
      const updatedTables = currentProject.tables.map(table =>
        table.id === updatedTableData.id ? updatedTableData : table
      );

      const updatedProject = {
        ...currentProject,
        tables: updatedTables,
        lastModified: Date.now()
      };

      // 更新Redux状态
      dispatch(setCurrentProject(updatedProject));

      // 保存到localStorage
      saveProject(updatedProject);

      successNotification('索引排序成功，项目已自动更新');
    } catch (error) {
      console.error('更新索引排序并保存项目失败:', error);
    }
  };

  // 生成唯一的字段代码
  const generateUniqueFieldCode = (baseCode: string): string => {
    if (!tableData) return baseCode;

    let code = baseCode;
    let counter = 1;

    // 检查代码是否存在，如果存在则添加数字后缀
    while (tableData.fields.some(f => f.code === code)) {
      code = `${baseCode}_${counter}`;
      counter++;
    }

    return code;
  };

  // 接收拖拽的字段，添加到当前表
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();

    // 移除拖拽指示样式
    const fieldsContainer = document.querySelector('.fields-panel');
    if (fieldsContainer) {
      fieldsContainer.classList.remove('drop-target');
    }

    try {
      // 获取拖拽数据
      const data = e.dataTransfer.getData('application/json');
      if (!data) return;

      const standardField = JSON.parse(data);
      if (!standardField || !standardField.id) return;

      // 检查字段名是否已存在
      let fieldName = standardField.name;
      let fieldCode = standardField.code;
      const nameExists = tableData?.fields.some(f => f.name === fieldName);
      const codeExists = tableData?.fields.some(f => f.code === fieldCode);

      // 如果名称或代码已存在，生成唯一的版本
      if (nameExists || codeExists) {
        if (nameExists) {
          // 从名称中提取基础名称（去掉括号中的内容）
          const baseNameMatch = fieldName.match(/^(.*?)(\(.*\))?$/);
          const baseName = baseNameMatch ? baseNameMatch[1].trim() : fieldName;
          fieldName = `${baseName} (复制)`;
        }

        if (codeExists) {
          fieldCode = generateUniqueFieldCode(fieldCode);
        }

        success(`字段名称或代码已存在，已自动调整为 "${fieldName}" (${fieldCode})`);
      }

      // 创建新字段对象
      const newField: FieldData = {
        id: Date.now().toString(),
        name: fieldName,
        code: fieldCode,
        type: standardField.type,
        length: standardField.length,
        scale: standardField.scale,
        primaryKey: standardField.primaryKey || false,
        notNull: standardField.notNull || false,
        autoIncrement: standardField.autoIncrement || false,
        defaultValue: standardField.defaultValue,
        comment: standardField.comment
      };

      // 添加字段到表中
      if (tableData) {
        const updatedFields = [...tableData.fields, newField];
        const updatedTableData = {
          ...tableData,
          fields: updatedFields,
          lastModified: Date.now()
        };

        setTableData(updatedTableData);

        // 自动更新到项目
        if (currentProject) {
          const updatedTables = currentProject.tables.map(table =>
            table.id === updatedTableData.id ? updatedTableData : table
          );

          const updatedProject = {
            ...currentProject,
            tables: updatedTables,
            lastModified: Date.now()
          };

          // 更新Redux状态
          dispatch(setCurrentProject(updatedProject));

          // 保存到localStorage
          saveProject(updatedProject);

          success(`字段 "${fieldName}" 添加成功`);
        }
      }
    } catch (error) {
      console.error('处理拖拽数据失败:', error);
      showError('添加字段失败，请检查控制台错误日志');
    }
  };

  // 处理拖拽进入
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();

    // 添加拖拽指示样式
    const fieldsContainer = document.querySelector('.fields-panel');
    if (fieldsContainer) {
      fieldsContainer.classList.add('drop-target');
    }
  };

  // 处理拖拽离开
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();

    // 移除拖拽指示样式
    const fieldsContainer = document.querySelector('.fields-panel');
    if (fieldsContainer) {
      fieldsContainer.classList.remove('drop-target');
    }
  };

  // 处理行点击，选择字段
  const handleRowClick = (field: FieldData) => {
    setSelectedField({...field}); // 添加一个深拷贝来避免直接修改原始数据
  };

  // 处理表单编辑时确保ID始终有值的辅助函数
  const updateSelectedField = (updatedValues: Partial<FieldData>) => {
    if (selectedField) {
      // 如果已有选定的字段，则合并更新
      setSelectedField({
        ...selectedField,
        ...updatedValues
      });
    } else {
      // 如果是新建字段，创建带有默认值和必要属性的新对象
      setSelectedField({
        id: Date.now().toString(), // 临时ID
        name: '',
        code: '',
        type: 'VARCHAR',
        primaryKey: false,
        notNull: false,
        autoIncrement: false,
        ...updatedValues
      });
    }
  };

  // 渲染表详情标签内容
  const renderTabContent = () => {
    switch (activeTableTab) {
      case 'fields':
        return renderFieldsTab();
      case 'indexes':
        return renderIndexesTab();
      case 'sql':
        return (
          <div className="tab-placeholder">
            <CodeOutlined />
            <p>SQL代码预览功能正在开发中...</p>
          </div>
        );
      case 'code':
        return (
          <div className="tab-placeholder">
            <FileTextOutlined />
            <p>程序代码生成功能正在开发中...</p>
          </div>
        );
      case 'check':
        return (
          <div className="tab-placeholder">
            <CheckCircleOutlined />
            <p>规范检查功能正在开发中...</p>
          </div>
        );
      default:
        return renderFieldsTab();
    }
  };

  // 渲染字段管理标签页内容
  const renderFieldsTab = () => {
    return (
      <div className="fields-panel" 
           onDrop={handleDrop} 
           onDragOver={handleDragOver}
           onDragLeave={handleDragLeave}
      >
        <div className="fields-toolbar">
          <div className="toolbar-left">
            <button className="add-button" onClick={handleAddField}>
              <PlusOutlined /> 添加字段
            </button>
            <div className="button-group">
              <button
                title="排序: 按代码"
                onClick={() => handleSortFields('code')}
              >
                代码 <DownOutlined />
              </button>
              <button
                title="排序: 按名称"
                onClick={() => handleSortFields('name')}
              >
                名称 <DownOutlined />
              </button>
              <button
                title="排序: 主键优先"
                onClick={() => handleSortFields('primaryKey')}
              >
                主键 <DownOutlined />
              </button>
            </div>
          </div>
          
          <div className="toolbar-right">
            <div className="search-box">
              <SearchOutlined />
              <input
                type="text"
                placeholder="搜索字段..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="clear-search"
                  onClick={() => setSearchTerm('')}
                >
                  <CloseOutlined />
                </button>
              )}
            </div>
            <button 
              className="add-to-library-button"
              onClick={handleAddToLibrary}
              disabled={!selectedField}
              title="添加选中字段到标准字段库"
            >
              <DatabaseOutlined /> 添加到字段库
            </button>
          </div>
        </div>
        <div className="fields-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '30px' }}></th>
                <th style={{ width: '150px' }}>字段名称</th>
                <th style={{ width: '150px' }}>字段代码</th>
                <th style={{ width: '100px' }}>类型</th>
                <th style={{ width: '80px' }}>长度</th>
                <th style={{ width: '50px' }}>主键</th>
                <th style={{ width: '50px' }}>非空</th>
                <th style={{ width: '50px' }}>自增</th>
                <th style={{ width: '150px' }}>默认值</th>
                <th>备注</th>
                <th style={{ width: '120px' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredFields().length === 0 ? (
                <tr>
                  <td colSpan={11} className="empty-state">
                    {searchTerm ? (
                      <>
                        <h3>未找到匹配的字段</h3>
                        <p>尝试使用其他搜索词，或清除搜索</p>
                      </>
                    ) : (
                      <>
                        <h3>暂无字段</h3>
                        <p>点击"添加字段"按钮或从标准字段库拖拽字段到此处</p>
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                getFilteredFields().map((field, index) => (
                  <tr
                    key={field.id}
                    className={`${field.primaryKey ? 'primary-key-row' : ''} ${selectedField?.id === field.id ? 'selected-row' : ''}`}
                    onClick={() => handleRowClick(field)}
                  >
                    <td>{index + 1}</td>
                    <td>{field.name}</td>
                    <td>{field.code}</td>
                    <td><span className="type-badge">{field.type}</span></td>
                    <td>{field.length || '-'}</td>
                    <td>{field.primaryKey ? <span className="pk-badge"><KeyOutlined /></span> : '-'}</td>
                    <td>{field.notNull ? '√' : '-'}</td>
                    <td>{field.autoIncrement ? '√' : '-'}</td>
                    <td className="default-value-cell">{field.defaultValue || '-'}</td>
                    <td className="comment-cell">{field.comment || '-'}</td>
                    <td className="actions-cell">
                      <button title="编辑" className="table-action-btn" onClick={(e) => {
                        e.stopPropagation();
                        handleEditField(field);
                      }}>
                        <EditOutlined />
                      </button>
                      <button
                        title="删除"
                        className="table-action-btn delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteField(field.id);
                        }}
                      >
                        <DeleteOutlined />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 渲染索引管理标签页内容
  const renderIndexesTab = () => {
    return (
      <div className="indexes-panel">
        <div className="indexes-toolbar">
          <button className="add-button" onClick={handleAddIndex}>
            <PlusOutlined /> 添加索引
          </button>
        </div>

        <div className="indexes-table-wrapper">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>序号</th>
                  <th>索引名称</th>
                  <th>类型</th>
                  <th>包含字段</th>
                  <th>备注</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {tableData?.indexes?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-message">
                      <InfoCircleOutlined /> 暂无索引，请添加
                    </td>
                  </tr>
                ) : (
                  tableData?.indexes?.map((index, idx) => (
                    <tr key={index.id}>
                      <td>{idx + 1}</td>
                      <td>{index.name}</td>
                      <td>{index.unique ? '唯一索引' : '普通索引'}</td>
                      <td>
                        {index.fields.map(fieldId => {
                          const field = tableData.fields.find(f => f.id === fieldId);
                          return field ? field.name : '';
                        }).join(', ')}
                      </td>
                      <td className="comment-cell">{index.comment || '-'}</td>
                      <td className="actions-cell">
                        <button title="编辑" className="table-action-btn" onClick={(e) => {
                          e.stopPropagation();
                          handleEditIndex(index);
                        }}>
                          <EditOutlined />
                        </button>
                        <button
                          title="删除"
                          className="table-action-btn delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteIndex(index.id);
                          }}
                        >
                          <DeleteOutlined />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // 确保标准字段库存在，如果不存在则初始化
  const ensureStandardFieldsLibrary = () => {
    if (!currentProject?.info?.id) {
      console.error('当前项目ID不存在，无法获取标准字段库');
      return [];
    }

    // 获取当前项目的配置键
    const projectKey = `${KEY_STANDARD_FIELDS_PREFIX}${currentProject.info.id}`;
    console.log(`检查项目配置键: ${projectKey}`);
    
    // 获取项目配置
    const projectConfig = localStorage.getItem(projectKey);
    if (!projectConfig) {
      console.error('项目配置不存在');
      return [];
    }
    
    try {
      // 解析项目配置
      const config = JSON.parse(projectConfig);
      
      // 检查项目配置中是否包含标准字段库数据
      if (!config.standardFields) {
        console.log('项目配置中不存在标准字段库，初始化默认结构');
        config.standardFields = [
          {
            id: 'default',
            name: '默认分组',
            code: 'default',
            expanded: true,
            fields: []
          },
          {
            id: 'common',
            name: '常用字段',
            code: 'common',
            expanded: false,
            fields: []
          }
        ];
        
        // 保存更新后的配置
        localStorage.setItem(projectKey, JSON.stringify(config));
      }
      
      return config.standardFields || [];
    } catch (e) {
      console.error('解析项目配置失败:', e);
      return [];
    }
  };

  // 获取标准字段库中的所有分组数据
  const getStandardFieldsGroups = () => {
    if (!currentProject?.info?.id) {
      console.error('当前项目ID不存在，无法获取标准字段库');
      return [];
    }

    // 获取当前项目的配置键
    const projectKey = `${KEY_STANDARD_FIELDS_PREFIX}${currentProject.info.id}`;
    console.log(`从项目配置 ${projectKey} 中获取标准字段库分组`);
    
    // 获取项目配置
    const projectConfig = localStorage.getItem(projectKey);
    if (!projectConfig) {
      console.error('项目配置不存在');
      return [];
    }
    
    try {
      // 解析项目配置
      const config = JSON.parse(projectConfig);
      
      // 获取标准字段库数据
      const standardFields = config.standardFields || [];
      console.log('从项目配置中获取的标准字段库分组:', standardFields);
      
      return standardFields;
    } catch (e) {
      console.error('解析项目配置失败:', e);
      return [];
    }
  };

  // 将选中的字段添加到标准字段库
  const handleAddToLibrary = () => {
    if (!selectedField) {
      showError('请先选择一个字段');
      return;
    }

    // 将字段数据格式化为标准字段格式
    const standardField = {
      id: generateUUID(),
      name: selectedField.name,
      code: selectedField.code,
      type: selectedField.type,
      length: selectedField.length,
      scale: selectedField.scale,
      primaryKey: selectedField.primaryKey,
      notNull: selectedField.notNull,
      autoIncrement: selectedField.autoIncrement,
      defaultValue: selectedField.defaultValue,
      comment: selectedField.comment
    };

    // 获取最新分组数据
    console.log('调用getStandardFieldsGroups获取最新分组数据');
    const latestGroups = getStandardFieldsGroups();
    console.log('获取到的最新分组数据:', latestGroups);

    // 设置字段分组列表和要添加的字段
    setFieldGroups(latestGroups);
    setStandardFieldToAdd(standardField);
    
    // 打开分组选择模态框
    setIsSelectGroupModalOpen(true);
  };

  // 处理添加字段到选定分组
  const handleAddFieldToGroup = (groupId: string) => {
    console.log('添加字段到分组，分组ID:', groupId);
    
    if (!standardFieldToAdd || !currentProject?.info?.id) {
      console.error('没有要添加的字段数据或项目ID不存在');
      setIsSelectGroupModalOpen(false);
      return;
    }
    
    // 获取当前项目的配置键
    const projectKey = `${KEY_STANDARD_FIELDS_PREFIX}${currentProject.info.id}`;
    console.log(`使用项目配置键: ${projectKey}`);
    
    try {
      // 获取项目配置
      const projectConfigStr = localStorage.getItem(projectKey);
      if (!projectConfigStr) {
        console.error('项目配置不存在，无法更新标准字段库');
        setIsSelectGroupModalOpen(false);
        return;
      }
      
      // 解析项目配置
      console.log('正在解析项目配置...');
      const projectConfig = JSON.parse(projectConfigStr);
      console.log('项目配置解析成功:', projectConfig);
      
      // 确保标准字段库存在
      if (!projectConfig.standardFields) {
        console.log('标准字段库不存在，初始化空数组');
        projectConfig.standardFields = [];
      }
      
      // 查找选定的分组
      const groupIndex = projectConfig.standardFields.findIndex((group: any) => group.id === groupId);
      console.log('找到的分组索引:', groupIndex, '分组ID:', groupId);
      
      // 添加字段到选定分组或默认分组
      if (groupIndex === -1) {
        console.log('未找到指定分组，创建默认分组');
        // 创建默认分组并添加字段
        const defaultGroup = {
          id: 'default',
          name: '默认分组',
          code: 'default',
          expanded: true,
          fields: [standardFieldToAdd]
        };
        projectConfig.standardFields.push(defaultGroup);
        console.log('添加默认分组成功:', defaultGroup);
      } else {
        // 添加到选定分组
        console.log(`添加字段到分组 "${projectConfig.standardFields[groupIndex].name}"`);
        if (!projectConfig.standardFields[groupIndex].fields) {
          projectConfig.standardFields[groupIndex].fields = [];
        }
        
        // 检查字段是否已存在
        const fieldExists = projectConfig.standardFields[groupIndex].fields.some(
          (field: any) => field.id === standardFieldToAdd.id || field.code === standardFieldToAdd.code
        );
        
        if (fieldExists) {
          console.log('字段已存在于该分组，更新字段');
          // 更新已存在的字段
          projectConfig.standardFields[groupIndex].fields = projectConfig.standardFields[groupIndex].fields.map(
            (field: any) => (field.id === standardFieldToAdd.id || field.code === standardFieldToAdd.code) 
              ? standardFieldToAdd 
              : field
          );
        } else {
          // 添加新字段
          projectConfig.standardFields[groupIndex].fields.push(standardFieldToAdd);
          console.log('添加新字段成功:', standardFieldToAdd);
        }
      }
      
      // 输出更新后的标准字段库数据
      console.log('更新后的标准字段库:', projectConfig.standardFields);
      
      // 保存更新后的配置
      const updatedConfig = JSON.stringify(projectConfig);
      localStorage.setItem(projectKey, updatedConfig);
      console.log('配置保存成功，大小:', updatedConfig.length, '字节');
      
      // 更新当前组件中的字段分组状态，确保下次打开模态框时显示最新数据
      setFieldGroups([...projectConfig.standardFields]);
      
      // 触发自定义事件，通知标准字段库组件刷新数据
      const refreshEvent = new CustomEvent('standard-fields-updated', {
        detail: { source: 'table-details', projectId: currentProject.info.id }
      });
      document.dispatchEvent(refreshEvent);
      console.log('已触发刷新标准字段库事件');
      
      // 显示成功通知
      success(`已将字段 "${standardFieldToAdd.name}" 添加到字段库`);
      
      // 清除临时状态并关闭模态框
      setStandardFieldToAdd(null);
      setIsSelectGroupModalOpen(false);
    } catch (e) {
      console.error('更新标准字段库失败:', e);
      showError('添加字段到分组失败，请检查控制台日志');
      setIsSelectGroupModalOpen(false);
    }
  };

  // 解析SQL DDL语句生成表结构
  const parseSqlToTable = (sqlText: string) => {
    try {
      const trimmedSql = sqlText.trim();
      
      // 简单验证是否是CREATE TABLE语句
      if (!trimmedSql.toUpperCase().includes('CREATE TABLE')) {
        showError('无效的SQL语句，请使用CREATE TABLE语句');
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
      const fields: FieldData[] = realFieldDefinitions.map(fieldDef => {
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
      
      // 创建新表
      createTableFromParsedStructure(tableName, fields);
      
    } catch (err) {
      console.error('解析SQL失败:', err);
      showError('解析SQL失败，请检查SQL语法');
    }
  };

  // 创建表并添加到默认主题域
  const createTableFromParsedStructure = (tableName: string, fields: FieldData[]) => {
    if (!currentProject) {
      showError('项目未打开，无法创建表');
      return;
    }
    
    try {
      // 获取默认主题域
      const defaultDomain = currentProject.domains.find(d => d.code === 'default') || currentProject.domains[0];
      
      if (!defaultDomain) {
        showError('未找到默认主题域');
        return;
      }
      
      // 生成表ID和表代码
      const tableId = generateUUID();
      const tableCode = tableName.toLowerCase().replace(/\s+/g, '_');
      const now = Date.now();
      
      // 创建新表对象
      const newTable: TableData = {
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
      showError('创建表失败，请检查控制台错误日志');
    }
  };

  // 打开解析SQL的模态框
  const openSqlParsingModal = () => {
    // 创建模态框DOM
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
        showError('请输入SQL语句');
        return;
      }
      
      parseSqlToTable(textarea.value);
      document.body.removeChild(modalContainer);
    };
    modalFooter.appendChild(parseButton);
    
    // 添加模态框到body
    document.body.appendChild(modalContainer);
  };

  // 根据指定属性对字段进行排序
  const handleSortFields = (sortKey: 'name' | 'code' | 'primaryKey') => {
    if (!tableData) return;
    
    const sortedFields = [...tableData.fields].sort((a, b) => {
      if (sortKey === 'primaryKey') {
        // 对于主键排序，主键字段优先
        if (a.primaryKey && !b.primaryKey) return -1;
        if (!a.primaryKey && b.primaryKey) return 1;
        return a.name.localeCompare(b.name); // 相同时按名称排序
      }
      
      // 对于name和code排序
      if (sortKey === 'name' || sortKey === 'code') {
        return a[sortKey].localeCompare(b[sortKey]);
      }
      
      return 0;
    });
    
    // 更新表数据
    const updatedTable = {
      ...tableData,
      fields: sortedFields
    };
    
    // 更新项目数据
    if (currentProject) {
      const updatedTables = currentProject.tables.map(t => 
        t.id === tableData.id ? updatedTable : t
      );
      
      // 更新Redux状态
      const updatedProject = {
        ...currentProject,
        tables: updatedTables
      };
      
      dispatch(setCurrentProject(updatedProject));
      
      // 更新本地状态
      setTableData(updatedTable);
      
      // 显示成功通知
      success(`字段已按${
        sortKey === 'name' ? '名称' : 
        sortKey === 'code' ? '代码' : 
        '主键优先'
      }排序`);
    }
  };

  if (!tableData) {
    return <div className="loading-container">加载表信息中...</div>;
  }

  return (
    <div className="table-details-container">
      {/* 表顶部标签切换区域 */}
      <div className="table-tabs-container">
        <div className="table-function-tabs">
          <div
            className={`tab-item ${activeTableTab === 'fields' ? 'active' : ''}`}
            onClick={() => handleTableTabChange('fields')}
          >
            <span>字段</span>
          </div>
          <div
            className={`tab-item ${activeTableTab === 'indexes' ? 'active' : ''}`}
            onClick={() => handleTableTabChange('indexes')}
          >
            <span>索引</span>
          </div>
          <div
            className={`tab-item ${activeTableTab === 'sql' ? 'active' : ''}`}
            onClick={() => handleTableTabChange('sql')}
          >
            <span>SQL代码</span>
          </div>
          <div
            className={`tab-item ${activeTableTab === 'code' ? 'active' : ''}`}
            onClick={() => handleTableTabChange('code')}
          >
            <span>程序代码</span>
          </div>
          <div
            className={`tab-item ${activeTableTab === 'check' ? 'active' : ''}`}
            onClick={() => handleTableTabChange('check')}
          >
            <span>规范检查</span>
          </div>
        </div>
      </div>

      {/* 表信息和操作区域，只在字段标签页下显示 */}
      {activeTableTab === 'fields' && (
        <div className="table-info-container">
          <div className="table-basic-info">
            <div className="info-group code-group">
              <label>代码:</label>
              <input
                type="text"
                className="cyber-input"
                value={tableData.code}
                onChange={(e) => setTableData({...tableData, code: e.target.value})}
                placeholder="输入表代码（表名）"
              />
            </div>
            <div className="info-group name-group">
              <label>显示名称:</label>
              <input
                type="text"
                className="cyber-input"
                value={tableData.name}
                onChange={(e) => setTableData({...tableData, name: e.target.value})}
                placeholder="输入表显示名称（备注）"
              />
            </div>
            <div className="info-group domain-group">
              <label>所属主题域:</label>
              <span>{getDomainName(tableData.domainId)}</span>
            </div>
            <div className="more-settings-toggle" onClick={() => setShowMoreSettings(!showMoreSettings)}>
              {showMoreSettings ? '收起设置' : '更多设置'} <SettingOutlined />
            </div>
            <div className="save-button-container">
              <button className="action-button" onClick={handleSaveTable}>
                <SaveOutlined /> 保存表
              </button>
            </div>
          </div>

          {/* 更多设置区域 */}
          {showMoreSettings && (
            <div className="table-more-settings">
              <div className="settings-row">
                <div className="setting-group">
                  <label>表备注:</label>
                  <textarea
                    className="cyber-textarea"
                    value={tableData.comment || ''}
                    onChange={(e) => setTableData({...tableData, comment: e.target.value})}
                    placeholder="输入表备注..."
                  />
                </div>
                <div className="setting-group">
                  <label>表类型:</label>
                  <select
                    className="cyber-select"
                    value={tableData.type || 'table'}
                    onChange={(e) => setTableData({...tableData, type: e.target.value})}
                  >
                    <option value="table">普通表</option>
                    <option value="view">视图</option>
                    <option value="dimension">维度表</option>
                    <option value="fact">事实表</option>
                  </select>
                </div>
                <div className="setting-group">
                  <label>创建时间:</label>
                  <span>{new Date(tableData.createTime).toLocaleString()}</span>
                </div>
                <div className="setting-group">
                  <label>修改时间:</label>
                  <span>{new Date(tableData.lastModified).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 非字段标签页下显示简化的表头信息 */}
      {activeTableTab !== 'fields' && (
        <div className="table-header-simple">
          <h2>{tableData.name || tableData.code}</h2>
          <div className="save-button-container">
            <button className="action-button" onClick={handleSaveTable}>
              <SaveOutlined /> 保存表
            </button>
          </div>
        </div>
      )}

      {/* 标签页内容区域 */}
      <div className="table-content-container">
        {renderTabContent()}
      </div>

      {/* 字段编辑模态框 */}
      {isFieldModalOpen && (
        <div className="modal-backdrop" onClick={e => {
          // 仅当点击背景时关闭
          if (e.target === e.currentTarget) {
            setIsFieldModalOpen(false);
          }
        }}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isEditing ? '编辑字段' : '新建字段'}</h2>
              <button className="close-btn" onClick={() => setIsFieldModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={(e) => {
                e.preventDefault();
                
                // 验证
                if (!selectedField?.name || !selectedField?.code) {
                  showError('字段名称和代码不能为空');
                  return;
                }
                
                // 检查字段名是否已存在（仅限于添加新字段时）
                if (!isEditing && tableData?.fields.some(f => f.name === selectedField?.name)) {
                  showError(`字段名 "${selectedField?.name}" 已存在，请使用其他名称`);
                  return;
                }

                // 检查字段代码是否已存在（仅限于添加新字段时）
                if (!isEditing && tableData?.fields.some(f => f.code === selectedField?.code)) {
                  showError(`字段代码 "${selectedField?.code}" 已存在，请使用其他代码`);
                  return;
                }
                
                // 创建字段对象
                const fieldData = {
                  id: selectedField?.id || Date.now().toString(),
                  name: selectedField?.name || '',
                  code: selectedField?.code || '',
                  type: selectedField?.type || 'VARCHAR',
                  length: selectedField?.length,
                  scale: selectedField?.scale,
                  primaryKey: selectedField?.primaryKey || false,
                  notNull: selectedField?.notNull || false,
                  autoIncrement: selectedField?.autoIncrement || false,
                  defaultValue: selectedField?.defaultValue,
                  comment: selectedField?.comment
                };
                
                // 保存字段
                handleSaveField(fieldData);
                setIsFieldModalOpen(false);
              }}>
                {/* 基本信息部分 */}
                <div className="form-section">
                  <div className="form-section-title">
                    <InfoCircleOutlined /> 基本信息
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>
                        <span className="required">*</span> 字段名称:
                      </label>
                      <input
                        type="text"
                        value={selectedField?.name || ''}
                        onChange={(e) => updateSelectedField({ name: e.target.value })}
                        placeholder="请输入字段名称"
                        autoFocus
                      />
                    </div>
                    <div className="form-group">
                      <label>
                        <span className="required">*</span> 字段代码:
                      </label>
                      <input
                        type="text"
                        value={selectedField?.code || ''}
                        onChange={(e) => updateSelectedField({ code: e.target.value })}
                        placeholder="请输入字段代码"
                      />
                    </div>
                  </div>
                </div>
                
                {/* 数据类型部分 */}
                <div className="form-section">
                  <div className="form-section-title">
                    <DatabaseOutlined /> 数据类型
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>数据类型:</label>
                      <select
                        value={selectedField?.type || 'VARCHAR'}
                        onChange={(e) => updateSelectedField({ type: e.target.value })}
                      >
                        {dataTypeOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>长度:</label>
                      <input
                        type="number"
                        value={selectedField?.length || ''}
                        onChange={(e) => updateSelectedField({ length: Number(e.target.value) || undefined })}
                        placeholder="字段长度"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>小数位:</label>
                      <input
                        type="number"
                        value={selectedField?.scale || ''}
                        onChange={(e) => updateSelectedField({ scale: Number(e.target.value) || undefined })}
                        placeholder="小数位数"
                      />
                    </div>
                    <div className="form-group">
                      <label>默认值:</label>
                      <input
                        type="text"
                        value={selectedField?.defaultValue || ''}
                        onChange={(e) => updateSelectedField({ defaultValue: e.target.value })}
                        placeholder="默认值"
                      />
                    </div>
                  </div>
                </div>
                
                {/* 约束与设置部分 */}
                <div className="form-section">
                  <div className="form-section-title">
                    <SettingOutlined /> 约束与设置
                  </div>
                  <div className="checkbox-group">
                    <label className="custom-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedField?.primaryKey || false}
                        onChange={(e) => updateSelectedField({ primaryKey: e.target.checked })}
                      />
                      <div className="checkbox-display"></div>
                      <span className="checkbox-label">主键</span>
                    </label>
                    
                    <label className="custom-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedField?.notNull || false}
                        onChange={(e) => updateSelectedField({ notNull: e.target.checked })}
                      />
                      <div className="checkbox-display"></div>
                      <span className="checkbox-label">不为空</span>
                    </label>
                    
                    <label className="custom-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedField?.autoIncrement || false}
                        onChange={(e) => updateSelectedField({ autoIncrement: e.target.checked })}
                      />
                      <div className="checkbox-display"></div>
                      <span className="checkbox-label">自增</span>
                    </label>
                  </div>
                </div>
                
                {/* 备注部分 */}
                <div className="form-section">
                  <div className="form-section-title">
                    <FileTextOutlined /> 备注说明
                  </div>
                  <div className="form-row full-width">
                    <div className="form-group">
                      <label>备注:</label>
                      <textarea
                        value={selectedField?.comment || ''}
                        onChange={(e) => updateSelectedField({ comment: e.target.value })}
                        placeholder="输入字段备注说明"
                      />
                    </div>
                  </div>
                </div>
                
                {/* 底部按钮 */}
                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={() => setIsFieldModalOpen(false)}>取消</button>
                  <button type="submit" className="btn-save">
                    <SaveOutlined /> 保存
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 添加字段入库分组选择模态框 */}
      <SelectGroupModal
        isOpen={isSelectGroupModalOpen}
        onClose={() => setIsSelectGroupModalOpen(false)}
        onConfirm={handleAddFieldToGroup}
        groups={fieldGroups}
        fieldName={selectedField?.name}
      />
    </div>
  );
};

export default TableDetails;