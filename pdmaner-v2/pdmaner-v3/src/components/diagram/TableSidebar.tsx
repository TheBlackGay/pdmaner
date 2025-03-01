import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { Entity } from '../../models/entity';
import { Input, Tooltip, Empty, Spin } from 'antd';
import { SearchOutlined, TableOutlined, PlusOutlined } from '@ant-design/icons';
import './TableSidebar.css';

interface TableSidebarProps {
  onAddTable: (entity: Entity, position: { x: number, y: number }) => void;
  diagramId: string;
}

const TableSidebar: React.FC<TableSidebarProps> = ({ onAddTable, diagramId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEntities, setFilteredEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 从Redux获取当前项目和实体列表
  const currentProject = useSelector((state: RootState) => state.app.currentProject);
  
  // 当项目数据变化或搜索词变化时，更新过滤后的实体列表
  useEffect(() => {
    if (!currentProject) {
      setFilteredEntities([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    try {
      // 查找当前图表
      const currentDiagram = currentProject.diagrams?.find(d => d.id === diagramId);
      if (!currentDiagram) {
        setFilteredEntities([]);
        setLoading(false);
        return;
      }
      
      // 获取当前图表中已经使用的实体ID列表
      const usedEntityIds = currentDiagram.entityIds || [];
      
      // 使用当前图表所属域过滤数据表
      const domainId = currentDiagram.domainId;
      
      // 获取当前域下的所有表
      const domainTables = currentProject.tables.filter(table => table.domainId === domainId);
      
      // 将表转换为实体格式并过滤搜索条件
      const entities = domainTables.map(table => ({
        id: table.id,
        defKey: table.code,
        defName: table.name,
        comment: table.comment,
        domainId: table.domainId,
        fields: table.fields || [],
        indexes: table.indexes || [],
        type: table.type
      }));
      
      // 基于搜索词过滤
      const filtered = entities.filter(entity => {
        const matchesSearch = 
          !searchTerm || 
          entity.defName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entity.defKey.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesSearch;
      });
      
      setFilteredEntities(filtered);
    } catch (err) {
      console.error('过滤实体列表出错:', err);
      setFilteredEntities([]);
    } finally {
      setLoading(false);
    }
  }, [currentProject, searchTerm, diagramId]);
  
  // 处理搜索输入变化
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // 处理拖拽开始
  const handleDragStart = (e: React.DragEvent, entity: Entity) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(entity));
    e.dataTransfer.effectAllowed = 'copy';
  };
  
  // 处理点击添加表
  const handleAddTable = (entity: Entity) => {
    // 当点击添加按钮时，将实体添加到画布中央
    const position = { x: 300, y: 200 }; // 默认位置，稍后可调整
    onAddTable(entity, position);
  };
  
  // 处理高亮显示已添加到图表中的实体
  const isEntityInDiagram = (entityId: string): boolean => {
    const currentDiagram = currentProject?.diagrams?.find(d => d.id === diagramId);
    return currentDiagram?.entityIds?.includes(entityId) || false;
  };
  
  // 获取当前域名称
  const getCurrentDomainName = (): string => {
    if (!currentProject || !diagramId) return '';
    
    const diagram = currentProject.diagrams?.find(d => d.id === diagramId);
    if (!diagram) return '';
    
    const domain = currentProject.domains.find(d => d.id === diagram.domainId);
    return domain?.name || '';
  };
  
  return (
    <div className="table-sidebar">
      <div className="sidebar-header">
        <h3 className="domain-title">{getCurrentDomainName()} - 可用表</h3>
        <div className="search-container">
          <Input
            placeholder="搜索表..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={handleSearchChange}
            allowClear
          />
        </div>
      </div>
      
      <div className="entity-list">
        {loading ? (
          <div className="loading-container">
            <Spin size="small" />
            <span className="loading-text">加载中...</span>
          </div>
        ) : filteredEntities.length > 0 ? (
          filteredEntities.map(entity => (
            <div
              key={entity.id}
              className={`entity-item ${isEntityInDiagram(entity.id) ? 'in-diagram' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, entity)}
            >
              <div className="entity-info">
                <span className="entity-name">
                  <TableOutlined /> {entity.defName}
                </span>
                <span className="entity-key">{entity.defKey}</span>
              </div>
              <Tooltip title={isEntityInDiagram(entity.id) ? '已在图表中' : '添加到图表'}>
                <button 
                  className="add-entity-btn"
                  onClick={() => handleAddTable(entity)}
                  disabled={isEntityInDiagram(entity.id)}
                >
                  <PlusOutlined />
                </button>
              </Tooltip>
            </div>
          ))
        ) : (
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
            description="没有找到匹配的表" 
            className="empty-message"
          />
        )}
      </div>
    </div>
  );
};

export default TableSidebar; 