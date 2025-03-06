import React, {useCallback, useEffect, useRef} from 'react';

import { Table } from 'components';

export default React.memo(({data, dataSource, update, FieldsExtraOpt,customerHeaders,
                             dataChange, offsetHeight, updateDataSource, ready, freeze, param,
                             hasRender, hasDestory, getDataSource, openDict, defaultGroups,
                             getRestData, type, openConfig, searchRef}) => {
  const tableRef = useRef(null);
  useEffect(() => {
    hasRender && hasRender({
      twinkle: (key) => {
        tableRef.current?.twinkleTr(key);
      },
    });
    return () => {
      hasDestory && hasDestory();
    };
  }, []);
  const search = useCallback((f, value) => {
    const reg = new RegExp((value || '')
        .replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
    return reg.test(f.defName) || reg.test(f.defKey);
  }, []);
  return <Table
    searchRef={searchRef}
    search={search}
    needHideInGraph={false}
    openConfig={openConfig}
    isEntity={type === 'entity'}
    getRestData={getRestData}
    ref={tableRef}
    twinkle={param?.defKey}
    customerHeaders={customerHeaders}
    freeze={freeze}
    offsetHeight={offsetHeight}
    data={data}
    dataSource={dataSource}
    update={update}
    ExtraOpt={FieldsExtraOpt}
    tableDataChange={dataChange}
    updateDataSource={updateDataSource}
    ready={ready}
    getDataSource={getDataSource}
    openDict={openDict}
    defaultGroups={defaultGroups}
  />;
});
