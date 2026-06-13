import { useState, useMemo } from 'react'
import {
  Tree, Table, Input, Tag, Avatar, Space, Empty, Button, Tooltip,
  Drawer, Form, Select, Modal, App,
} from 'antd'
import {
  SearchOutlined, ReloadOutlined, ApartmentOutlined, UserAddOutlined,
  EditOutlined, DeleteOutlined, StopOutlined, CheckCircleOutlined, SwapOutlined,
} from '@ant-design/icons'

import { DEPARTMENTS, DEPARTMENTS_FLAT, USER_STATUS, deptName, CANDIDATE_USERS } from '../../mock/org'
import { useAuth } from '../../auth/AuthContext'
import { store } from '../../mock/store'

// 部门树 → antd Tree data
function toTreeData(nodes) {
  return nodes.map((n) => ({
    title: n.name,
    key: n.id,
    children: n.children?.length ? toTreeData(n.children) : undefined,
  }))
}

// 取某部门及其所有下级部门 id
function deptAndChildren(deptId) {
  const ids = [deptId]
  const collect = (pid) => {
    DEPARTMENTS_FLAT.filter((d) => d.parent_id === pid).forEach((d) => {
      ids.push(d.id)
      collect(d.id)
    })
  }
  collect(deptId)
  return ids
}

const today = () => new Date().toISOString().slice(0, 10)

function getHandoverAssets(user) {
  if (!user) {
    return [
      { key: 'knowledge', label: '知识库归属', count: 0, note: '个人级知识库所有者' },
      { key: 'cloud', label: '云账号所有者', count: 0, note: '云账号 owner' },
      { key: 'agent', label: 'AI 业务员创建记录', count: 0, note: '历史创建行为保留' },
    ]
  }

  const libraries = store.getKbLibraries()
  const cloudAccounts = store.getCloudAccounts()
  const agents = store.getAgents()

  return [
    {
      key: 'knowledge',
      label: '知识库归属',
      count: libraries.filter((lib) => lib.scope === 'self' && lib.owner_user_id === user.id).length,
      note: '确认后转移所有者',
    },
    {
      key: 'cloud',
      label: '云账号所有者',
      count: cloudAccounts.filter((account) => account.owner_name === user.name).length,
      note: '确认后转移 owner',
    },
    {
      key: 'agent',
      label: 'AI 业务员创建记录',
      count: agents.filter((agent) => agent.created_by === user.name).length,
      note: '创建记录不变更',
    },
  ]
}

export default function Members() {
  const { message, modal } = App.useApp()
  const { users, roles, user: me, hasPerm, addUser, updateUserRole, setUserStatus, handoverUser, removeUser } = useAuth()

  const [selectedDept, setSelectedDept] = useState(null)
  const [keyword, setKeyword] = useState('')

  // 新增用户
  const [addOpen, setAddOpen] = useState(false)
  const [addCand, setAddCand] = useState(null)
  const [addRoleId, setAddRoleId] = useState('role-normal')
  // 编辑（仅角色）
  const [editUser, setEditUser] = useState(null)
  const [editRoleId, setEditRoleId] = useState(null)
  // 交接
  const [handoverFor, setHandoverFor] = useState(null)
  const [handoverTo, setHandoverTo] = useState(null)

  const canCreate = hasPerm('settings-members.create')
  const canEditRole = hasPerm('settings-members.edit-role')
  const canToggleStatus = hasPerm('settings-members.status')
  const canHandover = hasPerm('settings-members.handover')
  const canDelete = hasPerm('settings-members.delete')

  const treeData = useMemo(() => toTreeData(DEPARTMENTS), [])
  const roleName = (id) => roles.find((r) => r.id === id)?.name || '普通用户'

  const filteredUsers = useMemo(() => {
    let list = users
    if (selectedDept) {
      const scope = deptAndChildren(selectedDept)
      list = list.filter((u) => scope.includes(u.dept_id))
    }
    if (keyword) {
      const q = keyword.toLowerCase()
      list = list.filter((u) => u.name.toLowerCase().includes(q) || u.account.toLowerCase().includes(q))
    }
    return list
  }, [users, selectedDept, keyword])

  // 可新增候选（2.0 目录中尚未启用为 OS 用户的人）
  const availableCandidates = useMemo(
    () => CANDIDATE_USERS.filter((c) => !users.some((u) => u.id === c.id || u.account === c.account)),
    [users],
  )
  // 交接对象候选：在职、非被交接者
  const handoverCandidates = useMemo(
    () => users.filter((u) => u.status === 'active' && u.id !== handoverFor?.id),
    [users, handoverFor],
  )
  const handoverAssets = useMemo(() => getHandoverAssets(handoverFor), [handoverFor])

  // ---------- 新增 ----------
  const openAdd = () => { setAddCand(null); setAddRoleId('role-normal'); setAddOpen(true) }
  const submitAdd = () => {
    if (!addCand) { message.warning('请先按姓名选择一位人员'); return }
    addUser({
      id: addCand.id, name: addCand.name, avatar: addCand.avatar, account: addCand.account,
      phone: addCand.phone, dept_id: addCand.dept_id, title: addCand.title,
      status: 'active', role_id: addRoleId, joined_at: today(),
    })
    message.success(`已新增用户「${addCand.name}」`)
    setAddOpen(false)
  }

  // ---------- 编辑（仅角色） ----------
  const openEdit = (u) => { setEditUser(u); setEditRoleId(u.role_id) }
  const submitEdit = () => {
    if (editRoleId !== editUser.role_id) {
      updateUserRole(editUser.id, editRoleId)
      message.success(`已更新「${editUser.name}」的角色为 ${roleName(editRoleId)}`)
    }
    setEditUser(null)
  }

  // ---------- 停用 / 启用 ----------
  const toggleStatus = (u) => {
    const next = u.status === 'active' ? 'disabled' : 'active'
    setUserStatus(u.id, next)
    message.success(next === 'active' ? `已启用「${u.name}」` : `已停用「${u.name}」`)
  }

  // ---------- 交接 ----------
  const openHandover = (u) => {
    if (u.status !== 'active') { message.warning('仅账号状态正常时允许交接'); return }
    setHandoverFor(u)
    setHandoverTo(null)
  }
  const submitHandover = () => {
    if (!handoverFor || handoverFor.status !== 'active') { message.warning('仅账号状态正常时允许交接'); return }
    if (!handoverTo) { message.warning('请选择交接对象账号'); return }
    handoverUser(handoverFor.id, handoverTo)
    message.success(`已完成「${handoverFor.name}」的数据交接`)
    setHandoverFor(null)
  }

  // ---------- 删除（保留二次确认） ----------
  const onDelete = (u) => {
    modal.confirm({
      title: `删除账号「${u.name}」？`,
      content: '删除后该账号不可恢复（演示环境）。',
      okText: '删除',
      okButtonProps: { danger: true },
      onOk: () => { removeUser(u.id); message.success('已删除') },
    })
  }

  const columns = [
    {
      title: '用户',
      key: 'user',
      render: (_, r) => (
        <Space>
          <Avatar size="small" style={{ background: r.status === 'active' ? '#1A4D8F' : '#9CA3AF' }}>{r.avatar}</Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{r.name}{r.id === me?.id && <Tag color="blue" style={{ marginLeft: 6 }}>本人</Tag>}</div>
            <div style={{ fontSize: 11, color: 'var(--gb-text-muted)' }}>{r.title}</div>
          </div>
        </Space>
      ),
    },
    { title: '手机号', dataIndex: 'phone', width: 130, render: (v) => <span className="gb-mono">{v}</span> },
    { title: '部门', dataIndex: 'dept_id', width: 120, render: (v) => deptName(v) },
    {
      title: '当前角色',
      dataIndex: 'role_id',
      width: 130,
      render: (v) => <Tag color="blue">{roleName(v)}</Tag>,
    },
    {
      title: '账号状态',
      dataIndex: 'status',
      width: 100,
      render: (v) => {
        const s = USER_STATUS[v]
        return <Tag color={s.color}>{s.label}</Tag>
      },
    },
    { title: '创建时间', dataIndex: 'joined_at', width: 110, render: (v) => <span className="gb-mono">{v}</span> },
    {
      title: '操作',
      key: 'action',
      width: 240,
      fixed: 'right',
      render: (_, r) => {
        const isSelf = r.id === me?.id
        const isResigned = r.status === 'resigned'
        const isActive = r.status === 'active'
        return (
          <Space size={0}>
            <Tooltip title={!canEditRole ? '无配置角色权限' : (r.status !== 'active' ? '仅在职用户可调整角色' : '')}>
              <Button type="link" size="small" icon={<EditOutlined />} disabled={!canEditRole || r.status !== 'active'} onClick={() => openEdit(r)}>编辑</Button>
            </Tooltip>
            <Tooltip title={!canToggleStatus ? '无启用/停用权限' : (isResigned ? '离职账号不可启用' : (isSelf ? '不能对本人操作' : ''))}>
              <Button
                type="link" size="small"
                icon={r.status === 'active' ? <StopOutlined /> : <CheckCircleOutlined />}
                disabled={!canToggleStatus || isSelf || isResigned}
                onClick={() => toggleStatus(r)}
              >
                {r.status === 'active' ? '停用' : '启用'}
              </Button>
            </Tooltip>
            <Tooltip title={!canHandover ? '无数据交接权限' : (isSelf ? '不能对本人操作' : (!isActive ? '仅账号状态正常时允许交接' : ''))}>
              <Button type="link" size="small" icon={<SwapOutlined />} disabled={!canHandover || isSelf || !isActive} onClick={() => openHandover(r)}>交接</Button>
            </Tooltip>
            <Tooltip title={!canDelete ? '无删除用户权限' : (isSelf ? '不能删除本人' : '')}>
              <Button type="link" size="small" danger icon={<DeleteOutlined />} disabled={!canDelete || isSelf} onClick={() => onDelete(r)}>删除</Button>
            </Tooltip>
          </Space>
        )
      },
    },
  ]

  return (
    <div className="gb-settings-page">
      <div className="gb-settings-page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="gb-settings-page-title">部门与用户</h1>
        {canCreate && <Button type="primary" icon={<UserAddOutlined />} onClick={openAdd}>新增用户</Button>}
      </div>

      <div className="gb-members-layout">
        {/* 部门树 */}
        <div className="gb-members-tree">
          <div className="gb-members-tree-head">
            <span><ApartmentOutlined style={{ marginRight: 6 }} />部门</span>
            <Tooltip title="清除部门筛选">
              <Button type="text" size="small" icon={<ReloadOutlined />} onClick={() => setSelectedDept(null)} />
            </Tooltip>
          </div>
          <Tree
            treeData={treeData}
            defaultExpandAll
            selectedKeys={selectedDept ? [selectedDept] : []}
            onSelect={(keys) => setSelectedDept(keys[0] || null)}
            blockNode
          />
        </div>

        {/* 用户表 */}
        <div className="gb-members-table">
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Input
              prefix={<SearchOutlined style={{ color: 'var(--gb-text-muted)' }} />}
              placeholder="搜索姓名 / 账号"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              allowClear
              style={{ width: 240 }}
            />
            <span style={{ fontSize: 13, color: 'var(--gb-text-muted)' }}>
              {selectedDept ? `部门「${deptName(selectedDept)}」及下级 · ` : '全部部门 · '}
              共 <strong style={{ color: 'var(--gb-text)' }}>{filteredUsers.length}</strong> 人
            </span>
          </div>
          <Table
            columns={columns}
            dataSource={filteredUsers}
            rowKey="id"
            size="middle"
            scroll={{ x: 'max-content' }}
            pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 人` }}
            locale={{ emptyText: <Empty description="该部门下暂无用户" /> }}
          />
        </div>
      </div>

      {/* ============ 新增用户 ============ */}
      <Drawer
        title="新增用户"
        open={addOpen}
        onClose={() => setAddOpen(false)}
        width={420}
        extra={
          <Space>
            <Button onClick={() => setAddOpen(false)}>取消</Button>
            <Button type="primary" onClick={submitAdd}>确定</Button>
          </Space>
        }
      >
        <Form layout="vertical">
          <Form.Item label="选择用户" required>
            <Select
              showSearch
              placeholder="输入姓名搜索"
              optionFilterProp="label"
              value={addCand?.id}
              onChange={(id) => setAddCand(availableCandidates.find((c) => c.id === id))}
              options={availableCandidates.map((c) => ({ value: c.id, label: c.name }))}
              notFoundContent="无匹配人员（可能已启用）"
            />
          </Form.Item>

          {addCand && (
            <div className="gb-add-candidate-card">
              <Avatar size={36} className="gb-add-candidate-avatar">{addCand.avatar}</Avatar>
              <div className="gb-add-candidate-main">
                <div className="gb-add-candidate-head">
                  <strong>{addCand.name}</strong>
                  <span>{addCand.title}</span>
                </div>
                <div className="gb-add-candidate-meta">
                  <span>部门：{deptName(addCand.dept_id)}</span>
                  <span>手机：<span className="gb-mono">{addCand.phone}</span></span>
                </div>
              </div>
            </div>
          )}

          <Form.Item label="配置角色" required>
            <Select
              value={addRoleId}
              onChange={setAddRoleId}
              options={roles.map((r) => ({ value: r.id, label: r.name }))}
            />
          </Form.Item>
        </Form>
      </Drawer>

      {/* ============ 编辑用户（仅角色） ============ */}
      <Drawer
        title={`编辑用户：${editUser?.name || ''}`}
        open={!!editUser}
        onClose={() => setEditUser(null)}
        width={420}
        extra={
          <Space>
            <Button onClick={() => setEditUser(null)}>取消</Button>
            <Button type="primary" onClick={submitEdit}>保存</Button>
          </Space>
        }
      >
        {editUser && (
          <>
            <div style={{ background: 'var(--gb-bg-secondary)', borderRadius: 6, padding: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <Avatar style={{ background: '#1A4D8F' }}>{editUser.avatar}</Avatar>
                <div>
                  <div style={{ fontWeight: 500 }}>{editUser.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--gb-text-muted)' }}>{editUser.title}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, lineHeight: '20px' }}>
                <div>部门：{deptName(editUser.dept_id)}</div>
                <div>手机：<span className="gb-mono">{editUser.phone}</span></div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--gb-text-muted)', marginBottom: 10 }}>
              姓名 / 部门来自 2.0 组织，不在此编辑；本页仅可调整角色。
            </div>
            <Form layout="vertical">
              <Form.Item label="角色">
                <Select
                  value={editRoleId}
                  onChange={setEditRoleId}
                  options={roles.map((r) => ({ value: r.id, label: r.name }))}
                />
              </Form.Item>
            </Form>
          </>
        )}
      </Drawer>

      {/* ============ 数据交接 ============ */}
      <Modal
        title={`数据交接 · ${handoverFor?.name || ''}`}
        open={!!handoverFor}
        onCancel={() => setHandoverFor(null)}
        onOk={submitHandover}
        okText="确认交接"
        cancelText="取消"
      >
        {handoverFor && (
          <>
            <div className="gb-handover-user-card">
              <Avatar size={40} style={{ background: '#1A4D8F' }}>{handoverFor.avatar}</Avatar>
              <div className="gb-handover-user-main">
                <strong>{handoverFor.name}</strong>
                <span>{deptName(handoverFor.dept_id)} · {handoverFor.title}</span>
              </div>
              <Tag color={USER_STATUS[handoverFor.status]?.color}>{USER_STATUS[handoverFor.status]?.label}</Tag>
            </div>

            <div className="gb-handover-note">
              交接会把该账号在 GOS 内的数据资产所有者转移给交接对象；账号状态不会自动变为离职，历史创建行为和系统日志保持原记录。
            </div>

            <div className="gb-handover-assets">
              {handoverAssets.map((item) => (
                <div className="gb-handover-asset" key={item.key}>
                  <span>{item.label}</span>
                  <strong>{item.count}</strong>
                  <em>{item.note}</em>
                </div>
              ))}
            </div>

            <div className="gb-handover-field-label">交接对象</div>
            <Select
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="label"
              placeholder="选择交接对象账号"
              value={handoverTo}
              onChange={setHandoverTo}
              options={handoverCandidates.map((u) => ({ value: u.id, label: `${u.name}（${deptName(u.dept_id)}）` }))}
              notFoundContent="暂无其他在职账号"
            />
          </>
        )}
      </Modal>
    </div>
  )
}
