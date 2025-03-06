// 差异化数据转化成SQL或者代码信息
import React from 'react';
import _ from 'lodash/object';
import { Message, FormatMessage } from '../components';

import { separator } from '../../profile';
import {getDefaultTemplate, transform} from './datasource_util';
import {platform} from './middle';
import {
  _camel, _getAllDataSQLByFilter,
  _getDataByChanges,
  _getDefaultEnv,
  _getEmptyMessage,
  _getTemplateString,
    demoTable,
    demoGroup
} from './utils';

const demoDict =  {
  dict: {
    "defKey": "Gender",
    "defName": "性别",
    "intro": "",
    "items": [
      {
        "defKey": "M",
        "defName": "男",
        "intro": "",
        "parentKey": "",
        "enabled": true,
        "attr1": "",
        "attr2": "",
        "attr3": "",
        "sort": "1"
      },
      {
        "defKey": "F",
        "defName": "女",
        "intro": "",
        "parentKey": "",
        "enabled": true,
        "attr1": "",
        "attr2": "",
        "attr3": "",
        "sort": "2"
      },
      {
        "defKey": "U",
        "defName": "未知",
        "intro": "",
        "parentKey": "",
        "enabled": true,
        "attr1": "",
        "attr2": "",
        "attr3": "",
        "sort": "3"
      }
    ]
  },
  group: demoGroup,
};
const demoView = {
  view:     {
    "defKey": "SMIS_STUDENT_EXAM",
    "defName": "学生考试",
    "comment": "",
    "properties": {
      "partitionBy": ""
    },
    "nameTemplate": "{defKey}[{defName}]",
    "headers": [
      {
        "refKey": "hideInGraph",
        "hideInGraph": true
      },
      {
        "refKey": "defKey",
        "hideInGraph": false
      },
      {
        "refKey": "refEntity",
        "hideInGraph": true
      },
      {
        "refKey": "defName",
        "hideInGraph": false
      },
      {
        "refKey": "primaryKey",
        "hideInGraph": false
      },
      {
        "refKey": "notNull",
        "hideInGraph": true
      },
      {
        "refKey": "autoIncrement",
        "hideInGraph": true
      },
      {
        "refKey": "domain",
        "hideInGraph": false
      },
      {
        "refKey": "type",
        "hideInGraph": true
      },
      {
        "refKey": "len",
        "hideInGraph": true
      },
      {
        "refKey": "scale",
        "hideInGraph": true
      },
      {
        "refKey": "remark",
        "hideInGraph": true
      },
      {
        "refKey": "refDict",
        "hideInGraph": true
      },
      {
        "refKey": "defaultValue",
        "hideInGraph": true
      },
      {
        "refKey": "isStandard",
        "hideInGraph": false
      },
      {
        "freeze": false,
        "refKey": "uiHint",
        "hideInGraph": true
      }
    ],
    "fields": [
      {
        "defKey": "STUDENT_ID",
        "defName": "学生ID",
        "comment": "",
        "len": 32,
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": false,
        "domain": "IdOrKey",
        "refEntity": "SIMS_STUDENT",
        "refEntityField": "STUDENT_ID",
        "type": "VARCHAR"
      },
      {
        "defKey": "STUDENT_NAME",
        "defName": "学生姓名",
        "comment": "",
        "len": 90,
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": false,
        "domain": "Name",
        "refEntity": "SIMS_STUDENT",
        "refEntityField": "STUDENT_NAME",
        "type": "VARCHAR"
      },
      {
        "defKey": "MOBILE_PHONE",
        "defName": "手机号",
        "comment": "",
        "len": "60",
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": false,
        "domain": "DefaultString",
        "refEntity": "SIMS_STUDENT",
        "refEntityField": "MOBILE_PHONE",
        "type": "VARCHAR"
      },
      {
        "defKey": "GENDER",
        "defName": "性别",
        "comment": "",
        "len": "32",
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": false,
        "domain": "Dict",
        "refDict": "Gender",
        "refEntity": "SIMS_STUDENT",
        "refEntityField": "GENDER",
        "type": "VARCHAR"
      },
      {
        "defKey": "LESSON_NAME",
        "defName": "课程名",
        "comment": "",
        "len": 90,
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": false,
        "domain": "Name",
        "refEntity": "SIMS_LESSON",
        "refEntityField": "LESSON_NAME",
        "type": "VARCHAR"
      },
      {
        "defKey": "LESSON_ID",
        "defName": "课程ID",
        "comment": "",
        "len": 32,
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": false,
        "domain": "IdOrKey",
        "refEntity": "SIMS_LESSON",
        "refEntityField": "LESSON_ID",
        "type": "VARCHAR"
      },
      {
        "defKey": "EXAM_DATE",
        "defName": "考试日期",
        "comment": "",
        "len": "",
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": false,
        "domain": "DateTime",
        "refEntity": "SIMS_EXAM",
        "refEntityField": "EXAM_DATE",
        "type": "DATETIME"
      },
      {
        "defKey": "EXAM_SCORE",
        "defName": "考试分数",
        "comment": "",
        "len": 24,
        "scale": "8",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": false,
        "domain": "Double",
        "refEntity": "SIMS_EXAM",
        "refEntityField": "EXAM_SCORE",
        "type": "DECIMAL"
      },
      {
        "defKey": "TENANT_ID",
        "defName": "租户号",
        "comment": "",
        "len": 32,
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": true,
        "domain": "IdOrKey",
        "refEntity": "SIMS_EXAM",
        "refEntityField": "TENANT_ID",
        "type": "VARCHAR"
      },
      {
        "defKey": "REVISION",
        "defName": "乐观锁",
        "comment": "",
        "domain": "Int",
        "len": "",
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": true,
        "refEntity": "SIMS_EXAM",
        "refEntityField": "REVISION",
        "type": "INT"
      },
      {
        "defKey": "CREATED_BY",
        "defName": "创建人",
        "comment": "",
        "domain": "IdOrKey",
        "len": 32,
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": true,
        "refEntity": "SIMS_EXAM",
        "refEntityField": "CREATED_BY",
        "type": "VARCHAR"
      },
      {
        "defKey": "CREATED_TIME",
        "defName": "创建时间",
        "comment": "",
        "domain": "DateTime",
        "len": "",
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": true,
        "refEntity": "SIMS_EXAM",
        "refEntityField": "CREATED_TIME",
        "type": "DATETIME"
      },
      {
        "defKey": "UPDATED_BY",
        "defName": "更新人",
        "comment": "",
        "domain": "IdOrKey",
        "len": 32,
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": true,
        "refEntity": "SIMS_EXAM",
        "refEntityField": "UPDATED_BY",
        "type": "VARCHAR"
      },
      {
        "defKey": "UPDATED_TIME",
        "defName": "更新时间",
        "comment": "",
        "domain": "DateTime",
        "len": "",
        "scale": "",
        "primaryKey": false,
        "notNull": false,
        "autoIncrement": false,
        "defaultValue": "",
        "hideInGraph": true,
        "refEntity": "SIMS_EXAM",
        "refEntityField": "UPDATED_TIME",
        "type": "DATETIME"
      }
    ],
    "correlations": [],
    "refEntities": [
      "SIMS_STUDENT",
      "SIMS_EXAM",
      "SIMS_LESSON"
    ]
  },
  group: demoGroup,
};
const demoVersionData =  {
  id: '26B8D13E-BE37-4E20-8496-13A586E84581',
  //表基础信息,表变更之前的
  baseInfo: {
    "defKey": "SIMS_COLLEGE",
    "defName": "学院",
    "comment": "",
  },
  //表基础信息变更
  baseChanged: {
    before: {
      "defKey": "SIMS_COLLEGE",
      "defName": "学院",
      "comment": "",
    }, after: {
      "defKey": "SIMS_COLLEGE1",
      "defName": "学院1",
      "comment": "新的",
    }
  },
  //字段调整,样本数据放两条
  fieldAdded: [{
    "index": 3,
    "beforeFieldKey": null,   //如果没有就设置为空
    "afterFieldKey": null,    //如果没有就设置为空
    //以下是字段的所有信息
    "defKey": "COLLEGE_ID",
    "defName": "所在学院ID",
    "comment": "",
    "len": 32,
    "scale": "",
    "primaryKey": false,
    "notNull": true,
    "autoIncrement": false,
    "defaultValue": "",
    "hideInGraph": false,
    "domain": "IdOrKey",
    "type": "String",
    "dbType": "VARCHAR"
  }],
  fieldRemoved: [{
    "defKey": "COLLEGE_ID",
    "defName": "所在学院ID",
    "comment": "",
    "len": 32,
    "scale": "",
    "primaryKey": false,
    "notNull": true,
    "autoIncrement": false,
    "defaultValue": "",
    "hideInGraph": false,
    "domain": "IdOrKey",
    "type": "String",
    "dbType": "VARCHAR"
  }],
  fieldModified: [{
    before: {
      //字段的全部信息
      "defKey": "COLLEGE_ID",
      "defName": "所在学院ID",
      "comment": "",
      "len": 32,
      "scale": "",
      "primaryKey": false,
      "notNull": true,
      "autoIncrement": false,
      "defaultValue": "",
      "hideInGraph": false,
      "domain": "IdOrKey",
      "type": "String",
      "dbType": "VARCHAR"
    }, after: {
      "defKey": "COLLEGE_ID",
      "defName": "所在学院ID",
      "comment": "",
      "len": 32,
      "scale": "",
      "primaryKey": false,
      "notNull": true,
      "autoIncrement": false,
      "defaultValue": "",
      "hideInGraph": false,
      "domain": "IdOrKey",
      "type": "String",
      "dbType": "VARCHAR"
    }
  }],
  //扩展属性调整
  propAdded: [{key: "partitioned by", value: "(pt_d string)"}],
  propRemoved: [{key: "row format delimited", value: ""}],
  propModified: [{before: {key: "fields terminated by", value: ","}, after: {key: "fields terminated by", value: ","}}],
  //关联实体调整,样本数据放两条
  refEntityAdd: [{
    "defKey": "SIMS_COLLEGE",
    "defName": "学院",
    "comment": "",
  }],
  refEntityRemoved: [{
    "defKey": "SIMS_COLLEGE",
    "defName": "学院",
    "comment": "",
  }],
  //索引调整
  indexChanged:true,
  indexAdded:[demoTable.entity.indexes[0]],
  indexRemoved:[demoTable.entity.indexes[1]],
  indexModified:[{
    before: demoTable.entity.indexes[0],
    after: demoTable.entity.indexes[1],
  }],
  fullFields: demoTable.entity.fields,
  newIndexes: demoTable.entity.indexes,
};
const demoChanges =  [
    {type: 'entity', opt: 'delete', data: demoTable.entity},
    {type: 'entity', opt: 'add', data: demoTable.entity},
    {type: 'entity', opt: 'update', data: demoVersionData},
];

export const openUrl = (url) => {
  const href = url;
  if (platform === 'json') {
    // eslint-disable-next-line global-require,import/no-extraneous-dependencies
    require('electron').shell.openExternal(href).catch(() => {
      Message.error({title: `${FormatMessage.string({id: 'canvas.node.invalidLink'})}`});
    });
  } else {
    const a = document.createElement('a');
    a.href = href;
    a.click();
  }
};

export const camel = (str, firstUpper) => {
  return _camel(str, firstUpper)
};
export const getDefaultEnv = (e) => {
  return _getDefaultEnv(e);
}
// 根据模板数据生成代码
export const getTemplateString = (...args) => {
  return _getTemplateString(...args);
};
// 生成增量代码数据
const generateIncreaseSql = (dataSource, group, dataTable, code, templateShow) => {
  const entities = dataSource.entities || [];
  // 获取该数据库下的模板信息
  const allTemplate = _.get(dataSource, 'profile.codeTemplates', []);
  // appCode
  const tData = allTemplate.filter(t => t.applyFor === code)[0];
  const template = tData?.[templateShow] || getDefaultTemplate(code, templateShow, dataSource);
  const type = tData?.type;
  const sqlSeparator = _.get(dataSource, 'profile.sql.delimiter', ';');
  // 构造新的数据表传递给模板
  const fields = (dataTable.fields || []);
  const indexes = (dataTable.indexes || []);
  const other = {};
  if (dataTable.refEntities) {
    other.refEntities = (dataSource.entities || [])
        .filter(e => dataTable.refEntities.includes(e.id)).map(e => e.defKey)
  }
  const tempDataTable = {
    ...dataTable,
    ...other,
    env: getDefaultEnv(dataTable),
    fields: templateShow === 'createIndex' ? fields : fields.map(field => {
      return {
        ...field,
        ...transform(field, dataSource, code, 'id', type),
      }
    }),
    indexes: (indexes || []).map(i => {
      return {
        ...i,
        fields: (i.fields || []).map(f => {
          return {
            ...f,
            fieldDefKey: fields.find(field => field.id === f.fieldDefKey)?.defKey,
          };
        }),
      }
    }),
    correlations: (dataTable.correlations || []).map(c => {
      const refEntityData = entities.find(e => e.id === c.refEntity);
      return {
        ...c,
        myField: fields.find(field => field.id === c.myField)?.defKey,
        refEntity: refEntityData?.defKey,
        refField: (refEntityData.fields || []).find(field => field.id === c.refField)?.defKey,
      }
    })
  };
  const name = templateShow === 'createView' ? 'view' : 'entity';
  const templateData = {
    [name]: tempDataTable,
    group,
    separator: sqlSeparator
  };
  if (!templateShow) {
    const dataTypeSupports = (dataSource.profile?.dataTypeSupports || []).filter(t => t.id === code)[0]
    return Object.keys(_.omit(tData, ['type', 'applyFor']))
        .map(t => {
          return {
            name: t,
            suffix: tempDataTable.env?.template?.[dataTypeSupports.defKey]?.[t]?.enable !== false ? (getTemplateString(tempDataTable.env?.template?.[dataTypeSupports.defKey]?.[t]?.suffix || '', {
              ...tempDataTable.env?.base || {},
              codeRoot: tempDataTable.env?.base?.codeRoot || camel(tempDataTable.defKey, true) || '',
            }) || t) : '',
            code: getTemplateString(tData[t] || '', templateData),
          }
        });
  }
  return getTemplateString(template, templateData);
};
// 获取单个数据表的各个模板的代码
export const getCodeByDataTable = (dataSource, group, dataTable, code, templateShow, type) => {
  let sqlString = '';
  try {
      sqlString = generateIncreaseSql(dataSource, group, dataTable, code, templateShow);
      // const DDLToggleCase = dataSource?.profile?.DDLToggleCase || '';
      // if (DDLToggleCase && type === 'dbDDL') {
      //   return DDLToggleCase === 'U' ? sqlString.toLocaleUpperCase() : sqlString.toLocaleLowerCase();
      // }
      return sqlString;
  } catch (e) {
    console.error(e);
    Message.error({title: <span>
        {FormatMessage.string({id: 'database.templateError'})}
        <FormatMessage id='database.templateErrorLink'/>
        <a onClick={() => openUrl('http://github.com/olado/doT')}>http://github.com/olado/doT</a>
      </span>});
    sqlString = JSON.stringify(e.message);
  }
  return sqlString;
};
// 获取demo数据的代码
export const getDemoTemplateData = (templateShow) => {
  let data = '';
  switch (templateShow) {
    case 'content':
      data = JSON.stringify({...demoTable, separator: ';'}, null, 2);
      break;
    case 'createTable':
      data = JSON.stringify({...demoTable, separator: ';'}, null, 2);
      break;
    case 'createView':
      data = JSON.stringify({...demoView, separator: ';'}, null, 2);
      break;
    case 'createIndex':
      data = JSON.stringify({
        ...demoTable,
        separator: ';'
      }, null, 2);
      break;
    case 'deleteIndex':
      data = JSON.stringify({
        ...demoTable,
        separator: ';'
      }, null, 2);
      break;
    case 'dictSQLTemplate':
      data = JSON.stringify({
        ...demoDict,
        separator: ';'
      }, null, 2);
      break;
    case 'deleteTable':
      data = JSON.stringify({
        entity: {
          defKey: demoTable.entity.defKey,
        },
        type: 'entity',
        separator: ';'
      }, null, 2);
      break;
    case 'renameTable':
      data = JSON.stringify({
        old: {
          defKey: demoTable.entity.defKey
        },
        new: {
          defKey: `${demoTable.entity.defKey}_NEW`
        },
        separator: ';',
        type: 'entity',
      }, null, 2);
      break;
    case 'addField':
      data = JSON.stringify({
        entity: demoTable.entity,
        newField: {
          ...demoTable.entity.fields[1],
          beforeDefKey: demoTable.entity.fields[2].defKey,
          afterDefKey: demoTable.entity.fields[0].defKey,
          fieldIndex: 1,
        },
        separator: ';'
      }, null, 2);
      break;
    case 'deleteField':
      data = JSON.stringify({
        field: demoTable.entity.fields[0],
        separator: ';'
      }, null, 2);
      break;
    case 'updateField':
      data = JSON.stringify({
        old: {
          defKey: demoTable.entity.fields[0].defKey
        },
        new: {
          defKey: `${demoTable.entity.fields[0].defKey}_NEW`
        },
        separator: ';'
      }, null, 2);
      break;
    case 'message':
      data = JSON.stringify({
        changes: demoChanges,
        separator: ';'
      }, null, 2);
      break;
    case 'update':
      data = JSON.stringify({
        changes: demoChanges,
        separator: ';'
      }, null, 2);
      break;
    default:
      data = JSON.stringify({...demoTable, separator: ';'}, null, 2);
      break;
  }
  return data;
};
// 传入模板内容和数据 返回代码信息
export const getDataByTemplate = (data, template, isDemo, dataSource, code, isAppCode) => {
  let sqlString = '';
  try {
    sqlString = getTemplateString(template, data, isDemo, dataSource, code);
    // const DDLToggleCase = dataSource?.profile?.DDLToggleCase || '';
    // if (DDLToggleCase && !isAppCode) {
    //   return DDLToggleCase === 'U' ? sqlString.toLocaleUpperCase() : sqlString.toLocaleLowerCase();
    // }
    return sqlString;
  } catch (e) {
    //Message.error({title: FormatMessage.string({id: 'database.templateError'})});
    sqlString = JSON.stringify(e.message);
  }
  return sqlString;
};
// 获取所有数据表的全量脚本（filter）
export const getAllDataSQLByFilter = (...args) => {
  return _getAllDataSQLByFilter(...args);
};
export const getEmptyMessage = (...args) => {
  return _getEmptyMessage(...args)
};
// 根据变更信息生成代码
export const getDataByChanges = (changes, dataSource) => {
  return _getDataByChanges(changes, dataSource)
};
