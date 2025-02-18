import React, {useCallback, useRef} from 'react';
import { Table, SimpleTab, FormatMessage } from 'components';
import {getPrefix} from '../../../lib/prefixUtil';
import DefaultColumn from './DefaultColumn';
import EntityBasePropertiesList from './EntityInitProperties';
import {attNames} from '../../../lib/datasource_util';

export default React.memo(({ prefix, dataSource, dataChange,
                               updateDataSource, getDataSource, active }) => {
  const data = dataSource?.profile?.default?.entityInitFields || [];
  const currentPrefix = getPrefix(prefix);
  const currentHeaders = useRef(dataSource?.profile?.headers || []);
  const fieldsChange = (value, name) => {
    if (name === 'fields') {
        dataChange && dataChange(value, 'profile.default.entityInitFields');
    } else if(name === 'headers'){
        currentHeaders.current = currentHeaders.current.map(h => {
           const change = value.filter(v => v.refKey === h.refKey)[0];
           if (change) {
               return {
                   ...h,
                   freeze: change.freeze,
               };
           }
           return h;
        });
        dataChange && dataChange(currentHeaders.current, 'profile.headers');
        dataChange && dataChange(true, 'freeze');
    }
  }
  const extAttrPropsUpdate = (value) => {
      dataChange && dataChange(value, 'profile.extAttrProps');
  }
  const columnsChange = (value) => {
      currentHeaders.current = value.map(h => {
          const current = currentHeaders.current.filter(v => v.refKey === h.refKey)[0];
          if (current) {
              return {
                  ...h,
                  freeze: current.freeze || false,
              };
          }
          return h;
      });
      dataChange && dataChange(currentHeaders.current, 'profile.headers');
  }
    const search = useCallback((f, value) => {
        const reg = new RegExp((value || '')
            .replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
        return reg.test(f.defName) || reg.test(f.defKey);
    }, []);
  return <div className={`${currentPrefix}-setting-entity-init-fields`}><SimpleTab
      className={`${currentPrefix}-database-container-tab`}
      defaultActive={active.split('.')[1] || '1'}
      options={[
        {
          key: '1',
          title: FormatMessage.string({id: 'config.EntityInitFields'}),
          content: <Table
              search={search}
              needHideInGraph={false}
              disableHeaderIcon
              getDataSource={getDataSource}
              updateDataSource={updateDataSource}
              disableHeaderSort
              disableHeaderReset
              freeze
              data={{
                  fields: data,
                  headers: (dataSource.profile?.headers?.filter(h => h.enabled !== false && !attNames.includes(h.refKey)))
              }}
              dataSource={dataSource}
              tableDataChange={fieldsChange}
          />
        },
        {
          key: '2',
          title: FormatMessage.string({id: 'config.EntityBasePropertiesList'}),
          content: <EntityBasePropertiesList dataSource={dataSource} dataChange={dataChange}/>
        },
          {
              key: '3',
              title: FormatMessage.string({id: 'config.EntityInitColumn'}),
              content: <DefaultColumn extAttrPropsUpdate={extAttrPropsUpdate} className={`${currentPrefix}-setting-entity-init-columns`} dataSource={dataSource} columnsChange={columnsChange}/>
          },
      ]}
  /></div>;
});
