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
  FileTextOutlined
} from '@ant-design/icons';
import { RootState } from '@store/index';
import { setCurrentProject } from '@store/slices/appSlice';
import { saveProject } from '@utils/projectStorage';
import './TableDetails.css';
import { useNotificationContext } from '../contexts/NotificationContext';

// 字段接口定义
interface FieldData {
  id: string;
  name: string;        // 字段名
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

  // 添加索引相关状态
  const [isIndexModalOpen, setIsIndexModalOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<IndexData | null>(null);
  const [isEditingIndex, setIsEditingIndex] = useState(false);

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
    setSelectedField(null);
    setIsEditing(false);
    setIsFieldModalOpen(true);
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

  // 处理字段排序
  const handleMoveField = (fieldId: string, direction: 'up' | 'down') => {
    if (!tableData || !currentProject) return;

    const fieldIndex = tableData.fields.findIndex(field => field.id === fieldId);
    if (fieldIndex === -1) return;

    const newFields = [...tableData.fields];

    if (direction === 'up' && fieldIndex > 0) {
      [newFields[fieldIndex], newFields[fieldIndex - 1]] = [newFields[fieldIndex - 1], newFields[fieldIndex]];
    } else if (direction === 'down' && fieldIndex < newFields.length - 1) {
      [newFields[fieldIndex], newFields[fieldIndex + 1]] = [newFields[fieldIndex + 1], newFields[fieldIndex]];
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

      successNotification('字段排序成功，项目已自动更新');
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
      <div className="fields-panel">
        <div className="fields-toolbar">
          <button className="add-button" onClick={handleAddField}>
            <PlusOutlined /> 添加字段
          </button>
        </div>

        <div className="fields-table-wrapper">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>序号</th>
                  <th>名称</th>
                  <th>数据类型</th>
                  <th>长度/精度</th>
                  <th>小数位</th>
                  <th>主键</th>
                  <th>不为空</th>
                  <th>自增</th>
                  <th>默认值</th>
                  <th>备注</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredFields().length === 0 ? (
                  <tr>
                    <td colSpan={11} className="empty-message">
                      <InfoCircleOutlined /> 暂无字段，请添加
                    </td>
                  </tr>
                ) : (
                  getFilteredFields().map((field, index) => (
                    <tr key={field.id} className={field.primaryKey ? 'primary-key-row' : ''}>
                      <td>{index + 1}</td>
                      <td>{field.name}</td>
                      <td><span className="type-badge">{field.type}</span></td>
                      <td>{field.length || '-'}</td>
                      <td>{field.scale || '-'}</td>
                      <td>{field.primaryKey ? <span className="pk-badge"><KeyOutlined /></span> : '-'}</td>
                      <td>{field.notNull ? '√' : '-'}</td>
                      <td>{field.autoIncrement ? '√' : '-'}</td>
                      <td className="default-value-cell">{field.defaultValue || '-'}</td>
                      <td className="comment-cell">{field.comment || '-'}</td>
                      <td className="actions-cell">
                        <button title="向上移动" className="table-action-btn" onClick={() => handleMoveField(field.id, 'up')}>
                          <UpOutlined />
                        </button>
                        <button title="向下移动" className="table-action-btn" onClick={() => handleMoveField(field.id, 'down')}>
                          <DownOutlined />
                        </button>
                        <button title="编辑" className="table-action-btn" onClick={() => handleEditField(field)}>
                          <EditOutlined />
                        </button>
                        <button title="复制" className="table-action-btn" onClick={() => handleCopyField(field)}>
                          <CopyOutlined />
                        </button>
                        <button
                          title="删除"
                          className="table-action-btn delete-btn"
                          onClick={() => handleDeleteField(field.id)}
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
                        <button title="向上移动" className="table-action-btn" onClick={() => handleMoveIndex(index.id, 'up')}>
                          <UpOutlined />
                        </button>
                        <button title="向下移动" className="table-action-btn" onClick={() => handleMoveIndex(index.id, 'down')}>
                          <DownOutlined />
                        </button>
                        <button title="编辑" className="table-action-btn" onClick={() => handleEditIndex(index)}>
                          <EditOutlined />
                        </button>
                        <button
                          title="删除"
                          className="table-action-btn delete-btn"
                          onClick={() => handleDeleteIndex(index.id)}
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
        <div className="modal-backdrop">
          <div className="modal-container cyber-card">
            <div className="modal-header">
              <h2 className="cyber-title">{isEditing ? '编辑字段' : '新建字段'}</h2>
              <button className="close-btn" onClick={() => setIsFieldModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={(e) => {
                e.preventDefault();
                // 获取表单数据
                const formData = new FormData(e.currentTarget);
                const fieldName = formData.get('name') as string;

                // 检查字段名是否已存在（仅限于添加新字段时）
                if (!isEditing && tableData?.fields.some(f => f.name === fieldName)) {
                  showError(`字段名 "${fieldName}" 已存在，请使用其他名称`);
                  return;
                }

                const field: FieldData = {
                  id: selectedField?.id || '',
                  name: fieldName,
                  type: formData.get('type') as string,
                  length: parseInt(formData.get('length') as string) || undefined,
                  scale: parseInt(formData.get('scale') as string) || undefined,
                  primaryKey: !!formData.get('primaryKey'),
                  notNull: !!formData.get('notNull'),
                  autoIncrement: !!formData.get('autoIncrement'),
                  defaultValue: formData.get('defaultValue') as string || undefined,
                  comment: formData.get('comment') as string || undefined
                };
                handleSaveField(field);
              }}>
                <div className="form-section">
                  <h3 className="section-title">基本信息</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>字段名 <span className="required">*</span></label>
                      <input
                        type="text"
                        name="name"
                        required
                        className="cyber-input"
                        defaultValue={selectedField?.name || ''}
                        placeholder="输入字段名称"
                      />
                    </div>
                    <div className="form-group">
                      <label>数据类型 <span className="required">*</span></label>
                      <select
                        name="type"
                        required
                        className="cyber-select"
                        defaultValue={selectedField?.type || 'VARCHAR'}
                      >
                        {dataTypeOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>长度/精度</label>
                      <input
                        type="number"
                        name="length"
                        min="0"
                        className="cyber-input"
                        defaultValue={selectedField?.length || ''}
                        placeholder="字段长度"
                      />
                    </div>
                    <div className="form-group">
                      <label>小数位数</label>
                      <input
                        type="number"
                        name="scale"
                        min="0"
                        className="cyber-input"
                        defaultValue={selectedField?.scale || ''}
                        placeholder="小数位数"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3 className="section-title">属性设置</h3>
                  <div className="cyber-checkbox-group">
                    <div className="cyber-checkbox">
                      <input
                        type="checkbox"
                        id="primaryKey"
                        name="primaryKey"
                        defaultChecked={selectedField?.primaryKey || false}
                      />
                      <label htmlFor="primaryKey">
                        <span className="checkbox-icon"></span>
                        <span className="checkbox-text">主键</span>
                      </label>
                    </div>
                    <div className="cyber-checkbox">
                      <input
                        type="checkbox"
                        id="notNull"
                        name="notNull"
                        defaultChecked={selectedField?.notNull || false}
                      />
                      <label htmlFor="notNull">
                        <span className="checkbox-icon"></span>
                        <span className="checkbox-text">不为空</span>
                      </label>
                    </div>
                    <div className="cyber-checkbox">
                      <input
                        type="checkbox"
                        id="autoIncrement"
                        name="autoIncrement"
                        defaultChecked={selectedField?.autoIncrement || false}
                      />
                      <label htmlFor="autoIncrement">
                        <span className="checkbox-icon"></span>
                        <span className="checkbox-text">自增</span>
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>默认值</label>
                    <input
                      type="text"
                      name="defaultValue"
                      className="cyber-input"
                      defaultValue={selectedField?.defaultValue || ''}
                      placeholder="字段默认值（可选）"
                    />
                  </div>

                  <div className="form-group">
                    <label>备注</label>
                    <textarea
                      name="comment"
                      rows={3}
                      className="cyber-textarea"
                      defaultValue={selectedField?.comment || ''}
                      placeholder="字段说明（可选）"
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="cancel-btn" onClick={() => setIsFieldModalOpen(false)}>
                    取消
                  </button>
                  <button type="submit" className="confirm-btn">
                    {isEditing ? '保存修改' : '添加字段'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 索引编辑模态框 */}
      {isIndexModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-container cyber-card">
            <div className="modal-header">
              <h2 className="cyber-title">{isEditingIndex ? '编辑索引' : '新建索引'}</h2>
              <button className="close-btn" onClick={() => setIsIndexModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={(e) => {
                e.preventDefault();
                // 获取表单数据
                const formData = new FormData(e.currentTarget);
                const indexName = formData.get('name') as string;

                // 检查索引名是否已存在（仅限于添加新索引时）
                if (!isEditingIndex && tableData?.indexes.some(i => i.name === indexName)) {
                  showError(`索引名 "${indexName}" 已存在，请使用其他名称`);
                  return;
                }

                // 获取选中的字段IDs
                const selectedFieldIds: string[] = [];
                tableData?.fields.forEach(field => {
                  if (formData.get(`field_${field.id}`)) {
                    selectedFieldIds.push(field.id);
                  }
                });

                if (selectedFieldIds.length === 0) {
                  showError('请至少选择一个字段');
                  return;
                }

                const index: IndexData = {
                  id: selectedIndex?.id || '',
                  name: indexName,
                  fields: selectedFieldIds,
                  unique: !!formData.get('unique'),
                  comment: formData.get('comment') as string || undefined
                };
                handleSaveIndex(index);
              }}>
                <div className="form-section">
                  <h3 className="section-title">基本信息</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>索引名称 <span className="required">*</span></label>
                      <input
                        type="text"
                        name="name"
                        required
                        className="cyber-input"
                        defaultValue={selectedIndex?.name || ''}
                        placeholder="输入索引名称"
                      />
                    </div>
                    <div className="cyber-checkbox">
                      <input
                        type="checkbox"
                        id="unique"
                        name="unique"
                        defaultChecked={selectedIndex?.unique || false}
                      />
                      <label htmlFor="unique">
                        <span className="checkbox-icon"></span>
                        <span className="checkbox-text">唯一索引</span>
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>备注</label>
                    <textarea
                      name="comment"
                      rows={2}
                      className="cyber-textarea"
                      defaultValue={selectedIndex?.comment || ''}
                      placeholder="索引说明（可选）"
                    ></textarea>
                  </div>
                </div>

                <div className="form-section">
                  <h3 className="section-title">选择字段</h3>
                  <div className="fields-selection">
                    {tableData?.fields.map(field => (
                      <div key={field.id} className="cyber-checkbox">
                        <input
                          type="checkbox"
                          id={`field_${field.id}`}
                          name={`field_${field.id}`}
                          defaultChecked={selectedIndex?.fields.includes(field.id) || false}
                        />
                        <label htmlFor={`field_${field.id}`}>
                          <span className="checkbox-icon"></span>
                          <span className="checkbox-text">{field.name}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="cancel-btn" onClick={() => setIsIndexModalOpen(false)}>
                    取消
                  </button>
                  <button type="submit" className="confirm-btn">
                    {isEditingIndex ? '保存修改' : '添加索引'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableDetails;
