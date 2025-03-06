import { Message, Modal } from '../components';
import { platform } from './middle';
import { writeLog } from './middle';

/**
 * 错误处理器
 * 提供统一的错误处理和用户反馈机制
 */
class ErrorHandler {
  constructor(options = {}) {
    this.showNotifications = options.showNotifications !== false;
    this.logErrors = options.logErrors !== false;
    this.reportErrors = options.reportErrors || false;
    this.errorReportURL = options.errorReportURL || '';
  }
  
  handleError(error, context = {}) {
    // 1. 记录错误
    if (this.logErrors) {
      this.logError(error, context);
    }
    
    // 2. 向用户展示友好的错误信息
    if (this.showNotifications) {
      this.showUserFriendlyError(error, context);
    }
    
    // 3. 可选的错误上报
    if (this.reportErrors) {
      this.reportError(error, context).catch(e => {
        console.error('Error reporting failed:', e);
      });
    }
    
    return {
      handled: true,
      recoverable: this.isRecoverable(error),
      message: this.getUserFriendlyMessage(error)
    };
  }
  
  logError(error, context) {
    console.error('Application error:', error, {
      context,
      timestamp: new Date().toISOString()
    });
    
    // 使用项目自带的日志机制
    if (platform === 'json') { // 桌面版
      writeLog({
        message: error.message,
        stack: error.stack,
        context: JSON.stringify(context),
        timestamp: new Date().toISOString()
      }).catch(e => {
        console.error('Failed to write error log:', e);
      });
    }
  }
  
  isRecoverable(error) {
    // 判断错误是否可恢复
    const nonRecoverableErrorCodes = [
      'EACCES', 'EPERM', 'ENOSPC', 
      'AUTH_FAILED', 'NETWORK_DISCONNECTED'
    ];
    
    if (error.code && nonRecoverableErrorCodes.includes(error.code)) {
      return false;
    }
    
    return true;
  }
  
  getUserFriendlyMessage(error) {
    // 转换技术错误信息为用户友好的消息
    const errorMap = {
      'EACCES': '权限不足，无法访问文件',
      'ENOENT': '文件不存在',
      'ENOSPC': '存储空间不足',
      'NETWORK_ERROR': '网络连接失败，请检查您的网络',
      'AUTH_FAILED': '授权失败，请重新登录',
      'DB_CONNECTION_ERROR': '数据库连接失败，请检查连接配置',
      'FILE_READ_ERROR': '文件读取失败，文件可能已损坏',
      'FILE_WRITE_ERROR': '文件写入失败，请检查磁盘空间和权限',
      'VALIDATION_ERROR': '数据验证失败，请检查输入数据',
      'VERSION_CONFLICT': '版本冲突，请刷新后重试',
      'SYNTAX_ERROR': '语法错误，请检查您的输入',
      'SQL_ERROR': 'SQL执行错误，请检查您的语句'
    };
    
    if (error.code && errorMap[error.code]) {
      return errorMap[error.code];
    }
    
    return error.userMessage || error.message || '操作过程中出现错误，请重试';
  }
  
  showUserFriendlyError(error, context) {
    const message = this.getUserFriendlyMessage(error);
    const isRecoverable = this.isRecoverable(error);
    
    if (context.isCritical || !isRecoverable) {
      // 严重错误用对话框显示
      Modal.error({
        title: '操作无法完成',
        message,
      });
    } else {
      // 一般错误用通知显示
      Message.error({title: message});
    }
  }
  
  async reportError(error, context) {
    try {
      // 如果是桌面版，可能需要使用不同的方法发送错误报告
      if (platform === 'json') {
        // 创建错误报告文件或发送到本地服务
        console.log('将错误报告保存到本地');
        // 使用writeLog保存到本地
        await writeLog({
          type: 'error_report',
          message: error.message,
          stack: error.stack,
          context: JSON.stringify(context),
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      // Web版发送到服务器
      const response = await fetch(this.errorReportURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          code: error.code,
          context,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          // 不包含个人身份信息
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error reporting failed with status ${response.status}`);
      }
      
    } catch (e) {
      console.error('Failed to report error:', e);
      // 静默失败，不影响用户体验
    }
  }
  
  // 创建特定类型的错误
  createError(message, code, additionalInfo = {}) {
    const error = new Error(message);
    error.code = code;
    Object.assign(error, additionalInfo);
    return error;
  }
}

// 创建单例实例
const errorHandler = new ErrorHandler({
  showNotifications: true,
  logErrors: true,
  reportErrors: false, // 默认不上报错误
});

export default errorHandler; 