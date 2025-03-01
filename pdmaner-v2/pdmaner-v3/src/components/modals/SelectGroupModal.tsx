import React, { useState, useEffect } from 'react';
import './Modal.css';

interface Group {
  id: string;
  name: string;
  code: string;
  fields: any[];
}

interface SelectGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (groupId: string) => void;
  groups: Group[];
  fieldName?: string; // 可选：显示字段名
}

const SelectGroupModal: React.FC<SelectGroupModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  groups,
  fieldName
}) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [error, setError] = useState('');

  // 当模态框打开时，如果有组则默认选择第一个
  useEffect(() => {
    if (isOpen && groups.length > 0) {
      setSelectedGroupId(groups[0].id);
    } else {
      setSelectedGroupId('');
    }
    setError('');
  }, [isOpen, groups]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证是否选择了分组
    if (!selectedGroupId) {
      setError('请选择一个分组');
      return;
    }
    
    // 提交表单
    onConfirm(selectedGroupId);
    
    // 关闭模态框
    onClose();
  };

  // 点击背景关闭
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-container cyber-modal">
        <div className="modal-header">
          <h2>{fieldName ? `将"${fieldName}"添加到字段库` : '添加到字段库'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-message"><span className="error-icon">!</span> {error}</div>}
            
            <div className="form-section">
              <div className="form-group">
                <label htmlFor="groupSelect">
                  <span className="required">*</span> 选择分组
                </label>
                {groups.length > 0 ? (
                  <div className="select-wrapper">
                    <select 
                      id="groupSelect"
                      value={selectedGroupId}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      className="cyber-select"
                    >
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>
                          {group.name} [{group.fields.length}个字段]
                        </option>
                      ))}
                    </select>
                    <div className="select-arrow"></div>
                  </div>
                ) : (
                  <div className="no-groups-message">
                    <p>目前没有字段分组，将会创建默认分组</p>
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <div className="add-new-group">
                  <button 
                    type="button" 
                    className="cyber-btn-link" 
                    onClick={() => {
                      // 这里可以添加创建新分组的逻辑
                      // 或者打开创建新分组的模态框
                      alert('创建新分组功能待实现');
                    }}
                  >
                    + 创建新分组
                  </button>
                </div>
              </div>
            </div>
            
            {fieldName && (
              <div className="field-preview">
                <h3>字段信息预览</h3>
                <div className="field-preview-content">
                  <div className="field-name-preview">名称: <span>{fieldName}</span></div>
                </div>
              </div>
            )}
          </div>
          
          <div className="modal-footer">
            <button type="button" className="cancel-btn cyber-btn-secondary" onClick={onClose}>取消</button>
            <button type="submit" className="confirm-btn cyber-btn-primary">确定</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SelectGroupModal; 