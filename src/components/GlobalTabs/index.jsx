import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CloseOutlined, AppstoreOutlined } from '@ant-design/icons'

import { NAV_TOP, NAV_BOTTOM } from '../../router/nav'
import { SETTINGS_TITLES } from '../../router/settingsNav'
import { store } from '../../mock/store'

import './global-tabs.css'

/**
 * 顶部多标签页（tagsView）
 *
 * - 位于顶栏（含搜索框）下方的通用组件
 * - 每访问一个页面（按 pathname 去重）自动开一个标签
 * - 点击标签切换；关闭标签移除；关闭当前标签后回退到相邻标签
 * - 首个标签固定不可关闭（保证至少有一个落点）
 */

// 路由 → 标签标题解析
function resolveTitle(pathname) {
  const allNav = [...NAV_TOP, ...NAV_BOTTOM]

  // 首页 / 设置中心固定标题
  if (SETTINGS_TITLES[pathname]) return SETTINGS_TITLES[pathname]

  // Agent 详情：展示 Agent 实例名
  const agentMatch = pathname.match(/^\/agent\/sales-rep\/([^/]+)$/)
  if (agentMatch) {
    const found = store.getAgent(agentMatch[1])
    return found ? found.display_name : 'AI 业务员详情'
  }

  // 命中导航配置
  for (const node of allNav) {
    if (node.kind === 'item') {
      if (pathname === node.path || pathname.startsWith(node.path + '/')) return node.label
    }
    if (node.kind === 'group') {
      for (const sub of node.items) {
        if (pathname === sub.path || pathname.startsWith(sub.path + '/')) return sub.label
      }
    }
  }
  // 兜底：末段
  const seg = pathname.split('/').filter(Boolean).pop()
  return seg || '首页'
}

export default function GlobalTabs({ tabs, setTabs }) {
  const location = useLocation()
  const navigate = useNavigate()
  const scrollRef = useRef(null)

  const activePath = location.pathname

  // 路由变化时：确保当前页有标签（并刷新标题，便于异步加载的 Agent 名生效）
  useEffect(() => {
    const label = resolveTitle(location.pathname)
    setTabs((prev) => {
      const exist = prev.find((t) => t.path === location.pathname)
      if (exist) {
        if (exist.label !== label) {
          return prev.map((t) => (t.path === location.pathname ? { ...t, label } : t))
        }
        return prev
      }
      return [...prev, { path: location.pathname, label }]
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  const handleClose = (e, path) => {
    e.stopPropagation()
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.path === path)
      const next = prev.filter((t) => t.path !== path)
      // 关掉的是当前标签 → 跳到相邻标签
      if (path === activePath) {
        if (next.length) {
          const fallback = next[Math.max(0, idx - 1)]
          navigate(fallback.path)
        } else {
          navigate('/agent/sales-rep')
        }
      }
      return next
    })
  }

  if (tabs.length === 0) return null

  return (
    <div className="gb-global-tabs">
      <div className="gb-global-tabs-icon">
        <AppstoreOutlined />
      </div>
      <div className="gb-global-tabs-scroll" ref={scrollRef}>
        {tabs.map((tab, idx) => {
          const isActive = tab.path === activePath
          const closable = tabs.length > 1 && idx !== 0
          return (
            <div
              key={tab.path}
              className={`gb-global-tab ${isActive ? 'is-active' : ''}`}
              onClick={() => navigate(tab.path)}
              title={tab.label}
            >
              {isActive && <span className="gb-global-tab-dot" />}
              <span className="gb-global-tab-label">{tab.label}</span>
              {closable && (
                <span
                  className="gb-global-tab-close"
                  onClick={(e) => handleClose(e, tab.path)}
                  aria-label="关闭标签"
                >
                  <CloseOutlined />
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
