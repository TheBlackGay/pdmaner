import React, { useEffect, useState } from 'react';
import {FormatMessage} from 'components';
import _ from 'lodash';
import {readJsonPromise} from '../../../../lib/middle';
import {getPrefix} from '../../../../lib/prefixUtil';
import {postWorkerFuc} from '../../../../lib/event_tool';

export default React.memo(({files, prefix, dataSource, config, openLoading, closeLoading}) => {
    const [data, setData] = useState('');
    useEffect(() => {
        openLoading(FormatMessage.string({id: 'versionData.check'}));
        Promise.all(files
            .filter(f => !!f)
            .map(f => readJsonPromise(f.path))).then((result) => {
                const pre = result[1] ? result[0] : {entities: [], views: []};
                const curr = result[1] || result[0];
            const currentDb = _.get(dataSource, 'profile.default.db',
                _.get(dataSource, 'profile.dataTypeSupports[0].id'));
            postWorkerFuc('dataSourceVersion.packageChanges', true,
                [curr, pre, currentDb]).then((c) => {
                if(c.length === 0) {
                    setData('');
                    closeLoading();
                } else {
                    postWorkerFuc('dataSourceVersion.getMessageByChanges', true,
                        [c, dataSource, config.lang]).then((m) => {
                        setData(m);
                    }).finally(() => {
                        closeLoading();
                    });
                }
            }).catch(() => {
                closeLoading();
            });
        });
    }, []);
    const currentPrefix = getPrefix(prefix);
    return <pre className={`${currentPrefix}-history-log`}>
      {data || <div style={{textAlign: 'center'}}>{FormatMessage.string({id: 'operationsHistory.emptyLog'})}</div>}
    </pre>;
});
