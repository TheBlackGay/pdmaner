import React, { useRef, useEffect } from 'react';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  CopyOutlined,
  ExportOutlined
} from '@ant-design/icons';
import './ContextMenu.css';

export interface ContextMenuPosition {
  visible: boolean;
  x: number;
  y: number;
  type: string;
  targetId?: string;
}

interface ContextMenuProps {
  position: ContextMenuPosition;
  onMenuItemClick: (action: string) => void;
  onHideMenu: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  position,
  onMenuItemClick,
  onHideMenu
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onHideMenu();
      }
    };

    if (position.visible) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [position.visible, onHideMenu]);

  if (!position.visible) return null;

  const renderMenuItems = () => {
    const { type, targetId } = position;

    switch (type) {
      case 'model':
        return (
          <div className="context-menu-item" onClick={() => onMenuItemClick('addDomain')}>
            <PlusOutlined /> 新增主题域
          </div>
        );
      
      case 'domain':
        return (
          <>
            <div className="context-menu-item" onClick={() => onMenuItemClick('addSubItem')}>
              <PlusOutlined /> 新增
            </div>
            <div className="context-menu-item" onClick={() => onMenuItemClick('editDomain')}>
              <EditOutlined /> 编辑
            </div>
            <div className="context-menu-item" onClick={() => onMenuItemClick('clearDomain')}>
              <DeleteOutlined /> 清空
            </div>
            <div className="context-menu-item danger" onClick={() => onMenuItemClick('deleteDomain')}>
              <DeleteOutlined /> 删除
            </div>
          </>
        );
      
      case 'tables':
        return (
          <>
            <div className="context-menu-item" onClick={() => onMenuItemClick('addTable')}>
              <PlusOutlined /> 新增数据表
            </div>
            <div className="context-menu-item" onClick={() => onMenuItemClick('copyTables')}>
              <CopyOutlined /> 复制这些数据表
            </div>
            <div className="context-menu-item" onClick={() => onMenuItemClick('cutTables')}>
              <EditOutlined /> 剪切这些数据表
            </div>
            <div className="context-menu-item" onClick={() => onMenuItemClick('pasteTables')}>
              <EditOutlined /> 粘贴这些数据表
            </div>
            <div className="context-menu-item danger" onClick={() => onMenuItemClick('deleteTables')}>
              <DeleteOutlined /> 删除这些数据表
            </div>
          </>
        );
      
      case 'diagrams':
        return (
          <>
            <div className="context-menu-item" onClick={() => onMenuItemClick('addDiagram')}>
              <PlusOutlined /> 新增关系图
            </div>
            <div className="context-menu-item" onClick={() => onMenuItemClick('copyDiagrams')}>
              <CopyOutlined /> 复制这些关系图
            </div>
            <div className="context-menu-item" onClick={() => onMenuItemClick('cutDiagrams')}>
              <EditOutlined /> 剪切这些关系图
            </div>
            <div className="context-menu-item" onClick={() => onMenuItemClick('pasteDiagrams')}>
              <EditOutlined /> 粘贴这些关系图
            </div>
            <div className="context-menu-item danger" onClick={() => onMenuItemClick('deleteDiagrams')}>
              <DeleteOutlined /> 删除这些关系图
            </div>
            <div className="context-menu-item" onClick={() => onMenuItemClick('exportDiagramsAsPNG')}>
              <ExportOutlined /> 导出为PNG这些关系图
            </div>
            <div className="context-menu-item" onClick={() => onMenuItemClick('exportDiagramsAsSVG')}>
              <ExportOutlined /> 导出为SVG这些关系图
            </div>
          </>
        );
      
      case 'table':
        return (
          <>
            <div className="context-menu-item" onClick={() => onMenuItemClick('edit')}>
              <EditOutlined /> 编辑表
            </div>
            <div className="context-menu-item" onClick={() => onMenuItemClick('rename')}>
              <EditOutlined /> 重命名
            </div>
            <div className="context-menu-item" onClick={() => onMenuItemClick('copy')}>
              <CopyOutlined /> 复制表
            </div>
            <div className="context-menu-item danger" onClick={() => onMenuItemClick('delete')}>
              <DeleteOutlined /> 删除表
            </div>
          </>
        );
      
      // 其他菜单类型（entities, views, diagrams, dictionaries 等）可以根据需要添加

      default:
        return (
          <>
            <div className="context-menu-item" onClick={() => onMenuItemClick('edit')}>
              <EditOutlined /> 编辑
            </div>
            <div className="context-menu-item" onClick={() => onMenuItemClick('rename')}>
              <EditOutlined /> 重命名
            </div>
            <div className="context-menu-item" onClick={() => onMenuItemClick('copy')}>
              <CopyOutlined /> 复制
            </div>
            <div className="context-menu-item danger" onClick={() => onMenuItemClick('delete')}>
              <DeleteOutlined /> 删除
            </div>
          </>
        );
    }
  };

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ top: position.y, left: position.x }}
    >
      {renderMenuItems()}
    </div>
  );
};

export default ContextMenu; 