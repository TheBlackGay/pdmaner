import React from 'react'
import { Layout, Menu, Button, Input } from 'antd'
import { Outlet, useNavigate, useLocation, useParams } from 'react-router-dom'
import {
  LeftOutlined,
  SaveOutlined,
  UndoOutlined,
  RedoOutlined,
  SettingOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { useProjectStore } from '@/stores/project'
import styles from './style.module.css'

const { Header, Sider, Content } = Layout

const ProjectLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const { selectedProject } = useProjectStore()

  const menuItems = [
    {
      key: 'model',
      label: '模型',
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
            selectedKeys={[location.pathname]}
            items={menuItems}
          />
        </Sider>

        {/* 3. 子菜单区域 */}
        <Sider width={250} theme="light" className={styles.subSider}>
          {/* 这里将根据主菜单选择显示不同的内容 */}
          <div className={styles.subContent}>
            {/* 子菜单内容将由子组件控制 */}
          </div>
        </Sider>

        {/* 4. 主内容区域 */}
        <Content className={styles.content}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default ProjectLayout 