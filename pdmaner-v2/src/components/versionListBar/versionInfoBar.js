import React, { forwardRef, useImperativeHandle, useState, useRef } from 'react';
import moment from 'moment';

import './style/index.less';
import {openModal} from 'components';
import {getPrefix} from '../../lib/prefixUtil';
import CodeEditor from '../codeeditor';
import Button from '../button';
import FormatMessage from '../formatmessage';
import { Download } from '../download';
import {getMemoryCache} from '../../lib/cache';
import {getDefaultDb} from '../../lib/datasource_util';
import {postWorkerFuc} from '../../lib/event_tool';

const VersionInfoBar = React.memo(forwardRef((props, ref) => {
  const { prefix, empty, dataSource } = props;
  const resizeRef = useRef(null);
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const [version, setVersion] = useState(null);
  const [value, setValue] = useState('');
  const currentPrefix = getPrefix(prefix);
  useImperativeHandle(ref, () => {
      return {
          setVersion: (v, changes, message, sql) => {
              setVersion({
                  v, changes, message,
              });
              setValue(sql);
          },
      };
  }, []);
  if(!version || (!version?.v?.date && version?.changes?.length === 0)) {
      return <div>{ empty }</div>;
  }
  const _codeChange = (v) => {
      setValue(v);
  };
  const exportDDL = () => {
      Download(
          [value],
          'application/sql', `${getMemoryCache('data').name}-DDL-${moment().format('YYYYMDHHmmss')}.sql`);
  };
  const showChangeData = (e, {updateStatus}) => {
      updateStatus('loading');
      postWorkerFuc('json2string', true, [version.changes],
      ).then((data) => {
          let modal;
          const onCancel = () => {
              modal.close();
          };
          modal = openModal(<CodeEditor
            style={{marginBottom: 10}}
            readOnly
            mode='json'
            width='100%'
            height='70vh'
            value={data}
          />, {
              bodyStyle: {width: '60%'},
              title: FormatMessage.string({id: 'tableBase.model'}),
              buttons: [
                <Button key='cancel' onClick={onCancel}>{FormatMessage.string({id: 'button.close'})}</Button>],
          });
      }).finally(() => {
          updateStatus('normal');
      });
  };
  const onMouseMove = (e) => {
      if (resizeRef.current?.move) {
          const offset = e.clientX - resizeRef.current.x;
          leftRef.current.style.width = `${resizeRef.current.left + offset}px`;
          rightRef.current.style.width = `${resizeRef.current.right - offset}px`;
      }
  };
  const onMouseDown = (e) => {
    console.log(e);
    resizeRef.current = {
        move: true,
        x: e.clientX,
        left: leftRef.current.clientWidth,
        right: rightRef.current.clientWidth,
    };
  };
  const onMouseLeave = () => {
      resizeRef.current = {
          move: false,
      };
  };
  return (
    <div
      className={`${currentPrefix}-version-info-container`}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onMouseUp={onMouseLeave}
    >
      <div ref={leftRef} className={`${currentPrefix}-version-info`}>
        <div className={`${currentPrefix}-version-info-h`}>
          <span>{version.v.name}</span>
          <span>{moment(version.v.date || new Date()).format('YYYY-M-D HH:mm')}</span>
          <span><Button onClick={showChangeData}><FormatMessage id='tableBase.model'/></Button></span>
        </div>
        <div className={`${currentPrefix}-version-list-card-panel`}>
          <pre>
            {version.message}
          </pre>
        </div>
      </div>
      <div className={`${currentPrefix}-version-info-scroll`} onMouseDown={onMouseDown}>{}</div>
      <div ref={rightRef} className={`${currentPrefix}-version-info-edit`}>
        <div>
          <Button type='primary' onClick={exportDDL}><FormatMessage id='exportSql.export'/></Button>
          <div className={`${currentPrefix}-version-info-edit-type`}>
            <FormatMessage id='exportSql.current'/>
            <span>{getDefaultDb(dataSource)}</span>
          </div>
        </div>
        <CodeEditor
          mode='sql'
          value={value}
          width='auto'
          height='calc(100vh - 135px)'
          onChange={e => _codeChange(e.target.value)}
          />
      </div>
    </div>
  );
}));

export default VersionInfoBar;
