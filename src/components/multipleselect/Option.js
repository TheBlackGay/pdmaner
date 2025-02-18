import React from 'react';

import { Icon } from 'components';
import './style/index.less';
import {getPrefix} from '../../lib/prefixUtil';

export default React.memo(({prefix, value, checkValues, children, onChange, style}) => {
  const onClick = (e) => {
    onChange && onChange(value, e);
  };
  const currentPrefix = getPrefix(prefix);
  return <span
    style={style}
    className={`${currentPrefix}-multiple-select-option ${currentPrefix}-multiple-select-option-${checkValues?.includes(value) ? 'check' : 'default'}`}
    onClick={onClick}
  >
    <span>{children}</span>
    <Icon type='fa-check'/>
  </span>;
});
