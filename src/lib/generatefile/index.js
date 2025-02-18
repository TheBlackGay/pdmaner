import React from 'react';
import { html } from './html';
import { markdown } from './markdown';
import { projectSuffix } from '../../../profile';
import {Download, FormatMessage} from 'components';
import moment from 'moment';

export const generateFile = (fileType, dataSource, imgCallBack) => {
  // 生成各类文件 总入口
  // 分析所有分组数据，需要创建空白分组来存储未分组数据（默认空白分组置于最后）
  const tempViewGroups = (dataSource?.viewGroups || []);
  const getNoGroupData = (name, groupName) => {
    const currentGroup = tempViewGroups
        .reduce((a, b) => a.concat(b[groupName]), [])
    return dataSource[name].filter(d => !currentGroup.includes(d.id)).map(d => d.id);
  };
  const tempGroup = {
    defKey: '__defaultGroup',
    id: '__defaultGroup',
    defName: FormatMessage.string({id: 'exportSql.defaultGroup'}),
    refEntities: getNoGroupData('entities', 'refEntities'),
    refViews: getNoGroupData('views', 'refViews'),
    refDiagrams: getNoGroupData('diagrams', 'refDiagrams'),
    refDicts: getNoGroupData('dicts', 'refDicts'),
  };
  const tempDataSource = {
    ...dataSource,
    viewGroups: tempViewGroups.concat(tempGroup),
  };
  imgCallBack((images) => {
    const name = tempDataSource.name;
    new Promise((res) => {
      if (fileType === 'html'){
        html(tempDataSource, images, name, (htmlString) => {
          res({
            data: htmlString,
            file: 'html',
          });
        });
      } else if (fileType === 'markdown') {
        markdown(tempDataSource, images, name, (markString) => {
          res({
            data: markString,
            file: 'md',
          });
        });
      }
    }).then(({data, file}) => {
      Download(
          [data],
          '', `${name}-${moment().format('YYYYMDHHmmss')}.${file}`);
    });
  });
};
