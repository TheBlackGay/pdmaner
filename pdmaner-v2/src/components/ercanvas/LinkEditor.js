import React, { useState, useRef } from 'react';
import {FormatMessage, Radio, Text, Tree} from 'components';
import {getPrefix} from '../../lib/prefixUtil';
import {calcUnGroupDefKey} from '../../lib/datasource_util';
import {firstUp} from '../../lib/string';
import {separator} from '../../../profile';

export default React.memo(({prefix, data, onChange, getDataSource}) => {
  const dataRef = useRef({...data});
  const dataSource = useRef(getDataSource());
  const [type, setType] = useState(data.type);
    const _onChange = (e, t) => {
      if (t === 'type') {
        setType(e.target.value);
        dataRef.current = {
          type: e.target.value,
          value: '',
        };
      } else {
        dataRef.current.value = e?.target?.value || e[0];
      }
      onChange && onChange(dataRef.current);
    };
  const getTreeData = () => {
    // "modalAll"
    const modelType = dataSource.current?.profile?.modelType;
    if (modelType === 'modalAll') {
      return ['entities', 'logicEntities', 'views', 'diagrams', 'dicts'].map((v) => {
        return {
          key: v,
          value: FormatMessage.string({id: `project.${v === 'diagrams' ? 'diagram' : v}`}),
          children: (dataSource.current?.[v] || []).map(e => ({
            key: e.id,
            value: `${e.defKey}-${e.defName}`,
          })),
        };
      });
    }
    const refData = {
      refDiagrams: calcUnGroupDefKey(dataSource.current, 'diagrams'),
      refDicts: calcUnGroupDefKey(dataSource.current, 'dicts'),
      refEntities: calcUnGroupDefKey(dataSource.current,'entities'),
      refLogicEntities: calcUnGroupDefKey(dataSource.current,'logicEntities'),
      refViews: calcUnGroupDefKey(dataSource.current,'views'),
    };
    return (dataSource.current.viewGroups || [])
        .concat({
          id: '__ungroup',
          defKey: '__ungroup',
          defName: FormatMessage.string({id: 'exportSql.defaultGroup'}),
          ...refData,
        })
        .filter((g) => {
          return ['refDiagrams', 'refDicts', 'refEntities', 'refViews', 'refLogicEntities'].some((d) => {
            return g[d]?.length > 0;
          });
        })
        .map((g) => {
          const getData = dataName => (dataSource.current[dataName] || [])
              .filter(e => (g[`ref${firstUp(dataName)}`] || []).includes(e.id));
          const children = [{
            key: `${g.id}${separator}entities`,
            value: FormatMessage.string({id: 'project.entities'}),
            children: getData('entities').map(d => ({
              key: `${g.id}${separator}${d.id}`,
              value: `${d.defName}(${d.defKey})`,
            })),
          },{
            key: `${g.id}${separator}logicEntities`,
            value: FormatMessage.string({id: 'project.logicEntities'}),
            children: getData('logicEntities').map(d => ({
              key: `${g.id}${separator}${d.id}`,
              value: `${d.defName}(${d.defKey})`,
            })),
          }, {
            key: `${g.id}${separator}views`,
            value: FormatMessage.string({id: 'project.views'}),
            children: getData('views').map(d => ({
              key: `${g.id}${separator}${d.id}`,
              value: `${d.defName}(${d.defKey})`,
            })),
          },
            {
              key: `${g.id}${separator}dicts`,
              value: FormatMessage.string({id: 'project.dicts'}),
              children: getData('dicts').map(d => ({
                key: `${g.id}${separator}${d.id}`,
                value: `${d.defName}(${d.defKey})`,
              })),
            },
            {
              key: `${g.id}${separator}diagrams`,
              value: FormatMessage.string({id: 'project.diagram'}),
              children: getData('diagrams').map(d => ({
                key: `${g.id}${separator}${d.id}`,
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
  console.log(getTreeData());
    const currentPrefix = getPrefix(prefix);
    return <div className={`${currentPrefix}-relation-link`}>
      <div className={`${currentPrefix}-form-item`}>
        <span
          className={`${currentPrefix}-form-item-label`}
          title={FormatMessage.string({id: 'canvas.node.linkType'})}
        >
          <span className={`${currentPrefix}-form-item-label-require`}>{}</span>
          <FormatMessage id='canvas.node.linkType'/>
        </span>
        <span className={`${currentPrefix}-form-item-component ${currentPrefix}-relation-link-type`}>
          <Radio.RadioGroup
            onChange={e => _onChange(e, 'type')}
            defaultValue={data.type}
          >
            <Radio value='internally'>
              <span>
                <FormatMessage id='canvas.node.internally'/>
              </span>
            </Radio>
            <Radio value='externally'>
              <span>
                <FormatMessage id='canvas.node.externally'/>
              </span>
            </Radio>
            <Radio value=''>
              <span>
                <FormatMessage id='canvas.node.linkNone'/>
              </span>
            </Radio>
          </Radio.RadioGroup>
        </span>
      </div>
      {
        type === 'externally' && <div className={`${currentPrefix}-form-item`}>
          <span
            className={`${currentPrefix}-form-item-label`}
            title={FormatMessage.string({id: 'canvas.node.linkAddress'})}
        >
            <span className={`${currentPrefix}-form-item-label-require`}>{}</span>
            <FormatMessage id='canvas.node.linkAddress'/>
          </span>
          <span className={`${currentPrefix}-form-item-component ${currentPrefix}-relation-link-type`}>
            <Text
              placeholder={FormatMessage.string({id: 'canvas.node.linkAddressPlaceholder'})}
              onChange={e => _onChange(e, 'value')}
              defaultValue={dataRef.current.value}
          />
          </span>
          </div>

      }
      {
          type === 'internally' && <div className={`${currentPrefix}-form-item`}>
            <span
              className={`${currentPrefix}-form-item-label`}
              title={FormatMessage.string({id: 'canvas.node.linkContent'})}
          >
              <span className={`${currentPrefix}-form-item-label-require`}>{}</span>
              <FormatMessage id='canvas.node.linkContent'/>
            </span>
            <span className={`${currentPrefix}-form-item-component`}>
              <div className={`${currentPrefix}-relation-link-tree`}>
                <Tree
                  defaultCheckeds={[dataRef.current.value]}
                  simpleChecked
                  placeholder={FormatMessage.string({id: 'canvas.node.linkSearch'})}
                  dataSource={getTreeData()}
                  onChange={value => _onChange(value, 'value')}
                />
              </div>
            </span>
          </div>

      }
    </div>;
});
