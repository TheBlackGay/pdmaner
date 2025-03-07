// 在页面加载完成后执行
window.addEventListener('load', () => {
    // 创建script标签
    const script = document.createElement('script');
    script.src = '/live2d-widget/autoload.js';
    // 添加到body末尾
    document.body.appendChild(script);
}); 