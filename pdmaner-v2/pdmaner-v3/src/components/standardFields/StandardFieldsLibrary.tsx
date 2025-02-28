import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
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
  KeyOutlined,
  InfoCircleOutlined,
  DownOutlined,
  UpOutlined,
  LeftOutlined,
  RightOutlined,
  CloseOutlined,
  MenuOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignBottomOutlined
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

// 字段拖拽接口
interface DraggingField {
  id: string;
  type: 'field' | 'group';
  groupId: string;
  fieldId?: string;
}

// 标准字段库组件
const StandardFieldsLibrary: React.FC = () => {
  // 获取redux中的状态和dispatch方法
  const dispatch = useDispatch();
  const currentProject = useSelector((state: RootState) => state.app.currentProject);
  const { success } = useNotificationContext();
  
  // 状态
  const [collapsed, setCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [fieldGroups, setFieldGroups] = useState<FieldGroup[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [isAddFieldModalOpen, setIsAddFieldModalOpen] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [activeGroup, setActiveGroup] = useState<FieldGroup | null>(null);
  const [editingField, setEditingField] = useState<StandardField | null>(null);
  const [editingGroup, setEditingGroup] = useState<FieldGroup | null>(null);
  const [draggingField, setDraggingField] = useState<DraggingField | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedField, setSelectedField] = useState<StandardField | null>(null);

  // 初始化标准字段库数据
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

  // 自动保存功能
  useEffect(() => {
    // 避免初始化时触发保存
    if (!currentProject || fieldGroups.length === 0) {
      return;
    }

    // 使用节流函数延迟保存，避免频繁更新
    const saveTimeout = setTimeout(() => {
      // 保存到项目
      if (currentProject && dispatch) {
        const currentStandardFields = currentProject.standardFields || [];
        
        // 对比当前字段组和项目中的字段组是否有实质变化
        const isEqual = JSON.stringify(currentStandardFields) === JSON.stringify(fieldGroups);
        
        // 只有当有变化时才更新
        if (!isEqual) {
          dispatch(setCurrentProject({
            ...currentProject,
            standardFields: fieldGroups
          }));
          // 可选：添加保存成功提示
          // success('标准字段库已自动保存');
        }
      }
    }, 2000);

    // 清除上一次的定时器
    return () => clearTimeout(saveTimeout);
  }, [fieldGroups]); // 移除currentProject和dispatch依赖，只在fieldGroups变化时触发

  // 收起/展开标准字段库
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  // 展开/折叠字段组
  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
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
    // 检查分组代码是否已存在
    const codeExists = fieldGroups.some(group => group.code === code);
    if (codeExists) {
      alert(`分组代码 "${code}" 已存在，请使用其他代码`);
      return;
    }
    
    const newGroup: FieldGroup = {
      id: `group_${Date.now()}`,
      name,
      code,
      fields: [],
      expanded: true
    };
    
    const updatedGroups = [...fieldGroups, newGroup];
    setFieldGroups(updatedGroups);
    setIsAddGroupModalOpen(false);
    
    // 如果是在管理模式下添加的，则设置为活动分组
    if (isManagementModalOpen) {
      setActiveGroup(newGroup);
    }
    
    // 显示成功提示
    success(`分组 "${name}" 添加成功`);
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
    
    // 确保分组是展开的，以便立即显示新添加的字段
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: true
    }));
    
    closeFieldModal();
    
    // 显示成功提示
    success(`字段 "${field.name}" 添加成功`);
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
    
    closeFieldModal();
    
    // 显示成功提示
    success(`字段 "${field.name}" 更新成功`);
  };

  // 删除字段
  const handleDeleteField = (groupId: string, fieldId: string, skipConfirm = false) => {
    // 找到要删除的字段名称，用于提示
    const fieldToDelete = fieldGroups.find(g => g.id === groupId)?.fields.find(f => f.id === fieldId);
    
    console.log(`删除字段操作触发：字段名="${fieldToDelete?.name || '未知'}", ID=${fieldId}, 分组ID=${groupId}`);
    
    // 如果skipConfirm为true，则跳过确认对话框直接删除
    if (skipConfirm || window.confirm(`确定要删除字段 "${fieldToDelete?.name || ''}" 吗？`)) {
      console.log(`确认删除字段: 字段名="${fieldToDelete?.name || '未知'}", ID=${fieldId}, 分组ID=${groupId}`);
      
      // 使用函数式更新确保拿到最新状态
      setFieldGroups(prevGroups => {
        // 找到当前分组和当前字段
        const targetGroup = prevGroups.find(g => g.id === groupId);
        const targetField = targetGroup?.fields.find(f => f.id === fieldId);
        
        console.log(`目标分组: ${targetGroup?.name || '未找到'}, 目标字段: ${targetField?.name || '未找到'}`);
        
        // 过滤掉要删除的字段
        const updatedGroups = prevGroups.map(group => 
          group.id === groupId 
            ? { 
                ...group, 
                fields: group.fields.filter(field => field.id !== fieldId) 
              } 
            : group
        );
        
        console.log(`更新后的字段数: ${updatedGroups.find(g => g.id === groupId)?.fields.length || 0}`);
        return updatedGroups;
      });
      
      // 显示成功提示
      success(`字段 "${fieldToDelete?.name || ''}" 已删除`);
    }
  };

  // 删除分组
  const handleDeleteGroup = (groupId: string) => {
    // 找到要删除的分组名称，用于提示
    const groupToDelete = fieldGroups.find(g => g.id === groupId);
    
    if (window.confirm(`确定要删除分组 "${groupToDelete?.name || ''}" 及其所有字段吗？`)) {
      setFieldGroups(fieldGroups.filter(group => group.id !== groupId));
      
      // 如果删除的是当前活动的分组，清除活动分组
      if (activeGroup && activeGroup.id === groupId) {
        setActiveGroup(null);
      }
      
      // 显示成功提示
      success(`分组 "${groupToDelete?.name || ''}" 已删除`);
    }
  };

  // 保存标准字段库配置
  const handleSaveStandardFields = () => {
    // 保存到项目中
    if (currentProject && dispatch) {
      dispatch(setCurrentProject({
        ...currentProject,
        standardFields: fieldGroups
      }));
      
      // 显示成功提示
      success('标准字段库配置已保存');
    }
    
    // 关闭管理模态框
    setIsManagementModalOpen(false);
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

  // 导出标准字段库
  const exportStandardFields = () => {
    const data = JSON.stringify(fieldGroups, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `标准字段库_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    success('标准字段库导出成功');
  };
  
  // 触发文件选择对话框
  const triggerImportDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // 导入标准字段库
  const importStandardFields = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedGroups = JSON.parse(content) as FieldGroup[];
        
        // 验证导入的数据
        if (!Array.isArray(importedGroups)) {
          throw new Error('导入的数据格式不正确');
        }
        
        // 确认导入
        if (window.confirm(`确定要导入这些字段分组吗？这将替换当前的标准字段库。\n发现 ${importedGroups.length} 个分组，共 ${importedGroups.reduce((sum, group) => sum + group.fields.length, 0)} 个字段。`)) {
          setFieldGroups(importedGroups);
          
          // 保存到项目中
          if (currentProject && dispatch) {
            dispatch(setCurrentProject({
              ...currentProject,
              standardFields: importedGroups
            }));
          }
          
          success('标准字段库导入成功');
        }
      } catch (error) {
        console.error('导入失败', error);
        alert('导入失败，请确保文件格式正确');
      }
      
      // 重置文件输入，以便可以再次选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    reader.readAsText(file);
  };
  
  // 拖拽排序相关函数
  const handleFieldDragStart = (e: React.DragEvent, groupId: string, fieldId: string) => {
    setDraggingField({
      id: fieldId,
      type: 'field',
      groupId,
      fieldId
    });
    
    // 设置拖拽效果
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleGroupDragStart = (e: React.DragEvent, groupId: string) => {
    setDraggingField({
      id: groupId,
      type: 'group',
      groupId
    });
    
    // 设置拖拽效果
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleFieldDrop = (e: React.DragEvent, targetGroupId: string, targetFieldId: string) => {
    e.preventDefault();
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      
      if (data.type === 'field' && (data.groupId !== targetGroupId || data.fieldId !== targetFieldId)) {
        // 移动字段
        const sourceGroup = fieldGroups.find(g => g.id === data.groupId);
        const targetGroup = fieldGroups.find(g => g.id === targetGroupId);
        
        if (!sourceGroup || !targetGroup) return;
        
        // 找到拖拽的字段
        const draggedField = sourceGroup.fields.find(f => f.id === data.fieldId);
        if (!draggedField) return;
        
        // 从源分组中移除字段
        const sourceFields = sourceGroup.fields.filter(f => f.id !== data.fieldId);
        
        // 在目标分组中添加字段
        const targetFieldIndex = targetGroup.fields.findIndex(f => f.id === targetFieldId);
        const targetFields = [...targetGroup.fields];
        targetFields.splice(targetFieldIndex, 0, draggedField);
        
        // 更新状态
        setFieldGroups(fieldGroups.map(group => {
          if (group.id === data.groupId) {
            return { ...group, fields: sourceFields };
          }
          if (group.id === targetGroupId) {
            return { ...group, fields: targetFields };
          }
          return group;
        }));
      }
    } catch (error) {
      console.error('拖拽错误', error);
    }
  };
  
  const handleGroupDrop = (e: React.DragEvent, targetGroupId: string) => {
    e.preventDefault();
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      
      if (data.type === 'group' && data.groupId !== targetGroupId) {
        // 移动分组
        const draggedGroupIndex = fieldGroups.findIndex(g => g.id === data.groupId);
        const targetGroupIndex = fieldGroups.findIndex(g => g.id === targetGroupId);
        
        if (draggedGroupIndex === -1 || targetGroupIndex === -1) return;
        
        // 复制分组数组并重新排序
        const newGroups = [...fieldGroups];
        const [draggedGroup] = newGroups.splice(draggedGroupIndex, 1);
        newGroups.splice(targetGroupIndex, 0, draggedGroup);
        
        // 更新状态
        setFieldGroups(newGroups);
      }
    } catch (error) {
      console.error('拖拽错误', error);
    }
  };
  
  const handleDragEnd = () => {
    setDraggingField(null);
  };

  // 添加字段顺序调整函数
  const handleMoveField = (groupId: string, fieldId: string, direction: 'top' | 'up' | 'down' | 'bottom') => {
    const groupIndex = fieldGroups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) return;
    
    const group = fieldGroups[groupIndex];
    const fieldIndex = group.fields.findIndex(f => f.id === fieldId);
    if (fieldIndex === -1) return;
    
    const newFields = [...group.fields];
    const fieldToMove = newFields[fieldIndex];
    
    // 根据方向移动字段
    switch (direction) {
      case 'top':
        // 移动到顶部
        newFields.splice(fieldIndex, 1);
        newFields.unshift(fieldToMove);
        break;
      case 'up':
        // 如果不是第一个，向上移动
        if (fieldIndex > 0) {
          newFields.splice(fieldIndex, 1);
          newFields.splice(fieldIndex - 1, 0, fieldToMove);
        }
        break;
      case 'down':
        // 如果不是最后一个，向下移动
        if (fieldIndex < newFields.length - 1) {
          newFields.splice(fieldIndex, 1);
          newFields.splice(fieldIndex + 1, 0, fieldToMove);
        }
        break;
      case 'bottom':
        // 移动到底部
        newFields.splice(fieldIndex, 1);
        newFields.push(fieldToMove);
        break;
    }
    
    // 更新字段组
    const updatedGroups = [...fieldGroups];
    updatedGroups[groupIndex] = {
      ...group,
      fields: newFields
    };
    
    setFieldGroups(updatedGroups);
    
    // 显示成功提示
    success(`字段 "${fieldToMove.name}" 位置已调整`);
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
            onClick={() => setIsManagementModalOpen(true)}
          >
            <PlusOutlined />
            管理字段库
          </button>
        </div>
      );
    }
    
    return filteredGroups.map(group => (
      <div 
        key={group.id} 
        className={`field-group ${draggingField && draggingField.type === 'group' && draggingField.groupId === group.id ? 'dragging' : ''}`}
      >
        <div className="group-header">
          <div 
            className="group-title"
            onClick={() => toggleGroupExpansion(group.id)}
          >
            {expandedGroups[group.id] ? 
              <DownOutlined /> : 
              <CaretRightOutlined />
            }
            {group.name} <span className="group-code">({group.code})</span>
            <span className="field-count">{group.fields.length}个字段</span>
          </div>
        </div>
        
        {expandedGroups[group.id] && (
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
                  <div className="field-meta">
                    <div className="field-type">
                      {field.type}{field.length ? `(${field.length}${field.scale ? `,${field.scale}` : ''})` : ''}
                    </div>
                    {field.comment && <div className="field-comment" title={field.comment}>{field.comment}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    ));
  };

  // 渲染添加分组的模态框
  const renderAddGroupModal = () => {
    // 使用与字段模态框相同的模式，不再使用条件渲染
    if (!isAddGroupModalOpen) return null;
    
    return ReactDOM.createPortal(
      <div className="modal-backdrop visible" onClick={() => setIsAddGroupModalOpen(false)}>
        <div className="modal-container" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>添加字段分组</h3>
            <button className="close-btn" onClick={() => setIsAddGroupModalOpen(false)}>×</button>
          </div>
          <div className="modal-body">
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const name = form.groupName.value;
              const code = form.groupCode.value;
              
              if (!name.trim() || !code.trim()) {
                alert('分组名称和代码不能为空');
                return;
              }
              
              handleAddGroup(name, code);
            }}>
              <div className="form-group">
                <label>分组名称 <span className="required">*</span></label>
                <input 
                  type="text" 
                  name="groupName" 
                  className="cyber-input" 
                  placeholder="例如：基础字段" 
                  required 
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>分组代码 <span className="required">*</span></label>
                <input 
                  type="text" 
                  name="groupCode" 
                  className="cyber-input" 
                  placeholder="例如：base" 
                  required 
                />
                <small className="form-helper">分组代码必须唯一，用于标识字段分组</small>
              </div>
              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={() => setIsAddGroupModalOpen(false)}>取消</button>
                <button type="submit" className="confirm-btn">确定</button>
              </div>
            </form>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // 修复setIsAddFieldModalOpen和setShowAdvancedOptions的使用
  // 在模态框关闭时，需要同时重置高级选项状态
  const closeFieldModal = () => {
    setIsAddFieldModalOpen(false);
    setShowAdvancedOptions(false);
    setEditingField(null);
    setEditingGroup(null);
    setSelectedField(null); // 清除选中字段
  };

  // 修复编辑字段按钮
  const handleEditFieldClick = (e: React.MouseEvent, group: FieldGroup, field: StandardField) => {
    e.stopPropagation(); // 阻止事件冒泡
    e.preventDefault(); // 阻止默认行为
    
    // 设置编辑状态
    setEditingGroup(group);
    setEditingField(field);
    
    // 打开编辑模态框
    setIsAddFieldModalOpen(true);
    
    // 提供用户反馈
    console.log('编辑字段:', field.name);
  };

  // 渲染字段编辑/添加模态框
  const renderFieldModal = () => {
    if (!isAddFieldModalOpen) return null;
    
    return ReactDOM.createPortal(
      <div className="modal-backdrop visible" onClick={closeFieldModal}>
        <div className="modal-container" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>{editingField ? '编辑字段' : '添加字段'}</h3>
            <button className="close-btn" onClick={closeFieldModal}>×</button>
          </div>
          <div className="modal-body">
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const formData = new FormData(form);
              
              const field: StandardField = {
                id: editingField?.id || '',
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
              
              if (editingField && editingGroup) {
                handleEditField(editingGroup.id, field);
              } else if (editingGroup) {
                handleAddField(editingGroup.id, field);
              }
            }}>
              <div className="form-row">
                <div className="form-group">
                  <label>字段名称 <span className="required">*</span></label>
                  <input 
                    type="text" 
                    name="name" 
                    className="cyber-input" 
                    defaultValue={editingField?.name || ''} 
                    placeholder="例如：创建时间" 
                    required 
                    autoFocus
                  />
                  <small className="form-helper">字段的显示名称</small>
                </div>
                <div className="form-group">
                  <label>字段代码 <span className="required">*</span></label>
                  <input 
                    type="text" 
                    name="code" 
                    className="cyber-input" 
                    defaultValue={editingField?.code || ''} 
                    placeholder="例如：create_time" 
                    required 
                  />
                  <small className="form-helper">字段的实际代码，用于数据库列名</small>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>数据类型 <span className="required">*</span></label>
                  <select 
                    name="type" 
                    className="cyber-select" 
                    defaultValue={editingField?.type || 'varchar'}
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
                    defaultValue={editingField?.length || ''} 
                    placeholder="例如：32" 
                  />
                </div>
                <div className="form-group">
                  <label>小数位</label>
                  <input 
                    type="number" 
                    name="scale" 
                    className="cyber-input" 
                    defaultValue={editingField?.scale || ''} 
                    placeholder="例如：2" 
                  />
                </div>
              </div>
              
              <div className="checkbox-row">
                <div className="cyber-checkbox">
                  <input 
                    type="checkbox" 
                    id="primaryKey" 
                    name="primaryKey" 
                    defaultChecked={editingField?.primaryKey} 
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
                    defaultChecked={editingField?.notNull} 
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
                    defaultChecked={editingField?.autoIncrement} 
                  />
                  <label htmlFor="autoIncrement">
                    <span className="checkbox-icon"></span>
                    <span className="checkbox-text">自增</span>
                  </label>
                </div>
              </div>
              
              {/* 高级选项的切换按钮 */}
              <div className="advanced-options-section">
                <div className="advanced-toggle" onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}>
                  {showAdvancedOptions ? <UpOutlined /> : <DownOutlined />}
                  <span>高级选项</span>
                </div>
                
                {/* 高级选项的内容区域 */}
                {showAdvancedOptions && (
                  <div className="advanced-options-content">
                    <div className="form-group">
                      <label>默认值</label>
                      <input 
                        type="text" 
                        name="defaultValue" 
                        className="cyber-input" 
                        defaultValue={editingField?.defaultValue || ''} 
                        placeholder="例如：CURRENT_TIMESTAMP" 
                      />
                      <small className="form-helper">字段的默认值，可以是具体值或SQL函数</small>
                    </div>
                    
                    <div className="form-group">
                      <label>备注</label>
                      <textarea 
                        name="comment" 
                        className="cyber-textarea" 
                        defaultValue={editingField?.comment || ''} 
                        placeholder="字段的备注信息"
                      ></textarea>
                      <small className="form-helper">对字段的详细描述，将显示在数据库注释中</small>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={closeFieldModal}>取消</button>
                <button type="submit" className="confirm-btn">确定</button>
              </div>
            </form>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // 打开管理模态框
  const openManagementModal = () => {
    console.log('打开管理模态框');
    setIsManagementModalOpen(true);
    setActiveGroup(fieldGroups.length > 0 ? fieldGroups[0] : null);
    console.log('管理模态框状态设置为:', true);
  };

  // 关闭管理模态框
  const closeManagementModal = () => {
    setIsManagementModalOpen(false);
    setActiveGroup(null);
    setSelectedField(null); // 清除选中字段
  };

  // 渲染管理模态框
  const renderManagementModal = () => {
    // 使用与其他模态框相同的模式，不再使用条件渲染
    const currentActiveGroup = activeGroup;
    
    // 使用Portal将模态框渲染到body上，避免嵌套上下文限制
    if (!isManagementModalOpen) return null;
    
    return ReactDOM.createPortal(
      <div className="modal-backdrop visible" onClick={(e) => {
        e.stopPropagation(); // 阻止事件冒泡
        closeManagementModal(); // 关闭模态框
      }}>
        <div className="management-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>标准字段库管理</h3>
            <div className="modal-header-actions">
              <button 
                className="import-export-btn" 
                title="导入字段库" 
                onClick={(e) => {
                  e.stopPropagation();
                  triggerImportDialog();
                }}
              >
                <ImportOutlined />
              </button>
              <button 
                className="import-export-btn" 
                title="导出字段库" 
                onClick={(e) => {
                  e.stopPropagation();
                  exportStandardFields();
                }}
              >
                <ExportOutlined />
              </button>
              <button className="close-btn" onClick={closeManagementModal}>×</button>
            </div>
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
                    className={`group-item ${activeGroup && group.id === activeGroup.id ? 'active' : ''}`}
                    onClick={() => setActiveGroup(group)}
                  >
                    <div className="group-item-info">
                      <div className="group-name">{group.name}</div>
                      <div className="group-code">{group.code}</div>
                    </div>
                    <div className="group-actions">
                      <button
                        className="delete-btn"
                        title="删除分组"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`确定要删除分组 "${group.name}" 吗？此操作不可撤销。`)) {
                            handleDeleteGroup(group.id);
                          }
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
              {currentActiveGroup ? (
                <>
                  <div className="fields-header">
                    <h4>{currentActiveGroup.name}</h4>
                    <div className="header-actions">
                      <button
                        className="add-field-btn"
                        onClick={(e) => {
                          e.stopPropagation(); // 防止事件冒泡
                          console.log("添加字段按钮被点击");
                          console.log("当前活动组:", currentActiveGroup);
                          setEditingGroup(currentActiveGroup);
                          setEditingField(null);
                          setIsAddFieldModalOpen(true);
                        }}
                      >
                        <PlusOutlined /> 添加字段
                      </button>
                      {currentActiveGroup.fields.length > 0 && (
                        <>
                          <button
                            className="edit-btn"
                            title="编辑选中字段"
                            disabled={!selectedField}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (selectedField) {
                                handleEditFieldClick(e, currentActiveGroup, selectedField);
                              } else {
                                alert("请先选择一个字段");
                              }
                            }}
                          >
                            <EditOutlined /> 编辑
                          </button>
                          <button
                            className="delete-btn"
                            title="删除选中字段"
                            disabled={!selectedField}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (selectedField) {
                                handleDeleteField(currentActiveGroup.id, selectedField.id);
                              } else {
                                alert("请先选择一个字段");
                              }
                            }}
                          >
                            <DeleteOutlined /> 删除
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="fields-table-container">
                    {currentActiveGroup.fields.length > 0 ? (
                      <table className="fields-table" id="standard-fields-table">
                        <thead>
                          <tr>
                            <th style={{ width: '20%' }}>名称</th>
                            <th style={{ width: '20%' }}>代码</th>
                            <th style={{ width: '15%' }}>类型</th>
                            <th style={{ width: '10%' }}>主键</th>
                            <th style={{ width: '10%' }}>非空</th>
                            <th style={{ width: '10%' }}>自增</th>
                            <th style={{ width: '15%' }}>备注</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentActiveGroup.fields.map(field => (
                            <tr 
                              key={field.id} 
                              className={selectedField && selectedField.id === field.id ? 'selected-row' : ''}
                              onClick={() => {
                                // 如果已选中则取消选中，否则选中点击的字段
                                if (selectedField && selectedField.id === field.id) {
                                  setSelectedField(null);
                                } else {
                                  setSelectedField(field);
                                }
                              }}
                            >
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
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="no-fields-message">
                        <p>该分组暂无字段</p>
                        <button 
                          className="add-group-btn"
                          onClick={(e) => {
                            e.stopPropagation(); // 阻止事件冒泡
                            console.log('添加字段按钮点击');
                            
                            // 确保有选中的分组
                            if (!currentActiveGroup) {
                              alert('请先选择一个字段分组');
                              return;
                            }
                            
                            console.log('当前活动分组:', currentActiveGroup.name);
                            
                            setEditingGroup(currentActiveGroup);
                            setEditingField(null);
                            
                            // 直接将模态框设置为可见
                            setIsAddFieldModalOpen(true);
                            
                            console.log('添加字段模态框状态设置为:', true);
                          }}
                        >
                          <PlusOutlined />
                          添加字段
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="no-group-selected">
                  <p>请选择或创建一个字段分组</p>
                  <button 
                    className="add-group-btn"
                    onClick={() => setIsAddGroupModalOpen(true)}
                  >
                    <PlusOutlined />
                    添加新分组
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="modal-footer" style={{borderTop: '1px solid rgba(5, 217, 232, 0.2)'}}>
            <button className="cancel-btn" onClick={closeManagementModal}>取消</button>
            <button className="confirm-btn save-btn" onClick={handleSaveStandardFields}>保存</button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // 组件加载时确保所有模态框都是关闭状态
  useEffect(() => {
    setIsManagementModalOpen(false);
    setIsAddGroupModalOpen(false);
    setIsAddFieldModalOpen(false);
    setEditingField(null);
    setEditingGroup(null);
    setShowAdvancedOptions(false);
  }, []);

  return (
    <div className={`standard-fields-library ${collapsed ? 'collapsed' : ''}`}>
      <div className="toggle-button" onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? <RightOutlined /> : <LeftOutlined />}
      </div>
      
      <div className="library-content">
        <div className="library-header">
          <h2>标准字段库</h2>
          <div className="header-actions">
            <button onClick={exportStandardFields} title="导出字段库">
              <ExportOutlined />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation(); // 阻止事件冒泡
                console.log('管理按钮被点击，准备打开管理模态框');
                // 确保即使有可能的闭包问题也能正确设置状态
                setIsManagementModalOpen(true);
                setActiveGroup(fieldGroups.length > 0 ? fieldGroups[0] : null);
                // 使用timeout确保DOM更新
                setTimeout(() => {
                  console.log('管理模态框状态应该已经设置为:', true);
                  console.log('当前模态框状态:', document.querySelector('.modal-backdrop.visible') ? '可见' : '不可见');
                }, 100);
              }} 
              title="管理字段库"
            >
              <SettingOutlined />
              <span>管理</span>
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
            {searchTerm && (
              <button className="clear-search" onClick={() => setSearchTerm('')}>
                <CloseOutlined />
              </button>
            )}
          </div>
          <div className="drag-tip">
            <InfoCircleOutlined />
            <span>拖拽字段到设计器中使用</span>
          </div>
        </div>
        
        <div className="field-groups-container">
          {renderFieldGroups()}
        </div>
      </div>
      
      {/* 管理模态框 */}
      {renderManagementModal()}
      
      {/* 添加分组模态框 */}
      {renderAddGroupModal()}
      
      {/* 添加/编辑字段模态框 */}
      {renderFieldModal()}
      
      {/* 文件导入输入 */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".json"
        onChange={importStandardFields}
      />
    </div>
  );
};

export default StandardFieldsLibrary; 