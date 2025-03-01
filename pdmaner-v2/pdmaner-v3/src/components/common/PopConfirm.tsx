import React, { useEffect, useRef } from 'react';
import './PopConfirm.css';

interface PopConfirmProps {
  visible: boolean;
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
  position: { x: number, y: number };
}

const PopConfirm: React.FC<PopConfirmProps> = ({
  visible,
  title,
  onConfirm,
  onCancel,
  position
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  
  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onCancel();
      }
    };
    
    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [visible, onCancel]);
  
  if (!visible) return null;
  
  return (
    <div 
      className="popconfirm-container"
      style={{ left: position.x, top: position.y }}
      ref={popupRef}
    >
      <div className="popconfirm-content">
        <div className="popconfirm-message">
          <span className="popconfirm-icon">?</span>
          <span className="popconfirm-title">{title}</span>
        </div>
        <div className="popconfirm-buttons">
          <button 
            className="popconfirm-btn popconfirm-cancel" 
            onClick={onCancel}
          >
            取消
          </button>
          <button 
            className="popconfirm-btn popconfirm-confirm" 
            onClick={onConfirm}
          >
            确定
          </button>
        </div>
      </div>
      <div className="popconfirm-arrow"></div>
    </div>
  );
};

export default PopConfirm; 