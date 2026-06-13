import {
  Form, Input, InputNumber, Switch, Button, Tooltip, Empty, Select, Space, App,
} from 'antd'
import {
  MessageOutlined, PlusOutlined, DeleteOutlined, GlobalOutlined,
  ThunderboltOutlined, BranchesOutlined, CloseOutlined, CloudUploadOutlined,
} from '@ant-design/icons'

import ScriptEditor from './ScriptEditor'
import {
  NO_REPLY_OPTIONS, CONDITION_SELECT_OPTIONS,
  getAttr, conditionDefaults, defaultCondition, opLabel,
} from '../../../../mock/automation'

// 平铺切换（强对比，明显可点击）
function PillToggle({ value, onChange, options }) {
  return (
    <div className="gb-pill-toggle">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={value === o.value ? 'is-on' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// 未回复时长：预设 + 自由填写（小时）
function NoReplyValue({ value, onChange }) {
  const isPreset = NO_REPLY_OPTIONS.some((o) => o.value === value)
  const opts = [...NO_REPLY_OPTIONS, { value: '__custom__', label: '自定义…' }]
  return (
    <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
      <Select
        value={isPreset ? value : '__custom__'}
        style={{ width: 116 }}
        options={opts}
        onChange={(v) => onChange(v === '__custom__' ? (isPreset ? 360 : value) : v)}
      />
      {!isPreset && (
        <InputNumber
          min={1}
          max={4320}
          value={Math.round((value || 60) / 60)}
          addonAfter="小时"
          style={{ width: 132 }}
          onChange={(h) => onChange(Math.max(1, Math.round((h || 1) * 60)))}
        />
      )}
    </span>
  )
}

export default function ReceptionStrategyTab({ agent, onChange }) {
  const { message } = App.useApp()
  const strategy = agent.reception_strategy || {}
  const session = strategy.session || { fixed_replies: [], max_rounds: 30, ai_title: '' }
  const wakeup = strategy.wakeup || { enabled: true, respect_timezone: true, tasks: [] }
  const tasks = wakeup.tasks || []

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

  // ---------- 自动化任务 ----------
  const handleTaskChange = (id, key, val) => {
    updateWakeup({ tasks: tasks.map((t) => (t.id === id ? { ...t, [key]: val } : t)) })
  }
  const handleAddTask = () => {
    const id = `at-new-${Date.now().toString(36)}`
    updateWakeup({
      tasks: [...tasks, {
        id, enabled: true, name: '', event_type: 'wakeup_customer', match: 'all',
        conditions: [defaultCondition()], output_mode: 'goal', script: '', task_goal: '',
      }],
    })
  }
  const handleDeleteTask = (id) => {
    updateWakeup({ tasks: tasks.filter((t) => t.id !== id) })
  }
  const saveTask = (t) => {
    if (!t.name?.trim()) { message.warning('请先填写事件名称'); return }
    message.success(`已实时保存「${t.name.trim()}」`)
  }

  const setConds = (taskId, conds) => {
    updateWakeup({ tasks: tasks.map((t) => (t.id === taskId ? { ...t, conditions: conds } : t)) })
  }
  const addCondition = (task) => setConds(task.id, [...(task.conditions || []), defaultCondition()])
  const changeCondition = (task, condId, patch) =>
    setConds(task.id, (task.conditions || []).map((c) => (c.id === condId ? { ...c, ...patch } : c)))
  const removeCondition = (task, condId) =>
    setConds(task.id, (task.conditions || []).filter((c) => c.id !== condId))

  // 单条触发条件
  const renderCondition = (task, c) => {
    const attr = getAttr(c.attr)
    return (
      <div key={c.id} className="gb-cond-row">
        <Select
          value={c.attr}
          style={{ width: 150 }}
          options={CONDITION_SELECT_OPTIONS}
          onChange={(attrId) => changeCondition(task, c.id, { attr: attrId, ...conditionDefaults(attrId) })}
        />
        <span className="gb-cond-op">{opLabel(c.attr)}</span>
        {attr?.valueType === 'minutes' ? (
          <NoReplyValue value={c.value} onChange={(v) => changeCondition(task, c.id, { value: v })} />
        ) : (
          <Select
            mode="multiple"
            value={c.value || []}
            style={{ minWidth: 200, maxWidth: 380, flex: 1 }}
            placeholder="选择一个或多个（组内任一即满足）"
            options={(attr?.options || []).map((o) => ({ value: o, label: o }))}
            onChange={(v) => changeCondition(task, c.id, { value: v })}
            maxTagCount="responsive"
          />
        )}
        <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => removeCondition(task, c.id)} />
      </div>
    )
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
          <Form layout="vertical" style={{ maxWidth: 520, marginBottom: 8 }}>
            <Form.Item label="AI 称谓" tooltip="AI 在对话中的自称，会体现在话术里">
              <Input
                value={session.ai_title}
                maxLength={32}
                placeholder="如：Sales Assistant / 敬城顾问"
                onChange={(e) => updateSession({ ai_title: e.target.value })}
              />
            </Form.Item>
            <Form.Item label="最长会话轮数" tooltip="AI 自主接待的最大对话轮数，超过后转人工兜底，避免无限兜圈">
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
          2. 自动化任务（围绕：任务名称 / 满足条件 / 执行动作 三块一级信息）
          ============================================================ */}
      <section className="gb-agent-section">
        <div className="gb-agent-section-head">
          <h3 className="gb-agent-section-title">
            <ThunderboltOutlined style={{ marginRight: 6 }} />
            自动化任务
          </h3>
          <Space>
            <span style={{ fontSize: 13, color: 'var(--gb-text-muted)' }}>启用</span>
            <Switch checked={wakeup.enabled} onChange={(c) => updateWakeup({ enabled: c })} />
          </Space>
        </div>
        <div className="gb-agent-section-body">
          <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <GlobalOutlined style={{ color: 'var(--gb-text-muted)' }} />
            <span style={{ fontSize: 13 }}>按客户所在时区择时发送</span>
            <Switch
              size="small"
              checked={wakeup.respect_timezone}
              onChange={(c) => updateWakeup({ respect_timezone: c })}
              disabled={!wakeup.enabled}
            />
            <span style={{ fontSize: 12, color: 'var(--gb-text-muted)' }}>（避免深夜打扰）</span>
          </div>

          <div className="gb-strategy-subhead">
            <span><ThunderboltOutlined style={{ marginRight: 6 }} />任务列表</span>
            <Button size="small" type="primary" ghost icon={<PlusOutlined />} onClick={handleAddTask} disabled={!wakeup.enabled}>
              新增任务
            </Button>
          </div>

          {tasks.length === 0 ? (
            <div style={{ marginTop: 12 }}>
              <Empty description="暂无自动化任务，点击右上「新增任务」" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          ) : (
            <div className="gb-strategy-list" style={{ marginTop: 14 }}>
              {tasks.map((t, idx) => {
                const mode = t.output_mode || 'goal'
                return (
                  <div key={t.id} className={`gb-task-card ${!t.enabled ? 'is-disabled' : ''}`}>
                    {/* ① 任务名称 */}
                    <div className="gb-task-namebar">
                      <span className="gb-task-index">{idx + 1}</span>
                      <Input
                        className="gb-task-name"
                        value={t.name}
                        status={!t.name?.trim() ? 'error' : undefined}
                        maxLength={40}
                        placeholder="事件名称（必填）"
                        onChange={(e) => handleTaskChange(t.id, 'name', e.target.value)}
                      />
                      <Tooltip title="实时保存">
                        <Button
                          className="gb-task-save"
                          type="text"
                          shape="circle"
                          size="small"
                          icon={<CloudUploadOutlined />}
                          onClick={() => saveTask(t)}
                        />
                      </Tooltip>
                      <div className="gb-task-tools">
                        <Tooltip title={t.enabled ? '已启用' : '已停用'}>
                          <Switch size="small" checked={t.enabled} onChange={(c) => handleTaskChange(t.id, 'enabled', c)} />
                        </Tooltip>
                        <Tooltip title="删除任务">
                          <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteTask(t.id)} />
                        </Tooltip>
                      </div>
                    </div>

                    {/* ② 满足条件 */}
                    <div className="gb-task-block">
                      <div className="gb-cond-head">
                        <span className="gb-cond-head-text">满足下列</span>
                        <PillToggle
                          value={t.match || 'all'}
                          onChange={(v) => handleTaskChange(t.id, 'match', v)}
                          options={[{ label: '所有', value: 'all' }, { label: '任一', value: 'any' }]}
                        />
                        <span className="gb-cond-head-text">条件</span>
                      </div>
                      <div className="gb-cond-group">
                        {(t.conditions || []).length === 0 && (
                          <div className="gb-cond-empty">未设置条件 = 仅按事件本身触发</div>
                        )}
                        {(t.conditions || []).map((c) => renderCondition(t, c))}
                        <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => addCondition(t)}>
                          添加条件
                        </Button>
                      </div>
                    </div>

                    {/* ③ 执行动作（默认 AI 目标 / 自由话术 二选一） */}
                    <div className="gb-task-block">
                      <div className="gb-task-action-head">
                        <span className="gb-task-action-label">执行动作</span>
                        <PillToggle
                          value={mode}
                          onChange={(v) => handleTaskChange(t.id, 'output_mode', v)}
                          options={[{ label: 'AI 目标', value: 'goal' }, { label: '自由话术', value: 'script' }]}
                        />
                      </div>
                      {mode === 'goal' ? (
                        <Input
                          value={t.task_goal}
                          maxLength={64}
                          placeholder="交给 AI 自主推进的目标，如：收集预算区间 / 索取设计图"
                          onChange={(e) => handleTaskChange(t.id, 'task_goal', e.target.value)}
                        />
                      ) : (
                        <ScriptEditor
                          value={t.script}
                          onChange={(v) => handleTaskChange(t.id, 'script', v)}
                          placeholder="唤醒客户的话术，支持加粗 *、变量 {customer_name}、插入图册等"
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
