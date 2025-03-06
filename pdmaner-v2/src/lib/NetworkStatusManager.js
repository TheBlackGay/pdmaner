import { Message } from '../components';

/**
 * 网络状态管理器
 * 监控网络连接状态并通知相关组件
 */
class NetworkStatusManager {
  constructor(options = {}) {
    this.isOnline = window.navigator.onLine;
    this.showNotifications = options.showNotifications !== false;
    this.listeners = [];
    
    this.setupListeners();
  }
  
  setupListeners() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }
  
  handleOnline = () => {
    this.isOnline = true;
    if (this.showNotifications) {
      Message.success({title: '网络已连接', time: 2});
    }
    this.notifyListeners('online');
  }
  
  handleOffline = () => {
    this.isOnline = false;
    if (this.showNotifications) {
      Message.warring({title: '网络已断开，部分功能可能受限', time: 3});
    }
    this.notifyListeners('offline');
  }
  
  addListener(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Listener must be a function');
    }
    
    this.listeners.push(listener);
    // 立即通知当前状态
    try {
      listener(this.isOnline ? 'online' : 'offline', this.isOnline);
    } catch (e) {
      console.error('Error in network status listener', e);
    }
    
    // 返回移除监听器的函数
    return () => {
      this.removeListener(listener);
    };
  }
  
  removeListener(listener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }
  
  notifyListeners(status) {
    this.listeners.forEach(listener => {
      try {
        listener(status, this.isOnline);
      } catch (e) {
        console.error('Error in network status listener', e);
      }
    });
  }
  
  // 清理资源方法，在组件卸载时调用
  destroy() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.listeners = [];
  }
}

// 创建单例实例
const networkManager = new NetworkStatusManager();
export default networkManager; 