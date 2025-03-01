import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  BranchesOutlined,
  PlusOutlined,
  SearchOutlined,
  ProjectOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { RootState } from '@store/index';
import { setCurrentProject } from '@store/slices/appSlice';
import { useNotificationContext } from '../contexts/NotificationContext';
import { generateUUID } from '@utils/uuid';
import DiagramContextMenu from '../components/contextMenus/DiagramContextMenu';
import PopConfirm from '../components/common/PopConfirm';
import { Diagram } from '../models/diagram';
import './DiagramList.css';

interface DiagramListProps {}

const DiagramList: React.FC<DiagramListProps> = () => {
  // 获取URL中的domainId参数
  const { domainId } = useParams<{ domainId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { success, error } = useNotificationContext();
  
  // 从Redux获取当前项目
  const currentProject = useSelector((state: RootState) => state.app.currentProject);
  
  // 状态
  const [searchTerm, setSearchTerm] = useState('');
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [selectedDiagrams, setSelectedDiagrams] = useState<string[]>([]);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
  });
  const [clipboardData, setClipboardData] = useState<{
    action: 'copy' | 'cut';
    diagrams: Diagram[];
  } | null>(null);
  const [popConfirm, setPopConfirm] = useState({
    visible: false,
    title: '',
    action: '',
    position: { x: 0, y: 0 },
    targetId: ''
  });
  
  // 在组件加载时获取关系图数据
  useEffect(() => {
    if (currentProject && domainId) {
      // 从项目中筛选当前主题域的关系图
      const domainDiagrams = currentProject.diagrams?.filter(
        diagram => diagram.domainId === domainId
      ) || [];
      
      setDiagrams(domainDiagrams);
    }
  }, [currentProject, domainId]);
  
  // 监听自定义事件，添加关系图
  useEffect(() => {
    const handleAddDiagramEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.domainId === domainId) {
        handleAddDiagram();
      }
    };
    
    window.addEventListener('add-diagram', handleAddDiagramEvent);
    
    return () => {
      window.removeEventListener('add-diagram', handleAddDiagramEvent);
    };
  }, [domainId]); // 依赖domainId，确保只在domainId变化时重新添加监听器
  
  // 获取当前主题域名称
  const getDomainName = (): string => {
    if (!currentProject || !domainId) return '';
    
    const domain = currentProject.domains.find(d => d.id === domainId);
    return domain ? domain.name : '';
  };
  
  // 根据搜索词过滤关系图
  const getFilteredDiagrams = (): Diagram[] => {
    if (!searchTerm) return diagrams;
    
    return diagrams.filter(diagram => 
      diagram.defName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      diagram.defKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
      diagram.comment?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };
  
  // 处理关系图项点击
  const handleDiagramClick = (diagramId: string, event: React.MouseEvent) => {
    // Control键多选
    if (event.ctrlKey || event.metaKey) {
      setSelectedDiagrams(prev => {
        if (prev.includes(diagramId)) {
          return prev.filter(id => id !== diagramId);
        } else {
          return [...prev, diagramId];
        }
      });
    } else {
      // 单选
      setSelectedDiagrams([diagramId]);
    }
  };
  
  // 处理关系图项双击
  const handleDiagramDoubleClick = (diagramId: string) => {
    // 导航到关系图编辑器
    navigate(`/app/diagram/edit/${diagramId}`);
  };
  
  // 处理右键菜单显示
  const handleContextMenu = (event: React.MouseEvent, diagramId?: string) => {
    event.preventDefault();
    
    // 如果点击了某个关系图，且该关系图未被选中，则选中它
    if (diagramId && !selectedDiagrams.includes(diagramId)) {
      setSelectedDiagrams([diagramId]);
    }
    
    // 显示上下文菜单
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY
    });
  };
  
  // 处理菜单操作
  const handleMenuAction = (action: string) => {
    switch (action) {
      case 'editDiagram':
        // 如果选中了一个关系图，导航到编辑页面
        if (selectedDiagrams.length === 1) {
          handleDiagramDoubleClick(selectedDiagrams[0]);
        }
        break;
        
      case 'renameDiagram':
        // 显示重命名对话框
        if (selectedDiagrams.length === 1) {
          const diagram = diagrams.find(d => d.id === selectedDiagrams[0]);
          if (diagram) {
            setPopConfirm({
              visible: true,
              title: `重命名关系图: ${diagram.defName}`,
              action: 'renameDiagram',
              position: { x: contextMenu.x, y: contextMenu.y },
              targetId: selectedDiagrams[0]
            });
          }
        }
        break;
        
      case 'copyDiagram':
        handleCopyDiagram();
        break;
        
      case 'deleteDiagram':
        // 显示确认对话框
        setPopConfirm({
          visible: true,
          title: `确定要删除${selectedDiagrams.length > 1 ? `选中的 ${selectedDiagrams.length} 个` : '这个'}关系图吗？此操作不可恢复。`,
          action: 'deleteDiagrams',
          position: { x: contextMenu.x, y: contextMenu.y },
          targetId: selectedDiagrams.join(',')
        });
        break;
        
      default:
        break;
    }
  };
  
  // 处理添加关系图
  const handleAddDiagram = () => {
    if (!currentProject || !domainId) return;
    
    try {
      // 创建新的关系图
      const newId = generateUUID();
      const now = Date.now();
      
      const newDiagram: Diagram = {
        id: newId,
        domainId,
        defKey: `diagram_${now}`,
        defName: `新建关系图`,
        comment: '',
        createTime: now,
        lastModified: now,
        canvasData: { cells: [] },
        entityIds: [],
        associations: []
      };
      
      // 更新项目数据
      const updatedDiagrams = [...(currentProject.diagrams || []), newDiagram];
      
      const updatedProject = {
        ...currentProject,
        diagrams: updatedDiagrams,
        lastModified: now
      };
      
      // 更新Redux状态
      dispatch(setCurrentProject(updatedProject));
      
      // 更新本地状态
      setDiagrams(prev => [...prev, newDiagram]);
      
      // 选中新创建的关系图
      setSelectedDiagrams([newId]);
      
      // 显示成功通知
      success('关系图创建成功');
      
      // 导航到关系图编辑器
      navigate(`/app/diagram/edit/${newId}`);
    } catch (err) {
      console.error('创建关系图失败:', err);
      error('创建关系图失败，请查看控制台错误信息');
    }
  };
  
  // 处理复制关系图
  const handleCopyDiagram = () => {
    if (!currentProject || selectedDiagrams.length === 0) return;
    
    // 查找选中的关系图
    const diagramsToCopy = diagrams.filter(d => selectedDiagrams.includes(d.id));
    
    // 保存到剪贴板
    setClipboardData({
      action: 'copy',
      diagrams: diagramsToCopy
    });
    
    // 显示成功通知
    success(`已复制 ${diagramsToCopy.length} 个关系图到剪贴板`);
  };
  
  // 处理剪切关系图
  const handleCutDiagram = () => {
    if (!currentProject || selectedDiagrams.length === 0) return;
    
    // 查找选中的关系图
    const diagramsToCut = diagrams.filter(d => selectedDiagrams.includes(d.id));
    
    // 保存到剪贴板
    setClipboardData({
      action: 'cut',
      diagrams: diagramsToCut
    });
    
    // 显示成功通知
    success(`已剪切 ${diagramsToCut.length} 个关系图到剪贴板`);
  };
  
  // 处理粘贴关系图
  const handlePasteDiagram = () => {
    if (!currentProject || !clipboardData || !domainId) return;
    
    try {
      // 从剪贴板获取关系图
      const { action, diagrams: clipboardDiagrams } = clipboardData;
      
      // 创建新的关系图（复制）
      const now = Date.now();
      const newDiagrams = clipboardDiagrams.map(diagram => ({
        ...diagram,
        id: generateUUID(),
        domainId, // 设置为当前主题域
        defKey: `${diagram.defKey}_copy`,
        defName: `${diagram.defName} (复制)`,
        createTime: now,
        lastModified: now
      }));
      
      // 更新项目数据
      let updatedProject;
      
      if (action === 'cut') {
        // 如果是剪切，则移除原来的关系图
        const remainingDiagrams = currentProject.diagrams?.filter(
          d => !selectedDiagrams.includes(d.id)
        ) || [];
        
        updatedProject = {
          ...currentProject,
          diagrams: [...remainingDiagrams, ...newDiagrams],
          lastModified: now
        };
        
        // 清空剪贴板
        setClipboardData(null);
      } else {
        // 如果是复制，则添加新的关系图
        updatedProject = {
          ...currentProject,
          diagrams: [...(currentProject.diagrams || []), ...newDiagrams],
          lastModified: now
        };
      }
      
      // 更新Redux状态
      dispatch(setCurrentProject(updatedProject));
      
      // 更新本地状态
      if (action === 'cut') {
        // 如果是剪切，则移除原来的关系图
        setDiagrams(prev => {
          const remaining = prev.filter(d => !selectedDiagrams.includes(d.id));
          return [...remaining, ...newDiagrams.filter(d => d.domainId === domainId)];
        });
      } else {
        // 如果是复制，则添加新的关系图
        setDiagrams(prev => [...prev, ...newDiagrams.filter(d => d.domainId === domainId)]);
      }
      
      // 选中新粘贴的关系图
      setSelectedDiagrams(newDiagrams.map(d => d.id));
      
      // 显示成功通知
      success(`已粘贴 ${newDiagrams.length} 个关系图`);
    } catch (err) {
      console.error('粘贴关系图失败:', err);
      error('粘贴关系图失败，请查看控制台错误信息');
    }
  };
  
  // 处理删除关系图
  const handleDeleteDiagram = (diagramIds: string[]) => {
    if (!currentProject) return;
    
    try {
      // 筛选出要保留的关系图
      const remainingDiagrams = currentProject.diagrams?.filter(
        d => !diagramIds.includes(d.id)
      ) || [];
      
      // 更新项目数据
      const updatedProject = {
        ...currentProject,
        diagrams: remainingDiagrams,
        lastModified: Date.now()
      };
      
      // 更新Redux状态
      dispatch(setCurrentProject(updatedProject));
      
      // 更新本地状态
      setDiagrams(prev => prev.filter(d => !diagramIds.includes(d.id)));
      
      // 清空选中
      setSelectedDiagrams([]);
      
      // 显示成功通知
      success(`已删除 ${diagramIds.length} 个关系图`);
    } catch (err) {
      console.error('删除关系图失败:', err);
      error('删除关系图失败，请查看控制台错误信息');
    }
  };
  
  // 处理导出为PNG
  const handleExportPNG = () => {
    // 这里要实现导出PNG的逻辑
    // 可能需要使用canvas或其他库来实现
    success('导出PNG功能尚未实现');
  };
  
  // 处理导出为SVG
  const handleExportSVG = () => {
    // 这里要实现导出SVG的逻辑
    // 可能需要使用SVG相关库来实现
    success('导出SVG功能尚未实现');
  };
  
  // 处理重命名关系图
  const handleRenameDiagram = (diagramId: string, newName: string) => {
    if (!currentProject) return;
    
    try {
      // 查找要重命名的关系图
      const diagramIndex = currentProject.diagrams?.findIndex(d => d.id === diagramId) ?? -1;
      
      if (diagramIndex === -1) return;
      
      // 更新关系图名称
      const updatedDiagrams = [...(currentProject.diagrams || [])];
      updatedDiagrams[diagramIndex] = {
        ...updatedDiagrams[diagramIndex],
        defName: newName,
        lastModified: Date.now()
      };
      
      // 更新项目数据
      const updatedProject = {
        ...currentProject,
        diagrams: updatedDiagrams,
        lastModified: Date.now()
      };
      
      // 更新Redux状态
      dispatch(setCurrentProject(updatedProject));
      
      // 更新本地状态
      setDiagrams(prev => prev.map(d => 
        d.id === diagramId ? { ...d, defName: newName } : d
      ));
      
      // 显示成功通知
      success('关系图重命名成功');
    } catch (err) {
      console.error('重命名关系图失败:', err);
      error('重命名关系图失败，请查看控制台错误信息');
    }
  };
  
  // 处理确认对话框动作
  const handlePopConfirmAction = () => {
    switch (popConfirm.action) {
      case 'deleteDiagrams':
        // 执行删除操作
        handleDeleteDiagram(popConfirm.targetId.split(','));
        break;
        
      case 'renameDiagram':
        // 执行重命名操作
        // 注意：这里只是一个简单实现，实际上应该弹出一个输入框让用户输入新名称
        const diagram = diagrams.find(d => d.id === popConfirm.targetId);
        if (diagram) {
          const newName = prompt('请输入新的关系图名称:', diagram.defName);
          if (newName && newName !== diagram.defName) {
            handleRenameDiagram(popConfirm.targetId, newName);
          }
        }
        break;
        
      default:
        break;
    }
    
    // 关闭确认对话框
    setPopConfirm(prev => ({ ...prev, visible: false }));
  };
  
  // 过滤关系图
  const filteredDiagrams = getFilteredDiagrams();
  
  return (
    <div className="diagram-list-page" onContextMenu={handleContextMenu}>
      <div className="diagram-list-header">
        <div className="domain-info">
          <h2><BranchesOutlined /> {getDomainName()} 关系图</h2>
          <p>当前共有 {diagrams.length} 个关系图</p>
        </div>
        
        <div className="diagram-search">
          <div className="search-input">
            <SearchOutlined />
            <input
              type="text"
              placeholder="搜索关系图..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button className="add-diagram-btn" onClick={handleAddDiagram}>
            <PlusOutlined /> 新建关系图
          </button>
        </div>
      </div>
      
      <div className="diagram-grid">
        {filteredDiagrams.length > 0 ? (
          filteredDiagrams.map(diagram => (
            <div
              key={diagram.id}
              className={`diagram-item ${selectedDiagrams.includes(diagram.id) ? 'selected' : ''}`}
              onClick={e => handleDiagramClick(diagram.id, e)}
              onDoubleClick={() => handleDiagramDoubleClick(diagram.id)}
              onContextMenu={e => handleContextMenu(e, diagram.id)}
            >
              <div className="diagram-thumbnail">
                <BranchesOutlined />
              </div>
              <div className="diagram-info">
                <h3>{diagram.defName}</h3>
                <div className="diagram-meta">
                  <span className="diagram-key">{diagram.defKey}</span>
                  <span className="diagram-stats">
                    {diagram.entityIds?.length || 0} 个实体
                  </span>
                </div>
                {diagram.comment && (
                  <div className="diagram-comment">
                    {diagram.comment}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-diagrams">
            <div className="empty-icon">
              <ProjectOutlined />
            </div>
            <h3>暂无关系图</h3>
            <p>点击"新建关系图"按钮创建您的第一个关系图</p>
            <button className="add-diagram-btn" onClick={handleAddDiagram}>
              <PlusOutlined /> 新建关系图
            </button>
          </div>
        )}
      </div>
      
      {/* 右键菜单 */}
      <DiagramContextMenu
        visible={contextMenu.visible}
        position={contextMenu}
        onAction={handleMenuAction}
        onClose={() => setContextMenu(prev => ({ ...prev, visible: false }))}
      />
      
      {/* 确认对话框 */}
      <PopConfirm
        visible={popConfirm.visible}
        title={popConfirm.title}
        position={popConfirm.position}
        onConfirm={handlePopConfirmAction}
        onCancel={() => setPopConfirm(prev => ({ ...prev, visible: false }))}
      />
    </div>
  );
};

export default DiagramList; 