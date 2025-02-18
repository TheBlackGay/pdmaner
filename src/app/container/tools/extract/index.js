import React from 'react';
import { Input, FormatMessage } from 'components';
import {getPrefix} from '../../../../lib/prefixUtil';

export default React.memo(({data, prefix, dataChange}) => {
    const currentPrefix = getPrefix(prefix);
    const messageName = data.type === 'P' ? 'tableBase' : 'logicEntity';
    return <div>
      <div className={`${currentPrefix}-form-item`}>
        <span
          className={`${currentPrefix}-form-item-label`}
          title={FormatMessage.string({id: `${messageName}.defKey`})}
            >
          <FormatMessage id={`${messageName}.defKey`}/>
        </span>
        <span className={`${currentPrefix}-form-item-component`}>
          <Input maxLength={64} defaultValue={data.defKey} onChange={e => dataChange(e, 'defKey')}/>
        </span>
      </div>
      {data.type === 'L' && <div className={`${currentPrefix}-form-item`}>
        <span
          className={`${currentPrefix}-form-item-label`}
          title={FormatMessage.string({id: `${messageName}.defName`})}
        >
          <FormatMessage id={`${messageName}.defName`}/>
        </span>
        <span className={`${currentPrefix}-form-item-component`}>
          <Input maxLength={32} defaultValue={data.defName} onChange={e => dataChange(e, 'defName')}/>
        </span>
        </div>}
    </div>;
});
