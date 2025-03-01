import React, { useState, useEffect } from 'react';
import './SideMenu.css';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  DatabaseOutlined,
  TableOutlined,
  FolderOpenOutlined,
  BranchesOutlined,
  BookOutlined,
  CodeOutlined,
  CaretRightOutlined,
  CaretDownOutlined
} from '@ant-design/icons';

// 菜单项接口
export interface MenuItem {
  key: string;
  title: string;
  icon?: React.ReactNode;
  path?: string;
  children?: MenuItem[];
  expanded?: boolean;
  id?: string;
  code?: string;
  comment?: string;
  parentDomainId?: string;
  tablesDomainId?: string; // 标记需要从domainTables获取数据的节点
}

// 组件属性接口
interface SideMenuProps {
  menuItems: MenuItem[];
  collapsed: boolean;
  selectedTableKey: string;
  activeTab: string;
  onToggleCollapsed: () => void;
  onToggleMenuExpand: (key: string) => void;
  onMenuItemClick: (item: MenuItem) => void;
  onTableItemClick: (tableKey: string) => void;
  onContextMenu: (e: React.MouseEvent, type: string, key: string) => void;
  domainTables?: {[domainId: string]: MenuItem[]}; // 表项数据，按domainId分组
}

// 表项组件，使用memo优化渲染性能
const TableItem = React.memo(({
  tableItem,
  isSelected,
  onItemClick,
  onContextMenu
}: {
  tableItem: MenuItem,
  isSelected: boolean,
  onItemClick: (key: string) => void,
  onContextMenu: (e: React.MouseEvent, type: string, key: string) => void
}) => {
  return (
    <div
      key={tableItem.key}
      className={`menu-item ${isSelected ? 'selected' : ''}`}
      onClick={(e) => {
        // 完全阻止事件传播
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
        e.preventDefault();

        onItemClick(tableItem.key);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(e, 'table', tableItem.key);
      }}
    >
      {React.isValidElement(tableItem.icon) ? tableItem.icon : <TableOutlined />}
      <span>{`${tableItem.title}${tableItem.comment ? ` [${tableItem.comment}]` : ''}`}</span>
    </div>
  );
});

// 表项列表组件，使用memo优化渲染性能
const TableItemsList = React.memo(({
  domainId,
  tables,
  selectedTableKey,
  onTableItemClick,
  onContextMenu
}: {
  domainId: string,
  tables: MenuItem[],
  selectedTableKey: string,
  onTableItemClick: (key: string) => void,
  onContextMenu: (e: React.MouseEvent, type: string, key: string) => void
}) => {
  if (!tables || tables.length === 0) {
    return <div className="empty-tables">暂无表</div>;
  }

  return (
    <React.Fragment>
      {tables.map(tableItem => (
        <TableItem
          key={tableItem.key}
          tableItem={tableItem}
          isSelected={selectedTableKey === tableItem.key}
          onItemClick={onTableItemClick}
          onContextMenu={onContextMenu}
        />
      ))}
    </React.Fragment>
  );
});

const SideMenu: React.FC<SideMenuProps> = ({
  menuItems,
  collapsed,
  selectedTableKey,
  activeTab,
  onToggleCollapsed,
  onToggleMenuExpand,
  onMenuItemClick,
  onTableItemClick,
  onContextMenu,
  domainTables = {} // 默认为空对象
}) => {
  // 内部状态，用于跟踪当前选中的表项
  const [internalSelectedKey, setInternalSelectedKey] = useState(selectedTableKey);

  // 当外部selectedTableKey变化时，更新内部状态
  useEffect(() => {
    setInternalSelectedKey(selectedTableKey);
  }, [selectedTableKey]);

  // 处理表项点击，内部更新选中状态并通知父组件
  const handleTableItemClick = (tableKey: string) => {
    setInternalSelectedKey(tableKey);
    onTableItemClick(tableKey);
  };

  // 递归渲染菜单项
  const renderMenuItems = (items: MenuItem[]) => {
    return items.map(item => (
      <div key={item.key}>
        {/* 如果是主题域，它也可以展开 */}
        {item.children ? (
          <>
            <div
              className="domain-header"
              onClick={(e) => {
                e.stopPropagation();
                // 如果有子项，则切换展开/折叠状态
                onToggleMenuExpand(item.key);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                // 获取菜单类型
                let menuType = 'domain';
                if (item.key.startsWith('domain_')) menuType = 'domain';

                onContextMenu(e, menuType, item.key);
              }}
            >
              <div className="domain-title">
                {React.isValidElement(item.icon) ? item.icon : null}
                <span>{item.title}</span>
              </div>
              {
                item.expanded ?
                <CaretDownOutlined className="expand-icon" /> :
                <CaretRightOutlined className="expand-icon" />
              }
            </div>

            {/* 显示主题域下的子菜单项 */}
            {item.expanded && (
              <div className="domain-items">
                {item.children.map(subItem => (
                  <div key={subItem.key}>
                    <div
                      className={`menu-item ${activeTab === subItem.key ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();

                        // 如果子项有子菜单或者是表格组，则切换展开/折叠状态
                        if ((subItem.children && subItem.children.length > 0) || subItem.tablesDomainId) {
                          onToggleMenuExpand(subItem.key);
                        } else {
                          // 否则导航到页面
                          onMenuItemClick(subItem);
                        }
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        // 获取菜单类型
                        let menuType = 'tables';
                        if (subItem.key.startsWith('entities_')) menuType = 'entities';
                        else if (subItem.key.startsWith('views_')) menuType = 'views';
                        else if (subItem.key.startsWith('diagrams_')) menuType = 'diagrams';
                        else if (subItem.key.startsWith('dictionaries_')) menuType = 'dictionaries';

                        onContextMenu(e, menuType, subItem.key);
                      }}
                    >
                      {React.isValidElement(subItem.icon) ? subItem.icon : null}
                      <span>{subItem.title}</span>
                      {(subItem.children && subItem.children.length > 0) || subItem.tablesDomainId ? (
                        subItem.expanded ?
                        <CaretDownOutlined className="expand-icon-small" style={{marginLeft: 'auto'}} /> :
                        <CaretRightOutlined className="expand-icon-small" style={{marginLeft: 'auto'}} />
                      ) : null}
                    </div>

                    {/* 子菜单项的子项 - 处理表格列表 */}
                    {subItem.expanded && (
                      <div className="table-items">
                        {/* 检查是否有tablesDomainId标记 */}
                        {subItem.tablesDomainId && domainTables[subItem.tablesDomainId] ? (
                          <TableItemsList
                            domainId={subItem.tablesDomainId}
                            tables={domainTables[subItem.tablesDomainId]}
                            selectedTableKey={internalSelectedKey}
                            onTableItemClick={handleTableItemClick}
                            onContextMenu={onContextMenu}
                          />
                        ) : (
                          // 如果有普通子菜单项，则也使用优化后的TableItemsList组件
                          subItem.children && subItem.children.length > 0 ? (
                            <TableItemsList
                              domainId={subItem.key.split('_')[1] || ''}
                              tables={subItem.children}
                              selectedTableKey={internalSelectedKey}
                              onTableItemClick={handleTableItemClick}
                              onContextMenu={onContextMenu}
                            />
                          ) : (
                            <div></div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div
            className={`menu-item ${activeTab === item.key ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onMenuItemClick(item);
            }}
          >
            {React.isValidElement(item.icon) ? item.icon : null}
            <span>{item.title}</span>
          </div>
        )}
      </div>
    ));
  };

  return (
    <aside className={`menu-panel ${collapsed ? 'collapsed' : ''}`}>
      {/* 面板头部 */}
      <div className="panel-header">
        <h3>{collapsed ? '' : 'PDManer'}</h3>
        <div className="panel-actions">
          <button
            className="collapse-btn"
            onClick={onToggleCollapsed}
            title={collapsed ? '展开菜单' : '折叠菜单'}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>
        </div>
      </div>

      {/* 菜单树 */}
      <div className="menu-tree">
        {/* 根菜单组 */}
        {menuItems.map(menuGroup => (
          <div key={menuGroup.key} className="menu-group">
            {/* 菜单组标题 */}
            <div
              className="menu-group-header"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMenuExpand(menuGroup.key);
              }}
              onContextMenu={menuGroup.key === 'model' ? (e) => {
                e.preventDefault();
                onContextMenu(e, 'model', menuGroup.key);
              } : undefined}
            >
              <div className="menu-group-title">
                {React.isValidElement(menuGroup.icon) ? menuGroup.icon : null}
                {!collapsed && <span>{menuGroup.title}</span>}
              </div>
              {!collapsed && (
                menuGroup.expanded ?
                <CaretDownOutlined className="expand-icon" /> :
                <CaretRightOutlined className="expand-icon" />
              )}
            </div>

            {/* 菜单组子项 */}
            {!collapsed && menuGroup.expanded && (
              <div className="menu-items">
                {menuGroup.children && renderMenuItems(menuGroup.children)}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
};

// 使用React.memo包装组件，增加性能优化
export default React.memo(SideMenu, (prevProps, nextProps) => {
  // 只有menuItems或collapsed变化时才重新渲染整个菜单
  // 忽略selectedTableKey、activeTab和domainTables的变化
  const menuItemsEqual = prevProps.menuItems === nextProps.menuItems;
  const collapsedEqual = prevProps.collapsed === nextProps.collapsed;

  // 返回true表示不需要重新渲染，返回false表示需要重新渲染
  return menuItemsEqual && collapsedEqual;
});
