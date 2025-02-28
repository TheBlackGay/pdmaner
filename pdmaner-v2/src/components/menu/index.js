import React, {useState, useRef, useImperativeHandle, forwardRef, useEffect, useMemo} from 'react';
import _ from 'lodash/object';
import AutoSizer from 'react-virtualized-auto-sizer';
import {FixedSizeTree as Tree} from 'react-vtree';

import ContextMenu from '../contextmenu';
import Icon from '../icon';
import Tooltip from '../tooltip';
import './style/index.less';
import {getPrefix} from '../../lib/prefixUtil';
import { moveArrayPosition } from '../../lib/array_util';
import { allType } from '../../lib/datasource_util';
import {separator} from '../../../profile';
import {firstUp} from '../../lib/string';
import {tree2array} from '../../lib/tree';
import {READING} from '../../lib/variable';

const Menu = React.memo(forwardRef(({contextMenus = [], onContextMenu, fieldNames,
                           contextMenuClick, prefix, menus = [], doubleMenuClick, getName,
                           emptyData, defaultExpands, dragTable, groupType, header, mode,
                           update, dataSource, sortEnable = true, draggable}, ref) => {
  const currentPrefix = getPrefix(prefix);
  const menuRef = useRef(null);
  const itemBase = `${currentPrefix}-menu-container-fold-item-child-`;
  const { icon, defName, defKey, children } = fieldNames;
  const [expandMenu, updateExpandMenu] = useState(defaultExpands || []);
  const [menusData, updateMenusData] = useState(menus);
  const [jumpKey, setJumpKey] = useState(null);
  const [insert, updateInsert] = useState(menus);
  const menusDataRef = useRef([]);
  menusDataRef.current = menusData;
  const [position, updatePosition] = useState({top: 0, left: 0});
  const [selectedMenu, updateSelectedMenu] = useState([]);
  const selectedMenuRef = useRef([]);
  selectedMenuRef.current = [...selectedMenu];
  const startRef = useRef({index: -1});
  const listRef = useRef(null);
  const dataSourceRef = useRef({});
  dataSourceRef.current = {...dataSource};
  if ((menusData !== menus) && (menusData.length !== 0 && menus.length !== 0)){
    updateMenusData(menus);
  }
  const calcShiftSelected = (item, menu) => {
    let selected = [...selectedMenuRef.current];
    if (selected.length === 0) {
      return [item];
    }
    const minIndex = Math.min(...selectedMenuRef.current.map(m => menu.children.findIndex((c) => {
      return c.id === m.key;
    })));
    const currentIndex = menu.children.findIndex((c) => {
      return item.key === c.id;
    });
    if (minIndex >= 0) {
     selected = menu.children.map((m, i) => {
       if ((i >= currentIndex && i <= minIndex) || (i >= minIndex && i <= currentIndex)) {
         return {
           ...item,
           key: m.id,
         };
       }
       return null;
     }).filter(m => !!m);
    }
    return selected;
  };
  const onMenuClick = (e, key, type, parentKey, cb, menu) => {
    let tempSelectedMenu = [...selectedMenuRef.current];
    if (e.ctrlKey || e.metaKey) {
      if (tempSelectedMenu.some(s => s.key === key)) {
        tempSelectedMenu = tempSelectedMenu.filter(s => s.key !== key);
      } else {
        tempSelectedMenu.push({key, type, parentKey});
      }
    } else if(e.shiftKey) {
      // 自动选择连续
      if (menu) {
        tempSelectedMenu = calcShiftSelected({key, type, parentKey}, menu);
      }
    } else {
    // eslint-disable-next-line max-len
      tempSelectedMenu = tempSelectedMenu.some(s => s.key === key) ? [] : [{key, type, parentKey}];
    }
    cb && cb(tempSelectedMenu);
    updateSelectedMenu(tempSelectedMenu);
  };
  const onDoubleMenuClick = (e, key, type, parentKey, menuIcon) => {
    onMenuClick(e, key, type, parentKey);
    doubleMenuClick && doubleMenuClick(key, type, parentKey, menuIcon);
  };
  const _expandMenuClick = (e, id, type, parentKey) => {
    updateExpandMenu((p) => {
      if(p.includes(id)) {
        return p.filter(i => i !== id);
      }
      return p.concat(id);
    });
    onMenuClick(e, id, type, parentKey);
  };
  const _onContextMenu = (e, key, type, parentKey) => {
    if (mode !== READING) {
      e.stopPropagation();
      if (!selectedMenuRef.current.some(s => s.key === key)){
        onMenuClick(e, key, type, parentKey,(data) => {
          onContextMenu && onContextMenu(key, type, data, parentKey);
        });
      } else {
        onContextMenu && onContextMenu(key, type, selectedMenuRef.current, parentKey);
      }
      updatePosition({left: e.clientX, top: e.clientY});
    }
  };
  const getClassName = (baseClass, key, type, isParent, selected, insertKey) => {
    let tempClass = isParent ? `${baseClass}parent` : `${baseClass}child`;
    if (selected.some(s => (s.key === key) && (s.type === type))) {
      tempClass += ` ${baseClass}selected`;
    }
    if (insertKey === key) {
      tempClass += ` ${baseClass}insert`;
    }
    return tempClass;
  };
  const tempDragTable = (e, child, key, i, parentKey) => {
    if (e.currentTarget.nodeName === 'SPAN') {
      startRef.current = {
        index: i,
        type: child.type,
        parentKey,
      };
      e.stopPropagation();
    } else if(child.type === 'entity' || child.type === 'logicEntity'){
      e.preventDefault();
      dragTable && dragTable(e, key, child.type);
    } else {
      e.preventDefault();
    }
  };
  const rowOnDragOver = (e, key, pKey) => {
    if ((startRef.current.parentKey === pKey) && (key !== pKey)){
      updateInsert(key);
    }
    e.preventDefault();
    e.stopPropagation();
  };
  const rowOnDrop = (e, i, parentKey, parentMenu, realParentMenu) => {
    if ((startRef.current.parentKey === parentKey) &&
        (startRef.current.index > -1) && (startRef.current.index !== i)) {
      const name = allType.concat({ type: 'dataType', name: 'profile.dataTypeSupports', defKey: 'defKey' }).filter(t => t.type === startRef.current.type)[0];
      if (name) {
        const group = (parentMenu.type === 'groups' || parentKey === '__ungroup')
            ? parentKey : '';
        if (group) {
          if(group !== '__ungroup') {
            update && update({
              ...dataSourceRef.current,
              viewGroups: (dataSourceRef.current.viewGroups || []).map((g) => {
                if (g.id === group) {
                  const refName = `ref${firstUp(name.name)}`;
                  return {
                    ...g,
                    [refName]: moveArrayPosition(g[refName],
                        startRef.current.index, i > startRef.current.index ? i : i + 1),
                  };
                }
                return g;
              }),
            });
          } else {
            const start = realParentMenu.children[startRef.current.index];
            const move = realParentMenu.children[i > startRef.current.index ? i : i + 1];
            update && update({
              ..._.set(
                  dataSourceRef.current,
                  name.name,
                  moveArrayPosition(_.get(dataSourceRef.current, name.name),
                      _.get(dataSourceRef.current, name.name).findIndex(d => d.id === start?.id),
                      _.get(dataSourceRef.current, name.name).findIndex(d => d.id === move?.id)),
              ),
            });
          }
        } else {
          update && update({
            ..._.set(
                dataSourceRef.current,
                name.name,
                moveArrayPosition(_.get(dataSourceRef.current, name.name),
                    startRef.current.index, i > startRef.current.index ? i : i + 1),
            ),
          });
        }
      } else {
        update && update({
          ...dataSourceRef.current,
          viewGroups: moveArrayPosition(dataSourceRef.current.viewGroups || [],
            startRef.current.index, i > startRef.current.index ? i : i + 1),
        });
      }
    }
    startRef.current = { index: -1 };
    updateInsert('');
    e.preventDefault();
    e.stopPropagation();
  };
  const onContextMenuClick = (...args) => {
    contextMenuClick && contextMenuClick(...args, (type) => {
      updateExpandMenu((pre) => {
        return [...new Set(pre.concat(type))];
      });
    });
  };
  const getDraggable = (m) => {
    if (sortEnable) {
      return (m.type === 'entity' ||
          m.type === 'logicEntity' ||
          m.type === 'view' ||
          m.type === 'dict' ||
          m.type === 'mapping' ||
          m.type === 'domain' ||
          m.type === 'diagram' ||
          m.type === 'groups' ||
          m.type === 'dataType') && m.id !== '__ungroup';
    } else if (draggable){
      return m.type === 'entity' || m.type === 'logicEntity';
    }
    return false;
  };
  useEffect(() => {
    //updateSelectedMenu([]);
  }, [groupType]);
  const getMenuItem = (parentMenus, menu, offsetNumber = 0, pI,
                       isOpen, style, selected, insertKey) => {
    const parentMenu = parentMenus[0] || menu;
    const parentKey = menu === parentMenu ? null : parentMenu[defKey];
    const draggableStatus = getDraggable(menu);
    if(menu[children]) {
      const pName = `${getName && getName(menu) || menu[defName]}${menu.type !== 'groups' ? `(${menu[children].length})` : ''}`;
      return <div
        style={style}
        className={getClassName(itemBase, menu[defKey],  menu.type, true, selected, insertKey)}
        key={menu[defKey]}
        onContextMenu={e => _onContextMenu(e, menu[defKey], menu.type, parentKey)}
        onDragOver={e => rowOnDragOver(e, menu[defKey], parentKey)}
        onDrop={e => rowOnDrop(e, pI, parentKey, menu, menu)}
      >
        <span
          title={pName}
          style={{paddingLeft: 8 * offsetNumber}}
          className={`${currentPrefix}-menu-container-fold-item
          ${selectedMenu.some(s => s.key === menu[defKey] && s.type === menu.type) ? ` ${currentPrefix}-menu-container-fold-item-selected` : ''}`}
          onClick={e => _expandMenuClick(e, menu[defKey], menu.type, parentKey)}
        >
          <span>
            <Icon type={menu[icon]} className={`${currentPrefix}-menu-container-fold-item-left`}/>
            <span
              className={`${currentPrefix}-menu-container-fold-item-name ${currentPrefix}-menu-container-fold-item-name-parent`}
            >
              {pName}
            </span>
          </span>
          <span className={`${currentPrefix}-menu-container-fold-item-right-group`}>
            <Icon
              style={{
                  transform: `${isOpen ? 'rotate(0deg)' : 'rotate(90deg)'}`,
                }}
              type='fa-angle-down'
              className={`${currentPrefix}-menu-container-fold-item-right`}
            />
            {
                draggableStatus && <span
                  className={`${currentPrefix}-menu-container-fold-item-drag`}
                  draggable
                  onDragStart={e => tempDragTable(e, menu, menu[defKey], pI, parentKey)}
                >
                  <div>
                    <span>{}</span>
                    <span>{}</span>
                    <span>{}</span>
                    <span>{}</span>
                    <span>{}</span>
                    <span>{}</span>
                  </div>
                </span>
            }
          </span>
        </span>
      </div>;
    }
    const name = getName && getName(menu) || menu[defName];
    const key = `${menu[defKey]}`;
    return (<div
      style={style}
      title={name}
      key={`${menu[defKey]}`}
      onContextMenu={e => _onContextMenu(e, key, menu.type, parentKey)}
      onDoubleClick={e => onDoubleMenuClick(e, key, menu.type, parentKey, parentMenu.icon)}
      onClick={e => onMenuClick(e ,key, menu.type, parentKey, null, parentMenus.slice(-1)[0])}
      className={getClassName(itemBase, key, menu.type, false, selected, insertKey)}
      onDragStart={e => tempDragTable(e, menu, key, pI, parentMenu[defKey])}
      draggable={draggableStatus}
      onDragOver={e => rowOnDragOver(e, key, parentMenu[defKey])}
      onDrop={e => rowOnDrop(e, pI, parentMenu[defKey], parentMenu, parentMenus.slice(-1)[0])}
    >
      <span
        id={`chiner-${menu[defKey]}`}
        style={{paddingLeft: 8 * (offsetNumber + 1), color: menu.notes?.fontColor}}
        className={`${currentPrefix}-menu-container-fold-item-name-child`}
      >
        {
            menu.notes?.tags?.length > 0 && <Tooltip
              force
              offsetLeft={50}
              placement='top'
              title={<div className={`${currentPrefix}-note-tag-list`}>
                {
                  menu.notes?.tags?.map((t, index) => {
                              return <div key={index}>{`${index + 1}.${t.content}`}</div>;
                            })
                          }
              </div>}>
              <Icon type='fa-tags' style={{marginRight: 5}}/>
            </Tooltip>
                }
        {name}
      </span>
      {
          draggableStatus && <span
            className={`${currentPrefix}-menu-container-fold-item-drag`}
            draggable
            onDragStart={e => tempDragTable(e, menu, key, pI, parentMenu[defKey])}
          >
            <div>
              <span>{}</span>
              <span>{}</span>
              <span>{}</span>
              <span>{}</span>
              <span>{}</span>
              <span>{}</span>
            </div>
          </span>
      }
    </div>);
  };
  const jumpSimplePosition = (menuKey, type) => {
    const arrayMenus = tree2array(menusDataRef.current);
    const currentMenu = arrayMenus.filter(m => m.id === menuKey)[0];
    if (currentMenu) {
      const parents = (currentMenu.parents || []).map(p => p.id);
      updateSelectedMenu([{
        key: menuKey,
        type: type,
        parentKey: parents[0],
      }]);
      updateExpandMenu(parents);
      setJumpKey({id: `${menuKey}${separator}${parents[0] || ''}`});
    }
  };
  const jumpPosition = (d, key, type) => {
    // 计算所有需要展开的父节点
    const group = type === 'modalAll' ? null : d.groups[0]; // 多个分组存在的话取第一个分组
    let parent, parents;
    switch (key){
      case 'entities':
        parent = d.type === 'refViews' ? 'views' : 'entities';
        parents = group ? [group.id, `${group.defKey}${separator}${parent}`] : [parent];
        updateSelectedMenu([{
          key: d.id,
          parentKey: group?.id,
          type: d.type === 'refViews' ? 'view' : 'entity',
        }]);
        updateExpandMenu(parents);
        setJumpKey({id: `${d.id}${separator}${group?.id || key}`});
        break;
      case 'logicEntities':
        parent = 'logicEntities';
        parents = group ? [group.id, `${group.defKey}${separator}${parent}`] : [parent];
        updateSelectedMenu([{
          key: d.id,
          parentKey: group?.id,
          type: 'logicEntity',
        }]);
        updateExpandMenu(parents);
        setJumpKey({id: `${d.id}${separator}${group?.id || key}`});
        break;
      case 'dicts':
        parent = 'dicts';
        parents = group ? [group.id, `${group.defKey}${separator}${parent}`] : [parent];
        updateSelectedMenu([{
          key: d.id,
          parentKey: group?.id,
          type: 'dict',
        }]);
        updateExpandMenu(parents);
        setJumpKey({id: `${d.id}${separator}${group?.id || key}`});
        break;
      default: break;
    }
  };
  const jumpDetail = (d, key, type) => {
    const positionData = {
      type: d.type,
      groups: d.groups,
    };
    switch (key){
      case 'entities':
        positionData.id = d.id;
        jumpPosition(positionData, key, type);break;
      case 'logicEntities':
        positionData.id = d.id;
        jumpPosition(positionData, key, type);break;
      case 'dicts':
        positionData.id = d.id;
        jumpPosition(positionData, key, type);break;
      case 'fields':
        positionData.id = d.entity;
        jumpPosition(positionData, positionData.type === 'refLogicEntities' ? 'logicEntities' : 'entities', type);break;
      case 'dictItems':
        positionData.id = d.dict;
        jumpPosition(positionData, 'dicts', type);break;
      default: break;
    }
    const typeMap = {
      refEntities: {
        type: 'entity',
        icon: 'entity.svg',
      },
      refLogicEntities: {
        type: 'logicEntity',
        icon: 'fa-columns',
      },
      refViews: {
        type: 'view',
        icon: 'view.svg',
      },
      refDicts: {
        type: 'dict',
        icon: 'dict.svg',
      },
    };
    const param = (key === 'fields' || key === 'dictItems') ? {defKey: d.id} : null;
    doubleMenuClick && doubleMenuClick(positionData.id,
        typeMap[d.type].type, type === 'modalAll' ? null : d.groups[0]?.id, typeMap[d.type].icon, param);
  };
  useImperativeHandle(ref, () => {
    return {
      jumpPosition,
      jumpSimplePosition,
      jumpDetail,
      restSelected: () => updateSelectedMenu([]),
    };
  }, []);
  const _createGroup = (e) => {
    if (groupType === 'modalGroup') {
      onContextMenu && onContextMenu(null,
          'groups',
          { key: null, parentKey: null, type: 'groups' },
          null);
      updatePosition({left: e.clientX, top: e.clientY});
    }
  };
  const onMouseLeave = () => {
    updateInsert('');
  };
  useEffect(() => {
    if (jumpKey) {
      if(!listRef.current) {
        setTimeout(() => {
          listRef.current?.scrollToItem(jumpKey[defKey]);
        });
      } else {
        listRef.current.scrollToItem(jumpKey[defKey]);
      }
    }
  }, [jumpKey]);
  const getMenuData = (menu, nestingLevel, parentMenus, pI) => {
    return ({
      data: {
        id: `${menu[defKey]}${separator}${parentMenus[0]?.[defKey] || ''}`,
        parentMenus,
        menu,
        pI,
        nestingLevel,
        isOpenByDefault: expandMenu.includes(menu[defKey]),
        selected: selectedMenu,
        insertKey: insert,
      },
      nestingLevel,
      menu,
    });
  };
  function* treeWalker() {
    for (let i = 0; i < menus.length; i += 1) {
      yield getMenuData(menus[i], 0, [], i);
    }

    while (true) {
      const parent = yield;

      for (let i = 0; i < parent.menu?.children?.length; i += 1) {
        yield getMenuData(parent.menu.children[i], parent.nestingLevel + 1,
            parent.data.parentMenus.concat(parent.menu), i);
      }
    }
  }
  const Node = useMemo(() => ({data: {parentMenus, menu, nestingLevel, pI, selected, insertKey},
                  isOpen, style}) => {
    return getMenuItem(parentMenus, menu, nestingLevel, pI, isOpen,
        style, selected, insertKey);
  }, []);
  return (
    <div
      ref={menuRef}
      onMouseLeave={onMouseLeave}
      className={`${currentPrefix}-menu-container-fold`}
      onContextMenu={_createGroup}
    >
      {header}
      {menus.length === 0 ? emptyData :
      <div className={`${currentPrefix}-menu-container-fold-container`}>
        <AutoSizer>
          {({height, width}) => {
            return <Tree
              treeWalker={treeWalker}
              ref={listRef}
              itemSize={30}
              height={height}
              width={width}
            >
              {Node}
            </Tree>;
          }}
        </AutoSizer>
      </div>}
      <ContextMenu menuClick={onContextMenuClick} menus={contextMenus} position={position}/>
    </div>
  );
}));

Menu.defaultProps = {
  fieldNames: {
    icon: 'icon',
    defKey: 'id',
    defName: 'defName',
    children: 'children',
  },
};

export default Menu;
