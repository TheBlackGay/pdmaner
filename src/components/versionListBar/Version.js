import React, {useState, useEffect, useRef} from 'react';
import {VariableSizeList as List} from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import _ from 'lodash';

import {Modal, openModal} from '../modal';
import Button from '../button';
import VersionListCard from './versionListCard';
import { getPrefix } from '../../lib/prefixUtil';
import {getMaxVersion} from '../../lib/datasource_version_util';
import {transformationData} from '../../lib/datasource_util';
import './style/index.less';
import VersionEdit from './VersionEdit';
import FormatMessage from '../formatmessage';
import { Loading } from '../loading';
import {postWorkerFuc} from '../../lib/event_tool';
import {getMemoryCache} from '../../lib/cache';
import {CONFIG} from '../../lib/variable';
import { getAllVersionProject, getOneVersion, saveVersion, deleteVersion, getAllVersionFile } from '../../lib/middle';

const VersionListBar = React.memo((props) => {
    const { prefix, onSelected, getLatelyDataSource, projectInfo, menuType,
        style, openLoading, closeLoading, versionType } = props;
    const config = getMemoryCache(CONFIG);
    const currentDb = _.get(props.dataSource, 'profile.default.db',
        _.get(props.dataSource, 'profile.dataTypeSupports[0].id'));
    const [selectedData, setSelectedData] = useState('');
    const [isChange, setIsChange] = useState(false);
    const currentPrefix = getPrefix(prefix);
    const preDataSourceRef = useRef({});
    const [versionsData, setVersionsData] = useState([]);
    const versionLengthRef = useRef(0);
    const menuTypeRef = useRef('');
    menuTypeRef.current = menuType;
    const changesCache = useRef([]);
    const selectedRef = useRef('');
    selectedRef.current = selectedData;
    const needRefresh = useRef(false);
    const isInit = useRef(false);
    const [loading, setLoading] = useState('');
    const [allVersion, setAllVersion] = useState([]);
    const currentPage = useRef(0);
    const isLoadMore = useRef(false);
    const varRef = useRef(null);

    useEffect(() => {
        if(menuType === '4' && isInit.current === false && projectInfo) {
            isInit.current = true;
            setLoading(FormatMessage.string({id: 'readVersion'}));
            getAllVersionFile(projectInfo, props.dataSource).then((res) => {
                setAllVersion(res);
                getAllVersionProject(projectInfo, props.dataSource,
                    res.slice(currentPage.current, currentPage.current + 10))
                    .then((result) => {
                        setLoading(result.length > 0 ?
                            `${FormatMessage.string({id: 'versionData.check'})}` : '');
                        currentPage.current += 10;
                        setVersionsData(p => p.concat(result));
                    });
            });
        }
    }, [menuType]);
    const _onDelete = (e, o) => {
        e.stopPropagation();
        Modal.confirm({
            title: FormatMessage.string({id: 'deleteConfirmTitle'}),
            message: FormatMessage.string({id: 'deleteConfirm'}),
            onOk:() => {
                if(selectedRef.current === o.date) {
                    setSelectedData('');
                    const cacheIndex = changesCache.current.findIndex(c => c.date === '');
                    const {change, message, sql} =  changesCache.current[cacheIndex];
                    onSelected({}, change, message, sql);
                }
                const removeIndex = changesCache.current.findIndex(c => c.date === o.date);
                if(removeIndex > -1) {
                    changesCache.current.splice(removeIndex, 1);
                }
                openLoading();
                setVersionsData(p => p.filter(v => v.date !== o.date));
                deleteVersion(o, props.dataSource, projectInfo);
                setAllVersion(p =>  p.filter(v => v !== o.name));
                currentPage.current -= 1;
                closeLoading();
            },
        });
    };
    const calcChanges = (fuc, ...args) => {
        return new Promise((resolve, reject) => {
            postWorkerFuc(fuc, true,
                args).then((data) => {
                resolve(data);
            }).catch((err) => {
                reject(err);
            });
        });
    };
    const checkChanges = (current, pre) => {
        // 检查某两个版本是否有差异
        return new Promise((resolve, reject) => {
            postWorkerFuc('dataSourceVersion.packageChanges', true,
                [current, pre, currentDb]).then((c) => {
                Promise.all([
                    calcChanges('dataSourceVersion.getMessageByChanges', c, props.dataSource, config.lang),
                    calcChanges('dataSourceVersion.getChanges', c, props.dataSource, config.lang)])
                    .then(([m, s]) => {
                        resolve({
                            changes: c,
                            message: m,
                            sql: s,
                        });
                    }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    };
    const setSelected = (version, currentData, index = -1, needSelected = true,
                         needLoading = true) => {
        return new Promise((resolve, reject) => {
            const cacheIndex = changesCache.current.findIndex(c => c.date === currentData);
            if(cacheIndex > -1) {
                const {changes, message ,sql} =  changesCache.current[cacheIndex];
                needSelected && onSelected(version || {}, changes, message, sql);
                resolve(changes);
            } else {
                needLoading && setLoading(FormatMessage.string({id: 'versionData.check'}));
                const pre = versionsData[index + 1];
                let needChange = false;
                Promise.all([version, pre]
                    .map((t) => {
                        if(t?.name && !t.data) {
                            needChange = true;
                            return getOneVersion(projectInfo, props.dataSource, t);
                        }
                        return Promise.resolve(t);
                    }))
                    .then(([v1, vPre]) => {
                        const v2 = vPre ? {
                            ...vPre.data,
                            data: transformationData(vPre.data),
                        } : vPre;
                        if(needChange) {
                            setVersionsData((prevState) => {
                                return prevState.map((v) => {
                                    if(v.name === v1?.name || v.name === v2?.name) {
                                        return v.name === v1?.name ? v1 : v2;
                                    }
                                    return v;
                                });
                            });
                        }
                        checkChanges(v1.data, v2?.data || {entities: [], views: []})
                            .then((data) => {
                                // 超过一千条变更数据 不记录缓存 防止过量消耗内存
                                if(data.changes.length < 1000 || currentData === '') {
                                    // 只临时缓存10条数据 防止内存消耗过大
                                    if(changesCache.current.length === 10){
                                        const deleteIndex = changesCache.current.findIndex(c => c.date !== '');
                                        changesCache.current.splice(deleteIndex, 1);
                                    }
                                    changesCache.current.push({date: version.date, ...data});
                                }
                                needSelected &&
                                onSelected(version, data.changes, data.message, data.sql);
                                resolve(data.changes);
                            }).catch((err) => {
                            reject(err);
                        }).finally(() => {
                            needLoading && setLoading('');
                        });
                    }).catch(() => {
                    needLoading && setLoading('');
                });
            }
        });
    };
    const _onSelected = (version, index = -1) => {
        const currentData = version?.date || '';
        if(selectedData !== currentData) {
            setSelectedData(currentData);
            setSelected(version || {data: preDataSourceRef.current}, currentData, index);
        }
    };
    const clearCache = () => {
        // 清除所有缓存数据
        setIsChange(false);
        changesCache.current = [];
        preDataSourceRef.current = {};
    };
    const checkCurrent = () => {
        return new Promise((resolve, reject) => {
            let isCheck = false;
            const check = () => {
                return new Promise((res, rej) => {
                    const { result, dataSource } = getLatelyDataSource();
                    if(result.status) {
                        if((preDataSourceRef.current.entities !== dataSource.entities) ||
                            (preDataSourceRef.current.views !== dataSource.views) ||
                            ((versionLengthRef.current !== versionsData.length)
                                && !isLoadMore.current) ||
                            needRefresh.current) {
                            isLoadMore.current = false;
                            preDataSourceRef.current = dataSource;
                            versionLengthRef.current = versionsData.length;
                            needRefresh.current = false;
                            // 清除最新变更记录缓存
                            const cacheIndex = changesCache.current.findIndex(c => c.date === '');
                            changesCache.current.splice(cacheIndex, 1);
                            // 检查当前项目与最新保存的版本是否有差异
                            isCheck = true;
                            setSelected({date: '', data: dataSource},
                                '', -1, selectedRef.current === '',
                                false).then((data) => {
                                setIsChange(data.length > 0);
                                res();
                            }).catch((err) => {
                                rej(err);
                            });
                        } else {
                            res();
                        }
                    } else {
                        res();
                    }
                });
            };
            const selected = () => {
                return new Promise((res, rej) => {
                    if(!isCheck) {
                        setSelected({data: preDataSourceRef.current}, '', -1, true);
                        res();
                    } else {
                        // 还原默认选中内容
                        const versionIndex = versionsData
                            .findIndex(v => v.date === selectedRef.current);
                        if(versionIndex > -1) {
                            setSelected(versionsData[versionIndex],
                                selectedRef.current,
                                versionIndex,
                                true,
                                false)
                                .then(() => {
                                    res();
                                }).catch(() => {
                                rej();
                            });
                        } else {
                            res();
                        }
                    }
                });
            };
            setLoading(FormatMessage.string({id: 'versionData.check'}));
            Promise.all([check(), selected()]).then(() => {
                resolve();
            }).catch(() => {
                reject();
            }).finally(() => {
                setLoading('');
            });
        });
    };
    useEffect(() => {
        varRef.current?.resetAfterIndex(0);
    }, [versionsData]);
    useEffect(() => {
        return () => {
            clearCache();
        };
    }, []);
    useEffect(() => {
        if(versionsData.length === 0) {
            clearCache();
        }
        if(menuType === '4' && versionsData.length > 0 && versionType === '1') {
            checkCurrent();
        }
    }, [menuType, versionsData.length]);
    useEffect(() => {
        if (versionType === '2') {
            // 重置选中
            setSelectedData(null);
        }
    }, [versionType]);
    const defaultDb  = props.dataSource?.profile?.default?.db;
    const codeTemplate  = props.dataSource?.profile?.codeTemplates?.filter(t => t.applyFor
        === defaultDb)[0];
    useEffect(() => {
        // 数据库和模版发生了变化 需要重新生成变更数据
        needRefresh.current = true;
        clearCache();
        if(menuTypeRef.current === '4' && versionsData.length > 0 && versionType === '1') {
            checkCurrent();
        }
    }, [defaultDb, codeTemplate]);
    const _onCreated = (version) => {
        if (projectInfo) {
            let modal;
            const { result, dataSource } = getLatelyDataSource();
            const cacheIndex = changesCache.current.findIndex(c => c.date === '');
            const tempVersion = {
                ...version,
                name: version?.name || getMaxVersion(versionsData),
                desc: version?.desc || ((versionsData.length === 0 || !result.status) ? '' :
                    changesCache.current[cacheIndex]?.message || '')};
            const onOk = () => {
                if (!tempVersion.name ||
                    (version && version.name !== tempVersion.name &&
                        versionsData.findIndex(v => v.name === tempVersion.name) > -1)
                    || (!version &&
                        versionsData.findIndex(v => v.name === tempVersion.name) > -1)) {
                    Modal.error({
                        title: FormatMessage.string({id: 'versionData.validate'}),
                        message: FormatMessage.string({id: 'versionData.validate'}),
                    });
                } else if (!result.status) {
                    Modal.error({
                        title: FormatMessage.string({id: 'versionData.saveError'}),
                        message: result.message,
                    });
                } else {
                    if (!version) {
                        tempVersion.date = Date.now();
                        tempVersion.data = dataSource;
                    }
                    openLoading(FormatMessage.string({id: 'versionData.saveTitle'}));
                    saveVersion(tempVersion, version, projectInfo, dataSource).then(() => {
                        if(version) {
                            setVersionsData(p => p.map((v) => {
                                if(v.name === version.name) {
                                    return tempVersion;
                                }
                                return v;
                            }));
                            setAllVersion(p => p.map((v) => {
                                if(v === version.name) {
                                    return tempVersion.name;
                                }
                                return v;
                            }));
                        } else {
                            setAllVersion(p => [tempVersion.name].concat(p));
                            setVersionsData(p => [tempVersion].concat(p));
                            currentPage.current += 1;
                        }
                        modal.close();
                        closeLoading();
                    });
                }
            };
            const onCancel = () => {
                modal.close();
            };
            const onChange = (e, name) => {
                tempVersion[name] = e.target.value;
            };
            modal = openModal(<VersionEdit
              data={tempVersion}
              onChange={onChange}
            />, {
                onEnter: onOk,
                focusFirst: true,
                title: FormatMessage.string({id: version ? 'versionData.edit' : 'versionData.add'}),
                buttons: [
                  <Button type='primary' key='ok' onClick={onOk}>{FormatMessage.string({id: 'button.ok'})}</Button>,
                  <Button key='cancel' onClick={onCancel}>{FormatMessage.string({id: 'button.cancel'})}</Button>],
            });
        } else {
            Modal.error({
                title: FormatMessage.string({id: 'versionData.isDemo'}),
                message: FormatMessage.string({id: 'versionData.isDemo'}),
            });
        }
    };
    const renderCreatedTool = () => {
        return (
          <>
            <VersionListCard type="new" onNew={() => _onCreated()}/>
            { isChange && <VersionListCard onSelected={_onSelected} type="warn"/> }
          </>
        );
    };
    const _onEdit = (e, o) => {
        e.stopPropagation();
        _onCreated(o);
    };
    const loadMore = () => {
        if(allVersion.length > versionsData.length) {
            isLoadMore.current = true;
            setLoading(FormatMessage.string({id: 'readVersion'}));
            getAllVersionProject(projectInfo, props.dataSource,
                allVersion.slice(currentPage.current, currentPage.current + 10))
                .then((result) => {
                    setVersionsData(p => p.concat(result));
                }).finally(() => {
                setLoading('');
            });
        }
    };
    return (
      <Loading isFull={false} visible={!!loading} title={loading}>
        <div className={`${currentPrefix}-version-list`} style={style}>
          {
                    versionsData.length === 0 ? <div onClick={() => _onCreated()} className={`${currentPrefix}-version-list-empty`}>
                      <FormatMessage id='versionData.empty'/>
                    </div> : <>
                      {renderCreatedTool()}
                      <div className={`${currentPrefix}-version-list-container`}>
                        <AutoSizer>
                          {({height, width}) => {
                                    return <List
                                      ref={varRef}
                                      height={height}
                                      itemCount={versionsData.length + 1}
                                      itemSize={(i) => {
                                            if(i === versionsData.length) {
                                                return 20;
                                            }
                                            return 90;
                                        }}
                                      width={width}
                                    >
                                      {
                                            (params) => {
                                                if(params.index === versionsData.length) {
                                                    return <div
                                                      onClick={loadMore}
                                                      style={{
                                                            ...params.style,
                                                            top: params.style.top + 5,
                                                            height: params.style.height - 5,
                                                        }}>{
                                                        allVersion.length >
                                                        versionsData.length ? <span
                                                          className={`${currentPrefix}-version-list-card-more`}
                                                            >
                                                          <FormatMessage id='readVersionMore'/></span>
                                                            : <span
                                                              className={`${currentPrefix}-version-list-card-all`}
                                                            ><FormatMessage id='readVersionEmpty'/></span>
                                                    }</div>;
                                                }
                                                const data = versionsData[params.index];
                                                return <VersionListCard
                                                  style={params.style}
                                                  index={params.index}
                                                  version={data}
                                                  selected={selectedData === data.date}
                                                  onSelected={_onSelected}
                                                  onDelete={_onDelete}
                                                  onEdit={_onEdit}
                                                  prefix={prefix}
                                                />;
                                            }
                                        }
                                    </List>;
                                }}
                        </AutoSizer>
                      </div>
                    </>
                }
        </div>
      </Loading>
    );
});

export default VersionListBar;
