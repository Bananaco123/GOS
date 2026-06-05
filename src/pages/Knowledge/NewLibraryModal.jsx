/**
 * 新建库弹窗（v9）— 仅 knowledge.manage 权限可见入口
 * 字段：库名称（必填）/ 可见范围（企业/部门/个人）/ 归属部门（部门级时）/ 描述
 */
import { useState } from 'react'
import { Modal, Form, Input, Radio, Select, App } from 'antd'
import { GlobalOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons'

import { DEPARTMENTS_FLAT } from '../../mock/org'
import { SCOPE_META } from '../../mock/library'

const SCOPE_COLORS = { company: '#7C3AED', dept: '#1A4D8F', self: '#0E7C7B' }

export default function NewLibraryModal({ open, onClose, onCreate, user }) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [scope, setScope] = useState('dept')

  const handleOk = async () => {
    let v
    try { v = await form.validateFields() } catch { return }
    const now = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-').slice(0, 16)
    const lib = {
      id: `lib-new-${Date.now()}`,
      name: v.name,
      scope: v.scope,
      owner_dept_id: v.scope === 'dept' ? v.owner_dept_id : null,
      owner_user_id: v.scope === 'self' ? user?.id : null,
      description: v.description || '',
      color: SCOPE_COLORS[v.scope],
      created_by: user?.name || '—',
      created_by_avatar: user?.avatar || '—',
      created_at: now,
      updated_by: user?.name || '—',
      updated_by_avatar: user?.avatar || '—',
      updated_at: now,
      total_recall: 0,
    }
    onCreate(lib)
    message.success(`已创建库「${v.name}」`)
    form.resetFields()
    setScope('dept')
    onClose()
  }

  return (
    <Modal
      title="新建知识库"
      open={open}
      onCancel={() => { form.resetFields(); setScope('dept'); onClose() }}
      onOk={handleOk}
      okText="创建"
      cancelText="取消"
      width={520}
    >
      <Form form={form} layout="vertical" initialValues={{ scope: 'dept' }} style={{ marginTop: 8 }}>
        <Form.Item name="name" label="库名称" rules={[{ required: true, message: '请输入库名称' }]}>
          <Input maxLength={32} showCount placeholder="如：北美销售库" />
        </Form.Item>
        <Form.Item name="scope" label="可见范围" rules={[{ required: true }]}>
          <Radio.Group onChange={(e) => setScope(e.target.value)} optionType="button" buttonStyle="solid">
            <Radio.Button value="company"><GlobalOutlined /> {SCOPE_META.company.label}</Radio.Button>
            <Radio.Button value="dept"><TeamOutlined /> {SCOPE_META.dept.label}</Radio.Button>
            <Radio.Button value="self"><UserOutlined /> {SCOPE_META.self.label}</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <div style={{ margin: '-8px 0 12px', fontSize: 12, color: 'var(--gb-text-muted)' }}>
          {SCOPE_META[scope]?.desc}
        </div>
        {scope === 'dept' && (
          <Form.Item name="owner_dept_id" label="归属部门" rules={[{ required: true, message: '请选择归属部门' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="选择归属部门（该部门及下级可见）"
              options={DEPARTMENTS_FLAT.map((d) => ({ value: d.id, label: d.path }))}
            />
          </Form.Item>
        )}
        {scope === 'self' && (
          <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--gb-text-secondary)' }}>
            归属：{user?.name}（仅你本人可见）
          </div>
        )}
        <Form.Item name="description" label="库描述">
          <Input.TextArea rows={2} maxLength={60} showCount placeholder="一句话说明这个库装什么" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
