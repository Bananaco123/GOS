import { useLocation, useNavigate } from 'react-router-dom'
import { Breadcrumb as AntdBreadcrumb } from 'antd'
import { NAV_TOP, NAV_BOTTOM } from '../../router/nav'
import { SETTINGS_NAV } from '../../router/settingsNav'
import { store } from '../../mock/store'

import './breadcrumb.css'

const ROOT = 'G-Builder OS'

/**
 * 根据当前 pathname 推断面包屑路径
 * 输出形如：G-Builder OS / AGENT / AI 业务员 / 接待要素
 */
function resolveBreadcrumb(pathname) {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return [{ label: ROOT, path: null }]

  // 首页
  if (pathname === '/home') return [{ label: ROOT, path: '/home' }, { label: '系统首页', path: null }]

  // 设置中心
  if (pathname === '/settings' || pathname.startsWith('/settings/')) {
    const res = [{ label: ROOT, path: '/home' }, { label: '设置中心', path: null }]
    for (const group of SETTINGS_NAV) {
      for (const it of group.items) {
        if (pathname === it.path || pathname.startsWith(it.path + '/')) {
          res.push({ label: group.group, path: null })
          res.push({ label: it.label, path: null })
          return res
        }
      }
    }
    return res
  }

  const allNav = [...NAV_TOP, ...NAV_BOTTOM]
  let result = [{ label: ROOT, path: '/' }]

  // 一级菜单
  for (const node of allNav) {
    if (node.kind === 'item') {
      if (pathname === node.path || pathname.startsWith(node.path + '/')) {
        result.push({ label: node.label, path: node.path })
        // 二级（仅 AGENT/sales-rep + knowledge 有内嵌 tab）
        if (pathname.startsWith(node.path + '/')) {
          // sub-route 比如 /knowledge/entries
          const rest = pathname.slice(node.path.length + 1)
          if (rest) result.push({ label: rest, path: null, isSub: true })
        }
        return result
      }
    }
    if (node.kind === 'group') {
      for (const sub of node.items) {
        if (pathname === sub.path || pathname.startsWith(sub.path + '/')) {
          result.push({ label: node.label, path: null })
          result.push({ label: sub.label, path: sub.path })
          if (pathname.startsWith(sub.path + '/')) {
            const rest = pathname.slice(sub.path.length + 1)
            if (rest) result.push({ label: rest, path: null, isSub: true })
          }
          return result
        }
      }
    }
  }
  return result
}

const SUB_ROUTE_LABEL = {
  basic: '基础配置',
  strategy: '接待策略',
  grading: '线索评级',
  handoff: '转人工',
  versions: '版本管理',
  entries: '知识条目',
  references: 'Agent 引用关系',
}

/**
 * 二级路径片段 → 显示标签
 * - 命中 SUB_ROUTE_LABEL 字典 → 直接用
 * - 命中 agent-xxx 这种 Agent 实例 ID → 查 store 拿 display_name
 * - 否则原样显示
 */
function labelizeSub(slug) {
  if (SUB_ROUTE_LABEL[slug]) return SUB_ROUTE_LABEL[slug]
  if (slug.startsWith('agent-')) {
    const found = store.getAgent(slug)
    if (found) return found.display_name
  }
  return slug
}

export default function Breadcrumb() {
  const location = useLocation()
  const navigate = useNavigate()
  const items = resolveBreadcrumb(location.pathname)

  return (
    <div className="gb-breadcrumb">
      <AntdBreadcrumb
        items={items.map((it) => {
          const label = it.isSub ? labelizeSub(it.label) : it.label
          return {
            title: it.path ? <a onClick={() => navigate(it.path)}>{label}</a> : label,
          }
        })}
      />
    </div>
  )
}
