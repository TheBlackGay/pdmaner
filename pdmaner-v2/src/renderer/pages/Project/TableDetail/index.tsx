import React, { useState, useEffect } from 'react'
import { Tabs, Table, Button, Space, Popconfirm, message, Typography, Tooltip, Collapse, Checkbox } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, CaretRightOutlined } from '@ant-design/icons'
import { useParams } from 'react-router-dom'
import { useTableStore } from '@/stores/table'
import EditFieldDialog from '@/renderer/components/EditFieldDialog'
import EditIndexDialog from '@/renderer/components/EditIndexDialog'
import type { Field, Index } from '@/types/table'
import styles from './style.module.css'

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

  useEffect(() => {
    if (selectedTable) {
      getTableWithFields(selectedTable.id)
    }
  }, [selectedTable?.id, getTableWithFields])

  if (!selectedTable) {
    return (
      <div className={styles.empty}>
        请选择一个表
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
    try {
      await deleteField(fieldId)
      message.success('字段删除成功')
    } catch (error) {
      message.error('字段删除失败')
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
      title: '字段名',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '注释',
      dataIndex: 'comment',
      key: 'comment',
      width: 200,
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
        return typeStr
      }
    },
    {
      title: '主键',
      dataIndex: 'primaryKey',
      key: 'primaryKey',
      width: 80,
      render: (value: boolean) => value ? '是' : '否',
    },
    {
      title: '可空',
      dataIndex: 'nullable',
      key: 'nullable',
      width: 80,
      render: (value: boolean) => value ? '是' : '否',
    },
    {
      title: '自增',
      dataIndex: 'autoIncrement',
      key: 'autoIncrement',
      width: 80,
      render: (value: boolean) => value ? '是' : '否',
    },
    {
      title: '默认值',
      dataIndex: 'defaultValue',
      key: 'defaultValue',
      width: 150,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: Field) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
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
            />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const renderContent = () => {
    if (activeTab === 'fields') {
      return (
        <div className={styles.configContent}>
          <div className={styles.toolbar}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleCreateField}
            >
              添加字段
            </Button>
          </div>
          <Table
            columns={fieldColumns}
            dataSource={selectedTable.fields}
            rowKey="id"
            scroll={{ x: 'max-content' }}
            pagination={false}
          />
        </div>
      )
    }

    return (
      <div className={styles.configContent}>
        <div className={styles.toolbar}>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleCreateIndex}
          >
            添加索引
          </Button>
        </div>
        <div className={styles.indexList}>
          <div className={styles.indexHeader}>
            <div className={styles.indexHeaderCell}>序号</div>
            <div className={styles.indexHeaderCell}>展开</div>
            <div className={styles.indexHeaderCell}>索引名</div>
            <div className={styles.indexHeaderCell}>是否唯一</div>
            <div className={styles.indexHeaderCell}>描述</div>
            <div className={styles.indexHeaderCell}>操作</div>
          </div>
          {(selectedTable.indexes || []).map((index, idx) => (
            <div key={index.id} className={styles.indexItem}>
              <div className={styles.indexCell}>{idx + 1}</div>
              <div className={styles.indexCell}>
                <CaretRightOutlined />
              </div>
              <div className={styles.indexCell}>{index.name}</div>
              <div className={styles.indexCell}>
                <Checkbox checked={index.type === 'UNIQUE'} disabled />
              </div>
              <div className={styles.indexCell}>{index.comment || '-'}</div>
              <div className={styles.indexCell}>
                <Space>
                  <Button
                    type="text"
                    icon={<EditOutlined />}
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
      {/* Tab栏 */}
      <Tabs 
        activeKey={activeTab}
        onChange={setActiveTab}
        className={styles.tabs}
      >
        <TabPane tab="字段" key="fields" />
        <TabPane tab="索引" key="indexes" />
      </Tabs>

      {/* 表配置区域 */}
      <Collapse
        defaultActiveKey={['tableConfig']}
        expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
        className={styles.tableConfig}
      >
        <Panel header="表配置" key="tableConfig">
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

      {/* 字段/索引配置区域 */}
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