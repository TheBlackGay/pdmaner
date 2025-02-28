import React, { useState, useEffect } from 'react';
import './Modal.css';

interface NewDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (code: string, name: string) => void;
}

const NewDomainModal: React.FC<NewDomainModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [domainCode, setDomainCode] = useState('');
  const [domainName, setDomainName] = useState('');
  const [error, setError] = useState('');

  // 监听isOpen变化，当弹窗关闭时重置表单
  useEffect(() => {
    if (!isOpen) {
      // 重置表单状态
      setDomainCode('');
      setDomainName('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证主题域代码
    if (!domainCode.trim()) {
      setError('请输入主题域代码');
      return;
    }
    
    // 验证主题域名称
    if (!domainName.trim()) {
      setError('请输入主题域名称');
      return;
    }
    
    // 提交表单
    onConfirm(domainCode.trim(), domainName.trim());
    
    // 关闭弹窗 - 调用onClose以确保弹窗会关闭
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
          <h2>新增主题域</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="domainCode">
                <span className="required">*</span> 主题域代码
              </label>
              <input
                id="domainCode"
                type="text"
                value={domainCode}
                onChange={(e) => setDomainCode(e.target.value)}
                placeholder="请输入主题域代码"
                autoFocus
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="domainName">
                <span className="required">*</span> 主题域名称
              </label>
              <input
                id="domainName"
                type="text"
                value={domainName}
                onChange={(e) => setDomainName(e.target.value)}
                placeholder="请输入主题域名称"
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

export default NewDomainModal; 