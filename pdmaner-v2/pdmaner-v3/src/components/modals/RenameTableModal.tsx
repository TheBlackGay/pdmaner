import React, { useState, useEffect } from 'react';
import './Modal.css';

interface RenameTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newName: string) => void;
  currentName: string;
}

const RenameTableModal: React.FC<RenameTableModalProps> = ({ isOpen, onClose, onConfirm, currentName }) => {
  const [tableName, setTableName] = useState('');
  const [error, setError] = useState('');

  // 监听isOpen和currentName变化，当弹窗打开时初始化表单
  useEffect(() => {
    if (isOpen && currentName) {
      setTableName(currentName);
    } else if (!isOpen) {
      // 重置表单状态
      setError('');
    }
  }, [isOpen, currentName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证表名
    if (!tableName.trim()) {
      setError('请输入表名称');
      return;
    }
    
    // 提交表单
    onConfirm(tableName.trim());
    
    // 关闭弹窗
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
      <div className="modal-container">
        <div className="modal-header">
          <h2>重命名表</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="tableName">
                <span className="required">*</span> 表名称
              </label>
              <input
                id="tableName"
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="请输入表名称"
                autoFocus
              />
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>取消</button>
            <button type="submit" className="confirm-btn">确定</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenameTableModal; 