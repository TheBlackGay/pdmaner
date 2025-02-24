import React, { useState, useEffect } from 'react'
import { Tabs, Table, Button, Space, Popconfirm, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTableStore } from '@/stores/table'
import EditFieldDialog from '@/renderer/components/EditFieldDialog'
import EditIndexDialog from '@/renderer/components/EditIndexDialog'
import type { Field, Index } from '@/types/table'
import styles from './style.module.css'

const { TabPane } = Tabs

const TableDetail: React.FC = () => {
  const { selectedTable, createField, updateField, deleteField, createIndex, updateIndex, deleteIndex } = useTableStore()
  const [editFieldDialogOpen, setEditFieldDialogOpen] = useState(false)
  const [editIndexDialogOpen, setEditIndexDialogOpen] = useState(false)
  const [editingField, setEditingField] = useState<Field>()
  const [editingIndex, setEditingIndex] = useState<Index>()

  useEffect(() => {
    setEditFieldDialogOpen(false)
    setEditIndexDialogOpen(false)
    setEditingField(undefined)
    setEditingIndex(undefined)
  }, [selectedTable])

  if (!selectedTable) {
    return (
      <div className={styles.empty}>
        请选择一个表
      </div>
    )
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{selectedTable.name}</h2>
        {selectedTable.comment && (
          <div className={styles.comment}>{selectedTable.comment}</div>
        )}
      </div>

      <Tabs defaultActiveKey="fields">
        <TabPane tab="字段" key="fields">
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
        </TabPane>
        <TabPane tab="索引" key="indexes">
          <div className={styles.toolbar}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleCreateIndex}
            >
              添加索引
            </Button>
          </div>
          <Table
            columns={indexColumns}
            dataSource={selectedTable.indexes}
            rowKey="id"
            scroll={{ x: 'max-content' }}
            pagination={false}
          />
        </TabPane>
        <TabPane tab="约束" key="constraints">
          约束管理
        </TabPane>
      </Tabs>

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