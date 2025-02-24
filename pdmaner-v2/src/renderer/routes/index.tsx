import { createBrowserRouter } from 'react-router-dom'
import Layout from '../components/Layout'
import Home from '../pages/Home'
import ProjectLayout from '../pages/Project/Layout'
import TableManager from '../pages/Project/TableManager'
import ERDesigner from '../pages/Project/ERDesigner'
import DatabaseManager from '../pages/Project/DatabaseManager'
import CodeGenerator from '../pages/Project/CodeGenerator'

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
        path: 'project/:id',
        element: <ProjectLayout />,
        children: [
          {
            path: 'table',
            element: <TableManager />,
          },
          {
            path: 'er',
            element: <ERDesigner />,
          },
          {
            path: 'database',
            element: <DatabaseManager />,
          },
          {
            path: 'code',
            element: <CodeGenerator />,
          },
        ],
      },
    ],
  },
]) 