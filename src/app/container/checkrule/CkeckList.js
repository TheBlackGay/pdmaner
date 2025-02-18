import React, {useCallback, forwardRef, useImperativeHandle} from 'react';
import {Button, Icon, Tooltip, FormatMessage, Modal, openDrawer} from 'components';
import AutoSizer from 'react-virtualized-auto-sizer';
import {FixedSizeTree as Tree} from 'react-vtree/dist/es/FixedSizeTree';
import { getPrefix } from '../../../lib/prefixUtil';
import {separator} from '../../../../profile';
import {getDataByTabId} from '../../../lib/cache';
import Entity from '../entity';
import LogicEntity from '../logicentity';

export default React.memo(forwardRef(({prefix, dataSource, onCheck, ruleResults,
                             onView, validateTableStatus, jumpEntity, save, openDict,
                             tabDataChange, getDataSource, common, updateDataSource}, ref) => {
    const currentPrefix = getPrefix(prefix);
    const itemData = [{id: '__first'}].concat(dataSource.entities || [])
        .concat(dataSource.logicEntities || []);
    const innerElementType = useCallback(({children, ...rest}) => {
      return <div {...rest}>
        <div className={`${currentPrefix}-check-rule-list-data-item-header`}>
          <span>#</span>
          <span><FormatMessage id='checkRule.ruleObjectType'/></span>
          <span><FormatMessage id='checkRule.ruleObjectCode'/></span>
          <span><FormatMessage id='checkRule.ruleObjectName'/></span>
          <span><FormatMessage id='checkRule.ruleObjectStatus'/></span>
          <span><FormatMessage id='checkRule.opt'/></span>
        </div>
        {children}
      </div>;
    }, []);
    const getDataResult = (data, currentRule) => {
      // exclamation-triangle check close
      let iconType = 'question';
      if(currentRule) {
        if(currentRule.status === 0) {
          return 'spinner';
        } else if(currentRule.status === 1) {
          iconType = 'check';
          if(currentRule.checkResult.some(c => (c.ruleControlIntensity === 'F') && (!c.result))) {
            iconType = 'close';
          } else if(currentRule.checkResult.some(c => (c.ruleControlIntensity === 'S') && (!c.result))) {
            iconType = 'exclamation-triangle';
          }
        } else {
          return 'error';
        }
      }
      return iconType;
  };
    const getTooltips = (iconType) => {
      const TooltipsMap = {
        question: 'wait',
        spinner: 'loading',
        check: 'pass',
        close: 'fail',
        'exclamation-triangle': 'warring',
        error: 'checkError',
      };
      return TooltipsMap[iconType];
    };
  const getItemData = (item, index) => {
    return ({
      data: {
        id: item.id,
        item,
        index,
        results: ruleResults,
        source: dataSource,
      },
    });
  };
  function* treeWalker() {
    for (let i = 0; i < itemData.length; i += 1) {
      yield getItemData(itemData[i], i);
    }
  }
  const openObjectView = (data, source, param) => {
    const isEntity = data.type !== 'L';
    const refNames = isEntity ? 'refEntities' : 'refLogicEntities';
    const key = data.id;
    const group = source?.viewGroups?.filter(v => v[refNames]?.some(r => r ===
        key));
    const entityTabKey = `${key + separator}${isEntity ? 'entity' : 'logicEntity'}`;
    if (!validateTableStatus(entityTabKey)) {
      let drawer;
      const tab = {
        type: isEntity ? 'entity' : 'logicEntity',
        tabKey: entityTabKey,
      };
      const onOK = () => {
        save((fail) => {
          if (!fail) {
            drawer.close();
          }
        });
      };
      const onCancel = () => {
        drawer.close();
      };
      const entityChange = (cData) => {
        tabDataChange && tabDataChange(cData, tab);
      };
      const beforeClose = () => {
        return new Promise((resolve) => {
          const tabData = getDataByTabId(tab.tabKey);
          if (tabData && !tabData?.isInit) {
            Modal.confirm({
              title: FormatMessage.string({id: 'saveConfirmTitle'}),
              message: FormatMessage.string({id: 'saveConfirm'}),
              onOk:() => {
                resolve();
              },
            });
          } else {
            resolve();
          }
        });
      };
      const _openDict = (...args) => {
        openDict && openDict(...args);
        drawer.close();
      };
      const Com = isEntity ? Entity : LogicEntity;
      drawer = openDrawer(<Com
        param={param}
        openDict={_openDict}
        getDataSource={getDataSource}
        tabKey={entityTabKey}
        common={common}
        updateDataSource={updateDataSource}
        dataSource={source}
        entity={key}
        group={group}
        type={tab.type}
        tabDataChange={entityChange}
      />, {
        beforeClose,
        maskClosable: false,
        title: data.defName || data.defKey,
        width: '80%',
        buttons: [
          <Button key='onSave' onClick={onOK} type='primary'>
            <FormatMessage id='button.save'/>
          </Button>,
          <Button key='onCancel' onClick={onCancel}>
            <FormatMessage id='button.cancel'/>
          </Button>,
        ],
      });
    } else {
      jumpEntity(entityTabKey);
    }
  };
  useImperativeHandle(ref, () => {
    return {
      openObjectView,
    };
  }, []);
    const Node = useCallback(({data: {results, item, index, source}, style}) =>  {
      const data = item;
      if(index === 0) {
        return null;
      }
      const currentRule = results.find(r => r.dataId === data.id);
      const iconType = getDataResult(data, currentRule);
      return <div
        key={item.id}
        className={`${currentPrefix}-check-rule-list-data-item`}
        style={{
          ...style,
          width: 760,
        }}
      >
        <span>{index}</span>
        <span><FormatMessage id={`checkRule.${data.type !== 'L' ? 'entity' : 'logicEntity'}`}/></span>
        <Tooltip placement='top' title={data.defKey}>
          <span
            onClick={() => openObjectView(data, source)}
          >{data.defKey}</span>
        </Tooltip>
        <Tooltip placement='top' title={data.defName}>
          <span>{data.defName}</span>
        </Tooltip>
        <Tooltip placement='top' force title={FormatMessage.string({id: `checkRule.${getTooltips(iconType)}`})}>
          <span className={`${currentPrefix}-check-rule-list-data-item-status-${iconType}`}>{
            iconType === 'error' ? <FormatMessage id='checkRule.checkError'/> : <Icon type={`fa-${iconType}`}/>
          }</span>
        </Tooltip>
        <span>
          {(iconType === 'close' || iconType === 'exclamation-triangle')
              && <span onClick={() => onView(currentRule)}>
                <FormatMessage id='checkRule.view'/>
              </span>}
          <span onClick={e => onCheck(e, null, data.id)}>
            <FormatMessage id='checkRule.rescan'/>
          </span>
        </span>
      </div>;
    }, []);
  return <div className={`${currentPrefix}-check-rule-list`}>
    <div className={`${currentPrefix}-check-rule-list-opt`}>
      <span><FormatMessage id='checkRule.checkObjectList'/></span>
      <span><Button onClick={onCheck} type="primary">
        <FormatMessage id='checkRule.onCheck'/>
      </Button></span>
    </div>
    <div className={`${currentPrefix}-check-rule-list-data`}>
      <div className={`${currentPrefix}-check-rule-list-data-content`}>
        <AutoSizer>
          {({height, width}) => {
            return <Tree
              treeWalker={treeWalker}
              itemSize={32}
              height={height}
              width={width}
              innerElementType={innerElementType}
            >
              {Node}
            </Tree>;
          }}
        </AutoSizer>
      </div>
    </div>

  </div>;
}));
