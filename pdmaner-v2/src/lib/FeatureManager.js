import { Message } from '../components';
import networkManager from './NetworkStatusManager';
import { platform } from './middle';

/**
 * 功能管理器
 * 管理功能的可用性和降级体验
 */
class FeatureManager {
  constructor() {
    this.features = {};
    this.isOnline = networkManager.isOnline;
    
    // 监听网络状态变化
    this.removeNetworkListener = networkManager.addListener((status) => {
      this.isOnline = status === 'online';
      this.updateFeatureAvailability();
    });
  }
  
  registerFeature(featureId, options = {}) {
    this.features[featureId] = {
      id: featureId,
      name: options.name || featureId,
      offlineAvailable: options.offlineAvailable !== false,
      degradedExperience: options.degradedExperience || false,
      requireAuth: options.requireAuth || false,
      isAuthenticated: options.isAuthenticated || (() => true),
      priority: options.priority || 0, // 功能优先级，用于排序
      permissions: options.permissions || [], // 需要的权限
      hasPermissions: options.hasPermissions || (() => true),
      platforms: options.platforms || ['json', 'fetch'], // 支持的平台
    };
  }
  
  registerFeatures(featuresConfig) {
    Object.entries(featuresConfig).forEach(([id, config]) => {
      this.registerFeature(id, config);
    });
  }
  
  isFeatureAvailable(featureId) {
    const feature = this.features[featureId];
    if (!feature) return false;
    
    // 检查网络状态
    if (!this.isOnline && !feature.offlineAvailable) {
      return false;
    }
    
    // 检查认证状态
    if (feature.requireAuth && !feature.isAuthenticated()) {
      return false;
    }
    
    // 检查权限
    if (feature.permissions.length > 0 && !feature.hasPermissions()) {
      return false;
    }
    
    // 检查平台兼容性
    if (feature.platforms && 
        feature.platforms.length > 0 && 
        !feature.platforms.includes(platform)) {
      return false;
    }
    
    return true;
  }
  
  getFeatureStatus(featureId) {
    const feature = this.features[featureId];
    if (!feature) {
      return { available: false, reason: 'not_found' };
    }
    
    // 网络状态检查
    if (!this.isOnline) {
      if (!feature.offlineAvailable) {
        return { 
          available: false,
          reason: 'offline',
          message: '该功能需要网络连接'
        };
      }
      
      if (feature.degradedExperience) {
        return {
          available: true,
          degraded: true,
          reason: 'offline_degraded',
          message: '离线模式下该功能可能受限'
        };
      }
    }
    
    // 认证检查
    if (feature.requireAuth && !feature.isAuthenticated()) {
      return {
        available: false,
        reason: 'auth_required',
        message: '请先登录以使用此功能'
      };
    }
    
    // 权限检查
    if (feature.permissions.length > 0 && !feature.hasPermissions()) {
      return {
        available: false,
        reason: 'no_permission',
        message: '您没有使用此功能的权限'
      };
    }
    
    // 平台兼容性检查
    if (feature.platforms && 
        feature.platforms.length > 0 && 
        !feature.platforms.includes(platform)) {
      return {
        available: false,
        reason: 'platform_unsupported',
        message: '此功能在当前平台不可用'
      };
    }
    
    return { 
      available: true,
      degraded: false
    };
  }
  
  updateFeatureAvailability() {
    // 触发事件，通知UI组件更新
    const event = new CustomEvent('feature-availability-changed');
    document.dispatchEvent(event);
  }
  
  executeFeature(featureId, callback, options = {}) {
    const status = this.getFeatureStatus(featureId);
    
    if (!status.available) {
      if (options.showUnavailableMessage !== false) {
        Message.warring({title: status.message || '该功能当前不可用'});
      }
      return false;
    }
    
    if (status.degraded && options.warnOnDegraded !== false) {
      Message.warring({title: status.message});
    }
    
    try {
      return callback();
    } catch (error) {
      console.error(`Error executing feature ${featureId}:`, error);
      Message.error({title: '功能执行出错: ' + (error.message || '未知错误')});
      return false;
    }
  }
  
  // 清理资源
  destroy() {
    if (this.removeNetworkListener) {
      this.removeNetworkListener();
    }
  }
}

// 创建单例实例
const featureManager = new FeatureManager();

// 注册默认功能
featureManager.registerFeatures({
  'create_project': {
    name: '创建项目',
    offlineAvailable: true,
    priority: 100
  },
  'open_project': {
    name: '打开项目',
    offlineAvailable: true,
    priority: 90
  },
  'save_project': {
    name: '保存项目',
    offlineAvailable: true,
    priority: 80
  },
  'export_sql': {
    name: '导出SQL',
    offlineAvailable: true,
    priority: 70
  },
  'team_collaboration': {
    name: '团队协作',
    offlineAvailable: false, // 需要网络
    priority: 60
  },
  'cloud_sync': {
    name: '云同步',
    offlineAvailable: false,
    priority: 50
  },
  'live2d': {
    name: '看板娘',
    offlineAvailable: true,
    priority: 40,
    platforms: ['json', 'fetch'] // 两个平台都支持
  }
});

export default featureManager; 