import React from 'react';
import { DashboardOutlined } from '@ant-design/icons';
import './ProjectOverview.css';

export interface ProjectStats {
  entityCount: number;
  relationCount: number;
  domainCount: number;
  diagramCount: number;
  dictionaryCount: number;
}

export interface ProjectDetails {
  name: string;
  desc?: string;
  version?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ProjectOverviewProps {
  projectDetails: ProjectDetails;
  stats: ProjectStats;
  isVisible: boolean;
}

const ProjectOverview: React.FC<ProjectOverviewProps> = ({
  projectDetails,
  stats,
  isVisible
}) => {
  if (!isVisible) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '未知';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="project-overview">
      <div className="overview-header">
        <DashboardOutlined />
        <h2>项目概览</h2>
      </div>
      
      <div className="overview-content">
        <div className="overview-section">
          <h3>项目信息</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">名称</span>
              <span className="info-value">{projectDetails.name}</span>
            </div>
            
            {projectDetails.desc && (
              <div className="info-item full-width">
                <span className="info-label">描述</span>
                <span className="info-value">{projectDetails.desc}</span>
              </div>
            )}
            
            {projectDetails.version && (
              <div className="info-item">
                <span className="info-label">版本</span>
                <span className="info-value">{projectDetails.version}</span>
              </div>
            )}
            
            <div className="info-item">
              <span className="info-label">创建时间</span>
              <span className="info-value">{formatDate(projectDetails.createdAt)}</span>
            </div>
            
            <div className="info-item">
              <span className="info-label">更新时间</span>
              <span className="info-value">{formatDate(projectDetails.updatedAt)}</span>
            </div>
          </div>
        </div>
        
        <div className="overview-section">
          <h3>统计信息</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-value">{stats.entityCount}</span>
              <span className="stat-label">实体表</span>
            </div>
            
            <div className="stat-card">
              <span className="stat-value">{stats.domainCount}</span>
              <span className="stat-label">主题域</span>
            </div>
            
            <div className="stat-card">
              <span className="stat-value">{stats.relationCount}</span>
              <span className="stat-label">关系</span>
            </div>
            
            <div className="stat-card">
              <span className="stat-value">{stats.diagramCount}</span>
              <span className="stat-label">ER图</span>
            </div>
            
            <div className="stat-card">
              <span className="stat-value">{stats.dictionaryCount}</span>
              <span className="stat-label">数据字典</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectOverview; 