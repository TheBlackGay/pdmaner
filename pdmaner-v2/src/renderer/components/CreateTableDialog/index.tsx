import React from 'react'
import { Modal, Form, Input, message } from 'antd'
import { useParams } from 'react-router-dom'
import type { CreateTableParams } from '@/types/table'
import { useTableStore } from '@/stores/table'

interface Props {
  open: boolean
  onClose: () => void
}

const CreateTableDialog: React.FC<Props> = ({ open, onClose }) => {
  const [form] = Form.useForm()
  const { id: projectId } = useParams<{ id: string }>()
  const { createTable, tables } = useTableStore()
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async () => {
    if (!projectId) return
    try {
      const values = await form.validateFields()
      
      // 检查表名是否重复
      const isNameExists = tables.some(t => t.name === values.name)
      if (isNameExists) {
        message.error('表名已存在')
        return
      }

      setLoading(true)
      await createTable(projectId, values as CreateTableParams)
      message.success('表创建成功')
      form.resetFields()
      onClose()
    } catch (error) {
      console.error('Failed to create table:', error)
      message.error('表创建失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title="新建表"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="name"
          label="表名"
          rules={[
            { required: true, message: '请输入表名' },
            { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '表名必须以字母开头,只能包含字母、数字和下划线' }
          ]}
        >
          <Input placeholder="请输入表名" />
        </Form.Item>

        <Form.Item
          name="comment"
          label="表注释"
        >
          <Input.TextArea
            placeholder="请输入表注释"
            rows={3}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default CreateTableDialog 