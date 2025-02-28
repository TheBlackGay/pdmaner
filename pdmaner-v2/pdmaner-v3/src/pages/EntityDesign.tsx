import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined,
  CopyOutlined,
  SaveOutlined,
  KeyOutlined,
  InfoCircleOutlined 
} from '@ant-design/icons';
import './EntityDesign.css';

interface EntityField {
  id: string;
  name: string;
  type: string;
  length?: number;
  scale?: number;
  primaryKey: boolean;
  notNull: boolean;
  autoIncrement: boolean;
  comment: string;
}

interface EntityDesignProps {
  type?: 'tables' | 'entities' | 'views';
}

const EntityDesign: React.FC<EntityDesignProps> = ({ type = 'tables' }) => {
  const [entityName, setEntityName] = useState('');
  const [entityComment, setEntityComment] = useState('');
  const [fields, setFields] = useState<EntityField[]>([]);
  const { domainId } = useParams<{ domainId?: string }>();
  
  // 页面标题
  const getTitle = () => {
    switch (type) {
      case 'tables':
        return '数据表';
      case 'entities':
        return '逻辑实体';
      case 'views':
        return '多表透视';
      default:
        return '数据表';
    }
  };
  
  const handleAddField = () => {
    // 添加新字段的逻辑
    console.log('Add new field');
  };
  
  const handleEditField = (id: string) => {
    // 编辑字段的逻辑
    console.log('Edit field', id);
  };
  
  const handleDeleteField = (id: string) => {
    // 删除字段的逻辑
    console.log('Delete field', id);
  };
  
  return (
    <div className="entity-design-page">
      <div className="entity-header">
        <div className="entity-info">
          <h2>{getTitle()}{domainId ? ` - 主题域: ${domainId}` : ''}</h2>
          <div className="form-group">
            <label>名称</label>
            <input 
              type="text" 
              value={entityName} 
              onChange={(e) => setEntityName(e.target.value)} 
              placeholder="输入名称"
            />
          </div>
          
          <div className="form-group">
            <label>备注</label>
            <input 
              type="text" 
              value={entityComment} 
              onChange={(e) => setEntityComment(e.target.value)} 
              placeholder="输入备注信息"
            />
          </div>
        </div>
        
        <div className="entity-actions">
          <button className="save-btn">
            <SaveOutlined /> 保存
          </button>
        </div>
      </div>
      
      <div className="entity-content">
        <div className="fields-container">
          <div className="tools-bar">
            <h3>字段列表</h3>
            <button className="add-field-btn" onClick={handleAddField}>
              <PlusOutlined /> 添加字段
            </button>
          </div>
          
          <div className="fields-table-container">
            <table className="fields-table">
              <thead>
                <tr>
                  <th>名称</th>
                  <th>类型</th>
                  <th>长度</th>
                  <th>主键</th>
                  <th>必填</th>
                  <th>自增</th>
                  <th>备注</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {fields.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="empty-message">
                      <InfoCircleOutlined /> 暂无字段，请添加
                    </td>
                  </tr>
                ) : (
                  fields.map(field => (
                    <tr key={field.id}>
                      <td>{field.name}</td>
                      <td>{field.type}</td>
                      <td>{field.length || '-'}</td>
                      <td>{field.primaryKey ? <KeyOutlined className="primary-key-icon" /> : '-'}</td>
                      <td>{field.notNull ? '✓' : '-'}</td>
                      <td>{field.autoIncrement ? '✓' : '-'}</td>
                      <td>{field.comment}</td>
                      <td className="actions-cell">
                        <button title="编辑" onClick={() => handleEditField(field.id)}>
                          <EditOutlined />
                        </button>
                        <button title="复制">
                          <CopyOutlined />
                        </button>
                        <button 
                          title="删除" 
                          className="delete-btn"
                          onClick={() => handleDeleteField(field.id)}
                        >
                          <DeleteOutlined />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="entity-properties">
          <div className="properties-section">
            <h3>索引</h3>
            <div className="placeholder-info">
              <p>暂无索引</p>
              <button><PlusOutlined /> 添加索引</button>
            </div>
          </div>
          
          <div className="properties-section">
            <h3>关系</h3>
            <div className="placeholder-info">
              <p>暂无关系</p>
              <button><PlusOutlined /> 添加关系</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntityDesign; 