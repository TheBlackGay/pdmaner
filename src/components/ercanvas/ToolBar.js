import React, {forwardRef, useImperativeHandle, useState, useEffect, useRef} from 'react';
import {FormatMessage, Icon, Slider, Tooltip} from 'components';
import numeral from 'numeral';
import {getPrefix} from '../../lib/prefixUtil';
import { addBodyEvent, removeBodyEvent } from '../../lib/listener';

export default React.memo(forwardRef(({prefix, redo, undo, setSelection,
                                          sliderChange, setMinimap}, ref) => {
    const sliderIconRef = useRef(null);
    const sliderRef = useRef(null);
    const [historyStatus, setHistoryStatus] = useState([true, true]);
    const [enableSelection, setEnableSelection] = useState(true);
    const [scaleNumber, setScaleNumber] = useState(1);
    const [mapOpen, setMapOpen] = useState(false);
    const [sliderOpen, setSliderOpen] = useState(false);
    const _setEnableSelection = (v) => {
        setEnableSelection(v);
        setSelection(v);
    };
    const _setMapOpen = () => {
        setMapOpen(!mapOpen);
        setMinimap();
    };
    const _setSliderOpen = () => {
        setSliderOpen(pre => !pre);
    };
    useEffect(() => {
        const eventId = Math.uuid();
        const eventName = 'onclick';
        addBodyEvent(eventName, eventId, (e) => {
            if ((e.target !== sliderIconRef.current) && (e.target !== sliderRef.current)
                && (!sliderRef.current?.contains(e.target))) {
                setSliderOpen(false);
            }
        });
        return () => {
            removeBodyEvent(eventName, eventId);
        };
    }, []);
    useImperativeHandle(ref,() => {
        return {
            historyChange: ({undoStack, redoStack}) => {
                setHistoryStatus([undoStack.length === 0, redoStack.length === 0]);
            },
            scaleChange: (scale) => {
                setScaleNumber(scale);
            },
            setMinimap: () => {
                setMapOpen(pre => !pre);
            },
        };
    }, []);
    const currentPrefix = getPrefix(prefix);
    return <div className={`${currentPrefix}-relation-toolbar`}>
      <div className={`${currentPrefix}-relation-toolbar-item`}>
        <Tooltip
          offsetTop={2}
          title={FormatMessage.string({id: 'toolbar.undo'})}
          force
          placement='top'>
          <Icon onClick={undo} type='icon-bianzu4' disable={historyStatus[0]}/>
        </Tooltip>
        <div className={`${currentPrefix}-relation-toolbar-line`}/>
        <Tooltip
          offsetTop={2}
          title={FormatMessage.string({id: 'toolbar.redo'})}
          force
          placement='top'>
          <Icon onClick={redo} type='icon-bianzu3' disable={historyStatus[1]}/>
        </Tooltip>
      </div>
      <div className={`${currentPrefix}-relation-toolbar-item`}>
        <Tooltip
          offsetTop={4}
          title={FormatMessage.string({id: 'toolbar.selection'})}
          force
          placement='top'>
          <Icon
            onClick={() => _setEnableSelection(!enableSelection)}
            type={enableSelection ? 'fa-hand-pointer-o' : 'fa-hand-rock-o'}/>
        </Tooltip>
        <div className={`${currentPrefix}-relation-toolbar-line`}/>
        <span className={`${currentPrefix}-relation-toolbar-size`}>
          <Tooltip
            offsetTop={2}
            title={FormatMessage.string({id: 'toolbar.resetScale'})}
            force
            placement='top'>
            <span onClick={() => sliderChange('fit')}>{parseInt(numeral(scaleNumber).multiply(100).value(), 10)}%</span>
          </Tooltip>
          <Icon ref={sliderIconRef} onClick={_setSliderOpen} type='fa-caret-down'/>
        </span>
        <Tooltip
          offsetTop={2}
          title={FormatMessage.string({id: 'toolbar.map'})}
          force
          placement='top'>
          <Icon
            className={`${currentPrefix}-relation-toolbar-map-${mapOpen ? 'open' : 'default'}`}
            onClick={() => _setMapOpen(!mapOpen)}
            type='fa-map-o'/>
        </Tooltip>
      </div>
      {sliderOpen && <div ref={sliderRef} className={`${currentPrefix}-relation-toolbar-slider`}>
        <Slider onChange={sliderChange} value={numeral(scaleNumber).multiply(50).value()}/>
      </div>}
    </div>;
}));
