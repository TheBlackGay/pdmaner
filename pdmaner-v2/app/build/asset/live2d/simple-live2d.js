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
        mobileHide: true,   // 在移动设备上隐藏
        debug: true         // 调试模式
    };
    
    // 调试日志
    function log(...args) {
        if (config.debug) {
            console.log('[Simple-Live2D]', ...args);
        }
    }
    
    // 调试错误
    function error(...args) {
        if (config.debug) {
            console.error('[Simple-Live2D]', ...args);
        }
    }
    
    // 在移动设备上不显示
    if (config.mobileHide && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        return;
    }
    
    // 创建DOM元素
    function createElements() {
        log('Creating DOM elements');
        
        // 主容器
        const container = document.createElement('div');
        container.id = 'simple-live2d-container';
        container.style.position = 'fixed';
        container.style.right = config.right + 'px';
        container.style.bottom = config.bottom + 'px';
        container.style.width = config.width + 'px';
        container.style.height = config.height + 'px';
        container.style.zIndex = config.zIndex;
        
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
        canvas.style.cursor = 'pointer';
        
        // 添加到容器
        container.appendChild(tips);
        container.appendChild(canvas);
        document.body.appendChild(container);
        
        log('DOM elements created');
        
        return {
            container,
            tips,
            canvas
        };
    }
    
    // 直接绘制一个彩色图标作为备用
    function createFallbackImage() {
        log('Creating fallback image');
        
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        
        // 渐变背景
        const gradient = ctx.createLinearGradient(0, 0, 200, 200);
        gradient.addColorStop(0, '#fa0');
        gradient.addColorStop(1, '#f60');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 200, 200);
        
        // 添加文字
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('PDManer', 100, 100);
        ctx.font = '16px Arial';
        ctx.fillText('看板娘', 100, 130);
        
        // 转换为图像
        const img = new Image();
        img.src = canvas.toDataURL();
        
        return img;
    }
    
    // 显示提示
    function showTips(text, duration = 3000) {
        log('Showing tip:', text);
        
        const tips = document.getElementById('simple-live2d-tips');
        if (!tips) {
            error('Tips element not found');
            return;
        }
        
        // 移除现有的箭头
        let tipsText = text;
        tipsText += '<div style="position:absolute;bottom:-8px;left:50%;margin-left:-8px;width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:8px solid rgba(255,255,255,0.9);"></div>';
        
        tips.innerHTML = tipsText;
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
    
    // 加载应用图标
    function loadAppIcon() {
        return new Promise((resolve, reject) => {
            log('Loading app icon as fallback');
            
            const img = new Image();
            img.onload = () => {
                log('App icon loaded successfully');
                resolve(img);
            };
            img.onerror = (e) => {
                error('Failed to load app icon', e);
                reject(e);
            };
            img.src = './256x256.png';
        });
    }
    
    // 加载看板娘图像
    function loadLive2DImage() {
        return new Promise((resolve, reject) => {
            log('Trying to load Live2D image');
            
            const img = new Image();
            img.onload = () => {
                log('Live2D image loaded successfully');
                resolve(img);
            };
            img.onerror = (e) => {
                error('Failed to load Live2D image', e);
                reject(e);
            };
            img.src = './asset/live2d/models/shizuku/shizuku.png';
        });
    }
    
    // 添加一些动画效果
    function addAnimation(canvas, img) {
        log('Adding animation to canvas');
        
        const ctx = canvas.getContext('2d');
        let angle = 0;
        let scale = 1;
        let direction = 1;
        
        function animate() {
            // 缓慢呼吸效果
            scale += 0.0003 * direction;
            if (scale > 1.03) direction = -1;
            if (scale < 0.97) direction = 1;
            
            // 轻微晃动效果
            angle = Math.sin(Date.now() / 1000) * 0.05;
            
            // 清除画布
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // 保存状态
            ctx.save();
            
            // 设置变换中心
            ctx.translate(canvas.width / 2, canvas.height / 2);
            
            // 应用旋转和缩放
            ctx.rotate(angle);
            ctx.scale(scale, scale);
            
            // 计算调整后的尺寸以适应画布
            const maxWidth = canvas.width * 0.9;
            const maxHeight = canvas.height * 0.9;
            
            const imgRatio = img.width / img.height;
            let drawWidth, drawHeight;
            
            if (img.width > img.height) {
                drawWidth = Math.min(img.width, maxWidth);
                drawHeight = drawWidth / imgRatio;
            } else {
                drawHeight = Math.min(img.height, maxHeight);
                drawWidth = drawHeight * imgRatio;
            }
            
            // 绘制图像
            ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
            
            // 恢复状态
            ctx.restore();
            
            // 继续动画
            requestAnimationFrame(animate);
        }
        
        animate();
    }
    
    // 创建右键菜单
    function createContextMenu(x, y) {
        log('Creating context menu at', x, y);
        
        // 移除现有菜单
        const existingMenu = document.getElementById('simple-live2d-menu');
        if (existingMenu) {
            document.body.removeChild(existingMenu);
            log('Removed existing menu');
        }
        
        // 创建菜单
        const menu = document.createElement('div');
        menu.id = 'simple-live2d-menu';
        menu.style.position = 'fixed';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.style.backgroundColor = 'white';
        menu.style.border = '1px solid #ccc';
        menu.style.borderRadius = '4px';
        menu.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        menu.style.padding = '5px 0';
        menu.style.zIndex = config.zIndex + 2;
        
        // 菜单项
        const menuItems = [
            { text: '切换模型', action: () => showTips('这是简化版，无法切换模型') },
            { text: '拍照', action: () => showTips('茄子～拍好了！') },
            { text: '关于', action: () => showTips('我是PDManer的看板娘，由简化版Live2D提供支持') },
            { text: '隐藏', action: () => {
                const container = document.getElementById('simple-live2d-container');
                if (container) {
                    container.style.display = 'none';
                    log('Hiding Live2D container');
                    
                    // 创建一个显示按钮
                    const showButton = document.createElement('div');
                    showButton.id = 'simple-live2d-show-button';
                    showButton.textContent = '显示看板娘';
                    showButton.style.position = 'fixed';
                    showButton.style.right = '20px';
                    showButton.style.bottom = '20px';
                    showButton.style.backgroundColor = '#fa0';
                    showButton.style.color = 'white';
                    showButton.style.padding = '5px 10px';
                    showButton.style.borderRadius = '4px';
                    showButton.style.cursor = 'pointer';
                    showButton.style.zIndex = config.zIndex;
                    
                    showButton.addEventListener('click', () => {
                        container.style.display = 'block';
                        document.body.removeChild(showButton);
                        log('Showing Live2D container');
                    });
                    
                    document.body.appendChild(showButton);
                    log('Added show button');
                }
            }}
        ];
        
        // 添加菜单项
        menuItems.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.textContent = item.text;
            menuItem.style.padding = '8px 12px';
            menuItem.style.cursor = 'pointer';
            menuItem.style.fontSize = '14px';
            
            menuItem.addEventListener('mouseover', () => {
                menuItem.style.backgroundColor = '#f0f0f0';
            });
            
            menuItem.addEventListener('mouseout', () => {
                menuItem.style.backgroundColor = 'transparent';
            });
            
            menuItem.addEventListener('click', (e) => {
                e.stopPropagation();
                item.action();
                document.body.removeChild(menu);
                log('Menu item clicked:', item.text);
            });
            
            menu.appendChild(menuItem);
        });
        
        // 添加到文档
        document.body.appendChild(menu);
        log('Context menu created with', menuItems.length, 'items');
        
        // 点击其他地方关闭菜单
        function closeMenu(e) {
            if (menu && !menu.contains(e.target)) {
                try {
                    document.body.removeChild(menu);
                    document.removeEventListener('click', closeMenu);
                    log('Context menu closed by outside click');
                } catch (err) {
                    error('Error closing menu:', err);
                }
            }
        }
        
        // 延迟一下添加事件监听器，避免立即触发
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 100);
        
        return menu;
    }
    
    // 初始化
    async function init() {
        log('Initializing Simple Live2D');
        
        // 创建元素
        const elements = createElements();
        let image;
        
        try {
            // 首先尝试加载看板娘图像
            try {
                image = await loadLive2DImage();
                log('Successfully loaded Live2D image');
            } catch (err) {
                log('Failed to load Live2D image, trying app icon');
                try {
                    image = await loadAppIcon();
                    log('Successfully loaded app icon');
                } catch (appIconErr) {
                    log('Failed to load app icon, using fallback');
                    image = createFallbackImage();
                }
            }
            
            // 获取画布上下文
            const canvas = elements.canvas;
            const ctx = canvas.getContext('2d');
            
            // 初始绘制图像
            log('Drawing initial image');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // 计算调整后的尺寸以适应画布
            const maxWidth = canvas.width * 0.9;
            const maxHeight = canvas.height * 0.9;
            
            const imgRatio = image.width / image.height;
            let drawWidth, drawHeight;
            
            if (image.width > image.height) {
                drawWidth = Math.min(image.width, maxWidth);
                drawHeight = drawWidth / imgRatio;
            } else {
                drawHeight = Math.min(image.height, maxHeight);
                drawWidth = drawHeight * imgRatio;
            }
            
            // 居中绘制图像
            const x = (canvas.width - drawWidth) / 2;
            const y = (canvas.height - drawHeight) / 2;
            
            ctx.drawImage(image, x, y, drawWidth, drawHeight);
            
            // 添加动画
            addAnimation(canvas, image);
            
            // 显示随机提示
            const randomIndex = Math.floor(Math.random() * randomTips.length);
            showTips(randomTips[randomIndex]);
            
            // 添加事件监听
            canvas.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const randomIndex = Math.floor(Math.random() * randomTips.length);
                showTips(randomTips[randomIndex]);
                log('Canvas clicked, showing random tip');
            });
            
            // 右键菜单 - 这里着重修复
            canvas.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                log('Context menu requested at', e.clientX, e.clientY);
                const menu = createContextMenu(e.clientX, e.clientY);
                
                // 确保菜单在视口内
                const rect = menu.getBoundingClientRect();
                if (rect.right > window.innerWidth) {
                    menu.style.left = (window.innerWidth - rect.width - 5) + 'px';
                }
                if (rect.bottom > window.innerHeight) {
                    menu.style.top = (window.innerHeight - rect.height - 5) + 'px';
                }
            });
            
            log('Simple Live2D initialized successfully');
        } catch (error) {
            error('Failed to initialize Simple Live2D:', error);
            
            try {
                // 失败时显示备用内容
                const ctx = elements.canvas.getContext('2d');
                
                // 清除画布
                ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
                
                // 渐变背景
                const gradient = ctx.createLinearGradient(0, 0, elements.canvas.width, elements.canvas.height);
                gradient.addColorStop(0, '#fa0');
                gradient.addColorStop(1, '#f60');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, elements.canvas.width, elements.canvas.height);
                
                // 添加文字
                ctx.font = 'bold 24px Arial';
                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';
                ctx.fillText('PDManer', elements.canvas.width/2, elements.canvas.height/2);
                ctx.font = '16px Arial';
                ctx.fillText('看板娘', elements.canvas.width/2, elements.canvas.height/2 + 30);
                
                showTips('图像加载失败，但我还在！');
                log('Fallback content displayed');
            } catch (renderError) {
                error('Even fallback rendering failed:', renderError);
            }
        }
    }
    
    // 页面加载完成后初始化
    if (document.readyState === 'complete') {
        log('Document already complete, initializing immediately');
        init();
    } else {
        log('Document not ready, waiting for load event');
        window.addEventListener('load', () => {
            log('Document loaded, initializing now');
            init();
        });
    }
})(); 