import React from 'react'
import { Modal, Form, Input, Tabs, Table, Tag, message } from 'antd'
import { DatabaseOutlined } from '@ant-design/icons'
import styles from './style.module.css'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (values: { code: string; name: string; selectedTables: string[] }) => Promise<void>
  tables: any[]
  initialValues?: any
  title?: string
}

const CreateDomainDialog: React.FC<Props> = ({
  open,
  onClose,
  onSubmit,
  tables,
  initialValues,
  title = '新增主题域'
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = React.useState(false)
  const [selectedTables, setSelectedTables] = React.useState<string[]>([])

  React.useEffect(() => {
    if (open) {
      if (initialValues) {
        form.setFieldsValue({
          code: initialValues.code,
          name: initialValues.name
        })
        setSelectedTables(initialValues.modules.tables)
      } else {
        form.resetFields()
        setSelectedTables([])
      }
    }
  }, [open, initialValues, form])

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()
      await onSubmit({
        ...values,
        selectedTables
      })
      form.resetFields()
      setSelectedTables([])
      onClose()
      message.success(initialValues ? '主题域更新成功' : '主题域创建成功')
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      }
      // 表单验证错误不需要显示错误消息，因为表单会自动显示错误提示
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: '表名',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <div className={styles.tableName}>
          <DatabaseOutlined />
          <span>{text}</span>
        </div>
      )
    },
    {
      title: '注释',
      dataIndex: 'comment',
      key: 'comment',
      ellipsis: true
    }
  ]

  const rowSelection = {
    selectedRowKeys: selectedTables,
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedTables(selectedRowKeys as string[])
    }
  }

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={800}
      maskClosable={false}
      destroyOnClose
    >
      <Tabs
        items={[
          {
            key: 'basic',
            label: '基本信息',
            children: (
              <Form
                form={form}
                layout="vertical"
                requiredMark="optional"
              >
                <Form.Item
                  name="code"
                  label="主题域代码"
                  rules={[
                    { required: true, message: '请输入主题域代码' },
                    { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '代码必须以字母开头，只能包含字母、数字和下划线' }
                  ]}
                >
                  <Input 
                    placeholder="请输入主题域代码"
                    autoFocus
                    allowClear
                  />
                </Form.Item>

                <Form.Item
                  name="name"
                  label="主题域名称"
                  rules={[
                    { required: true, message: '请输入主题域名称' }
                  ]}
                >
                  <Input 
                    placeholder="请输入主题域名称"
                    allowClear
                  />
                </Form.Item>
              </Form>
            )
          },
          {
            key: 'tables',
            label: '数据表',
            children: (
              <div className={styles.tableSelector}>
                <Table
                  rowSelection={rowSelection}
                  columns={columns}
                  dataSource={tables}
                  rowKey="id"
                  size="middle"
                  pagination={false}
                  scroll={{ y: 300 }}
                />
              </div>
            )
          }
        ]}
      />
    </Modal>
  )
}

export default CreateDomainDialog