import React from 'react';

import { FormatMessage } from 'components';

export default React.memo(({prefix, openHome}) => {
  return <div className={`${prefix}-main-message`}>
    <div className={`${prefix}-main-message-home`} onClick={openHome}><FormatMessage id='quick.home'/></div>
    <div><span>Ctrl/Command + S</span><span><FormatMessage id='quick.save'/></span></div>
    <div><span>Ctrl/Command + Shift + U</span><span><FormatMessage id='quick.toggleCase'/></span></div>
    <div><FormatMessage id='quick.minimap'/></div>
    <div><FormatMessage id='quick.drag'/></div>
    <div><FormatMessage id='quick.find'/></div>
  </div>;
});
