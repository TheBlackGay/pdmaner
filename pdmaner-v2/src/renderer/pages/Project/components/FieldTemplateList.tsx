import React, { useState, useEffect } from 'react';
import { Input, Empty, Button, Tag, Modal, Form, message } from 'antd';
import { SearchOutlined, MessageOutlined, DeleteOutlined, EditOutlined, CheckOutlined } from '@ant-design/icons';
import type { Field } from '@/types/table';
import styles from '../style.module.css';

interface FieldTemplate {
  id: string;
  name: string;
  comment?: string;
  fields: Field[];
  createdAt: number;
}

interface FieldTemplateListProps {
  onUseTemplate: (template: FieldTemplate) => void;
}

const FieldTemplateList: React.FC<FieldTemplateListProps> = ({ onUseTemplate }) => {
  const [templates, setTemplates] = useState<FieldTemplate[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<FieldTemplate | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    try {
      const storedTemplates = localStorage.getItem('fieldTemplates');
      if (storedTemplates) {
        const parsedTemplates = JSON.parse(storedTemplates);
        // 确保每个模板都有 fields 数组
        const validTemplates = parsedTemplates.map((template: any) => ({
          ...template,
          fields: Array.isArray(template.fields) ? template.fields : []
        }));
        setTemplates(validTemplates);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      message.error('加载字段模板失败');
    }
  };

  const saveTemplates = (newTemplates: FieldTemplate[]) => {
    try {
      // 确保每个模板都有 fields 数组
      const validTemplates = newTemplates.map(template => ({
        ...template,
        fields: Array.isArray(template.fields) ? template.fields : []
      }));
      localStorage.setItem('fieldTemplates', JSON.stringify(validTemplates));
      setTemplates(validTemplates);
    } catch (error) {
      console.error('Failed to save templates:', error);
      message.error('保存字段模板失败');
    }
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
  };

  const handleEdit = (template: FieldTemplate) => {
    setCurrentTemplate(template);
    form.setFieldsValue(template);
    setEditModalVisible(true);
  };

  const handleDelete = (templateId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个字段模板吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        const newTemplates = templates.filter(t => t.id !== templateId);
        saveTemplates(newTemplates);
        message.success('删除成功');
      }
    });
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (currentTemplate) {
        const newTemplates = templates.map(t => 
          t.id === currentTemplate.id ? { 
            ...t, 
            ...values,
            fields: Array.isArray(t.fields) ? t.fields : [] 
          } : t
        );
        saveTemplates(newTemplates);
        message.success('更新成功');
      }
      setEditModalVisible(false);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const filteredTemplates = templates.filter(template => 
    template.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    template.comment?.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div className={styles.templateContainer}>
      <div className={styles.templateSearch}>
        <Input
          placeholder="搜索字段模板..."
          prefix={<SearchOutlined />}
          value={searchValue}
          onChange={e => handleSearch(e.target.value)}
          allowClear
        />
      </div>
      
      <div className={styles.templateList}>
        {filteredTemplates.length === 0 ? (
          <Empty description="暂无字段模板" />
        ) : (
          filteredTemplates.map(template => (
            <div key={template.id} className={styles.templateItem}>
              <div className={styles.templateInfo}>
                <div className={styles.templateName}>
                  <strong>{template.name}</strong>
                  <Tag color="blue">{(template.fields || []).length} 个字段</Tag>
                </div>
                {template.comment && (
                  <div className={styles.templateComment}>
                    <MessageOutlined />
                    <span>{template.comment}</span>
                  </div>
                )}
              </div>
              <div className={styles.templateActions}>
                <Button 
                  type="text" 
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(template.id)}
                >
                  删除
                </Button>
                <Button 
                  type="text" 
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(template)}
                >
                  编辑
                </Button>
                <Button 
                  type="primary" 
                  icon={<CheckOutlined />}
                  onClick={() => onUseTemplate(template)}
                >
                  使用模板
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        title="编辑字段模板"
        open={editModalVisible}
        onOk={handleSave}
        onCancel={() => setEditModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="模板名称"
            rules={[{ required: true, message: '请输入模板名称' }]}
          >
            <Input placeholder="请输入模板名称" />
          </Form.Item>
          <Form.Item
            name="comment"
            label="备注"
          >
            <Input.TextArea placeholder="请输入备注信息" rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FieldTemplateList; 