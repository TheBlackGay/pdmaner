import React from 'react';

import Version from './Version';
import Compare from '../compare';

export default React.memo(({versionType, ...restProps}) => {
  return <div>
    <div style={{display: versionType === '1' ? 'block' : 'none'}}>
      <Version versionType={versionType} {...restProps}/></div>
    <div style={{display: versionType === '2' ? 'block' : 'none'}}>
      <Compare versionType={versionType} {...restProps}/></div>
  </div>;
});
