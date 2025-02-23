import { Layout, Menu } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  HomeOutlined,
  TableOutlined,
  ProjectOutlined,
  DatabaseOutlined,
  CodeOutlined,
} from '@ant-design/icons'

const { Sider } = Layout

const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/table',
      icon: <TableOutlined />,
      label: '数据表管理',
    },
    {
      key: '/er',
      icon: <ProjectOutlined />,
      label: 'ER图设计',
    },
    {
      key: '/database',
      icon: <DatabaseOutlined />,
      label: '数据库管理',
    },
    {
      key: '/code',
      icon: <CodeOutlined />,
      label: '代码生成',
    },
  ]

  return (
    <Sider width={200} theme="light">
      <div className="logo">PDManer</div>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
      />
    </Sider>
  )
}

export default Sidebar 