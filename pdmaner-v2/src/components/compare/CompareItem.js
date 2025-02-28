import React from 'react';
import {Checkbox, FormatMessage, Icon, Tooltip} from 'components';
import Child from './CompareItemField';
import {getPrefix} from '../../lib/prefixUtil';

export default React.memo(({data: { isLeaf, sourceEntity,
    i, parent, dataKey, metaEntityData, metaFieldsData }, onRemove, searchValue,
                               onPicker, isCustomerMeta, defaultMeta, changes, metaDataFields,
                               countWidth, columnWidth, entitiesKeyChecked,checkBoxChange,
                               getTableDetail, isOpen, style, setExpand, prefix,
                               allColumnWidth, mergeFromMeta, columnFieldWidth, dB,
                               leftTitle, rightTitle, dataSource, customerDataSource}) => {
    const currentPrefix = getPrefix(prefix);
    if(!isLeaf) {
        if(i === 0 || i === 1) {
            return null;
        }
        const metaFieldsIndex = metaDataFields
            .findIndex(m => m.defKey?.toLocaleLowerCase() === dataKey);
        const metaEntity = metaEntityData || {};
        const currentChange = changes.filter(c => c.opt === 'update')
            .find(f => f.data.baseInfo?.defKey?.toLocaleLowerCase() === dataKey);
        const checkIsChange = (name) => {
            if(currentChange && currentChange.data?.baseChanged?.changeNames?.includes(name)) {
                return `${currentPrefix}-compare-list-container-content-list-item-change`;
            }
            return '';
        };
        const calcSearchValue = (value = '') => {
            const reg = new RegExp((searchValue || '').replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'ig');
            const str = `<span class=${currentPrefix}-compare-list-container-content-list-item-search>$&</span>`;
            const finalData = `<span>${(value || '').replace(reg, str)}</span>`;
            // eslint-disable-next-line react/no-danger,react/no-danger-with-children
            return <span dangerouslySetInnerHTML={{ __html: finalData }}
            >{}</span>;
        };
        const getStatus = () => {
            if(changes.findIndex(c => (c.data.defKey ||
                    c.data.baseInfo?.defKey)?.toLocaleLowerCase()
                === dataKey) > -1 && (isCustomerMeta ? true :
                (metaFieldsIndex > -1 || metaFieldsData || sourceEntity?.defKey))) {
                return [<span className={`${currentPrefix}-compare-list-container-content-list-item-diff`}>
                  <span>
                    <Icon type='fa-times-circle-o'/>
                  </span>
                  <span><FormatMessage id='components.compare.diff'/></span>
                </span>, 'diff'];
            } else if(metaFieldsIndex < 0 && !metaFieldsData) {
                // 未获取到详细的字段信息 未扫描
                return [<span className={`${currentPrefix}-compare-list-container-content-list-item-wait`}>
                  <span>
                    <Icon type='fa-clock-o'/>
                  </span>
                  <span><FormatMessage id='components.compare.wait'/></span>
                </span>, 'wait'];
            }
            return [<span className={`${currentPrefix}-compare-list-container-content-list-item-same`}>
              <span>
                <Icon type='fa-check-circle-o'/>
              </span>
              <span><FormatMessage id='components.compare.same'/></span>
            </span>, 'same'];
        };
        const _setExpand = (open) => {
          if(open) {
              setExpand(p => p.filter(id => id !== dataKey));
          } else {
              setExpand(p => p.concat(dataKey));
          }
        };
        const [statusCom, status] = getStatus();
        return <div style={{...style, width: allColumnWidth}} className={`${currentPrefix}-compare-list-container-content-list-item`}>
          <span
            style={{
                  position: 'sticky',
                  left: 0,
                  zIndex: 3,
                  width: countWidth + columnWidth.num + columnWidth.view + columnWidth.diff,
          }}
          >
            <span style={{width: countWidth + columnWidth.num}}>
              {
                      !isCustomerMeta && <Checkbox
                        disable={defaultMeta ? (!metaEntityData || !sourceEntity?.defKey)
                            : (!metaEntityData)}
                        onChange={e => checkBoxChange(e, dataKey)}
                        checked={entitiesKeyChecked.includes(dataKey)}
                      />
                  }
              <span>{i - 1}</span>
            </span>
            <span style={{width: columnWidth.view}}>
              {
                      status === 'wait' ? '' : <a onClick={() => _setExpand(isOpen)}>{FormatMessage.string({id: `components.compare.${isOpen ? 'fold' : 'view'}`})}</a>
                  }
            </span>
            <span style={{width: columnWidth.diff}}>
              {statusCom}
            </span>
          </span>
          <span>
            <Tooltip placement='top' title={sourceEntity.defKey}>
              <span style={{width: columnWidth.defKey / 2}} className={`${currentPrefix}-compare-list-container-content-list-item-defKey`}>
                <span className={checkIsChange('defKey')}>
                  {calcSearchValue(sourceEntity.defKey)}
                </span>
                {defaultMeta && <a onClick={() => onPicker(dataKey, 'left')}><FormatMessage id='components.compare.entityPicker'/></a>}
              </span>
            </Tooltip>
            <Tooltip placement='top' title={sourceEntity.defName}>
              <span style={{width: columnWidth.defName / 2}}>
                <span className={checkIsChange('defName')}>{calcSearchValue(sourceEntity.defName)}</span>
              </span>
            </Tooltip>
            <Tooltip placement='top' title={sourceEntity.comment}>
              <span style={{width: columnWidth.comment / 2}} className={`${currentPrefix}-compare-list-container-content-list-item-comment`}>
                <span className={checkIsChange('comment')}>{sourceEntity.comment}</span>
              </span>
            </Tooltip>
            <span style={{textAlign: 'right', width: columnWidth.fieldsCount / 2}}>
              <span>{sourceEntity.fields?.length}</span>
            </span>
          </span>
          <span style={{width: columnWidth.opt, textAlign: 'center'}}>
            {
                    metaEntity.defKey && <span>
                      {!isCustomerMeta && (defaultMeta ?
                          (metaEntity.defKey && sourceEntity.defKey) : true) && <a
                            onClick={() => getTableDetail(defaultMeta
                                ? dataKey : metaEntity.defKey)}
                              >
                            <FormatMessage id="components.compare.scan"/>
                          </a>}
                      {status !== 'wait' && <>{ !isCustomerMeta && (status !== 'same') && <span className={`${currentPrefix}-compare-list-container-content-list-item-line`}>{}</span>}
                        {status !== 'same' && <a
                          onClick={() => mergeFromMeta(metaEntity.defKey,
                              sourceEntity.defKey, dataKey)}
                            >
                          <FormatMessage
                            id={`components.compare.${defaultMeta ? 'mergeToLeft' : 'mergeToModel'}`}/>
                        </a>}</>}
                    </span>
                }
          </span>
          <span>
            <Tooltip placement='top' title={metaEntity.defKey}>
              <span
                style={{width: columnWidth.defKey / 2}}
                className={`${currentPrefix}-compare-list-container-content-list-item-defKey`}>
                <span>
                  {calcSearchValue(metaEntity.defKey)}
                </span>
                {defaultMeta && <a onClick={() => onPicker(dataKey, 'right')}><FormatMessage id='components.compare.entityPicker'/></a>}
              </span>
            </Tooltip>
            <Tooltip placement='top' title={metaEntity.defName}>
              <span style={{width: columnWidth.defName / 2}}>
                <span>{calcSearchValue(metaEntity.defName)}</span>
              </span>
            </Tooltip>
            <Tooltip placement='top' title={metaEntity.defName}>
              <span
                style={{width: columnWidth.comment / 2}}
                className={`${currentPrefix}-compare-list-container-content-list-item-comment`}>
                <span>{metaEntity.comment}</span>
              </span>
            </Tooltip>
            <span
              style={{textAlign: 'right', width: columnWidth.fieldsCount / 2, borderRightWidth: defaultMeta ? 0 : 1}}>
              <span>{(metaFieldsData || metaDataFields[metaFieldsIndex])?.fields?.length}</span>
            </span>
            {defaultMeta && <span
              style={{ width: columnWidth.remove}}
              className={`${currentPrefix}-compare-list-container-content-list-item-remove`}>
              <span onClick={() => onRemove(dataKey)}><FormatMessage id='components.compare.remove'/></span>
              </span>}
          </span>
        </div>;
    }
    return <div
      style={{
            ...style,
            width: allColumnWidth,
            paddingTop: i === 0 ? 5 : 0,
        }}
      className={`${currentPrefix}-compare-list-container-content-list-item-field-container`}
    >
      <Child
        style={style}
        i={i}
        dB={dB}
        columnFieldWidth={columnFieldWidth}
        parent={parent}
        dataKey={dataKey}
        changes={changes}
        leftTitle={leftTitle}
        rightTitle={rightTitle}
        isCustomerMeta={isCustomerMeta}
        metaDataFields={metaDataFields}
        dataSource={dataSource}
        customerDataSource={customerDataSource}
        />
    </div>;
});
