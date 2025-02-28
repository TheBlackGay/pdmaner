import React, {useEffect, useRef, useState} from 'react';
import {FormatMessage, IconTitle, Input} from 'components';
import AutoSizer from 'react-virtualized-auto-sizer';
import {FixedSizeList as List} from 'react-window';

import {getPrefix} from '../../../../lib/prefixUtil';
import SelectGroup from '../../group/SelectGroup';
import {separator} from '../../../../../profile';
import './style/index.less';
import {moveArrayPositionByArray} from '../../../../lib/array_util';

export default React.memo(({ prefix, dataSource, dataChange, name, parentKey }) => {
    const [selected, setSelected] = useState([]);
    const [,setSortKey] = useState('');
    const [currentSort, setCurrentSort] = useState('');
    const [sort, setSort] = useState({defKey: '', defName: ''});
    const [viewGroups, setViewGroups] = useState(dataSource?.viewGroups || []);
    const initRef = useRef(false);
    const sortData = (data) => {
        if (currentSort && (sort.defKey || sort.defName)) {
            return [...data].sort((a, b) => {
                const firstSort = sort[currentSort] === 'desc' ? a?.[currentSort]?.localeCompare(b?.[currentSort]) : b?.[currentSort]?.localeCompare(a?.[currentSort]);
                if (firstSort === 0) {
                    const otherName = currentSort === 'defKey' ? 'defName' : 'defKey';
                    return sort[otherName] === 'desc' ? a?.[otherName]?.localeCompare(b?.[otherName]) : b?.[otherName]?.localeCompare(a?.[otherName]);
                }
                return firstSort;
            });
        }
        return data;
    };
    const dataSourceRef = useRef({...dataSource, [name]: sortData(dataSource[name])});
    const originRef = useRef(dataSourceRef.current[name]);
    const currentPrefix = getPrefix(prefix);
    const refNames = `ref${name.replace(/\b(\w)(\w*)/g, ($0, $1, $2) => {
        return $1.toUpperCase() + $2.toLowerCase();
    })}`;
    const getGroup = (dataKey) => {
        return viewGroups
            .filter(v => v[refNames]
                ?.includes(dataKey))
            .map(v => v.id);
    };
    const _dataChange = (value, fieldName, id) => {
      if (fieldName === 'group') {
          const tempViewGroups = (dataSourceRef.current.viewGroups || []).map((d) => {
              if (value.includes(d.id)) {
                  return {
                      ...d,
                      [refNames]: [...new Set((d[refNames] || []).concat(id).concat(selected))],
                  };
              }
              return {
                  ...d,
                  [refNames]: (d[refNames] || [])
                      .filter(refId => !(selected.concat(id)).includes(refId)),
              };
          });
          setViewGroups(tempViewGroups);
          dataSourceRef.current = {
              ...dataSourceRef.current,
              viewGroups: tempViewGroups,
          };
          dataChange && dataChange(dataSourceRef.current);
      } else {
          dataSourceRef.current = {
              ...dataSourceRef.current,
              [name]: (dataSourceRef.current[name] || []).map((d) => {
                  if (d.id === id) {
                      const otherData = {};
                      if(parentKey) {
                          otherData.isChange = true;
                      }
                      return {
                          ...d,
                          ...otherData,
                          [fieldName]: value,
                      };
                  }
                  return d;
              }),
          };
          dataChange && dataChange(dataSourceRef.current);
      }
    };
    const onNoClick = (e, id, ind) => {
        if (e.ctrlKey || e.metaKey){
            setSelected((pre) => {
                if (pre.includes(id)) {
                    return pre.filter(i => i !== id);
                }
                return pre.concat(id);
            });
        } else if (e.shiftKey) {
            const min = [...selected]
                .sort((a, b) => dataSource[name]
                    .findIndex(d => d.id === a) - dataSource[name]
                    .findIndex(d => d.id === b))[0];
            if (min) {
                const index = dataSource[name].findIndex(d => d.id === min);
                if (ind >= index) {
                    setSelected(dataSource[name].slice(index, ind + 1).map(d => d.id));
                } else {
                    setSelected(dataSource[name].slice(ind, index + 1).map(d => d.id));
                }
            } else {
                setSelected([id]);
            }
        } else {
            setSelected([id]);
        }
    };
    const _setSort = (s, c) => {
      setSort(s);
      setCurrentSort(c);
    };
    const sortEntity = (type) => {
        const tempFields = moveArrayPositionByArray(dataSourceRef.current[name],
            selected, type === 'up' ? -1 : 1, 'id');
        originRef.current = dataSourceRef.current[name];
        dataSourceRef.current = {
            ...dataSourceRef.current,
            [name]: tempFields,
        };
        dataChange && dataChange(dataSourceRef.current);
        setSortKey(Math.uuid());
    };
    useEffect(() => {
        if (initRef.current) {
            originRef.current = dataSourceRef.current[name];
            dataSourceRef.current = {
                ...dataSourceRef.current,
                [name]: sortData(dataSourceRef.current[name] || []),
            };
            dataChange && dataChange(dataSourceRef.current);
            setSortKey(Math.uuid());
        } else {
            initRef.current = true;
        }
    }, [currentSort, sort]);
    return <div className={`${currentPrefix}-quick-edit`}>
      <div className={`${currentPrefix}-quick-edit-tool`}>
        <IconTitle disable={selected.length === 0} title={FormatMessage.string({id: 'tableEdit.moveUp'})} onClick={() => sortEntity('up')} type='fa-arrow-up'/>
        <IconTitle disable={selected.length === 0} title={FormatMessage.string({id: 'tableEdit.moveDown'})} onClick={() => sortEntity('down')} type='fa-arrow-down'/>
      </div>
      <div className={`${currentPrefix}-quick-edit-table`}>
        <div className={`${currentPrefix}-quick-edit-table-header`}>
          <span>{}</span>
          <span>
            <span>
              <span>
                {FormatMessage.string({id: 'tableBase.defKey'})}
              </span>
              <span
                className={`${currentPrefix}-quick-edit-sort`}
                >
                <span
                  className={sort.defKey === 'asc' ? `${currentPrefix}-quick-edit-sort-picker` : ''}
                  onClick={() => _setSort(pre => ({...pre, defKey: pre.defKey === 'asc' ? '' : 'asc'}), 'defKey')}
                  />
                <span
                  className={sort.defKey === 'desc' ? `${currentPrefix}-quick-edit-sort-picker` : ''}
                  onClick={() => _setSort(pre => ({...pre, defKey: pre.defKey === 'desc' ? '' : 'desc'}), 'defKey')}
                  />
              </span>
            </span>
          </span>
          <span>
            <span>
              <span>
                {FormatMessage.string({id: 'tableBase.defName'})}
              </span>
              <span
                className={`${currentPrefix}-quick-edit-sort`}
                >
                <span
                  className={sort.defName === 'asc' ? `${currentPrefix}-quick-edit-sort-picker` : ''}
                  onClick={() => _setSort(pre => ({...pre, defName: pre.defName === 'asc' ? '' : 'asc'}), 'defName')}
                  />
                <span
                  className={sort.defName === 'desc' ? `${currentPrefix}-quick-edit-sort-picker` : ''}
                  onClick={() => _setSort(pre => ({...pre, defName: pre.defName === 'desc' ? '' : 'desc'}), 'defName')}
                  />
              </span>
            </span>
          </span>
          <span>{FormatMessage.string({id: 'tableBase.comment'})}</span>
          <span>{FormatMessage.string({id: 'tableBase.group'})}</span>
        </div>
        <div className={`${currentPrefix}-quick-edit-table-body`}>
          <AutoSizer>
            {({height, width}) => {
                      return <List
                        height={height}
                        itemCount={dataSourceRef.current[name].length}
                        itemSize={29}
                        width={width}
                      >
                        {
                              ({ index, style }) => {
                                  const d = dataSourceRef.current[name][index];
                                  const group = getGroup(d.id);
                                  return <div style={style} className={`${currentPrefix}-quick-edit-item ${selected.includes(d.id) ? `${currentPrefix}-table-selected` : ''}`}>
                                    {/* eslint-disable-next-line max-len */}
                                    <span onClick={e => onNoClick(e, d.id, index)}>{index + 1}</span>
                                    <span>
                                      <Input placeholder={FormatMessage.string({id: 'tableBase.defKey'})} defaultValue={d.defKey} onChange={e => _dataChange(e.target.value, 'defKey', d.id)}/>
                                    </span>
                                    <span>
                                      <Input defaultValue={d.defName} onChange={e => _dataChange(e.target.value, 'defName', d.id)}/>
                                    </span>
                                    <span>
                                      <Input defaultValue={d[name === 'dicts' ? 'intro' : 'comment']} onChange={e => _dataChange(e.target.value, name === 'dicts' ? 'intro' : 'comment', d.id)}/>
                                    </span>
                                    <span>
                                      <SelectGroup
                                        key={group.join(separator)}
                                        hiddenLabel
                                        dataSource={dataSource}
                                        dataChange={(...args) => _dataChange(...args, d.id)}
                                        data={group}
                                        />
                                    </span>
                                  </div>;
                              }
                          }
                      </List>;
                  }}
          </AutoSizer>
        </div>
      </div>
    </div>;
});
