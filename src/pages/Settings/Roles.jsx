import { useState } from 'react'
import {
  Button, Tag, Drawer, Form, Input, Select, Checkbox, App, Tooltip, Space,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SafetyCertificateOutlined,
} from '@ant-design/icons'

import { useAuth } from '../../auth/AuthContext'
import { PERMISSION_TREE, DATA_SCOPES, dataScopeLabel } from '../../mock/rbac'

export default function Roles() {
  const { message, modal } = App.useApp()
  const { roles, hasPerm, updateRole, addRole, removeRole, countUsersOfRole } = useAuth()

  const [editing, setEditing] = useState(null) // role object or {__new:true}
  const [form] = Form.useForm()
  const [permState, setPermState] = useState([])

  const canCreate = hasPerm('settings-roles.create')
  const canEdit = hasPerm('settings-roles.edit')
  const canDelete = hasPerm('settings-roles.delete')

  const isLocked = !!editing && !editing.__new && editing.locked // 超管：只读

  const openCreate = () => {
    setEditing({ __new: true })
    setPermState([])
    form.setFieldsValue({ name: '', data_scope: 'self', desc: '' })
  }

  const openEdit = (role) => {
    setEditing(role)
    setPermState([...role.permissions])
    form.setFieldsValue({ name: role.name, data_scope: role.data_scope, desc: role.desc })
  }

  const togglePerm = (key, checked) => {
    setPermState((prev) => (checked ? [...new Set([...prev, key])] : prev.filter((k) => k !== key)))
  }

  const toggleModule = (module, checked) => {
    const keys = module.ops.map((o) => `${module.key}.${o.key}`)
    setPermState((prev) => (checked ? [...new Set([...prev, ...keys])] : prev.filter((k) => !keys.includes(k))))
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    if (permState.length === 0) {
      message.warning('请至少为该角色勾选一项功能权限')
      return
    }
    if (editing.__new) {
      const id = `role-custom-${Date.now().toString(36)}`
      addRole({
        id, name: values.name, preset: false, locked: false,
        data_scope: values.data_scope, desc: values.desc || '自定义角色', permissions: permState,
      })
      message.success(`已新增角色「${values.name}」`)
    } else {
      updateRole(editing.id, {
        name: values.name, data_scope: values.data_scope, desc: values.desc, permissions: permState,
      })
      message.success(`已更新角色「${values.name}」权限，已对该角色下用户即时生效`)
    }
    setEditing(null)
  }

  const handleDelete = (role) => {
    if (role.locked) return // 超管不可删（按钮已禁用）
    const n = countUsersOfRole(role.id)
    if (n > 0) {
      modal.warning({
        title: '该角色下仍有用户',
        content: `「${role.name}」下还有 ${n} 名用户，请先将其改派到其它角色后再删除。`,
      })
      return
    }
    modal.confirm({
      title: `删除角色「${role.name}」？`,
      content: '删除后该角色不可恢复。',
      okText: '确认删除',
      okButtonProps: { danger: true },
      onOk: () => {
        removeRole(role.id)
        message.success('已删除')
      },
    })
  }

  return (
    <div className="gb-settings-page">
      <div className="gb-settings-page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h1 className="gb-settings-page-title">角色与权限</h1>
        {canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增角色</Button>
        )}
      </div>

      <div className="gb-role-list">
        {roles.map((role) => (
          <div key={role.id} className="gb-role-card">
            <div className="gb-role-card-stat" style={{ minWidth: 44 }}>
              <SafetyCertificateOutlined style={{ fontSize: 22, color: 'var(--gb-primary)' }} />
            </div>
            <div className="gb-role-card-main">
              <div className="gb-role-card-name">
                {role.name}
                <Tag color="geekblue">数据范围：{dataScopeLabel(role.data_scope)}</Tag>
              </div>
            </div>
            <Space>
              <Tooltip title={canEdit ? '编辑权限' : '无编辑权限'}>
                <Button icon={<EditOutlined />} disabled={!canEdit} onClick={() => openEdit(role)}>
                  编辑权限
                </Button>
              </Tooltip>
              <Tooltip title={role.locked ? '超级管理员不可删除' : (canDelete ? '删除角色' : '无删除权限')}>
                <Button danger icon={<DeleteOutlined />} disabled={role.locked || !canDelete} onClick={() => handleDelete(role)}>
                  删除
                </Button>
              </Tooltip>
            </Space>
          </div>
        ))}
      </div>

      {/* 新增 / 编辑 抽屉 */}
      <Drawer
        title={editing?.__new ? '新增角色' : `编辑角色：${editing?.name || ''}`}
        open={!!editing}
        onClose={() => setEditing(null)}
        size="large"
        extra={
          <Space>
            <Button onClick={() => setEditing(null)}>{isLocked ? '关闭' : '取消'}</Button>
            {!isLocked && <Button type="primary" onClick={handleSave}>保存</Button>}
          </Space>
        }
      >
        {isLocked && (
          <div style={{ marginBottom: 16, padding: '8px 12px', background: 'var(--gb-bg-secondary)', borderRadius: 6, fontSize: 12, color: 'var(--gb-text-secondary)' }}>
            超级管理员权限全开，仅供查看，所有选项不可调整。
          </div>
        )}
        <Form form={form} layout="vertical" disabled={isLocked}>
          <Form.Item name="name" label="角色名称" rules={[{ required: true, message: '请输入角色名称' }]}>
            <Input maxLength={20} placeholder="如：区域运营管理员" />
          </Form.Item>
          <Form.Item name="data_scope" label="数据权限" rules={[{ required: true }]}>
            <Select options={DATA_SCOPES.map((s) => ({ value: s.value, label: s.label }))} />
          </Form.Item>
          <Form.Item name="desc" label="角色说明">
            <Input.TextArea rows={2} maxLength={120} showCount />
          </Form.Item>
        </Form>

        <div style={{ fontSize: 14, fontWeight: 600, margin: '8px 0 12px' }}>功能权限</div>

        {PERMISSION_TREE.map((group) => (
          <div key={group.group} className="gb-perm-group">
            <div className="gb-perm-group-head">{group.group}</div>
            {group.modules.map((m) => {
              const moduleKeys = m.ops.map((o) => `${m.key}.${o.key}`)
              const allChecked = moduleKeys.every((k) => permState.includes(k))
              const someChecked = moduleKeys.some((k) => permState.includes(k))
              return (
                <div key={m.key} className="gb-perm-module">
                  <div className="gb-perm-module-name">
                    <Checkbox
                      checked={allChecked}
                      indeterminate={!allChecked && someChecked}
                      disabled={isLocked}
                      onChange={(e) => toggleModule(m, e.target.checked)}
                    >
                      <strong>{m.label}</strong>
                    </Checkbox>
                  </div>
                  <div className="gb-perm-ops">
                    {m.ops.map((o) => {
                      const key = `${m.key}.${o.key}`
                      return (
                        <Checkbox
                          key={key}
                          checked={permState.includes(key)}
                          disabled={isLocked}
                          onChange={(e) => togglePerm(key, e.target.checked)}
                        >
                          {o.label}
                        </Checkbox>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </Drawer>
    </div>
  )
}
