import React from 'react';
import ReactDOM from 'react-dom';

import Icon from '../icon';
import './style/index.less';
import {getPrefix} from '../../lib/prefixUtil';

export const Loading = React.memo(({title, children, prefix,
                                     visible = false, isFull = true}) => {
  const currentPrefix = getPrefix(prefix);
  return (
    <React.Fragment>
      <div className={`${currentPrefix}-loading ${isFull ? '' : `${currentPrefix}-normal-loading`} ${currentPrefix}-loading-${visible ? 'show' : 'hidden'}`}>
        <div className={`${currentPrefix}-loading-bg`}>
          <div className={`${currentPrefix}-loading-content`}>
            <Icon type='fa-spinner'/>
            <span>{title}</span>
          </div>
        </div>
        {isFull ? '' : children}
      </div>
      {isFull ? children : ''}
    </React.Fragment>
  );
});

export const openLoading = (title) => {
  const currentPrefix = getPrefix();
  const loadingDom = document.createElement('div');
  loadingDom.setAttribute('id', `${currentPrefix}-loading`);
  document.body.appendChild(loadingDom);
  ReactDOM.render(<Loading title={title} visible/>, loadingDom);
};

export const closeLoading = () => {
  const currentPrefix = getPrefix();
  const loadingDom = document.getElementById(`${currentPrefix}-loading`);
  loadingDom && loadingDom.parentElement.removeChild(loadingDom);
};
