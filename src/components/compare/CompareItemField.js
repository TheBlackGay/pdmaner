import React from 'react';
import {FormatMessage, Icon, Tooltip} from 'components';
import {transform} from '../../lib/datasource_util';
import {getPrefix} from '../../lib/prefixUtil';

export default React.memo(({parent: { sourceEntity, key, metaFieldsData }, metaDataFields,
                               changes, i, leftTitle, rightTitle, dataSource, customerDataSource,
                               dataKey, prefix, columnFieldWidth, dB, isCustomerMeta}) => {
    const currentPrefix = getPrefix(prefix);
    if(i === 0){
        return  <div className={`${currentPrefix}-compare-list-container-content-list-item-field-first`}>
          <span style={{width: columnFieldWidth.status}} />
          <span style={{width: `calc(50% - ${columnFieldWidth.status / 2}px`}}>
            {leftTitle || <FormatMessage id='components.compare.model'/>}
          </span>
          <span style={{width: `calc(50% - ${columnFieldWidth.status / 2}px`}}>
            {rightTitle || <FormatMessage id={`components.compare.${isCustomerMeta ? 'customerMeta' : 'dbMeta'}`}/>}
          </span>
        </div>;
    } else if(i === 1){
        return  <div
          className={`${currentPrefix}-compare-list-container-content-list-item-field ${currentPrefix}-compare-list-container-content-list-item-field-second`}
        >
          <span style={{width: columnFieldWidth.status}} />
          <span style={{width: columnFieldWidth.defKey}}><FormatMessage id='components.compare.fieldCode'/></span>
          <span style={{width: columnFieldWidth.defName}}><FormatMessage id='components.compare.name'/></span>
          <span style={{width: columnFieldWidth.type}}><FormatMessage id='components.compare.type'/></span>
          <span style={{width: columnFieldWidth.length}}><FormatMessage id='components.compare.len'/></span>
          <span style={{width: columnFieldWidth.scale}}><FormatMessage id='components.compare.scale'/></span>
          <span style={{width: columnFieldWidth.comment}}><FormatMessage id='components.compare.comment'/></span>
          <span style={{width: columnFieldWidth.defKey}}><FormatMessage id='components.compare.fieldCode'/></span>
          <span style={{width: columnFieldWidth.defName}}><FormatMessage id='components.compare.name'/></span>
          <span style={{width: columnFieldWidth.type}}><FormatMessage id='components.compare.type'/></span>
          <span style={{width: columnFieldWidth.length}}><FormatMessage id='components.compare.len'/></span>
          <span style={{width: columnFieldWidth.scale}}><FormatMessage id='components.compare.scale'/></span>
          <span style={{width: columnFieldWidth.comment}}><FormatMessage id='components.compare.comment'/></span>
        </div>;
    }
    const [cDb, pDb] = dB;
    const metaFields = metaDataFields
        .find(m => m.defKey?.toLocaleLowerCase() === key);
    const metaEntity = metaFieldsData || metaFields || {};
    const metaFieldIndex = (metaEntity.fields || [])
        .findIndex(e => e.defKey?.toLocaleLowerCase() === dataKey);
    const sourceTempField = (sourceEntity.fields || [])
        .find(e => e.defKey?.toLocaleLowerCase() === dataKey); // 源字段
    // 源字段转化
    const sourceField = sourceTempField ? {
        ...sourceTempField,
        ...transform(sourceTempField, dataSource, cDb),
    } : {};
    // 目标字段
    const metaTempField = (metaEntity.fields || [])[metaFieldIndex];
    // 如果是非数据库来源则需要类型转化
    const metaField = metaTempField ?
        {
            ...metaTempField,
            ...transform(metaTempField, {
                ...dataSource,
                ...customerDataSource,
            }, isCustomerMeta ? pDb : cDb),
        } : {};
    const change = changes.find((c) => {
        const defKey = (c.data?.defKey || c.data?.baseInfo?.defKey)?.toLocaleLowerCase();
        return defKey === key;
    });
    const calcIsDiff = () => {
        if(!change) {
            // 没有变更
            return false;
        } else if(change.opt !== 'update') {
            // 新增/删除
            return true;
        } else if((change.data.fieldAdded || [])
            .concat(change.data.fieldRemoved || [])
            .concat(change.data.fieldModified || [])
            .some((c) => {
                return c.defKey?.toLocaleLowerCase() === dataKey;
            })) {
            // 字段修改
            return true;
        }
        return false;
    };
    const isDiff = calcIsDiff();
    const currentField = (change?.data?.fieldModified || [])
        .find(f => f.defKey?.toLocaleLowerCase() === dataKey);
    const checkIsChange = (name) => {
        if(currentField && currentField.changeNames.includes(name)) {
           return `${currentPrefix}-compare-list-container-content-list-item-field-change`;
        }
        return '';
    };
    return <div className={`${currentPrefix}-compare-list-container-content-list-item-field`}>
      <span style={{width: columnFieldWidth.status}}>
        <span className={`${currentPrefix}-compare-list-container-content-list-item-${isDiff ? 'diff' : 'same'}`}>
          {
                  isDiff ?  <Icon type='fa-times-circle-o'/> : <Icon type='fa-check-circle-o'/>
              }
        </span>
      </span>
      <Tooltip placement='top' title={sourceField.defKey}>
        <span className={checkIsChange('defKey')} style={{textAlign: 'left', width: columnFieldWidth.defKey}}>
          <span>{sourceField.defKey}</span>
        </span>
      </Tooltip>
      <Tooltip placement='top' title={sourceField.defName}>
        <span className={checkIsChange('defName')} style={{textAlign: 'left', width: columnFieldWidth.defName}}>
          <span>{sourceField.defName}</span>
        </span>
      </Tooltip>
      <Tooltip placement='top' title={sourceField.defKey && sourceField.type}>
        <span className={checkIsChange('type')} style={{textAlign: 'left', width: columnFieldWidth.type}}>
          <span>{sourceField.defKey && sourceField.type}</span>
        </span>
      </Tooltip>
      <span className={checkIsChange('len')} style={{textAlign: 'right', width: columnFieldWidth.length}}>
        <span>{sourceField.defKey && sourceField.len}</span>
      </span>
      <span className={checkIsChange('scale')} style={{textAlign: 'right', width: columnFieldWidth.scale}}>
        <span>{sourceField.defKey && sourceField.scale}</span>
      </span>
      <Tooltip placement='top' title={sourceField.comment}>
        <span
          style={{textAlign: 'left', width: columnFieldWidth.comment}}
          className={`${currentPrefix}-compare-list-container-content-list-item-comment ${checkIsChange('comment')}`}
        >
          <span>{sourceField.comment}</span>
        </span>
      </Tooltip>
      <Tooltip placement='top' title={metaField.defKey}>
        <span style={{textAlign: 'left', width: columnFieldWidth.defKey}}>
          <span>{metaField.defKey}</span>
        </span>
      </Tooltip>
      <Tooltip placement='top' title={metaField.defName}>
        <span style={{textAlign: 'left', width: columnFieldWidth.defName}}>
          <span>{metaField.defName}</span>
        </span>
      </Tooltip>
      <Tooltip placement='top' title={metaField.type}>
        <span style={{textAlign: 'left', width: columnFieldWidth.type}}>
          <span>{metaField.type}</span>
        </span>
      </Tooltip>
      <span style={{textAlign: 'right', width: columnFieldWidth.length}}>
        <span>{metaField.len}</span>
      </span>
      <span style={{textAlign: 'right', width: columnFieldWidth.scale}}>
        <span>{metaField.scale}</span>
      </span>
      <Tooltip placement='top' title={metaField.comment}>
        <span style={{textAlign: 'left', width: columnFieldWidth.comment}} className={`${currentPrefix}-compare-list-container-content-list-item-comment`}>
          <span>{metaField.comment}</span>
        </span>
      </Tooltip>
    </div>;
});
