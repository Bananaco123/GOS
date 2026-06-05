/**
 * 组织架构 Mock（来源：2.0 系统，营销 OS 只读展示）
 *
 * 按「OS-基础架构-需求分析 v1」：
 *   - 部门、用户、账号状态、离职/停用状态来自 2.0，营销 OS 不本地维护
 *   - 离职 / 停用用户继续展示并明确标识，不允许重新分配角色
 *   - 新账号默认角色为「普通用户」
 */

// ============================================================
// 部门树（2.0）
// ============================================================
export const DEPARTMENTS = [
  {
    id: 'd-root',
    name: '敬城集团',
    parent_id: null,
    children: [
      {
        id: 'd-overseas',
        name: '海外营销中心',
        parent_id: 'd-root',
        children: [
          { id: 'd-os-1', name: '海外营销一部', parent_id: 'd-overseas' },
          { id: 'd-os-2', name: '海外营销二部', parent_id: 'd-overseas' },
        ],
      },
      {
        id: 'd-product',
        name: '产品研发中心',
        parent_id: 'd-root',
        children: [
          { id: 'd-pd-1', name: '平台研发部', parent_id: 'd-product' },
        ],
      },
      { id: 'd-func', name: '职能中心', parent_id: 'd-root' },
    ],
  },
]

// 扁平化部门（含全路径）
export const DEPARTMENTS_FLAT = (() => {
  const out = []
  const walk = (nodes, path) => {
    nodes.forEach((n) => {
      const full = path ? `${path} / ${n.name}` : n.name
      out.push({ id: n.id, name: n.name, parent_id: n.parent_id, path: full })
      if (n.children?.length) walk(n.children, full)
    })
  }
  walk(DEPARTMENTS, '')
  return out
})()

export const deptName = (id) => DEPARTMENTS_FLAT.find((d) => d.id === id)?.name || id
export const deptPath = (id) => DEPARTMENTS_FLAT.find((d) => d.id === id)?.path || id

// ============================================================
// 用户（2.0）· status: active 在职 / resigned 离职 / disabled 停用
// ============================================================
export const USERS = [
  { id: 'u-gao', name: 'Gao Kui', avatar: 'GK', account: 'gaokui@okgroup.com', phone: '138 0013 8001', dept_id: 'd-os-1', title: 'PM · 部门管理员', status: 'active', role_id: 'role-super', joined_at: '2024-03-01' },
  { id: 'u-mike', name: 'Mike Liu', avatar: 'ML', account: 'mikeliu@okgroup.com', phone: '138 0013 8002', dept_id: 'd-os-1', title: '北美组组长', status: 'active', role_id: 'role-dept-admin', joined_at: '2024-05-12' },
  { id: 'u-linda', name: 'Linda Chen', avatar: 'LC', account: 'linda@okgroup.com', phone: '138 0013 8003', dept_id: 'd-os-1', title: '销售助理', status: 'active', role_id: 'role-normal', joined_at: '2025-01-08' },
  { id: 'u-james', name: 'James Lin', avatar: 'JL', account: 'james@okgroup.com', phone: '138 0013 8004', dept_id: 'd-os-1', title: '销售助理', status: 'active', role_id: 'role-normal', joined_at: '2025-02-18' },
  { id: 'u-sara', name: 'Sara Wang', avatar: 'SW', account: 'sara@okgroup.com', phone: '138 0013 8005', dept_id: 'd-os-1', title: '销售助理', status: 'active', role_id: 'role-kb-admin', joined_at: '2025-03-22' },
  { id: 'u-hassan', name: 'Hassan Al', avatar: 'HA', account: 'hassan@okgroup.com', phone: '138 0013 8006', dept_id: 'd-os-1', title: '中东组组长', status: 'active', role_id: 'role-dept-admin', joined_at: '2024-08-30' },
  { id: 'u-wei', name: 'Wei Chen', avatar: 'WC', account: 'weichen@okgroup.com', phone: '138 0013 8007', dept_id: 'd-os-2', title: '东南亚组组长', status: 'active', role_id: 'role-dept-admin', joined_at: '2024-09-15' },
  { id: 'u-coco', name: 'COCO', avatar: 'CC', account: 'coco@okgroup.com', phone: '138 0013 8008', dept_id: 'd-os-2', title: '销售助理', status: 'active', role_id: 'role-normal', joined_at: '2025-04-01' },
  { id: 'u-lili', name: 'LILI', avatar: 'LL', account: 'lili@okgroup.com', phone: '138 0013 8009', dept_id: 'd-os-2', title: '销售助理', status: 'active', role_id: 'role-normal', joined_at: '2025-04-10' },
  { id: 'u-eric', name: 'Eric Zhao', avatar: 'EZ', account: 'eric@okgroup.com', phone: '138 0013 8010', dept_id: 'd-os-1', title: '销售助理', status: 'resigned', role_id: 'role-normal', joined_at: '2024-06-01' },
  { id: 'u-vivian', name: 'Vivian Tan', avatar: 'VT', account: 'vivian@okgroup.com', phone: '138 0013 8011', dept_id: 'd-os-2', title: '销售助理', status: 'disabled', role_id: 'role-normal', joined_at: '2024-11-20' },
  { id: 'u-dev', name: 'Frank Wu', avatar: 'FW', account: 'frank@okgroup.com', phone: '138 0013 8012', dept_id: 'd-pd-1', title: '平台研发', status: 'active', role_id: 'role-normal', joined_at: '2024-04-18' },
]

export const USER_STATUS = {
  active: { label: '在职', color: 'green' },
  resigned: { label: '离职', color: 'default' },
  disabled: { label: '停用', color: 'red' },
}

export const userById = (id) => USERS.find((u) => u.id === id)
