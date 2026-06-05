import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Input, Select, DatePicker, Button, Tag, Empty, App, Modal, Form, Avatar, Tooltip, Space,
} from 'antd'
import {
  SearchOutlined, PlusOutlined, PauseCircleOutlined, PlayCircleOutlined,
  DeleteOutlined, CopyOutlined, EditOutlined,
} from '@ant-design/icons'

import { store } from '../../../mock/store'
import { SALES_GROUPS } from '../../../mock/salesGroups'
import { CLOUD_ACCOUNTS } from '../../../mock/cloudAccounts'
import { makeDefaultThresholds } from '../../../mock/gradingAndHandoff'
import { getAgentStatus, getAgentStatusKey } from '../../../utils/agentStatus'
import { useAuth } from '../../../auth/AuthContext'

// 统计某 Agent 托管账号中在线的数量
function countOnline(agent) {
  const ids = agent.linked_whatsapp_accounts || []
  const online = CLOUD_ACCOUNTS.filter((a) => ids.includes(a.bsuid) && a.status === 'online').length
  return { total: ids.length, online }
}

// 时间戳显示到分（去掉秒）
function toMinute(ts) {
  return ts ? String(ts).slice(0, 16) : ts
}

// 生成「YYYY-MM-DD HH:mm」格式的当前时间（与 mock 一致、精确到分）
function nowStamp() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

import './agent-list.css'

export default function AgentList() {
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const { hasPerm } = useAuth()
  const canCreate = hasPerm('agent-sales-rep.create')
  const canDelete = hasPerm('agent-sales-rep.delete')
  const [agents, setAgents] = useState(() => store.getAgents())
  const [searchText, setSearchText] = useState('')
  const [filterDept, setFilterDept] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm] = Form.useForm()

  // 复制弹窗
  const [cloneTarget, setCloneTarget] = useState(null)
  const [cloneForm] = Form.useForm()

  const filtered = useMemo(() => {
    return agents.filter((a) => {
      if (searchText) {
        const q = searchText.toLowerCase()
        if (!a.display_name.toLowerCase().includes(q) && !a.short_id.toLowerCase().includes(q)) return false
      }
      if (filterDept) {
        const sg = SALES_GROUPS.find((s) => s.id === a.sales_group_id)
        if (sg?.department !== filterDept) return false
      }
      return true
    })
  }, [agents, searchText, filterDept])

  const deptOptions = useMemo(() => {
    const set = new Set(SALES_GROUPS.map((s) => s.department))
    return Array.from(set).map((d) => ({ value: d, label: d }))
  }, [])

  // 运行开关：草稿=启动(禁用,toast) / 接待中=暂停 / 暂停中=启动
  const handleTogglePause = (agent) => {
    const statusKey = getAgentStatusKey(agent)

    if (statusKey === 'draft') {
      message.warning('草稿尚未发布，请先在详情页完成配置并正式发布后再启动')
      return
    }

    const paused = statusKey === 'paused'
    modal.confirm({
      title: paused ? `启动 Agent「${agent.display_name}」` : `暂停 Agent「${agent.display_name}」`,
      content: paused
        ? '启动后该 Agent 会重新进入「接待中」，开始接收新会话；在途会话不受影响。'
        : '暂停后该 Agent 进入「暂停中」，不再接收新会话；在途会话由当前接待方继续，未接管的会话按"异常+普通"组合自动转人工 SLA 30 分钟。',
      okText: paused ? '确认启动' : '确认暂停',
      onOk: () => {
        const next = { ...agent, status: 'published', runtime_state: paused ? 'serving' : 'paused' }
        const updated = agents.map((a) => a.id === agent.id ? next : a)
        setAgents(updated)
        store.setAgents(updated)
        message.success(paused ? '已启动，当前为「接待中」' : '已暂停，当前为「暂停中」')
      },
    })
  }

  // 删除：接待中不可删（toast），草稿 / 暂停中可删
  const handleDelete = (agent) => {
    const statusKey = getAgentStatusKey(agent)
    if (statusKey === 'serving') {
      message.warning('「接待中」的 Agent 不可删除，请先暂停后再删除')
      return
    }
    modal.confirm({
      title: `删除 Agent「${agent.display_name}」`,
      content: '删除为软删，保留历史会话与配置版本痕迹，但所有托管账号将自动解除关联。',
      okText: '确认删除',
      okButtonProps: { danger: true },
      onOk: () => {
        const updated = agents.filter((a) => a.id !== agent.id)
        setAgents(updated)
        store.setAgents(updated)
        message.success('已删除')
      },
    })
  }

  // 编辑：接待中可编辑（进详情=开新版本草稿编辑，不影响在途），全状态可进入
  const handleEdit = (agent) => {
    navigate(`/agent/sales-rep/${agent.id}`)
  }

  // 点击复制按钮：弹出命名弹窗
  const handleClone = (agent) => {
    setCloneTarget(agent)
    cloneForm.setFieldsValue({ display_name: `${agent.display_name}-副本` })
  }

  // 在命名弹窗里点确认
  const handleConfirmClone = async () => {
    const values = await cloneForm.validateFields()
    const newId = `${cloneTarget.id}-copy-${Date.now().toString(36)}`
    const cloned = {
      ...cloneTarget,
      id: newId,
      display_name: values.display_name,
      short_id: `A-${33000 + Math.floor(Math.random() * 999)}`,
      status: 'draft',
      runtime_state: 'draft',
      current_version: 'v.1',
      created_at: nowStamp(),
      last_modified_at: nowStamp(),
      last_published_at: null,
      active_sessions: 0,
      linked_whatsapp_accounts: [], // 克隆不复制托管账号
      remark: cloneTarget.remark + '（复制自' + cloneTarget.display_name + '）',
    }
    const updated = [cloned, ...agents]
    setAgents(updated)
    store.setAgents(updated)
    setCloneTarget(null)
    cloneForm.resetFields()
    message.success(`已复制为「${values.display_name}」，已自动清空托管账号`)
  }

  const handleCreate = async () => {
    const values = await createForm.validateFields()
    const sg = SALES_GROUPS.find((s) => s.id === values.sales_group_id)
    const newAgent = {
      id: `agent-new-${Date.now().toString(36)}`,
      display_name: values.display_name,
      short_id: `A-${33000 + Math.floor(Math.random() * 999)}`,
      sales_group_id: values.sales_group_id,
      status: 'draft',
      runtime_state: 'draft',
      current_version: 'v.1',
      created_by: 'Gao Kui',
      created_by_avatar: 'GK',
      created_at: nowStamp(),
      last_modified_at: nowStamp(),
      last_modified_by: 'Gao Kui',
      last_modified_by_avatar: 'GK',
      last_published_at: null,
      active_sessions: 0,
      remark: values.remark || `${sg?.name || ''} 新建 Agent`,
      identity_card: { name: values.display_name, avatar: null, avatar_initials: 'AI', avatar_bg: '#1A4D8F' },
      linked_whatsapp_accounts: [],
      knowledge_libraries: [],
      reception_elements_config: [],
      intent_tasks_config: [],
      grading_config: { enabled: true, elements: [], thresholds: makeDefaultThresholds(), version: 'v.1' },
      handoff_config: { triggers: [] },
    }
    const updated = [newAgent, ...agents]
    setAgents(updated)
    store.setAgents(updated)
    setCreateOpen(false)
    createForm.resetFields()
    message.success(`已创建 Agent「${values.display_name}」（草稿）`)
    navigate(`/agent/sales-rep/${newAgent.id}`)
  }

  return (
    <div className="gb-agent-list-page">
      {/* 顶部工具栏 */}
      <div className="gb-agent-list-head">
        <h1 className="gb-agent-list-title">AI 业务员</h1>
        <div className="gb-agent-list-toolbar">
          <Input
            prefix={<SearchOutlined style={{ color: 'var(--gb-text-muted)' }} />}
            placeholder="Agent 名称 / ID"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ width: 240 }}
          />
          <Select
            placeholder="所属部门"
            allowClear
            value={filterDept}
            onChange={setFilterDept}
            options={deptOptions}
            style={{ width: 180 }}
          />
          <DatePicker.RangePicker placeholder={['创建时间', '创建时间']} style={{ width: 240 }} />
          <DatePicker.RangePicker placeholder={['修改时间', '修改时间']} style={{ width: 240 }} />
          <div style={{ flex: 1 }} />
          {canCreate && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              新建 Agent
            </Button>
          )}
        </div>
      </div>

      {/* 卡片网格 */}
      <div className="gb-agent-list-grid">
        {filtered.length === 0 ? (
          <Empty
            description="没有匹配条件的 Agent"
            style={{ gridColumn: '1 / -1', padding: '80px 0' }}
          />
        ) : (
          filtered.map((agent) => {
            const sg = SALES_GROUPS.find((s) => s.id === agent.sales_group_id)
            const statusMeta = getAgentStatus(agent)
            const statusKey = statusMeta.key
            const isServing = statusKey === 'serving'
            const acc = countOnline(agent)

            return (
              <div
                key={agent.id}
                className="gb-agent-card"
                onClick={() => navigate(`/agent/sales-rep/${agent.id}`)}
              >
                {/* 标题行 */}
                <div className="gb-agent-card-head">
                  <Tooltip title={agent.display_name}>
                    <h3 className="gb-agent-card-title">{agent.display_name}</h3>
                  </Tooltip>
                  <span className="gb-agent-card-id">ID: {agent.short_id}</span>
                </div>

                {/* 状态标签行（唯一状态，不并存） */}
                <div className="gb-agent-card-tags">
                  <span
                    className="gb-agent-card-tag"
                    style={{ borderColor: statusMeta.border, color: statusMeta.color, background: statusMeta.bg }}
                  >
                    <span
                      style={{
                        display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                        background: statusMeta.dot, marginRight: 6, verticalAlign: 'middle',
                      }}
                    />
                    {statusMeta.label}
                  </span>
                </div>

                {/* 元信息 */}
                <dl className="gb-agent-card-meta">
                  <div>
                    <dt>当前版本：</dt>
                    <dd className="gb-mono">{agent.current_version}</dd>
                  </div>
                  <div>
                    <dt>创建人：</dt>
                    <dd>{agent.created_by}</dd>
                  </div>
                  <div>
                    <dt>创建时间：</dt>
                    <dd className="gb-mono">{toMinute(agent.created_at)}</dd>
                  </div>
                  <div>
                    <dt>最近修改：</dt>
                    <dd className="gb-mono">{toMinute(agent.last_modified_at)}</dd>
                  </div>
                  <div>
                    <dt>托管账号：</dt>
                    <dd>
                      {acc.total} 个
                      {acc.total > 0 && (
                        <span style={{ color: 'var(--gb-text-muted)' }}>（{acc.online} 在线）</span>
                      )}
                    </dd>
                  </div>
                </dl>

                {/* 操作按钮：删除 / 暂停·启动 / 编辑 / 复制（按操作权限显示） */}
                <div className="gb-agent-card-actions" onClick={(e) => e.stopPropagation()}>
                  {canDelete && (
                    <Button size="small" icon={<DeleteOutlined />} onClick={() => handleDelete(agent)} danger>
                      删除
                    </Button>
                  )}
                  <Button
                    size="small"
                    icon={isServing ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                    onClick={() => handleTogglePause(agent)}
                  >
                    {isServing ? '暂停' : '启动'}
                  </Button>
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    type="primary"
                    ghost
                    onClick={() => handleEdit(agent)}
                  >
                    编辑
                  </Button>
                  {canCreate && (
                    <Button size="small" icon={<CopyOutlined />} onClick={() => handleClone(agent)}>
                      复制
                    </Button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 新建 Agent 弹窗 */}
      <Modal
        title="新建 Agent"
        open={createOpen}
        onCancel={() => { setCreateOpen(false); createForm.resetFields() }}
        onOk={handleCreate}
        okText="创建"
        cancelText="取消"
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="display_name"
            label="Agent 名称"
            rules={[{ required: true, message: '请输入 Agent 名称' }]}
          >
            <Input maxLength={32} placeholder="如：敬城-北美-正式接待" />
          </Form.Item>
          <Form.Item
            name="sales_group_id"
            label="所属销售组"
            rules={[{ required: true, message: '请选择所属销售组' }]}
          >
            <Select
              placeholder="搜索 / 选择销售组"
              showSearch
              optionFilterProp="label"
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              options={SALES_GROUPS.map((s) => ({ value: s.id, label: `${s.name} · ${s.region}` }))}
            />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} maxLength={200} showCount placeholder="可填写该 Agent 的用途说明" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 复制 Agent 二级弹窗 */}
      <Modal
        title={`复制 Agent`}
        open={!!cloneTarget}
        onCancel={() => { setCloneTarget(null); cloneForm.resetFields() }}
        onOk={handleConfirmClone}
        okText="确认复制"
        cancelText="取消"
        destroyOnHidden
      >
        {cloneTarget && (
          <>
            <div
              style={{
                padding: 12, background: 'var(--gb-bg-elevated, #F1F4F8)', borderRadius: 6,
                marginBottom: 16, fontSize: 13,
              }}
            >
              <div style={{ color: 'var(--gb-text-muted)', marginBottom: 4 }}>源 Agent</div>
              <div style={{ fontWeight: 500 }}>{cloneTarget.display_name}</div>
              <div className="gb-mono" style={{ fontSize: 11, color: 'var(--gb-text-muted)', marginTop: 2 }}>
                ID: {cloneTarget.short_id}
              </div>
            </div>
            <Form form={cloneForm} layout="vertical">
              <Form.Item
                name="display_name"
                label="新 Agent 名称"
                rules={[
                  { required: true, message: '请输入新 Agent 名称' },
                  { max: 32, message: '最多 32 字' },
                ]}
              >
                <Input maxLength={32} showCount placeholder="给副本起一个新名字" />
              </Form.Item>
            </Form>
            <div style={{ fontSize: 12, color: 'var(--gb-text-muted)', marginTop: 4 }}>
              复制内容包含：基础配置、线索评级、转人工规则、知识库引用。<br />
              关联 WhatsApp 账号<strong>不会复制</strong>（避免冲突），需在副本中重新绑定。
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
