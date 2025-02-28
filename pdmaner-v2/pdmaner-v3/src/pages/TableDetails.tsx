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
  QuestionCircleOutlined
} from '@ant-design/icons';
import { RootState } from '@store/index';
import { setCurrentProject } from '@store/slices/appSlice';
import { saveProject } from '@utils/projectStorage';
import './TableDetails.css';

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

// 表数据接口定义
interface TableData {
  id: string;
  name: string;        // 表显示名
  code: string;        // 表代码
  comment?: string;    // 表备注
  domainId: string;    // 所属主题域ID
  type: string;        // 表类型
  fields: FieldData[]; // 字段数组
  createTime: number;
  lastModified: number;
}

const TableDetails: React.FC = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentProject = useSelector((state: RootState) => state.app.currentProject);
  
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<FieldData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
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
    console.log('TableDetails 组件加载，尝试获取表数据，tableId:', tableId);
    
    if (currentProject && tableId) {
      console.log('当前项目:', currentProject.info.name);
      console.log('项目表数量:', currentProject.tables?.length || 0);
      
      const table = currentProject.tables?.find(t => t.id === tableId);
      if (table) {
        console.log('找到表数据:', table.name);
        setTableData(table);
      } else {
        console.error(`找不到ID为 ${tableId} 的表`);
        // 如果找不到表，返回到实体列表页
        alert(`找不到ID为 ${tableId} 的表，可能已被删除`);
        navigate('/app/entity/tables');
      }
    } else {
      if (!currentProject) {
        console.error('当前项目为空');
      }
      if (!tableId) {
        console.error('tableId参数为空');
      }
    }
  }, [currentProject, tableId, navigate]);
  
  // 保存表数据
  const handleSaveTable = () => {
    if (!tableData || !currentProject) return;
    
    try {
      // 更新项目中的表数据
      const updatedTables = currentProject.tables.map(table => 
        table.id === tableData.id ? tableData : table
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
      
      console.log('表保存成功');
      alert('表保存成功');
    } catch (error) {
      console.error('保存表失败:', error);
      alert('保存表失败，请检查控制台错误日志');
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
        
        console.log('字段删除成功，项目已自动更新');
      } catch (error) {
        console.error('删除字段并保存项目失败:', error);
        alert('删除字段失败，请检查控制台错误日志');
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
      
      console.log('字段排序成功，项目已自动更新');
    } catch (error) {
      console.error('更新字段排序并保存项目失败:', error);
    }
  };
  
  // 过滤字段
  const getFilteredFields = () => {
    if (!tableData) return [];
    
    if (!searchQuery) return tableData.fields;
    
    return tableData.fields.filter(field => 
      field.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      field.comment?.toLowerCase().includes(searchQuery.toLowerCase())
    );
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
      
      console.log('字段保存成功，项目已自动更新');
    } catch (error) {
      console.error('保存字段到项目失败:', error);
      alert('保存字段失败，但字段已添加到表编辑器中，请手动点击"保存表"按钮进行保存');
    }
    
    setIsFieldModalOpen(false);
  };
  
  // 获取当前主题域名称
  const getDomainName = (domainId: string): string => {
    if (!currentProject) return '';
    
    const domain = currentProject.domains.find(d => d.id === domainId);
    return domain ? domain.name : '未知主题域';
  };
  
  if (!tableData) {
    return <div className="loading-container">加载表信息中...</div>;
  }
  
  return (
    <div className="table-details-container">
      <div className="table-header">
        <div className="table-title-section">
          <h2>{tableData.name}</h2>
          <div className="table-info">
            <span className="info-item">表代码: <strong>{tableData.code}</strong></span>
            <span className="info-item">主题域: <strong>{getDomainName(tableData.domainId)}</strong></span>
            <span className="info-item">字段数: <strong>{tableData.fields.length}</strong></span>
          </div>
          <div className="table-comment">{tableData.comment || '无表备注'}</div>
        </div>
        
        <div className="table-actions">
          <button className="save-button" onClick={handleSaveTable}>
            <SaveOutlined /> 保存表
          </button>
        </div>
      </div>
      
      <div className="tabs-container">
        <div className="tab active">字段</div>
        <div className="tab">索引</div>
        <div className="tab">关系</div>
        <div className="tab">SQL预览</div>
      </div>
      
      <div className="tab-content">
        <div className="fields-panel">
          <div className="fields-toolbar">
            <div className="search-box">
              <SearchOutlined />
              <input 
                type="text" 
                placeholder="搜索字段..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <button className="add-field-button" onClick={handleAddField}>
              <PlusOutlined /> 添加字段
            </button>
          </div>
          
          <div className="fields-table-wrapper">
            <table className="fields-table">
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
                      <InfoCircleOutlined /> 暂无字段，请添加字段
                    </td>
                  </tr>
                ) : (
                  getFilteredFields().map((field, index) => (
                    <tr key={field.id} className={field.primaryKey ? 'primary-key-row' : ''}>
                      <td>{index + 1}</td>
                      <td>{field.name}</td>
                      <td>{field.type}</td>
                      <td>{field.length || '-'}</td>
                      <td>{field.scale || '-'}</td>
                      <td>{field.primaryKey ? <KeyOutlined className="primary-key-icon" /> : '-'}</td>
                      <td>{field.notNull ? '√' : '-'}</td>
                      <td>{field.autoIncrement ? '√' : '-'}</td>
                      <td className="default-value-cell">{field.defaultValue || '-'}</td>
                      <td className="comment-cell">{field.comment || '-'}</td>
                      <td className="actions-cell">
                        <button title="向上移动" onClick={() => handleMoveField(field.id, 'up')}>
                          <UpOutlined />
                        </button>
                        <button title="向下移动" onClick={() => handleMoveField(field.id, 'down')}>
                          <DownOutlined />
                        </button>
                        <button title="编辑" onClick={() => handleEditField(field)}>
                          <EditOutlined />
                        </button>
                        <button title="复制">
                          <CopyOutlined />
                        </button>
                        <button 
                          title="删除" 
                          className="delete-button"
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
      
      {isFieldModalOpen && (
        <div className="field-modal-backdrop">
          <div className="field-modal">
            <div className="field-modal-header">
              <h3>{isEditing ? '编辑字段' : '新建字段'}</h3>
              <button className="close-button" onClick={() => setIsFieldModalOpen(false)}>×</button>
            </div>
            <div className="field-modal-content">
              <form onSubmit={(e) => {
                e.preventDefault();
                // 模拟提交
                const formData = new FormData(e.currentTarget);
                const field: FieldData = {
                  id: selectedField?.id || '',
                  name: formData.get('name') as string,
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
                <div className="form-row">
                  <div className="form-group">
                    <label>字段名 <span className="required">*</span></label>
                    <input 
                      type="text" 
                      name="name" 
                      required 
                      defaultValue={selectedField?.name || ''}
                    />
                  </div>
                  <div className="form-group">
                    <label>数据类型 <span className="required">*</span></label>
                    <select name="type" required defaultValue={selectedField?.type || 'VARCHAR'}>
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
                      defaultValue={selectedField?.length || ''}
                    />
                  </div>
                  <div className="form-group">
                    <label>小数位数</label>
                    <input 
                      type="number" 
                      name="scale" 
                      min="0"
                      defaultValue={selectedField?.scale || ''}
                    />
                  </div>
                </div>
                
                <div className="form-row checkbox-group">
                  <div className="form-check">
                    <input 
                      type="checkbox" 
                      id="primaryKey" 
                      name="primaryKey"
                      defaultChecked={selectedField?.primaryKey || false}
                    />
                    <label htmlFor="primaryKey">主键</label>
                  </div>
                  <div className="form-check">
                    <input 
                      type="checkbox" 
                      id="notNull" 
                      name="notNull"
                      defaultChecked={selectedField?.notNull || false}
                    />
                    <label htmlFor="notNull">不为空</label>
                  </div>
                  <div className="form-check">
                    <input 
                      type="checkbox" 
                      id="autoIncrement" 
                      name="autoIncrement"
                      defaultChecked={selectedField?.autoIncrement || false}
                    />
                    <label htmlFor="autoIncrement">自增</label>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>默认值</label>
                  <input 
                    type="text" 
                    name="defaultValue"
                    defaultValue={selectedField?.defaultValue || ''}
                  />
                </div>
                
                <div className="form-group">
                  <label>备注</label>
                  <textarea 
                    name="comment"
                    rows={3}
                    defaultValue={selectedField?.comment || ''}
                  ></textarea>
                </div>
                
                <div className="modal-buttons">
                  <button type="button" className="cancel-button" onClick={() => setIsFieldModalOpen(false)}>
                    取消
                  </button>
                  <button type="submit" className="submit-button">
                    {isEditing ? '保存修改' : '添加字段'}
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