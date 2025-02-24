import React, { useState, useEffect } from 'react'
import { Tabs, Table, Button, Space, Popconfirm, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTableStore } from '@/stores/table'
import EditFieldDialog from '@/renderer/components/EditFieldDialog'
import type { Field } from '@/types/table'
import styles from './style.module.css'

const { TabPane } = Tabs

const TableDetail: React.FC = () => {
  const { selectedTable, createField, updateField, deleteField } = useTableStore()
  const [editFieldDialogOpen, setEditFieldDialogOpen] = useState(false)
  const [editingField, setEditingField] = useState<Field>()

  useEffect(() => {
    setEditFieldDialogOpen(false)
    setEditingField(undefined)
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

  const columns = [
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
            columns={columns}
            dataSource={selectedTable.fields}
            rowKey="id"
            scroll={{ x: 'max-content' }}
            pagination={false}
          />
        </TabPane>
        <TabPane tab="索引" key="indexes">
          索引管理
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
    </div>
  )
}

export default TableDetail 