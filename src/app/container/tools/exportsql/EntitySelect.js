import React, {forwardRef, useImperativeHandle, useRef} from 'react';

import {FormatMessage, Tree} from 'components';

import { calcUnGroupDefKey } from '../../../../lib/datasource_util';

import { separator } from '../../../../../profile';
import {firstUp} from '../../../../lib/string';

export default React.memo(forwardRef(({dataSource, defaultCheckeds, prefix, templateType}, ref) => {
  const checkedsRef = useRef([]);
  useImperativeHandle(ref, () => {
    return {
      getCheckeds: () => {
        return checkedsRef.current;
      },
    };
  }, []);
  const getTreeData = () => {
    const refData = {};
    if (templateType === 'dict') {
      refData.refDicts = calcUnGroupDefKey(dataSource, 'dicts');
    } else {
      refData.refEntities = calcUnGroupDefKey(dataSource,'entities');
      refData.refViews = calcUnGroupDefKey(dataSource,'views');
    }
    return (dataSource.viewGroups || [])
        .concat({
          id: '__ungroup',
          defKey: '__ungroup',
          defName: FormatMessage.string({id: 'exportSql.defaultGroup'}),
          ...refData,
        })
        .filter((g) => {
          if (templateType === 'dict') {
            return ((g.refDicts || []).length > 0);
          }
          return ((g.refEntities || []).length > 0) || ((g.refViews || []).length > 0);
        })
        .map((g) => {
      const getData = dataName => (dataSource[dataName] || [])
          .filter(e => (g[`ref${firstUp(dataName)}`] || []).includes(e.id));
      const children = templateType === 'dict' ? getData('dicts').map(d => ({
        key: `${g.id}${separator}dicts${separator}${d.id}`,
        value: `${d.defName}(${d.defKey})`,
      })) : [{
        key: `${g.id}${separator}entities`,
        value: FormatMessage.string({id: 'exportSql.entityList'}),
        children: getData('entities').map(d => ({
          key: `${g.id}${separator}entities${separator}${d.id}`,
          value: `${d.defName}(${d.defKey})`,
        })),
      }, {
        key: `${g.id}${separator}views`,
        value: FormatMessage.string({id: 'exportSql.viewList'}),
        children: getData('views').map(d => ({
          key: `${g.id}${separator}views${separator}${d.id}`,
          value: `${d.defName}(${d.defKey})`,
        })),
      }].filter(c => c.children.length > 0);
      return {
        key: g.id,
        value: g.defName || g.defKey,
        children,
      };
    });
  };
  const onChange = (keys) => {
    checkedsRef.current = keys;
  };
  return <div className={`${prefix}-export-sql-entity-select`}>
    <Tree
      dataSource={getTreeData()}
      defaultCheckeds={defaultCheckeds}
      onChange={onChange}
    />
  </div>;
}));
