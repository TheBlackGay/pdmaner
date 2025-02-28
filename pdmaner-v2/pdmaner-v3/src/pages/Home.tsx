import React from 'react';
import { HomeOutlined, ProjectOutlined, TableOutlined, BranchesOutlined } from '@ant-design/icons';
import './Home.css';

const Home: React.FC = () => {
  return (
    <div className="home-page">
      <section className="welcome-section">
        <h1>欢迎使用 PDManer V3</h1>
        <p>专业的数据库建模工具，为您的数据库设计提供强大支持</p>
      </section>
      
      <section className="quick-actions">
        <div className="action-card">
          <HomeOutlined className="icon" />
          <h3>开始</h3>
          <p>了解 PDManer 的基本功能和使用方法</p>
          <button>查看教程</button>
        </div>
        
        <div className="action-card">
          <ProjectOutlined className="icon" />
          <h3>项目</h3>
          <p>创建新项目或打开现有项目进行编辑</p>
          <button>管理项目</button>
        </div>
        
        <div className="action-card">
          <TableOutlined className="icon" />
          <h3>数据表</h3>
          <p>设计和管理数据表结构和字段定义</p>
          <button>表设计器</button>
        </div>
        
        <div className="action-card">
          <BranchesOutlined className="icon" />
          <h3>关系图</h3>
          <p>可视化设计实体关系图和表关联</p>
          <button>ER 图设计</button>
        </div>
      </section>
      
      <section className="recent-projects">
        <h2>最近的项目</h2>
        <div className="project-list">
          <p className="empty-message">暂无最近项目</p>
        </div>
      </section>
    </div>
  );
};

export default Home; 