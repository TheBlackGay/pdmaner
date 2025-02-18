import React  from 'react';
import { Text, FormatMessage } from 'components';

import './style/index.less';
import {getPrefix} from '../../lib/prefixUtil';

export default React.memo(({ prefix, value, onChange }) => {
  const _onChange = (e) => {
    onChange && onChange(e.target.value);
  };
  const currentPrefix = getPrefix(prefix);
  return <div className={`${currentPrefix}-note-editor`}>
    <Text placeholder={FormatMessage.string({id: 'canvas.node.remarkPlaceholder'})} rows={6} defaultValue={value} onChange={_onChange}/>
  </div>;
});
