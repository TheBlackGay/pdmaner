# ER关系图模块

## 功能描述
- 实现可视化ER图设计与维护
- 支持多表关联关系自动布局
- 提供版本化设计稿管理

## 代码架构
```bash
代码入口：src/app/container/er
页面组件：src/components/ercanvas
关联模块：数据表管理、视图管理
```

## 核心功能点
1. 图形化设计
   - 拖拽式表实体创建
   - 智能连线吸附功能
   ```js
   // ER图配置示例
   const erConfig = {
     tables: [
       {name: 'user', x: 100, y: 200},
       {name: 'order', x: 400, y: 200}
     ],
     relations: [
       {source: 'user.id', target: 'order.user_id'}
     ]
   }
   ```

2. 布局优化
   - 自动力导向布局
   - 手动调整对齐工具
   ```mermaid
   graph TB
     A[自动布局] --> B{布局评估}
     B -->|满意| C[保存设计]
     B -->|不满意| D[手动调整]
   ```

3. 版本管理
   - 设计稿版本对比
   - 历史版本恢复
   - 变更记录追踪

## 接口定义
```typescript
interface ERService {
  createDiagram(config: ERConfig): Promise<ERDiagram>;
  autoLayout(diagramId: string): Promise<void>;
  exportImage(format: 'png'|'svg'): Promise<Buffer>;
}
```

## 关联组件
1. ERCanvas - 核心绘图画布
2. RelationInspector - 关系属性检查器
3. LayoutToolbar - 布局优化工具栏
4. VersionHistory - 设计版本历史面板

## 操作流程
1. 拖拽添加数据表
2. 建立表间关联关系
3. 优化布局排版
4. 导出设计文档或图片