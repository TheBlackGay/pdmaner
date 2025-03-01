import React, { useState, useEffect } from 'react';
import './Modal.css';
import {
  CodeOutlined,
  ImportOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  LoadingOutlined,
  DatabaseOutlined,
  TableOutlined,
  FileSearchOutlined,
  FieldStringOutlined,
  CodeFilled
} from '@ant-design/icons';
import { useNotificationContext } from '../../contexts/NotificationContext';

// 自定义SQL图标组件
const SQLIcon = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor">
    <path d="M18.4,3H5.6C4.2,3,3,4.2,3,5.6v12.8C3,19.8,4.2,21,5.6,21h12.8c1.4,0,2.6-1.2,2.6-2.6V5.6C21,4.2,19.8,3,18.4,3z M15.7,17.3c-0.3,0-0.5-0.1-0.7-0.2c-0.2-0.1-0.3-0.3-0.3-0.6c0-0.2,0.1-0.4,0.2-0.5c0.1-0.1,0.3-0.2,0.5-0.3c0.2-0.1,0.4-0.1,0.7-0.2c0.3-0.1,0.5-0.2,0.7-0.2c0-0.3-0.1-0.5-0.2-0.6c-0.2-0.1-0.4-0.2-0.6-0.2c-0.2,0-0.3,0-0.5,0.1c-0.1,0.1-0.2,0.1-0.3,0.2l-0.2-0.3c0.1-0.1,0.3-0.2,0.4-0.3c0.2-0.1,0.4-0.1,0.6-0.1c0.4,0,0.7,0.1,0.9,0.3c0.2,0.2,0.3,0.5,0.3,0.9v2h-0.4l0-0.4c-0.1,0.1-0.3,0.3-0.4,0.3C16,17.3,15.9,17.3,15.7,17.3z M11.8,17.2c-0.4,0-0.8-0.1-1-0.3c-0.2-0.2-0.3-0.5-0.3-0.9v-2.4H11v2.3c0,0.2,0.1,0.4,0.2,0.5c0.1,0.1,0.3,0.2,0.5,0.2c0.2,0,0.4-0.1,0.6-0.2c0.2-0.1,0.3-0.3,0.3-0.5v-2.3h0.5v3.3h-0.5V16.6c-0.1,0.2-0.2,0.3-0.4,0.4C12.1,17.2,12,17.2,11.8,17.2z M7.5,17.2c-0.3,0-0.5-0.1-0.7-0.2C6.6,16.9,6.5,16.8,6.4,16.6c-0.1-0.2-0.1-0.3-0.1-0.5c0-0.2,0.1-0.4,0.2-0.6c0.1-0.2,0.3-0.3,0.6-0.4c0.3-0.1,0.5-0.1,0.9-0.1h0.6v-0.3c0-0.2-0.1-0.4-0.2-0.5C8.2,14.1,8,14,7.8,14c-0.2,0-0.3,0-0.5,0.1c-0.1,0.1-0.3,0.2-0.4,0.3L6.7,14.1c0.1-0.2,0.3-0.3,0.5-0.4c0.2-0.1,0.4-0.1,0.6-0.1c0.4,0,0.7,0.1,0.9,0.3c0.2,0.2,0.3,0.5,0.3,0.9v2.1H8.5v-0.4c-0.1,0.1-0.2,0.3-0.4,0.4C7.9,17.1,7.7,17.2,7.5,17.2z M14.8,9.3l-1.9,2.5c-0.1,0.1-0.1,0.2-0.2,0.3c-0.1,0.1-0.2,0.2-0.3,0.2c-0.1,0.1-0.2,0.1-0.3,0.1c-0.1,0-0.2,0-0.4,0c-0.2,0-0.4,0-0.5-0.1c-0.1-0.1-0.2-0.2-0.3-0.3c-0.1-0.1-0.1-0.3-0.1-0.4c0-0.2,0-0.3,0.1-0.4c0.1-0.1,0.1-0.2,0.2-0.3c0.1-0.1,0.2-0.2,0.3-0.3l1.9-2.5c0.1-0.1,0.1-0.2,0.2-0.3c0.1-0.1,0.2-0.2,0.3-0.2c0.1-0.1,0.2-0.1,0.3-0.1c0.1,0,0.2,0,0.4,0c0.2,0,0.4,0,0.5,0.1c0.1,0.1,0.2,0.2,0.3,0.3c0.1,0.1,0.1,0.3,0.1,0.4c0,0.2,0,0.3-0.1,0.4C15,8.7,14.9,8.8,14.8,9c-0.1,0.1-0.1,0.2-0.2,0.3H14.8z M7.6,15.5c-0.2,0-0.4,0-0.6,0.1c-0.2,0.1-0.3,0.1-0.3,0.3c-0.1,0.1-0.1,0.2-0.1,0.3c0,0.2,0.1,0.3,0.2,0.4c0.1,0.1,0.3,0.1,0.5,0.1c0.2,0,0.3-0.1,0.5-0.2c0.1-0.1,0.3-0.2,0.3-0.4v-0.7H7.6z M16.2,15.8c-0.2,0.1-0.5,0.1-0.7,0.2c-0.2,0-0.3,0.1-0.4,0.2c-0.1,0.1-0.1,0.2-0.1,0.3c0,0.1,0.1,0.2,0.2,0.3c0.1,0.1,0.2,0.1,0.4,0.1c0.2,0,0.4-0.1,0.5-0.2c0.1-0.1,0.2-0.2,0.3-0.4L16.2,15.8z"/>
  </svg>
);

interface ImportSQLModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (statements: any[], dbType: string) => void;
}

// 数据库类型列表
const databaseTypes = [
  { value: 'mysql', label: 'MySQL' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'oracle', label: 'Oracle' },
  { value: 'sqlserver', label: 'SQL Server' },
  { value: 'db2', label: 'DB2' },
  { value: 'sqlite', label: 'SQLite' }
];

// 表格将被添加到的主题域
interface ParseResult {
  success: boolean;
  tables: number;
  errors: string[];
  statements: any[];
}

const ImportSQLModal: React.FC<ImportSQLModalProps> = ({ isOpen, onClose, onImport }) => {
  const [sqlInput, setSqlInput] = useState('');
  const [dbType, setDbType] = useState('mysql');
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [totalFields, setTotalFields] = useState(0);
  const [totalIndexes, setTotalIndexes] = useState(0);
  
  const { error } = useNotificationContext();

  // 当模态框关闭时重置状态
  useEffect(() => {
    if (!isOpen) {
      setSqlInput('');
      setParseResult(null);
      setTotalFields(0);
      setTotalIndexes(0);
    }
  }, [isOpen]);

  // 预览SQL解析结果
  const handleParseSQL = () => {
    if (!sqlInput.trim()) {
      error('请输入SQL语句');
      return;
    }

    setIsParsing(true);
    setParseResult(null);
    
    // 模拟解析过程
    setTimeout(() => {
      try {
        // 在实际实现中，这里会调用SQL解析函数
        const result = parseSQL(sqlInput, dbType);
        
        // 计算字段和索引总数
        let fieldsCount = 0;
        let indexesCount = 0;
        
        result.statements.forEach(stmt => {
          fieldsCount += stmt.fields.length;
          indexesCount += stmt.indexes.length;
        });
        
        setTotalFields(fieldsCount);
        setTotalIndexes(indexesCount);
        setParseResult(result);
      } catch (err) {
        console.error('SQL解析失败', err);
        error('SQL解析失败：' + (err as Error).message);
        setParseResult({
          success: false,
          tables: 0,
          errors: [(err as Error).message],
          statements: []
        });
      } finally {
        setIsParsing(false);
      }
    }, 500);
  };

  // 导入SQL（通过props回调处理）
  const handleImport = () => {
    if (!parseResult || !parseResult.success) {
      error('请先成功解析SQL');
      return;
    }

    onImport(parseResult.statements, dbType);
    onClose();
  };

  // SQL解析函数（示例实现）
  const parseSQL = (sql: string, type: string): ParseResult => {
    // 这里应该实现实际的SQL解析逻辑
    // 示例仅做简单处理
    
    const statements: any[] = [];
    const errors: string[] = [];
    
    try {
      // 简单的分割和检测CREATE TABLE语句
      const sqlStatements = sql.split(';').filter(stmt => stmt.trim());
      
      for (const stmt of sqlStatements) {
        const trimmedStmt = stmt.trim();
        
        // 检测是否为CREATE TABLE语句
        if (/CREATE\s+TABLE/i.test(trimmedStmt)) {
          // 提取表名
          const tableNameMatch = trimmedStmt.match(/CREATE\s+TABLE\s+(?:`|")?([a-zA-Z0-9_]+)(?:`|")?/i);
          
          if (tableNameMatch && tableNameMatch[1]) {
            const tableName = tableNameMatch[1];
            
            // 创建表信息对象
            const tableInfo = {
              name: tableName,
              code: tableName,
              comment: extractComment(trimmedStmt),
              fields: extractFields(trimmedStmt, type),
              indexes: extractIndexes(trimmedStmt, type)
            };
            
            statements.push(tableInfo);
          } else {
            errors.push(`无法识别表名: ${trimmedStmt.substring(0, 100)}...`);
          }
        }
      }
      
      return {
        success: statements.length > 0,
        tables: statements.length,
        errors,
        statements
      };
    } catch (err) {
      console.error('SQL解析错误', err);
      return {
        success: false,
        tables: 0,
        errors: [(err as Error).message],
        statements: []
      };
    }
  };

  // 从SQL中提取表注释
  const extractComment = (sql: string): string => {
    const commentMatch = sql.match(/COMMENT\s*=\s*['"](.+?)['"]/i);
    return commentMatch ? commentMatch[1] : '';
  };

  // 从SQL中提取字段信息
  const extractFields = (sql: string, dbType: string): any[] => {
    const fields: any[] = [];
    
    // 提取字段定义部分
    const fieldDefinitionMatch = sql.match(/\(([^]*)\)/);
    
    if (fieldDefinitionMatch && fieldDefinitionMatch[1]) {
      const fieldDefinitions = fieldDefinitionMatch[1].split(',');
      
      for (let fieldDef of fieldDefinitions) {
        fieldDef = fieldDef.trim();
        
        // 跳过索引定义
        if (/^(KEY|INDEX|UNIQUE|PRIMARY)/i.test(fieldDef)) {
          continue;
        }
        
        // 匹配字段名和类型
        const fieldMatch = fieldDef.match(/^`?(\w+)`?\s+(\w+)(?:\((\d+)(?:,(\d+))?\))?/);
        
        if (fieldMatch) {
          const [, name, type, length, scale] = fieldMatch;
          
          // 检查约束
          const isPrimaryKey = /PRIMARY\s+KEY/i.test(fieldDef);
          const isNotNull = /NOT\s+NULL/i.test(fieldDef);
          const isAutoIncrement = /AUTO_INCREMENT/i.test(fieldDef);
          
          // 提取默认值
          const defaultMatch = fieldDef.match(/DEFAULT\s+(['"]?)(.*?)\1(?:\s|$)/i);
          const defaultValue = defaultMatch ? defaultMatch[2] : undefined;
          
          // 提取注释
          const commentMatch = fieldDef.match(/COMMENT\s+['"](.+?)['"]/i);
          const comment = commentMatch ? commentMatch[1] : '';
          
          fields.push({
            id: Date.now() + Math.random().toString(),
            name,
            code: name,
            type: type.toUpperCase(),
            length: length ? parseInt(length) : undefined,
            scale: scale ? parseInt(scale) : undefined,
            primaryKey: isPrimaryKey,
            notNull: isNotNull,
            autoIncrement: isAutoIncrement,
            defaultValue,
            comment
          });
        }
      }
    }
    
    return fields;
  };

  // 从SQL中提取索引信息
  const extractIndexes = (sql: string, dbType: string): any[] => {
    const indexes: any[] = [];
    
    // 提取字段定义部分
    const fieldDefinitionMatch = sql.match(/\(([^]*)\)/);
    
    if (fieldDefinitionMatch && fieldDefinitionMatch[1]) {
      const fieldDefinitions = fieldDefinitionMatch[1].split(',');
      
      for (let fieldDef of fieldDefinitions) {
        fieldDef = fieldDef.trim();
        
        // 只处理索引定义
        if (/^(KEY|INDEX|UNIQUE)/i.test(fieldDef)) {
          // 匹配索引名和字段
          const indexMatch = fieldDef.match(/^(?:UNIQUE\s+)?(?:KEY|INDEX)\s+`?(\w+)`?\s+\(`?(\w+)`?(?:,\s*`?(\w+)`?)*\)/i);
          
          if (indexMatch) {
            const [, name, firstField] = indexMatch;
            
            // 提取所有字段
            const fieldsMatch = fieldDef.match(/\(([^)]+)\)/);
            const fields = fieldsMatch ? fieldsMatch[1].split(',').map(f => f.trim().replace(/[`'"]/g, '')) : [];
            
            indexes.push({
              id: Date.now() + Math.random().toString(),
              name,
              fields,
              unique: /UNIQUE/i.test(fieldDef),
              comment: ''
            });
          }
        } else if (/^PRIMARY\s+KEY/i.test(fieldDef)) {
          // 处理主键
          const primaryKeyMatch = fieldDef.match(/PRIMARY\s+KEY\s+\(`?(\w+)`?(?:,\s*`?(\w+)`?)*\)/i);
          
          if (primaryKeyMatch) {
            // 提取所有主键字段
            const fieldsMatch = fieldDef.match(/\(([^)]+)\)/);
            const fields = fieldsMatch ? fieldsMatch[1].split(',').map(f => f.trim().replace(/[`'"]/g, '')) : [];
            
            indexes.push({
              id: Date.now() + Math.random().toString(),
              name: 'PRIMARY',
              fields,
              unique: true,
              comment: '主键索引'
            });
          }
        }
      }
    }
    
    return indexes;
  };

  if (!isOpen) return null;

  // 示例SQL语句
  const exampleSQL = `CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TINYINT DEFAULT 1
);`;

  return (
    <div className="modal-backdrop" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="modal-container cyber-modal large">
        <div className="modal-header">
          <h2><CodeOutlined /> 导入SQL</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="form-section">
            <div className="section-title cyber-section-title">
              <DatabaseOutlined /> 数据库类型
            </div>
            <div className="select-wrapper">
              <select 
                value={dbType}
                onChange={(e) => setDbType(e.target.value)}
                className="cyber-select"
              >
                {databaseTypes.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="select-arrow"></div>
            </div>
          </div>

          <div className="form-section">
            <div className="section-title cyber-section-title">
              <span className="custom-sql-icon"><SQLIcon /></span> SQL 语句
            </div>
            
            <div className="sql-input-container">
              <textarea
                className="cyber-textarea sql-input"
                value={sqlInput}
                onChange={(e) => setSqlInput(e.target.value)}
                placeholder={exampleSQL}
                rows={10}
              />
              
              <div className="sql-input-helper">
                <div className="sql-input-tips">
                  <InfoCircleOutlined /> 支持多个CREATE TABLE语句，使用分号(;)分隔
                </div>
                
                <div className="sql-example-toggle">
                  <button 
                    className="sql-example-btn"
                    onClick={() => setSqlInput(exampleSQL)}
                    title="插入示例SQL"
                  >
                    <CodeFilled /> 插入示例
                  </button>
                </div>
              </div>
            </div>
          </div>

          {isParsing && (
            <div className="parsing-indicator">
              <LoadingOutlined className="parsing-icon" spin />
              <span>正在解析SQL语句...</span>
            </div>
          )}

          {parseResult && (
            <div className={`parse-result ${parseResult.success ? 'success' : 'error'}`}>
              <div className="result-header">
                {parseResult.success ? (
                  <CheckCircleOutlined className="success-icon" />
                ) : (
                  <WarningOutlined className="error-icon" />
                )}
                <h3>
                  {parseResult.success 
                    ? `成功识别 ${parseResult.tables} 个表` 
                    : '解析SQL出错'}
                </h3>
              </div>
              
              {parseResult.errors.length > 0 && (
                <div className="error-list">
                  <h4>错误信息：</h4>
                  <ul>
                    {parseResult.errors.map((err, index) => (
                      <li key={index}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {parseResult.success && parseResult.statements.length > 0 && (
                <div className="tables-preview">
                  <h4>解析结果摘要：</h4>
                  
                  <div className="parse-stats">
                    <div className="stat-item">
                      <TableOutlined />
                      <span className="stat-value">{parseResult.tables}</span>
                      <span className="stat-label">个表</span>
                    </div>
                    <div className="stat-item">
                      <FieldStringOutlined />
                      <span className="stat-value">{totalFields}</span>
                      <span className="stat-label">个字段</span>
                    </div>
                    <div className="stat-item">
                      <FileSearchOutlined />
                      <span className="stat-value">{totalIndexes}</span>
                      <span className="stat-label">个索引</span>
                    </div>
                  </div>
                  
                  <div className="tables-list">
                    <h4>识别的表：</h4>
                    <ul>
                      {parseResult.statements.map((table, index) => (
                        <li key={index} className="table-item">
                          <div className="table-name">
                            <TableOutlined />
                            <strong>{table.name}</strong>
                            {table.comment && <span className="table-comment">{table.comment}</span>}
                          </div>
                          <div className="table-meta">
                            <span className="meta-item">{table.fields.length} 个字段</span>
                            <span className="meta-item">{table.indexes.length} 个索引</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button 
            className={`parse-btn ${isParsing ? 'disabled' : ''}`}
            onClick={handleParseSQL}
            disabled={isParsing || !sqlInput.trim()}
          >
            {isParsing ? <><LoadingOutlined /> 解析中...</> : <><FileSearchOutlined /> 解析SQL</>}
          </button>
          <button 
            className="cancel-btn" 
            onClick={onClose}
          >
            取消
          </button>
          <button 
            className="confirm-btn" 
            onClick={handleImport}
            disabled={!parseResult || !parseResult.success}
          >
            <ImportOutlined /> 导入
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportSQLModal;