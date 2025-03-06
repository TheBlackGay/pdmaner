import React, { useState, useRef } from 'react';
import {
    Button,
    FormatMessage,
    openModal,
    Tree,
    Tooltip,
    Icon,
    Download,
    Upload,
    Modal, Message, Loading,
} from 'components';
import moment from 'moment';
import CompareList from 'components/compare/CompareList';
import {calcUnGroupDefKey, mergeDataSource} from '../../../../lib/datasource_util';

import './style/index.less';
import { separator } from '../../../../../profile';
import {getPrefix} from '../../../../lib/prefixUtil';
import {postWorkerFuc} from '../../../../lib/event_tool';

export default React.memo(({dataSource, prefix,
                               openLoading, closeLoading, updateProject}) => {
    const [loading, setLoading] = useState(false);
    const [currentDataSource, setCurrentDataSource] = useState({...dataSource});
    const compareListRef = useRef(null);
    const currentPrefix = getPrefix(prefix);
    const packageChanges = (leftEntities, rightEntities, treeData, isMerge = false) => {
        setLoading(true);
        postWorkerFuc('dataSourceVersion.simplePackageChanges', true, [
            {
                ...dataSource,
                entities: leftEntities,
            },
            {
                ...dataSource,
                entities: rightEntities,
            },
            null, true])
            .then((newChanges) => {
                const getChildren = (p, sourceEntity, metaEntityData) => {
                  return [{
                      id: `${p.id}_headerField1`,
                  }, {
                      id: `${p.id}_headerField2`,
                  }]
                      .concat((sourceEntity?.fields || [])
                          .concat(
                              (metaEntityData?.fields || []).filter(f =>
                                  (sourceEntity?.fields || [] || [])
                                      .findIndex(aF => aF.defKey?.toLocaleLowerCase()
                                          === f.defKey?.toLocaleLowerCase()) < 0))
                          .map(f => ({
                              id: `${p.id}_${f.defKey}`,
                              key: f.defKey?.toLocaleLowerCase(),
                          })));
                };
                const removeChanges = [];
                compareListRef.current.setTreeData((pre) => {
                    return pre.map((p) => {
                        if(treeData.includes(p.id)) {
                            const sourceEntity = {
                                ...p.sourceEntity,
                                fields: leftEntities
                                    .find(e => e.originDefKey
                                        === p.sourceEntity.defKey)?.fields || [],
                            };
                            const metaEntityData = {
                                ...p.metaEntityData,
                                fields: rightEntities
                                .find(e => e.originDefKey
                                    === p.metaEntityData.defKey)?.fields || [],
                            };
                            return {
                                ...p,
                                sourceEntity,
                                metaEntityData,
                                metaFieldsData: metaEntityData,
                                children: getChildren(p, sourceEntity, metaEntityData),
                            };
                        } else if(isMerge) {
                            const dataProps = {};
                            if(p.sourceEntity?.defKey) {
                                // 更新树下面所有的源数据表
                                const newSourceEntity = leftEntities
                                    .find(e => e.originDefKey
                                        === p.sourceEntity.defKey);
                                if(newSourceEntity) {
                                    dataProps.sourceEntity = {
                                        ...p.sourceEntity,
                                        fields: newSourceEntity.fields,
                                    };
                                }
                            }
                            if(p.metaEntityData) {
                                const metaEntityData = leftEntities
                                    .find(e => e.originDefKey
                                        === p.metaEntityData.defKey);
                                if(metaEntityData) {
                                    // 更新树下面所有的比较数据表
                                    dataProps.metaEntityData = {
                                        ...p.metaEntityData,
                                        fields: metaEntityData.fields,
                                    };
                                }
                            }
                            if(dataProps.metaEntityData || dataProps.sourceEntity) {
                                removeChanges.push(p.id);
                                // 重置比较详细数据表
                                dataProps.children = [];
                                return {
                                    ..._.omit(p, 'metaFieldsData'),
                                    ...dataProps,
                                };
                            }
                            return p;
                        }
                        return p;
                    });
                });
                // 合并变更信息
                compareListRef.current.setChanges((pre) => {
                    return pre.filter((p) => {
                        return !removeChanges.concat(treeData)
                            .includes(p.data.baseInfo?.defKey?.toLocaleLowerCase());
                    }).concat(newChanges);
                });
            }).finally(() => {
            setLoading(false);
        });
    };
    const scanTable = (node) => {
        const treeData = [].concat(node);
        const allTreeData = compareListRef.current.getTreeData();
        const selectedTreeData = allTreeData.filter(t => treeData.includes(t.key));

        const leftEntities = [];
        const rightEntities = [];
        // 构造数据 只比较字段
        selectedTreeData.forEach((d) => {
            leftEntities.push({
                ...d.sourceEntity,
                defKey: d.key,
                originDefKey: d.sourceEntity.defKey,
            });
            rightEntities.push({
                ...d.sourceEntity,
                fields: d.metaEntityData.fields || [],
                defKey: d.key,
                originDefKey: d.metaEntityData.defKey,
            });
        });
        packageChanges(leftEntities, rightEntities, treeData);
    };
    const mergeFromMeta = (meteKey, sourceKey, dataKey) => {
        const entities = currentDataSource.entities || [];
        const metaData = entities
            .find(e => e.defKey?.toLocaleLowerCase() === meteKey.toLocaleLowerCase());
        const sourceData = entities
            .find(e => e.defKey?.toLocaleLowerCase() === sourceKey.toLocaleLowerCase());
        const mergeData = mergeDataSource(currentDataSource,
            {}, [{
            ...sourceData,
            fields: (metaData.fields || []),
        }], true);
        const newSource = (mergeData.entities || [])
            .find(e => e.defKey?.toLocaleLowerCase() === sourceKey.toLocaleLowerCase());
        packageChanges([{
            ...newSource,
            defKey: dataKey,
            originDefKey: newSource.defKey,
        }], [{
            ...newSource,
            defKey: dataKey,
            fields: metaData.fields || [],
            originDefKey: metaData.defKey,
        }], [dataKey], true);
        setCurrentDataSource(mergeData);
        updateProject(mergeData);
    };
    const addRow = () => {
        compareListRef.current.setTreeData((p) => {
            const id = Math.uuid().toLocaleLowerCase();
            const newData = {
                id,
                key: id,
                sourceEntity: {},
                children : [],
            };
            if(p.length === 0) {
                // 头部两个固定数据
                const treeHeader = [{
                    id: 'header1',
                    children: [],
                }, {
                    id: 'header2',
                    children: [],
                }];
                return treeHeader.concat(newData);
            }
            return p.concat(newData);
        });
    };
    const loadList = () => {
        Upload('application/json', (d) => {
            const data = JSON.parse(d);
            if (!data.compareTableList || !Array.isArray(data.compareTableList)) {
                Modal.error({
                    title: FormatMessage.string({id: 'optFail'}),
                    message: FormatMessage.string({id: 'components.compare.invalidTableList'}),
                });
            } else {
                const mergeList = (compareTableList) => {
                    const addData = [];
                    compareListRef.current.setTreeData((pre) => {
                        const tempPre = pre.length === 0 ? [{
                            id: 'header1',
                            children: [],
                        }, {
                            id: 'header2',
                            children: [],
                        }] : pre;
                        return tempPre.concat(compareTableList.map((c) => {
                            const id = Math.uuid().toLocaleLowerCase();
                            const otherProps = {};
                            if(c.right) {
                                otherProps.metaEntityData = c.right;
                            }
                            if(c.left && c.right) {
                                addData.push({defKey: id});
                            }
                            return {
                                id,
                                key: id,
                                sourceEntity: c.left || {},
                                children : [],
                                ...otherProps,
                            };
                        }));
                    });
                    compareListRef.current.setMetaData((pre) => {
                        return pre.concat(addData);
                    });
                    Message.success({title: FormatMessage.string({id: 'optSuccess'})});
                };
                const entities = currentDataSource.entities || [];
                const currentCompareTableList = data.compareTableList.map((c) => {
                    const left = entities
                        .find(e => e.defKey?.toLocaleLowerCase()
                            === c.left?.toLocaleLowerCase());
                    const right = entities
                        .find(e => e.defKey?.toLocaleLowerCase()
                            === c.right?.toLocaleLowerCase());
                    return {
                        ...c,
                        left,
                        leftLose: c.left && !left,
                        right,
                        rightLose: c.right && !right,
                    };
                });
                if (currentCompareTableList.some(c => c.leftLose || c.rightLose)) {
                    Modal.confirm({
                        title: FormatMessage.string({id: 'components.compare.loadConfirmTitle'}),
                        message: FormatMessage.string({id: 'components.compare.loadConfirmMessage', data: {data: ''}}),
                        onOk:() => {
                            mergeList(currentCompareTableList);
                        },
                    });
                } else {
                    mergeList(currentCompareTableList);
                }
            }
        }, (file) => {
            const result = file.name.endsWith('.json');
            if (!result) {
                Modal.error({
                    title: FormatMessage.string({id: 'optFail'}),
                    message: FormatMessage.string({id: 'components.compare.invalidTableList'}),
                });
            }
            return result;
        });
    };
    const saveList = () => {
        const allTreeData = compareListRef.current.getTreeData();
        Download(
            [JSON.stringify({
                compareTableList: allTreeData.filter((e) => {
                    return e.sourceEntity?.defKey || e.metaEntityData?.defKey;
                }).map(e => ({
                    key: e.id,
                    left: e.sourceEntity?.defKey || '',
                    right: e.metaEntityData?.defKey || '',
                })),
            }, null, 2)],
            'application/json',
            `${dataSource.name}-${FormatMessage.string({id: 'components.compare.compareList'})}-${moment().format('YYYYMDHHmmss')}.json`);
    };
    const onRemove = (d) => {
       // 清除变更
        compareListRef.current.setChanges((pre) => {
            return pre.filter(p => p.data.baseInfo.defKey !== d);
        });
        // 清除数据
        compareListRef.current.setTreeData((pre) => {
            return pre.filter(p => p.id !== d);
        });
        // 清除meta数据
        compareListRef.current.setMetaData((pre) => {
            return pre.filter(p => p !== d);
        });
        // 清除选中
        compareListRef.current.setEntitiesKeyChecked((pre) => {
            return pre.filter(p => p !== d);
        });
    };
    const onPicker = (key, position) => {
        console.log(key, position);
        let modal, value;
        const onCancel = () => {
            modal && modal.close();
        };
        const onOk = () => {
            if (value?.length > 0) {
                const entity = (currentDataSource.entities || [])
                    .find(e => e.id === value[0].split(separator)[1]) || {};
                let updateMetaData = false;
                compareListRef.current.setTreeData((p) => {
                    return p.map((c) => {
                        if(c.key === key) {
                            if(position === 'right') {
                                updateMetaData = !!c.sourceEntity?.defKey;
                                return {
                                    ...c,
                                    metaEntityData: entity,
                                };
                            }
                            updateMetaData = !!c.metaEntityData;
                            return {
                                ...c,
                                sourceEntity: entity,
                            };
                        }
                        return c;
                    });
                });
                if(updateMetaData) {
                    compareListRef.current.setMetaData((p) => {
                        if(p.findIndex(m => m.defKey === key) < 0) {
                            return p.concat({defKey: key});
                        }
                        return p;
                    });
                }
            }
            modal && modal.close();
        };
        const onChange = (values) => {
            value = values;
        };
        const getData = () => {
          return (currentDataSource.viewGroups || [])
              .concat({
                  id: '__ungroup',
                  defKey: '__ungroup',
                  defName: FormatMessage.string({id: 'exportSql.defaultGroup'}),
                  refEntities: calcUnGroupDefKey(currentDataSource, 'entities'),
              }).map((g) => {
                  return {
                      key: g.id,
                      value: g.defName || g.defKey,
                      children: (currentDataSource.entities || [])
                          .filter(e => g.refEntities.includes(e.id)).map((e) => {
                              return {
                                  key: `${g.id}${separator}${e.id}`,
                                  value: `${e.defName}(${e.defKey})`,
                              };
                          }),
                  };
              });
        };
        modal = openModal(<div className={`${currentPrefix}-compare-table-entity-select`}><Tree
          onChange={onChange}
          simpleChecked
          dataSource={getData()}
        /></div>, {
            bodyStyle: { width: '50%' },
            buttons:  [<Button type='primary' key='ok' onClick={onOk}>
              <FormatMessage id='button.ok'/>
            </Button>,
              <Button key='cancel' onClick={onCancel}>
                <FormatMessage id='button.cancel'/>
              </Button>],
            title: FormatMessage.string({id: 'components.compare.entityPicker'}),
        });
    };
    return <div className={`${currentPrefix}-compare-table`}>
      <Loading visible={loading} isFull={false}>
        <CompareList
          ref={compareListRef}
          defaultMeta
          empty={<FormatMessage id='components.compare.tableListEmpty'/>}
          header={(entitiesKeyChecked) => {
              return <div className={`${currentPrefix}-compare-table-header`}>
                <Tooltip placement='top' force title={<div style={{width: 180}}><FormatMessage id='components.compare.addRowTips'/></div>}>
                  <span>
                    <Button type="primary" onClick={addRow}>
                      <Icon type='fa-plus'/><span> <FormatMessage id='components.compare.addRow'/></span>
                    </Button>
                  </span>
                </Tooltip>
                <Button
                  type="primary"
                  onClick={() => scanTable(entitiesKeyChecked)}
                  disable={entitiesKeyChecked.length === 0}>
                  <FormatMessage id='components.compare.scanFieldDiff'/>
                </Button>
                <Button
                  onClick={loadList}
                  type="primary"
                  >
                  <FormatMessage id='components.compare.loadTableList'/>
                </Button>
                <Button
                  onClick={saveList}
                  type="primary"
                  >
                  <FormatMessage id='components.compare.saveTableList'/>
                </Button>
              </div>;
          }}
          scanTable={scanTable}
          onRemove={onRemove}
          onPicker={onPicker}
          dataSource={currentDataSource}
          openLoading={openLoading}
          closeLoading={closeLoading}
          mergeFromMeta={mergeFromMeta}
          leftTitle={<span style={{color: '#000000'}}><FormatMessage id='components.compare.checkTable'/></span>}
          rightTitle={<span style={{color: 'red'}}><FormatMessage id='components.compare.diffTable'/></span>}
            />
      </Loading>
    </div>;
});
