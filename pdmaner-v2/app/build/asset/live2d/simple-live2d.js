/**
 * 简化版Live2D加载器 - 完全离线版本
 */
(function() {
    // 配置
    const config = {
        width: 200,         // 宽度
        height: 200,        // 高度
        right: 20,          // 右边距
        bottom: 20,         // 下边距
        zIndex: 9999,       // z-index
        mobileHide: true    // 在移动设备上隐藏
    };
    
    // 在移动设备上不显示
    if (config.mobileHide && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        return;
    }
    
    // 创建DOM元素
    function createElements() {
        // 主容器
        const container = document.createElement('div');
        container.id = 'simple-live2d-container';
        container.style.position = 'fixed';
        container.style.right = config.right + 'px';
        container.style.bottom = config.bottom + 'px';
        container.style.width = config.width + 'px';
        container.style.height = config.height + 'px';
        container.style.zIndex = config.zIndex;
        container.style.pointerEvents = 'none'; // 不阻挡点击事件
        
        // 提示框
        const tips = document.createElement('div');
        tips.id = 'simple-live2d-tips';
        tips.style.position = 'absolute';
        tips.style.top = '-60px';
        tips.style.left = '50%';
        tips.style.transform = 'translateX(-50%)';
        tips.style.padding = '10px 15px';
        tips.style.minWidth = '120px';
        tips.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        tips.style.borderRadius = '8px';
        tips.style.boxShadow = '0 3px 8px rgba(0, 0, 0, 0.2)';
        tips.style.fontSize = '14px';
        tips.style.textAlign = 'center';
        tips.style.zIndex = config.zIndex + 1;
        tips.style.pointerEvents = 'none';
        tips.style.opacity = '0';
        tips.style.transition = 'opacity 0.3s';
        
        // 箭头
        tips.innerHTML = '点击右键可以看到更多功能哦~';
        tips.innerHTML += '<div style="position:absolute;bottom:-8px;left:50%;margin-left:-8px;width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:8px solid rgba(255,255,255,0.9);"></div>';
        
        // 画布
        const canvas = document.createElement('canvas');
        canvas.id = 'simple-live2d-canvas';
        canvas.width = config.width;
        canvas.height = config.height;
        canvas.style.position = 'absolute';
        canvas.style.bottom = '0';
        canvas.style.right = '0';
        canvas.style.zIndex = config.zIndex;
        canvas.style.pointerEvents = 'auto'; // 允许点击
        
        // 添加到容器
        container.appendChild(tips);
        container.appendChild(canvas);
        document.body.appendChild(container);
        
        return {
            container,
            tips,
            canvas
        };
    }
    
    // 加载图像
    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }
    
    // 显示提示
    function showTips(text, duration = 3000) {
        const tips = document.getElementById('simple-live2d-tips');
        if (!tips) return;
        
        tips.innerHTML = text;
        tips.style.opacity = '1';
        
        setTimeout(() => {
            tips.style.opacity = '0';
        }, duration);
    }
    
    // 随机提示
    const randomTips = [
        '你好，我是你的助手小娜~',
        '需要帮忙设计数据库吗？',
        '点击右键可以看到更多功能哦',
        '记得保存你的工作~',
        '有什么问题都可以问我，虽然我可能不会回答',
        '小提示: 建表之前先设计好字段规范哦',
        '使用PDM设计工具让数据库设计更加规范',
        '今天也是元气满满的一天呢~'
    ];
    
    // 初始化
    async function init() {
        // 创建元素
        const elements = createElements();
        
        // 加载图像
        try {
            const image = await loadImage('./asset/live2d/models/shizuku/shizuku.png');
            const ctx = elements.canvas.getContext('2d');
            
            // 绘制图像
            ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
            ctx.drawImage(image, 0, 0, elements.canvas.width, elements.canvas.height);
            
            // 显示随机提示
            const randomIndex = Math.floor(Math.random() * randomTips.length);
            showTips(randomTips[randomIndex]);
            
            // 添加事件监听
            elements.canvas.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const randomIndex = Math.floor(Math.random() * randomTips.length);
                showTips(randomTips[randomIndex]);
            });
            
            // 右键菜单
            elements.canvas.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                showTips('右键菜单功能在简化版中暂不可用');
            });
            
            console.log('Simple Live2D loaded successfully!');
        } catch (error) {
            console.error('Failed to load live2d image:', error);
        }
    }
    
    // 页面加载完成后初始化
    if (document.readyState === 'complete') {
        init();
    } else {
        window.addEventListener('load', init);
    }
})(); 