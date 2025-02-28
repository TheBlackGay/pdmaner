import React, { useState, useEffect } from 'react';
import './Modal.css';

interface NewTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (code: string, name: string, comment: string, tableType: string, domainId: string) => void;
  domainId: string; // 所属主题域ID
  domainName: string; // 所属主题域名称
  existingTableCodes?: string[]; // 已存在的表代码列表，用于验证
}

const NewTableModal: React.FC<NewTableModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  domainId, 
  domainName,
  existingTableCodes = []
}) => {
  const [tableCode, setTableCode] = useState('');
  const [tableName, setTableName] = useState('');
  const [tableComment, setTableComment] = useState('');
  const [tableType, setTableType] = useState('空表'); // 默认为空表
  const [error, setError] = useState('');
  const [charCount, setCharCount] = useState({ code: 0, name: 0 });
  const [autoGenerateCode, setAutoGenerateCode] = useState(true); // 是否自动生成代码

  // 监听isOpen变化，当弹窗关闭时重置表单
  useEffect(() => {
    if (!isOpen) {
      // 重置表单状态
      setTableCode('');
      setTableName('');
      setTableComment('');
      setTableType('空表');
      setError('');
      setCharCount({ code: 0, name: 0 });
      setAutoGenerateCode(true);
    }
  }, [isOpen]);

  // 生成表代码
  const generateTableCode = (name: string): string => {
    return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  };

  // 处理名称变化，自动生成代码
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, 32);
    setTableName(value);
    setCharCount(prev => ({ ...prev, name: value.length }));

    // 如果开启了自动生成代码，则根据名称生成代码
    if (autoGenerateCode) {
      const generatedCode = generateTableCode(value);
      setTableCode(generatedCode);
      setCharCount(prev => ({ ...prev, code: generatedCode.length }));
    }
  };

  // 处理代码输入，限制最大64个字符
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, 64);
    setTableCode(value);
    setCharCount(prev => ({ ...prev, code: value.length }));
    setAutoGenerateCode(false); // 一旦手动修改代码，就关闭自动生成
  };

  // 全大写转换
  const handleUppercase = () => {
    setTableCode(tableCode.toUpperCase());
    setAutoGenerateCode(false);
  };

  // 全小写转换
  const handleLowercase = () => {
    setTableCode(tableCode.toLowerCase());
    setAutoGenerateCode(false);
  };

  if (!isOpen) return null;

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
    
    // 检查表代码是否已存在
    if (existingTableCodes.includes(tableCode.trim())) {
      setError(`表代码 "${tableCode.trim()}" 已存在，请使用其他代码`);
      return;
    }
    
    // 提交表单
    onConfirm(
      tableCode.trim(), 
      tableName.trim(), 
      tableComment.trim(), 
      tableType, 
      domainId
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
      <div className="modal-container" style={{ width: '480px' }}>
        <div className="modal-header">
          <h2>新增数据表</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="tableName" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div><span className="required">*</span> 显示名称</div>
                <div style={{ fontSize: '13px', color: '#999' }}>{charCount.name}/32</div>
              </label>
              <input
                id="tableName"
                type="text"
                value={tableName}
                onChange={handleNameChange}
                placeholder="表显示名"
                autoFocus
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="tableCode" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div><span className="required">*</span> 代码</div>
                <div style={{ fontSize: '13px', color: '#999' }}>{charCount.code}/64</div>
              </label>
              <div style={{ display: 'flex' }}>
                <input
                  id="tableCode"
                  type="text"
                  value={tableCode}
                  onChange={handleCodeChange}
                  placeholder="表代码"
                  style={{ flex: 1 }}
                />
                <div style={{ display: 'flex', marginLeft: '5px' }}>
                  <button 
                    type="button" 
                    className="utility-btn"
                    onClick={handleUppercase}
                    style={{ 
                      padding: '0 10px', 
                      backgroundColor: '#f0f0f0',
                      border: '1px solid #d9d9d9',
                      borderRadius: '0 0 0 4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    全大写
                  </button>
                  <button 
                    type="button" 
                    className="utility-btn"
                    onClick={handleLowercase}
                    style={{ 
                      padding: '0 10px', 
                      backgroundColor: '#f0f0f0',
                      border: '1px solid #d9d9d9',
                      borderLeft: 'none',
                      borderRadius: '0 4px 4px 0',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    全小写
                  </button>
                </div>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="tableType">新建类型</label>
              <select 
                id="tableType"
                value={tableType}
                onChange={(e) => setTableType(e.target.value)}
              >
                <option value="空表">空表</option>
                <option value="基础表">基础表</option>
                <option value="业务表">业务表</option>
                <option value="中间表">中间表</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="domainId">所属主题域</label>
              <input
                id="domainId"
                type="text"
                value={domainName}
                disabled
                style={{ backgroundColor: '#f5f5f5' }}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="tableComment">备注</label>
              <input
                id="tableComment"
                type="text"
                value={tableComment}
                onChange={(e) => setTableComment(e.target.value)}
                placeholder="表备注"
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

export default NewTableModal; 