import React, {useEffect, useState} from 'react';
import {Button, FormatMessage, Icon, Modal, openModal} from 'components';

import './style/index.less';
import {getPrefix} from '../../lib/prefixUtil';

import MetaEdit from './MetaEdit';

export default React.memo(({style, prefix, dataSource, onSelected, menuType,
                               versionType, updateDataSource}) => {
    const [selected, setSelected] = useState('');
    const _setSelected = (m, isCustomer) => {
        setSelected(m);
        onSelected && onSelected(m, isCustomer);
    };
    useEffect(() => {
        if (menuType === '4' && versionType === '2') {
            setSelected('');
            onSelected && onSelected('');
        }
    }, [menuType]);
    useEffect(() => {
        if (versionType === '1') {
            // 重置选中
            setSelected('');
        }
    }, [versionType]);
    const currentPrefix = getPrefix(prefix);
    const dataTypeSupports = dataSource.profile?.dataTypeSupports || [];
    const metaData = dataSource.profile.metaData || [];
    const metaEdit = (data) => {
        let modal;
        let tempData = {...data};
        const close = () => {
            modal && modal.close();
        };
        const onOk = () => {
            const validateMetaData = () => {
                const requiredNames = ['defName', 'type'];
               if (!tempData.type || (tempData.type === 'URL' && requiredNames.concat('url').some(n => !tempData[n]))) {
                    return FormatMessage.string({id: 'components.compare.notAllowEmpty'});
                } else if(tempData.type === 'FILE' && requiredNames.concat('file').some(n => !tempData[n])) {
                   return FormatMessage.string({id: 'components.compare.notAllowEmpty'});
               } else if(metaData.findIndex((m) => {
                    return (m.defName === tempData.defName) && (m.defKey !== tempData.defKey);
                }) > -1) {
                   return FormatMessage.string({id: 'components.compare.notAllowRepeat'});
               }
               return '';
            };
            const validateMessage = validateMetaData();
            if(!validateMessage) {
                updateDataSource({
                    ...dataSource,
                    profile: {
                        ...dataSource.profile,
                        metaData: data ? (dataSource.profile.metaData || []).map((p) => {
                            if (p.defKey === data.defKey) {
                                return {...tempData};
                            }
                            return p;
                        }) : (dataSource.profile.metaData || []).concat({
                            ...tempData,
                            defKey: Math.uuid(),
                        }),
                    },
                });
                modal && modal.close();
            } else {
                Modal.error({
                    title: FormatMessage.string({id: 'optFail'}),
                    message: validateMessage,
                });
            }
        };
        const dataChange = (d) => {
            tempData = d;
        };
        modal = openModal(<MetaEdit data={data} dataChange={dataChange}/>, {
            title: data ? FormatMessage.string({id: 'components.compare.editMeta'}) : FormatMessage.string({id: 'components.compare.addMeta'}),
            buttons: [
              <Button type='primary' key='primary' onClick={onOk}><FormatMessage id='button.ok'/></Button>,
              <Button key='close' onClick={close}><FormatMessage id='button.cancel'/></Button>],
        });
    };
    const metaOptClick = (e, data, type) => {
      e.stopPropagation();
      if (type === 'edit') {
          metaEdit(data);
      } else {
          Modal.confirm({
              title: FormatMessage.string({id: 'deleteConfirmTitle'}),
              message: FormatMessage.string({id: 'deleteConfirmTitle'}),
              onOk:() => {
                  updateDataSource({
                      ...dataSource,
                      profile: {
                          ...dataSource.profile,
                          metaData: (dataSource.profile.metaData || [])
                              .filter(p => p.defKey !== data.defKey),
                      },
                  });
              },
          });
      }
    };
    return <div style={style} className={`${currentPrefix}-compare`}>
      <div className={`${currentPrefix}-compare-db`}>
        <div className={`${currentPrefix}-compare-title`}>
          <FormatMessage id='components.compare.db'/>
        </div>
        <div className={`${currentPrefix}-compare-body`}>
          {
              (dataSource.dbConn || []).map((d) => {
                    return <div
                      onClick={() => _setSelected(d.defKey, false)}
                      className={`${currentPrefix}-compare-body-item ${currentPrefix}-compare-body-item-${selected === d.defKey ? 'selected' : 'normal'} `}
                      key={d.defKey}
                    >
                      <span>
                        {d.defName}
                      </span>
                      <span>
                        {
                            dataTypeSupports.filter(t => t.id === d.type)[0]?.defKey || ''
                        }
                      </span>
                    </div>;
                })
          }
        </div>
      </div>
      <div className={`${currentPrefix}-compare-customer`}>
        <div className={`${currentPrefix}-compare-title`}>
          <span>
            <FormatMessage id='components.compare.customer'/>
          </span>
          <span><Icon onClick={() => metaEdit()} type='fa-plus-circle'/></span>
        </div>
        <div className={`${currentPrefix}-compare-body`}>
          {
                metaData.map((d) => {
                    return <div
                      onClick={() => _setSelected(d.defKey, true)}
                      className={`${currentPrefix}-compare-body-item ${currentPrefix}-compare-body-item-${selected === d.defKey ? 'selected' : 'normal'} `}
                      key={d.defKey}
                    >
                      <span>
                        {d.defName}
                      </span>
                      <span>
                        <FormatMessage id={`components.compare.${d.type}`}/>
                      </span>
                      <span className={`${currentPrefix}-compare-body-item-opt`}>
                        <Icon onClick={e => metaOptClick(e, d, 'edit')} type='fa-edit'/>
                        <Icon onClick={e => metaOptClick(e, d, 'delete')} type='fa-trash'/>
                      </span>
                    </div>;
                })
            }
        </div>
      </div>
    </div>;
});
