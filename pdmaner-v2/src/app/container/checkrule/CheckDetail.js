import React, { useState, useEffect } from 'react';
import {Tooltip, Icon, FormatMessage, Button, Modal} from 'components';
import {getPrefix} from '../../../lib/prefixUtil';
import {checkResultItems} from '../../../lib/datasource_util';
import {postWorkerFuc} from '../../../lib/event_tool';

export default React.memo(({prefix, setType, ruleData, dataSource, jumpDetail, isTab, tabData}) => {
    const [expand, setExpand] = useState([]);
    const allData = (dataSource.entities || []).concat(dataSource.logicEntities || []);
    const items = checkResultItems();
    const namingRules = dataSource.namingRules || [];
    const currentPrefix = getPrefix(prefix);
    const [currentRule, setCurrentRule] = useState(null);
    const currentData = tabData || allData.find(d => d.id === currentRule?.dataId);
    useEffect(() => {
        setCurrentRule(ruleData);
    }, [ruleData]);
    const getCurrentRuleResult = (id, filter) => {
      if(currentRule.checkResult.some(r => (filter ? filter(r, id) : true) && (!r.result) && (r.ruleControlIntensity === 'F'))) {
        return 'fail';
      } else if(currentRule.checkResult.some(r => (filter ? filter(r, id) : true) && (!r.result) && (r.ruleControlIntensity === 'S'))) {
        return 'warring';
      }
      return 'pass';
    };
    const _setExpand = (ruleId) => {
      setExpand((p) => {
        if(p.includes(ruleId)) {
          return p.filter(r => r !== ruleId);
        }
        return p.concat(ruleId);
      });
    };
    const renderRowList = (ruleId) => {
      if(expand.includes(ruleId)) {
        return <div className={`${currentPrefix}-check-rule-detail-result-item-row-list`} key='row-list'>
          <div>
            <span><FormatMessage id='checkRule.defName'/></span>
            <span><FormatMessage id='checkRule.defKey'/></span>
            <span><FormatMessage id='checkRule.opt'/></span>
          </div>
          {
            currentRule?.checkResult?.filter(r => (r.ruleId === ruleId) && (!r.result)).map((r) => {
              if(r.applyFieldType === 'entity') {
                return <div key={`${ruleId}_${currentData.id}`}>
                  <span>{currentData.defName}</span>
                  <span>{currentData.defKey}</span>
                  <span />
                </div>;
              } else if(r.applyFieldType === 'field' || r.applyFieldType === 'index') {
                return (currentData[r.applyFieldType === 'field' ? 'fields' : 'indexes'] || []).filter(f => f.id === r.dataId).map((f) => {
                  return <div key={`${ruleId}_${f.id}`}>
                    <span>{f.defName}</span>
                    <span>{f.defKey}</span>
                    <span onClick={() => jumpDetail(currentData, dataSource, {
                        defKey: f.id,
                    })}>{r.applyFieldType === 'field' && <FormatMessage id='checkRule.position'/>}</span>
                  </div>;
                });
              }
              return null;
            })
          }
        </div>;
      }
      return null;
    };
  useEffect(() => {
    setExpand([]);
  }, [currentData]);
  const onCheck = (e, btn) => {
      if((dataSource.namingRules || []).filter(r => r.enable).length === 0) {
          Modal.error({
              title: FormatMessage.string({id: 'checkRule.checkFail'}),
              message: FormatMessage.string({id: 'checkRule.namingRulesEmpty'}),
          });
      } else {
          btn?.updateStatus('loading');
          postWorkerFuc('utils.execCheck', true, [
              {
                  ...dataSource,
                  entities: [currentData],
              },
              currentData.id,
          ]).then((res) => {
              setCurrentRule(res);
          }).catch((error) => {
              Modal.error({
                  title: FormatMessage.string({id: 'checkRule.checkFail'}),
                  message: `${FormatMessage.string({id: 'checkRule.checkFail'})}：${error.message}`,
              });
          }).finally(() => {
              btn?.updateStatus('normal');
          });
      }
  };
  const currentResult = currentRule ? getCurrentRuleResult() : '';
  return <div className={`${currentPrefix}-check-rule-detail`}>
    <div className={`${currentPrefix}-check-rule-detail-opt`}>
      <span>
        <FormatMessage id='checkRule.checkDetail'/>
      </span>
      {isTab && currentRule && <Button
        type='primary'
        onClick={onCheck}
        >
        <FormatMessage id='checkRule.restartCheck'/>
      </Button>}
      <span onClick={() => setType('config')}>
        <Icon type='fa-cogs'/>
        <FormatMessage id='checkRule.allRuleConfig'/>
      </span>
    </div>
    {!currentRule ? <div
      className={`${currentPrefix}-check-rule-detail-result-empty`}
    >
      {
                isTab ? <Button
                  className={`${currentPrefix}-check-rule-detail-result-empty-button`}
                  type='primary'
                  onClick={onCheck}
                ><FormatMessage id='checkRule.startCheck'/></Button> :  <FormatMessage id='checkRule.ruleResultDetailEmpty'/>
            }
    </div> : <>
      <div className={`${currentPrefix}-check-rule-detail-title`}>
        <Tooltip placement='top' title={currentData.defKey}>
          <span>
            <span><FormatMessage id={`checkRule.${currentData.type === 'L' ? 'logicEntityDefKey' : 'entityDefKey'}`}/></span>
            <span>{currentData.defKey}</span>
          </span>
        </Tooltip>
        <Tooltip placement='top' title={currentData.defName}>
          <span>
            <span><FormatMessage id={`checkRule.${currentData.type === 'L' ? 'logicEntityDefName' : 'entityDefName'}`}/></span>
            <span>{currentData.defName}</span>
          </span>
        </Tooltip>
        <span>
          <span>
            <FormatMessage id='checkRule.checkFinalResult'/>
          </span>
          <span className={`${currentPrefix}-check-rule-detail-result-item-row-status-${currentResult}`}>
            <FormatMessage id={`checkRule.${currentResult}`}/>
          </span>
        </span>
      </div>
      <div className={`${currentPrefix}-check-rule-detail-result`}>
        {
              items.filter(i => i.applyObjectType === currentData.type)
                  .map((i) => {
                const rules = namingRules
                    .filter(r => (r.applyFieldType === i.applyFieldType)
                        && (r.applyObjectType === i.applyObjectType) && r.enable);
                if(rules.length > 0) {
                    return <div key={i.name} className={`${currentPrefix}-check-rule-detail-result-item`}>
                      <div className={`${currentPrefix}-check-rule-detail-result-item-type`}>
                        {i.name}（{rules.length}）
                      </div>
                      <div className={`${currentPrefix}-check-rule-detail-result-item-row`}>
                        <span>
                          <FormatMessage id='checkRule.checkRule'/>
                        </span>
                        <span>
                          <FormatMessage id='checkRule.checkStrength'/>
                        </span>
                        <span>
                          <FormatMessage id='checkRule.checkFinalResult'/>
                        </span>
                        <span>
                          <FormatMessage id='checkRule.opt'/>
                        </span>
                      </div>
                      {
                          rules.map((r) => {
                              const result = getCurrentRuleResult(r.id, (rule, id) => {
                                  return rule.ruleId === id;
                              });
                              return [<div key='row' className={`${currentPrefix}-check-rule-detail-result-item-row`}>
                                <span>{r.defName}</span>
                                <span>
                                  <FormatMessage id={`checkRule.${r.controlIntensity === 'S' ? 'suggest' : 'force:'}`}/>
                                </span>
                                <span>
                                  <span
                                    className={`${currentPrefix}-check-rule-detail-result-item-row-status-${result}`}
                                    >
                                    <FormatMessage id={`checkRule.${result}`}/>
                                  </span>
                                </span>
                                {
                                      expand.includes(r.id) ?
                                        <span onClick={() => _setExpand(r.id)}>
                                          <FormatMessage id='checkRule.unExpand'/>
                                        </span> :
                                        <span onClick={() => _setExpand(r.id)}>{result !== 'pass' && <FormatMessage id='checkRule.view'/>}</span>
                                  }
                              </div>, renderRowList(r.id)];
                          })
                        }
                    </div>;
                }
                return null;
              })
            }
      </div>
    </>
      }
  </div>;
});
