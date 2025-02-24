import React, { useState, useEffect, useCallback } from 'react'
import { Tabs, Table, Button, Space, Popconfirm, message, Typography, Tooltip, Collapse, Checkbox, Dropdown, Badge, Tag, Modal, Form, Input, Select } from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CaretRightOutlined,
  CopyOutlined,
  ImportOutlined,
  ExportOutlined,
  MoreOutlined,
  KeyOutlined,
  DatabaseOutlined,
  TableOutlined,
  InfoCircleOutlined,
  DownloadOutlined,
  UploadOutlined,
  FileTextOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ExclamationCircleOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignBottomOutlined,
  HolderOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  SaveOutlined,
  UndoOutlined,
  RedoOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { useParams } from 'react-router-dom'
import { useTableStore } from '@/stores/table'
import EditFieldDialog from '@/renderer/components/EditFieldDialog'
import EditIndexDialog from '@/renderer/components/EditIndexDialog'
import type { Field, Index, CreateIndexParams, UpdateIndexParams } from '@/types/table'
import styles from './style.module.css'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SQLParser } from '@/utils/sqlParser'

const { TabPane } = Tabs
const { Title, Paragraph } = Typography
const { Panel } = Collapse

const TableDetail: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>()
  const {
    selectedTable,
    tables,
    updateTable,
    createField,
    updateField,
    deleteField,
    createIndex,
    updateIndex,
    deleteIndex,
    getTableWithFields
  } = useTableStore()
  const [editFieldDialogOpen, setEditFieldDialogOpen] = useState(false)
  const [editIndexDialogOpen, setEditIndexDialogOpen] = useState(false)
  const [editingField, setEditingField] = useState<Field>()
  const [editingIndex, setEditingIndex] = useState<Index>()
  const [activeTab, setActiveTab] = useState('fields')
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [expandedIndexes, setExpandedIndexes] = useState<string[]>([])
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    if (selectedTable) {
      getTableWithFields(selectedTable.id)
    }
  }, [selectedTable?.id, getTableWithFields])

  // 添加快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        handleUndo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSave = () => {
    message.success('保存成功')
  }

  const handleUndo = () => {
    message.info('撤销操作')
  }

  const handleBatchDelete = async () => {
    if (!selectedTable || selectedRows.length === 0) return

    try {
      // 找到包含这些字段的所有索引
      const relatedIndexes = selectedTable.indexes?.filter(index =>
        index.fields.some(f => selectedRows.includes(f.field.id))
      ) || []

      // 如果有相关索引，先删除这些索引
      if (relatedIndexes.length > 0) {
        await Promise.all(relatedIndexes.map(index => deleteIndex(index.id)))
      }

      // 然后删除字段
      await Promise.all(selectedRows.map(id => deleteField(id)))
      message.success('批量删除成功')
      setSelectedRows([])
      // 重新获取最新数据
      await getTableWithFields(selectedTable.id)
    } catch (error) {
      message.error('批量删除失败')
      console.error('批量删除失败:', error)
    }
  }

  const handleMoveField = async (id: string, type: 'up' | 'down' | 'top' | 'bottom') => {
    if (!selectedTable || !id) return

    const fields = [...selectedTable.fields]
    const index = fields.findIndex(f => f.id === id)
    if (index === -1) return

    const field = fields[index]
    fields.splice(index, 1)

    let newIndex: number
    switch (type) {
      case 'up':
        newIndex = Math.max(0, index - 1)
        break
      case 'down':
        newIndex = Math.min(fields.length, index + 1)
        break
      case 'top':
        newIndex = 0
        break
      case 'bottom':
        newIndex = fields.length
        break
      default:
        return
    }

    fields.splice(newIndex, 0, field)

    try {
      // 更新表数据，确保包含所有必要的字段信息
      await updateTable(selectedTable.id, {
        ...selectedTable,
        fields: fields.map((f, idx) => ({
          ...f,
          orderIndex: idx
        }))
      } as any)

      message.success('字段排序更新成功')
      // 重新获取最新数据
      await getTableWithFields(selectedTable.id)
    } catch (error) {
      console.error('字段排序更新失败:', error)
      message.error('字段排序更新失败')
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !selectedTable) return

    const oldIndex = selectedTable.fields.findIndex(f => f.id === active.id)
    const newIndex = selectedTable.fields.findIndex(f => f.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const newFields = arrayMove([...selectedTable.fields], oldIndex, newIndex)

      try {
        await updateTable(selectedTable.id, {
          name: selectedTable.name,
          comment: selectedTable.comment,
          fields: newFields.map((f, idx) => ({
            ...f,
            orderIndex: idx
          }))
        } as any)

        message.success('字段排序更新成功')
        // 重新获取最新数据
        await getTableWithFields(selectedTable.id)
      } catch (error) {
        message.error('字段排序更新失败')
      }
    }
  }

  const moreActions = [
    {
      key: 'copy',
      label: '复制表结构',
      icon: <CopyOutlined />,
      onClick: () => message.success('表结构已复制到剪贴板')
    },
    {
      key: 'import',
      label: '导入Excel',
      icon: <UploadOutlined />,
      onClick: () => message.info('Excel导入功能开发中')
    },
    {
      key: 'export',
      label: '导出Excel',
      icon: <DownloadOutlined />,
      onClick: () => message.info('Excel导出功能开发中')
    },
    {
      key: 'divider',
      type: 'divider' as const
    },
    {
      key: 'sql',
      label: '生成SQL',
      icon: <FileTextOutlined />,
      onClick: () => message.info('SQL生成功能开发中')
    },
    {
      key: 'import_sql',
      label: '导入建表语句',
      icon: <ImportOutlined />,
      onClick: () => message.info('SQL导入功能开发中')
    }
  ] as const

  if (!selectedTable) {
    return (
      <div className={styles.empty}>
        <TableOutlined />
        <span>请选择一个表</span>
      </div>
    )
  }

  const handleTableNameChange = async (name: string) => {
    try {
      // 检查表名是否重复
      const isNameExists = tables.some(t => t.id !== selectedTable.id && t.name === name)
      if (isNameExists) {
        message.error('表名已存在')
        return
      }
      await updateTable(selectedTable.id, { name, comment: selectedTable.comment })
      message.success('表名更新成功')
    } catch (error) {
      message.error('表名更新失败')
    }
  }

  const handleTableCommentChange = async (comment: string) => {
    try {
      await updateTable(selectedTable.id, { name: selectedTable.name, comment })
      message.success('表注释更新成功')
    } catch (error) {
      message.error('表注释更新失败')
    }
  }

  const handleCreateField = () => {
    setEditingField(undefined)
    setEditFieldDialogOpen(true)
  }

  const handleEditField = (field: Field) => {
    setEditingField(field)
    setEditFieldDialogOpen(true)
  }

  const handleDeleteField = async (fieldId: string) => {
    if (!selectedTable) return

    try {
      // 找到包含这个字段的所有索引
      const relatedIndexes = selectedTable.indexes?.filter(index =>
        index.fields.some(f => f.field.id === fieldId)
      ) || []

      // 如果有相关索引，先删除这些索引
      if (relatedIndexes.length > 0) {
        await Promise.all(relatedIndexes.map(index => deleteIndex(index.id)))
      }

      // 然后删除字段
      await deleteField(fieldId)
      message.success('字段删除成功')
      // 重新获取最新数据
      await getTableWithFields(selectedTable.id)
    } catch (error) {
      message.error('字段删除失败')
      console.error('删除字段失败:', error)
    }
  }

  const handleFieldSubmit = async (values: any) => {
    if (editingField) {
      await updateField(editingField.id, values)
    } else {
      await createField(selectedTable.id, values)
    }
  }

  const handleCreateIndex = () => {
    setEditingIndex(undefined)
    setEditIndexDialogOpen(true)
  }

  const handleEditIndex = (index: Index) => {
    setEditingIndex(index)
    setEditIndexDialogOpen(true)
  }

  const handleDeleteIndex = async (indexId: string) => {
    try {
      await deleteIndex(indexId)
      message.success('索引删除成功')
    } catch (error) {
      message.error('索引删除失败')
    }
  }

  const handleToggleIndexStatus = async (index: Index) => {
    if (!selectedTable) return

    try {
      const params: UpdateIndexParams = {
        name: index.name,
        type: index.type,
        comment: index.comment || '',
        fields: index.fields.map(f => ({
          fieldId: f.field.id,
          sort: f.sort
        })),
        disabled: !index.disabled
      }

      await updateIndex(params)
      message.success(`索引${index.disabled ? '启用' : '禁用'}成功`)
      await getTableWithFields(selectedTable.id)
    } catch (error) {
      console.error('切换索引状态失败:', error)
      message.error(`索引${index.disabled ? '启用' : '禁用'}失败`)
    }
  }

  const handleBatchToggleIndexStatus = async (enabled: boolean) => {
    if (!selectedTable || selectedRows.length === 0) return

    try {
      const indexes = selectedTable.indexes?.filter(index => selectedRows.includes(index.id)) || []
      await Promise.all(
        indexes.map(index => {
          const params: UpdateIndexParams = {
            name: index.name,
            type: index.type,
            comment: index.comment || '',
            fields: index.fields.map(f => ({
              fieldId: f.field.id,
              sort: f.sort
            })),
            disabled: !enabled
          }
          return updateIndex(params)
        })
      )
      message.success(`批量${enabled ? '启用' : '禁用'}索引成功`)
      setSelectedRows([])
      await getTableWithFields(selectedTable.id)
    } catch (error) {
      console.error(`批量${enabled ? '启用' : '禁用'}索引失败:`, error)
      message.error(`批量${enabled ? '启用' : '禁用'}索引失败`)
    }
  }

  const handleIndexSubmit = (index: Index) => {
    if (editingIndex) {
      updateIndex(index)
    } else {
      createIndex(index)
    }
    setEditIndexDialogOpen(false)
  }

  const DraggableRow = ({ children, ...props }: any) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: props['data-row-key']
    })

    const style: React.CSSProperties = {
      ...props.style,
      transform: CSS.Transform.toString(transform),
      transition,
      ...(isDragging ? {
        position: 'relative',
        zIndex: 9999,
        background: '#fafafa',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      } : {})
    }

    return (
      <tr
        {...props}
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
      >
        {children}
      </tr>
    )
  }

  const fieldColumns = [
    {
      title: '',
      dataIndex: 'selection',
      key: 'selection',
      width: 48,
      align: 'center' as const
    },
    {
      title: '字段名',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
      render: (text: string, record: Field) => (
        <Space>
          {record.primaryKey && <Badge status="processing" />}
          <span style={{ color: '#1f1f1f' }}>{text}</span>
        </Space>
      )
    },
    {
      title: '注释',
      dataIndex: 'comment',
      key: 'comment',
      width: 200,
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'typeName',
      key: 'typeName',
      width: 150,
      render: (typeName: string, record: Field) => {
        let typeStr = typeName
        if (record.length) {
          typeStr += `(${record.length})`
        } else if (record.precision) {
          typeStr += `(${record.precision}${record.scale ? `,${record.scale}` : ''})`
        }
        return (
          <Space>
            <DatabaseOutlined />
            {typeStr}
          </Space>
        )
      }
    },
    {
      title: '属性',
      key: 'attributes',
      width: 200,
      render: (_: any, record: Field) => (
        <Space>
          {record.primaryKey && (
            <Tooltip title="主键">
              <KeyOutlined style={{ color: '#1890ff' }} />
            </Tooltip>
          )}
          {!record.nullable && (
            <Tooltip title="不可为空">
              <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            </Tooltip>
          )}
          {record.autoIncrement && (
            <Tooltip title="自增">
              <ArrowUpOutlined style={{ color: '#52c41a' }} />
            </Tooltip>
          )}
        </Space>
      )
    },
    {
      title: '默认值',
      dataIndex: 'defaultValue',
      key: 'defaultValue',
      width: 150,
      render: (value: string) => value || '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_: any, record: Field) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            className={styles.actionButton}
            onClick={() => handleEditField(record)}
          />
          <Popconfirm
            title="确定要删除这个字段吗？"
            onConfirm={() => handleDeleteField(record.id)}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              className={styles.actionButton}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const handleMoveIndex = async (id: string, type: 'up' | 'down' | 'top' | 'bottom') => {
    if (!selectedTable || !id) return

    const indexes = [...(selectedTable.indexes || [])]
    const index = indexes.findIndex(f => f.id === id)
    if (index === -1) return

    const indexItem = indexes[index]
    indexes.splice(index, 1)

    let newIndex: number
    switch (type) {
      case 'up':
        newIndex = Math.max(0, index - 1)
        break
      case 'down':
        newIndex = Math.min(indexes.length, index + 1)
        break
      case 'top':
        newIndex = 0
        break
      case 'bottom':
        newIndex = indexes.length
        break
      default:
        return
    }

    indexes.splice(newIndex, 0, indexItem)

    try {
      await updateTable(selectedTable.id, {
        ...selectedTable,
        indexes: indexes.map((idx, i) => ({
          ...idx,
          orderIndex: i
        }))
      } as any)

      message.success('索引排序更新成功')
      await getTableWithFields(selectedTable.id)
    } catch (error) {
      console.error('索引排序更新失败:', error)
      message.error('索引排序更新失败')
    }
  }

  const indexColumns = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      align: 'center' as const,
      render: (_: any, __: any, index: number) => index + 1
    },
    {
      title: '索引名',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
      render: (text: string, record: Index) => (
        <Space>
          <Tag color={record.type === 'UNIQUE' ? 'blue' : 'default'}>
            {record.type === 'UNIQUE' ? '唯一' : '普通'}
          </Tag>
          <span style={{ fontWeight: 500 }}>{text}</span>
        </Space>
      )
    },
    {
      title: '字段',
      dataIndex: 'fields',
      key: 'fields',
      ellipsis: true,
      render: (fields: any[]) => (
        <Space wrap>
          {fields.map((f, idx) => (
            <Tag
              key={f.field.id}
              color={idx === 0 ? 'blue' : 'default'}
              style={{ margin: '2px' }}
            >
              {f.field.name}
              {f.sort && (
                <Tag
                  color={f.sort === 'ASC' ? 'green' : 'orange'}
                  style={{ marginLeft: 4, marginRight: 0 }}
                >
                  {f.sort === 'ASC' ? '升序' : '降序'}
                </Tag>
              )}
            </Tag>
          ))}
        </Space>
      )
    },
    {
      title: '注释',
      dataIndex: 'comment',
      key: 'comment',
      width: 200,
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right' as const,
      render: (_: any, record: Index) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            className={styles.actionButton}
            onClick={() => handleEditIndex(record)}
          />
          <Popconfirm
            title="确定要删除这个索引吗？"
            onConfirm={() => handleDeleteIndex(record.id)}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              className={styles.actionButton}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const expandedRowRender = (record: Index) => {
    const columns = [
      {
        title: '字段名',
        dataIndex: ['field', 'name'],
        key: 'fieldName',
        width: 200,
        render: (text: string, field: any) => (
          <Space>
            <DatabaseOutlined />
            <span>{text}</span>
            {field.field.primaryKey && <Tag color="blue">主键</Tag>}
            {!field.field.nullable && <Tag color="red">非空</Tag>}
          </Space>
        )
      },
      {
        title: '字段类型',
        key: 'fieldType',
        width: 150,
        render: (_: any, field: any) => {
          let typeStr = field.field.typeName
          if (field.field.length) {
            typeStr += `(${field.field.length})`
          } else if (field.field.precision) {
            typeStr += `(${field.field.precision}${field.field.scale ? `,${field.field.scale}` : ''})`
          }
          return typeStr
        }
      },
      {
        title: '排序方式',
        dataIndex: 'sort',
        key: 'sort',
        width: 100,
        render: (sort: string) => (
          <Tag color={sort === 'ASC' ? 'green' : 'orange'}>
            {sort === 'ASC' ? '升序' : '降序'}
          </Tag>
        )
      },
      {
        title: '注释',
        dataIndex: ['field', 'comment'],
        key: 'comment',
        ellipsis: true
      }
    ]

    return (
      <div className={styles.expandedContent}>
        <Table
          columns={columns}
          dataSource={record.fields}
          pagination={false}
          size="small"
        />
      </div>
    )
  }

  const handleBatchDeleteIndexes = async () => {
    if (!selectedTable || selectedRows.length === 0) return

    try {
      await Promise.all(selectedRows.map(id => deleteIndex(id)))
      message.success('批量删除索引成功')
      setSelectedRows([])
      // 重新获取最新数据
      await getTableWithFields(selectedTable.id)
    } catch (error) {
      message.error('批量删除索引失败')
      console.error('批量删除索引失败:', error)
    }
  }

  const renderContent = () => {
    if (activeTab === 'fields') {
      return (
        <div className={styles.configContent}>
          <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateField}
              >
                添加字段
              </Button>
              <div className={styles.moveButtons}>
                <Tooltip title="置顶">
                  <Button
                    icon={<VerticalAlignTopOutlined />}
                    disabled={selectedRows.length !== 1}
                    onClick={() => handleMoveField(selectedRows[0], 'top')}
                  />
                </Tooltip>
                <Tooltip title="上移">
                  <Button
                    icon={<ArrowUpOutlined />}
                    disabled={selectedRows.length !== 1}
                    onClick={() => handleMoveField(selectedRows[0], 'up')}
                  />
                </Tooltip>
                <Tooltip title="下移">
                  <Button
                    icon={<ArrowDownOutlined />}
                    disabled={selectedRows.length !== 1}
                    onClick={() => handleMoveField(selectedRows[0], 'down')}
                  />
                </Tooltip>
                <Tooltip title="置底">
                  <Button
                    icon={<VerticalAlignBottomOutlined />}
                    disabled={selectedRows.length !== 1}
                    onClick={() => handleMoveField(selectedRows[0], 'bottom')}
                  />
                </Tooltip>
              </div>
              {selectedRows.length > 0 && (
                <Popconfirm
                  title={`确定要删除选中的 ${selectedRows.length} 个字段吗？`}
                  onConfirm={handleBatchDelete}
                >
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                  >
                    批量删除
                  </Button>
                </Popconfirm>
              )}
            </div>
            <div className={styles.toolbarRight}>
              <Button
                icon={<DatabaseOutlined />}
                onClick={() => message.info('字段模板功能开发中')}
              >
                字段模板
              </Button>
            </div>
          </div>
          <Table
            columns={fieldColumns}
            dataSource={selectedTable?.fields}
            rowKey="id"
            scroll={{ x: 'max-content' }}
            pagination={false}
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys: selectedRows,
              onChange: (selectedRowKeys) => setSelectedRows(selectedRowKeys as string[])
            }}
            onRow={(record) => ({
              onDoubleClick: () => handleEditField(record),
              'data-row-key': record.id
            })}
          />
        </div>
      )
    }

    return (
      <div className={styles.configContent}>
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateIndex}
            >
              添加索引
            </Button>
            {selectedRows.length > 0 && (
              <Popconfirm
                title={`确定要删除选中的 ${selectedRows.length} 个索引吗？`}
                onConfirm={handleBatchDeleteIndexes}
              >
                <Button
                  danger
                  icon={<DeleteOutlined />}
                >
                  批量删除
                </Button>
              </Popconfirm>
            )}
          </div>
        </div>
        <Table
          columns={indexColumns}
          dataSource={selectedTable?.indexes}
          rowKey="id"
          scroll={{ x: 'max-content' }}
          pagination={false}
          expandable={{
            expandedRowRender,
            expandedRowKeys: expandedIndexes,
            onExpand: (expanded, record) => {
              setExpandedIndexes(prev =>
                expanded
                  ? [...prev, record.id]
                  : prev.filter(id => id !== record.id)
              )
            }
          }}
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: selectedRows,
            onChange: (selectedRowKeys) => setSelectedRows(selectedRowKeys as string[])
          }}
        />
      </div>
    )
  }

  return (
    <div className={styles.container}>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className={styles.tabs}
        items={[
          {
            key: 'fields',
            label: (
              <>
                <DatabaseOutlined />
                字段
                <Badge count={selectedTable.fields.length} style={{ marginLeft: 8 }} />
              </>
            )
          },
          {
            key: 'indexes',
            label: (
              <>
                <KeyOutlined />
                索引
                <Badge count={selectedTable.indexes?.length || 0} style={{ marginLeft: 8 }} />
              </>
            )
          }
        ]}
      />

      <Collapse
        defaultActiveKey={['tableConfig']}
        expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
        className={styles.tableConfig}
      >
        <Panel
          header={
            <Space>
              <TableOutlined />
              表配置
            </Space>
          }
          key="tableConfig"
        >
          <div className={styles.header}>
            <Title level={4} editable={{ onChange: handleTableNameChange }} className={styles.tableTitle}>
              {selectedTable.name}
            </Title>
            <Paragraph editable={{ onChange: handleTableCommentChange }} className={styles.tableComment}>
              {selectedTable.comment || '添加表注释...'}
            </Paragraph>
          </div>
        </Panel>
      </Collapse>

      {renderContent()}

      <EditFieldDialog
        open={editFieldDialogOpen}
        onClose={() => setEditFieldDialogOpen(false)}
        onSubmit={handleFieldSubmit}
        field={editingField}
        title={editingField ? '编辑字段' : '新建字段'}
      />

      <EditIndexDialog
        open={editIndexDialogOpen}
        onClose={() => setEditIndexDialogOpen(false)}
        onSubmit={handleIndexSubmit}
        index={editingIndex}
        tableId={selectedTable.id}
        fields={selectedTable.fields}
        title={editingIndex ? '编辑索引' : '新建索引'}
      />
    </div>
  )
}

export default TableDetail
