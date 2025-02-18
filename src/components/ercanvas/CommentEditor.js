import React, {useRef, useState} from 'react';
import {Button, FormatMessage, Icon, openDrawer, Text, Tooltip} from 'components';

import './style/index.less';
import marked from 'marked';
import {renderer} from 'components/ercanvas/components/util';
import {getPrefix} from '../../lib/prefixUtil';

const Edit = React.memo(({ prefix, data, onOK, onCancel }) => {
    const [edit, setEdit] = useState(false);
    const valueRef = useRef(data || '');
    const _onChange = (e) => {
        valueRef.current = e.target.value;
    };
    const getHtml = (str) => {
        marked.use({ renderer });
        const reg = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
        return marked(str).replace(reg, '');
    };
    const currentPrefix = getPrefix(prefix);
    return <div className={`${currentPrefix}-comment-editor`}>
      <div className={`${currentPrefix}-comment-editor-content`}>
        {
              // eslint-disable-next-line no-nested-ternary
              edit ? <Text placeholder={FormatMessage.string({id: 'canvas.node.commentPlaceholder'})} defaultValue={valueRef.current} onChange={_onChange}/>
                  // eslint-disable-next-line max-len,react/no-danger
                  : (valueRef.current ? <pre dangerouslySetInnerHTML={{__html: getHtml(valueRef.current)}} />
                      : <span><FormatMessage id='canvas.node.commentEmpty'/></span>)
          }
      </div>
      <div className={`${currentPrefix}-comment-editor-footer`}>
        <Button onClick={() => setEdit(!edit)} type='primary'>
          {
                edit ?  <FormatMessage id='button.preview'/> :  <FormatMessage id='button.edit'/>
            }
        </Button>
        <Button onClick={() => onOK(valueRef.current)} type='primary'>
          <FormatMessage id='button.save'/>
        </Button>
        <Button onClick={onCancel}>
          <FormatMessage id='button.cancel'/>
        </Button>
      </div>
    </div>;
});


export default React.memo(({data, commentChange, currentPrefix}) => {
    const [comment, setComment] = useState(data.comment || '');
    const openComment = () => {
        let drawer;
        const onOK = (v) => {
            setComment(v);
            commentChange && commentChange(v);
            drawer.close();
        };
        const onCancel = () => {
            drawer.close();
        };
        drawer = openDrawer(<Edit
          onOK={onOK}
          onCancel={onCancel}
          data={comment}
        />, {
            maskClosable: false,
            title: <FormatMessage id='canvas.node.comment'/>,
            width: '30%',
        });
    };
    return <span className={`${currentPrefix}-er-comments ${currentPrefix}-er-comments-${comment ? 'iscomment' : 'normal'}`}>
      <Tooltip placement='top' force title={<FormatMessage id='canvas.node.comment'/>} offsetTop={-5}>
        <Icon onClick={openComment} type='fa-commenting-o'/>
      </Tooltip>
    </span>;
});
