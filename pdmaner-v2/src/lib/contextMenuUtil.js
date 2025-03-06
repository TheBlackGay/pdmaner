import React from 'react';
import _ from 'lodash/object';

import { Button, openModal, Modal, Message, FormatMessage } from 'components';

import { Copy, Paste } from './event_tool';
import NewEntity from '../app/container/entity/NewEntity';
import NewLogicEntity from '../app/container/logicentity/NewLogicEntity';
import NewView from '../app/container/view/NewViewStep';
import NewRelation from '../app/container/relation/NewRelation';
import NewDict from '../app/container/dict/NewDict';
import NewGroup from '../app/container/group';
import SelectGroup from '../app/container/group/SelectGroup';
import DataType from '../app/container/datatype';
import Domain from '../app/container/domain';
import Preview from '../app/container/database';
import AppCode from '../app/container/appcode';
import Quickedit from '../app/container/tools/quickedit';
import Extract from '../app/container/tools/extract';
import {
  getEmptyEntity,
  getEmptyView,
  emptyRelation,
  emptyGroup,
  emptyDomain,
  emptyDataType,
  emptyCodeTemplate,
  emptyDict,
  validateItem,
  validateKey,
  emptyDiagram,
  defaultTemplate,
  validateItemInclude,
  emptyDataTypeSupport,
  allType,
  validateEmptyOrRepeat,
  transformFieldType,
  resetHeader,
  transform,
  getUnGroup, getDefaultLogicSys, getLogicHeaders, getFieldBaseType, updateBaseType,
} from './datasource_util';
// 专门处理左侧菜单 右键菜单数据
import { separator } from '../../profile';
import demoProject from './template/教学管理系统.pdma.json';
import * as Component from 'components';
import Note from '../app/container/tools/note';
import {saveImages} from './middle';
import moment from 'moment';
import {insertArray} from './array_util';

const opt = [{
  key: 'add',
  icon: 'fa-plus',
}, {
  key: 'delete',
  icon: 'fa-minus'
}, {
  key: 'move',
  icon: 'fa-arrows'
}, {
  key: 'copy',
  icon: 'fa-clone'
}, {
  key: 'cut',
  icon: 'fa-scissors'
}, {
  key: 'paste',
  icon: 'fa-clipboard'
}, {
  key: 'clear',
  icon: 'fa-eraser'
}, {
  key: 'edit',
  icon: 'fa-pencil-square-o'
}, {
  key: 'all',
  icon: ''
},
  {
    key: 'reset',
    icon: 'fa-mail-reply'
  },
  {
    key: 'notes',
    icon: 'fa-tags'
  },
  {
    key: 'png',
    icon: 'fa-image'
  },
  {
    key: 'svg',
    icon: 'fa-file-image-o'
  },
  {
    key: 'extract',
    icon: 'fa-retweet'
  }]; // 所有菜单操作的的KEY;

const normalOpt = ['add', 'copy', 'cut', 'paste', 'delete'];
const domainNormalOpt = ['add', 'clear'];
const domainChildNormalOpt = ['add', 'copy', 'paste', 'delete'];
const menusType = {
  groups: ['add', 'edit', 'clear', 'delete'],
  entities: normalOpt.concat('all'),
  entity: normalOpt.concat('move', 'all', 'notes', 'extract'),
  logicEntities: normalOpt.concat('all'),
  logicEntity: normalOpt.concat('move', 'all', 'notes', 'extract'),
  views: normalOpt.concat('all'),
  view: normalOpt.concat('move', 'all', 'notes'),
  diagrams: normalOpt.concat('png', 'svg'),
  diagram: normalOpt.concat('move', 'edit', 'png', 'svg'),
  dicts: normalOpt.concat('all'),
  dict: normalOpt.concat('move', 'all'),
  domains: domainNormalOpt,
  domain: domainChildNormalOpt,
  dataTypeMapping: domainNormalOpt,
  mapping: domainChildNormalOpt,
  dataTypeSupport: domainNormalOpt,
  dataType: domainChildNormalOpt.concat('reset'),
  appCode: normalOpt.concat('edit', 'reset'),
};

export const getMenu = (m, key, type, selectedMenu, groupType, parentKey, tempType = type) => {
  const getName = () => {
    const base = FormatMessage.string({id: `menus.opt.${m}`});
    if (type === 'appCode' || type === 'dataType' || type === 'mapping'
        || type === 'domain' || type === 'groups' || type === 'entity' || type === 'view'
        || type === 'logicEntity') {
      if (m === 'edit' && (type === 'appCode' || type === 'dataType')) {
        return FormatMessage.string({id: 'menus.opt.rename'})
      } else if(m === 'extract') {
        if(type === 'entity') {
          return base + FormatMessage.string({id: 'menus.logicEntity'});
        } else {
          return FormatMessage.string({id: 'menus.extractEntity'});
        }
      }
      return base;
    } else if (m === 'move' || m === 'all' || m === 'reset') {
      return base;
    } else if (type === 'diagram') {
      if (m === 'edit') {
        return FormatMessage.string({id: 'menus.opt.editRelation'});
      }
      return base;
    }
    return base + FormatMessage.string({id: `menus.${tempType}`});
  }
  const getIcon = () => {
    if (type === 'entities' || type === 'entity') {
      return 'fa-table';
    } else if (type === 'views' || type === 'view') {
      return 'icon-shitu';
    }
    return 'icon-shujuzidian';
  }
  return {
    style: m === 'all' ? {borderTop: '1px dashed #DFE3EB'} : {},
    key: m,
    dataKey: key,
    dataType: type,
    otherMenus: selectedMenu,
    groupType,
    parentKey,
    icon: opt.filter(o => o.key === m)[0]?.icon || getIcon(),
    name: getName(),
  }
};

export const getMenus = (key, type, selectedMenu, parentKey, groupType) => {
  return menusType[type].filter(m => {
    if (type === 'groups' && (!key || key === '__ungroup')) {
      return m === 'add';
    }
    return m;
  }).map(m => {
    let tempType = type;
    if (type.endsWith('s') && (m === 'add') && (type !== 'groups')) {
      if (type === 'entities'){
        tempType = 'entity';
      } else if (type === 'logicEntities'){
        tempType = 'logicEntity';
      } else {
        tempType = tempType.substring(0, tempType.length - 1);
      }
    }
    return getMenu(m, key, type, selectedMenu,
        groupType,
        parentKey, tempType);
  });
};

export const dealMenuClick = (dataSource, menu, updateDataSource, tabClose, callback, genImg, jumpDetail) => {
  const { key } = menu;
  switch (key) {
    case 'add': addOpt(dataSource, menu, updateDataSource, {}, null, null, callback); break;
    case 'edit': editOpt(dataSource, menu, updateDataSource); break;
    case 'copy': copyOpt(dataSource, menu); break;
    case 'cut': cutOpt(dataSource, menu); break;
    case 'paste': pasteOpt(dataSource, menu, updateDataSource); break;
    case 'delete': deleteOpt(dataSource, menu, updateDataSource, tabClose); break;
    case 'clear': clearOpt(dataSource, menu, updateDataSource); break;
    case 'move': moveOpt(dataSource, menu, updateDataSource); break;
    case 'all': editAllOpt(dataSource, menu, updateDataSource); break;
    case 'reset': resetOpt(dataSource, menu, updateDataSource); break;
    case 'notes': notesOpt(dataSource, menu, updateDataSource); break;
    case 'png':
    case 'svg': imgOpt(dataSource, menu, genImg, key); break;
    case 'extract':extractOpt(dataSource, menu, updateDataSource, jumpDetail); break;
    default:break;
  }
};

const extractOpt = (dataSource, currentMenu, updateDataSource, jumpDetail) => {
  const otherMenus = currentMenu.otherMenus.filter(m => m.type === currentMenu.dataType)
  const name = currentMenu.dataType === 'entity' ? 'entities' : 'logicEntities';
  const allName = currentMenu.dataType === 'entity' ? 'logicEntities' : 'entities';
  const allData = dataSource[allName] || [];
  let parentKey = '';
  if(currentMenu.parentKey !== 'logicEntities' && currentMenu.parentKey !== 'entities') {
    parentKey = currentMenu.parentKey;
  }
  const currentAllData = currentMenu.dataType === 'logicEntity' ?
      allData.map(d => ({defKey: `${d.defKey || ''}${d.defName || ''}`})) : [...allData]

  const genExtractData = (menu) => {
    // 判断是否存在
    const validateRepeat = (extractData) => {
      const calcData = (data, key) => {
        return data.some(d => d.defKey === key);
      }
      let isRepeat;
      let newDefKey = extractData.defKey;
      if(extractData.type === 'L') {
        isRepeat = calcData(currentAllData,
            `${extractData.defKey || ''}${extractData.defName || ''}`);
      } else {
        isRepeat = calcData(currentAllData,extractData.defKey);
      }
      if(isRepeat) {
        newDefKey = validateRepeat({
          ...extractData,
          defKey: `${extractData.defKey}_1`
        })
      }
      currentAllData.push({defKey: newDefKey})
      return newDefKey;
    }
    const currentData = (dataSource[name] || []).find(e => e.id === menu.key) || {};
    // 重命名逻辑模型
    const renameDefKey = (defKey = '') => {
      // 判断是否是LE开头
      const reg = /^le_/i;
      const newDefKey = defKey.replace(reg, '');
      if(name === 'entities') {
        return `LE_${newDefKey}`;
      }
      return newDefKey;
    }
    // 组装新数据
    return {
      ..._.pick(currentData, ['defName', 'comment', 'env', 'notes', 'properties']),
      defKey: validateRepeat({
        defKey: renameDefKey(currentData.defKey || currentData.defName || ''),
        defName: currentData.defName,
      }),
      id: Math.uuid(),
      type: menu.type === 'entity' ? 'L' : 'P',
      headers: menu.type === 'entity' ? getLogicHeaders() : resetHeader(dataSource, {}),
      fields: (currentData.fields || []).map(f => ({...f, id: Math.uuid()})),
      indexes: [],
      correlations: [],
      sysProps: menu.type === 'entity' ? getDefaultLogicSys() : {
        nameTemplate: '{defKey}[{defName}]',
      }
    }
  }

  const updateData = (extractAllData) => {
    const extractData = extractAllData[0];
    let currentGroup = null;
    const refName = extractData.type === 'P' ? 'refEntities' : 'refLogicEntities';
    updateDataSource({
      ...dataSource,
      viewGroups: parentKey ? dataSource.viewGroups?.map(v => {
        if(parentKey === v.id) {
          currentGroup = v;
          return {
            ...v,
            [refName]: (v[refName] || []).concat(extractAllData.map(e => e.id))
          }
        }
        return v;
      }) : dataSource.viewGroups,
      [allName]: allData.concat(extractAllData)
    })
    Message.success({title: FormatMessage.string({id: 'optSuccess'})});
    jumpDetail({
      ...extractData,
      type: refName,
      groups: [currentGroup],
    }, allName);
  }

  updateData(otherMenus.map(m => genExtractData(m)))
}

const imgOpt = (dataSource, menu, genImg, imageType) => {
  const type = menu.dataType;
  const parentKey = menu.parentKey;
  const otherMenus = menu.otherMenus || [];
  const refactorFileName = (images) => {
    return images.map(i => {
      const diagram = dataSource.diagrams.filter(d => d.id === i.fileName)[0] || {};
      return {
        ...i,
        fileName: `${dataSource.name}-${diagram.defKey}[${diagram.defName || diagram.defKey}]-${moment().format('YYYYMDHHmmss')}`
      }
    })
  }
  if (type === 'diagrams') {
    if (parentKey) {
      const keys = dataSource.viewGroups.filter(v => v.id === parentKey)[0]?.refDiagrams || [];
      genImg(true, keys, imageType).then((images) => {
        saveImages(refactorFileName(images), imageType)
      });
    } else {
      genImg(true, [], imageType).then((images) => {
        saveImages(refactorFileName(images), imageType)
      });
    }
  } else {
    genImg(true, otherMenus.filter(m => m.type === type).map(m => m.key), imageType).then((images) => {
      saveImages(refactorFileName(images), imageType)
    });
  }
}

const notesOpt = (dataSource, menu, updateDataSource) => {
  const otherMenus = menu.otherMenus || [];
  let drawer;
  let changeData;
  let notes = otherMenus.filter(m => m.type === 'entity' || m.type === 'logicEntity' || m.type === 'view')
      .map(o => {
        const names = o.type === 'entity' ? 'entities' : (o.type === 'view' ? 'views' : 'logicEntities');
        return {
          ...dataSource[names].find(d => d.id === o.key),
          type: o.type,
        };
      })
      .map(d => _.pick(d, ['notes', 'id', 'type']));
  const dataChange = (d) => {
    changeData = d;
  };
  const updateNotes = (data, type) => {
    return data.map(e => {
      const n = notes.filter(n => n.id === e.id && n.type === type)[0];
      if (n) {
        return {
          ...e,
          notes: changeData,
        };
      }
      return e;
    })
  }
  const onOk = () => {
    if (changeData) {
      updateDataSource({
        ...dataSource,
        entities: updateNotes(dataSource.entities || [], 'entity'),
        views: updateNotes(dataSource.views || [], 'view'),
        logicEntities: updateNotes(dataSource.logicEntities || [], 'logicEntity'),
      })
    }
    drawer && drawer.close();
  };
  const onCancel = () => {
    drawer && drawer.close();
  };
  drawer = Component.openDrawer(<Note
      updateDataSource={updateDataSource}
      dataSource={dataSource}
      data={notes}
      dataChange={dataChange}
  />, {
    placement: 'right',
    width: '55%',
    title: Component.FormatMessage.string({id: 'tableEdit.note'}),
    buttons: [<Component.Button type='primary' key='ok' onClick={onOk}>
      <Component.FormatMessage id='button.ok'/>
    </Component.Button>,
      <Component.Button key='cancel' onClick={onCancel}>
        <Component.FormatMessage id='button.cancel'/>
      </Component.Button>],
  });
}
const resetOpt = (dataSource, menu, updateDataSource) => {
  Modal.confirm({
    title: FormatMessage.string({id: 'resetConfirmTitle'}),
    message: FormatMessage.string({id: 'resetConfirm'}),
    onOk:() => {
      updateDataSource({
        ...dataSource,
        profile: {
          ...dataSource.profile,
          codeTemplates: (dataSource?.profile?.codeTemplates || []).map(c => {
            if (c.applyFor === menu.dataKey) {
              // 匹配查找
              const dataType = dataSource.profile?.dataTypeSupports?.filter(d => d.id === c.applyFor)[0];
              if (dataType) {
                const emptyDataType = demoProject.profile.dataTypeSupports.filter(d => d.defKey?.toLocaleLowerCase()
                    === dataType.defKey?.toLocaleLowerCase())[0];
                const emptyTemplate = demoProject.profile.codeTemplates.filter(c => c.applyFor === emptyDataType?.id)[0];
                if (emptyTemplate) {
                  Message.success({title: FormatMessage.string({id: 'optSuccess'})});
                  return {
                    applyFor: c.applyFor,
                    ..._.omit(emptyTemplate, 'applyFor')
                  };
                }
                Message.warring({title: FormatMessage.string({id: 'emptyDefaultTemplate'})});
                return c;
              }
              return c;
            }
            return c
          })
        }
      })
    },
  });
}

const editAllOpt = (dataSource, m, updateDataSource) => {
  const name = allType.filter(t => t.type === m.dataType)[0]?.name || m.dataType;
  let refName = '';
  if(name === 'dicts') {
    refName = 'refDicts';
  } else if(name === 'entities') {
    refName = 'refEntities';
  } else if(name === 'views') {
    refName = 'refViews';
  } else if(name === 'logicEntities') {
    refName = 'refLogicEntities';
  }
  let modal;
  let tempDataSource;
  const dataChange = (data) => {
    tempDataSource = data;
  }
  const onOK = () => {
    if (tempDataSource) {
      let newDataSource;
      if(m.parentKey) {
        if(m.parentKey !== '__ungroup') {
          const changeData = tempDataSource[name].filter(d => d.isChange).map(d => _.omit(d, 'isChange'));
          newDataSource = {
            ...dataSource,
            [name]: dataSource[name]?.map(d => {
              const current = changeData.find(c => c.id === d.id);
              if (current) {
                return current;
              }
              return d;
            }),
            viewGroups: (tempDataSource.viewGroups || []).map(v => {
              if (v.id === m.parentKey) {
                // 更新分组排序
                return {
                  ...v,
                  [refName]: tempDataSource[name]?.filter(i => v[refName].includes(i.id))?.map(d => d.id) || [],
                }
              }
              return v;
            }),
          }
        } else {
          const changeDataId = tempDataSource[name].map(c => c.id);
          newDataSource = {
            ...dataSource,
            [name]: dataSource[name]
                .filter(d => !changeDataId.includes(d.id))
                .concat(tempDataSource[name]),
          }
        }
      } else {
        newDataSource = tempDataSource;
      }

      const result = validateEmptyOrRepeat(newDataSource[name] || [], 'defKey');
      if (result.length > 0) {
        Modal.error({
          title: FormatMessage.string({id: 'optFail'}),
          message: `${FormatMessage.string({id: 'defKeyValidateUniquenessMessage'})}
          ${result.filter(r => r.type === 'repeat').map(r => `[${r.value}]`).join('')}`,
        });
      } else {
        updateDataSource(newDataSource);
        modal && modal.close();
      }
    } else {
      modal && modal.close();
    }
  }
  const onCancel = () => {
    modal && modal.close();
  }
  let defaultDataSource = {...dataSource};
  if (m.parentKey) {
    let viewGroup;
    if(m.parentKey === '__ungroup') {
      viewGroup = getUnGroup(dataSource);
    } else {
      viewGroup = (defaultDataSource.viewGroups || []).find(v => v.id === m.parentKey);
    }
    if (viewGroup) {
      defaultDataSource = {
        ...defaultDataSource,
        [name]: viewGroup[refName].map(s => defaultDataSource[name].find(d => d.id === s))
      }
    }
  }
  modal = openModal(<Quickedit parentKey={m.parentKey} dataSource={defaultDataSource} name={name} dataChange={dataChange}/>, {
    bodyStyle: {width: '80%'},
    title: m.name || '',
    buttons: [<Button key='onOK' onClick={onOK} type='primary'>
        <FormatMessage id='button.ok'/>
      </Button>,
      <Button key='onCancel' onClick={onCancel}>
        <FormatMessage id='button.cancel'/>
      </Button>],
    onEnter: () => {
      onOK();
    }
  });
}

const validate = (require, data) => {
  return !require.some(r => !data[r]);
};

const calcDefaultDb = (newData, oldData, db) => {
  if (newData.type === 'dbDDL') {
    if (newData.defaultDb) {
      return newData.applyFor;
    } else if (oldData.defaultDb && !newData.defaultDb) {
      Message.success({
        title: FormatMessage.string({id: 'dataType.defaultDbInfo'})
      });
      return newData.applyFor;
    }
  }
  return db;
}

const addOpt = (dataSource, menu, updateDataSource, oldData = {}, title, customerDealData, callback) => {
  // 新增操作合集
  console.log(menu);
  const { dataType, parentKey, dataKey } = menu;
  let modal = null;
  const data = {group: (parentKey && [parentKey]) || [], ...oldData};
  const dataChange = (value, name) => {
    _.set(data, name, value);
  };
  const commonRequire = ['defKey'];
  const commonPick = ['defKey', 'defName'];
  const commonProps = { dataSource, dataChange };
  const commonAllKeys = (dataSource?.entities || []).concat(dataSource?.views || []).map(d => d.defKey);
  const modalComponent = {
    logicEntities: {
      uniqueKey: '',
      uniqueKeyNamePath: '',
      refName: 'refLogicEntities',
      empty: {
        ...getEmptyEntity([], {}),
        sysProps: getDefaultLogicSys(),
        headers: getLogicHeaders(),
        type: 'L'
      },
      dataPick:'all',
      component: NewLogicEntity,
      title: FormatMessage.string({id: 'menus.add.newLogicEntity'}),
      allKeys: (dataSource?.logicEntities || []).map(d => `${d.defKey || ''}${d.defName || ''}`),
      require: [],
    },
    entities: {
      uniqueKey: 'defKey',
      uniqueKeyNamePath: 'tableBase.defKey',
      refName: 'refEntities',
      empty: {
        ...getEmptyEntity([],
            _.get(dataSource, 'profile.default.entityInitProperties', {})),
        headers: resetHeader(dataSource, {}),
        type: 'P'
      },
      dataPick: commonPick.concat('fields'),
      component: NewEntity,
      title: FormatMessage.string({id: 'menus.add.newEntity'}),
      allKeys: commonAllKeys,
      require: commonRequire,
    },
    views: {
      uniqueKey: 'defKey',
      uniqueKeyNamePath: 'tableBase.defKey',
      refName: 'refViews',
      empty: getEmptyView(),
      dataPick: commonPick.concat(['refEntities', 'fields']),
      component: NewView,
      title: FormatMessage.string({id: 'menus.add.newView'}),
      allKeys: commonAllKeys,
      require: commonRequire,
    },
    diagrams: {
      uniqueKey: 'defKey',
      uniqueKeyNamePath: 'relation.defKey',
      refName: 'refDiagrams',
      empty: {
        ...emptyRelation,
        id: Math.uuid(),
      },
      dataPick: commonPick.concat('relationType'),
      component: NewRelation,
      title: FormatMessage.string({id: 'menus.add.newRelation'}),
      allKeys: (dataSource?.diagrams || []).map(d => d.defKey),
      require: commonRequire,
    },
    dicts: {
      uniqueKey: 'defKey',
      uniqueKeyNamePath: 'dict.defKey',
      refName: 'refDicts',
      empty: {
        ...emptyDict,
        id: Math.uuid(),
      },
      dataPick: commonPick,
      component: NewDict,
      title: FormatMessage.string({id: 'menus.add.newDict'}),
      allKeys: (dataSource?.dicts || []).map(d => d.defKey),
      require: commonRequire,
    },
    viewGroups: {
      uniqueKey: 'defKey',
      uniqueKeyNamePath: 'group.defKey',
      empty: {
        ...emptyGroup,
        id: Math.uuid(),
      },
      dataPick: commonPick.concat(['refEntities', 'refViews', 'refDiagrams', 'refDicts']),
      component: NewGroup,
      title: FormatMessage.string({id: 'menus.add.newGroup'}),
      allKeys: (dataSource?.viewGroups || []).map(d => d.defKey),
      require: commonRequire,
    },
    domains: {
      uniqueKey: 'defKey',
      uniqueKeyNamePath: 'domain.defKey',
      empty: {
        ...emptyDomain,
        id: Math.uuid(),
      },
      dataPick: 'all',
      component: Domain,
      title: FormatMessage.string({id: 'menus.add.newDomain'}),
      allKeys: (dataSource?.domains || []).map(d => d.defKey),
      require: commonRequire,
    },
    dataTypeMapping: {
      uniqueKey: 'defKey',
      uniqueKeyNamePath: 'dataType.defKey',
      empty: {
        ...emptyDataType,
        id: Math.uuid(),
      },
      dataPick: 'all',
      component: DataType,
      title: FormatMessage.string({id: 'menus.add.newDataType'}),
      allKeys: (dataSource?.dataTypeMapping?.mappings || []).map(d => d.defKey),
      require: commonRequire,
    },
    dataTypeSupports: {
      uniqueKey: 'defKey',
      uniqueKeyNamePath: 'database.name',
      empty: {
        defKey: '',
        id: Math.uuid()
      },
      dataPick: 'all',
      component: Preview,
      allKeys: (dataSource?.profile?.dataTypeSupports || []).map(d => d.defKey),
      title: FormatMessage.string({id: 'menus.add.newDataTypeSupport'}),
      require: commonRequire,
    },
    appCode: {
      uniqueKey: 'defKey',
      uniqueKeyNamePath: 'database.name',
      empty: {
        defKey: '',
        id: Math.uuid()
      },
      dataPick: 'all',
      component: AppCode,
      allKeys: (dataSource?.profile?.dataTypeSupports || []).map(d => d.defKey),
      title: FormatMessage.string({id: 'menus.add.newAppCode'}),
      require: commonRequire,
    },
  };
  const getRealType = () => {
    switch (dataType) {
      case 'logicEntities':
      case 'logicEntity': return 'logicEntities';
      case 'entities':
      case 'entity': return 'entities';
      case 'views':
      case 'view': return 'views';
      case 'diagrams':
      case 'diagram': return 'diagrams';
      case 'dicts':
      case 'dict': return 'dicts';
      case 'groups': return 'viewGroups';
      case 'domain':
      case 'domains': return 'domains';
      case 'mapping':
      case 'dataTypeMapping': return 'dataTypeMapping';
      case 'dataType':
      case 'dataTypeSupport': return 'dataTypeSupports';
      case 'appCode': return 'appCode';
    }
  };
  const realType = getRealType();
  const modalData = modalComponent[realType];
  const onOK = () => {
    const result = realType === 'logicEntities' ? !(!data.defKey && !data.defName) : validate(modalData.require, data);
    if (!result) {
      Modal.error({
        title: FormatMessage.string({id: 'optFail'}),
        message: realType === 'logicEntities' ? FormatMessage.string({id: 'logicEntity.validate'}) : FormatMessage.string({id: 'formValidateMessage'})
      });
    } else {
      if (customerDealData) {
        // 自定义处理数据
        customerDealData(data, modal);
      } else {
        const ignoreCase = realType === 'entities' || realType === 'views' || realType === 'logicEntities';
        const allKeys = ignoreCase ? modalData.allKeys.map(k => k.toLocaleLowerCase()) : modalData.allKeys;
        let check = false;
        if(realType === 'logicEntities') {
          check = allKeys.includes(`${data.defKey || ''}${data.defName || ''}`?.toLocaleLowerCase())
        } else {
          check = allKeys.includes(ignoreCase ? data[modalData.uniqueKey]?.toLocaleLowerCase() : data[modalData.uniqueKey])
        }
        if (check) {
          Modal.error({
            title: FormatMessage.string({id: 'optFail'}),
            message: realType === 'logicEntities' ? FormatMessage.string({
              id: 'logicEntity.logicEntityUniquenessCheck',
            }) : FormatMessage.string({
              id: 'entityAndViewUniquenessCheck',
              data: {
                key: FormatMessage.string({id: `${modalData.uniqueKeyNamePath}`})
              }
            })});
        } else {
          const refName = modalData.refName;
          let tempDataSource = {...dataSource};
          if (refName) {
            // modal
            tempDataSource = {
              ...tempDataSource,
              viewGroups: data.group?.length > 0 ? (dataSource?.viewGroups || []).map((v) => {
                if (data.group.includes(v.id)) {
                  return {
                    ...v,
                    [refName]: insertArray(v?.[refName], dataKey, modalData.empty.id),
                  }
                }
                return v;
              }) : (dataSource?.viewGroups || []),
            }
          }
          const getData = () => {
            return {
              ...modalData.empty,
              ...(modalData.dataPick === 'all' ? _.omit(data, 'group') : _.pick(data, modalData.dataPick)),
            };
          };
          if (realType === 'dataTypeMapping') {
            tempDataSource = {
              ...tempDataSource,
              [realType]: {
                ...(dataSource?.[realType] || {}),
                mappings: insertArray(dataSource?.[realType]?.mappings, dataKey, getData())
              }
            };
          } else if (realType === 'dataTypeSupports' || realType === 'appCode') {
            const newData = getData();
            tempDataSource = transformFieldType({
              ...tempDataSource,
              profile: {
                ...(tempDataSource?.profile || {}),
                dataTypeSupports: insertArray(tempDataSource?.profile?.dataTypeSupports || [],
                    dataKey, _.pick(newData, ['defKey', 'id'])),
                default: {
                  ..._.get(tempDataSource, 'profile.default', {}),
                  db: newData.defaultDb ? newData.id :
                    _.get(tempDataSource, 'profile.default.db', newData.id),
                },
                codeTemplates: insertArray(_.get(tempDataSource, 'profile.codeTemplates', [])
                    , dataKey, {
                      applyFor: newData.id,
                      type: realType === 'appCode' ? 'appCode' : (newData.type || 'dbDDL'),
                      ...defaultTemplate[`${realType === 'appCode' ? 'appCode' : (newData.type || 'dbDDL')}Template`].reduce((a, b) => {
                        const temp = {...a};
                        temp[b] = newData[b] || '';
                        return temp;
                      }, {})
                    }, 'applyFor')
              },
            }, _.get(tempDataSource, 'profile.default.db'));
          } else {
            // viewGroup domains
            tempDataSource = {
              ...tempDataSource,
              [realType]: insertArray(dataSource?.[realType], dataKey, getData()),
            };
          }
          updateDataSource && updateDataSource({...tempDataSource});
          modal && modal.close();
          Message.success({title: FormatMessage.string({id: 'optSuccess'})});
          callback && callback(realType);
        }
      }
    }
  };
  const onCancel = () => {
    modal && modal.close();
  };
  const buttons = modalData.refName === 'refViews' ? [] : [
    <Button key='onOK' onClick={onOK} type='primary'>
      <FormatMessage id='button.ok'/>
    </Button>,
    <Button key='onCancel' onClick={onCancel}>
      <FormatMessage id='button.cancel'/>
    </Button>,
  ];
  const Com = modalData.component;
  modal = openModal(
    <Com {...commonProps} data={data} onOK={onOK} onCancel={onCancel}/>,
    {
      bodyStyle: (realType === 'dataTypeSupports' || realType === 'logicEntities') ? {width: '80%'} : {},
      title: title || modalData.title,
      buttons,
      focusFirst: realType !== 'views',
      onEnter: () => {
        modalData.refName !== 'refViews' && onOK();
      }
    }
  )
};

const editOpt = (dataSource, menu, updateDataSource) => {
  // 暂时只有关系图和分组可以进行右键编辑 后续可以基于此进行拓展
  // 数据域 双击将触发此处的编辑方法
  const { dataType, dataKey } = menu;
  let title = '';
  let name = '';
  let keyName = 'defKey';
  let pickGroup = false;
  const getData = () => {
    if (dataType === 'diagram') {
      pickGroup = true;
      name = 'diagrams';
      title = FormatMessage.string({id: 'menus.edit.editRelation'});
      const group = (dataSource?.viewGroups || [])
        .filter(v => v?.refDiagrams?.includes(dataKey))
        .map(v => v.id) || [];
      return {
        ...(dataSource?.diagrams || []).filter(d => d.id === dataKey)[0] || {},
        group,
      };
    } else if (dataType === 'groups') {
      name = 'viewGroups';
      title = FormatMessage.string({id: 'menus.edit.editGroup'});
      return _.get(dataSource, name, []).filter(v => v.id === dataKey)[0] || {};
    } else if (dataType === 'domain') {
      name = 'domains';
      title = FormatMessage.string({id: 'menus.edit.editDomain'});
      return _.get(dataSource, name, []).filter(v => v.id === dataKey)[0] || {};
    } else if (dataType === 'mapping') {
      name = 'dataTypeMapping.mappings';
      title = FormatMessage.string({id: 'menus.edit.editMapping'});
      return _.get(dataSource, name, []).filter(v => v.id === dataKey)[0] || {};
    } else if (dataType === 'dataType') {
      name = 'profile.dataTypeSupports';
      title = FormatMessage.string({id: 'menus.edit.editDataTypeSupport'});
      const temp = (dataSource?.profile?.codeTemplates || [])
        .filter(t => t.applyFor === dataKey)[0] || {};
      return {
        ...temp,
        defaultDb: dataSource?.profile?.default?.db === dataKey,
        defKey: dataSource?.profile?.dataTypeSupports?.filter(d => d.id === temp.applyFor)[0]?.defKey
      };
    } else if (dataType === 'appCode') {
      title = FormatMessage.string({id: 'menus.edit.editAppCode'});
      name = 'profile.dataTypeSupports';
      return dataSource?.profile?.dataTypeSupports?.filter(d => d.id === dataKey)[0]
    }
    return {};
  };
  const oldData = getData();
  addOpt(dataSource, menu, updateDataSource, oldData, title, (data, modal) => {
    const allKeys = (_.get(dataSource, name, [])).map(d => d.defKey || d);
    if ((data[keyName] !== oldData[keyName]) && allKeys.includes(data[keyName])) {
      Modal.error({title: FormatMessage.string({id: 'optFail'}),
        message: FormatMessage.string({id: 'entityAndViewUniquenessCheck'})});
    } else {
      if (dataType === 'diagram') {
        updateDataSource && updateDataSource({
          ...dataSource,
          diagrams: (dataSource?.diagrams || []).map((d) => {
            if (oldData.id === d.id) {
              return {
                ...d,
                defKey: data.defKey,
                defName: data.defName,
              }
            }
            return d;
          }),
          viewGroups: (dataSource?.viewGroups || []).map((v) => {
            let tempDiagramRefs = (v?.refDiagrams || []).filter(d => oldData.id !== d);
            if (data.group.includes(v.id)) {
              tempDiagramRefs.push(oldData.id);
            }
            return {
              ...v,
              refDiagrams: tempDiagramRefs,
            };
          }),
        });
      } else if (dataType === 'mapping') {
       // let domains = _.get(dataSource, 'domains', []);
        let tempDataSource = {
          ...dataSource,
          dataTypeMapping: {
            ...(dataSource?.dataTypeMapping || {}),
            mappings: _.get(dataSource, name, []).map((v) => {
              if (v.id === oldData.id) {
                return _.omit(data, 'group');
              }
              return v;
            })
          },
        };
        updateDataSource && updateDataSource(tempDataSource);
      } else if (dataType === 'dataType') {
        const dataTypeSupports = _.get(dataSource, 'profile.dataTypeSupports', []);
        const defaultData = _.get(dataSource, 'profile.default', {});
        let tempDataSource = {
          ...dataSource,
          profile: {
            ..._.get(dataSource, 'profile', {}),
            default: {
              ...defaultData,
              db: calcDefaultDb(data, oldData, defaultData.db),
            },
            dataTypeSupports: dataTypeSupports.map((d) => {
              if (d.id === oldData.applyFor) {
                return {
                  ...d,
                  defKey: data.defKey,
                };
              }
              return d;
            }),
            codeTemplates: _.get(dataSource, 'profile.codeTemplates', []).map((t) => {
              if (t.applyFor === oldData.applyFor) {
                const ddlFields = defaultTemplate.dbDDLTemplate.concat(defaultTemplate.versionTemplate);
                const useFields = data.type === 'dbDDL' ? ddlFields
                    : defaultTemplate.appCodeTemplate.concat(Object.keys(_.omit(data, [...ddlFields, 'applyFor', 'defKey', 'defaultDb', 'group', 'type'])));
                return {
                  applyFor: t.applyFor,
                  type: data.type,
                  ...useFields.reduce((a, b) => {
                    const temp = {...a};
                    temp[b] = b in data ? data[b] : (oldData[b] || '');
                    return temp;
                  }, {}),
                }
              }
              return t;
            }),
          }
        };
        updateDataSource && updateDataSource(transformFieldType(tempDataSource, defaultData.db));
      } else if (dataType === 'appCode') {
        let tempDataSource = {
          ...dataSource,
          profile: {
            ...dataSource.profile,
            dataTypeSupports: (dataSource.profile?.dataTypeSupports || []).map((d) => {
              if (d.id === oldData.id) {
                return {
                  ...d,
                  defKey: data.defKey,
                };
              }
              return d;
            }),
          }
        };
        updateDataSource && updateDataSource(tempDataSource);
      } else {
        let tempDataSource = {
          ...dataSource,
          [name]: (dataSource?.[name] || []).map((v) => {
            if (v.id === oldData.id) {
              return pickGroup ? data : _.omit(data, 'group');
            }
            return v;
          }),
        };
        if((dataType === 'domain') && (oldData.applyFor !== data.applyFor)) {
          // 如果数据域的applyFor变更 需要调整所有该数据域下的baseType
          tempDataSource = (updateBaseType(tempDataSource, data));
          updateDataSource && updateDataSource(tempDataSource);
          // 通知标签页内的列表更新
          notify('domainChange', data);
        } else {
          updateDataSource && updateDataSource(tempDataSource);
        }
      }
      modal && modal.close();
      Message.success({title: FormatMessage.string({id: 'optSuccess'})});
    }
  });
};

const domainData = [
  {
    type: 'domain',
    parentType: 'domains',
    name: 'domains',
    key: 'id',
    emptyData: emptyDomain,
  },
  {
    type: 'mapping',
    parentType: 'dataTypeMapping',
    name: 'dataTypeMapping.mappings',
    key: 'id',
    emptyData: emptyDataType,
  },
  {
    type: 'dataType',
    parentType: 'dataTypeSupport',
    name: 'profile.dataTypeSupports',
    key: 'id',
    emptyData: emptyCodeTemplate,
  },
  {
    type: 'appCode',
    parentType: 'dataTypeSupport',
    name: 'profile.dataTypeSupports',
    key: 'id',
    emptyData: emptyDataTypeSupport,
  }
];

const getEntityData = (dataSource, data) => {
  const allKeys = [...new Set((data.reduce((p, n) => {
    return p.concat((n.canvasData?.cells || []).filter(c => c.shape === 'table' && c.originKey) .map(c => c.originKey))
  }, [])))];
  return dataSource.entities.filter(e => allKeys.includes(e.id));
};

export const getCopyRealData = (dataSource, data) => {
  // 为了使粘贴数据时 数据域 数据字典 UI建议 能够尽可能的匹配到数据 需要将ID转换成defKey
  if (!dataSource) {
    return data;
  }
  const db = _.get(dataSource, 'profile.default.db', _.get(dataSource, 'profile.dataTypeSupports[0].id'));
  return data.map(d => {
    return {
      ...d,
      indexes: (data.indexes || []).map(i => ({...i, id: Math.uuid()})),
      fields: (d.fields || []).map(f => {
        return {
          ...f,
          id: Math.uuid(),
          otherData: {
            ..._.pick(transform(f, dataSource, db), ['domainData', 'refDictData', 'uiHintData', 'type', 'baseTypeData']),
            id: f.id,
          },
        }
      })
    }
  })
}

export const putCopyRealData = (dataSource, data, needOldId) => {
  if (!dataSource) {
    return data;
  }
  const mappings = dataSource.dataTypeMapping?.mappings || [];
  const db = _.get(dataSource, 'profile.default.db',
      _.get(dataSource, 'profile.dataTypeSupports[0].id'));
  const getDataId = (currentData, copyData, id) => {
    if (!currentData.some(c => c.id === id)) {
      if(copyData) {
        return currentData.find(c => (c.defKey === copyData.defKey) || (c.defName === copyData.defName))?.id;
      }
      return null;
    }
    return id;
  };
  return {
    ..._.omit(data, ['nameTemplate']),
    type: data.type || 'P',
    id: Math.uuid(),
      sysProps: {
          nameTemplate: data?.nameTemplate || data?.sysProps?.nameTemplate,
      },
    ...(needOldId ? {oldId: data.id} : {}),
    indexes: (data.indexes || []).map(i => ({...i, id: Math.uuid()})),
    fields: (data.fields || []).map(f => {
      const domain = getDataId(dataSource.domains || [], f.otherData?.domainData, f.domain);
      return {
        ..._.omit(f, ['otherData']),
        id: Math.uuid(),
        ...(needOldId ? {oldId: f.otherData?.id || f.id} : {}),
        type: (domain ? null : f.otherData?.type) || f.type,
        len: domain ? '' : f.len,
        scale: domain ? '' : f.scale,
        domain: domain || null,
        refDict: getDataId(dataSource.dicts || [], f.otherData?.refDictData, f.refDict),
        uiHint: getDataId(dataSource.profile?.uiHint || [], f.otherData?.uiHintData, f.uiHint),
        baseType: getDataId(dataSource.dataTypeMapping?.mappings || [], f.otherData?.baseTypeData, getFieldBaseType(f, dataSource.domains || [], mappings, db))
      }
    })
  }
};

const copyOpt = (dataSource, menu, type = 'copy', cb) => {
  const { otherMenus = [], groupType, dataType } = menu;
  let tempTypeData = [];
  const checkData = [
    ['entity', 'entities'],
    ['logicEntity', 'logicEntities'],
    ['view', 'views'],
    ['diagram', 'diagrams'],
    ['dict', 'dicts']
  ];
  const getData = (name, data) => {
    return dataSource?.[name].filter((d) => {
      return data.includes(d.id);
    })
  };

  const getCopyTemplateData = (dataSource, copyData) => {
    const codeTemplates = _.get(dataSource, 'profile.codeTemplates', []);
    const copyDataKeys = copyData.map(d => d.id);
    return codeTemplates.filter(c => copyDataKeys.includes(c.applyFor));
  }
  const getResult = (data, group) => {
    const tempOtherMenus = group ? otherMenus.filter(m => m.parentKey === group) : otherMenus;
    return checkData.filter(c => c.includes(dataType)).reduce((pre, next) => {
      let name = next[1];
      if (tempOtherMenus.some(o => o.type === next[1]) && !tempOtherMenus.some(o => o.type === next[0])) {
        // 选中了父节点 复制所有的子节点
        return pre.concat(typeof data === 'function' ? data(name) : data?.[name]);
      } else {
        // 复制选中的子节点
        return pre.concat(getData(name, tempOtherMenus.filter(o => o.type === next[0]).map(o => o.key)));
      }
    }, []);
  };
  if (otherMenus.length > 0){
    // 组装各类复制数据
    // 获取各个分类所有的数据
    const domainIndex = domainData.findIndex((d) => d.type === dataType);
    if (domainIndex > -1) {
      // 数据域相关操作
      const { name, key } = domainData[domainIndex];
      const selectKey = otherMenus.filter(m => m.type === dataType).map(m => m.key || m.id);
      tempTypeData = _.get(dataSource, name, []).filter(d => selectKey.includes(d[key]));
    } else {
      if (groupType === 'modalGroup') {
        // 如果是在分组模式下
        // 先计算每个分组的数据 然后合并所有的数据
        tempTypeData = (dataSource?.viewGroups || []).concat(getUnGroup(dataSource)).reduce((a, b) => {
          return a.concat(getResult((names) => {
            return getData(names, b[`ref${names.slice(0, 1).toUpperCase() + names.slice(1)}`]);
          }, b.id));
        }, []);
      } else {
        tempTypeData = getResult(dataSource);
      }
    }
    if (cb) {
       cb({ type, data: tempTypeData });
    } else {
      // 如果是复制关系图，需要将关系图下的表也同时带上
      const other = {};
      if(dataType === 'diagram' || dataType === 'diagrams') {
        other.otherData = getCopyRealData(dataSource, getEntityData(dataSource, tempTypeData));
      } else if (dataType === 'entities' || dataType === 'entity' || dataType === 'view' || dataType === 'views') {
        tempTypeData = getCopyRealData(dataSource, tempTypeData);
      } else if(dataType === 'dataType' || dataType === 'appCode'){
        other.otherData = getCopyTemplateData(dataSource, tempTypeData);
      }
      Copy({ type, data: tempTypeData, ...other }, FormatMessage.string({id: `${type}Success`}));
    }
  } else {
    Message.warring({title: FormatMessage.string({id: `${type}Warring`})});
  }
};

const cutOpt = (dataSource, menu) => {
  copyOpt(dataSource, menu, 'cut')
};

const getOptConfig = (dataType, dataSource) => {
  const entityConfig = {
    type: ['entities', 'entity'],
    mainKey: 'entities',
    key: 'id',
    emptyData: {
      ...getEmptyEntity(),
      headers: resetHeader(dataSource, {})
    },
    viewRefs: 'refEntities',
  };
  const logicEntityConfig = {
    type: ['logicEntities', 'logicEntity'],
    mainKey: 'logicEntities',
    key: 'id',
    emptyData: {
      ...getEmptyEntity(),
      headers: resetHeader(dataSource, {})
    },
    viewRefs: 'refLogicEntities',
  };
  const viewConfig = {
    type: ['views', 'view'],
    mainKey: 'views',
    key: 'id',
    emptyData: getEmptyView(),
    viewRefs: 'refViews',
  };
  const diagramConfig = {
    type: ['diagrams', 'diagram'],
    mainKey: 'diagrams',
    key: 'id',
    emptyData: emptyDiagram,
    viewRefs: 'refDiagrams',
  };
  const dictConfig = {
    type: ['dicts', 'dict'],
    mainKey: 'dicts',
    key: 'id',
    emptyData: emptyDict,
    viewRefs: 'refDicts',
  };
  const domianConfig = {
    type: ['domain'],
    mainKey: 'domains',
    key: 'id',
    emptyData: emptyDomain,
  };
  const mappingConfig = {
    type: ['mapping'],
    mainKey: 'dataTypeMapping.mappings',
    key: 'id',
    emptyData: emptyDataType,
  };
  const dataTypeSupportConfig = {
    type: ['dataType', 'appCode'],
    mainKey: 'profile.dataTypeSupports',
    key: 'id',
    emptyData: emptyDataTypeSupport,
  };
  const optConfigMap = {
    entityConfig,
    viewConfig,
    diagramConfig,
    dictConfig,
    domianConfig,
    mappingConfig,
    dataTypeSupportConfig,
    logicEntityConfig
  };
  return Object.keys(optConfigMap)
    .filter(config => optConfigMap[config].type.includes(dataType))
    .map(config => optConfigMap[config])[0];
};

const injectEntities = (dataSource, entities, data) => {
  const currentEntities = dataSource.entities || [];
  // 找出重复的表替换
  const sameEntity = [];
  // 不存在的表新增
  const newEntity = [];
  entities.forEach(e => {
    const current = currentEntities.find(c => c.defKey === e.defKey);
    if (current) {
      sameEntity.push({oldId: e.oldId, newId: current.id})
    } else {
      newEntity.push(e);
    }
  });
  const updateEntity = sameEntity.concat(newEntity).filter(e => e.oldId);
  const findNewId = (id) => {
    const currentChange = updateEntity.find(e => e.oldId === id);
    if(currentChange) {
      return currentChange.newId || currentChange.id;
    }
    return id;
  }
  const findOriginKey = (id, cells) => {
    return cells.find(c => c.id === id)?.originKey;
  }
  const findNewFieldId = (entityId, filedId) => {
    if(filedId && entityId) {
      const fieldIdArray = filedId.split(separator);
      const preEntity = entities.find(e => e.oldId === entityId);
      const preField = (preEntity?.fields || []).find(f => f.oldId === fieldIdArray[0]);
      const currentEntity = sameEntity.find(s => s.oldId === entityId);
      if(currentEntity) {
        const currentEntityData = currentEntities.find(e => e.id === currentEntity.newId);
        if(currentEntityData) {
          const id = (currentEntityData.fields || []).find(f => f.defKey === preField?.defKey)?.id;
          return id ? filedId.replace(preField.oldId, id) : null;
        }
        return null;
      }
      return preField ? filedId.replace(preField.oldId, preField.id) : null;
    }
    return null;
  }
  return {
    data: data.map(d => {
      return {
        ...d,
        canvasData: {
          ...d.canvasData,
          cells: (d.canvasData.cells || []).map(c => {
            if (c.shape === 'table' && c.originKey) {
              return {
                ...c,
                originKey: findNewId(c.originKey),
              };
            } else if(c.shape === 'erdRelation') {
              const cells = (d.canvasData.cells || [])
                  .filter(c => c.shape === 'table' && c.originKey);
              const sourceOriginKey = findOriginKey(c.source.cell, cells);
              const targetOriginKey = findOriginKey(c.target.cell, cells);
              const newSourcePort = findNewFieldId(sourceOriginKey, c.source.port);
              const newTargetPort = findNewFieldId(targetOriginKey, c.target.port);
              if(newSourcePort && newTargetPort) {
                return {
                  ...c,
                  source: {
                    ...c.source,
                    port: newSourcePort
                  },
                  target: {
                    ...c.target,
                    port: newTargetPort
                  },
                }
              }
              return null;
            }
            return c;
          }).filter(c => !!c)
        }
      };
    }),
    newEntity: newEntity.map(e => {
      return {
        ..._.omit(e, ['oldId']),
        fields: (e.fields || []).map(f => {
          return {
            ..._.omit(f, ['oldId']),
          }
        })
      }
    }),
    sameEntity
  }
}

const pasteOpt = (dataSource, menu, updateDataSource) => {
  const { dataType, parentKey, dataKey } = menu;
  Paste((value) => {
    let data = {};
    try {
      data = JSON.parse(value);
      const config = getOptConfig(dataType, dataSource);
      const validate = (dataType === 'mapping' || dataType === 'dataType' || dataType === 'appCode')
        ? validateItemInclude : validateItem;
      // 兼容未调整的属性 使其校验通过
      let emptyData = config.emptyData;
      if(config.mainKey === 'entities' || config.mainKey === 'views') {
        emptyData = {
          ...emptyData,
          nameTemplate: '',
          type: ''
        };
      }
      const newData = (data?.data || [])
          .filter(e => validate(e, emptyData)).filter(e => {
            if(config.mainKey === 'logicEntities') {
              return e.type === 'L'
            } else if(config.mainKey === 'entities') {
              return e.type !== 'L'
            }
            return true;
          });
      const newDataKeys = newData.map(e => e[config.key]);
      const oldData = _.get(dataSource, config.mainKey, []).filter((e) => {
        if (data?.type === 'cut') {
          return !newDataKeys.includes(e[config.key]);
        }
        return true;
      });
      const newGroupData = config.viewRefs && (dataSource?.viewGroups || []).map(v => {
        if (data?.type === 'cut') {
          return {
            ...v,
            [config.viewRefs]: (v[config.viewRefs] || []).filter(k => !newDataKeys.includes(k)),
          }
        }
        return v;
      });
      let tempCodeTemplates = [];
      const codeTemplates = (dataSource.profile.codeTemplates || []);
      const allKeys = oldData.map(e => e.defKey);
      let realData = newData
        .map((e) => {
          const key = validateKey(e.defKey, allKeys);
          allKeys.push(key);
          const id = Math.uuid();
          if (dataType === 'dataType' || dataType === 'appCode') {
            const newTemplate = (data.otherData || []).find(c => c.applyFor === e.id);
            if(newTemplate) {
              tempCodeTemplates.push({
                ...newTemplate,
                applyFor: id,
              });
            }
          } else if (dataType === 'entities' || dataType === 'entity' || dataType === 'view' || dataType === 'views') {
            return {
              ...putCopyRealData(dataSource, e),
              id,
              defKey: key,
            };
          }
          return {
            ...e,
            id,
            defKey: key,
          };
        });
      if (realData.length === 0) {
        Message.warring({title: FormatMessage.string({id: 'pasteWarring'})});
      } else {
        let injectData;
        if (config.mainKey === 'diagrams' && data.otherData) {
          injectData = injectEntities(dataSource, data.otherData.map(d => putCopyRealData(dataSource, d, true)), realData);
          realData = injectData.data;
        }
        const mainKeys = config.mainKey.split('.');
        let tempNewData = {};
        if (mainKeys.length > 1) {
          tempNewData = _.set(dataSource, mainKeys, insertArray(oldData, dataKey, realData));
        } else {
          if (injectData) {
            tempNewData.entities = (dataSource.entities || []).concat(injectData.newEntity);
          }
          tempNewData[config.mainKey] = insertArray(oldData, dataKey, realData);
        }
        if (dataType === 'dataType' || dataType === 'appCode') {
          tempNewData.profile.codeTemplates = codeTemplates.concat(tempCodeTemplates);
        }
        if (parentKey) {
          updateDataSource({
            ...dataSource,
            ...tempNewData,
            viewGroups: newGroupData ? newGroupData.map((v) => {
              if (v.id === parentKey) {
                const otherGroup = {};
                if (injectData) {
                  otherGroup.refEntities = v.refEntities.concat((injectData.newEntity || []).concat(injectData.sameEntity || []).map(e => e.id || e.newId));
                }
                return {
                  ...v,
                  [config.viewRefs]: insertArray(v[config.viewRefs] || [], dataKey, realData.map(e => e[config.key])),
                  ...otherGroup,
                }
              }
              return v;
            }) : (dataSource.viewGroups || [])
          });
        } else {
          updateDataSource({
            ...dataSource,
            ...tempNewData,
            viewGroups: newGroupData ? newGroupData : (dataSource.viewGroups || []),
          });
        }
        Message.success({title: FormatMessage.string({id: 'pasteSuccess'})});
      }
    } catch (e) {
      Message.warring({title: FormatMessage.string({id: 'pasteWarring'})});
    }
  });
};

const deleteOpt = (dataSource, menu, updateDataSource, tabClose) => {
  Modal.confirm({
    title: FormatMessage.string({id: 'deleteConfirmTitle'}),
    message: FormatMessage.string({id: 'deleteConfirm'}),
    onOk: () => {
      const { dataType, dataKey, otherMenus = [] } = menu;
      const domain = domainData.filter(d => d.type === dataType)[0];
      if (dataType === 'groups') {
        updateDataSource && updateDataSource({
          ...dataSource,
          viewGroups: (dataSource?.viewGroups || []).filter(v => v.id !== dataKey),
        });
        Message.success({title: FormatMessage.string({id: 'deleteSuccess'})});
      } else if (domain && domain.type === 'mapping') {
        const deleteData = otherMenus.filter(m => m.type === dataType).map(m => m.key);
        updateDataSource && updateDataSource({
          ...dataSource,
          dataTypeMapping: {
            ...dataSource.dataTypeMapping,
            mappings: (dataSource.dataTypeMapping?.mappings || [])
                .filter(d => !deleteData.includes(d.id))
          }
        });
        Message.success({title: FormatMessage.string({id: 'deleteSuccess'})});
      } else if(domain && (domain.type === 'dataType' || domain.type === 'appCode')) {
        const deleteData = otherMenus.filter(m => m.type === dataType).map(m => m.key || m.id);
        const dataTypeSupports = (dataSource.profile?.dataTypeSupports || [])
          .filter(d => !deleteData.includes(d.id));
        const db = _.get(dataSource, 'profile.default.db');
        updateDataSource && updateDataSource(transformFieldType({
          ...dataSource,
          profile: {
            ...dataSource.profile,
            default: {
              ...dataSource.profile.default,
              db: !dataTypeSupports.map(d => d.id).includes(db) ? (dataTypeSupports[0]?.id || '') : db,
            },
            dataTypeSupports,
            codeTemplates: (dataSource.profile?.codeTemplates || [])
                .filter(d => !deleteData.includes(d.applyFor))
          }
        }, db));
        Message.success({title: FormatMessage.string({id: 'deleteSuccess'})});
      } else {
        const optConfig = getOptConfig(dataType);
        if (optConfig) {
          copyOpt(dataSource, menu, 'delete', (data) => {
            const deleteData = (data?.data || []);
            const deleteDataKeys = deleteData.map(e => e[optConfig.key]);
            const newData = (dataSource?.[optConfig.mainKey] || [])
              .filter(e => !deleteDataKeys.includes(e[optConfig.key]));
            const newGroupData = (dataSource?.viewGroups || []).map(v => ({
              ...v,
              [optConfig.viewRefs]: (v[optConfig.viewRefs] || []).filter(k => !deleteDataKeys.includes(k)),
            }));
            const tempDataSource = {
              ...dataSource,
              viewGroups: newGroupData,
              [optConfig.mainKey]: newData,
            };
            updateDataSource && updateDataSource({
              ...tempDataSource,
              views: optConfig.mainKey === 'entities' ? (tempDataSource.views || []).map(v => {
                // 需要移除视图内与该数据表有关的内容
                if (v.refEntities?.some(ref => deleteDataKeys.includes(ref))) {
                  return {
                    ...v,
                    refEntities: v.refEntities?.filter(ref => !deleteDataKeys.includes(ref)),
                    fields: v.fields?.map(f => {
                      if (deleteDataKeys.includes(f.refEntity)) {
                        return _.omit(f, ['refEntity', 'refEntityField']);
                      }
                      return f;
                    })
                  };
                }
                return v;
              }) : tempDataSource.views,
            });
            tabClose && tabClose(deleteDataKeys.map(d => d + separator + optConfig.type[1]), true);
            Message.success({title: FormatMessage.string({id: 'deleteSuccess'})});
          });
        }
      }
    },
  });
};

const clearOpt = (dataSource, menu, updateDataSource) => {
  const { dataKey, dataType } = menu;
  Modal.confirm({
    title: FormatMessage.string({id: 'clearConfirmTitle'}),
    message: FormatMessage.string({id: 'clearConfirm'}),
    onOk: () => {
      const domain = domainData.filter(d => d.parentType === dataType)[0];
      // 数据域相关操作
      if (domain) {
        if (dataType === 'dataTypeMapping') {
          updateDataSource && updateDataSource({
            ...dataSource,
            dataTypeMapping: {
              referURL: '',
              mappings: [],
            },
          });
        } else if (dataType === 'domains') {
          updateDataSource && updateDataSource({
            ...dataSource,
            domains: [],
          });
        } else if (dataType === 'dataTypeSupport') {
          const newCodeTemplate = (dataSource?.profile?.codeTemplates || []).filter(c => {
            return c.applyFor === 'dictSQLTemplate' || c.type === 'appCode';
          });
          updateDataSource && updateDataSource({
            ...dataSource,
            profile: {
              ...dataSource.profile,
              dataTypeSupports: (dataSource?.profile?.dataTypeSupports || [])
                  .filter(d => newCodeTemplate.findIndex(c => c.applyFor === d.id) > -1),
              codeTemplates: newCodeTemplate,
            },
          });
        }
      } else {
        updateDataSource && updateDataSource({
          ...dataSource,
          viewGroups: (dataSource?.viewGroups || []).map((v) => {
            if (v.id === dataKey) {
              return {
                ...v,
                refEntities:[],
                refViews:[],
                refDiagrams:[],
                refDicts:[]
              }
            }
            return v;
          }),
        });
      }
      Message.success({title: FormatMessage.string({id: 'clearSuccess'})});
    }
  });
};

const moveOpt = (dataSource, menu, updateDataSource) => {
  const { dataType, dataKey, otherMenus } = menu;
  let modal = null;
  const getRefName = (type) => {
    switch (type) {
      case 'entity': return 'refEntities';
      case 'view': return 'refViews';
      case 'diagram': return 'refDiagrams';
      case 'dict': return 'refDicts';
      case 'logicEntity': return 'refLogicEntities';
    }
  };
  const refName = getRefName(dataType);
  let oldData = (dataSource?.viewGroups || []).filter(v => v[refName]?.includes(dataKey)).map(v => v.id);
  const allGroupData = otherMenus.reduce((a, b) => {
    const tempA = {...a};
    const type = getRefName(b.type);
    if (type) {
      if (!tempA[type]) {
        tempA[type] = [];
      }
      tempA[type].push(b.key);
    }
    return tempA;
  }, {});
  const dataChange = (groups) => {
    oldData = groups;
  };
  const onCancel = () => {
    modal && modal.close();
  };
  const onOK = () => {
    const selectGroups = [...new Set(oldData)];
    updateDataSource && updateDataSource({
      ...dataSource,
      viewGroups: (dataSource?.viewGroups || []).map((v) => {
        if (selectGroups.includes(v.id)) {
          return {
            ...v,
            ...Object.keys(allGroupData).reduce((a, b) => {
              const tempA = {...a};
              tempA[b] = [...new Set((v[b] || []).concat(allGroupData[b]))];
              return tempA;
            },{}),
          }
        } else {
          return {
            ...v,
            ...Object.keys(allGroupData).reduce((a, b) => {
              const tempA = {...a};
              tempA[b] = (v[b] || []).filter(k => !allGroupData[b].includes(k));
              return tempA;
            },{}),
          }
        }
      }),
    });
    Message.success({title: FormatMessage.string({id: 'moveSuccess'})});
    modal && modal.close();
  };
  modal = openModal(
    <SelectGroup dataSource={dataSource} dataChange={dataChange} data={oldData}/>,
    {
      title: FormatMessage.string({id: 'group.selectGroup'}),
      buttons: [
        <Button type='primary' key='onOK' onClick={onOK}>
          <FormatMessage id='button.ok'/>
        </Button>,
        <Button key='onCancel' onClick={onCancel}>
          <FormatMessage id='button.cancel'/>
        </Button>],
    }
  )
};
