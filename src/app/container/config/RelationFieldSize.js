import React from 'react';
import {NumberInput, FormatMessage, Icon, Tooltip} from 'components';
import {getPrefix} from '../../../lib/prefixUtil';

export default React.memo(({prefix, dataChange, dataSource}) => {
  const { relationFieldSize = 15 } = (dataSource.profile || {});
  const onChange = (e) => {
    dataChange && dataChange(e.target.value, 'profile.relationFieldSize');
  };
  const currentPrefix = getPrefix(prefix);
  return <div className={`${currentPrefix}-setting-relationsize`}>
    <div className={`${currentPrefix}-form-item`}>
      <span
        className={`${currentPrefix}-form-item-label`}
        title={FormatMessage.string({id: 'config.relationFieldSize'})}
      >
        <FormatMessage id='config.relationFieldSize'/>
        <FormatMessage id='config.relationFieldSizeDiscard'/>
        <Tooltip placement='left' title={<FormatMessage id='config.relationFieldSizeDiscardTitle'/>} force>
              <span className={`${currentPrefix}-form-item-label-help`}>
                <Icon type='icon-xinxi'/>
              </span>
        </Tooltip>
      </span>
      <span className={`${currentPrefix}-form-item-component`}>
        <NumberInput disable onChange={onChange} defaultValue={relationFieldSize}/>
      </span>
    </div>
  </div>
});
