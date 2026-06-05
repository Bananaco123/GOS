import { useState, useMemo, useRef } from 'react'
import {
  InputNumber, Button, Drawer, Form, Input, Select, AutoComplete, App, Space, Tooltip, Empty, Modal,
  Alert,
} from 'antd'
import {
  PlusOutlined, DeleteOutlined, ExclamationCircleFilled, EditOutlined,
  CheckCircleFilled, MinusCircleFilled, CloseCircleFilled,
  QuestionCircleOutlined, HolderOutlined,
} from '@ant-design/icons'

import { validateThresholds } from '../../../../mock/gradingAndHandoff'

// ============================================================
// 指标类型 + 预设三档标准模板
//   - 切换指标类型时，三档标准联动重置为该类型预设的第一项
//   - 三档标准支持下拉预设 + 自由输入（AutoComplete）
// ============================================================
const SOURCE_STANDARDS = {
  're-stage': {
    label: '项目进度',
    full: ['已经封顶', '主体施工完成', '进入装修阶段'],
    pass: ['已经立项', '设计图已确认', '签约阶段'],
    fail: ['仅在咨询', '尚未立项', '无法收集'],
  },
  're-floorplan': {
    label: '设计图情况',
    full: ['专业 CAD 设计图', '完整 3D 方案', '建筑师签字平面图'],
    pass: ['手绘平面图', '视频 / 照片', '简单草图'],
    fail: ['无法收集', '客户拒绝提供'],
  },
  're-budget': {
    label: '预算明确度',
    full: ['给出明确预算区间', '给出单点金额'],
    pass: ['模糊预算', '仅说有预算'],
    fail: ['完全未提及', '客户拒绝沟通预算'],
  },
  're-identity': {
    label: '客户身份',
    full: ['Builder / 总包', '设计师 / 设计公司', '业主直选'],
    pass: ['中介 / 代理', '设计公司员工'],
    fail: ['身份不明', '拒绝回答'],
  },
  're-items': {
    label: '需求清单明确度',
    full: ['明确列出产品 / 数量 / 规格', '提供详细 BOM'],
    pass: ['能说出主要品类', '描述功能需求'],
    fail: ['仅说"先看看"', '需求模糊'],
  },
  're-timeline': {
    label: '开工时间',
    full: ['90 天内开工', '已确定开工日期'],
    pass: ['半年内开工', '今年内开工'],
    fail: ['一年以上未定', '开工时间未定'],
  },
  're-country': {
    label: '目标市场匹配度',
    full: ['北美 / 中东 / 东南亚（重点市场）'],
    pass: ['欧洲 / 大洋洲'],
    fail: ['非重点市场', '未确定目标市场'],
  },
  're-custom': {
    label: '自定义',
    full: [],
    pass: [],
    fail: [],
  },
}

const SOURCE_OPTIONS = Object.entries(SOURCE_STANDARDS).map(([value, v]) => ({
  value, label: v.label,
}))

const DEFAULT_TIER_COLORS = ['#D32F2F', '#E59B26', '#2E7BD6', '#10A86A', '#7C3AED', '#0E7C7B', '#5E81AC']

function getStandardsForSource(source) {
  const preset = SOURCE_STANDARDS[source] || SOURCE_STANDARDS['re-custom']
  return {
    full_score_standard: preset.full[0] || '',
    pass_score_standard: preset.pass[0] || '',
    fail_score_standard: preset.fail[0] || '',
  }
}

export default function GradingTab({ agent, onChange }) {
  const { message, modal } = App.useApp()
  const [editingElement, setEditingElement] = useState(null)
  const [form] = Form.useForm()

  const [addTierOpen, setAddTierOpen] = useState(false)
  const [tierForm] = Form.useForm()

  const grading = agent.grading_config || { enabled: true, elements: [], thresholds: [] }
  const elements = grading.elements || []
  const thresholds = grading.thresholds || []

  const thresholdCheck = useMemo(() => validateThresholds(thresholds), [thresholds])

  // 已被其它指标占用的类型（自定义 re-custom 永远可重复选）
  const usedSources = useMemo(
    () => elements.map((e) => e.source).filter((s) => s && s !== 're-custom'),
    [elements],
  )

  // 为某一行生成可选项：已被别处占用的类型置灰禁用（自身当前值 / 自定义 不禁用）
  const optionsForRow = (currentSource) =>
    SOURCE_OPTIONS.map((o) => ({
      ...o,
      disabled: o.value !== 're-custom' && o.value !== currentSource && usedSources.includes(o.value),
    }))

  const totalWeight = useMemo(
    () => elements.reduce((sum, e) => sum + (Number(e.weight) || 0), 0),
    [elements],
  )
  const weightOk = totalWeight === 100

  // ---------- 阈值修改 ----------
  const handleThresholdChange = (idx, key, val) => {
    const next = thresholds.map((t, i) => (i === idx ? { ...t, [key]: val } : t))
    onChange({ ...agent, grading_config: { ...grading, thresholds: next } })
  }

  const handleDeleteTier = (idx) => {
    if (thresholds.length <= 1) {
      message.warning('至少保留 1 个评价等级')
      return
    }
    modal.confirm({
      title: `删除「${thresholds[idx].label}」？`,
      content: '删除后历史评级数据保留，新分数将按剩余阈值映射。',
      okText: '确认删除',
      okButtonProps: { danger: true },
      onOk: () => {
        const next = thresholds.filter((_, i) => i !== idx)
        onChange({ ...agent, grading_config: { ...grading, thresholds: next } })
      },
    })
  }

  const handleConfirmAddTier = async () => {
    const values = await tierForm.validateFields()
    // 徽标颜色不再让用户填写，按新增顺序自动取预设色
    const newTier = {
      level: values.level,
      label: values.label,
      min: values.min,
      max: values.max,
      color: DEFAULT_TIER_COLORS[thresholds.length % DEFAULT_TIER_COLORS.length],
      desc: '',
    }
    onChange({
      ...agent,
      grading_config: { ...grading, thresholds: [...thresholds, newTier] },
    })
    setAddTierOpen(false)
    tierForm.resetFields()
    message.success(`已新增等级「${values.label}」`)
  }

  // ---------- 要素增删改 ----------
  const handleWeightChange = (id, weight) => {
    const next = elements.map((e) => (e.id === id ? { ...e, weight } : e))
    onChange({ ...agent, grading_config: { ...grading, elements: next } })
  }

  const handleDelete = (id) => {
    modal.confirm({
      title: '删除评级要素？',
      content: '删除后该要素不再参与本 Agent 的评分。已发布版本的历史评级数据保留。',
      okText: '确认删除',
      okButtonProps: { danger: true },
      onOk: () => {
        const next = elements.filter((e) => e.id !== id)
        onChange({ ...agent, grading_config: { ...grading, elements: next } })
        message.success('已删除')
      },
    })
  }

  const handleAdd = () => {
    const id = `ge-new-${Date.now().toString(36)}`
    const newElement = {
      id, name: '新建指标', desc: '',
      weight: 0, source: 're-custom', enabled: true,
      full_score_standard: '', pass_score_standard: '', fail_score_standard: '',
      hit_score: 100, miss_score: 0,
    }
    onChange({ ...agent, grading_config: { ...grading, elements: [...elements, newElement] } })
    setEditingElement(newElement)
    form.setFieldsValue(newElement)
  }

  // 当前在 Drawer 里选中的 source（用于联动三档标准的下拉预设）
  const [editingSource, setEditingSource] = useState(null)
  const drawerStandards = SOURCE_STANDARDS[editingSource] || SOURCE_STANDARDS['re-custom']

  const openEdit = (element) => {
    setEditingElement(element)
    setEditingSource(element.source)
    form.setFieldsValue(element)
  }

  const handleSaveEdit = async () => {
    const values = await form.validateFields()
    const next = elements.map((e) => (e.id === editingElement.id ? { ...e, ...values } : e))
    onChange({ ...agent, grading_config: { ...grading, elements: next } })
    setEditingElement(null)
    setEditingSource(null)
    message.success('指标已保存')
  }

  // Drawer 里切换 source → 联动重置三档标准 + 同步 name
  const handleDrawerSourceChange = (v) => {
    const opt = SOURCE_OPTIONS.find((o) => o.value === v)
    const preset = getStandardsForSource(v)
    setEditingSource(v)
    form.setFieldsValue({
      source: v,
      name: opt?.label,
      ...preset,
    })
    message.info(`已切换为「${opt?.label}」，三档标准重置为该类型预设值`)
  }

  // ---------- 拖拽排序 ----------
  const dragSrcIdx = useRef(null)
  const [dragOverIdx, setDragOverIdx] = useState(null)

  const handleDragStart = (idx) => (e) => {
    dragSrcIdx.current = idx
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (idx) => (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverIdx !== idx) setDragOverIdx(idx)
  }

  const handleDragLeave = () => {
    setDragOverIdx(null)
  }

  const handleDrop = (toIdx) => (e) => {
    e.preventDefault()
    const fromIdx = dragSrcIdx.current
    setDragOverIdx(null)
    dragSrcIdx.current = null
    if (fromIdx == null || fromIdx === toIdx) return
    const next = [...elements]
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)
    onChange({ ...agent, grading_config: { ...grading, elements: next } })
  }

  return (
    <>
      {/* ============================================================
          评价体系（A/B/C/D 档位阈值 · 截图 2 样式）
          ============================================================ */}
      <section className="gb-agent-section">
        <div className="gb-agent-section-head">
          <h3 className="gb-agent-section-title">
            <span className="gb-section-bar" />
            评价体系
            <Tooltip title="待定">
              <QuestionCircleOutlined
                style={{ marginLeft: 8, color: 'var(--gb-text-muted)', cursor: 'help', fontSize: 14 }}
              />
            </Tooltip>
          </h3>
        </div>
        <div className="gb-agent-section-body">
          <div className="gb-grading-thresholds">
            {thresholds.map((t, idx) => (
              <div key={t.level + idx} className="gb-grading-threshold-pill">
                <span
                  className="gb-grading-threshold-tag"
                  style={{ background: t.color }}
                >
                  {t.label}
                </span>
                <div className="gb-grading-threshold-range">
                  <InputNumber
                    min={0} max={100}
                    value={t.min}
                    onChange={(v) => handleThresholdChange(idx, 'min', v)}
                    placeholder="分值"
                    size="middle"
                    variant="borderless"
                  />
                  <span className="gb-grading-threshold-dash">-</span>
                  <InputNumber
                    min={0} max={100}
                    value={t.max}
                    onChange={(v) => handleThresholdChange(idx, 'max', v)}
                    placeholder="分值"
                    size="middle"
                    variant="borderless"
                  />
                </div>
                <Tooltip title={`删除 ${t.label}`}>
                  <button
                    type="button"
                    className="gb-grading-threshold-remove"
                    onClick={() => handleDeleteTier(idx)}
                    aria-label={`删除 ${t.label}`}
                  >
                    ×
                  </button>
                </Tooltip>
              </div>
            ))}
            <Tooltip title="新增评价等级">
              <button
                type="button"
                className="gb-grading-threshold-add"
                onClick={() => {
                  tierForm.resetFields()
                  const nextIdx = thresholds.length
                  tierForm.setFieldsValue({
                    level: String.fromCharCode(65 + nextIdx),
                    label: `${String.fromCharCode(65 + nextIdx)} 级`,
                  })
                  setAddTierOpen(true)
                }}
              >
                <PlusOutlined />
              </button>
            </Tooltip>
          </div>

          {/* 档位校验提示：仅在不合法时标红，明确指出未覆盖 / 重叠 / 缺档 */}
          {!thresholdCheck.ok && (
            <Alert
              type="error"
              showIcon
              style={{ marginTop: 16 }}
              message="评级档位配置不合法，发布前需修正"
              description={
                <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                  {thresholdCheck.errors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              }
            />
          )}
        </div>
      </section>

      {/* ============================================================
          得分项指标（拖拽 + 满分/及格/不得分标准）
          ============================================================ */}
      <section className="gb-agent-section">
        <div className="gb-agent-section-head">
          <h3 className="gb-agent-section-title">
            <span className="gb-section-bar" />
            得分项指标
            <Tooltip title="待定">
              <QuestionCircleOutlined
                style={{ marginLeft: 8, color: 'var(--gb-text-muted)', cursor: 'help', fontSize: 14 }}
              />
            </Tooltip>
          </h3>
          <Space>
            {!weightOk && (
              <span className="gb-weight-warning">
                <ExclamationCircleFilled style={{ marginRight: 4 }} />
                所有比值相加需为 100%（当前 {totalWeight}%）
              </span>
            )}
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增指标</Button>
          </Space>
        </div>
        <div className="gb-agent-section-body">
          {elements.length === 0 ? (
            <Empty description="尚无评级指标，点击右上角「新增指标」开始" />
          ) : (
            <div className="gb-grading-elements">
              {elements.map((el, idx) => (
                <div
                  key={el.id}
                  className={`gb-grading-element-card ${dragOverIdx === idx ? 'is-drag-over' : ''}`}
                  draggable
                  onDragStart={handleDragStart(idx)}
                  onDragOver={handleDragOver(idx)}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop(idx)}
                  title="按住拖拽以排序"
                >
                  <div className="gb-grading-element-head">
                    <div className="gb-grading-element-drag">
                      <HolderOutlined />
                    </div>
                    <div className="gb-grading-element-index">指标{idx + 1}</div>

                    <div className="gb-grading-element-name-block">
                      <Select
                        value={el.source}
                        onChange={(v) => {
                          const opt = SOURCE_OPTIONS.find((o) => o.value === v)
                          const presetStandards = getStandardsForSource(v)
                          const next = elements.map((e) =>
                            e.id === el.id
                              ? { ...e, source: v, name: opt?.label || e.name, ...presetStandards }
                              : e,
                          )
                          onChange({ ...agent, grading_config: { ...grading, elements: next } })
                          message.info(`已切换为「${opt?.label}」，三档标准重置为该类型预设值`)
                        }}
                        options={optionsForRow(el.source)}
                        style={{ width: 200 }}
                      />
                    </div>

                    <div className="gb-grading-element-weight">
                      <span className="gb-grading-element-weight-label">权重</span>
                      <InputNumber
                        min={0} max={100}
                        value={el.weight}
                        onChange={(v) => handleWeightChange(el.id, v)}
                        style={{ width: 110 }}
                        suffix="%"
                      />
                    </div>

                    <div className="gb-grading-element-actions">
                      <Tooltip title="编辑评分标准">
                        <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(el)} />
                      </Tooltip>
                      <Tooltip title="删除">
                        <Button type="text" icon={<DeleteOutlined />} danger onClick={() => handleDelete(el.id)} />
                      </Tooltip>
                    </div>
                  </div>

                  {/* 子项：满分/及格/不得分标准 */}
                  <div className="gb-grading-element-standards">
                    <div className="gb-grading-standard-row">
                      <CheckCircleFilled className="gb-grading-standard-icon" style={{ color: 'var(--gb-success)' }} />
                      <span className="gb-grading-standard-label">满分标准：</span>
                      <span className="gb-grading-standard-value">{el.full_score_standard || <em>未填写</em>}</span>
                    </div>
                    <div className="gb-grading-standard-row">
                      <MinusCircleFilled className="gb-grading-standard-icon" style={{ color: 'var(--gb-warning)' }} />
                      <span className="gb-grading-standard-label">及格标准：</span>
                      <span className="gb-grading-standard-value">{el.pass_score_standard || <em>未填写</em>}</span>
                    </div>
                    <div className="gb-grading-standard-row">
                      <CloseCircleFilled className="gb-grading-standard-icon" style={{ color: 'var(--gb-danger)' }} />
                      <span className="gb-grading-standard-label">不得分标准：</span>
                      <span className="gb-grading-standard-value">{el.fail_score_standard || <em>未填写</em>}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============================================================
          编辑评分标准 · 侧边栏
          ============================================================ */}
      <Drawer
        title={`编辑评级指标：${editingElement?.name || ''}`}
        open={!!editingElement}
        onClose={() => { setEditingElement(null); setEditingSource(null) }}
        size={520}
        extra={
          <Space>
            <Button onClick={() => { setEditingElement(null); setEditingSource(null) }}>取消</Button>
            <Button type="primary" onClick={handleSaveEdit}>保存</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="source"
            label="指标类型"
            tooltip="切换指标类型时，三档标准会自动重置为该类型的预设值"
            rules={[{ required: true, message: '必选' }]}
          >
            <Select options={optionsForRow(editingElement?.source)} onChange={handleDrawerSourceChange} />
          </Form.Item>
          <Form.Item name="name" label="指标名称（管理后台展示用）" rules={[{ required: true, message: '必填' }]}>
            <Input maxLength={32} />
          </Form.Item>
          <Form.Item name="desc" label="指标说明">
            <Input.TextArea rows={2} maxLength={120} showCount placeholder="一句话说明该指标在评级中的角色" />
          </Form.Item>
          <Form.Item name="weight" label="权重（%）" rules={[{ required: true }]}>
            <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0-100" />
          </Form.Item>

          <Alert
            type="info"
            showIcon
            style={{ marginTop: 8, marginBottom: 12 }}
            message="评分标准与指标类型绑定"
            description="下拉提供该指标的预设标准（可直接选用），也支持手动输入自定义标准。"
          />

          <Form.Item
            name="full_score_standard"
            label={<span><CheckCircleFilled style={{ color: 'var(--gb-success)', marginRight: 4 }} />满分标准（命中得 100% 权重分）</span>}
          >
            <AutoComplete
              options={drawerStandards.full.map((s) => ({ value: s }))}
              placeholder="选择预设 或 自由输入"
              allowClear
            >
              <Input.TextArea rows={2} maxLength={200} />
            </AutoComplete>
          </Form.Item>

          <Form.Item
            name="pass_score_standard"
            label={<span><MinusCircleFilled style={{ color: 'var(--gb-warning)', marginRight: 4 }} />及格标准（命中得 60% 权重分）</span>}
          >
            <AutoComplete
              options={drawerStandards.pass.map((s) => ({ value: s }))}
              placeholder="选择预设 或 自由输入"
              allowClear
            >
              <Input.TextArea rows={2} maxLength={200} />
            </AutoComplete>
          </Form.Item>

          <Form.Item
            name="fail_score_standard"
            label={<span><CloseCircleFilled style={{ color: 'var(--gb-danger)', marginRight: 4 }} />不得分标准（命中得 0 分）</span>}
          >
            <AutoComplete
              options={drawerStandards.fail.map((s) => ({ value: s }))}
              placeholder="选择预设 或 自由输入"
              allowClear
            >
              <Input.TextArea rows={2} maxLength={200} />
            </AutoComplete>
          </Form.Item>
        </Form>
      </Drawer>

      {/* ============================================================
          新增评价等级 Modal
          ============================================================ */}
      <Modal
        title="新增评价等级"
        open={addTierOpen}
        onCancel={() => { setAddTierOpen(false); tierForm.resetFields() }}
        onOk={handleConfirmAddTier}
        okText="确认添加"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={tierForm} layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
            <Form.Item
              name="level"
              label="等级代号"
              rules={[{ required: true, message: '必填' }, { max: 4, message: '不超过 4 字符' }]}
              tooltip="单字符代号，如 A / B / S / SS"
            >
              <Input maxLength={4} placeholder="A" />
            </Form.Item>
            <Form.Item
              name="label"
              label="等级名称"
              rules={[{ required: true, message: '必填' }]}
            >
              <Input maxLength={16} placeholder="A 级 / VIP 级" />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item
              name="min"
              label="最低分（含）"
              rules={[{ required: true, message: '必填' }]}
            >
              <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0-100" />
            </Form.Item>
            <Form.Item
              name="max"
              label="最高分（含）"
              rules={[{ required: true, message: '必填' }]}
            >
              <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0-100" />
            </Form.Item>
          </div>
          <div style={{ fontSize: 12, color: 'var(--gb-text-muted)' }}>
            提示：等级阈值区间不可与已有等级重叠；保存后可在评价体系胶囊上直接微调分数。
          </div>
        </Form>
      </Modal>
    </>
  )
}
