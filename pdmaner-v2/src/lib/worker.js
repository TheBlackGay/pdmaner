// 用来执行主线程传递过来的方法
import * as utils from './utils';
import * as dataSourceVersion from './datasource_version_util';

const json2string = (data, closeSpace) => {
    // 大量json数据转字符串 性能下降
    if(closeSpace) {
        return JSON.stringify(data);
    }
  return JSON.stringify(data, null,2);
}

const string2json = (data) => {
    return JSON.parse(data.replace(/^\uFEFF/, ''));
}

const allFuc = {
    dataSourceVersion,
    json2string,
    string2json,
    utils,
}

onmessage = (e) => {
    const { fuc, params, isExe } = e.data;
    if(isExe) {
        const getRealFuc = () => {
          return fuc.split('.')
              .reduce((p, n) => {
              return p[n];
          }, allFuc);
        }
        const result = getRealFuc()(...params);
        postMessage(result);
    } else {
        const result = eval(fuc)(params);
        postMessage(result);
    }
}
