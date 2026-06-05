import { useState, useMemo } from 'react'
import { Tree, Table, Input, Tag, Avatar, Space, Empty, Button, Tooltip } from 'antd'
import { SearchOutlined, ReloadOutlined, ApartmentOutlined } from '@ant-design/icons'

import { DEPARTMENTS, DEPARTMENTS_FLAT, USERS, USER_STATUS, deptName } from '../../mock/org'
import { roleById } from '../../mock/rbac'

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

export default function Members() {
  const [selectedDept, setSelectedDept] = useState(null)
  const [keyword, setKeyword] = useState('')

  const treeData = useMemo(() => toTreeData(DEPARTMENTS), [])

  const filteredUsers = useMemo(() => {
    let list = USERS
    if (selectedDept) {
      const scope = deptAndChildren(selectedDept)
      list = list.filter((u) => scope.includes(u.dept_id))
    }
    if (keyword) {
      const q = keyword.toLowerCase()
      list = list.filter((u) => u.name.toLowerCase().includes(q) || u.account.toLowerCase().includes(q))
    }
    return list
  }, [selectedDept, keyword])

  const columns = [
    {
      title: '用户',
      key: 'user',
      render: (_, r) => (
        <Space>
          <Avatar size="small" style={{ background: r.status === 'active' ? '#1A4D8F' : '#9CA3AF' }}>{r.avatar}</Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{r.name}</div>
            <div style={{ fontSize: 11, color: 'var(--gb-text-muted)' }}>{r.title}</div>
          </div>
        </Space>
      ),
    },
    { title: '手机号', dataIndex: 'phone', render: (v) => <span className="gb-mono">{v}</span> },
    { title: '部门', dataIndex: 'dept_id', render: (v) => deptName(v) },
    {
      title: '当前角色',
      dataIndex: 'role_id',
      width: 140,
      render: (v) => <Tag color="blue">{roleById(v)?.name || '普通用户'}</Tag>,
    },
    {
      title: '账号状态',
      dataIndex: 'status',
      width: 110,
      render: (v) => {
        const s = USER_STATUS[v]
        return <Tag color={s.color}>{s.label}</Tag>
      },
    },
    { title: '创建时间', dataIndex: 'joined_at', width: 120, render: (v) => <span className="gb-mono">{v}</span> },
  ]

  return (
    <div className="gb-settings-page">
      <div className="gb-settings-page-head">
        <h1 className="gb-settings-page-title">部门与用户</h1>
      </div>

      <div className="gb-members-layout">
        {/* 部门树 */}
        <div className="gb-members-tree">
          <div className="gb-members-tree-head">
            <span><ApartmentOutlined style={{ marginRight: 6 }} />部门</span>
            <Tooltip title="重新读取 2.0 组织（演示）">
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
            pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 人` }}
            locale={{ emptyText: <Empty description="该部门下暂无用户" /> }}
          />
        </div>
      </div>
    </div>
  )
}
