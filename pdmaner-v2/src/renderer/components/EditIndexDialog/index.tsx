import React, { useEffect } from 'react'
import { Modal, Form, Input, Select, Space, Tooltip, Button, Switch, Table, message } from 'antd'
import type { Field, Index, CreateIndexParams, UpdateIndexParams } from '@/types/table'
import { QuestionCircleOutlined, DeleteOutlined } from '@ant-design/icons'
import styles from './style.module.css'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (values: CreateIndexParams | UpdateIndexParams) => Promise<void>
  index?: Index
  tableId: string
  fields: Field[]
  title?: string
}

const EditIndexDialog: React.FC<Props> = ({
  open,
  onClose,
  onSubmit,
  index,
  tableId,
  fields,
  title = '新建索引'
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = React.useState(false)
  const [selectedFields, setSelectedFields] = React.useState<Array<{
    fieldId: string
    sort: 'ASC' | 'DESC'
  }>>([])

  useEffect(() => {
    if (open) {
      if (index) {
        form.setFieldsValue({
          name: index.name,
          type: index.type,
          comment: index.comment,
          disabled: index.disabled
        })
        setSelectedFields(index.fields.map(f => ({
          fieldId: f.field.id,
          sort: f.sort || 'ASC'
        })))
      } else {
        form.resetFields()
        form.setFieldsValue({
          type: 'NORMAL',
          disabled: false
        })
        setSelectedFields([])
      }
    }
  }, [open, index, form])

  const handleAddField = (fieldId: string) => {
    if (!fieldId || selectedFields.some(f => f.fieldId === fieldId)) return
    setSelectedFields(prev => [...prev, { fieldId, sort: 'ASC' }])
  }

  const handleRemoveField = (fieldId: string) => {
    setSelectedFields(prev => prev.filter(f => f.fieldId !== fieldId))
  }

  const handleSortChange = (fieldId: string, sort: 'ASC' | 'DESC') => {
    setSelectedFields(prev =>
      prev.map(f => f.fieldId === fieldId ? { ...f, sort } : f)
    )
  }

  const handleSubmit = async () => {
    try {
      if (selectedFields.length === 0) {
        message.error('请至少选择一个字段')
        return
      }

      const values = await form.validateFields()
      setLoading(true)

      try {
        const params = {
          name: values.name.trim(),
          type: values.type,
          comment: values.comment?.trim() || '',
          fields: selectedFields.map(f => ({
            fieldId: f.fieldId,
            sort: f.sort
          })),
          disabled: values.disabled || false
        }

        await onSubmit(params)
        form.resetFields()
        setSelectedFields([])
        onClose()
      } catch (error) {
        console.error('Failed to submit index:', error)
        message.error('提交失败：' + (error as Error).message)
      } finally {
        setLoading(false)
      }
    } catch (error) {
      message.error('表单验证失败，请检查填写的内容')
    }
  }

  const selectedFieldColumns = [
    {
      title: '字段名',
      dataIndex: 'fieldId',
      key: 'fieldName',
      render: (fieldId: string) => {
        const field = fields.find(f => f.id === fieldId)
        return field?.name || fieldId
      }
    },
    {
      title: '排序方式',
      dataIndex: 'sort',
      key: 'sort',
      width: 120,
      render: (_: any, record: any) => (
        <Select
          value={record.sort}
          onChange={(value) => handleSortChange(record.fieldId, value)}
          options={[
            { label: '升序', value: 'ASC' },
            { label: '降序', value: 'DESC' }
          ]}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: any) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveField(record.fieldId)}
        />
      )
    }
  ]

  const availableFields = fields.filter(
    field => !selectedFields.some(f => f.fieldId === field.id)
  )

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={800}
      maskClosable={false}
      keyboard={false}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
      >
        <Form.Item
          name="name"
          label="索引名"
          rules={[
            { required: true, message: '请输入索引名' },
            { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '索引名必须以字母开头，只能包含字母、数字和下划线' }
          ]}
        >
          <Input
            placeholder="请输入索引名"
            autoFocus
            allowClear
          />
        </Form.Item>

        <Form.Item
          name="type"
          label="索引类型"
          initialValue="NORMAL"
          rules={[{ required: true, message: '请选择索引类型' }]}
        >
          <Select
            options={[
              { label: '普通索引', value: 'NORMAL' },
              { label: '唯一索引', value: 'UNIQUE' },
              { label: '全文索引', value: 'FULLTEXT' },
              { label: '空间索引', value: 'SPATIAL' }
            ]}
          />
        </Form.Item>

        <Form.Item
          name="comment"
          label="注释"
        >
          <Input.TextArea
            placeholder="请输入注释"
            rows={2}
            maxLength={200}
            showCount
            allowClear
          />
        </Form.Item>

        <Form.Item
          name="disabled"
          label="状态"
          valuePropName="checked"
          initialValue={false}
        >
          <Switch
            checkedChildren="启用"
            unCheckedChildren="禁用"
          />
        </Form.Item>

        <Form.Item
          label={
            <Space>
              索引字段
              <Tooltip title="请至少选择一个字段">
                <QuestionCircleOutlined />
              </Tooltip>
            </Space>
          }
          required
          validateStatus={selectedFields.length === 0 ? 'error' : 'success'}
          help={selectedFields.length === 0 ? '请选择至少一个字段' : undefined}
        >
          <div className={styles.fieldSelector}>
            <Select
              placeholder="请选择字段"
              value={undefined}
              onChange={handleAddField}
              options={availableFields.map(field => ({
                label: field.name,
                value: field.id
              }))}
              style={{ width: '100%', marginBottom: 16 }}
            />
            <Table
              columns={selectedFieldColumns}
              dataSource={selectedFields}
              rowKey="fieldId"
              pagination={false}
              size="small"
            />
          </div>
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default EditIndexDialog
