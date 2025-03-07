// 本地离线版Live2D初始化脚本
(function() {
    // 本地资源路径
    const live2d_path = "./asset/live2d/";
    
    // 封装异步加载资源的方法
    function loadExternalResource(url, type) {
        return new Promise((resolve, reject) => {
            let tag;
            
            if (type === "css") {
                tag = document.createElement("link");
                tag.rel = "stylesheet";
                tag.href = url;
            }
            else if (type === "js") {
                tag = document.createElement("script");
                tag.src = url;
            }
            if (tag) {
                tag.onload = () => resolve(url);
                tag.onerror = () => reject(url);
                document.head.appendChild(tag);
            }
        });
    }
    
    // 创建看板娘DOM元素
    function createLive2DElement() {
        // 如果已经存在元素，则不重复创建
        if (document.getElementById("waifu")) {
            return;
        }
        
        // 创建看板娘切换开关
        const toggleElement = document.createElement("div");
        toggleElement.id = "waifu-toggle";
        toggleElement.innerHTML = '<span>看板娘</span>';
        document.body.appendChild(toggleElement);
        
        // 创建看板娘主体
        const waifu = document.createElement("div");
        waifu.id = "waifu";
        waifu.innerHTML = `
            <div id="waifu-tips"></div>
            <canvas id="live2d" width="300" height="300"></canvas>
            <div id="waifu-tool"></div>
        `;
        
        // 将看板娘添加到body
        document.body.appendChild(waifu);
        
        // 设置看板娘样式
        waifu.style.bottom = "0";
        
        return waifu;
    }
    
    // 主函数，加载并初始化看板娘
    function initLive2d() {
        // 只在桌面设备上显示
        if (screen.width >= 768) {
            // 先创建DOM元素
            createLive2DElement();
            
            // 加载资源
            Promise.all([
                loadExternalResource(live2d_path + "waifu.css", "css"),
                loadExternalResource(live2d_path + "live2d.min.js", "js"),
                loadExternalResource(live2d_path + "waifu-tips.js", "js")
            ]).then(() => {
                console.log("All Live2D resources loaded.");
                
                // 手动初始化看板娘 - live2d_widget是waifu-tips.js中定义的变量
                if (typeof window.live2d_widget === "function") {
                    // 直接调用factory函数
                    console.log("Using live2d_widget function...");
                    window.live2d_widget({
                        waifuPath: live2d_path + "waifu-tips.json",
                        apiPath: "",
                        cdnPath: live2d_path,
                        tools: ["hitokoto", "switch-model", "switch-texture", "photo", "info", "quit"]
                    });
                    console.log("Live2D initialized successfully using live2d_widget function.");
                } else {
                    console.error("live2d_widget function not found. Make sure waifu-tips.js is loaded correctly.");
                    console.log("Global window keys:", Object.keys(window).filter(key => key.includes('live2d')));
                }
            }).catch(error => {
                console.error("Failed to load Live2D resources:", error);
            });
        }
    }
    
    // 当页面加载完毕后初始化看板娘
    if (document.readyState === "complete") {
        console.log("Document ready state: complete, initializing Live2D now.");
        initLive2d();
    } else {
        console.log("Document not ready yet, waiting for window load event.");
        window.addEventListener("load", () => {
            console.log("Window loaded, initializing Live2D now.");
            setTimeout(initLive2d, 1000); // 延迟1秒初始化，确保所有资源都已加载
        });
    }
})(); 