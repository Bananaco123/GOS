export const DATA_SCOPES = [
  { value: 'self', label: '本人', desc: '仅能访问本人相关业务数据' },
  { value: 'dept', label: '所属部门及下级部门', desc: '可访问本部门及下级部门范围数据' },
  { value: 'company', label: '全公司', desc: '可访问当前企业全量业务数据' },
]

export const dataScopeLabel = (value) =>
  DATA_SCOPES.find((scope) => scope.value === value)?.label || value

export const PERMISSION_TREE = [
  {
    group: 'SCRM',
    modules: [
      { key: 'scrm', label: 'SCRM 销售工作台', menuKey: 'scrm', ops: [{ key: 'view', label: '查看' }] },
    ],
  },
  {
    group: '会话管理',
    modules: [
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
    group: '数字资产',
    modules: [
      {
        key: 'knowledge',
        label: '知识库',
        menuKey: 'kb',
        ops: [
          { key: 'view', label: '查看' },
          { key: 'manage', label: '库管理' },
          { key: 'create', label: '新建条目' },
          { key: 'edit', label: '编辑条目' },
          { key: 'delete', label: '下线/删除' },
        ],
      },
    ],
  },
  {
    group: '设置 · SCRM',
    modules: [
      {
        key: 'settings-cloud-accounts',
        label: '云账号管理',
        menuKey: 'set-cloud-accounts',
        ops: [
          { key: 'view', label: '查看' },
          { key: 'edit', label: '编辑' },
        ],
      },
    ],
  },
  {
    group: '设置 · 组织架构',
    modules: [
      {
        key: 'settings-members',
        label: '部门与用户',
        menuKey: 'set-members',
        ops: [
          { key: 'view', label: '查看' },
          { key: 'create', label: '新增用户' },
          { key: 'edit-role', label: '配置角色' },
          { key: 'status', label: '启用/停用' },
          { key: 'handover', label: '数据交接' },
          { key: 'delete', label: '删除用户' },
        ],
      },
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
      { key: 'settings-log', label: '系统日志', menuKey: 'set-log', ops: [{ key: 'view', label: '查看' }] },
    ],
  },
]

export const ALL_PERMISSION_KEYS = (() => {
  const keys = []
  PERMISSION_TREE.forEach((group) => {
    group.modules.forEach((module) => {
      module.ops.forEach((op) => keys.push(`${module.key}.${op.key}`))
    })
  })
  return keys
})()

export const MENU_VIEW_PERM = (() => {
  const map = {}
  PERMISSION_TREE.forEach((group) => {
    group.modules.forEach((module) => {
      if (module.menuKey) map[module.menuKey] = `${module.key}.view`
    })
  })
  return map
})()

function pick(...keys) {
  return keys
}

export const ROLES = [
  {
    id: 'role-super',
    name: '超级管理员',
    preset: true,
    locked: true,
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
      'scrm.view',
      'conversation-lead.view', 'conversation-lead.assign',
      'conversation-handover.view', 'conversation-handover.handle',
      'agent-sales-rep.view', 'agent-sales-rep.create', 'agent-sales-rep.edit', 'agent-sales-rep.publish',
      'agent-sales-king.view',
      'knowledge.view', 'knowledge.manage', 'knowledge.create', 'knowledge.edit',
      'settings-members.view', 'settings-members.create', 'settings-members.edit-role',
      'settings-members.status', 'settings-members.handover', 'settings-members.delete',
      'settings-cloud-accounts.view', 'settings-cloud-accounts.edit',
      'settings-log.view',
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
      'scrm.view',
      'conversation-handover.view',
      'agent-sales-rep.view',
      'knowledge.view',
    ),
  },
  {
    id: 'role-kb-admin',
    name: '知识库管理员',
    preset: false,
    locked: false,
    data_scope: 'dept',
    desc: '自定义角色：负责知识库内容维护',
    permissions: pick(
      'scrm.view',
      'agent-sales-rep.view',
      'knowledge.view', 'knowledge.manage', 'knowledge.create', 'knowledge.edit', 'knowledge.delete',
      'settings-members.view',
    ),
  },
]

export const roleById = (id) => ROLES.find((role) => role.id === id)
