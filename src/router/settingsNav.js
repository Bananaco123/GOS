/**
 * 设置中心导航（按需求 4.1 系统信息架构）
 * menuKey 与 rbac.MENU_VIEW_PERM 对应，用于按权限隐藏菜单项
 */
export const SETTINGS_NAV = [
  {
    group: '组织架构',
    items: [
      { key: 'set-members', label: '部门与用户', path: '/settings/org/members' },
      { key: 'set-roles', label: '角色与权限', path: '/settings/org/roles' },
    ],
  },
  {
    group: '平台',
    items: [
      { key: 'set-product', label: '产品中心', path: '/settings/product' },
      { key: 'set-billing', label: '费用中心', path: '/settings/billing' },
    ],
  },
]

// path → 标题（供面包屑 / 多标签页解析）
export const SETTINGS_TITLES = (() => {
  const map = { '/settings': '设置中心', '/home': '系统首页' }
  SETTINGS_NAV.forEach((g) => g.items.forEach((it) => { map[it.path] = it.label }))
  return map
})()
