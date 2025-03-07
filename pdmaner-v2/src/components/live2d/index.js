import React, { useEffect, useState, useRef } from 'react';
import './style/index.less';
import { getPrefix } from '../../lib/prefixUtil';

// 看板娘配置 - 现在不直接使用这些配置，而是通过init-live2d.js初始化
const defaultConfig = {
  // 配置已移至init-live2d.js
};

// 简化版组件 - 只负责注入脚本，实际功能由完整的Live2D库提供
const Live2d = React.memo(({ prefix, config = {} }) => {
  const currentPrefix = getPrefix(prefix);
  const initedRef = useRef(false);

  useEffect(() => {
    // 只初始化一次
    if (!initedRef.current) {
      // 加载完整版Live2D初始化脚本
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = './asset/live2d/init-live2d.js';
      script.onload = () => {
        console.log('Live2D initialization script loaded');
        initedRef.current = true;
      };
      script.onerror = () => {
        console.error('Failed to load Live2D initialization script');
      };
      document.head.appendChild(script);
    }
    
    return () => {
      // 清理资源 - Live2D元素在页面存在期间保持显示
    };
  }, []);
  
  return null; // 不渲染任何内容，Live2D元素由脚本创建
});

export default Live2d; 