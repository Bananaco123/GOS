export const NAV_TOP = [
  {
    kind: 'group',
    key: 'sales-workbench',
    label: '销售工作台',
    items: [
      { key: 'scrm', label: 'SCRM', path: '/scrm', inScope: true },
    ],
  },
  {
    kind: 'group',
    key: 'conversation',
    label: '会话管理',
    items: [
      { key: 'lead', label: '线索分配', path: '/conversation/lead-assignment', inScope: true, badge: 12 },
      { key: 'handover', label: '转人工', path: '/conversation/handover', inScope: true, badge: 3, badgeColor: 'warning' },
    ],
  },
  {
    kind: 'group',
    key: 'agent',
    label: 'AGENT',
    items: [
      { key: 'sales-rep', label: 'AI 业务员', path: '/agent/sales-rep', inScope: true },
      { key: 'sales-king', label: 'AI 销冠', path: '/agent/sales-king', inScope: false },
    ],
  },
  {
    kind: 'group',
    key: 'asset',
    label: '数字资产',
    items: [
      { key: 'kb', label: '知识库', path: '/knowledge', inScope: true },
    ],
  },
]

export const NAV_BOTTOM = [
  { kind: 'item', key: 'settings', label: '设置', path: '/settings', icon: 'setting', inScope: false },
]

export const BADGE_COLOR = {
  default: '#D32F2F',
  warning: '#E59B26',
}
