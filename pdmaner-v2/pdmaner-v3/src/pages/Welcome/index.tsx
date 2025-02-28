import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { 
  PlusOutlined, 
  FolderOpenOutlined, 
  ProjectOutlined,
  ClockCircleOutlined,
  EditOutlined,
  QuestionCircleOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { setLoading, setCurrentProject } from '@store/slices/appSlice';
import { getRecentProjects, ProjectInfo, createNewProject, deleteProject, getProjectById } from '@utils/projectStorage';
import NewProjectModal from '@components/modals/NewProjectModal';
import './Welcome.css';

const Welcome: React.FC = () => {
  const [recentProjects, setRecentProjects] = useState<ProjectInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // 加载最近项目
  useEffect(() => {
    // 从localStorage获取最近项目列表
    const projects = getRecentProjects();
    setRecentProjects(projects);
    setIsLoading(false);
  }, []);

  // 格式化最后修改时间
  const formatLastModified = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return '今天';
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
  };

  // 处理创建新项目
  const handleCreateProject = () => {
    setIsProjectModalOpen(true);
  };

  // 确认创建项目
  const handleConfirmCreateProject = (name: string, description: string) => {
    // 检查是否存在相同名称的项目
    const projects = getRecentProjects();
    const projectNameExists = projects.some(project => project.name === name);
    
    if (projectNameExists) {
      alert(`项目名称 "${name}" 已存在，请使用其他名称`);
      return;
    }
    
    dispatch(setLoading(true));
    
    // 创建新项目
    try {
      const newProject = createNewProject(name, description);
      dispatch(setCurrentProject(newProject));
      
      // 关闭弹窗并跳转
      setIsProjectModalOpen(false);
      navigate('/app/entity/tables');
    } catch (error) {
      console.error('创建项目失败', error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  // 打开最近的项目
  const openRecentProject = (project: ProjectInfo) => {
    dispatch(setLoading(true));
    
    try {
      // 获取完整项目数据
      const projectData = getProjectById(project.id);
      if (projectData) {
        dispatch(setCurrentProject(projectData));
        navigate('/app/entity/tables');
      } else {
        console.error('项目数据不存在');
        // 删除失效的项目引用
        deleteProject(project.id);
        // 重新加载项目列表
        setRecentProjects(getRecentProjects());
      }
    } catch (error) {
      console.error('打开项目失败', error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  // 删除项目
  const handleDeleteProject = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    
    if (window.confirm('确定要删除此项目吗？此操作不可恢复。')) {
      deleteProject(projectId);
      // 更新项目列表
      setRecentProjects(getRecentProjects());
    }
  };

  return (
    <div className="welcome-page">
      <header className="welcome-header">
        <div className="logo-container">
          <div className="logo">PDManer</div>
          <div className="version">V5.0.0</div>
        </div>
        <div className="header-right">
          <button className="help-button">
            <QuestionCircleOutlined /> 帮助文档
          </button>
        </div>
      </header>

      <main className="welcome-content">
        <div className="welcome-sidebar">
          <div className="welcome-title">
            <h1>欢迎使用 PDManer</h1>
            <p>专业的数据库建模工具</p>
          </div>

          <div className="action-buttons">
            <button className="create-btn" onClick={handleCreateProject}>
              <PlusOutlined /> 创建新项目
            </button>
            <button className="open-btn" onClick={handleCreateProject}>
              <FolderOpenOutlined /> 打开项目
            </button>
            <button className="projects-btn" onClick={() => navigate('/app/projects')}>
              <ProjectOutlined /> 项目管理
            </button>
          </div>
        </div>

        <div className="recent-projects">
          <h2>
            <ClockCircleOutlined /> 最近项目
          </h2>

          {isLoading ? (
            <div className="loading-projects">
              <div className="loading-spinner"></div>
              <p>加载项目中...</p>
            </div>
          ) : recentProjects.length > 0 ? (
            <div className="project-cards">
              {recentProjects.map(project => (
                <div className="project-card" key={project.id} onClick={() => openRecentProject(project)}>
                  <div className="project-thumbnail">
                    <div className="no-thumbnail">
                      <ProjectOutlined />
                    </div>
                  </div>
                  <div className="project-details">
                    <h3>{project.name}</h3>
                    <div className="project-meta">
                      <span className="project-path">{project.path.split('_').pop()}</span>
                      <span className="project-modified">修改于: {formatLastModified(project.lastModified)}</span>
                    </div>
                    <div className="project-actions">
                      <button 
                        className="delete-project" 
                        title="删除项目"
                        onClick={(e) => handleDeleteProject(e, project.id)}
                      >
                        <DeleteOutlined />
                      </button>
                      <button className="edit-project" title="编辑项目">
                        <EditOutlined />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-projects">
              <div className="empty-icon">
                <FolderOpenOutlined />
              </div>
              <p>暂无最近项目记录</p>
              <button className="create-first-btn" onClick={handleCreateProject}>
                <PlusOutlined /> 创建第一个项目
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="welcome-footer">
        <p>Copyright © 2024 PDManer 团队</p>
        <p>版本: v5.0.0 | <a href="#">检查更新</a></p>
      </footer>

      {/* 新建项目弹窗 */}
      <NewProjectModal 
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onConfirm={handleConfirmCreateProject}
      />
    </div>
  );
};

export default Welcome; 