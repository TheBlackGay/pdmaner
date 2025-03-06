import React, { useState, forwardRef, useRef } from 'react';

import './style/index.less';
import {getPrefix} from '../../lib/prefixUtil';
import FormatMessage from '../formatmessage';

const Input = React.memo(forwardRef(({ prefix ,defaultValue, suffix, placeholder, readOnly,
                                       onClick, type = 'text', style, trim, accept, onKeyDown, maxLength, disable, toggleCase,
                                       ...restProps }, ref) => {
  const [stateValue, setDefaultValue]  = useState(defaultValue);
  const composition = useRef(false);
  const [isFocus, setFocus] = useState(false);
  const _onChange = (e) => {
    const { onChange } = restProps;
    if (composition.current) {
      setDefaultValue(e.target.value);
      onChange && onChange(e);
    } else {
      e.target.value = e.target.value.substr(0, maxLength);
      setDefaultValue(e.target.value);
      onChange && onChange(e);
    }

  };
  let tempValue = stateValue;
  if ('value' in restProps) {
    tempValue = restProps.value;
  }
  const toggle = (e, toggleType) => {
    const { onChange } = restProps;
    const newValue = toggleType === 'up' ? tempValue.toLocaleUpperCase() : tempValue.toLocaleLowerCase();
    setDefaultValue(newValue);
    e.target.value = newValue;
    onChange && onChange(e);
  };
  const low = (e) => {
    toggle(e, 'low');
  };
  const up = (e) => {
    toggle(e, 'up');
  };
  const _onFocus = () => {
    setFocus(true);
  };
  const _onBlur = (e) => {
    setFocus(false);
    const { onBlur, onChange } = restProps;
    const blurValue = e.target.value;
    // 去除空格
    e.target.value = trim ? blurValue.replace(/\s/g, '') : blurValue.trim();
    onBlur && onBlur(e);
    if (e.target.value !== tempValue) {
      onChange && onChange(e);
      setDefaultValue(e.target.value);
    }
  };
  const onDragStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const onCompositionEnd = (e) => {
    const { onChange } = restProps;
    e.target.value = e.target.value.substr(0, maxLength);
    setDefaultValue(e.target.value);
    onChange && onChange(e);
    composition.current = false;
  };
  const onCompositionStart = () => {
    composition.current = true;
  };
  const currentPrefix = getPrefix(prefix);
  const _onKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.keyCode === 85) {
      const { onChange } = restProps;
      const value = e.target.value === undefined ? '' : e.target.value;
      const newValue = value.toLocaleUpperCase() === value
          ? value.toLocaleLowerCase() : value.toLocaleUpperCase();
      setDefaultValue(newValue);
      e.target.value = newValue;
      onChange && onChange(e);
    }
    onKeyDown && onKeyDown(e);
    if(e.key === 'Enter' && composition.current) {
      e.stopPropagation();
    }
  };
  return (<span style={style} className={`${currentPrefix}-input ${suffix ? `${currentPrefix}-input-suffix-container` : ''}`}>
    <span className={`${currentPrefix}-input-${isFocus ? 'focus' : 'blur'}`}>
      <input
        onCompositionStart={onCompositionStart}
        onCompositionEnd={onCompositionEnd}
        onKeyDown={_onKeyDown}
        ref={ref}
        onClick={onClick}
        readOnly={readOnly}
        placeholder={placeholder}
        draggable
        disabled={disable}
        accept={accept}
        onDragStart={onDragStart}
        type={type}
        value={tempValue === 0 ? 0 : (tempValue || '')}
        onChange={_onChange}
        onFocus={_onFocus}
        onBlur={_onBlur}
      />
      {maxLength && <span className={`${currentPrefix}-input-count`}>{tempValue?.length || 0}/{maxLength}</span>}
    </span>
    {suffix && <span className={`${currentPrefix}-input-suffix`}>{suffix}</span>}
    {toggleCase && <span className={`${currentPrefix}-input-toggle`}>
      <span onClick={up}><FormatMessage id='components.input.up'/></span><span />
      <span onClick={low}><FormatMessage id='components.input.low'/></span></span>}
  </span>);
}));
export default Input;
