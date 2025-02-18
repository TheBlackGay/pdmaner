import React, {useState, useCallback, useMemo, useRef, useEffect} from 'react';
import _ from 'lodash';

import { FormatMessage, Input, Text, Table, MultipleSelect, Radio, Checkbox, FieldSet, Icon } from 'components';

import './style/index.less';
import {getPrefix} from '../../../lib/prefixUtil';
import {emptyField, getDefaultLogicSys, getLogicHeaders} from '../../../lib/datasource_util';

export default React.memo(({prefix, dataSource, data, dataChange, getDataSource,
                               hasRender, hasDestory, param, isTab, group}) => {
    const CheckboxGroup = Checkbox.CheckboxGroup;
    const Option = MultipleSelect.Option;
    const RadioGroup = Radio.RadioGroup;
    const tableRef = useRef(null);
    const currentPrefix = getPrefix(prefix);
    const fieldsData = data.fields || [];
    const [currentData, setCurrentData] = useState({
        ...data,
        group: data.group || group,
        sysProps: {
            ...getDefaultLogicSys(),
            ...data.sysProps,
        },
    });
    const ready = (table) => {
        tableRef.current = table;
    };
    const _dataChange = (value, name) => {
        setCurrentData((pre) => {
            dataChange && dataChange(value, name);
            const temp = {...pre};
            if(name === 'sysProps.lePropOrient'){
                if(value === 'H') {
                    temp.sysProps = {
                        ...temp.sysProps,
                        propShowFields: ['N'],
                    };
                } else {
                    temp.sysProps = {
                        ...temp.sysProps,
                        propShowFields: ['N', 'K', 'T'],
                    };
                }
                dataChange && dataChange(temp.sysProps.propShowFields, 'sysProps.propShowFields');
            }
            return _.set(temp, name, value);
        });
    };
    const onParse = () => {
        if(currentData.quickEntry) {
            const result = currentData.quickEntry
                .replace(/\s/g, '')
                .replace(/[；;]/g, ',')
                .replaceAll('，', ',')
                .replaceAll('）', ')')
                .replaceAll('（', '(');
            const fields = (result.match(/(?<=\().*(?=\))/)[0]?.split(',') || []).map((f) => {
                return {
                    id: Math.uuid(),
                    ...emptyField,
                    extProps: dataSource.profile?.extProps || {},
                    defName: f,
                    defKey: '',
                };
            });
            dataChange && dataChange(fields, 'fields');
            tableRef.current.updateTableData((pre) => {
                return {
                    ...pre,
                    fields,
                };
            });
            const defName = result.split('(')[0] || '';
            setCurrentData((pre) => {
                dataChange && dataChange(defName, 'defName');
                return {
                    ...pre,
                    defName,
                    defKey: '',
                    fields,
                };
            });
        }
    };
    const headers = getLogicHeaders();
    const search = useCallback((f, value) => {
      const reg = new RegExp((value || '')
          .replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
      return reg.test(f.defName) || reg.test(f.defKey);
    }, []);
    const Info = () => {
      return <span className={`${currentPrefix}-logic-entity-suggest`}>
        <Checkbox checked={_.get(currentData, 'sysProps.fieldInputSuggest', false)} onChange={e => _dataChange(e.target.checked, 'sysProps.fieldInputSuggest')}><FormatMessage id='logicEntity.suggest'/></Checkbox>
      </span>;
    };
    const allFieldOptions = useMemo(() => {
        if(currentData.sysProps.fieldInputSuggest) {
            const getFields = (name, type) => {
              return (dataSource[name] || [])
                  .reduce((a, b) => a.concat((b.fields || [])
                      .map(f => ({...f, parent: `${type}-${b.defName || b.defKey}`}))), []);
            };
            return getFields('entities', FormatMessage.string({id: 'tableBase.table'}))
                .concat(getFields('logicEntities', FormatMessage.string({id: 'menus.logicEntity'})))
                .concat(getFields('standardFields', FormatMessage.string({id: 'standardFields.isStandard'})));
        }
        return null;
    }, [currentData.sysProps.fieldInputSuggest]);
    useEffect(() => {
        hasRender && hasRender({
            twinkle: (key) => {
                tableRef.current?.twinkleTr(key);
            },
        });
        return () => {
            hasDestory && hasDestory();
        };
    }, []);
    const renderTable = () => {
      return <Table
        twinkle={param?.defKey}
        allFieldOptions={allFieldOptions}
        search={search}
        needHideInGraph={false}
        disableHeaderIcon
        disableHeaderSort
        customerHeaders={headers}
        disableHeaderReset
        info={<Info/>}
        disableAddStandard
        freeze={false}
        getDataSource={() => {
              return getDataSource ?  getDataSource() : dataSource;
          }}
        hasRender={hasRender}
        ready={ready}
        data={{
              fields: fieldsData,
          }}
        tableType='logicEntity'
        dataSource={dataSource}
        tableDataChange={fields => _dataChange(fields, 'fields')}
      />;
    };
    const renderTabFields = () => {
      return <FieldSet
        style={{overflow: 'auto'}}
        expandEnable={false}
        title={
          <span>
            <Icon type='icon-ziduanmingxi'/>
            <span>{FormatMessage.string({id: 'logicEntity.fields'})}</span>
          </span>
          }
      >
        <div
          style={{width: '100%', height: '100%'}}
          >
          {renderTable()}
        </div></FieldSet>;
    };
    const renderNewFields = () => {
      return <div className={`${currentPrefix}-form-item ${currentPrefix}-logic-entity-fields`}>
        <span
          className={`${currentPrefix}-form-item-label`}
          title={FormatMessage.string({id: 'logicEntity.fields'})}
        >
          <FormatMessage id='logicEntity.fields'/>
        </span>
        <span className={`${currentPrefix}-form-item-component`} >
          {renderTable()}
        </span>
      </div>;
    };
    return <div className={`${currentPrefix}-logic-entity ${currentPrefix}-logic-entity-${isTab ? 'tab' : 'new'}`}>
      {!isTab && <div className={`${currentPrefix}-form`}>
        <div className={`${currentPrefix}-form-item ${currentPrefix}-logic-entity-quick-item`}>
          <span
            className={`${currentPrefix}-form-item-label`}
            title={FormatMessage.string({id: 'logicEntity.quickEntry'})}
        >
            <span>
              <FormatMessage id='logicEntity.quickEntry'/>
            </span>
          </span>
          <span className={`${currentPrefix}-form-item-component ${currentPrefix}-logic-entity-quick`}>
            <Text
              placeholder={FormatMessage.string({id: 'logicEntity.quickEntryHolder'})}
              onChange={e => _dataChange(e.target.value, 'quickEntry')}
            />
            <div onClick={onParse} className={`${currentPrefix}-logic-entity-quick-parse`}>
              <FormatMessage id='logicEntity.parse'/>
            </div>
          </span>
        </div>
        </div>}
      <div className={`${currentPrefix}-form ${currentPrefix}-logic-entity-row`}>
        <div className={`${currentPrefix}-form-item`}>
          <span
            className={`${currentPrefix}-form-item-label`}
            title={FormatMessage.string({id: 'logicEntity.defKey'})}
        >
            <span>
              <FormatMessage id='logicEntity.defKey'/>
            </span>
          </span>
          <span className={`${currentPrefix}-form-item-component`}>
            <Input
              value={currentData?.defKey}
              maxLength={64}
              placeholder={FormatMessage.string({id: 'logicEntity.defKeyHolder'})}
              onChange={e => _dataChange(e.target.value, 'defKey')}
          />
          </span>
        </div>
        <div className={`${currentPrefix}-form-item`}>
          <span
            className={`${currentPrefix}-form-item-label`}
            title={FormatMessage.string({id: 'logicEntity.defName'})}
        >
            <span>
              <FormatMessage id='logicEntity.defName'/>
            </span>
          </span>
          <span className={`${currentPrefix}-form-item-component`}>
            <Input
              value={currentData?.defName}
              maxLength={64}
              placeholder={FormatMessage.string({id: 'logicEntity.defNameHolder'})}
              onChange={e => _dataChange(e.target.value, 'defName')}
          />
          </span>
        </div>
      </div>
      <div className={`${currentPrefix}-form-item`}>
        <span
          className={`${currentPrefix}-form-item-label`}
          title={FormatMessage.string({id: 'logicEntity.group'})}
        >
          <FormatMessage id='logicEntity.group'/>
        </span>
        <span className={`${currentPrefix}-form-item-component`}>
          <MultipleSelect
            onChange={keys => _dataChange(keys, 'group')}
            defaultCheckValues={currentData?.group}
          >
            {
                dataSource?.viewGroups?.map(v => (
                  <Option key={v.id} value={v.id}>{`${v.defKey}(${v.defName || v.defKey})`}</Option>))
            }
          </MultipleSelect>
        </span>
      </div>
      <div className={`${currentPrefix}-form-item`}>
        <span
          className={`${currentPrefix}-form-item-label`}
          title={FormatMessage.string({id: 'logicEntity.lePropOrient'})}
      >
          <FormatMessage id='logicEntity.lePropOrient'/>
        </span>
        <span className={`${currentPrefix}-form-item-component`}>
          <span>
            <RadioGroup
              name='lePropOrient'
              onChange={e => _dataChange(e.target.value, 'sysProps.lePropOrient')}
              defaultValue={currentData.sysProps.lePropOrient}>
              <Radio value='V'>
                <FormatMessage id='logicEntity.V'/>
              </Radio>
              <Radio value='H'>
                <FormatMessage id='logicEntity.H'/>
              </Radio>
            </RadioGroup>
            <span
              className={`${currentPrefix}-logic-entity-message`}
            >
              <FormatMessage id='logicEntity.lePropOrientMessage'/>
            </span>
          </span>
        </span>
      </div>
      <div className={`${currentPrefix}-form-item`}>
        <span
          className={`${currentPrefix}-form-item-label`}
          title={FormatMessage.string({id: 'logicEntity.propShowFields'})}
        >
          <FormatMessage id='logicEntity.propShowFields'/>
        </span>
        <span className={`${currentPrefix}-form-item-component`}>
          {currentData.sysProps.lePropOrient === 'H' ? <span>
            <RadioGroup
              name='lePropOrient'
              onChange={e => _dataChange(e.target.value, 'sysProps.propShowFields')}
              defaultValue={currentData.sysProps.propShowFields[0]}>
              <Radio value='K'>
                {headers[0].value}
              </Radio>
              <Radio value='N'>
                {headers[1].value}
              </Radio>
            </RadioGroup>
            <span
              className={`${currentPrefix}-logic-entity-message`}
             >
              <FormatMessage id='logicEntity.propShowFieldsMessage'/>
            </span>
          </span> :
          <span>
            <CheckboxGroup
              onChange={e => _dataChange(e.target.value, 'sysProps.propShowFields')}
              defaultValue={currentData.sysProps.propShowFields}
            >
              <Checkbox key='K' value='K'>
                <span>
                  {headers[0].value}
                </span>
              </Checkbox>
              <Checkbox key='N' value='N'>
                <span>
                  {headers[1].value}
                </span>
              </Checkbox>
              <Checkbox key='T' value='T'>
                <span>
                  {headers[3].value}
                </span>
              </Checkbox>
            </CheckboxGroup>
            <span
              className={`${currentPrefix}-logic-entity-message`}
            >
              <FormatMessage id='logicEntity.propShowFieldsMessage'/>
            </span>
          </span>}
        </span>
      </div>
      {isTab && <FieldSet
        title={
          <span>
            <Icon type='icon-xiangximiaoshu'/>
            <span>{FormatMessage.string({id: 'tableBase.other'})}</span>
          </span>
         }
        defaultExpand={false}
      >
        <div className={`${currentPrefix}-form-item`}>
          <span
            className={`${currentPrefix}-form-item-label`}
            title={FormatMessage.string({id: 'tableBase.nameTemplate'})}
                >
            <FormatMessage id='tableBase.nameTemplate'/>
          </span>
          <span className={`${currentPrefix}-form-item-component`}>
            <Input defaultValue={currentData.sysProps?.nameTemplate || '{defKey}[{defName}]'} onChange={e => onChange(e, 'sysProps.nameTemplate')}/>
          </span>
        </div>
        <div className={`${currentPrefix}-form-item`}>
          <span
            className={`${currentPrefix}-form-item-label`}
            title={FormatMessage.string({id: 'tableBase.comment'})}
              >
            <FormatMessage id='tableBase.comment'/>
          </span>
          <span className={`${currentPrefix}-form-item-component`}>
            <Text rows={3} defaultValue={currentData.comment} onChange={e => onChange(e, 'comment')}/>
          </span>
        </div>
        </FieldSet>}
      {
            isTab ? renderTabFields() : renderNewFields()
        }
    </div>;
});
