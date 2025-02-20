import * as _ from 'lodash/object';
import moment from 'moment';
import {FormatMessage} from 'components';
import {getAllTabData, getMemoryCache, replaceDataByTabId} from './cache';
import emptyProjectTemplate from '../lib/template/empty.json';
import {separator} from '../../profile';
import {firstUp} from './string';
import {compareVersion} from './update';
import demoProject from './template/教学管理系统.pdma.json';
import {notify} from './subscribe';
import {
  _def2Id,
  _getDefaultTemplate,
  _getFieldBaseType,
  _id2Def,
  _mergeData,
  _mergeDataSource,
  _transform,
  _mergeId, demoTable
} from './utils';
import {postWorkerFuc} from './event_tool';

export const allType = [
  { type: 'logicEntity', name: 'logicEntities', defKey: 'defKey' },
  { type: 'entity', name: 'entities', defKey: 'defKey' },
  { type: 'view', name: 'views', defKey: 'defKey' },
  { type: 'diagram', name: 'diagrams', defKey: 'defKey' },
  { type: 'dict', name: 'dicts', defKey: 'defKey' },
  { type: 'domain', name: 'domains', defKey: 'defKey' },
  { type: 'mapping', name: 'dataTypeMapping.mappings', defKey: 'defKey' },
];

export const getHomeCover = () => ({
  defKey: 'home-cover',
  defName: FormatMessage.string({id: 'project.homeCover'}),
  relationType: 'entity',
  canvasData: {
    cells: [],
  },
  id: 'home-cover',
})

export const filterEdge = (allNodes, c) => {
  return allNodes.filter((n) => {
    if (n.id === c.source?.cell) {
      return n.ports?.items?.findIndex(i => i.id === c.source?.port) >= 0;
    } else if (n.id === c.target?.cell) {
      return n.ports?.items?.findIndex(i => i.id === c.target?.port) >= 0;
    }
    return false;
  }).length === 2
};

export const updateAllData = (dataSource) => {
  // 整理项目中所有的关系图数据 去除无效的关系图数据
  let tempData = {...dataSource};
  const allTabData = getAllTabData();
  let message = '';
  let flag = false;
  // 需要校验数据表是否有重复字段
  let repeatError = [];
  let entityRepeatError = [];
  let logicEntityRepeatError = [];
  let currentDefKey = {
    entity: [],
    view: [],
  };
  Object.keys(allTabData).reduce((p,n) => {
    return p.concat(allTabData[n])
  }, []).filter(t => t.data && !t.isInit).forEach(t => {
    const typeName = allType.find(all => t.type === all.type)?.name;
    const oldData = tempData[typeName].find(e => e.id === t.data.id) || t.data;
    if (!t.data.defKey && t.type !== 'diagram') {
      message = FormatMessage.string({
        id: 'defKeyValidateMessage',
        data: {
          name: `${FormatMessage.string({id: `menus.${t.type}`})}[${oldData?.defName || oldData?.defKey || t.data?.defName || t.data.id}]`,
        }});
    }
    if (t.type === 'entity' || t.type === 'view') {
      const fields = t.data?.fields || [];
      const repeat = fields.reduce((a, b) => {
        if (!b.defKey) {
          return a.concat(FormatMessage.string({id: 'emptyField'}));
        } else if (fields.filter(f => f.defKey?.toLocaleLowerCase() === b.defKey?.toLocaleLowerCase()).length > 1 && !a.includes(b.defKey?.toLocaleLowerCase())) {
          return a.concat(b.defKey);
        }
        return a;
      }, []).join('|');
      repeat && repeatError.push(`${t.data.defKey}=>[${repeat}]`);
      // 判断数据表或者视图重复
      const newDefKey = t.data?.defKey;
      if (newDefKey && (newDefKey !== oldData?.defKey)) {
        // 不能跟当前打开的TAB的key重复
        // 不能跟已经存在的key重复
        if (!currentDefKey[t.type].some(k => k?.toLocaleLowerCase() === newDefKey?.toLocaleLowerCase())) {
          currentDefKey[t.type].push(newDefKey);
        } else {
          entityRepeatError.push(newDefKey);
        }
        if (dataSource[t.type === 'view' ? 'views' : 'entities']?.findIndex(e => {
          return (e.id !== t.data.id) && (e.defKey?.toLocaleLowerCase()
              === newDefKey?.toLocaleLowerCase());
        }) > -1) {
          entityRepeatError.push(newDefKey);
        }
      }
    } else if(t.type === 'logicEntity') {
      const newDefKey = `${t.data?.defKey || ''}${t.data?.defName || ''}`;
      if (dataSource.logicEntities?.findIndex(e => {
        return (e.id !== t.data.id) && (`${e?.defKey || ''}${e?.defName || ''}`?.toLocaleLowerCase()
            === newDefKey?.toLocaleLowerCase());
      }) > -1) {
        logicEntityRepeatError.push(newDefKey);
      }
    }
  })
  if (logicEntityRepeatError.length > 0) {
    message += FormatMessage.string({
      id: 'logicEntityUniqueDefKeyError',
      data: {
        entities: logicEntityRepeatError.join(','),
      }}) + ';';
  }
  if (entityRepeatError.length > 0) {
    message += FormatMessage.string({
      id: 'entityUniqueDefKeyError',
      data: {
        entities: entityRepeatError.join(','),
      }}) + ';';
  }
  if (repeatError.length > 0) {
    // 字段重复显示超限
    message += FormatMessage.string({
      id: 'entityUniqueKeyError',
      data: {
        entities: repeatError.join(','),
      }
    });
  }
  if (!message) {
    const getData = () => {
      return Object.keys(allTabData).filter(k => !allTabData[k].isInit)
          .reduce((pre, next) => {
        const tempPre = {...pre};
        if (allTabData[next]) {
          const type = allTabData[next].type;
          if (!tempPre[type]) {
            tempPre[type] = [];
          }
          tempPre[type].push({...allTabData[next].data});
        }
        return tempPre;
      }, {});
    };
    const tabsAllData = getData();
    let viewGroups = dataSource?.viewGroups;
    const pickCell = (d, data) => {
      const allNodes = data?.cells || [];
      return {
        ...d,
        comment: data?.comment || '',
        canvasData: {
          cells: allNodes.map(c => {
            const otherData = {};
            const pickFields = [
              'id',
              'link',
              'shape',
              'source',
              'target',
              'position',
              'count',
              'originKey',
              'relation',
              'vertices',
              'label',
              'labels',
              'fontColor',
              'fillColor',
              'parent',
              'router',
              'connector',
              'attrs.line.strokeDasharray',
              'isLock',
              'note',
              'layout',
               'type'
            ];
            if (c.shape === 'edit-node' || c.shape === 'edit-node-circle'
                || c.shape === 'edit-node-polygon'
                || c.shape === 'edit-node-circle-svg') {
              pickFields.push('size');
              pickFields.push('ports');
            } else if (c.shape === 'group' || c.shape === 'mind-topic' || c.shape === 'mind-topic-branch') {
              pickFields.push('size');
              pickFields.push('children');
            } else if(c.shape === 'table') {
              pickFields.push('size');
              pickFields.push('autoSize');
            }
            if (d.relationType === 'entity') {
              pickFields.push('ports');
            }
            if (c.shape === 'edit-node-polygon' || c.shape === 'edit-node-circle-svg') {
              otherData.label = c.label || c?.attrs?.text?.text || '';
            }
            return {
              ..._.pick(c, pickFields),
              ...otherData,
            };
          }),
        },
      };
    };
    allType.forEach((type) => {
      if (tabsAllData[type.type] && tabsAllData[type.type].length > 0) {
        flag = true;
        tempData = {
          ...tempData,
          [type.name]: _.get(tempData, type.name, []).map((d) => {
            const currentData = tabsAllData[type.type].find(t => t.id === d.id);
            if (currentData) {
              if (type.type === 'diagram') {
                return pickCell(d, currentData);
              }
              if (currentData.group) {
                // 如果包含分组的修改
                viewGroups = viewGroups.map((g) => {
                  let tempRefs = (g?.[`ref${firstUp(type.name)}`] || []);
                  if (currentData.group.includes(g.id)) {
                    if (!tempRefs.includes(currentData.id)) {
                      tempRefs.push(d.id);
                    }
                  } else {
                    tempRefs = tempRefs.filter((key) => key !== currentData.id);
                  }
                  return {
                    ...g,
                    [`ref${firstUp(type.name)}`]: tempRefs,
                  };
                });
              }
              return _.omit(currentData, 'group');
            }
            return d;
          }),
        }
      }
    });
    const homeCover = (tabsAllData.diagram || []).find(d => d.id === 'home-cover');
    if(homeCover) {
      tempData = {
        ...tempData,
        homeCoverDiagram: pickCell(tempData.homeCoverDiagram || getHomeCover(), homeCover)
      }
    }
    if (flag) {
      return {
        dataSource: updateAllEntity({
          ...tempData,
          viewGroups,
        }, tabsAllData?.diagram || []),
        result: {
          status: true,
        },
      };
    }
    return {
      dataSource,
      result: {
        status: true,
      },
    };
  }
  return { result: { status: false, message } };
};

const updateAllEntity = (dataSource, diagrams) => {
  const calcCorrelations = () => {
    return (diagrams || []).reduce((a, b) => {
      const cells = b?.cells || [];
      const allTable = cells.filter(c => c.shape === 'table');
      return a.concat(cells.filter(c => c.shape === 'erdRelation').map(cell => {
        const sourceId = _.get(cell, 'source.cell', '');
        const targetId = _.get(cell, 'target.cell', '');
        const relation = (cell.relation || '').split(':');
        const erRelation = ['n', '0,1', '0,n', '1', '1,n', '0']
        const status = erRelation.includes(relation[0]);
        const myEntity = allTable
          .filter(t => t.id === (status ? sourceId : targetId))[0]?.originKey;
        const refEntity = allTable
          .filter(t => t.id === (status ? targetId : sourceId))[0]?.originKey;
        if (myEntity && refEntity) {
          return {
            myEntity,
            myField: _.get(cell, status ? 'source.portOrigin' : 'target.portOrigin', '')
                .split(separator)[0] || _.get(cell, status ? 'source.port' : 'target.port', '')
              .split(separator)[0],
            refEntity,
            refField: _.get(cell, status ? 'target.portOrigin' : 'source.portOrigin', '')
                .split(separator)[0] || _.get(cell, status ? 'target.port' : 'source.port', '')
              .split(separator)[0],
            myRows: (status ? relation[0] : relation[1]) || '',
            refRows: (status ? relation[1] : relation[0]) || '',
            innerType: '',
          }
        }
        return null;
      }).filter(c => !!c));
    }, []);
  };
  const correlations = calcCorrelations();
  return {
    ...dataSource,
    entities: (dataSource.entities || []).map(e => {
      const current = correlations
        .filter(c => c.myEntity === e.id)
        .map(c => _.omit(c, 'myEntity'));
      if (current) {
        return {
          ...e,
          correlations: current,
        }
      }
      return e;
    })
  };
};

export const importFields = (entities, fields, data, useDefaultFields, onlyEntityFields) => {
  const allFields = [...(data?.fields || [])].filter(f => !f.refEntity); // 过滤掉从实体中获取的
  if (useDefaultFields) {
    allFields.push(...emptyProjectTemplate.profile.default.entityInitFields
      .map(f => ({...f, id: Math.uuid()})));
  }
  const allFieldKeys = allFields.map(f => f.defKey);
  const newFields = fields.map((v) => {
    const splitArray = v.split(separator);
    const entity = splitArray[0];
    const field = splitArray[1];
    const tempEntity = entities?.filter(e => e.id === entity)[0] || {};
    const tempField = tempEntity?.fields?.filter(f => f.id === field)[0] || {};
    const tempKey = validateKey(tempField.defKey, allFieldKeys);
    allFieldKeys.push({defKey: tempKey});
    return {
      ...tempField,
      id: Math.uuid(),
      defKey: tempKey,
      refEntity: entity,
      refEntityField: field,
    };
  });
  return onlyEntityFields ? newFields : newFields.concat(allFields);
};

export const validateKey = (key, fields) => {
  // 校验字段名是否重复 自动进行数字递增
  const keys = fields.map(f => f.defKey || f);
  if (keys.includes(key)) {
    // 1.判断是否有数字结尾
    const matchData = key.match(/(\d+)$/);
    if (!matchData) {
      return validateKey(`${key}1`, fields);
    }
    return validateKey(`${key.split(matchData[0])[0]}${(parseInt(matchData[0], 10) + 1)}`, fields);
  }
  return key;
};

export const getDemoDbConnect = () => {
  return {
    mysql: {
      defKey: FormatMessage.string({id: 'dbConnect.demoDbConnect.mysql_defKey'}),
      url: FormatMessage.string({id: 'dbConnect.demoDbConnect.mysql'}),
      driverClass: 'com.mysql.cj.jdbc.Driver',
    },
    'mysql-information_schema': {
      defKey: FormatMessage.string({id: 'dbConnect.demoDbConnect.mysql-information_schema_defKey'}),
      url: FormatMessage.string({id: 'dbConnect.demoDbConnect.mysql_schema'}),
      driverClass: 'com.mysql.cj.jdbc.Driver',
    },
    oracle: {
      defKey: FormatMessage.string({id: 'dbConnect.demoDbConnect.oracle_defKey'}),
      url: FormatMessage.string({id: 'dbConnect.demoDbConnect.oracle'}),
      driverClass: 'oracle.jdbc.driver.OracleDriver',
    },
    'oracle-all_tables': {
      defKey: FormatMessage.string({id: 'dbConnect.demoDbConnect.oracle-all_tables_defKey'}),
      url: FormatMessage.string({id: 'dbConnect.demoDbConnect.oracle_all_tables'}),
      driverClass: 'oracle.jdbc.driver.OracleDriver',
    },
    sqlserver: {
      defKey: FormatMessage.string({id: 'dbConnect.demoDbConnect.sqlserver_defKey'}),
      url: FormatMessage.string({id: 'dbConnect.demoDbConnect.sqlserver'}),
      driverClass: 'com.microsoft.sqlserver.jdbc.SQLServerDriver',
    },
    postgresql: {
      defKey: FormatMessage.string({id: 'dbConnect.demoDbConnect.postgresql_defKey'}),
      url: FormatMessage.string({id: 'dbConnect.demoDbConnect.postgresql'}),
      driverClass: 'org.postgresql.Driver',
    },
    'postgresql_chema': {
      defKey: FormatMessage.string({id: 'dbConnect.demoDbConnect.postgresql_chema_defKey'}),
      driverClass: 'org.postgresql.Driver',
      url: FormatMessage.string({id: 'dbConnect.demoDbConnect.postgresql_chema'})
    },
    db2: {
      defKey: FormatMessage.string({id: 'dbConnect.demoDbConnect.db2_defKey'}),
      url: FormatMessage.string({id: 'dbConnect.demoDbConnect.db2'}),
      driverClass: 'com.ibm.db2.jcc.DB2Driver',
    },
    dm: {
      defKey: FormatMessage.string({id: 'dbConnect.demoDbConnect.dm_defKey'}),
      url: FormatMessage.string({id: 'dbConnect.demoDbConnect.dm'}),
      driverClass: 'dm.jdbc.driver.DmDriver',
    },
    dm_1: {
      defKey: FormatMessage.string({id: 'dbConnect.demoDbConnect.dm_defKey_1'}),
      url: FormatMessage.string({id: 'dbConnect.demoDbConnect.dm_1'}),
      driverClass: 'dm.jdbc.driver.DmDriver',
    },
    gaussdb: {
      defKey: FormatMessage.string({id: 'dbConnect.demoDbConnect.gaussdb_defKey'}),
      driverClass: 'org.postgresql.Driver',
      url: FormatMessage.string({id: 'dbConnect.demoDbConnect.gaussdb'}),
    },
    kingbase: {
      defKey: FormatMessage.string({id: 'dbConnect.demoDbConnect.kingbase_defKey'}),
      driverClass: 'com.kingbase8.Driver',
      url: FormatMessage.string({id: 'dbConnect.demoDbConnect.kingbase'}),
    },
    maxcompute: {
      defKey: FormatMessage.string({id: 'dbConnect.demoDbConnect.maxcompute_defKey'}),
      driverClass: 'com.aliyun.odps.jdbc.OdpsDriver',
      url: FormatMessage.string({id: 'dbConnect.demoDbConnect.maxcompute'}),
    },
    sqlite: {
      defKey: FormatMessage.string({id: 'dbConnect.demoDbConnect.sqlite_defKey'}),
      driverClass: 'org.sqlite.JDBC',
      url: FormatMessage.string({id: 'dbConnect.demoDbConnect.sqlite'}),
    },
    'hive-MySQL': {
      defKey: FormatMessage.string({id: 'dbConnect.demoDbConnect.hive-MySQL_defKey'}),
      driverClass: 'com.mysql.cj.jdbc.Driver',
      url: FormatMessage.string({id: 'dbConnect.demoDbConnect.hive_MySQL'}),
    },
    'hive-PostgreSQL': {
      defKey: FormatMessage.string({id: 'dbConnect.demoDbConnect.hive-PostgreSQL_defKey'}),
      driverClass: 'org.postgresql.Driver',
      url: FormatMessage.string({id: 'dbConnect.demoDbConnect.hive_PostgreSQL'})
    },
    'gbase': {
      defKey: FormatMessage.string({id: 'dbConnect.demoDbConnect.gbase_defKey'}),
      driverClass: 'com.gbasedbt.jdbc.Driver',
      url: FormatMessage.string({id: 'dbConnect.demoDbConnect.GBase'})
    },
    'Doris': {
      defKey: FormatMessage.string({id: 'dbConnect.demoDbConnect.doris_defKey'}),
      url: FormatMessage.string({id: 'dbConnect.demoDbConnect.mysql'}),
      driverClass: 'com.mysql.cj.jdbc.Driver',
    },
    'HighGo': {
      defKey: FormatMessage.string({id: 'dbConnect.demoDbConnect.highgo_defKey'}),
      url: FormatMessage.string({id: 'dbConnect.demoDbConnect.highgo'}),
      driverClass: 'com.highgo.jdbc.Driver',
    }
  }
};

export const emptyDbConn = {
  defKey: '',
  defName: '',
  type: '',
  properties: {
    driver_class_name: '',
    url: '',
    username: '',
    password: '',
  }
};

export const emptyField = {
  defKey: '',
  defName: '',
  comment: '',
  type: '',
  len: '',
  scale: '',
  primaryKey: false,
  notNull: false,
  autoIncrement: false,
  defaultValue: '',
  hideInGraph: false,
  refDict: '',
  baseType: ''
};

export const emptyIndex = {
  defKey: '',
  defName: null,
  unique: false,
  comment: '',
  fields: [],
};

export const emptyStandardGroup = {
  defKey: '',
  defName: '',
  fields: [],
};

export const emptyDomain = {
  defKey: '',
  defName: '',
  applyFor: '',
  len: '',
  scale: '',
  uiHint: '',
  id: ''
};

export const emptyDataType = {
  defKey: '',
  defName: '',
};

export const emptyDataTypeSupport = {
  defKey: '',
}

export const emptyCodeTemplate = {
  applyFor: '',
  type: '',
};

export const emptyDict = {
  defKey: '',
  defName: '',
  sort: '',
  intro: '',
  id: '',
  items: [],
};

export const emptyDictItem = {
  defKey: '',
  defName: '',
  sort: '',
  parentKey: '',
  intro: '',
  enabled: true,
  attr1: '',
  attr2: '',
  attr3: ''
};

export const emptyRelation = {
  defKey: '',
  defName: '',
  relationType: 'field',
  canvasData: {}
};

export const emptyRule = {
  id: '',
  defName: '',
  intro: '',
  controlIntensity: '',
  applyObjectType: '',
  applyFieldType: '',
  programCode: '',
  enable: true
}

export const validateStandardFields = (data) => {
  const calcData = (d, format) => {
    const repeatData = d.reduce((p, n) => {
      if(!p[n.defKey]) {
        p[n.defKey] = [];
      }
      p[n.defKey] = p[n.defKey].concat(n);
      return p;
    }, {});
    const repeatGroupArray = Object.keys(repeatData)
        .map(k => {
          if (repeatData[k].length > 1) {
            return format(repeatData[k]);
          }
          return ''
        }).filter(k => !!k);
    if(repeatGroupArray.length > 0) {
      return repeatGroupArray.join(';')
    }
    return '';
  }
  // 分组名或字段名不能为空或重复
  const fields = data.reduce((a, b) => a.concat((b.fields || [])
      .map(f => ({...f, g: b.defKey}))), []);
  if(data.some(d => !d.defKey)) {
    return FormatMessage.string({id: 'standardFields.groupNotAllowEmpty'})
  }
  const emptyFields = fields.filter(f => !f.defKey);
  if (emptyFields.length > 0) {
    return emptyFields.map(f => {
      return FormatMessage.string({
        id: 'standardFields.standardFieldNotAllowEmpty',
        data: {defKey: f.g}
      })
    }).join(';')
  }
  // 判断分组是否重复
  const repeatGroup = calcData(data, (d) => {
    return FormatMessage.string({
      id: 'standardFields.groupNotAllowRepeat',
      data: {defKey: d[0].defKey}
    })
  })
  if(repeatGroup) {
    return repeatGroup
  }
  // 判断字段是否重复
  const repeatFields = calcData(fields, (d) => {
    return FormatMessage.string({
      id: 'standardFields.standardFieldNotAllowRepeat',
      data: {data: d.map(f => `${f.g} => ${f.defKey}`).join('/')
      }
    })
  })
  if(repeatFields) {
    return repeatFields
  }
}

export const validateDictBase = (dict) => {
  const items = (dict.items || []).map(d => d.defKey);
  return dict.defKey && (items.length === new Set(items).size)
      && (items.length === items.filter(i => !!i).length)
};

export const validate = (items, emptyObj, name) => {
  // 校验数据否符合规范
  const fieldNames = Object.keys(emptyObj);
  if (!items.some(i => Object.keys(i).some(n => !fieldNames.includes(n)))) {
    return items;
  }
  throw Error(`invalid${name}`);
};

export const validateItemInclude = (item, empty) => {
  const fieldNames = Object.keys(empty);
  const itemNames = Object.keys(item);
  return fieldNames.every(f => itemNames.includes(f));
};

export const validateItem = (item, empty) => {
  const fieldNames = Object.keys(empty);
  return !Object.keys(item)
    .some(n => !fieldNames.includes(n));
};

export const validateIndexes = (indexes) => {
  // 校验索引是否符合规范
  const fieldNames = Object.keys(emptyIndex);
  const nameResult = indexes.some(f => Object.keys(f).some(n => !fieldNames.includes(n)));
  if (!nameResult) {
    return indexes.map(i => ({
      defName: i?.defName || null,
      isUnique: i?.isUnique || false,
      fields: i?.fields || [],
    }));
  }
  throw Error('invalidIndexes');
};

export const validateFields = (fields) => {
  // 校验字段是否符合规范
  return fields.filter(f => f.defKey).map(f => ({
    defKey: f?.defKey || f?.name || '',
    defName: f?.defName || f?.chnname || '',
    comment: f?.comment || f?.remark || '',
    type: f?.type,
    len: f?.len || '',
    scale: f?.scale || '',
    primaryKey: f?.primaryKey || f?.pk || false,
    notNull: f?.notNull || false,
    autoIncrement: f?.autoIncrement || false,
    defaultValue: f?.defaultValue || '',
    hideInGraph: f?.hideInGraph || f?.relationNoShow || false,
    domain: f?.domain || f?.dbType,
    refDict: f?.refDict || '',
    extProps: f?.extProps || {},
    notes: f?.notes || {},
    ...attNames.reduce((p, n) => {
      return {
        ...p,
        [n]: f?.[n] || ''
      }
    }, {})
  }))
};

export const getEntityOrViewByName = (dataSource, name) => {
  const entity = (dataSource?.entities || []).find(e => e.id === name);
  if (!entity) {
    return (dataSource?.views || []).find(e => e.id === name);
  }
  return entity;
};

export const getProjectName = (path = '', separator) => {
  // 1.不同的操作系统文件名的分隔符不同 此处需要统一转化为'\'
  const realPath = path.replace('/', '\\');
  const paths = realPath.split('\\');
  return paths[paths.length - 1].split(separator)[0];
};

const fieldsTransform = (f, domains, mapping, db) => {
  const data = domains.filter(d => d.defKey === f.type)[0] || {};
  const realType = ((mapping || []).filter(d => d.defKey === data.applyFor)[0] || {})[db];
  return {
    defKey: f?.name || '',
    defName: f?.chnname || '',
    comment: f?.remark || '',
    domain: f?.type || '',
    type: realType || '',
    len: data?.len || '',
    scale: data?.scale || '',
    primaryKey: f?.pk || false,
    notNull: f?.notNull || false,
    autoIncrement: f?.autoIncrement || false,
    defaultValue: f?.defaultValue || '',
    hideInGraph: f?.relationNoShow || false,
  };
};

const indexesTransform = (i) => {
  return {
    defKey : i.name,
    unique : i.isUnique,
    defName : null,
    comment : "",
    fields : (i.fields || []).map(f => {
      return {
        ascOrDesc: 'A',
        fieldDefKey: f
      }
    }),
  }
}

export const attEditType = ['TextInput', 'CheckBox', 'DropDown', 'DropDownMulti', 'NumberInput', 'TextArea'];

export const attNames = ['attr1', 'attr2', 'attr3', 'attr4', 'attr5', 'attr6', 'attr7', 'attr8', 'attr9'];

export const getAttNamesValue = (name) => {
  return FormatMessage.string({id: `config.column.${name}`})
}

export const getColumnWidth = () => {
  return {
    refEntity: 100,
    refDict: 250,
    hideInGraph: 80,
    defKey: 200,
    defName: 200,
    primaryKey: 70,
    notNull: 90,
    autoIncrement: 70,
    domain: 110,
    type: 150,
    len: 70,
    scale: 100,
    comment: 300,
    defaultValue: 200,
    isStandard: 100,
    intro: 200,
    uiHint: 100,
    extProps: 100,
    ...attNames.reduce((p, n) => {
      return {
        ...p,
        [n]: 300
      }
    }, {})
  };
};

export const getStandardGroupColumns = () => {
  return [
    {
      refKey: 'defKey',
      value: FormatMessage.string({id: 'standardFields.groupCode'}),
      com: 'Input',
    },
    {
      refKey: 'defName',
      value: FormatMessage.string({id: 'standardFields.groupName'}),
      com: 'Input',
    }
  ]
};

export const getFullColumns = () => {
  return [
    {code: 'relationNoShow', value: FormatMessage.string({id: 'tableHeaders.hideInGraph'}), newCode: 'hideInGraph', com: 'Icon', relationNoShow: true},
    {code: 'name', value: FormatMessage.string({id: 'tableHeaders.defKey'}), newCode: 'defKey', com: 'Input', relationNoShow: false},
    {code: 'chnname', value: FormatMessage.string({id: 'tableHeaders.defName'}), newCode: 'defName', com: 'Input', relationNoShow: false},
    {code: 'pk', value: FormatMessage.string({id: 'tableHeaders.primaryKey'}), newCode: 'primaryKey', com: 'Checkbox', relationNoShow: false},
    {code: 'notNull', value: FormatMessage.string({id: 'tableHeaders.notNull'}), newCode: 'notNull', com: 'Checkbox', relationNoShow: true},
    {code: 'autoIncrement', value: FormatMessage.string({id: 'tableHeaders.autoIncrement'}), newCode: 'autoIncrement', com: 'Checkbox', relationNoShow: true},
    {code: 'type', value: FormatMessage.string({id: 'tableHeaders.domain'}), newCode: 'domain', com: 'Select', relationNoShow: true},
    {code: 'dataType', value: FormatMessage.string({id: 'tableHeaders.dbType'}), newCode: 'type', com: 'Text', relationNoShow: false},
    {code: 'len', value: FormatMessage.string({id: 'tableHeaders.len'}), newCode: 'len', com: 'Input', relationNoShow: false},
    {code: 'scale', value: FormatMessage.string({id: 'tableHeaders.scale'}), newCode: 'scale', com: 'Input', relationNoShow: false},
    {code: 'remark', value: FormatMessage.string({id: 'tableHeaders.remark'}), newCode: 'comment', com: 'Input', relationNoShow: true},
    {code: 'refDict', value: FormatMessage.string({id: 'tableHeaders.refDict'}), newCode: 'refDict', com: 'SearchSelect', relationNoShow: true},
    {code: 'defaultValue', value: FormatMessage.string({id: 'tableHeaders.defaultValue'}), newCode: 'defaultValue', com: 'Input', relationNoShow: true},
    {code: 'isStandard', value: FormatMessage.string({id: 'standardFields.isStandard'}), newCode: 'isStandard',com: 'label', relationNoShow: false},
    {code: 'uiHint', value: FormatMessage.string({id: 'tableHeaders.uiHint'}), newCode: 'uiHint',com: 'Select', relationNoShow: true},
    {code: 'extProps', value: FormatMessage.string({id: 'tableHeaders.extProps'}), newCode: 'extProps',com: 'linkButton', relationNoShow: true},
  ]; // 完整的头部信息
};

export const getViewColumn = () => {
  const headers = getFullColumns();
  headers.splice(2, 0, {code: 'refEntity', value: FormatMessage.string({id: 'tableHeaders.refEntity'}), newCode: 'refEntity', com: 'label', relationNoShow: true});
  return headers;
}

export const getLogicHeaders = () => {
  return [{
    refKey: 'defKey',
    newCode: 'defKey',
    value: FormatMessage.string({id: 'logicEntity.field.defKey'}),
    hideInGraph: false,
  },
    {
      refKey: 'defName',
      newCode: 'defName',
      value: FormatMessage.string({id: 'logicEntity.field.defName'}),
      hideInGraph: false,
    },
    {
      refKey: 'primaryKey',
      newCode: 'primaryKey',
      value: FormatMessage.string({id: 'logicEntity.field.primaryKey'}),
      hideInGraph: false,
    },
    {
      refKey: 'baseType',
      newCode: 'baseType',
      value: FormatMessage.string({id: 'logicEntity.field.baseType'}),
      hideInGraph: false,
    }];
}

export const getDefaultLogicSys = () => {
  return {
    fieldInputSuggest: false,
    lePropOrient: 'V',
    propShowFields: ['N', 'K', 'T'],
    nameTemplate: '{defKey}[{defName}]',
  }
}

export const getEmptyEntity = (fields = [], properties = {}) => {
  return {
    id: Math.uuid(),
    env: {
      base: {
        nameSpace: '',
        codeRoot: '',
      }
    },
    defKey: '',
    defName: '',
    comment: '',
    properties,
    sysProps: {
      nameTemplate: '{defKey}[{defName}]',
    },
    notes: {},
    headers: getFullColumns()
      .map(h => ({
        freeze: !!(h.newCode === 'defKey' ||  h.newCode === 'defName'),
        refKey: h.newCode,
        hideInGraph: h.relationNoShow,
      })),
    fields,
    correlations: [],
    indexes: [],
    type: 'P'
  };
};

export const emptyGroup = {
  defKey: '',
  defName: '',
  refEntities:[],
  refViews:[],
  refDiagrams:[],
  refDicts:[]
};

export const getEmptyView = () => {
  return {
    ...getEmptyEntity(),
    headers: getViewColumn()
    .map(h => ({
      refKey: h.newCode,
      hideInGraph: h.relationNoShow,
    })),
    refEntities: [],
  }
};

export const emptyDiagram = {
  defKey: '',
  defName: '',
  id: '',
  comment: '',
  relationType: 'field',
  canvasData: {}
};

export const defaultTemplate = {
  dbDDLTemplate: ['createTable', 'createView', 'deleteTable', 'createIndex', 'deleteIndex'],
  appCodeTemplate: ['content'],
  //versionTemplate: ['renameTable', 'addField', 'updateField', 'deleteField'],
  versionTemplate: ['message', 'update'],
};

export const pdman2sino = (data, projectName) => {
  if (!data.modules) {
    //return data;
  }
  moment().local();
  const entities = _.get(data, 'modules', []).reduce((a, b) => a.concat(b.entities), [])
  const defaultDb = _.get(data, 'profile.dbs', []).filter(d => d.defaultDB)[0] || {};
  const mappings = _.get(emptyProjectTemplate, 'dataTypeMapping.mappings', []); // 使用默认的mappings
  const defaultDomains = _.get(emptyProjectTemplate, 'domains', []); // 使用默认的domains
  const domains = defaultDomains.concat(_.get(data, 'dataTypeDomains.datatype', []).map(d => {
    // 从已知的数据域中寻找包含数字的数据类型（为了保证最大的兼容性）
    // 判断是否存在反之则需要创建新的
    if (defaultDomains.findIndex(defaultD => defaultD.defKey === d.code) < 0) {
      // 如果默认的domains中没有
      const apply = d.apply || {};
      const applyArray = Object.keys(apply);
      const javaIndex = applyArray.findIndex(p => p.toLocaleLowerCase() === 'java');
      // 取java的mapping或者第一个
      const applyFor = (apply[applyArray[javaIndex]]
        || apply[applyArray[0]] || {})?.type?.toLocaleLowerCase()?.replace(/\(\d+,*\d*\)/g, '');
      if (!applyFor) {
        // 不存在任何的domain 无效的dataType
        return null;
      }
      // 判断mapping是否已经存在
      if (mappings.findIndex(map => map.defKey === applyFor) < 0) {
        // 需要增加
        mappings.push({
          defKey: applyFor,
          defName: `${d.name || applyFor}`,
          ...(applyArray.reduce((a, b) => {
            a[b] = (apply[b]?.type || '').replace(/\(\d+,*\d*\)/g, '');
            return a;
          }, {}))
        });
      }
      const data = applyArray.filter(p => /(\d+,*\d*)/g.test(apply[p]?.type || '')).map(p => {
        const length = (apply[p]?.type?.match(/(\d+,*\d*)/g)[0] || '0').split(',').map(l => parseInt(l, 10));
        return {
          len: length[0] || '',
          scale: length[1] || ''
        }
      })[0] || {
        len: '',
        scale: ''
      };
      return {
        defKey: d.code || '',
        defName: `${d.name || ''}_${d.code}`,
        applyFor: applyFor,
        len: data.len,
        scale: data.scale
      }
    }
    return null;
  }).filter(d => !!d));
  /*
  *
  *
  *
  * */
  const calcId = (anchorIndex, nodeId, nodes) => {
    const index = parseInt((anchorIndex / 2), 10);
    const node = nodes.filter(n => n.id === nodeId)[0];
    const tabName = node?.title.split(':')[0];
    const table = entities.filter(t => t.title === tabName)[0];
    const field = table?.fields[index] || '';
    return `${field.name}${separator}${anchorIndex % 2 === 0 ? 'in' : 'out'}`;
  };
  const diagrams = data?.modules?.reduce((a, b) => a.concat({
        defKey: `${b.name}-GRAPH-CANVAS`,
        defName: `${b.chnname || b.name}-${FormatMessage.string({id: 'relation.graphCanvas'})}`,
        canvasData: {
          cells: (b?.graphCanvas?.nodes?.map(n => {
            const titleArray = n.title.split(':');
            return {
              id: n.id,
              shape: 'table',
              position: {
                x: n.x,
                y: n.y,
              },
              originKey: titleArray[0],
              count: parseInt(titleArray[1] || 0, 10),
            };
          }) || []).concat((b?.graphCanvas?.edges || []).map(e => {
            return {
              id: e.id,
              relation: e.relation || '1:n',
              shape: 'erdRelation',
              source: {
                cell: e.source,
                port: calcId(e.sourceAnchor, e.source, b?.graphCanvas?.nodes || [])
              },
              target: {
                cell: e.target,
                port: calcId(e.targetAnchor, e.target, b?.graphCanvas?.nodes || [])
              },
              vertices: e.pointers && e.pointers.slice(1, e.pointers.length - 1) || [],
            }
          }) || []),
        }
      }), []);
  const columnOrder = getFullColumns();
  const database = _.get(data, 'dataTypeDomains.database', []);
  const defaultDbType = database[0]?.code || 'MYSQL'; // 如果未设置默认的数据类型 则默认为第一个
  const relations = _.get(data, 'modules', []).reduce((a, b) => a.concat(b?.associations || []), []); // 所有的关联关系
  const dataTypeSupports = database.map(d => d.code);
  const name = getProjectName(projectName, '.pdman.json');
  return {
    name: name || '',
    describe: name || '',
    avatar: '',
    version: '3.0.0',
    createdTime: moment().format('YYYY-M-D HH:mm:ss'),
    updatedTime: '', // 最后一次的保存时间
    dbConns: _.get(data, 'profile.dbs', [])
      .map(conn => ({
        ..._.omit(conn, ['defaultDB', 'name']),
        defKey: conn.name || Math.uuid(),
        defName: conn.name || '',
      })),
    profile: {
      default: {
        db: defaultDb?.type || defaultDbType,
        dbConn: defaultDb?.name || '',
        entityInitFields: _.get(data, 'profile.defaultFields', [])
          .map(f => fieldsTransform(f, domains, mappings, defaultDb?.type || defaultDbType)),
      },
      javaHome: _.get(data, 'profile.javaConfig.JAVA_HOME', ''),
      sql: { delimiter: _.get(data, 'profile.sqlConfig', '') },
      dataTypeSupports,
      codeTemplates: database.map(d => {
        if (d.code.toLocaleUpperCase() === 'JAVA') {
          return {
            applyFor: 'JAVA',
            referURL: '',
            type: 'appCode',
            content : d.createTableTemplate || d.template
          };
        } else {
          return {
            applyFor: d.code,
            referURL: '',
            type: 'dbDDL',
            createTable: d.createTableTemplate || d.template,
            createIndex: d.createIndexTemplate || '',
          };
        }
      }),
      generatorDoc: {
        docTemplate: _.get(data, 'profile.wordTemplateConfig', ''),
      }
    },
    entities: entities.map(e => {
      const nameTemplate = (e.nameTemplate || '{defKey}[{defName}]')
        .replace('code', 'defKey')
        .replace('name', 'defName');
      // 找出所有与当前实体有关联的关系
      const relation = relations
        .filter(r => _.get(r, 'from.entity', '') === e.title)
        .map((r) => {
          const rowsData = (r.relation || '').split(':');
          return {
            myField: _.get(r, 'from.field', ''),
            refEntity: _.get(r, 'to.entity', ''),
            refField: _.get(r, 'to.field', ''),
            myRows: rowsData[0] || '',
            refRows: rowsData[1] || '',
            innerType: '',
          };
        });
      const headers = _.get(e, 'headers', []);
      columnOrder.forEach(c => {
        if (!headers.map(h => (h.fieldName || h.code)).includes(c.code)) {
          headers.push(c);
        }
      });
      return {
        defKey: e.title || '',
        defName: e.chnname || '',
        comment: e.remark || '',
        properties: { partitionBy : ''},
        nameTemplate: nameTemplate,
        headers: headers.map(h => {
          const fullData = columnOrder.filter(c => c.code === (h.fieldName || h.code)).map(c => ({...c, ...h}))[0];
          return {
            refKey: fullData.newCode || '',
            hideInGraph: fullData.relationNoShow || false,
          }
        }),
        fields: _.get(e, 'fields', [])
          .map(f => fieldsTransform(f, domains, mappings, defaultDb?.type || defaultDbType)),
        indexes: _.get(e, 'indexs', []).map(i => indexesTransform(i)),
        correlations: relation,
      }
    }),
    views: [], // pdman不支持视图 此处默认为空数组
    diagrams,
    dicts: [],
    viewGroups: _.get(data, 'modules', []).map(m => {
      return {
        defKey: m.name || '',
        defName: m.chnname || '',
        refEntities: (m.entities || []).map(e => e.title),
        refDiagrams: [`${m.name}-GRAPH-CANVAS`],
        refViews: [],
        refDicts: [],
      }
    }),
    dataTypeMapping: {
      referURL: '',
      mappings,
    },
    domains,
  };
};

export const generatorTableKey = (defKey, dataSource, name = 'entities', compare) => {
  const allData = (dataSource?.[name] || []);
  const defaultCompare = (key, data) => {
    return !data.map(e => e.defKey).includes(key);
  }
  const currentCompare = compare || defaultCompare;
  if (currentCompare(defKey, allData)) {
    return defKey;
  } else {
    const key = defKey.split('_');
    return generatorTableKey(`${key.slice(0, key.length - 1).join('_')}_${parseInt(key[key.length - 1]) + 1}`, dataSource, name, compare);
  }
}

export const generatorKey = (newKey, data) => {
  if (!data.includes(newKey.toLocaleLowerCase())) {
    return newKey;
  } else {
    return generatorKey(`${newKey}_1`, data);
  }
}
// 缓存文本宽度 减少dom计算渲染
let textWidthCache = {};
export  const getTextWidth = (text, font, weight = 'normal') => {
  if(text in textWidthCache) {
    return textWidthCache[text]
  }
  let dom = document.getElementById('calcTextWidth');
  if (!dom) {
    dom = document.createElement('div');
    dom.setAttribute('id', 'calcTextWidth');
    dom.style.display = 'inline-block';
    dom.style.fontWeight = weight;
    dom.style.fontSize = `${font}px`;
    document.body.appendChild(dom);
  }
  dom.innerText = typeof text === 'string' ?
    text.replace(/\r|\n|\r\n/g, '')
    : text;
  const width =  dom.getBoundingClientRect().width;
  if(Object.keys(textWidthCache).length > 1000000) {
    // 如果缓存数量超过百万 则清除数据 释放内存
    textWidthCache = {}
  }
  const realWidth = Math.ceil(width);
  textWidthCache[text] = realWidth;
  return realWidth;
};
// 缓存文本宽度 减少dom计算渲染
let textHeightCache = {};
export  const getTextHeight = (text, font, width, weight = 'normal') => {
  const textKey = `${text}${width}`;
  if(textKey in textHeightCache) {
    return textHeightCache[textKey]
  }
  let dom = document.getElementById('calcTextHeight');
  if (!dom) {
    dom = document.createElement('div');
    dom.setAttribute('id', 'calcTextHeight');
    dom.style.display = 'inline-block';
    dom.style.fontWeight = weight;
    dom.style.fontSize = `${font}px`;
    dom.style.width = `${width}px`;
    dom.style.wordBreak = 'break-all';
    document.body.appendChild(dom);
  }
  dom.innerText = typeof text === 'string' ?
      text.replace(/\r|\n|\r\n/g, '')
      : text;
  const height =  dom.getBoundingClientRect().height;
  if(Object.keys(textHeightCache).length > 1000000) {
    // 如果缓存数量超过百万 则清除数据 释放内存
    textHeightCache = {}
  }
  textHeightCache[textKey] = Math.ceil(height);
  return textHeightCache[textKey];
};

export const reset = (f, dataSource, [key, id]) => {
  // domains,dicts,uiHint
  // 将defKey重置回去
  return {
    ...f,
    domain: f.domain ? (dataSource.domains.filter(d => d[key] === f.domain)[0]?.[id] || '') : '',
    refDict: f.refDict ? (dataSource.dicts.filter(d => d[key] === f.refDict)[0]?.[id] || '') : '',
    uiHint: f.uiHint ? (dataSource.uiHint.filter(d => d[key] === f.uiHint)[0]?.[id] || '') : '',
  };
};

export const transform = (...args) => {
  // 获取该数据表需要显示的字段
  return _transform(...args);
};

// 默认数据库发生了变更需要重新调整所有字段的数据类型
const updateFieldType = (d, mappings, db, old) => {
  return {
    ...d,
    fields: (d?.fields || []).map(f => {
      if (!f.domain) {
        return {
          ...f,
          type: mappings.filter(m => m[old] === f.type)[0]?.[db] || f.type,
        };
      }
      return f;
    }),
  }
}
const transformDataSource = (d, old) => {
  const db = d?.profile?.default?.db || '';
  if (db !== old) {
    const mappings = d?.dataTypeMapping?.mappings || [];
    return {
      ...d,
      views: (d.views || []).map(v => updateFieldType(v, mappings, db, old)),
      entities: (d.entities || []).map(e => updateFieldType(e, mappings, db, old)),
    };
  }
  return d;
};

export const transformFieldType = (dataSource, old) => {
  // 调整标签页的内容
  const allTab = getAllTabData();
  const mappings = dataSource?.dataTypeMapping?.mappings || [];
  Object.keys(allTab).map(t => ({tabKey: t, tabData: allTab[t]})).forEach(t => {
    if (t.tabData.type === 'entity' || t.tabData.type === 'view') {
      const d = updateFieldType(t.tabData.data, mappings, dataSource?.profile?.default?.db, old);
      replaceDataByTabId(t.tabKey, {
        ...t.tabData,
        data: d,
      });
      notify('tabDataChange', {id: t.tabData.key, d});
    }
  });
  return transformDataSource(dataSource, old);
}

export const updateBaseType = (dataSource, domain) => {
  const updateFieldBaseType = (d) => {
    return {
      ...d,
      fields: (d.fields || []).map(f => {
        if((f.domain === domain.id) && (f.baseType !== domain.applyFor)) {
          return {
            ...f,
            baseType: domain.applyFor
          };
        }
        return f;
      })
    }
  }
  return {
    ...dataSource,
    entities: (dataSource.entities || []).map(e => {
      return updateFieldBaseType(e)
    }),
    views: (dataSource.views || []).map(v => {
      return updateFieldBaseType(v)
    })
  }
}

export const transformTable = (data, dataSource, code, type = 'id', codeType = 'dbDDL') => {
  const fields = data.fields || [];
  const entities = dataSource.entities || [];
  return {
    ...data,
    fields: fields.map(field => {
      return {
        ...field,
        ...transform(field, dataSource, code, 'id', codeType),
      }
    }),
    indexes: (data.indexes || []).map(i => {
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
    correlations: (data.correlations || []).map(c => {
      const refEntityData = entities.find(e => e.id === c.refEntity);
      return {
        ...c,
        myField: fields.find(field => field.id === c.myField)?.defKey,
        refEntity: refEntityData?.defKey,
        refField: (refEntityData.fields || []).find(field => field.id === c.refField)?.defKey,
      }
    })
  }
}

export const getTitle = (data) => {
  const tempDisplayMode = data?.sysProps?.nameTemplate || '{defKey}[{defName}]';
  return tempDisplayMode.replace(/\{(\w+)\}/g, (match, word) => {
    return data[word] || data.defKey || '';
  });
};

export  const calcNodeData = ({data: preData, needTransform = true, ...rest},
                              nodeData, dataSource, groups) => {
  const size = rest.autoSize ? null : rest.size
  // 节点源数据
  let headers = (nodeData?.headers || []).filter(h => {
    const columnOthers = (dataSource?.profile?.headers || [])
        .filter(c => c.refKey === h.refKey)[0] || {};
    return (!h.hideInGraph) && (columnOthers.enable !== false);
  });
    if(nodeData.type === 'L') {
        // 如果是逻辑模型，需要特殊处理
        const propShowFields = (nodeData?.sysProps?.propShowFields || []).concat('P')
        const refKeyMap = {
            defName: 'N',
            defKey: 'K',
            baseType: 'T',
            primaryKey: 'P'
        }
        headers = headers.filter(h => {
            return propShowFields.includes(refKeyMap[h.refKey])
        });
    }
    // 去除重复的字段
    const repeat = [];
    const filterFields = (data) => {
        return data.filter(d => {
            if(repeat.some(r => r.defKey === d.defKey)) {
                return false;
            } else {
                repeat.push(d)
                return true;
            }
        });
    };
  let fields = filterFields((nodeData?.fields || []).filter(f => !f.hideInGraph)
      .map(f => ({...f, ...(needTransform ? transform(f, dataSource) : {})
        , extProps: Object.keys(f.extProps || {}).length})));
  const pkFields = [];
  const normalFields = [];
  // 若果是逻辑模型
  if(nodeData.type === 'L') {
    fields.forEach(f => {
      if(f.primaryKey) {
        pkFields.push(f);
      } else {
        normalFields.push(f);
      }
    })
    if(pkFields.length > 0 && normalFields.length > 0) {
      normalFields[0] = {
        ...normalFields[0],
        __isFirst: true,
      }
    }
    fields = pkFields.concat(normalFields);
  }
  // 计算表头的宽度
  const headerText = `${getTitle(nodeData)}${nodeData.count > 0 ? `:${nodeData.count}` : ''}(${nodeData.defName})`;
  const headerWidth = getTextWidth(headerText, 12, 'bold') + 20 + (nodeData.comment ? 16 : 0);
  // 计算每一列最长的内容
  const maxWidth = {};
  const defaultWidth = {
    primaryKey: 40,// 主键和外键的默认宽度
    notNull: 70,// 非空默认宽度
  }
  const preFields = preData?.fields || [];
  fields.forEach((f) => {
    const preF = preFields.find(p => p.id === f.id);
    Object.keys(f)
        .filter(fName => headers.find(h => h.refKey === fName))
        .forEach((fName) => {
      if (!maxWidth[fName]) {
        maxWidth[fName] = 0;
      }
      const getFieldWidth = () => {
        const fieldValue = (f[fName] || '').toString();
        if (preF) {
          const preFieldValue = (preF[fName] || '').toString();
          if ((preFieldValue === fieldValue) && preData.originWidth?.[fName]) {
            return preData.originWidth[fName];
          }
          return getTextWidth(fieldValue, 12);
        }
        return getTextWidth(fieldValue, 12);
      };
      const fieldWidth = defaultWidth[fName] || getFieldWidth();
      if (maxWidth[fName] < fieldWidth) {
        maxWidth[fName] = fieldWidth;
      }
    });
  });
  // 计算矩形的宽高
  let width = headers.reduce((a, b) => {
    return a + (maxWidth[b.refKey] || 10) + 8;
  }, 0) + 16; // 内容宽度加上左侧边距
  if (width < headerWidth) {
    width = headerWidth;
  }
  // 高度除了字段还包含表名 所以需要字段 +1 同时需要加上上边距
  const height = (nodeData.type === 'L' && nodeData?.sysProps?.lePropOrient === 'H') ?
      (pkFields.length + 1) * 23 + 8 +
      getTextHeight(normalFields.map(f => {
        if(nodeData?.sysProps?.propShowFields?.includes('N')) {
          return f.defName || f.defKey;
        }
        return f.defKey || f.defName;
      }).join(';'), 12, width - 8) : (fields.length + 1) * 23 + 8;
  const realWidth = size ? size.width : width;
  const realHeight = size ? size.height : height;
  let sliceCount = -1;
  if(size) {
    sliceCount = Math.floor((size.height - 31) / 23) * 2;
  }
  const ports = groups ? {
    groups,
    items: fields.reduce((a, b, i) => {
      return a.concat([{
        group: 'in',
        args: { x: 0, y: 38 + i * 23 },
        id: `${b.id}${separator}in`,
      }, {
        group: 'out',
        args: { x: 0 + realWidth, y: 38 + i * 23 },
        id: `${b.id}${separator}out`,
      }]);
    }, []).map((item, i) => {
          if (size && sliceCount !== -1 && i >= sliceCount) {
            return {
              ...item,
              attrs: {
                circle: {
                  magnet: false,
                  style: {
                    // 隐藏锚点
                    opacity: 0,
                  },
                },
              },
            };
          }
      return item;
        }).concat([{
          group: 'in',
          args: { x: 0, y: realHeight - 6 },
          id: 'in_more',
          attrs: {
            circle: {
              magnet: false,
              style: {
                // 隐藏锚点
                opacity: 0,
              },
            },
          },
        }, {
          group: 'out',
          args: { x: realWidth, y: realHeight - 6 },
          id: 'out_more',
          attrs: {
            circle: {
              magnet: false,
              style: {
                // 隐藏锚点
                opacity: 0,
              },
            },
          },
        }])
        .concat([
      { group: 'extend',
        args: { x: (realWidth / 4), y: 0 },
        id: 'extend-1',
      },
      { group: 'extend',
        args: { x: (realWidth / 4) * 2 , y: 0 },
        id: 'extend-2',
      },
      { group: 'extend',
        args: { x: (realWidth / 4) * 3 , y: 0 },
        id: 'extend-3',
      },
      { group: 'extend',
        args: { x: (realWidth / 4), y: realHeight },
        id: 'extend-4',
      },
      { group: 'extend',
        args: { x: (realWidth / 4) * 2, y: realHeight },
        id: 'extend-5',
      },
      { group: 'extend',
        args: { x: (realWidth / 4) * 3, y: realHeight },
        id: 'extend-6',
      },
    ])} : {};
  const getRealMaxWidth = (w) => {
    if (size) {
      const allKeys = Object.keys(w).filter(n => headers.some(h => h.refKey === n));
      const finalWidth = realWidth - 16 - allKeys.length * 8;
      const keysWidth = allKeys.reduce((p, n) => p + w[n], 0);
      return allKeys.reduce((p, n) => {
        return {
          ...p,
          [n]: Math.ceil(w[n] / keysWidth * finalWidth)
        }
      }, {...w});
    }
    return w;
  }
  return {
    width: realWidth,
    height: realHeight,
    maxWidth: getRealMaxWidth(maxWidth),
    originWidth: maxWidth,
    fields,
    headers,
    ports,
  };
};

export const mapData2Table = (n, dataSource, updateFields, groups, commonPorts,
                              relationType, commonEntityPorts, nodeClickText) => {
  const isEntity = n.type !== 'L';
  const nodeData = dataSource?.[isEntity ? 'entities' : 'logicEntities']?.find(e => e.id === n.originKey);
  if (nodeData) {
    const { width, originWidth, height, fields, headers, maxWidth, ports } = calcNodeData(n, nodeData, dataSource, groups);
    return {
      ...n,
      size: {
        width,
        height,
      },
      ports: (relationType === 'entity' || !isEntity) ? (n.ports || commonEntityPorts) : ports,
      updateFields,
      nodeClickText,
      data: {
        ...nodeData,
        fields,
        headers,
        maxWidth,
        originWidth
      },
    };
  }
  return nodeData;
};

export const calcCellData = (cells = [], dataSource, updateFields, groups, commonPorts,
                             relationType, commonEntityPorts, nodeClickText) => {
  const defaultEditNodeSize = {
    width: 80,
    height: 60,
    minHeight: 20,
  };
  const defaultEditNodeCircleSize = {
    width: 80,
    height: 60,
    minHeight: 20,
  };
  const groupNodes = cells.filter(c => c.shape === 'group').map(c => {
    return {
      ...c,
      nodeClickText
    }
  });
  const remarks = cells.filter(c => c.shape === 'edit-node'
      || c.shape === 'edit-node-circle').map((n) => {
    return {
      ...n,
      nodeClickText,
      ports: n.ports || commonPorts,
      size: n.size || (n.shape === 'edit-node' ? defaultEditNodeSize : defaultEditNodeCircleSize),
    };
  });
  const polygon = cells.filter(c => c.shape === 'edit-node-polygon'
    || c.shape === 'edit-node-circle-svg').map(c => {
      const link = JSON.parse(c.link || '{}');
    return {
      ...c,
      attrs: {
        body: {
          fill: c.fillColor,
        },
        text: {
          style: {
            cursor: link.type ? 'pointer' : 'none',
            textDecoration: link.type ? 'underline' : 'none',
            fill: link.type ? '#4e75fd' : c.fontColor,
          },
          text: c.label || c.attrs?.text?.text || ''
        },
      },
    }
  });
  const nodes = cells.filter(c => c.shape === 'table').map((n) => {
    return mapData2Table(n, dataSource, updateFields, groups, commonPorts,
      relationType, commonEntityPorts, nodeClickText);
  }).filter(n => !!n);
  const allNodes = (nodes || []).concat(remarks || []).concat(polygon || []);
  const edges = cells.filter(c => c.shape === 'erdRelation')
      .filter((e) => {
        return filterEdge(allNodes, e);
      });
  return (groupNodes || []).concat(nodes || []).concat(edges || []).concat(remarks || []).concat(polygon || []);
};

const getHeaders = (d, type) => {
  if (d.headers && d.headers.length > 0) {
    return d.headers;
  }
  return type === 'entity' ? getEmptyEntity().headers : getEmptyView().headers;
}
export const updateHeaders = (d, type, useGroup) => {
  return _.omit({
    ...d,
    sysProps: {
      nameTemplate: d.sysProps?.nameTemplate || getEmptyEntity().sysProps?.nameTemplate
    },
    headers: getHeaders(d, type),
  }, ['rowNo'].concat(useGroup ? [] : 'group'));
}

export const getFieldBaseType = (...args) => {
  return _getFieldBaseType(...args);
}

export const transformationData = (oldDataSource) => {
  // 某些场景下需要对原始项目进行兼容 统一在此处进行转换操作
  // 1.处理remark
  let tempDataSource = {...oldDataSource};
  if (oldDataSource.version === '3.0.0') {
    const refactor = (e) => {
      return {
        ...e,
        headers: (e.headers || []).map(h => {
          if (h.refKey === 'remark') {
            return {
              ...h,
              refKey: 'comment',
            };
          }
          return h;
        }),
        fields: (e.fields || []).map(f => {
          return {
            ..._.omit(f, ['remark']),
            comment: f.comment || f.remark || '',
          };
        }),
      };
    }
    tempDataSource = {
      ...tempDataSource,
      entities: (tempDataSource.entities || []).map(e => refactor(e)),
      views: (tempDataSource.views || []).map(v => refactor(v)),
    };
  }
  // 2.处理新增的列
  if (compareVersion('3.1.0', oldDataSource.version.split('.'))) {
    const refactor = (e) => {
      if ((e.headers || []).findIndex(h => h.refKey === 'uiHint') < 0) {
        return {
          ...e,
          headers: (e.headers || []).concat({
            "freeze": false,
            "refKey": "uiHint",
            "hideInGraph": true
          }),
        }
      }
      return e;
    }
    tempDataSource = {
      ...tempDataSource,
      profile: {
        ...tempDataSource.profile,
        uiHint: tempDataSource.profile?.uiHint || emptyProjectTemplate.profile.uiHint,
      },
      entities: (tempDataSource.entities || []).map(e => refactor(e)),
      views: (tempDataSource.views || []).map(v => refactor(v)),
    };
  }
  // 3.处理新增的数据字典模板
  if (compareVersion('3.2.0', oldDataSource.version.split('.'))) {
    const codeTemplates = _.get(tempDataSource, 'profile.codeTemplates', []);
    if (!codeTemplates.some(t => {
      return t.applyFor === 'dictSQLTemplate' && t.type === 'dbDDL'
    })) {
      tempDataSource = {
        ...tempDataSource,
        profile: {
          ...tempDataSource.profile,
          codeTemplates: _.get(oldDataSource, 'profile.codeTemplates', [])
            .concat(emptyProjectTemplate.profile.codeTemplates.filter(t => t.applyFor === 'dictSQLTemplate'))
        },
      };
    }
  }
  if (compareVersion('3.5.0', oldDataSource.version.split('.'))) {
    tempDataSource = reduceProject(tempDataSource, 'defKey');
  }
  if (compareVersion('3.5.2', oldDataSource.version.split('.'))) {
    tempDataSource = {
      ...tempDataSource,
      entities: (tempDataSource.entities || []).map(d => updateHeaders(d, 'entity')),
      views: (tempDataSource.views || []).map(d => updateHeaders(d, 'view')),
    };
  }
  if (compareVersion('3.5.6', oldDataSource.version.split('.'))) {
    tempDataSource = {
      ...tempDataSource,
      diagrams: (tempDataSource.diagrams || []).map(d => {
        const originKeys = [];
        return {
          ...d,
          canvasData: {
            ...(d.canvasData || {}),
            cells: (d.canvasData?.cells || []).map(c => {
              if (c.shape === 'table') {
                const count = originKeys.filter(k => k === c.originKey).length;
                originKeys.push(c.originKey);
                return {
                  ...c,
                  count,
                };
              }
              return c;
            }),
          },
        };
      }),
    };
  }
  // 4.处理新增的版本模板
  if (compareVersion('4.0.0', oldDataSource.version.split('.'))) {
    const dataTypeSupports = (tempDataSource?.profile?.dataTypeSupports || [])
        .map(d => d.defKey?.toLocaleLowerCase());
    const codeTemplates = demoProject?.profile?.codeTemplates || [];
    // 判断是否有新增
    const add = demoProject.profile.dataTypeSupports
        .filter(d => !dataTypeSupports.includes(d.defKey?.toLocaleLowerCase()))
        .reduce((a, b) => {
          return a.concat({type: b, code: codeTemplates.filter(c => c.applyFor === b.id)[0]})
        }, []);
    tempDataSource = {
      ...tempDataSource,
      profile: {
        ...tempDataSource.profile,
        dataTypeSupports: (tempDataSource?.profile?.dataTypeSupports || []).concat(add.map(a => a.type)),
        codeTemplates: (tempDataSource?.profile?.codeTemplates || []).map(c => {
          if ((c.type === 'dbDDL' && c.applyFor !== 'dictSQLTemplate') || (c.type === 'appCode')) {
            // 匹配查找
            const dataType = tempDataSource.profile?.dataTypeSupports?.filter(d => d.id === c.applyFor)[0];
            if (dataType) {
              const emptyDataType = demoProject.profile.dataTypeSupports.filter(d => d.defKey?.toLocaleLowerCase()
                  === dataType.defKey?.toLocaleLowerCase())[0];
              const emptyTemplate = demoProject.profile.codeTemplates.filter(c => c.applyFor === emptyDataType?.id)[0];
              return {
                ...c,
                ...(c.type === 'dbDDL' ? {
                  message: emptyTemplate?.message || '',
                  update: emptyTemplate?.update || '',
                } : _.omit(emptyTemplate, 'applyFor'))
              }
            }
            return c;
          }
          return c
        }).concat(add.map(a => a.code))
      }
    }
  }
  if (compareVersion('4.1.0', oldDataSource.version.split('.'))){
    const columns = getFullColumns().map(c => ({refKey: c.newCode, hideInGraph: c.relationNoShow}));
    const getDefaultHeader = (e) => {
      return {
        ...e,
        headers: columns.map((c, i) => {
          return {
            ...(e.headers || []).filter(h => h.refKey === c.refKey)[0] || {...c, hideInGraph: true},
            freeze: i === 0
          };
        })
      };
    }
    tempDataSource = {
      ...tempDataSource,
      entities: (tempDataSource.entities || []).map(e => getDefaultHeader(e)),
      profile: {
        ...tempDataSource.profile,
        headers: columns.filter(h => h.refKey !== 'hideInGraph'),
      }
    }
  }

  if (compareVersion('4.1.1', oldDataSource.version.split('.'))){
    const resetField = (d) => {
      return {
        ...d,
        fields: (d.fields || []).map(f => {
          return {
            ...f,
            primaryKey: !!f.primaryKey,
            notNull: !!f.notNull,
          }
        })
      }
    };
    tempDataSource = {
      ...tempDataSource,
      entities: (tempDataSource.entities || []).map(e => resetField(e)),
      views: (tempDataSource.views || []).map(v => resetField(v)),
      profile: {
        ...tempDataSource.profile,
        headers: (tempDataSource.profile.headers || []).map(h => ({...h, freeze: false})),
        codeTemplates: (tempDataSource.profile.codeTemplates || []).reverse().reduce((p, n) => {
          if (p.findIndex(c => c.applyFor === n.applyFor) < 0) {
            return p.concat(n);
          }
          return p;
        }, []).reverse()
      }
    }
  }

  if (compareVersion('4.2.0', oldDataSource.version.split('.'))){
    // 某些低版本数据修复
    const columns = getFullColumns().map(c => ({refKey: c.newCode, hideInGraph: c.relationNoShow}));
    const resetField = (d) => {
      return {
        ...d,
        headers: d.headers?.length !== 16 ? columns.map((c, i) => {
          return {
            ...(d.headers || []).filter(h => h.refKey === c.refKey)[0] || {...c, hideInGraph: true},
            freeze: i === 0
          };
        }) : d.headers,
        fields: (d.fields || []).map(f => {
          if (typeof f.extProps === 'number') {
            return {
              ...f,
              extProps: {},
            }
          }
          return f;
        })
      }
    };
    tempDataSource = {
      ...tempDataSource,
      entities: (tempDataSource.entities || []).map(e => resetField(e)),
    }
  }
  if (compareVersion('4.7.0', oldDataSource.version.split('.'))) {
    const mappings = oldDataSource.dataTypeMapping?.mappings || [];
    const domains = oldDataSource.domains || [];
    const db = _.get(oldDataSource, 'profile.default.db',
        _.get(oldDataSource, 'profile.dataTypeSupports[0].id'));
    // 调整nameTemplate位置
    tempDataSource = {
      ...tempDataSource,
      profile: {
        ...tempDataSource?.profile,
        default: {
          ...tempDataSource?.profile?.default,
          entityInitFields: (tempDataSource?.profile?.default?.entityInitFields || []).map(f => {
            return {
              ...f,
              baseType: getFieldBaseType(f, domains, mappings, db)
            }
          })
        }
      },
      standardFields: (tempDataSource.standardFields || []).map(s => {
        return {
          ...s,
          fields: (s.fields || []).map(f => {
            return {
              ...f,
              baseType: getFieldBaseType(f, domains, mappings, db)
            }
          })
        }
      }),
      entities: (tempDataSource.entities || []).map(e => ({
        ..._.omit(e, ['nameTemplate']),
        type: 'P',
        fields: e.fields.map(f => {
          return {
            ...f,
            baseType: getFieldBaseType(f, domains, mappings, db)
          }
        }),
        sysProps: {
          nameTemplate: e.nameTemplate
        },
      })),
      views: (tempDataSource.views || []).map(v => ({
        ..._.omit(v, ['nameTemplate']),
        fields: v.fields.map(f => {
          return {
            ...f,
            baseType: getFieldBaseType(f, domains, mappings, db)
          }
        }),
        sysProps: {
          nameTemplate: v.nameTemplate
        },
      }))
    }
  }
  if (compareVersion('4.9.0', oldDataSource.version.split('.'))) {
    // 调整nameTemplate位置
    tempDataSource = {
      ...tempDataSource,
      profile: {
        ...tempDataSource?.profile,
        headers: (tempDataSource?.profile?.headers || []).map(h => {
          if(h.refKey === 'extProps') {
            return {
              ...h,
              enable: false
            }
          }
          return h;
        }),
        extAttrProps: attNames.reduce(((p, n) => {
          return {
            ...p,
            [n]: {
              editType: '',
              optionsData: '',
              optionsFetcher: ''
            }
          }
        }), {})
      },
    }
  }
  if (compareVersion('4.9.2', oldDataSource.version.split('.'))) {
    // 调整nameTemplate位置
    tempDataSource = {
      ...tempDataSource,
      namingRules: tempDataSource.namingRules || emptyProjectTemplate.namingRules,
    }
  }
    return tempDataSource;
};

export const validateNeedSave = (dataSource) => {
  const cacheData = getAllTabData();
  if (Object.keys(cacheData).filter(c => !cacheData[c].isInit).length > 0) {
    return true;
  } else if (dataSource !== getMemoryCache('data')) {
    return true;
  }
  return false;
};

export const defaultJVM = '-Xms128m -Xmx1024m -XX:-UseGCOverheadLimit';

export const emptyDictSQLTemplate =  {
  type: "dbDDL",
  applyFor: "dictSQLTemplate",
  content: ''
};

export const calcField = (f, entities = [], dicts = [], domains = [], uiHint = [], type) => {
  const other = {};
  if (f.refEntity) {
    const newEntity = entities.filter(e => f.refEntity === e[type])[0];
    if (newEntity) {
      other.refEntity = newEntity.id || '';
      other.refEntityField = newEntity
        .fields?.filter(field => field[type] === f.refEntityField)[0]?.id || '';
    }
  }
  return {
    ...f,
    refDict: f.refDict ? dicts.filter(d => d[type] === f.refDict)[0]?.id : (f.refDict || ''),
    domain: f.domain ? domains.filter(d => d[type] === f.domain)[0]?.id : (f.domain || ''),
    uiHint: f.uiHint ? uiHint.filter(u => u[type] === f.uiHint)[0]?.id : (f.uiHint || ''),
    id: Math.uuid(),
    old: type === 'defKey' ? f.defKey : f.id,
    ...other,
  };
};

export const calcDomains = (domains = [], mapping = [], type) => {
  return domains.map(d => {
    return {
      ...d,
      applyFor: mapping.filter(m => m[type] === d.applyFor)[0]?.id || '',
    };
  })
};

export const calcEntityOrView = (data = [], dicts, domains, uiHint, entities, type) => {
  const tempData = data.map(d => ({
    ...d,
    old: type === 'defKey' ? d.defKey : d.id,
    id: Math.uuid()
  }));
  const newData = tempData.map(e => {
    const fields = e.fields?.map(f => calcField(f, entities || tempData, dicts, domains, uiHint, type)) || [];
    return {
      ...e,
      fields,
      indexes: e.indexes?.map(i => {
        return {
          ...i,
          id: Math.uuid(),
          fields: i.fields?.map(f => {
            return {
              ...f,
              fieldDefKey: fields.filter(fie => fie.old === f.fieldDefKey)[0]?.id,
              id: Math.uuid(),
            };
          })
        };
      }) || [],
    };
  });
  return newData.map(e => {
    if (e.correlations) {
      return {
        ...e,
        correlations: e.correlations?.map(c => {
          const refEntity = newData.filter(e => e[type] === c.refEntity)[0];
          if (!refEntity) {
            return null;
          }
          return {
            ...c,
            myField: e.fields?.filter(f => f[type] === c.myField)[0]?.id || c.myField,
            refEntity: refEntity.id,
            refField: refEntity?.fields?.filter(f => f[type] === c.refField)[0]?.id || c.refField,
          }
        })?.filter(c => !!c),
      };
    }
    return e;
  })
};

export const reduceProject = (emptyProject, type) => {
  const dataTypeSupports = emptyProject?.profile?.dataTypeSupports?.map(d => {
      return {
        defKey: type === 'defKey' ? d : d.defKey,
        id: Math.uuid(),
        old: type === 'defKey' ? d : d.id,
      };
    }) || [];
  const codeTemplates = emptyProject.profile?.codeTemplates.map(c => {
    return {
      ...c,
      applyFor: c.applyFor !== 'dictSQLTemplate' ? dataTypeSupports
        .filter(d => d[type] === c.applyFor)[0]?.id : 'dictSQLTemplate',
    };
  }) || [];
  const uiHint = emptyProject.profile?.uiHint?.map(u => {
    return {
      ...u,
      old: type === 'defKey' ? u.defKey : u.id,
      id: Math.uuid(),
    };
  }) || [];
  const dbConn = emptyProject?.dbConn?.map(d => {
    return {
      ...d,
      type: dataTypeSupports.filter(t => t.old === d.type)[0]?.id || d.type,
    };
  });
  const mappings = emptyProject?.dataTypeMapping?.mappings?.map(m => {
    return {
      defKey: m.defKey,
      defName: m.defName,
      old: type === 'defKey' ? m.defKey : m.id,
      id: Math.uuid(),
      ...dataTypeSupports.reduce((pre, next) => {
        return {
          ...pre,
          [next.id]: m[next.old],
        };
      }, {}),
    };
  });
  const domains = calcDomains(emptyProject?.domains, mappings, type)
    ?.map((d) => ({
      ...d,
      id: Math.uuid(),
      old: type === 'defKey' ? d.defKey : d.id,
    })) || [];
  const dicts = emptyProject?.dicts?.map(d => {
    return {
      ...d,
      old: type === 'defKey' ? d.defKey : d.id,
      id: Math.uuid(),
      items: (d.items || []).map(i => {
        return {
          ...i,
          id: Math.uuid(),
        };
      }),
    };
  }) || [];
  const entities = calcEntityOrView(emptyProject?.entities || [], dicts, domains, uiHint, null, type);
  const calcId = (data = [], refKeys) => {
    if (refKeys) {
      return data
        .filter(d => refKeys.includes(d[type]))
        .map(d => d.id);
    }
    return [];
  };
  const getFieldId = (c, cells, name) => {
    const cell = cells.filter(ce => ce.id === c[name]?.cell)[0];
    const entity = entities.filter(e => e[type] === cell?.originKey)[0];
    if (entity) {
      const field = entity?.fields?.filter(f => f[type] === c[name]?.port?.split(separator)[0])[0];
      return `${field?.id || ''}${separator}${c[name]?.port?.split(separator)[1]}`;
    }
    return c[name]?.port;
  };
  const diagrams = emptyProject?.diagrams?.map(d => {
    return {
      ...d,
      old: type === 'defKey' ? d.defKey : d.id,
      id: Math.uuid(),
      canvasData: {
        ...d.canvasData,
        cells: (d.canvasData?.cells || []).map(c => {
          if (c.shape === 'table') {
            return {
              ...c,
              originKey: entities.filter(e => e[type] === c.originKey)[0]?.id,
            };
          } else if (c.shape === 'erdRelation') {
            return {
              ...c,
              target: {
                ...c.target,
                port: getFieldId(c, d.canvasData?.cells, 'target'),
              },
              source: {
                ...c.source,
                port: getFieldId(c, d.canvasData?.cells, 'source'),
              },
            };
          }
          return c;
        })
      }
    };
  }) || [];
  const views = calcEntityOrView(emptyProject?.views || [], dicts, domains, uiHint, entities, type).map(v => {
    return {
      ...v,
      refEntities: (v.refEntities ? entities.filter(e => {
        return v.refEntities.includes(e[type])
      }): []).map(e => e.id),
    };
  });
  const db = (dataTypeSupports || []).filter(d => d[type] === emptyProject.profile?.default?.db)[0]?.id || ''
  return {
    ...emptyProject,
    profile: {
      ...emptyProject.profile,
      default: {
        ...emptyProject.profile?.default,
        db,
        entityInitFields: emptyProject.profile
          ?.default?.entityInitFields?.map(f => {
            return calcField(f, entities, dicts, domains, uiHint, type);
          }).map(f => _.omit(f, 'old'))
      },
      dataTypeSupports: dataTypeSupports.map(d => _.omit(d, 'old')),
      codeTemplates,
      uiHint: uiHint.map(u => _.omit(u, 'old')),
    },
    dicts: dicts.map(d => _.omit(d, 'old')),
    entities: entities.map(d => {
      return {
        ..._.omit(d, ['old', 'nameTemplate']),
        type: d.type || 'P',
        sysProps: {
          nameTemplate: d.nameTemplate
        },
        fields: (d.fields || []).map(f => {
          return {
            ..._.omit(f, 'old'),
            baseType: getFieldBaseType(f, domains, mappings, db)
          }
        })
      };
    }),
    views: views.map(v => {
      return {
        ..._.omit(v, ['old', 'nameTemplate']),
        sysProps: {
          nameTemplate: v.nameTemplate
        },
        fields: (v.fields || []).map(f => {
          return {
            ..._.omit(f, 'old'),
            baseType: getFieldBaseType(f, domains, mappings, db)
          }
        })
      };
    }),
    dataTypeMapping: {
      ...emptyProject?.dataTypeMapping,
      mappings: mappings.map(m => _.omit(m, 'old')),
    },
    dbConn,
    domains: domains.map(d => _.omit(d, 'old')),
    viewGroups: emptyProject?.viewGroups?.map(v => {
      return {
        ...v,
        id: Math.uuid(),
        refEntities: calcId(entities, v.refEntities),
        refDicts: calcId(dicts, v.refDicts),
        refViews: calcId(views, v.refViews),
        refDiagrams: calcId(diagrams, v.refDiagrams),
      };
    }),
    diagrams: diagrams.map(d => _.omit(d, 'old')),
    standardFields: (emptyProject?.standardFields || []).map(g => {
      return {
        ...g,
        id: Math.uuid(),
        fields: (g.fields || []).map(f => {
          return calcField(f, entities, dicts, domains, uiHint, type);
        }).map(f => _.omit(f, ['old', '__key']))
      };
    })
  };
};


export const findExits = (pre = [], next = []) => {
  // 先找出已经存在的
  return next.map((d) => {
    const index = pre.findIndex(cd => cd.defKey === d.defKey);
    if (index >= 0) {
      // 已经存在的需要替换掉id
      return {
        old: d.id,
        new: d.id,
      };
    }
    return null;
  }).filter(d => !!d);
};

// 需要替换domain的applyFor
// 实体和视图以及关系图
// 1.替换数据域,更新applyFor
export const replaceDomainsApplyFor = (domains, replace) => {
  return domains.map(d => {
    const needReplace = replace.filter(r => r.old === d.applyFor)[0];
    if (needReplace){
      return {
        ...d,
        applyFor: needReplace.new,
      };
    }
    return d;
  });
}
// 2.替换实体或者视图
export const replaceEntitiesOrViews = (data, replace, entities = []) => {
  const getEntityAndField = (entityId, fieldId) => {
    const refEntity = replace.entities.filter(r => r.old === entityId)[0]?.new;
    if (refEntity) {
      const oldEntity = entities.filter(e => entityId === e.id)[0];
      const newEntity = entities.filter(e => refEntity === e.id)[0];
      if (newEntity && oldEntity) {
        const oldField = oldEntity.fields?.filter(f => f.id === fieldId)[0]?.defKey;
        const newField = newEntity.fields?.filter(f => f.defKey === oldField)[0]?.id;
        return {
          entity: refEntity,
          field: newField
        };
      }
    }
    return {
      entity: entityId,
      field: fieldId,
    };
  };
  const replaceField = (f) => {
    const other = {};
    if (f.refEntity) {
      const { entity, field } = getEntityAndField(f.refEntity, f.refEntityField);
      other.refEntity = entity || '';
      other.refEntityField = field || '';
    }
    return {
      ...f,
      refDict: replace.dicts.filter(r => r.old === f.refDict)[0]?.new || f.refDict,
      domain: replace.domains.filter(r => r.old === f.domain)[0]?.new || f.domain,
      uiHint: replace.uiHint.filter(r => r.old === f.uiHint)[0]?.new || f.uiHint,
      ...other,
    };
  }
  return data.map(e => {
    const otherData = {};
    const tempE = replace.entities.filter(re => re.old === e.id)[0];
    if (e.refEntities) {
      otherData.refEntities = e.refEntities.map(re => {
        const ref = replace.entities.filter(ret => ret.old === re)[0];
        if (ref) {
          return ref.new;
        }
        return re;
      });
    }
    if (e.correlations) {
      otherData.correlations = e.correlations?.map(c => {
        const my = getEntityAndField(e.id, c.myField);
        const ref = getEntityAndField(c.refEntity, c.refField);
        return {
          ...c,
          myField: my.field,
          refEntity: ref.entity,
          refField: ref.field,
        }
      });
    }
    return {
      ...e,
      id: tempE?.new || e.id,
      fields: (e.fields || []).map(f => replaceField(f)),
      ...otherData,
    };
  })
};
// 3.替换关系图
export const replaceDiagrams = (data, replace) => {
  return data?.map(d => {
    return {
      ...d,
      canvasData: {
        ...d.canvasData,
        cells: (d.canvasData?.cells || []).map(c => {
          if (c.shape === 'table') {
            return {
              ...c,
              originKey: replace.filter(r => r.old === c.originKey)[0]?.new || c.originKey,
            };
          }
          return c;
        })
      }
    };
  })
}

// 校验数据是否重复或者为空
export const validateEmptyOrRepeat = (data, name) => {
  const noEmpty = data.filter(d => d[name] !== '' && d[name] !== null && d[name] !== undefined);
  if (noEmpty.length !== data.length) {
    return [{type: 'empty'}];
  }
  const pre = [];
  const repeat = [];
  noEmpty.forEach(d => {
    if (!pre.includes(d[name])) {
      pre.push(d[name]);
    } else if (!repeat.includes(d[name])){
      repeat.push({type: 'repeat', value: d[name]})
    }
  });
  return repeat;
}

export const getDefaultDb = (dataSource) => {
  const db = _.get(dataSource, 'profile.default.db', _.get(dataSource, 'profile.dataTypeSupports[0].id'));
  return _.get(dataSource, 'profile.dataTypeSupports').filter(d => {
    return d.id === db
  })[0]?.defKey;
};

export const getDefaultTemplate = (...args) => {
  // 匹配查找
  return _getDefaultTemplate(...args);
};

export const mergeData = (...args) => {
  return _mergeData(...args);
};

export const resetHeader = (dataSource, e, freeze) => {
  const headers = [...dataSource?.profile?.headers || []];
  const fullColumns =  getFullColumns();
  const firstHeader = fullColumns[0];
  headers.unshift({refKey: firstHeader.newCode, hideInGraph: true})
  return headers.map(c => {
    const current = (e.headers || []).filter(h => h.refKey === c.refKey)[0];
    const temp = {refKey: c.refKey, freeze: c.freeze};
    return {
      ...current || temp,
      hideInGraph: c.hideInGraph,
      freeze: freeze ? c.freeze : (current || temp)?.freeze
    }
  })
};

export const mergeDataSource = (...args) => {
  if(args.length === 5){
    const callback = args[4];
    // worker调用
    postWorkerFuc('utils._mergeDataSource', true, args.slice(0, 3)).then((dataSource) => {
      callback(dataSource);
    }).catch(() => {
      callback(null);
    })
  } else {
    return _mergeDataSource(...args);
  }
};

export const mergeDomains = (oldDataSource, newDataSource, type) => {
  // 合并项目
  const pickNames = ['profile.codeTemplates', 'domains', 'dataTypeMapping.mappings', 'profile.dataTypeSupports'];
  const filterType = (dataSource) => {
    const leaveId = (dataSource.profile.codeTemplates || [])
        .filter(c => c.applyFor !== 'dictSQLTemplate' && c.type === type).map(c => c.applyFor);
    return {
      ...dataSource,
      profile: {
        ...dataSource.profile,
        codeTemplates: dataSource.profile.codeTemplates.filter(c => leaveId.includes(c.applyFor)),
        dataTypeSupports: dataSource.profile.dataTypeSupports.filter(c => leaveId.includes(c.id)),
      }
    }
  }
  const currentDataSource = mergeDataSource(_.pick(oldDataSource, pickNames),
      filterType({
        ...newDataSource,
        profile: {
          codeTemplates: newDataSource.codeTemplates,
          dataTypeSupports: newDataSource.dataTypeSupports,
        }
      }), [], false)

  const tempDataSource = {
    ...oldDataSource,
    domains: currentDataSource.domains,
    dataTypeMapping: {
      ...oldDataSource.dataTypeMapping,
      mappings: currentDataSource.dataTypeMapping.mappings
    },
    profile: {
      ...oldDataSource?.profile,
      dataTypeSupports: currentDataSource.profile.dataTypeSupports,
      codeTemplates: currentDataSource.profile.codeTemplates,
    }
  }
  return tempDataSource;
}


export const getPresetColors = () => {
  return ['rgb(25, 25, 26)', 'rgb(255, 255, 255)', 'rgb(183, 185, 189)', 'rgb(247, 151, 128)', 'rgb(245, 220, 78)',
    'rgb(116, 212, 151)', 'rgb(117, 190, 250)',
    'rgb(255, 137, 175)', 'rgb(249, 186, 80)', 'rgb(90, 213, 198)',
    'rgb(218, 137, 241)', 'rgb(113, 114, 115)', 'rgb(214, 74, 67)',
    'rgb(207, 172, 19)', 'rgb(51, 153, 108)', 'rgb(52, 124, 212)',
    'rgb(208, 67, 138)', 'rgb(211, 122, 17)',
    'rgb(35, 156, 163)', 'rgb(154, 72, 199)'];
}

const toggleValue = (value, name, toggleCaseValue) => {
  if (toggleCaseValue[name]) {
    const tempValue = value || '';
    return (toggleCaseValue[name] === 'U' ? tempValue.toLocaleUpperCase() : tempValue.toLocaleLowerCase())
  }
  return value;
}
const toggleViewsAndEntities = (data, toggleCaseValue) => {
  return data.map(d => {
    return {
      ...d,
      defKey: toggleValue(d.defKey, 'entityDefKey', toggleCaseValue),
      fields: (d.fields || []).map(f => {
        return {
          ...f,
          type: toggleValue(f.type, 'typeDefKey', toggleCaseValue),
          defKey: toggleValue(f.defKey, 'fieldDefKey', toggleCaseValue),
        }
      }),
      indexes: (d.indexes || []).map(i => {
        return {
          ...i,
          defKey: toggleValue(i.defKey, 'indexDefKey', toggleCaseValue),
        }
      })
    }
  })
}
export const toggleCaseDataSource = (toggleCaseValue, dataSource) => {
  const appCode = (dataSource?.profile?.codeTemplates || [])
      .filter(c => c.type === 'appCode').map(c => c.applyFor);
  return {
    ...dataSource,
    entities: toggleViewsAndEntities(dataSource.entities || [], toggleCaseValue),
    views: toggleViewsAndEntities(dataSource.views || [], toggleCaseValue),
    dataTypeMapping: {
      ...dataSource.dataTypeMapping,
      mappings: (dataSource.dataTypeMapping?.mappings || []).map(m => {
        const omitNames = ['defKey', 'id', 'defName'].concat(appCode);
        return {
          ...m,
          ...Object.keys(m).filter(n => !omitNames.includes(n)).reduce((p, n) => {
            return {
              ...p,
              [n]: toggleValue(m[n], 'typeDefKey', toggleCaseValue)
            }
          }, {}),
        }
      })
    }
  };
}

export const toggleCaseEntityOrView = (data, toggleCaseValue) => {
  return toggleViewsAndEntities([data], toggleCaseValue)[0]
}

export const calcUnGroupDefKey = (dataSource, name) => {
  const allGroupKeys = (dataSource.viewGroups || [])
      .reduce((a, b) => a.concat(b[`ref${firstUp(name)}`]), []);
  return (dataSource[name] || [])
      .filter(e => !(allGroupKeys.includes(e.id)))
      .map(e => e.id);
};

export const getUnGroup = (dataSource, defKey) => {
  return {
    refDiagrams: calcUnGroupDefKey(dataSource || {}, 'diagrams'),
    refDicts: calcUnGroupDefKey(dataSource || {}, 'dicts'),
    refEntities: calcUnGroupDefKey(dataSource || {}, 'entities'),
    refViews: calcUnGroupDefKey(dataSource || {}, 'views'),
    refLogicEntities: calcUnGroupDefKey(dataSource || {}, 'logicEntities'),
    id: '__ungroup',
    defKey: defKey || '__ungroup',
  }
}

export const parseExcel = (str, headers) => {
  const numberName = ['len', 'scale']
  const booleanName = ['primaryKey', 'notNull', 'autoIncrement', 'hideInGraph']
  const checkValue = (value, name) => {
    if(booleanName.includes(name)) {
      return value === true || value === '√' || value === 'true';
    } else if(numberName.includes(value)) {
      const numberValue = parseInt(value);
      if (isNaN(numberValue)) {
        return ''
      }
      return numberValue;
    }
    return value;
  }
  const resultArray = (str || '')
      .replace(/\r\n(\r\n)*( )*(\r\n)*\r\n/g,"\r\n")
      .split('\r\n')
      .map(r => (r || '').split('\t'));
  return resultArray.map(r => {
    return r.reduce((p, n, i) => {
      const refKey = headers[i]?.refKey;
      if(refKey) {
        return {
          ...p,
          [refKey]: checkValue(n, refKey),
        }
      }
      return p;
    }, {})
  });
}

export const def2Id = (...args) => {
  return _def2Id(...args);
}

export const id2Def = (...args) => {
  return _id2Def(...args);
}

export const mergeId = (...args) => {
  return _mergeId(...args);
}

export const checkDemoData = () => {
  return [
      {
        entity: demoTable.entity,
        applyObjectType: 'P',
        applyFieldType: 'entity'
      },
      {
        field:demoTable.entity.fields[0],
        entity: demoTable.entity,
        applyObjectType: 'P',
        applyFieldType: 'field'
      },
      {
        index:demoTable.entity.indexes[0],
        entity: demoTable.entity,
        applyObjectType: 'P',
        applyFieldType: 'index'
      },
      {
        logicEntity: demoTable.entity,
        applyObjectType: 'L',
        applyFieldType: 'entity'
      },
      {
        field:demoTable.entity.fields[0],
        logicEntity: demoTable.entity,
        applyObjectType: 'L',
        applyFieldType: 'field'
      },
  ];
}


export const checkItems = () => {
  return [{
    name: '逻辑模型-逻辑实体',
    applyObjectType: 'L',
    applyFieldType: 'entity',
  },
    {
      name: '逻辑模型-逻辑实体属性',
      applyObjectType: 'L',
      applyFieldType: 'field',
    },
    {
      name: '数据表-数据表',
      applyObjectType: 'P',
      applyFieldType: 'entity',
    },
    {
      name: '数据表-数据表字段',
      applyObjectType: 'P',
      applyFieldType: 'field',
    },
    {
      name: '数据表-索引',
      applyObjectType: 'P',
      applyFieldType: 'index',
    }];
}

export const checkResultItems = () => {
  return [{
    name: '逻辑模型-规范检查',
    applyObjectType: 'L',
    applyFieldType: 'entity',
  },
    {
      name: '字段-规范检查',
      applyObjectType: 'L',
      applyFieldType: 'field',
    },
    {
      name: '表-规范检查',
      applyObjectType: 'P',
      applyFieldType: 'entity',
    },
    {
      name: '字段-规范检查',
      applyObjectType: 'P',
      applyFieldType: 'field',
    },
    {
      name: '索引-规范检查',
      applyObjectType: 'P',
      applyFieldType: 'index',
    }];
}
