# PDManer数据处理实现

## 1. 数据模型处理

### 1.1 数据模型核心结构

PDManer的数据模型设计采用了一套完整的核心结构来表示实体关系模型中的各种元素。这些结构定义了应用中数据的组织方式和表现形式。

#### 1.1.1 实体(Entity)结构

实体是PDManer中最基本的数据模型单元，用于表示数据库中的表结构：

```javascript
{
  id: String,           // 唯一标识符
  defKey: String,       // 定义键(代码中使用的名称，如表名)
  defName: String,      // 显示名称(用于界面展示)
  comment: String,      // 注释说明
  fields: [             // 字段列表
    {
      id: String,       // 字段ID
      defKey: String,   // 字段键(列名)
      defName: String,  // 字段名称
      type: String,     // 字段类型
      len: Number,      // 长度
      scale: Number,    // 小数位
      primaryKey: Boolean, // 是否主键
      notNull: Boolean, // 是否非空
      autoIncrement: Boolean, // 是否自增
      defaultValue: String, // 默认值
      comment: String,  // 注释
    }
  ],
  indexes: [            // 索引列表
    {
      id: String,       // 索引ID
      defKey: String,   // 索引键
      defName: String,  // 索引名称
      fields: Array,    // 索引字段
      isUnique: Boolean, // 是否唯一索引
      comment: String,  // 注释
    }
  ]
}
```

#### 1.1.2 关系图(Diagram)结构

关系图用于表示实体之间的关系，并提供可视化的展示方式：

```javascript
{
  id: String,           // 唯一标识
  defKey: String,       // 定义键
  defName: String,      // 显示名称
  comment: String,      // 注释
  canvasData: {         // 画布数据
    cells: Array,       // 单元格(节点和边)
  }
}
```

#### 1.1.3 数据字典(Dict)结构

数据字典用于定义和管理系统中使用的数据项的统一定义：

```javascript
{
  id: String,           // 唯一标识符
  defKey: String,       // 字典键名
  defName: String,      // 字典名称
  intro: String,        // 简介
  items: [              // 字典项列表
    {
      id: String,       // 字典项ID
      defKey: String,   // 字典项键名
      defName: String,  // 字典项名称
      intro: String,    // 字典项说明
      sort: Number,     // 排序号
    }
  ]
}
```

#### 1.1.4 数据域(Domain)结构

数据域定义了特定类型的数据格式，使得多个字段可以共享相同的数据类型定义：

```javascript
{
  id: String,           // 唯一标识符
  defKey: String,       // 数据域键名
  defName: String,      // 数据域名称
  applyFor: String,     // 适用于哪种基础类型
  len: String,          // 长度
  scale: String,        // 小数位
  uiHint: String        // UI提示信息
}
```

### 1.2 模型数据转换流程

在PDManer中，模型数据需要在不同格式间进行转换，特别是在数据导入、导出以及版本兼容时。

#### 1.2.1 数据转换核心实现

模型数据转换主要在`src/lib/datasource_util.js`中实现，核心函数如下：

```javascript
// 转换数据模型结构
export const transformationData = (data) => {
  // 处理版本兼容性
  if (!data.version) {
    // 旧版数据格式转换为新版
    return pdman2sino(data);
  } else if (compareVersion(data.version, version) < 0) {
    // 低版本数据升级到当前版本
    return version2sino(data);
  }
  return data;
};

// PDMan旧版数据转换为新版数据
export const pdman2sino = (data, projectName) => {
  // 获取默认数据库类型
  const defaultDbType = _.get(data, 'profile.defaultDb.type', _.get(data, 'profile.dbs[0].type', 'MYSQL'));
  const defaultDb = _.get(data, 'profile.dbs', []).filter(db => db.type === defaultDbType)[0];
  
  // 获取数据类型映射
  const dataTypeSupports = [];
  const mappings = [];
  const domains = [];
  
  // 处理数据库类型支持
  const database = _.get(data, 'profile.dbs', []);
  database.forEach((db) => {
    const id = Math.uuid();
    dataTypeSupports.push({
      id,
      defKey: db.type,
    });
  });
  
  // 处理数据类型映射
  const datatype = _.get(data, 'dataTypeDomains.datatype', []);
  datatype.forEach((type) => {
    const id = Math.uuid();
    const mapping = {
      id,
      defKey: type.code,
      defName: type.name,
    };
    
    // 为每种数据库类型添加映射
    database.forEach((db) => {
      const apply = type.apply[db.type];
      if (apply) {
        const dbId = dataTypeSupports.filter(s => s.defKey === db.type)[0]?.id;
        if (dbId) {
          mapping[dbId] = apply.type;
        }
      }
    });
    
    mappings.push(mapping);
  });
  
  // 处理数据域
  const domainData = _.get(data, 'dataTypeDomains.domains', []);
  domainData.forEach((d) => {
    const applyFor = mappings.filter(m => m.defKey === d.applyFor)[0]?.id;
    if (applyFor) {
      domains.push({
        id: Math.uuid(),
        defKey: d.code,
        defName: d.name,
        applyFor,
        len: d.len || '',
        scale: d.scale || '',
      });
    }
  });
  
  // 处理实体和关系
  const entities = [];
  const diagrams = [];
  const viewGroups = [];
  
  // 处理模块和表
  const modules = _.get(data, 'modules', []);
  modules.forEach((m) => {
    const group = {
      id: Math.uuid(),
      defKey: m.name,
      defName: m.chnname || m.name,
      refEntities: [],
      refDiagrams: [],
      refViews: [],
      refDicts: [],
    };
    
    // 处理模块中的实体
    const entities = _.get(m, 'entities', []);
    entities.forEach((e) => {
      const entity = {
        id: Math.uuid(),
        defKey: e.title,
        defName: e.chnname || e.title,
        comment: e.chnname || '',
        fields: [],
        indexes: [],
      };
      
      // 处理字段
      const fields = _.get(e, 'fields', []);
      fields.forEach((f) => {
        const field = {
          id: Math.uuid(),
          defKey: f.name,
          defName: f.chnname || f.name,
          comment: f.remark || '',
          type: f.type,
          len: f.len || '',
          scale: f.scale || '',
          primaryKey: f.pk,
          notNull: f.notNull,
          autoIncrement: f.autoIncrement,
          defaultValue: f.defaultValue,
        };
        
        entity.fields.push(field);
      });
      
      // 处理索引
      const indexes = _.get(e, 'indexes', []);
      indexes.forEach((i) => {
        const index = {
          id: Math.uuid(),
          defKey: i.name,
          defName: i.name,
          comment: i.comment || '',
          isUnique: i.isUnique,
          fields: [],
        };
        
        // 处理索引字段
        const indexFields = _.get(i, 'fields', []);
        indexFields.forEach((f) => {
          const fieldId = entity.fields.filter(field => field.defKey === f.fieldName)[0]?.id;
          if (fieldId) {
            index.fields.push({
              fieldDefKey: fieldId,
              ascOrDesc: f.ascOrDesc || 'A',
            });
          }
        });
        
        entity.indexes.push(index);
      });
      
      entities.push(entity);
      group.refEntities.push(entity.id);
    });
    
    // 处理关系图
    const graphCanvas = _.get(m, 'graphCanvas', {});
    const cells = _.get(graphCanvas, 'cells', []);
    if (cells.length > 0) {
      const diagram = {
        id: Math.uuid(),
        defKey: `${m.name}_DIAGRAM`,
        defName: `${m.chnname || m.name} 关系图`,
        canvasData: {
          cells,
        },
      };
      
      diagrams.push(diagram);
      group.refDiagrams.push(diagram.id);
    }
    
    viewGroups.push(group);
  });
  
  // 返回转换后的数据
  return {
    name: projectName || _.get(data, 'name', '未命名项目'),
    describe: '',
    avatar: '',
    version: '3.0.0',
    createdTime: moment().format('YYYY-M-D HH:mm:ss'),
    updatedTime: '',
    dbConns: _.get(data, 'profile.dbs', [])
      .map(conn => ({
        ..._.omit(conn, ['defaultDB', 'name']),
        defKey: conn.name || Math.uuid(),
        defName: conn.name || '',
      })),
    profile: {
      default: {
        db: defaultDb?.type || defaultDbType,
        dbConn: defaultDb?.name || '',
        entityInitFields: _.get(data, 'profile.defaultFields', [])
          .map(f => fieldsTransform(f, domains, mappings, defaultDb?.type || defaultDbType)),
      },
      javaHome: _.get(data, 'profile.javaConfig.JAVA_HOME', ''),
      sql: { delimiter: _.get(data, 'profile.sqlConfig', '') },
      dataTypeSupports,
      codeTemplates: database.map(d => {
        if (d.code.toLocaleUpperCase() === 'JAVA') {
          return {
            applyFor: 'JAVA',
            referURL: '',
            type: 'appCode',
            content : d.createTableTemplate || d.template
          };
        } else {
          return {
            applyFor: d.code,
            referURL: '',
            type: 'dbDDL',
            createTable: d.createTableTemplate || d.template,
            createIndex: d.createIndexTemplate || '',
          };
        }
      }),
      generatorDoc: {
        docTemplate: _.get(data, 'profile.wordTemplateConfig', ''),
      }
    },
    entities,
    diagrams,
    viewGroups,
    dicts: [],
    dataTypeMapping: {
      referURL: '',
      mappings,
    },
    domains,
  };
};
```

#### 1.2.2 模型更新与合并机制

当用户编辑模型或从数据库中导入数据时，需要将变更合并到当前项目中：

```javascript
// 合并数据源
export const _mergeDataSource = (oldDataSource, newDataSource, selectEntity, ignoreProps) => {
  // 合并数据域
  const tempDomains = _mergeData(domains, newDomains, true, false);
  
  // 合并数据表
  const entities = oldDataSource.entities || [];
  const newEntities = (selectEntity || []).map(e => ({
    ...e,
    isNew: true,
    properties: e.properties || oldDataSource?.profile?.default?.entityInitProperties || {},
    fields: (e.fields || []).map(f => ({
      ...f,
      baseType: _getFieldBaseType(f, tempDomains, tempMappings, newDb),
      extProps: f.extProps || oldDataSource?.profile?.extProps || {}
    })),
  }));
  
  // 处理字段名大小写不敏感的情况
  const ignoreCaseEntities = (entities, newEntities) => {
    // 实现字段名大小写不敏感的合并逻辑
    // ...省略具体实现
  };
  
  // 返回合并后的数据源
};
```

### 1.3 模型数据验证机制

PDManer实现了多种验证机制，确保数据模型符合规范要求和业务逻辑，主要包括命名规则验证和数据完整性验证。

#### 1.3.1 命名规则验证

PDManer支持自定义命名规则，规则定义在项目配置中：

```javascript
{
  // 命名规则示例
  "namingRules": [
    {
      "id": "039BF435-DC77-4DA4-81C7-7F8076BF22BB",
      "defName": "表名-全小写",
      "intro": "",
      "controlIntensity": "S", // 强制(F)或建议(S)
      "applyObjectType": "P", // 适用对象类型：物理模型(P)或逻辑模型(L)
      "applyFieldType": "entity", // 适用字段类型
      "programCode": "return !/[A-Z]+/.test(data.entity.defKey);", // 验证逻辑
      "enable": true // 是否启用
    },
    {
      "id": "1168C7C2-8E8E-4FB7-B639-B3DE839C395A",
      "defName": "表名-英文及下划线",
      "intro": "",
      "controlIntensity": "F",
      "applyObjectType": "P",
      "applyFieldType": "entity",
      "programCode": "return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(data.entity.defKey);",
      "enable": true
    }
  ]
}
```

#### 1.3.2 数据完整性验证

在保存或更新数据模型时，应用会执行数据完整性检查：

```javascript
export const updateAllData = (dataSource) => {
  // 检查字段重复
  if (t.type === 'entity' || t.type === 'view') {
    const fields = t.data?.fields || [];
    const repeat = fields.reduce((a, b) => {
      if (!b.defKey) {
        return a.concat(FormatMessage.string({id: 'emptyField'}));
      } else if (fields.filter(f => f.defKey?.toLocaleLowerCase() === b.defKey?.toLocaleLowerCase()).length > 1 && !a.includes(b.defKey?.toLocaleLowerCase())) {
        return a.concat(b.defKey);
      }
      return a;
    }, []).join('|');
    repeat && repeatError.push(`${t.data.defKey}=>[${repeat}]`);
    
    // 检查表名或视图名重复
    const newDefKey = t.data?.defKey;
    if (newDefKey && (newDefKey !== oldData?.defKey)) {
      // 检查是否与当前已打开的TAB键重复
      // 检查是否与已存在的键重复
      // ...省略详细实现
    }
  } 
  // 其他验证逻辑...
}
```

#### 1.3.3 自动校正机制

PDManer还实现了自动校正机制，当导入数据或用户编辑时，可以自动调整数据格式：

```javascript
// 当导入字段时，自动处理字段名冲突
export const importFields = (entities, fields, data, useDefaultFields, onlyEntityFields) => {
  const allFields = [...(data?.fields || [])].filter(f => !f.refEntity);
  // 添加默认字段
  if (useDefaultFields) {
    allFields.push(...emptyProjectTemplate.profile.default.entityInitFields
      .map(f => ({...f, id: Math.uuid()})));
  }
  // 处理字段键名冲突
  const allFieldKeys = allFields.map(f => f.defKey);
  const newFields = fields.map((v) => {
    // 解析字段信息
    const splitArray = v.split(separator);
    const entity = splitArray[0];
    const field = splitArray[1];
    const tempEntity = entities?.filter(e => e.id === entity)[0] || {};
    const tempField = tempEntity?.fields?.filter(f => f.id === field)[0] || {};
    // 验证键名并自动调整
    const tempKey = validateKey(tempField.defKey, allFieldKeys);
    allFieldKeys.push({defKey: tempKey});
    // 返回处理后的字段
    return {
      ...tempField,
      id: Math.uuid(),
      defKey: tempKey,
      refEntity: entity,
      refEntityField: field,
    };
  });
  return onlyEntityFields ? newFields : newFields.concat(allFields);
};
```

## 2. 数据持久化实现

PDManer作为桌面应用，采用文件系统进行数据持久化。所有项目数据都以JSON格式存储在本地文件系统中，并通过一系列机制确保数据的安全性和可恢复性。

### 2.1 JSON文件存储

PDManer使用JSON作为主要的存储格式，提供了一套完整的文件操作API。

#### 2.1.1 文件操作核心API

文件操作的核心API定义在`src/lib/middle.js`和`src/lib/json.js`中，主要包括以下函数：

```javascript
// 保存JSON文件
export const saveJsonPromise = (file, data, disableFormat = false) => {
  return new Promise((res, rej) => {
    try {
      // 创建JSON字符串，默认进行格式化以便于阅读
      const dataStr = disableFormat ? 
        JSON.stringify(data) : JSON.stringify(data, null, 2);
      
      // 创建文件流
      const writer = fs.createWriteStream(file);
      writer.on('error', (err) => {
        rej(err);
      });
      writer.on('close', () => {
        res(file);
      });
      
      // 写入数据并关闭流
      writer.write(dataStr);
      writer.end();
    } catch (err) {
      rej(err);
    }
  });
};

// 读取JSON文件
export const readJsonPromise = (file) => {
  return new Promise((res, rej) => {
    try {
      fs.readFile(file, 'utf8', (err, data) => {
        if (err) {
          rej(err);
        } else {
          try {
            // 解析JSON字符串为对象
            const dataObj = JSON.parse(data.toString().replace(/^\uFEFF/, ''));
            res(dataObj);
          } catch (e) {
            rej(e);
          }
        }
      });
    } catch (err) {
      rej(err);
    }
  });
};

// 另存为新文件
export const saveJsonPromiseAs = (data, dataTransform) => {
  return new Promise((res, rej) => {
    try {
      // 打开文件保存对话框
      openFileOrDirPath([], ['openDirectory']).then((dir) => {
        // 构建文件路径
        const filePath = dirSplicing(dir, `${data.name}.${projectSuffix}.json`);
        
        // 检查文件是否已存在
        if (fileExists(filePath)) {
          rej(new Error('文件已存在'));
          return;
        }
        
        // 处理数据转换
        let saveData = data;
        if (dataTransform) {
          saveData = dataTransform(JSON.stringify(data, null, 2), filePath);
        } else {
          saveData = JSON.stringify(data, null, 2);
        }
        
        // 写入文件
        saveNormalFile(filePath, saveData).then(() => {
          res(filePath);
        }).catch(rej);
      }).catch(rej);
    } catch (err) {
      rej(err);
    }
  });
};
```

#### 2.1.2 项目文件保存流程

在`src/actions/core/index.js`中实现了保存项目的核心逻辑：

```javascript
export const saveProject = (data, title, saveAs, callback) => {
  // 标记保存状态
  isSaving = true;
  
  // 更新时间戳
  const time = moment().format('YYYY-M-D HH:mm:ss');
  const tempData = {
    ...data,
    createdTime: saveAs ? time : data.createdTime || time, // 新建则更新创建时间
    updatedTime: time,                                     // 总是更新修改时间
    version,                                              // 记录应用版本
  };
  
  return (dispatch, getState) => {
    // 获取当前项目信息
    const info = getState()?.core?.info;
    const mode = getState()?.core?.mode;
    
    // 只有在编辑模式下才允许保存
    if(mode !== READING) {
      if (saveAs) {
        // 另存为流程
        dispatch(openLoading(title));
        saveJsonPromiseAs(tempData, (d, f) => {
          // 处理文件路径和项目名称
          const oldData = JSON.parse(d.toString().replace(/^\uFEFF/, ''));
          oldData.name = getName(f);
          return JSON.stringify(oldData, null, 2);
        }).then((path) => {
          // 更新历史记录
          const name = getName(path);
          addHistory({
            describe: tempData.describe || '',
            name,
            avatar: tempData.avatar || '',
            path,
          }, (err) => {
            isSaving = false;
            if (!err) {
              // 更新缓存和状态
              tempData.name = name;
              setMemoryCache('data', tempData);
              callback && callback();
              dispatch(saveProjectSuccess(tempData));
              dispatch(updateProjectInfo(path));
            } else {
              callback && callback(err);
              dispatch(saveProjectFail(err));
            }
          })(dispatch, getState);
        }).catch((err) => {
          // 处理错误
          isSaving = false;
          callback && callback(err);
          dispatch(saveProjectFail(err));
        }).finally(() => {
          dispatch(closeLoading());
        });
      } else {
        // 普通保存流程
        dispatch(openLoading(title));
        
        // 当表数量过多时不进行格式化，提高性能
        saveJsonPromise(info, tempData, tempData.entities?.length > 1000)
          .then(() => {
            // 创建备份
            getBackupAllFile({info, data: tempData}, (err) => {
              isSaving = false;
              if (err) {
                callback && callback(err);
                dispatch(saveProjectFail(err));
              } else {
                // 更新缓存和状态
                setMemoryCache('data', tempData);
                callback && callback();
                dispatch(saveProjectSuccess(tempData));
              }
            });
          })
          .catch((err) => {
            // 处理错误
            isSaving = false;
            callback && callback(err);
            dispatch(saveProjectFail(err));
          }).finally(() => {
            dispatch(closeLoading());
          });
      }
    }
  };
};
```

#### 2.1.3 自动保存机制

为了防止数据丢失，PDManer实现了自动保存功能：

```javascript
export const autoSaveProject = (data) => {
  // 创建时间戳
  const time = moment().format('YYYY-M-D HH:mm:ss');
  const tempData = {
    ...data,
    updatedTime: time,
    version,
  };
  
  return (dispatch, getState) => {
    const info = getState()?.core?.info;
    const mode = getState()?.core?.mode;
    
    // 只在编辑模式下自动保存
    if (mode !== READING) {
      // 先创建备份，再保存文件
      getBackupAllFile({info, data: tempData}, () => {
        saveJsonPromise(info, tempData)
          .catch((err) => {
            writeLog(err);
          });
      });
    }
  };
};
```

### 2.2 项目数据版本控制

PDManer实现了一套简单但有效的版本控制机制，允许用户回溯到项目的历史版本。

#### 2.2.1 版本管理目录结构

版本文件保存在项目文件同级的version目录下，格式为：
```
/path/to/project.pdma.json      # 主项目文件
/path/to/version/               # 版本目录
  |- project_v1.pdma.json       # 版本1
  |- project_v2.pdma.json       # 版本2
  |- ...
```

#### 2.2.2 版本创建机制

在项目保存时，会自动创建版本文件：

```javascript
// 创建版本文件 (简化版实现)
export const createVersionFile = (filePath, data) => {
  try {
    // 获取版本目录路径
    const versionDir = dirSplicing(dirname(filePath), 'version');
    
    // 确保版本目录存在
    ensureDirectoryExistence(versionDir);
    
    // 生成版本文件名
    const baseName = basename(filePath, '.json');
    const versionPath = dirSplicing(versionDir, `${baseName}_v${moment().format('YYYYMMDDHHmmss')}.json`);
    
    // 保存版本文件
    saveJsonPromise(versionPath, data, true)
      .catch((err) => {
        writeLog(`创建版本文件失败: ${err.message}`);
      });
  } catch (e) {
    writeLog(`创建版本文件错误: ${e.message}`);
  }
};
```

#### 2.2.3 版本清理机制

为了避免版本文件过多占用磁盘空间，PDManer实现了版本清理功能：

```javascript
// 清理过期版本文件
export const cleanVersionFiles = (filePath, maxVersions = 10) => {
  try {
    // 获取版本目录
    const versionDir = dirSplicing(dirname(filePath), 'version');
    
    // 如果目录不存在则直接返回
    if (!fileExists(versionDir)) {
      return;
    }
    
    // 获取基本文件名
    const baseName = basename(filePath, '.json');
    
    // 读取目录下的版本文件
    fs.readdir(versionDir, (err, files) => {
      if (err) {
        writeLog(`读取版本目录失败: ${err.message}`);
        return;
      }
      
      // 过滤出当前项目的版本文件
      const versionFiles = files
        .filter(f => f.startsWith(`${baseName}_v`) && f.endsWith('.json'))
        .sort()  // 按字母顺序排序
        .reverse();  // 最新的在前面
      
      // 如果版本文件数量超出限制，删除最旧的文件
      if (versionFiles.length > maxVersions) {
        versionFiles.slice(maxVersions).forEach((file) => {
          const fullPath = dirSplicing(versionDir, file);
          deleteFile(fullPath);
        });
      }
    });
  } catch (e) {
    writeLog(`清理版本文件错误: ${e.message}`);
  }
};
```

### 2.3 备份与恢复机制

除了版本控制外，PDManer还实现了更为可靠的备份和恢复机制，以防止意外数据丢失。

#### 2.3.1 自动备份机制

PDManer会在特定操作前自动创建备份：

```javascript
// 创建备份文件
export const getBackupAllFile = ({info, data}, callback) => {
  try {
    // 获取备份目录
    const backupDir = dirSplicing(dirname(info), 'backup');
    
    // 确保备份目录存在
    ensureDirectoryExistence(backupDir);
    
    // 生成备份文件名
    const baseName = basename(info, '.json');
    const backupPath = dirSplicing(backupDir, `${baseName}_backup_${moment().format('YYYYMMDDHHmmss')}.json`);
    
    // 保存备份文件
    saveJsonPromise(backupPath, data, true)
      .then(() => {
        // 清理过期备份
        cleanBackupFiles(info);
        callback && callback();
      })
      .catch((err) => {
        writeLog(`创建备份文件失败: ${err.message}`);
        callback && callback(err);
      });
  } catch (e) {
    writeLog(`创建备份文件错误: ${e.message}`);
    callback && callback(e);
  }
};

// 清理过期备份文件
export const cleanBackupFiles = (filePath, maxBackups = 20) => {
  // 实现类似于版本清理的逻辑
  // ...省略具体实现
};
```

#### 2.3.2 项目恢复机制

当检测到项目文件损坏或用户主动请求时，PDManer提供从备份恢复的功能：

```javascript
// 从备份恢复项目
export const restoreFromBackup = (projectPath, callback) => {
  try {
    // 获取备份目录
    const backupDir = dirSplicing(dirname(projectPath), 'backup');
    
    // 如果备份目录不存在则返回错误
    if (!fileExists(backupDir)) {
      callback && callback(new Error('备份目录不存在'));
      return;
    }
    
    // 获取基本文件名
    const baseName = basename(projectPath, '.json');
    
    // 读取备份目录
    fs.readdir(backupDir, (err, files) => {
      if (err) {
        callback && callback(err);
        return;
      }
      
      // 过滤出当前项目的备份文件并按时间排序
      const backupFiles = files
        .filter(f => f.startsWith(`${baseName}_backup_`) && f.endsWith('.json'))
        .sort()
        .reverse();  // 最新的在前面
      
      if (backupFiles.length === 0) {
        callback && callback(new Error('没有找到可用的备份文件'));
        return;
      }
      
      // 使用最新的备份文件进行恢复
      const latestBackup = dirSplicing(backupDir, backupFiles[0]);
      
      // 读取备份文件
      readJsonPromise(latestBackup)
        .then((backupData) => {
          // 写入到原项目文件
          saveJsonPromise(projectPath, backupData)
            .then(() => {
              callback && callback(null, backupData);
            })
            .catch(callback);
        })
        .catch(callback);
    });
  } catch (e) {
    callback && callback(e);
  }
};
```

#### 2.3.3 备份文件重命名

当项目文件被重命名时，相应的备份文件也需要更新：

```javascript
// 重命名备份文件
export const renameBackupAllFile = (oldFilePath, newFilePath, oldData, newData) => {
  try {
    // 获取旧备份目录和新备份目录
    const oldBackupDir = dirSplicing(dirname(oldFilePath), 'backup');
    const newBackupDir = dirSplicing(dirname(newFilePath), 'backup');
    
    // 确保新备份目录存在
    ensureDirectoryExistence(newBackupDir);
    
    // 如果旧备份目录不存在则直接返回
    if (!fileExists(oldBackupDir)) {
      return;
    }
    
    // 获取基本文件名
    const oldBaseName = basename(oldFilePath, '.json');
    const newBaseName = basename(newFilePath, '.json');
    
    // 读取旧备份目录
    fs.readdir(oldBackupDir, (err, files) => {
      if (err) {
        writeLog(`读取备份目录失败: ${err.message}`);
        return;
      }
      
      // 过滤出旧项目的备份文件
      const backupFiles = files
        .filter(f => f.startsWith(`${oldBaseName}_backup_`) && f.endsWith('.json'));
      
      // 重命名每个备份文件
      backupFiles.forEach((file) => {
        const oldFullPath = dirSplicing(oldBackupDir, file);
        const newFileName = file.replace(oldBaseName, newBaseName);
        const newFullPath = dirSplicing(newBackupDir, newFileName);
        
        // 读取并修改备份文件内容
        readJsonPromise(oldFullPath)
          .then((backupData) => {
            // 更新备份数据中的项目名
            const updatedData = {
              ...backupData,
              name: newData.name,
              // 其他需要更新的字段
            };
            
            // 保存到新位置
            saveJsonPromise(newFullPath, updatedData, true)
              .then(() => {
                // 删除旧文件
                deleteFile(oldFullPath);
              })
              .catch((e) => {
                writeLog(`重命名备份文件失败: ${e.message}`);
              });
          })
          .catch((e) => {
            writeLog(`读取备份文件失败: ${e.message}`);
          });
      });
    });
  } catch (e) {
    writeLog(`重命名备份文件错误: ${e.message}`);
  }
};
```

## 3. SQL生成实现

PDManer的核心功能之一是将数据模型转换为可执行的SQL脚本，支持多种数据库类型，并提供了灵活的模板定制能力。

### 3.1 SQL生成核心流程

SQL生成是一个将抽象数据模型转换为具体数据库SQL语句的过程，其核心流程如下：

#### 3.1.1 SQL生成的触发

SQL生成主要在用户点击导出SQL按钮时触发：

```javascript
const exportSql = (type) => {
  let modal;
  const onClose = () => {
    modal && modal.close();
  };
  modal = openModal(<ExportSql templateType={type} dataSource={dataSourceRef.current}/>, {
    title: FormatMessage.string({id: `toolbar.${type === 'dict' ? 'exportDict' : 'exportSql'}`}),
    bodyStyle: { width: '80%' },
    buttons: [
      <Button key='onClose' onClick={onClose}>
        <FormatMessage id='button.close'/>
      </Button>,
    ],
  });
};
```

#### 3.1.2 SQL生成核心代码

SQL生成的核心实现在`src/lib/generatefile/index.js`中：

```javascript
// 生成SQL文件
export const generateFile = (dataSource, type, templateData, filename = 'result') => {
  let template = '';
  
  // 根据类型选择模板
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
  
  // 使用Handlebars解析模板
  return Handlebars.compile(template)(context);
};
```

#### 3.1.3 生成全量SQL的过程

获取包含建表、创建索引等全量SQL的方法：

```javascript
export const _getAllDataSQLByFilter = (data, code, filterTemplate, filterDefKey) => {
  // 获取项目的配置信息
  const { dataSource, allTemplate, sqlSeparator } = getDataSourceProfile(data);
  const entities = dataSource.entities || [];
  
  // 获取指定数据库类型的模板
  const getTemplate = (templateShow) => {
    return allTemplate.filter(t => t.applyFor === code)[0]?.[templateShow] || '';
  };
  
  // 根据过滤条件获取实体数据
  const getFilterData = (name) => {
    return (dataSource[name] || []).filter(e => {
      if (filterDefKey) {
        return (filterDefKey[name] || []).includes(e.id);
      }
      return true;
    }).map(e => ({
      ...e,
      datatype: name,
      groupType: `ref${firstUp(name)}`
    }));
  };
  
  // 生成SQL字符串
  let sqlString = '';
  
  // 根据不同的模板类型生成SQL
  // ...省略具体实现
  
  return sqlString;
};
```

### 3.2 不同数据库方言适配

PDManer支持多种数据库类型，包括MySQL、Oracle、SQL Server、PostgreSQL等，每种数据库都有其特定的SQL语法和特性。

#### 3.2.1 数据库支持列表

在项目配置中定义了支持的数据库类型：

```javascript
"dataTypeSupports": [
  {
    "defKey": "MYSQL",
    "id": "29D1CE08-4C35-4D2D-AAA9-23D93305B52E"
  },
  {
    "defKey": "ORACLE",
    "id": "A4E23CB7-BB01-4BD1-9F71-F73F3E15A542"
  },
  {
    "defKey": "SQLServer",
    "id": "BFC87171-C74F-494A-B7C2-76B9C55FACC9"
  },
  {
    "defKey": "PostgreSQL",
    "id": "DFBEC1DD-AA84-456E-BBF3-C95DD0DB2022"
  },
  {
    "defKey": "DB2",
    "id": "89504F5D-94BF-4C9E-8B2E-44F37305FED5"
  },
  {
    "defKey": "DM",
    "id": "0BBCABA5-B8E4-41B0-B8E4-8F5EA6029307"
  },
  {
    "defKey": "GaussDB",
    "id": "592C7013-143D-4E7B-AF64-0D7BF1E28230"
  },
  {
    "defKey": "Kingbase",
    "id": "77BD85E5-9D0D-4096-8427-CBA306FC9C6A"
  },
  {
    "defKey": "GBase",
    "id": "56F4B55B-F0B8-4049-9E6B-50B95C1D793A"
  },
  {
    "defKey": "MaxCompute",
    "id": "11D1FB71-A587-4217-89BA-611B8A1F83E0"
  },
  {
    "defKey": "SQLite",
    "id": "B363BE0B-F852-49B8-9B2E-F6D2174DEAC1"
  },
  {
    "defKey": "Hive",
    "id": "81CCA482-3F4D-4EAC-8CF9-F5E7BC098AD2"
  },
  {
    "defKey": "Doris",
    "id": "483F9346-C99E-4014-A1D2-A554606BD8A3"
  }
]
```

#### 3.2.2 数据库方言适配机制

每种数据库的SQL语法差异通过模板系统进行适配：

```javascript
// 为不同数据库生成SQL的工厂方法
function getSqlGenerator(dbType) {
  switch (dbType.toUpperCase()) {
    case 'MYSQL':
      return new MySqlGenerator();
    case 'ORACLE':
      return new OracleGenerator();
    case 'SQLSERVER':
      return new SqlServerGenerator();
    case 'POSTGRESQL':
      return new PostgreSqlGenerator();
    // 其他数据库类型
    default:
      return new MySqlGenerator(); // 默认使用MySQL
  }
}

// 生成表SQL的通用接口
export const getCreateTableSql = (entity, dataSource, dbType) => {
  // 根据数据库类型选择SQL生成器
  const sqlGenerator = getSqlGenerator(dbType);
  return sqlGenerator.createTable(entity, dataSource);
};

// 生成索引SQL的通用接口
export const getCreateIndexSql = (entity, dataSource, dbType) => {
  const sqlGenerator = getSqlGenerator(dbType);
  return sqlGenerator.createIndex(entity, dataSource);
};
```

#### 3.2.3 数据类型的度量计算

不同数据库对字段长度、精度的处理方式不同，因此需要专门的处理：

```javascript
/**
 * 计算类型的度量，长度,精度
 * 初衷：各个数据库类型和写法的不一致也能在逆向解析中成功识别到domain
 * @param {String} len - 字段长度
 * @param {String} scale - 字段精度
 * @returns (长度[,精度]) 或者 ''
 */
const calcMeasure = (len = '', scale = '') => {
  if (!len) {
    return '';
  }
  if (!scale) {
    return `(${len})`;
  }
  return `(${len},${scale})`;
};
```

### 3.3 SQL模板机制

PDManer实现了一套灵活的SQL模板机制，允许用户自定义SQL生成规则，适应不同的项目需求。

#### 3.3.1 模板定义结构

模板定义在项目配置的`codeTemplates`数组中：

```javascript
"codeTemplates": [
  {
    "applyFor": "MYSQL",
    "type": "dbDDL",
    "createTable": "DROP TABLE IF EXISTS `{{=it.entity.defKey}}`;\n\nCREATE TABLE `{{=it.entity.defKey}}` (\n{{~it.entity.fields:field:index}}\n  `{{=field.defKey}}` {{=field.type}}{{? field.len>0}}({{=field.len}}{{? field.scale>0}},{{=field.scale}}{{?}}){{?}}{{? field.notNull}} NOT NULL{{?}}{{? field.autoIncrement}} AUTO_INCREMENT{{?}}{{? field.defaultValue}} DEFAULT {{=field.defaultValue}}{{?}}{{? field.comment}} COMMENT '{{=field.comment}}'{{?}}{{? index<it.entity.fields.length-1}},{{?}}\n{{~}}\n{{? it.entity.indexes.length>0}},\n{{~it.entity.indexes:index}}\n  {{? index.isUnique}}UNIQUE {{?}}KEY {{? index.defKey}}`{{=index.defKey}}`{{?}} ({{~index.fields:field:i}}`{{=field.fieldDefKey}}`{{? i<index.fields.length-1}}, {{?}}{{~}}){{? index.comment}} COMMENT '{{=index.comment}}'{{?}}{{? index<it.entity.indexes.length-1}},\n{{?}}\n{{~}}\n{{?}}\n) COMMENT = '{{=it.entity.defName}}'{{=it.separator}}\n\n",
    "createIndex": "",
    "deleteTable": "DROP TABLE IF EXISTS `{{=it.entity.defKey}}`{{=it.separator}}",
    "deleteIndex": ""
  },
  {
    "applyFor": "ORACLE",
    "type": "dbDDL",
    "createTable": "CREATE TABLE \"{{=it.entity.defKey}}\" (\n{{~it.entity.fields:field:index}}\n  \"{{=field.defKey}}\" {{=field.type}}{{? field.len>0}}({{=field.len}}{{? field.scale>0}},{{=field.scale}}{{?}}){{?}}{{? field.notNull}} NOT NULL{{?}}{{? field.defaultValue}} DEFAULT {{=field.defaultValue}}{{?}}{{? index<it.entity.fields.length-1}},{{?}}\n{{~}}\n){{=it.separator}}\n\n{{~it.entity.fields:field}}\n{{? field.comment}}COMMENT ON COLUMN \"{{=it.entity.defKey}}\".\"{{=field.defKey}}\" IS '{{=field.comment}}'{{=it.separator}}{{?}}\n{{~}}\n\n{{? it.entity.comment}}COMMENT ON TABLE \"{{=it.entity.defKey}}\" IS '{{=it.entity.comment}}'{{=it.separator}}{{?}}\n",
    "createIndex": "{{~it.entity.indexes:index}}\nCREATE{{? index.isUnique}} UNIQUE{{?}} INDEX \"{{=index.defKey}}\" ON \"{{=it.entity.defKey}}\" ({{~index.fields:field:i}}\"{{=field.fieldDefKey}}\"{{? i<index.fields.length-1}}, {{?}}{{~}}){{=it.separator}}\n{{~}}",
    "deleteTable": "DROP TABLE \"{{=it.entity.defKey}}\"{{=it.separator}}",
    "deleteIndex": "{{~it.entity.indexes:index}}\nDROP INDEX \"{{=index.defKey}}\"{{=it.separator}}\n{{~}}"
  }
]
```

#### 3.3.2 模板变量和语法

PDManer使用doT.js模板引擎，支持以下语法：

- `{{=variable}}`: 输出变量值
- `{{? condition}}...{{?}}`: 条件判断
- `{{~ array:item:index}}...{{~}}`: 循环迭代

模板中可用的上下文变量包括：

- `it.entity`: 当前实体对象
- `it.separator`: SQL语句分隔符
- `it.func`: 工具函数集合

#### 3.3.3 SQL模板自定义

用户可以通过PDManer界面定制SQL模板：

```javascript
// 字典SQL模板示例
{
  "type": "dbDDL",
  "applyFor": "dictSQLTemplate",
  "content": "/* 插入字典总表[{{=it.dict.defKey}}-{{=it.dict.defName}}] */\nINSERT INTO SYS_DICT(KEY_,LABEL,INTRO,REVISION) VALUES('{{=it.dict.defKey}}','{{=it.dict.defName}}','{{=it.dict.intro}}',1);\n/* 插入字典明细表 */\n{{~it.dict.items:item:index}}\nINSERT INTO SYS_DICT_ITEM(DICT_KEY,KEY_,LABEL,SORT_,INTRO,REVISION) VALUES('{{=it.dict.defKey}}','{{=item.defKey}}','{{=item.defName}}','{{=item.sort}}','{{=item.intro}}',1);\n{{~}}"
}
```

#### 3.3.4 模板在项目中的使用

在PDMan项目格式导入时，会将原模板转换为PDManer格式：

```javascript
export const pdman2sino = (data, projectName) => {
  // ...省略其他代码
  
  return {
    // ...省略其他属性
    
    profile: {
      // ...省略其他属性
      
      codeTemplates: database.map(d => {
        if (d.code.toLocaleUpperCase() === 'JAVA') {
          return {
            applyFor: 'JAVA',
            referURL: '',
            type: 'appCode',
            content : d.createTableTemplate || d.template
          };
        } else {
          return {
            applyFor: d.code,
            referURL: '',
            type: 'dbDDL',
            createTable: d.createTableTemplate || d.template,
            createIndex: d.createIndexTemplate || '',
          };
        }
      }),
    }
  };
};
```

## 4. 数据导入导出实现

PDManer提供了丰富的数据导入导出功能，支持从多种来源导入数据模型，并能将模型导出为多种格式。

### 4.1 PDMan数据导入

PDManer支持从旧版PDMan项目导入数据，实现了完整的数据格式转换。

#### 4.1.1 PDMan数据导入流程

PDMan数据导入的核心实现在`src/lib/datasource_util.js`中的`pdman2sino`函数：

```javascript
export const pdman2sino = (data, projectName) => {
  // 获取默认数据库类型
  const defaultDbType = _.get(data, 'profile.defaultDb.type', _.get(data, 'profile.dbs[0].type', 'MYSQL'));
  const defaultDb = _.get(data, 'profile.dbs', []).filter(db => db.type === defaultDbType)[0];
  
  // 获取数据类型映射
  const dataTypeSupports = [];
  const mappings = [];
  const domains = [];
  
  // 处理数据库类型支持
  const database = _.get(data, 'profile.dbs', []);
  database.forEach((db) => {
    const id = Math.uuid();
    dataTypeSupports.push({
      id,
      defKey: db.type,
    });
  });
  
  // 处理数据类型映射
  const datatype = _.get(data, 'dataTypeDomains.datatype', []);
  datatype.forEach((type) => {
    const id = Math.uuid();
    const mapping = {
      id,
      defKey: type.code,
      defName: type.name,
    };
    
    // 为每种数据库类型添加映射
    database.forEach((db) => {
      const apply = type.apply[db.type];
      if (apply) {
        const dbId = dataTypeSupports.filter(s => s.defKey === db.type)[0]?.id;
        if (dbId) {
          mapping[dbId] = apply.type;
        }
      }
    });
    
    mappings.push(mapping);
  });
  
  // 处理数据域
  const domainData = _.get(data, 'dataTypeDomains.domains', []);
  domainData.forEach((d) => {
    const applyFor = mappings.filter(m => m.defKey === d.applyFor)[0]?.id;
    if (applyFor) {
      domains.push({
        id: Math.uuid(),
        defKey: d.code,
        defName: d.name,
        applyFor,
        len: d.len || '',
        scale: d.scale || '',
      });
    }
  });
  
  // 处理实体和关系
  const entities = [];
  const diagrams = [];
  const viewGroups = [];
  
  // 处理模块和表
  const modules = _.get(data, 'modules', []);
  modules.forEach((m) => {
    const group = {
      id: Math.uuid(),
      defKey: m.name,
      defName: m.chnname || m.name,
      refEntities: [],
      refDiagrams: [],
      refViews: [],
      refDicts: [],
    };
    
    // 处理模块中的实体
    const entities = _.get(m, 'entities', []);
    entities.forEach((e) => {
      const entity = {
        id: Math.uuid(),
        defKey: e.title,
        defName: e.chnname || e.title,
        comment: e.chnname || '',
        fields: [],
        indexes: [],
      };
      
      // 处理字段
      const fields = _.get(e, 'fields', []);
      fields.forEach((f) => {
        const field = {
          id: Math.uuid(),
          defKey: f.name,
          defName: f.chnname || f.name,
          comment: f.remark || '',
          type: f.type,
          len: f.len || '',
          scale: f.scale || '',
          primaryKey: f.pk,
          notNull: f.notNull,
          autoIncrement: f.autoIncrement,
          defaultValue: f.defaultValue,
        };
        
        entity.fields.push(field);
      });
      
      // 处理索引
      const indexes = _.get(e, 'indexes', []);
      indexes.forEach((i) => {
        const index = {
          id: Math.uuid(),
          defKey: i.name,
          defName: i.name,
          comment: i.comment || '',
          isUnique: i.isUnique,
          fields: [],
        };
        
        // 处理索引字段
        const indexFields = _.get(i, 'fields', []);
        indexFields.forEach((f) => {
          const fieldId = entity.fields.filter(field => field.defKey === f.fieldName)[0]?.id;
          if (fieldId) {
            index.fields.push({
              fieldDefKey: fieldId,
              ascOrDesc: f.ascOrDesc || 'A',
            });
          }
        });
        
        entity.indexes.push(index);
      });
      
      entities.push(entity);
      group.refEntities.push(entity.id);
    });
    
    // 处理关系图
    const graphCanvas = _.get(m, 'graphCanvas', {});
    const cells = _.get(graphCanvas, 'cells', []);
    if (cells.length > 0) {
      const diagram = {
        id: Math.uuid(),
        defKey: `${m.name}_DIAGRAM`,
        defName: `${m.chnname || m.name} 关系图`,
        canvasData: {
          cells,
        },
      };
      
      diagrams.push(diagram);
      group.refDiagrams.push(diagram.id);
    }
    
    viewGroups.push(group);
  });
  
  // 返回转换后的数据
  return {
    name: projectName || _.get(data, 'name', '未命名项目'),
    describe: '',
    avatar: '',
    version: '3.0.0',
    createdTime: moment().format('YYYY-M-D HH:mm:ss'),
    updatedTime: '',
    dbConns: _.get(data, 'profile.dbs', [])
      .map(conn => ({
        ..._.omit(conn, ['defaultDB', 'name']),
        defKey: conn.name || Math.uuid(),
        defName: conn.name || '',
      })),
    profile: {
      default: {
        db: defaultDb?.type || defaultDbType,
        dbConn: defaultDb?.name || '',
        entityInitFields: _.get(data, 'profile.defaultFields', [])
          .map(f => fieldsTransform(f, domains, mappings, defaultDb?.type || defaultDbType)),
      },
      javaHome: _.get(data, 'profile.javaConfig.JAVA_HOME', ''),
      sql: { delimiter: _.get(data, 'profile.sqlConfig', '') },
      dataTypeSupports,
      codeTemplates: database.map(d => {
        if (d.code.toLocaleUpperCase() === 'JAVA') {
          return {
            applyFor: 'JAVA',
            referURL: '',
            type: 'appCode',
            content : d.createTableTemplate || d.template
          };
        } else {
          return {
            applyFor: d.code,
            referURL: '',
            type: 'dbDDL',
            createTable: d.createTableTemplate || d.template,
            createIndex: d.createIndexTemplate || '',
          };
        }
      }),
      generatorDoc: {
        docTemplate: _.get(data, 'profile.wordTemplateConfig', ''),
      }
    },
    entities,
    diagrams,
    viewGroups,
    dicts: [],
    dataTypeMapping: {
      referURL: '',
      mappings,
    },
    domains,
  };
};
```

#### 4.1.2 数据库逆向导入

PDManer支持从现有数据库导入模型，实现在`src/app/main/index.js`中：

```javascript
const importFromDb = () => {
  // 判断是否已经存在数据库连接
  const dbConn = dataSourceRef.current?.dbConn || [];
  if (dbConn.length === 0) {
    Modal.error({
      title: FormatMessage.string({id: 'optFail'}),
      message: FormatMessage.string({id: 'dbReverseParse.emptyDbConn'}),
    });
  } else {
    let modal;
    const onClose = () => {
      modal && modal.close();
    };
    const onOk = (data, dbKey) => {
      restProps.openLoading();
      mergeDataSource(dataSourceRef.current, {},
          calcDomain(data, dbKey, dataSourceRef.current.domains || []), true, (d) => {
            if(d) {
              injectDataSource(d, modal);
            } else {
              modal?.close();
            }
            restProps.closeLoading();
          });
    };
    modal = openModal(<DbReverseParse
      openLoading={restProps.openLoading}
      closeLoading={restProps.closeLoading}
      config={configRef.current}
      onOk={onOk}
      onClose={onClose}
      dataSource={dataSourceRef.current}
    />, {
      closeable: false,
      title: FormatMessage.string({id: 'toolbar.importDb'}),
      bodyStyle: { width: '80%' },
    });
  }
};
```

### 4.2 Excel/Word导出

PDManer支持将数据模型导出为Excel和Word文档，方便用户进行文档化和共享。

#### 4.2.1 Excel导出实现

Excel导出功能通过调用后端服务实现：

```javascript
const exportExcel = () => {
  selectDir(dataSourceRef.current.name, 'xlsx')
    .then((file) => {
      restProps.openLoading(FormatMessage.string({id: 'toolbar.exportExcel'}));
      connectDB(dataSourceRef.current, configRef.current, {
        sinerFile: projectInfo,
        outFile: file,
      }, 'GenExcelImpl', (result) => {
        dealExportFile(result, file);
      });
    });
};
```

#### 4.2.2 Word导出实现

Word导出支持模板定制，用户可以选择不同的模板格式：

```javascript
const exportWord = () => {
  openModal(<ExportWord
    save={restProps.save}
    projectInfo={projectInfoRef.current}
    dataSource={dataSourceRef.current}
    onOk={(t, filterDataSource) => {
      selectWordFile(dataSourceRef.current, t)
        .then(([dir, template]) => {
          genImg(false, [], 'png').then((imgDir) => {
            restProps.openLoading(FormatMessage.string({id: 'toolbar.exportWordStep2'}));
            connectDB(filterDataSource || dataSourceRef.current, configRef.current, {
              sinerFile: projectInfo,
              docxTpl: template,
              imgDir: imgDir,
              imgExt: '.png',
              outFile: dir,
            }, 'GenDocx', (result) => {
              dealExportFile(result, dir);
            });
          });
        });
    }}/>, {
    bodyStyle: { width: '70%' },
    title: FormatMessage.string({id: 'toolbar.exportWord'}),
  });
};
```

#### 4.2.3 导出结果处理

导出完成后的结果处理：

```javascript
const dealExportFile = (result, file) => {
  if (result.status === 'FAILED') {
    const termReady = (term) => {
      term.write(typeof result.body === 'object' ? JSON.stringify(result.body, null, 2)
          : result.body);
    };
    restProps.closeLoading();
    Modal.error({
      bodyStyle: {width: '80%'},
      contentStyle: {width: '100%', height: '100%'},
      title: FormatMessage.string({id: 'optFail'}),
      message: <div>
        <div style={{textAlign: 'center'}}><FormatMessage id='dbConnect.log'/><a onClick={showItemInFolder}>{getLogPath()}</a></div>
        <Terminal termReady={termReady}/>
      </div>,
    });
  } else {
    restProps.closeLoading();
    Modal.success({
      title: FormatMessage.string({
        id: 'toolbar.exportSuccess',
      }),
      message: FormatMessage.string({
        id: 'toolbar.exportPath',
        data: {path: file},
      }),
    });
  }
};
```

### 4.3 实体图导出

PDManer支持将实体关系图导出为图片格式，方便用户进行分享和展示。

#### 4.3.1 图片导出实现

图片导出功能在`src/app/main/index.js`中实现：

```javascript
const exportImg = (type) => {
  const cavRef = getCurrentCav();
  cavRef.exportImg(type);
};
```

#### 4.3.2 HTML/Markdown文档导出

PDManer还支持将模型导出为HTML或Markdown格式的文档：

```javascript
export const generateFile = (fileType, dataSource, imgCallBack) => {
  // 生成各类文件的总入口
  // 分析所有分组数据，需要创建空白分组来存储未分组数据（默认空白分组置于最后）
  const tempViewGroups = (dataSource?.viewGroups || []);
  const getNoGroupData = (name, groupName) => {
    const currentGroup = tempViewGroups
        .reduce((a, b) => a.concat(b[groupName]), [])
    return dataSource[name].filter(d => !currentGroup.includes(d.id)).map(d => d.id);
  };
  const tempGroup = {
    defKey: '__defaultGroup',
    id: '__defaultGroup',
    defName: FormatMessage.string({id: 'exportSql.defaultGroup'}),
    refEntities: getNoGroupData('entities', 'refEntities'),
    refViews: getNoGroupData('views', 'refViews'),
    refDiagrams: getNoGroupData('diagrams', 'refDiagrams'),
    refDicts: getNoGroupData('dicts', 'refDicts'),
  };
  const tempDataSource = {
    ...dataSource,
    viewGroups: tempViewGroups.concat(tempGroup),
  };
  imgCallBack((images) => {
    const name = tempDataSource.name;
    new Promise((res) => {
      if (fileType === 'html'){
        html(tempDataSource, images, name, (htmlString) => {
          res({
            data: htmlString,
            file: 'html',
          });
        });
      } else if (fileType === 'markdown') {
        markdown(tempDataSource, images, name, (markString) => {
          res({
            data: markString,
            file: 'md',
          });
        });
      }
    }).then(({data, file}) => {
      Download(
          [data],
          '', `${name}-${moment().format('YYYYMDHHmmss')}.${file}`);
    });
  });
};
```

#### 4.3.3 配置导出

PDManer支持导出项目配置和数据字典：

```javascript
const exportConfig = () => {
  let data = {
    ..._.pick(dataSourceRef.current, configFields),
    dictSQLTemplate: _.get(dataSourceRef.current, 'profile.codeTemplates', [])
      .filter(t => t.applyFor === 'dictSQLTemplate' && t.type === 'dbDDL')[0],
  };
  data = _.set(data, configFields[0], _.get(data, configFields[0], [])
    .map(d => reset(d, dataSourceRef.current, ['id', 'defKey'])));
  Download(
    [JSON.stringify(data, null, 2)],
    'application/json',
    `${dataSourceRef.current.name}-${FormatMessage.string({id: 'toolbar.setting'})}-${moment().format('YYYYMDHHmmss')}.json`);
};

const exportDicts = () => {
  let data = {
    dicts: dataSourceRef.current.dicts || [],
  };
  Download(
      [JSON.stringify(data, null, 2)],
      'application/json',
      `${dataSourceRef.current.name}-${FormatMessage.string({id: 'toolbar.dicts'})}-${moment().format('YYYYMDHHmmss')}.json`);
};
```

## 5. 数据类型系统

PDManer实现了一套灵活的数据类型系统，支持跨数据库的类型映射、自定义数据类型和数据域定义，为数据模型设计提供了强大的支持。

### 5.1 数据类型映射机制

数据类型映射是PDManer的核心功能之一，它允许在不同数据库之间进行类型转换，确保模型可以适配多种数据库环境。

#### 5.1.1 数据类型映射结构

数据类型映射定义在项目的`dataTypeMapping`属性中：

```javascript
"dataTypeMapping": {
  "referURL": "",
  "mappings": [
    {
      "defKey": "string",
      "id": "FC9790A7-36B8-4A48-8F9A-BC1042BCFE64",
      "defName": "字串",
      "29D1CE08-4C35-4D2D-AAA9-23D93305B52E": "VARCHAR",  // MySQL
      "A4E23CB7-BB01-4BD1-9F71-F73F3E15A542": "VARCHAR2", // Oracle
      "BFC87171-C74F-494A-B7C2-76B9C55FACC9": "VARCHAR",  // SQL Server
      "DFBEC1DD-AA84-456E-BBF3-C95DD0DB2022": "VARCHAR",  // PostgreSQL
      "89504F5D-94BF-4C9E-8B2E-44F37305FED5": "VARCHAR",  // DB2
      "0BBCABA5-B8E4-41B0-B8E4-8F5EA6029307": "VARCHAR2", // DM
      "797A1496-D649-4261-89B4-544132EC3F36": "String",   // Java
      "F3AC2415-E86B-40C6-9FEB-F4B7937D2C30": "string",   // C#
      "81CCA482-3F4D-4EAC-8CF9-F5E7BC098AD2": "string"    // Hive
    },
    {
      "defKey": "int",
      "id": "B99FD7E2-D2E9-4A2B-8C4A-9A7CD62B9A3F",
      "defName": "整数",
      "29D1CE08-4C35-4D2D-AAA9-23D93305B52E": "INT",
      "A4E23CB7-BB01-4BD1-9F71-F73F3E15A542": "NUMBER",
      "BFC87171-C74F-494A-B7C2-76B9C55FACC9": "INT",
      "DFBEC1DD-AA84-456E-BBF3-C95DD0DB2022": "INTEGER",
      "89504F5D-94BF-4C9E-8B2E-44F37305FED5": "INTEGER",
      "0BBCABA5-B8E4-41B0-B8E4-8F5EA6029307": "INTEGER",
      "797A1496-D649-4261-89B4-544132EC3F36": "Integer",
      "F3AC2415-E86B-40C6-9FEB-F4B7937D2C30": "int",
      "81CCA482-3F4D-4EAC-8CF9-F5E7BC098AD2": "int"
    }
  ]
}
```

每个映射项包含：
- `defKey`: 类型的键名
- `defName`: 类型的显示名称
- `id`: 唯一标识符
- 其他属性: 每个数据库类型的映射值，键为数据库类型的ID

#### 5.1.2 类型映射的使用

在生成SQL或代码时，PDManer会根据目标数据库类型选择对应的映射：

```javascript
// 获取字段的数据库类型
export const getFieldType = (field, dataSource, dbType) => {
  // 获取数据类型映射
  const mappings = _.get(dataSource, 'dataTypeMapping.mappings', []);
  const dataTypeSupports = _.get(dataSource, 'profile.dataTypeSupports', []);
  
  // 获取当前数据库类型的ID
  const dbTypeId = dataTypeSupports.filter(s => s.defKey === dbType)[0]?.id;
  
  if (!dbTypeId) {
    return field.type; // 如果找不到映射，返回原始类型
  }
  
  // 查找映射
  const mapping = mappings.filter(m => m.defKey === field.type)[0];
  
  if (!mapping) {
    return field.type; // 如果找不到映射，返回原始类型
  }
  
  // 返回映射后的类型
  return mapping[dbTypeId] || field.type;
};
```

#### 5.1.3 类型映射的动态更新

用户可以通过界面修改类型映射，这些修改会保存到项目文件中：

```javascript
// 更新数据类型映射
export const updateDataTypeMapping = (dataSource, mapping) => {
  const mappings = _.get(dataSource, 'dataTypeMapping.mappings', []);
  const index = mappings.findIndex(m => m.id === mapping.id);
  
  if (index >= 0) {
    // 更新现有映射
    mappings[index] = mapping;
  } else {
    // 添加新映射
    mappings.push(mapping);
  }
  
  return {
    ...dataSource,
    dataTypeMapping: {
      ...dataSource.dataTypeMapping,
      mappings,
    },
  };
};
```

### 5.2 自定义数据类型

PDManer允许用户定义自己的数据类型，以满足特定项目的需求。

#### 5.2.1 自定义类型的创建

用户可以通过界面创建新的数据类型：

```javascript
// 创建新的数据类型
export const createDataType = (dataSource, dataType) => {
  const mappings = _.get(dataSource, 'dataTypeMapping.mappings', []);
  
  // 生成唯一ID
  const id = Math.uuid();
  
  // 创建新的映射
  const newMapping = {
    id,
    defKey: dataType.defKey,
    defName: dataType.defName,
    ...dataType.mappings,
  };
  
  // 添加到映射列表
  mappings.push(newMapping);
  
  return {
    ...dataSource,
    dataTypeMapping: {
      ...dataSource.dataTypeMapping,
      mappings,
    },
  };
};
```

#### 5.2.2 自定义类型的使用

自定义类型可以像内置类型一样在实体字段中使用：

```javascript
// 在字段中使用自定义类型
const field = {
  id: Math.uuid(),
  defKey: 'custom_field',
  defName: '自定义字段',
  type: 'custom_type', // 自定义类型的defKey
  len: 50,
  scale: 0,
  primaryKey: false,
  notNull: true,
  autoIncrement: false,
  defaultValue: '',
  comment: '使用自定义类型的字段',
};
```

#### 5.2.3 自定义类型的导入导出

自定义类型可以随项目配置一起导出和导入：

```javascript
const exportDataTypes = () => {
  const data = {
    dataTypeMapping: dataSourceRef.current.dataTypeMapping || {},
  };
  
  Download(
    [JSON.stringify(data, null, 2)],
    'application/json',
    `${dataSourceRef.current.name}-DataTypes-${moment().format('YYYYMDHHmmss')}.json`);
};

const importDataTypes = () => {
  Upload('application/json', (d) => {
    const data = JSON.parse(d);
    if (!data.dataTypeMapping) {
      Modal.error({
        title: FormatMessage.string({id: 'optFail'}),
        message: FormatMessage.string({id: 'invalidDataTypeFile'}),
      });
    } else {
      // 合并数据类型
      const currentMappings = _.get(dataSourceRef.current, 'dataTypeMapping.mappings', []);
      const newMappings = _.get(data, 'dataTypeMapping.mappings', []);
      
      // 合并映射，避免重复
      const mergedMappings = [...currentMappings];
      newMappings.forEach((newMapping) => {
        const index = mergedMappings.findIndex(m => m.defKey === newMapping.defKey);
        if (index >= 0) {
          // 更新现有映射
          mergedMappings[index] = {
            ...mergedMappings[index],
            ...newMapping,
          };
        } else {
          // 添加新映射
          mergedMappings.push(newMapping);
        }
      });
      
      // 更新数据源
      restProps?.update({
        ...dataSourceRef.current,
        dataTypeMapping: {
          ...dataSourceRef.current.dataTypeMapping,
          mappings: mergedMappings,
        },
      });
      
      Message.success({title: FormatMessage.string({id: 'optSuccess'})});
    }
  });
};
```

### 5.3 数据域实现

数据域是PDManer中的一个重要概念，它允许用户定义具有特定属性的数据类型模板，可以在多个字段中重用。

#### 5.3.1 数据域结构

数据域定义在项目的`domains`数组中：

```javascript
"domains": [
  {
    "defKey": "Name",
    "defName": "名称",
    "applyFor": "FC9790A7-36B8-4A48-8F9A-BC1042BCFE64", // string类型的ID
    "len": "50",
    "scale": "",
    "uiHint": "",
    "id": "7B9B6542-AF3A-4CC0-A0E5-3A6A9E8E7F5A"
  },
  {
    "defKey": "Code",
    "defName": "代码",
    "applyFor": "FC9790A7-36B8-4A48-8F9A-BC1042BCFE64", // string类型的ID
    "len": "20",
    "scale": "",
    "uiHint": "",
    "id": "D941B3F3-A7CB-4AAE-8E3E-A5E1C340A3C5"
  },
  {
    "defKey": "Dict",
    "defName": "数据字典",
    "applyFor": "FC9790A7-36B8-4A48-8F9A-BC1042BCFE64", // string类型的ID
    "len": "32",
    "scale": "",
    "uiHint": "",
    "id": "73FD2BAD-2358-4336-B96D-45DC897BD792"
  }
]
```

每个数据域包含：
- `defKey`: 数据域的键名
- `defName`: 数据域的显示名称
- `applyFor`: 适用的基础类型ID
- `len`: 长度
- `scale`: 小数位
- `uiHint`: UI提示信息
- `id`: 唯一标识符

#### 5.3.2 数据域的使用

在创建字段时，可以选择应用数据域：

```javascript
// 应用数据域创建字段
export const applyDomain = (field, domain, dataSource) => {
  // 获取数据类型映射
  const mappings = _.get(dataSource, 'dataTypeMapping.mappings', []);
  
  // 查找数据域对应的基础类型
  const baseType = mappings.filter(m => m.id === domain.applyFor)[0]?.defKey || '';
  
  // 应用数据域属性
  return {
    ...field,
    type: baseType,
    domain: domain.id, // 记录使用的数据域ID
    len: domain.len,
    scale: domain.scale,
  };
};
```

#### 5.3.3 数据域的管理

PDManer提供了完整的数据域管理功能：

```javascript
// 创建数据域
export const createDomain = (dataSource, domain) => {
  const domains = [...(dataSource.domains || [])];
  
  // 生成唯一ID
  const id = Math.uuid();
  
  // 创建新的数据域
  const newDomain = {
    id,
    defKey: domain.defKey,
    defName: domain.defName,
    applyFor: domain.applyFor,
    len: domain.len || '',
    scale: domain.scale || '',
    uiHint: domain.uiHint || '',
  };
  
  // 添加到数据域列表
  domains.push(newDomain);
  
  return {
    ...dataSource,
    domains,
  };
};

// 更新数据域
export const updateDomain = (dataSource, domain) => {
  const domains = [...(dataSource.domains || [])];
  const index = domains.findIndex(d => d.id === domain.id);
  
  if (index >= 0) {
    // 更新现有数据域
    domains[index] = domain;
  }
  
  return {
    ...dataSource,
    domains,
  };
};

// 删除数据域
export const deleteDomain = (dataSource, domainId) => {
  const domains = (dataSource.domains || []).filter(d => d.id !== domainId);
  
  // 同时需要更新使用该数据域的字段
  const entities = (dataSource.entities || []).map(entity => {
    const fields = (entity.fields || []).map(field => {
      if (field.domain === domainId) {
        // 移除数据域引用，但保留其他属性
        return {
          ...field,
          domain: '',
        };
      }
      return field;
    });
    
    return {
      ...entity,
      fields,
    };
  });
  
  return {
    ...dataSource,
    domains,
    entities,
  };
};
```

#### 5.3.4 数据库逆向解析中的数据域识别

在从数据库导入模型时，PDManer会尝试识别字段是否符合已定义的数据域：

```javascript
/**
 * 计算数据域
 * @param {Object} data - 从数据库导入的数据
 * @param {String} dbKey - 数据库类型
 * @param {Array} domains - 现有数据域列表
 * @returns {Object} 处理后的数据
 */
export const calcDomain = (data, dbKey, domains) => {
  // 获取数据库类型ID
  const dbTypeId = getDbTypeId(dbKey);
  
  // 处理实体
  const entities = (data.entities || []).map(entity => {
    // 处理字段
    const fields = (entity.fields || []).map(field => {
      // 尝试匹配数据域
      const matchedDomain = findMatchingDomain(field, domains, dbTypeId);
      
      if (matchedDomain) {
        // 应用匹配的数据域
        return {
          ...field,
          domain: matchedDomain.id,
        };
      }
      
      return field;
    });
    
    return {
      ...entity,
      fields,
    };
  });
  
  return {
    ...data,
    entities,
  };
};

/**
 * 查找匹配的数据域
 * @param {Object} field - 字段信息
 * @param {Array} domains - 数据域列表
 * @param {String} dbTypeId - 数据库类型ID
 * @returns {Object|null} 匹配的数据域或null
 */
const findMatchingDomain = (field, domains, dbTypeId) => {
  // 根据类型、长度、精度等属性匹配数据域
  return domains.find(domain => {
    // 获取数据域对应的数据库类型
    const domainDbType = getDomainDbType(domain, dbTypeId);
    
    // 检查类型是否匹配
    if (domainDbType !== field.type) {
      return false;
    }
    
    // 检查长度是否匹配
    if (domain.len && field.len && domain.len !== field.len) {
      return false;
    }
    
    // 检查精度是否匹配
    if (domain.scale && field.scale && domain.scale !== field.scale) {
      return false;
    }
    
    return true;
  }) || null;
};
```
