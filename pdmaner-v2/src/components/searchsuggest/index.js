import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactDom from 'react-dom';
import {FixedSizeTree as Tree} from 'react-vtree';
import AutoSizer from 'react-virtualized-auto-sizer';

import SearchInput from '../searchinput';
import FormatMessage from '../formatmessage';
import Button from '../button';
import { openModal } from '../modal';
import {getPrefix} from '../../lib/prefixUtil';
import {addBodyClick, removeBodyClick} from '../../lib/listener';
import './style/index.less';
import MoreList from './MoreList';
import {postWorkerFuc} from '../../lib/event_tool';

export default React.memo(({placeholder, prefix, dataSource,
                             jumpPosition, jumpDetail}) => {
  const currentPrefix = getPrefix(prefix);
  const listRef = useRef(null);
  const modalRef = useRef(null);
  const id = useMemo(() => Math.uuid(), []);
  const suggestRef = useRef(null);
  const searchRef = useRef(null);
  const comSearchRef = useRef(null);
  const [searchValue, setSearchValue] = useState('');
  const [allData, setAllData] = useState([]);
  const sourceChangeRef = useRef(false);
  const dataSourceRef = useRef({});
  dataSourceRef.current = {...dataSource};

  const onChange = (e) => {
    return new Promise((resolve, reject) => {
      setSearchValue(e.target.value);
      if(sourceChangeRef.current && e.target.value) {
        postWorkerFuc('utils.getAllData', true, [
          {dataSource: dataSourceRef.current},
        ]).then((data) => {
          resolve();
          setAllData(data);
          sourceChangeRef.current = false;
        }).catch(() => {
          reject();
        });
      } else {
        resolve();
      }
    });
  };
  useEffect(() => {
    addBodyClick(id, (e) => {
      if (!searchRef?.current?.contains(e.target) && !listRef?.current?.contains(e.target)) {
        setSearchValue('');
        comSearchRef.current.resetSearchValue();
      }
    });
    return () => {
      removeBodyClick(id);
    };
  }, []);
  useEffect(() => {
    sourceChangeRef.current = true;
  }, [dataSource.entities, dataSource.views,
    dataSource.dicts, dataSource.viewGroups, dataSource.standardFields]);
  const calcSuggest = (suggest, search) => {
    const reg = new RegExp((search || '').replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'ig');
    const str = `<span class=${currentPrefix}-search-suggest-list-search>$&</span>`;
    const finalData = `<span>${suggest.replace(reg, str)}</span>`;
    // eslint-disable-next-line react/no-danger,react/no-danger-with-children
    return <span dangerouslySetInnerHTML={{ __html: finalData }}
    >{}</span>;
  };
  const _jumpPosition = (...args) => {
    setSearchValue('');
    comSearchRef.current.resetSearchValue();
    modalRef.current?.close();
    jumpPosition && jumpPosition(...args);
  };
  const _jumpDetail = (...args) => {
    setSearchValue('');
    comSearchRef.current.resetSearchValue();
    modalRef.current?.close();
    jumpDetail && jumpDetail(...args);
  };
  const getOpt = (d, key) => {
    let opt = '';
    switch (key){
      case 'entities':
        opt = <>[<a
          onClick={() => _jumpPosition(d, key)}
        ><FormatMessage id='components.searchSuggest.position'/></a>|<a
          onClick={() => _jumpDetail(d, key)}
        ><FormatMessage id='components.searchSuggest.detail'/></a>]</>;
        break;
      case 'logicEntities':
        opt = <>[<a
          onClick={() => _jumpPosition(d, key)}
        ><FormatMessage id='components.searchSuggest.position'/></a>|<a
          onClick={() => _jumpDetail(d, key)}
        ><FormatMessage id='components.searchSuggest.detail'/></a>]</>;
        break;
      case 'fields': opt = <>[<a
        onClick={() => _jumpDetail(d, key)}
      ><FormatMessage id='components.searchSuggest.detail'/></a>]</>;
        break;
      case 'dicts': opt = <>[<a
        onClick={() => _jumpPosition(d, key)}
      ><FormatMessage id='components.searchSuggest.position'/></a>|<a
        onClick={() => _jumpDetail(d, key)}
      ><FormatMessage id='components.searchSuggest.detail'/></a>]</>;
        break;
      case 'dictItems': opt = <>[<a
        onClick={() => _jumpDetail(d, key)}
      ><FormatMessage id='components.searchSuggest.detail'/></a>]</>;
        break;
      case 'standardFields': opt = <>[<a
        onClick={() => _jumpDetail(d, key)}
      ><FormatMessage id='components.searchSuggest.detail'/></a>]</>;
        break;
      default: break;
    }
    return opt;
  };
  const Node = useMemo(() => ({data: {aData, node, parent, search}, style}) => {
    if(parent) {
      return <div style={style} className={`${currentPrefix}-search-suggest-list-item`}>
        <span>{calcSuggest(node.suggest, search)}</span>
        <span>{getOpt(node, parent.key)}</span>
      </div>;
    }
    return <div style={style} className={`${currentPrefix}-search-suggest-list-group`}>
      <span>
        <FormatMessage id={`components.searchSuggest.${node.key}`}/>
          (<FormatMessage
            id='components.searchSuggest.length'
            data={{count: aData.find(ad => ad.key === node.key)?.data?.length}}
        />)
      </span>
    </div>;
  }, []);
  const getItemList = (data, aData, search, isMore) => {
    const suggestRect = suggestRef.current.getBoundingClientRect();
    const finalData = data.filter(d => d.data.length > 0);
    const currentLength = finalData.reduce((p, n) => p + (n.data?.length || 0), finalData.length);
    const getNodeData = (node, nestingLevel, parent) => {
      return ({
        data: {
          aData,
          search,
          id: node.id || node.key,
          node,
          nestingLevel,
          isOpenByDefault: true,
          parent,
        },
        nestingLevel,
        node,
      });
    };
    function* treeWalker() {
      for (let i = 0; i < finalData.length; i += 1) {
        yield getNodeData(finalData[i], 0);
      }

      while (true) {
        const parent = yield;
        for (let i = 0; i < parent.node.data?.length; i += 1) {
          yield getNodeData(parent.node.data[i], parent.nestingLevel + 1, parent.node);
        }
      }
    }
    const calcHeight = window.innerHeight - suggestRect.bottom - 10 - (isMore ? 26 : 0);
    if(isMore === undefined) {
      return <div>
        <AutoSizer>
          {({width, height}) => {
            return <Tree
              treeWalker={treeWalker}
              itemSize={26}
              width={width}
              height={height}
            >
              {Node}
            </Tree>;
          }}
        </AutoSizer>
      </div>;
    }
    return <Tree
      treeWalker={treeWalker}
      itemSize={26}
      height={currentLength * 26 <= calcHeight ? currentLength * 26 : calcHeight}
    >
      {Node}
    </Tree>;
  };
  const getFilterData = (data = [], value) => {
    const reg = new RegExp((value || '').replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
    return data
        .filter((d) => {
          return reg.test(d.defKey || '') || reg.test(d.defName || '');
        });
  };
  const moreClick = (filterData) => {
    const onOK = () => {
      modalRef.current && modalRef.current.close();
      modalRef.current = null;
    };
    modalRef.current = openModal(<MoreList
      allData={allData}
      filterData={filterData}
      getItemList={getItemList}
      currentPrefix={currentPrefix}
      getFilterData={getFilterData}
      placeholder={placeholder}
      search={searchValue}
    />, {
      title: <FormatMessage id='components.searchSuggest.moreList'/>,
      buttons: [
        <Button key='onOK' onClick={onOK} type='primary'>
          <FormatMessage id='button.close'/>
        </Button>],
    });
  };
  const childrenMemo = useMemo(() => {
    if (searchValue) {
      // 数据表 视图 数据字典 字段库
      const suggestRect = suggestRef.current.getBoundingClientRect();
      const filterData = allData.map((d) => {
        return {
          ...d,
          data: getFilterData(d.data, searchValue),
        };
      }).filter(d => d.data.length > 0);
      const simpleFilterData = filterData.map(d => ({
        ...d,
        data: d.data.slice(0, 4),
      }));
      const moreFilterData = filterData.map(d => ({
        ...d,
        data: d.data.slice(4, d.data.length),
      }));
      const isMore = moreFilterData.some(d => d.data.length > 0);
      return <div
        className={`${currentPrefix}-search-suggest-list`}
        ref={listRef}
        style={{
            maxWidth: 'calc(100% - 10px)',
            right: 5,
            top: suggestRect.bottom + 2,
            width: suggestRect.width * 2,
          }}
      >
        {
          simpleFilterData.length > 0 ? <>{getItemList(simpleFilterData, filterData,
              searchValue, isMore)}{
            isMore ?
              <div
                className={`${currentPrefix}-search-suggest-more`}
                onClick={() => moreClick(filterData)}
              >
                <FormatMessage id='components.searchSuggest.more'/>
              </div> : ''
          }</> : <div className={`${currentPrefix}-search-suggest-empty`}>
            <FormatMessage id='components.searchSuggest.empty'/>
          </div>
        }
      </div>;
    }
    return '';
  }, [searchValue, allData]);
  return <div className={`${currentPrefix}-search-suggest`} ref={suggestRef}>
    <SearchInput
      comRef={comSearchRef}
      ref={searchRef}
      defaultValue={searchValue}
      placeholder={placeholder}
      onChange={onChange}/>
    {
      ReactDom.createPortal(childrenMemo, document.body)
    }
  </div>;
});
