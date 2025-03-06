# PDManer 功能清单

本文档记录了 PDManer 项目的主要功能模块、代码入口和对应页面组件的位置信息，用于项目开发和优化参考。

## 功能模块清单

| 功能模块 | 功能描述 | 代码入口 | 页面组件 |
|---------|---------|---------|----------|
| 数据表管理 | 管理数据表、字段、注释、索引等基本功能 | src/app/container/table | src/components/table |
| 视图管理 | 实现多表多字段组合的视图对象管理 | src/app/container/view | src/components/ercanvas |
| ER关系图 | 数据表ER关系图绘制，支持概念模型设计 | src/app/container/er | src/components/ercanvas |
| 数据字典 | 代码映射表管理，实现数据字典与字段关联 | src/app/container/dict | src/components/table |
| 数据类型管理 | 基础数据类型和数据域管理 | src/app/container/datatype | src/components/select |
| 多数据库支持 | 支持MySQL、PostgreSQL等多种数据库 | src/lib/datasource_util.js | src/components/select |
| 代码生成 | 支持Java、Mybatis等多语言代码生成 | src/lib/generatefile | src/components/codeeditor |
| 版本管理 | 数据表版本管理，增量DDL脚本生成 | src/lib/datasource_version_util.js | src/components/versionListBar |
| 导入导出 | 支持PDM文件导入，Word文档导出等 | src/lib/template | src/components/upload |
| 项目配置管理 | 项目基础信息配置、环境变量管理 | src/app/container/config | src/components/setting |
| 数据库连接管理 | 数据库连接配置、测试和管理 | src/app/container/database | src/components/database |
| 模板管理 | 代码模板、文档模板的管理与配置 | src/app/container/template | src/components/template |
| 系统设置 | 界面主题、语言、快捷键配置等 | src/app/container/setting | src/components/setting |
| 项目备份恢复 | 项目自动备份与恢复功能 | src/lib/backup | src/components/backup |
| 数据库反向工程 | 从现有数据库导入表结构 | src/lib/datasource_util.js | src/components/database |
| 数据表结构比对 | 比对不同版本的表结构差异 | src/lib/compare | src/components/compare |
| 数据表分组管理 | 对数据表进行分组和分类管理 | src/app/container/group | src/components/tree |
| 关系图布局优化 | ER图自动布局和美化功能 | src/components/ercanvas | src/components/ercanvas |
| 项目协同开发 | 多人协作的版本控制和合并 | src/lib/version | src/components/versionListBar |
| 数据表导出 | 支持SQL、Word、Excel等多种格式导出 | src/lib/generatefile | src/components/codeeditor |
| 数据表结构校验 | 校验表结构的完整性和规范性 | src/lib/datasource_util.js | src/components/table |
| 数据表标准化检查 | 检查字段命名、类型等是否符合标准 | src/lib/datasource_util.js | src/components/compare |
| 数据表批量操作 | 支持表的批量编辑、复制和删除 | src/lib/contextMenuUtil.js | src/components/table |
| 数据表版本对比 | 比对不同版本间的表结构变化 | src/lib/datasource_version_util.js | src/components/compare |
| 字段模板管理 | 管理和复用常用字段模板 | src/app/container/template | src/components/table |
| 表权限管理 | 管理数据表的访问和操作权限 | src/lib/auth | src/components/table |
| 表备注管理 | 管理数据表和字段的详细说明 | src/app/container/table | src/components/table |
| 表索引管理 | 管理数据表的索引结构 | src/app/container/table | src/components/table |
| 表关联关系管理 | 管理表间的外键和关联关系 | src/app/container/er | src/components/ercanvas |
| 数据表导入 | 支持Excel、CSV等格式的表结构导入 | src/lib/template | src/components/upload |
| 数据表预览 | 预览表结构和数据内容 | src/components/table | src/components/sheet |
| 数据表历史记录 | 记录表结构变更历史 | src/lib/datasource_version_util.js | src/components/versionListBar |
| 数据表字段统计 | 统计字段使用情况和分布 | src/lib/datasource_util.js | src/components/table |
| 字段校验规则管理 | 管理字段的数据校验规则 | src/app/container/table | src/components/table |
| 数据表SQL预览 | 预览表结构的SQL语句 | src/lib/generatefile | src/components/codeeditor |
| 字段默认值管理 | 管理字段的默认值设置 | src/app/container/table | src/components/table |
| 字段约束管理 | 管理字段的约束条件 | src/app/container/table | src/components/table |
| 字段注释模板 | 管理字段注释的模板 | src/lib/template | src/components/template |
| 字段类型转换 | 不同数据库间的字段类型转换 | src/lib/datasource_util.js | src/components/table |
| 数据表导出模板 | 管理数据表导出的模板配置 | src/lib/template | src/components/template |
| 字段映射规则 | 管理字段间的映射转换规则 | src/lib/json2code_util.js | src/components/table |
| 字段校验规则 | 配置字段的数据校验规则 | src/lib/validate.js | src/components/table |
| 字段默认值模板 | 管理字段默认值的模板配置 | src/lib/template | src/components/table |
| 字段分组管理 | 对表字段进行分组和分类管理 | src/app/container/table | src/components/table |
| 字段排序功能 | 支持表字段的自定义排序 | src/lib/array_util.js | src/components/table |
| 字段搜索功能 | 快速搜索和定位表字段 | src/components/searchinput | src/components/table |
| 字段过滤功能 | 按条件筛选表字段 | src/components/table | src/components/table |
| 字段导出功能 | 支持字段信息的批量导出 | src/lib/generatefile | src/components/table |
| 字段类型映射 | 管理不同数据库的类型映射 | src/lib/datasource_util.js | src/components/select |
| 字段验证功能 | 字段格式和规则的实时验证 | src/lib/validate.js | src/components/table |
| 数据表导出配置 | 管理数据表导出的配置选项 | src/lib/generatefile/index.js | src/components/codeeditor |
| 数据表字段加密 | 字段数据加密和安全管理 | src/lib/datasource_util.js | src/components/table |
| 数据表字段计算 | 支持字段间的计算和公式 | src/lib/json2code_util.js | src/components/table |
| 数据表字段联动 | 实现字段间的关联和联动 | src/lib/datasource_util.js | src/components/table |
| 数据表字段多语言 | 字段名称和注释的多语言支持 | src/lib/json2code_util.js | src/components/table |
| 字段格式化 | 字段值的自动格式化处理 | src/lib/format.js | src/components/table |
| 字段提示功能 | 字段输入的智能提示和补全 | src/components/searchsuggest | src/components/input |
| 字段历史记录 | 记录字段修改的历史变更 | src/lib/datasource_version_util.js | src/components/versionListBar |
| 字段权限控制 | 管理字段级别的访问权限 | src/lib/auth.js | src/components/table |
| 字段导入导出 | 支持字段配置的导入导出 | src/lib/template | src/components/upload |
| 字段批量处理 | 支持字段的批量编辑操作 | src/lib/array_util.js | src/components/table |
| 字段模板管理 | 管理和应用字段模板配置 | src/lib/template | src/components/template |
| 字段依赖分析 | 分析字段间的依赖关系 | src/lib/datasource_util.js | src/components/ercanvas |
| 字段自动化测试 | 自动化测试字段的数据有效性 | src/test/unit/field.test.js | src/components/table |
| 字段性能优化 | 优化字段查询和显示性能 | src/lib/performance.js | src/components/table |
| 字段版本回滚 | 支持字段配置的版本回滚 | src/lib/datasource_version_util.js | src/components/versionListBar |
| 字段导出预览 | 预览字段导出的格式和内容 | src/lib/generatefile/preview.js | src/components/codeeditor |
| 字段批量导入 | 支持Excel批量导入字段 | src/lib/template/import.js | src/components/upload |
| 字段命名规范 | 检查和规范化字段命名 | src/lib/validate.js | src/components/table |
| 字段数据采样 | 生成字段测试数据样例 | src/lib/generatefile/sample.js | src/components/table |
| 字段索引优化 | 分析和优化字段索引配置 | src/lib/datasource_util.js | src/components/table |
| 字段变更通知 | 字段变更的消息通知 | src/lib/event_tool.js | src/components/message |

## 模块调用关系

1. **核心模块关系**
   - 数据表管理 → 数据类型管理：字段类型引用
   - 视图管理 → 数据表管理：表和字段引用
   - ER关系图 → 数据表管理：表关系维护
   - 数据字典 → 数据表管理：字段枚举值关联

2. **功能模块关系**
   - 代码生成 → 模板管理：获取代码模板
   - 导入导出 → 模板管理：获取文档模板
   - 版本管理 → 数据表管理：表结构变更记录
   - 数据库连接 → 项目配置：获取环境配置

## 核心组件说明

### 基础UI组件

1. **输入类组件**
   - Input：基础输入框组件
   - NumberInput：数字输入框
   - SearchInput：搜索输入框
   - PathSelectInput：路径选择输入框
   - UploadInput：文件上传输入框
   - Text：文本域组件
   - Slider：滑块输入组件，支持范围选择和步长控制
   - TextArea：多行文本输入组件
   - SearchSuggest：带建议的搜索输入框
   - FormatInput：格式化输入框组件
   - Form：表单组件，支持数据收集、校验和提交
   - Switch：开关组件，用于切换状态
   - Cascader：级联选择器，支持多级数据选择
   - Rate：评分组件，支持自定义图标和半星
   - Transfer：穿梭框组件，支持数据双向选择
   - Mentions：提及组件，支持@提及功能
   - AutoComplete：自动完成组件，支持输入建议
   - Password：密码输入框，支持显示/隐藏切换
   - MaskedInput：掩码输入框，支持自定义格式
   - Editor：富文本编辑器，支持格式化和图片插入
   - CodeEditor：代码编辑器，支持语法高亮
   - ColorInput：颜色输入框，支持颜色选择和预览
   - DateInput：日期输入框，支持日期格式化
   - TimeInput：时间输入框，支持时间格式化
   - TagInput：标签输入框，支持标签添加和删除

2. **选择类组件**
   - Select：下拉选择框
   - MultipleSelect：多选组件
   - Radio：单选组件
   - Checkbox：复选框组件
   - ColorPicker：颜色选择器
   - ListGroupSelect：列表分组选择器
   - TreeSelect：树形选择器
   - DatePicker：日期选择器
   - TimePicker：时间选择器
   - RangePicker：日期范围选择器
   - WeekPicker：周选择器
   - MonthPicker：月份选择器
   - YearPicker：年份选择器
   - CascadeSelect：级联选择器
   - TagSelect：标签选择器
   - RegionSelect：地区选择器
   - IconSelect：图标选择器
   - FileSelect：文件选择器

3. **交互类组件**
   - Button：按钮组件
   - DropButton：下拉按钮
   - Menu：菜单组件
   - ContextMenu：右键菜单
   - Tooltip：提示框
   - Modal：模态框
   - Drawer：抽屉组件
   - ModalInput：模态输入框
   - Dropdown：下拉菜单组件
   - PopConfirm：气泡确认框
   - Carousel：轮播组件，支持自动播放和手动控制
   - Timeline：时间轴组件，支持自定义节点和内容
   - Tour：引导组件，支持分步骤引导
   - BackTop：回到顶部组件
   - Anchor：锚点组件，支持页面内导航
   - Affix：固钉组件，支持元素固定
   - Resizable：可调整大组件
   - Draggable：可拖拽组件
   - Sortable：可排序组件
   - Popover：气泡卡片
   - Overlay：遮罩层组件

4. **图标类组件**
   - Icon：基础图标组件，支持自定义图标和字体图标
   - IconTitle：图标标题组件，用于展示带图标的标题
   - GroupIcon：分组图标组件，用于展示分组相关的图标
   - SvgIcon：SVG图标组件
   - FontIcon：字体图标组件
   - IconSelect：图标选择器组件
   - IconPreview：图标预览组件
   - IconFont：自定义字体图标组件
   - AnimatedIcon：动画图标组件
   - StatusIcon：状态图标组件

5. **拖拽类组件**
   - DragCom：基础拖拽组件
   - Upload：文件拖拽上传组件
   - UploadInput：拖拽式文件输入框
   - DragSort：拖拽排序组件
   - DragResize：拖拽调整大组件
   - DragList：拖拽列表组件
   - DragGrid：拖拽网格组件
   - DragTable：拖拽表格组件
   - DragTree：树形拖拽组件
   - DragZone：拖拽区域组件
   - DropZone：放置区域组件

6. **数据展示组件**
   - Table：表格组件
   - List：列表组件
   - Tree：树形组件
   - Card：卡片组件
   - Badge：徽标数组件
   - Tag：标签组件
   - Avatar：头像组件
   - Collapse：折叠面板
   - Descriptions：描述列表组件
   - Statistic：统计数值组件
   - Empty：空状态组件
   - Image：图片组件，支持预览和懒加载
   - Calendar：日历组件
   - Timeline：时间轴组件
   - Skeleton：骨架屏组件
   - VirtualList：虚拟滚动列表
   - Watermark：水印组件
   - QRCode：二维码组件
   - Barcode：条形码组件
   - Chart：图表组件

7. **反馈组件**
   - Message：全局提示
   - Notification：通知提醒框
   - Progress：进度条
   - Spin：加载中
   - Alert：警告提示
   - Result：结果
   - Skeleton：骨架屏
   - Popover：气泡卡片
   - LoadingBar：顶部加载进度条
   - Watermark：水印组件
   - Terminal：终端输出组件
   - UpdateMessage：更新提示组件
   - ErrorBoundary：错误边界组件
   - Feedback：反馈组件

8. **导航组件**
   - Breadcrumb：面包屑
   - Pagination：分页
   - Steps：步骤条
   - Tabs：标签页
   - BackTop：回到顶部
   - Anchor：锚点
   - Menu：导航菜单
   - Dropdown：下拉导航
   - PageHeader：页头导航
   - SideMenu：侧边菜单
   - NavBar：导航栏
   - SubMenu：子菜单组件
   - MenuGroup：菜单分组
   - NavTabs：导航标签页

9. **布局组件**
   - Grid：栅格
   - Layout：布局
   - Space：间距
   - Divider：分割线
   - Affix：固钉
   - Row：行组件
   - Col：列组件
   - Flex：弹性布局
   - Waterfall：瀑布流布局
   - AspectRatio：宽高比容器
   - Container：容器组件
   - Panel：面板组件
   - Split：分割面板
   - FieldSet：字段集合组件
   - Masonry：瀑布流组件
   - AutoLayout：自适应布局
   - ResponsiveLayout：响应式布局
   - StickyLayout：粘性布局

### 业务功能组件

### 数据表操作组件

1. **数据表预览组件(Sheet)**
   - 组件路径：src/components/sheet
   - 核心功能：
     - 表格数据的动态渲染和展示
     - 支持自定义列宽和列配置
     - 集成数据验证和格式化功能
     - 支持数据类型映射和UI提示
     - 提供空行模板和数据填充功能

2. **数据表比对组件(Compare)**
   - 组件路径：src/components/compare
   - 核心功能：
     - 支持表结构差异对比和展示
     - 提供元数据编辑和管理功能
     - 支持版本间的数据比对
     - 集成数据类型映射支持
     - 提供自定义比对规则配置

### 数据表关系图组件 (ERCanvas)
- 组件路径：src/components/ercanvas
- 主要功能：
  - 基于@antv/x6实现的数据表关系图绘制
  - 支持表实体拖拽、连线、缩放等交互
  - 提供自动布局、对齐、分组等图形操作
  - 集成查找实体、批注编辑等辅助功能
  - 支持导出为PNG、SVG等图片格式

### 数据表结构对比组件 (Compare)
- 组件路径：src/components/compare
- 主要功能：
  - 支持不同版本间的表结构差异对比
  - 提供元数据编辑和管理功能
  - 支持自定义比对规则和验证
  - 可视化展示结构变更内容

### 版本管理组件 (VersionListBar)
- 组件路径：src/components/versionListBar
- 主要功能：
  - 管理数据表结构的版本历史
  - 支持版本间的切换和对比
  - 集成版本变更记录和回滚功能
  - 提供版本差异的可视化展示

### 数据表字段管理组件 (TableField)
- 组件路径：src/components/table
- 主要功能：
  - 字段属性的添加、编辑和删除
  - 字段类型和长度的设置
  - 字段默认值和约束条件配置
  - 字段注释和说明管理
  - 支持字段模板的应用和复用
  - 字段排序和分组管理
  - 批量导入导出字段定义

### 数据表索引管理组件 (TableIndex)
- 组件路径：src/components/table
- 主要功能：
  - 表索引的创建和维护
  - 支持单列和多列组合索引
  - 索引类型（唯一、普通）的设置
  - 索引字段顺序的调整
  - 索引命名规范的验证
  - 索引使用建议和优化提示

### 数据表约束管理组件 (TableConstraint)
- 组件路径：src/components/table
- 主要功能：
  - 主键约束的设置和管理
  - 外键关系的创建和维护
  - 唯一约束的配置
  - 检查约束的定义
  - 默认值约束的设置
  - 级联操作的配置
  - 约束依赖关系的分析

### 数据表分组管理组件 (TableGroup)
- 组件路径：src/components/tree
- 主要功能：
  - 支持数据表的分组和分类管理
  - 提供树形结构的分组展示
  - 支持分组的增删改查操作
  - 实现分组的拖拽排序
  - 分组统计和分析功能
  - 分组权限的控制管理
  - 分组导入导出功能

### 数据表模板管理组件 (TableTemplate)
- 组件路径：src/components/template
- 主要功能：
  - 管理和维护数据表模板
  - 支持模板的创建和编辑
  - 提供模板的快速应用功能
  - 模板版本管理和更新
  - 模板参数的配置管理
  - 模板导入导出功能
  - 模板使用统计分析

### 数据表权限管理组件 (TableAuth)
- 组件路径：src/components/table
- 主要功能：
  - 表级别的权限控制
  - 字段级别的权限管理
  - 用户组权限配置
  - 权限继承和覆盖机制
  - 权限变更日志记录
  - 权限模板管理
  - 权限验证和检查

1. **画布组件**
   - 位置：src/components/ercanvas
   - 功能：实现ER图的绘制和交互
   - 特点：支持拖拽、缩放、连线等复杂交互
   - 子组件：
     - ERCanvas：核心画布渲染组件
     - ERToolbar：工具栏组件
     - ERContextMenu：右键菜单组件
     - ERRelation：关系线绘制组件

2. **表格组件**
   - 位置：src/components/table
   - 功能：数据表和字段的展示与编辑
   - 特点：支持行内编辑、排序、筛选等功能
   - 子组件：
     - TableHeader：表头组件
     - TableCell：单元格组件
     - TableFilter：过滤器组件
     - TablePagination：分页组件

3. **代码编辑器**
   - 位置：src/components/codeeditor
   - 功能：SQL和代码的编辑与预览
   - 特点：支持语法高亮、自动补全
   - 扩展功能：
     - 代码格式化
     - 代码折叠
     - 错误提示
     - 智能提示

4. **版本管理组件**
   - 位置：src/components/versionListBar
   - 功能：版本历史记录和管理
   - 特点：支持版本对比、回滚等操作
   - 子功能：
     - 版本创建
     - 版本对比
     - 版本回滚
     - 版本合并

5. **数据库连接组件**
   - 位置：src/components/database
   - 功能：数据库连接配置和管理
   - 特点：
     - 支持多种数据库类型
     - 连接池管理
     - 连接测试
     - 权限验证

6. **数据导入导出组件**
   - 位置：src/components/upload
   - 功能：数据的导入和导出处理
   - 支持格式：
     - Excel导入导出
     - SQL脚本导入导出
     - PDM文件导入
     - Word文档导出

7. **项目配置组件**
   - 位置：src/components/setting
   - 功能：项目全局配置管理
   - 配置项：
     - 项目基本信息
     - 环境变量
     - 数据库配置
     - 代码生成配置

8. **数据字典组件**
   - 位置：src/components/dict
   - 功能：数据字典管理
   - 特点：
     - 代码表管理
     - 枚举值维护
     - 字段关联
     - 多语言支持

9. **模板管理组件**
   - 位置：src/components/template
   - 功能：代码和文档模板管理
   - 模板类型：
     - 代码生成模板
     - 文档导出模板
     - 字段模板
     - 注释模板

10. **数据比对组件**
    - 位置：src/components/compare
    - 功能：数据结构比对
    - 特点：
      - 表结构对比
      - 字段对比
      - 索引对比
      - 变更脚本生成

### 功能增强组件

1. **数据展示**
   - Tree：树形结构展示
   - List：列表组件
   - VirtualList：虚拟列表
   - Sheet：电子表格组件
   - Compare：数据对比组件

2. **状态反馈**
   - Loading：加载提示
   - Message：消息提示
   - Progressbar：进度条
   - Terminal：终端输出
   - UpdateMessage：更新提示

3. **布局组件**
   - Tab：标签页
   - SimpleTab：简单标签页
   - FieldSet：字段集合
   - ToolBar：工具栏
   - Step：步骤条

## 主要工具类

1. **数据源工具**
   - 位置：src/lib/datasource_util.js
   - 功能：数据库连接和操作相关

2. **版本管理工具**
   - 位置：src/lib/datasource_version_util.js
   - 功能：版本控制相关

3. **代码生成工具**
   - 位置：src/lib/generatefile
   - 功能：多语言代码生成

## 项目入口

- 主入口：src/main.js
- 应用容器：src/app/container
- 首页组件：src/app/home
- 欢迎页：src/app/welcome

## 扩展功能模块

1. **自动化测试**
   - 单元测试：src/test/unit
   - 集成测试：src/test/integration
   - E2E测试：src/test/e2e
   - 测试覆盖率报告生成

2. **性能监控**
   - 内存使用监控
   - CPU占用分析
   - 启动时间优化
   - 性能日志记录

3. **插件扩展系统**
   - 插件管理：src/plugins
   - 插件开发SDK
   - 插件市场集成
   - 热插拔支持

4. **数据安全与权限**
   - 数据加密存储
   - 访问权限控制
   - 操作日志审计
   - 敏感信息保护

## 开发指南

### 开发环境搭建

1. **环境要求**
   - Node.js >= 14.x
   - npm >= 6.x
   - Git

2. **项目初始化**
   ```bash
   git clone [repository]
   npm install
   npm run dev
   ```

### 开发规范

1. **代码规范**
   - 使用ESLint进行代码检查
   - 遵循React组件开发规范
   - 使用TypeScript进行类型检查

2. **提交规范**
   - 使用语义化版本号
   - 遵循Git Flow工作流
   - 提交信息规范化

### 调试方法

1. **开发模式调试**
   - 使用Chrome DevTools
   - React Developer Tools
   - Redux DevTools

2. **生产环境调试**
   - 日志收集与分析
   - 远程调试配置
   - 错误监控与报告

### 打包与部署

1. **打包配置**
   - electron-builder配置
   - 多平台打包脚本
   - 资源文件处理

2. **部署说明**
   - 环境配置要求
   - 自动化部署脚本
   - 版本更新机制

## 注意事项

1. 项目使用 React + Electron 构建，支持跨平台运行
2. 使用 Redux 进行状态管理，相关代码在 src/reducers 目录
3. 国际化支持通过 src/lang 目录实现
4. 样式文件统一在 src/style 目录管理
5. 遵循模块化和组件化开发原则
6. 重要更新需要编写更新日志和迁移指南
7. 定期进行代码审查和性能优化

> 本文档用于项目开发参考，后续功能优化和重构可基于此进行规划。开发团队应定期更新文档内容，确保与最新代码保持同步。