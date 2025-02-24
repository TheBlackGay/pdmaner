import { Layout } from 'antd'
import { Outlet } from 'react-router-dom'
import './style.css'

const { Content } = Layout

const AppLayout = () => {
  return (
    <Layout className="app-layout">
      <Content className="app-content">
        <Outlet />
      </Content>
    </Layout>
  )
}

export default AppLayout 