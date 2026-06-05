/**
 * 知识库引用关系派生（v9 · 见「关键逻辑.md §2.13.8」）
 *
 * Agent 以「库」为引用单元：agent.knowledge_libraries = [{ library_id, groups }]
 *   - groups === 'all'        引用整库（库内所有分组的条目都可命中）
 *   - groups === [groupId...]  仅引用指定分组（按祖先链匹配：引用父分组即覆盖其子分组条目）
 *
 * 「被引用 Agent」由 Agent 侧 knowledge_libraries 实时反推，不用静态字段。
 */

import { KB_GROUPS_FLAT } from '../mock/knowledge'

// 分组祖先链（含自身）：[groupId, parentId, ...]
export function groupAncestors(groupId) {
  const chain = []
  let cur = groupId
  const guard = new Set()
  while (cur && !guard.has(cur)) {
    chain.push(cur)
    guard.add(cur)
    cur = KB_GROUPS_FLAT.find((g) => g.id === cur)?.parent_id || null
  }
  return chain
}

// Agent 类型描述（用于 hover 浮层：哪个类型的哪个 Agent）
export function agentTypeMeta(agent) {
  const isTest = /测试|test/i.test(agent.display_name || '')
  return {
    product: 'AI 业务员',
    variant: isTest ? '测试' : '正式接待',
    variantColor: isTest ? 'default' : 'green',
  }
}

// 单个库引用项是否覆盖某条目（库一致 + 分组范围命中）
function refCoversEntry(libRef, entry) {
  if (!libRef || libRef.library_id !== entry.library_id) return false
  if (libRef.groups === 'all') return true
  if (!Array.isArray(libRef.groups)) return false
  const anc = groupAncestors(entry.group_id)
  return libRef.groups.some((g) => anc.includes(g))
}

// 引用了某条目的 Agent 列表（库匹配 + 库内分组范围匹配）
export function entryRefAgents(entry, agents) {
  if (!entry) return []
  return agents.filter((a) =>
    (a.knowledge_libraries || []).some((lib) => refCoversEntry(lib, entry)),
  )
}

// 引用了某个库的 Agent 列表（只要引用了该库 —— 无论整库还是部分分组）
export function libraryRefAgents(libraryId, agents) {
  return agents.filter((a) =>
    (a.knowledge_libraries || []).some((lib) => lib.library_id === libraryId),
  )
}
