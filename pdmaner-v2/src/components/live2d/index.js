import React, { useEffect, useState, useRef } from 'react';
import './style/index.less';
import { getPrefix } from '../../lib/prefixUtil';

// 看板娘配置
const defaultConfig = {
  modelId: 1, // 默认模型ID
  modelTexturesId: 1, // 默认材质ID
  modelStorage: false, // 不储存模型信息
  canCloseLive2d: true, // 能否关闭看板娘
  canSwitchModel: true, // 能否切换模型
  canSwitchTextures: true, // 能否切换材质
  canTakeScreenshot: false, // 能否截图
  modelRandMode: 'switch', // 模型切换方式
  modelAPI: 'https://live2d.fghrsh.net/api/',
  tipsMessage: [
    '你好，我是你的助手小娜~',
    '需要帮忙设计数据库吗？',
    '点击右键可以看到更多功能哦',
    '记得保存你的工作~',
    '有什么问题都可以问我，虽然我可能不会回答',
    '小提示: 建表之前先设计好字段规范哦',
    '使用PDM设计工具让数据库设计更加规范',
    '今天也是元气满满的一天呢~'
  ]
};

// 加载脚本函数
function loadScript(url, callback) {
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = url;
  script.onload = callback;
  script.onerror = () => {
    console.error('Failed to load script:', url);
    // 如果加载失败，仍然调用回调以避免阻塞
    callback();
  };
  document.head.appendChild(script);
}

// 加载模型配置
function loadModel(config) {
  if (window.loadlive2d) {
    try {
      window.loadlive2d('live2d', `${config.modelAPI}get/?id=${config.modelId}-${config.modelTexturesId}`);
    } catch (e) {
      console.error('Failed to load Live2D model:', e);
    }
  }
}

const Live2d = React.memo(({ prefix, config = {} }) => {
  const currentPrefix = getPrefix(prefix);
  const [showTips, setShowTips] = useState(false);
  const [tipsText, setTipsText] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [currentConfig, setCurrentConfig] = useState({...defaultConfig, ...config});
  const containerRef = useRef(null);
  const tipTimerRef = useRef(null);
  const initedRef = useRef(false);
  
  // 显示提示
  const showMessage = (text, timeout = 3000) => {
    setTipsText(text);
    setShowTips(true);
    
    if (tipTimerRef.current) {
      clearTimeout(tipTimerRef.current);
    }
    
    tipTimerRef.current = setTimeout(() => {
      setShowTips(false);
    }, timeout);
  };
  
  // 切换模型
  const switchModel = async () => {
    const modelId = Math.floor(Math.random() * 6) + 1; // 1-6随机
    setCurrentConfig(prev => ({
      ...prev,
      modelId,
      modelTexturesId: 1,
    }));
    
    loadModel({
      ...currentConfig,
      modelId,
      modelTexturesId: 1,
    });
    
    showMessage(`模型已切换`);
  };
  
  // 切换材质
  const switchTextures = async () => {
    const modelTexturesId = Math.floor(Math.random() * 3) + 1; // 1-3随机
    setCurrentConfig(prev => ({
      ...prev,
      modelTexturesId,
    }));
    
    loadModel({
      ...currentConfig,
      modelTexturesId,
    });
    
    showMessage(`衣服已更换`);
  };
  
  // 显示随机提示
  const showRandomTips = () => {
    const tips = currentConfig.tipsMessage;
    const randomIndex = Math.floor(Math.random() * tips.length);
    showMessage(tips[randomIndex]);
  };
  
  // 处理右键菜单
  const handleContextMenu = (e) => {
    e.preventDefault();
    
    // 简单实现右键菜单
    const menuItems = [
      { text: '切换模型', action: switchModel, show: currentConfig.canSwitchModel },
      { text: '切换装扮', action: switchTextures, show: currentConfig.canSwitchTextures },
      { text: '随机提示', action: showRandomTips, show: true },
      { text: '隐藏看板娘', action: () => setIsVisible(false), show: currentConfig.canCloseLive2d },
    ].filter(item => item.show);

    // 创建一个简单的右键菜单
    const menuContainer = document.createElement('div');
    menuContainer.className = `${currentPrefix}-live2d-context-menu`;
    menuContainer.style.left = `${e.clientX}px`;
    menuContainer.style.top = `${e.clientY}px`;
    
    // 添加菜单项
    menuItems.forEach(item => {
      const menuItem = document.createElement('div');
      menuItem.innerText = item.text;
      menuItem.addEventListener('click', () => {
        item.action();
        document.body.removeChild(menuContainer);
      });
      menuContainer.appendChild(menuItem);
    });
    
    // 添加到body
    document.body.appendChild(menuContainer);
    
    // 点击其他地方关闭菜单
    const closeMenu = () => {
      if (document.body.contains(menuContainer)) {
        document.body.removeChild(menuContainer);
      }
      document.removeEventListener('click', closeMenu);
    };
    
    setTimeout(() => {
      document.addEventListener('click', closeMenu);
    }, 100);
  };
  
  useEffect(() => {
    console.log('Live2D component mounted');
    // 只初始化一次
    if (!initedRef.current) {
      // 加载看板娘所需的脚本
      console.log('Loading Live2D script...');
      loadScript('https://cdn.jsdelivr.net/gh/stevenjoezhang/live2d-widget@latest/live2d.min.js', () => {
        console.log('Live2D script loaded, now loading model...');
        loadModel(currentConfig);
        showRandomTips();
        initedRef.current = true;
      });
    }
    
    return () => {
      // 清理资源
      if (tipTimerRef.current) {
        clearTimeout(tipTimerRef.current);
      }
    };
  }, []);
  
  // 当配置更改时重新加载模型
  useEffect(() => {
    if (initedRef.current) {
      loadModel(currentConfig);
    }
  }, [currentConfig.modelId, currentConfig.modelTexturesId]);
  
  // 如果隐藏，提供一个按钮用于重新显示
  if (!isVisible) {
    return (
      <div 
        className={`${currentPrefix}-live2d-show-button`}
        onClick={() => setIsVisible(true)}
      >
        显示看板娘
      </div>
    );
  }
  
  return (
    <div 
      ref={containerRef}
      className={`${currentPrefix}-live2d-container`} 
      onContextMenu={handleContextMenu}
      onClick={showRandomTips}
    >
      <canvas 
        id="live2d" 
        width="280" 
        height="250" 
        className={`${currentPrefix}-live2d-canvas`}
      ></canvas>
      
      {showTips && (
        <div className={`${currentPrefix}-live2d-tips`}>
          {tipsText}
        </div>
      )}
    </div>
  );
});

export default Live2d; 