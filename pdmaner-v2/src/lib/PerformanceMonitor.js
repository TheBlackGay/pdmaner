import React from 'react';
import ReactDOM from 'react-dom';
import { Loading, Message } from '../components';

/**
 * 性能监控和加载状态管理器
 * 用于跟踪操作执行时间并显示统一的加载状态
 */
class PerformanceMonitor {
  constructor() {
    this.operations = new Map();
    this.thresholds = {
      slow: 1000, // 1秒以上为慢操作
      veryShow: 3000 // 3秒以上为非常慢操作
    };
    
    // 创建一个容器用于显示加载状态
    this.createLoaderContainer();
  }
  
  createLoaderContainer() {
    // 检查容器是否已存在
    if (document.getElementById('pdmaner-loader-container')) {
      return;
    }
    
    // 创建加载状态容器
    const container = document.createElement('div');
    container.id = 'pdmaner-loader-container';
    container.style.position = 'fixed';
    container.style.top = '50%';
    container.style.left = '50%';
    container.style.transform = 'translate(-50%, -50%)';
    container.style.zIndex = '9999';
    container.style.display = 'none';
    
    document.body.appendChild(container);
  }
  
  startOperation(operationId, options = {}) {
    // 如果操作已存在，先结束之前的
    if (this.operations.has(operationId)) {
      this.endOperation(operationId);
    }
    
    const operation = {
      id: operationId,
      startTime: performance.now(),
      showLoaderAfter: options.showLoaderAfter || 300, // 默认300ms后显示加载状态
      loaderShown: false,
      timeoutId: null,
      message: options.message || '正在处理...'
    };
    
    // 设置定时器在阈值后显示加载状态
    operation.timeoutId = setTimeout(() => {
      operation.loaderShown = true;
      this.showLoader(operationId, operation.message);
    }, operation.showLoaderAfter);
    
    this.operations.set(operationId, operation);
    return operationId;
  }
  
  endOperation(operationId) {
    const operation = this.operations.get(operationId);
    if (!operation) return 0;
    
    // 清除加载定时器
    clearTimeout(operation.timeoutId);
    
    // 如果加载状态已显示，则隐藏
    if (operation.loaderShown) {
      this.hideLoader();
    }
    
    // 计算操作耗时
    const duration = performance.now() - operation.startTime;
    
    // 记录慢操作
    if (duration > this.thresholds.slow) {
      console.warn(`慢操作检测: ${operationId} 花费了 ${duration.toFixed(2)}ms`);
      // 可以将慢操作记录到分析系统
    }
    
    this.operations.delete(operationId);
    return duration;
  }
  
  showLoader(operationId, messageText) {
    const container = document.getElementById('pdmaner-loader-container');
    if (!container) return;
    
    container.style.display = 'block';
    
    // 使用ReactDOM渲染加载组件
    ReactDOM.render(
      <Loading visible={true} title={messageText} />,
      container
    );
  }
  
  hideLoader() {
    const container = document.getElementById('pdmaner-loader-container');
    if (!container) return;
    
    container.style.display = 'none';
    ReactDOM.unmountComponentAtNode(container);
  }
  
  // 包装一个异步操作，自动处理加载状态
  async trackOperation(operationId, asyncFn, options = {}) {
    this.startOperation(operationId, options);
    
    try {
      const result = await asyncFn();
      const duration = this.endOperation(operationId);
      
      // 对于很快完成的操作，可以显示成功反馈
      if (options.showSuccessFeedback) {
        this.showSuccessFeedback(options.successMessage || '操作成功');
      }
      
      return result;
    } catch (error) {
      this.endOperation(operationId);
      
      // 显示错误消息
      if (options.showErrorFeedback !== false) {
        this.showErrorFeedback(error, options.errorMessage);
      }
      
      throw error;
    }
  }
  
  showSuccessFeedback(messageText = '操作成功') {
    Message.success({title: messageText});
  }
  
  showErrorFeedback(error, customMessage) {
    const errorMessage = customMessage || error.message || '操作失败';
    Message.error({title: errorMessage});
  }
}

// 创建单例实例
const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor; 