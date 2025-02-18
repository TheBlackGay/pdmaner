import { Graph, ToolsView } from '@antv/x6';
import ReactDom from 'react-dom';
import React, {useRef, useState, forwardRef, useImperativeHandle} from 'react';
import {Button, ColorPicker, FormatMessage, Icon, Modal, openModal, Tooltip} from 'components';
import DragCom from 'components/dragcom';
import NoteEditor from '../NoteEditor';
import LabelEditor from '../LabelEditor';
import LinkEditor from '../LinkEditor';
import { prefix } from '../../../../profile';
import Svg from './svg';
import {calcNodeData, getPresetColors} from '../../../lib/datasource_util';

const ToolItem = ToolsView.ToolItem;


// 节点编辑
class EditableCellTool extends ToolItem {
  render() {
    super.render();
    const cell = this.cell;
    let x = 0;
    let y = 0;
    let width = 0;
    let height = 0;

    const position = cell.position();
    const size = cell.size();
    const pos = this.graph.localToGraph(position);
    const zoom = this.graph.zoom();
    width = size.width * zoom;
    height = size.height * zoom;
    x = pos.x;
    y = pos.y;

    const editorParent = ToolsView.createElement('div', false);
    editorParent.setAttribute('class', `${prefix}-er-editnode`);
    editorParent.style.position = 'absolute';
    editorParent.style.left = `${x}px`;
    editorParent.style.top = `${y}px`;
    editorParent.style.width = `${width}px`;
    editorParent.style.height = `${height}px`;

    this.editorContent = ToolsView.createElement('textarea', false);
    editorParent.appendChild(this.editorContent);
    this.container.appendChild(editorParent);

    this.init();

    return this;
  }

  init = () => {
    const cell = this.cell;
    const value = cell.label;
    if (value) {
      this.editorContent.value = value;
      cell.attr('text/style/display', 'none', { ignoreHistory : true});
    }
    setTimeout(() => {
      if (window.getComputedStyle(this.editorContent).pointerEvents !== 'none') {
        this.editorContent.onblur = (e) => {
          this.graph.batchUpdate('updateNodeText', () => {
            cell.setProp('label', e.target.value);
            cell.attr('text/text', e.target.value);
          });
        };
        this.editorContent.focus();
      }
    });
  }
}

EditableCellTool.config({
  tagName: 'div',
  isSVGElement: false,
});

Graph.registerNodeTool('editableCell', EditableCellTool, true);



// 显示节点大小
class ShowSizeTool extends ToolItem {
  render() {
    super.render();
    const cell = this.cell;
    let x = 0;
    let y = 0;

    const position = cell.position();
    const size = cell.size();
    const pos = this.graph.localToGraph(position);
    const zoom = this.graph.zoom();
    x = pos.x;
    y = pos.y;

    const sizeDom = ToolsView.createElement('div', false);
    sizeDom.setAttribute('class', `${prefix}-node-size`);
    sizeDom.style.position = 'absolute';
    sizeDom.style.left = `${x}px`;
    sizeDom.style.top = `${y + 10 + size.height * zoom}px`;
    sizeDom.style.width = `${size.width * zoom}px`;
    sizeDom.innerHTML = `<span>${Math.floor(size.width * zoom)} * ${Math.floor(size.height * zoom)}</span>`;
    this.container.appendChild(sizeDom);
    this.init();
    return this;
  }
}

ShowSizeTool.config({
  tagName: 'div',
  isSVGElement: false,
});

Graph.registerNodeTool('showSizeTool', ShowSizeTool, true);


const OverDown = forwardRef(({children, over, offset = 0}, ref) => {
  const [dataPosition, setDataPosition] = useState(null);
  const isLeave = useRef(true);
  const time = useRef(null);
  useImperativeHandle(ref, () => {
    return {
      close: () => {
        clearTimeout(time.current);
        setDataPosition(null);
        isLeave.current = true;
      },
    };
  }, []);
  const checkLeave = () => {
    clearTimeout(time.current);
    time.current = setTimeout(() => {
      if (isLeave.current) {
        setDataPosition(null);
      }
    }, 300);
  };
  const onMouseOver = (e) => {
    const checkIsChildren = (dom) => {
      // chiner-tooltip-content
      if ((dom.getAttribute('class') || '').includes(`${prefix}-tooltip-content`)){
        return false;
      } else if (dom.parentElement && dom.parentElement !== document.body) {
        return checkIsChildren(dom.parentElement);
      }
      return true;
    };
    if (checkIsChildren(e.target)) {
      isLeave.current = false;
      checkLeave();
      const target = e.currentTarget;
      const rect = target.getBoundingClientRect();
      setDataPosition({
        left: rect.x + rect.width / 2 - offset,
        top: rect.bottom + 8,
      });
    } else {
      isLeave.current = true;
      checkLeave();
    }
  };
  const onMouseLeave = () => {
    isLeave.current = true;
    checkLeave();
  };
  const onMouseOverData = () => {
    isLeave.current = false;
    checkLeave();
  };
  const onMouseLeaveData = () => {
    isLeave.current = true;
    checkLeave();
  };
  return <>
    {React.cloneElement(children, {
      onMouseOver,
      onMouseLeave,
    })}
    {dataPosition && ReactDom.createPortal(<div
      onMouseLeave={onMouseLeaveData}
      onMouseOver={onMouseOverData}
      className={`${prefix}-edge-tooltip-content-item-data`}
      style={dataPosition}
    >
      {over}
    </div>, document.body)}
  </>;
});

// 节点或边的工具栏
const EdgeTooltipContent = ({onUpdate, edge, movePosition, getDataSource, position, id}) => {
  const overDownFillRef = useRef(null);
  const defaultColor = {
    fillColor: '#ACDAFC',
    fontColor: '#000000',
  };
  const [fillColor, setFillColor] = useState(edge.getProp('fillColor') || defaultColor.fillColor);
  const [arrowState, setArrowState] = useState(() => {
    const attr = edge.attr('line');
    // triangle-stroke
    return [attr?.sourceMarker?.relation || 'none',
      attr?.targetMarker?.relation || 'none'].map(r => (r === 'arrow' ? 'triangle-stroke' : r));
  });
  const [lineState, setLineState] = useState(() => {
    return {
      lineStyle: edge.attr('line/strokeDasharray') === '5 5' ? 'dotted-large' : '#icon-stroke-line1',
      // eslint-disable-next-line no-nested-ternary
      lineType: edge.getProp('router')?.name === 'normal' ?
          'straight' : (edge.getProp('connector')?.name === 'rounded' ? 'fillet' : 'polyline'),
    };
  });
  const [isLock, setIsLock] = useState(() => {
    return edge.getProp('isLock');
  });
  const arrowType = ['none', 'triangle-stroke', 'triangle-fill', 'right', 'concave'];
  const erArrowType = ['1', 'n'];
  const lineType = ['straight', 'polyline', 'fillet'];
  const lineStyle = ['#icon-stroke-line1', 'dotted-large'];
  const _onUpdate = (type, value, reverse) => {
    if(type === 'relation' || type === 'arrow-exchange') {
      setArrowState((pre) => {
        if (type === 'arrow-exchange') {
          return [pre[1], pre[0]];
        } else if (reverse) {
          return [value, pre[1]];
        }
        return [pre[0], value];
      });
    } else if (type === 'lineType' || type === 'lineStyle') {
      setLineState((pre) => {
        return {
          ...pre,
          [type]: value,
        };
      });
    } else if (type === 'lock') {
      setIsLock(pre => !pre);
    } else if (type === 'fillColor') {
      setFillColor(value.hex);
    }
    onUpdate(type, value, reverse);
  };
  const fillClose = () => {
    overDownFillRef.current.close();
  };
  const renderDataType = (type, reverse) => {
    if (type === 'line') {
      return <div className={`${prefix}-edge-tooltip-content-item-data-line`}>
        <div>
          <div><FormatMessage id='canvas.edge.lineType'/></div>
          <div>
            {
              lineType.map((t) => {
                return <Svg
                  className={lineState.lineType === t ? `${prefix}-edge-tooltip-content-item-data-line-selected` : ''}
                  key={t}
                  type={t}
                  isArrow={false}
                  onClick={() => _onUpdate('lineType', t)}/>;
              })
            }
          </div>
        </div>
        <div>
          <div><FormatMessage id='canvas.edge.lineStyle'/></div>
          <div>
            {
              lineStyle.map((s) => {
                return <Svg
                  className={lineState.lineStyle === s ? `${prefix}-edge-tooltip-content-item-data-line-selected` : ''}
                  key={s}
                  type={s}
                  isArrow={false}
                  onClick={() => _onUpdate('lineStyle', s)}/>;
              })
            }
          </div>
        </div>
      </div>;
    }
    return <div className={`${prefix}-edge-tooltip-content-item-data-arrow`}>
      {arrowType.concat(erArrowType).map((a) => {
        return <div
          className={a === '1' ? `${prefix}-edge-tooltip-content-item-data-arrow-border` : ''}
          key={a}
          onClick={() => _onUpdate('relation', a, reverse)}>
          <div>
            <Icon
              style={{visibility: a === arrowState[reverse ? 0 : 1] ? 'visible' : 'hidden'}}
              type='fa-check'/>
          </div>
          <Svg reverse={reverse} type={a} />
        </div>;
      })}
    </div>;
  };
  return <div className={`${prefix}-edge-tooltip-content`}>
    {
      !isLock && <>
        <div className={`${prefix}-edge-tooltip-content-item-arrow`}>
          <Tooltip offsetTop={1} placement='top' force title={FormatMessage.string({id: 'canvas.edge.relationLabel'})}>
            <Svg
              style={{cursor: 'pointer', width: '27px'}}
              onClick={() => _onUpdate('label', !isLock)}
              type='#icon-sticky-note-square'
            />
          </Tooltip>
        </div>
        <OverDown
          offset={80}
          ref={overDownFillRef}
          over={<ColorEdit
            movePosition={movePosition}
            color={fillColor}
            getDataSource={getDataSource}
            onUpdate={(v, complete) => _onUpdate('fillColor', v, complete)}
            position={position}
            id={id}
            close={fillClose}
          />}
        >
          <div className={`${prefix}-edge-tooltip-content-customer-circle`}>
            <Tooltip offsetTop={7} placement='top' force title={FormatMessage.string({id: 'toolbar.fillColor'})}>
              <div
                className={`${prefix}-node-tooltip-content-font-circle`}
                style={{background: fillColor}} />
            </Tooltip>
          </div>
        </OverDown>
        {
          edge.shape !== 'mind-edge' && <><div className={`${prefix}-edge-tooltip-content-line`}/>
            <OverDown over={renderDataType('line')} offset={50}>
              <div
                className={`${prefix}-edge-tooltip-content-item`}
              >
                <div className={`${prefix}-edge-tooltip-content-item-line`}>
                  <Tooltip propagation offsetTop={1} placement='top' force title={FormatMessage.string({id: 'canvas.edge.lineType'})}>
                    <Svg isArrow={false} type={lineState.lineType}/>
                  </Tooltip>
                </div>
              </div>
            </OverDown>
            <div className={`${prefix}-edge-tooltip-content-line`}/>
            <div
              className={`${prefix}-edge-tooltip-content-item`}
            >
              <div className={`${prefix}-edge-tooltip-content-item-arrow`}>
                <OverDown over={renderDataType('arrow', true)} offset={25}>
                  <div>
                    <Tooltip propagation offsetTop={1} placement='top' force title={FormatMessage.string({id: 'canvas.edge.startArrow'})}>
                      <Svg
                        reverse
                        type={arrowState[0]}
                      />
                    </Tooltip>
                  </div>
                </OverDown>
                <div onClick={() => _onUpdate('arrow-exchange')} className={`${prefix}-edge-tooltip-content-item-arrow-change`}>
                  <Tooltip offsetTop={1} placement='top' force title={FormatMessage.string({id: 'canvas.edge.exchange'})}>
                    <Icon type='fa-exchange'/>
                  </Tooltip>
                </div>
                <OverDown over={renderDataType('arrow')} offset={25}>
                  <div>
                    <Tooltip propagation offsetTop={1} placement='top' force title={FormatMessage.string({id: 'canvas.edge.endArrow'})}>
                      <Svg
                        type={arrowState[1]}
                      />
                    </Tooltip>
                  </div>
                </OverDown>
              </div>
            </div>
            <div className={`${prefix}-edge-tooltip-content-line`}/></>
        }
        </>
    }
    <div className={`${prefix}-edge-tooltip-content-item`}>
      <Tooltip clickClose offsetTop={1} placement='top' force title={FormatMessage.string({id: `canvas.${isLock ? 'unLock' : 'lock'}`})}>
        <Icon onClick={() => _onUpdate('lock', !isLock)} type={`fa-${isLock ? 'lock' : 'unlock'}`}/>
      </Tooltip>
    </div>
  </div>;
};

const Layout = ({onUpdate, layout}) => {
  return <div className={`${prefix}-node-tooltip-content-layout`}>
    <div className={`${prefix}-node-tooltip-content-layout-${layout === 'horizontal' ? 'checked' : 'normal'}`}>
      <Svg onClick={() => onUpdate('layout', 'horizontal')} type='#icon-horizontal'/>
    </div>
    <div className={`${prefix}-node-tooltip-content-layout-${layout === 'vertical' ? 'checked' : 'normal'}`}>
      <Svg rotate={90} onClick={() => onUpdate('layout', 'vertical')} type='#icon-horizontal'/>
    </div>
    <div className={`${prefix}-node-tooltip-content-layout-${layout === 'left' ? 'checked' : 'normal'}`}>
      <Svg onClick={() => onUpdate('layout', 'left')} type='#icon-left'/>
    </div>
    <div className={`${prefix}-node-tooltip-content-layout-${layout === 'right' ? 'checked' : 'normal'}`}>
      <Svg onClick={() => onUpdate('layout', 'right')} type='#icon-right'/>
    </div>
    <div className={`${prefix}-node-tooltip-content-layout-${layout === 'bottom' ? 'checked' : 'normal'}`}>
      <Svg rotate={90} onClick={() => onUpdate('layout', 'bottom')} type='#icon-right'/>
    </div>
  </div>;
};

const ColorEdit = ({onUpdate, useDefaultColor,
                     close, id, position, getDataSource, movePosition, color}) => {
  const standardColor = getPresetColors();
  const recentColors = getDataSource().profile?.recentColors || [];
  const currentColor = color;
  const openPicker = () => {
    const pickerDom = document.getElementById(`${id}-color-picker`);
    // pickerDom.innerHTML = '';
    pickerDom.setAttribute('class', `${prefix}-node-tooltip-content-color-picker`);
    const Com = DragCom(ColorPicker);
    const onClose = () => {
      ReactDom.unmountComponentAtNode(pickerDom);
    };
    const refactorPosition = (e) => {
      return {
        left: e.left - movePosition.left,
        top: e.top - movePosition.top,
      };
    };
    let tempColor;
    const onOk = () => {
      if (tempColor) {
        onUpdate(tempColor, true);
      }
      onClose();
    };
    const _onUpdate = (c) => {
      tempColor = c;
    };
    ReactDom.render(<Com
      refactorPosition={refactorPosition}
      defaultColor={currentColor}
      onChange={_onUpdate}
      closeable
      onClose={onClose}
      isSimple
      recentColors={[]}
      footer={<div style={{textAlign: 'center', marginBottom: 5}}>
        <Button type='primary' onClick={onOk}><FormatMessage id='button.ok'/></Button>
      </div>}
      style={{left: `${position.left + 10}px`, top: `${position.top}px`, zIndex: 999}}/>, pickerDom);
  };
  const _close = () => {
    openPicker();
    close && close();
  };
  return <div className={`${prefix}-node-tooltip-content-color-edit`}>
    <div className={`${prefix}-node-tooltip-content-color-edit-container`}>
      <div className={`${prefix}-node-tooltip-content-color-edit-container-label`}>
        <span><FormatMessage id='canvas.myColor'/></span>
        <span
          onClick={useDefaultColor}
          className={`${prefix}-node-tooltip-content-color-edit-container-label-default`}
        >
          <FormatMessage id='canvas.default'/></span>
      </div>
      <div className={`${prefix}-node-tooltip-content-color-edit-container-list`}>
        <div
          onClick={_close}
          className={`${prefix}-node-tooltip-content-color-edit-container-list-item-normal`}
        >
          <Icon type='fa-plus'/>
        </div>
        {recentColors.map((s) => {
          return <div
            onClick={() => onUpdate({hex: s}, false)}
            className={`${prefix}-node-tooltip-content-color-edit-container-list-item-${currentColor === s ? 'selected' : 'normal'}`}
            key={s}
            style={{background: s}}/>;
        })}
      </div>
    </div>
    <div className={`${prefix}-node-tooltip-content-color-edit-container`}>
      <div className={`${prefix}-node-tooltip-content-color-edit-container-label`}>
        <FormatMessage id='canvas.standardColor'/>
      </div>
      <div className={`${prefix}-node-tooltip-content-color-edit-container-list`}>
        {standardColor.map((s) => {
          return <div
            onClick={() => onUpdate({hex: s}, false)}
            className={`${prefix}-node-tooltip-content-color-edit-container-list-item-${currentColor === s ? 'selected' : 'normal'}`}
            key={s}
            style={{background: s}}/>;
        })}
      </div>
    </div>
  </div>;
};

const NodeTooltipContent = ({onUpdate, node, id, position, getDataSource, movePosition}) => {
  const parent = node.getParent();
  const overDownFontRef = useRef(null);
  const overDownFillRef = useRef(null);
  const defaultColor = {
    fillColor: node.shape === 'table' ? '#ACDAFC' : '#FFFFFF',
    fontColor: '#000000',
  };
  const [fillColor, setFillColor] = useState(node.getProp('fillColor') || defaultColor.fillColor);
  const [fontColor, setFontColor] = useState(node.getProp('fontColor') || defaultColor.fontColor);

  const [layout, setLayout] = useState(node.getProp('layout') || 'horizontal');

  const [isLock, setIsLock] = useState(() => {
    return node.getProp('isLock');
  });

  const [isAutoSize, setAutoSize] = useState(() => {
    return node.getProp('autoSize');
  });
  // lock
  const _onUpdate = (t, value, complete) => {
    if (t === 'lock') {
      setIsLock(pre => !pre);
    } else if (t === 'fontColor') {
      setFontColor(value.hex);
    } else if (t === 'fillColor') {
      setFillColor(value.hex);
    } else if (t === 'layout') {
      setLayout(value);
    } else if(t === 'autoSize') {
      setAutoSize(value);
    }
    onUpdate(t, value, complete);
  };
  //  fillColor: '#ACDAFC', // 节点和边的背景色
  //  fontColor: '#000000'
  const fontClose = () => {
    overDownFontRef.current.close();
  };
  const fillClose = () => {
    overDownFillRef.current.close();
  };
  const getLayoutType = () => {
    if (layout === 'vertical') {
      return 'horizontal';
    } else if (layout === 'bottom') {
      return 'right';
    }
    return layout;
  };
  return <div className={`${prefix}-node-tooltip-content`}>
    { !isLock && node.shape === 'mind-topic' && <OverDown
      ref={overDownFontRef}
      offset={20}
      over={<Layout onUpdate={_onUpdate} layout={layout}/>}
      key='layout'>
      <div className={`${prefix}-node-tooltip-content-layout`}>
        <Tooltip propagation offsetTop={10} placement='top' force title={FormatMessage.string({id: 'toolbar.layout'})}>
          <Svg
            rotate={(layout === 'vertical' || layout === 'bottom') ? '90' : '0'}
            style={{cursor: 'pointer', width: '27px'}}
            type={`#icon-${getLayoutType()}`}/>
        </Tooltip>
      </div></OverDown>}
    {
      !isLock && node.shape !== 'table' && <Tooltip offsetTop={1} placement='top' force title={FormatMessage.string({id: 'canvas.node.note'})}>
        <Svg onClick={() => onUpdate('note')} style={{cursor: 'pointer', width: '27px'}} type='#icon-sticky-note-square'/>
      </Tooltip>
    }
    {!isLock && [<OverDown
      ref={overDownFontRef}
      offset={80}
      over={<ColorEdit
        useDefaultColor={() => _onUpdate('fontColor', {hex: '#000000'}, true)}
        movePosition={movePosition}
        color={fontColor}
        getDataSource={getDataSource}
        onUpdate={(v, complete) => _onUpdate('fontColor', v, complete)}
        position={position}
        id={id}
        close={fontClose}
      />}
      key='fontColor'><div>
        <Tooltip offsetTop={10} placement='top' force title={FormatMessage.string({id: 'toolbar.fontColor'})}>
          <Icon style={{fontSize: '13px', borderBottom: `2px solid ${fontColor}`}} type='fa-font'/>
        </Tooltip>
      </div></OverDown>, <OverDown
        offset={80}
        ref={overDownFillRef}
        over={<ColorEdit
          useDefaultColor={() => _onUpdate('fillColor', {hex: '#DDE5FF'}, true)}
          movePosition={movePosition}
          color={fillColor}
          getDataSource={getDataSource}
          onUpdate={(v, complete) => _onUpdate('fillColor', v, complete)}
          position={position}
          id={id}
          close={fillClose}
        />}
        key='fillColor'>
        <div>
          <Tooltip offsetTop={6} placement='top' force title={FormatMessage.string({id: 'toolbar.fillColor'})}>
            <div
              className={`${prefix}-node-tooltip-content-font-circle`}
              style={{background: fillColor}} />
          </Tooltip>
        </div></OverDown>]}
    {!isLock && node.shape === 'table' && <div
      style={{background: isAutoSize ? '#DDE5FF' : '', marginRight: 2}}
      onClick={() => _onUpdate('autoSize', !isAutoSize)}>
      <Tooltip offsetTop={10} placement='top' force title={FormatMessage.string({id: 'canvas.node.autoSize'})}>
        <Icon type='fa-expand'/>
      </Tooltip>
    </div>}
    {!isLock && node.shape !== 'table' && [<div key='line' className={`${prefix}-edge-tooltip-content-line`}/>,
      <div key='link' onClick={() => _onUpdate('link')}>
        <Tooltip offsetTop={10} placement='top' force title={FormatMessage.string({id: 'canvas.node.link'})}>
          <Icon type='fa-link'/>
        </Tooltip>
      </div>]}
    { !parent &&
        [node.shape === 'table' && !isLock && <div key='line' className={`${prefix}-edge-tooltip-content-line`}/>,
          <Tooltip key='lock' clickClose offsetTop={1} placement='top' force title={FormatMessage.string({id: `canvas.${isLock ? 'unLock' : 'lock'}`})}>
            <div onClick={() => _onUpdate('lock', !isLock)}><Icon type={`fa-${isLock ? 'lock' : 'unlock'}`}/></div>
          </Tooltip>]
        }
  </div>;
};

let preNode;

export const edgeNodeAddTool = (edge, graph, id, dataChange, getDataSource, updateDataSource,
                                {updateLayout, relationType}) => {
  if (preNode !== edge) {
    preNode = edge;
    const cellTooltip = document.getElementById(`${id}-cellTooltip`);
    const { container } = graph.findView(edge) || {};
    if (cellTooltip && container) {
      cellTooltip.innerHTML = '';
      const canvasContainer = cellTooltip.parentElement;
      const canvasContainerRect = canvasContainer.getBoundingClientRect();
      const rect = container.getBoundingClientRect();
      let height = 40;
      let left, width;
      const toolParent = document.createElement('div');
      toolParent.setAttribute('class', `${prefix}-cell-tooltip`);
      toolParent.style.position = 'absolute';
      const calcLeft = () => {
        width = edge.isNode() ? 170 : 250;
        if (edge.getProp('isLock')) {
          width = 45;
        } else if (edge.shape === 'table') {
          width = 110;
        } else if (edge.shape === 'mind-edge') {
          width = 100;
        } else if (edge.shape === 'mind-topic') {
          width = 200;
        }
        left = rect.x - canvasContainerRect.x + rect.width / 2 - width / 2;
        toolParent.style.left = `${left}px`;
      };
      calcLeft();
      toolParent.style.bottom = `${canvasContainerRect.bottom - rect.top + 10}px`;
      //toolParent.style.width = `${width}px`;
      toolParent.style.height = `${height}px`;
      const onUpdate = (t, v, reverse) => {
        graph.batchUpdate('updateEdgeOrNode', () => {
          if (t === 'lineType') {
            // straight', 'polyline', 'fillet'
            if (v === 'straight') {
              edge.setProp('router', {
                name: 'normal',
              });
              edge.setProp('vertices', []);
              edge.setProp('connector', {
                name: 'normal',
              });
            } else {
              if (v === 'fillet') {
                edge.setProp('connector', {
                  name: 'rounded',
                  args: {
                    radius: 10,
                  },
                });
              } else {
                edge.setProp('connector', {
                  name: 'normal',
                });
              }
              edge.setProp('router', {
                name: 'manhattan',
                args: {
                  excludeShapes: ['group'],
                },
              });
            }
          } else if(t === 'lineStyle'){
            if (v === 'dotted-large') {
              edge.attr('line/strokeDasharray', '5 5');
            } else {
              edge.attr('line/strokeDasharray', '');
            }
          } else if(t === 'relation') {
            //edge.setProp('relation', relationArray.join(':') || '1:n');
            if (reverse) {
              edge.attr('line/sourceMarker/relation', v);
            } else {
              edge.attr('line/targetMarker/relation', v);
            }
            edge.setProp('relation', `${edge.attr('line/sourceMarker/relation')}:${edge.attr('line/targetMarker/relation')}`);
          } else if (t === 'arrow-exchange') {
            edge.attr('line', {
              sourceMarker: {
                relation: edge.attr('line/targetMarker/relation'),
              },
              targetMarker: {
                relation: edge.attr('line/sourceMarker/relation'),
              },
            });
            edge.setProp('relation', `${edge.attr('line/sourceMarker/relation')}:${edge.attr('line/targetMarker/relation')}`);
          } else if(t === 'lock') {
            edge.setProp('isLock', v);
            graph.cleanSelection();
            if (!v) {
              graph.select(edge);
              calcLeft();
            }
          } else if(t === 'autoSize') {
            if (edge.getProp('autoSize') === undefined) {
              edge.setProp('autoSize', '', { ignoreHistory : true});
            }
            edge.setProp('autoSize', v);
            const size = edge.size();
            const data = edge.getProp('data');
            const prePorts = edge.getProp('ports');
            const preSize = data.preSize;
            const updateCell = (cellSize) => {
              const result =
                  calcNodeData({
                        data: data, size: cellSize, needTransform: false},
                      data, getDataSource(), prePorts.groups);
              edge.size(result.width, result.height);
              if(relationType !== 'entity') {
                edge.setProp('ports', result.ports);
              }
              edge.setData({maxWidth: result.maxWidth});
              graph.unselect(edge);
            };
            if(v) {
              updateCell(null);
              // 缓存上一次变化的大小
              edge.setData({preSize: {
                  width: size.width,
                  height: size.height,
                }});
            } else if(preSize) {
              updateCell(preSize);
            }
          } else if (t === 'label' || t === 'note') {
            let modal = null;
            if (t === 'note') {
              if (edge.getProp('note') === undefined) {
                edge.setProp('note', '');
              }
            } else if (edge.getLabelAt(0)?.attrs?.text?.text === undefined) {
                edge.setLabels([{
                  attrs: {
                    text: {
                      text: '',
                    },
                  },
                }]);
              }
            let value = t === 'label' ? (edge.getLabelAt(0)?.attrs?.text?.text) : edge.getProp('note');
            const onChange = (newValue) => {
              value = newValue;
            };
            const onOK = () => {
              if (t === 'label') {
                edge.setLabels([{
                  attrs: {
                    text: {
                      text: value,
                    },
                  },
                }]);
              } else {
                edge.setProp('note', value);
                if (edge.shape === 'edit-node-polygon' || edge.shape === 'edit-node-circle-svg') {
                  const size = edge.getBBox();
                  edge.attr('image', {
                    x: size.width / 2 - 5,
                    y: size.height - 20,
                    style: {
                      display: value ? '' : 'none',
                      cursor: 'default',
                    },
                  });
                }
              }
              dataChange && dataChange();
              modal && modal.close();
            };
            const onCancel = () => {
              modal && modal.close();
            };
            const Com = t === 'label' ? LabelEditor : NoteEditor;
            modal = openModal(
              <Com
                value={value}
                onChange={onChange}
                />,
                {
                  title: <FormatMessage id={`canvas.${t === 'note' ? 'node.note' : 'edge.relationLabel'}`}/>,
                  buttons: [
                    <Button key='onOK' onClick={onOK} type='primary'>
                      <FormatMessage id='button.ok'/>
                    </Button>,
                    <Button key='onCancel' onClick={onCancel}>
                      <FormatMessage id='button.cancel'/>
                    </Button>,
                  ],
                });
          } else if(t === 'link') {
            let modal = null;
            if (edge.getProp('link') === undefined) {
              edge.setProp('link', '{"type": ""}');
            }
            let linkData = JSON.parse(edge.getProp('link'));
            const linkChange = (data) => {
              linkData = data;
            };
            const onOK = () => {
              if (Object.keys(linkData).length === 0
                  || (linkData.type && !linkData.value)) {
                Modal.error({
                  title: FormatMessage.string({id: 'optFail'}),
                  message: FormatMessage.string({id: 'formValidateMessage'}),
                });
              } else {
                graph.batchUpdate('updateLink', () => {
                  edge.setProp('link', JSON.stringify(linkData));
                  edge.attr('text/style', {
                    cursor: linkData.type ? 'pointer' : 'none',
                    textDecoration: linkData.type ? 'underline' : 'none',
                    fill: linkData.type ? '#4e75fd' : (edge.getProp('fontColor') || 'rgba(0, 0, 0, 0.65)'),
                  });
                });
                dataChange && dataChange();
                modal && modal.close();
              }
            };
            const onCancel = () => {
              modal && modal.close();
            };
            modal = openModal(
              <LinkEditor
                getDataSource={getDataSource}
                data={linkData}
                onChange={linkChange}
                />,
                {
                  title: <FormatMessage id='canvas.node.link'/>,
                  buttons: [
                    <Button key='onOK' onClick={onOK} type='primary'>
                      <FormatMessage id='button.ok'/>
                    </Button>,
                    <Button key='onCancel' onClick={onCancel}>
                      <FormatMessage id='button.cancel'/>
                    </Button>,
                  ],
                });
          } else if (t === 'fontColor' || t === 'fillColor') {
            let cells = graph.getSelectedCells();
            if (cells.length === 0) {
              cells = graph.getCells();
            }
            cells
                .forEach((c) => {
                  c.setProp(t, v.hex);
                  if (c.shape === 'erdRelation' || c.shape === 'mind-edge') {
                    if (t === 'fillColor') {
                      const tempLine = c.attr('line');
                      c.attr('line', {
                        ...tempLine,
                        stroke: v.hex,
                        sourceMarker: {
                          ...tempLine.sourceMarker,
                          fillColor: v.hex,
                        },
                        targetMarker: {
                          ...tempLine.targetMarker,
                          fillColor: v.hex,
                        },
                      });
                    }
                  }
                  if (c.shape === 'edit-node-polygon' || c.shape === 'edit-node-circle-svg') {
                    if (t === 'fillColor') {
                      c.attr('body/fill', v.hex);
                    } else {
                      let linkData = JSON.parse(edge.getProp('link') || '{}');
                      if (!linkData.type) {
                        c.attr('text/style/fill', v.hex);
                      }
                    }
                  }
                });
            if (reverse) {
              const dataSource = getDataSource();
              const recentColors = [...new Set((dataSource.profile?.recentColors || [])
                  .concat(v.hex))];
              const start = recentColors.length - 8 > 0 ? recentColors.length - 8 : 0;
              const tempDataSource = {
                ...dataSource,
                profile: {
                  ...dataSource.profile,
                  recentColors: recentColors.slice(start, recentColors.length),
                },
              };
              updateDataSource && updateDataSource(tempDataSource);
            }
          } else if (t === 'layout') {
            updateLayout(edge, v);
          }
          t !== 'label' && t !== 'link' && dataChange && dataChange();
        });
      };
      const movePosition = {
        left: canvasContainerRect.left,
        top: canvasContainerRect.top,
      };
      const position = {
        left: left + width / 2 + rect.width / 2,
        top: rect.top - canvasContainerRect.top,
      };
      ReactDom.render(edge.isNode() ? <NodeTooltipContent
        getDataSource={getDataSource}
        movePosition={movePosition}
        position={position}
        id={id}
        onUpdate={onUpdate}
        node={edge}
        />
          : <EdgeTooltipContent
            getDataSource={getDataSource}
            movePosition={movePosition}
            position={position}
            id={id}
            onUpdate={onUpdate}
            edge={edge}/>, toolParent);
      cellTooltip.appendChild(toolParent);
    }
  }
};

export const edgeNodeRemoveTool = (id) => {
  const cellTooltip = document.getElementById(`${id}-cellTooltip`);
  if (cellTooltip) {
    Array.from(cellTooltip.children).forEach((c) => {
      cellTooltip.removeChild(c);
    });
    preNode = null;
  }
};
