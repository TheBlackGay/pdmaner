import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import {FormatMessage, Modal} from 'components';
import CheckList from './CkeckList';
import CheckDetail from './CheckDetail';
import CheckEdit from './CheckEdit';
import './style/index.less';
import { getPrefix } from '../../../lib/prefixUtil';
import {postWorkerFuc} from '../../../lib/event_tool';

export default React.memo(forwardRef(({prefix, dataSource, updateDataSource,
                               jumpEntity, validateTableStatus, tabDataChange, setMenuType,
                               save, openDict, getDataSource, common, configOpen}, ref) => {
    const statusRef = useRef(true);
    const checkListRef = useRef(null);
    const currentPrefix = getPrefix(prefix);
    const dataSourceRef = useRef(dataSource);
    dataSourceRef.current = dataSource;
    const endRef = useRef(false);
    const [ruleResults, setRuleResults] = useState([]);
    const [currentRule, setCurrentRule] = useState(null);
    const [type, setType] = useState(configOpen ? 'config' : 'result');
    const typeRef = useRef('');
    typeRef.current = type;
    useImperativeHandle(ref, () => {
        return {
            checkLeave: (cb) => {
                if(typeRef.current === 'config' && !statusRef.current) {
                    Modal.confirm({
                        title: <FormatMessage id='checkRule.backConfirm'/>,
                        message: <FormatMessage id='checkRule.backConfirmTitle'/>,
                        onOk:() => {
                            cb();
                        },
                    });
                } else {
                    cb();
                }
            },
        };
    }, []);
    useEffect(() => {
        return () => {
            endRef.current = true;
        };
    }, []);
    const onBack = (force) => {
        if(force || statusRef.current) {
            if(configOpen) {
                setMenuType('1');
            } else {
                setType('result');
            }
        } else {
            Modal.confirm({
                title: <FormatMessage id='checkRule.backConfirm'/>,
                message: <FormatMessage id='checkRule.backConfirmTitle'/>,
                onOk:() => {
                    if(configOpen) {
                        setMenuType('1');
                    } else {
                        setType('result');
                    }
                },
            });
        }
    };
    const onCheck = async (e, bt, id) => {
        if((dataSourceRef.current.namingRules || []).length === 0) {
            Modal.error({
                title: FormatMessage.string({id: 'checkRule.checkFail'}),
                message: FormatMessage.string({id: 'checkRule.namingRulesEmpty'}),
            });
        } else if((dataSourceRef.current.entities || []).length === 0
            && (dataSourceRef.current.logicEntities || []).length === 0) {
            Modal.error({
                title: FormatMessage.string({id: 'checkRule.checkFail'}),
                message: FormatMessage.string({id: 'checkRule.checkObjectEmpty'}),
            });
        } else {
            bt?.updateStatus('loading');
            let allData = (dataSourceRef.current.entities || [])
                .concat(dataSourceRef.current.logicEntities || []);
            if(id) {
                allData = [allData.find(d => d.id === id)];
            }
            for (let i = 0; i < allData.length; i += 1) {
                if(endRef.current) {
                    return;
                }
                const currentData = allData[i];
                setRuleResults((p) => {
                    if(p.findIndex(d => d.dataId === currentData.id) > -1) {
                        return p.map((d) => {
                            if(d.dataId === currentData.id) {
                                return {
                                    ...d,
                                    checkResult: [],
                                    status: 0,
                                };
                            }
                            return d;
                        });
                    }
                    return p.concat({
                        dataId: currentData.id,
                        checkResult: [],
                        status: 0,
                    });
                });
                // eslint-disable-next-line no-await-in-loop
                await postWorkerFuc('utils.execCheck', true, [
                    dataSourceRef.current,
                    currentData.id,
                ]).then((res) => {
                    if(endRef.current) {
                        return;
                    }
                    setRuleResults(p => p.map((r) => {
                        if(r.dataId === currentData.id) {
                            return {
                                ...r,
                                ...res,
                                status: 1,
                            };
                        }
                        return r;
                    }));
                }).catch(() => {
                    if(endRef.current) {
                        return;
                    }
                    setRuleResults(p => p.map((r) => {
                        if(r.dataId === currentData.id) {
                            return {
                                ...r,
                                status: 2,
                            };
                        }
                        return r;
                    }));
                });
            }
            bt?.updateStatus('normal');
        }
    };
    const onView = (c) => {
        setCurrentRule(c);
    };
    const setStatus = (status) => {
        statusRef.current = status;
    };
    const _jumpDetail = (...args) => {
        checkListRef.current.openObjectView(...args);
    };
    return <div className={`${currentPrefix}-check-rule`}>
      {
            type === 'result' ? <>
              <div className={`${currentPrefix}-check-rule-result`}>
                <CheckList
                  ref={checkListRef}
                  tabDataChange={tabDataChange}
                  updateDataSource={updateDataSource}
                  common={common}
                  getDataSource={getDataSource}
                  save={save}
                  openDict={openDict}
                  validateTableStatus={validateTableStatus}
                  jumpEntity={jumpEntity}
                  onView={onView}
                  ruleResults={ruleResults}
                  dataSource={dataSource}
                  onCheck={onCheck}/>
                <CheckDetail
                  jumpDetail={_jumpDetail}
                  dataSource={dataSource}
                  ruleData={currentRule}
                  setType={setType}/>
              </div>
            </> : <CheckEdit
              updateDataSource={updateDataSource}
              dataSource={dataSource}
              onBack={onBack}
              setStatus={setStatus}
              />
        }
    </div>;
}));
