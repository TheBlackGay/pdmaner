import React, { useState } from 'react';
import './CodeGeneration.css';

const CodeGeneration: React.FC = () => {
  const [activeTab, setActiveTab] = useState('sql');
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  
  const entities = [
    { id: '1', name: '用户表', code: 'user' },
    { id: '2', name: '订单表', code: 'order' },
    { id: '3', name: '产品表', code: 'product' },
  ];
  
  const toggleEntitySelection = (id: string) => {
    if (selectedEntities.includes(id)) {
      setSelectedEntities(selectedEntities.filter(entityId => entityId !== id));
    } else {
      setSelectedEntities([...selectedEntities, id]);
    }
  };
  
  const selectAllEntities = () => {
    if (selectedEntities.length === entities.length) {
      setSelectedEntities([]);
    } else {
      setSelectedEntities(entities.map(entity => entity.id));
    }
  };
  
  return (
    <div className="code-generation-page">
      <div className="code-generation-header">
        <h2>代码生成</h2>
        <div className="tab-buttons">
          <button 
            className={`tab-btn ${activeTab === 'sql' ? 'active' : ''}`}
            onClick={() => setActiveTab('sql')}
          >
            SQL脚本
          </button>
          <button 
            className={`tab-btn ${activeTab === 'document' ? 'active' : ''}`}
            onClick={() => setActiveTab('document')}
          >
            文档生成
          </button>
          <button 
            className={`tab-btn ${activeTab === 'code' ? 'active' : ''}`}
            onClick={() => setActiveTab('code')}
          >
            应用代码
          </button>
        </div>
      </div>
      
      <div className="code-generation-container">
        <div className="entity-selector">
          <div className="selector-header">
            <h3>选择实体</h3>
            <button className="select-all-btn" onClick={selectAllEntities}>
              {selectedEntities.length === entities.length ? '取消全选' : '全选'}
            </button>
          </div>
          <div className="entity-list">
            {entities.map(entity => (
              <div 
                key={entity.id}
                className={`entity-item ${selectedEntities.includes(entity.id) ? 'selected' : ''}`}
                onClick={() => toggleEntitySelection(entity.id)}
              >
                <input 
                  type="checkbox" 
                  checked={selectedEntities.includes(entity.id)}
                  onChange={() => toggleEntitySelection(entity.id)}
                />
                <div className="entity-info">
                  <div className="entity-name">{entity.name}</div>
                  <div className="entity-code">{entity.code}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="generation-config">
          {activeTab === 'sql' && (
            <div className="sql-config">
              <h3>SQL脚本设置</h3>
              <div className="config-group">
                <label>数据库类型</label>
                <select>
                  <option>MySQL</option>
                  <option>PostgreSQL</option>
                  <option>Oracle</option>
                  <option>SQL Server</option>
                </select>
              </div>
              <div className="config-group">
                <label>字符集</label>
                <select>
                  <option>UTF-8</option>
                  <option>GBK</option>
                </select>
              </div>
              <div className="config-group">
                <label>输出路径</label>
                <div className="path-input">
                  <input type="text" value="/User/Documents/output.sql" readOnly />
                  <button>选择</button>
                </div>
              </div>
              <div className="config-options">
                <div className="option-item">
                  <input type="checkbox" id="dropTable" checked />
                  <label htmlFor="dropTable">包含DROP TABLE语句</label>
                </div>
                <div className="option-item">
                  <input type="checkbox" id="createIndex" checked />
                  <label htmlFor="createIndex">包含CREATE INDEX语句</label>
                </div>
                <div className="option-item">
                  <input type="checkbox" id="comment" checked />
                  <label htmlFor="comment">包含注释</label>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'document' && (
            <div className="document-config">
              <h3>文档生成设置</h3>
              <div className="config-group">
                <label>文档类型</label>
                <select>
                  <option>HTML</option>
                  <option>Word</option>
                  <option>PDF</option>
                  <option>Markdown</option>
                </select>
              </div>
              <div className="config-group">
                <label>输出路径</label>
                <div className="path-input">
                  <input type="text" value="/User/Documents/database_doc" readOnly />
                  <button>选择</button>
                </div>
              </div>
              <div className="config-options">
                <div className="option-item">
                  <input type="checkbox" id="includeRelationship" checked />
                  <label htmlFor="includeRelationship">包含关系图</label>
                </div>
                <div className="option-item">
                  <input type="checkbox" id="includeFields" checked />
                  <label htmlFor="includeFields">包含字段明细</label>
                </div>
                <div className="option-item">
                  <input type="checkbox" id="includeIndex" checked />
                  <label htmlFor="includeIndex">包含索引信息</label>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'code' && (
            <div className="code-config">
              <h3>应用代码生成设置</h3>
              <div className="config-group">
                <label>模板</label>
                <select>
                  <option>Spring Boot</option>
                  <option>Express (Node.js)</option>
                  <option>Django (Python)</option>
                  <option>Laravel (PHP)</option>
                </select>
              </div>
              <div className="config-group">
                <label>包名</label>
                <input type="text" value="com.example.demo" />
              </div>
              <div className="config-group">
                <label>输出路径</label>
                <div className="path-input">
                  <input type="text" value="/User/Documents/project" readOnly />
                  <button>选择</button>
                </div>
              </div>
              <div className="template-options">
                <h4>生成内容</h4>
                <div className="option-item">
                  <input type="checkbox" id="entity" checked />
                  <label htmlFor="entity">实体类</label>
                </div>
                <div className="option-item">
                  <input type="checkbox" id="repository" checked />
                  <label htmlFor="repository">Repository</label>
                </div>
                <div className="option-item">
                  <input type="checkbox" id="service" checked />
                  <label htmlFor="service">Service</label>
                </div>
                <div className="option-item">
                  <input type="checkbox" id="controller" checked />
                  <label htmlFor="controller">Controller</label>
                </div>
              </div>
            </div>
          )}
          
          <div className="action-buttons">
            <button className="preview-btn">预览</button>
            <button className="generate-btn">生成</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeGeneration; 