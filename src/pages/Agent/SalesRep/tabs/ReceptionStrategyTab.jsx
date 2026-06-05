import {
  Form, Input, InputNumber, Switch, Button, Tag, Tooltip, Empty, Select, Space,
} from 'antd'
import {
  MessageOutlined, PlusOutlined, DeleteOutlined, BellOutlined,
  ClockCircleOutlined, GlobalOutlined, AimOutlined,
  ThunderboltOutlined, BranchesOutlined,
} from '@ant-design/icons'

// 未回复时长预设（分钟）
const NO_REPLY_OPTIONS = [
  { value: 60, label: '1 小时' },
  { value: 240, label: '4 小时' },
  { value: 720, label: '12 小时' },
  { value: 1440, label: '24 小时' },
  { value: 2880, label: '48 小时' },
  { value: 4320, label: '72 小时' },
  { value: 10080, label: '7 天' },
]

export default function ReceptionStrategyTab({ agent, onChange }) {
  const strategy = agent.reception_strategy || {}
  const session = strategy.session || { fixed_replies: [], max_rounds: 30, ai_title: '' }
  const wakeup = strategy.wakeup || { enabled: true, respect_timezone: true, rules: [] }

  const update = (patch) => {
    onChange({ ...agent, reception_strategy: { ...strategy, ...patch } })
  }
  const updateSession = (patch) => update({ session: { ...session, ...patch } })
  const updateWakeup = (patch) => update({ wakeup: { ...wakeup, ...patch } })

  // ---------- 会话设置：固定回复 ----------
  const handleFixedReplyChange = (id, key, val) => {
    updateSession({
      fixed_replies: session.fixed_replies.map((r) => (r.id === id ? { ...r, [key]: val } : r)),
    })
  }
  const handleAddFixedReply = () => {
    const id = `fr-new-${Date.now().toString(36)}`
    updateSession({
      fixed_replies: [...session.fixed_replies, { id, intent: '', reply: '', enabled: true }],
    })
  }
  const handleDeleteFixedReply = (id) => {
    updateSession({ fixed_replies: session.fixed_replies.filter((r) => r.id !== id) })
  }

  // ---------- 客户唤醒：规则 ----------
  const handleWakeupRuleChange = (id, key, val) => {
    updateWakeup({ rules: wakeup.rules.map((r) => (r.id === id ? { ...r, [key]: val } : r)) })
  }
  const handleAddWakeupRule = () => {
    const id = `wk-new-${Date.now().toString(36)}`
    updateWakeup({
      rules: [...wakeup.rules, { id, no_reply_minutes: 1440, script: '', task_goal: '', enabled: true }],
    })
  }
  const handleDeleteWakeupRule = (id) => {
    updateWakeup({ rules: wakeup.rules.filter((r) => r.id !== id) })
  }

  return (
    <>
      {/* ============================================================
          1. 会话设置
          ============================================================ */}
      <section className="gb-agent-section">
        <div className="gb-agent-section-head">
          <h3 className="gb-agent-section-title">
            <MessageOutlined style={{ marginRight: 6 }} />
            会话设置
          </h3>
        </div>
        <div className="gb-agent-section-body">
          {/* AI 称谓 + 最长会话轮数 */}
          <Form layout="vertical" style={{ maxWidth: 520, marginBottom: 8 }}>
            <Form.Item
              label="AI 称谓"
              tooltip="AI 在对话中的自称，会体现在话术里"
            >
              <Input
                value={session.ai_title}
                maxLength={32}
                placeholder="如：Sales Assistant / 敬城顾问"
                onChange={(e) => updateSession({ ai_title: e.target.value })}
              />
            </Form.Item>
            <Form.Item
              label="最长会话轮数"
              tooltip="AI 自主接待的最大对话轮数，超过后转人工兜底，避免无限兜圈"
            >
              <InputNumber
                min={1}
                max={200}
                value={session.max_rounds}
                onChange={(v) => updateSession({ max_rounds: v })}
                addonAfter="轮"
                style={{ width: 180 }}
              />
            </Form.Item>
          </Form>

          {/* 部分意图固定回复 */}
          <div className="gb-strategy-subhead">
            <span><BranchesOutlined style={{ marginRight: 6 }} />部分意图固定回复</span>
            <Button size="small" icon={<PlusOutlined />} onClick={handleAddFixedReply}>新增固定回复</Button>
          </div>
          <div style={{ fontSize: 12, color: 'var(--gb-text-muted)', margin: '4px 0 12px' }}>
            命中这些意图时直接走固定话术（不经大模型生成），用于高频、合规要求严格或须统一口径的场景。
          </div>
          {session.fixed_replies.length === 0 ? (
            <Empty description="暂无固定回复，点击右上「新增固定回复」" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <div className="gb-strategy-list">
              {session.fixed_replies.map((r) => (
                <div key={r.id} className={`gb-strategy-card ${!r.enabled ? 'is-disabled' : ''}`}>
                  <div className="gb-strategy-card-row">
                    <div className="gb-strategy-field" style={{ flex: '0 0 280px' }}>
                      <span className="gb-strategy-label">命中意图</span>
                      <Input
                        value={r.intent}
                        placeholder="如：询问营业时间"
                        onChange={(e) => handleFixedReplyChange(r.id, 'intent', e.target.value)}
                      />
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Tooltip title={r.enabled ? '已启用' : '已停用'}>
                        <Switch size="small" checked={r.enabled} onChange={(c) => handleFixedReplyChange(r.id, 'enabled', c)} />
                      </Tooltip>
                      <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteFixedReply(r.id)} />
                    </div>
                  </div>
                  <div className="gb-strategy-field gb-strategy-field-block" style={{ marginTop: 10 }}>
                    <span className="gb-strategy-label">固定话术</span>
                    <Input.TextArea
                      value={r.reply}
                      rows={2}
                      maxLength={500}
                      showCount
                      placeholder="命中该意图时 AI 原样发送的固定话术"
                      onChange={(e) => handleFixedReplyChange(r.id, 'reply', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============================================================
          2. 客户唤醒机制
          ============================================================ */}
      <section className="gb-agent-section">
        <div className="gb-agent-section-head">
          <h3 className="gb-agent-section-title">
            <BellOutlined style={{ marginRight: 6 }} />
            客户唤醒机制
          </h3>
          <Space>
            <span style={{ fontSize: 13, color: 'var(--gb-text-muted)' }}>启用</span>
            <Switch checked={wakeup.enabled} onChange={(c) => updateWakeup({ enabled: c })} />
          </Space>
        </div>
        <div className="gb-agent-section-body">
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <GlobalOutlined style={{ color: 'var(--gb-text-muted)' }} />
            <span style={{ fontSize: 13 }}>按客户所在时区择时发送</span>
            <Switch
              size="small"
              checked={wakeup.respect_timezone}
              onChange={(c) => updateWakeup({ respect_timezone: c })}
              disabled={!wakeup.enabled}
            />
            <span style={{ fontSize: 12, color: 'var(--gb-text-muted)' }}>
              （长期唤醒任务需判断对方时区，避免深夜打扰）
            </span>
          </div>

          <div className="gb-strategy-subhead">
            <span><ThunderboltOutlined style={{ marginRight: 6 }} />唤醒序列</span>
            <Button size="small" icon={<PlusOutlined />} onClick={handleAddWakeupRule} disabled={!wakeup.enabled}>
              新增唤醒
            </Button>
          </div>
          <div style={{ fontSize: 12, color: 'var(--gb-text-muted)', margin: '4px 0 12px' }}>
            唤醒条件：AI 推进后，客户未回复达到设定时长即触发；输出 = 激活话术 + 本次推进的任务目标。
          </div>

          {wakeup.rules.length === 0 ? (
            <Empty description="暂无唤醒规则" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <div className="gb-strategy-list">
              {wakeup.rules.map((r, idx) => (
                <div key={r.id} className={`gb-strategy-card ${!r.enabled ? 'is-disabled' : ''}`}>
                  <div className="gb-strategy-card-row">
                    <Tag color="blue">第 {idx + 1} 次唤醒</Tag>
                    <div className="gb-strategy-field">
                      <span className="gb-strategy-label"><ClockCircleOutlined style={{ marginRight: 4 }} />未回复时长</span>
                      <Select
                        value={r.no_reply_minutes}
                        onChange={(v) => handleWakeupRuleChange(r.id, 'no_reply_minutes', v)}
                        options={NO_REPLY_OPTIONS}
                        style={{ width: 140 }}
                      />
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Switch size="small" checked={r.enabled} onChange={(c) => handleWakeupRuleChange(r.id, 'enabled', c)} />
                      <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteWakeupRule(r.id)} />
                    </div>
                  </div>
                  <div className="gb-strategy-field gb-strategy-field-block" style={{ marginTop: 10 }}>
                    <span className="gb-strategy-label">激活话术</span>
                    <Input.TextArea
                      value={r.script}
                      rows={2}
                      maxLength={500}
                      showCount
                      placeholder="唤醒客户的话术，支持 {customer_name} 等变量"
                      onChange={(e) => handleWakeupRuleChange(r.id, 'script', e.target.value)}
                    />
                  </div>
                  <div className="gb-strategy-field gb-strategy-field-block" style={{ marginTop: 10 }}>
                    <span className="gb-strategy-label"><AimOutlined style={{ marginRight: 4 }} />任务目标</span>
                    <Input
                      value={r.task_goal}
                      maxLength={64}
                      placeholder="本次唤醒希望推进的目标，如：收集预算区间 / 索取设计图"
                      onChange={(e) => handleWakeupRuleChange(r.id, 'task_goal', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
