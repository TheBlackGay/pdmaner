# PDManer数据结构详解

## 1. 项目数据结构

### 1.1 整体数据结构

PDManer项目文件采用JSON格式存储，扩展名为`.pdma.json`。项目的整体数据结构由以下主要部分组成：

```javascript
{
  "name": String,              // 项目名称
  "type": String,              // 项目类型，通常为"JAVA"或其他支持的语言类型
  "defaultDb": String,         // 默认数据库类型，如"MYSQL"、"ORACLE"等
  "profile": {                 // 项目配置信息
    "defaultFields": Array,    // 默认字段配置
    "javaHome": String,        // Java主目录
    "sqlPath": String,         // SQL文件路径
    "sqlConfig": Object        // SQL生成配置
  },
  "entities": Array,           // 实体列表
  "diagrams": Array,           // 关系图列表
  "dicts": Array,              // 数据字典列表
  "domains": Array,            // 数据域列表
  "dataTypeMapping": Object,   // 数据类型映射配置
  "viewGroups": Array,         // 视图分组
  "version": String            // 项目版本号
}
```

项目整体结构设计遵循数据库设计的基本概念，将数据模型的各个方面（实体、关系、类型映射等）组织成结构化的JSON对象，便于存储和操作。

### 1.2 实体(Entity)数据结构

实体是PDManer中最基本的数据建模单元，代表数据库中的表。每个实体的数据结构如下：

```javascript
{
  "id": String,             // 唯一标识符，通常为UUID
  "defKey": String,         // 实体键名，用于代码和SQL生成中
  "defName": String,        // 实体显示名称
  "comment": String,        // 实体注释/描述
  "fields": [               // 字段列表
    {
      "id": String,         // 字段ID
      "defKey": String,     // 字段键名 
      "defName": String,    // 字段显示名称
      "comment": String,    // 字段注释
      "type": String,       // 字段数据类型
      "len": Number,        // 长度
      "scale": Number,      // 小数位数
      "primaryKey": Boolean,// 是否为主键
      "notNull": Boolean,   // 是否非空
      "autoIncrement": Boolean, // 是否自增
      "defaultValue": String,   // 默认值
      "hideInGraph": Boolean,   // 在图表中隐藏
      "refDict": String,        // 引用的数据字典
      "domain": String,         // 引用的数据域
      "uiHint": String          // UI提示
    }
  ],
  "indexes": [              // 索引列表
    {
      "id": String,         // 索引ID
      "defKey": String,     // 索引键名
      "name": String,       // 索引名称
      "comment": String,    // 索引注释
      "isUnique": Boolean,  // 是否唯一索引
      "fields": Array       // 索引包含的字段
    }
  ],
  "relations": [            // 关系列表（实体关系）
    {
      "id": String,         // 关系ID
      "type": String,       // 关系类型（1对1、1对多等）
      "source": {           // 源实体信息
        "entityId": String, // 源实体ID
        "fieldId": String   // 源字段ID
      },
      "target": {           // 目标实体信息
        "entityId": String, // 目标实体ID
        "fieldId": String   // 目标字段ID
      },
      "relationmentId": String // 关系标识ID
    }
  ],
  "graphConfig": {          // 图形配置信息
    "x": Number,            // X坐标位置
    "y": Number,            // Y坐标位置
    "width": Number,        // 宽度
    "height": Number        // 高度
  }
}
```

实体数据结构设计详细记录了表的各个方面，从基本信息（名称、注释）到字段定义、索引配置和关系映射，甚至包括在ER图中的视觉表示信息。

### 1.3 关系图(Diagram)数据结构

关系图用于可视化展示实体之间的关系，其数据结构如下：

```javascript
{
  "id": String,           // 关系图ID
  "defKey": String,       // 关系图键名
  "defName": String,      // 关系图显示名称
  "comment": String,      // 关系图注释
  "canvasData": {         // 画布数据
    "cells": [            // 细胞（节点和边）列表
      {
        "id": String,     // 单元格ID
        "shape": String,  // 形状类型（如"table"、"edge"等）
        "position": {     // 位置信息
          "x": Number,
          "y": Number
        },
        "size": {         // 大小信息
          "width": Number,
          "height": Number
        },
        "ports": Array,   // 连接点信息
        "data": {         // 节点数据（实体引用等）
          "id": String,
          "defKey": String,
          // 其他实体相关信息
        },
        // 对于边（关系线）
        "source": {       // 源连接点
          "cell": String, // 源节点ID
          "port": String  // 源连接点ID
        },
        "target": {       // 目标连接点
          "cell": String, // 目标节点ID
          "port": String  // 目标连接点ID
        }
      }
    ]
  },
  "entityIds": Array,     // 包含的实体ID列表
  "associations": Array   // 关联关系
}
```

关系图数据结构主要基于@antv/x6图形库的数据模型，包含了节点（实体表）和边（关系）的完整定义，以便在画布上准确渲染数据模型的可视化表示。

### 1.4 数据字典(Dict)数据结构

数据字典用于定义和管理可重用的数据项集合，其数据结构如下：

```javascript
{
  "id": String,           // 数据字典ID
  "defKey": String,       // 数据字典键名
  "defName": String,      // 数据字典显示名称
  "comment": String,      // 数据字典注释
  "items": [              // 数据项列表
    {
      "id": String,       // 项ID
      "defKey": String,   // 项键名
      "defName": String,  // 项显示名称
      "comment": String,  // 项注释
      "value": String,    // 项值
      "parentKey": String // 父项键名（支持层级结构）
    }
  ],
  "groups": [             // 分组信息
    {
      "id": String,       // 分组ID
      "defKey": String,   // 分组键名
      "defName": String,  // 分组显示名称
      "items": Array      // 分组包含的项
    }
  ]
}
```

数据字典结构设计支持创建分层组织的代码表和枚举值，可用于字段值的约束和业务逻辑的定义。

### 1.5 数据域(Domain)数据结构

数据域是字段类型的模板，定义了可重用的字段类型配置，其数据结构如下：

```javascript
{
  "id": String,           // 数据域ID
  "defKey": String,       // 数据域键名
  "defName": String,      // 数据域显示名称
  "comment": String,      // 数据域注释
  "type": String,         // 数据类型
  "len": Number,          // 长度
  "scale": Number,        // 小数位数
  "defaultValue": String, // 默认值
  "notNull": Boolean,     // 是否非空
  "autoIncrement": Boolean, // 是否自增
  "uiHint": String,       // UI提示
  "refDict": String       // 引用的数据字典
}
```

数据域提供了一种定义字段模板的机制，使得在多个实体中可以一致地应用相同类型的字段定义，提高建模效率和一致性。

## 2. 配置数据结构

### 2.1 用户配置结构

用户配置存储个人偏好设置和历史记录，保存在用户目录下，其数据结构如下：

```javascript
{
  "language": String,     // 语言设置（如"zh-CN"、"en-US"）
  "style": {              // 界面样式配置
    "headColor": String,  // 标题栏颜色
    "bodyColor": String,  // 主体颜色
    "primary": String,    // 主色调
    "fontSize": Number    // 字体大小
  },
  "path": String,         // 默认路径
  "autoSave": Boolean,    // 是否自动保存
  "autoBackup": Boolean,  // 是否自动备份
  "history": [            // 历史记录
    {
      "path": String,     // 项目路径
      "name": String,     // 项目名称
      "date": Number,     // 访问日期（时间戳）
      "type": String,     // 项目类型
      "thumbnail": String // 缩略图（Base64字符串）
    }
  ],
  "validatePermissions": Boolean, // 是否验证权限
  "recentlyUsedDict": Array,      // 最近使用的数据字典
  "recentlyUsedDomain": Array,    // 最近使用的数据域
  "generatorTemplate": Object     // 代码生成模板配置
}
```

用户配置结构设计确保了个性化体验，同时保留了工作历史和使用偏好。

### 2.2 系统配置结构

系统配置用于定义应用级别的配置，包括默认设置和系统行为，其结构如下：

```javascript
{
  "defaultDb": String,     // 默认数据库类型
  "defaultLanguage": String, // 默认语言
  "maxHistoryCount": Number, // 最大历史记录数
  "logLevel": String,      // 日志级别（如"info"、"error"）
  "tempPath": String,      // 临时文件路径
  "autoCheckUpdate": Boolean, // 是否自动检查更新
  "updateServer": String,  // 更新服务器地址
  "templatePath": String,  // 模板路径
  "defaultCodePath": String, // 默认代码生成路径
  "codeTemplates": Array   // 代码模板配置
}
```

系统配置为应用提供了基础的运行环境参数，确保跨平台一致性和功能可用性。

### 2.3 数据类型映射结构

数据类型映射定义了不同数据库类型之间的转换规则，其结构如下：

```javascript
{
  "dataTypeMapping": {
    "MYSQL": {                // 数据库类型
      "INT": {                // 通用数据类型
        "type": "INT",        // 对应的数据库类型
        "defaultLen": 11,     // 默认长度
        "defaultScale": null, // 默认小数位数
        "check": function     // 验证函数
      },
      "VARCHAR": {
        "type": "VARCHAR",
        "defaultLen": 50,
        "defaultScale": null,
        "check": function
      },
      // 其他类型映射
    },
    "ORACLE": {
      // Oracle数据库的类型映射
    },
    "SQLSERVER": {
      // SQL Server数据库的类型映射
    }
    // 其他数据库类型
  }
}
```

数据类型映射配置了所有支持的数据库类型和对应的数据类型规则，使得模型可以在不同数据库平台间转换和部署。

## 3. 运行时数据结构

### 3.1 缓存数据结构

缓存数据用于临时存储和加速访问，避免重复计算，其结构如下：

```javascript
{
  "tabs": {              // 标签页缓存
    "tabId": {           // 标签页ID
      "data": Object,    // 缓存的数据
      "timestamp": Number// 缓存时间戳
    }
  },
  "entities": {          // 实体缓存
    "entityId": {        // 实体ID
      "data": Object,    // 实体数据
      "fields": Object,  // 字段索引
      "indexes": Object  // 索引索引
    }
  },
  "diagrams": {          // 关系图缓存
    "diagramId": {       // 关系图ID
      "cells": Object,   // 画布单元格缓存
      "positions": Object// 位置信息缓存
    }
  },
  "searchIndex": Object, // 搜索索引
  "tempData": Object     // 临时数据
}
```

缓存数据结构被设计为支持快速访问和操作，减少大型项目的加载和处理时间。

### 3.2 状态数据结构

状态数据用于跟踪应用运行状态和用户交互状态，其结构如下：

```javascript
{
  "config": {            // 配置状态
    "language": String,  // 当前语言
    "history": Array,    // 历史记录
    "style": Object      // 样式配置
  },
  "core": {              // 核心状态
    "data": Object,      // 当前项目数据
    "info": String,      // 项目信息
    "isDemoProject": Boolean, // 是否为演示项目
    "tabs": Array,       // 打开的标签页
    "currentTab": String,// 当前标签页
    "unsaved": Boolean   // 是否有未保存内容
  },
  "common": {            // 通用状态
    "loading": Boolean,  // 是否加载中
    "status": String,    // 应用状态
    "error": Object,     // 错误信息
    "modal": Object,     // 模态框信息
    "contextMenu": Object// 上下文菜单信息
  }
}
```

状态数据结构反映了Redux store的组织方式，管理应用的UI状态和业务逻辑状态。

### 3.3 临时数据结构

临时数据用于短期存储，如复制粘贴缓冲区、撤销重做栈等，其结构如下：

```javascript
{
  "clipboard": {         // 剪贴板数据
    "type": String,      // 数据类型（如"entity"、"field"）
    "data": Object       // 复制的数据
  },
  "undoStack": Array,    // 撤销栈
  "redoStack": Array,    // 重做栈
  "dragData": {          // 拖拽数据
    "type": String,      // 拖拽类型
    "sourceId": String,  // 源ID
    "data": Object       // 拖拽的数据
  },
  "tempModels": Object,  // 临时模型（未保存的更改）
  "searchResults": Array // 搜索结果
}
```

临时数据结构支持编辑操作和用户交互，提供数据的临时存储和状态追踪。

## 4. 文件格式规范

### 4.1 项目文件格式

PDManer项目文件使用JSON格式，文件扩展名为`.pdma.json`，遵循以下规范：

1. **文件编码**: 使用UTF-8编码
2. **数据结构**: 符合第1节中描述的项目数据结构
3. **命名约定**: 
   - 键名使用驼峰命名法（如：defKey, defName）
   - ID使用UUID格式
4. **版本标记**: 通过version字段标记项目版本
5. **兼容性处理**: 高版本应兼容低版本文件结构

项目文件示例：
```json
{
  "name": "示例项目",
  "type": "JAVA",
  "defaultDb": "MYSQL",
  "profile": {
    "defaultFields": [],
    "javaHome": "/usr/lib/jvm/java-8-openjdk",
    "sqlPath": "./sql"
  },
  "entities": [],
  "diagrams": [],
  "dicts": [],
  "domains": [],
  "version": "3.0.0"
}
```

### 4.2 导出文件格式

PDManer支持多种导出格式，每种格式有特定的规范：

1. **SQL文件**:
   - 文件扩展名：`.sql`
   - 编码：UTF-8
   - 格式：针对特定数据库的DDL语句
   - 注释：使用特定数据库支持的注释语法

2. **文档文件**:
   - 支持格式：Markdown(.md)、HTML(.html)、Word(.docx)、PDF(.pdf)
   - 内容结构：项目概述、实体列表、关系图、数据字典
   - 图片：内嵌或链接到外部图片文件

3. **代码文件**:
   - 基于模板生成特定语言的代码文件
   - 遵循目标语言的语法和编码规范
   - 包含数据模型相关的类定义、ORM映射等

4. **图片文件**:
   - 支持格式：PNG(.png)、JPEG(.jpg)、SVG(.svg)
   - 分辨率：根据导出设置确定
   - 内容：关系图或模型视图

### 4.3 模板文件格式

代码生成模板使用特定格式，遵循以下规范：

1. **模板文件扩展名**: `.ftl`（基于FreeMarker模板引擎）
2. **模板语法**: 使用FreeMarker模板语法（如`${variable}`、`<#if condition>...</#if>`）
3. **模板变量**: 支持访问项目数据结构中的所有元素
4. **模板分类**:
   - 实体模板：生成实体类代码
   - 关系模板：生成关系映射代码
   - 工具类模板：生成辅助工具代码
   - 配置模板：生成配置文件

模板示例：
```ftl
package ${package}.entity;

import java.io.Serializable;
<#if entity.fields?has_content>
<#list entity.fields as field>
<#if field.type == 'DATE'>
import java.util.Date;
<#break>
</#if>
</#list>
</#if>

/**
 * ${entity.defName!}实体类
 * 
 * @author PDManer
 * @version 1.0
 */
public class ${entity.defKey} implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
<#if entity.fields?has_content>
<#list entity.fields as field>
    /** ${field.defName!} */
    private ${field.javaType} ${field.defKey};
    
</#list>
</#if>
    // getter和setter方法
}
```

## 5. 数据转换与映射

### 5.1 模型到SQL转换

模型到SQL的转换遵循以下规则：

1. **表名转换**:
   - 实体的defKey映射为表名
   - 根据配置应用前缀或后缀
   - 支持大小写转换（如驼峰转下划线）

2. **字段转换**:
   - 字段的defKey映射为列名
   - 根据数据类型映射配置转换为目标数据库的类型
   - 处理长度、精度、默认值等属性

3. **约束转换**:
   - 主键转换为PRIMARY KEY约束
   - 非空属性转换为NOT NULL约束
   - 唯一索引转换为UNIQUE约束

4. **索引转换**:
   - 单列索引直接映射
   - 复合索引根据字段顺序创建
   - 根据配置处理索引命名

5. **关系转换**:
   - 一对多关系通常转换为外键约束
   - 多对多关系可能需要创建中间表
   - 根据配置决定是否实际生成外键约束

示例转换过程：
```javascript
// 实体数据
const entity = {
  defKey: "user",
  defName: "用户表",
  fields: [
    {
      defKey: "id",
      type: "INT",
      primaryKey: true,
      autoIncrement: true
    },
    {
      defKey: "username",
      type: "VARCHAR",
      len: 50,
      notNull: true
    }
  ]
};

// 转换为MySQL SQL
// CREATE TABLE `user` (
//   `id` INT(11) NOT NULL AUTO_INCREMENT,
//   `username` VARCHAR(50) NOT NULL,
//   PRIMARY KEY (`id`)
// ) COMMENT='用户表';
```

### 5.2 模型到文档转换

模型到文档的转换遵循以下规则：

1. **文档结构**:
   - 首页：项目名称、概述、统计信息
   - 目录：各章节链接
   - 实体章节：每个实体的详细信息
   - 关系图章节：各关系图的可视化表示
   - 数据字典章节：数据字典定义

2. **实体文档化**:
   - 表格形式展示实体的字段信息
   - 包含字段名、类型、长度、是否主键、是否非空等信息
   - 索引信息单独列表展示

3. **关系图文档化**:
   - 将关系图导出为图片嵌入文档
   - 提供关系描述和说明

4. **数据字典文档化**:
   - 表格形式展示字典项
   - 包含键名、值、说明等信息

5. **格式转换**:
   - Markdown：使用标准Markdown语法
   - HTML：使用HTML标签和CSS样式
   - Word/PDF：使用专用库进行格式转换

### 5.3 数据迁移与兼容性

PDManer处理不同版本和数据库之间的迁移和兼容性问题：

1. **版本迁移**:
   - 提供版本间的数据结构转换器
   - 更新文件时保留用户自定义数据
   - 处理字段重命名和结构变化

2. **数据库迁移**:
   - 生成数据库迁移脚本（如ALTER TABLE语句）
   - 支持比较两个模型版本的差异
   - 提供增量更新选项

3. **跨数据库兼容**:
   - 使用数据类型映射确保跨数据库兼容性
   - 处理不同数据库间的语法差异
   - 提供数据库特定的优化选项

4. **向前兼容**:
   - 新版应用可打开旧版本文件
   - 自动添加缺失的新功能属性
   - 保留未识别的旧属性

5. **向后兼容**:
   - 导出为旧版本格式时进行数据转换
   - 处理不支持的新功能
   - 提供兼容性警告 