import React from 'react';
import './DictionaryPage.css';

const DictionaryPage: React.FC = () => {
  return (
    <div className="dictionary-page">
      <div className="dictionary-header">
        <h2>数据字典</h2>
        <div className="header-actions">
          <button className="action-btn">
            <span className="icon">+</span>
            <span className="text">新建字典</span>
          </button>
          <button className="action-btn">
            <span className="icon">📥</span>
            <span className="text">导入</span>
          </button>
          <button className="action-btn">
            <span className="icon">📤</span>
            <span className="text">导出</span>
          </button>
        </div>
      </div>

      <div className="dictionaries-container">
        <div className="dictionary-group">
          <h3>系统字典</h3>
          <div className="dictionary-list">
            <div className="dictionary-card">
              <div className="dictionary-title">状态字典</div>
              <div className="dictionary-info">包含10个字典项</div>
              <div className="dictionary-actions">
                <button title="编辑">✏️</button>
                <button title="删除">🗑️</button>
              </div>
            </div>
            <div className="dictionary-card">
              <div className="dictionary-title">类型字典</div>
              <div className="dictionary-info">包含8个字典项</div>
              <div className="dictionary-actions">
                <button title="编辑">✏️</button>
                <button title="删除">🗑️</button>
              </div>
            </div>
          </div>
        </div>

        <div className="dictionary-group">
          <h3>自定义字典</h3>
          <div className="dictionary-list">
            <div className="dictionary-card">
              <div className="dictionary-title">用户类型</div>
              <div className="dictionary-info">包含5个字典项</div>
              <div className="dictionary-actions">
                <button title="编辑">✏️</button>
                <button title="删除">🗑️</button>
              </div>
            </div>
          </div>
        </div>

        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <div className="empty-text">点击"新建字典"创建您的第一个数据字典</div>
        </div>
      </div>
    </div>
  );
};

export default DictionaryPage; 