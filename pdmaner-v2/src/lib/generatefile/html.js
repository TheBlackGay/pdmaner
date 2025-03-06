import _object from 'lodash/object';
import {transform} from '../datasource_util';

const relation = '关联关系';
const relationList = '关联关系清单';
const table = '数据表';
const tableList = '表清单';
const tableColumnList = '表列清单';
const view = '视图';
const viewList = '视图清单';
const viewColumnList = '视图列清单';
const dict = '字典';
const dictList = '字典清单';
const dictItemList = '字典条目清单';

const name = '名称';
const code = '代码';
const dataType = '数据类型';
const length = '长度';
const main = '主键';
const defaultValue = '默认值';
const remark = '备注';

const generateHeader = (dataSource) => {
  let GroupsString = `<ul>\n`;
  const viewGroups = _object.get(dataSource, 'viewGroups', []);
  const generateHeaderIndex = (group, index, groupName, dataName, mainTitle, title, subTitle) => {
    const dataRefs = _object.get(group, name, []);
    const data = (dataSource[dataName] || []).filter(e => dataRefs.includes(e.id));
    GroupsString += `<ul>`;
    GroupsString += `<li class="second-li"><a class="group-list" href="#">${index} ${mainTitle}</a></li>\n`;
    GroupsString += `<ul>`;
    GroupsString += `<li class="second-li"><a class="group-list" id="group-${group.id}-${dataName}-from" href="#group-${group.id}-${dataName}-to">1 ${title}</a></li>\n`;
    if (subTitle) {
      GroupsString += `<li class="second-li"><a class="group-list" id="group-${group.id}-${groupName}-from" href="#group-${group.id}-${groupName}-to">2 ${subTitle}</a>\n`;
    }
    GroupsString += `<ul>`;
    data.forEach((d, dIndex) => {
      GroupsString += `<li class="third-li"><a id="group-${group.id}-${d.id}-from" href="#group-${group.id}-${d.id}-to">3.${dIndex + 1} ${d.id}[${d.defName || ''}]</a></li>\n`
    });
    GroupsString += `</ul></li></ul></li>`;
    GroupsString += `</ul>`;
  }
  viewGroups.forEach((group, index) => {
    GroupsString += `<li class="first-li"><a class="group" id="group-${group.id}-from" href="#group-${group.id}-to">${index + 1} ${group.defName || group.defKey}</a>\n`;
    generateHeaderIndex(group, 1, 'refDiagrams', 'diagrams', relation, relationList);
    generateHeaderIndex(group, 2, 'entities-column', 'entities', table, tableList, tableColumnList);
    generateHeaderIndex(group, 3, 'views-column', 'views', view, viewList, viewColumnList);
    generateHeaderIndex(group, 4, 'dicts-column', 'dicts', dict, dictList, dictItemList);
  });
  return `${GroupsString}</ul>\n`;
};

const generateTableListTable = (dataSource, groupKey, type, fieldName) => {
  /*
  |  名称 | 代码  |
  | ------------ | ------------ |
  | 用户信息  | userManage  |
   */
  let tableString = `<table border="1" cellspacing="0">\n`;
  tableString += `<tr class="first-tr"><td>${name}</td><td>${code}</td><td>${remark}</td></tr>\n`;
  const viewGroups = _object.get(dataSource, 'viewGroups', []);
  const entities = _object.get(dataSource, fieldName, []);
  viewGroups.forEach((group) => {
    if (group.id === groupKey) {
      const currentEntities = entities.filter(e => (group?.[type] || []).includes(e.id));
      currentEntities.forEach((entity) => {
        tableString += `<tr><td>${entity.defName || entity.defKey}</td><td>${entity.defKey}</td><td>${entity.comment || ''}</td></tr>\n`;
      })
    }
  });
  return `${tableString}</table>`;
};

const generateTableColumnListTable = (dataSource, groupKey, tableKey, nameType) => {
  /*
  |  名称 | 代码  |
  | ------------ | ------------ |
  | 用户信息  | userManage  |
   */
  const dataTypeSupports = _object.get(dataSource, 'profile.dataTypeSupports', []);
  const defaultDb = dataTypeSupports.filter(d => d.id === _object.get(dataSource, 'profile.default.db', ''))[0].defKey || '';
  let tableString = `<table border="1" cellspacing="0">\n`;
  tableString += `<tr class="first-tr"><td>${code}</td><td>${name}</td>${nameType !== 'dicts' ? `<td>${dataType}(${defaultDb})</td><td>${length}</td><td>${main}</td><td>${defaultValue}</td>` : ''}<td>${remark}</td></tr>\n`;
  const viewGroups = _object.get(dataSource, 'viewGroups', []);
  viewGroups.forEach((group) => {
    if (group.id === groupKey) {
      const entities = _object.get(dataSource, nameType, []);
      entities.forEach((entity) => {
        if (entity.id === tableKey) {
          // 循环实体的属性
          (entity[nameType === 'dicts' ? 'items' : 'fields'] || []).forEach((field) => {
            // 获取每一个属性对应的每一个数据的数据类型
            if (nameType === 'dicts') {
              tableString += `<tr><td>${field.defKey}</td><td>${field.defName || ''}</td><td>${field.intro || ''}</td></tr>\n`;
            } else {
              const fieldData = {
                ...field,
                ...transform(field, dataSource),
              };
              tableString += `<tr><td>${field.defKey}</td><td>${field.defName || ''}</td><td>${fieldData.type}</td><td>${fieldData.len || ''}</td><td>${field.primaryKey && '√' || ''}<td>${field.defaultValue}</td></td><td>${field.comment || ''}</td></tr>\n`;
            }
           });
        }
      })
    }
  });
  return `${tableString}</table>`;
};

const generateRelation = (group, images) => {
  /*
  ![Alt text](/path/to/img.jpg "Optional title")
   */
  const img = images.filter(i => group.refDiagrams?.includes(i.fileName));
  if (img.length > 0) {
    return img
      .map((i, index) => `<img style="width: 98%;margin-top: 10px" src="${i.data}" title="${group.defName}-关系图-${index + 1}"/>`)
      .join('\n');
  }
  return `<span>该模块未配置关系图</span>`;
};

const generateModuleBody = (dataSource, images = []) => {
  /*
  ---
### 1. 模块清单
#### 1.1. 测试模块
 - #### 1.1.1 关联关系
 - #### 1.1.2 表清单
 ---
|  名称 | 代码  |
| ------------ | ------------ |
| 用户信息  | userManage  |
---

 - #### 1.1.3 列清单

 ---
 - ##### 用户信息表1

 ---
 - ##### 用户信息表2

 ---
 - ##### 用户信息表3

 ---

   */
  let groupsString = `<ul>\n\n`;
  const viewGroups = _object.get(dataSource, 'viewGroups', []);
  // 循环所有的模块
  // 生成关系图
  // 生成该模块的表清单
  const renderEntitiesOrViews = (group, type, name, index, subIndex, title, subTitle) => {
    let renderString = '';
    // 表清单
    renderString += `<li><a class="group-list" id="group-${group.id}-${name}-to" href="#group-${group.id}-${name}-from">${index + 1}.${subIndex}.1  ${title}</a>\n\n`;

    renderString += `\n\n`;
    renderString += `${generateTableListTable(dataSource, group.id, type, name)}\n`;
    renderString += `</li><hr>\n\n`;
    renderString += `<li><a class="group-list" id="group-${group.id}-${name}-column-to" href="#group-${group.id}-${name}-column-from">${index + 1}.${subIndex}.2 ${subTitle}</a>\n\n`;
    const entityRefs = _object.get(group, type, []);
    const entities = (dataSource?.[name] || []).filter(e => entityRefs.includes(e.id));
    renderString += `<ul style="padding: 0">`;
    entities.forEach((entity, entityIndex) => {
      renderString += ` <li><a class="block" id="group-${group.id}-${name}-column-${entity.id}-to" href="#group-${group.id}-${name}-column-${entity.id}-from">${index + 1}.${subIndex}.2.${entityIndex + 1} ${entity.defKey}[${entity.defName || ''}]</a>\n\n`;
      renderString += `${generateTableColumnListTable(dataSource, group.id, entity.id, name)}\n`;
      renderString += `</li>\n\n`;
    });
    renderString += '</li></ul><hr></li>'
    return renderString;
  }
  viewGroups.forEach((group, index) => {
    groupsString += `<li class="first-li"><a class="group" id="group-${group.id}-to" href="#group-${group.id}-from">${index + 1} ${group.defName || group.defKey || group.id}</a><ul>\n`;
    groupsString += `<li class="second-li"><a class="group-list" class="block" id="group-${group.id}-diagrams-to" href="#group-${group.id}-diagrams-from">${index + 1}.1 ${relationList}</a>\n`;
    groupsString += `${generateRelation(group, images)}\n`;
    groupsString += `</li><hr>\n`;
    groupsString += renderEntitiesOrViews(group, 'refEntities', 'entities', index, 2, tableList, tableColumnList);
    groupsString += renderEntitiesOrViews(group, 'refViews', 'views', index, 3, viewList, viewColumnList);
    groupsString += renderEntitiesOrViews(group, 'refDicts', 'dicts', index, 4, dictList, dictItemList);

    groupsString += '</ul></li></ul><hr></li>'
  });
  // 生成该模块的表列清单
  return `${groupsString}</ul>`;
};

export const html = (dataSource, images, projectName, callBack) => {
  // 初始化去除body的其他内容
  const defaultData = `<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <title>${projectName}</title>
    <style>
    * {
        box-sizing: border-box;
    }
        html , body {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
        }
        body {
          padding: 10px;
        }
        .left {
            display: inline-block;
            width: 25%;
            height: 100%;
            overflow: auto;
            border-right: 1px solid #DFE3EB;
            padding: 10px
        }
        .right {
            display: inline-block;
            width: 75%;
            height: 100%;
            padding: 10px;
            overflow: auto;
        }
        .index {
            font-weight: bold;
            font-size: 25px;
        }
        li {
            list-style: none;
            padding: 5px;
        }
        .first-li {
            font-weight: bold;
            font-size: 20px;
        }
        .second-li {
            font-weight: bold;
        }
        .third-li {
            font-weight: normal;
        }
        .block {
            display: block;
        }
        table {
            width: 100%;
            margin-top: 10px;
            border-color: #E8E8E8;
        }
        .first-tr {
            text-align: center;
        }
        tr:hover {
            background: #ECF9FF;
        }
        td {
            font-weight: normal;
            padding: 5px;
            white-space: nowrap;
        }
        a {
            color: #000000;
            background-color: transparent;
            text-decoration: none;
            outline: none;
            cursor: pointer;
        }
        .group {
            color: green;
        }
        .group-list {
            color: #1890ff;
        }
    </style>
</head>
<body>`;
  const index = '<center class="index">目录</center>\n';
  const header = generateHeader(dataSource);
  const body = generateModuleBody(dataSource, images);
  const endTag = "</body>\n" +
    "</html>";
  callBack && callBack(`${defaultData}<span class="left">${index}<hr>${header}</span><span  class="right">${body}</span>${endTag}`);
};
