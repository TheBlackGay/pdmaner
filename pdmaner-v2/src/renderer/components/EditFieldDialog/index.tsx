import React, { useEffect } from 'react'
import { Modal, Form, Input, Select, InputNumber, Switch, message, Space, Tooltip } from 'antd'
import type { Field, CreateFieldParams, UpdateFieldParams, DataType } from '@/types/table'
import { DATA_TYPES } from '@/types/table'
import { QuestionCircleOutlined, DatabaseOutlined } from '@ant-design/icons'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (values: CreateFieldParams | UpdateFieldParams) => Promise<void>
  field?: Field
  title?: string
}

const EditFieldDialog: React.FC<Props> = ({ 
  open, 
  onClose, 
  onSubmit,
  field,
  title = '新建字段'
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = React.useState(false)
  const [selectedType, setSelectedType] = React.useState<DataType | undefined>()

  useEffect(() => {
    if (open && field) {
      form.setFieldsValue({
        name: field.name,
        comment: field.comment,
        typeName: field.typeName,
        length: field.length,
        precision: field.precision,
        scale: field.scale,
        nullable: field.nullable,
        primaryKey: field.primaryKey,
        autoIncrement: field.autoIncrement,
        defaultValue: field.defaultValue,
      })
      setSelectedType(DATA_TYPES.find(t => t.name === field.typeName))
    } else if (open) {
      form.resetFields()
      setSelectedType(undefined)
    }
  }, [open, field, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      await onSubmit(values)
      message.success(field ? '字段更新成功' : '字段创建成功')
      form.resetFields()
      onClose()
    } catch (error) {
      console.error('Failed to submit field:', error)
      message.error(field ? '字段更新失败' : '字段创建失败')
    } finally {
      setLoading(false)
    }
  }

  const handleTypeChange = (typeName: string) => {
    const type = DATA_TYPES.find(t => t.name === typeName)
    setSelectedType(type)
    
    // 设置默认值
    if (type) {
      form.setFieldsValue({
        length: type.defaultLength,
        precision: type.defaultPrecision,
        scale: type.defaultScale,
      })
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
      maskClosable={false}
      keyboard={false}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        validateTrigger={['onChange', 'onBlur']}
      >
        <Form.Item
          name="name"
          label={
            <Space>
              字段名
              <Tooltip title="字段名必须以字母开头，只能包含字母、数字和下划线">
                <QuestionCircleOutlined />
              </Tooltip>
            </Space>
          }
          rules={[
            { required: true, message: '请输入字段名' },
            { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '字段名必须以字母开头，只能包含字母、数字和下划线' }
          ]}
          validateFirst
        >
          <Input 
            placeholder="请输入字段名" 
            autoFocus
            allowClear
          />
        </Form.Item>

        <Form.Item
          name="comment"
          label="注释"
        >
          <Input.TextArea
            placeholder="请输入注释"
            rows={2}
            showCount
            maxLength={200}
            allowClear
          />
        </Form.Item>

        <Form.Item
          name="typeName"
          label="数据类型"
          rules={[{ required: true, message: '请选择数据类型' }]}
        >
          <Select
            placeholder="请选择数据类型"
            onChange={handleTypeChange}
            options={DATA_TYPES.map(type => ({
              label: type.name,
              value: type.name,
              icon: <DatabaseOutlined />
            }))}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        {selectedType?.hasLength && (
          <Form.Item
            name="length"
            label={
              <Space>
                长度
                <Tooltip title="字段长度必须大于0">
                  <QuestionCircleOutlined />
                </Tooltip>
              </Space>
            }
            rules={[
              { required: true, message: '请输入长度' },
              { type: 'number', min: 1, message: '长度必须大于0' }
            ]}
          >
            <InputNumber 
              min={1} 
              keyboard={false}
              style={{ width: '100%' }}
            />
          </Form.Item>
        )}

        {selectedType?.hasPrecision && (
          <Form.Item
            name="precision"
            label={
              <Space>
                精度
                <Tooltip title="精度必须大于0">
                  <QuestionCircleOutlined />
                </Tooltip>
              </Space>
            }
            rules={[
              { required: true, message: '请输入精度' },
              { type: 'number', min: 1, message: '精度必须大于0' }
            ]}
          >
            <InputNumber 
              min={1} 
              keyboard={false}
              style={{ width: '100%' }}
            />
          </Form.Item>
        )}

        {selectedType?.hasScale && (
          <Form.Item
            name="scale"
            label={
              <Space>
                小数位
                <Tooltip title="小数位必须大于等于0">
                  <QuestionCircleOutlined />
                </Tooltip>
              </Space>
            }
            rules={[
              { required: true, message: '请输入小数位' },
              { type: 'number', min: 0, message: '小数位必须大于等于0' }
            ]}
          >
            <InputNumber 
              min={0} 
              keyboard={false}
              style={{ width: '100%' }}
            />
          </Form.Item>
        )}

        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          <Form.Item
            name="nullable"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch 
              checkedChildren="可空" 
              unCheckedChildren="不可空"
              onChange={(checked) => {
                if (!checked) {
                  form.setFieldsValue({ defaultValue: undefined })
                }
              }}
            />
          </Form.Item>

          <Form.Item
            name="primaryKey"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch 
              checkedChildren="主键" 
              unCheckedChildren="非主键"
              onChange={(checked) => {
                if (checked) {
                  form.setFieldsValue({ 
                    nullable: false,
                    autoIncrement: false 
                  })
                }
              }}
            />
          </Form.Item>

          <Form.Item
            name="autoIncrement"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch 
              checkedChildren="自增" 
              unCheckedChildren="非自增"
              onChange={(checked) => {
                if (checked) {
                  form.setFieldsValue({ 
                    primaryKey: true,
                    nullable: false 
                  })
                }
              }}
            />
          </Form.Item>
        </div>

        <Form.Item
          name="defaultValue"
          label="默认值"
          dependencies={['nullable']}
          rules={[
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!getFieldValue('nullable') && !value) {
                  return Promise.reject('非空字段必须设置默认值')
                }
                return Promise.resolve()
              }
            })
          ]}
        >
          <Input 
            placeholder="请输入默认值"
            allowClear
            disabled={form.getFieldValue('autoIncrement')}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default EditFieldDialog 