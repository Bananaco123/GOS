/**
 * 知识库「库（Library）」Mock 数据（v9 · 见「关键逻辑.md §2.13.1 / §2.13.2」）
 *
 * 库 = 知识库最高组织单元，带唯一可见范围（复用 RBAC 三档）：
 *   - scope: 'company'(企业级) / 'dept'(部门级·归属 owner_dept_id) / 'self'(个人级·归属 owner_user_id)
 * 可见性规则：
 *   - 企业级：全公司可见
 *   - 部门级：归属部门「及下级」可见（用户所在部门 = 归属部门或其子部门）
 *   - 个人级：仅归属本人可见
 *   - 例外：数据范围 = 全公司（company）的管理员可见全部库（便于管理）
 */

import { DEPARTMENTS_FLAT } from './org'

export const SCOPE_META = {
  company: { label: '企业级', color: '#7C3AED', tag: 'purple', icon: 'global', desc: '全公司可见' },
  dept: { label: '部门级', color: '#1A4D8F', tag: 'blue', icon: 'team', desc: '归属部门及下级可见' },
  self: { label: '个人级', color: '#0E7C7B', tag: 'cyan', icon: 'user', desc: '仅归属本人可见' },
}
export const scopeMeta = (s) => SCOPE_META[s] || SCOPE_META.dept

export const KB_LIBRARIES = [
  {
    id: 'lib-company',
    name: '企业通用知识库',
    scope: 'company',
    owner_dept_id: null,
    owner_user_id: null,
    description: '全公司共用的通用 FAQ 与公司政策，多 Agent 同源复用',
    color: '#7C3AED',
    created_by: 'Gao Kui',
    created_by_avatar: 'GK',
    created_at: '2026-03-01 09:00',
    updated_by: 'Sara Wang',
    updated_by_avatar: 'SW',
    updated_at: '2026-05-31 23:48',
    total_recall: 5152,
  },
  {
    id: 'lib-na',
    name: '北美销售库',
    scope: 'dept',
    owner_dept_id: 'd-os-1',
    owner_user_id: null,
    description: '北美市场产品图册 / SOP 话术 / 成功案例 一站式知识',
    color: '#1A4D8F',
    created_by: 'Mike Liu',
    created_by_avatar: 'ML',
    created_at: '2026-03-12 14:00',
    updated_by: 'Eric Zhao',
    updated_by_avatar: 'EZ',
    updated_at: '2026-05-30 11:24',
    total_recall: 12533,
  },
  {
    id: 'lib-sea',
    name: '东南亚销售库',
    scope: 'dept',
    owner_dept_id: 'd-os-2',
    owner_user_id: null,
    description: '东南亚三国（新马印）本地化政策、税务与产品目录',
    color: '#10A86A',
    created_by: 'Wei Chen',
    created_by_avatar: 'WC',
    created_at: '2026-04-15 11:00',
    updated_by: 'COCO',
    updated_by_avatar: 'CC',
    updated_at: '2026-05-29 10:30',
    total_recall: 414,
  },
  {
    id: 'lib-my',
    name: '我的话术草稿库',
    scope: 'self',
    owner_dept_id: null,
    owner_user_id: 'u-gao',
    description: '个人暂存、尚未沉淀到团队库的草稿话术',
    color: '#0E7C7B',
    created_by: 'Gao Kui',
    created_by_avatar: 'GK',
    created_at: '2026-05-20 09:00',
    updated_by: 'Gao Kui',
    updated_by_avatar: 'GK',
    updated_at: '2026-06-02 18:10',
    total_recall: 0,
  },
]

export const libraryById = (id, libs = KB_LIBRARIES) => libs.find((l) => l.id === id)

// 判断 deptId 是否 = ownerDeptId 或其子部门（向上回溯命中即可见）
function isSelfOrDescendantDept(deptId, ownerDeptId) {
  if (!deptId || !ownerDeptId) return false
  let cur = deptId
  const guard = new Set()
  while (cur && !guard.has(cur)) {
    if (cur === ownerDeptId) return true
    guard.add(cur)
    cur = DEPARTMENTS_FLAT.find((d) => d.id === cur)?.parent_id || null
  }
  return false
}

/**
 * 当前用户可见的库
 * @param {array} libs 全量库
 * @param {object} user 当前用户（含 dept_id / id）
 * @param {object} role 当前角色（含 data_scope）
 */
export function visibleLibraries(libs, user, role) {
  if (!user) return []
  const isCompanyAdmin = role?.data_scope === 'company'
  return libs.filter((lib) => {
    if (isCompanyAdmin) return true
    if (lib.scope === 'company') return true
    if (lib.scope === 'dept') return isSelfOrDescendantDept(user.dept_id, lib.owner_dept_id)
    if (lib.scope === 'self') return lib.owner_user_id === user.id
    return false
  })
}
