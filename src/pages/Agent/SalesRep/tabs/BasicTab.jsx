import { useState, useMemo } from 'react'
import {
  Form, Input, Select, Button, Avatar, Tag, App, Modal, Table, Space, Empty,
} from 'antd'
import {
  UserOutlined, WhatsAppOutlined, LinkOutlined, PlusOutlined,
  DisconnectOutlined, CheckCircleFilled, CloseCircleFilled,
  SearchOutlined,
} from '@ant-design/icons'

import { SALES_GROUPS } from '../../../../mock/salesGroups'
import { CLOUD_ACCOUNTS, accountsBySalesGroup } from '../../../../mock/cloudAccounts'

const STATUS_DOT = {
  online: <CheckCircleFilled style={{ color: 'var(--gb-success)' }} />,
  offline: <CloseCircleFilled style={{ color: 'var(--gb-warning)' }} />,
}

export default function BasicTab({ agent, onChange }) {
  const { message, modal } = App.useApp()
  const [bindModalOpen, setBindModalOpen] = useState(false)
  const [searchText, setSearchText] = useState('')

  // 列表筛选：关键词模糊（账号名 / 手机号 / BSUID）+ 负责人 / 在线状态 下拉
  const [filterKeyword, setFilterKeyword] = useState('')
  const [filterStatus, setFilterStatus] = useState(null)
  const [filterOwner, setFilterOwner] = useState(null)

  const linkedAccountsAll = useMemo(
    () => CLOUD_ACCOUNTS.filter((a) => (agent.linked_whatsapp_accounts || []).includes(a.bsuid)),
    [agent.linked_whatsapp_accounts],
  )

  // 负责人去重选项
  const ownerOptions = useMemo(() => {
    const set = new Map()
    linkedAccountsAll.forEach((a) => { if (!set.has(a.owner_name)) set.set(a.owner_name, a) })
    return Array.from(set.values()).map((a) => ({
      value: a.owner_name,
      label: a.owner_name,
      avatar: a.owner_avatar,
    }))
  }, [linkedAccountsAll])

  const linkedAccounts = useMemo(() => {
    return linkedAccountsAll.filter((a) => {
      if (filterKeyword) {
        const q = filterKeyword.toLowerCase()
        const phoneNorm = a.phone.replace(/\s|-/g, '')
        const hit = a.account_name.toLowerCase().includes(q)
          || phoneNorm.includes(filterKeyword.replace(/\s|-/g, ''))
          || a.bsuid.toLowerCase().includes(q)
        if (!hit) return false
      }
      if (filterStatus && a.status !== filterStatus) return false
      if (filterOwner && a.owner_name !== filterOwner) return false
      return true
    })
  }, [linkedAccountsAll, filterKeyword, filterStatus, filterOwner])

  const hasFilter = filterKeyword || filterStatus || filterOwner

  const availableAccounts = useMemo(() => {
    const list = accountsBySalesGroup(agent.sales_group_id).filter((a) => {
      if (agent.linked_whatsapp_accounts?.includes(a.bsuid)) return false
      if (a.ref_agent_id && a.ref_agent_id !== agent.id) return false
      return true
    })
    if (!searchText) return list
    const q = searchText.toLowerCase()
    return list.filter((a) =>
      a.account_name.toLowerCase().includes(q)
      || a.phone.includes(searchText)
      || a.remark.toLowerCase().includes(q),
    )
  }, [agent.sales_group_id, agent.linked_whatsapp_accounts, agent.id, searchText])

  // ---------- 基础信息 ----------
  const handleBasicChange = (changedValues) => {
    const next = { ...agent }
    if ('agent_name' in changedValues) {
      next.display_name = changedValues.agent_name
      next.identity_card = { ...(agent.identity_card || {}), name: changedValues.agent_name }
    }
    if ('sales_group_id' in changedValues) {
      next.sales_group_id = changedValues.sales_group_id
    }
    if ('remark' in changedValues) {
      next.remark = changedValues.remark
    }
    onChange(next)
  }

  // ---------- WhatsApp 列表 ----------
  const handleUnbind = (account) => {
    modal.confirm({
      title: `解绑 WhatsApp 账号「${account.account_name}」？`,
      content: '解绑后该账号将不再被该 Agent 接管。在途会话不受影响。',
      okText: '确认解绑',
      okButtonProps: { danger: true },
      onOk: () => {
        const next = {
          ...agent,
          linked_whatsapp_accounts: agent.linked_whatsapp_accounts.filter((id) => id !== account.bsuid),
        }
        onChange(next)
        message.success(`已解绑 ${account.account_name}`)
      },
    })
  }

  const handleBind = (account) => {
    const next = {
      ...agent,
      linked_whatsapp_accounts: [...(agent.linked_whatsapp_accounts || []), account.bsuid],
    }
    onChange(next)
    message.success(`已绑定 ${account.account_name}`)
  }

  return (
    <>
      {/* ============================================================
          基础信息（仅 Agent 名称）
          ============================================================ */}
      <section className="gb-agent-section">
        <div className="gb-agent-section-head">
          <h3 className="gb-agent-section-title">
            <UserOutlined style={{ marginRight: 6 }} />
            基础信息
          </h3>
        </div>
        <div className="gb-agent-section-body">
          <Form
            layout="vertical"
            initialValues={{
              agent_name: agent.display_name,
              sales_group_id: agent.sales_group_id,
              remark: agent.remark,
            }}
            onValuesChange={handleBasicChange}
            style={{ maxWidth: 520 }}
          >
            <Form.Item
              label="Agent 名称"
              name="agent_name"
              rules={[{ required: true, message: '请输入 Agent 名称' }, { max: 32, message: '最多 32 字' }]}
            >
              <Input maxLength={32} showCount placeholder="如：敬城-北美-正式接待" />
            </Form.Item>
            <Form.Item
              label="所属销售组"
              name="sales_group_id"
              rules={[{ required: true, message: '请选择所属销售组' }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                options={SALES_GROUPS.map((sg) => ({
                  value: sg.id,
                  label: `${sg.name} · ${sg.region}`,
                }))}
              />
            </Form.Item>
            <Form.Item
              label="备注"
              name="remark"
            >
              <Input.TextArea
                rows={2}
                maxLength={200}
                showCount
                placeholder="该 Agent 的用途说明、责任人、上线背景等"
              />
            </Form.Item>
          </Form>
        </div>
      </section>

      {/* ============================================================
          托管 WhatsApp 账号（列表化）
          ============================================================ */}
      <section className="gb-agent-section">
        <div className="gb-agent-section-head">
          <h3 className="gb-agent-section-title">
            <WhatsAppOutlined style={{ marginRight: 6 }} />
            托管 WhatsApp 账号
          </h3>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setBindModalOpen(true)}>
              新增绑定
            </Button>
          </Space>
        </div>

        {/* 筛选条：模糊搜索（账号名 / 手机号 / BSUID）+ 负责人 / 在线状态 下拉 */}
        {linkedAccountsAll.length > 0 && (
          <div
            style={{
              padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12,
              flexWrap: 'wrap', borderBottom: '1px solid var(--gb-border-light)',
              background: 'var(--gb-bg-elevated, #F7F9FC)',
            }}
          >
            <Input
              prefix={<SearchOutlined style={{ color: 'var(--gb-text-muted)' }} />}
              placeholder="账号名 / 手机号 / BSUID"
              value={filterKeyword}
              onChange={(e) => setFilterKeyword(e.target.value)}
              allowClear
              style={{ width: 240 }}
              size="middle"
            />
            <Select
              placeholder="负责人"
              value={filterOwner}
              onChange={setFilterOwner}
              allowClear
              options={ownerOptions}
              style={{ width: 160 }}
              size="middle"
            />
            <Select
              placeholder="在线状态"
              value={filterStatus}
              onChange={setFilterStatus}
              allowClear
              options={[
                { value: 'online', label: '在线' },
                { value: 'offline', label: '离线' },
              ]}
              style={{ width: 120 }}
              size="middle"
            />
            {hasFilter && (
              <Button
                type="link"
                size="small"
                onClick={() => { setFilterKeyword(''); setFilterStatus(null); setFilterOwner(null) }}
              >
                清空筛选
              </Button>
            )}
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 12, color: 'var(--gb-text-muted)' }}>
              {hasFilter
                ? <>已筛选出 <strong style={{ color: 'var(--gb-text-primary)' }}>{linkedAccounts.length}</strong> / 共 {linkedAccountsAll.length} 个账号</>
                : <>共 <strong style={{ color: 'var(--gb-text-primary)' }}>{linkedAccountsAll.length}</strong> 个托管账号</>}
            </span>
          </div>
        )}

        <div className="gb-agent-section-body" style={{ padding: 0 }}>
          {linkedAccountsAll.length === 0 ? (
            <Empty description="尚未托管任何 MoChat 账号" style={{ padding: '40px 0' }} />
          ) : (
            <Table
              dataSource={linkedAccounts}
              rowKey="bsuid"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: [10, 20, 50],
                showTotal: (total) => `共 ${total} 条`,
                size: 'small',
              }}
              size="middle"
              locale={{ emptyText: '没有匹配筛选条件的账号' }}
              columns={[
                {
                  title: '账号名',
                  key: 'account_name',
                  render: (_, r) => (
                    <Space>
                      <Avatar size="small" style={{ background: '#25D366' }}>{r.account_name[0]}</Avatar>
                      <span style={{ fontWeight: 500 }}>{r.account_name}</span>
                    </Space>
                  ),
                },
                {
                  title: '手机号',
                  dataIndex: 'phone',
                  width: 160,
                  render: (v) => <span className="gb-mono">{v}</span>,
                },
                {
                  title: 'BSUID',
                  dataIndex: 'bsuid',
                  width: 180,
                  render: (v) => <span className="gb-mono" style={{ fontSize: 12, color: 'var(--gb-text-secondary)' }}>{v}</span>,
                },
                {
                  title: '负责人',
                  key: 'owner',
                  width: 130,
                  render: (_, r) => (
                    <Space size={6}>
                      <Avatar size={20} style={{ background: '#1A4D8F', fontSize: 11 }}>{r.owner_avatar}</Avatar>
                      {r.owner_name}
                    </Space>
                  ),
                },
                {
                  title: '在线状态',
                  dataIndex: 'status',
                  width: 100,
                  render: (v) => (
                    <Space size={4}>
                      {STATUS_DOT[v]}
                      <span style={{ color: v === 'online' ? 'var(--gb-success)' : 'var(--gb-text-muted)' }}>
                        {v === 'online' ? '在线' : '离线'}
                      </span>
                    </Space>
                  ),
                },
                {
                  title: '在线时长',
                  dataIndex: 'online_duration',
                  width: 120,
                  render: (v, r) => r.status === 'online'
                    ? <span>{v || '在线中'}</span>
                    : <span style={{ color: 'var(--gb-text-muted)' }}>—</span>,
                },
                {
                  title: '上次在线',
                  dataIndex: 'last_online_at',
                  width: 160,
                  render: (v, r) => r.status === 'offline'
                    ? <span className="gb-mono" style={{ fontSize: 12, color: 'var(--gb-text-muted)' }}>{v}</span>
                    : <span style={{ color: 'var(--gb-text-muted)' }}>—</span>,
                },
                {
                  title: '操作',
                  key: 'action',
                  width: 80,
                  render: (_, r) => (
                    <Button type="text" size="small" danger icon={<DisconnectOutlined />} onClick={() => handleUnbind(r)}>
                      解绑
                    </Button>
                  ),
                },
              ]}
            />
          )}
        </div>
      </section>

      {/* ============================================================
          新增绑定 WhatsApp 账号 Modal
          ============================================================ */}
      <Modal
        title="新增绑定 WhatsApp 账号"
        open={bindModalOpen}
        onCancel={() => { setBindModalOpen(false); setSearchText('') }}
        footer={null}
        width={720}
      >
        <div style={{ marginBottom: 12 }}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索账号名 / 手机号 / 备注"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--gb-text-muted)' }}>
            仅展示当前销售组「{SALES_GROUPS.find((s) => s.id === agent.sales_group_id)?.name}」下的可用账号
          </div>
        </div>
        <Table
          dataSource={availableAccounts}
          rowKey="bsuid"
          pagination={{ pageSize: 8 }}
          size="small"
          locale={{ emptyText: '没有可绑定的账号（销售组内的账号可能已全部被绑定）' }}
          columns={[
            {
              title: '账号名',
              key: 'name',
              render: (_, r) => (
                <Space>
                  <Avatar size="small" style={{ background: '#25D366' }}>{r.account_name[0]}</Avatar>
                  <div>
                    <div style={{ fontWeight: 500 }}>{r.account_name}</div>
                    <div className="gb-mono" style={{ fontSize: 11, color: 'var(--gb-text-muted)' }}>{r.phone}</div>
                  </div>
                </Space>
              ),
            },
            {
              title: '状态',
              dataIndex: 'status',
              width: 100,
              render: (v, r) => (
                <Space size={4}>
                  {STATUS_DOT[v]}
                  <span>{v === 'online' ? '在线' : '掉线'}</span>
                  {r.is_test && <Tag color="orange">测试</Tag>}
                </Space>
              ),
            },
            { title: '备注', dataIndex: 'remark', ellipsis: true },
            {
              title: '操作',
              key: 'action',
              width: 80,
              render: (_, r) => (
                <Button type="link" size="small" icon={<LinkOutlined />} onClick={() => handleBind(r)}>
                  绑定
                </Button>
              ),
            },
          ]}
        />
      </Modal>
    </>
  )
}
