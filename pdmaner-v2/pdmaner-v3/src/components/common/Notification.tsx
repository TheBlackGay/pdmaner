import React, { useEffect, useState } from 'react';
import { CheckCircleOutlined, InfoCircleOutlined, CloseCircleOutlined, WarningOutlined } from '@ant-design/icons';
import './Notification.css';

export type NotificationType = 'success' | 'info' | 'error' | 'warning';

interface NotificationProps {
  type: NotificationType;
  message: string;
  duration?: number; // 持续时间，默认2秒
  onClose?: () => void;
}

const Notification: React.FC<NotificationProps> = ({ 
  type = 'info', 
  message, 
  duration = 2000, 
  onClose 
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };

  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleOutlined className="notification-icon success" />;
      case 'error':
        return <CloseCircleOutlined className="notification-icon error" />;
      case 'warning':
        return <WarningOutlined className="notification-icon warning" />;
      case 'info':
      default:
        return <InfoCircleOutlined className="notification-icon info" />;
    }
  };

  return (
    <div className={`notification-container ${type}`}>
      <div className="notification-content">
        {getIcon()}
        <span className="notification-message">{message}</span>
        <button className="notification-close" onClick={handleClose}>×</button>
      </div>
    </div>
  );
};

interface NotificationManagerProps {
  notifications: Array<{
    id: string;
    type: NotificationType;
    message: string;
  }>;
  removeNotification: (id: string) => void;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({ 
  notifications, 
  removeNotification 
}) => {
  return (
    <div className="notification-manager">
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          type={notification.type}
          message={notification.message}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

export default Notification; 