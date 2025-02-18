import React from 'react';
import { Button as SemiButton } from '@douyinfe/semi-ui';
import { IconLoading } from '@douyinfe/semi-icons';
import ButtonGroup from './Group';

const Button = React.memo(({ key, type, active, children, onClick, disable, style, loading }) => {
  const _onClick = (e) => {
    if (!disable && !loading) {
      onClick && onClick(e, {
        updateStatus: () => {}, // 保持兼容性
      });
    }
  };

  const getButtonType = () => {
    switch(type) {
      case 'primary': return 'primary';
      case 'danger': return 'danger';
      case 'default':
      default: return 'default';
    }
  };

  return (
    <SemiButton
      style={style}
      key={key}
      type={getButtonType()}
      className={active ? 'semi-button-active' : ''}
      onClick={_onClick}
      disabled={disable}
      loading={loading}
    >
      {children}
    </SemiButton>
  );
});

Button.ButtonGroup = ButtonGroup;
Button.defaultProps = {
  type: 'default',
};

export default Button;
