import React, { useEffect } from 'react'
import { Modal, Form, Input, Select, message } from 'antd'
import type { Index, CreateIndexParams, UpdateIndexParams, Field } from '@/types/table'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (values: CreateIndexParams | UpdateIndexParams) => Promise<void>
  index?: Index
  fields: Field[]
  title?: string
}

const EditIndexDialog: React.FC<Props> = ({ 
  open, 
  onClose, 
  onSubmit,
  index,
  fields,
  title = '新建索引'
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = React.useState(false)

  useEffect(() => {
    if (open && index) {
      form.setFieldsValue({
        name: index.name,
        type: index.type,
        comment: index.comment,
        fields: index.fields.map(f => f.fieldId)
      })
    } else if (open) {
      form.resetFields()
    }
  }, [open, index, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      await onSubmit(values)
      message.success(index ? '索引更新成功' : '索引创建成功')
      form.resetFields()
      onClose()
    } catch (error) {
      console.error('Failed to submit index:', error)
      message.error(index ? '索引更新失败' : '索引创建失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="name"
          label="索引名"
          rules={[
            { required: true, message: '请输入索引名' },
            { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '索引名必须以字母开头，只能包含字母、数字和下划线' }
          ]}
        >
          <Input placeholder="请输入索引名" />
        </Form.Item>

        <Form.Item
          name="type"
          label="索引类型"
          rules={[{ required: true, message: '请选择索引类型' }]}
        >
          <Select
            placeholder="请选择索引类型"
            options={[
              { label: '普通索引', value: 'NORMAL' },
              { label: '唯一索引', value: 'UNIQUE' },
              { label: '全文索引', value: 'FULLTEXT' }
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
          />
        </Form.Item>

        <Form.Item
          name="fields"
          label="索引字段"
          rules={[{ required: true, message: '请选择至少一个字段' }]}
        >
          <Select
            mode="multiple"
            placeholder="请选择字段"
            options={fields.map(field => ({
              label: field.name,
              value: field.id
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default EditIndexDialog 