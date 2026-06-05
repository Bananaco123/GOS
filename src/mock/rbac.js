/**
 * 角色 / 权限 / 数据权限 Mock（按「OS-基础架构-需求分析 v1」）
 *
 * - 数据权限三档固定：本人 / 所属部门及下级部门 / 全公司
 * - 权限粒度：菜单（隐藏）/ 页面（toast）/ 操作（按钮隐藏）；本期不做字段级
 * - 单账号单角色；超级管理员权限全开且不可编辑
 */

// ============================================================
// 数据权限三档
// ============================================================
export const DATA_SCOPES = [
  { value: 'self', label: '本人', desc: '仅能访问本人相关业务数据' },
  { value: 'dept', label: '所属部门及下级部门', desc: '可访问本部门及下级部门范围数据' },
  { value: 'company', label: '全公司', desc: '可访问当前企业全量业务数据' },
]
export const dataScopeLabel = (v) => DATA_SCOPES.find((s) => s.value === v)?.label || v

// ============================================================
// 功能权限树（菜单 / 页面 / 操作）
//   - 每个模块 node：{ key, label, menuPath?, ops: [{key,label}] }
//   - 权限 key 约定：`${moduleKey}.${opKey}`，如 agent-sales-rep.view / agent-sales-rep.edit
//   - 菜单可见性 = 角色拥有该模块的 `.view`
// ============================================================
export const PERMISSION_TREE = [
  {
    group: '工作台 & 会话',
    modules: [
      { key: 'workbench', label: '工作台', menuKey: 'workbench', ops: [{ key: 'view', label: '查看' }] },
      { key: 'scrm', label: 'SCRM 销售工作台', menuKey: 'scrm', ops: [{ key: 'view', label: '查看' }] },
      { key: 'conversation-lead', label: '线索分配', menuKey: 'lead', ops: [{ key: 'view', label: '查看' }, { key: 'assign', label: '分配' }] },
      { key: 'conversation-handover', label: '转人工', menuKey: 'handover', ops: [{ key: 'view', label: '查看' }, { key: 'handle', label: '接管处理' }] },
    ],
  },
  {
    group: 'AGENT',
    modules: [
      {
        key: 'agent-sales-rep',
        label: 'AI 业务员',
        menuKey: 'sales-rep',
        ops: [
          { key: 'view', label: '查看' },
          { key: 'create', label: '新建' },
          { key: 'edit', label: '编辑' },
          { key: 'delete', label: '删除' },
          { key: 'publish', label: '发布' },
        ],
      },
      { key: 'agent-sales-king', label: 'AI 销冠', menuKey: 'sales-king', ops: [{ key: 'view', label: '查看' }] },
    ],
  },
  {
    group: '数据看板',
    modules: [
      { key: 'dashboard-pm', label: 'PM 看板', menuKey: 'pm', ops: [{ key: 'view', label: '查看' }, { key: 'export', label: '导出' }] },
      { key: 'dashboard-dept', label: '部门看板', menuKey: 'dept', ops: [{ key: 'view', label: '查看' }, { key: 'export', label: '导出' }] },
    ],
  },
  {
    group: '数字资产',
    modules: [
      {
        key: 'knowledge',
        label: '知识库',
        menuKey: 'kb',
        ops: [
          { key: 'view', label: '查看' },
          { key: 'manage', label: '库管理（建库/改可见范围/删库/发布）' },
          { key: 'create', label: '新建条目' },
          { key: 'edit', label: '编辑条目' },
          { key: 'delete', label: '下线/删除' },
        ],
      },
    ],
  },
  {
    group: '设置 · 组织架构',
    modules: [
      { key: 'settings-members', label: '部门与用户', menuKey: 'set-members', ops: [{ key: 'view', label: '查看' }] },
      {
        key: 'settings-roles',
        label: '角色与权限',
        menuKey: 'set-roles',
        ops: [
          { key: 'view', label: '查看' },
          { key: 'create', label: '新增角色' },
          { key: 'edit', label: '编辑权限' },
          { key: 'delete', label: '删除角色' },
        ],
      },
    ],
  },
  {
    group: '设置 · 平台',
    modules: [
      { key: 'settings-product', label: '产品中心', menuKey: 'set-product', ops: [{ key: 'view', label: '查看' }] },
      { key: 'settings-billing', label: '费用中心', menuKey: 'set-billing', ops: [{ key: 'view', label: '查看' }] },
    ],
  },
]

// 全部权限 key（超管全开用）
export const ALL_PERMISSION_KEYS = (() => {
  const keys = []
  PERMISSION_TREE.forEach((g) => g.modules.forEach((m) => m.ops.forEach((o) => keys.push(`${m.key}.${o.key}`))))
  return keys
})()

// menuKey → 模块的 view 权限 key（用于菜单可见性判断）
export const MENU_VIEW_PERM = (() => {
  const map = {}
  PERMISSION_TREE.forEach((g) => g.modules.forEach((m) => { if (m.menuKey) map[m.menuKey] = `${m.key}.view` }))
  return map
})()

// ============================================================
// 角色（3 预设 + 1 自定义示例）
// ============================================================
function pick(...keys) {
  return keys
}

export const ROLES = [
  {
    id: 'role-super',
    name: '超级管理员',
    preset: true,
    locked: true, // 权限全开、不可编辑
    data_scope: 'company',
    desc: '系统最高权限角色，查看全部组织与用户，拥有全公司数据权限和全部功能权限',
    permissions: ALL_PERMISSION_KEYS,
  },
  {
    id: 'role-dept-admin',
    name: '普通管理员',
    preset: true,
    locked: false,
    data_scope: 'dept',
    desc: '部门管理角色，管理所属部门及下级部门范围内的数据和可授权功能',
    permissions: pick(
      'workbench.view', 'scrm.view',
      'conversation-lead.view', 'conversation-lead.assign',
      'conversation-handover.view', 'conversation-handover.handle',
      'agent-sales-rep.view', 'agent-sales-rep.create', 'agent-sales-rep.edit', 'agent-sales-rep.publish',
      'agent-sales-king.view',
      'dashboard-pm.view', 'dashboard-pm.export', 'dashboard-dept.view',
      'knowledge.view', 'knowledge.manage', 'knowledge.create', 'knowledge.edit',
      'settings-members.view',
    ),
  },
  {
    id: 'role-normal',
    name: '普通用户',
    preset: true,
    locked: false,
    data_scope: 'self',
    desc: '基础业务使用角色，使用被授权的基础功能，仅访问本人数据',
    permissions: pick(
      'workbench.view', 'scrm.view',
      'conversation-handover.view',
      'agent-sales-rep.view',
      'knowledge.view',
      'dashboard-pm.view',
    ),
  },
  {
    id: 'role-kb-admin',
    name: '知识库管理员',
    preset: false, // 自定义角色示例
    locked: false,
    data_scope: 'dept',
    desc: '自定义角色：负责知识库内容维护',
    permissions: pick(
      'workbench.view', 'scrm.view',
      'agent-sales-rep.view',
      'knowledge.view', 'knowledge.manage', 'knowledge.create', 'knowledge.edit', 'knowledge.delete',
      'settings-members.view',
    ),
  },
]

export const roleById = (id) => ROLES.find((r) => r.id === id)
