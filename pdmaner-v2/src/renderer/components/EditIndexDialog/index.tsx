import React, { useEffect } from 'react'
import { Modal, Form, Input, Select, Space, Tooltip, Button, Table, message, Tag } from 'antd'
import type { Field, Index, CreateIndexParams, UpdateIndexParams } from '@/types/table'
import { QuestionCircleOutlined, DeleteOutlined, PlusOutlined, DatabaseOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
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
          comment: index.comment
        })
        setSelectedFields(index.fields.map(f => ({
          fieldId: f.field.id,
          sort: f.sort || 'ASC'
        })))
      } else {
        form.resetFields()
        form.setFieldsValue({
          type: 'NORMAL'
        })
        setSelectedFields([])
      }
    }
  }, [open, index, form])

  const handleAddField = (fieldIds: string[]) => {
    if (!fieldIds.length) return
    const newFields = fieldIds
      .filter(id => !selectedFields.some(f => f.fieldId === id))
      .map(id => ({ fieldId: id, sort: 'ASC' }))
    setSelectedFields(prev => [...prev, ...newFields])
  }

  const handleRemoveField = (fieldId: string) => {
    setSelectedFields(prev => prev.filter(f => f.fieldId !== fieldId))
  }

  const handleSortChange = (fieldId: string, sort: 'ASC' | 'DESC') => {
    setSelectedFields(prev =>
      prev.map(f => f.fieldId === fieldId ? { ...f, sort } : f)
    )
  }

  const handleMoveField = (fieldId: string, direction: 'up' | 'down') => {
    const index = selectedFields.findIndex(f => f.fieldId === fieldId)
    if (index === -1) return

    const newFields = [...selectedFields]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    const field = newFields[index]
    newFields.splice(index, 1)
    newFields.splice(newIndex, 0, field)
    setSelectedFields(newFields)
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
          disabled: false
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
      title: '序号',
      key: 'index',
      width: 60,
      align: 'center' as const,
      render: (_: any, __: any, index: number) => index + 1
    },
    {
      title: '字段名',
      dataIndex: 'fieldId',
      key: 'fieldName',
      render: (fieldId: string) => {
        const field = fields.find(f => f.id === fieldId)
        return (
          <Space>
            <DatabaseOutlined />
            <span>{field?.name || fieldId}</span>
            {field?.primaryKey && <Tag color="blue">主键</Tag>}
            {!field?.nullable && <Tag color="red">非空</Tag>}
          </Space>
        )
      }
    },
    {
      title: '字段类型',
      key: 'fieldType',
      width: 150,
      render: (_: any, record: any) => {
        const field = fields.find(f => f.id === record.fieldId)
        if (!field) return '-'
        let typeStr = field.typeName
        if (field.length) {
          typeStr += `(${field.length})`
        } else if (field.precision) {
          typeStr += `(${field.precision}${field.scale ? `,${field.scale}` : ''})`
        }
        return typeStr
      }
    },
    {
      title: '排序方式',
      dataIndex: 'sort',
      key: 'sort',
      width: 120,
      align: 'center' as const,
      render: (sort: string, record: any, index: number) => (
        <Select
          value={sort || 'ASC'}
          onChange={(value) => handleSortChange(record.fieldId, value)}
          style={{ width: 100 }}
          options={[
            { label: '升序', value: 'ASC' },
            { label: '降序', value: 'DESC' }
          ]}
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      align: 'center' as const,
      render: (_: any, record: any, index: number) => (
        <Space>
          {index !== 0 && (
            <Button
              type="text"
              icon={<ArrowUpOutlined />}
              onClick={() => handleMoveField(record.fieldId, 'up')}
            />
          )}
          {index !== selectedFields.length - 1 && (
            <Button
              type="text"
              icon={<ArrowDownOutlined />}
              onClick={() => handleMoveField(record.fieldId, 'down')}
            />
          )}
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleRemoveField(record.fieldId)}
          />
        </Space>
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
      width={900}
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
              { label: '唯一索引', value: 'UNIQUE' }
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
            <div className={styles.fieldSelectorHeader}>
              <Select
                mode="multiple"
                placeholder="请选择要添加的字段（可多选）"
                value={undefined}
                onChange={handleAddField}
                options={availableFields.map(field => ({
                  label: (
                    <Space>
                      <DatabaseOutlined />
                      <span>{field.name}</span>
                      {field.primaryKey && <Tag color="blue">主键</Tag>}
                      {!field.nullable && <Tag color="red">非空</Tag>}
                    </Space>
                  ),
                  value: field.id
                }))}
                style={{ width: '100%' }}
                optionLabelProp="label"
                notFoundContent="没有可选的字段"
                maxTagCount="responsive"
                allowClear
                onClear={() => {}}
              />
            </div>
            <Table
              columns={selectedFieldColumns}
              dataSource={selectedFields}
              rowKey="fieldId"
              pagination={false}
              size="middle"
            />
          </div>
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default EditIndexDialog
