import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Button, Empty, Spin, message } from 'antd'
import { PlusOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { invoke } from '@tauri-apps/api/tauri'
import { useProjectStore } from '@/stores/project'
import CreateProjectDialog from '@/components/CreateProjectDialog'
import styles from './style.module.css'

const Home: React.FC = () => {
  const navigate = useNavigate()
  const { projects, loading, fetchProjects, selectProject } = useProjectStore()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleCreateProject = () => {
    setCreateDialogOpen(true)
  }

  const handleProjectClick = (project: any) => {
    selectProject(project)
    navigate(`/project/${project.id}`)
  }

  const handleCreateSampleProjects = async () => {
    try {
      await invoke('create_sample_projects')
      message.success('示例项目创建成功')
      fetchProjects()
    } catch (error) {
      console.error('Failed to create sample projects:', error)
      message.error('示例项目创建失败')
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>我的项目</h1>
        <div>
          <Button
            onClick={handleCreateSampleProjects}
            style={{ marginRight: 8 }}
          >
            创建示例项目
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateProject}
          >
            新建项目
          </Button>
        </div>
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

      <CreateProjectDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
    </div>
  )
}

export default Home 