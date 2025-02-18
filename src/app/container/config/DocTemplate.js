import React, { useState } from 'react';
import {Button, Icon, Input, openModal, Upload, FormatMessage, CodeEditor} from 'components';
import {getPrefix} from '../../../lib/prefixUtil';
import model from '../../../lib/workModel.json';


export default React.memo(({ prefix, dataSource, dataChange, onOk }) => {
  const [value, updateValue] = useState(dataSource?.profile?.generatorDoc?.docTemplate || '');
  const selectWordFile = () => {
    Upload('application/vnd.openxmlformats-officedocument.wordprocessingml.document', (file) => {
      updateValue(file.path);
      dataChange && dataChange(file.path, 'profile.generatorDoc.docTemplate');
    }, (f) => {
      return f.name.endsWith('.docx');
    }, false);
  };
  const onChange = (e) => {
    updateValue(e.target.value);
    dataChange && dataChange(e.target.value, 'profile.generatorDoc.docTemplate');
  };
  const _openModal = () => {
    let modal
    const close = () => {
      modal && modal.close();
    };
    modal = openModal(<div className={`${currentPrefix}-setting-doc-template-preview`}>
      <CodeEditor
          mode='json'
          value={JSON.stringify(model, null, 2)}
          width='800px'
          height='400px'
      />
    </div>, {
      bodyStyle: {width: '810px'},
      title: FormatMessage.string({id: 'config.PreviewModal'}),
      buttons: [<Button key='close' onClick={close}><FormatMessage id='button.close'/></Button>]
    });
  };
  const currentPrefix = getPrefix(prefix);
  return <div className={`${currentPrefix}-setting-doc-template`}>
    <div className={`${currentPrefix}-form-item`}>
      <span className={`${currentPrefix}-form-item-component`}>
        <Input
          placeholder={FormatMessage.string({id: 'config.DocTemplatePlaceholder'})}
          onChange={onChange}
          value={value}
          suffix={<span className={`${currentPrefix}-setting-doc-template-opt`}>
            <Button onClick={selectWordFile}>
              <FormatMessage id='config.DocTemplatePicker'/>
            </Button>
            <Button onClick={_openModal}>
              <FormatMessage id='config.PreviewModal'/>
            </Button>
            <Button type='primary' onClick={onOk}>
              <FormatMessage id='config.DocSave'/>
            </Button>
          </span>}
        />
      </span>
    </div>
  </div>;
});
