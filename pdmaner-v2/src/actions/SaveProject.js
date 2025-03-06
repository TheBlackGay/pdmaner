import React from 'react';
import { Button } from '../components';
import { withFeature } from '../components/hoc/withFeature';
import performanceMonitor from '../lib/PerformanceMonitor';
import errorHandler from '../lib/ErrorHandler';
import { saveJsonPromise } from '../lib/middle';

/**
 * 保存项目按钮组件
 * 使用优化后的错误处理和加载状态
 */
const SaveProjectButton = (props) => {
  const { project, onSuccess, ...buttonProps } = props;
  
  const handleSave = async () => {
    try {
      // 执行保存操作
      await performanceMonitor.trackOperation(
        'save-project',
        async () => {
          if (!project || !project.path) {
            throw errorHandler.createError('项目路径无效', 'INVALID_PATH', { userMessage: '请先选择保存位置' });
          }
          
          // 使用项目中的保存方法
          await saveJsonPromise(project.path, JSON.stringify(project.data, null, 2));
          
          // 如果有成功回调，执行它
          if (onSuccess) {
            onSuccess();
          }
        },
        {
          message: '正在保存项目...',
          showSuccessFeedback: true,
          successMessage: '项目已成功保存',
          showErrorFeedback: true
        }
      );
      
      return true;
    } catch (error) {
      // 错误已经由performanceMonitor处理
      return false;
    }
  };
  
  return (
    <Button 
      {...buttonProps} 
      onClick={handleSave}
    >
      {props.children || '保存项目'}
    </Button>
  );
};

// 使用功能管理高阶组件包装
export default withFeature(SaveProjectButton, 'save_project', {
  loadingMessage: '正在保存项目...',
  showSuccessFeedback: true,
  successMessage: '项目已成功保存'
});

// 使用方式: <SaveProjectButton project={currentProject} onSuccess={() => setUnsavedChanges(false)} /> 