import React, { useState, useEffect } from 'react';
import { Button } from '../../components';
import Icon from '../../components/icon';
import featureManager from '../../lib/FeatureManager';
import performanceMonitor from '../../lib/PerformanceMonitor';

/**
 * 功能控制高阶组件
 * 根据功能可用性自动处理组件状态
 */
export const withFeature = (WrappedComponent, featureId, options = {}) => {
  const WithFeatureComponent = (props) => {
    const [status, setStatus] = useState(featureManager.getFeatureStatus(featureId));
    
    useEffect(() => {
      const handleChange = () => {
        setStatus(featureManager.getFeatureStatus(featureId));
      };
      
      document.addEventListener('feature-availability-changed', handleChange);
      return () => {
        document.removeEventListener('feature-availability-changed', handleChange);
      };
    }, []);
    
    // 包装点击处理器，加入性能监控和功能检查
    const handleClick = async (e) => {
      if (!status.available) {
        // 功能不可用，显示提示
        return;
      }
      
      if (props.onClick) {
        // 使用性能监控跟踪操作
        await performanceMonitor.trackOperation(
          `feature-${featureId}`,
          async () => {
            // 执行原始点击处理器
            return props.onClick(e);
          },
          {
            message: options.loadingMessage || `正在执行${status.name || featureId}...`,
            showSuccessFeedback: options.showSuccessFeedback,
            successMessage: options.successMessage
          }
        );
      }
    };
    
    // 如果功能不可用，可以禁用组件或显示提示
    if (!status.available) {
      if (options.hideWhenUnavailable) {
        return null; // 完全隐藏
      }
      
      if (options.component === 'button') {
        return (
          <div className="pdm-tooltip" title={status.message || '此功能当前不可用'}>
            <Button 
              {...props} 
              disable={true}
              onClick={undefined}
            >
              {props.children}
            </Button>
          </div>
        );
      }
      
      return (
        <div className="pdm-tooltip" title={status.message || '此功能当前不可用'}>
          <div style={{ opacity: 0.5, cursor: 'not-allowed' }}>
            <WrappedComponent 
              {...props} 
              disable={true}
              onClick={undefined}
            />
          </div>
        </div>
      );
    }
    
    // 功能可用但降级体验
    if (status.degraded) {
      return (
        <div className="pdm-tooltip" title={status.message || '此功能在当前环境中可能受限'}>
          <div className="degraded-feature">
            <WrappedComponent {...props} onClick={handleClick} />
            <Icon type='fa-exclamation-triangle' style={{ marginLeft: 4, color: '#faad14' }} />
          </div>
        </div>
      );
    }
    
    // 正常渲染
    return <WrappedComponent {...props} onClick={handleClick} />;
  };
  
  WithFeatureComponent.displayName = `WithFeature(${getDisplayName(WrappedComponent)})`;
  return WithFeatureComponent;
};

// 用于获取组件显示名称
function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

// 简单的按钮版本
export const FeatureButton = (props) => {
  const { featureId, ...buttonProps } = props;
  const FeatureWrappedButton = withFeature(Button, featureId, { component: 'button' });
  return <FeatureWrappedButton {...buttonProps} />;
};

// 例子: <FeatureButton featureId="export_sql" type="primary">导出SQL</FeatureButton> 