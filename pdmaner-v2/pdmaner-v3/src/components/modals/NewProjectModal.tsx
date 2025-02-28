import React, { useState } from 'react';
import './Modal.css';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, description: string) => void;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证项目名称
    if (!projectName.trim()) {
      setError('请输入项目名称');
      return;
    }
    
    // 提交表单
    onConfirm(projectName.trim(), projectDescription.trim());
    
    // 重置表单
    setProjectName('');
    setProjectDescription('');
    setError('');
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
          <h2>新建项目</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="projectName">
                <span className="required">*</span> 项目名称
              </label>
              <input
                id="projectName"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="请输入项目名称"
                autoFocus
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="projectDescription">项目描述</label>
              <input
                id="projectDescription"
                type="text"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="请输入项目描述（可选）"
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

export default NewProjectModal; 