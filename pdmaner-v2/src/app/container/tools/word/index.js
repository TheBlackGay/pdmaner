import React, { useRef } from 'react';
import * as _ from 'lodash/object';

import {Button, FormatMessage, Icon, Message, openModal, Tree} from 'components';
import DocTemplate from '../../config/DocTemplate';
import './style/index.less';
import {getPrefix} from '../../../../lib/prefixUtil';
import { saveAsTemplate } from '../../../../lib/middle';
import {calcUnGroupDefKey} from '../../../../lib/datasource_util';
import {separator} from '../../../../../profile';

export default React.memo(({prefix, dataSource, onOk, save, projectInfo}) => {
    const currentPrefix = getPrefix(prefix);
    const path = 'profile.generatorDoc.docTemplate';
    const defaultTemplate = _.get(dataSource, path);
    const fileRef = useRef(defaultTemplate);
    const fileTempRef = useRef(defaultTemplate);
    const dataChange = (value) => {
        fileTempRef.current = value;
    };
    const _onOk = () => {
        save(_.set(dataSource, path, fileTempRef.current), FormatMessage.string({id: 'saveProject'}), !projectInfo, (err) => {
            if (!err) {
                Message.success({title: FormatMessage.string({id: 'saveSuccess'})});
            } else {
                Message.error({title: `${FormatMessage.string({id: 'saveFail'})}:${err?.message}`});
            }
        });
        fileRef.current = fileTempRef.current;
    };
    const pickEntities = () => {
        let modal = null;
        let pickData = [];
        const onChange = (entities) => {
            pickData = entities;
        };
        const onPick = () => {
            const pickIds = pickData.map(p => p.split(separator)[1]);
            onOk(fileRef.current, {
                ...dataSource,
                entities: (dataSource.entities || []).filter(e => pickIds.includes(e.id)),
            });
            modal.close();
        };
        const onCancel = () => {
            modal.close();
        };
        const getTreeData = () => {
            return (dataSource.viewGroups || [])
                .concat({
                    id: '__ungroup',
                    defKey: '__ungroup',
                    defName: FormatMessage.string({id: 'exportSql.defaultGroup'}),
                    refEntities: calcUnGroupDefKey(dataSource,'entities'),
                })
                .filter((g) => {
                    return ((g.refEntities || []).length > 0);
                })
                .map((g) => {
                    const getData = () => (dataSource.entities || [])
                        .filter(e => (g.refEntities || []).includes(e.id));
                    return {
                        key: g.id,
                        value: g.defName || g.defKey,
                        children: getData().map(d => ({
                            key: `${g.id}${separator}${d.id}`,
                            value: `${d.defName}(${d.defKey})`,
                        })),
                    };
                });
        };
        modal = openModal(<div className={`${currentPrefix}-export-word-entity-select`}>
          <Tree
            dataSource={getTreeData()}
            onChange={onChange}
            placeholder={FormatMessage.string({id: 'word.entitySearchPlaceholder'})}
            />
        </div>, {
            bodyStyle: { width: '50%' },
            title: FormatMessage.string({id: 'word.entitySearchTitle'}),
            buttons: [<Button type='primary' key='ok' onClick={() => onPick()}>
              <FormatMessage id='button.ok'/>
            </Button>,
              <Button key='cancel' onClick={() => onCancel()}>
                <FormatMessage id='button.cancel'/>
              </Button>],
        });
    };
    return <div className={`${currentPrefix}-export-word`}>
      <div className={`${currentPrefix}-export-word-export`}>
        <span
          onClick={() => onOk(fileRef.current)}
          className={`${currentPrefix}-export-word-export-button`}
        >
          <FormatMessage id='word.exportAllWord'/>
        </span>
        <span
          onClick={() => pickEntities()}
          className={`${currentPrefix}-export-word-export-button`}
          >
          <FormatMessage id='word.exportFilterWord'/>
        </span>
      </div>
      <div className={`${currentPrefix}-export-word-template`}>
        <div>
          <div><FormatMessage id='word.template'/></div>
          <div>{}</div>
        </div>
        <div>
          <div><DocTemplate dataSource={dataSource} dataChange={dataChange} onOk={_onOk}/></div>
          <div>
            <Icon type='fa-file-word-o'/>
            <a onClick={() => saveAsTemplate('PDManer-docx-tpl', 'docx')}><FormatMessage id='word.download'/></a>
          </div>
        </div>
      </div>
    </div>;
});
