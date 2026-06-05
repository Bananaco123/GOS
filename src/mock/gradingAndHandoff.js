/**
 * 线索评级 & 转人工规则 Mock 数据
 *
 * v5 修订：
 *   - 评级要素扩展「满分/及格/不得分标准」字段（按截图 2 样式）
 *   - 转人工触发器列表化，新增「类型」与二级字段
 */

// ============================================================
// 线索评级
// ============================================================

export const GRADING_ELEMENTS = [
  {
    id: 'ge-project-progress',
    name: '项目进度',
    desc: '客户项目目前所处的阶段（决定意向紧迫度）',
    weight: 20,
    source: 're-stage',
    enabled: true,
    full_score_standard: '已经封顶 / 进入装修阶段',
    pass_score_standard: '已经立项 / 设计图确认',
    fail_score_standard: '无法收集 / 仅在咨询',
    hit_score: 100,
    miss_score: 0,
  },
  {
    id: 'ge-design-doc',
    name: '设计图情况',
    desc: '客户是否能提供专业设计资料',
    weight: 15,
    source: 're-floorplan',
    enabled: true,
    full_score_standard: '专业设计图（CAD / 完整方案）',
    pass_score_standard: '手绘 / 视频 / 简单平面图',
    fail_score_standard: '无法收集',
    hit_score: 100,
    miss_score: 0,
  },
  {
    id: 'ge-budget',
    name: '预算明确度',
    desc: '客户对项目预算的清晰程度',
    weight: 20,
    source: 're-budget',
    enabled: true,
    full_score_standard: '已给出明确预算区间或单点金额',
    pass_score_standard: '模糊预算 / 仅说"有预算"',
    fail_score_standard: '完全未提及预算',
    hit_score: 100,
    miss_score: 0,
  },
  {
    id: 'ge-identity',
    name: '客户身份',
    desc: '客户角色对应的转化概率',
    weight: 10,
    source: 're-identity',
    enabled: true,
    full_score_standard: 'Builder / 设计师 / 业主直选',
    pass_score_standard: '中介 / 代理 / 设计公司员工',
    fail_score_standard: '身份不明 / 拒绝回答',
    hit_score: 100,
    miss_score: 20,
  },
  {
    id: 'ge-items',
    name: '需求清单明确度',
    desc: '客户对需求产品的描述完整度',
    weight: 15,
    source: 're-items',
    enabled: true,
    full_score_standard: '明确列出产品/数量/规格',
    pass_score_standard: '能说出主要品类',
    fail_score_standard: '只说"先看看"',
    hit_score: 100,
    miss_score: 0,
  },
  {
    id: 'ge-timeline',
    name: '开工时间',
    desc: '项目预期开工时间',
    weight: 10,
    source: 're-timeline',
    enabled: true,
    full_score_standard: '90 天内开工',
    pass_score_standard: '半年内开工',
    fail_score_standard: '一年以上 / 未定',
    hit_score: 100,
    miss_score: 30,
  },
  {
    id: 'ge-country',
    name: '目标市场匹配度',
    desc: '客户所在国家是否为重点市场',
    weight: 10,
    source: 're-country',
    enabled: true,
    full_score_standard: '北美 / 中东 / 东南亚（敬城重点市场）',
    pass_score_standard: '欧洲 / 大洋洲',
    fail_score_standard: '其它非重点市场',
    hit_score: 100,
    miss_score: 50,
  },
]

export const GRADING_THRESHOLDS = [
  { level: 'A', label: 'A 级', min: 85, max: 100, color: '#D32F2F', desc: '立即派单 · 销售组长抄送' },
  { level: 'B', label: 'B 级', min: 70, max: 84, color: '#E59B26', desc: '24h 内派单 · 优先级中' },
  { level: 'C', label: 'C 级', min: 50, max: 69, color: '#2E7BD6', desc: '正常池 · AI 持续培养' },
  { level: 'D', label: 'D 级', min: 0, max: 49, color: '#94A3B8', desc: '低优先 · 仅自动唤醒一次' },
]

/**
 * 新建 Agent 的默认评级档位（强制预设 A/B/C/D 四档，完整覆盖 0-100）
 */
export function makeDefaultThresholds() {
  return [
    { level: 'A', label: 'A 级', min: 85, max: 100, color: '#D32F2F', desc: '' },
    { level: 'B', label: 'B 级', min: 70, max: 84, color: '#E59B26', desc: '' },
    { level: 'C', label: 'C 级', min: 50, max: 69, color: '#2E7BD6', desc: '' },
    { level: 'D', label: 'D 级', min: 0, max: 49, color: '#94A3B8', desc: '' },
  ]
}

/**
 * 评级档位校验（v6）
 * 规则：
 *   1) 不同等级分值范围不得重叠 / 覆盖
 *   2) 区间必须完整覆盖 0-100，不能有遗漏
 *   3) 不允许缺失中间级（区间必须首尾相接、连续）
 * 返回 { ok, errors: string[] }
 */
export function validateThresholds(thresholds) {
  const errors = []
  if (!thresholds || thresholds.length === 0) {
    return { ok: false, errors: ['至少需要保留 1 个评级档位'] }
  }

  // 基本区间合法性
  for (const t of thresholds) {
    if (t.min == null || t.max == null) {
      errors.push(`「${t.label || t.level}」分值区间不完整`)
    } else if (t.min > t.max) {
      errors.push(`「${t.label || t.level}」最低分不能大于最高分`)
    }
  }
  if (errors.length) return { ok: false, errors }

  // 按 min 升序后逐段检查：起点必须 0、终点必须 100、相邻必须 (上一段 max + 1) === 下一段 min
  const sorted = [...thresholds].sort((a, b) => a.min - b.min)
  if (sorted[0].min !== 0) {
    errors.push(`分值未从 0 开始（当前最低档「${sorted[0].label}」起点为 ${sorted[0].min}）`)
  }
  if (sorted[sorted.length - 1].max !== 100) {
    errors.push(`分值未覆盖到 100（当前最高档「${sorted[sorted.length - 1].label}」终点为 ${sorted[sorted.length - 1].max}）`)
  }
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1]
    const cur = sorted[i]
    if (cur.min <= prev.max) {
      errors.push(`「${prev.label}」与「${cur.label}」区间重叠（${cur.min} ≤ ${prev.max}）`)
    } else if (cur.min !== prev.max + 1) {
      errors.push(`「${prev.label}」与「${cur.label}」之间存在遗漏区间（${prev.max + 1} ~ ${cur.min - 1} 无归属）`)
    }
  }

  return { ok: errors.length === 0, errors }
}

// ============================================================
// 转人工规则（列表化 · 按截图 3）
// ============================================================
//
// HANDOFF_TYPES：触发条件的"类型"枚举（截图 3 第一列下拉）
// - free_text       自由描述（带自然语言文本框）
// - emotion         客户情绪异常
// - request_human   客户要求转人工
// - timeout         Agent 超时未回复（带"未回复时长"二级字段）
// - doubt_bot       客户质疑机器人身份
// - no_progress     Agent 无法推进（多轮无填槽）
// - account_offline 关联账号掉线兜底
// - grading_high    评级达到指定档位

export const HANDOFF_TYPES = [
  {
    value: 'free_text',
    label: '自由描述',
    desc: '通过自然语言描述命中条件',
    has_text_field: true,
    text_placeholder: '通过自然语言描述对话状态或命中节点',
  },
  {
    value: 'emotion',
    label: '客户情绪异常',
    desc: '客户辱骂 / 投诉 / 强烈不满',
  },
  {
    value: 'request_human',
    label: '客户要求转人工',
    desc: '客户消息明确要求转人工或对接真人',
  },
  {
    value: 'timeout',
    label: 'Agent 超时未回复',
    desc: 'Agent 长时间未响应客户',
    sub_fields: [
      { key: 'minutes', label: '未回复时长', type: 'number', unit: '分钟', default: 10 },
    ],
  },
  {
    value: 'doubt_bot',
    label: '客户质疑机器人身份',
    desc: '客户怀疑对方是机器人',
  },
  {
    value: 'no_progress',
    label: 'Agent 多轮无填槽',
    desc: '连续多轮对话未推进核心要素',
    sub_fields: [
      { key: 'rounds', label: '无填槽轮数', type: 'number', unit: '轮', default: 5 },
    ],
  },
  {
    value: 'account_offline',
    label: '关联账号掉线',
    desc: '关联的 WhatsApp 账号掉线，存量会话兜底',
    locked: true,
  },
  {
    value: 'grading_high',
    label: '评级达到指定档位',
    desc: '客户评级首次达到指定档位时触发',
    sub_fields: [
      {
        key: 'tier',
        label: '触发档位',
        type: 'enum',
        options: [
          { value: 'A', label: 'A 级（85+）' },
          { value: 'B', label: 'B 级（70-84）' },
          { value: 'C', label: 'C 级（50-69）' },
        ],
        default: 'A',
      },
    ],
  },
]

// Agent 命中后动作（截图 3 第二列下拉）
export const HANDOFF_AGENT_ACTIONS = [
  { value: 'continue', label: '继续接待', desc: 'AI 继续接待，仅通知人工关注' },
  { value: 'fallback_wait', label: '兜底回复后等待', desc: 'AI 发送兜底话术后停止主动发言，等待人工接管' },
  { value: 'stop_immediately', label: '立即停止 AI 回复', desc: 'AI 完全停止，等待人工接手' },
  { value: 'transfer_human', label: '直接转交人工', desc: '不发送任何话术，立即将会话转给人工' },
]

// ============================================================
// 紧急程度枚举（高 / 中 / 低）
//   - 每档带「推荐响应时限」默认值（分钟）
//   - 紧急程度 + 响应时限 组合，供后续看板基于响应时间做预警
// ============================================================
export const HANDOFF_SEVERITIES = [
  { value: 'high', label: '高', color: '#D32F2F', bg: '#FEF2F2', default_minutes: 5, desc: '客户体感强烈、需立即介入' },
  { value: 'medium', label: '中', color: '#E59B26', bg: '#FFFBEB', default_minutes: 15, desc: '应尽快人工跟进' },
  { value: 'low', label: '低', color: '#2E7BD6', bg: '#EBF3FB', default_minutes: 60, desc: '正常工时内人工跟进即可' },
]

// 响应时限可选项（分钟）
export const HANDOFF_RESPONSE_OPTIONS = [
  { value: 5, label: '5 分钟内' },
  { value: 15, label: '15 分钟内' },
  { value: 30, label: '30 分钟内' },
  { value: 60, label: '1 小时内' },
  { value: 240, label: '4 小时内' },
  { value: 1440, label: '当日内' },
]

// ============================================================
// 默认转人工触发规则（每个 Agent 默认带这几条）
// ============================================================
export const HANDOFF_TRIGGERS = [
  {
    id: 'hr-1',
    type: 'free_text',
    text_value: '客户提到"和价格相关"或"立刻成交"等强意向信号',
    agent_action: 'continue',
    notify: ['c-aril', 'c-coco', 'c-lili'],
    severity: 'medium',
    response_minutes: 15,
    hit_count: 142,
    enabled: true,
  },
  {
    id: 'hr-2',
    type: 'emotion',
    agent_action: 'fallback_wait',
    notify: ['c-aril', 'c-coco', 'c-lili'],
    severity: 'high',
    response_minutes: 5,
    hit_count: 23,
    enabled: true,
  },
  {
    id: 'hr-3',
    type: 'timeout',
    sub_values: { minutes: 10 },
    agent_action: 'continue',
    notify: ['c-aril', 'c-coco', 'c-lili'],
    severity: 'medium',
    response_minutes: 15,
    hit_count: 87,
    enabled: true,
  },
  {
    id: 'hr-4',
    type: 'doubt_bot',
    agent_action: 'transfer_human',
    notify: ['c-aril', 'c-mike'],
    severity: 'medium',
    response_minutes: 15,
    hit_count: 11,
    enabled: true,
  },
  {
    id: 'hr-5',
    type: 'request_human',
    agent_action: 'transfer_human',
    notify: ['c-aril', 'c-coco', 'c-lili'],
    severity: 'high',
    response_minutes: 5,
    hit_count: 56,
    enabled: true,
  },
  {
    id: 'hr-6',
    type: 'grading_high',
    sub_values: { tier: 'A' },
    agent_action: 'continue',
    notify: ['c-mike', 'c-gao'],
    severity: 'low',
    response_minutes: 60,
    hit_count: 38,
    enabled: true,
  },
  {
    id: 'hr-7',
    type: 'no_progress',
    sub_values: { rounds: 5 },
    agent_action: 'fallback_wait',
    notify: ['c-aril'],
    severity: 'medium',
    response_minutes: 15,
    hit_count: 0,
    enabled: false,
  },
  {
    id: 'hr-8',
    type: 'account_offline',
    agent_action: 'fallback_wait',
    notify: ['c-mike', 'c-gao'],
    severity: 'high',
    response_minutes: 5,
    hit_count: 4,
    enabled: true,
    locked: true,
  },
]

// ============================================================
// 向后兼容（旧代码仍 import 这两个，保留空对象避免 import 报错）
// ============================================================
export const HANDOFF_MATRIX = {}
