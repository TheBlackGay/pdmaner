// 用来执行主线程传递过来的方法
import * as utils from './utils';
import * as dataSourceVersion from './datasource_version_util';

const json2string = (data, closeSpace) => {
    // 大量json数据转字符串 性能下降
    if(closeSpace) {
        return JSON.stringify(data);
    }
  return JSON.stringify(data, null, 2);
};

const string2json = (data) => {
    return JSON.parse(data.replace(/^\uFEFF/, ''));
};

const allFuc = {
    dataSourceVersion,
    json2string,
    string2json,
    utils,
};

// 安全的函数映射表
const safeMethodMap = {
    json2string,
    string2json,
    // 可以根据需要添加更多安全的函数
};

onmessage = (e) => {
    const { fuc, params, isExe } = e.data;
    if(isExe) {
        const getRealFuc = () => {
          return fuc.split('.')
              .reduce((p, n) => {
              return p[n];
          }, allFuc);
        };
        const result = getRealFuc()(...params);
        postMessage(result);
    } else {
        // 不再使用eval或Function构造函数
        // 而是使用预定义的安全函数映射
        const method = safeMethodMap[fuc];
        if (method && typeof method === 'function') {
            const result = method(params);
            postMessage(result);
        } else {
            // 如果函数不在安全映射表中，返回错误
            postMessage({
                error: `Function "${fuc}" is not available for security reasons.`,
            });
        }
    }
};
