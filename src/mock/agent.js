/**
 * Agent 实例 Mock 数据
 *
 * v5 修订：从「单 Agent」扩展为「多 Agent 列表 + 详情」
 * 共 6 个 Agent 实例，覆盖 3 个销售组、3 种状态（正常 / 已暂停 / 草稿）
 */

import { RECEPTION_ELEMENTS, INTENT_TASKS } from './receptionAndIntent'
import { GRADING_ELEMENTS, GRADING_THRESHOLDS, HANDOFF_TRIGGERS } from './gradingAndHandoff'

// 演示用：故意留有遗漏区间的档位（缺 C 级 50-69），用于展示「档位校验标红」
const GRADING_THRESHOLDS_GAPPED = [
  { level: 'A', label: 'A 级', min: 85, max: 100, color: '#D32F2F', desc: '' },
  { level: 'B', label: 'B 级', min: 70, max: 84, color: '#E59B26', desc: '' },
  { level: 'D', label: 'D 级', min: 0, max: 49, color: '#94A3B8', desc: '' },
]

// ============================================================
// 联系人列表（用于"通知人工"多选）
// ============================================================
export const CONTACTS = [
  { id: 'c-aril', name: 'Aril', avatar: 'AR', role: '销售助理', dept: '海外营销一部' },
  { id: 'c-coco', name: 'COCO', avatar: 'CC', role: '销售助理', dept: '海外营销一部' },
  { id: 'c-lili', name: 'LILI', avatar: 'LL', role: '销售助理', dept: '海外营销二部' },
  { id: 'c-mike', name: 'Mike Liu', avatar: 'ML', role: '北美组组长', dept: '海外营销一部' },
  { id: 'c-linda', name: 'Linda Chen', avatar: 'LC', role: '销售助理', dept: '海外营销一部' },
  { id: 'c-hassan', name: 'Hassan Al', avatar: 'HA', role: '中东组组长', dept: '海外营销一部' },
  { id: 'c-wei', name: 'Wei Chen', avatar: 'WC', role: '东南亚组组长', dept: '海外营销二部' },
  { id: 'c-james', name: 'James Lin', avatar: 'JL', role: '销售助理', dept: '海外营销一部' },
  { id: 'c-sara', name: 'Sara Wang', avatar: 'SW', role: '销售助理', dept: '海外营销一部' },
  { id: 'c-gao', name: 'Gao Kui', avatar: 'GK', role: 'PM · 部门管理员', dept: '海外营销一部' },
]

// ============================================================
// 共享配置工厂
// ============================================================
function defaultIdentity(initials, bg = '#1A4D8F', name = 'OK Group · Sales Assistant') {
  return {
    name,
    avatar: null,
    avatar_initials: initials,
    avatar_bg: bg,
  }
}

// ============================================================
// Agent 实例列表（6 个）
// ============================================================
export const AGENTS = [
  // 1) 北美正式接待（主演示 Agent）
  {
    id: 'agent-na-formal',
    display_name: '敬城-北美-正式接待',
    short_id: 'A-32998',
    sales_group_id: 'sg-na',
    status: 'published',
    runtime_state: 'serving',
    current_version: 'v.13',
    created_by: 'Gao Kui',
    created_by_avatar: 'GK',
    created_at: '2026-03-12 14:00',
    last_modified_at: '2026-05-31 23:52',
    last_modified_by: 'Gao Kui',
    last_modified_by_avatar: 'GK',
    last_published_at: '2026-05-30 10:08',
    last_published_by: 'Gao Kui',
    last_published_by_avatar: 'GK',
    active_sessions: 247,
    remark: '北美组正式接待 Agent · 主力承接 4 个 WhatsApp 账号',
    identity_card: defaultIdentity('OK', '#1A4D8F'),
    linked_whatsapp_accounts: ['BS-OK-NA-A01-x9F2', 'BS-OK-NA-A02-7gK1', 'BS-OK-NA-A03-2mP8', 'BS-OK-NA-T01-Tt0q'],
    // 库级引用（v9）：主力 Agent 用满 企业通用库 + 北美库
    knowledge_libraries: [
      { library_id: 'lib-company', groups: 'all' },
      { library_id: 'lib-na', groups: 'all' },
    ],
    reception_elements_config: RECEPTION_ELEMENTS,
    intent_tasks_config: INTENT_TASKS,
    grading_config: {
      enabled: true,
      elements: GRADING_ELEMENTS,
      thresholds: GRADING_THRESHOLDS,
      version: 'v.4',
    },
    handoff_config: { triggers: HANDOFF_TRIGGERS },
  },
  // 2) 北美测试 Agent
  {
    id: 'agent-na-test',
    display_name: '敬城-北美-测试 Agent',
    short_id: 'A-32999',
    sales_group_id: 'sg-na',
    status: 'draft',
    runtime_state: 'draft',
    current_version: 'v.2',
    created_by: 'Gao Kui',
    created_by_avatar: 'GK',
    created_at: '2026-05-06 14:46:11',
    last_modified_at: '2026-05-29 16:18',
    last_modified_by: 'Gao Kui',
    last_modified_by_avatar: 'GK',
    last_published_at: null,
    active_sessions: 0,
    remark: '北美组测试通道 · 联用测试账号',
    identity_card: defaultIdentity('OK', '#2E7BD6'),
    linked_whatsapp_accounts: ['BS-OK-NA-T01-Tt0q'],
    // 测试通道：指定分组细化（仅 通用FAQ + 厨柜图册）
    knowledge_libraries: [
      { library_id: 'lib-company', groups: ['kg-faq'] },
      { library_id: 'lib-na', groups: ['kg-product-kitchen'] },
    ],
    reception_elements_config: RECEPTION_ELEMENTS,
    intent_tasks_config: INTENT_TASKS,
    // 演示档位校验标红：缺 C 级（50-69 未覆盖）
    grading_config: { enabled: true, elements: GRADING_ELEMENTS, thresholds: GRADING_THRESHOLDS_GAPPED, version: 'v.1' },
    handoff_config: { triggers: HANDOFF_TRIGGERS },
  },
  // 3) 中东正式接待
  {
    id: 'agent-mea-formal',
    display_name: '敬城-中东-正式接待',
    short_id: 'A-33102',
    sales_group_id: 'sg-mea',
    status: 'published',
    runtime_state: 'serving',
    current_version: 'v.8',
    created_by: 'Hassan Al',
    created_by_avatar: 'HA',
    created_at: '2026-04-02 09:30:00',
    last_modified_at: '2026-05-28 11:15',
    last_modified_by: 'Hassan Al',
    last_modified_by_avatar: 'HA',
    last_published_at: '2026-05-25 10:00',
    active_sessions: 156,
    remark: '中东组正式接待 Agent · UAE/沙特双账号',
    identity_card: defaultIdentity('MEA', '#0E7C7B'),
    linked_whatsapp_accounts: ['BS-OK-MEA-A01-uW2x', 'BS-OK-MEA-A02-bV6m'],
    knowledge_libraries: [
      { library_id: 'lib-company', groups: 'all' },
      { library_id: 'lib-na', groups: ['kg-sop', 'kg-product-kitchen', 'kg-product-whole'] },
    ],
    reception_elements_config: RECEPTION_ELEMENTS,
    intent_tasks_config: INTENT_TASKS,
    grading_config: { enabled: true, elements: GRADING_ELEMENTS, thresholds: GRADING_THRESHOLDS, version: 'v.2' },
    handoff_config: { triggers: HANDOFF_TRIGGERS },
  },
  // 4) 中东测试 Agent（暂停中）
  {
    id: 'agent-mea-test',
    display_name: '敬城-中东-测试 Agent',
    short_id: 'A-33103',
    sales_group_id: 'sg-mea',
    status: 'published',
    runtime_state: 'paused',
    current_version: 'v.3',
    created_by: 'Hassan Al',
    created_by_avatar: 'HA',
    created_at: '2026-04-20 10:24',
    last_modified_at: '2026-05-12 08:45',
    last_modified_by: 'Hassan Al',
    last_modified_by_avatar: 'HA',
    last_published_at: '2026-05-12 09:00',
    active_sessions: 0,
    remark: '中东组测试 Agent · 当前暂停',
    identity_card: defaultIdentity('MEA', '#5E81AC'),
    linked_whatsapp_accounts: [],
    knowledge_libraries: [{ library_id: 'lib-company', groups: ['kg-faq'] }],
    reception_elements_config: RECEPTION_ELEMENTS,
    intent_tasks_config: INTENT_TASKS,
    grading_config: { enabled: true, elements: GRADING_ELEMENTS, thresholds: GRADING_THRESHOLDS, version: 'v.1' },
    handoff_config: { triggers: HANDOFF_TRIGGERS },
  },
  // 5) 东南亚正式接待
  {
    id: 'agent-sea-formal',
    display_name: '敬城-东南亚-正式接待',
    short_id: 'A-33205',
    sales_group_id: 'sg-sea',
    status: 'published',
    runtime_state: 'serving',
    current_version: 'v.6',
    created_by: 'Wei Chen',
    created_by_avatar: 'WC',
    created_at: '2026-04-15 11:00',
    last_modified_at: '2026-05-30 16:30',
    last_modified_by: 'Wei Chen',
    last_modified_by_avatar: 'WC',
    last_published_at: '2026-05-29 14:00',
    active_sessions: 189,
    remark: '东南亚组主力 Agent · 三国市场（新马印）',
    identity_card: defaultIdentity('SEA', '#10A86A'),
    linked_whatsapp_accounts: ['BS-OK-SEA-A01-cR4n', 'BS-OK-SEA-A02-dT7p', 'BS-OK-SEA-T01-fU9j'],
    knowledge_libraries: [
      { library_id: 'lib-company', groups: 'all' },
      { library_id: 'lib-na', groups: ['kg-sop', 'kg-product-kitchen', 'kg-product-wardrobe', 'kg-product-flooring'] },
    ],
    reception_elements_config: RECEPTION_ELEMENTS,
    intent_tasks_config: INTENT_TASKS,
    grading_config: { enabled: true, elements: GRADING_ELEMENTS, thresholds: GRADING_THRESHOLDS, version: 'v.3' },
    handoff_config: { triggers: HANDOFF_TRIGGERS },
  },
  // 6) 东南亚测试 Agent（草稿）
  {
    id: 'agent-sea-test',
    display_name: '敬城-东南亚-测试 Agent',
    short_id: 'A-33206',
    sales_group_id: 'sg-sea',
    status: 'draft',
    runtime_state: 'draft',
    current_version: 'v.1',
    created_by: 'Wei Chen',
    created_by_avatar: 'WC',
    created_at: '2026-05-28 09:00',
    last_modified_at: '2026-05-31 18:42',
    last_modified_by: 'Wei Chen',
    last_modified_by_avatar: 'WC',
    last_published_at: null,
    active_sessions: 0,
    remark: '东南亚组测试通道 · 配置中',
    identity_card: defaultIdentity('SEA', '#7C3AED'),
    linked_whatsapp_accounts: [],
    knowledge_libraries: [{ library_id: 'lib-company', groups: ['kg-faq'] }],
    reception_elements_config: RECEPTION_ELEMENTS,
    intent_tasks_config: INTENT_TASKS,
    grading_config: { enabled: true, elements: GRADING_ELEMENTS, thresholds: GRADING_THRESHOLDS, version: 'v.1' },
    handoff_config: { triggers: HANDOFF_TRIGGERS },
  },
]

// ============================================================
// 接待策略默认配置（会话设置 + 客户唤醒机制）
// ============================================================
export function makeReceptionStrategy() {
  return {
    // 1) 会话设置
    session: {
      // 部分意图固定回复：命中这些意图时直接走固定话术，不经过大模型生成
      fixed_replies: [
        { id: 'fr-greeting', intent: '问候 / 开场', enabled: true, reply: 'Hi! Thanks for reaching out to OK Group 👋 May I know which type of project you are working on?' },
        { id: 'fr-hours', intent: '询问营业时间', enabled: true, reply: 'Our team is online Mon-Fri 8 AM - 8 PM (EST). Leave your message anytime and we will follow up.' },
        { id: 'fr-pricing-hold', intent: '直接索要报价', enabled: false, reply: 'Pricing depends on your specs. Could you share the items and quantity so I can prepare an accurate quote?' },
      ],
      // 最长会话轮数：AI 自主接待的最大对话轮数，超过则转人工兜底
      max_rounds: 30,
      // AI 称谓：AI 在对话中的自称
      ai_title: 'Sales Assistant',
    },
    // 2) 自动化任务（v9：客户唤醒机制升级；事件类型 = 唤醒客户 + 复合触发条件 AND）
    wakeup: {
      enabled: true,
      // 按客户所在时区择时发送（长期唤醒任务避免深夜打扰）
      respect_timezone: true,
      tasks: [
        {
          id: 'at-1',
          enabled: true,
          name: '北美客户 · 24h 沉默唤醒',
          event_type: 'wakeup_customer',
          match: 'all',
          conditions: [
            { id: 'at1-c1', attr: 'no_reply', op: 'gte', value: 1440 }, // 24 小时未回复
            { id: 'at1-c2', attr: 'region', op: 'in', value: ['北美'] },
          ],
          output_mode: 'script',
          script: 'Hi {customer_name}, just checking in — do you have any questions about the cabinet options we discussed?',
          task_goal: '收集预算区间',
        },
        {
          id: 'at-2',
          enabled: true,
          name: '全案无图客户 · 72h 催图',
          event_type: 'wakeup_customer',
          match: 'all',
          conditions: [
            { id: 'at2-c1', attr: 'no_reply', op: 'gte', value: 4320 }, // 72 小时未回复
            { id: 'at2-c2', attr: 'scale', op: 'in', value: ['全案'] },
            { id: 'at2-c3', attr: 'design_doc', op: 'in', value: ['无'] },
          ],
          output_mode: 'goal',
          script: 'We have a spring promotion ending soon. Would you like me to send the latest catalog for your project?',
          task_goal: '推进项目阶段 / 索取设计图',
        },
      ],
    },
  }
}

// 为每个 Agent 注入接待策略默认值（演示态：均使用同一套默认）
AGENTS.forEach((a) => {
  if (!a.reception_strategy) a.reception_strategy = makeReceptionStrategy()
})

// 向后兼容：单 Agent 引用入口
export const AGENT_SALES_REP = AGENTS[0]

// ============================================================
// 配置版本历史（按 Agent 区分）
// ============================================================
const NA_VERSIONS = [
  {
    version: 'v.13',
    state: 'published',
    published_at: '2026-05-30 10:08',
    published_by: 'Gao Kui',
    published_by_avatar: 'GK',
    remark: '新增 SOP-定价话术-001；调整北美组评级权重',
    changes: [
      { module: '接待要素', desc: '"国家/地区"提示模板优化' },
      { module: '线索评级', desc: '"项目阶段进入设计/报价"权重 12 → 15' },
      { module: '知识库引用', desc: '新增引用 SOP-定价话术-001' },
    ],
  },
  {
    version: 'v.12',
    state: 'expired',
    published_at: '2026-05-22 16:30',
    published_by: 'Gao Kui',
    published_by_avatar: 'GK',
    remark: '预发布版本超 7 天未正式发布，已自动 expired',
    changes: [{ module: '转人工规则', desc: '调整"客户主动要求转人工"触发条件' }],
  },
  {
    version: 'v.11',
    state: 'historical',
    published_at: '2026-05-15 09:00',
    published_by: 'Linda Chen',
    published_by_avatar: 'LC',
    remark: '春季新品上线 · 更新产品图册引用',
    changes: [{ module: '知识库引用', desc: '新增引用"现代风厨柜 2026 春季新品"' }],
  },
  {
    version: 'v.10',
    state: 'historical',
    published_at: '2026-05-08 14:24',
    published_by: 'Gao Kui',
    published_by_avatar: 'GK',
    remark: '增加唤醒话术 SOP-阶段1',
    changes: [],
  },
  {
    version: 'v.9',
    state: 'historical',
    published_at: '2026-04-28 11:00',
    published_by: 'Mike Liu',
    published_by_avatar: 'ML',
    remark: '关联账号 OK-Group-NA-A4 移除',
    changes: [],
  },
  {
    version: 'v.8',
    state: 'historical',
    published_at: '2026-04-15 09:00',
    published_by: 'Gao Kui',
    published_by_avatar: 'GK',
    remark: '退换货政策 v2.3 引用更新',
    changes: [],
  },
  {
    version: 'v.7',
    state: 'historical',
    published_at: '2026-04-01 10:00',
    published_by: 'Gao Kui',
    published_by_avatar: 'GK',
    remark: '评级阈值首次发布（A 85+ / B 70-84 / C 50-69 / D <50）',
    changes: [],
  },
]

const MEA_VERSIONS = [
  { version: 'v.8', state: 'published', published_at: '2026-05-25 10:00', published_by: 'Hassan Al', published_by_avatar: 'HA', remark: '增加中东市场专属物流 FAQ', changes: [] },
  { version: 'v.7', state: 'historical', published_at: '2026-05-10 09:00', published_by: 'Hassan Al', published_by_avatar: 'HA', remark: '迪拜清关流程更新', changes: [] },
  { version: 'v.6', state: 'historical', published_at: '2026-04-22 14:00', published_by: 'Hassan Al', published_by_avatar: 'HA', remark: '沙特账号绑定', changes: [] },
]

const SEA_VERSIONS = [
  { version: 'v.6', state: 'published', published_at: '2026-05-29 14:00', published_by: 'Wei Chen', published_by_avatar: 'WC', remark: '东南亚三国统一接待话术', changes: [] },
  { version: 'v.5', state: 'historical', published_at: '2026-05-18 11:00', published_by: 'Wei Chen', published_by_avatar: 'WC', remark: '新加坡 + 马来 双语支持', changes: [] },
]

export const CONFIG_VERSIONS_BY_AGENT = {
  'agent-na-formal': NA_VERSIONS,
  'agent-na-test': [{ version: 'v.2', state: 'historical', published_at: '2026-05-20 10:00', published_by: 'Gao Kui', published_by_avatar: 'GK', remark: '测试通道配置初始化', changes: [] }],
  'agent-mea-formal': MEA_VERSIONS,
  'agent-mea-test': [{ version: 'v.3', state: 'historical', published_at: '2026-05-12 09:00', published_by: 'Hassan Al', published_by_avatar: 'HA', remark: '测试通道暂停前最后版本', changes: [] }],
  'agent-sea-formal': SEA_VERSIONS,
  'agent-sea-test': [],
}

// 向后兼容
export const CONFIG_VERSIONS = NA_VERSIONS
