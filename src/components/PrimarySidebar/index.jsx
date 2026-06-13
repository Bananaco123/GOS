import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Badge, Tooltip } from 'antd'
import {
  MessageOutlined,
  SettingOutlined,
  RobotOutlined,
  BookOutlined,
  TeamOutlined,
  SwapOutlined,
  CrownOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'

import { NAV_TOP, NAV_BOTTOM, BADGE_COLOR } from '../../router/nav'
import { useAuth } from '../../auth/AuthContext'
import './sidebar.css'

const ICON_MAP = {
  chat: <MessageOutlined />,
  setting: <SettingOutlined />,
  scrm: <MessageOutlined />,
  lead: <TeamOutlined />,
  handover: <SwapOutlined />,
  'sales-rep': <RobotOutlined />,
  'sales-king': <CrownOutlined />,
  kb: <BookOutlined />,
}

const ICON_COLOR = {
  scrm: '#1A4D8F',
  lead: '#00A3B4',
  handover: '#E59B26',
  'sales-rep': '#2E7BD6',
  'sales-king': '#8B5CF6',
  kb: '#10A86A',
  settings: '#64748B',
}

const getItemIcon = (item) => {
  if (item.icon && ICON_MAP[item.icon]) return ICON_MAP[item.icon]
  return ICON_MAP[item.key] || null
}

const isActive = (path, current) => {
  if (path === current) return true
  if (path !== '/' && current.startsWith(path + '/')) return true
  return false
}

export default function PrimarySidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { hasMenu } = useAuth()
  const current = location.pathname
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('gb-sidebar-collapsed') === '1')

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('gb-sidebar-collapsed', next ? '1' : '0')
      return next
    })
  }

  const renderTopItem = (item) => {
    const active = isActive(item.path, current)
    const hasSub = !!item.sub
    return (
      <div
        key={item.key}
        className={`gb-sidebar-item ${hasSub ? 'has-sub' : ''} ${active ? 'is-active' : ''}`}
        onClick={() => navigate(item.path)}
      >
        {active && <span className="gb-sidebar-bar" />}
        <span className="gb-sidebar-icon">{getItemIcon(item)}</span>
        <span className="gb-sidebar-text">
          <span className="gb-sidebar-label">{item.label}</span>
          {item.sub && <span className="gb-sidebar-sub">{item.sub}</span>}
        </span>
      </div>
    )
  }

  const renderSubItem = (parent, sub) => {
    const active = isActive(sub.path, current)
    const disabled = sub.inScope === false
    return (
      <div
        key={sub.key}
        className={`gb-sidebar-sub-item ${active ? 'is-active' : ''}`}
        onClick={() => navigate(sub.path)}
      >
        {active && <span className="gb-sidebar-bar" />}
        <span className="gb-sidebar-sub-label">{sub.label}</span>
        {sub.badge && (
          <Badge
            count={sub.badge}
            size="small"
            color={BADGE_COLOR[sub.badgeColor] || BADGE_COLOR.default}
            style={{ boxShadow: 'none' }}
          />
        )}
        {disabled && (
          <Tooltip title="本期 PRD 范围外 · 占位入口">
            <span className="gb-sidebar-scope-dot" />
          </Tooltip>
        )}
      </div>
    )
  }

  const visibleTopItems = NAV_TOP.flatMap((node) => {
    if (node.kind === 'item') return hasMenu(node.key) ? [node] : []
    if (node.kind === 'group') return node.items.filter((sub) => hasMenu(sub.key))
    return []
  })

  const renderCollapsedItem = (item) => {
    const active = isActive(item.path, current)
    const disabled = item.inScope === false && item.key !== 'settings'
    const icon = getItemIcon(item)
    return (
      <Tooltip key={item.key} title={item.label} placement="right">
        <button
          type="button"
          className={`gb-sidebar-mini-item ${active ? 'is-active' : ''}`}
          style={{ '--item-color': ICON_COLOR[item.key] || '#1A4D8F' }}
          onClick={() => navigate(item.path)}
          aria-label={item.label}
        >
          {active && <span className="gb-sidebar-bar" />}
          <Badge
            count={item.badge}
            size="small"
            color={BADGE_COLOR[item.badgeColor] || BADGE_COLOR.default}
            style={{ boxShadow: 'none' }}
          >
            <span className="gb-sidebar-mini-logo">{icon}</span>
          </Badge>
          {disabled && <span className="gb-sidebar-mini-dot" />}
        </button>
      </Tooltip>
    )
  }

  return (
    <aside className={`gb-sidebar ${collapsed ? 'is-collapsed' : ''}`}>
      {/* 顶部菜单区（按角色权限隐藏无权限菜单） */}
      <div className={collapsed ? 'gb-sidebar-mini-scroll' : 'gb-sidebar-scroll'}>
        {collapsed ? visibleTopItems.map(renderCollapsedItem) : (
          NAV_TOP.map((node) => {
            if (node.kind === 'item') {
              return hasMenu(node.key) ? renderTopItem(node) : null
            }
            if (node.kind === 'group') {
              const items = node.items.filter((sub) => hasMenu(sub.key))
              if (items.length === 0) return null
              return (
                <div key={node.key} className="gb-sidebar-group">
                  <div className="gb-sidebar-group-title">{node.label}</div>
                  {items.map((sub) => renderSubItem(node, sub))}
                </div>
              )
            }
            return null
          })
        )}
      </div>

      {/* 底部固定区 */}
      <div className="gb-sidebar-bottom">
        <div className="gb-sidebar-bottom-row">
          {NAV_BOTTOM.map((node) => (
            collapsed ? renderCollapsedItem(node) : renderTopItem(node)
          ))}
          <Tooltip title={collapsed ? '展开侧边栏' : '收起侧边栏'} placement={collapsed ? 'right' : 'top'}>
            <button type="button" className="gb-sidebar-collapse-btn" onClick={toggleCollapsed} aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}>
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </button>
          </Tooltip>
        </div>
      </div>
    </aside>
  )
}
