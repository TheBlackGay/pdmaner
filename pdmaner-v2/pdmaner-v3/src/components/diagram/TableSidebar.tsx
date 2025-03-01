import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { Entity } from '../../models/entity';
import { Input, Tooltip, Empty, Spin, Select } from 'antd';
import { SearchOutlined, TableOutlined, PlusOutlined, DatabaseOutlined, ApartmentOutlined } from '@ant-design/icons';
import './TableSidebar.css';

interface TableSidebarProps {
  onAddTable: (entity: Entity, position: { x: number, y: number }) => void;
  diagramId: string;
}

const TableSidebar: React.FC<TableSidebarProps> = ({ onAddTable, diagramId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEntities, setFilteredEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  
  // 从Redux获取当前项目和实体列表
  const currentProject = useSelector((state: RootState) => state.app.currentProject);
  
  // 当项目数据变化或搜索词变化时，更新过滤后的实体列表
  useEffect(() => {
    if (!currentProject || !currentProject.entities) {
      setFilteredEntities([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    // 获取当前图表中已经使用的实体ID列表
    const currentDiagram = currentProject.diagrams?.find(d => d.id === diagramId);
    const usedEntityIds = currentDiagram?.entityIds || [];
    
    // 过滤实体：基于搜索词、主题域和尚未添加到图表中的实体
    const filtered = currentProject.entities.filter(entity => {
      const matchesSearch = 
        !searchTerm || 
        entity.defName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entity.defKey.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 根据主题域筛选
      const matchesDomain = 
        selectedDomain === 'all' || 
        entity.domainId === selectedDomain;
      
      return matchesSearch && matchesDomain;
    });
    
    setFilteredEntities(filtered);
    setLoading(false);
  }, [currentProject, searchTerm, diagramId, selectedDomain]);
  
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
  
  // 生成主题域选项
  const getDomainOptions = () => {
    const domains = currentProject?.domains || [];
    
    // 创建"全部"选项和所有域选项
    return [
      { label: '全部主题域', value: 'all' },
      ...(domains.map(domain => ({
        label: domain.defName || domain.defKey,
        value: domain.id
      })))
    ];
  };
  
  return (
    <div className="table-sidebar">
      <div className="sidebar-header">
        <h3><DatabaseOutlined /> 可用表</h3>
        <div className="search-container">
          <Input
            placeholder="搜索表..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={handleSearchChange}
            allowClear
          />
        </div>
        <div className="domain-filter">
          <ApartmentOutlined />
          <Select
            placeholder="选择主题域"
            value={selectedDomain}
            onChange={setSelectedDomain}
            options={getDomainOptions()}
            style={{ width: '100%', marginTop: '8px' }}
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