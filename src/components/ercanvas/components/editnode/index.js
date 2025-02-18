import React, { forwardRef, useRef, useEffect } from 'react';
import { Graph, Markup } from '@antv/x6';
import {Icon, Tooltip} from 'components';
import marked from 'marked';
import FormatMessage from '../../../formatmessage';
import '@antv/x6-react-shape';
import './style/index.less';
import { renderer } from '../util';
// eslint-disable-next-line import/named
import { platform } from '../../../../lib/middle';
import info from './style/info.png';

const EditNode = forwardRef(({node}, ref) => {
  const preRef = useRef(null);
  const label = node.getProp('label');
  const note = node.getProp('note');
  const linkData = JSON.parse(node.getProp('link') || '{}');
  const inputRef = useRef(null);
  const editable = node.getProp('editable');
  const shape = node.getProp('shape');
  const isExpand = node.getProp('isExpand') !== false;
  const isMindNode = shape === 'mind-topic' || shape === 'mind-topic-branch';
  const children = (node.getChildren() || []).filter(c => c.isNode());
  const onChange = () => {
    node.setProp('label', inputRef.current.value);
  };
  const expand = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const store = node.store;
    store?.data?.expand(node);
  };
  const nodeClickText = () => {
    const store = node.store;
    store?.data?.nodeClickText(node);
  };
  useEffect(() => {
    if (preRef.current) {
      // 寻找第一行文本
      const firstChildren = preRef.current.children[0];
      if (firstChildren){
        if (linkData.type) {
          firstChildren.onclick = nodeClickText;
          firstChildren.setAttribute('class', 'chiner-er-editnode-link');
        } else {
          firstChildren.onclick = () => {};
          firstChildren.setAttribute('class', '');
        }
      }
    }
  });
  useEffect(() => {
    if (editable) {
      if (window.getComputedStyle(inputRef.current).pointerEvents !== 'none') {
        inputRef.current.focus();
      }
    } else if (platform === 'json') {
      const links = preRef.current.querySelectorAll('a[href]');
      links.forEach((link) => {
        link.addEventListener('click', (e) => {
          const url = link.getAttribute('href');
          e.preventDefault();
          // eslint-disable-next-line global-require,import/no-extraneous-dependencies
          require('electron').shell.openExternal(url);
        });
      });
    }
  }, [editable]);
  const getPosition = () => {
    const children1 = children[0];
    if (children1 && children1.isNode()) {
      if (node.prop('layout') === 'vertical' || node.prop('layout') === 'bottom') {
        const cY = children1.position().y;
        const nY = node.position().y;
        return {
          left: (node.size().width - 15) / 2,
          bottom: cY > nY ? -10 : node.size().height - 7.5,
        };
      } else {
        const cX = children1.position().x;
        const nX = node.position().x;
        return {
          bottom: (node.size().height - 15) / 2,
          right: cX > nX ? -10 : node.size().width - 7.5,
        };
      }
    }
    return  {};
  };
  const getHtml = (str) => {
    marked.use({ renderer });
    const reg = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
    return marked(str, {
      breaks: true,
    }).replace(reg, '');
  };
  return <div
    ref={ref}
    className={`chiner-er-editnode ${(node.shape === 'edit-node-circle' || node.shape === 'mind-topic-branch' || node.shape === 'mind-topic') ? 'chiner-er-editnode-circle' : ''}`}
    style={{
      background: node.getProp('fillColor'),
      color: node.getProp('fontColor'),
      zIndex: 10,
      alignItems: node.shape === 'group' ? 'start' : 'center',
    }}
  >
    {
      // eslint-disable-next-line no-nested-ternary
      editable ? <textarea
        onChange={onChange}
        placeholder={FormatMessage.string({id: 'canvas.node.remarkPlaceholder'})}
        ref={inputRef}
        defaultValue={label}
      /> :
      <><pre
        ref={preRef}
          // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{__html: getHtml(label || '')}}
      />
        {note && <Tooltip
          placement='top'
          title={<pre
              // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{__html: getHtml(note || '')}}
          />}
          force>
          <Icon
            className='chiner-er-editnode-info'
            type='fa-info-circle'
          />
        </Tooltip>}
        {
          isMindNode && children?.length > 0 && <span
            onClick={expand}
            style={{
              ...getPosition(),
              display: isExpand ? 'none' : 'flex',
            }}
            className='chiner-er-editnode-mind'
            >
            {
            isExpand ? <Icon className='chiner-er-editnode-mind-icon' type='fa-minus'/> : children.length
          }
          </span>
        }
      </>
    }
  </div>;
});

// 矩形框
Graph.registerNode('edit-node', {
  inherit: 'react-shape',
  zIndex: 2,
  attrs: {
    body: {
      stroke: '#DFE3EB',  // 边框颜色
      strokeWidth: 1,
    },
  },
  portMarkup: [Markup.getForeignObjectMarkup()],
  component: <EditNode/>,
});

// 圆角矩形框
Graph.registerNode('edit-node-circle', {
  inherit: 'react-shape',
  zIndex: 2,
  attrs: {
    body: {
      stroke: '#DFE3EB',  // 边框颜色
      strokeWidth: 1,
      rx: 10,
      ry: 10,
    },
  },
  portMarkup: [Markup.getForeignObjectMarkup()],
  component: <EditNode/>,
});

// 菱形框
Graph.registerNode('edit-node-polygon', {
  inherit: 'polygon',
  zIndex: 2,
  markup: [
    {
      tagName: 'polygon',
      selector: 'body',
    },
    {
      tagName: 'image',
      selector: 'image',
    },
    {
      tagName: 'text',
      selector: 'text',
    },
  ],
  propHooks(metadata) {
    const { note, size } = metadata;
    if (note) {
      return {
        ...metadata,
        attrs: {
          ...metadata?.attrs,
          image: {
            x: size.width / 2 - 5,
            y: size.height - 20,
            style: {
              display: '',
              cursor: 'default',
            },
          },
        },
      };
    }
    return metadata;
  },
  attrs: {
    body: {
      stroke: '#DFE3EB',  // 边框颜色
      strokeWidth: 1,
      refPoints: '0,10 10,0 20,10 10,20',
    },
    image: {
      'xlink:href': info,
      width: 10,
      height: 10,
      style: {
        display: 'none',
        cursor: 'default',
      },
    },
    text: {
      event: 'node:click:text',
      style: {
        fontSize: '12px',
        fill: 'rgba(0, 0, 0, 0.65)',
      },
    },
  },
  portMarkup: [Markup.getForeignObjectMarkup()],
});

// 圆形框
Graph.registerNode('edit-node-circle-svg', {
  inherit: 'circle',
  zIndex: 2,
  markup: [
    {
      tagName: 'circle',
      selector: 'body',
    },
    {
      tagName: 'image',
      selector: 'image',
    },
    {
      tagName: 'text',
      selector: 'text',
    },
  ],
  propHooks(metadata) {
    const { note, size } = metadata;
    if (note) {
      return {
        ...metadata,
        attrs: {
          ...metadata?.attrs,
          image: {
            x: size.width / 2 - 5,
            y: size.height - 20,
            style: {
              display: '',
              cursor: 'default',
            },
          },
        },
      };
    }
    return metadata;
  },
  attrs: {
    body: {
      stroke: '#DFE3EB',  // 边框颜色
      strokeWidth: 1,
    },
    image: {
      'xlink:href': info,
      width: 10,
      height: 10,
      style: {
        display: 'none',
        cursor: 'default',
      },
    },
    text: {
      event: 'node:click:text',
      style: {
        fontSize: '12px',
        fill: 'rgba(0, 0, 0, 0.65)',
      },
    },
  },
  portMarkup: [Markup.getForeignObjectMarkup()],
});

// 分组框
Graph.registerNode('group', {
  inherit: 'react-shape',
  zIndex: 1,
  attrs: {
    body: {
      strokeDasharray: '5 5',
      strokeWidth: 2,
      stroke: '#000000',
    },
  },
  component: <EditNode/>,
});

const commPortStyle = {
  attrs: {
    circle: {
      r: 4,
      magnet: true,
      strokeWidth: 1,
      style: {
        visibility: 'hidden',
      },
    },
  },
  zIndex: 3,
};

const allGroups =  {
  groupTop: {
    ...commPortStyle,
    position: 'top',
  },
  groupBottom: {
    ...commPortStyle,
    position: 'bottom',
  },
  groupLeft: {
    ...commPortStyle,
    position: 'left',
  },
  groupRight: {
    ...commPortStyle,
    position: 'right',
  },
};

// 中心主题
Graph.registerNode('mind-topic', {
  inherit: 'react-shape',
  zIndex: 3,
  propHooks(metadata) {
    return {
      ...metadata,
      ports: {
        groups: allGroups,
        items: [
          {
            id: 'top',
            group: 'groupTop',
          },
          {
            id: 'bottom',
            group: 'groupBottom',
          },
          {
            id: 'left',
            group: 'groupLeft',
          },
          {
            id: 'right',
            group: 'groupRight',
          },
        ],
      },
    };
  },
  attrs: {
    body: {
      stroke: '#DFE3EB',  // 边框颜色
      strokeWidth: 1,
      rx: 10,
      ry: 10,
    },
  },
  component: <EditNode/>,
});

// 子主题
Graph.registerNode(
    'mind-topic-branch',
    {
      zIndex: 3,
      inherit: 'mind-topic',
    },
);

