import React from 'react';
import {
  InfoCircleOutlined,
  FileTextOutlined,
  TableOutlined,
  SaveOutlined,
  KeyOutlined,
  CheckCircleOutlined,
  UnorderedListOutlined,
  FilterOutlined,
  CloseCircleOutlined,
  DownOutlined,
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons';

// 索引数据接口
export interface IndexData {
  id: string;
  name: string;       // 索引名称
  fields: string[];   // 字段ID数组
  unique: boolean;    // 是否唯一索引
  comment?: string;   // 索引备注
}

// 字段数据接口
export interface FieldData {
  id: string;
  name: string;
  code: string;
  type: string;
  length?: number;
  scale?: number;
  primaryKey: boolean;
  notNull: boolean;
  autoIncrement: boolean;
  defaultValue?: string;
  comment?: string;
}

interface IndexModalProps {
  visible: boolean;
  isEditing: boolean;
  indexData: IndexData;
  tableFields: FieldData[];
  onClose: () => void;
  onSave: (index: IndexData) => void;
  showError: (message: string) => void;
}

const IndexModal: React.FC<IndexModalProps> = ({
  visible,
  isEditing,
  indexData,
  tableFields,
  onClose,
  onSave,
  showError
}) => {
  // 深拷贝索引数据，防止直接修改props
  const [localIndexData, setLocalIndexData] = React.useState<IndexData>({...indexData});
  // 添加字段过滤状态
  const [fieldFilter, setFieldFilter] = React.useState('');
  // 添加下拉菜单状态
  const [dropdownVisible, setDropdownVisible] = React.useState(false);
  // 下拉选择器的引用
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // 监听props更新本地状态
  React.useEffect(() => {
    setLocalIndexData({...indexData});
  }, [indexData]);

  // 添加点击外部关闭下拉菜单的事件处理
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 验证
    if (!localIndexData.name || localIndexData.fields.length === 0) {
      showError('索引名称和包含字段不能为空');
      return;
    }

    // 保存索引
    onSave(localIndexData);
  };
  
  // 处理索引名称更新
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalIndexData({
      ...localIndexData,
      name: e.target.value
    });
  };

  // 切换字段选择
  const toggleFieldSelection = (fieldId: string) => {
    const fields = [...localIndexData.fields];
    const index = fields.indexOf(fieldId);
    
    if (index === -1) {
      // 添加字段
      fields.push(fieldId);
    } else {
      // 移除字段
      fields.splice(index, 1);
    }
    
    setLocalIndexData({...localIndexData, fields});
  };

  // 移除已选字段
  const removeField = (fieldId: string) => {
    const fields = localIndexData.fields.filter(id => id !== fieldId);
    setLocalIndexData({...localIndexData, fields});
  };

  // 过滤字段
  const filteredFields = React.useMemo(() => {
    if (!fieldFilter) return tableFields;
    
    return tableFields.filter(field => 
      field.name.toLowerCase().includes(fieldFilter.toLowerCase()) ||
      field.code.toLowerCase().includes(fieldFilter.toLowerCase()) ||
      field.type.toLowerCase().includes(fieldFilter.toLowerCase())
    );
  }, [tableFields, fieldFilter]);

  // 获取已选字段的详细信息
  const selectedFields = React.useMemo(() => {
    return localIndexData.fields
      .map(fieldId => tableFields.find(field => field.id === fieldId))
      .filter(field => field !== undefined) as FieldData[];
  }, [localIndexData.fields, tableFields]);

  // 计算已选字段数量
  const selectedCount = localIndexData.fields.length;
  const totalCount = tableFields.length;

  // 如果不可见，不渲染
  if (!visible) return null;

  return (
    <div className="modal-backdrop" onClick={e => {
      // 仅当点击背景时关闭
      if (e.target === e.currentTarget) {
        onClose();
      }
    }}>
      <div className="modal-container cyber-modal index-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? '编辑索引' : '新建索引'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            {/* 索引基本信息和备注说明合并为一个区域 */}
            <div className="form-section index-info-section">
              <div className="cyber-section-title">
                <InfoCircleOutlined /> 索引详情
              </div>
              <div className="compact-index-form">
                <div className="top-row">
                  <div className="form-group index-name-group">
                    <label className="field-label">
                      <span className="required">*</span> 索引名称:
                    </label>
                    <input
                      type="text"
                      className="cyber-input"
                      value={localIndexData.name}
                      onChange={handleNameChange}
                      placeholder="请输入索引名称"
                      autoFocus
                    />
                  </div>
                  <div className="form-group unique-index-group">
                    <div className="custom-checkbox-container">
                      <label className="custom-checkbox index-type-checkbox">
                        <input
                          type="checkbox"
                          checked={localIndexData.unique}
                          onChange={(e) => setLocalIndexData({...localIndexData, unique: e.target.checked})}
                        />
                        <div className="checkbox-display"></div>
                        <div className="checkbox-content">
                          <span className="checkbox-label-text">唯一索引</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="bottom-row">
                  <div className="form-group comment-group">
                    <label>备注:</label>
                    <textarea
                      className="cyber-textarea compact-textarea"
                      value={localIndexData.comment || ''}
                      onChange={(e) => setLocalIndexData({...localIndexData, comment: e.target.value})}
                      placeholder="输入索引备注说明"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 包含字段 */}
            <div className="form-section fields-section">
              <div className="cyber-section-title fields-title">
                <TableOutlined /> 包含字段 <span className="required">*</span>
                <div className="selected-info">
                  已选: <span className={`selected-count ${selectedCount > 0 ? 'has-selected' : ''}`}>{selectedCount}</span> / {totalCount}
                </div>
              </div>
              
              {/* 字段选择下拉菜单 */}
              <div className="field-selector-wrapper" ref={dropdownRef}>
                <div 
                  className="field-selector-trigger"
                  onClick={() => setDropdownVisible(!dropdownVisible)}
                >
                  <div className="trigger-content">
                    <span className="trigger-text">选择要包含的字段</span>
                    <DownOutlined className={`dropdown-icon ${dropdownVisible ? 'open' : ''}`} />
                  </div>
                </div>
                
                {dropdownVisible && (
                  <div className="field-dropdown-panel">
                    <div className="dropdown-header">
                      <div className="field-search">
                        <input
                          type="text"
                          className="cyber-input search-input"
                          value={fieldFilter}
                          onChange={(e) => setFieldFilter(e.target.value)}
                          placeholder="搜索字段..."
                          onClick={(e) => e.stopPropagation()}
                        />
                        <FilterOutlined className="search-icon" />
                      </div>
                    </div>
                    
                    <div className="field-options-list">
                      {filteredFields.length > 0 ? (
                        filteredFields.map(field => (
                          <div 
                            key={field.id} 
                            className={`field-option-item ${localIndexData.fields.includes(field.id) ? 'selected' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFieldSelection(field.id);
                            }}
                          >
                            <div className="field-checkbox">
                              <input
                                type="checkbox"
                                checked={localIndexData.fields.includes(field.id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleFieldSelection(field.id);
                                }}
                              />
                              <div className="checkbox-display"></div>
                            </div>
                            <div className="field-info-row">
                              <span className="field-name">{field.name}</span>
                              <span className="field-code">{field.code}</span>
                              <span className="field-type">{field.type}{field.length ? `(${field.length})` : ''}</span>
                              {field.primaryKey && <KeyOutlined className="primary-key-icon" title="主键" />}
                              {field.notNull && <CheckCircleOutlined className="not-null-icon" title="不为空" />}
                            </div>
                          </div>
                        ))
                      ) : fieldFilter ? (
                        <div className="dropdown-empty-message">
                          <UnorderedListOutlined /> 未找到匹配的字段
                        </div>
                      ) : (
                        <div className="dropdown-empty-message">
                          <InfoCircleOutlined /> 表中暂无字段，请先添加字段
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* 已选字段显示区域 */}
              <div className="selected-fields-container">
                <div className="selected-fields-header">
                  <span>已选字段：</span>
                </div>
                
                {selectedFields.length > 0 ? (
                  <div className="selected-fields-list">
                    {selectedFields.map(field => (
                      <div key={field.id} className="selected-field-tag">
                        <div className="field-tag-content">
                          <span className="field-tag-name">{field.name}</span>
                          <span className="field-tag-code">{field.code}</span>
                          <span className="field-tag-type">{field.type}{field.length ? `(${field.length})` : ''}</span>
                          {field.primaryKey && <KeyOutlined className="tag-icon" title="主键" />}
                        </div>
                        <button 
                          type="button" 
                          className="remove-field-btn"
                          onClick={() => removeField(field.id)}
                          title="移除字段"
                        >
                          <CloseCircleOutlined />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-fields-selected">
                    <div className="empty-selection-message">
                      <PlusOutlined /> 请从上方选择要包含在索引中的字段
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="form-actions">
              <button type="button" className="cyber-btn-secondary" onClick={onClose}>取消</button>
              <button type="submit" className="cyber-btn-primary">
                <SaveOutlined /> 保存
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default IndexModal; 