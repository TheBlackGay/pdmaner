import React, { useRef, useEffect, useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import {FixedSizeList as List} from 'react-window';

import { Icon, FormatMessage } from 'components';
import Option from './Option';
import { addBodyClick, removeBodyClick } from '../../lib/listener';
import './style/index.less';
import {getPrefix} from '../../lib/prefixUtil';

const MultipleSelect = React.memo(({prefix, children, dropdownRender, allowClear = true,
                                     defaultCheckValues, showNotMatch = false, className,
                                     onChange, simple = false, disable, searchType = 'focus',
                                     ...restProps}) => {
  const inputRef = useRef(null);
  const optionsRef = useRef(null);
  const selectRef = useRef(null);
  const inputOffsetRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const id = useMemo(() => Math.uuid(), []);
  const [checkValues, updateCheckValues] = useState(() => {
    if ('checkValue' in restProps) {
      return restProps.checkValue;
    }
    return defaultCheckValues || [];
  });
  const [searchValue, updateSearch] = useState('');
  const currentPrefix = getPrefix(prefix);
  useEffect(() => {
    const { current } = selectRef;
    addBodyClick(id, (e) => {
      const target = e.target;
      if (!current.contains(target) && !optionsRef?.current?.contains(target)) {
        // 点击不在多选框的节点内
        setVisible(false);
        if (!simple) {
          inputRef.current.style.width = '4px';
        }
        updateSearch('');
      }
    });
    return () => {
      removeBodyClick(id);
    };
  }, []);
  const inputChange = (e) => {
    const { target } = e;
    if (!simple) {
      const { current } = inputOffsetRef;
      current.innerText = target.value;
      let width = current.clientWidth;
      inputRef.current.style.width = `${width + 2}px`;
    }
    updateSearch(target.value);
    if (showNotMatch) {
      onChange && onChange([target.value]);
    }
    if(searchType === 'value') {
      if(target.value) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    }
  };
  const valueChange = (value, e) => {
    let tempValues = [];
    if (simple) {
      tempValues = [value];
      setVisible(false);
      e.stopPropagation();
    } else if (checkValues.includes(value)) {
      tempValues = checkValues.filter(v => v !== value);
    } else {
      tempValues = checkValues.concat(value);
    }
    updateCheckValues(tempValues);
    onChange && onChange(tempValues);
    updateSearch('');
  };
  const closeClick = (value) => {
    const tempValues = checkValues.filter(v => v !== value);
    updateCheckValues(tempValues);
    onChange && onChange(tempValues);
  };
  let finalCheckValues = checkValues;
  if ('checkValue' in restProps) {
    finalCheckValues = restProps.checkValue;
  }
  const reg = new RegExp((searchValue || '').replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
  const options = [].concat(children)
      .filter(c => reg.test(c.props?.value || '') || reg.test(c.props?.children || ''));
  const finalValue = showNotMatch ? finalCheckValues[0] : searchValue;
  let needAdd = finalCheckValues[0] && showNotMatch
      && !options.some(o => o.props?.value === finalCheckValues[0]);
  const getChildren = () => {
    const menus = (options.length > 0 || needAdd)
        ? options.map(c => React.cloneElement(c, {
      checkValues: finalCheckValues,
      onChange: valueChange,
        })).concat(needAdd ? [<Option
          key='__customer_match'
          value={finalCheckValues[0]}
          checkValues={finalCheckValues}
          onChange={valueChange}
        >{finalCheckValues[0]}</Option>] : []) : <div className={`${currentPrefix}-multiple-select-empty`}>
          <FormatMessage id='components.multipleselect.empty'/>
        </div>;
    const renderList = () => {
      return <List
        height={menus.length * 31 > 200 ? 200 : menus.length * 31}
        itemCount={menus.length}
        itemSize={31}
      >
        {({index, style}) => {
          const menu = menus[index];
          return React.cloneElement(menu, {style});
        }}
      </List>;
    };
    return <div
      className={`${currentPrefix}-multiple-select-children`}
      ref={optionsRef}
    >
      {dropdownRender ? dropdownRender(renderList()) : renderList()}
    </div>;
  };
  const selectClick = (e) => {
    const { current } = inputRef;
    current && current.focus();
    if(searchType === 'focus') {
      setVisible(true);
    }
    if (!simple && (e.target !== current) && !showNotMatch) {
      inputRef.current.style.width = '4px';
      updateSearch('');
    }
  };
  const onFocus = () => {
    if(searchType === 'focus') {
      setVisible(true);
    }
  };
  const onKeyDown = (e) => {
    console.log(e.keyCode);
    if (e.keyCode === 9) {
      setVisible(false);
    }
  };
  const selected = [].concat(children).filter(c => finalCheckValues.includes(c.props.value));
  const calcPosition = (dom) => {
    const rectSelect = selectRef.current.getBoundingClientRect();
    optionsRef.current.style.opacity = 1;
    optionsRef.current.style.width = `${rectSelect.width}px`;
    optionsRef.current.style.left = `${rectSelect.x}px`;
    const rect = dom.getBoundingClientRect();
     if ((window.innerHeight - rectSelect.bottom) > rect.height) {
      optionsRef.current.style.height = 'auto';
      optionsRef.current.style.top = `${rectSelect.bottom + 1}px`;
      optionsRef.current.style.bottom = 'unset';
    } else if (((window.innerHeight - rectSelect.bottom) < rect.height)
        && (rectSelect.y > rect.height)) {
      optionsRef.current.style.height = 'auto';
      optionsRef.current.style.top = 'unset';
      optionsRef.current.style.bottom = `${window.innerHeight - rectSelect.top + 1}px`;
    } else {
      optionsRef.current.style.top = `${rectSelect.bottom + 1}px`;
      optionsRef.current.style.bottom = 'unset';
      optionsRef.current.style.height = `${window.innerHeight - rectSelect.bottom - 2}px`;
    }
  };
  useEffect(() => {
    if (visible && !disable) {
      calcPosition(optionsRef.current);
    }
  }, [visible, selected, checkValues, disable]);
  const onClear = (e) => {
    e.stopPropagation();
    updateCheckValues([]);
    onChange && onChange([]);
  };
  const getEmptyChildren = () => {
    const firstChildren = [].concat(children)[0];
    if (firstChildren && firstChildren.props.value === '') {
      return firstChildren?.props?.children;
    }
    return '';
  };
  return <div className={`${currentPrefix}-multiple-select ${className}`} onClick={selectClick} ref={selectRef}>
    <div className={`${currentPrefix}-multiple-select-data ${currentPrefix}-multiple-select-data-${disable ? 'disable' : 'default'} ${currentPrefix}-multiple-select-data-${visible ? 'focus' : 'normal'}`}>
      {simple ? <span
        title={selected[0]?.props?.children || ''}
        className={`${currentPrefix}-multiple-select-data-item-simple`}
          >{
            (searchValue || showNotMatch) ? '' : (selected[0]?.props?.children ||  getEmptyChildren())
          }{allowClear && selected[0]
          && !disable && <span
            onClick={onClear}
            className={`${currentPrefix}-multiple-select-data-item-simple-clear`}
          >
            <Icon type='fa-times-circle'/>
          </span>}
      </span> :
          selected.map((c) => {
            return <span key={c.key || c.props.value} className={`${currentPrefix}-multiple-select-data-item`}>
              <span>{c?.props?.children}</span>
              {!disable && <Icon type='fa-close' onClick={() => closeClick(c.props.value)}/>}
            </span>;
          })}
      <span
        className={`${currentPrefix}-multiple-select-data-input-placeholder`}
        style={{display: searchValue || finalCheckValues.length > 0 ? 'none' : ''}}
      >
        {restProps.placeholder || ''}
      </span>
      {
        !disable && searchType !== 'value' && <span className={`${currentPrefix}-multiple-select-data-input-icon`}>
          <Icon type='fa-angle-down'/>
        </span>
      }
      <input
        disabled={disable}
        onKeyDown={onKeyDown}
        ref={inputRef}
        onFocus={onFocus}
        onChange={inputChange}
        value={finalValue}
        className={`${currentPrefix}-multiple-select-data-${simple ? 'simple' : 'normal'}-input`}
      />
      <span
        ref={inputOffsetRef}
        className={`${currentPrefix}-multiple-select-data-hidden-input`}
      />
      {
        !disable && visible ? ReactDOM.createPortal(getChildren(), document.body) : null
      }
    </div>
  </div>;
});

MultipleSelect.Option = Option;

export default MultipleSelect;
