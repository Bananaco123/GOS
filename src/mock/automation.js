/**
 * 自动化任务 Mock 注册表（v9 · 接待策略「客户唤醒机制」升级为「自动化任务」）
 *
 * - 一条自动化任务 = 事件类型（目前仅"唤醒客户"）+ 复合触发条件（AND）+ 激活话术 + 任务目标
 * - 条件属性目录尽量复用接待要素 / 评级维度的现有枚举（见 receptionAndIntent.js / gradingAndHandoff.js）
 * - 纯配置层：演示不做真实运行期判定
 */

// 未回复时长预设（分钟）
export const NO_REPLY_OPTIONS = [
  { value: 60, label: '1 小时' },
  { value: 240, label: '4 小时' },
  { value: 720, label: '12 小时' },
  { value: 1440, label: '24 小时' },
  { value: 2880, label: '48 小时' },
  { value: 4320, label: '72 小时' },
  { value: 10080, label: '7 天' },
]

// 自动化事件类型（当前仅一种，为将来扩展留位）
export const AUTOMATION_EVENT_TYPES = [
  { id: 'wakeup_customer', name: '唤醒客户', desc: '客户停滞 / 沉默时，按条件自动推进唤醒' },
]
export const eventTypeName = (id) => AUTOMATION_EVENT_TYPES.find((e) => e.id === id)?.name || id

// 预置人群包（地域 + 特征的命名组合）
export const AUDIENCE_PACKAGES = [
  { id: 'ap-na-high-builder', name: '北美 · 高客单 Builder', desc: '北美 + 高客单 + Builder 身份' },
  { id: 'ap-sea-fullcase-owner', name: '东南亚 · 全案业主', desc: '东南亚 + 全案 + 业主' },
  { id: 'ap-mea-designer', name: '中东 · 设计师客户', desc: '中东 + 设计师 + 有专业图纸' },
  { id: 'ap-na-dormant', name: '北美 · 沉睡高意向', desc: '北美 + 评级 A/B + 30 天未互动' },
]

// ============================================================
// 触发条件属性目录（分组）
//   valueType: 'minutes'(数值预设·≥) | 'enum'(枚举·多选=属于)
// ============================================================
export const CONDITION_ATTR_GROUPS = [
  {
    group: '互动状态',
    attrs: [
      { id: 'no_reply', name: '未回复时长', valueType: 'minutes' },
      { id: 'stage', name: '上次会话阶段', valueType: 'enum', options: ['询盘', '设计', '报价', '议价', '成交'] },
      { id: 'info_level', name: '信息收集程度', valueType: 'enum', options: ['未开始', '部分收集', '充分收集'] },
      { id: 'read_status', name: '最后消息阅读状态', valueType: 'enum', options: ['已读未回', '未读'] },
      { id: 'deferred', name: '待补充信息承诺', valueType: 'enum', options: ['无', '设计图待补', '项目细节待补', '已约定时间'] },
    ],
  },
  {
    group: '客户属性',
    attrs: [
      { id: 'scale', name: '需求规模', valueType: 'enum', options: ['专项小项目', '全案'] },
      { id: 'project_type', name: '项目类型', valueType: 'enum', options: ['住宅', '别墅', '商业', '工程'] },
      { id: 'identity', name: '客户身份', valueType: 'enum', options: ['业主', 'Builder', '设计师', '中介'] },
      { id: 'budget_tier', name: '客单层级', valueType: 'enum', options: ['高客单', '中低客单'] },
      { id: 'grade', name: '评级档位', valueType: 'enum', options: ['A', 'B', 'C', 'D'] },
      { id: 'design_doc', name: '设计图情况', valueType: 'enum', options: ['专业图纸', '手绘/简图', '无'] },
    ],
  },
  {
    group: '地域 / 人群',
    attrs: [
      { id: 'region', name: '地区', valueType: 'enum', options: ['北美', '中东', '东南亚', '欧洲', '其他'] },
      { id: 'audience', name: '人群包', valueType: 'enum', options: AUDIENCE_PACKAGES.map((p) => p.name) },
    ],
  },
]

export const WAKEUP_CONDITION_ATTRIBUTES = CONDITION_ATTR_GROUPS.flatMap(
  (g) => g.attrs.map((a) => ({ ...a, group: g.group })),
)
const ATTR_MAP = Object.fromEntries(WAKEUP_CONDITION_ATTRIBUTES.map((a) => [a.id, a]))
export const getAttr = (id) => ATTR_MAP[id]

// AntD Select 分组选项（属性选择器用）
export const CONDITION_SELECT_OPTIONS = CONDITION_ATTR_GROUPS.map((g) => ({
  label: g.group,
  options: g.attrs.map((a) => ({ value: a.id, label: a.name })),
}))

// 某属性的默认运算符 + 值
export const conditionDefaults = (attrId) => {
  const a = getAttr(attrId)
  if (a?.valueType === 'minutes') return { op: 'gte', value: 1440 }
  return { op: 'in', value: [] }
}

let _cid = 0
export const newConditionId = () => `cond-${Date.now().toString(36)}-${_cid++}`
export const defaultCondition = () => ({ id: newConditionId(), attr: 'no_reply', ...conditionDefaults('no_reply') })
export const opLabel = (attrId) => (getAttr(attrId)?.valueType === 'minutes' ? '≥' : '属于')

// 条件 → 人类可读摘要
export const conditionText = (c) => {
  const a = getAttr(c.attr)
  if (!a) return ''
  if (a.valueType === 'minutes') {
    const o = NO_REPLY_OPTIONS.find((x) => x.value === c.value)
    return `${a.name} ≥ ${o?.label || c.value}`
  }
  const vals = Array.isArray(c.value) ? c.value : [c.value].filter(Boolean)
  return `${a.name} 属于 {${vals.join('、') || '…'}}`
}

// ============================================================
// 激活话术：模板变量 + 可插入附件 + 快捷 emoji
// ============================================================
export const TEMPLATE_VARIABLES = [
  { key: 'customer_name', label: '客户名字', sample: 'Kanchan' },
  { key: 'country', label: '国家 / 地区', sample: 'Canada' },
  { key: 'project_type', label: '项目类型', sample: 'Whole-house' },
  { key: 'stage', label: '项目阶段', sample: 'Quotation' },
  { key: 'budget', label: '预算区间', sample: 'USD 20k+' },
  { key: 'product_type', label: '产品类型', sample: 'kitchen' },
  { key: 'agent_name', label: 'AI 称谓', sample: 'Sales Assistant' },
  { key: 'brand', label: '品牌名', sample: 'OK Group' },
]

export const SCRIPT_ATTACHMENTS = ['产品图册', '最新报价单', '成功案例', '安装指南']
export const QUICK_EMOJIS = ['👋', '😊', '🎉', '🏠', '✨', '📐', '💡', '🙌', '📦', '🔥']
