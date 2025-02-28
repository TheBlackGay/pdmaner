# PDManer技术实现详解

## 1. 核心架构实现

### 1.1 Electron主进程与渲染进程

PDManer基于Electron 13.1.7构建，采用主进程/渲染进程架构：

#### 1.1.1 主进程 (src/main.js)

主进程负责应用程序的生命周期管理、窗口创建和系统API调用，主要实现包括：

- **窗口创建与配置**：
  ```javascript
  function createWindow() {
    win = new BrowserWindow({
      width: 1220,
      height: 600,
      minWidth: 300,
      minHeight: 100,
      frame: false,
      resizable: false,
      show: false,
      backgroundColor: 'transparent',
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
      }
    });
    //...
  }
  ```

- **自动更新机制**：
  ```javascript
  autoUpdater.setFeedURL('http://chiner-release.httpchk.com');
  autoUpdater.on('download-progress', function (progressObj) {
    win.webContents.send('updateProgress', progressObj);
    win.setProgressBar(progressObj.percent / 100);
  });
  ```

- **异常处理与自动备份**：
  ```javascript
  win.webContents.on('render-process-gone', (event, details) => {
    sendMessage(details.reason);
  });
  win.webContents.on('unresponsive', () => {
    sendMessage('unresponsive');
  });
  ```

- **IPC通信实现**：为渲染进程提供文件操作API
  ```javascript
  ipcMain.on("jarPath", (event) => {
    let jarPath = '';
    if (process.env.CHINER_NODE_ENV === 'development') {
      jarPath = path.join(__dirname, '../public/jar/pdmaner-java.jar');
    } else {
      jarPath = path.join(__dirname, '../../app.asar.unpacked/build/jar/pdmaner-java.jar')
    }
    event.returnValue = jarPath;
  });
  ```

#### 1.1.2 渲染进程 (src/index.js)

渲染进程负责UI渲染和用户交互，主要实现包括：

- **React应用初始化**：
  ```javascript
  function initComponent() {
    ReactDOM.render(<Provider store={store}>
      <Container/>
    </Provider>, document.getElementById('app'));
  }
  ```

- **Redux Store配置**：
  ```javascript
  const store = createStore(reducers,
    {},
    applyMiddleware(
      thunkMiddleware,
      logger,
      //...其他中间件
    ));
  ```

- **全局错误处理**：
  ```javascript
  class Container extends React.Component{
    componentDidCatch(error) {
      writeLog(error).then((file) => {
        Modal.error({
          title: '出错了',
          message: <span>
            程序出现异常，请前往日志文件查看出错日志：<a onClick={() => showErrorLogFolder(file)}>{file}</a>
          </span>,
        });
      });
    }
    //...
  }
  ```

#### 1.1.3 进程通信

Electron的IPC机制用于主进程和渲染进程之间的通信：

- **渲染进程到主进程**：
  ```javascript
  // 渲染进程发送消息
  ipcRenderer.send('update');
  
  // 主进程接收消息
  ipcMain.on('update', () => {
    autoUpdater.checkForUpdates()
  });
  ```

- **主进程到渲染进程**：
  ```javascript
  // 主进程发送消息
  win.webContents.send('updateProgress', progressObj);
  
  // 渲染进程接收消息
  ipcRenderer.on('updateProgress', (event, progressObj) => {
    // 处理更新进度
  });
  ```

### 1.2 React应用结构

PDManer使用React 16.8.6构建前端界面，采用函数式组件和Hooks API：

#### 1.2.1 组件层次结构

应用采用树形组件结构，主要层次如下：

```
App (index.js)
├── Welcome (app/welcome/index.js)
│   └── Home (app/home/index.js)
└── Main (app/main/index.js)
    ├── HeaderTool (app/main/HeaderTool.js)
    ├── Entity (app/container/entity/index.js)
    │   ├── EntityBase (app/container/entity/EntityBase.js)
    │   ├── EntityFields (app/container/entity/EntityFields.js)
    │   └── EntityIndexes (app/container/entity/EntityIndexes.js)
    ├── Relation (app/container/relation/index.js)
    │   └── ErCanvas (components/ercanvas/index.js)
    ├── Dict (app/container/dict/index.js)
    └── View (app/container/view/index.js)
```

#### 1.2.2 组件实现模式

项目大量使用React Hooks实现状态管理和副作用处理：

- **useState**：管理组件局部状态
  ```javascript
  const [percent, updatePercent] = useState(50);
  const [title, updateTitle] = useState('获取配置数据...');
  ```

- **useEffect**：处理副作用和生命周期
  ```javascript
  useEffect(() => {
    // 第一个页面打开 读取各个配置文件
    getUserData();
  }, []);
  ```

- **useRef**：引用DOM元素和保存可变值
  ```javascript
  const relationRef = useRef(null);
  const isInit = useRef(false);
  ```

- **useMemo**：缓存计算结果
  ```javascript
  const data = useMemo(() => {
    if (diagramKey === 'home-cover') {
      return dataSource.homeCoverDiagram || getHomeCover();
    }
    return (dataSource?.diagrams || []).filter(d => d.id === diagramKey)[0];
  }, []);
  ```

#### 1.2.3 性能优化实践

项目采用多种React性能优化技术：

- **React.memo**：减少不必要的重渲染
  ```javascript
  export default React.memo(({currentPrefix, close, iconClick, /*...*/}) => {
    // 组件实现
  });
  ```

- **useCallback**：缓存回调函数
  ```javascript
  const handleSave = useCallback(() => {
    // 保存逻辑
  }, [dataSource, currentPath]);
  ```

- **合理的依赖数组**：避免不必要的副作用执行
  ```javascript
  useEffect(() => {
    // 只在组件挂载时执行一次
  }, []);
  ```

### 1.3 Redux状态管理

PDManer使用Redux 4.0.4进行全局状态管理，结合redux-thunk处理异步操作：

#### 1.3.1 Store结构

Redux store具有以下主要部分：

```javascript
{
  config: {             // 用户配置
    language: String,   // 当前语言
    history: Array,     // 项目历史记录
    autoSave: Boolean,  // 是否自动保存
    style: Object,      // 界面样式设置
    ...
  },
  core: {               // 核心项目数据
    data: {             // 当前项目数据
      entities: Array,  // 实体列表
      views: Array,     // 视图列表
      diagrams: Array,  // 图表列表
      dicts: Array,     // 字典列表
      domains: Array,   // 域列表
      ...
    },
    info: String,       // 项目路径
    isDemoProject: Boolean, // 是否为演示项目
    ...
  },
  common: {             // 通用状态
    loading: Boolean,   // 加载状态
    status: String,     // 应用状态
    error: Object,      // 错误信息
    ...
  }
}
```

#### 1.3.2 Actions分类

项目将Actions按功能划分为不同类别：

- **核心Actions (core)**：处理项目数据的核心操作
  ```javascript
  // src/actions/core/index.js
  export const saveProject = (saveAs) => {
    return (dispatch, getState) => {
      // 保存项目逻辑
    };
  };
  ```

- **配置Actions (config)**：处理用户配置
  ```javascript
  // src/actions/config/index.js
  export const getUserConfigData = () => {
    return (dispatch) => {
      // 获取用户配置逻辑
    };
  };
  ```

- **通用Actions (common)**：处理UI状态等通用功能
  ```javascript
  // src/actions/common/index.js
  export const openLoading = (title) => {
    return {
      type: OPEN_LOADING,
      data: title,
    };
  };
  ```

#### 1.3.3 异步处理

项目使用redux-thunk处理异步操作：

```javascript
export const openProject = (path) => {
  return (dispatch) => {
    dispatch(openLoading(FormatMessage.string({id: 'readingProject'})));
    return readJsonPromise(path).then((data) => {
      // 处理成功
      dispatch(closeLoading());
      dispatch(readProjectSuccess(data, path, false));
      dispatch(addHistory({
        type: 'project',
        name: data.name,
        path,
      }));
      return data;
    }).catch((err) => {
      // 处理错误
      dispatch(closeLoading());
      dispatch(readProjectFail(err));
      Modal.error({title: FormatMessage.string({id: 'readFail'}), message: err.message});
    });
  };
};
```

#### 1.3.4 中间件配置

项目配置了多个Redux中间件：

```javascript
const store = createStore(reducers,
  {},
  applyMiddleware(
    thunkMiddleware,
    logger,
    () => {
      return next => (action) => {
        // 自定义中间件逻辑
        next(action);
      };
    },
  ));
```

### 1.4 文件系统交互

PDManer作为桌面应用，需要与文件系统进行频繁交互。项目通过中间层API实现文件操作：

#### 1.4.1 中间层API

核心API定义在src/lib/middle.js中：

- **保存文件**：
  ```javascript
  export const saveJsonPromise = (data, path) => {
    return new Promise((resolve, reject) => {
      try {
        if (platform === 'json') {
          // Electron环境
          fs.writeFile(path, JSON.stringify(data, null, 2), (err) => {
            if (err) {
              reject(err);
            } else {
              resolve(path);
            }
          });
        } else {
          // Web环境
          // Web环境下的保存逻辑
        }
      } catch (err) {
        reject(err);
      }
    });
  };
  ```

- **读取文件**：
  ```javascript
  export const readJsonPromise = (path) => {
    return new Promise((resolve, reject) => {
      try {
        if (platform === 'json') {
          // Electron环境
          fs.readFile(path, (err, data) => {
            if (err) {
              reject(err);
            } else {
              try {
                resolve(JSON.parse(data.toString()));
              } catch (e) {
                reject(e);
              }
            }
          });
        } else {
          // Web环境
          // Web环境下的读取逻辑
        }
      } catch (err) {
        reject(err);
      }
    });
  };
  ```

- **选择文件**：
  ```javascript
  export const openProjectFilePath = () => {
    return new Promise((resolve, reject) => {
      try {
        if (platform === 'json') {
          // Electron环境
          dialog.showOpenDialog({
            title: '打开项目',
            properties: ['openFile'],
            filters: [
              {name: '项目文件', extensions: ['pdman.json', 'json', `${projectSuffix}`]},
            ],
          }).then(result => {
            if (!result.canceled) {
              resolve(result.filePaths[0]);
            } else {
              reject(new Error('用户取消选择'));
            }
          }).catch(err => {
            reject(err);
          });
        } else {
          // Web环境
          // Web环境下的文件选择逻辑
        }
      } catch (err) {
        reject(err);
      }
    });
  };
  ```

#### 1.4.2 错误处理

文件操作包含完善的错误处理机制：

```javascript
try {
  // 文件操作
} catch (err) {
  // 记录错误
  writeLog(err).then((file) => {
    // 显示错误消息
    Modal.error({
      title: '出错了',
      message: <span>
        程序出现异常，请前往日志文件查看出错日志：<a onClick={() => showErrorLogFolder(file)}>{file}</a>
      </span>,
    });
  });
}
```

#### 1.4.3 自动备份

为防止数据丢失，实现了自动备份机制：

```javascript
// src/main.js
const sendMessage = (reason) => {
  if (dataCache.data && dataCache.info) {
    const dir = path.dirname(dataCache.info);
    const time = new Date(+ new Date() + 8 * 3600 * 1000).toJSON()
      .substr(0,19).replace("T","")
      .replaceAll('-', '')
      .replaceAll(':', '');
    fs.writeFile(path.join(dir, `/${dataCache.data.name}-backup-${time}.chnr.json`), JSON.stringify(dataCache.data, null, 2), () => {
      // 备份完成
    });
  }
}
```

#### 1.4.4 平台兼容

文件操作API设计考虑了不同平台的兼容性：

```javascript
if (platform === 'json') {
  // Electron环境下的文件操作
} else {
  // Web环境下的文件操作(通常基于浏览器API)
}
```

## 2. 核心组件实现

### 2.1 ER图绘制组件

ER图绘制是PDManer的核心功能之一，由多个组件协同实现：

#### 2.1.1 关系图容器 (app/container/relation/index.js)

```javascript
export default React.memo((props) => {
  const { currentPrefix, dataSource, updateDataSource, tabDataChange, activeTab } = props;
  const relationRef = useRef(null);
  const isInit = useRef(false);
  const [contextDisplay, setContextDisplay] = useState(false);
  const [contextMenu, setContextMenu] = useState({left: 0, top: 0});
  const [contextMenuType, setContextMenuType] = useState('canvas');
  
  // 初始化关系图
  useEffect(() => {
    if (!isInit.current) {
      const size = relationRef.current.getBoundingClientRect();
      setFrameSize({
        width: size.width,
        height: size.height,
      });
      isInit.current = true;
    }
  }, []);
  
  // 交互事件处理
  const cellContextMenu = (e, cell) => {
    e.preventDefault();
    if (cell) {
      setContextMenuType('table');
      setContextMenu({
        left: e.clientX,
        top: e.clientY,
      });
      setContextDisplay(true);
    }
  };
  
  return (
    <div className={`${currentPrefix}-relation`}>
      <RelationToolBar
        prefix={currentPrefix}
        dataSource={dataSource}
        activeTab={activeTab}
        // 其他属性
      />
      <div
        ref={relationRef}
        className={`${currentPrefix}-relation-canvas`}
        tabIndex="0"
      >
        <ErCanvas
          dataSource={activeTab}
          updateDataSource={updateDiagram}
          prefix={currentPrefix}
          onContextMenu={cellContextMenu}
          // 其他属性
        />
      </div>
      {/* 右键菜单组件 */}
    </div>
  );
});
```

#### 2.1.2 ER画布核心实现 (components/ercanvas/index.js)

ER画布基于JointJS实现，是绘制实体关系图的核心组件：

```javascript
export default class ErCanvas extends Component {
  constructor(props) {
    super(props);
    this.state = {
      validateReady: false,
      scale: 1,
      scaleNumber: 100,
      linkDatas: {},
    };
    this.graph = null;
    this.paper = null;
    this.paperRef = React.createRef();
    this.relationTableData = {};
  }
  
  componentDidMount() {
    // 初始化图形库
    this._initGraphEvent();
  }
  
  // 初始化JointJS图形库
  _initGraphEvent = () => {
    const { width, height } = this._getPaper();
    const graph = new joint.dia.Graph();
    const paper = new joint.dia.Paper({
      el: this.paperRef.current,
      model: graph,
      width,
      height,
      gridSize: 10,
      drawGrid: true,
      background: {
        color: '#F5F5F5',
      },
      interactive: (cellView) => {
        return { vertexAdd: false, vertexMove: false };
      },
    });
    
    // 注册事件
    paper.on('blank:pointerdown', this._onBlankPointerDown);
    paper.on('cell:pointerdown', this._onCellPointerDown);
    
    this.graph = graph;
    this.paper = paper;
    
    // 初始绘制
    this._drawCells();
  };
  
  // 绘制实体和关系
  _drawCells = () => {
    const { dataSource } = this.props;
    const cells = dataSource?.canvasData?.cells || [];
    
    // 清空现有图形
    this.graph.clear();
    
    // 绘制所有单元格
    cells.forEach((cell) => {
      if (cell.shape === 'table') {
        // 创建实体表
        this._createTable(cell);
      } else if (cell.shape === 'erdRelation') {
        // 创建关系线
        this._createLink(cell);
      }
    });
  };
  
  // 创建实体表
  _createTable = (config) => {
    // 创建表格单元格
    const tableCell = new joint.shapes.erd.Table({
      position: { x: config.position.x, y: config.position.y },
      size: { width: config.size.width, height: config.size.height },
      id: config.id,
      cells: config.cells,
      title: config.title,
      fillColor: config.fillColor,
    });
    
    // 添加到图形
    this.graph.addCell(tableCell);
    return tableCell;
  };
  
  // 创建实体关系线
  _createLink = (config) => {
    // 创建连接线
    const link = new joint.shapes.erd.Relationship({
      source: { id: config.source.id },
      target: { id: config.target.id },
      id: config.id,
      relation: config.relation,
      vertexData: config.vertexData || [],
    });
    
    // 设置样式
    link.attr({
      '.connection': { stroke: '#5F95FF', 'stroke-width': 2 },
      '.marker-source': { fill: '#5F95FF', stroke: 'none' },
      '.marker-target': { fill: '#5F95FF', stroke: 'none' },
    });
    
    // 设置标签
    if (config.sourceConfig?.relationShow) {
      link.label(0, {
        position: 0.1,
        attrs: {
          text: { text: config.sourceConfig.relation || '' }
        }
      });
    }
    
    if (config.targetConfig?.relationShow) {
      link.label(1, {
        position: 0.9,
        attrs: {
          text: { text: config.targetConfig.relation || '' }
        }
      });
    }
    
    // 添加到图形
    this.graph.addCell(link);
    return link;
  };
  
  // 保存当前图形到数据源
  _saveCanvas = () => {
    const cells = this.graph.getCells().map((cell) => {
      const json = cell.toJSON();
      // 转换为数据模型
      // ...转换逻辑
      return cellData;
    });
    
    // 调用更新回调
    this.props.updateDataSource({
      ...this.props.dataSource,
      canvasData: {
        ...this.props.dataSource.canvasData,
        cells,
      },
    });
  };
  
  // 缩放处理
  _onZoomIn = () => {
    const { scale, scaleNumber } = this.state;
    if (scaleNumber < 200) {
      const nextScale = scale + 0.1;
      this.paper.scale(nextScale);
      this.setState({
        scale: nextScale,
        scaleNumber: scaleNumber + 10,
      });
    }
  };
  
  _onZoomOut = () => {
    const { scale, scaleNumber } = this.state;
    if (scaleNumber > 50) {
      const nextScale = scale - 0.1;
      this.paper.scale(nextScale);
      this.setState({
        scale: nextScale,
        scaleNumber: scaleNumber - 10,
      });
    }
  };
  
  // 渲染
  render() {
    const { prefix = 'pdman', width, height } = this.props;
    const { scaleNumber } = this.state;
    
    return (
      <div className={`${prefix}-relation-er-canvas`} style={{width, height}}>
        <div ref={this.paperRef} style={{width: '100%', height: '100%'}}/>
        <div className={`${prefix}-relation-er-canvas-toolBar`}>
          <span>{`${scaleNumber}%`}</span>
          <Icon type='fa-search-plus' onClick={this._onZoomIn}/>
          <Icon type='fa-search-minus' onClick={this._onZoomOut}/>
        </div>
      </div>
    );
  }
}
```

#### 2.1.3 自定义图形组件 (components/ercanvas/shape.js)

```javascript
// 自定义表格形状
joint.shapes.erd = joint.shapes.erd || {};
joint.shapes.erd.Table = joint.dia.Element.extend({
  markup: [
    '<g class="rotatable">',
    '<g class="scalable">',
    '<rect class="table-body"/>',
    '</g>',
    '<rect class="table-name-rect"/>',
    '<text class="table-name-text"/>',
    '</g>'
  ].join(''),
  
  defaults: joint.util.deepSupplement({
    type: 'erd.Table',
    attrs: {
      '.table-name-rect': { 
        width: 200, 
        height: 30, 
        fill: '#5F95FF', 
        stroke: '#5F95FF' 
      },
      '.table-name-text': { 
        'ref': '.table-name-rect', 
        'ref-y': 0.5, 
        'ref-x': 0.5, 
        'text-anchor': 'middle', 
        'y-alignment': 'middle', 
        fill: '#FFFFFF', 
        'font-size': 14 
      },
      '.table-body': { 
        width: 200, 
        height: 150, 
        'ref-y': 30, 
        fill: '#FFFFFF', 
        stroke: '#E8E8E8', 
        'stroke-width': 1 
      },
    }
  }, joint.dia.Element.prototype.defaults),
  
  initialize: function() {
    joint.dia.Element.prototype.initialize.apply(this, arguments);
    this.updateRectangles();
  },
  
  updateRectangles: function() {
    const attrs = this.get('attrs');
    const title = this.get('title');
    
    // 设置标题文本
    attrs['.table-name-text'].text = title || '';
    
    // 更新UI
    this.trigger('change:sizes');
  }
});

// 自定义关系线形状
joint.shapes.erd.Relationship = joint.dia.Link.extend({
  defaults: joint.util.deepSupplement({
    type: 'erd.Relationship',
    attrs: {
      '.connection': { 
        'stroke-width': 1, 
        'stroke': '#5F95FF' 
      },
      '.marker-source': { 
        d: 'M 5 0 L 0 10 L 10 10 z', 
        fill: '#5F95FF' 
      },
      '.marker-target': { 
        d: 'M 5 0 L 0 10 L 10 10 z', 
        fill: '#5F95FF' 
      }
    }
  }, joint.dia.Link.prototype.defaults)
});
```

### 2.2 实体编辑组件

实体编辑是数据建模的核心功能，由多个子组件组成：

#### 2.2.1 实体容器 (app/container/entity/index.js)

```javascript
export default React.memo(({currentPrefix, dataSource, updateDataSource}) => {
  const [groupType, setGroupType] = useState({
    type: 'modalAll',
  });
  const [selectedTableKey, setSelectedTableKey] = useState(null);
  const [count, setCount] = useState(0);
  
  // 获取实体列表
  const getEntities = (dataSource, type) => {
    const entities = dataSource.entities || [];
    if (type === 'modalAll') {
      return entities;
    } else if (type === 'modalGroup') {
      // 按模块分组显示
      return _groupByModule(entities);
    }
    return entities;
  };
  
  // 处理实体选择
  const tableClick = (key) => {
    setSelectedTableKey(key);
  };
  
  // 实体操作回调
  const _deleteTable = () => {
    if (selectedTableKey) {
      Modal.confirm({
        title: FormatMessage.string({id: 'deleteConfirmTitle'}),
        message: FormatMessage.string({id: 'deleteConfirm'}),
        onOk: () => {
          const tempEntities = (dataSource.entities || [])
            .filter(entity => entity.id !== selectedTableKey);
          updateDataSource({
            ...dataSource,
            entities: tempEntities,
          });
          setSelectedTableKey(null);
        },
      });
    }
  };
  
  // 渲染
  return (
    <div className={`${currentPrefix}-entity`}>
      <EntityHeader
        currentPrefix={currentPrefix}
        dataSource={dataSource}
        activeKey={selectedTableKey}
        onDelete={_deleteTable}
        // 其他属性
      />
      <div className={`${currentPrefix}-entity-content`}>
        <EntityList
          currentPrefix={currentPrefix}
          entities={getEntities(dataSource, groupType.type)}
          selectedTableKey={selectedTableKey}
          tableClick={tableClick}
          // 其他属性
        />
        {selectedTableKey && (
          <EntityContent
            currentPrefix={currentPrefix}
            dataSource={dataSource}
            updateDataSource={updateDataSource}
            activeKey={selectedTableKey}
            // 其他属性
          />
        )}
      </div>
    </div>
  );
});
```

#### 2.2.2 实体字段编辑 (app/container/entity/EntityFields.js)

```javascript
export default React.memo(({prefix, dataSource, updateDataSource, activeKey}) => {
  const [fieldList, setFieldList] = useState([]);
  const [selectedFields, setSelectedFields] = useState([]);
  
  // 初始化字段列表
  useEffect(() => {
    if (activeKey) {
      const entity = (dataSource.entities || [])
        .filter(entity => entity.id === activeKey)[0] || {};
      setFieldList(entity.fields || []);
      setSelectedFields([]);
    }
  }, [dataSource, activeKey]);
  
  // 字段操作回调
  const _addField = () => {
    const domains = dataSource.domains || [];
    // 打开添加字段对话框
    openModal(<FieldEdit
      prefix={prefix}
      dataSource={dataSource}
      domains={domains}
      onOk={field => {
        // 添加新字段到实体
        const tempEntities = [...(dataSource.entities || [])];
        const index = tempEntities.findIndex(entity => entity.id === activeKey);
        if (index > -1) {
          const entity = tempEntities[index];
          entity.fields = [...(entity.fields || []), field];
          updateDataSource({
            ...dataSource,
            entities: tempEntities,
          });
        }
      }}
    />);
  };
  
  const _deleteField = () => {
    if (selectedFields.length > 0) {
      Modal.confirm({
        title: FormatMessage.string({id: 'deleteConfirmTitle'}),
        message: FormatMessage.string({id: 'deleteConfirm'}),
        onOk: () => {
          const tempEntities = [...(dataSource.entities || [])];
          const index = tempEntities.findIndex(entity => entity.id === activeKey);
          if (index > -1) {
            const entity = tempEntities[index];
            entity.fields = (entity.fields || [])
              .filter(field => !selectedFields.includes(field.id));
            updateDataSource({
              ...dataSource,
              entities: tempEntities,
            });
            setSelectedFields([]);
          }
        },
      });
    }
  };
  
  // 渲染
  return (
    <div className={`${prefix}-entity-fields`}>
      <FieldsHeader
        prefix={prefix}
        selectedFields={selectedFields}
        onAdd={_addField}
        onDelete={_deleteField}
        // 其他属性
      />
      <div className={`${prefix}-entity-fields-table`}>
        <FieldsTable
          prefix={prefix}
          fieldList={fieldList}
          setSelectedFields={setSelectedFields}
          selectedFields={selectedFields}
          // 其他属性
        />
      </div>
    </div>
  );
});
```

#### 2.2.3 实体索引编辑 (app/container/entity/EntityIndexes.js)

```javascript
export default React.memo(({prefix, dataSource, updateDataSource, activeKey}) => {
  const [indexList, setIndexList] = useState([]);
  const [fields, setFields] = useState([]);
  const [selectedIndexes, setSelectedIndexes] = useState([]);
  
  // 初始化索引列表
  useEffect(() => {
    if (activeKey) {
      const entity = (dataSource.entities || [])
        .filter(entity => entity.id === activeKey)[0] || {};
      setIndexList(entity.indexes || []);
      setFields(entity.fields || []);
      setSelectedIndexes([]);
    }
  }, [dataSource, activeKey]);
  
  // 索引操作回调
  const _addIndex = () => {
    // 打开添加索引对话框
    openModal(<IndexEdit
      prefix={prefix}
      fields={fields}
      onOk={index => {
        // 添加新索引到实体
        const tempEntities = [...(dataSource.entities || [])];
        const entityIndex = tempEntities.findIndex(entity => entity.id === activeKey);
        if (entityIndex > -1) {
          const entity = tempEntities[entityIndex];
          entity.indexes = [...(entity.indexes || []), index];
          updateDataSource({
            ...dataSource,
            entities: tempEntities,
          });
        }
      }}
    />);
  };
  
  // 渲染
  return (
    <div className={`${prefix}-entity-indexes`}>
      <IndexesHeader
        prefix={prefix}
        selectedIndexes={selectedIndexes}
        onAdd={_addIndex}
        // 其他属性
      />
      <div className={`${prefix}-entity-indexes-table`}>
        <IndexesTable
          prefix={prefix}
          indexList={indexList}
          fields={fields}
          setSelectedIndexes={setSelectedIndexes}
          selectedIndexes={selectedIndexes}
          // 其他属性
        />
      </div>
    </div>
  );
});
```

### 2.3 数据字典组件

数据字典用于管理数据类型和业务字典：

#### 2.3.1 字典管理容器 (app/container/dict/index.js)

```javascript
export default React.memo(({currentPrefix, dataSource, updateDataSource}) => {
  const [type, setType] = useState('domains');
  const [selectedCode, setSelectedCode] = useState(null);
  
  // 切换类型（数据域/数据字典）
  const _tabChange = (t) => {
    setType(t);
    setSelectedCode(null);
  };
  
  // 获取当前类型的数据
  const getCurrentData = () => {
    if (type === 'domains') {
      return dataSource.domains || [];
    }
    return dataSource.dicts || [];
  };
  
  // 添加数据字典项
  const _addDict = () => {
    if (type === 'domains') {
      // 添加数据域
      const domain = {
        id: uuid(),
        defKey: `domain_${uuid(5)}`,
        defName: '',
        type: 'String',
        len: 50,
        scale: null,
      };
      updateDataSource({
        ...dataSource,
        domains: [...(dataSource.domains || []), domain],
      });
      setSelectedCode(domain.id);
    } else {
      // 添加数据字典
      const dict = {
        id: uuid(),
        defKey: `dict_${uuid(5)}`,
        defName: '',
        items: [],
      };
      updateDataSource({
        ...dataSource,
        dicts: [...(dataSource.dicts || []), dict],
      });
      setSelectedCode(dict.id);
    }
  };
  
  // 渲染
  return (
    <div className={`${currentPrefix}-dict`}>
      <DictHeader
        prefix={currentPrefix}
        type={type}
        onTabChange={_tabChange}
        onAdd={_addDict}
        selectedCode={selectedCode}
        // 其他属性
      />
      <div className={`${currentPrefix}-dict-content`}>
        <DictList
          prefix={currentPrefix}
          dataList={getCurrentData()}
          type={type}
          selectedCode={selectedCode}
          setSelectedCode={setSelectedCode}
          // 其他属性
        />
        <DictDetail
          prefix={currentPrefix}
          type={type}
          dataSource={dataSource}
          updateDataSource={updateDataSource}
          selectedCode={selectedCode}
          // 其他属性
        />
      </div>
    </div>
  );
});
```

#### 2.3.2 数据域详情 (app/container/dict/DomainDetail.js)

```javascript
export default React.memo(({prefix, domain, dataSource, updateDataSource}) => {
  const [data, setData] = useState(domain);
  
  // 监听域数据变化
  useEffect(() => {
    setData(domain);
  }, [domain]);
  
  // 处理字段变化
  const onChange = (key, value) => {
    setData({
      ...data,
      [key]: value,
    });
  };
  
  // 保存数据
  const onSave = () => {
    // 验证数据有效性
    // ...验证逻辑
    
    // 更新数据源
    const tempDomains = [...(dataSource.domains || [])];
    const index = tempDomains.findIndex(d => d.id === data.id);
    if (index > -1) {
      tempDomains[index] = data;
      updateDataSource({
        ...dataSource,
        domains: tempDomains,
      });
    }
  };
  
  // 渲染
  return (
    <div className={`${prefix}-dict-domain-detail`}>
      <div className={`${prefix}-dict-domain-item`}>
        <span className={`${prefix}-dict-domain-label`}>
          <FormatMessage id='dict.defKey'/>：
        </span>
        <Input 
          value={data.defKey} 
          onChange={e => onChange('defKey', e.target.value)}
        />
      </div>
      <div className={`${prefix}-dict-domain-item`}>
        <span className={`${prefix}-dict-domain-label`}>
          <FormatMessage id='dict.defName'/>：
        </span>
        <Input 
          value={data.defName} 
          onChange={e => onChange('defName', e.target.value)}
        />
      </div>
      <div className={`${prefix}-dict-domain-item`}>
        <span className={`${prefix}-dict-domain-label`}>
          <FormatMessage id='dict.type'/>：
        </span>
        <Select 
          value={data.type} 
          onChange={value => onChange('type', value)}
          options={[
            { value: 'String', label: 'String' },
            { value: 'Number', label: 'Number' },
            { value: 'Date', label: 'Date' },
            // 其他类型选项
          ]}
        />
      </div>
      {/* 其他表单项 */}
      <div className={`${prefix}-dict-domain-footer`}>
        <Button onClick={onSave}>
          <FormatMessage id='save'/>
        </Button>
      </div>
    </div>
  );
});
```

### 2.4 SQL生成组件

SQL生成是PDManer的重要功能，用于将数据模型转换为SQL脚本：

#### 2.4.1 SQL生成实现 (lib/generatefile/index.js)

```javascript
// 生成SQL文件
export const generateFile = (dataSource, type, templateData, filename = 'result') => {
  let template = '';
  
  if (type === 'pdman') {
    // PDMan模板
    template = '...'; // PDMan模板字符串
  } else if (type === 'SQL') {
    // 原生SQL模板
    template = '...'; // SQL模板字符串
  } else {
    // 自定义模板
    template = templateData;
  }
  
  // 处理模板变量
  const fileData = _parseTemplate(template, dataSource);
  
  // 保存文件
  return _saveFile(fileData, `${filename}.sql`);
};

// 解析模板
const _parseTemplate = (template, dataSource) => {
  // 创建模板上下文
  const context = {
    ...dataSource,
    entities: dataSource.entities || [],
    domains: dataSource.domains || [],
    // 工具函数
    utils: {
      camel: (str) => str.replace(/_(\w)/g, (m, p) => p.toUpperCase()),
      pascal: (str) => {
        const camel = str.replace(/_(\w)/g, (m, p) => p.toUpperCase());
        return camel.charAt(0).toUpperCase() + camel.slice(1);
      },
      // 其他工具函数
    },
  };
  
  // 解析模板
  return Handlebars.compile(template)(context);
};

// 生成创建表SQL
export const getCreateTableSql = (entity, dataSource, dbType) => {
  // 根据数据库类型选择SQL生成器
  const sqlGenerator = getSqlGenerator(dbType);
  return sqlGenerator.createTable(entity, dataSource);
};

// 生成创建索引SQL
export const getCreateIndexSql = (entity, dataSource, dbType) => {
  const sqlGenerator = getSqlGenerator(dbType);
  return sqlGenerator.createIndex(entity, dataSource);
};

// SQL生成器工厂
const getSqlGenerator = (dbType) => {
  switch(dbType) {
    case 'MYSQL':
      return MySQLGenerator;
    case 'ORACLE':
      return OracleGenerator;
    case 'POSTGRESQL':
      return PostgreSQLGenerator;
    case 'SQLSERVER':
      return SQLServerGenerator;
    // 其他数据库类型
    default:
      return MySQLGenerator;
  }
};
```

#### 2.4.2 MySQL SQL生成器 (lib/generatefile/mysql.js)

```javascript
// MySQL SQL生成器
const MySQLGenerator = {
  // 创建表SQL
  createTable: (entity, dataSource) => {
    const { defKey, defName, fields, indexes } = entity;
    
    // 生成字段定义
    const fieldsSql = (fields || []).map(field => {
      const { defKey, defName, type, len, scale, primaryKey, notNull, defaultValue } = field;
      
      // 构建字段类型
      let fieldType = type;
      if (len) {
        if (scale) {
          fieldType += `(${len},${scale})`;
        } else {
          fieldType += `(${len})`;
        }
      }
      
      // 构建字段属性
      let fieldAttr = '';
      if (primaryKey) {
        fieldAttr += ' PRIMARY KEY';
      }
      if (notNull) {
        fieldAttr += ' NOT NULL';
      }
      if (defaultValue) {
        fieldAttr += ` DEFAULT ${defaultValue}`;
      }
      
      // 返回完整字段定义
      return `  ${defKey} ${fieldType}${fieldAttr} COMMENT '${defName || ''}'`;
    }).join(',\n');
    
    // 生成创建表SQL
    return `CREATE TABLE ${defKey} (\n${fieldsSql}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='${defName || ''}';`;
  },
  
  // 创建索引SQL
  createIndex: (entity, dataSource) => {
    const { defKey, indexes } = entity;
    
    // 生成索引定义
    return (indexes || []).filter(index => !index.primaryKey).map(index => {
      const { defKey: indexName, fields, unique } = index;
      const indexFields = (fields || []).map(f => f.fieldDefKey).join(',');
      
      if (unique) {
        return `CREATE UNIQUE INDEX ${indexName} ON ${defKey} (${indexFields});`;
      } else {
        return `CREATE INDEX ${indexName} ON ${defKey} (${indexFields});`;
      }
    }).join('\n');
  },
  
  // 其他SQL生成方法
};
```

### 2.5 头部工具栏组件

头部工具栏提供主要的功能入口：

#### 2.5.1 工具栏实现 (app/main/HeaderTool.js)

```javascript
export default React.memo(({empty, redo, undo, save, open, saveAs, svgRef, ...restProps}) => {
  const { dataSource, openLoading, closeLoading } = restProps;
  const [modal, setModal] = useState(false);
  const [exportType, setExportType] = useState('img');
  
  // 保存项目
  const _save = () => {
    save(() => {
      Message.success({title: FormatMessage.string({id: 'saveSuccess'})});
    });
  };
  
  // 打开项目
  const _open = () => {
    if (!empty) {
      Modal.confirm({
        title: FormatMessage.string({id: 'saveConfirmTitle'}),
        message: FormatMessage.string({id: 'saveConfirm'}),
        onOk: () => {
          save(() => {
            _openProject();
          });
        },
        onCancel: () => {
          _openProject();
        },
      });
    } else {
      _openProject();
    }
  };
  
  // 实际打开项目
  const _openProject = () => {
    openLoading(FormatMessage.string({id: 'readingProject'}));
    open(null, (err) => {
      closeLoading();
      if (!err) {
        Message.success({title: FormatMessage.string({id: 'readSuccess'})});
      } else {
        Modal.error({title: FormatMessage.string({id: 'readFail'}), message: err.message || err});
      }
    });
  };
  
  // 导出功能
  const _export = (type) => {
    setExportType(type);
    setModal(true);
  };
  
  // 渲染
  return (
    <div className={`${currentPrefix}-toolbar`}>
      <div className={`${currentPrefix}-toolbar-button`}>
        <Button onClick={_save}>
          <span className={`${currentPrefix}-toolbar-opt-icon fa fa-floppy-o`}/>
          <FormatMessage id='save'/>
        </Button>
        <Button onClick={_open}>
          <span className={`${currentPrefix}-toolbar-opt-icon fa fa-folder-open-o`}/>
          <FormatMessage id='open'/>
        </Button>
        <Button onClick={() => _export('img')}>
          <span className={`${currentPrefix}-toolbar-opt-icon fa fa-file-image-o`}/>
          <FormatMessage id='exportImage'/>
        </Button>
        <Button onClick={() => _export('sql')}>
          <span className={`${currentPrefix}-toolbar-opt-icon fa fa-file-text-o`}/>
          <FormatMessage id='exportSQL'/>
        </Button>
        {/* 其他按钮 */}
      </div>
      
      {/* 导出模态框 */}
      <Export
        prefix={currentPrefix}
        visible={modal}
        type={exportType}
        dataSource={dataSource}
        onCancel={() => setModal(false)}
      />
    </div>
  );
});
``` 