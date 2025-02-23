import { createBrowserRouter } from 'react-router-dom'
import Layout from '../components/Layout'
import Home from '../pages/Home'
import TableManager from '../pages/TableManager'
import ERDesigner from '../pages/ERDesigner'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'table',
        element: <TableManager />,
      },
      {
        path: 'er',
        element: <ERDesigner />,
      },
    ],
  },
]) 