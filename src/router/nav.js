/**
 * G-Builder OS · V1 侧边栏导航配置
 * 按 g-builder-os-interaction-spec.md §2.1（一级/二级菜单结构）
 *
 * 结构约定：
 *   - kind: 'item'    独立菜单（一级直接是页面）
 *   - kind: 'group'   分组标题 + 二级菜单
 *   - kind: 'divider' 视觉分隔
 *   - inScope: true   本期 PRD 真实实现的页面（AI 业务员 / 知识库）；false 走占位页
 */

export const NAV_TOP = [
  {
    kind: 'item',
    key: 'workbench',
    label: '工作台',
    sub: '日常入口 · 个人任务台',
    path: '/workbench',
    icon: 'home',
    inScope: false,
  },
  {
    kind: 'item',
    key: 'scrm',
    label: 'SCRM 销售工作台',
    path: '/scrm',
    icon: 'chat',
    inScope: true,
  },
  {
    kind: 'group',
    key: 'conversation',
    label: '会话管理',
    items: [
      { key: 'lead', label: '线索分配', path: '/conversation/lead-assignment', inScope: false, badge: 12 },
      { key: 'handover', label: '转人工', path: '/conversation/handover', inScope: false, badge: 3, badgeColor: 'warning' },
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
    key: 'dashboard',
    label: '数据看板',
    items: [
      { key: 'pm', label: 'PM 看板', path: '/dashboard/pm', inScope: false },
      { key: 'dept', label: '部门看板', path: '/dashboard/department', inScope: false },
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

/** 一级菜单上限：会话管理下二级菜单徽标颜色映射 */
export const BADGE_COLOR = {
  default: '#D32F2F',
  warning: '#E59B26',
}
