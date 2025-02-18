import React from 'react';
import { Icon, FormatMessage } from 'components';
import {getPrefix} from '../../../lib/prefixUtil';
import {checkItems, emptyRule} from '../../../lib/datasource_util';

export default React.memo(({prefix, currentRule, namingRules, moveRule,
                               setSelectedRule, deleteRule, addRule}) => {
    const currentPrefix = getPrefix(prefix);
    const items = checkItems();
    const onAdd = (i) => {
        addRule({
            ...emptyRule,
            defName: `${FormatMessage.string({id: 'checkRule.ruleName'})}_${namingRules.length + 1}`,
            id: Math.uuid(),
            controlIntensity: 'S',
            applyObjectType: i.applyObjectType,
            applyFieldType: i.applyFieldType,
        });
    };
    const onDelete = () => {
        deleteRule();
    };
    const checkRule = (item) => {
        if((currentRule?.applyFieldType === item.applyFieldType)
            && (currentRule?.applyObjectType === item.applyObjectType)) {
            return 'normal';
        }
        return 'disable';
    };
    const _setRule = (r) => {
        setSelectedRule(r);
    };
    const onMove = (toId) => {
        moveRule(toId);
    };
    const getToId = (rules, type) => {
        const currentIndex = rules.findIndex(r => r.id === currentRule.id);
        if(type === 'up') {
            return rules[currentIndex - 1]?.id;
        }
        return rules[currentIndex + 1]?.id;
    };
    return <div className={`${currentPrefix}-check-rule-edit-list`}>
      <div className={`${currentPrefix}-check-rule-edit-list-opt`}>
        <div><FormatMessage id='checkRule.ruleConfig'/></div>
      </div>
      {
            items.map((i) => {
                const rules = namingRules
                    .filter(r => (r.applyFieldType === i.applyFieldType)
                        && (r.applyObjectType === i.applyObjectType));
                const optStatus = checkRule(i);
                const isDisable = optStatus === 'disable';
                return <div key={i.name} className={`${currentPrefix}-check-rule-edit-list-item`}>
                  <div className={`${currentPrefix}-check-rule-edit-list-item-name`}>{i.name}</div>
                  <div className={`${currentPrefix}-check-rule-edit-list-item-opt ${currentPrefix}-check-rule-edit-list-item-opt-${optStatus}`}>
                    <span onClick={() => onAdd(i)}><Icon type='fa-plus'/>
                      <FormatMessage id='checkRule.addRule'/>
                    </span>
                    <span onClick={() => !isDisable && onDelete(i)}><Icon type='fa-minus'/>
                      <FormatMessage id='checkRule.deleteRule'/>
                    </span>
                    <span className={`${currentPrefix}-check-rule-edit-list-item-opt-move`}>
                      <span onClick={() => !isDisable && onMove(rules[0]?.id)} className={`${currentPrefix}-check-rule-edit-list-item-opt-item`}><FormatMessage id='checkRule.top'/></span>
                      <span className={`${currentPrefix}-check-rule-edit-list-item-opt-border`}/>
                      <span onClick={() => !isDisable && onMove(getToId(rules, 'up'))} className={`${currentPrefix}-check-rule-edit-list-item-opt-item`}><FormatMessage id='checkRule.up'/></span>
                      <span className={`${currentPrefix}-check-rule-edit-list-item-opt-border`}/>
                      <span onClick={() => !isDisable && onMove(getToId(rules, 'down'))} className={`${currentPrefix}-check-rule-edit-list-item-opt-item`}><FormatMessage id='checkRule.down'/></span>
                      <span className={`${currentPrefix}-check-rule-edit-list-item-opt-border`}/>
                      <span onClick={() => !isDisable && onMove(rules[rules.length - 1]?.id)} className={`${currentPrefix}-check-rule-edit-list-item-opt-item`}><FormatMessage id='checkRule.bottom'/></span>
                    </span>
                  </div>
                  <div className={`${currentPrefix}-check-rule-edit-list-item-header`}>
                    <span><FormatMessage id='checkRule.checkRule'/></span>
                    <span><FormatMessage id='checkRule.checkStrength'/></span>
                    <span><FormatMessage id='checkRule.ruleStatus'/></span>
                  </div>
                  {
                        rules.length > 0 ? rules.map((r, index) => {
                            return <div
                              key={r.id}
                              className={`${currentPrefix}-check-rule-edit-list-item-row ${currentPrefix}-check-rule-edit-list-item-row-${currentRule?.id === r.id ? 'selected' : 'normal'}`}>
                              <span>
                                <span onClick={() => _setRule(r)}>{index + 1}</span>
                                <span onClick={() => _setRule(r)}>{r.defName}</span>
                              </span>
                              <span
                                className={`${currentPrefix}-check-rule-edit-list-item-row-${r.controlIntensity === 'S' ? 'suggest' : 'force'}`}
                                ><FormatMessage
                                  id={`checkRule.${r.controlIntensity === 'S' ? 'suggest' : 'force'}`}/></span>
                              <span
                                className={`${currentPrefix}-check-rule-edit-list-item-row-${r.enable === true ? 'enable' : 'disable'}`}
                              ><FormatMessage id={`checkRule.${r.enable === true ? 'enable' : 'disable'}`}/></span>
                            </div>;
                        }) : <span className={`${currentPrefix}-check-rule-edit-list-item-row-empty`}>
                          <FormatMessage id='checkRule.emptyRule'/>
                        </span>
                  }
                </div>;
            })
      }
    </div>;
});
