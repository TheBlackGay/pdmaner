import React, { useState, useEffect } from 'react';
import { Input, Empty, Button, Tag, Modal, Form, message, Menu, List, Dropdown, Tooltip } from 'antd';
import { 
  SearchOutlined, 
  MessageOutlined, 
  DeleteOutlined, 
  EditOutlined, 
  CheckOutlined,
  FolderOutlined,
  PlusOutlined,
  MoreOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import type { Field } from '@/types/table';
import styles from './style.module.css';

interface FieldTemplate {
  id: string;
  name: string;
  comment?: string;
  fields: Field[];
  groupId: string;
  createdAt: number;
}

interface TemplateGroup {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
}

interface FieldTemplateListProps {
  onUseTemplate: (template: FieldTemplate) => void;
}

const FieldTemplateList: React.FC<FieldTemplateListProps> = ({ onUseTemplate }) => {
  const [templates, setTemplates] = useState<FieldTemplate[]>([]);
  const [groups, setGroups] = useState<TemplateGroup[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<FieldTemplate | null>(null);
  const [currentGroup, setCurrentGroup] = useState<TemplateGroup | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [form] = Form.useForm();
  const [groupForm] = Form.useForm();

  useEffect(() => {
    loadGroups();
    loadTemplates();
  }, []);

  const loadGroups = () => {
    try {
      const storedGroups = localStorage.getItem('templateGroups');
      if (storedGroups) {
        setGroups(JSON.parse(storedGroups));
      }
    } catch (error) {
      console.error('Failed to load groups:', error);
      message.error('加载分组失败');
    }
  };

  const loadTemplates = () => {
    try {
      const storedTemplates = localStorage.getItem('fieldTemplates');
      if (storedTemplates) {
        const parsedTemplates = JSON.parse(storedTemplates);
        const validTemplates = parsedTemplates.map((template: any) => ({
          ...template,
          fields: Array.isArray(template.fields) ? template.fields : [],
          groupId: template.groupId || 'ungrouped'
        }));
        setTemplates(validTemplates);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      message.error('加载字段模板失败');
    }
  };

  const saveGroups = (newGroups: TemplateGroup[]) => {
    try {
      localStorage.setItem('templateGroups', JSON.stringify(newGroups));
      setGroups(newGroups);
    } catch (error) {
      console.error('Failed to save groups:', error);
      message.error('保存分组失败');
    }
  };

  const saveTemplates = (newTemplates: FieldTemplate[]) => {
    try {
      const validTemplates = newTemplates.map(template => ({
        ...template,
        fields: Array.isArray(template.fields) ? template.fields : [],
        groupId: template.groupId || 'ungrouped'
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

  const handleCreateGroup = () => {
    setCurrentGroup(null);
    groupForm.resetFields();
    setGroupModalVisible(true);
  };

  const handleEditGroup = (group: TemplateGroup) => {
    setCurrentGroup(group);
    groupForm.setFieldsValue(group);
    setGroupModalVisible(true);
  };

  const handleDeleteGroup = (groupId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除分组会将组内模板移至未分组，是否继续？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        const newGroups = groups.filter(g => g.id !== groupId);
        saveGroups(newGroups);

        // 将该分组下的模板移至未分组
        const newTemplates = templates.map(t => 
          t.groupId === groupId ? { ...t, groupId: 'ungrouped' } : t
        );
        saveTemplates(newTemplates);
        message.success('删除成功');
      }
    });
  };

  const handleSaveGroup = async () => {
    try {
      const values = await groupForm.validateFields();
      if (currentGroup) {
        // 编辑分组
        const newGroups = groups.map(g =>
          g.id === currentGroup.id ? { ...g, ...values } : g
        );
        saveGroups(newGroups);
        message.success('更新成功');
      } else {
        // 创建新分组
        const newGroup: TemplateGroup = {
          id: Date.now().toString(),
          name: values.name,
          description: values.description,
          createdAt: Date.now()
        };
        saveGroups([...groups, newGroup]);
        message.success('创建成功');
      }
      setGroupModalVisible(false);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
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

  const handleMoveTemplate = (templateId: string, targetGroupId: string) => {
    const newTemplates = templates.map(t =>
      t.id === templateId ? { ...t, groupId: targetGroupId } : t
    );
    saveTemplates(newTemplates);
    message.success('移动成功');
  };

  const menuItems = [
    {
      key: 'all',
      label: '全部模板',
      icon: <DatabaseOutlined />
    },
    {
      key: 'ungrouped',
      label: '未分组',
      icon: <FolderOutlined />
    },
    ...groups.map(group => ({
      key: group.id,
      label: (
        <div className={styles.groupMenuItem}>
          <span>{group.name}</span>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'edit',
                  label: '编辑分组',
                  icon: <EditOutlined />,
                  onClick: () => handleEditGroup(group)
                },
                {
                  key: 'delete',
                  label: '删除分组',
                  icon: <DeleteOutlined />,
                  onClick: () => handleDeleteGroup(group.id)
                }
              ]
            }}
            trigger={['click']}
          >
            <Button
              type="text"
              size="small"
              icon={<MoreOutlined />}
              className={styles.groupMoreBtn}
              onClick={e => e.stopPropagation()}
            />
          </Dropdown>
        </div>
      ),
      icon: <FolderOutlined />
    }))
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      template.comment?.toLowerCase().includes(searchValue.toLowerCase());
    const matchesGroup = selectedGroupId === 'all' || template.groupId === selectedGroupId;
    return matchesSearch && matchesGroup;
  });

  // 获取当前分组名称
  const getCurrentGroupName = () => {
    if (selectedGroupId === 'all') return '全部模板';
    if (selectedGroupId === 'ungrouped') return '未分组';
    const group = groups.find(g => g.id === selectedGroupId);
    return group ? group.name : '';
  };

  return (
    <div className={styles.templateContainer}>
      <div className={styles.templateHeader}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleCreateGroup}
          block
        >
          新建分组
        </Button>
      </div>

      <div className={styles.templateContent}>
        <Menu
          selectedKeys={[selectedGroupId]}
          items={menuItems}
          onClick={({key}) => setSelectedGroupId(key)}
          className={styles.groupMenu}
        />

        <div className={styles.templateSearch}>
          <div className={styles.groupTitle}>{getCurrentGroupName()}</div>
          <Input
            placeholder="搜索字段模板..."
            prefix={<SearchOutlined />}
            value={searchValue}
            onChange={e => handleSearch(e.target.value)}
            allowClear
          />
        </div>
        
        <div className={styles.templateList}>
          <List
            dataSource={filteredTemplates}
            locale={{ emptyText: <Empty description="暂无字段模板" /> }}
            renderItem={template => (
              <List.Item
                className={styles.templateItem}
                actions={[
                  <Button
                    key="use"
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={() => onUseTemplate(template)}
                  >
                    使用模板
                  </Button>
                ]}
                extra={
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: 'edit',
                          label: '编辑模板',
                          icon: <EditOutlined />,
                          onClick: () => handleEdit(template)
                        },
                        {
                          key: 'delete',
                          label: '删除模板',
                          icon: <DeleteOutlined />,
                          onClick: () => handleDelete(template.id)
                        },
                        {
                          key: 'move',
                          label: '移动到',
                          icon: <FolderOutlined />,
                          children: [
                            {
                              key: 'ungrouped',
                              label: '未分组',
                              onClick: () => handleMoveTemplate(template.id, 'ungrouped')
                            },
                            ...groups.map(group => ({
                              key: group.id,
                              label: group.name,
                              onClick: () => handleMoveTemplate(template.id, group.id)
                            }))
                          ]
                        }
                      ]
                    }}
                  >
                    <Button type="text" icon={<MoreOutlined />} />
                  </Dropdown>
                }
              >
                <List.Item.Meta
                  title={
                    <div className={styles.templateTitle}>
                      <span>{template.name}</span>
                      <Tag color="blue">{template.fields.length} 个字段</Tag>
                    </div>
                  }
                  description={
                    template.comment && (
                      <Tooltip title={template.comment}>
                        <div className={styles.templateDesc}>
                          <MessageOutlined />
                          <span>{template.comment}</span>
                        </div>
                      </Tooltip>
                    )
                  }
                />
              </List.Item>
            )}
          />
        </div>
      </div>

      <Modal
        title={currentTemplate ? "编辑字段模板" : "新建字段模板"}
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

      <Modal
        title={currentGroup ? "编辑分组" : "新建分组"}
        open={groupModalVisible}
        onOk={handleSaveGroup}
        onCancel={() => setGroupModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={groupForm} layout="vertical">
          <Form.Item
            name="name"
            label="分组名称"
            rules={[{ required: true, message: '请输入分组名称' }]}
          >
            <Input placeholder="请输入分组名称" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea placeholder="请输入分组描述" rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FieldTemplateList; 