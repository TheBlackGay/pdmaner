import {Graph} from '@antv/x6';
import _ from 'lodash/object';
import { elementToSVG } from 'dom-to-svg'

import { calcCellData } from '../datasource_util';
import { saveTempImages } from '../middle';


export const svg2png = (svgData) => {
  return new Promise((resolve, reject) => {
    const svgDataUrl = `data:image/svg+xml;charset=utf-8;base64,${window.btoa(unescape(encodeURIComponent(svgData)))}`
    const img = document.createElement('img');
    img.src = svgDataUrl;
    img.onload = function() {
      const { width, height } = img.getBoundingClientRect();
      const canvas = document.createElement('canvas');
      const dpr = window.devicePixelRatio || window.webkitDevicePixelRatio || window.mozDevicePixelRatio || 1
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const context = canvas.getContext('2d');
      context.scale(dpr, dpr);
      context.drawImage(img, 0, 0, width, height);
      document.body.removeChild(img);
      resolve(canvas);
    }
    img.onerror = function (err){
      reject(err)
    }
    document.body.appendChild(img);
  })
}

export const img = (data, relationType, dataSource, needCalc = true, groups) => {
  return new Promise((res) => {
    const dom = document.createElement('div');
    dom.style.width = `${300}px`;
    dom.style.height = `${600}px`;
    document.body.appendChild(dom);
    const graph = new Graph({
      container: dom,
      async: true,
      autoResize: false,
      grid: false,
      scroller: {
        enabled: true,
      },
      connecting: {
        connectionPoint: 'anchor',
      },
    });
    const updateStyle = () => {
      dom.querySelectorAll('body').forEach(d => {
        d.style.margin  = '0';
      });
    }
    const mindCells = (data || []).filter(c => c.shape === 'mind-topic-branch' || c.shape=== 'mind-topic' || c.shape === 'mind-edge');
    const cells = ((needCalc ? calcCellData(data, dataSource, null, groups, null, relationType, null, null) : data))
        .concat(mindCells).map((d) => {
      const other = {
        tools: {},
      };
      if (d.shape === 'erdRelation') {
        const relation = d.relation?.split(':') || [];
        other.attrs = {
          ...(d.attrs || {}),
          line: {
            ..._.get(d, 'attrs.line'),
            strokeWidth: 1,
            stroke: d.fillColor || '#ACDAFC',
            sourceMarker: {
              ..._.get(d, 'attrs.line.sourceMarker'),
              relation: relation[0],
            },
            targetMarker: {
              ..._.get(d, 'attrs.line.targetMarker'),
              relation: relation[1],
            },
          }
        }
      }
      if (d.shape === 'edit-node-polygon' || d.shape === 'edit-node-circle-svg') {
        return {
          ...d,
          shape: `${d.shape}-img`,
        };
      }
      return {
        ..._.omit(d, ['attrs', 'component']),
        shape: `${d.shape}-img`,
        ...other,
      };
    });
    graph.on('render:done', () => {
      graph.centerContent();
      //setTimeout(() => {
        updateStyle()
        res(dom);
      //});
    });
    graph.fromJSON({cells});
    if (cells.length === 0) {
      res(dom);
    }
  })
};

export const imgAll = (dataSource, callBack, useBase, imageType) => {
  if ((dataSource.diagrams || []).length === 0){
    return new Promise((res, rej) => {
      if (useBase) {
        res([]);
      } else {
        saveTempImages([])
            .then((dir) => {
              res(dir);
            }).catch(err => rej(err));
      }
    });
  }
  return new Promise( async (res, rej) => {
    const result = [];
    for (let i = 0; i < dataSource.diagrams.length; i += 1){
      const d = dataSource.diagrams[i];
      const hiddenPort = {
        attrs: {
          circle: {
            r: 4,
            magnet: true,
            strokeWidth: 1,
            style: {
              visibility: 'hidden',
            },
          },
        },
        position: { name: 'absolute' },
        zIndex: 3,
      };
      await new Promise((resolve, reject) => {
        img(d.canvasData?.cells || [], d.relationType, dataSource, true, {
          in: {
            ...hiddenPort,
          },
          out: {
            ...hiddenPort,
          },
          extend: {
            ...hiddenPort,
          },
        }).then((dom) => {
          if (imageType === 'svg') {
            const baseData = html2svg(d.canvasData?.cells || [], dom);
            document.body.removeChild(dom.parentElement.parentElement);
            result.push({fileName: d.id, data: useBase ? `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(baseData)))}` : baseData});
            console.log(d.defName || d.defKey);
            callBack && callBack();
            resolve();
          } else {
            svg2png(html2svg(d.canvasData?.cells || [], dom)).then((canvas) => {
              document.body.removeChild(dom.parentElement.parentElement);
              const baseData = canvas.toDataURL('image/png');
              const dataBuffer = Buffer.from(baseData.replace(/^data:image\/\w+;base64,/, ""), 'base64');
              result.push({fileName: d.id, data: useBase ? baseData : dataBuffer});
              console.log(d.defName || d.defKey);
              callBack && callBack();
              resolve();
            }).catch(err => reject(err));
          }
        }).catch(err => reject(err))
      })
    }
    if (useBase) {
      res(result);
    } else {
      saveTempImages(result, imageType)
          .then((dir) => {
            res(dir);
          }).catch(err => rej(err));
    }
  });
}

let lengthValueCache = {};
export const html2svg = (data = [], dom) => {
  console.log(lengthValueCache);
  // vertices
  const cells = data.reduce((p, n) => {
    if(n.position) {
      return p.concat(n);
    }
    return p.concat((n.vertices || []).map(v => ({position: v})))
  }, []);
  const checkLength = (e, text, length, width) => {
    const tempText = text.slice(0, length);
    if(tempText.length > 0) {
      e.innerText = `${tempText}...`;
      if(Math.abs(e.scrollWidth - width) > 1) {
        checkLength(e, text, length - 1, width);
      }
    } else {
      e.innerText = '...';
    }
  }
  //替换foreignObject
  dom.querySelectorAll('foreignObject').forEach(f => {
    const parent = f.parentElement;
    const ellipsis = f.querySelectorAll('.chiner-ellipsis');
    ellipsis.forEach(e => {
      // 替换多余的空格
      e.innerText = e.innerText.replace(/\s{3,}'/g, '  ');
    const width = e.getBoundingClientRect().width
      if(Math.abs(e.scrollWidth - width) > 1) {
        const text = e.innerText;
        // 由于生成的svg无法实现文本超宽省略，因此需要手动计算文本超宽增加省略
        const name = `${text}${width}`;
        if(lengthValueCache[name]) {
          e.innerText = lengthValueCache[name];
        } else {
          checkLength(e, text, text.length, width);
          if(Object.keys(lengthValueCache).length > 1000000) {
            // 如果缓存数量超过百万 则清除数据 释放内存
            lengthValueCache = {}
          }
          lengthValueCache[name] = e.innerText;
        }
      }
    })
    const svgDom = elementToSVG(f).children[0];
    const clearId = (d) => {
      d.setAttribute('id', Math.uuid());
      // 重新设置透明度 支持word显示
      if(d.getAttribute('fill')?.includes('rgba')) {
        const fill = d.getAttribute('fill').replace(/\s/g, '');
        const fillArray = fill.split(',');
        if(fillArray.length === 4) {
          d.setAttribute('fill', fill.replace('rgba', 'rgb').replace(/,\s*(\d|\.)+\)$/, ')'));
          d.setAttribute('fill-opacity', fillArray.slice(-1)[0].replace(')', ''));
        }
      }
      if(d.children) {
        Array.from(d.children).forEach(c => {
          clearId(c);
        })
      }
    }
    clearId(svgDom);
    parent.replaceChild(svgDom, f);
  })
  const minX = Math.min(...cells.map(c => c.position.x));
  const minY = Math.min(...cells.map(c => c.position.y));
  const svg = dom.querySelector('.x6-graph-svg');
  const viewport = dom.querySelector('.x6-graph-svg-viewport');
  viewport.setAttribute('transform', `matrix(1,0,0,1,${-minX + 25},${-minY + 10})`);
  const rect = viewport.getBoundingClientRect();
  return `<svg width="${rect.width + 20}px" height="${rect.height + 20}px" viewBox="0 0 ${rect.width + 20} ${rect.height + 20}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          ${svg.innerHTML.replaceAll('size="1px">', 'size="1px"/>').replaceAll('&nbsp;', ' ')}</svg>`;
}

