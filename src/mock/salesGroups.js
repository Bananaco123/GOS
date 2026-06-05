/**
 * 销售组 Mock 数据（按 PRD §5.1.1）
 * 敬城集团内部多销售组，按地理区域 / 业务线划分。
 * 一个销售组下可绑定 1-5 个 Agent 实例（产品硬上限）。
 */

export const SALES_GROUPS = [
  {
    id: 'sg-na',
    name: '敬城-北美组',
    region: 'North America',
    timezone: 'America/Toronto',
    department: '海外营销一部',
    leader: 'Mike Liu',
    leader_avatar: 'ML',
    memberCount: 12,
    agentInstanceCount: 1, // 当前 Agent 实例数（不算上限 5）
  },
  {
    id: 'sg-mea',
    name: '敬城-中东组',
    region: 'Middle East',
    timezone: 'Asia/Dubai',
    department: '海外营销一部',
    leader: 'Hassan Al',
    leader_avatar: 'HA',
    memberCount: 8,
    agentInstanceCount: 0,
  },
  {
    id: 'sg-sea',
    name: '敬城-东南亚组',
    region: 'South-East Asia',
    timezone: 'Asia/Singapore',
    department: '海外营销二部',
    leader: 'Wei Chen',
    leader_avatar: 'WC',
    memberCount: 10,
    agentInstanceCount: 0,
  },
]

export const CURRENT_SALES_GROUP_ID = 'sg-na'
