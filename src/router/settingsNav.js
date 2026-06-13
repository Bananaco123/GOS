export const SETTINGS_NAV = [
  {
    group: 'SCRM',
    items: [
      { key: 'set-cloud-accounts', label: '云账号管理', path: '/settings/scrm/cloud-accounts' },
    ],
  },
  {
    group: '组织架构',
    items: [
      { key: 'set-members', label: '部门与用户', path: '/settings/org/members' },
      { key: 'set-roles', label: '角色与权限', path: '/settings/org/roles' },
    ],
  },
  {
    group: '系统日志',
    items: [
      { key: 'set-log', label: '系统日志', path: '/settings/org/logs' },
    ],
  },
]

export const SETTINGS_TITLES = (() => {
  const map = { '/settings': '设置中心', '/home': '系统首页' }
  SETTINGS_NAV.forEach((group) => {
    group.items.forEach((item) => {
      map[item.path] = item.label
    })
  })
  return map
})()
