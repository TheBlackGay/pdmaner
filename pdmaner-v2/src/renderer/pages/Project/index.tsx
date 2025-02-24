import React, { useState, useEffect } from 'react'
import { Button, Table, Space, Modal, Form, Input, message, Tooltip, Select } from 'antd'
import { PlusOutlined, ImportOutlined, DatabaseOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { useTableStore } from '@/stores/table'
import { SQLParser } from '@/utils/sqlParser'
import styles from './style.module.css'

const Project: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { tables, getTables, createTable } = useTableStore()
  const [loading, setLoading] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importForm] = Form.useForm()

  useEffect(() => {
    if (projectId) {
      loadTables()
    }
  }, [projectId])

  const loadTables = async () => {
    if (!projectId) return
    setLoading(true)
    try {
      await getTables(projectId)
    } finally {
      setLoading(false)
    }
  }

  const handleImportSQL = async () => {
    if (!projectId) return

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
          const newTable = await createTable(projectId, table)

          // 创建字段
          for (const field of fields) {
            await createField(newTable.id, field)
          }

          // 创建索引
          for (const index of indexes) {
            // 需要将字段名转换为字段ID
            const fieldMap = new Map(fields.map(f => [f.name, f.id]))
            const indexFields = index.fields.map(f => ({
              ...f,
              fieldId: fieldMap.get(f.fieldId) || f.fieldId
            }))

            await createIndex(newTable.id, {
              ...index,
              fields: indexFields
            })
          }
        } catch (error) {
          console.error(`创建表 ${table.name} 失败:`, error)
          message.error(`创建表 ${table.name} 失败: ${(error as Error).message}`)
        }
      }

      message.success(`成功导入 ${tables.length} 个表`)
      setImportDialogOpen(false)
      importForm.resetFields()
      await loadTables()
    } catch (error) {
      console.error('导入失败:', error)
      message.error('导入失败: ' + (error as Error).message)
    }
  }

  const columns = [
    {
      title: '表名',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Space>
          <DatabaseOutlined />
          {text}
        </Space>
      )
    },
    {
      title: '注释',
      dataIndex: 'comment',
      key: 'comment',
      ellipsis: true
    },
    {
      title: '字段数',
      dataIndex: 'fields',
      key: 'fieldCount',
      width: 100,
      render: (fields: any[]) => fields?.length || 0
    },
    {
      title: '索引数',
      dataIndex: 'indexes',
      key: 'indexCount',
      width: 100,
      render: (indexes: any[]) => indexes?.length || 0
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 200,
      render: (text: string) => new Date(text).toLocaleString()
    }
  ]

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate(`/projects/${projectId}/tables/new`)}
          >
            新建表
          </Button>
          <Button
            icon={<ImportOutlined />}
            onClick={() => setImportDialogOpen(true)}
          >
            批量导入
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={tables}
        rowKey="id"
        loading={loading}
        pagination={false}
        onRow={(record) => ({
          onClick: () => navigate(`/projects/${projectId}/tables/${record.id}`)
        })}
      />

      <Modal
        title="批量导入表"
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
            help="可以输入多个建表语句，每个语句以分号分隔"
          >
            <Input.TextArea
              placeholder={`示例：
CREATE TABLE user (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL COMMENT '用户名',
  email VARCHAR(100) COMMENT '邮箱',
  PRIMARY KEY (id)
) COMMENT='用户表';

CREATE TABLE post (
  id INT NOT NULL AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL COMMENT '标题',
  content TEXT COMMENT '内容',
  user_id INT NOT NULL COMMENT '作者ID',
  PRIMARY KEY (id),
  KEY idx_user (user_id)
) COMMENT='文章表';`}
              rows={20}
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Project 