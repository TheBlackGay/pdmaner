import React from 'react';
import {
  EditOutlined,
  FileTextOutlined,
  CopyOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import './ContextMenu.css';

interface DiagramContextMenuProps {
  position: { x: number, y: number };
  visible: boolean;
  onAction: (action: string, data?: any) => void;
  onClose: () => void;
}

const DiagramContextMenu: React.FC<DiagramContextMenuProps> = ({
  position,
  visible,
  onAction,
  onClose
}) => {
  if (!visible) return null;

  // 处理点击外部关闭菜单
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      onClose();
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // 处理菜单项点击
  const handleMenuItemClick = (action: string) => {
    onAction(action);
    onClose();
  };

  return (
    <div 
      className="context-menu diagram-context-menu"
      style={{ 
        left: position.x, 
        top: position.y,
        zIndex: 1000
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="menu-item" onClick={() => handleMenuItemClick('editDiagram')}>
        <EditOutlined className="menu-icon" />
        <span>编辑</span>
      </div>
      
      <div className="menu-item" onClick={() => handleMenuItemClick('renameDiagram')}>
        <FileTextOutlined className="menu-icon" />
        <span>重命名</span>
      </div>
      
      <div className="menu-item" onClick={() => handleMenuItemClick('copyDiagram')}>
        <CopyOutlined className="menu-icon" />
        <span>复制</span>
      </div>
      
      <div className="menu-divider"></div>
      
      <div className="menu-item danger" onClick={() => handleMenuItemClick('deleteDiagram')}>
        <DeleteOutlined className="menu-icon" />
        <span>删除</span>
      </div>
    </div>
  );
};

export default DiagramContextMenu; 