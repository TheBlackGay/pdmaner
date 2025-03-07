import React, { useEffect, useState, useRef } from 'react';
import './style/index.less';
import { getPrefix } from '../../lib/prefixUtil';

// 看板娘配置 - 现在不直接使用这些配置，而是通过init-live2d.js初始化
const defaultConfig = {
  width: 200,         // 宽度
  height: 200,        // 高度
  right: 20,          // 右边距
  bottom: 20,         // 下边距
  zIndex: 9999,       // z-index
  mobileHide: true    // 在移动设备上隐藏
};

// 简化版组件 - 不再加载任何脚本，因为index.html中已经加载了simple-live2d.js
const Live2d = React.memo(({ prefix, config = {} }) => {
  // 这个组件现在不做任何事情，仅作为占位符
  return null;
});

export default Live2d; 