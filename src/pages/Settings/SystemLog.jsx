import { useState, useMemo } from 'react'
import { Table, Input, Select, Tag, Avatar, Space, Empty } from 'antd'
import { SearchOutlined } from '@ant-design/icons'

import { useAuth } from '../../auth/AuthContext'

// 事件类型 → 展示元信息
export const LOG_TYPE = {
  account_add: { label: '新增用户', color: 'green' },
  account_role: { label: '修改用户角色', color: 'blue' },
  account_status: { label: '停用/启用', color: 'orange' },
  handover: { label: '数据交接', color: 'purple' },
  account_delete: { label: '删除账号', color: 'red' },
  role_perm: { label: '修改角色权限', color: 'geekblue' },
  role_add: { label: '新增角色', color: 'green' },
  role_delete: { label: '删除角色', color: 'red' },
}

export default function SystemLog() {
  const { logs } = useAuth()
  const [keyword, setKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState(null)

  const filtered = useMemo(() => logs.filter((l) => {
    if (typeFilter && l.type !== typeFilter) return false
    if (keyword) {
      const q = keyword.toLowerCase()
      return l.text.toLowerCase().includes(q) || l.actor.toLowerCase().includes(q)
    }
    return true
  }), [logs, keyword, typeFilter])

  const columns = [
    {
      title: '时间',
      dataIndex: 'time',
      width: 180,
      render: (v) => <span className="gb-mono" style={{ fontSize: 12, color: 'var(--gb-text-muted)' }}>{v}</span>,
    },
    {
      title: '操作人',
      dataIndex: 'actor',
      width: 150,
      render: (v, r) => (
        <Space>
          <Avatar size="small" style={{ background: '#1A4D8F' }}>{r.actor_avatar}</Avatar>
          <span>{v}</span>
        </Space>
      ),
    },
    {
      title: '事件类型',
      dataIndex: 'type',
      width: 130,
      render: (v) => {
        const m = LOG_TYPE[v] || { label: v, color: 'default' }
        return <Tag color={m.color}>{m.label}</Tag>
      },
    },
    {
      title: '事件详情',
      dataIndex: 'text',
      render: (v) => <span style={{ fontSize: 13 }}>{v}</span>,
    },
  ]

  return (
    <div className="gb-settings-page">
      <div className="gb-settings-page-head">
        <h1 className="gb-settings-page-title">系统日志</h1>
      </div>

      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Input
          prefix={<SearchOutlined style={{ color: 'var(--gb-text-muted)' }} />}
          placeholder="搜索操作人 / 事件内容"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          allowClear
          style={{ width: 280 }}
        />
        <Select
          placeholder="全部事件类型"
          allowClear
          style={{ width: 170 }}
          value={typeFilter}
          onChange={setTypeFilter}
          options={Object.entries(LOG_TYPE).map(([v, m]) => ({ value: v, label: m.label }))}
        />
        <span style={{ fontSize: 13, color: 'var(--gb-text-muted)' }}>
          共 <strong style={{ color: 'var(--gb-text)' }}>{filtered.length}</strong> 条记录
        </span>
      </div>

      <Table
        columns={columns}
        dataSource={filtered}
        rowKey="id"
        size="middle"
        pagination={{ pageSize: 12, showTotal: (t) => `共 ${t} 条` }}
        locale={{ emptyText: <Empty description="暂无匹配的日志" /> }}
      />
    </div>
  )
}
