import React, {useMemo, useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle} from 'react';
import {
  FormatMessage,
  IconTitle,
  Table,
} from 'components';
import  _ from 'lodash/object';
import {addDomResize, removeDomResize} from '../../../lib/listener';
import {getPrefix} from '../../../lib/prefixUtil';
import {
  emptyStandardGroup,
  getStandardGroupColumns,
  attNames, validate,
} from '../../../lib/datasource_util';


export default React.memo(forwardRef(({prefix, dataChange, dataSource, twinkle, updateDataSource,
                             importStandardFields, importStandardExcelFields,
                             exportStandardFields, exportStandardExcelFields,
                                        exportStandardExcelFieldsLibTpl}, ref) => {
  const id = useMemo(() => Math.uuid(), []);
  const tableRef = useRef(null);
  const standardFields = useMemo(() => (dataSource.standardFields || []), []);
  const newDataRef = useRef(standardFields);
  const [width, setWidth] = useState(0);
  const resizeDomRef = useRef(null);
  const isTwinkleRef = useRef(false);
  const commonProps = {
    disableHeaderIcon: true,
    customerHeaders: true,
    disableHeaderSort: true,
    disableHeaderReset: true,
    disableAddStandard: true,
    fixHeader: false,
  };
  const getDataSource = () => {
    return dataSource;
  };
  const tableDataChange = (groupData, tableData, fields) => {
    newDataRef.current = newDataRef.current.map((g) => {
      if (g.id === groupData.id) {
        return {
          ..._.omit(g, ['children']),
          fields: tableData,
        };
      }
      return g;
    });
    dataChange && dataChange(newDataRef.current, fields);
  };
  const getChildren = (g) => {
    return {
      ...g,
      children: <div style={{width}}>
        <Table
          {...commonProps}
          virtual={false}
          needHideInGraph={false}
          updateDataSource={updateDataSource}
          getDataSource={getDataSource}
          customerHeaders={false}
          data={{
              headers: (dataSource.profile?.headers?.filter(h => h.enabled !== false
                  && !attNames.includes(h.refKey))),
              fields: g.fields,
            }}
          dataSource={dataSource}
          tableDataChange={(tableData, type, data) => tableDataChange(g, tableData, data)}
        />
      </div>,
    };
  };
  useImperativeHandle(ref, () => {
    return {
      resetStandardFields: (data) => {
        newDataRef.current = data;
        tableRef.current.updateTableData({
          headers: getStandardGroupColumns(),
          fields: data.map(g => getChildren(g)),
        });
        dataChange && dataChange(data);
      },
    };
  }, [width]);
  useEffect(() => {
    addDomResize(resizeDomRef.current, id, () => {
      setWidth(resizeDomRef.current.clientWidth - 40);
    });
    return () => {
      removeDomResize(resizeDomRef.current, id);
    };
  }, []);
  const currentPrefix = getPrefix(prefix);
  const tableDataGroupChange = (groupData) => {
    newDataRef.current = groupData.map((g) => {
      const currentGroup = (newDataRef.current || []).find(c => c.id === g.id) || {};
      return {
        ...currentGroup,
        ..._.pick(g, ['defKey', 'defName', 'id']),
      };
    });
    dataChange && dataChange(newDataRef.current, []);
  };
  const onAdd = () => {
    return new Promise((res) => {
      res([getChildren({...emptyStandardGroup, id: Math.uuid()})]);
    });
  };
  useEffect(() => {
    const data = {
      headers: getStandardGroupColumns(),
      fields: standardFields.map(g => getChildren(g)),
    };
    tableRef.current.updateTableData((pre) => {
      const temp = pre.fields ? pre : data;
      return {
        ...temp,
        fields: (temp.fields || []).map(g => getChildren(g)),
      };
    });
    if (!isTwinkleRef.current) {
      setTimeout(() => {
        twinkle && tableRef.current.twinkleTr(twinkle);
        isTwinkleRef.current = true;
      });
    }
  }, [width]);
  const ready = (table) => {
    tableRef.current = table;
  };
  const search = useCallback((f, value) => {
    const reg = new RegExp((value || '').replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
    if (f.fields && f.fields.some(field => reg.test(field.defName) || reg.test(field.defKey))) {
      return true;
    }
    return reg.test(f.defName) || reg.test(f.defKey);
  }, []);
  const itemValidate = (items) => {
    return validate(items, emptyStandardGroup, 'StandardGroup');
  };
  const ExtraOpt = useCallback(() => {
    return <span className={`${currentPrefix}-standard-fields-export-opt`}>
      <IconTitle
        title={<FormatMessage id='standardFields.importStandardExcelFieldsLib'/>}
        type='fa-file-excel-o'
        onClick={importStandardExcelFields}
      />
      <IconTitle
        title={<FormatMessage id='standardFields.exportStandardExcelFieldsLib'/>}
        type='fa-file-excel-o'
        onClick={() => exportStandardExcelFields(newDataRef.current)}
      />
      <IconTitle
        title={<FormatMessage id='standardFields.importStandardFieldsLib'/>}
        type='icon-daoru'
        onClick={importStandardFields}
      />
      <IconTitle
        title={<FormatMessage id='standardFields.exportStandardFieldsLib'/>}
        type='icon-daochu'
        onClick={() => exportStandardFields(newDataRef.current)}
      />
      <IconTitle
        title={<FormatMessage id='standardFields.exportStandardExcelFieldsLibTpl'/>}
        type='icon-daochu'
        onClick={exportStandardExcelFieldsLibTpl}
      />
    </span>;
  }, []);
  return <div className={`${currentPrefix}-standard-fields`} ref={resizeDomRef}>
    <Table
      {...commonProps}
      //updateDataSource={updateDataSource}
      autoWidth
      virtual={false}
      getDataSource={getDataSource}
      otherOpt={false}
      onAdd={onAdd}
      style={{width: '100%'}}
      validate={itemValidate}
      tableDataChange={tableDataGroupChange}
      expand
      ready={ready}
      search={search}
      ExtraOpt={ExtraOpt}
    />
  </div>;
}));
