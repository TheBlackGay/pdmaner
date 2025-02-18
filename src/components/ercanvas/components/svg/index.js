import React from 'react';
import {getPrefix} from '../../../../lib/prefixUtil';

import './style/index.less';

export default React.memo(({isArrow = true, type, rotate, reverse = false, prefix, className = '', ...restProps}) => {
    const currentPrefix = getPrefix(prefix);
    return <div {...restProps} className={`${currentPrefix}-er-svg-icon ${className}`}>
      <svg style={{width: '32px', height: '32px', transform: `rotate(${rotate || (reverse ? '180' : '0')}deg)`}}>
        {
            // eslint-disable-next-line no-nested-ternary
            type?.startsWith('#') ? <use xlinkHref={type} fill="" /> : (isArrow ? <use xlinkHref={`#icon-arrow-type-${type}`} fill="" />
                  : <use xlinkHref={`#icon-line-${type}`} fill="" />)
          }
      </svg>
    </div>;
});
