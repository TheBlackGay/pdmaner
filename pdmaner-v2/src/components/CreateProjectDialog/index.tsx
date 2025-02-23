import React from 'react'
import { Modal, Form, Input, Select, message } from 'antd'
import type { CreateProjectParams } from '@/types/project'
import { useProjectStore } from '@/stores/project'

interface Props {
  open: boolean
  onClose: () => void
}

const DATABASE_TYPES = [
  { label: 'MySQL', value: 'MySQL' },
  { label: 'PostgreSQL', value: 'PostgreSQL' },
  { label: 'Oracle', value: 'Oracle' },
  { label: 'SQL Server', value: 'SQLServer' },
]

const CreateProjectDialog: React.FC<Props> = ({ open, onClose }) => {
  const [form] = Form.useForm()
  const { createProject } = useProjectStore()
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      await createProject(values as CreateProjectParams)
      message.success('项目创建成功')
      form.resetFields()
      onClose()
    } catch (error) {
      console.error('Failed to create project:', error)
      message.error('项目创建失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title="新建项目"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          database: {
            type: 'MySQL'
          }
        }}
      >
        <Form.Item
          name="name"
          label="项目名称"
          rules={[{ required: true, message: '请输入项目名称' }]}
        >
          <Input placeholder="请输入项目名称" />
        </Form.Item>

        <Form.Item name="description" label="项目描述">
          <Input.TextArea
            placeholder="请输入项目描述"
            rows={3}
          />
        </Form.Item>

        <Form.Item
          name={['database', 'type']}
          label="数据库类型"
          rules={[{ required: true, message: '请选择数据库类型' }]}
        >
          <Select options={DATABASE_TYPES} />
        </Form.Item>

        <Form.Item
          name={['database', 'version']}
          label="数据库版本"
        >
          <Input placeholder="请输入数据库版本" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default CreateProjectDialog 