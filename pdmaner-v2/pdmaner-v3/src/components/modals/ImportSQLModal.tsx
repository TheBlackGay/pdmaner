import React, { useState, useEffect, useRef } from 'react';
import {
  FileTextOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  TableOutlined,
  ColumnHeightOutlined,
  KeyOutlined
} from '@ant-design/icons';
import './Modal.css';

interface ImportSQLModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (statements: any[], dbType: string) => void;
}

const ImportSQLModal: React.FC<ImportSQLModalProps> = ({
  isOpen,
  onClose,
  onImport
}) => {
  const [sqlInput, setSqlInput] = useState('');
  const [dbType, setDbType] = useState('MySQL');
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<{
    success: boolean;
    message: string;
    data?: any[];
    errors?: string[];
  } | null>(null);
  
  // 引用解析结果容器，用于滚动控制
  const resultContainerRef = useRef<HTMLDivElement>(null);
  
  // 重置所有状态
  const resetState = () => {
    setSqlInput('');
    setDbType('MySQL');
    setIsParsing(false);
    setParseResult(null);
  };
  
  // 关闭弹窗时重置状态
  const handleClose = () => {
    resetState();
    onClose();
  };
  
  // 确认导入时重置状态
  const handleConfirmImport = () => {
    if (parseResult?.success && parseResult.data) {
      onImport(parseResult.data, dbType);
      resetState();
      onClose();
    }
  };

  // 解析SQL语句
  const handleParse = () => {
    if (!sqlInput.trim()) {
      setParseResult({
        success: false,
        message: '请输入SQL语句',
        errors: ['SQL语句不能为空']
      });
      return;
    }

    setIsParsing(true);
    
    try {
      // 简单的解析逻辑 - 这里应该使用更强大的SQL解析器
      // 分割SQL语句
      const statements = splitSqlStatements(sqlInput);
      
      // 解析每个语句
      const parsedStatements = statements
        .map(stmt => parseCreateTableStatement(stmt, dbType))
        .filter(Boolean);
      
      if (parsedStatements.length === 0) {
        setParseResult({
          success: false,
          message: '未找到有效的CREATE TABLE语句',
          errors: ['请确保SQL中包含CREATE TABLE语句']
        });
      } else {
        setParseResult({
          success: true,
          message: `成功解析 ${parsedStatements.length} 个表结构`,
          data: parsedStatements
        });
        
        // 解析成功后，滚动到结果区域
        setTimeout(() => {
          resultContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (error) {
      console.error('解析SQL出错:', error);
      setParseResult({
        success: false,
        message: '解析SQL时出错',
        errors: [(error as Error).message]
      });
    } finally {
      setIsParsing(false);
    }
  };

  // 分割SQL语句
  const splitSqlStatements = (sql: string): string[] => {
    // 简单的分割逻辑，按分号分割
    return sql.split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && /CREATE\s+TABLE/i.test(stmt));
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
          
          // 提取默认值 - 修复对空字符串的处理
          let defaultValue: string | undefined = undefined;
          
          if (/DEFAULT\s+/i.test(fieldDef)) {
            // 优先匹配带引号的字符串默认值（单引号或双引号）
            const stringMatch = fieldDef.match(/DEFAULT\s+(['"])(.*?)\1/i);
            if (stringMatch) {
              // 直接使用捕获的字符串，即使是空字符串也会保留
              defaultValue = stringMatch[2];
            } else {
              // 匹配不带引号的默认值（如数字、函数名等）
              const nonStringMatch = fieldDef.match(/DEFAULT\s+([^\s,;)]+)/i);
              if (nonStringMatch) {
                defaultValue = nonStringMatch[1];
              }
            }
          }
          
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

  // 提取索引信息
  const extractIndexes = (sql: string): any[] => {
    const indexes: any[] = [];
    
    // 查找所有索引定义
    const indexMatches = sql.matchAll(/(?:KEY|INDEX|UNIQUE\s+(?:KEY|INDEX)?|PRIMARY\s+KEY)\s+(?:`?(\w+)`?)?\s*\(([^)]+)\)/gi);
    
    for (const match of indexMatches) {
      const [fullMatch, indexName, columnsList] = match;
      
      // 确定索引类型
      const isPrimary = /PRIMARY\s+KEY/i.test(fullMatch);
      const isUnique = /UNIQUE/i.test(fullMatch);
      
      // 提取字段列表
      const columns = columnsList.split(',').map(col => 
        col.trim().replace(/^`|`$/g, '') // 移除反引号
      );
      
      // 为主键索引使用默认名称
      const name = isPrimary ? 'PRIMARY' : (indexName || `idx_${Date.now()}`);
      
      indexes.push({
        id: Date.now() + Math.random().toString(),
        name,
        fields: columns,
        unique: isPrimary || isUnique,
        comment: isPrimary ? '主键索引' : (isUnique ? '唯一索引' : '普通索引')
      });
    }
    
    return indexes;
  };

  // 解析CREATE TABLE语句
  const parseCreateTableStatement = (sql: string, dbType: string): any | null => {
    try {
      // 提取表名
      const tableNameMatch = sql.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`?(\w+)`?(?:\.`?(\w+)`?)?)/i);
      
      if (!tableNameMatch) return null;
      
      // 获取表名 - 如果有模式名，则使用第二个捕获组
      const tableName = tableNameMatch[2] || tableNameMatch[1];
      
      // 提取表注释
      const commentMatch = sql.match(/COMMENT\s*=\s*['"](.+?)['"]/i);
      const comment = commentMatch ? commentMatch[1] : '';
      
      // 提取字段
      const fields = extractFields(sql, dbType);
      
      // 提取索引
      const indexes = extractIndexes(sql);
      
      return {
        name: tableName,
        code: tableName.toLowerCase(),
        comment,
        fields,
        indexes
      };
    } catch (error) {
      console.error('解析CREATE TABLE语句出错:', error, sql);
      return null;
    }
  };

  // 显示SQL示例
  const showExample = () => {
    const example = `CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  UNIQUE KEY idx_email (email),
  KEY idx_status (status)
) COMMENT='用户表';

CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  shipping_address TEXT,
  KEY idx_user (user_id),
  KEY idx_status (status)
) COMMENT='订单表';`;
    
    setSqlInput(example);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={e => {
      if (e.target === e.currentTarget) handleClose();
    }}>
      <div className="modal-container cyber-modal large import-sql-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>导入SQL</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>
        
        <div className="modal-body compact">
          {/* 数据库类型选择 - 移至顶部 */}
          <div className="db-type-selector">
            <div className="form-group db-type-group">
              <label><DatabaseOutlined /> 数据库类型</label>
              <select
                className="cyber-select"
                value={dbType}
                onChange={e => setDbType(e.target.value)}
              >
                <option value="MySQL">MySQL</option>
                <option value="PostgreSQL">PostgreSQL</option>
                <option value="Oracle">Oracle</option>
                <option value="SQLServer">SQL Server</option>
              </select>
            </div>
          </div>
          
          {/* SQL输入区域 */}
          <div className="form-section">
            <div className="cyber-section-title">
              <FileTextOutlined /> SQL 语句
            </div>

            <div className="form-row full-width">
              <div className="form-group sql-input-group">
                <div className="sql-input-container">
                  <textarea
                    className="sql-input"
                    value={sqlInput}
                    onChange={e => setSqlInput(e.target.value)}
                    placeholder="请输入 CREATE TABLE 语句..."
                    rows={10}
                  />
                </div>
                <div className="sql-input-helper">
                  <div className="sql-input-tips">
                    <InfoCircleOutlined /> 支持多个 CREATE TABLE 语句，使用分号 (;) 分隔
                  </div>
                  <button
                    type="button"
                    className="sql-example-btn"
                    onClick={showExample}
                  >
                    <InfoCircleOutlined /> 显示示例
                  </button>
                </div>
              </div>
            </div>

            <div className="form-row parse-button-row">
              <button
                type="button"
                className="parse-btn"
                onClick={handleParse}
                disabled={isParsing || !sqlInput.trim()}
              >
                {isParsing ? <LoadingOutlined /> : <DatabaseOutlined />} 解析 SQL
              </button>
            </div>
          </div>

          {isParsing && (
            <div className="parsing-indicator">
              <LoadingOutlined className="parsing-icon" />
              <span>正在解析SQL语句...</span>
            </div>
          )}

          {/* 解析结果区域 */}
          {parseResult && (
            <div 
              ref={resultContainerRef}
              className={`form-section parse-result ${parseResult.success ? 'success' : 'error'}`}
            >
              <div className="result-header">
                {parseResult.success ? (
                  <>
                    <CheckCircleOutlined className="success-icon" />
                    <h3>解析成功</h3>
                  </>
                ) : (
                  <>
                    <ExclamationCircleOutlined className="error-icon" />
                    <h3>解析失败</h3>
                  </>
                )}
              </div>

              {parseResult.success ? (
                <div className="parse-success-content">
                  <div className="parse-stats">
                    <div className="stat-item">
                      <TableOutlined />
                      <div className="stat-value">{parseResult.data?.length || 0}</div>
                      <div className="stat-label">表结构</div>
                    </div>
                    <div className="stat-item">
                      <ColumnHeightOutlined />
                      <div className="stat-value">
                        {parseResult.data?.reduce((sum, table) => sum + table.fields.length, 0) || 0}
                      </div>
                      <div className="stat-label">字段</div>
                    </div>
                    <div className="stat-item">
                      <KeyOutlined />
                      <div className="stat-value">
                        {parseResult.data?.reduce((sum, table) => sum + table.indexes.length, 0) || 0}
                      </div>
                      <div className="stat-label">索引</div>
                    </div>
                  </div>

                  <div className="tables-preview">
                    <h4>解析到的表结构</h4>
                    <div className="tables-list">
                      {parseResult.data?.map(table => (
                        <div key={table.name} className="table-item">
                          <div className="table-name">
                            <TableOutlined />
                            <strong>{table.name}</strong>
                            {table.comment && <span className="table-comment">{table.comment}</span>}
                          </div>
                          <div className="table-meta">
                            <span className="meta-item">{table.fields.length} 个字段</span>
                            <span className="meta-item">{table.indexes.length} 个索引</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="error-list">
                  <h4>解析错误</h4>
                  <ul>
                    {parseResult.errors?.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="cancel-btn" onClick={handleClose}>取消</button>
          {parseResult?.success && parseResult.data && (
            <button
              type="button" 
              className="confirm-btn" 
              onClick={handleConfirmImport}
            >
              <DatabaseOutlined /> 导入解析的表结构
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportSQLModal;