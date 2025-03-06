import React, {useState, useMemo, useEffect, useRef} from 'react';
import _ from 'lodash/object';
import moment from 'moment';
import {
  Menu,
  Tab,
  Button,
  Loading,
  openModal,
  Message,
  Icon,
  Modal,
  FormatMessage,
  Checkbox, Tooltip, Upload, Terminal, Download,
  VersionListBar,
  VersionInfoBar, List, CompareList,
} from 'components';
import Dict from '../container/dict';
import Entity from '../container/entity';
import View from '../container/view';
import Relation from '../container/relation';
import Config from '../container/config';
import DbConnect from '../container/dbconnect';
import DbReverseParse from '../container/tools/dbreverseparse';
import ExportSql from '../container/tools/exportsql';
import ImportPd from '../container/tools/importpd';
import ImportExcel from '../container/tools/excel';
import ExportWord from '../container/tools/word';
import StandardField from '../container/standardfield';
import HeaderTool from './HeaderTool';
import MessageHelp from './MessageHelp';
import ToggleCase from '../container/tools/togglecase';
import CompareTable from '../container/tools/comparetable';
import History from '../container/tools/operationshistory';
import CheckRule from '../container/checkrule';
import { separator } from '../../../profile';
import { getMenu, getMenus, dealMenuClick } from '../../lib/contextMenuUtil';
import { moveArrayPosition } from '../../lib/array_util';
import AppCodeEdit from '../container/appcode/AppCodeEdit';
import { generateFile } from '../../lib/generatefile';
import {
  validateKey,
  updateAllData,
  allType,
  pdman2sino,
  emptyDictSQLTemplate,
  reduceProject,
  calcDomains,
  reset,
  updateHeaders,
  mergeDataSource,
  mergeData,
  mergeDomains,
  resetHeader,
  validateNeedSave,
  toggleCaseDataSource,
  toggleCaseEntityOrView, getUnGroup,
} from '../../lib/datasource_util';
import {
  clearAllTabData,
  getAllTabData,
  getDataByTabId,
  replaceDataByTabId,
  setDataByTabId,
} from '../../lib/cache';
import {removeSave, Save} from '../../lib/event_tool';

import './style/index.less';
import {getPrefix} from '../../lib/prefixUtil';
import {addBodyEvent, removeBodyEvent} from '../../lib/listener';
import {firstUp} from '../../lib/string';
import {connectDB, getLogPath, selectWordFile, selectDir, showItemInFolder} from '../../lib/middle';
import { imgAll } from '../../lib/generatefile/img';
import {compareVersion} from '../../lib/update';
import {notify} from '../../lib/subscribe';
import {READING} from '../../lib/variable';
import LogicEntity from '../container/logicentity';

const TabItem = Tab.TabItem;

const Index = React.memo(({getUserData, mode, isChildWindow,
                            open, openTemplate, config, common, prefix, projectInfo,
                            ...restProps}) => {
  const isRefreshRef = useRef(false);
  const [mainId, setMainId] = useState(Math.uuid());
  const [tabs, updateTabs] = useState([]);
  const autoSaveRef = useRef(null);
  const isResize = useRef({status: false});
  const resizeContainer = useRef(null);
  const resizeOther = useRef(null);
  const menuContainerModel = useRef(null);
  const menuContainerDataType = useRef(null);
  const menuContainerCode = useRef(null);
  const activeTabStack = useRef([]);
  const importPdRef = useRef(null);
  const checkRuleRef = useRef(null);
  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;
  const dataSourceRef = useRef({});
  dataSourceRef.current = restProps.dataSource;
  const appCodeRef = useRef(null);
  const menuContainerWidth = 290;
  const menuMinWidth = 50;
  const menuNorWidth = parseFloat(dataSourceRef.current?.profile?.menuWidth)
    || (menuContainerWidth - menuMinWidth);
  const configRef = useRef({});
  configRef.current = config;
  const [groupType, setGroupType] = useState(restProps.dataSource?.profile?.modelType || 'modalAll');
  const groupTypeRef = useRef(groupType);
  groupTypeRef.current = groupType;
  const [activeKey, updateActiveKey] = useState('');
  const tabInstanceRef = useRef({});
  const menuModelRef = useRef(null);
  const menuDomainRef = useRef(null);
  const currentMenu = useRef(null);
  const standardFieldRef = useRef(null);
  const activeKeyRef = useRef(activeKey);
  activeKeyRef.current = activeKey;
  const activeTab = tabs.filter(t => t.tabKey === activeKey)[0];
  const [contextMenus, updateContextMenus] = useState([]);
  const [draggable, setDraggable] = useState(false);
  const { lang } = config;
  const cavRefArray = useRef([]);
  const headerToolRef = useRef(null);
  //const [menus, setMenus] = useState([]);
  const [menuType, setMenuType] = useState('1');
  const [ruleConfigOpen, openCheckRuleConfig] = useState(false);
  const [versionType, setVersionType] = useState('1');
  const currentVersionRef = useRef(null);
  const currentMetaRef = useRef(null);
  const projectInfoRef = useRef(projectInfo);
  projectInfoRef.current = projectInfo;
  const refreshProject = () => {
    Modal.confirm({
      title: FormatMessage.string({id: 'refreshConfirmTitle'}),
      message: FormatMessage.string({id: 'refreshConfirm'}),
      onOk:() => {
        isRefreshRef.current = true;
        if (projectInfoRef.current) {
          open(FormatMessage.string({id: 'readProject'}), projectInfoRef.current);
        } else {
          openTemplate(null, null, FormatMessage.string({id: 'readProject'}));
        }
      },
    });
  };
  const updateGroupType = (t) => {
    if(dataSourceRef.current.profile?.modelType !== t)  {
      restProps.update({
        ...dataSourceRef.current,
        profile: {
          ...dataSourceRef.current.profile,
          modelType: t,
        },
      });
      setGroupType(t);
    }
  };
  useEffect(() => {
    if(isRefreshRef.current) {
      isRefreshRef.current = false;
      updateTabs((pre) => {
        return pre.filter((p) => {
          const { name } = allType.filter(t => t.type === p.type)[0];
          return restProps.dataSource[name].findIndex(d => d.id === p.menuKey) > -1 || p.menuKey === 'home-cover';
        });
      });
      setMainId(Math.uuid());
    }
  }, [restProps.dataSource]);
  const saveProject = (saveAs, callback) => {
    const isSaveAs = saveAs || !projectInfoRef.current;
    const newData = updateAllData(dataSourceRef.current);
    if (newData.result.status) {
      restProps.save(newData.dataSource, FormatMessage.string({id: 'saveProject'}), isSaveAs, (err) => {
        if (!err) {
          if (!isSaveAs) {
            restProps?.update(newData.dataSource);
          }
          Message.success({title: FormatMessage.string({id: 'saveSuccess'})});
          clearAllTabData();
          callback && callback(false);
        } else {
          callback && callback(true);
          Message.error({title: `${FormatMessage.string({id: 'saveFail'})}:${err?.message}`});
        }
      });
    } else {
      callback && callback(true);
      Modal.error({
        title: FormatMessage.string({id: 'optFail'}),
        message: newData.result.message,
        id: 'saveError',
      });
    }
  };
  useEffect(() => {
    Save(() => {
      saveProject();
    });
    return () => {
      removeSave();
    };
  }, [restProps.dataSource, tabs]);
  const validateTableStatus = (key) => {
    return tabsRef.current.findIndex(t => t.tabKey === key) >= 0;
  };
  const renderReady = (cav, key) => {
    cavRefArray.current = cavRefArray.current.filter(c => c.key !== key)
        .concat({
      cav,
      key,
    });
  };
  const updateNavEmptyHide = (t) => {
    restProps.update({
      ...dataSourceRef.current,
      profile: {
        ...dataSourceRef.current.profile,
        navEmptyHide: t,
      },
    });
  };
  const _groupMenuChange = () => {
    (currentMenu.current || menuModelRef.current)?.restSelected?.();
    updateGroupType(groupTypeRef.current === 'modalAll' ?  'modalGroup' : 'modalAll');
  };
  const onLocation = (e) => {
    e.stopPropagation();
    const activeArray = activeKeyRef.current?.split(separator) || [];
    menuModelRef.current?.jumpSimplePosition(activeArray[0], activeArray[1]);
  };
  const getCurrentCav = () => {
    return cavRefArray.current.filter(cav => activeKeyRef.current === cav.key)[0]?.cav;
  };
  useEffect(() => {
    const cavRef = getCurrentCav();
    if (cavRef) {
      setDraggable(true);
    } else {
      setDraggable(false);
    }
  }, [activeKey]);
  const _tabChange = (menuKey) => {
    updateActiveKey(menuKey);
    activeTabStack.current = activeTabStack.current.filter(k => k !== menuKey);
    activeTabStack.current.push(menuKey);
  };
  const _tabClose = (tabKey, force) => {
    const closeTab = () => {
      const tabKeys = [].concat(tabKey);
      // 重新设置激活的tab页
      let newActiveKey = null;
      activeTabStack.current = activeTabStack.current.filter(k => !tabKeys.includes(k));
      if (tabKeys.includes(activeKey)) {
        newActiveKey = activeTabStack.current[activeTabStack.current.length - 1];
      }
      updateTabs((pre) => {
        return pre.filter(t => !tabKeys.includes(t.tabKey));
      });
      cavRefArray.current = cavRefArray.current.filter(c => !tabKeys.includes(c.key));
      updateActiveKey((pre) => {
        return newActiveKey || pre;
      });
    };
    const tabData = getDataByTabId(tabKey);
    if (!force && (tabData && !tabData?.isInit)) {
      Modal.confirm({
        title: FormatMessage.string({id: 'saveConfirmTitle'}),
        message: FormatMessage.string({id: 'saveConfirm'}),
        onOk:() => {
          closeTab();
        },
      });
    } else {
      closeTab();
    }
  };
  const _tabCloseOther = (tabKey) => {
    activeTabStack.current = [tabKey];
    updateTabs(pre => pre.filter(t => t.tabKey === tabKey));
    cavRefArray.current = cavRefArray.current.filter(c => c.key !== tabKey);
    updateActiveKey(tabKey);
    _tabChange(tabKey);
  };
  const _tabCloseAll = () => {
    updateTabs([]);
    cavRefArray.current = [];
    activeTabStack.current = [];
    updateActiveKey('');
  };
  const _onMenuClick = (menuKey, type, parentKey, icon, param) => {
    console.log(menuKey, type, parentKey, icon);
    const tabKey = menuKey + separator + type;
    const tempTabs = [...tabsRef.current];
    if (!tempTabs.some(t => t.tabKey === tabKey)) {
      tempTabs.push({
        tabKey,
        menuKey,
        type,
        icon,
        style: type === 'diagram' ? { overflow: 'hidden' } : {},
        param,
      });
    } else if (param){
      tabInstanceRef.current[tabKey].twinkle(param.defKey);
    }
    updateTabs(tempTabs);
    updateActiveKey(tabKey);
    activeTabStack.current = activeTabStack.current.filter(k => k !== tabKey);
    activeTabStack.current.push(tabKey);
  };
  const _onContextMenu = (key, type, selectedMenu, parentKey) => {
    updateContextMenus(getMenus(key, type, selectedMenu, parentKey, groupTypeRef.current));
  };
  const _contextMenuClick = (e, m, callback) => {
    dealMenuClick(dataSourceRef.current, m, restProps?.update, _tabClose,
        // eslint-disable-next-line no-use-before-define
        callback, genImg, _jumpDetail);
  };
  const getDataSource = () => {
    return dataSourceRef.current;
  };
  const resize = (factor) => {
    const cavRef = getCurrentCav();
    if (cavRef) {
      cavRef.validateScale(factor);
    }
  };
  const genImg = (useBase = false, filterDiagrams = [], imageType = 'svg') => {
    const currentDiagrams = dataSourceRef.current?.diagrams || [];
    const diagrams = filterDiagrams.length === 0 ? currentDiagrams
        : currentDiagrams.filter(d => filterDiagrams.includes(d.id));
    return new Promise((resolve) => {
      const length = diagrams.length || 0;
      let count = 0;
      restProps.openLoading(FormatMessage.string({
        id: 'toolbar.exportWordStep1',
        data: { count, length },
      }));
      imgAll({
        ...dataSourceRef.current,
        diagrams,
      }, () => {
        count += 1;
        restProps.openLoading(FormatMessage.string({
          id: 'toolbar.exportWordStep1',
          data: { count, length },
        }));
      }, useBase, imageType).then((res) => {
        restProps.closeLoading();
        resolve(res);
      }).catch(() => {
        restProps.closeLoading();
      });
    });
  };
  const generateSimpleFile = (fileType) => {
    generateFile(fileType, dataSourceRef.current, (callback) => {
      genImg(true, [], 'svg').then((res) => {
        callback(res);
      });
    });
  };

  const dealExportFile = (result, file) => {
    if (result.status === 'FAILED') {
      const termReady = (term) => {
        term.write(typeof result.body === 'object' ? JSON.stringify(result.body, null, 2)
            : result.body);
      };
      restProps.closeLoading();
      Modal.error({
        bodyStyle: {width: '80%'},
        contentStyle: {width: '100%', height: '100%'},
        title: FormatMessage.string({id: 'optFail'}),
        message: <div>
          <div style={{textAlign: 'center'}}><FormatMessage id='dbConnect.log'/><a onClick={showItemInFolder}>{getLogPath()}</a></div>
          <Terminal termReady={termReady}/>
        </div>,
      });
    } else {
      restProps.closeLoading();
      Modal.success({
        title: FormatMessage.string({
          id: 'toolbar.exportSuccess',
        }),
        message: FormatMessage.string({
          id: 'toolbar.exportPath',
          data: {path: file},
        }),
      });
    }
  };

  const exportExcel = () => {
    selectDir(dataSourceRef.current.name, 'xlsx')
        .then((file) => {
          restProps.openLoading(FormatMessage.string({id: 'toolbar.exportExcel'}));
          connectDB(dataSourceRef.current, configRef.current, {
            sinerFile: projectInfo,
            outFile: file,
          }, 'GenExcelImpl', (result) => {
            dealExportFile(result, file);
          });
        });
  };
  const exportWord = () => {
    openModal(<ExportWord
      save={restProps.save}
      projectInfo={projectInfoRef.current}
      dataSource={dataSourceRef.current}
      onOk={(t, filterDataSource) => {
      selectWordFile(dataSourceRef.current, t)
          .then(([dir, template]) => {
            genImg(false, [], 'png').then((imgDir) => {
              //console.log(template, imgDir);
              restProps.openLoading(FormatMessage.string({id: 'toolbar.exportWordStep2'}));
              connectDB(filterDataSource || dataSourceRef.current, configRef.current, {
                sinerFile: projectInfo,
                docxTpl: template,
                imgDir: imgDir,
                imgExt: '.png',
                outFile: dir,
              }, 'GenDocx', (result) => {
                dealExportFile(result, dir);
              });
            });
          });
    }}/>, {
      bodyStyle: { width: '70%' },
      title: FormatMessage.string({id: 'toolbar.exportWord'}),
    });
  };
  const exportImg = (type) => {
    const cavRef = getCurrentCav();
    cavRef.exportImg(type);
  };
  /**
   * 计算类型的度量，长度,精度
   * 初衷：各个数据库类型和写法的不一致也能在逆向解析中成功识别到domain，比如 整型字段
   * mysql: INT
   * oracle: NUMBER(10), 如果也写成int，则oracle中会是 NUMBER(38)
   * 在oralce中得到的某个field为：
   * {
   *   "len": 10,
   *   "scale": null,
   *   "type": "NUMBER",
   *   "typeFullName": "NUMBER(10)"
   * }
   * 就能匹配上如下的mapping和domain了
   * 如下的mapping：
   * {
   *   "defKey": "int",
   *   "id": "IDxINT",
   *   "defName": "整数",
   *   "IDxMYSQL": "INT",
   *   "IDxORACLE": "NUMBER(10)",
   *   "IDxJAVA": "Integer"
   * },
   * 以及如下的domain定义：
   * {
   *   "defKey": "Int",
   *   "defName": "整数(INT)",
   *   "applyFor": "IDxINT",
   *   "len": "",
   *   "scale": "",
   *   "uiHint": "",
   *   "id": "IDxDOMAINxInt"
   * }
   * @param {String} len - 字段长度
   * @param {String} scale - 字段精度
   * @returns (长度[,精度]) 或者 ''
   */
  const calcMeasure = (len = '', scale = '') => {
    if (!len) {
      return '';
    }
    if (!scale) {
      return `(${len})`;
    }
    return `(${len},${scale}`;
  };
  const calcDomain = (data = [], dbKey = null, finalDomains) => {
    const dataTypeSupports = _.get(dataSourceRef.current, 'profile.dataTypeSupports', []);
    const defaultDb = _.get(dataSourceRef.current, 'profile.default.db', dataTypeSupports[0]);
    const mappings = _.get(dataSourceRef.current, 'dataTypeMapping.mappings', []);
    const domains = finalDomains || _.get(dataSourceRef.current, 'domains', []);
    const dbConn = dataSourceRef.current?.dbConn || [];
    const currentDb = dbConn.filter(d => d.id === dbKey)[0]?.type || defaultDb;
    const omitNames = ['autoIncrementName', 'notNullName', 'primaryKeyName', 'typeFullName', 'rowNo', 'typeFullName'];
    return data.map((d) => {
      return {
        ...updateHeaders(d, 'entity', true),
        fields: (d.fields || []).map((f) => {
          const domainData = domains.map((domain) => {
            const mapping = mappings.filter(m => m.id === domain.applyFor)[0];
            return {
              id: domain.id,
              // 为了存储到后面的 baseType
              applyFor: domain.applyFor,
              type: `${mapping?.[currentDb]?.toLocaleLowerCase()}${calcMeasure(domain.len || '', domain.scale || '')}`,
            };
          }).filter(domain => domain.type === `${f.type?.toLocaleLowerCase()}${calcMeasure(f.len || '', f.scale || '')}`)[0];
          const domain = domainData?.id || '';
          if (domain) {
            return {
              ..._.omit(f, omitNames),
              domain,
              len: '',
              scale: '',
              // 有domain后，type置空，才能根据domain以及目标数据库来动态生成类型
              type: '',
              baseType: domainData.applyFor,
            };
          }
          return {
            ..._.omit(f, omitNames),
            len: f.len === null ? '' : f.len,
            scale: f.scale === null ? '' : f.scale,
            domain: '',
          };
        }),
      };
    });
  };
  const injectDataSource = (dataSource, modal) => {
    restProps?.update({...dataSource});
    Message.success({title: FormatMessage.string({id: 'optSuccess'})});
    modal && modal.close();
  };
  const importFromPDMan = (type) => {
    Upload('application/json', (data, file) => {
      try {
        let newData = (type === 'chiner' || type === 'PDManer') ? JSON.parse(data) : pdman2sino(JSON.parse(data), file.name);
        let modal;
        const onCancel = () => {
          modal.close();
        };
        const compareType = compareVersion('3.5.0', newData.version.split('.')) ? 'defKey' : 'old';
        newData = reduceProject(newData, compareType);
        const checkDefaultDb = () => {
          const dbPath = 'profile.default.db';
          const dataTypeSupportsPath = 'profile.dataTypeSupports';
          const newDefault = _.get(newData, dbPath);
          const currentDefault = _.get(dataSourceRef.current, dbPath);
          const newDataTypeSupport = _.get(newData, dataTypeSupportsPath, [])
              .find(d => d.id === newDefault)?.defKey?.toLocaleLowerCase() || '';
          const currentDataTypeSupport = _.get(dataSourceRef.current, dataTypeSupportsPath, [])
              .find(d => d.id === currentDefault)?.defKey?.toLocaleLowerCase() || '';
          return newDefault === currentDefault || newDataTypeSupport === currentDataTypeSupport;
        };
        const checkResult = checkDefaultDb();
        const injectData = () => {
          const onOk = () => {
            const importData = importPdRef.current.getData()
                .reduce((a, b) => a.concat((b.fields || [])
                    .map(f => ({
                      ...f,
                      group: b.id,
                    }))), []);
            restProps.openLoading();
            mergeDataSource(dataSourceRef.current, newData, importData, true, (d) => {
              if(d) {
                injectDataSource(d, modal);
              } else {
                modal?.close();
              }
              restProps.closeLoading();
            });
          };
          const allRefEntities = newData.viewGroups.reduce((a, b) => a.concat(b.refEntities), []);
          restProps.closeLoading();
          modal = openModal(<ImportPd
            defaultSelected={newData.diagrams.reduce((a, b) => a
                  .concat((b.canvasData?.cells || []).map(c => c.originKey)
                      .filter(c => !!c)), [])}
            customerData={newData.viewGroups.map((g) => {
                return {
                  ...g,
                  id: dataSourceRef.current.viewGroups
                      ?.filter(group => group.defKey === g.defKey)[0]?.id || g.id,
                  fields: (newData.entities || [])
                      .filter(e => (g.refEntities || [])
                          .includes(e.id)),
                };
              }).concat({
                id: '',
                defKey: '',
                defName: FormatMessage.string({id: 'components.select.empty'}),
                fields: newData.entities.filter(e => !allRefEntities.includes(e.id)),
              })}
            ref={importPdRef}
            dataSource={dataSourceRef.current}
          />, {
            bodyStyle: {width: '80%'},
            buttons: [
              <Button type='primary' key='ok' onClick={onOk}><FormatMessage id='button.ok'/></Button>,
              <Button key='cancel' onClick={onCancel}><FormatMessage id='button.cancel'/></Button>],
            // eslint-disable-next-line no-nested-ternary
            title: FormatMessage.string({id: `toolbar.${type === 'chiner' ? 'importCHNR' : (type === 'PDManer' ? 'importPDManer' : 'importPDMan')}`}),
          });
        };
        if (checkResult) {
          injectData();
        } else {
          restProps.closeLoading();
          Modal.confirm({
            title: FormatMessage.string({id: 'importConfirmTitle'}),
            message: FormatMessage.string({id: 'importConfirm'}),
            onOk:() => {
              injectData();
            },
          });
        }
      } catch (err) {
        console.log(err);
        Modal.error({
          title: FormatMessage.string({id: 'optFail'}),
          message: err.message,
        });
      }
    }, (file) => {
      const calcResult = () => {
        if (type === 'chiner') {
          return file.name.endsWith('.chnr.json');
        } else if (type === 'PDManer') {
          return file.name.endsWith('.pdma.json');
        }
        return file.name.endsWith('.pdman.json');
      };
      const result = calcResult();
      if (!result) {
        Modal.error({
          title: FormatMessage.string({id: 'optFail'}),
          // eslint-disable-next-line no-nested-ternary
          message: FormatMessage.string({id: type === 'chiner' ? 'invalidCHNRFile' : (type === 'PDManer' ? 'invalidPDManerFile' : 'invalidPDManFile')}),
        });
      }
      if(result) {
        restProps.openLoading();
      }
      return result;
    });
  };
  const dealParseFile = (result, type) => {
    if (result.status === 'FAILED') {
      const termReady = (term) => {
        term.write(typeof result.body === 'object' ? JSON.stringify(result.body, null, 2)
            : result.body);
      };
      Modal.error({
        bodyStyle: {width: '80%'},
        contentStyle: {width: '100%', height: '100%'},
        title: FormatMessage.string({id: 'optFail'}),
        message: <div>
          <div style={{textAlign: 'center'}}><FormatMessage id='dbConnect.log'/><a onClick={showItemInFolder}>{getLogPath()}</a></div>
          <Terminal termReady={termReady}/>
        </div>,
      });
      restProps.closeLoading();
    } else {
      restProps.closeLoading();
      const entities = (result.body?.tables || result.body?.entities || result.body || [])
          .map((t) => {
        const fields = (t.fields || []).map(f => ({...f, id: Math.uuid()}));
        return {
          ...t,
          id: Math.uuid(),
          fields,
          oldId: t.id,
          indexes: (t.indexes || []).map(i => ({
            ...i,
            id: Math.uuid(),
            fields: (i.fields || []).map((f) => {
              return {
                ...f,
                fieldDefKey: fields.find(field => field.defKey.toLocaleLowerCase() ===
                        f.fieldDefKey.toLocaleLowerCase())?.id
                    || f.fieldDefKey,
                id: Math.uuid(),
              };
            }),
          })),
        };
      });
      const dicts = (result.body?.dicts || []).map((d) => {
        return {
          ...d,
          id: d.id || Math.uuid(),
          items: (d.items || []).map((i) => {
            return {
              ..._.omit(i, ['rowNo', 'enabledName']),
              id: Math.uuid(),
            };
          }),
        };
      });
      const viewGroups = (result.body?.groupTopics || result.body?.viewGroups)?.map((g) => {
        return {
          ...g,
          id: dataSourceRef.current.viewGroups
              ?.filter(group => group.defKey === g.defKey)[0]?.id || g.id || Math.uuid(),
          fields: (entities || [])
              .filter(e => (g.refEntities || [])
                  .includes(e.oldId)).map(e => _.omit(e, 'oldId')),
          refViews: [],
          refDiagrams: [],
          refDicts: [],
        };
      });
      let modal;
      const onCancel = () => {
        modal.close();
      };
      const onOk = () => {
        console.log('====');
        const importData = importPdRef.current.getData()
            .reduce((a, b) => a.concat((b.fields || [])
                .map(f => ({
                  ...f,
                  group: b.id,
                }))), []);
        const domains = calcDomains(result.body?.domains || [], dataSourceRef.current.dataTypeMapping?.mappings, 'defKey');
        const finallyDomains = mergeData(dataSourceRef.current?.domains || [],
            domains,false, false);
        restProps.openLoading();
        mergeDataSource(dataSourceRef.current,
            {
              domains,
              dicts,
              viewGroups: (viewGroups || [])
                  .map((g) => {
                    return {
                      ..._.omit(g, 'fields'),
                      refEntities: g.fields.map(f => f.id),
                    };
                  }),
            }, calcDomain(importData, null, finallyDomains), true, (d) => {
              if(d) {
                injectDataSource(d, modal);
              } else {
                modal?.close();
              }
              restProps.closeLoading();
            });
      };
      const allRefEntities = (viewGroups || [])
          .reduce((a, b) => a.concat(b.fields.map(f => f.id)), []);
      modal = openModal(<ImportPd
        customerData={viewGroups ? viewGroups.concat({
            id: '',
            defKey: '',
            defName: FormatMessage.string({id: 'components.select.empty'}),
            fields: entities.filter(e => !allRefEntities.includes(e.id)).map(e => _.omit(e, 'oldId')),
          }) : null}
        data={entities.map(e => _.omit(e, 'oldId'))}
        ref={importPdRef}
        dataSource={dataSourceRef.current}
      />, {
        bodyStyle: {width: '80%'},
        buttons: [
          <Button type='primary' key='ok' onClick={onOk}><FormatMessage id='button.ok'/></Button>,
          <Button key='cancel' onClick={onCancel}><FormatMessage id='button.cancel'/></Button>],
        title: FormatMessage.string({id: `toolbar.${type}`}),
      });
    }
  };
  const importFromExcel = () => {
    let model;
    const onPicker = () => {
      Upload('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', (file) => {
        model && model.close();
        restProps.openLoading();
        connectDB(dataSourceRef.current, configRef.current, {
          excelFile: file.path,
        }, 'ParseExcelFileImpl', (result) => {
          dealParseFile(result);
        });
      }, (f) => {
        return f.name.endsWith('.xlsx');
      }, false);
    };
    model = openModal(<ImportExcel onPicker={onPicker}/>, {
      title: FormatMessage.string({id: 'toolbar.importExcel'}),
    });
  };
  const importFromPb = (type) => {
    Upload(type === 'PD' ? '' : 'text/x-sql', (data) => {
      restProps.openLoading();
      connectDB(dataSourceRef.current, configRef.current, {
        [type === 'PD' ? 'pdmFile' : 'ddlFile']: data.path,
      }, type === 'PD' ? 'ParsePDMFile' : 'DDLParseImpl', (result) => {
        dealParseFile(result, type === 'PD' ? 'importPowerDesigner' : 'importDDL');
      });
    }, (file) => {
      const result = type === 'PD' ? (file.name.endsWith('.pdm') || file.name.endsWith('.PDM')) :
          (file.name.endsWith('.sql') || file.name.endsWith('.txt') || file.name.endsWith('.ddl'));
      if (!result) {
        Modal.error({
          title: FormatMessage.string({id: 'optFail'}),
          message: FormatMessage.string({id: type === 'PD' ? 'invalidPdmFile' : 'invalidDDLFile'}),
        });
      }
      return result;
    }, false);
  };
  const calcData = (oldData, newData, keyName = 'id') => {
    return newData.map((d) => {
      const index = oldData.findIndex(o => o.defKey === d.defKey);
      if (index > -1) {
        return {
          ...d,
          [keyName]: oldData[index][keyName],
        };
      }
      return d;
    }).concat(oldData
      .filter(o => newData.findIndex((n) => {
        return n.defKey === o.defKey;
      }) < 0));
  };
  const configFields = ['profile.default.entityInitFields',
    'profile.default.entityInitProperties', 'profile.sql.delimiter', 'profile.generatorDoc.docTemplate',
  'profile.relationFieldSize', 'profile.uiHint', 'profile.relationType', 'profile.extProps',
    'profile.headers',
    'profile.DDLToggleCase'];
  const importConfig = () => {
    Upload('application/json', (d) => {
      const data = JSON.parse(d);
      const codeTemplates = _.get(dataSourceRef.current, 'profile.codeTemplates', []);
      let tempData = dataSourceRef.current;
      configFields.forEach((f) => {
        const oldData = _.get(tempData, f);
        let newData = _.get(data, f, _.get(tempData, f));
        if (f === configFields[5] || f === configFields[0]) {
          newData = newData.map(o => ({...o, id: Math.uuid()}));
          if (f === configFields[0]) {
            newData = newData.map(n => reset(n, dataSourceRef.current, ['defKey', 'id']));
          }
          newData = calcData(oldData, newData);
        }
        tempData = _.set(tempData, f, newData);
      });
      restProps?.update({
        ...tempData,
        profile: {
          ...tempData.profile,
          codeTemplates: 'dictSQLTemplate' in data ? codeTemplates.map((t) => {
            if (t.applyFor === 'dictSQLTemplate' && t.type === 'dbDDL') {
              return data.dictSQLTemplate;
            }
            return t;
          }) : codeTemplates,
        },
      });
      Message.success({title: FormatMessage.string({id: 'optSuccess'})});
    }, (file) => {
      const result = file.name.endsWith('.json');
      if (!result) {
        Modal.error({
          title: FormatMessage.string({id: 'optFail'}),
          message: FormatMessage.string({id: 'invalidConfigFile'}),
        });
      }
      return result;
    });
  };
  const exportConfig = () => {
    let data = {
      ..._.pick(dataSourceRef.current, configFields),
      dictSQLTemplate: _.get(dataSourceRef.current, 'profile.codeTemplates', [])
        .filter(t => t.applyFor === 'dictSQLTemplate' && t.type === 'dbDDL')[0],
    };
    data = _.set(data, configFields[0], _.get(data, configFields[0], [])
      .map(d => reset(d, dataSourceRef.current, ['id', 'defKey'])));
    Download(
      [JSON.stringify(data, null, 2)],
      'application/json',
      `${dataSourceRef.current.name}-${FormatMessage.string({id: 'toolbar.setting'})}-${moment().format('YYYYMDHHmmss')}.json`);

  };
  const exportDicts = () => {
    let data = {
      dicts: dataSourceRef.current.dicts || [],
    };
    Download(
        [JSON.stringify(data, null, 2)],
        'application/json',
        `${dataSourceRef.current.name}-${FormatMessage.string({id: 'toolbar.dicts'})}-${moment().format('YYYYMDHHmmss')}.json`);

  };
  const importDicts = () => {
    Upload('application/json', (d) => {
      const data = JSON.parse(d);
      if (!data.dicts) {
        Modal.error({
          title: FormatMessage.string({id: 'optFail'}),
          message: FormatMessage.string({id: 'invalidDictsFile'}),
        });
      } else {
        restProps?.update(
            {
              ...dataSourceRef.current,
              dicts: mergeData(dataSourceRef.current.dicts || [], data.dicts, false, true),
            },
        );
        Message.success({title: FormatMessage.string({id: 'optSuccess'})});
      }
    }, (file) => {
      const result = file.name.endsWith('.json');
      if (!result) {
        Modal.error({
          title: FormatMessage.string({id: 'optFail'}),
          message: FormatMessage.string({id: 'invalidDictsFile'}),
        });
      }
      return result;
    });
  };
  const exportDomains = (type) => {
    const codeTemplates = _.get(dataSourceRef.current, 'profile.codeTemplates', [])
        .filter((t) => {
          if (type === 'dbDDL') {
            return (t.applyFor !== 'dictSQLTemplate') && (t.type === 'dbDDL');
          } else {
            return t.type === 'appCode';
          }
        });
    const dataTypeMapping = _.get(dataSourceRef.current, 'dataTypeMapping', {});
    Download(
      [JSON.stringify({
        codeTemplates,
        dataTypeSupports: _.get(dataSourceRef.current, 'profile.dataTypeSupports', [])
            .filter(d => codeTemplates.findIndex(c => c.applyFor === d.id) > -1),
        dataTypeMapping: {
          ...dataTypeMapping,
          mappings: (dataTypeMapping.mappings).map(m => Object.keys(m).reduce((a, b) => {
            const names = ['defKey', 'defName', 'id'];
            if (!names.includes(b) && codeTemplates.findIndex(c => c.applyFor === b) < 0) {
              return a;
            }
            return {
              ...a,
              [b]: m[b],
            };
          }, {})),
        },
        domains: _.get(dataSourceRef.current, 'domains', []),
      }, null, 2)],
      'application/json',
      `${dataSourceRef.current.name}-${FormatMessage.string({id: `${type === 'dbDDL' ? 'domainTab' : `project.${type}`}`})}-${moment().format('YYYYMDHHmmss')}.json`);
  };
  const importDomains = (type) => {
    Upload('application/json', (d) => {
      const data = JSON.parse(d);
      if (!data.domains) {
        Modal.error({
          title: FormatMessage.string({id: 'optFail'}),
          message: type ? FormatMessage.string({id: 'invalidAppCodesFile'}) : FormatMessage.string({id: 'invalidDomainsFile'}),
        });
      } else {
        restProps?.update(
            mergeDomains(dataSourceRef.current, data, type));
        Message.success({title: FormatMessage.string({id: 'optSuccess'})});
      }
    }, (file) => {
      const result = file.name.endsWith('.json');
      if (!result) {
        Modal.error({
          title: FormatMessage.string({id: 'optFail'}),
          message: FormatMessage.string({id: 'invalidDomainsFile'}),
        });
      }
      return result;
    });
  };
  const importFromDb = () => {
    // 判断是否已经存在数据库连接
    const dbConn = dataSourceRef.current?.dbConn || [];
    if (dbConn.length === 0) {
      Modal.error({
        title: FormatMessage.string({id: 'optFail'}),
        message: FormatMessage.string({id: 'dbReverseParse.emptyDbConn'}),
      });
    } else {
      let modal;
      const onClose = () => {
        modal && modal.close();
      };
      const onOk = (data, dbKey) => {
        restProps.openLoading();
        mergeDataSource(dataSourceRef.current, {},
            calcDomain(data, dbKey, dataSourceRef.current.domains || []), true, (d) => {
              if(d) {
                injectDataSource(d, modal);
              } else {
                modal?.close();
              }
              restProps.closeLoading();
            });
      };
      modal = openModal(<DbReverseParse
        openLoading={restProps.openLoading}
        closeLoading={restProps.closeLoading}
        config={configRef.current}
        onOk={onOk}
        onClose={onClose}
        dataSource={dataSourceRef.current}
      />, {
        closeable: false,
        title: FormatMessage.string({id: 'toolbar.importDb'}),
        bodyStyle: { width: '80%' },
      });
    }
  };
  const exportSql = (type) => {
    let modal;
    const onClose = () => {
      modal && modal.close();
    };
    modal = openModal(<ExportSql templateType={type} dataSource={dataSourceRef.current}/>, {
      title: FormatMessage.string({id: `toolbar.${type === 'dict' ? 'exportDict' : 'exportSql'}`}),
      bodyStyle: { width: '80%' },
      buttons: [
        <Button key='onClose' onClick={onClose}>
          <FormatMessage id='button.close'/>
        </Button>,
      ],
    });
  };
  const createEmptyTable = (e, key, type) => {
    const cavRef = getCurrentCav();
    cavRef?.startDrag(e, key, type);
    return cavRef;
  };
  const createTopicNode = (e) => {
    // Message.warring({title: FormatMessage.string({id: 'wait'})});
    const cavRef = getCurrentCav();
    cavRef?.createTopicNode(e);
  };
  const quickCompareDb = () => {
    setMenuType('4');
    setVersionType('2');
  };
  const createNode = (e, type) => {
    const cavRef = getCurrentCav();
    cavRef?.startRemarkDrag(e, type);
  };
  const createGroupNode = (e) => {
    const cavRef = getCurrentCav();
    cavRef?.startGroupNodeDrag(e);
  };
  const createPolygonNode = (e) => {
    const cavRef = getCurrentCav();
    cavRef?.startPolygonNodeDrag(e);
  };
  const createCircleNode = (e) => {
    const cavRef = getCurrentCav();
    cavRef?.createCircleNode(e);
  };
  const alignment = (align) => {
    const cavRef = getCurrentCav();
    cavRef?.alignment(align);
  };
  const themeChange = () => {
    const themeMode = dataSourceRef.current?.profile?.themeMode || 'themeDay';
    restProps?.update({
      ...dataSourceRef.current,
      profile: {
        ...dataSourceRef.current.profile,
        themeMode: themeMode === 'themeDay' ? 'themeNigh' : 'themeDay',
      },
    });
  };
  const showHistory = () => {
    let modal;
    const onCancel = () => {
      modal && modal.close();
    };
    const close = () => {
      onCancel();
      _tabCloseAll();
    };
    modal = openModal(<History
      config={config}
      close={close}
      info={projectInfoRef.current}
      data={dataSourceRef.current}
      openLoading={restProps.openLoading}
      closeLoading={restProps.closeLoading}
      updateProject={restProps.update}
    />, {
      bodyStyle: { width: '60%' },
      buttons:  [
        <Button key='cancel' onClick={onCancel}>
          <FormatMessage id='button.close'/>
        </Button>],
      title: FormatMessage.string({id: 'toolbar.history'}),
    });
  };
  const quickCompareTable = () => {
    let modal;
    const onCancel = () => {
      modal && modal.close();
    };
    modal = openModal(<CompareTable
      getDataSource={getDataSource}
      updateProject={restProps.update}
      openLoading={restProps.openLoading}
      closeLoading={restProps.closeLoading}
      dataSource={dataSourceRef.current}
    />, {
      bodyStyle: { width: '90%' },
      buttons:  [
        <Button key='cancel' onClick={onCancel}>
          <FormatMessage id='button.close'/>
        </Button>],
      title: FormatMessage.string({id: 'toolbar.compareTable'}),
    });
  };
  const toggleCase = () => {
    let modal;
    let tempValue;
    const onChange = (value) => {
      tempValue = value;
    };
    const onOk = () => {
      if (tempValue) {
        const toggleDatasource = toggleCaseDataSource(tempValue, dataSourceRef.current);
        restProps?.update(
            {
              ...toggleDatasource,
              profile: {
                ...toggleDatasource.profile,
                DDLToggleCase: tempValue?.DDLToggleCase || toggleDatasource?.profile?.DDLToggleCase,
              },
            },
        );
        const allTab = getAllTabData();
        Object.keys(allTab).map(t => ({tabKey: t, tabData: allTab[t]})).forEach((t) => {
          const type = t.tabData.type;
          if (type === 'entity' || type === 'view') {
            const data = toggleCaseEntityOrView(t.tabData.data, tempValue);
            if (data) {
              replaceDataByTabId(t.tabKey, {
                ...t.tabData,
                data,
              });
              notify('tabDataChange', {id: t.tabData.key, d: data});
            }
          }
        });
      }
      Message.success({title: FormatMessage.string({id: 'optSuccess'})});
      modal && modal.close();
    };
    const onCancel = () => {
      modal && modal.close();
    };
    modal = openModal(<ToggleCase
      onChange={onChange}
      dataSource={dataSourceRef.current}
    />, {
      bodyStyle: { width: '400px' },
      buttons:  [<Button type='primary' key='ok' onClick={onOk}>
        <FormatMessage id='button.ok'/>
      </Button>,
        <Button key='cancel' onClick={onCancel}>
          <FormatMessage id='button.cancel'/>
        </Button>],
      title: FormatMessage.string({id: 'toolbar.toggleCase'}),
    });
  };
  const domainMenu = useMemo(() => {
    if(menuType === '2') {
      return [
        {
          id: 'dataTypeMapping',
          defKey: 'dataTypeMapping',
          type: 'dataTypeMapping',
          icon: 'fa-cube',
          defName: FormatMessage.string({id: 'project.dataTypeMapping'}),
          children: (restProps.dataSource?.dataTypeMapping?.mappings || []).map(d => ({...d, type: 'mapping'})),
        },
        {
          id: 'domains',
          defKey: 'domains',
          type: 'domains',
          icon: 'fa-key',
          defName: FormatMessage.string({id: 'project.domains'}),
          children: (restProps.dataSource?.domains || []).map(d => ({...d, type: 'domain'})),
        },
        {
          id: 'dataTypeSupports',
          defKey: 'dataTypeSupports',
          type: 'dataTypeSupport',
          icon: 'fa-database',
          defName: FormatMessage.string({id: 'project.dataTypeSupport'}),
          children: (restProps.dataSource?.profile?.dataTypeSupports || [])
              .filter((d) =>  {
                const codeTemplate = (restProps.dataSource?.profile?.codeTemplates || [])
                    .find(c => c.applyFor === d.id);
                return codeTemplate?.type !== 'appCode';
              })
              .map(d => ({...d, type: 'dataType'})),
        },
      ];
    }
    return [];
  }, [restProps.dataSource?.dataTypeMapping?.mappings,
      restProps.dataSource?.domains,
    restProps.dataSource?.profile?.dataTypeSupports,
    restProps.dataSource?.profile?.codeTemplates,
    restProps.dataSource?.profile?.default?.db,
    config.lang, menuType]);
  const navEmptyHide = !!restProps.dataSource?.profile?.navEmptyHide;
  const simpleMenu = useMemo(() => [
    {
      id: 'entities',
      defKey: 'entities',
      type: 'entities',
      icon: 'fa-table',
      defName: FormatMessage.string({id: 'project.entities'}),
      children: (restProps.dataSource?.entities || []).map(e => ({...e, type: 'entity'})),
    },
    {
      id: 'logicEntities',
      defKey: 'logicEntities',
      type: 'logicEntities',
      icon: 'fa-columns',
      defName: FormatMessage.string({id: 'project.logicEntities'}),
      children: (restProps.dataSource?.logicEntities || []).map(e => ({...e, type: 'logicEntity'})),
    },
    {
      id: 'views',
      defKey: 'views',
      type: 'views',
      icon: 'icon-shitu',
      defName: FormatMessage.string({id: 'project.views'}),
      children: (restProps.dataSource?.views || []).map(v => ({...v, type: 'view'})),
    },
    {
      id: 'diagrams',
      defKey: 'diagrams',
      type: 'diagrams',
      icon: 'icon-guanxitu',
      defName: FormatMessage.string({id: 'project.diagram'}),
      children: (restProps.dataSource?.diagrams || []).map(d => ({...d, type: 'diagram'})),
    },
    {
      id: 'dicts',
      defKey: 'dicts',
      type: 'dicts',
      icon: 'icon-shujuzidian',
      defName: FormatMessage.string({id: 'project.dicts'}),
      children: (restProps.dataSource?.dicts || []).map(d => ({...d, type: 'dict'})),
    },
  ], [restProps.dataSource?.entities,
      restProps.dataSource?.logicEntities,
    restProps.dataSource?.views,
    restProps.dataSource?.diagrams,
    restProps.dataSource?.dicts,
    config.lang]);
  const appCodeMenu = useMemo(() => {
    if(menuType === '3') {
      return (restProps.dataSource?.profile?.dataTypeSupports || [])
          .map((d) => {
            const template = (restProps.dataSource?.profile?.codeTemplates || [])
                .find(c => c.applyFor === d.id);
            if (template && template.type === 'appCode') {
              return {...d, type: 'appCode'};
            }
            return null;
          }).filter(d => !!d);
    }
    return [];
  }, [
              restProps.dataSource?.profile?.dataTypeSupports,
              restProps.dataSource?.profile?.codeTemplates,
    menuType,
    config.lang]);
  const defaultGroupMenu =
      getUnGroup(restProps.dataSource, FormatMessage.string({id: 'exportSql.defaultGroup'}));
  const useDefaultGroupMenu = ['refDiagrams', 'refDicts', 'refEntities', 'refViews', 'refLogicEntities']
      .some(key => defaultGroupMenu[key].length > 0);
  const groupMenu = useMemo(() => restProps.dataSource?.viewGroups
      ?.concat(useDefaultGroupMenu ? defaultGroupMenu : [])?.map(v => ({
    ...v,
    type: 'groups',
    icon: 'fa-th-large',
    children: simpleMenu.map((c) => {
      const currentRef = (v[`ref${c.defKey.slice(0, 1).toUpperCase() + c.defKey.slice(1)}`] || []);
      const temChildren = [...c.children];
      return {
        ...c,
        id: `${v.defKey}${separator}${c.defKey}`,
        defKey: `${v.defKey}${separator}${c.defKey}`,
        type: c.defKey,
        children: currentRef.map((r) => {
          const cIndex = temChildren.findIndex(e => e.id === r);
          const child = temChildren[cIndex];
          // 移除已经排好序的数据 在海量的数据下优化下一次查找的次数
          if(cIndex > -1) {
            temChildren.splice(cIndex, 1);
          }
          return child;
        }).filter(r => !!r),
      };
    }).filter(c => (navEmptyHide ? c?.children?.length > 0 : true)),
  })), [simpleMenu, navEmptyHide, restProps.dataSource?.viewGroups]);
  const menus = {
    modalAll: simpleMenu.filter(s => (navEmptyHide ? s?.children?.length > 0 : true)),
    modalGroup: groupMenu,
  };
  const tabDataChange = (data, t) => {
    setDataByTabId(t.tabKey, data);
  };
  const hasRender = (key, instance) => {
    tabInstanceRef.current[key] = instance;
  };
  const hasDestroy = (key) => {
    delete tabInstanceRef.current[key];
  };
  const otherTabSave = (tab, callback) => {
    saveProject(false, tab, callback);
  };
  const selectionChanged = (cell) => {
    headerToolRef.current.setIsCellSelected(cell);
  };
  const jumpEntity = (tabKey) => {
    setMenuType('1');
    updateActiveKey(tabKey);
    activeTabStack.current = activeTabStack.current.filter(k => k !== tabKey);
    activeTabStack.current.push(tabKey);
  };
  const getConfig = () => {
    return configRef.current;
  };
  const tempData = {};
  const _openModal = (name, active) => {
    let modal = null;
    let Com = '';
    let title = '';
    const onOk = () => {
      if (Object.keys(tempData).length !== 0) {
        let tempDataSource = getDataSource();
        const filterData = ['lang', 'javaHome', 'autoSave', 'jvm', 'autoBackup'];
        if (name === 'dbreverse') {
          const { value = [], realData : { entities = [], viewGroups = [] } = {} }
              = tempData?.dbreverse || {};
          // 此处有多处需要更新
          // 先处理实体和分组信息
          const entitiesKey = (tempDataSource?.entities || [])
              .concat(tempDataSource?.views || [])
              .map(e => e.defKey);
          const newEntities = entities
              .filter(e => value.includes(e.defKey))
              .map((e) => {
                const defKey = validateKey(e.defKey, entitiesKey);
                entitiesKey.push(defKey);
                return {
                  ...e,
                  defKey,
                };
              });
          tempDataSource = {
            ...tempDataSource,
            entities: (tempDataSource?.entities || []).concat(newEntities),
            viewGroups: (tempDataSource?.viewGroups || []).concat({
              ...(viewGroups[0] || {}),
              refEntities: newEntities.map(e => e.defKey),
            }),
          };
          const valueNames = ['domains', 'dataTypeMapping.mappings'];
          valueNames.forEach((n) => {
            const oldKeys = _.get(tempDataSource, n, []).map(d => d.defKey);
            const newData = _.get(tempData, `dbreverse.realData.${n}`, [])
                .filter(d => !oldKeys.includes(d.defKey))
                .map(d => _.omit(d, '__key'));
            tempDataSource = _.set(tempDataSource, n, _.get(tempDataSource, n, []).concat(newData));
          });
        } else if (name === 'dbConnect') {
          if (new Set((tempData.dbConn || [])
              .filter(d => !!d.defName)
              .map(d => d.defName)).size !== (tempData.dbConn || []).length) {
            Modal.error({
              title: FormatMessage.string({id: 'optFail'}),
              message: FormatMessage.string({id: 'dbConnect.validateDb'}),
            });
            return;
          }
        } else if (name === 'config') {
          if ('lang' in tempData && tempData.lang !== lang) {
            // 需要更新一些默认的数据
            const needUpdates = [
              {
                key: 'profile.default.entityInitFields',
                langName: 'entityInitFields',
              },
            ];
            needUpdates.forEach(({key, langName}) => {
              tempDataSource = _.set(tempDataSource, key,
                  _.get(tempDataSource, key).map((f) => {
                    return {
                      ...f,
                      defName: FormatMessage.string({id: `projectTemplate.${langName}.${f.defKey}`})
                          || f.defName,
                    };
                  }));
            });
          }
          const userData = _.pick(tempData, filterData);
          if (Object.keys(userData).length > 0) {
            restProps?.saveUserData(userData);
          }
        }
        if ('dictSQLTemplate' in tempData) {
          const path = 'profile.codeTemplates';
          const codeTemplates = _.get(tempDataSource, path, []);
          if (codeTemplates.findIndex(c => c.applyFor === 'dictSQLTemplate') < 0) {
            codeTemplates.push(emptyDictSQLTemplate);
          }
          tempDataSource = _.set(tempDataSource, path, codeTemplates
              .map((c) => {
                if (c.applyFor === 'dictSQLTemplate') {
                  return {
                    ...c,
                    content: tempData.dictSQLTemplate || '',
                  };
                }
                return c;
              }));
        }
        const freeze = tempData.freeze;
        filterData.splice(0, 0, 'dictSQLTemplate', 'freeze');
        let needSave = false;
        Object.keys(tempData).filter(f => !filterData.includes(f)).forEach((f) => {
          needSave = true;
          tempDataSource = _.set(tempDataSource, f, tempData[f]);
        });
        if ('profile.headers' in tempData) {
          tempDataSource = {
            ...tempDataSource,
            entities: (tempDataSource.entities || []).map(e => ({
              ...e,
              headers: resetHeader(tempDataSource, e, freeze),
            })),
          };
          const allTab = getAllTabData();
          Object.keys(allTab).map(t => ({tabKey: t, tabData: allTab[t]})).forEach((t) => {
            if (t.tabData.type === 'entity' || t.tabData.type === 'view') {
              const data =  {
                ...t.tabData.data,
                headers: resetHeader(tempDataSource, t.tabData.data, freeze),
              };
              replaceDataByTabId(t.tabKey, {
                ...t.tabData,
                data,
              });
              notify('tabDataChange', {id: t.tabData.key, d: data});
            }
          });
        }
        needSave &&
        restProps?.save(tempDataSource, FormatMessage.string({id: 'saveProject'}), !projectInfoRef.current); // 配置项内容在关闭弹窗后自动保存
      }
      modal && modal.close();
    };
    const onCancel = () => {
      modal && modal.close();
    };
    if (name === 'config'){
      Com = Config;
      title = FormatMessage.string({id: 'config.title'});
    } else {
      Com = DbConnect;
      title = FormatMessage.string({id: 'dbConnect.title'});
    }
    const dataChange = (value, fieldName) => {
      tempData[fieldName] = value;
    };
    modal = openModal(<Com
      active={active}
      config={config}
      lang={config.lang}
      dataChange={dataChange}
      prefix={prefix}
      getDataSource={getDataSource}
      dataSource={restProps?.dataSource}
      updateDataSource={restProps.update}
    />, {
      bodyStyle: { width: '80%' },
      title,
      buttons: [<Button type='primary' key='ok' onClick={() => onOk(modal)}>
        <FormatMessage id='button.ok'/>
      </Button>,
        <Button key='cancel' onClick={() => onCancel(modal)}>
          <FormatMessage id='button.cancel'/>
        </Button>],
    });
  };
  const _jumpDetail = (d, key) => {
    if (key === 'standardFields') {
      standardFieldRef.current?.openEdit(d);
    } else {
      let type = groupTypeRef.current;
      if (!d.groups || d.groups.length === 0) {
        type = 'modalAll';
        updateGroupType(type);
      }
      setMenuType('1');
      menuModelRef.current?.jumpDetail(d, key, type);
    }
  };
  const getTabComponent = (t) => {
    const type = t.type;
    const key = t.menuKey;
    let group = [];
    if (type === 'entity' || type === 'logicEntity' || type === 'view'  || type === 'diagram' || type === 'dict') {
      // 需要计算分组信息
      // eslint-disable-next-line no-nested-ternary
      const tempType = type === 'entity' ? 'entities' : (type === 'logicEntity' ? 'logicEntities' : `${type}s`);
      const groupRefKey = [`ref${firstUp(tempType)}`];
      group = restProps?.dataSource?.viewGroups?.filter(v => v[groupRefKey]?.includes(key)) || [];
    }
    if (type === 'entity') {
      return (
        <Entity
          openConfig={() => _openModal('config', 'EntityInit.3')}
          saveUserData={restProps.saveUserData}
          getConfig={getConfig}
          type={type}
          getDataSource={getDataSource}
          hasRender={instance => hasRender(t.tabKey, instance)}
          hasDestory={() => hasDestroy(t.tabKey)}
          param={t.param}
          tabKey={t.tabKey}
          common={common}
          updateDataSource={restProps?.update}
          dataSource={restProps?.dataSource}
          openDict={_onMenuClick}
          entity={key}
          group={group}
          setMenuType={setMenuType}
          openCheckRuleConfig={openCheckRuleConfig}
          tabDataChange={data => tabDataChange(data, t)}
          jumpDetail={_jumpDetail}
          />);
    } else if (type === 'logicEntity') {
      return (
        <LogicEntity
          jumpDetail={_jumpDetail}
          saveUserData={restProps.saveUserData}
          getConfig={getConfig}
          type={type}
          getDataSource={getDataSource}
          hasRender={instance => hasRender(t.tabKey, instance)}
          hasDestory={() => hasDestroy(t.tabKey)}
          param={t.param}
          tabKey={t.tabKey}
          common={common}
          updateDataSource={restProps?.update}
          dataSource={restProps?.dataSource}
          openDict={_onMenuClick}
          entity={key}
          group={group}
          tabDataChange={data => tabDataChange(data, t)}
          setMenuType={setMenuType}
          openCheckRuleConfig={openCheckRuleConfig}
        />);
    } else if (type === 'view') {
      return <View
        saveUserData={restProps.saveUserData}
        getConfig={getConfig}
        type={type}
        getDataSource={getDataSource}
        updateDataSource={restProps?.update}
        hasRender={instance => hasRender(t.tabKey, instance)}
        hasDestory={() => hasDestroy(t.tabKey)}
        param={t.param}
        tabKey={t.tabKey}
        common={common}
        dataSource={restProps?.dataSource}
        openDict={_onMenuClick}
        entity={key}
        group={group}
        tabDataChange={data => tabDataChange(data, t)}
      />;
    } else if (type === 'diagram') {
      return <Relation
        openLoading={restProps.openLoading}
        closeLoading={restProps.closeLoading}
        jumpEntity={jumpEntity}
        selectionChanged={selectionChanged}
        openDict={_onMenuClick}
        getDataSource={getDataSource}
        common={common}
        save={otherTabSave}
        activeKey={activeKey}
        validateTableStatus={validateTableStatus}
        tabKey={t.tabKey}
        diagramKey={key}
        group={group}
        openEntity={_onMenuClick}
        updateDataSource={restProps?.update}
        dataSource={restProps?.dataSource}
        renderReady={cav => renderReady(cav, t.tabKey)}
        tabDataChange={(data, tab) => tabDataChange(data, tab || t)}
        autoSave={restProps.autoSave}
      />;
    } else if (type === 'dict') {
      return <Dict
        param={t.param}
        hasRender={instance => hasRender(t.tabKey, instance)}
        hasDestory={() => hasDestroy(t.tabKey)}
        tabKey={t.tabKey}
        dictKey={key}
        dataSource={restProps?.dataSource}
        tabDataChange={data => tabDataChange(data, t)}
      />;
    }
    return '';
  };
  const domainGetName = (m) => {
    const dataTypeSupports = _.get(dataSourceRef.current, 'profile.dataTypeSupports', []);
    const defaultDb = _.get(dataSourceRef.current, 'profile.default.db', dataTypeSupports[0]?.id);
    if (defaultDb === m.id) {
      return `${m.defName || m.defKey}(${FormatMessage.string({id: 'project.default'})})`;
    }
    return m.defName || m.defKey;
  };
  const getName = (m) => {
    if (m.defKey !== m.defName) {
      if (m.type === 'groups'){
        return `${m.defKey}${(m.defName !== m.defKey && m.defName) ? `-${m.defName}` : ''}`;
      } else if (m.type === 'entity' || m.type === 'logicEntity' || m.type === 'view' || m.type === 'diagram' || m.type === 'dict'){
        if (m.defName) {
          const tempDisplayMode = m.sysProps?.nameTemplate || '{defKey}[{defName}]';
          return tempDisplayMode.replace(/\{(\w+)\}/g, (match, word) => {
            return m[word] || m.defKey || '';
          });
        }
        return m.defKey;
      }
      return m.defName;
    }
    return m.defName;
  };
  const iconClick = (e, key) => {
    switch (key) {
      case 'save': saveProject();break;
      case 'refresh': refreshProject();break;
      case 'saveAs': saveProject(true);break;
      case 'pdman': importFromPDMan('pdman');break;
      case 'importDDL': importFromPb('DDL');break;
      case 'excel': importFromExcel();break;
      case 'chiner': importFromPDMan('chiner');break;
      case 'PDManer': importFromPDMan('PDManer');break;
      case 'powerdesigner': importFromPb('PD');break;
      case 'db': importFromDb();break;
      case 'domains': importDomains('dbDDL');break;
      case 'exportDomains': exportDomains('dbDDL');break;
      case 'appCodes': importDomains('appCode');break;
      case 'exportAppCodes': exportDomains('appCode');break;
      case 'importConfig': importConfig();break;
      case 'importDicts': importDicts();break;
      case 'exportConfig': exportConfig();break;
      case 'exportDicts': exportDicts();break;
      case 'png':
      case 'svg': exportImg(key); break;
      case 'export-excel': exportExcel(); break;
      case 'word': exportWord(); break;
      case 'html':
      case 'markdown': generateSimpleFile(key, dataSourceRef.current, projectInfoRef.current); break;
      case 'sql': exportSql('sql'); break;
      case 'dict': exportSql('dict'); break;
      case 'empty': createEmptyTable(e, null, 'entity');break;
      case 'logic': createEmptyTable(e, null, 'logicEntity');break;
      case 'round': createNode(e, 'round');break;
      case 'circle': createCircleNode(e);break;
      case 'rect': createNode(e, 'rect');break;
      case 'mind': createTopicNode(e);break;
      case 'compareDb': quickCompareDb();break;
      case 'compareTable': quickCompareTable();break;
      case 'polygon': createPolygonNode(e);break;
      case 'group': createGroupNode(e);break;
      case 'alignLeft':
      case 'alignRight':
      case 'alignTop':
      case 'verticalCenter':
      case 'alignBottom':
      case 'alignRow':
      case 'alignColumn':
      case 'horizontalCenter': alignment(key);break;
      case 'toggleCase': toggleCase();break;
      case 'theme': themeChange();break;
      case 'history': showHistory();break;
      default: break;
    }
  };
  // 在过滤为空的数据
  const tempMenu = menus[groupType];
  const currentPrefix = getPrefix(prefix);
  const getTabTitle = (t) => {
    if (t.menuKey === 'home-cover') {
      return {
        title: FormatMessage.string({id: 'project.homeCover'}),
        tooltip: FormatMessage.string({id: 'project.homeCover'}),
      };
    }
    const currentType = allType.filter(a => a.type === t.type)[0];
    const currentData = restProps?.dataSource[currentType.name]
    .filter(d => d.id === t.menuKey)[0];
    const tempDisplayMode = currentData?.nameTemplate || '{defKey}[{defName}]';
    return {
      title: currentData?.defName || currentData?.defKey,
      tooltip: tempDisplayMode.replace(/\{(\w+)\}/g, (match, word) => {
        return currentData?.[word] || currentData?.defKey || '';
      }),
    };
  };
  const standardFieldMemo = useMemo(() => {
    return <StandardField
      config={config}
      ref={standardFieldRef}
      activeKey={activeKey}
      dataSource={restProps.dataSource}
      updateDataSource={restProps.update}
      openLoading={restProps.openLoading}
      closeLoading={restProps.closeLoading}
      projectInfo={projectInfo}
      dealExportFile={dealExportFile}
    />;
  }, [restProps.dataSource, activeKey]);
  const dropDownMenus = useMemo(() => ([
    {key: 'closeCurrent', name: FormatMessage.string({id: 'closeCurrent'})},
    {key: 'closeOthers', name: FormatMessage.string({id: 'closeOthers'})},
    {key: 'closeAll', name: FormatMessage.string({id: 'closeAll'})},
  ]),[]);
  const dropDownMenuClick = (m, e, c) => {
    switch (m.key){
      case 'closeCurrent':
        _tabClose(c.key);
        break;
      case 'closeOthers':
        _tabCloseOther(c.key);
        break;
      case 'closeAll':
        _tabCloseAll();
        break;
      default: break;
    }
  };
  const _menuTypeChange = (key) => {
    const updateMenuType = () => {
      if (key === '1') {
        currentMenu.current = menuModelRef.current;
      } else if (key === '2') {
        currentMenu.current = menuDomainRef.current;
      }
      setMenuType(key);
      if(key !== '5') {
        resizeContainer.current.style.minWidth = `${menuNorWidth + menuMinWidth}px`;
        resizeContainer.current.style.width = `${menuNorWidth + menuMinWidth}px`;
        resizeContainer.current.children[0].style.display = '';
        if(resizeContainer.current.children[2]) {
          resizeContainer.current.children[2].style.display = '';
        }
      }
    };
    if(checkRuleRef.current && (menuType === '5') && (key !== '5')) {
      checkRuleRef.current?.checkLeave(() => {
        updateMenuType();
      });
    } else {
      updateMenuType();
    }
  };
  const _jumpPosition = (d, key) => {
    let type = groupTypeRef.current;
    if (!d.groups || d.groups.length === 0) {
      type = 'modalAll';
      updateGroupType(type);
    }
    setMenuType('1');
    menuModelRef.current?.jumpPosition(d, key, type);
  };
  const onMouseDown = (e) => {
    isResize.current = {
      status: true,
      width: resizeContainer.current.getBoundingClientRect().width,
      x: e.clientX,
    };
  };
  const onMouseMove = (e) => {
    if (isResize.current.status) {
      const width = isResize.current.width + (e.clientX - isResize.current.x);
      if (width < (window.innerWidth - 10) && width > menuContainerWidth) {
        resizeContainer.current.style.width = `${width}px`;
        resizeOther.current.style.width = `calc(100% - ${width}px)`;
        menuContainerModel.current.style.width = `${width - menuMinWidth}px`;
        menuContainerDataType.current.style.width = `${width - menuMinWidth}px`;
        menuContainerCode.current.style.width = `${width - menuMinWidth}px`;
      }
    }
  };
  const onMouseUp = () => {
    if (isResize.current.status) {
      restProps?.save({
        ...dataSourceRef.current,
        profile: {
          ...dataSourceRef.current.profile,
          menuWidth: menuContainerModel.current.style.width,
        },
      }, FormatMessage.string({id: 'saveProject'}), !projectInfoRef.current);
    }
    isResize.current.status = false;
  };
  const fold = () => {
    resizeContainer.current.style.minWidth = `${menuMinWidth}px`;
    resizeContainer.current.style.width = `${menuMinWidth}px`;
    resizeContainer.current.style.overflow = 'hidden';
    resizeContainer.current.children[0].style.display = 'none';
    resizeContainer.current.children[2].style.display = 'none';
  };
  useEffect(() => {
    const id = Math.uuid();
    addBodyEvent('onmousemove', id, onMouseMove);
    addBodyEvent('onmouseup', id, onMouseUp);
    addBodyEvent('onmouseleave', id,  onMouseUp);
    return () => {
      removeBodyEvent('onmousemove', id);
      removeBodyEvent('onmouseup', id);
      removeBodyEvent('onmouseleave', id);
    };
  }, []);
  useEffect(() => {
    const clear = () => {
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current);
      }
    };
    clear();
    if (config.autoSave && projectInfoRef.current) {
      // 开始执行自动保存任务
      autoSaveRef.current = setInterval(() => {
        if(validateNeedSave(dataSourceRef.current)) {
          console.log('autoSave');
          const newData = updateAllData(dataSourceRef.current);
          if (newData.result.status) {
            restProps.autoSave(newData.dataSource);
          }
        }
      }, config.autoSave * 60 * 1000);
    }
    return () => {
      // 结束执行自动保存任务
      clear();
    };
  }, [config.autoSave]);
  useEffect(() => {
    const themeMode = restProps.dataSource?.profile?.themeMode || '';
    document.body.setAttribute('theme', themeMode);
  }, [restProps.dataSource?.profile?.themeMode]);
  const getLatelyDataSource = () => {
    return updateAllData(dataSourceRef.current);
  };
  const mergeFromMeta = (data, meta, nextDataSource) => {
    let newDataSource;
    if (meta) {
      newDataSource = mergeDataSource(dataSourceRef.current, {}, data, true);
    } else {
      newDataSource = mergeDataSource(dataSourceRef.current, nextDataSource, data, true);
    }
    injectDataSource(newDataSource);
    return newDataSource;
  };
  const openHome = () => {
    _onMenuClick('home-cover', 'diagram', null, 'icon-guanxitu');
  };
  const renderOperatingFloor = () => {
    return (
      <>
        {
          (menuType === '4') && (versionType === '1') && <VersionInfoBar
            dataSource={restProps.dataSource}
            ref={currentVersionRef}
            empty={<MessageHelp openHome={openHome} prefix={currentPrefix}/>}
            />
        }
        {
          (menuType === '4') && (versionType === '2') && <CompareList
            mergeFromMeta={mergeFromMeta}
            closeLoading={restProps.closeLoading}
            openLoading={restProps.openLoading}
            config={config}
            dataSource={restProps.dataSource}
            ref={currentMetaRef}
            calcDomain={calcDomain}
            />
        }
        {
            (menuType === '5') && <CheckRule
              ref={checkRuleRef}
              configOpen={ruleConfigOpen}
              tabDataChange={tabDataChange}
              getDataSource={getDataSource}
              save={otherTabSave}
              jumpDetail={_jumpDetail}
              jumpEntity={jumpEntity}
              openDict={_onMenuClick}
              validateTableStatus={validateTableStatus}
              updateDataSource={restProps.update}
              closeLoading={restProps.closeLoading}
              openLoading={restProps.openLoading}
              dataSource={restProps.dataSource}
              common={common}
              setMenuType={setMenuType}
            />
        }
        <AppCodeEdit
          updateDataSource={restProps.update}
          empty={<MessageHelp openHome={openHome} prefix={currentPrefix}/>}
          dataSource={restProps.dataSource}
          ref={appCodeRef}
          style={{display: menuType === '3' ? 'block' : 'none'}}
          />
        <Tab
          style={{display: (menuType === '1' || menuType === '2') ? 'block' : 'none'}}
          key={mainId}
          menuClick={dropDownMenuClick}
          dropDownMenus={dropDownMenus}
          position='top'
          activeKey={activeKey}
          closeTab={_tabClose}
          onChange={_tabChange}
          excess={standardFieldMemo}
          empty={<MessageHelp openHome={openHome} prefix={currentPrefix}/>}
          >
          {tabs.map((t) => {
              const title = getTabTitle(t);
              return (
                <TabItem
                  style={t.style}
                  key={t.tabKey}
                  title={title.title}
                  tooltip={title.tooltip}
                  icon={t.icon}
                  >
                  {getTabComponent(t)}
                </TabItem>
              );
            })}
        </Tab>
      </>
    );
  };
  const createGroupMenu = getMenu('add', '', 'groups', [], groupTypeRef.current, '');
  const createAppCodeMenu = getMenu('add', '', 'appCode', [], '', '');
  const onListDrop = (dropId, dragId) => {
    const dataTypeSupports = dataSourceRef.current?.profile?.dataTypeSupports || [];
    const dropIndex = dataTypeSupports.findIndex(d => d.id === dropId);
    const dragIndex = dataTypeSupports.findIndex(d => d.id === dragId);
    restProps.update({
      ..._.set(
          dataSourceRef.current,
          'profile.dataTypeSupports',
          moveArrayPosition(_.get(dataSourceRef.current, 'profile.dataTypeSupports'), dragIndex, dropIndex),
      ),
    });
  };
  const onDoubleClick = (id) => {
    appCodeRef.current?.getData(id);
  };
  const setCurrentVersion = (...args) => {
    currentVersionRef.current?.setVersion(...args);
  };
  const setCurrentMeta = (m, isCustomer) => {
    currentMetaRef.current?.setMeta(m, isCustomer);
  };
  const resizeContainerStyle = {
    width: menuType !== '5' ? (menuNorWidth + menuMinWidth) : '50px',
  };
  if(menuType === '5') {
    resizeContainerStyle.minWidth = '50px';
  }
  return <Loading visible={common.loading} title={common.title}>
    <HeaderTool
      menuType={menuType}
      isChildWindow={isChildWindow}
      mode={mode}
      dataSource={restProps.dataSource}
      ref={headerToolRef}
      currentPrefix={currentPrefix}
      close={restProps.close}
      iconClick={iconClick}
      activeTab={activeTab}
      resize={resize}
      openModal={_openModal}
      jumpPosition={_jumpPosition}
      jumpDetail={_jumpDetail}
    />
    <div className={`${currentPrefix}-home`}>
      <div
        className={`${currentPrefix}-home-resize-container`}
        ref={resizeContainer}
        style={resizeContainerStyle}>
        {menuType !== '5' && <span
          onClick={fold}
          className={`${currentPrefix}-home-fold`}
        >
          <Icon type='fa-angle-double-left '/>
        </span>}
        <Tab activeKey={menuType} onChange={_menuTypeChange}>
          <TabItem key='1' title={FormatMessage.string({id: 'modelTab'})} icon='model.svg'>
            <div
              ref={menuContainerModel}
              className={`${currentPrefix}-home-menu-container`}
            >
              <div className={`${currentPrefix}-home-menu-header`}>
                <span className={`${currentPrefix}-home-menu-header-title`}>
                  <FormatMessage id='moduleList'/>
                </span>
                <span className={`${currentPrefix}-home-menu-header-opt`}>
                  {activeKey && <div className={`${currentPrefix}-home-menu-header-opt-position`} onClick={onLocation}>
                    <Tooltip
                      title={<div
                        className={`${currentPrefix}-home-menu-header-opt-title`}
                        >
                        <FormatMessage id='location'/>
                      </div>}
                      force
                      placement='top'
                    >
                      <Icon type='fa-crosshairs'/>
                    </Tooltip>
                  </div>}
                  <div
                    className={`${currentPrefix}-home-menu-header-opt-position`}
                    onClick={() => updateNavEmptyHide(!navEmptyHide)}
                  >
                    <Tooltip
                      title={<div
                        className={`${currentPrefix}-home-menu-header-opt-title`}
                        >
                        <FormatMessage id='navEmptyHide'/>
                      </div>}
                      force
                      placement='top'
                    >
                      <Icon type={`fa-eye${navEmptyHide ? '-slash' : ''}`}/>
                    </Tooltip>
                  </div>
                  <span onClick={_groupMenuChange}>
                    <FormatMessage id='showGroup'/>
                  </span>
                  <span>
                    <Checkbox onChange={_groupMenuChange} checked={groupType === 'modalGroup'}/>
                  </span>
                </span>
              </div>
              <Menu
                mode={mode}
                ref={menuModelRef}
                prefix={prefix}
                {...restProps}
                menus={tempMenu}
                doubleMenuClick={_onMenuClick}
                onContextMenu={_onContextMenu}
                contextMenus={contextMenus}
                contextMenuClick={_contextMenuClick}
                draggable={draggable}
                getName={getName}
                dragTable={createEmptyTable}
                groupType={groupType}
                header={<span
                  onContextMenu={e => e.stopPropagation()}
                  onClick={openHome}
                  className={`${currentPrefix}-home-cover`}
                >
                  <Icon type='fa-home'/>
                  <span>{FormatMessage.string({id: 'project.homeCover'})}</span>
                </span>}
                emptyData={<div
                  className={`${currentPrefix}-home-menu-empty`}
                  >
                  <div>
                    <FormatMessage id='emptyGroup'/>
                  </div>
                  <div>
                    <FormatMessage id='click'/>[<a onClick={() => _contextMenuClick(null, createGroupMenu)}><FormatMessage id='createGroup'/></a>]
                  </div>
                </div>}
              />
            </div>
          </TabItem>
          <TabItem key='2' title={FormatMessage.string({id: 'domainTab'})} icon='data_type.svg'>
            <div
              ref={menuContainerDataType}
              className={`${currentPrefix}-home-menu-container`}
            >
              <div className={`${currentPrefix}-home-menu-header`}>
                <span className={`${currentPrefix}-home-menu-header-title`}>
                  <FormatMessage id='project.dataType'/>
                </span>
              </div>
              <Menu
                mode={mode}
                ref={menuDomainRef}
                prefix={prefix}
                {...restProps}
                onContextMenu={_onContextMenu}
                contextMenus={contextMenus}
                contextMenuClick={_contextMenuClick}
                menus={domainMenu}
                getName={domainGetName}
                draggable={draggable}
                dragTable={createEmptyTable}
                doubleMenuClick={(key, type, parentKey) => _contextMenuClick(null,
                      getMenu('edit', key, type, [], groupTypeRef.current, parentKey))}
              />
            </div>
          </TabItem>
          <TabItem key='3' title={FormatMessage.string({id: 'appCode'})} icon='fa-code'>
            <div
              ref={menuContainerCode}
              className={`${currentPrefix}-home-menu-container`}
            >
              <div className={`${currentPrefix}-home-menu-header`}>
                <span className={`${currentPrefix}-home-menu-header-title`}>
                  <FormatMessage id='project.appCode'/>
                </span>
              </div>
              <List
                mode={mode}
                onDoubleClick={onDoubleClick}
                onDrop={onListDrop}
                ref={menuDomainRef}
                draggable
                prefix={prefix}
                {...restProps}
                onContextMenu={_onContextMenu}
                contextMenus={contextMenus}
                contextMenuClick={_contextMenuClick}
                data={appCodeMenu}
                emptyData={<div
                  className={`${currentPrefix}-home-menu-empty`}
                >
                  <div>
                    <FormatMessage id='emptyAppCode'/>
                  </div>
                  <div>
                    <FormatMessage id='click'/>[<a onClick={() => _contextMenuClick(null, createAppCodeMenu)}><FormatMessage id='createAppCode'/></a>]
                  </div>
                </div>}
              />
            </div>
          </TabItem>
          <TabItem hidden={mode === READING} key='4' title={FormatMessage.string({id: 'versionTab'})} icon='fa-history'>
            <div
              ref={menuContainerCode}
              className={`${currentPrefix}-home-menu-container`}
            >
              <div className={`${currentPrefix}-home-menu-header`}>
                <span className={`${currentPrefix}-home-menu-header-version`}>
                  <span
                    className={`${currentPrefix}-home-menu-header-version-${versionType === '1' ? 'checked' : 'normal'}`}
                    onClick={() => setVersionType('1')}
                 >
                    <FormatMessage id='versionData.modelVersion'/>
                  </span>
                  <span
                    className={`${currentPrefix}-home-menu-header-version-${versionType === '2' ? 'checked' : 'normal'}`}
                    onClick={() => setVersionType('2')}
                >
                    <FormatMessage id='versionData.dbDiff'/>
                  </span>
                </span>
              </div>
              <VersionListBar
                versionType={versionType}
                menuType={menuType}
                openLoading={restProps.openLoading}
                closeLoading={restProps.closeLoading}
                projectInfo={projectInfo}
                getLatelyDataSource={getLatelyDataSource}
                dataSource={restProps.dataSource}
                updateDataSource={restProps.update}
                onSelected={versionType === '1' ? setCurrentVersion : setCurrentMeta}
              />
            </div>
          </TabItem>
          <TabItem key='5' title={FormatMessage.string({id: 'project.checkRule'})} icon='fa-flag-checkered' />
        </Tab>
        <div
          onMouseDown={onMouseDown}
          className={`${currentPrefix}-home-resize-container-line`}
        >
          {}
        </div>
      </div>
      <div
        className={`${currentPrefix}-home-resize-other`}
        ref={resizeOther}
        style={{width: `calc(100% - ${menuNorWidth + menuMinWidth}px)`}}
      >
        {renderOperatingFloor()}
      </div>
    </div>
  </Loading>;
});

export default Index;
