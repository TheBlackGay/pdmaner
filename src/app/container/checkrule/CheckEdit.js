import React, {useEffect, useState} from 'react';
import moment from 'moment';
import {Button, Download, FormatMessage, Message, Modal, Upload, Icon} from 'components';
import {getPrefix} from '../../../lib/prefixUtil';
import CheckEditList from './CheckEditList';
import CheckEditDetail from './CheckEditDetail';
import {moveArrayPosition} from '../../../lib/array_util';

export default React.memo(({prefix, updateDataSource, onBack,
                               dataSource, setStatus}) => {
    const currentPrefix = getPrefix(prefix);
    const [namingRules, setNamingRules] = useState(dataSource.namingRules || []);
    const [currentRule, setCurrentRule] = useState(null);
    const deleteRule = () => {
        const currentIndex = namingRules.findIndex(r => r.id === currentRule.id);
        let newIndex = -1;
        if(currentIndex - 1 > -1) {
            newIndex = currentIndex - 1;
        } else if(currentIndex + 1 < namingRules.length) {
            newIndex = currentIndex + 1;
        }
        setCurrentRule(namingRules[newIndex]);
        setNamingRules(p => p.filter(r => r.id !== currentRule.id));
    };
    const addRule = (rule) => {
        setNamingRules(p => p.concat(rule));
        setCurrentRule(rule);
    };
    const moveRule = (toId) => {
        if(toId) {
            const currentIndex = namingRules.findIndex(r => r.id === currentRule.id);
            const toIndex = namingRules.findIndex(r => r.id === toId);
            setNamingRules((p) => {
                return moveArrayPosition(p, currentIndex, toIndex);
            });
        }
    };
    const updateRule = (rule) => {
        setNamingRules(p => p.map((r) => {
            if(r.id === rule.id) {
                return {
                    ...r,
                    ...rule,
                };
            }
            return r;
        }));
        setCurrentRule((p) => {
            return {
                ...p,
                ...rule,
            };
        });
    };
    const setSelectedRule = (rule) => {
        setCurrentRule(rule);
    };
    useEffect(() => {
        if(dataSource.namingRules !== namingRules) {
            setStatus(false);
        }
    }, [namingRules]);
    const onImport = () => {
        Upload('application/json', (d) => {
            const data = JSON.parse(d);
            if (!data.namingRules && Array.isArray(data.namingRules)) {
                Modal.error({
                    title: FormatMessage.string({id: 'optFail'}),
                    message: FormatMessage.string({id: 'checkRule.invalidFile'}),
                });
            } else {
                setNamingRules(data.namingRules);
            }
        }, (file) => {
            const result = file.name.endsWith('.json');
            if (!result) {
                Modal.error({
                    title: FormatMessage.string({id: 'optFail'}),
                    message: FormatMessage.string({id: 'checkRule.invalidFile'}),
                });
            }
            return result;
        });
    };
    const onExport = () => {
        Download(
            [JSON.stringify({
                namingRules,
            }, null, 2)],
            'application/json',
            `${dataSource.name}-${FormatMessage.string({id: 'project.checkRule'})}-${moment().format('YYYYMDHHmmss')}.json`);
    };
    const onSave = (back) => {
        if(namingRules.some(r => !r.defName)) {
            Modal.error({
                title: FormatMessage.string({id: 'optFail'}),
                message: FormatMessage.string({id: 'checkRule.ruleNameEmpty'}),
            });
        } else {
            updateDataSource({
                ...dataSource,
                namingRules,
            });
            Message.success({title: FormatMessage.string({id: 'optSuccess'})});
            setStatus(true);
            if(back) {
                onBack(back);
            }
        }
    };
    return <div className={`${currentPrefix}-check-rule-edit`}>
      <div className={`${currentPrefix}-check-rule-edit-buttons`}>
        <span>
          <FormatMessage id='checkRule.checkRuleConfig'/>
        </span>
        <Button onClick={() => onSave(true)} type='primary'><FormatMessage id='checkRule.okAndBack'/></Button>
        <Button onClick={() => onSave(false)} type='primary'><FormatMessage id='checkRule.ok'/></Button>
        <Button onClick={() => onBack(false)}><FormatMessage id='checkRule.back'/></Button>
        <span className={`${currentPrefix}-check-rule-edit-buttons-icon`}>
          <span onClick={onImport}>
            <Icon type='fa-sign-in'/>
            <FormatMessage id='checkRule.import'/>
          </span>
          <span onClick={onExport}>
            <Icon type='fa-sign-out'/>
            <FormatMessage id='checkRule.export'/>
          </span>
        </span>
      </div>
      <div className={`${currentPrefix}-check-rule-edit-content`}>
        <CheckEditList
          currentRule={currentRule}
          namingRules={namingRules}
          addRule={addRule}
          setSelectedRule={setSelectedRule}
          deleteRule={deleteRule}
          moveRule={moveRule}
        />
        <CheckEditDetail
          currentRule={currentRule}
          updateRule={updateRule}
        />
      </div>
    </div>;
});
