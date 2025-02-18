import React, { useContext } from 'react';

import { ConfigContent } from '../../lib/context';
import { _getMessage } from '../../lib/utils';
import {getMemoryCache} from '../../lib/cache';
import {CONFIG} from '../../lib/variable';

const string = (params) => {
  // 支持非react组件 纯字符串
  const config = getMemoryCache(CONFIG);
  return _getMessage({
    ...params,
    lang: config.lang,
  });
};

const FormatMessage = React.memo(({id = '', format, defaultMessage = '', data}) => {
  const { lang } = useContext(ConfigContent);
  return _getMessage({lang, id, defaultMessage, format, data});
});

FormatMessage.string = string;

export default FormatMessage;
