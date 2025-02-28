import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DragOutlined,
  CaretDownOutlined,
  CaretRightOutlined,
  SaveOutlined,
  ImportOutlined,
  ExportOutlined,
  SettingOutlined,
  KeyOutlined
} from '@ant-design/icons';
import { RootState } from '@store/index';
import { setCurrentProject } from '@store/slices/appSlice';
import { useNotificationContext } from '../../contexts/NotificationContext';
import './StandardFieldsLibrary.css';

// 定义字段组和字段数据接口
interface StandardField {
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

interface FieldGroup {
  id: string;
  name: string;
  code: string;
  fields: StandardField[];
  expanded?: boolean;
}

// 标准字段库组件
const StandardFieldsLibrary: React.FC = () => {
  // 获取redux中的状态和dispatch方法
  const dispatch = useDispatch();
  const currentProject = useSelector((state: RootState) => state.app.currentProject);
  const { success } = useNotificationContext();
  
  // 状态
  const [collapsed, setCollapsed] = useState(true); // 默认收起
  const [searchTerm, setSearchTerm] = useState('');
  const [fieldGroups, setFieldGroups] = useState<FieldGroup[]>([
    {
      id: '1',
      name: '基础字段',
      code: 'base',
      expanded: true,
      fields: [
        {
          id: '101',
          name: '主键ID',
          code: 'id',
          type: 'bigint',
          length: 20,
          primaryKey: true,
          notNull: true,
          autoIncrement: true,
          comment: '主键'
        },
        {
          id: '102',
          name: '创建时间',
          code: 'create_time',
          type: 'datetime',
          primaryKey: false,
          notNull: true,
          autoIncrement: false,
          comment: '创建时间'
        }
      ]
    },
    {
      id: '2',
      name: '审计字段',
      code: 'audit',
      expanded: false,
      fields: [
        {
          id: '201',
          name: '创建人',
          code: 'create_by',
          type: 'varchar',
          length: 50,
          primaryKey: false,
          notNull: true,
          autoIncrement: false,
          comment: '创建人'
        },
        {
          id: '202',
          name: '更新时间',
          code: 'update_time',
          type: 'datetime',
          primaryKey: false,
          notNull: false,
          autoIncrement: false,
          comment: '更新时间'
        },
        {
          id: '203',
          name: '更新人',
          code: 'update_by',
          type: 'varchar',
          length: 50,
          primaryKey: false,
          notNull: false,
          autoIncrement: false,
          comment: '更新人'
        }
      ]
    }
  ]);

  // 模态框状态
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [isEditingField, setIsEditingField] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<StandardField | null>(null);
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
  const [activeGroupInManagement, setActiveGroupInManagement] = useState<string | null>(null);

  // 初始化标准字段数据
  useEffect(() => {
    if (currentProject) {
      // 从项目中获取标准字段库数据
      const standardFields = currentProject.standardFields || [];
      setFieldGroups(standardFields.map(group => ({
        ...group,
        expanded: false // 初始状态为折叠
      })));

      // 如果没有字段组，创建初始示例组
      if (standardFields.length === 0) {
        const initialGroups: FieldGroup[] = [
          {
            id: 'common',
            name: '通用规范(common)',
            code: 'common',
            expanded: true,
            fields: [
              {
                id: 'id',
                name: 'id(主键id)',
                code: 'id',
                type: 'BIGINT',
                primaryKey: true,
                notNull: true,
                autoIncrement: true,
                comment: '主键ID'
              },
              {
                id: 'create_time',
                name: 'create_time(创建时间)',
                code: 'create_time',
                type: 'DATETIME',
                primaryKey: false,
                notNull: true,
                autoIncrement: false,
                comment: '创建时间'
              },
              {
                id: 'update_time',
                name: 'update_time(更新时间)',
                code: 'update_time',
                type: 'DATETIME',
                primaryKey: false,
                notNull: true,
                autoIncrement: false,
                comment: '更新时间'
              }
            ]
          },
          {
            id: 'order',
            name: '订单相关(order)',
            code: 'order',
            expanded: false,
            fields: [
              {
                id: 'order_no',
                name: 'order_no(订单编号)',
                code: 'order_no',
                type: 'VARCHAR',
                length: 64,
                primaryKey: false,
                notNull: true,
                autoIncrement: false,
                comment: '订单编号'
              }
            ]
          }
        ];
        
        setFieldGroups(initialGroups);
      }
    }
  }, [currentProject]);

  // 收起/展开标准字段库
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  // 展开/折叠字段组
  const toggleGroupExpanded = (groupId: string) => {
    setFieldGroups(fieldGroups.map(group => 
      group.id === groupId 
        ? { ...group, expanded: !group.expanded } 
        : group
    ));
  };

  // 拖拽开始
  const handleDragStart = (e: React.DragEvent, field: StandardField) => {
    // 设置拖拽数据
    e.dataTransfer.setData('application/json', JSON.stringify(field));
    
    // 设置拖拽图像
    const dragImage = document.createElement('div');
    dragImage.className = 'dragging-indicator';
    dragImage.textContent = field.name;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 20, 20);
    
    // 设置允许的拖放效果
    e.dataTransfer.effectAllowed = 'copy';
    
    // 在拖拽结束后移除拖拽图像
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  };

  // 添加新的字段分组
  const handleAddGroup = (name: string, code: string) => {
    const newGroup: FieldGroup = {
      id: `group_${Date.now()}`,
      name,
      code,
      fields: [],
      expanded: true
    };
    
    setFieldGroups([...fieldGroups, newGroup]);
    setIsAddGroupModalOpen(false);
    
    // 如果是在管理模式下添加的，则设置为活动分组
    if (isManagementModalOpen) {
      setActiveGroupInManagement(newGroup.id);
    }
  };

  // 添加新字段
  const handleAddField = (groupId: string, field: StandardField) => {
    const newField: StandardField = {
      ...field,
      id: `field_${Date.now()}`
    };
    
    setFieldGroups(fieldGroups.map(group => 
      group.id === groupId 
        ? { ...group, fields: [...group.fields, newField] } 
        : group
    ));
    
    setIsFieldModalOpen(false);
    setSelectedGroupId(null);
    setSelectedField(null);
  };

  // 编辑字段
  const handleEditField = (groupId: string, field: StandardField) => {
    setFieldGroups(fieldGroups.map(group => 
      group.id === groupId 
        ? { 
            ...group, 
            fields: group.fields.map(f => 
              f.id === field.id ? field : f
            ) 
          } 
        : group
    ));
    
    setIsFieldModalOpen(false);
    setSelectedGroupId(null);
    setSelectedField(null);
    setIsEditingField(false);
  };

  // 删除字段
  const handleDeleteField = (groupId: string, fieldId: string) => {
    if (window.confirm('确定要删除这个字段吗？')) {
      setFieldGroups(fieldGroups.map(group => 
        group.id === groupId 
          ? { 
              ...group, 
              fields: group.fields.filter(field => field.id !== fieldId) 
            } 
          : group
      ));
    }
  };

  // 删除分组
  const handleDeleteGroup = (groupId: string) => {
    if (window.confirm('确定要删除这个分组及其所有字段吗？')) {
      setFieldGroups(fieldGroups.filter(group => group.id !== groupId));
      
      // 如果删除的是当前活动的分组，清除活动分组
      if (activeGroupInManagement === groupId) {
        setActiveGroupInManagement(null);
      }
    }
  };

  // 保存标准字段库配置
  const handleSaveStandardFields = () => {
    // 这里可以添加保存到本地存储或发送到服务器的逻辑
    console.log('保存标准字段库', fieldGroups);
    
    // 关闭管理模态框
    setIsManagementModalOpen(false);
    alert('标准字段库配置已保存');
  };

  // 根据搜索词过滤分组和字段
  const getFilteredGroups = () => {
    if (!searchTerm.trim()) return fieldGroups;
    
    return fieldGroups.map(group => {
      const filteredFields = group.fields.filter(field => 
        field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.comment?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      return {
        ...group,
        fields: filteredFields,
        expanded: filteredFields.length > 0 // 如果有匹配的字段，自动展开
      };
    }).filter(group => group.fields.length > 0);
  };

  // 渲染字段分组
  const renderFieldGroups = () => {
    const filteredGroups = getFilteredGroups();
    
    if (filteredGroups.length === 0) {
      return (
        <div className="no-fields-message">
          <p>没有找到匹配的字段</p>
          <button 
            className="add-group-btn"
            onClick={() => setIsAddGroupModalOpen(true)}
          >
            添加新分组
          </button>
        </div>
      );
    }
    
    return filteredGroups.map(group => (
      <div key={group.id} className="field-group">
        <div className="group-header">
          <div 
            className="group-title"
            onClick={() => toggleGroupExpanded(group.id)}
          >
            {group.expanded ? 
              <CaretDownOutlined /> : 
              <CaretRightOutlined />
            }
            {group.name} <span className="group-code">({group.code})</span>
          </div>
          <div className="group-actions">
            <button
              title="添加字段"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedGroupId(group.id);
                setIsEditingField(false);
                setSelectedField(null);
                setIsFieldModalOpen(true);
              }}
            >
              <PlusOutlined />
            </button>
          </div>
        </div>
        
        {group.expanded && (
          <div className="group-fields">
            {group.fields.map(field => (
              <div 
                key={field.id} 
                className="standard-field-item"
                draggable
                onDragStart={(e) => handleDragStart(e, field)}
              >
                <div className="drag-icon">
                  <DragOutlined />
                </div>
                <div className="field-info">
                  <div className="field-name">
                    {field.name}
                    {field.primaryKey && <KeyOutlined style={{ marginLeft: '5px', color: '#faad14' }} />}
                  </div>
                  <div className="field-type">
                    {field.type}{field.length ? `(${field.length}${field.scale ? `,${field.scale}` : ''})` : ''}
                  </div>
                </div>
                <div className="field-actions">
                  <button
                    title="编辑字段"
                    onClick={() => {
                      setSelectedGroupId(group.id);
                      setSelectedField(field);
                      setIsEditingField(true);
                      setIsFieldModalOpen(true);
                    }}
                  >
                    <EditOutlined />
                  </button>
                  <button
                    title="删除字段"
                    onClick={() => handleDeleteField(group.id, field.id)}
                  >
                    <DeleteOutlined />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    ));
  };

  // 渲染添加分组模态框
  const renderAddGroupModal = () => {
    return (
      <div className={`modal-backdrop ${isAddGroupModalOpen ? 'visible' : ''}`} onClick={() => setIsAddGroupModalOpen(false)}>
        <div className="modal-container" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>添加字段分组</h3>
            <button className="close-btn" onClick={() => setIsAddGroupModalOpen(false)}>×</button>
          </div>
          <div className="modal-body">
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const formData = new FormData(form);
              const name = formData.get('name') as string;
              const code = formData.get('code') as string;
              
              if (!name.trim() || !code.trim()) {
                alert('名称和代码不能为空');
                return;
              }
              
              handleAddGroup(name, code);
            }}>
              <div className="form-group">
                <label>分组名称</label>
                <input 
                  type="text" 
                  name="name" 
                  className="cyber-input" 
                  placeholder="例如：基础字段" 
                  required 
                />
              </div>
              <div className="form-group">
                <label>分组代码</label>
                <input 
                  type="text" 
                  name="code" 
                  className="cyber-input" 
                  placeholder="例如：base" 
                  required 
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={() => setIsAddGroupModalOpen(false)}>取消</button>
                <button type="submit" className="confirm-btn">确定</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // 渲染字段编辑/添加模态框
  const renderFieldModal = () => {
    return (
      <div className={`modal-backdrop ${isFieldModalOpen ? 'visible' : ''}`} onClick={() => setIsFieldModalOpen(false)}>
        <div className="modal-container" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>{isEditingField ? '编辑字段' : '添加字段'}</h3>
            <button className="close-btn" onClick={() => setIsFieldModalOpen(false)}>×</button>
          </div>
          <div className="modal-body">
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const formData = new FormData(form);
              
              const field: StandardField = {
                id: selectedField?.id || '',
                name: formData.get('name') as string,
                code: formData.get('code') as string,
                type: formData.get('type') as string,
                length: formData.get('length') ? parseInt(formData.get('length') as string) : undefined,
                scale: formData.get('scale') ? parseInt(formData.get('scale') as string) : undefined,
                primaryKey: !!formData.get('primaryKey'),
                notNull: !!formData.get('notNull'),
                autoIncrement: !!formData.get('autoIncrement'),
                defaultValue: formData.get('defaultValue') as string || undefined,
                comment: formData.get('comment') as string || undefined
              };
              
              if (!field.name.trim() || !field.code.trim()) {
                alert('名称和代码不能为空');
                return;
              }
              
              if (isEditingField && selectedField && selectedGroupId) {
                handleEditField(selectedGroupId, field);
              } else if (selectedGroupId) {
                handleAddField(selectedGroupId, field);
              }
            }}>
              <div className="form-row">
                <div className="form-group">
                  <label>字段名称 <span className="required">*</span></label>
                  <input 
                    type="text" 
                    name="name" 
                    className="cyber-input" 
                    defaultValue={selectedField?.name || ''} 
                    placeholder="例如：创建时间" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>字段代码 <span className="required">*</span></label>
                  <input 
                    type="text" 
                    name="code" 
                    className="cyber-input" 
                    defaultValue={selectedField?.code || ''} 
                    placeholder="例如：create_time" 
                    required 
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>数据类型 <span className="required">*</span></label>
                  <select 
                    name="type" 
                    className="cyber-select" 
                    defaultValue={selectedField?.type || 'varchar'}
                    required
                  >
                    <option value="varchar">VARCHAR</option>
                    <option value="char">CHAR</option>
                    <option value="int">INT</option>
                    <option value="bigint">BIGINT</option>
                    <option value="decimal">DECIMAL</option>
                    <option value="datetime">DATETIME</option>
                    <option value="date">DATE</option>
                    <option value="text">TEXT</option>
                    <option value="boolean">BOOLEAN</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>长度</label>
                  <input 
                    type="number" 
                    name="length" 
                    className="cyber-input" 
                    defaultValue={selectedField?.length || ''} 
                    placeholder="例如：32" 
                  />
                </div>
                <div className="form-group">
                  <label>小数位</label>
                  <input 
                    type="number" 
                    name="scale" 
                    className="cyber-input" 
                    defaultValue={selectedField?.scale || ''} 
                    placeholder="例如：2" 
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>默认值</label>
                <input 
                  type="text" 
                  name="defaultValue" 
                  className="cyber-input" 
                  defaultValue={selectedField?.defaultValue || ''} 
                  placeholder="例如：CURRENT_TIMESTAMP" 
                />
              </div>
              
              <div className="checkbox-row">
                <div className="cyber-checkbox">
                  <input 
                    type="checkbox" 
                    id="primaryKey" 
                    name="primaryKey" 
                    defaultChecked={selectedField?.primaryKey} 
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
                    defaultChecked={selectedField?.notNull} 
                  />
                  <label htmlFor="notNull">
                    <span className="checkbox-icon"></span>
                    <span className="checkbox-text">非空</span>
                  </label>
                </div>
                
                <div className="cyber-checkbox">
                  <input 
                    type="checkbox" 
                    id="autoIncrement" 
                    name="autoIncrement" 
                    defaultChecked={selectedField?.autoIncrement} 
                  />
                  <label htmlFor="autoIncrement">
                    <span className="checkbox-icon"></span>
                    <span className="checkbox-text">自增</span>
                  </label>
                </div>
              </div>
              
              <div className="form-group">
                <label>备注</label>
                <textarea 
                  name="comment" 
                  className="cyber-textarea" 
                  defaultValue={selectedField?.comment || ''} 
                  placeholder="字段的备注信息"
                ></textarea>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={() => setIsFieldModalOpen(false)}>取消</button>
                <button type="submit" className="confirm-btn">确定</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // 打开管理模态框
  const openManagementModal = () => {
    setIsManagementModalOpen(true);
    setActiveGroupInManagement(fieldGroups.length > 0 ? fieldGroups[0].id : null);
  };

  // 关闭管理模态框
  const closeManagementModal = () => {
    setIsManagementModalOpen(false);
    setActiveGroupInManagement(null);
  };

  // 渲染字段库管理模态框
  const renderManagementModal = () => {
    if (!isManagementModalOpen) return null;
    
    // 找到当前选中的分组
    const activeGroup = fieldGroups.find(group => group.id === activeGroupInManagement);
    
    // 使用ReactDOM.createPortal将模态框渲染到body
    return (
      <div className="modal-backdrop visible" onClick={closeManagementModal}>
        <div className="management-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>标准字段库管理</h3>
            <button className="close-btn" onClick={closeManagementModal}>×</button>
          </div>
          
          <div className="management-body">
            <div className="management-sidebar">
              <div className="management-header">
                <h4>字段分组</h4>
                <button 
                  className="add-group-btn mini"
                  onClick={() => setIsAddGroupModalOpen(true)}
                >
                  <PlusOutlined />
                </button>
              </div>
              
              <div className="group-list">
                {fieldGroups.map(group => (
                  <div 
                    key={group.id}
                    className={`group-item ${group.id === activeGroupInManagement ? 'active' : ''}`}
                    onClick={() => setActiveGroupInManagement(group.id)}
                  >
                    <div>
                      <div className="group-name">{group.name}</div>
                      <div className="group-code">{group.code}</div>
                    </div>
                    <div className="group-actions">
                      <button
                        title="删除分组"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGroup(group.id);
                        }}
                      >
                        <DeleteOutlined />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="management-content">
              {activeGroup ? (
                <>
                  <div className="fields-header">
                    <h4>{activeGroup.name} 字段列表</h4>
                    <div className="fields-actions">
                      <button 
                        className="add-field-btn"
                        onClick={() => {
                          setSelectedGroupId(activeGroup.id);
                          setIsEditingField(false);
                          setSelectedField(null);
                          setIsFieldModalOpen(true);
                        }}
                      >
                        <PlusOutlined /> 添加字段
                      </button>
                    </div>
                  </div>
                  
                  <div className="fields-table-container">
                    <table className="fields-table">
                      <thead>
                        <tr>
                          <th style={{ width: '20%' }}>名称</th>
                          <th style={{ width: '15%' }}>代码</th>
                          <th style={{ width: '15%' }}>类型</th>
                          <th style={{ width: '10%' }}>主键</th>
                          <th style={{ width: '10%' }}>非空</th>
                          <th style={{ width: '10%' }}>自增</th>
                          <th style={{ width: '20%' }}>备注</th>
                          <th style={{ width: '10%' }}>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeGroup.fields.length === 0 ? (
                          <tr>
                            <td colSpan={8} style={{textAlign: 'center', padding: '20px'}}>
                              暂无字段，请添加
                            </td>
                          </tr>
                        ) : (
                          activeGroup.fields.map(field => (
                            <tr key={field.id}>
                              <td>{field.name}</td>
                              <td>{field.code}</td>
                              <td>
                                {field.type}
                                {field.length ? 
                                  `(${field.length}${field.scale ? `,${field.scale}` : ''})` : 
                                  ''
                                }
                              </td>
                              <td>{field.primaryKey ? '✓' : '—'}</td>
                              <td>{field.notNull ? '✓' : '—'}</td>
                              <td>{field.autoIncrement ? '✓' : '—'}</td>
                              <td className="comment-cell">{field.comment || '—'}</td>
                              <td>
                                <div className="table-actions">
                                  <button
                                    title="编辑"
                                    onClick={() => {
                                      setSelectedGroupId(activeGroup.id);
                                      setSelectedField(field);
                                      setIsEditingField(true);
                                      setIsFieldModalOpen(true);
                                    }}
                                  >
                                    <EditOutlined />
                                  </button>
                                  <button
                                    title="删除"
                                    onClick={() => handleDeleteField(activeGroup.id, field.id)}
                                  >
                                    <DeleteOutlined />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="no-group-selected">
                  <p>请选择或创建一个字段分组</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="modal-footer" style={{borderTop: '1px solid rgba(5, 217, 232, 0.2)'}}>
            <button className="cancel-btn" onClick={closeManagementModal}>取消</button>
            <button className="confirm-btn save-btn" onClick={handleSaveStandardFields}>保存</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={`standard-fields-library ${collapsed ? 'collapsed' : ''}`}>
        <button 
          className="toggle-button"
          onClick={toggleCollapsed}
          title={collapsed ? '展开标准字段库' : '收起标准字段库'}
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          {!collapsed && <span>标准字段库</span>}
        </button>
        
        {!collapsed && (
          <div className="library-content">
            <div className="library-header">
              <h2>标准字段库</h2>
              <div className="header-actions">
                <button title="管理字段库" onClick={openManagementModal}>
                  <SettingOutlined />
                  管理
                </button>
                <button title="添加分组" onClick={() => setIsAddGroupModalOpen(true)}>
                  <PlusOutlined />
                  添加分组
                </button>
              </div>
            </div>
            
            <div className="search-container">
              <div className="search-box">
                <SearchOutlined />
                <input
                  type="text"
                  placeholder="搜索字段..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="field-groups-container">
              {renderFieldGroups()}
            </div>
          </div>
        )}
      </div>
      
      {/* 模态框放在组件外部，避免受组件布局影响 */}
      {renderAddGroupModal()}
      {renderFieldModal()}
      {renderManagementModal()}
    </>
  );
};

export default StandardFieldsLibrary; 