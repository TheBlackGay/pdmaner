import React, { useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Live2d from './index';
import { getPrefix } from '../../lib/prefixUtil';

/**
 * Live2D包装器组件
 * 创建一个独立的DOM容器，将Live2D渲染到其中，
 * 确保其不会干扰现有布局
 */
const LiveWrapper = ({ prefix, config = {} }) => {
  const currentPrefix = getPrefix(prefix);
  const containerRef = useRef(null);
  
  useEffect(() => {
    // 创建一个新的div作为看板娘的容器
    const container = document.createElement('div');
    container.className = `${currentPrefix}-live2d-wrapper`;
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '0';
    container.style.height = '0';
    container.style.zIndex = '9999';
    container.style.pointerEvents = 'none'; // 让容器不阻挡点击
    
    // 将容器添加到body
    document.body.appendChild(container);
    containerRef.current = container;
    
    // 在容器中渲染Live2D组件
    ReactDOM.render(
      <Live2d prefix={prefix} config={config} />,
      container
    );
    
    // 组件卸载时清理
    return () => {
      if (containerRef.current) {
        ReactDOM.unmountComponentAtNode(containerRef.current);
        document.body.removeChild(containerRef.current);
      }
    };
  }, []); // 只在组件挂载时执行一次
  
  // 这个组件不渲染任何内容到它自己的位置
  return null;
};

export default LiveWrapper; 