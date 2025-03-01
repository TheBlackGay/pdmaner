import React from 'react';
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
}

const SideMenu: React.FC<SideMenuProps> = ({
  menuItems,
  collapsed,
  selectedTableKey,
  activeTab,
  onToggleCollapsed,
  onToggleMenuExpand,
  onMenuItemClick,
  onTableItemClick,
  onContextMenu
}) => {
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
                // 只切换当前域的展开状态，不影响其他域或子菜单
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
                        // 完全阻止事件传播
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                        e.preventDefault();
                        
                        // 处理"数据表"、"逻辑实体"、"多表透视"等菜单项的点击
                        // 这些项目应该被展开/折叠，而不是导航到页面
                        if (subItem.key.startsWith('tables_') || 
                            subItem.key.startsWith('entities_') || 
                            subItem.key.startsWith('views_') || 
                            subItem.key.startsWith('diagrams_') || 
                            subItem.key.startsWith('dictionaries_')) {
                          // 只切换展开/折叠状态
                          onToggleMenuExpand(subItem.key);
                        } 
                        // 其他没有子菜单的项目才进行导航
                        else if (!subItem.children || subItem.children.length === 0) {
                          // 处理点击没有子项的菜单
                          // 确保使用正确的path
                          if (subItem.parentDomainId && subItem.path) {
                            // 解析并修复路径
                            let correctPath;
                            
                            const pathParts = subItem.path.split('/');
                            // 确保正确使用当前主题域ID，不管原始路径中是否已经有domainId
                            if (pathParts.length >= 4) {
                              // 替换路径中的domainId部分
                              pathParts[3] = subItem.parentDomainId;
                              correctPath = pathParts.join('/');
                            } else {
                              // 如果路径格式不符合预期，构建新路径
                              // 从key中提取类型，例如tables_123 => tables
                              const typeMatch = subItem.key.match(/^(\w+)_/);
                              const type = typeMatch ? typeMatch[1] : '';
                              correctPath = `/app/entity/${subItem.parentDomainId}/${type}`;
                            }
                            
                            // 创建修正后的菜单项
                            const fixedItem = {
                              ...subItem,
                              path: correctPath
                            };
                            
                            // 点击菜单项，但不影响其他项的展开状态
                            onMenuItemClick(fixedItem);
                          } else {
                            onMenuItemClick(subItem);
                          }
                        } else {
                          // 有子菜单的项目，切换展开/折叠状态
                          onToggleMenuExpand(subItem.key);
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
                      {subItem.children && subItem.children.length > 0 && (
                        subItem.expanded ?
                        <CaretDownOutlined className="expand-icon-small" style={{marginLeft: 'auto'}} /> :
                        <CaretRightOutlined className="expand-icon-small" style={{marginLeft: 'auto'}} />
                      )}
                    </div>

                    {/* 子菜单项的子项 */}
                    {subItem.expanded && subItem.children && subItem.children.length > 0 && (
                      <div className="table-items">
                        {subItem.children.map(tableItem => (
                          <div
                            key={tableItem.key}
                            className={`menu-item ${selectedTableKey === tableItem.key ? 'selected' : ''}`}
                            onClick={(e) => {
                              // 完全阻止事件传播
                              e.stopPropagation();
                              e.nativeEvent.stopImmediatePropagation();
                              e.preventDefault();
                              
                              onTableItemClick(tableItem.key);
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              onContextMenu(e, 'table', tableItem.key);
                            }}
                          >
                            {React.isValidElement(tableItem.icon) ? tableItem.icon : <TableOutlined />}
                            <span>{`${tableItem.title}${tableItem.comment ? ` [${tableItem.comment}]` : ''}`}</span>
                          </div>
                        ))}
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
                // 只切换当前菜单组的展开状态，不影响其子菜单项
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

export default SideMenu; 