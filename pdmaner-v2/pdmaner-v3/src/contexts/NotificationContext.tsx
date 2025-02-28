import React, { createContext, useContext, ReactNode } from 'react';
import useNotification from '../hooks/useNotification';
import { NotificationManager } from '../components/common/Notification';

// 创建上下文
type NotificationContextType = ReturnType<typeof useNotification>;

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const notificationUtils = useNotification();
  
  return (
    <NotificationContext.Provider value={notificationUtils}>
      {children}
      <NotificationManager
        notifications={notificationUtils.notifications}
        removeNotification={notificationUtils.removeNotification}
      />
    </NotificationContext.Provider>
  );
};

// 自定义Hook，方便在组件中使用通知函数
export const useNotificationContext = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}; 