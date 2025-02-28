# PDManer交互机制实现

## 1. 拖拽交互

PDManer实现了多种拖拽交互功能，用于提升用户体验：

### 1.1 实体图拖拽 (components/ercanvas/index.js)

ER画布中的实体表可以通过拖拽方式移动：

```javascript
// 初始化拖拽事件
_initDragEvents = () => {
  this.paper.on('cell:pointerdown', (cellView, evt, x, y) => {
    // 记录开始拖拽位置
    this.dragStartPosition = { x, y };
    
    // 设置拖拽状态
    this.isDragging = true;
    this.draggedView = cellView;
    
    // 高亮显示被拖拽的单元格
    cellView.model.attr({
      '.table-name-rect': { 
        'fill-opacity': 0.8,
      }
    });
  });
  
  // 处理鼠标移动
  this.paper.on('cell:pointermove', (cellView, evt, x, y) => {
    if (this.isDragging && this.draggedView === cellView) {
      // 计算移动距离
      const dx = x - this.dragStartPosition.x;
      const dy = y - this.dragStartPosition.y;
      
      // 移动单元格
      cellView.model.translate(dx, dy);
      
      // 更新开始位置
      this.dragStartPosition = { x, y };
    }
  });
  
  // 处理拖拽结束
  this.paper.on('cell:pointerup', (cellView) => {
    if (this.isDragging && this.draggedView === cellView) {
      // 恢复单元格样式
      cellView.model.attr({
        '.table-name-rect': { 
          'fill-opacity': 1,
        }
      });
      
      // 清除拖拽状态
      this.isDragging = false;
      this.draggedView = null;
      
      // 保存画布状态
      this._saveCanvas();
    }
  });
};
```

### 1.2 列表项拖动排序 (components/sortable/index.js)

项目实现了自定义拖动排序组件，用于各种列表的排序功能：

```javascript
export default class Sortable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dragging: false,
      draggingIndex: -1,
      startPageY: 0,
      offsetPageY: 0,
    };
    this.containerRef = React.createRef();
    this.itemRefs = [];
  }
  
  // 开始拖动
  _onMouseDown = (evt, index) => {
    const { clientY } = evt;
    this.itemRefs = Array.from(this.containerRef.current.childNodes);
    
    this.setState({
      dragging: true,
      draggingIndex: index,
      startPageY: clientY,
      offsetPageY: 0,
    });
    
    // 添加移动和释放事件监听
    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('mouseup', this._onMouseUp);
    
    evt.preventDefault();
  };
  
  // 拖动中
  _onMouseMove = (evt) => {
    const { clientY } = evt;
    const { startPageY } = this.state;
    
    this.setState({
      offsetPageY: clientY - startPageY,
    });
    
    // 计算是否需要交换位置
    this._checkItemPosition(clientY);
  };
  
  // 计算项位置
  _checkItemPosition = (pageY) => {
    const { draggingIndex } = this.state;
    const { dataSource, onChange } = this.props;
    
    const draggingRect = this.itemRefs[draggingIndex].getBoundingClientRect();
    const middleDraggingY = draggingRect.top + draggingRect.height / 2;
    
    // 检查是否需要上移或下移
    if (pageY < middleDraggingY && draggingIndex > 0) {
      // 上移
      const newDataSource = [...dataSource];
      const temp = newDataSource[draggingIndex];
      newDataSource[draggingIndex] = newDataSource[draggingIndex - 1];
      newDataSource[draggingIndex - 1] = temp;
      
      this.setState({
        draggingIndex: draggingIndex - 1,
        startPageY: pageY,
      });
      
      onChange && onChange(newDataSource);
    } else if (pageY > middleDraggingY && draggingIndex < dataSource.length - 1) {
      // 下移
      const newDataSource = [...dataSource];
      const temp = newDataSource[draggingIndex];
      newDataSource[draggingIndex] = newDataSource[draggingIndex + 1];
      newDataSource[draggingIndex + 1] = temp;
      
      this.setState({
        draggingIndex: draggingIndex + 1,
        startPageY: pageY,
      });
      
      onChange && onChange(newDataSource);
    }
  };
  
  // 结束拖动
  _onMouseUp = () => {
    this.setState({
      dragging: false,
      draggingIndex: -1,
      startPageY: 0,
      offsetPageY: 0,
    });
    
    // 移除事件监听
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mouseup', this._onMouseUp);
  };
  
  render() {
    const { prefix = 'pdman', dataSource, renderItem } = this.props;
    const { dragging, draggingIndex, offsetPageY } = this.state;
    
    return (
      <div ref={this.containerRef} className={`${prefix}-sortable`}>
        {dataSource.map((item, index) => {
          const isDragging = dragging && index === draggingIndex;
          const style = isDragging
            ? { transform: `translateY(${offsetPageY}px)`, zIndex: 1 }
            : {};
            
          return (
            <div
              key={item.id || index}
              className={`${prefix}-sortable-item ${isDragging ? 'dragging' : ''}`}
              style={style}
              onMouseDown={(e) => this._onMouseDown(e, index)}
            >
              {renderItem(item, index)}
            </div>
          );
        })}
      </div>
    );
  }
}
```

## 2. 上下文菜单

PDManer实现了自定义上下文菜单，用于提供快捷操作：

### 2.1 上下文菜单组件 (components/contextmenu/index.js)

```javascript
export default class ContextMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      submenuVisible: {},
    };
    this.menuRef = React.createRef();
  }
  
  componentDidMount() {
    // 监听全局点击，用于关闭菜单
    document.addEventListener('click', this._handleOutsideClick);
  }
  
  componentWillUnmount() {
    document.removeEventListener('click', this._handleOutsideClick);
  }
  
  // 处理外部点击关闭菜单
  _handleOutsideClick = (e) => {
    if (this.menuRef.current && !this.menuRef.current.contains(e.target)) {
      this.props.onClose && this.props.onClose();
    }
  };
  
  // 显示/隐藏子菜单
  _toggleSubmenu = (key) => {
    this.setState(state => ({
      submenuVisible: {
        ...state.submenuVisible,
        [key]: !state.submenuVisible[key],
      },
    }));
  };
  
  // 菜单项点击处理
  _handleClick = (e, item) => {
    e.stopPropagation();
    
    if (item.children) {
      this._toggleSubmenu(item.key);
    } else if (item.onClick) {
      item.onClick();
      this.props.onClose && this.props.onClose();
    }
  };
  
  // 渲染菜单项
  _renderMenuItem = (item, index) => {
    const { prefix = 'pdman' } = this.props;
    const { submenuVisible } = this.state;
    const hasChildren = item.children && item.children.length > 0;
    
    return (
      <div
        key={item.key || index}
        className={`${prefix}-contextmenu-item ${item.disabled ? 'disabled' : ''}`}
        onClick={(e) => !item.disabled && this._handleClick(e, item)}
      >
        {item.icon && <span className={`${prefix}-contextmenu-item-icon ${item.icon}`}/>}
        <span className={`${prefix}-contextmenu-item-text`}>{item.text}</span>
        {hasChildren && <span className={`${prefix}-contextmenu-item-arrow fa fa-angle-right`}/>}
        
        {hasChildren && submenuVisible[item.key] && (
          <div className={`${prefix}-contextmenu-submenu`}>
            {item.children.map(this._renderMenuItem)}
          </div>
        )}
      </div>
    );
  };
  
  render() {
    const { prefix = 'pdman', visible, menus, x, y } = this.props;
    
    if (!visible) {
      return null;
    }
    
    return (
      <div
        ref={this.menuRef}
        className={`${prefix}-contextmenu`}
        style={{ left: x, top: y }}
      >
        {menus.map(this._renderMenuItem)}
      </div>
    );
  }
}
```

### 2.2 ER画布上下文菜单 (app/container/relation/RelationContext.js)

```javascript
export default React.memo(({prefix, contextMenu, contextDisplay, contextMenuType, close, onMenuClick, ...restProps}) => {
  // 根据上下文类型生成菜单项
  const getMenus = () => {
    if (contextMenuType === 'canvas') {
      // 画布右键菜单
      return [
        {
          key: 'addTable',
          text: FormatMessage.string({id: 'relation.addTable'}),
          icon: 'fa fa-plus',
          onClick: () => onMenuClick('addTable'),
        },
        {
          key: 'paste',
          text: FormatMessage.string({id: 'relation.paste'}),
          icon: 'fa fa-paste',
          onClick: () => onMenuClick('paste'),
        },
        {
          key: 'selectAll',
          text: FormatMessage.string({id: 'relation.selectAll'}),
          icon: 'fa fa-check-square-o',
          onClick: () => onMenuClick('selectAll'),
        },
        {
          key: 'export',
          text: FormatMessage.string({id: 'relation.export'}),
          icon: 'fa fa-download',
          children: [
            {
              key: 'exportImage',
              text: FormatMessage.string({id: 'relation.exportImage'}),
              onClick: () => onMenuClick('exportImage'),
            },
            {
              key: 'exportPdf',
              text: FormatMessage.string({id: 'relation.exportPdf'}),
              onClick: () => onMenuClick('exportPdf'),
            },
          ],
        },
      ];
    } else if (contextMenuType === 'table') {
      // 表格右键菜单
      return [
        {
          key: 'edit',
          text: FormatMessage.string({id: 'relation.editTable'}),
          icon: 'fa fa-edit',
          onClick: () => onMenuClick('editTable'),
        },
        {
          key: 'copy',
          text: FormatMessage.string({id: 'relation.copy'}),
          icon: 'fa fa-copy',
          onClick: () => onMenuClick('copy'),
        },
        {
          key: 'delete',
          text: FormatMessage.string({id: 'relation.delete'}),
          icon: 'fa fa-trash',
          onClick: () => onMenuClick('delete'),
        },
        {
          key: 'addRelation',
          text: FormatMessage.string({id: 'relation.addRelation'}),
          icon: 'fa fa-link',
          onClick: () => onMenuClick('addRelation'),
        },
      ];
    }
    
    return [];
  };
  
  return (
    <ContextMenu
      prefix={prefix}
      visible={contextDisplay}
      menus={getMenus()}
      x={contextMenu.left}
      y={contextMenu.top}
      onClose={close}
    />
  );
});
```

## 3. 快捷键处理

PDManer实现了全局快捷键处理，用于提供常用操作的快捷方式：

### 3.1 快捷键管理器 (app/main/ShortcutManager.js)

```javascript
export default class ShortcutManager {
  constructor(callbacks) {
    this.callbacks = callbacks || {};
    this.keyMap = {
      save: ['ctrl+s', 'command+s'],
      undo: ['ctrl+z', 'command+z'],
      redo: ['ctrl+y', 'command+shift+z'],
      copy: ['ctrl+c', 'command+c'],
      paste: ['ctrl+v', 'command+v'],
      cut: ['ctrl+x', 'command+x'],
      delete: ['delete'],
      selectAll: ['ctrl+a', 'command+a'],
    };
  }
  
  // 注册事件处理器
  register() {
    document.addEventListener('keydown', this._handleKeyDown);
  }
  
  // 移除事件处理器
  unregister() {
    document.removeEventListener('keydown', this._handleKeyDown);
  }
  
  // 键盘事件处理
  _handleKeyDown = (e) => {
    // 获取按键组合
    const key = this._getKeyCombo(e);
    
    // 查找匹配的命令
    const command = this._findCommand(key);
    
    if (command && this.callbacks[command]) {
      // 阻止浏览器默认行为
      e.preventDefault();
      
      // 执行回调
      this.callbacks[command](e);
    }
  };
  
  // 获取按键组合
  _getKeyCombo = (e) => {
    const { ctrlKey, metaKey, altKey, shiftKey, key } = e;
    
    let combo = [];
    
    if (ctrlKey) combo.push('ctrl');
    if (metaKey) combo.push('command');
    if (altKey) combo.push('alt');
    if (shiftKey) combo.push('shift');
    
    combo.push(key.toLowerCase());
    
    return combo.join('+');
  };
  
  // 查找匹配的命令
  _findCommand = (keyCombo) => {
    for (const command in this.keyMap) {
      const shortcuts = this.keyMap[command];
      if (shortcuts.includes(keyCombo)) {
        return command;
      }
    }
    
    return null;
  };
  
  // 更新回调
  updateCallbacks(callbacks) {
    this.callbacks = {
      ...this.callbacks,
      ...callbacks,
    };
  }
}
```

### 3.2 应用程序中的快捷键实现 (app/main/index.js)

```javascript
export default React.memo((props) => {
  const { dataSource, updateDataSource } = props;
  const shortcutManagerRef = useRef(null);
  
  // 初始化快捷键管理器
  useEffect(() => {
    const callbacks = {
      save: handleSave,
      undo: handleUndo,
      redo: handleRedo,
      // 其他回调
    };
    
    shortcutManagerRef.current = new ShortcutManager(callbacks);
    shortcutManagerRef.current.register();
    
    // 组件卸载时清理
    return () => {
      shortcutManagerRef.current.unregister();
    };
  }, []);
  
  // 快捷键回调更新
  useEffect(() => {
    if (shortcutManagerRef.current) {
      shortcutManagerRef.current.updateCallbacks({
        save: handleSave,
        undo: handleUndo,
        redo: handleRedo,
        // 其他回调更新
      });
    }
  }, [dataSource]);
  
  // 保存操作
  const handleSave = useCallback(() => {
    if (dataSource.info) {
      // 保存项目
      props.save(() => {
        Message.success({title: FormatMessage.string({id: 'saveSuccess'})});
      });
    } else {
      // 新项目，弹出保存对话框
      props.saveAs();
    }
  }, [dataSource, props.save, props.saveAs]);
  
  // 撤销操作
  const handleUndo = useCallback(() => {
    props.undo();
  }, [props.undo]);
  
  // 重做操作
  const handleRedo = useCallback(() => {
    props.redo();
  }, [props.redo]);
  
  // 渲染主界面
  return (
    <div className={`${props.prefix}-main`}>
      <HeaderTool
        prefix={props.prefix}
        dataSource={dataSource}
        save={handleSave}
        undo={handleUndo}
        redo={handleRedo}
        // 其他属性
      />
      <MainContent
        prefix={props.prefix}
        dataSource={dataSource}
        updateDataSource={updateDataSource}
        // 其他属性
      />
    </div>
  );
});
```

## 4. 自定义表单交互

PDManer实现了多种自定义表单组件和交互方式，用于提升用户体验：

### 4.1 可编辑表格实现 (components/table/index.js)

```javascript
export default class EditableTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editingCell: null,
      selectedRows: [],
    };
  }
  
  // 开始编辑单元格
  _startEdit = (rowIndex, columnIndex) => {
    this.setState({
      editingCell: { rowIndex, columnIndex },
    });
  };
  
  // 结束编辑单元格
  _finishEdit = (value) => {
    const { editingCell } = this.state;
    const { dataSource, onChange } = this.props;
    
    if (editingCell) {
      const { rowIndex, columnIndex } = editingCell;
      const row = dataSource[rowIndex];
      const column = this.props.columns[columnIndex];
      
      // 更新数据
      const newData = [...dataSource];
      newData[rowIndex] = {
        ...row,
        [column.dataIndex]: value,
      };
      
      // 调用回调
      onChange && onChange(newData);
      
      // 清除编辑状态
      this.setState({
        editingCell: null,
      });
    }
  };
  
  // 取消编辑
  _cancelEdit = () => {
    this.setState({
      editingCell: null,
    });
  };
  
  // 选择行
  _selectRow = (rowIndex, isSelected) => {
    this.setState(state => {
      let selectedRows = [...state.selectedRows];
      
      if (isSelected) {
        if (!selectedRows.includes(rowIndex)) {
          selectedRows.push(rowIndex);
        }
      } else {
        selectedRows = selectedRows.filter(index => index !== rowIndex);
      }
      
      // 调用选择回调
      this.props.onSelect && this.props.onSelect(selectedRows.map(index => this.props.dataSource[index]));
      
      return { selectedRows };
    });
  };
  
  // 全选/取消全选
  _selectAll = (isSelected) => {
    const { dataSource } = this.props;
    
    this.setState({
      selectedRows: isSelected ? dataSource.map((_, index) => index) : [],
    }, () => {
      // 调用选择回调
      this.props.onSelect && this.props.onSelect(
        isSelected ? [...dataSource] : []
      );
    });
  };
  
  // 渲染单元格
  _renderCell = (row, column, rowIndex, columnIndex) => {
    const { editingCell } = this.state;
    const isEditing = editingCell && 
                      editingCell.rowIndex === rowIndex && 
                      editingCell.columnIndex === columnIndex;
    
    // 获取单元格值
    const value = row[column.dataIndex];
    
    if (isEditing) {
      // 编辑模式
      let Editor;
      
      if (column.editor) {
        // 自定义编辑器
        Editor = column.editor;
      } else if (column.type === 'select') {
        // 下拉选择框
        Editor = (
          <Select
            autoFocus
            options={column.options || []}
            value={value}
            onChange={this._finishEdit}
            onBlur={this._cancelEdit}
          />
        );
      } else {
        // 默认文本输入框
        Editor = (
          <Input
            autoFocus
            defaultValue={value}
            onPressEnter={e => this._finishEdit(e.target.value)}
            onBlur={e => this._finishEdit(e.target.value)}
          />
        );
      }
      
      return Editor;
    } else {
      // 渲染模式
      let content;
      
      if (column.render) {
        // 自定义渲染
        content = column.render(value, row, rowIndex);
      } else if (column.type === 'select' && column.options) {
        // 显示选择项的标签
        const option = column.options.find(opt => opt.value === value);
        content = option ? option.label : value;
      } else {
        // 默认文本显示
        content = value;
      }
      
      return (
        <div
          className={`${this.props.prefix}-table-cell-content`}
          onDoubleClick={() => column.editable !== false && this._startEdit(rowIndex, columnIndex)}
        >
          {content}
        </div>
      );
    }
  };
  
  render() {
    const { prefix = 'pdman', dataSource, columns } = this.props;
    const { selectedRows } = this.state;
    
    return (
      <div className={`${prefix}-table`}>
        <div className={`${prefix}-table-header`}>
          <div className={`${prefix}-table-row`}>
            <div className={`${prefix}-table-cell ${prefix}-table-checkbox`}>
              <Checkbox
                checked={selectedRows.length === dataSource.length && dataSource.length > 0}
                indeterminate={selectedRows.length > 0 && selectedRows.length < dataSource.length}
                onChange={e => this._selectAll(e.target.checked)}
              />
            </div>
            {columns.map((column, index) => (
              <div
                key={column.dataIndex || index}
                className={`${prefix}-table-cell`}
                style={{ width: column.width || 'auto' }}
              >
                {column.title}
              </div>
            ))}
          </div>
        </div>
        <div className={`${prefix}-table-body`}>
          {dataSource.map((row, rowIndex) => (
            <div
              key={row.id || rowIndex}
              className={`${prefix}-table-row ${selectedRows.includes(rowIndex) ? 'selected' : ''}`}
            >
              <div className={`${prefix}-table-cell ${prefix}-table-checkbox`}>
                <Checkbox
                  checked={selectedRows.includes(rowIndex)}
                  onChange={e => this._selectRow(rowIndex, e.target.checked)}
                />
              </div>
              {columns.map((column, columnIndex) => (
                <div
                  key={column.dataIndex || columnIndex}
                  className={`${prefix}-table-cell`}
                  style={{ width: column.width || 'auto' }}
                >
                  {this._renderCell(row, column, rowIndex, columnIndex)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }
}
```

### 4.2 模态对话框实现 (components/modal/index.js)

```javascript
export default class Modal extends React.Component {
  static info = (config) => {
    // 显示信息对话框
    return Modal._showModal({
      type: 'info',
      ...config,
    });
  };
  
  static success = (config) => {
    // 显示成功对话框
    return Modal._showModal({
      type: 'success',
      ...config,
    });
  };
  
  static error = (config) => {
    // 显示错误对话框
    return Modal._showModal({
      type: 'error',
      ...config,
    });
  };
  
  static confirm = (config) => {
    // 显示确认对话框
    return Modal._showModal({
      type: 'confirm',
      ...config,
    });
  };
  
  // 内部方法：显示模态框
  static _showModal = (config) => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    
    function destroy() {
      // 移除DOM节点
      ReactDOM.unmountComponentAtNode(div);
      document.body.removeChild(div);
    }
    
    // 包装回调
    const onOk = () => {
      if (config.onOk) {
        const result = config.onOk();
        if (result && result.then) {
          // 处理Promise
          result.then(destroy).catch(() => {});
        } else {
          destroy();
        }
      } else {
        destroy();
      }
    };
    
    const onCancel = () => {
      if (config.onCancel) {
        const result = config.onCancel();
        if (result && result.then) {
          // 处理Promise
          result.then(destroy).catch(() => {});
        } else {
          destroy();
        }
      } else {
        destroy();
      }
    };
    
    // 渲染模态框
    ReactDOM.render(
      <Modal
        visible
        title={config.title}
        message={config.message}
        type={config.type}
        onOk={onOk}
        onCancel={onCancel}
        okText={config.okText}
        cancelText={config.cancelText}
        closable={config.closable !== false}
      />,
      div
    );
    
    return {
      destroy,
    };
  };
  
  constructor(props) {
    super(props);
    this.state = {
      visible: props.visible,
    };
    this.modalRef = React.createRef();
  }
  
  componentDidMount() {
    if (this.state.visible) {
      document.addEventListener('keydown', this._handleEsc);
    }
  }
  
  componentDidUpdate(prevProps) {
    if (prevProps.visible !== this.props.visible) {
      this.setState({ visible: this.props.visible });
      
      if (this.props.visible) {
        document.addEventListener('keydown', this._handleEsc);
      } else {
        document.removeEventListener('keydown', this._handleEsc);
      }
    }
  }
  
  componentWillUnmount() {
    document.removeEventListener('keydown', this._handleEsc);
  }
  
  // 处理ESC键关闭
  _handleEsc = (e) => {
    if (e.key === 'Escape' && this.props.closable !== false) {
      this._handleCancel();
    }
  };
  
  // 处理取消按钮点击
  _handleCancel = () => {
    if (this.props.onCancel) {
      this.props.onCancel();
    } else {
      this.setState({ visible: false });
    }
  };
  
  // 处理确认按钮点击
  _handleOk = () => {
    if (this.props.onOk) {
      this.props.onOk();
    } else {
      this.setState({ visible: false });
    }
  };
  
  // 获取图标
  _getIconByType = () => {
    const { type } = this.props;
    
    switch (type) {
      case 'info':
        return 'fa fa-info-circle';
      case 'success':
        return 'fa fa-check-circle';
      case 'error':
        return 'fa fa-times-circle';
      case 'confirm':
        return 'fa fa-question-circle';
      default:
        return null;
    }
  };
  
  render() {
    const { prefix = 'pdman', title, message, children, type, okText, cancelText, closable = true } = this.props;
    const { visible } = this.state;
    
    if (!visible) {
      return null;
    }
    
    const icon = this._getIconByType();
    
    return (
      <div className={`${prefix}-modal-overlay`}>
        <div className={`${prefix}-modal`} ref={this.modalRef}>
          <div className={`${prefix}-modal-header`}>
            {title && <div className={`${prefix}-modal-title`}>{title}</div>}
            {closable && (
              <div
                className={`${prefix}-modal-close fa fa-times`}
                onClick={this._handleCancel}
              />
            )}
          </div>
          <div className={`${prefix}-modal-body`}>
            {type && (
              <div className={`${prefix}-modal-icon ${icon}`} />
            )}
            {message && <div className={`${prefix}-modal-message`}>{message}</div>}
            {children}
          </div>
          <div className={`${prefix}-modal-footer`}>
            {(type === 'confirm' || type === undefined) && (
              <Button onClick={this._handleCancel}>
                {cancelText || <FormatMessage id="cancel" />}
              </Button>
            )}
            <Button type="primary" onClick={this._handleOk}>
              {okText || <FormatMessage id="ok" />}
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
```

## 5. 动态交互流程

PDManer的交互流程基于状态管理和事件处理，主要包括以下几个方面：

### 5.1 ER图交互流程

ER图交互是整个应用的核心，其交互流程如下：

1. **初始化图形库**：
   - 创建JointJS图形库实例
   - 注册事件处理器
   - 绘制初始图形

2. **表拖动交互**：
   - 捕获鼠标按下事件(cell:pointerdown)
   - 记录初始位置和拖动状态
   - 在鼠标移动时更新位置(cell:pointermove)
   - 在鼠标释放时保存状态(cell:pointerup)

3. **表关系创建**：
   - 用户选择源表
   - 添加临时连接线
   - 用户选择目标表
   - 弹出关系编辑对话框
   - 保存关系数据并绘制最终连接线

4. **右键菜单交互**：
   - 捕获右键点击事件(contextmenu)
   - 判断点击位置(空白画布/表)
   - 显示对应的上下文菜单
   - 处理菜单项点击事件

### 5.2 表单交互流程

表单交互处理用户对数据的输入和编辑：

1. **字段编辑交互**：
   - 用户选择实体
   - 加载实体字段数据
   - 用户点击添加/编辑按钮
   - 弹出字段编辑对话框
   - 保存编辑结果
   - 更新Redux状态
   - 界面自动重新渲染

2. **索引编辑交互**：
   - 用户选择实体
   - 加载实体索引数据
   - 用户操作索引(添加/编辑/删除)
   - 进行CRUD操作
   - 更新Redux状态
   - 界面自动重新渲染

3. **数据校验**：
   - 实时验证用户输入
   - 显示错误信息
   - 禁用保存按钮直到数据有效

### 5.3 项目操作交互流程

项目操作涉及文件和数据管理：

1. **项目保存流程**：
   - 用户点击保存按钮或使用快捷键(Ctrl+S)
   - 触发saveProject操作
   - 检查是否有文件路径
   - 如果没有路径，弹出保存对话框
   - 如果有路径，直接保存
   - 文件写入成功后显示成功消息

2. **项目打开流程**：
   - 用户点击打开按钮或使用快捷键
   - 检查当前项目是否已保存
   - 如果未保存，弹出确认对话框
   - 打开文件选择对话框
   - 读取文件内容
   - 解析JSON数据
   - 更新Redux状态
   - 界面自动重新渲染

3. **SQL导出流程**：
   - 用户点击导出SQL按钮
   - 弹出导出选项对话框
   - 用户选择数据库类型和选项
   - 生成SQL脚本
   - 保存到文件
