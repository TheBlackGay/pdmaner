import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Layout, Menu, Button, Input, List, Space, Tooltip, Dropdown, Modal, Form, Select, message, Drawer, Empty, Tag } from 'antd'
import { Outlet, useNavigate, useLocation, useParams } from 'react-router-dom'
import {
  LeftOutlined,
  SaveOutlined,
  UndoOutlined,
  RedoOutlined,
  SettingOutlined,
  SearchOutlined,
  PlusOutlined,
  TableOutlined,
  ImportOutlined,
  FileTextOutlined,
  UploadOutlined,
  DatabaseOutlined,
  InfoCircleOutlined,
  CopyOutlined,
  ScissorOutlined,
  SnippetsOutlined,
  DeleteOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  CodeOutlined,
  BranchesOutlined,
  CheckCircleOutlined,
  CaretRightOutlined,
  FundViewOutlined,
  ApartmentOutlined,
  ReadOutlined
} from '@ant-design/icons'
import { useProjectStore } from '../../../stores/project'
import { useTableStore } from '../../../stores/table'
import { useFieldStore } from '../../../stores/field'
import { useIndexStore } from '../../../stores/index'
import { SQLParser } from '../../../utils/sqlParser'
import CreateTableDialog from '@/renderer/components/CreateTableDialog'
import styles from './style.module.css'
import TableDetail from './TableDetail'
import FieldTemplateList from './components/FieldTemplateList'
import CreateDomainDialog from '../../components/CreateDomainDialog'

const { Header, Content } = Layout

interface Domain {
  id: string
  code: string
  name: string
  modules: {
    tables: string[]
    views: string[]
    relations: string[]
    dictionary: string[]
  }
}

// 子菜单组件 - 模型
const ModelSubMenu: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>()
  const {
    tables,
    loading,
    fetchTables,
    selectTable,
    selectedTable,
    deleteTable,
    createTable
  } = useTableStore()
  const { createField } = useFieldStore()
  const { createIndex } = useIndexStore()
  const [domains, setDomains] = useState<Domain[]>([])
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null)
  const [createDomainVisible, setCreateDomainVisible] = useState(false)
  const [editDomainVisible, setEditDomainVisible] = useState(false)
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null)
  const [domainContextMenuPosition, setDomainContextMenuPosition] = useState<{ x: number; y: number } | null>(null)
  const [expandedDomains, setExpandedDomains] = useState<string[]>([])
  const [expandedModules, setExpandedModules] = useState<{[key: string]: string[]}>({})

  useEffect(() => {
    if (projectId) {
      fetchTables(projectId)
    }
  }, [projectId, fetchTables])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuPosition) {
        const menuElement = document.querySelector(`.${styles.contextMenu}`)
        if (menuElement && !menuElement.contains(event.target as Node)) {
          handleContextMenuClose()
        }
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [contextMenuPosition])

  const handleContainerContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setDomainContextMenuPosition(null)
    setContextMenuPosition({ x: e.clientX, y: e.clientY })
  }

  const handleContextMenuClose = () => {
    setContextMenuPosition(null)
  }

  const handleDomainContextMenu = (e: React.MouseEvent, domain: Domain) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenuPosition(null)
    setSelectedDomain(domain)
    setDomainContextMenuPosition({ x: e.clientX, y: e.clientY })
  }

  const handleCreate = () => {
    setContextMenuPosition(null)
    setCreateDomainVisible(true)
  }

  const handleCopy = () => {
    const table = tables.find(t => t.id === selectedTableId)
    if (table) {
      setClipboardData({
        type: 'copy',
        table: { ...table }
      })
      message.success('已复制到剪贴板')
    }
    handleContextMenuClose()
  }

  const handleCut = () => {
    const table = tables.find(t => t.id === selectedTableId)
    if (table) {
      setClipboardData({
        type: 'cut',
        table: { ...table }
      })
      message.success('已剪切到剪贴板')
    }
    handleContextMenuClose()
  }

  const handlePaste = async () => {
    if (!selectedTable || !projectId) return

    try {
      // 创建新表
      const newName = `${selectedTable.name}_copy`
      const newTable = await createTable(projectId, {
        name: newName,
        comment: selectedTable.comment,
        charset: selectedTable.charset
      })

      // 复制字段
      for (const field of selectedTable.fields) {
        await createField(newTable.id, {
          name: field.name,
          comment: field.comment,
          typeName: field.typeName,
          length: field.length,
          precision: field.precision,
          scale: field.scale,
          nullable: field.nullable,
          primaryKey: field.primaryKey,
          autoIncrement: field.autoIncrement,
          defaultValue: field.defaultValue
        })
      }

      // 复制索引
      for (const index of selectedTable.indexes) {
        await createIndex(newTable.id, {
          name: index.name,
          type: index.type,
          comment: index.comment,
          fields: index.fields.map(f => ({
            fieldId: f.fieldId,
            sort: f.sort
          })),
          disabled: index.disabled || false
        })
      }

      message.success('粘贴成功')
      await fetchTables(projectId)
    } catch (error) {
      console.error('Failed to paste table:', error)
      message.error('粘贴失败：' + (error as Error).message)
    }
  }

  const handleDelete = () => {
    if (!selectedTableId) return

    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个数据表吗？此操作不可恢复。',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteTable(selectedTableId)
          message.success('删除成功')
          if (projectId) {
            await fetchTables(projectId)
          }
        } catch (error) {
          console.error('删除失败:', error)
          message.error('删除失败: ' + (error as Error).message)
        }
        handleContextMenuClose()
      }
    })
  }

  const handleCreateDomain = async (values: { code: string; name: string; selectedTables: string[] }) => {
    const newDomain: Domain = {
      id: Date.now().toString(),
      code: values.code,
      name: values.name,
      modules: {
        tables: values.selectedTables,
        views: [],
        relations: [],
        dictionary: []
      }
    }
    setDomains([...domains, newDomain])
  }

  const handleEditDomain = async (values: { code: string; name: string; selectedTables: string[] }) => {
    if (!selectedDomain) return
    
    const updatedDomains = domains.map(domain => {
      if (domain.id === selectedDomain.id) {
        return {
          ...domain,
          code: values.code,
          name: values.name,
          modules: {
            ...domain.modules,
            tables: values.selectedTables
          }
        }
      }
      return domain
    })
    
    setDomains(updatedDomains)
    setSelectedDomain(null)
  }

  const handleDomainExpand = (domainId: string) => {
    setExpandedDomains(prev => 
      prev.includes(domainId) 
        ? prev.filter(id => id !== domainId)
        : [...prev, domainId]
    )
  }

  const handleModuleExpand = (domainId: string, moduleType: string) => {
    setExpandedModules(prev => {
      const domainModules = prev[domainId] || []
      return {
        ...prev,
        [domainId]: domainModules.includes(moduleType)
          ? domainModules.filter(type => type !== moduleType)
          : [...domainModules, moduleType]
      }
    })
  }

  return (
    <div 
      className={styles.subMenuContainer} 
      onContextMenu={handleContainerContextMenu}
    >
      <div className={styles.subMenuHeader}>
        <span>数据模型</span>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="small"
          onClick={() => setCreateDomainVisible(true)}
        >
          创建表
        </Button>
      </div>
      <div className={styles.tableList}>
        {domains.map(domain => (
          <div key={domain.id} className={styles.domainWrapper}>
            <div
              className={styles.domainItem}
              onContextMenu={(e) => handleDomainContextMenu(e, domain)}
              onClick={() => handleDomainExpand(domain.id)}
            >
              <div className={styles.domainHeader}>
                <CaretRightOutlined 
                  className={`${styles.expandIcon} ${expandedDomains.includes(domain.id) ? styles.expanded : ''}`}
                />
                <span className={styles.domainName}>{domain.name}</span>
                <span className={styles.domainCode}>[{domain.code}]</span>
              </div>
            </div>
            
            {expandedDomains.includes(domain.id) && (
              <div className={styles.moduleList}>
                {/* 数据表模块 */}
                <div className={styles.moduleItem}>
                  <div 
                    className={styles.moduleHeader}
                    onClick={() => handleModuleExpand(domain.id, 'tables')}
                  >
                    <CaretRightOutlined 
                      className={`${styles.expandIcon} ${(expandedModules[domain.id] || []).includes('tables') ? styles.expanded : ''}`}
                    />
                    <DatabaseOutlined />
                    <span>数据表</span>
                    <span className={styles.moduleCount}>
                      ({domain.modules.tables.length})
                    </span>
                  </div>
                  {(expandedModules[domain.id] || []).includes('tables') && (
                    <div className={styles.tableItems}>
                      {domain.modules.tables.map(tableId => {
                        const table = tables.find(t => t.id === tableId)
                        if (!table) return null
                        return (
                          <div 
                            key={table.id}
                            className={`${styles.tableItem} ${selectedTable?.id === table.id ? styles.tableItemActive : ''}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              selectTable(table)
                            }}
                          >
                            <span className={styles.tableName}>{table.name}</span>
                            {table.comment && (
                              <span className={styles.tableComment}>
                                [{table.comment}]
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* 数据视图模块 */}
                <div className={styles.moduleItem}>
                  <div 
                    className={styles.moduleHeader}
                    onClick={() => handleModuleExpand(domain.id, 'views')}
                  >
                    <CaretRightOutlined 
                      className={`${styles.expandIcon} ${(expandedModules[domain.id] || []).includes('views') ? styles.expanded : ''}`}
                    />
                    <FundViewOutlined />
                    <span>数据视图</span>
                    <span className={styles.moduleCount}>
                      ({domain.modules.views.length})
                    </span>
                  </div>
                </div>

                {/* 关系图模块 */}
                <div className={styles.moduleItem}>
                  <div 
                    className={styles.moduleHeader}
                    onClick={() => handleModuleExpand(domain.id, 'relations')}
                  >
                    <CaretRightOutlined 
                      className={`${styles.expandIcon} ${(expandedModules[domain.id] || []).includes('relations') ? styles.expanded : ''}`}
                    />
                    <ApartmentOutlined />
                    <span>关系图</span>
                    <span className={styles.moduleCount}>
                      ({domain.modules.relations.length})
                    </span>
                  </div>
                </div>

                {/* 数据字典模块 */}
                <div className={styles.moduleItem}>
                  <div 
                    className={styles.moduleHeader}
                    onClick={() => handleModuleExpand(domain.id, 'dictionary')}
                  >
                    <CaretRightOutlined 
                      className={`${styles.expandIcon} ${(expandedModules[domain.id] || []).includes('dictionary') ? styles.expanded : ''}`}
                    />
                    <ReadOutlined />
                    <span>数据字典</span>
                    <span className={styles.moduleCount}>
                      ({domain.modules.dictionary.length})
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {contextMenuPosition && (
        <div
          className={styles.contextMenu}
          style={{ 
            position: 'fixed',
            left: contextMenuPosition.x,
            top: contextMenuPosition.y,
            zIndex: 1000
          }}
        >
          <Menu>
            <Menu.Item onClick={() => {
              setContextMenuPosition(null)
              setCreateDomainVisible(true)
            }}>
              新建
            </Menu.Item>
          </Menu>
        </div>
      )}
      {domainContextMenuPosition && (
        <div
          className={styles.contextMenu}
          style={{ left: domainContextMenuPosition.x, top: domainContextMenuPosition.y }}
        >
          <Menu>
            <Menu.Item onClick={() => {
              setDomainContextMenuPosition(null)
              setEditDomainVisible(true)
            }}>
              编辑
            </Menu.Item>
          </Menu>
        </div>
      )}
      <CreateDomainDialog
        open={createDomainVisible}
        onClose={() => setCreateDomainVisible(false)}
        onSubmit={handleCreateDomain}
        tables={tables}
      />
      <CreateDomainDialog
        open={editDomainVisible}
        onClose={() => setEditDomainVisible(false)}
        onSubmit={handleEditDomain}
        tables={tables}
        initialValues={selectedDomain}
        title="编辑主题域"
      />
    </div>
  )
}

const ProjectLayout: React.FC = () => {
  const navigate = useNavigate()
  const { id: projectId } = useParams<{ id: string }>()
  const { selectedProject } = useProjectStore()
  const { tables, loading, fetchTables, createTable } = useTableStore()
  const { createField } = useFieldStore()
  const { createIndex } = useIndexStore()
  const [selectedMenu, setSelectedMenu] = useState('model')
  const [mainSiderWidth, setMainSiderWidth] = useState(200)
  const [subSiderWidth, setSubSiderWidth] = useState(300)
  const resizingMainRef = useRef(false)
  const resizingSubRef = useRef(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importForm] = Form.useForm()
  const [templateDrawerVisible, setTemplateDrawerVisible] = useState(false)
  const [mainSiderCollapsed, setMainSiderCollapsed] = useState(false)
  const [domains, setDomains] = useState<Domain[]>([])
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null)
  const [createDomainVisible, setCreateDomainVisible] = useState(false)
  const [editDomainVisible, setEditDomainVisible] = useState(false)
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null)
  const [domainContextMenuPosition, setDomainContextMenuPosition] = useState<{ x: number; y: number } | null>(null)

  const handleMainSiderResizeStart = (e: React.MouseEvent) => {
    resizingMainRef.current = true
    startXRef.current = e.clientX
    startWidthRef.current = mainSiderWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const handleResizeMove = (e: MouseEvent) => {
      if (resizingMainRef.current) {
        const delta = e.clientX - startXRef.current
        const newWidth = Math.max(150, Math.min(400, startWidthRef.current + delta))
        setMainSiderWidth(newWidth)
      }
    }

    const handleResizeEnd = () => {
      resizingMainRef.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', handleResizeMove)
      document.removeEventListener('mouseup', handleResizeEnd)
    }

    document.addEventListener('mousemove', handleResizeMove)
    document.addEventListener('mouseup', handleResizeEnd)
  }

  const handleSubSiderResizeStart = (e: React.MouseEvent) => {
    resizingSubRef.current = true
    startXRef.current = e.clientX
    startWidthRef.current = subSiderWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const handleResizeMove = (e: MouseEvent) => {
      if (resizingSubRef.current) {
        const delta = e.clientX - startXRef.current
        const newWidth = Math.max(200, Math.min(500, startWidthRef.current + delta))
        setSubSiderWidth(newWidth)
      }
    }

    const handleResizeEnd = () => {
      resizingSubRef.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', handleResizeMove)
      document.removeEventListener('mouseup', handleResizeEnd)
    }

    document.addEventListener('mousemove', handleResizeMove)
    document.addEventListener('mouseup', handleResizeEnd)
  }

  const menuItems = [
    {
      key: 'model',
      label: mainSiderCollapsed ? null : '数据模型',
      icon: <TableOutlined />,
    },
    {
      key: 'types',
      label: mainSiderCollapsed ? null : '类型设置',
      icon: <SettingOutlined />,
    },
    {
      key: 'generator',
      label: mainSiderCollapsed ? null : '代码生成',
      icon: <CodeOutlined />,
    },
    {
      key: 'version',
      label: mainSiderCollapsed ? null : '版本管理',
      icon: <BranchesOutlined />,
    },
    {
      key: 'check',
      label: mainSiderCollapsed ? null : '规范检查',
      icon: <CheckCircleOutlined />,
    },
  ]

  // 渲染子菜单内容
  const renderSubMenu = () => {
    switch (selectedMenu) {
      case 'model':
        return <ModelSubMenu />
      case 'types':
        return <div>类型设置子菜单</div>
      case 'generator':
        return <div>代码生成器子菜单</div>
      case 'version':
        return <div>版本管理子菜单</div>
      case 'check':
        return <div>规范检查子菜单</div>
      default:
        return null
    }
  }

  const handleSave = () => {
    message.success('保存成功')
  }

  const handleUndo = () => {
    message.info('撤销操作')
  }

  const handleImportSQL = async () => {
    try {
      const values = await importForm.validateFields()
      const { dbType, sql } = values

      const parser = new SQLParser(sql, dbType)
      const tables = parser.parse()

      if (tables.length === 0) {
        message.error('没有找到有效的建表语句')
        return
      }

      // 批量创建表
      for (const { table, fields, indexes } of tables) {
        try {
          // 创建表
          const newTable = await createTable(projectId!, table)
          const tableId = newTable.id

          // 创建字段
          const fieldMap = new Map<string, string>() // 字段名到ID的映射
          for (const field of fields) {
            const newField = await createField(tableId, field)
            fieldMap.set(field.name, newField.id)
          }

          // 创建索引
          for (const index of indexes) {
            const indexFields = index.fields.map(f => ({
              ...f,
              fieldId: fieldMap.get(f.fieldId) || f.fieldId
            }))

            await createIndex(tableId, {
              ...index,
              fields: indexFields
            })
          }
        } catch (error) {
          console.error(`处理表 ${table.name} 失败:`, error)
          message.error(`处理表 ${table.name} 失败: ${(error as Error).message}`)
        }
      }

      message.success(`成功导入 ${tables.length} 个表`)
      setImportDialogOpen(false)
      importForm.resetFields()

      // 重新加载表列表
      await fetchTables(projectId!)
    } catch (error) {
      console.error('导入失败:', error)
      message.error('导入失败: ' + (error as Error).message)
    }
  }

  return (
    <Layout className={styles.projectLayout}>
      <Header className={styles.header}>
        <div className={styles.headerLeft}>
          <Button
            type="text"
            icon={<LeftOutlined />}
            onClick={() => navigate('/')}
          />
          <span className={styles.projectName}>{selectedProject?.name}</span>
        </div>
        <div className={styles.headerCenter}>
          <Space>
            <Tooltip title="保存 (⌘S)">
              <Button
                icon={<SaveOutlined />}
                onClick={handleSave}
              />
            </Tooltip>
            <Tooltip title="撤销 (⌘Z)">
              <Button
                icon={<UndoOutlined />}
                onClick={handleUndo}
              />
            </Tooltip>
            <Tooltip title="重做 (⌘⇧Z)">
              <Button
                icon={<RedoOutlined />}
                onClick={() => message.info('重做功能开发中')}
              />
            </Tooltip>
            <Tooltip title="导入">
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'importSQL',
                      label: '导入建表语句',
                      icon: <FileTextOutlined />,
                      onClick: () => setImportDialogOpen(true)
                    },
                    {
                      key: 'importExcel',
                      label: '导入Excel',
                      icon: <UploadOutlined />,
                      onClick: () => message.info('Excel导入功能开发中')
                    }
                  ]
                }}
                placement="bottomRight"
              >
                <Button icon={<ImportOutlined />} />
              </Dropdown>
            </Tooltip>
            <Tooltip title="设置">
              <Button
                icon={<SettingOutlined />}
                onClick={() => message.info('设置功能开发中')}
              />
            </Tooltip>
          </Space>
        </div>
        <div className={styles.headerRight}>
          <Space>
            <Input
              prefix={<SearchOutlined />}
              placeholder="搜索表/字段"
              className={styles.searchInput}
            />
            <Tooltip title="字段模板库">
              <Button
                icon={<DatabaseOutlined />}
                onClick={() => setTemplateDrawerVisible(true)}
              >
                字段模板库
              </Button>
            </Tooltip>
          </Space>
        </div>
      </Header>

      <Drawer
        title="字段模板库"
        placement="right"
        width={400}
        open={templateDrawerVisible}
        onClose={() => setTemplateDrawerVisible(false)}
        bodyStyle={{ padding: 0 }}
      >
        <FieldTemplateList
          onUseTemplate={(template) => {
            // TODO: 处理使用模板的逻辑
            console.log('使用模板:', template);
            setTemplateDrawerVisible(false);
          }}
        />
      </Drawer>

      <div className={styles.mainLayout}>
        {/* 左侧主菜单 */}
        <div
          className={styles.mainSider}
          style={{ width: mainSiderCollapsed ? 48 : mainSiderWidth }}
        >
          <Menu
            mode="inline"
            selectedKeys={[selectedMenu]}
            items={menuItems}
            onClick={({ key }) => setSelectedMenu(key)}
            inlineCollapsed={mainSiderCollapsed}
          />
          <div
            className={styles.resizeHandle}
            onMouseDown={handleMainSiderResizeStart}
          />
          <Button
            type="text"
            icon={mainSiderCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setMainSiderCollapsed(!mainSiderCollapsed)}
            className={styles.collapseButton}
          />
        </div>

        {/* 子菜单和内容区域 */}
        <div className={styles.contentLayout}>
          {/* 子菜单区域 */}
          <div
            className={styles.subSider}
            style={{ width: subSiderWidth }}
          >
            <div className={styles.subSiderContent}>
              {renderSubMenu()}
            </div>
            <div
              className={styles.resizeHandle}
              onMouseDown={handleSubSiderResizeStart}
            />
          </div>

          {/* 主内容区域 */}
          <div className={styles.content}>
            {selectedMenu === 'model' ? (
              <TableDetail />
            ) : (
              <Outlet />
            )}
          </div>
        </div>
      </div>

      <Modal
        title="导入建表语句"
        open={importDialogOpen}
        onCancel={() => {
          setImportDialogOpen(false)
          importForm.resetFields()
        }}
        onOk={handleImportSQL}
        width={800}
        destroyOnClose
      >
        <Form
          form={importForm}
          layout="vertical"
        >
          <Form.Item
            name="dbType"
            label="数据库类型"
            initialValue="mysql"
            rules={[{ required: true, message: '请选择数据库类型' }]}
          >
            <Select
              options={[
                { label: 'MySQL', value: 'mysql' },
                { label: 'Doris', value: 'doris' }
              ]}
            />
          </Form.Item>
          <Form.Item
            name="sql"
            label="建表语句"
            rules={[{ required: true, message: '请输入建表语句' }]}
            help="请输入完整的建表语句，包括字段定义、索引等"
          >
            <Input.TextArea
              placeholder={`示例：
CREATE TABLE user (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL COMMENT '用户名',
  email VARCHAR(100) COMMENT '邮箱',
  status TINYINT DEFAULT 1 COMMENT '状态',
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_email (email),
  KEY idx_name (name)
) COMMENT='用户表';`}
              rows={15}
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  )
}

export default ProjectLayout
