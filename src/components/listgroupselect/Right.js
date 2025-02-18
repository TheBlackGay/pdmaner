import React, {useEffect, useState} from 'react';
import {Select, FormatMessage, Checkbox, IconTitle, openModal, Button, Modal, Icon, Tooltip} from 'components';
import AutoSizer from 'react-virtualized-auto-sizer';
import { VariableSizeGrid as Grid } from 'react-window';

const Option = Select.Option;

const Item = React.memo(({prefix, d, onGroupChange, defaultSelected,
                           allowClear, notAllowEmpty, currentGroup, i, checked,
                           checkBoxChange, group, batchSelection, style, columnIndex}) => {
  const bgClass = `${prefix}-listselect-right-item-bg`;
  if(columnIndex === 0) {
    return <span className={i % 2 === 0 ? bgClass : ''} style={style}>{i + 1}</span>;
  } else if(columnIndex === 1) {
    return <span
      style={style}
      className={`${prefix}-listselect-right-item-2 ${i % 2 === 0 ? bgClass : ''}`}
    >
      {defaultSelected.includes(d.id) &&
        <Icon
          className={`${prefix}-listselect-right-item-disable`}
          title={FormatMessage.string({id: 'components.listSelect.disable'})}
          type='icon-xinxi'
            />}
      {
        batchSelection ? <Checkbox
          className={`${prefix}-listselect-right-item-checkbox`}
          onChange={e => checkBoxChange(e, d.id)}
          checked={checked.includes(d.id)}
            >
          <Tooltip placement='top' title={`${d.defKey}[${d.defName || d.defKey}]`}>
            <span className={`${prefix}-listselect-right-item-name`}>
              {`${d.defKey}[${d.defName || d.defKey}]`}
            </span>
          </Tooltip>
        </Checkbox> :
        <Tooltip placement='top' title={`${d.defKey}[${d.defName || d.defKey}]`}>
          <span className={`${prefix}-listselect-right-item-name`}>
            {`${d.defKey}[${d.defName || d.defKey}]`}
          </span>
        </Tooltip>
      }
    </span>;
  }
  return <span style={style} className={i % 2 === 0 ? bgClass : ''}>
    <Select
      allowClear={allowClear}
      value={group}
      notAllowEmpty={notAllowEmpty}
      onChange={e => onGroupChange(e, d.id)}
      >
      {
          currentGroup.map((g) => {
            return <Option value={g.id} key={g.id}>
              {`${g.defName}${g.defKey ? `(${g.defKey})` : ''}`}
            </Option>;
          })
        }
    </Select>
  </span>;
});

export default React.memo(({prefix, newData, onRemove, allowClear,
                             onGroupChange, notAllowEmpty, currentGroup, defaultSelected}) => {
  const [checked, setChecked] = useState([]);
  const [dataGroup, setDataGroup] = useState([]);
  const [batchSelection, setBatchSelection] = useState(false);
  const _onGroupChange = (e, key) => {
    const keys = [].concat(key);
    setDataGroup((pre) => {
      return pre.map((f) => {
        if (keys.includes(f.id)) {
          return {
            ...f,
            group: e.target.value,
          };
        }
        return f;
      });
    });
    onGroupChange && onGroupChange(e, keys);
  };
  const checkBoxChange = (e, key) => {
    setChecked((pre) => {
      if (!e.target.checked) {
        return pre.filter(p => p !== key);
      }
      return pre.concat(key);
    });
  };
  const onPicker = () => {
    let modal;
    let group = '';
    const currentChange = (e) => {
      group = e.target.value;
    };
    const onOK = () => {
      if (!group) {
        if (!currentGroup.some(g => g.id === '')) {
          Modal.error({
            title: FormatMessage.string({id: 'components.listSelect.groupNotAllowEmpty'}),
            message: FormatMessage.string({id: 'components.listSelect.groupNotAllowEmpty'}),
          });
        } else {
          _onGroupChange({
            target: {
              value: group,
            },
          }, checked);
          modal && modal.close();
        }
      } else {
        _onGroupChange({
          target: {
            value: group,
          },
        }, checked);
        modal && modal.close();
      }
    };
    const onCancel = () => {
      modal && modal.close();
    };
    modal = openModal(<div className={`${prefix}-listselect-pick-group`}>
      <Select
        defaultValue=''
        allowClear={allowClear}
        notAllowEmpty={notAllowEmpty}
        onChange={e => currentChange(e, checked)}
      >
        {
          currentGroup.map((g) => {
            return <Option value={g.id} key={g.id}>
              {`${g.defName}${g.defKey ? `(${g.defKey})` : ''}`}
            </Option>;
          })
        }
      </Select>
    </div>, {
      title: FormatMessage.string({id: 'components.listSelect.group'}),
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
  useEffect(() => {
    setChecked(pre => pre.filter(p => newData.findIndex(d => d.id === p) > -1));
  }, [newData]);
  useEffect(() => {
    setDataGroup((pre) => {
      return newData.map((f) => {
        const currentIndex = pre.findIndex(p => p.id === f.id);
        if (currentIndex > 0) {
          return {
            ...f,
            group: pre[currentIndex].group,
          };
        }
        return f;
      });
    });
  }, [newData]);
  const _iconClick = (t) => {
    if (t === 'all') {
      setChecked([]);
    } else {
      setChecked(() => {
        return [...newData.map(d => d.id)];
      });
    }
  };
  const calcType = () => {
    if (checked.length === newData.length) {
      return 'all';
    } else if (checked.length === 0) {
      return 'normal';
    }
    return 'ind';
  };
  const finalType = calcType();
  const columnWidth = [50, 250, 200];
  const finalData = newData.filter(d => !!d.defKey);
  return <div className={`${prefix}-listselect-right`}>
    <div className={`${prefix}-listselect-right-opt`}>
      <span className={`${prefix}-listselect-right-opt-batch`}>
        <Checkbox
          onChange={e => setBatchSelection(e.target.checked)}
        >
          <span>
            {FormatMessage.string({id: 'components.listSelect.batchSelection'})}
          </span>
        </Checkbox>
      </span>
      {
        newData.length > 0 && batchSelection && <span className={`${prefix}-listselect-right-opt-selected`} onClick={() => _iconClick(finalType)}>
          <span className={`${prefix}-listselect-opt-${finalType}`}>
            {}
          </span>
          <span>
            {FormatMessage.string({id: 'components.listSelect.all'})}
          </span>
        </span>
      }
      {
        batchSelection && <IconTitle
          disable={checked.filter(c => !defaultSelected.includes(c)).length === 0}
          title={FormatMessage.string({id: 'components.listSelect.remove'})}
          type='fa-minus'
          onClick={() => onRemove(checked.filter(c => !defaultSelected.includes(c)))}
          />
      }
      {
        batchSelection && <IconTitle
          disable={checked.length === 0}
          title={FormatMessage.string({id: 'components.listSelect.group'})}
          type='fa-object-group'
          onClick={onPicker}
          />
      }
    </div>
    <div className={`${prefix}-listselect-right-container`}>
      {
          newData.length === 0 ? <div className={`${prefix}-listselect-right-empty`}>
            <span>
              {FormatMessage.string({id: 'components.listSelect.empty'})}
            </span>
          </div>
              : <>
                <div style={{height: '100%'}}>
                  <AutoSizer>
                    {({height, width }) => {
                      return <>
                        <div style={{width}} className={`${prefix}-listselect-right-header`}>
                          <span style={{width: columnWidth[0]}}>{}</span>
                          <span style={{width: width - (columnWidth[0] + columnWidth[2] + 15)}}>{FormatMessage.string({id: 'components.listSelect.tableName'})}</span>
                          <span style={{width: columnWidth[2]}}>{FormatMessage.string({id: 'components.listSelect.useGroup'})}</span>
                        </div>
                        <Grid
                          className={`${prefix}-listselect-right-grid`}
                          columnCount={columnWidth.length}
                          height={height - 24}
                          rowCount={finalData.length}
                          rowHeight={() => 32}
                          width={width}
                          columnWidth={(index) => {
                              if(index === 1) {
                                return width - (columnWidth[0] + columnWidth[2] + 15);
                              }
                              return columnWidth[index];
                            }}
                        >
                          {({ rowIndex, style , columnIndex }) => {
                            const data = finalData[rowIndex];
                            const group = dataGroup.filter(dg => dg.id === data.id)[0]?.group || '';
                            return <Item
                              style={style}
                              batchSelection={batchSelection}
                              checkBoxChange={checkBoxChange}
                              checked={checked}
                              defaultSelected={defaultSelected}
                              i={rowIndex}
                              allowClear={allowClear}
                              notAllowEmpty={notAllowEmpty}
                              onGroupChange={_onGroupChange}
                              prefix={prefix}
                              columnIndex={columnIndex}
                              d={data}
                              currentGroup={currentGroup}
                              onRemove={onRemove}
                              group={group}
                            />;
                          }}
                        </Grid>
                      </>;
                    }}
                  </AutoSizer>
                </div>
              </>
        }
    </div>
  </div>;
});
