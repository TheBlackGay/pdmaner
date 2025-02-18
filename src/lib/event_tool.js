import * as Component from 'components';
import { addBodyEvent, removeBodyEvent } from './listener';
import Worker from './worker';

// 复制方法
export const Copy = (data, successMessage) => {
  const value = typeof data !== 'string' ? JSON.stringify(data) : data;
  const id = Math.uuid();
  addBodyEvent('oncopy', id, (e) => {
    e.clipboardData.setData('text', value);
    e.preventDefault();
    removeBodyEvent('oncopy', id);
  });
  if (document.execCommand('copy')) {
    Component.Message.success({title: successMessage});
  }
};

// 粘贴方法
export const Paste = (cb) => {
  const id = Math.uuid();
  addBodyEvent('onpaste', id, (e) => {
    cb && cb(e.clipboardData.getData('text'));
    e.preventDefault();
    removeBodyEvent('onpaste', id);
  });
  document.execCommand('paste');
};

// 全局保存方法ctrl+s
export const Save = (cb) => {
  window.onkeydown = (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.keyCode === 83)) {
      e.target.blur();
      cb && cb();
    }
  };
};

export const removeSave = () => {
  window.onkeydown = null;
}


export const antiShake = (fuc, time = 300) => {
  let timer = null;
  return (...args) => {
    if(timer) {
      clearTimeout(timer);
      timer = null;
    }
    timer = setTimeout(() => {
      fuc(...args);
    }, time)
  }
}

const workerFuc = (params) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker();
    worker.postMessage(params);
    worker.onmessage = ({data}) => {
      resolve(data);
      worker.terminate();
    };
    worker.onerror = (err) => {
      reject(err)
      worker.terminate();
    };
  });
}

export const postWorkerFuc = (fuc, isExe = false, params = {}) => {
  return workerFuc({
    fuc: isExe ? fuc : `(${fuc.toString()})`,
    params,
    isExe
  })
}

