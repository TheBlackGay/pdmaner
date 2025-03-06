import React, {forwardRef} from 'react';
import { Graph } from '@antv/x6';
import '@antv/x6-react-shape';
import {calcColor} from '../util';
import { separator } from '../../../../../profile';
import { getTitle } from '../../../../lib/datasource_util';

const Table = forwardRef(({node}, ref) => {
  const data = node.data;
  const store = node.store;
  const id = node.id;
  const isLogic = node.getProp('type') === 'L';
  const size = node.size();
  const allFk = node?._model?.getIncomingEdges(id)?.map(t => t.getTargetPortId()
      ?.split(separator)[0]) || [];
  const calcFKPKShow = (f, h) => {
    if (h.refKey === 'primaryKey') {
      if (f[h.refKey]) {
        return '<PK>';
      } else if (allFk.includes(f.id)) {
        return '<FK>';
      }
    }
    return f[h.refKey];
  };
  const sliceCount = Math.floor((size.height - 31) / 23);
  const renderBody = () => {
      if(isLogic && data?.sysProps?.lePropOrient === 'H') {
          const primaryKeyFields = data.fields.filter(f => f.primaryKey);
          const lineClamp = Math.floor((size.height - 29 - primaryKeyFields.length * 23) / 18);
          const bodyValue = data.fields.filter(f => !f.primaryKey).map((f) => {
              if(data?.sysProps?.propShowFields?.includes('N')) {
                  return f.defName || f.defKey;
              }
              return f.defKey || f.defName;
          }).join(';');
          return <div
            style={{height: 'calc(100% - 27px)', background: calcColor(node.getProp('fillColor') || '#DDE5FF'), boxSizing: 'border-box'}}
          >
            {
                  primaryKeyFields.map((f) => {
                      return <div
                        key={`${f.id}${f.defName}`}
                        style={{
                              whiteSpace: 'nowrap',
                              height: '23px',
                              padding: '2px 4px',
                              boxSizing: 'border-box',
                              fontSize: '12px',
                          }}
                      >
                        {
                              [{refKey: 'primaryKey'}].concat(data.headers
                                  .filter(h => h.refKey !== 'primaryKey')).map((h) => {
                                  return <span
                                    className='chiner-ellipsis'
                                    style={{
                                          boxSizing: 'border-box',
                                          width: data.maxWidth[h.refKey],
                                          fontSize: '12px',
                                          display: 'inline-block',
                                          marginLeft: '8px',
                                          WebkitTextFillColor: node.getProp('fontColor') || 'rgba(0,0,0,.65)',
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                      }}
                                    key={h.refKey}
                                  >
                                    {calcFKPKShow(f, h)}
                                  </span>;
                              })
                          }
                      </div>;
                  })
              }
            <div style={{
                  borderTop: '1px solid #DFE3EB',
                  whiteSpace: 'pre-wrap',
                  height: lineClamp * 18,
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: lineClamp,
                  overflow: 'hidden',
                  wordBreak: 'break-all',
              }}>
              {bodyValue}
            </div>
          </div>;
      }
      return <div style={{ height: 'calc(100% - 27px)', background:  calcColor(node.getProp('fillColor') || '#DDE5FF'), boxSizing: 'border-box'}}>
        {
              data.fields.slice(0, sliceCount).map((f) => {
                  return <div
                    key={`${f.id}${f.defName}`}
                    style={{
                          borderTop: f.__isFirst ? '1px solid #DFE3EB' : 'none',
                          whiteSpace: 'nowrap',
                          height: '23px',
                          padding: '2px 4px',
                          boxSizing: 'border-box',
                          fontSize: '12px',
                      }}
                  >
                    {
                          [{refKey: 'primaryKey'}].concat(data.headers
                              .filter(h => h.refKey !== 'primaryKey')).map((h) => {
                              return <span
                                className='chiner-ellipsis'
                                style={{
                                      boxSizing: 'border-box',
                                      width: data.maxWidth[h.refKey],
                                      fontSize: '12px',
                                      display: 'inline-block',
                                      marginLeft: '8px',
                                      WebkitTextFillColor: node.getProp('fontColor') || 'rgba(0,0,0,.65)',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      textDecoration: (f.primaryKey && !isLogic) ? 'underline' : 'none',
                                  }}
                                key={h.refKey}
                              >
                                {calcFKPKShow(f, h)}
                              </span>;
                          })
                      }
                  </div>;
              })
          }
        {data.fields.length > sliceCount && <div
          style={{
                  boxSizing: 'border-box',
                  whiteSpace: 'nowrap',
                  height: '23px',
                  padding: '2px 4px 2px 4px',
                  textAlign: 'center',
                  position: 'fixed',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  cursor: 'pointer',
              }}
          >...</div>}
      </div>;
  };
  return <div
    ref={ref}
    style={{
      background: '#FFFFFF',
      color: node.getProp('fontColor'),
      borderRadius: '5px',
      height: '100%',
      boxSizing: 'border-box',
    }}
  >
    <div
      className='chiner-ellipsis'
      style={{
        background: node.getProp('fillColor') || '#DDE5FF',
        WebkitTextFillColor: node.getProp('fontColor') || 'rgba(0,0,0,.65)',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: '12px',
        borderRadius: '5px 5px 0 0',
        padding: '4px 0',
        borderBottom: '1px solid #DFE3EB',
        height: '27px',
        boxSizing: 'border-box',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {`${getTitle(data)}${store?.data.count > 0 ? `:${store?.data.count}` : ''}`}
    </div>
    {
          renderBody()
      }
  </div>;
});

Graph.registerNode('table-img', {
  inherit: 'react-shape',
  zIndex: 2,
  attrs: {
    body: {
        stroke: '#DFE3EB',  // 边框颜色
        strokeWidth: 2,
        rx: 5,
        ry: 5,
    },
  },
  component: <Table/>,
});

