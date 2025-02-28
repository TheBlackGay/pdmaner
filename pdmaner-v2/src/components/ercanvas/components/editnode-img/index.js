import React, { forwardRef } from 'react';
import { Graph, Markup } from '@antv/x6';
import '@antv/x6-react-shape';
import marked from 'marked';
import { renderer } from '../util';

const EditNode = forwardRef(({node}, ref) => {
  const label = node.getProp('label');
  const getLabel = () => {
    marked.use({ renderer });
    const reg = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
    return marked(label, {
        breaks: true,
    }).replace(reg, '');
  };
  return <div
    ref={ref}
    style={{
        boxSizing: 'border-box',
        background: node.getProp('fillColor') || '#FFFFFF',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: node.shape === 'group-img' ? 'start' : 'center',
        width: '100%',
        height: '100%',
        fontSize: '12px',
        borderRadius: (node.shape === 'edit-node-circle-img' || node.shape === 'mind-topic-branch-img' || node.shape === 'mind-topic-img') ? '10px' : '0px',
        border: node.shape === 'group-img' ? '1px dashed #DFE3EB' : '1px solid #DFE3EB',
      }}
  >
    <pre
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{__html: getLabel()}}
      style={{
        boxSizing: 'border-box',
        margin: 0,
        padding: '2px',
        WebkitTextFillColor: node.getProp('fontColor') || 'rgba(0,0,0,.65)',
        width: '100%',
        display: 'flex',
        textAlign: 'center',
        flexDirection: 'column',
      }}
    />
  </div>;
});

Graph.registerNode('edit-node-img', {
  inherit: 'react-shape',
  zIndex: 2,
  attrs: {
    body: {},
  },
  portMarkup: [Markup.getForeignObjectMarkup()],
  component: <EditNode/>,
});

Graph.registerNode('edit-node-circle-img', {
  zIndex: 2,
  inherit: 'react-shape',
  attrs: {
    /*body: {
      rx: 10,
      ry: 10,
    },*/
  },
  portMarkup: [Markup.getForeignObjectMarkup()],
  component: <EditNode/>,
});

Graph.registerNode('edit-node-polygon-img', {
  inherit: 'polygon',
  zIndex: 2,
  attrs: {
    body: {
      stroke: '#DFE3EB',
      strokeWidth: 1,
      refPoints: '0,10 10,0 20,10 10,20',
    },
    text: {
      style: {
        fontSize: '12px',
        fill: 'rgba(0, 0, 0, 0.65)',
      },
    },
  },
  portMarkup: [Markup.getForeignObjectMarkup()],
});

Graph.registerNode('edit-node-circle-svg-img', {
  inherit: 'circle',
  zIndex: 2,
  attrs: {
    body: {
      stroke: '#DFE3EB',  // 边框颜色
      strokeWidth: 1,
    },
    text: {
      style: {
        fontSize: '12px',
        fill: 'rgba(0, 0, 0, 0.65)',
      },
    },
  },
  portMarkup: [Markup.getForeignObjectMarkup()],
});

Graph.registerNode('group-img', {
  inherit: 'react-shape',
  zIndex: 1,
  attrs: {
    body: {},
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
Graph.registerNode('mind-topic-img', {
  inherit: 'react-shape',
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
  component: <EditNode/>,
});

// 子主题
Graph.registerNode(
    'mind-topic-branch-img',
    {
      inherit: 'mind-topic-img',
    },
);
