import { Layout } from 'antd'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import './style.css'

const { Content } = Layout

const AppLayout = () => {
  return (
    <Layout className="app-layout">
      <Sidebar />
      <Layout>
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default AppLayout 