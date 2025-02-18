import React, {useState, useRef, useEffect} from 'react';
import { Button, Input, Radio, CodeEditor } from 'components';
import omit from 'lodash/omit';
import Formatmessage from 'components/formatmessage';
import {getPrefix} from '../../../lib/prefixUtil';
import {checkDemoData} from '../../../lib/datasource_util';

export default React.memo(({prefix, currentRule, updateRule}) => {
    const RadioGroup = Radio.RadioGroup;
    const currentPrefix = getPrefix(prefix);
    const demoRef = useRef(null);
    const jsRef = useRef(null);
    const [result, setResult] = useState('');
    const preRule = useRef(null);
    const dragData = useRef({
      isDrag: false,
      dh: 100,
      ch: 100,
    });
    const demoDataRef = useRef(null);
    const contentCodeRef = useRef(null);
    const contentDemoRef = useRef(null);
    const onChange = (v, name) => {
      updateRule({
        ...currentRule,
        [name]: v,
      });
    };
    const onDemoChange = (v) => {
      try {
        demoDataRef.current = JSON.parse(v);
      } catch (e) {
        console.log(e.message);
      }
    };
    const onTest = () => {
      // eslint-disable-next-line no-new-func
      const myFunction = new Function('data', currentRule.programCode);
      let res = '';
      try {
        const functionResult = myFunction(demoDataRef.current);
        // eslint-disable-next-line no-nested-ternary
        res = `${Formatmessage.string({id: 'checkRule.codeResult'})}${functionResult}; ${Formatmessage.string({id: 'checkRule.checkResult'})}${functionResult ? `${Formatmessage.string({id: 'checkRule.pass'})}` : `${Formatmessage.string({id: `checkRule.${currentRule.controlIntensity === 'F' ? 'fail' : 'warring'}`})}`}`;
      } catch (e) {
        res = `${Formatmessage.string({id: 'checkRule.codeResultError'})}${e.message}`;
      }
      setResult(res);
    };
    const getDemo = (r) => {
      const demoData = checkDemoData();
      return omit(demoData.find(d => (d.applyObjectType === r.applyObjectType)
          && (d.applyFieldType === r.applyFieldType)), ['applyObjectType', 'applyFieldType']);
    };
    useEffect(() => {
      if(currentRule) {
        if(preRule.current?.id !== currentRule.id) {
          jsRef.current.setValue(currentRule?.programCode);
          demoDataRef.current = getDemo(currentRule);
          demoRef.current.setValue(JSON.stringify(demoDataRef.current, null, 2));
          setResult('');
        }
        preRule.current = currentRule;
      }
    }, [currentRule]);
    const onMouseDown = (e) => {
      dragData.current = {
        ...dragData.current,
        y: e.clientY,
        isDrag: true,
      };
    };
    const onMouseMove = (e) => {
      if(dragData.current.isDrag) {
        const offsetY = e.clientY - dragData.current.y;
        if(!((contentCodeRef.current.clientHeight === 200) && (offsetY < 0))) {
          dragData.current = {
            ...dragData.current,
            demoH: dragData.current.dh + offsetY,
            codeH: dragData.current.ch - offsetY,
          };
          contentCodeRef.current.style.height = `calc(50% - ${dragData.current.ch - offsetY}px)`;
          contentDemoRef.current.style.height = `calc(50% - ${dragData.current.dh + offsetY}px)`;
        }
      }
    };
    const onMouseLeave = () => {
      if(dragData.current.isDrag) {
        dragData.current = {
          ...dragData.current,
          isDrag: false,
          ch: dragData.current.codeH,
          dh: dragData.current.demoH,
        };
      }
    };
    const onMouseUp = () => {
      onMouseLeave();
    };
    return <div
      onMouseLeave={onMouseLeave}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      className={`${currentPrefix}-check-rule-edit-detail ${currentPrefix}-check-rule-edit-detail-${currentRule ? 'normal' : 'disable'}`}>
      {!currentRule && <div className={`${currentPrefix}-check-rule-edit-detail-readonly`} >
        <Formatmessage id='checkRule.editHelp'/>
      </div>}
      <div className={`${currentPrefix}-check-rule-edit-detail-title`}>
        <Formatmessage id='checkRule.ruleEdit'/>
      </div>
      <div className={`${currentPrefix}-check-rule-edit-detail-content-container`}>
        <div className={`${currentPrefix}-check-rule-edit-detail-content`}>
          <div className={`${currentPrefix}-check-rule-edit-detail-content-title`}>
            <Formatmessage id='checkRule.ruleBase'/>
          </div>
          <div className={`${currentPrefix}-check-rule-edit-detail-content-item`}>
            <span className={`${currentPrefix}-check-rule-edit-detail-content-item-require`}>
              <Formatmessage id='checkRule.ruleDefName'/>
            </span>
            <span>
              <Input value={currentRule?.defName} onChange={e => onChange(e.target.value, 'defName')} maxLength={30}/>
            </span>
          </div>
          <div className={`${currentPrefix}-check-rule-edit-detail-content-item ${currentPrefix}-check-rule-edit-detail-content-item-inline`}>
            <div>
              <span><Formatmessage id='checkRule.applyObject'/></span>
              <span>
                <Formatmessage id={`checkRule.${currentRule?.applyObjectType === 'L' ? 'logicEntity' : 'entity'}`}/>
              </span>
            </div>
            <div>
              <span><Formatmessage id='checkRule.controlIntensity'/></span>
              <span>
                <RadioGroup
                  onChange={e => onChange(e.target.value, 'controlIntensity')}
                  value={currentRule?.controlIntensity}>
                  <Radio value='S'>
                    <Formatmessage id='checkRule.suggest'/>
                  </Radio>
                  <Radio value='F'>
                    <Formatmessage id='checkRule.force'/>
                  </Radio>
                </RadioGroup>
              </span>
            </div>
            <div>
              <span>
                <Formatmessage id='checkRule.ruleStatus'/>
              </span>
              <span>
                <RadioGroup
                  onChange={e => onChange(e.target.value, 'enable')}
                  value={currentRule?.enable}>
                  <Radio value>
                    <Formatmessage id='checkRule.enable'/>
                  </Radio>
                  <Radio value={false}>
                    <Formatmessage id='checkRule.disable'/>
                  </Radio>
                </RadioGroup>
              </span>
            </div>
          </div>
          <div className={`${currentPrefix}-check-rule-edit-detail-content-item`}>
            <span><Formatmessage id='checkRule.ruleDesc'/></span>
            <span>
              <Input value={currentRule?.intro} onChange={e => onChange(e.target.value, 'intro')} maxLength={40}/>
            </span>
          </div>
        </div>
        <div ref={contentCodeRef} className={`${currentPrefix}-check-rule-edit-detail-content`}>
          <div className={`${currentPrefix}-check-rule-edit-detail-content-title`}>
            <Formatmessage id='checkRule.programCode'/>
          </div>
          <div>
            {'function checkItem(data){'}
          </div>
          <div className={`${currentPrefix}-check-rule-edit-detail-content-code`}>
            <CodeEditor
              ref={jsRef}
              height='100%'
              width="100%"
              mode='javascript'
              value={currentRule?.programCode}
              onChange={e => onChange(e.target.value, 'programCode')}
            />
          </div>
          <div>
            {'}'}
          </div>
          <div className={`${currentPrefix}-check-rule-edit-detail-content-test`}>
            <Button onClick={onTest} type='primary'>
              <Formatmessage id='checkRule.onTest'/>
            </Button>
            <span>{result}</span>
          </div>
        </div>
        <div ref={contentDemoRef} className={`${currentPrefix}-check-rule-edit-detail-content`}>
          <div className={`${currentPrefix}-check-rule-edit-detail-content-title`}>
            <Formatmessage id='checkRule.testDemo'/>
          </div>
          <CodeEditor
            ref={demoRef}
            height='100%'
            width="100%"
            mode='json'
            onChange={e => onDemoChange(e.target.value)}
          />
          <div
            onMouseUp={onMouseUp}
            onMouseDown={onMouseDown}
            className={`${currentPrefix}-check-rule-edit-detail-content-resize`}
          />
        </div>
      </div>
    </div>;
});
