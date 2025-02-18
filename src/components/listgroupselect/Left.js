import React, {useState, useEffect, useRef} from 'react';
import {Checkbox, FormatMessage, SearchInput} from 'components';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList as List } from 'react-window';
import {postWorkerFuc} from '../../lib/event_tool';

const Item = React.memo(({prefix, repeatData,
                           checkBoxChange, checked, d, i,
                           defaultSelected, style, repeatTitle}) => {
  const bgClass = `${prefix}-listselect-left-item-bg`;
  return <div
    className={`${prefix}-listselect-left-item ${i % 2 === 0 ? bgClass : ''} ${prefix}-listselect-left-item-${repeatData.includes(d.defKey) ? 'repeat' : 'normal'}`}
    key={d.id}
    style={style}
  >
    <span>{i + 1}</span>
    <span>
      <Checkbox
        className={`${prefix}-listselect-right-item-checkbox`}
        disable={(defaultSelected || []).includes(d.id)}
        onChange={e => checkBoxChange(e, d.id)}
        checked={checked.includes(d.id)}
    >
        {`${d.defKey}[${d.defName || d.defKey}]`}{repeatData.includes(d.defKey) ? <div>[{repeatTitle || FormatMessage.string({id: 'components.listSelect.repeatMessage'})}]</div> : ''}
      </Checkbox></span>
  </div>;
});

export default React.memo(({prefix, newData, checkBoxChange, repeatTitle,
                             repeatData, checked, defaultSelected, onSearch, header}) => {
  const [filterData, setFilterData] = useState([]);
  const newDataRef = useRef([]);
  newDataRef.current = newData;
  useEffect(() => {
    setFilterData(newData);
  }, [newData]);
  const _onChange = (e) => {
    return new Promise((resolve, reject) => {
      const value = e.target.value || '';
      postWorkerFuc((params) => {
        const reg = new RegExp((params.value).replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
        return params.data.filter(d => (!!d.defKey)
            && (reg.test(d.defKey || '') || reg.test(d.defName || '')));
      }, false, {
        value,
        data: newDataRef.current,
      }).then((data) => {
        resolve();
        setFilterData(() => {
          return data;
        });
      }).catch(() => {
        reject();
      });
    });
  };
  useEffect(() => {
    onSearch(filterData);
  }, [filterData]);
  return <div className={`${prefix}-listselect-left`}>
    <div className={`${prefix}-listselect-left-search`}>
      <SearchInput
        placeholder={FormatMessage.string({id: 'components.listSelect.search'})}
        onChange={_onChange}
      />
    </div>
    <div className={`${prefix}-listselect-left-header`}>
      {header}
      <span><FormatMessage id='components.listSelect.all'/></span>
    </div>
    <div className={`${prefix}-listselect-left-container`}>
      <AutoSizer>
        {({height, width}) => {
          return <List
            height={height}
            itemCount={filterData.length}
            itemSize={32}
            width={width}
          >
            {
              ({ index, style }) => {
                const data = filterData[index];
                return <Item
                  repeatTitle={repeatTitle}
                  style={style}
                  defaultSelected={defaultSelected}
                  i={index}
                  prefix={prefix}
                  key={`${data.id}${index}`}
                  d={data}
                  checkBoxChange={checkBoxChange}
                  repeatData={repeatData}
                  checked={checked}
                />;
              }
            }
          </List>;
        }}
      </AutoSizer>
    </div>
  </div>;
});
