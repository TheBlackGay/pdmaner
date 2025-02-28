import React, {useEffect} from 'react';

import { Loading, Modal, FormatMessage, ToolBar } from 'components';
import './style/index.less';
import { fail, pageType, READING} from '../../lib/variable';
import Main from '../main';
import Home from './Home';
import {getPrefix} from '../../lib/prefixUtil';

export default React.memo(({prefix, open, create, rename, updateHistory, openTemplate,
                             ...restProps}) => {
  const { lang = 'zh' } = restProps?.config;
  const status = restProps?.common?.status;
  const type = restProps?.common?.type;
  const currentPrefix = getPrefix(prefix);
  // 判断是否是子窗口
  const childPath = window.location.search.split('path=')[1];
  const _open = (path, mode) => {
    open(FormatMessage.string({id: 'readProject'}), path, null, false, mode);
  };
  const _openTemplate = (data, t) => {
    openTemplate(data, t, FormatMessage.string({id: 'readProject'}));
  };
  const _create = (data, path) => {
    create(data, path, FormatMessage.string({id: 'createProject'}));
  };
  const _rename = (newData, oldData, dataInfo) => {
    rename(newData, oldData, FormatMessage.string({id: 'renameProject'}), dataInfo);
  };
  const _deleteProject = (h) => {
    restProps?.delete(h, FormatMessage.string({id: 'deleteProject'}));
  };
  if (status === fail) {
    Modal.error({title: FormatMessage.string({id: 'optFail'}), message: restProps?.common?.result.toString()});
  }
  useEffect(() => {
    if(childPath) {
      _open(decodeURI(childPath), READING);
    }
  }, []);
  return <Loading visible={restProps?.common.loading} title={restProps?.common.title}>
    <ToolBar
      mode={restProps?.mode}
      resizeable
      title={<FormatMessage id='system.title'/>}
      info={!(type === pageType[2]) ? '' : (restProps.projectInfo || <FormatMessage id='system.template'/>)}
    />
    {!(type === pageType[2]) ? <Home
      updateHistory={updateHistory}
      importProject={_open}
      createProject={_create}
      renameProject={_rename}
      deleteProject={_deleteProject}
      openTemplate={_openTemplate}
      lang={lang}
      config={restProps?.config}
    /> : <Main
      {...restProps}
      isChildWindow={childPath}
      mode={restProps?.mode}
      openTemplate={_openTemplate}
      prefix={currentPrefix}
      open={open}
    />}
  </Loading>;
});
