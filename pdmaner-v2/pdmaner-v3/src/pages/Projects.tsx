import React, { useState } from 'react';
import { 
  FolderOpenOutlined, 
  PlusOutlined, 
  SearchOutlined,
  DeleteOutlined,
  ExportOutlined,
  EditOutlined,
  EyeOutlined 
} from '@ant-design/icons';
import './Projects.css';

interface ProjectItem {
  id: string;
  name: string;
  path: string;
  lastModified: string;
  description?: string;
}

const Projects: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  
  const handleCreateProject = () => {
    // 创建新项目的逻辑
    console.log('Create new project');
  };
  
  const handleOpenProject = () => {
    // 打开项目的逻辑
    console.log('Open project');
  };
  
  const handleDeleteProject = (id: string) => {
    // 删除项目的逻辑
    console.log('Delete project', id);
  };
  
  return (
    <div className="projects-page">
      <div className="page-header">
        <h1>项目管理</h1>
        <div className="actions">
          <button className="create-btn" onClick={handleCreateProject}>
            <PlusOutlined /> 新建项目
          </button>
          <button className="open-btn" onClick={handleOpenProject}>
            <FolderOpenOutlined /> 打开项目
          </button>
        </div>
      </div>
      
      <div className="search-bar">
        <SearchOutlined className="search-icon" />
        <input 
          type="text" 
          placeholder="搜索项目..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="projects-list">
        {projects.length === 0 ? (
          <div className="empty-state">
            <FolderOpenOutlined className="empty-icon" />
            <p>暂无项目</p>
            <p className="sub-text">创建一个新项目或打开现有项目开始工作</p>
          </div>
        ) : (
          <table className="projects-table">
            <thead>
              <tr>
                <th>项目名称</th>
                <th>路径</th>
                <th>最后修改</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(project => (
                <tr key={project.id}>
                  <td>{project.name}</td>
                  <td>{project.path}</td>
                  <td>{project.lastModified}</td>
                  <td className="actions-cell">
                    <button title="查看"><EyeOutlined /></button>
                    <button title="编辑"><EditOutlined /></button>
                    <button title="导出"><ExportOutlined /></button>
                    <button 
                      title="删除" 
                      className="delete-btn"
                      onClick={() => handleDeleteProject(project.id)}
                    >
                      <DeleteOutlined />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Projects; 