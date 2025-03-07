// 显示消息
function showMessage(text, timeout, priority) {
    if (!text || (sessionStorage.getItem("waifu-text") && sessionStorage.getItem("waifu-text") > priority)) return;
    if (messageTimer) {
        clearTimeout(messageTimer);
        messageTimer = null;
    }
    text = randomSelection(text);
    sessionStorage.setItem("waifu-text", priority);
    const tips = document.getElementById("waifu-tips");
    tips.innerHTML = text;
    tips.classList.add("waifu-tips-active");
    messageTimer = setTimeout(() => {
        sessionStorage.removeItem("waifu-text");
        tips.classList.remove("waifu-tips-active");
    }, timeout);
}

// 随机选择一个元素
function randomSelection(obj) {
    return Array.isArray(obj) ? obj[Math.floor(Math.random() * obj.length)] : obj;
}

// 工具栏的显示与隐藏
let messageTimer = null;

// 配置看板娘
window.initWidget = function(config) {
    document.body.insertAdjacentHTML("beforeend", `
        <div id="waifu">
            <div id="waifu-tips"></div>
            <canvas id="live2d" width="800" height="800"></canvas>
            <div id="waifu-tool">
                <span class="fa fa-lg fa-comment"></span>
                <span class="fa fa-lg fa-user-circle"></span>
                <span class="fa fa-lg fa-camera"></span>
                <span class="fa fa-lg fa-info-circle"></span>
                <span class="fa fa-lg fa-times"></span>
            </div>
        </div>
    `);

    // 确保看板娘在右侧显示
    const waifu = document.getElementById("waifu");
    waifu.style.right = "0";
    waifu.style.left = "auto";
    
    setTimeout(() => {
        waifu.style.bottom = "0";
    }, 0);

    // 添加工具栏事件监听
    const waifuTool = document.getElementById("waifu-tool");
    waifu.addEventListener("mouseover", () => {
        waifuTool.style.opacity = 1;
    });
    waifu.addEventListener("mouseleave", () => {
        waifuTool.style.opacity = 0;
    });

    // 加载看板娘配置
    fetch(config.waifuPath)
        .then(response => response.json())
        .then(result => {
            window.addEventListener("mousemove", () => sessionStorage.setItem("waifu-text", ""));
            window.addEventListener("keydown", () => sessionStorage.setItem("waifu-text", ""));
            result.mouseover.forEach(tips => {
                window.addEventListener("mouseover", event => {
                    if (!event.target.matches(tips.selector)) return;
                    let text = tips.text;
                    if (Array.isArray(text)) text = text[Math.floor(Math.random() * text.length)];
                    text = text.replace("{text}", event.target.innerText);
                    showMessage(text, 4000, 8);
                });
            });

            result.click.forEach(tips => {
                window.addEventListener("click", event => {
                    if (!event.target.matches(tips.selector)) return;
                    let text = tips.text;
                    if (Array.isArray(text)) text = text[Math.floor(Math.random() * text.length)];
                    text = text.replace("{text}", event.target.innerText);
                    showMessage(text, 4000, 8);
                });
            });

            const tools = document.querySelectorAll("#waifu-tool span");
            tools[0].addEventListener("click", () => {
                showMessage(randomSelection(result.click.find(tips => tips.selector === "#waifu-tool .fa-comment").text), 6000, 9);
            });
            tools[1].addEventListener("click", () => {
                showMessage(randomSelection(result.click.find(tips => tips.selector === "#waifu-tool .fa-user-circle").text), 6000, 9);
            });
            tools[2].addEventListener("click", () => {
                showMessage(randomSelection(result.click.find(tips => tips.selector === "#waifu-tool .fa-camera").text), 6000, 9);
            });
            tools[3].addEventListener("click", () => {
                showMessage(randomSelection(result.click.find(tips => tips.selector === "#waifu-tool .fa-info-circle").text), 6000, 9);
            });
            tools[4].addEventListener("click", () => {
                showMessage(randomSelection(result.click.find(tips => tips.selector === "#waifu-tool .fa-times").text), 2000, 11);
                waifu.style.bottom = "-500px";
                setTimeout(() => {
                    waifu.style.display = "none";
                    document.getElementById("waifu-toggle").classList.add("waifu-toggle-active");
                }, 3000);
            });
        });
};

// 初始化看板娘
window.addEventListener("DOMContentLoaded", () => {
    initWidget({
        waifuPath: "live2d-widget/waifu-tips.json",
        apiPath: "https://live2d.fghrsh.net/api/",
        tools: ["hitokoto", "switch-model", "photo", "info", "quit"]
    });
}); 