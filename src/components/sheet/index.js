import React, {useEffect, useMemo, forwardRef, useImperativeHandle, useContext} from 'react';
import * as _ from 'lodash';

import DropButton from '../dropbutton';
import FormatMessage from '../formatmessage';
import IconTitle from '../icontitle';
import './style/index.less';
import {getPrefix} from '../../lib/prefixUtil';
import { getColumnWidth, def2Id, id2Def} from '../../lib/datasource_util';
import {ConfigContent} from '../../lib/context';
import {id2DefSplit} from '../../lib/utils';


export default React.memo(forwardRef(({emptyRow,
                                          prefix,data : { headers = [], fields = [] }, dataSource},
                                      ref) => {
    const { lang } = useContext(ConfigContent);
    const dropDownSeparator = '%';
    const columnBase = ['domain', 'uiHint'];
    const allColumnWidth = getColumnWidth();
    const columnWidth = useMemo(() => {
        return headers.reduce((p, n, i) => {
            const base = columnBase.includes(n.refKey) ? 2 : 1;
            return {
                ...p,
                [i]: allColumnWidth[n.refKey] ? allColumnWidth[n.refKey] * base : 200,
            };
        }, {});
    }, [headers]);
    const rows2Cells = (rows = []) => {
        return rows.reduce((p, n, i) => {
            return p.concat(headers.map((k, j) => {
                return {
                    r: i,
                    c: j,
                    v: {
                        v: n[headers[j].refKey],
                        customKey: { id: n.id || Math.uuid() },
                    },
                    refKey: headers[j].refKey,
                };
            }));
        }, []);
    };
    const cellData = useMemo(() => {
        return rows2Cells(def2Id((fields || []), dataSource));
    }, [headers, fields]);
    const currentPrefix = getPrefix(prefix);
    const container = useMemo(() => `com-${Math.uuid()}`, []);
    const db = _.get(dataSource, 'profile.default.db', _.get(dataSource, 'profile.dataTypeSupports[0].id'));
    const getEmptyCells = (length) => {
        const rows = [];
        for (let i = 0; i < length; i += 1){
            rows.push({...emptyRow});
        }
        return rows2Cells(rows);
    };
    const getDataVerification = (data) => {
        const mapOption = (options) => {
            return options.map(d => `${d.defKey}[${d.defName}]`).join(dropDownSeparator);
        };
        const uiHint = mapOption(dataSource?.profile?.uiHint || []);
        const dicts = mapOption(dataSource?.dicts || []);
        const simpleMapping = mapOption((dataSource?.dataTypeMapping?.mappings || []));
        const mappings = mapOption((dataSource?.dataTypeMapping?.mappings || []).map((m) => {
            return {
                defKey: m[db],
                defName: m.defName,
            };
        }));
        const domains = mapOption(dataSource?.domains || []);
        const yesOrNo = { type: 'checkbox', value1: true, value2: false };
        const verificationMap = {
            domain: {
                type: 'dropdown',
                value1: domains,
            },
            refDict: {
                type: 'dropdown',
                value1: dicts,
            },
            uiHint: {
                type: 'dropdown',
                value1: uiHint,
            },
            baseType: {
                type: 'dropdown',
                value1: simpleMapping,
            },
            type: {
                type: 'dropdown',
                value1: mappings,
            },
            enabled: yesOrNo,
            notNull: yesOrNo,
            primaryKey: yesOrNo,
            autoIncrement: yesOrNo,
            scale: {
                type: 'number_integer',
                type2: 'gt',
                value1: '0',
            },
            len: {
                type: 'number_integer',
                type2: 'gt',
                value1: '0',
            },
        };
        return data.reduce((p, n) => {
            const v = verificationMap[n.refKey];
            const tempV = {};
            if(v && v.type === 'checkbox') {
                tempV.checked = n.v?.v || false;
            }
            return {
                ...p,
                [`${n.r}_${n.c}`]: {
                    ...v,
                    ...tempV,
                },
            };
        }, {});
    };
    const validateCellData = (name, value) => {
        // boolean number
        const booleanNames = ['enabled', 'notNull', 'primaryKey', 'autoIncrement'];
        const numberNames = ['scale', 'len'];
        if(booleanNames.includes(name)) {
            if(typeof value !== 'boolean') {
                return value?.toString()?.toLocaleUpperCase() !== 'FALSE';
            }
            return value;
        } else if(numberNames.includes(name)) {
            if(typeof value !== 'number') {
                const numberValue = parseInt(value, 10);
                // eslint-disable-next-line no-restricted-globals
                if(isNaN(numberValue)) {
                    return '';
                }
                return numberValue;
            }
            return value;
        }
        return value;
    };
    const getDefaultValue = (cell, refKey) => {
        if(cell && cell.v !== undefined) {
            return cell.v;
        }
        if(emptyRow[refKey] === undefined) {
            return '';
        }
        return emptyRow[refKey];
    };
    useImperativeHandle(ref, () => {
        return {
            getSheetData: () => {
                return id2Def(luckysheet.getSheetData().map((r) => {
                    return headers.reduce((p, n, i) => {
                        return {
                            ...p,
                            id: p.id || r[i]?.customKey?.id || Math.uuid(),
                            [n.refKey]: validateCellData(n.refKey, getDefaultValue(r[i], n.refKey)),
                        };
                    }, {});
                }), dataSource).filter(r => r.defName || r.defKey);
            },
            destroy: () => {
                luckysheet.destroy();
            },
        };
    }, []);
    useEffect(() => {
        const currentCellData = cellData.length === 0 ? getEmptyCells(10) : cellData;
        const options = {
            container,
            lang,
            dropDownSeparator,
            showtoolbar: false,
            showinfobar: false,
            showsheetbar: false,
            sheetFormulaBar: false,
            showstatisticBarConfig: {
                count: false, // 计数栏
                view: false, // 打印视图
                zoom: true, // 缩放
            },
            column: headers.length,
            row: (fields || []).length === 0 ? 10 : fields.length,
            lockColumns: true,
            enableAddBackTop: false,
            enableAddRow: false,
            rowTemplate: headers.map((h) => {
                const v = emptyRow[h.refKey];
                return {
                    v,
                    m: typeof v === 'boolean' ? v.toString().toLocaleUpperCase() : v,
                };
            }),
            hook:{
                cellUpdated: (...args) => {
                    const updateName = ['type', 'len', 'scale'];
                    if(updateName.includes(headers[args[1]]?.refKey)) {
                        const columnIndex = headers.findIndex(h => h.refKey === 'domain');
                        luckysheet.setCellValue(args[0], columnIndex, '', { ignoreHook: true });
                    } else if(headers[args[1]]?.refKey === 'domain') {
                        const defKey = args[3]?.v?.split(id2DefSplit)[0];
                        const domainData = (dataSource?.domains || [])
                            .find(d => d.defKey === defKey);
                        const typeIndex = headers.findIndex(h => h.refKey === 'type');
                        const scaleIndex = headers.findIndex(h => h.refKey === 'scale');
                        const lenIndex = headers.findIndex(h => h.refKey === 'len');
                        if(domainData) {
                            luckysheet.setCellValue(args[0], scaleIndex, domainData.scale || '', { ignoreHook: true });
                            luckysheet.setCellValue(args[0], lenIndex, domainData.len || '', { ignoreHook: true });
                            const mapping = (dataSource?.dataTypeMapping?.mappings || [])
                                .find(m => m.id === domainData.applyFor);
                            luckysheet.setCellValue(args[0], typeIndex, mapping[db] ? `${mapping[db]}[${mapping.defName}]` : '', { ignoreHook: true });
                        }
                    }
                },
                pasteHandlerOfCutOrCopyPaste: (copyData) => {
                    return copyData.map((r) => {
                        return r.map((c) => {
                            if(c?.customKey) {
                                return {
                                    ...c,
                                    customKey: {},
                                };
                            }
                            return c;
                        });
                    });
                },
                columnTitleCellRender:  (columnAbc) => {
                    return headers[columnAbc].value;
                },
                addDataBefore:  (...args) => {
                    if(args[0] === 'row') {
                        let index = args[1];
                        let rows = args[2];
                        const dataVerification = args[8];
                        const getCells = () => {
                          return headers.map((k, j) => {
                              return {
                                  r: index,
                                  c: j,
                                  refKey: k.refKey,
                              };
                          });
                        };
                        const currentCells = [];
                        while (rows > 0) {
                            index += 1;
                            rows -= 1;
                            currentCells.push(...getCells());
                        }
                        const tempVerification = getDataVerification(currentCells);
                        Object.keys(tempVerification).forEach((v) => {
                            dataVerification[v] = tempVerification[v];
                        });
                    }
                },
            },
            data: [{
                name: 'Cell',
                config: {
                    columnlen: columnWidth,
                },
                celldata: currentCellData,
                dataVerification: getDataVerification(currentCellData),
            }],
            cellRightClickConfig: {
                copy: true, // 复制
                copyAs: false, // 复制为
                paste: true, // 粘贴
                insertRow: true, // 插入行
                insertColumn: false, // 插入列
                deleteRow: true, // 删除选中行
                deleteColumn: false, // 删除选中列
                deleteCell: false, // 删除单元格
                hideRow: false, // 隐藏选中行和显示选中行
                hideColumn: false, // 隐藏选中列和显示选中列
                rowHeight: true, // 行高
                columnWidth: true, // 列宽
                clear: true, // 清除内容
                matrix: false, // 矩阵操作选区
                sort: false, // 排序选区
                filter: false, // 筛选选区
                chart: false, // 图表生成
                image: false, // 插入图片
                link: false, // 插入链接
                data: false, // 数据验证
                cellFormat: false, // 设置单元格格式
                customs: [{
                    title: '冻结首行',
                    onClick:  () => {
                        luckysheet.setHorizontalFrozen(false);
                    },
                    },{
                    title: '冻结行至选区',
                    onClick:  (clickEvent, event, params) => {
                        luckysheet.setHorizontalFrozen(true, {
                            range: {row_focus:params.rowIndex, column_focus:params.columnIndex},
                        });
                    },
                },{
                    title: '冻结首列',
                    onClick:  () => {
                        luckysheet.setVerticalFrozen(false);
                    },
                },{
                    title: '冻结列至选区',
                    onClick:  (clickEvent, event, params) => {
                        luckysheet.setVerticalFrozen(true, {
                            range: {row_focus:params.rowIndex, column_focus:params.columnIndex},
                        });
                    },
                },
                    {
                        title: '冻结首行首列',
                        onClick:  () => {
                            luckysheet.setBothFrozen(false);
                        },
                    },
                    {
                        title: '冻结行列至选区',
                        onClick:  (clickEvent, event, params) => {
                            luckysheet.setBothFrozen(true, {
                                range: {row_focus:params.rowIndex, column_focus:params.columnIndex},
                            });
                        },
                    },
                    {
                        title: '取消冻结',
                        onClick:  () => {
                            luckysheet.cancelFrozen();
                        },
                    }],
            },
        };
        luckysheet.create(options);
    }, []);
    const backTop = () => {
        luckysheet.scroll({ targetRow: 0 });
    };
    const menuClick = (m) => {
        luckysheet.insertRow(luckysheet.flowdata().length - 1,
            {number: m.key, direction: 'rightbottom'});
    };
    const dropDownMenus = useMemo(() => ([
        {key: 5, name: FormatMessage.string({id: 'components.sheet.addRow', data: {count: 5}})},
        {key: 10, name: FormatMessage.string({id: 'components.sheet.addRow', data: {count: 10}})},
        {key: 15, name: FormatMessage.string({id: 'components.sheet.addRow', data: {count: 15}})},
    ]),[]);
    return <div className={`${currentPrefix}-sheet`}>
      <div className={`${currentPrefix}-sheet-opt`}>
        <span>
          <DropButton menuClick={menuClick} dropDownMenus={dropDownMenus} position='bottom'>
            <IconTitle title={FormatMessage.string({id: 'components.sheet.add'})} type='fa-plus' onClick={() => menuClick({key: 1})}/>
          </DropButton>
        </span>
        <span onClick={backTop}><FormatMessage id='components.sheet.backTop'/></span>
      </div>
      <div className={`${currentPrefix}-sheet-content`} id={`${container}`} />
    </div>;
}));
