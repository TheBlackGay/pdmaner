import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useCallback,
  useContext,
} from 'react';
import ReactDOM from 'react-dom';
import * as _ from 'lodash/object';
import * as Component from 'components';

import {
  getFullColumns,
  validateFields,
  emptyField,
  getColumnWidth,
  generatorKey, transformFieldType, getFieldBaseType, parseExcel, mergeId, emptyDictItem,
} from '../../lib/datasource_util';
import { moveArrayPositionByArray } from '../../lib/array_util';
import { addBodyEvent, removeBodyEvent } from '../../lib/listener';
import { Copy, Paste } from '../../lib/event_tool';
import Tr from './Tr';
import './style/index.less';
import {getPrefix} from '../../lib/prefixUtil';
import {separator} from '../../../profile';
import FormatMessage from '../formatmessage';
import { ConfigContent, TableContent } from '../../lib/context';
import StandardGroupSelect from '../../app/container/standardfield/StandardGroupSelect';
import Note from '../../app/container/tools/note';
import {getCopyRealData, putCopyRealData} from '../../lib/contextMenuUtil';

const empty = [];

const Table = React.memo(forwardRef(({ prefix, data = {}, disableHeaderSort, search,
                               dataSource, customerHeaders, tableDataChange, tableType,
                               defaultEmptyField, validate, disableCopyAndCut, onTableRowClick,
                               onAdd, ExtraOpt, style, hiddenHeader, getRestData,
                               className, expand, otherOpt = true, disableHeaderReset,
                               updateDataSource, disableAddStandard, ready, twinkle, getDataSource,
                               disableDragRow = true, freeze = false, reading = false,
                               fixHeader = true, openDict, defaultGroups, info, searchRef,
                               openConfig, isEntity, needHideInGraph, virtual = true,
                               allFieldOptions, autoWidth},
                                     refInstance) => {
  const { lang } = useContext(ConfigContent);
  const { valueContext, valueSearch } = useContext(TableContent);
  const sheetRef = useRef(null);
  const inputRef = useRef({});
  const currentPrefix = getPrefix(prefix);
  const [expands, setExpands] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [dicts, setDict] = useState(dataSource?.dicts || []);
  const checkboxComponents = ['primaryKey', 'notNull', 'autoIncrement', 'unique', 'enabled', 'defaultDb'];
  const domains = _.get(dataSource, 'domains', []);
  const mapping = _.get(dataSource, 'dataTypeMapping.mappings', []);
  const uiHint =  _.get(dataSource, 'profile.uiHint', []);
  const db = _.get(dataSource, 'profile.default.db', _.get(dataSource, 'profile.dataTypeSupports[0].id'));
  const dbData = _.get(dataSource, 'profile.dataTypeSupports', []).filter(d => d.id === db)[0] || {};
  const tableRef = useRef(null);
  const dragRef = useRef(null);
  const optRef = useRef(null);
  const virtualRef = useRef(null);
  const dragStatus = useRef({status: false, x: 0, y: 0});
  const [dataPosition, setDataPosition] = useState({
    index: 0,
    length: 12,
  });
  const allColumns = useMemo(() => {
    if (customerHeaders) {
      if (Array.isArray(customerHeaders)) {
        return customerHeaders;
      }
      return [];
    }
    return getFullColumns();
  }, [lang]);
  const getFieldProps = useCallback((prop) => {
    if (prop){
      const domain = domains.filter(d => d.id === prop)[0] || { len: '', scale: '' };
      const dataType = mapping.filter(m => m.id === domain.applyFor)[0]?.[db] || '';
      return {
        len: domain.len === undefined ? '' : domain.len,
        scale: domain.scale === undefined ? '' : domain.scale,
        type: dataType,
      };
    }
    return {};
  }, [domains, mapping, db]);
  const [{ fields = [], ...restData }, updateTableData] = useState({
    ...data,
    headers: data.headers || allColumns,
  });
  const fieldsRef = useRef([]);
  useEffect(() => {
    setDict(dataSource?.dicts);
  }, [dataSource?.dicts]);
  fieldsRef.current = fields;
  const [selectedFields, updateSelectedFields] = useState([]);
  const [selectedColumns, updateSelectedColumns] = useState([]);
  const [insertField, setInsertField] = useState('');
  const selectedFieldsRef = useRef([]);
  selectedFieldsRef.current = selectedFields;
  const insertFieldRef = useRef('');
  insertFieldRef.current = insertField;
  const standardGroupRef = useRef(null);
  const tempHeaders = useMemo(() => {
    return restData.headers.map((h) => {
      let refKey = h.refKey || h.newCode;
      const columnOthers = (dataSource?.profile?.headers || [])
          .filter(c => c.refKey === refKey)[0];
      const defaultColumn = allColumns.filter(c => c.newCode === refKey)[0];
      if(columnOthers) {
        const column = defaultColumn || {value: columnOthers.value};
        return {
          ...h,
          ...column,
          enable: columnOthers.enable,
          refKey,
        };
      } else if (defaultColumn) {
        return {
          ...h,
          ...defaultColumn,
        };
      }
      return h;
    });
  }, [restData.headers, allColumns, dataSource?.profile?.headers]);
  const cellClick = (h, f) => {
    if (h !== 'domain' || (h === 'domain' && !selectedFieldsRef.current.includes(f.id))) {
      updateSelectedFields((pre) => {
        if (pre.includes(f.id)) {
          return [f.id];
        }
        return empty;
      });
    }
  };
  const onBodyClick = () => {
    updateSelectedColumns(empty);
  };
  const comBlur = (f, name) => {
    if(name === 'sort') {
      updateTableData((p) => {
        return {
          ...p,
          fields: (p.fields || []).sort((a, b) => {
            return `${a.sort}`.localeCompare(`${b.sort}`);
          }),
        };
      });
    }
  };
  const updateTableDataByName = (f, name, e) => {
    let value = e.target.value;
    const targetData = e.target.data;
    if (checkboxComponents.includes(name)) {
      value = e.target.checked;
    }
    updateTableData((pre) => {
      const changeFields = [];
      const newData = {
        ...pre,
        fields: pre.fields.map((field) => {
          if (name === 'domain') {
            const domainData = targetData || domains.find(d => d.id === value);
            if (selectedFieldsRef.current.includes(field.id) || (f.id === field.id)) {
              const newField = {
                [name]: value,
                type: '',
                len: '',
                scale: '',
                baseType: domainData?.applyFor || '',
              };
              changeFields.push({
                id: field.id,
                ...newField,
              });
              return {
                ...field,
                ...newField,
              };
            }
            return field;
          } else if(f.id === field.id) {
            let others = {};
            if (name === 'primaryKey' && value) {
              others = {
                notNull: true,
              };
            } else if((name === 'type' || name === 'len' || name === 'scale')
                && !!field.domain && (f[name] !== value)){
              // 将当前domain的对应的数据落地
              others = {
                ...getFieldProps(field.domain),
                domain: '',
              };
            }
            if(name === 'type') {
              const currentMap = mapping.find(m => m[db] === value);
              if(currentMap) {
                others.baseType = currentMap.id;
              } else {
                others.baseType = '';
              }
            }
            let newField = {
              ...others,
              [name]: value,
            };
            if((name === 'defKey' || name === 'defName') && allFieldOptions) {
              newField = allFieldOptions.find(a => a.id === value) || newField;
            }
            changeFields.push({
              id: field.id,
              ...newField,
            });
            return {
              ...field,
              ...newField,
            };
          }
          return field;
        }),
      };
      tableDataChange && tableDataChange(newData.fields, 'fields', changeFields);
      return newData;
    });
  };
  const freezeCount = {
    left: 4,
    right: 3,
  };
  const hiddenFields = ['hideInGraph'];
  if (!isEntity){
    hiddenFields.push('isStandard');
  }
  const updateTableDataByHeader = (key, type, value, i) => {
    let newHeaders = [...tempHeaders];
    if (type === 'move') {
      newHeaders = value;
    } else if (type === 'freeze'){
      const tempIndex = tempHeaders.findIndex(h => h?.refKey === key);
      newHeaders = newHeaders.map((h, index) => {
        if ((i > freezeCount.left - 1) ? index >= tempIndex : index <= tempIndex) {
          return {
            ...h,
            [type]: value,
          };
        }
        return h;
      });
    } else if (type === 'hideInGraph') {
      newHeaders = newHeaders.map((h) => {
        if (h?.refKey === key) {
          return {
            ...h,
            [type]: value,
          };
        }
        return h;
      });
    }
    const newData = {
      ...restData,
      headers: newHeaders,
      fields,
    };
    updateTableData(newData);
    tableDataChange && tableDataChange(newData.headers, 'headers');
  };
  const resetTableHeaders = () => {
    updateTableDataByHeader(null, 'move', allColumns.map((c) => {
      return {
        freeze: !!(c.newCode === 'defKey' ||  c.newCode === 'defName'),
        refKey: c.newCode,
        hideInGraph: c.relationNoShow,
      };
    }));
  };
  const updateNote = () => {
    let modal;
    let changeData;
    let notes = fieldsRef.current
        .filter(f => selectedFieldsRef.current.includes(f.id))
        .map(d => _.pick(d, ['notes', 'id']));
    const dataChange = (d) => {
      changeData = d;
    };
    const onOk = () => {
      if (changeData) {
        const ids = notes.map(n => n.id);
        const tempFields = fieldsRef.current.map((f) => {
          if (ids.includes(f.id)) {
            return {
              ...f,
              notes: changeData,
            };
          }
          return f;
        });
        updateTableData((pre) => {
          return {
            ...pre,
            fields: tempFields,
          };
        });
        tableDataChange && tableDataChange(tempFields, 'fields');
      }
      modal && modal.close();
    };
    const onCancel = () => {
      modal && modal.close();
    };
    modal = Component.openModal(<Note
      dataSource={getDataSource()}
      updateDataSource={updateDataSource}
      data={notes}
      dataChange={dataChange}
    />, {
      bodyStyle: {width: '80%'},
      title: Component.FormatMessage.string({id: 'standardFields.selectGroup'}),
      buttons: [<Component.Button type='primary' key='ok' onClick={onOk}>
        <Component.FormatMessage id='button.ok'/>
      </Component.Button>,
        <Component.Button key='cancel' onClick={onCancel}>
          <Component.FormatMessage id='button.cancel'/>
        </Component.Button>],
    });
  };
  const calcShiftSelected = (fieldKey) => {
    let selected = [...selectedFieldsRef.current];
    if (selected.length === 0) {
      return [fieldKey];
    }
    const minIndex = Math.min(...selected.map(key => fields.findIndex((c) => {
      return c.id === key;
    })));
    const currentIndex = fields.findIndex((c) => {
      return fieldKey === c.id;
    });
    if (minIndex >= 0) {
      selected = fields.map((m, i) => {
        if ((i >= currentIndex && i <= minIndex) || (i >= minIndex && i <= currentIndex)) {
          return m.id;
        }
        return null;
      }).filter(m => !!m);
    }
    return selected;
  };
  const tableRowClick = (e, key) => {
    // 此处需要判断时候按住了shift键 如果按住则是多选
    let tempKeys = [...selectedFieldsRef.current];
    if (e.ctrlKey || e.metaKey) {
      if (tempKeys.includes(key)) {
        tempKeys = tempKeys.filter(k => k !== key);
      } else {
        tempKeys.push(key);
      }
    } else if (e.shiftKey) {
      tempKeys = calcShiftSelected(key);
    } else {
      tempKeys = tempKeys.includes(key) ? empty : [key];
    }
    onTableRowClick && onTableRowClick(tempKeys, fields);
    updateSelectedFields(tempKeys);
  };
  const onMouseUp = (type) => {
    if (dragStatus.current) {
      if(type === 'up') {
        if (insertFieldRef.current) {
          const dragKeys = Array.from(dragRef.current.querySelectorAll('tr'))
              .map((t) => {
                return t.getAttribute('data-key');
              });
          const toIndex = fieldsRef.current.findIndex(f => f.id === insertFieldRef.current);
          let tempFields = fieldsRef.current.map((f) => {
            if (dragKeys.includes(f.id)) {
              return {
                ...f,
                needRemove: true,
              };
            }
            return f;
          });
          const dragFields = fieldsRef.current.filter(f => dragKeys.includes(f.id));
          tempFields.splice(toIndex + 1, 0, ...dragFields);
          tempFields = tempFields.filter(f => !f.needRemove);
          updateTableData(preD => ({
            ...preD,
            fields: tempFields,
          }));
          tableDataChange && tableDataChange(tempFields, 'fields');
        }
      }
      dragRef.current && document.body.removeChild(dragRef.current);
      dragRef.current = null;
      setInsertField('');
      dragStatus.current = {
        status: false,
      };
    }
  };
  const createTempDom = () => {
    const tbody = tableRef.current.querySelector('tbody');
    const allTr = Array.from(tbody.children);
    let selectedTr = [];
    if (selectedFieldsRef.current.length === 0) {
      selectedTr = [dragStatus.current.downDom.parentElement];
    } else {
      selectedTr = allTr.filter(t => selectedFieldsRef.current.includes(t.getAttribute('data-key')));
    }
    const container = document.createElement('div');
    container.setAttribute('class', `${currentPrefix}-drag-container`);
    const tempTable = tableRef.current.cloneNode(false);
    selectedTr.forEach((tr) => {
      const newTr = tr.cloneNode(true);
      newTr.style.width = `${tr.scrollWidth}px`;
      tempTable.appendChild(newTr);
    });
    container.appendChild(tempTable);
    container.onmouseup = onMouseUp;
    document.body.appendChild(container);
    return container;
  };
  const calcTrInTableView = (e, container) => {
    const containerRect = container.getBoundingClientRect();
    if ((e.clientY - 20) < containerRect.y) {
      // eslint-disable-next-line no-param-reassign
      container.scrollTop -= 30;
    } else if ((e.clientY + 20) > (containerRect.y + containerRect.height)) {
      // eslint-disable-next-line no-param-reassign
      container.scrollTop += 30;
    }
  };
  const onMouseMove = (e) => {
    if (dragStatus.current.status) {
      if (!dragRef.current) {
        dragRef.current = createTempDom();
      }
      dragRef.current.style.left = `${e.clientX - 20}px`;
      dragRef.current.style.top = `${e.clientY - 20}px`;
      calcTrInTableView(e, tableRef.current.parentElement);
    }
  };
  const onMouseOver = (e) => {
    if (dragStatus.current.status && dragRef.current) {
      const tempTr = Array.from(dragRef.current.querySelectorAll('tr'));
      const tr = e.currentTarget;
      const trKey = tr.getAttribute('data-key');
      if (!tempTr.some(t => t.getAttribute('data-key') === trKey)) {
        setInsertField(trKey);
      } else {
        setInsertField('');
      }
    }
  };
  const onMouseDown = (e) => {
    if (!disableDragRow && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      dragStatus.current = {
        status: true,
        downDom: e.currentTarget,
      };
    }
  };
  useEffect(() => {
    const id = Math.uuid();
    addBodyEvent('onmousemove', id, onMouseMove);
    addBodyEvent('onmouseup', id, () => onMouseUp('up'));
    addBodyEvent('onmouseleave', id, () => onMouseUp('leave'));
    return () => {
      removeBodyEvent('onmousemove', id);
      removeBodyEvent('onmouseup', id);
      removeBodyEvent('onmouseleave', id);
    };
  }, []);
  const getSelectedFieldsIndex = () => {
    let tempFields = [...(fieldsRef.current || [])];
    return tempFields.map((field, index) => {
      if (selectedFieldsRef.current.includes(field.id)) {
        return index;
      }
      return null;
    }).filter(field => field !== null);
  };
  const moveFields = (type, status) => {
    // 将所有选中的属性进行移动
    const tempFields = moveArrayPositionByArray(fieldsRef.current,
        selectedFieldsRef.current,
        type === 'up' ? -1 : 1, 'id', status);
    updateTableData((pre) => {
      return {
        ...pre,
        fields: tempFields,
      };
    });
    tableDataChange && tableDataChange(tempFields, 'fields');
  };
  const createEmptyField = (count) => {
    const emptyFields = [];
    const domain = domains[0] || {};
    for (let i = 0; i < count; i += 1){
      let newField = {};
      if (defaultEmptyField) {
        newField = defaultEmptyField; // 从父组件获取
      } else {
        newField = {
          ...emptyField,
          baseType: mapping[0]?.id || '',
          extProps: getDataSource().profile?.extProps || {},
          domain: domain.id,
        };
      }
      emptyFields.push({
        ...newField,
        id: Math.uuid(), // 创建唯一ID
      });
    }
    return emptyFields;
  };
  const addField = (e, pasteFields) => {
    const selectedTrsIndex = getSelectedFieldsIndex();
    let tempFields = [...(fieldsRef.current || [])];
    let newFields = pasteFields;
    if (!pasteFields){
      newFields = createEmptyField(1);
    }
    if (selectedTrsIndex.length > 0) {
      tempFields.splice(Math.min(...selectedTrsIndex), 0, ...newFields);
    } else {
      tempFields = tempFields.concat(newFields);
    }
    if (expand) {
      setExpands((pre) => {
        return pre.concat(newFields.map(f => f.id));
      });
    }
    updateTableData((pre) => {
      return {
        ...pre,
        fields: tempFields,
      };
    });
    tableDataChange && tableDataChange(tempFields, 'fields');
  };
  const addFieldOpt = (e) => {
    if (onAdd) {
      onAdd().then((res) => {
        addField(e, res);
      });
    } else {
      addField(e);
    }
  };
  const deleteField = () => {
    const allIndex = getSelectedFieldsIndex();
    const minIndex = Math.min(...allIndex);
    const newFields = (fields || []).filter(f => !selectedFields.includes(f.id));
    updateTableData((pre) => {
      return {
        ...pre,
        fields: newFields,
      };
    });
    tableDataChange && tableDataChange(newFields, 'fields');
    const selectField = newFields[(minIndex - 1) < 0 ? 0 : minIndex - 1];
    updateSelectedFields((selectField && [selectField.id]) || empty);
  };
  const tableKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.target.nodeName === 'TABLE' && !disableCopyAndCut) {
        const { current } = tableRef;
        // 如果选中的是表格
        if (e.keyCode === 67 && selectedFields.length > 0) {
          e.stopPropagation();
          Copy(getCopyRealData(dataSource, [
              {
                fields: fields.filter(f => selectedFields.includes(f.id)).map(f => _.omit(f, 'children')),
              },
              ])[0]?.fields || [],
              Component.FormatMessage.string({id: 'copySuccess'}));
          current && current.focus({
            preventScroll: true,
          });
        } else if(e.keyCode === 86) {
          e.preventDefault();
          e.stopPropagation();
          Paste((value) => {
            let pasteFields = [];
            try {
              pasteFields = JSON.parse(value);
            } catch (error) {
              // 判断是否来自excel粘贴
              // eslint-disable-next-line no-use-before-define
              pasteFields = parseExcel(value, finalTempHeaders);
              // Component.Message.error({
              //   title: Component.FormatMessage.string({id: 'tableValidate.invalidJsonData'}),
              // });
            }
            if (validate) {
              // 获取父组件的校验
              pasteFields = validate(pasteFields.map(f => _.omit(f, ['id', 'otherData'])));
            } else {
              // 使用默认的校验
              pasteFields = validateFields(putCopyRealData(dataSource,
                  {fields: pasteFields}).fields || []);
            }
            // 过滤重复字段
            const fieldKeys = fields
                .map(f => (f.defKey || '').toLocaleLowerCase());
            const finalFields = pasteFields.map((f) => {
              const key = generatorKey(f.defKey || '', fieldKeys);
              fieldKeys.push(key.toLocaleLowerCase());
                return {
                  ...f,
                  id: Math.uuid(),
                  defKey: key,
                  baseType: getFieldBaseType(f, domains, mapping, db),
                };
              });
              Component.Message.success({
                title: Component.FormatMessage.string({id: 'pasteSuccess'}),
              });
              addField(null, finalFields);
          });
          current && current.focus({
            preventScroll: true,
          });
        }
      }
    }
  };
  const importFields = (importData) => {
    const newFields = fields.filter(f => !f.refEntity).concat(importData); // 替换所有的导入数据
    updateTableData(pre => ({
      ...pre,
      fields: newFields,
    }));
    tableDataChange && tableDataChange(newFields, 'fields');
  };
  const updateFieldsHideInGraph = (type) => {
    const newFields = fields.map((f) => {
      if (selectedFields.includes(f.id)) {
        return {
          ...f,
          hideInGraph: type,
        };
      }
      return f;
    });
    updateTableData(pre => ({
      ...pre,
      fields: newFields,
    }));
    tableDataChange && tableDataChange(newFields, 'fields');
  };
  const addStandardFields = () => {
    if (selectedFieldsRef.current.length === 0) {
      Component.Modal.error({
        title: Component.FormatMessage.string({id: 'optFail'}),
        message: Component.FormatMessage.string({id: 'tableValidate.selectedFieldsEmpty'}),
      });
    } else {
      let modal;
      const current = dataSource.standardFields || [];
      const onOk = () => {
        const group = standardGroupRef.current.getGroup() || {};
        if (group.defKey) {
          const newFields = fieldsRef.current
              .filter(f => selectedFieldsRef.current.includes(f.id))
              .filter(f => current
                  .reduce((a, b) => a.concat(b.fields || []), [])
                  .findIndex(c => c.defKey === f.defKey) < 0)
              .map(f => ({
                ...f,
                id: Math.uuid(),
                // primaryKey: false,
                // notNull: false,
                // autoIncrement: false,
              }));
          let newCurrent = [...current];
          let result = false;
          if (group.group) {
            newCurrent = newCurrent.map((c) => {
              if (c.id === group.group) {
                return {
                  ...c,
                  defKey: group.defKey,
                  defName: group.defName,
                  fields: (c.fields || []).concat(newFields),
                };
              }
              return c;
            });
            result = true;
          } else if (current.findIndex(c => c.id === group.id) < 0) {
            newCurrent = newCurrent.concat({
              id: Math.uuid(),
              defKey: group.defKey,
              defName: group.defName,
              fields: [...newFields],
            });
            result = true;
          } else {
            Component.Message.error({
              title: Component.FormatMessage.string({id: 'standardFields.groupAndFieldNotAllowRepeatAndEmpty'})});
          }
          if (result) {
            updateDataSource && updateDataSource({
              ...dataSource,
              standardFields: newCurrent,
            });
            Component.Message.success({
              title: Component.FormatMessage.string({
                id: 'tableEdit.addStandardFieldsMessage',
                data: {
                  count: selectedFieldsRef.current.length,
                  fail: selectedFieldsRef.current.length - newFields.length,
                },
              }),
            });
            modal && modal.close();
          }
        } else {
          Component.Message.error({
            title: Component.FormatMessage.string({id: 'standardFields.groupNotAllowEmpty'})});
        }
      };
      const onCancel = () => {
        modal && modal.close();
      };
      modal = Component.openModal(<StandardGroupSelect
        ref={standardGroupRef}
        current={current}
      />, {
        title: Component.FormatMessage.string({id: 'standardFields.selectGroup'}),
        buttons: [<Component.Button type='primary' key='ok' onClick={onOk}>
          <Component.FormatMessage id='button.ok'/>
        </Component.Button>,
          <Component.Button key='cancel' onClick={onCancel}>
            <Component.FormatMessage id='button.cancel'/>
          </Component.Button>],
      });
    }
  };
  const onExpand = (key) => {
    setExpands((pre) => {
      if (pre.includes(key)) {
        return pre.filter(p => p !== key);
      }
      return pre.concat(key);
    });
  };
  const columnWidth = getColumnWidth();
  const getClass = (f) => {
    let classData = '';
    const base = `${currentPrefix}-table-`;
    if (selectedFields.includes(f.id)) {
      classData += `${base}selected`;
    } else {
      classData += `${base}default`;
    }
    if (f.id === insertField) {
      classData += ` ${base}insert`;
    }
    return classData;
  };
  const finalTempHeaders = tempHeaders
      .filter(h => (!hiddenFields.includes(h.refKey)) && (h.enable !== false));
  const cellRef = (ref, row, cell) => {
    if(!inputRef.current[row]) {
      inputRef.current[row] = {};
    }
    inputRef.current[row][cell] = ref;
  };
  const getRowAndCellIndex = (row, cell, type) => {
    let currentRowIndex, currentCellIndex;
    if (type === 'up') {
      currentRowIndex = fieldsRef.current.findIndex(f => f.id === row);
      return {
        rowKey: fieldsRef.current[currentRowIndex - 1]?.id,
        cellKey: cell,
      };
    } else if (type === 'down') {
      currentRowIndex = fieldsRef.current.findIndex(f => f.id === row);
      return {
        rowKey: fieldsRef.current[currentRowIndex + 1]?.id,
        cellKey: cell,
      };
    } else if (type === 'left') {
      currentCellIndex = finalTempHeaders.findIndex(f => f.refKey === cell);
      return {
        rowKey: row,
        cellKey: finalTempHeaders[currentCellIndex - 1]?.refKey,
      };
    }
    currentCellIndex = finalTempHeaders.findIndex(f => f.refKey === cell);
    return {
      rowKey: row,
      cellKey: finalTempHeaders[currentCellIndex + 1]?.refKey,
    };
  };
  const onKeyDown = (e, row, cell) => {
    if (e.keyCode === 38) {
      // up
      virtualRef.current?.scroll(-30);
      const { rowKey, cellKey } = getRowAndCellIndex(row, cell, 'up');
      const cellDom = inputRef.current?.[rowKey]?.[cellKey]?.current;
      if (cellDom) {
        cellDom.focus();
        cellDom.setSelectionRange(0, 0);
        e.preventDefault();
      }
    } else if (e.keyCode === 40) {
      // down
      virtualRef.current?.scroll(30);
      const { rowKey, cellKey } = getRowAndCellIndex(row, cell, 'down');
      const cellDom = inputRef.current?.[rowKey]?.[cellKey]?.current;
      if (cellDom) {
        cellDom.focus();
        cellDom.setSelectionRange(0, 0);
        e.preventDefault();
      }
    } else if(e.keyCode === 37) {
      const selectionStart = e.currentTarget.selectionStart;
      if (selectionStart === 0) {
        const { rowKey, cellKey } = getRowAndCellIndex(row, cell, 'left');
        const cellDom = inputRef.current?.[rowKey]?.[cellKey]?.current;
        if (cellDom) {
          const length = cellDom.value.length;
          cellDom.focus();
          cellDom.setSelectionRange(length, length);
          e.preventDefault();
        }
      }
      // left
    } else if (e.keyCode === 39) {
      // right
      const valueLength = e.currentTarget.value.length;
      const selectionStart = e.currentTarget.selectionStart;
      if (selectionStart === valueLength) {
        const { rowKey, cellKey } = getRowAndCellIndex(row, cell, 'right');
        const cellDom = inputRef.current?.[rowKey]?.[cellKey]?.current;
        if (cellDom) {
          cellDom.focus();
          cellDom.setSelectionRange(0, 0);
          e.preventDefault();
        }
      }
    }
  };
  const calcLeft = (h) => {
    const index = finalTempHeaders.findIndex(t => t.refKey === h.refKey);
    return finalTempHeaders
        .slice(0, index)
        .reduce((a, b) => a + (columnWidth[b?.refKey] || 0), 50);
  };
  const calcRight = (h) => {
    const index = finalTempHeaders.findIndex(t => t.refKey === h.refKey);
    return finalTempHeaders
        .slice(index + 1, finalTempHeaders.length)
        .reduce((a, b) => a + (columnWidth[b?.refKey] || 0), 0);
  };
  const calcPosition = (h, i) => {
    if (i > 4) {
      return {
        right: calcRight(h),
      };
    }
    return {
      left: calcLeft(h),
    };
  };
  const filterFields = fields.filter((f) => {
    if (valueSearch || search) {
      return (valueSearch || search)(f, valueContext || searchValue);
    }
    return true;
  });
  const filterFieldsRef = useRef([...filterFields]);
  filterFieldsRef.current = [...filterFields];
  const otherStyle = { position: 'sticky', left: 0, zIndex: 100, top: fixHeader ? 0 : 'unset' };
  const twinkleTr = (id) => {
    const keyArray = id.split(separator);
    const key = keyArray[0];
    let current = fieldsRef.current.filter(f => f.id === key)[0];
    if (current) {
      if (keyArray.length > 1) {
        setExpands([current.id]);
        current = (current.fields || []).filter(f => f.id === keyArray[1])[0];
      }
      const container = tableRef.current.parentElement;
      const fieldIndex = filterFieldsRef.current.findIndex(f => f.id === current?.id);
      if (fieldIndex >= 0) {
        if (virtualRef.current) {
          virtualRef.current.scrollTop(fieldIndex * 30);
        } else {
          container.scrollTop = fieldIndex * 30;
        }
      } else if(filterFieldsRef.current.some(f => f.children)) {
        const currentTr = Array.from(container.querySelectorAll('tr'))
            .filter(t => t.getAttribute('data-key') === current?.id)[0];
        const trRect = currentTr.getBoundingClientRect();
        const optRect = optRef.current.getBoundingClientRect();
        const offset = trRect.bottom - optRect.bottom - trRect.height - 25;
        container.scrollTop += offset;
      }
      setTimeout(() => {
        const currentTr = Array.from(container.querySelectorAll('tr'))
            .filter(t => t.getAttribute('data-key') === current?.id)[0];
        if (currentTr) {
          const tempClass = currentTr.getAttribute('class');
          currentTr.setAttribute('class', `${tempClass} ${currentPrefix}-table-twinkle`);
          setTimeout(() => {
            currentTr.setAttribute('class', tempClass);
          }, 1000);
        }
      }, 100);
    }
  };
  useEffect(() => {
    if (twinkle) {
      twinkleTr(twinkle);
    }
  }, [twinkle]);
  useImperativeHandle(refInstance, () => {
    return {
      twinkleTr: (key) => {
        twinkleTr(key);
      },
    };
  }, []);
  useEffect(() => {
    ready && ready({
      updateTableData,
      twinkleTr,
    });
  }, []);
  const menuClick = (m) => {
    addField(m, createEmptyField(m.key));
  };
  const dropDownMenus = useMemo(() => ([
    {key: 5, name: FormatMessage.string({id: 'tableBase.addFieldCount', data: {count: 5}})},
    {key: 10, name: FormatMessage.string({id: 'tableBase.addFieldCount', data: {count: 10}})},
    {key: 15, name: FormatMessage.string({id: 'tableBase.addFieldCount', data: {count: 15}})},
  ]),[]);
  const onHeaderClick = (key) => {
    updateSelectedColumns((pre) => {
      if (pre.includes(key)) {
        return pre.filter(k => k !== key);
      }
      return pre.concat(key);
    });
  };
  const moveHeader = (type) => {
    const freezeIndex = tempHeaders.map((h, i) => {
      if (h.freeze) {
        return i;
      }
      return null;
    }).filter(h => h !== null);
    const newHeaders = moveArrayPositionByArray(
        finalTempHeaders,
        selectedColumns,
        type === 'left' ? -1 : 1,
        'refKey')
        .concat(tempHeaders.filter(h => hiddenFields.includes(h.refKey))).map((h, i) => {
          return {
            ...h,
            freeze: freezeIndex.includes(i),
          };
        });
    updateTableDataByHeader(null,
        'move',
        newHeaders,
    );
  };
  const headerIconClick = (e, ...args) => {
    e.stopPropagation();
    updateTableDataByHeader(...args);
  };
  const exchangeHeader = () => {
    let status = 0;
    let tempFields = [...(fieldsRef.current || [])].map((f) => {
      return {
        ...f,
        ...selectedColumns.reduce((a, b) => {
          if (typeof f[b] === 'string') {
            if (status === 0) {
              status = f[b].toLocaleUpperCase() === f[b] ? 1 : 2;
            }
            return {
              ...a,
              // eslint-disable-next-line no-nested-ternary
              [b]: status !== 0 ? (status === 1 ? f[b].toLocaleLowerCase()
                : f[b].toLocaleUpperCase()) : f[b],
            };
          }
          return a;
        }, {}),
      };
    });
    updateTableData((pre) => {
      return {
        ...pre,
        fields: tempFields,
      };
    });
    tableDataChange && tableDataChange(tempFields, 'fields');
  };
  const OptHelp = () => {
    return <div className={`${currentPrefix}-table-opt-help`}>
      <span>{Component.FormatMessage.string({id: 'tableEdit.opt[0]'})}</span>
      <span>{Component.FormatMessage.string({id: 'tableEdit.opt[1]'})}</span>
      <span>{Component.FormatMessage.string({id: 'tableEdit.opt[2]'})}</span>
      <span>{Component.FormatMessage.string({id: 'tableEdit.opt[3]'})}</span>
      <span>{Component.FormatMessage.string({id: 'tableEdit.opt[4]'})}</span>
      <span>{Component.FormatMessage.string({id: 'tableEdit.opt[5]'})}</span>
      <span>{Component.FormatMessage.string({id: 'tableEdit.opt[6]'})}</span>
    </div>;
  };
  const onFilterChange = (e) => {
    setSearchValue(e.target.value);
    expand && setExpands(fieldsRef.current.map(f => f.id));
  };
  const tableContextMemo = useMemo(() => {
    return {
      valueContext: searchValue,
      valueSearch: search,
    };
  }, [searchValue]);
  const jumpDb = (e) => {
    e.stopPropagation();
    let modal = null;
    let changeValue = '';
    const onChange = (v) => {
      changeValue = v.target.value;
    };
    const onOk = () => {
      if(changeValue && changeValue !== dbData.id) {
       updateDataSource({
         ...transformFieldType({
           ...dataSource,
           profile: {
             ...dataSource.profile,
             default: {
               ...dataSource.profile?.default,
               db: changeValue,
             },
           },
         }, dataSource.profile?.default?.db),
       });
      }
      Component.Message.success({title: FormatMessage.string({id: 'optSuccess'})});
      modal && modal.close();
    };
    const onCancel = () => {
      modal && modal.close();
    };
    const codeTemplates = _.get(dataSource, 'profile.codeTemplates', []);
    const dataTypeSupports = _.get(dataSource, 'profile.dataTypeSupports', [])
        .filter((d) => {
          const code = codeTemplates.filter(c => c.applyFor === d.id)[0];
          return code?.type === 'dbDDL';
        });
    modal = Component.openModal(<div className={`${currentPrefix}-table-type-edit`}>
      <Component.Select
        notAllowEmpty
        onChange={onChange}
        defaultValue={dbData.id}
        allowClear={false}>
        {dataTypeSupports.map((m) => {
          return (<Component.Select.Option
            key={m.id}
            value={m.id}
          >
            {m.defKey}
          </Component.Select.Option>);
        })}
      </Component.Select>
    </div>, {
      title: Component.FormatMessage.string({id: 'tableEdit.changeDb'}),
      buttons: [<Component.Button type='primary' key='ok' onClick={onOk}>
        <Component.FormatMessage id='button.ok'/>
      </Component.Button>,
        <Component.Button key='cancel' onClick={onCancel}>
          <Component.FormatMessage id='button.cancel'/>
        </Component.Button>],
    });
  };
  const jumpEdit = () => {
    openConfig && openConfig();
  };
  const jumpExcel = () => {
    let modal = null;
    const onOk = () => {
      updateTableData((p) => {
        const newFields = mergeId(sheetRef.current.getSheetData(), p.fields);
        tableDataChange && tableDataChange(newFields, 'fields');
        return {
          ...p,
          fields: newFields,
        };
      });
      sheetRef.current.destroy();
      modal && modal.close();
    };
    const onCancel = () => {
      sheetRef.current.destroy();
      modal && modal.close();
    };
    // 需要移除的列
    const removeColumns = ['hideInGraph', 'isStandard', 'extProps'];
    modal = Component.openModal(<Component.Sheet
      emptyRow={isEntity ? emptyField : emptyDictItem}
      data={{headers: tempHeaders
            .filter(h => (h.enable !== false) && (!removeColumns.includes(h.refKey))),
fields}}
      dataSource={dataSource}
      ref={sheetRef}
    />, {
      bodyStyle: {
        width: tableType === 'logicEntity' ? '60%' : '90%',
      },
      contentStyle: {
        height: '90vh',
      },
      title: Component.FormatMessage.string({id: 'tableEdit.excelMode'}),
      buttons: [<Component.Button type='primary' key='ok' onClick={onOk}>
        <Component.FormatMessage id='button.ok'/>
      </Component.Button>,
        <Component.Button key='cancel' onClick={onCancel}>
          <Component.FormatMessage id='button.cancel'/>
        </Component.Button>],
    });
  };
  const isView = finalTempHeaders.some(h => h.refKey === 'refEntity');
  const onScroll = (index, length) => {
    setDataPosition({
      index,
      length,
    });
  };
  const renderTable = () => {
    return <table
      ref={tableRef}
      className={`${currentPrefix}-table`}
      tabIndex='0'
      onKeyDown={tableKeyDown}
      style={style}
    >
      {!hiddenHeader && <thead>
        <tr>
          <th style={{...otherStyle}}>{}</th>
          {expand && <th>{}</th>}
          {finalTempHeaders.map((h, i) => {
          const freezeStyle = (h?.freeze && freeze) ?
              { position: 'sticky', ...calcPosition(h, i) } : {};
          // let type = 'fa-eye';
          // if (h.hideInGraph) {
          //   type = 'fa-eye-slash';
          // }
          const thClass = selectedColumns.includes(h?.refKey)
              ? `${currentPrefix}-table-selected` : '';
          return <th
            className={thClass}
            onClick={() => onHeaderClick(h?.refKey)}
            key={h?.refKey}
            style={{
                cursor: 'pointer',
                width: autoWidth ? 'auto' : columnWidth[h?.refKey],
                zIndex: h?.freeze ? 100 : 99,
                top: fixHeader ? 0 : 'unset',
                ...freezeStyle,
              }}
          >
            <span style={{width: columnWidth[h?.refKey] ? columnWidth[h?.refKey] - 3 : 'auto'}}>
              {h?.value}
              {/*{!disableHeaderIcon && h?.refKey !== 'extProps' && isView &&*/}
              {/*    <Component.Icon*/}
              {/*  onClick={*/}
              {/*      e => headerIconClick(e, h?.refKey, 'hideInGraph', !h.hideInGraph)*/}
              {/*    }*/}
              {/*  type={type}*/}
              {/*  style={{ marginLeft: 5,cursor: 'pointer' }}*/}
              {/*/>}*/}
              {freeze &&
                        ((i < freezeCount.left) ||
                            (i > (finalTempHeaders.length - freezeCount.right - 1)))
                        && <Component.Icon
                          onClick={e => headerIconClick(e, h?.refKey, 'freeze', !h.freeze, i)}
                          type={h?.freeze ? 'fa-lock' : 'fa-unlock'}
                          style={{marginLeft: 5, cursor: 'pointer'}}
                        />}
            </span>
          </th>;
        })}
        </tr>
      </thead>}
      <TableContent.Provider value={tableContextMemo}>
        <tbody
          onClick={onBodyClick}
        >
          {
          (virtual && filterFields.length > 100 ? filterFields.slice(dataPosition.index,
                  dataPosition.length + dataPosition.index)
              : filterFields).map((f, i) => (
                <Tr
                  comBlur={comBlur}
                  allFieldOptions={allFieldOptions}
                  needHideInGraph={needHideInGraph}
                  isView={isView}
                  extAttrProps={isEntity ? dataSource?.profile?.extAttrProps : null}
                  entities={dataSource?.entities}
                  openDict={openDict}
                  selectedColumns={selectedColumns}
                  hiddenFields={hiddenFields}
                  updateDataSource={updateDataSource}
                  getDataSource={getDataSource}
                  reading={reading}
                  onKeyDown={onKeyDown}
                  cellRef={cellRef}
                  key={f.id}
                  f={f}
                  i={virtual && filterFields.length > 100
                      ? filterFields.findIndex(p => p.id === f.id) : i}
                  searchValue={searchValue}
                  search={search}
                  expand={expand}
                  onMouseOver={onMouseOver}
                  tempHeaders={tempHeaders}
                  calcPosition={calcPosition}
                  getClass={getClass(f)}
                  tableRowClick={tableRowClick}
                  disableDragRow={disableDragRow}
                  checkboxComponents={checkboxComponents}
                  onMouseDown={onMouseDown}
                  currentPrefix={currentPrefix}
                  onExpand={onExpand}
                  selectedFields={selectedFields}
                  expands={expands}
                  dicts={dicts}
                  setDict={setDict}
                  updateTableDataByName={updateTableDataByName}
                  freeze={freeze}
                  cellClick={cellClick}
                  defaultGroups={defaultGroups}
                  getFieldProps={getFieldProps}
                  domains={domains}
                  mapping={mapping}
                  uiHint={uiHint}
              />
          ))
        }
        </tbody>
      </TableContent.Provider>
    </table>;
  };
  const renderSearch = () => {
    if(search) {
      return <div className={`${currentPrefix}-table-opt-search`}>
        <Component.SearchInput placeholder={Component.FormatMessage.string({id: 'tableEdit.search'})} onChange={onFilterChange}/>
      </div>;
    }
    return null;
  };
  useEffect(() => {
    const Search = renderSearch();
    if(Search && searchRef) {
      ReactDOM.render(Search, searchRef());
    }
  }, []);
  return (
    <div className={`${currentPrefix}-table-container ${className || ''}`}>
      <div className={`${currentPrefix}-table-container-tools`}>
        {
            !reading && <span className={`${currentPrefix}-table-opt-container`}><span className={`${currentPrefix}-table-opt`} ref={optRef}>
              <span className={`${currentPrefix}-table-opt-normal`}>
                {tableType !== 'dict' && <Component.IconTitle disable={selectedFields.length === 0} title={Component.FormatMessage.string({id: 'tableEdit.moveStart'})} type='icon-zhiding' onClick={() => moveFields('up', 'start')}/>}
                {tableType !== 'dict' && <Component.IconTitle disable={selectedFields.length === 0} title={Component.FormatMessage.string({id: 'tableEdit.moveUp'})} type='icon-shangyi' onClick={() => moveFields('up')}/>}
                {tableType !== 'dict' && <Component.IconTitle disable={selectedFields.length === 0} title={Component.FormatMessage.string({id: 'tableEdit.moveDown'})} type='icon-xiayi' onClick={() => moveFields('down')}/>}
                {tableType !== 'dict' && <Component.IconTitle disable={selectedFields.length === 0} title={Component.FormatMessage.string({id: 'tableEdit.moveEnd'})} type='icon-zhidi' onClick={() => moveFields('down', 'end')}/>}
                <Component.DropButton menuClick={menuClick} dropDownMenus={dropDownMenus} position='top'>
                  <Component.IconTitle title={Component.FormatMessage.string({id: 'tableEdit.addField'})} type='fa-plus' onClick={addFieldOpt}/>
                </Component.DropButton>
                <Component.IconTitle style={{opacity: selectedFields.length === 0 ? 0.48 : 1}} disable={selectedFields.length === 0} title={Component.FormatMessage.string({id: 'tableEdit.deleteField'})} type='fa-minus' onClick={deleteField}/>
              </span>
              <span className={`${currentPrefix}-table-opt-header`}>
                {
                  !disableHeaderSort && isView && <>
                    <Component.IconTitle disable={selectedColumns.length === 0} title={Component.FormatMessage.string({id: 'tableEdit.moveFieldLeft'})} type='fa-arrow-left' onClick={() => moveHeader('left')}/>
                    <Component.IconTitle disable={selectedColumns.length === 0} title={Component.FormatMessage.string({id: 'tableEdit.moveFieldRight'})} type='fa-arrow-right' onClick={() => moveHeader('right')}/>
                  </>
              }
                <Component.IconTitle disable={selectedColumns.length === 0} title={Component.FormatMessage.string({id: 'tableEdit.exchangeCode'})} type='fa-exchange' onClick={exchangeHeader}/>
              </span>
              {
                  otherOpt && <span className={`${currentPrefix}-table-opt-other`}>
                    {!isView && <Component.IconTitle disable={selectedFields.length === 0} title={Component.FormatMessage.string({id: 'tableEdit.showSelectedFields'})} type='fa-eye' onClick={() => updateFieldsHideInGraph(false)}/>}
                    {!isView && <Component.IconTitle disable={selectedFields.length === 0} title={Component.FormatMessage.string({id: 'tableEdit.hiddenSelectedFields'})} type='fa-eye-slash' onClick={() => updateFieldsHideInGraph(true)}/>}
                    {!disableAddStandard && <Component.IconTitle disable={selectedFields.length === 0} title={Component.FormatMessage.string({id: 'tableEdit.addStandardFields'})} type='icon-ruku' onClick={addStandardFields}/>}
                    {!disableHeaderReset && <Component.IconTitle title={Component.FormatMessage.string({id: 'tableEdit.resetHeaders'})} type='fa-sort-amount-desc' onClick={resetTableHeaders}/>}
                    <Component.IconTitle disable={selectedFields.length === 0} title={Component.FormatMessage.string({id: 'tableEdit.note'})} type='fa-tags' onClick={updateNote}/>
                  </span>
              }
              {ExtraOpt && <span className={`${currentPrefix}-table-opt-extra`}><ExtraOpt
                prefix={currentPrefix}
                dataSource={dataSource}
                getRestData={getRestData}
                data={{fields, headers: tempHeaders}}
                onChange={importFields}
              />
              </span>}
              {info || <span className={`${currentPrefix}-table-opt-info`}>
                <Component.Tooltip title={<OptHelp/>} force placement='topLeft'>
                  <Component.Icon type='icon-xinxi'/>
                </Component.Tooltip>
              </span>}
              {
                  isEntity && <div className={`${currentPrefix}-table-opt-config`}>
                    <div>
                      <span>
                        {Component.FormatMessage.string({id: 'tableEdit.database'})}
                      </span>
                      <span onClick={jumpDb}>{dbData.defKey}</span>
                    </div>
                  </div>
              }
            </span>
              {isEntity && <span className={`${currentPrefix}-table-opt-setting`} key='setting' onClick={jumpEdit}>{Component.FormatMessage.string({id: 'tableEdit.columnSetting'})}</span>}
              {(isEntity || tableType === 'dict' || tableType === 'logicEntity') && <span className={`${currentPrefix}-table-opt-setting`} key='excel' onClick={jumpExcel}>{Component.FormatMessage.string({id: 'tableEdit.excelMode'})}</span> }
            </span>
        }
        {
            search && !searchRef && renderSearch()
        }
      </div>
      {
        virtual && filterFields.length > 100 ? <Component.VirtualList
          onScroll={onScroll}
          ref={virtualRef}
          containerHeight={filterFields.length * 30 + 25}
          itemHeight={30}
          offsetHeight={45}
          length={12}
        >
          {renderTable()}
        </Component.VirtualList>
            : <div className={`${currentPrefix}-table-content`}>{renderTable()}</div>
      }
    </div>
  );
}));

export default Table;
