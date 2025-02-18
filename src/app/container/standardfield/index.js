import React, {
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
  useMemo,
  useCallback,
} from 'react';
import moment from 'moment';

import {
  Button,
  Download,
  FormatMessage,
  Icon, IconTitle, Message,
  Modal,
  openModal,
  SearchInput, Terminal,
  Tooltip, Upload,
} from 'components';
import _ from 'lodash/object';
import AutoSizer from 'react-virtualized-auto-sizer';
import {FixedSizeTree as Tree} from 'react-vtree';
import StandardFieldsEdit from './StandardFieldsEdit';
import {getPrefix} from '../../../lib/prefixUtil';
import { separator } from '../../../../profile';
import {validateStandardFields, reset} from '../../../lib/datasource_util';
import './style/index.less';
import {getAllTabData, replaceDataByTabId} from '../../../lib/cache';
import {notify} from '../../../lib/subscribe';
import {connectDB, getLogPath, saveAsTemplate, selectDir, showItemInFolder} from '../../../lib/middle';

const OptHelp = ({currentPrefix}) => {
  return <div className={`${currentPrefix}-standard-fields-list-title-help`}>
    <span>{FormatMessage.string({id: 'standardFields.help'})}</span>
  </div>;
};

export default forwardRef(({prefix, dataSource, updateDataSource, projectInfo,
                             activeKey, config, openLoading, closeLoading,
                             dealExportFile}, ref) => {
  const currentPrefix = getPrefix(prefix);
  const [fold, setFold] = useState(true);
  const [filterValue, setFilterValue] = useState('');
  const [selectFields, setSelectFields] = useState([]);
  const selectFieldsRef = useRef([]);
  selectFieldsRef.current = [...selectFields];
  const contentRef = useRef(null);
  const dataSourceRef = useRef(dataSource);
  dataSourceRef.current = dataSource;
  const configRef = useRef(null);
  configRef.current = config;
  const editRef = useRef(null);
  const iconClick = () => {
    setFold(pre => !pre);
  };
  const getKey = (f) => {
    return `${f.defKey}(${f.defName})`;
  };
  const onItemClick = (e, f) => {
    if (e.shiftKey) {
      setSelectFields((pre) => {
        const tempFields = [...pre];
        const index = tempFields.findIndex(t => getKey(f) === getKey(t));
        if (index >= 0) {
          tempFields.splice(index, 1);
        } else {
          tempFields.push(f);
        }
        return tempFields;
      });
    } else {
      setSelectFields([f]);
    }
  };
  const onDragStart = (e) => {
    e.dataTransfer.setData('fields', JSON.stringify(selectFieldsRef.current));
  };
  const onChange = (e) => {
    setFilterValue(e.target.value);
  };
  const finalData = useMemo(() => (dataSource.standardFields || []).map((g) => {
    const reg = new RegExp((filterValue || '').replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
    return {
      ...g,
      fields: (g.fields || [])
          .filter(f => reg.test(getKey(f))),
    };
  }), [dataSource.standardFields, filterValue]);
  const calcChangeFieldData = (changeFields) => {
    const fullChange = [];
    changeFields.forEach((c) => {
      const index = fullChange.findIndex(f => f.id === c.id);
      if(index < 0) {
        fullChange.push({...c});
      } else {
        fullChange[index] = {
          ...fullChange[index],
          ...c,
        };
      }
    });
    return fullChange;
  };
  const updateFields = (data = [], update = []) => {
    const updateData = [];
    const newData = data.map((d) => {
      return {
        ...d,
        fields: (d.fields || []).map((f) => {
          if (f.refStandard) {
            const currentStandard = update.find(s => s.id === f.refStandard);
            if (currentStandard) {
              updateData.push(d.id);
              return {
                ...f,
                ...currentStandard,
                id: f.id,
              };
            }
            return f;
          }
          return f;
        }),
      };
    });
    return {
      updateData: [...new Set(updateData)],
      data: newData,
    };
  };
  const updateTabData = (needUpdateFields) => {
    const allTab = getAllTabData();
    Object.keys(allTab).map(t => ({tabKey: t, tabData: allTab[t]})).forEach((t) => {
      if (t.tabData.type === 'entity' || t.tabData.type === 'view') {
        const { data: [d], updateData} = updateFields([t.tabData.data], needUpdateFields);
        if (updateData.includes(t.tabData.key)) {
          replaceDataByTabId(t.tabKey, {
            ...t.tabData,
            data: d,
          });
          notify('tabDataChange', {id: t.tabData.key, d});
        }
      }
    });
  };
  const pickerStandFields = (dataObj) => {
    editRef.current.resetStandardFields(dataObj);
    Message.success({title: FormatMessage.string({id: 'optSuccess'})});
  };
  const exportStandardExcelFieldsLibTpl = () => {
    saveAsTemplate('PDManer-excel-standard-field', 'xlsx');
  };
  const exportStandardFields = () => {
    const standardFields = _.get(dataSource, 'standardFields', []);
    Download(
        [JSON.stringify(standardFields.map(s => ({
          ...s,
          fields: s.fields?.map(f => reset(f, dataSource,['id', 'defKey'])),
        })), null, 2)],
        'application/json',
        `${dataSource.name}-${FormatMessage.string({id: 'standardFields.standardFieldsLib'})}-${moment().format('YYYYMDHHmmss')}.json`,
    );
  };
  const exportStandardExcelFields = (data) => {
    const result = validateStandardFields(data);
    if (!result) {
      selectDir(dataSourceRef.current.name, 'xlsx')
          .then((file) => {
            openLoading(FormatMessage.string({id: 'toolbar.exportExcel'}));
            connectDB({
              ...dataSourceRef.current,
              standardFields: data,
            }, configRef.current, {
              sinerFile: projectInfo,
              outFile: file,
            }, 'GenStandardFieldExcelImpl', (res) => {
              dealExportFile(res, file);
            });
          });
    } else {
      Modal.error({
        title: FormatMessage.string({id: 'optFail'}),
        message: result,
      });
    }
  };
  const importStandardExcelFields = () => {
    Upload('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', (file) => {
      openLoading(FormatMessage.string({id: 'toolbar.importExcel'}));
      connectDB(dataSourceRef.current, configRef.current, {
        excelFile: file.path,
      }, 'ParseStandardFieldExcelImpl', (result) => {
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
          closeLoading();
        } else {
          closeLoading();
          pickerStandFields(result.body.map((g) => {
            return {
              ...g,
              id: Math.uuid(),
              fields: (g.fields || []).map((f) => {
                return {
                  ...f,
                  id: Math.uuid(),
                };
              }),
            };
          }));
        }
      });
    }, (f) => {
      return f.name.endsWith('.xlsx');
    }, false);
  };
  const importStandardFields = () => {
    Upload('application/json', (data) => {
      try {
        const dataObj = JSON.parse(data).map(d => ({
          ...d,
          fields: (d.fields || []).map(f => reset({...f, id: Math.uuid()}, dataSource, ['defKey', 'id'])),
        }));
        pickerStandFields(dataObj);
      } catch (err) {
        Modal.error({
          title: FormatMessage.string({id: 'optFail'}),
          message: FormatMessage.string({id: 'standardFields.errData'}),
        });
      }
    }, (file) => {
      return file.name.endsWith('.json');
    });
  };
  const onClick = (d) => {
    let changeFields = [];
    let tempData;
    let modal;
    const onOK = () => {
      if (tempData) {
        const result = validateStandardFields(tempData);
        if (!result) {
          const needUpdateFields = calcChangeFieldData(changeFields);
          updateDataSource({
            ...dataSourceRef.current,
            entities: updateFields(dataSourceRef.current.entities, needUpdateFields).data,
            views: updateFields(dataSourceRef.current.views, needUpdateFields).data,
            standardFields: tempData,
          });
          updateTabData(needUpdateFields);
          modal.close();
        } else {
          Modal.error({
            title: FormatMessage.string({id: 'optFail'}),
            message: result,
          });
        }
      } else {
        modal.close();
      }
    };
    const onCancel = () => {
      modal.close();
    };
    const dataChange = (data, fields = []) => {
      changeFields.push(...fields);
      tempData = data;
    };
    let twinkle;
    if (d?.id) {
      const id = d?.id;
      const group = d?.groups?.[0];
      if (group) {
        twinkle = group.id + separator + id;
      } else {
        twinkle = id;
      }
    }
    modal = openModal(<StandardFieldsEdit
      twinkle={twinkle}
      prefix={prefix}
      dataChange={dataChange}
      dataSource={dataSource}
      updateDataSource={updateDataSource}
      exportStandardExcelFields={exportStandardExcelFields}
      importStandardExcelFields={importStandardExcelFields}
      importStandardFields={importStandardFields}
      exportStandardFields={exportStandardFields}
      exportStandardExcelFieldsLibTpl={exportStandardExcelFieldsLibTpl}
      ref={editRef}
    />, {
      closeable: false,
      bodyStyle: {width: '80%'},
      title: FormatMessage.string({id: 'standardFields.editStandardFields'}),
      buttons: [
        <Button key='onOK' onClick={onOK} type='primary'>
          <FormatMessage id='button.ok'/>
        </Button>,
        <Button key='onCancel' onClick={onCancel}>
          <FormatMessage id='button.cancel'/>
        </Button>,
      ],
    });
  };
  useImperativeHandle(ref, () => {
    return {
      openEdit: onClick,
    };
  }, [dataSource]);
  const type = activeKey.split(separator)[1];
  const getMenuData = (node, nestingLevel) => ({
    data: {
      id: node.id,
      node,
      nestingLevel,
      isOpenByDefault: true,
      selected: selectFields.findIndex(s => s.id === node.id) > -1,
    },
    nestingLevel,
    node,
  });
  function* treeWalker() {
    for (let i = 0; i < finalData.length; i += 1) {
      yield getMenuData(finalData[i], 0);
    }

    while (true) {
      const parent = yield;

      for (let i = 0; i < parent.node?.fields?.length; i += 1) {
        yield getMenuData(parent.node.fields[i], parent.nestingLevel + 1);
      }
    }
  }
  const Node = useCallback(({data: {node, selected}, style, isOpen, setOpen}) => {
    if(node.fields) {
      return <div
        style={style}
        onClick={() => setOpen(!isOpen)}
        className={`${currentPrefix}-standard-fields-list-group`}
      >
        <Icon type='icon-shuju2'/>
        <span>{node.defName}({node.defKey})</span>
        <Icon
          style={{
              transform: `${isOpen ? 'rotate(0deg)' : 'rotate(90deg)'}`,
          }}
          type='fa-angle-down'
          className={`${currentPrefix}-standard-fields-list-group-icon`}
                  />
      </div>;
    }
    const key = getKey(node);
    return <div
      style={style}
      onDragStart={onDragStart}
      draggable={selected}
      className={`${currentPrefix}-standard-fields-list-content-${selected ? 'selected' : 'unselected'}`}
      onClick={e => onItemClick(e, node)}
    >
      {key}
    </div>;
  }, []);
  return <div
    style={{display: (type === 'entity' || type === 'diagram') ? 'block' : 'none'}}
    className={`${currentPrefix}-standard-fields-list-${fold ? 'fold' : 'unfold'}`}
  >
    <div className={`${currentPrefix}-standard-fields-list-icon`} onClick={iconClick}>
      {
        fold ? <div>
          <Icon type='lib.svg'/>
          <span>{
            FormatMessage.string({id: 'standardFields.fieldsLib'})
                .split('').map((m, i) => {
              return <span key={i}>{m}</span>;
            })
          }</span>
        </div> : <Icon type='fa-times'/>
      }
    </div>
    {
      !fold && <div
        className={`${currentPrefix}-standard-fields-list-title`}
      >
        <span style={{marginRight: '5px'}}>
          <FormatMessage id='standardFields.standardFieldsLib'/>
        </span>
        <span className={`${currentPrefix}-standard-fields-list-title-opt`}>
          <Tooltip title={<OptHelp currentPrefix={currentPrefix}/>} force placement='topLeft'>
            <IconTitle type='icon-xinxi'/>
          </Tooltip>
          <IconTitle title={<FormatMessage id='standardFields.setting'/>} type='icon-weihu' onClick={onClick}/>
        </span>
      </div>
    }
    <div ref={contentRef} className={`${currentPrefix}-standard-fields-list-${fold ? 'fold' : 'unfold'}-content`}>
      <span className={`${currentPrefix}-standard-fields-list-search`}>
        <SearchInput placeholder={FormatMessage.string({id: 'standardFields.standardFieldsLibSearch'})} onChange={onChange}/>
      </span>
      {
        finalData.length === 0 ?
          <div className={`${currentPrefix}-standard-fields-list-empty`}>
            <FormatMessage id='standardFields.standardFieldsLibEmpty'/>
          </div>
            : <div className={`${currentPrefix}-standard-fields-list-container`}>
              <AutoSizer>
                {({height, width}) => {
                return <Tree
                  treeWalker={treeWalker}
                  itemSize={25}
                  height={height}
                  width={width}>
                  {Node}
                </Tree>;
              }}
              </AutoSizer>
            </div>
      }
    </div>
  </div>;
});
