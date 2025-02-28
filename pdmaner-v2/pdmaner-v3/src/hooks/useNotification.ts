import { useState, useCallback } from 'react';
import { NotificationType } from '../components/common/Notification';

type Notification = {
  id: string;
  type: NotificationType;
  message: string;
};

const useNotification = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((type: NotificationType, message: string) => {
    const id = Date.now().toString();
    
    setNotifications(prev => [
      ...prev,
      {
        id,
        type,
        message
      }
    ]);

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const success = useCallback((message: string) => {
    return showNotification('success', message);
  }, [showNotification]);

  const error = useCallback((message: string) => {
    return showNotification('error', message);
  }, [showNotification]);

  const warning = useCallback((message: string) => {
    return showNotification('warning', message);
  }, [showNotification]);

  const info = useCallback((message: string) => {
    return showNotification('info', message);
  }, [showNotification]);

  return {
    notifications,
    showNotification,
    removeNotification,
    success,
    error,
    warning,
    info
  };
};

export default useNotification; 