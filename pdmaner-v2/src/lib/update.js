// 导入模块
import http from 'http';
import osModule from 'os';
// eslint-disable-next-line import/named, no-unused-vars
import { platform } from './middle';
// eslint-disable-next-line import/extensions
import packageData from '../../package.json';

const os = osModule;

const defaultUrl = `http://www.pdman.cn/launch/${os.platform()}/${packageData.version}`;
//const defaultUrl = 'http://127.0.0.1/update.json';

export const compareVersion = (v1 = '', v2) => {
  // 版本规范为 => x.x.x 主版本号.次版本号.小版本号
  const formatArrayStr = (data) => {
    return data.map((v) => {
      const number = parseInt(v.replace(/\D/g, ''), 10);
      return Number.isNaN(number) ? 0 : number;
    });
  };
  const newVersions = formatArrayStr(v1.split('.'));
  const oldVersions = formatArrayStr(v2 || packageData.version.split('.'));
  const maxLength = Math.max(newVersions.length, oldVersions.length);
  let needUpdate = false;
  for (let i = 0; i < maxLength; i += 1) {
    if ((newVersions[i] || 0) < (oldVersions[i] || 0)) {
      break;
    } else if((newVersions[i] || 0) > (oldVersions[i] || 0)){
      needUpdate = true;
    }
  }
  return needUpdate;
};

export const get = (url) => {
  return new Promise((res, rej) => {
    let id;
    const httpRequest = http.get(url, (req) => {
      let responseData = '';
      req.on('data', (data) => {
        responseData += data;
      });
      req.on('end', () => {
        let json = {};
        try {
          json = JSON.parse(responseData) || {};
        } catch (e) {
          json = {};
        }
        clearTimeout(id);
        res(json);
      });
      req.on('error', (error) => {
        clearTimeout(id);
        rej(error);
      });
    });
    httpRequest.on('error', (error) => {
      clearTimeout(id);
      rej(error);
    });
    id = setTimeout(() => {
      httpRequest.abort(); // 超时1.5s
    }, 5000);
  });
};

export const getVersion = () => {
  return get(defaultUrl);
};

