import React, { useState, useEffect, useMemo, useRef } from 'react';

import { ErCanvas } from 'components';
import { addDomResize, removeDomResize } from '../../../lib/listener';
import { removeDataByTabId } from '../../../lib/cache';
import {getHomeCover} from '../../../lib/datasource_util';

const Relation = React.memo(({dataSource, renderReady, diagramKey, validateTableStatus,
                               tabDataChange, tabKey, activeKey, updateDataSource, openEntity,
                               common, changes, jumpEntity, closeLoading,
                               save, autoSave, getDataSource, openDict, selectionChanged,
                               openLoading}) => {
  const relationRef = useRef(null);
  const offsetWidth = 305;
  const offsetHeight = 148;
  const [id] = useState(Math.uuid());
  const data = useMemo(() => {
    if (diagramKey === 'home-cover') {
      return dataSource.homeCoverDiagram || getHomeCover();
    }
    return (dataSource?.diagrams || []).filter(d => d.id === diagramKey)[0];
  }, []);
  const getCurrentSize = () => {
    const rect = relationRef.current?.getBoundingClientRect() || {};
    return {
      width: rect.width || document.documentElement.clientWidth - offsetWidth,
      height: rect.height || document.documentElement.clientHeight - offsetHeight,
    };
  };
  const [size, updateSize] = useState(getCurrentSize);
  useEffect(() => {
    addDomResize(relationRef.current, id, () => {
      const { width, height } = getCurrentSize();
      updateSize({width, height});
    });
    return () => {
      removeDomResize(relationRef.current, id);
      removeDataByTabId(tabKey);
    };
  }, []);
  const _renderReady = (cav) => {
    renderReady && renderReady(cav);
  };
  const dataChange = (canvasData) => {
    //console.log(canvasData);
    tabDataChange && tabDataChange({
      type: 'diagram',
      key: diagramKey,
      data: {
        ...canvasData,
        id: diagramKey,
      },
    });
  };
  const commentChange = (canvasData, comment) => {
    tabDataChange && tabDataChange({
      type: 'diagram',
      key: diagramKey,
      data: {
        ...canvasData,
        comment,
        id: diagramKey,
      },
    });
  };
  return <div style={{width: '100%', height: '100%'}} ref={relationRef}>
    <ErCanvas
      validateTableStatus={validateTableStatus}
      updateDataSource={updateDataSource}
      dataChange={dataChange}
      width={size.width}
      height={size.height}
      renderReady={_renderReady}
      dataSource={dataSource}
      openEntity={openEntity}
      data={data}
      tabKey={tabKey}
      activeKey={activeKey}
      common={common}
      tabDataChange={tabDataChange}
      changes={changes}
      save={save}
      autoSave={autoSave}
      relationType={data?.relationType}
      getDataSource={getDataSource}
      openDict={openDict}
      selectionChanged={selectionChanged}
      jumpEntity={jumpEntity}
      diagramKey={diagramKey}
      openLoading={openLoading}
      closeLoading={closeLoading}
      commentChange={commentChange}
    />
  </div>;
});

export default Relation;
