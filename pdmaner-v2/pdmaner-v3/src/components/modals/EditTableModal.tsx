import React, { useState, useEffect } from 'react';
import './Modal.css';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';

interface TableToEdit {
  id: string;
  name: string;
  code: string;
  comment?: string;
  domainId: string;
  type: string;
}

interface EditTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, code: string, comment: string, domainId: string, type: string) => void;
  table: TableToEdit | null;
}

const EditTableModal: React.FC<EditTableModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  table
}) => {
  const currentProject = useSelector((state: RootState) => state.app.currentProject);
  
  const [tableCode, setTableCode] = useState('');
  const [tableName, setTableName] = useState('');
  const [tableComment, setTableComment] = useState('');
  const [domainId, setDomainId] = useState('');
  const [tableType, setTableType] = useState(''); 
  const [error, setError] = useState('');
  const [charCount, setCharCount] = useState({ code: 0, name: 0 });
  const [originalCode, setOriginalCode] = useState(''); // 用于存储原始代码，检查是否被修改

  // 当表数据或弹窗状态变化时，更新表单数据
  useEffect(() => {
    if (isOpen && table) {
      setTableCode(table.code);
      setTableName(table.name);
      setTableComment(table.comment || '');
      setDomainId(table.domainId);
      setTableType(table.type || '空表');
      setCharCount({ 
        code: table.code.length, 
        name: table.name.length 
      });
      setOriginalCode(table.code);
    } else if (!isOpen) {
      // 重置表单状态
      setTableCode('');
      setTableName('');
      setTableComment('');
      setDomainId('');
      setTableType('空表');
      setError('');
      setCharCount({ code: 0, name: 0 });
      setOriginalCode('');
    }
  }, [isOpen, table]);

  // 处理名称输入，限制最大32个字符
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, 32);
    setTableName(value);
    setCharCount(prev => ({ ...prev, name: value.length }));
  };

  // 处理代码输入，限制最大64个字符
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, 64);
    setTableCode(value);
    setCharCount(prev => ({ ...prev, code: value.length }));
  };

  // 全大写转换
  const handleUppercase = () => {
    setTableCode(tableCode.toUpperCase());
  };

  // 全小写转换
  const handleLowercase = () => {
    setTableCode(tableCode.toLowerCase());
  };

  // 获取域名称
  const getDomainName = (id: string): string => {
    if (!currentProject) return '';
    const domain = currentProject.domains.find(d => d.id === id);
    return domain ? domain.name : '';
  };

  if (!isOpen || !table) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证表代码
    if (!tableCode.trim()) {
      setError('请输入表代码');
      return;
    }
    
    // 验证表名称
    if (!tableName.trim()) {
      setError('请输入表显示名');
      return;
    }
    
    // 检查表代码是否已存在且不是当前表（修改了代码）
    if (tableCode !== originalCode && currentProject?.tables) {
      const codeExists = currentProject.tables.some(t => 
        t.id !== table.id && t.code === tableCode.trim()
      );
      
      if (codeExists) {
        setError(`表代码 "${tableCode.trim()}" 已存在，请使用其他代码`);
        return;
      }
    }
    
    // 提交表单
    onConfirm(
      tableName.trim(), 
      tableCode.trim(), 
      tableComment.trim(), 
      domainId,
      tableType
    );
    
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
      <div className="modal-container cyber-modal">
        <div className="modal-header">
          <h2>编辑数据表</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-message"><span className="error-icon">!</span> {error}</div>}
            
            <div className="form-section">
              <div className="form-group">
                <label htmlFor="tableName">
                  <span className="required">*</span> 显示名称
                  <span className="char-count">{charCount.name}/32</span>
                </label>
                <div className="input-wrapper">
                  <input
                    id="tableName"
                    type="text"
                    value={tableName}
                    onChange={handleNameChange}
                    placeholder="表显示名"
                    autoFocus
                    className="cyber-input"
                  />
                  <div className="input-highlight"></div>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="tableCode">
                  <span className="required">*</span> 代码
                  <span className="char-count">{charCount.code}/64</span>
                </label>
                <div className="code-input-group">
                  <div className="input-wrapper">
                    <input
                      id="tableCode"
                      type="text"
                      value={tableCode}
                      onChange={handleCodeChange}
                      placeholder="表代码"
                      className="cyber-input"
                    />
                    <div className="input-highlight"></div>
                  </div>
                  <div className="button-controls">
                    <button 
                      type="button" 
                      className="utility-btn"
                      onClick={handleUppercase}
                      title="全大写"
                    >
                      全大写
                    </button>
                    <button 
                      type="button" 
                      className="utility-btn"
                      onClick={handleLowercase}
                      title="全小写"
                    >
                      全小写
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="form-section">
              <div className="form-group">
                <label htmlFor="tableType">表类型</label>
                <div className="select-wrapper">
                  <select 
                    id="tableType"
                    value={tableType}
                    onChange={(e) => setTableType(e.target.value)}
                    className="cyber-select"
                  >
                    <option value="空表">空表</option>
                    <option value="基础表">基础表</option>
                    <option value="业务表">业务表</option>
                    <option value="中间表">中间表</option>
                  </select>
                  <div className="select-arrow"></div>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="domainId">所属主题域</label>
                <div className="select-wrapper">
                  <select 
                    id="domainId"
                    value={domainId}
                    onChange={(e) => setDomainId(e.target.value)}
                    className="cyber-select"
                  >
                    {currentProject?.domains.map(domain => (
                      <option key={domain.id} value={domain.id}>
                        {domain.name}
                      </option>
                    ))}
                  </select>
                  <div className="select-arrow"></div>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="tableComment">备注</label>
                <div className="input-wrapper">
                  <input
                    id="tableComment"
                    type="text"
                    value={tableComment}
                    onChange={(e) => setTableComment(e.target.value)}
                    placeholder="表备注"
                    className="cyber-input"
                  />
                  <div className="input-highlight"></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="cancel-btn cyber-btn-secondary" onClick={onClose}>取消</button>
            <button type="submit" className="confirm-btn cyber-btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTableModal; 