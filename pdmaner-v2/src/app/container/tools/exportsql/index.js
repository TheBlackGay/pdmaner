import React, { useState, useRef, useEffect } from 'react';
import {
  FormatMessage,
  Select,
  Icon,
  Radio,
  Checkbox,
  Button,
  openModal,
  CodeEditor,
  Download,
    Loading,
} from 'components';
import moment from 'moment';
import _ from 'lodash/object';

import EntitySelect from './EntitySelect';
import {getPrefix} from '../../../../lib/prefixUtil';
import './style/index.less';
import {separator} from '../../../../../profile';
import {postWorkerFuc} from '../../../../lib/event_tool';

const CheckboxGroup = Checkbox.CheckboxGroup;
const RadioGroup = Radio.RadioGroup;
const Option = Select.Option;

export default React.memo(({prefix, dataSource, templateType}) => {
  const entitySelectErf = useRef(null);
  const defaultTemplate = ['createTable', 'createIndex', 'content'];
  const templateRef = useRef(defaultTemplate);
  const [selected, setSelected] = useState(null);
  const [dataType, setDataType] = useState('all');
  const currentPrefix = getPrefix(prefix);
  const dataTypeSupports = _.get(dataSource, 'profile.dataTypeSupports', []);
  const defaultDb = _.get(dataSource, 'profile.default.db', dataTypeSupports[0]?.id);
  const codeTemplates = _.get(dataSource, 'profile.codeTemplates', []);
  const [visible, setVisible] = useState(false);
  const [codeData, setCodeData] = useState('');
  const getCode = (template, select, db) => {
    setVisible(true);
    postWorkerFuc('utils._getAllDataSQLByFilter', true, [
      dataSource,
      templateType === 'dict' ? 'dictSQLTemplate' : (db || defaultDb),
      template || templateRef.current,
      select,
    ]).then((res) => {
      setCodeData(res);
    }).finally(() => {
      setVisible(false);
    });
  };
  useEffect(() => {
    getCode();
  }, []);
  const [dataTypeSupport, setDataTypeSupport] = useState(() => {
    return codeTemplates.filter(c => c.applyFor === defaultDb)[0];
  });
  const [mode, setMode] = useState(dataTypeSupport?.type === 'appCode' ? dataTypeSupport.applyFor : 'sql');
  const onChange = (e) => {
    setDataTypeSupport(codeTemplates.filter(c => c.applyFor === e.target.value)[0]);
  };
  const onTypeChange = (e) => {
    setDataType(e.target.value);
    if (e.target.value === 'all') {
      templateRef.current = [...defaultTemplate];
    }
  };
  const _pickEntity = () => {
    let modal;
    const onOk = () => {
      setSelected(entitySelectErf.current.getCheckeds());
      modal.close();
    };
    const onCancel = () => {
      modal.close();
    };
    modal = openModal(<EntitySelect
      templateType={templateType}
      ref={entitySelectErf}
      prefix={currentPrefix}
      dataSource={dataSource}
      defaultCheckeds={selected}
    />, {
      title: FormatMessage.string({id: `exportSql.${templateType === 'dict' ? 'pickDict' : 'pickEntity'}`}),
      buttons: [
        <Button onClick={onOk} key='ok' type='primary'><FormatMessage id='button.ok'/></Button>,
        <Button onClick={onCancel} key='cancel'><FormatMessage id='button.cancel'/></Button>,
      ],
    });
  };
  const templateChange = (e) => {
    templateRef.current = e.target.value;
  };
  const exportDDL = () => {
    Download(
        [codeData],
        'application/sql', `${dataSource.name}-DDL-${moment().format('YYYYMDHHmmss')}.sql`);
  };
  const onPreview = () => {
    const template = (dataTypeSupport.type === 'appCode' || templateType === 'dict')
        ? ['content'] : templateRef.current.filter(t => t !== 'content');
    getCode(template, selected?.reduce((a, b) => {
      const tempA = {...a};
      const type = b.split(separator);
      if (!tempA[type[1]]) {
        tempA[type[1]] = [];
      }
      tempA[type[1]].push(type[2]);
      return tempA;
    }, {}), dataTypeSupport.applyFor);
    setMode(dataTypeSupport?.type === 'appCode' ? dataTypeSupport.applyFor : 'sql');
  };
  const _codeChange = (code) => {
    setCodeData(code);
  };
  return <Loading visible={visible}>
    <div className={`${currentPrefix}-export-sql`}>
      <div className={`${currentPrefix}-export-sql-left`}>
        {
            templateType !== 'dict' && <div className={`${currentPrefix}-form-item`}>
              <span
                className={`${currentPrefix}-form-item-label`}
                title={FormatMessage.string({id: 'project.dataTypeSupport'})}
          >
                <FormatMessage id='project.dataTypeSupport'/>
              </span>
              <span className={`${currentPrefix}-form-item-component`}>
                <Select
                  notAllowEmpty
                  allowClear={false}
                  defaultValue={defaultDb}
                  onChange={onChange}
            >
                  {dataTypeSupports
                  .filter((t) => {
                    return codeTemplates
                        .filter(c => c.applyFor === t.id && c.type === 'dbDDL')[0];
                  }).map(type => (<Option
                    key={type.id}
                    value={type.id}
                  >
                    {type.defKey}
                  </Option>))}
                </Select>
              </span>
            </div>
        }
        <div className={`${currentPrefix}-form-item`}>
          <span
            className={`${currentPrefix}-form-item-label`}
            title={FormatMessage.string({id: `exportSql.${templateType === 'dict' ? 'dict' : 'entity'}`})}
        >
            <FormatMessage id={`exportSql.${templateType === 'dict' ? 'dict' : 'entity'}`}/>
          </span>
          <span className={`${currentPrefix}-form-item-component`}>
            <span className={`${currentPrefix}-export-sql-pick`}>
              <span>
                {
                selected ? FormatMessage.string({
                      id: `exportSql.${templateType === 'dict' ? 'currentSelectDict' : 'currentSelectEntity'}`,
                      data: {count: selected.length},
                    })
                    : FormatMessage.string({
                      id: `exportSql.${templateType === 'dict' ? 'exportDictAll' : 'exportEntityAll'}`})
              }
              </span>
              <span
                onClick={_pickEntity}
                title={FormatMessage.string({
                  id: `exportSql.${templateType === 'dict' ? 'pickDict' : 'pickEntity'}`})}>
                <Icon type='fa-ellipsis-h'/>
              </span>
            </span>
          </span>
        </div>
        {
            templateType !== 'dict' &&  <div className={`${currentPrefix}-form-item`}>
              <span
                className={`${currentPrefix}-form-item-label`}
                title={FormatMessage.string({id: 'exportSql.exportData'})}
          >
                <FormatMessage id='exportSql.exportData'/>
              </span>
              <span className={`${currentPrefix}-form-item-component`}>
                <span>
                  <RadioGroup defaultValue='all' onChange={onTypeChange}>
                    <Radio value='customer'>
                      <FormatMessage id='exportSql.exportType[0]'/>
                    </Radio>
                    <Radio value='all'>
                      <FormatMessage id='exportSql.exportType[1]'/>
                    </Radio>
                  </RadioGroup>
                </span>
              </span>
            </div>
        }
        {
            dataType === 'customer' && <div className={`${currentPrefix}-form-item`}>
              <span
                className={`${currentPrefix}-form-item-label`}
                title={FormatMessage.string({id: 'exportSql.exportCustomerData'})}
          >
                <FormatMessage id='exportSql.exportCustomerData'/>
              </span>
              <span className={`${currentPrefix}-form-item-component`}>
                <span className={`${currentPrefix}-export-sql-type`}>
                  <CheckboxGroup
                    onChange={templateChange}
                    defaultValue={defaultTemplate}
              >
                    {
                  dataTypeSupport.type === 'appCode' ? [<Checkbox key='content' value='content'>
                    <span>
                      <FormatMessage id='exportSql.exportType[4]'/>
                    </span>
                  </Checkbox>] : [
                    <Checkbox key='createTable' value='createTable'>
                      <span>
                        <FormatMessage id='exportSql.exportType[2]'/>
                      </span>
                    </Checkbox>,
                    <Checkbox key='createIndex' value='createIndex'>
                      <span>
                        <FormatMessage id='exportSql.exportType[3]'/>
                      </span>
                    </Checkbox>,
                  ]
                }
                  </CheckboxGroup>
                </span>
              </span>
            </div>
        }
        <div>
          <Button type='primary' onClick={onPreview}><FormatMessage id='exportSql.preview'/></Button>
        </div>
      </div>
      <div className={`${currentPrefix}-export-sql-right`}>
        <div><Button type='primary' onClick={exportDDL}><FormatMessage id='exportSql.export'/></Button></div>
        <div>
          <CodeEditor
            mode={mode}
            value={codeData}
            width='auto'
            height='calc(80vh - 45px)'
            onChange={e => _codeChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  </Loading>;
});
