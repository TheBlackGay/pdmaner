import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';

import MainLayout from '@components/layout/MainLayout';
import HomePage from './pages/Home';
import ProjectsPage from './pages/Projects';
import EntityDesign from './pages/EntityDesign';
import DiagramDesign from './pages/DiagramDesign';
import DictionaryPage from './pages/Dictionary';
import CodeGeneration from './pages/CodeGeneration';
import Welcome from './pages/Welcome';

import '@assets/styles/index.css';

const App: React.FC = () => {
  const isLoading = useSelector((state: RootState) => state.app.isLoading);
  const darkMode = useSelector((state: RootState) => state.app.darkMode);

  return (
    <div className={`app ${darkMode ? 'dark-mode' : ''}`}>
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
      <Router>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/app" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="entity" element={<Navigate to="/app/entity/tables" replace />} />
            <Route path="entity/:domainId?/tables" element={<EntityDesign type="tables" />} />
            <Route path="entity/:domainId?/entities" element={<EntityDesign type="entities" />} />
            <Route path="entity/:domainId?/views" element={<EntityDesign type="views" />} />
            <Route path="diagram/:domainId?" element={<DiagramDesign />} />
            <Route path="dict/:domainId?" element={<DictionaryPage />} />
            <Route path="code" element={<CodeGeneration />} />
            <Route path="datatype" element={<div>数据类型页面</div>} />
            <Route path="domains" element={<div>数据域页面</div>} />
            <Route path="templates" element={<div>模板管理页面</div>} />
            <Route path="history" element={<div>历史版本页面</div>} />
            <Route path="checker" element={<div>规范检查器页面</div>} />
            <Route path="rules" element={<div>规则管理页面</div>} />
          </Route>
        </Routes>
      </Router>
    </div>
  );
};

export default App; 