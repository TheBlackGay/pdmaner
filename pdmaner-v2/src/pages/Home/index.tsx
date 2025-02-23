import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Button, Empty, Spin } from 'antd'
import {
  PlusOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
} from '@ant-design/icons'
import { useProjectStore } from '@/stores/project'
import styles from './style.module.css'

const Home: React.FC = () => {
  const navigate = useNavigate()
  const { projects, loading, fetchProjects, selectProject } = useProjectStore()

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleCreateProject = () => {
    // TODO: 打开创建项目对话框
  }

  const handleProjectClick = (project: any) => {
    selectProject(project)
    navigate(`/project/${project.id}`)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>我的项目</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateProject}
        >
          新建项目
        </Button>
      </div>

      <Spin spinning={loading}>
        {projects.length > 0 ? (
          <Row gutter={[16, 16]}>
            {projects.map(project => (
              <Col key={project.id} xs={24} sm={12} md={8} lg={6}>
                <Card
                  hoverable
                  className={styles.projectCard}
                  onClick={() => handleProjectClick(project)}
                >
                  <h3>{project.name}</h3>
                  <p className={styles.description}>{project.description}</p>
                  <div className={styles.meta}>
                    <span>
                      <ClockCircleOutlined /> {new Date(project.updatedAt).toLocaleDateString()}
                    </span>
                    <span>
                      <DatabaseOutlined /> {project.database?.type || 'MySQL'}
                    </span>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无项目"
          >
            <Button type="primary" onClick={handleCreateProject}>
              创建第一个项目
            </Button>
          </Empty>
        )}
      </Spin>
    </div>
  )
}

export default Home 