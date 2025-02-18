import React, {useState, useRef} from 'react';
import {FormatMessage, IconTitle, Icon, Checkbox, Input, Select,
    Button, openModal, CodeEditor, Modal, Tooltip} from 'components';
import { moveArrayPosition } from '../../../lib/array_util';
import {getPrefix} from '../../../lib/prefixUtil';
import {getFullColumns, attNames, getAttNamesValue, attEditType} from '../../../lib/datasource_util';
import { get } from '../../../lib/update'
import {CodeHighlight} from "../../../components";

export default React.memo(({prefix, dataSource, columnsChange, extAttrPropsUpdate, className}) => {
    const Option = Select.Option;
    const [extAttrProps, setExtAttrProps] = useState({
        ...(dataSource?.profile?.extAttrProps || {}),
    });
    const editRef = useRef(null);
    const useEnable = ['isStandard', 'uiHint', 'extProps'];
    const [data, updateData] = useState(() => {
        const full = getFullColumns();
        const currentData = (dataSource?.profile?.headers || []).map(h => {
            if (attNames.includes(h.refKey)) {
                return h;
            }
            return {
                ...h,
                value: full.filter(f => f.newCode === h.refKey)[0]?.value || h.refKey
            }
        })
        return currentData.concat(attNames
            .filter(a => currentData.findIndex(c => c.refKey === a) < 0)
            .map(a => ({
                refKey: a,
                value: getAttNamesValue(a),
                hideInGraph: true,
                enable: false
            })))
    });
    const [selected, updateSelected] = useState('');
    const extAttrPropsRef = useRef(extAttrProps);
    extAttrPropsRef.current = extAttrProps;
    const dataRef = useRef(data);
    dataRef.current = data;
    const selectedRef = useRef(selected);
    selectedRef.current = selected;
    const rowSelected = (p) => {
        if (selected === p) {
            updateSelected('');
        } else {
            updateSelected(p);
        }
    };
    const propsChange = (newData) => {
        columnsChange && columnsChange(newData);
    };
    const optProperty = (type) => {
        const optIndex = data.findIndex(d => d.refKey === selected);
        if (type === 'up' || type === 'down') {
            const tempData = moveArrayPosition(data, optIndex, type === 'up' ? optIndex - 1 : optIndex + 1);
            updateData(tempData);
            propsChange(tempData);
        }
    };
    const onValueChange = (e, p) => {
        const value = e.target.value;
        updateData((pre) => {
            const temp = pre.map(d => {
                if (d.refKey === p.refKey) {
                    return {
                        ...d,
                        value,
                    }
                }
                return d;
            })
            propsChange(temp);
            return temp;
        });
    }
    const currentPrefix = getPrefix(prefix);
    const onClick = (p) => {
        updateData((pre) => {
            const temp = pre.map(d => {
                if (d.refKey === p.refKey) {
                    return {
                        ...d,
                        hideInGraph: !d.hideInGraph,
                    }
                }
                return d;
            })
            propsChange(temp);
            return temp;
        });
    }
    const onEnableChange = (e, p) => {
        const value = e.target.checked;
        updateData((pre) => {
            const temp = pre.map(d => {
                if (d.refKey === p.refKey) {
                    return {
                        ...d,
                        enable: value,
                    }
                }
                return d;
            })
            propsChange(temp);
            return temp;
        });
    }
    const extAttrPropsChange = (value, key, name) => {
        setExtAttrProps((pre) => {
            const tempProps = {
                ...pre,
                [key]: {
                    ...pre[key],
                    [name]: value
                }
            };
            extAttrPropsUpdate && extAttrPropsUpdate(tempProps);
            return tempProps;
        })
    }
    const openOptionsData = (key, name) => {
        let tempValue = extAttrPropsRef.current[key][name];
        let optionsFetcher = extAttrPropsRef.current[key].optionsFetcher;
        const onOk = (modal) => {
            setExtAttrProps((pre) => {
                const tempProps = {
                    ...pre,
                    [key]: {
                        ...pre[key],
                        optionsData: tempValue,
                        optionsFetcher: optionsFetcher
                    }
                };
                extAttrPropsUpdate && extAttrPropsUpdate(tempProps);
                return tempProps;
            })
            modal && modal.close();
        };
        const onCancel = (modal) => {
            modal && modal.close();
        };
        const optionsDataChange = (e) => {
            tempValue = e.target.value;
        };
        const fetchData = () => {
            const onFetch = (m, btn) => {
                if(!optionsFetcher) {
                    Modal.error({
                        title: FormatMessage.string({id: 'config.attr.fetchError'}),
                        message: FormatMessage.string({id: 'config.attr.fetchUrlEmpty'})
                    });
                } else {
                    btn.updateStatus('loading')
                    get(optionsFetcher).then((res) => {
                        if(!Array.isArray(res)) {
                            tempValue = "[]"
                        } else {
                            tempValue = JSON.stringify(res.map(f => {
                                if(f.value) {
                                    return {
                                        value: f.value,
                                        label: f.label || f.value
                                    }
                                }
                                return null;
                            }).filter(f => !!f));
                        }
                        editRef.current.setValue(tempValue);
                        m && m.close();
                    }).catch((err) => {
                        Modal.error({
                            title: FormatMessage.string({id: 'config.attr.fetchError'}),
                            message: err.message
                        });
                    }).finally(() => {
                        btn.updateStatus('normal')
                    })
                }
            };
            const onCancelFetch = (m) => {
                m && m.close();
            };
            const optionsFetcherChange = (e) => {
                optionsFetcher = e.target.value;
            };
            const fetchModel = openModal(<Input
                placeholder='http://www.pdmaner.com/demo.json'
                style={{width: '100%', marginBottom: 5}}
                onChange={optionsFetcherChange}
                defaultValue={optionsFetcher}
            />, {
                bodyStyle: {
                    width: '70%'
                },
                title: FormatMessage.string({id: 'config.attr.fetch'}),
                buttons: [
                    <Button type='primary' key='ok' onClick={(e, btn) => onFetch(fetchModel, btn)}>{FormatMessage.string({id: 'config.attr.fetchData'})}</Button>,
                    <Button key='cancel' onClick={() => onCancelFetch(fetchModel)}>{FormatMessage.string({id: 'button.cancel'})}</Button>],
            });
        }
        let formatJson = '';
        try {
            formatJson = JSON.stringify(JSON.parse(tempValue), null, 2);
        } catch (e) {
            formatJson = ''
        }
        const demoOptionData = [
            {
                "label": FormatMessage.string({id: 'config.attr.demoOptionData.men'}),
                "value": "1"
            },
            {
                "label": FormatMessage.string({id: 'config.attr.demoOptionData.women'}),
                "value": "2"
            }
        ]
        const modal = openModal(<CodeEditor
            ref={editRef}
            onChange={optionsDataChange}
            value={formatJson}
            mode='json'
            height='50vh'
            width='100%'
            style={{marginBottom: 5}}
        />, {
            footerStyle: {
                position: 'relative'
            },
            bodyStyle: {
              width: '60%'
            },
            title:
              <span className={`${currentPrefix}-setting-entity-init-columns-option-help`}>
                <span>{FormatMessage.string({id: 'config.attr.editOptionData'})}</span>
                  <Tooltip placement='bottom' title={
                      <CodeHighlight data={JSON.stringify(demoOptionData, null, 2)} mode='json' style={{width: 300, height: 300}}>
                      </CodeHighlight>} force>
                          <span>
                            (<span>
                                <a><FormatMessage id='config.attr.demoOption'/></a>
                                <Icon type='icon-xinxi'/>
                            </span>)
                          </span>
                      </Tooltip>
              </span>
            ,
            buttons: [
                <a className={`${currentPrefix}-setting-entity-init-columns-option-fetch`} key='fetch' onClick={fetchData}>{FormatMessage.string({id: 'config.attr.fetch'})}</a>,
                <Button type='primary' key='ok' onClick={() => onOk(modal)}>{FormatMessage.string({id: 'button.ok'})}</Button>,
                <Button key='cancel' onClick={() => onCancel(modal)}>{FormatMessage.string({id: 'button.cancel'})}</Button>],
        });
    }
    return <div className={`${currentPrefix}-entity-base-properties ${className}`}>
        <div className={`${currentPrefix}-entity-base-properties-list-opt`}>
           <IconTitle disable={!selected} title={FormatMessage.string({id: 'tableEdit.moveUp'})} onClick={() => optProperty('up')} type='fa-arrow-up'/>
            <IconTitle disable={!selected} title={FormatMessage.string({id: 'tableEdit.moveDown'})} onClick={() => optProperty('down')} type='fa-arrow-down'/>
        </div>
        <div className={`${currentPrefix}-entity-base-properties-list-container`}>
            <table>
                <thead>
                <tr>
                    <th/>
                    <th style={{zIndex: 2, textAlign: 'center'}}><FormatMessage id='config.enable'/></th>
                    <th style={{textAlign: 'center'}}><FormatMessage id='config.columnKey'/></th>
                    <th><FormatMessage id='config.columnName'/></th>
                    <th><FormatMessage id='config.hideInGraph'/></th>
                    <th style={{textAlign: 'center'}}>{FormatMessage.string({id: 'config.attr.editType'})}</th>
                    <th style={{textAlign: 'center'}}>{FormatMessage.string({id: 'config.attr.optionData'})}</th>
                </tr>
                </thead>
                <tbody>
                {data.map((p, index) => {
                    return (
                        <tr key={p.refKey}
                            onClick={() => rowSelected(p.refKey)}
                            className={`${selected === p.refKey ? `${currentPrefix}-entity-base-properties-list-selected` : ''}`}
                        >
                            <td style={{width: '30px'}}>{index + 1}</td>
                            <td style={{width: 80}} className={`${currentPrefix}-setting-entity-init-fields-check`}>
                                <Checkbox
                                    disable={!attNames.concat(useEnable).includes(p.refKey)}
                                    style={{width: '100%'}}
                                    defaultChecked={p.enable !== false}
                                    onChange={e => onEnableChange(e, p)}
                                >
                                </Checkbox>
                            </td>
                            <td style={{width: 180}} className={`${currentPrefix}-setting-entity-init-fields-column`}>{p.refKey}</td>
                            <td style={{width: 180}}>{attNames.includes(p.refKey) ?
                                <Input onChange={e => onValueChange(e, p)} defaultValue={p.value}/> : p.value}</td>
                            <td style={{width: 100}}><Icon onClick={() => onClick(p)} style={{cursor: 'pointer'}}
                                      type={`fa-eye${p.hideInGraph ? '-slash' : ''}`}/>{p.hideInGraph}</td>
                            <td style={{width: 180}}>{attNames.includes(p.refKey) ?
                                <Select
                                    className={`${currentPrefix}-setting-entity-init-fields-column-select`}
                                    onChange={e => extAttrPropsChange(e.target.value, p.refKey, 'editType')} value={extAttrProps[p.refKey]?.editType}>
                                    {
                                        attEditType.map(c =>
                                            <Option key={c} value={c}>{FormatMessage.string({id: `config.attr.attEditType.${c}`})}</Option>)
                                    }
                                </Select> : ''}</td>
                            <td>{(attNames.includes(p.refKey) && (extAttrProps[p.refKey]?.editType === 'DropDown' ||
                                extAttrProps[p.refKey]?.editType === 'DropDownMulti')) ?
                                <Input
                                    onChange={e => extAttrPropsChange(e.target.value, p.refKey, 'optionsData')}
                                    value={extAttrProps[p.refKey]?.optionsData}
                                    suffix={<span
                                        style={{padding: '0 5px', display: 'inline-block', height: '100%'}}
                                        onClick={() => openOptionsData(p.refKey, 'optionsData')}
                                    >
                                        <Icon type='fa-ellipsis-h'/>
                                </span>}
                                /> : ''}</td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    </div>;
});
