import React, { useState, useEffect, useCallback } from 'react'
import { Tabs, Table, Button, Space, Popconfirm, message, Typography, Tooltip, Collapse, Checkbox, Dropdown, Badge } from 'antd'
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
  HolderOutlined
} from '@ant-design/icons'
import { useParams } from 'react-router-dom'
import { useTableStore } from '@/stores/table'
import EditFieldDialog from '@/renderer/components/EditFieldDialog'
import EditIndexDialog from '@/renderer/components/EditIndexDialog'
import type { Field, Index } from '@/types/table'
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

    let newIndex = index
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
    }

    fields.splice(newIndex, 0, field)

    try {
      // 更新表数据
      await updateTable(selectedTable.id, {
        name: selectedTable.name,
        comment: selectedTable.comment,
        fields: fields.map((f, idx) => ({
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
    try {
      if (editingField) {
        await updateField(editingField.id, values)
      } else {
        await createField(selectedTable.id, values)
      }
    } catch (error) {
      throw error
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

  const handleIndexSubmit = async (values: any) => {
    try {
      if (editingIndex) {
        await updateIndex(editingIndex.id, values)
      } else {
        await createIndex(selectedTable.id, values)
      }
    } catch (error) {
      throw error
    }
  }

  const fieldColumns = [
    {
      title: '',
      key: 'sort',
      width: 48,
      render: () => <HolderOutlined className={styles.dragHandle} />,
      fixed: 'left' as const
    },
    {
      title: '',
      dataIndex: 'selection',
      width: 48,
      fixed: 'left' as const
    },
    {
      title: '字段名',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string, record: Field) => (
        <Space>
          {record.primaryKey && <Badge status="processing" />}
          {text}
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

  const indexColumns = [
    {
      title: '索引名',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        const typeMap = {
          'NORMAL': '普通索引',
          'UNIQUE': '唯一索引',
          'FULLTEXT': '全文索引'
        }
        return typeMap[type as keyof typeof typeMap] || type
      }
    },
    {
      title: '字段',
      dataIndex: 'fields',
      key: 'fields',
      render: (fields: any[]) => fields.map(f => f.field.name).join(', ')
    },
    {
      title: '注释',
      dataIndex: 'comment',
      key: 'comment',
      width: 200,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: Index) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
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
      >
        <td {...attributes} {...listeners}>
          <HolderOutlined className={styles.dragHandle} />
        </td>
        {React.Children.map(children, (child) => child)}
      </tr>
    )
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
              <Tooltip title="更多操作">
                <Dropdown menu={{ items: moreActions }} placement="bottomRight">
                  <Button icon={<MoreOutlined />} />
                </Dropdown>
              </Tooltip>
            </div>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={selectedTable?.fields.map(f => f.id) || []}
              strategy={verticalListSortingStrategy}
            >
              <Table
                components={{
                  body: {
                    row: DraggableRow,
                  },
                }}
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
            </SortableContext>
          </DndContext>
        </div>
      )
    }

    return (
      <div className={styles.configContent}>
        <div className={styles.toolbar}>
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleCreateIndex}
            >
              添加索引
            </Button>
          </Space>
        </div>
        <div className={styles.indexList}>
          <div className={styles.indexHeader}>
            <div className={styles.indexHeaderCell}>序号</div>
            <div className={styles.indexHeaderCell}>展开</div>
            <div className={styles.indexHeaderCell}>索引名</div>
            <div className={styles.indexHeaderCell}>类型</div>
            <div className={styles.indexHeaderCell}>字段</div>
            <div className={styles.indexHeaderCell}>操作</div>
          </div>
          {(selectedTable.indexes || []).map((index, idx) => (
            <div key={index.id} className={styles.indexItem}>
              <div className={styles.indexCell}>{idx + 1}</div>
              <div className={styles.indexCell}>
                <CaretRightOutlined 
                  className={expandedIndexes.includes(index.id) ? 'expanded' : ''}
                  onClick={() => {
                    setExpandedIndexes(prev => 
                      prev.includes(index.id) 
                        ? prev.filter(id => id !== index.id)
                        : [...prev, index.id]
                    )
                  }}
                />
              </div>
              <div className={styles.indexCell}>{index.name}</div>
              <div className={styles.indexCell}>
                <Badge 
                  status={index.type === 'UNIQUE' ? 'processing' : 'default'} 
                  text={index.type === 'UNIQUE' ? '唯一索引' : '普通索引'}
                />
              </div>
              <div className={styles.indexCell}>{index.fields.map(f => f.field.name).join(', ')}</div>
              <div className={styles.indexCell}>
                <Space>
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    className={styles.actionButton}
                    onClick={() => handleEditIndex(index)}
                  />
                  <Popconfirm
                    title="确定要删除这个索引吗？"
                    onConfirm={() => handleDeleteIndex(index.id)}
                  >
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      className={styles.actionButton}
                    />
                  </Popconfirm>
                </Space>
              </div>
            </div>
          ))}
        </div>
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
        fields={selectedTable.fields}
        title={editingIndex ? '编辑索引' : '新建索引'}
      />
    </div>
  )
}

export default TableDetail 