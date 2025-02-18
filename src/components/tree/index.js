import React, {useState, useMemo, useCallback, useRef} from 'react';

import CheckBox from 'components/checkbox';
import Icon from 'components/icon';
import SearchInput from 'components/searchinput';

import './style/index.less';
import AutoSizer from 'react-virtualized-auto-sizer';
import {FixedSizeTree as Tree} from 'react-vtree';
import {getPrefix} from '../../lib/prefixUtil';
import {tree2array} from '../../lib/tree';

export default React.memo(({prefix, dataSource, labelRender, defaultCheckeds,
                           onChange, placeholder, simpleChecked}) => {
  const calcKey = (c) => {
    return c.reduce((a, b) => a.concat(b.key).concat(calcKey(b.children || [])), []);
  };
  const arrayData = useMemo(() => tree2array(dataSource), [dataSource]);
  const arrayDataRef = useRef([]);
  arrayDataRef.current = arrayData;
  const parentKeys = useMemo(() => arrayData.filter(d => !!d.children).map(d => d.key),
      [arrayData]);
  const parentKeysRef = useRef([]);
  parentKeysRef.current = parentKeys;
  const [searchValue, updateSearchValue] = useState('');
  const checkedData = [...(defaultCheckeds || [])];
  const checkData = useMemo(() => arrayData.filter(d => checkedData.includes(d.key)), []);
  const [checkeds, updateCheckeds] = useState(() => {
    checkData.filter(d => !!d.children).forEach((d) => {
      // 先处理所有父节点 把父节点下的所有子节点选中
      checkedData.push(...calcKey(d.children));
    });
    checkData.filter(d => !d.children).forEach((d) => {
      // 处理所有的子节点
      d.parents.reverse().forEach((p) => {
        if (!checkedData.includes(p.key)) {
          if (calcKey(p.children || []).every(c => checkedData.includes(c))) {
            checkedData.push(p.key);
          }
        }
      });
    });
    return [...new Set(checkedData)];
  });
  const [expands, updateExpands] = useState(() => {
    return checkData.reduce((a, b) => a.concat(b.parents),[]).map(d => d.key);
  });
  const _iconClick = (key) => {
    updateExpands((pre) => {
      let tempExpands = [...pre];
      if (tempExpands.includes(key)) {
        tempExpands = tempExpands.filter(k => k !== key);
      } else {
        tempExpands = tempExpands.concat(key);
      }
      return tempExpands;
    });
  };
  const reg = new RegExp((searchValue || '')
      .replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
  const regRef = useRef(reg);
  regRef.current = reg;
  const _checkBoxChange = (nodeCheckeds, e, { key, children }, parent) => {
    let tempCheckeds = [...nodeCheckeds];
    const checked = e.target.checked;
    if (checked) {
      if (simpleChecked) {
        tempCheckeds = [key];
      } else {
        const currentChecked = [key];
        if (parent && parent.children
            .filter(c => c.key !== key)
            .every(c => tempCheckeds.includes(c.key))) {
          // 判断是否需要选中父节点
          currentChecked.push(parent.key);
        }
        if (children) {
          // 选中所有子节点
          currentChecked.push(...calcKey(children.filter(c => regRef.current.test(c.value || ''))));
        }
        tempCheckeds = [...new Set(tempCheckeds.concat(currentChecked))];
      }
    } else {
      const currentUnChecked = [key];
      if (parent && tempCheckeds.includes(parent.key)) {
        // 判断是否需要取消选中父节点
        currentUnChecked.push(parent.key);
      }
      if (children) {
        // 取消选中所有子节点
        currentUnChecked.push(...calcKey(children.filter(c => regRef.current.test(c.value || ''))));
      }
      tempCheckeds = tempCheckeds.filter(p => !currentUnChecked.includes(p));
    }
    updateCheckeds(tempCheckeds);
    onChange && onChange(tempCheckeds.filter(k => !parentKeysRef.current.includes(k)));
  };
  const currentPrefix = getPrefix(prefix);
  const TreeNode = useMemo(() =>
      ({data: {isLeaf, node, parent, nestingLevel, nodeCheckeds}, style, isOpen}) => {
    return <li style={{...style, paddingLeft: 25 * nestingLevel}}>
      {!isLeaf && <Icon
        type={`fa-caret-${isOpen ? 'down' : 'right'}`}
        onClick={() => _iconClick(node.key)}
      />}
      <CheckBox
        disable={!isLeaf && simpleChecked}
        checked={nodeCheckeds.includes(node.key)}
        onChange={e => _checkBoxChange(nodeCheckeds, e, node, parent)}
        >
        <span
          style={{marginLeft: 2}}
        >
          {labelRender && labelRender(node.key, node.value) || node.value}
        </span>
      </CheckBox>
    </li>;
  }, []);
  const onSearchChange = (e) => {
    updateSearchValue(e.target.value);
    const currentReg = new RegExp((e.target.value || '')
      .replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
    const searchData = e.target.value ? arrayDataRef.current
        .filter(d => currentReg.test(d.value || '')) : [];
    updateExpands(pre => pre
      .concat([...new Set(searchData.reduce((a, b) => a.concat(b.parents.map(p => p.key)), []))]));
  };
  const getNodeData = (node, nestingLevel, parent) => ({
    data: {
      id: node.key,
      node,
      nestingLevel,
      isOpenByDefault: expands.includes(node.key),
      isLeaf: !node.children,
      parent,
      nodeCheckeds: checkeds,
    },
    nestingLevel,
    node,
  });
  function* treeWalker() {
    for (let i = 0; i < dataSource.length; i += 1) {
      yield getNodeData(dataSource[i], 0);
    }

    while (true) {
      const parent = yield;
      const children = (parent.node?.children || [])
          .filter((c) => {
            return tree2array([c]).some(cc => regRef.current.test(cc.value || ''));
          });
      for (let i = 0; i < children?.length; i += 1) {
        yield getNodeData(children[i], parent.nestingLevel + 1, parent.node);
      }
    }
  }
  const innerElementType = useCallback(({children, ...props}) => {
    return <ul {...props}>{children}</ul>;
  }, []);
  return (
    <ul className={`${currentPrefix}-tree`}>
      <ul className={`${currentPrefix}-tree-all`}>
        <li><SearchInput onChange={onSearchChange} placeholder={placeholder}/></li>
        {dataSource.length > 0 && <ul>
          <AutoSizer>
            {({height, width}) => {
              return <Tree
                innerElementType={innerElementType}
                treeWalker={treeWalker}
                itemSize={22}
                height={height}
                width={width}
              >
                {TreeNode}
              </Tree>;
            }}
          </AutoSizer>
        </ul>}
      </ul>
    </ul>
  );
});

