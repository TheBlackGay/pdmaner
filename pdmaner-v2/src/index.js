import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import thunkMiddleware from 'redux-thunk';
import { logger } from 'redux-logger';
import { Modal } from 'components';
import Welcome from './app/welcome';
import reducers from './reducers';
import './style/detault.less';
import { writeLog, showErrorLogFolder, platform } from './lib/middle';
//import { sendMessage } from './lib/electron-window-opt';

// 导入我们的优化模块 - 在顶部导入，确保它们被初始化
import './lib/PerformanceMonitor';
import errorHandler from './lib/ErrorHandler';
import './lib/NetworkStatusManager';
import './lib/FeatureManager';

const store = createStore(
  reducers,
  {},
  applyMiddleware(
    thunkMiddleware,
    logger,
    () => next => (action) => {
      // 发送上一次的数据
      //const preData = getState();
      next(action);
      //const nextData = getState();
      // 发送当前的数据
      //sendMessage(preData, nextData);
    },
  ),
);

class Container extends React.Component {
  componentDidCatch(error, info) {
    // 使用我们的错误处理器处理未捕获的错误
    errorHandler.handleError(error, { 
      isCritical: true, 
      info,
      component: 'Container' 
    });
    
    // 保留原有的日志写入功能
    writeLog(error).then((file) => {
      Modal.error({
        title: '出错了',
        message: (
          <span>
            程序出现异常，请前往日志文件查看出错日志：
            <a onClick={() => showErrorLogFolder(file)}>{file}</a>
          </span>
        ),
      });
    });
  }

  render() {
    return <Welcome store={store} />;
  }
}

function initComponent() {
  // 在加载完成后初始化
  window.addEventListener('load', () => {
    // 全局平台标识，方便功能管理
    window.__PLATFORM__ = platform; // 从middle.js中获取平台标识
  });
  
  // 全局错误处理
  window.addEventListener('error', (event) => {
    errorHandler.handleError(event.error || new Error(event.message), { 
      isCritical: true,
      source: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
    
    // 阻止默认处理，我们已经处理了这个错误
    event.preventDefault();
  });
  
  ReactDOM.render(
    <Provider store={store}>
      <Container />
    </Provider>,
    document.getElementById('app'),
  );
}

initComponent();
