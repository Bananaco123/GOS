import { useMemo, useRef, useEffect, useState } from 'react'
import {
  Select, Input, InputNumber, Button, Tooltip, App, Empty, Avatar, Switch, Tag,
} from 'antd'
import {
  PlusOutlined, DeleteOutlined, LockOutlined, BranchesOutlined,
  RobotOutlined, BellOutlined, MessageOutlined, AimOutlined,
  FlagOutlined, ClockCircleOutlined,
} from '@ant-design/icons'

import {
  HANDOFF_TYPES, HANDOFF_AGENT_ACTIONS, HANDOFF_SEVERITIES, HANDOFF_RESPONSE_OPTIONS,
} from '../../../../mock/gradingAndHandoff'
import { store } from '../../../../mock/store'

const SEVERITY_MAP = Object.fromEntries(HANDOFF_SEVERITIES.map((s) => [s.value, s]))

export default function HandoffTab({ agent, onChange }) {
  const { message, modal } = App.useApp()
  const contacts = useMemo(() => store.getContacts(), [])
  const contactMap = useMemo(() => Object.fromEntries(contacts.map((c) => [c.id, c])), [contacts])

  const triggers = agent.handoff_config?.triggers || []
  const enabledCount = triggers.filter((r) => r.enabled).length

  const [selectedId, setSelectedId] = useState(null)
  const newRuleRef = useRef(null)

  useEffect(() => {
    if (newRuleRef.current) {
      newRuleRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      newRuleRef.current = null
    }
  }, [triggers.length])

  const updateTriggers = (next) => {
    onChange({ ...agent, handoff_config: { ...(agent.handoff_config || {}), triggers: next } })
  }

  // ---------- 新增规则：插入顶部，所有字段为空 ----------
  const handleAdd = () => {
    const newRule = {
      id: `hr-new-${Date.now().toString(36)}`,
      type: undefined,
      text_value: '',
      agent_action: undefined,
      notify: [],
      severity: undefined,
      response_minutes: undefined,
      hit_count: 0,
      enabled: true,
      _isNew: true,
    }
    updateTriggers([newRule, ...triggers])
    setSelectedId(newRule.id)
    setTimeout(() => message.success('已创建空白规则，请补全各项配置'), 0)
  }

  const handleDelete = (id) => {
    const rule = triggers.find((r) => r.id === id)
    if (rule?.locked) {
      message.warning('该规则为系统保留规则，不可删除')
      return
    }
    modal.confirm({
      title: '删除转人工规则？',
      content: '删除后该规则不再触发。在途会话已触发的转人工流程不受影响。',
      okText: '确认删除',
      okButtonProps: { danger: true },
      onOk: () => {
        updateTriggers(triggers.filter((r) => r.id !== id))
        if (selectedId === id) setSelectedId(null)
        message.success('已删除')
      },
    })
  }

  const handleChange = (id, patch) => {
    updateTriggers(triggers.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const handleSubChange = (id, key, val) => {
    updateTriggers(
      triggers.map((r) => (r.id === id ? { ...r, sub_values: { ...(r.sub_values || {}), [key]: val } } : r)),
    )
  }

  // 紧急程度变化时，自动带出推荐响应时限（仍可手改）
  const handleSeverityChange = (id, val) => {
    const meta = SEVERITY_MAP[val]
    handleChange(id, { severity: val, response_minutes: meta?.default_minutes })
  }

  // ---------- 渲染单条规则（向「得分项指标」卡片靠齐） ----------
  const renderRule = (rule, idx) => {
    const typeMeta = rule.type ? HANDOFF_TYPES.find((t) => t.value === rule.type) : null
    const severity = SEVERITY_MAP[rule.severity]
    const isSelected = selectedId === rule.id
    const hasSubFields = typeMeta?.sub_fields && typeMeta.sub_fields.length > 0
    const hasFreeText = typeMeta?.has_text_field

    return (
      <div
        key={rule.id}
        ref={rule._isNew ? newRuleRef : null}
        className={[
          'gb-handoff-card',
          !rule.enabled ? 'is-disabled' : '',
          isSelected ? 'is-selected' : '',
        ].filter(Boolean).join(' ')}
        onClick={() => setSelectedId(rule.id)}
      >
        {/* Header：序号 + 规则名（强调，不置灰）+ 紧急 chip + 命中次数 + 开关 + 删除 */}
        <div className="gb-handoff-card-head">
          <span className="gb-handoff-card-no">规则{idx + 1}</span>
          <span className="gb-handoff-card-title">
            {typeMeta ? typeMeta.label : <span className="gb-handoff-card-title-empty">未选择规则类型</span>}
          </span>
          {severity && (
            <span
              className="gb-handoff-sev-chip"
              style={{ color: severity.color, background: severity.bg, borderColor: severity.color }}
            >
              {severity.label}
            </span>
          )}
          {rule.locked && (
            <Tooltip title="系统保留规则，类型不可改、不可删除">
              <LockOutlined style={{ color: 'var(--gb-text-muted)' }} />
            </Tooltip>
          )}

          <div className="gb-handoff-card-head-right">
            <Tooltip title="本规则历史命中次数（近 30 天）">
              <span className="gb-handoff-hit">
                <AimOutlined style={{ marginRight: 4 }} />
                命中 <strong>{rule.hit_count ?? 0}</strong> 次
              </span>
            </Tooltip>
            <Tooltip title={rule.enabled ? '点击停用' : '点击启用'}>
              <Switch size="small" checked={rule.enabled} onChange={(c) => handleChange(rule.id, { enabled: c })} />
            </Tooltip>
            <Tooltip title={rule.locked ? '不可删除' : '删除'}>
              <Button
                type="text" size="small" danger icon={<DeleteOutlined />}
                disabled={rule.locked}
                onClick={(e) => { e.stopPropagation(); handleDelete(rule.id) }}
              />
            </Tooltip>
          </div>
        </div>

        {/* 配置区：label-control 行 */}
        <div className="gb-handoff-card-body">
          {/* 命中条件 */}
          <div className="gb-handoff-field">
            <div className="gb-handoff-field-label"><BranchesOutlined /> 命中条件</div>
            <div className="gb-handoff-field-control">
              <Select
                value={rule.type}
                disabled={rule.locked}
                placeholder="请选择规则类型"
                onChange={(v) => {
                  const newTypeMeta = HANDOFF_TYPES.find((t) => t.value === v)
                  const newSubValues = {}
                  newTypeMeta?.sub_fields?.forEach((f) => { newSubValues[f.key] = f.default })
                  handleChange(rule.id, {
                    type: v,
                    text_value: newTypeMeta?.has_text_field ? (rule.text_value || '') : undefined,
                    sub_values: newSubValues,
                  })
                }}
                style={{ width: 240 }}
                options={HANDOFF_TYPES.map((t) => ({ value: t.value, label: t.label, title: t.label }))}
              />
              {hasSubFields && (
                <div className="gb-handoff-subfields">
                  {typeMeta.sub_fields.map((f) => (
                    <div key={f.key} className="gb-handoff-subfield">
                      <span className="gb-handoff-subfield-label">{f.label}</span>
                      {f.type === 'number' && (
                        <>
                          <InputNumber
                            min={1}
                            value={rule.sub_values?.[f.key] ?? f.default}
                            onChange={(v) => handleSubChange(rule.id, f.key, v)}
                            style={{ width: 96 }}
                          />
                          <span style={{ color: 'var(--gb-text-muted)' }}>{f.unit}</span>
                        </>
                      )}
                      {f.type === 'enum' && (
                        <Select
                          value={rule.sub_values?.[f.key] ?? f.default}
                          onChange={(v) => handleSubChange(rule.id, f.key, v)}
                          options={f.options}
                          style={{ width: 170 }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 描述（仅自由描述类型） */}
          {hasFreeText && (
            <div className="gb-handoff-field gb-handoff-field-block">
              <div className="gb-handoff-field-label"><MessageOutlined /> 描述</div>
              <div className="gb-handoff-field-control">
                <Input.TextArea
                  rows={2}
                  maxLength={500}
                  showCount
                  placeholder={typeMeta?.text_placeholder || '通过自然语言描述对话状态或命中节点'}
                  value={rule.text_value || ''}
                  onChange={(e) => handleChange(rule.id, { text_value: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* 紧急程度 + 响应时限（组合，便于看板预警） */}
          <div className="gb-handoff-field">
            <div className="gb-handoff-field-label"><FlagOutlined /> 紧急程度</div>
            <div className="gb-handoff-field-control">
              <Select
                value={rule.severity}
                placeholder="高 / 中 / 低"
                onChange={(v) => handleSeverityChange(rule.id, v)}
                style={{ width: 160 }}
                options={HANDOFF_SEVERITIES.map((s) => ({
                  value: s.value,
                  title: s.label,
                  label: (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                      {s.label}
                      <span style={{ fontSize: 11, color: 'var(--gb-text-muted)' }}>· {s.desc}</span>
                    </span>
                  ),
                }))}
                optionLabelProp="title"
              />
              <span className="gb-handoff-field-sep">
                <ClockCircleOutlined style={{ marginRight: 4, color: 'var(--gb-text-muted)' }} />
                响应时限
              </span>
              <Select
                value={rule.response_minutes}
                placeholder="选择响应时限"
                onChange={(v) => handleChange(rule.id, { response_minutes: v })}
                style={{ width: 150 }}
                options={HANDOFF_RESPONSE_OPTIONS}
              />
              {rule.severity && rule.response_minutes != null && (
                <span className="gb-handoff-sla-hint">
                  超时未响应将在看板预警
                </span>
              )}
            </div>
          </div>

          {/* Agent 动作 */}
          <div className="gb-handoff-field">
            <div className="gb-handoff-field-label"><RobotOutlined /> Agent 动作</div>
            <div className="gb-handoff-field-control">
              <Select
                value={rule.agent_action}
                placeholder="选择 Agent 命中后的动作"
                onChange={(v) => handleChange(rule.id, { agent_action: v })}
                style={{ width: 280 }}
                options={HANDOFF_AGENT_ACTIONS.map((a) => ({
                  value: a.value,
                  label: (
                    <div>
                      <div style={{ fontWeight: 500 }}>{a.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--gb-text-muted)' }}>{a.desc}</div>
                    </div>
                  ),
                  title: a.label,
                }))}
                optionLabelProp="title"
              />
            </div>
          </div>

          {/* 通知人工 */}
          <div className="gb-handoff-field gb-handoff-field-block">
            <div className="gb-handoff-field-label"><BellOutlined /> 通知人工</div>
            <div className="gb-handoff-field-control">
              <Select
                mode="multiple"
                value={rule.notify}
                onChange={(v) => handleChange(rule.id, { notify: v })}
                placeholder="选择需要通知的人员（命中后向其推送 WebPush + IM）"
                maxTagCount="responsive"
                style={{ width: '100%' }}
                options={contacts.map((c) => ({
                  value: c.id,
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar size={18} style={{ background: '#1A4D8F', fontSize: 10 }}>{c.avatar}</Avatar>
                      <div>
                        <div>{c.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--gb-text-muted)' }}>{c.role}</div>
                      </div>
                    </div>
                  ),
                  title: c.name,
                }))}
                optionLabelProp="title"
                tagRender={(props) => {
                  const c = contactMap[props.value]
                  return (
                    <Tag
                      closable={props.closable}
                      onClose={props.onClose}
                      style={{
                        marginInlineEnd: 4, display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: 'white', borderColor: 'var(--gb-border)', padding: '1px 6px 1px 2px',
                      }}
                    >
                      <Avatar size={16} style={{ background: '#1A4D8F', fontSize: 9 }}>{c?.avatar || '?'}</Avatar>
                      <span>{c?.name || props.value}</span>
                    </Tag>
                  )
                }}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <section className="gb-agent-section">
      <div className="gb-agent-section-head">
        <h3 className="gb-agent-section-title">
          <span className="gb-section-bar" />
          转人工
          <span style={{ marginLeft: 12, fontSize: 13, color: 'var(--gb-text-muted)', fontWeight: 400 }}>
            生效规则：<strong style={{ color: 'var(--gb-text-primary)' }}>{enabledCount}</strong>
          </span>
        </h3>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增规则</Button>
      </div>
      <div className="gb-agent-section-body">
        {triggers.length === 0 ? (
          <Empty description={<span>尚无触发规则，<a onClick={handleAdd}>立即新建一条</a></span>} />
        ) : (
          <div className="gb-handoff-cards">
            {triggers.map(renderRule)}
          </div>
        )}
        <div className="gb-handoff-foot">
          <BranchesOutlined />
          规则按顺序自上而下匹配，命中第一条立即触发。带 <LockOutlined /> 标识为系统保留兜底规则。
        </div>
      </div>
    </section>
  )
}
