import React, { useState, forwardRef, useCallback, useImperativeHandle } from 'react';

import './style/index.less';
import Input from 'components/input';
import Icon from 'components/icon';
import {getPrefix} from '../../lib/prefixUtil';
import {antiShake} from '../../lib/event_tool';

export default React.memo(forwardRef(({prefix, placeholder, onChange, onBlur,
                                        defaultValue, comRef}, ref) => {
  const currentPrefix = getPrefix(prefix);
  const [value, setValue] = useState(defaultValue);
  const [loading, setLoading] = useState(false);
  useImperativeHandle(comRef, () => {
    return {
      resetSearchValue: () => {
        setValue('');
      },
    };
  }, []);
  const antiShakeFuc = useCallback(antiShake((v) => {
    setLoading(true);
    const result = onChange && onChange({
      target: {
        value: v.trim(),
      },
    });
    if(result && result.then) {
      result.finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }), []);
  const _onChange = (e) => {
    setValue(e.target.value);
    antiShakeFuc(e.target.value);
  };
  return <div className={`${currentPrefix}-search-input ${loading ? `${currentPrefix}-search-input-loading` : ''}`} ref={ref}>
    <Icon className={`${currentPrefix}-search-input-icon`} type='icon-sousuo'/>
    <Input value={value} placeholder={placeholder} onChange={_onChange} onBlur={onBlur}/>
    {loading && <Icon type='fa-spinner'/>}
  </div>;
}));
