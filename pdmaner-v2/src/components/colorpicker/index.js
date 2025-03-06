import React, { forwardRef, useState } from 'react';
import {SketchPicker} from 'react-color';
import FormatMessage from '../formatmessage';
import Icon from '../icon';
import {getPrefix} from '../../lib/prefixUtil';

import './style/index.less';
import {getPresetColors} from '../../lib/datasource_util';

export default React.memo(forwardRef(({prefix, onChange, recentColors, defaultColor,
                                          restColor, isSimple, style, closeable, footer,
                                          onClose, ...restProps}, ref) => {
    const [currentColor, setCurrentColor] = useState(defaultColor);
    const currentPrefix = getPrefix(prefix);
    const _onChange = (color) => {
        setCurrentColor(color.hex);
        onChange && onChange(color);
    };
    const onChangeComplete = (color) => {
       onChange && onChange(color, true);
    };
    const _iconClose = () => {
        onClose && onClose();
    };
    const realValue = 'color' in restProps ? restProps.color : currentColor;
    return <div className={`${currentPrefix}-color-picker`} style={style} ref={ref}>
      {
            closeable && <div className={`${currentPrefix}-color-picker-header`}>
              <FormatMessage id="components.colorPicker.picker"/>
              <Icon className={`${currentPrefix}-color-picker-header-icon`} type='fa-times' onClick={_iconClose}/>
            </div>
      }
      <SketchPicker
        disableAlpha
        presetColors={getPresetColors()}
        color={realValue}
        onChange={_onChange}
        onChangeComplete={onChangeComplete}
        />
      {!isSimple && <div className={`${currentPrefix}-color-picker-footer`}>
        <div><FormatMessage id="components.colorPicker.recent"/></div>
        <div>
          {
                    recentColors.map((r) => {
                        return <div
                          onClick={() => onChange({hex: r})}
                          key={r}
                          title={r}
                          style={{background: r}}
                          className={`${currentPrefix}-color-picker-footer-item`}>{}</div>;
                    })
                }
        </div>
        <div><a onClick={() => onChange({hex: restColor})}><FormatMessage
          id="components.colorPicker.reset"/></a></div>
        </div>}
      {footer}
    </div>;
}));
