/**
 * Agent 统一状态机（v6）
 *
 * 建设流程状态（lifecycle）：草稿 → 预发布 → 已发布
 *   - 草稿：包含大量未提交的强必填内容，尚不可上线
 *   - 预发布：内容已完整提交，处于测试中
 *   - 已发布：正式生效，细分两个互斥子状态——接待中 / 暂停中
 *
 * 对外只暴露「单一状态」：草稿 / 预发布中 / 接待中 / 暂停中
 * 保证任一 Agent 同一时刻只命中一个状态标签，不会出现两个标签共存。
 */

export const AGENT_STATUS = {
  draft: {
    key: 'draft',
    label: '草稿',
    color: '#B45309',
    bg: '#FFFBEB',
    border: '#E59B26',
    dot: '#E59B26',
    phase: 'building',
  },
  pre_release: {
    key: 'pre_release',
    label: '预发布中',
    color: '#1A4D8F',
    bg: '#EBF3FB',
    border: '#2E7BD6',
    dot: '#2E7BD6',
    phase: 'building',
  },
  serving: {
    key: 'serving',
    label: '接待中',
    color: '#047857',
    bg: '#F0FDF4',
    border: '#10A86A',
    dot: '#10A86A',
    phase: 'published',
  },
  paused: {
    key: 'paused',
    label: '暂停中',
    color: '#4B5563',
    bg: '#F3F4F6',
    border: '#9CA3AF',
    dot: '#9CA3AF',
    phase: 'published',
  },
}

export const AGENT_STATUS_LIST = [
  AGENT_STATUS.draft,
  AGENT_STATUS.pre_release,
  AGENT_STATUS.serving,
  AGENT_STATUS.paused,
]

/**
 * 从 Agent 实例派生唯一状态 key（兼容 v5 旧字段）
 */
export function getAgentStatusKey(agent) {
  if (!agent) return 'draft'
  const s = agent.status
  if (s === 'draft') return 'draft'
  if (s === 'pre-release' || s === 'pre_release') return 'pre_release'
  // 已发布家族：再看子状态
  if (s === 'paused') return 'paused' // 兼容 v5 顶层 paused
  if (agent.runtime_state === 'paused') return 'paused'
  if (s === 'published') return 'serving'
  return 'draft'
}

export function getAgentStatus(agent) {
  return AGENT_STATUS[getAgentStatusKey(agent)]
}

export function isPublished(agent) {
  return getAgentStatus(agent).phase === 'published'
}

export function isPaused(agent) {
  return getAgentStatusKey(agent) === 'paused'
}
