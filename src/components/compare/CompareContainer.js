import React, {forwardRef} from 'react';
import {FormatMessage} from 'components';
import {getPrefix} from '../../lib/prefixUtil';

export default forwardRef(({ children, prefix, allColumnWidth, columnWidth, countWidth,
                               isCustomerMeta, rightTitle, defaultMeta, leftTitle, checkBoxChange,
                               type, ...restProps }, ref) => {
    const currentPrefix = getPrefix(prefix);
    return  <div
      ref={ref}
      {...restProps}
      className={`${currentPrefix}-compare-list-container-content-list-inner`}>
      <div
        className={`${currentPrefix}-compare-list-container-content-list-header`}
        style={{top: 0, position: 'sticky', zIndex: 4, height: 27, width: allColumnWidth}}
        >
        <span
          style={{
                    position: 'sticky',
                    left: 0,
                    zIndex: 4,
                    width: countWidth + columnWidth.num + columnWidth.view + columnWidth.diff,
                }}
            >
          <span><FormatMessage id='components.compare.optOrResult'/></span>
        </span>
        <span
          style={{
                    width: (columnWidth.defKey + columnWidth.defName +
                        columnWidth.comment + columnWidth.fieldsCount) / 2,
                }}
            >
          <span>{leftTitle || <FormatMessage id='components.compare.model'/>}</span>
        </span>
        <span style={{width: columnWidth.opt}}>{}</span>
        <span
          style={{
              borderRightWidth: defaultMeta ? 0 : 1,
                    width: (columnWidth.defKey + columnWidth.defName +
                        columnWidth.comment + columnWidth.fieldsCount) / 2,
                }}
            >{rightTitle || <FormatMessage id={`components.compare.${isCustomerMeta ? 'customerMeta' : 'dbMeta'}`}/>}</span>
        {defaultMeta && <span
          style={{width: columnWidth.remove}}
          className={`${currentPrefix}-compare-list-container-content-list-item-remove`}
        />}
      </div>
      <div
        style={{top: 27, position: 'sticky', zIndex: 4, height: 27, width: allColumnWidth}}
        className={`${currentPrefix}-compare-list-container-content-list-item ${currentPrefix}-compare-list-container-content-list-item-first`}
        >
        <span
          style={{
                    position: 'sticky',
                    left: 0,
                    zIndex: 4,
                    width: countWidth + columnWidth.num + columnWidth.view + columnWidth.diff,
                }}
            >
          <span
            style={{width: countWidth + columnWidth.num}}
              >
            {!isCustomerMeta && <span
              className={`${currentPrefix}-listselect-opt-${type}`}
              onClick={() => checkBoxChange(null, type)}
                >
                {}
              </span>}
          </span>
          <span style={{width: columnWidth.view}}>
            <span><FormatMessage id='components.compare.view'/></span>
          </span>
          <span style={{width: columnWidth.diff}}>
            <span><FormatMessage id='components.compare.diffData'/></span>
          </span>
        </span>
        <span>
          <span style={{width: columnWidth.defKey / 2}}>
            <span><FormatMessage id='components.compare.code'/></span>
          </span>
          <span style={{width: columnWidth.defName / 2}}>
            <span><FormatMessage id='components.compare.name'/></span>
          </span>
          <span style={{width: columnWidth.comment / 2}}>
            <span><FormatMessage id='components.compare.comment'/></span>
          </span>
          <span style={{width: columnWidth.fieldsCount / 2}}>
            <span><FormatMessage id='components.compare.fieldCount'/></span>
          </span>
        </span>
        <span style={{width: columnWidth.opt}}> <span><FormatMessage id='components.compare.opt'/></span></span>
        <span>
          <span style={{width: columnWidth.defKey / 2}}>
            <span><FormatMessage id='components.compare.code'/></span>
          </span>
          <span style={{width: columnWidth.defName / 2}}>
            <span><FormatMessage id='components.compare.name'/></span>
          </span>
          <span style={{width: columnWidth.comment / 2}}>
            <span><FormatMessage id='components.compare.comment'/></span>
          </span>
          <span style={{width: columnWidth.fieldsCount / 2, borderRightWidth: defaultMeta ? 0 : 1}}>
            <span><FormatMessage id='components.compare.fieldCount'/></span>
          </span>
          {defaultMeta && <span
            style={{width: columnWidth.remove}}
            className={`${currentPrefix}-compare-list-container-content-list-item-remove`}
          >
            <FormatMessage id='components.compare.delete'/>
          </span>}
        </span>
      </div>
      {children}
    </div>;
});
