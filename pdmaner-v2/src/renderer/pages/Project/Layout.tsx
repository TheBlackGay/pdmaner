import React, { useState, useEffect } from 'react'
import { Layout, Menu, Button, Input, List } from 'antd'
import { Outlet, useNavigate, useLocation, useParams } from 'react-router-dom'
import {
  LeftOutlined,
  SaveOutlined,
  UndoOutlined,
  RedoOutlined,
  SettingOutlined,
  SearchOutlined,
  PlusOutlined,
  TableOutlined,
} from '@ant-design/icons'
import { useProjectStore } from '@/stores/project'
import { useTableStore } from '@/stores/table'
import CreateTableDialog from '@/renderer/components/CreateTableDialog'
import styles from './style.module.css'
import TableDetail from './TableDetail'

const { Header, Sider, Content } = Layout

// 子菜单组件 - 模型
const ModelSubMenu: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>()
  const { tables, loading, fetchTables, selectTable } = useTableStore()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  useEffect(() => {
    if (projectId) {
      fetchTables(projectId)
    }
  }, [projectId, fetchTables])

  return (
    <div className={styles.subMenuContainer}>
      <div className={styles.subMenuHeader}>
        <span>数据表</span>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          size="small"
          onClick={() => setCreateDialogOpen(true)}
        >
          创建表
        </Button>
      </div>
      <div className={styles.tableList}>
        <List
          loading={loading}
          dataSource={tables}
          renderItem={table => (
            <List.Item
              className={styles.tableItem}
              onClick={() => selectTable(table)}
            >
              <div className={styles.tableName}>{table.name}</div>
              {table.comment && (
                <div className={styles.tableComment}>{table.comment}</div>
              )}
            </List.Item>
          )}
        />
      </div>
      <CreateTableDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
    </div>
  )
}

const ProjectLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const { selectedProject } = useProjectStore()
  const [selectedMenu, setSelectedMenu] = useState('model') // 默认选中模型菜单

  const menuItems = [
    {
      key: 'model',
      label: '模型',
      icon: <TableOutlined />,
    },
    {
      key: 'types',
      label: '类型设置',
    },
    {
      key: 'generator',
      label: '代码生成器',
    },
    {
      key: 'version',
      label: '版本管理',
    },
    {
      key: 'check',
      label: '规范检查',
    },
  ]

  // 渲染子菜单内容
  const renderSubMenu = () => {
    switch (selectedMenu) {
      case 'model':
        return <ModelSubMenu />
      case 'types':
        return <div>类型设置子菜单</div>
      case 'generator':
        return <div>代码生成器子菜单</div>
      case 'version':
        return <div>版本管理子菜单</div>
      case 'check':
        return <div>规范检查子菜单</div>
      default:
        return null
    }
  }

  return (
    <Layout className={styles.projectLayout}>
      {/* 1. 顶部工具栏 */}
      <Header className={styles.header}>
        <div className={styles.headerLeft}>
          <Button 
            type="text" 
            icon={<LeftOutlined />}
            onClick={() => navigate('/')}
          />
          <span className={styles.projectName}>{selectedProject?.name}</span>
        </div>
        <div className={styles.headerCenter}>
          <Button icon={<SaveOutlined />}>保存</Button>
          <Button icon={<UndoOutlined />}>撤销</Button>
          <Button icon={<RedoOutlined />}>重做</Button>
          <Button icon={<SettingOutlined />}>设置</Button>
        </div>
        <div className={styles.headerRight}>
          <Input 
            prefix={<SearchOutlined />}
            placeholder="搜索表/字段"
            className={styles.searchInput}
          />
        </div>
      </Header>

      <Layout>
        {/* 2. 左侧主菜单 */}
        <Sider width={200} theme="light" className={styles.mainSider}>
          <Menu
            mode="inline"
            selectedKeys={[selectedMenu]}
            items={menuItems}
            onClick={({ key }) => setSelectedMenu(key)}
          />
        </Sider>

        {/* 3. 子菜单区域 */}
        <Sider width={250} theme="light" className={styles.subSider}>
          <div className={styles.subContent}>
            {renderSubMenu()}
          </div>
        </Sider>

        {/* 4. 主内容区域 */}
        <Content className={styles.content}>
          {selectedMenu === 'model' ? (
            <TableDetail />
          ) : (
            <Outlet />
          )}
        </Content>
      </Layout>
    </Layout>
  )
}

export default ProjectLayout 