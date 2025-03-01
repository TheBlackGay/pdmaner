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