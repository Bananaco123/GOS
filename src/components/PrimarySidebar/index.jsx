import { useNavigate, useLocation } from 'react-router-dom'
import { Badge, Tooltip } from 'antd'
import {
  HomeOutlined,
  MessageOutlined,
  SettingOutlined,
  RobotOutlined,
  BookOutlined,
  TeamOutlined,
  SwapOutlined,
  UserOutlined,
  CrownOutlined,
  BarChartOutlined,
  ApartmentOutlined,
} from '@ant-design/icons'

import { NAV_TOP, NAV_BOTTOM, BADGE_COLOR } from '../../router/nav'
import { useAuth } from '../../auth/AuthContext'
import './sidebar.css'

const ICON_MAP = {
  home: <HomeOutlined />,
  chat: <MessageOutlined />,
  setting: <SettingOutlined />,
  lead: <TeamOutlined />,
  handover: <SwapOutlined />,
  'sales-rep': <RobotOutlined />,
  'sales-king': <CrownOutlined />,
  pm: <UserOutlined />,
  dept: <ApartmentOutlined />,
  kb: <BookOutlined />,
  dashboard: <BarChartOutlined />,
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

  return (
    <aside className="gb-sidebar">
      {/* 顶部菜单区（按角色权限隐藏无权限菜单） */}
      <div className="gb-sidebar-scroll">
        {NAV_TOP.map((node) => {
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
        })}
      </div>

      {/* 底部固定区 */}
      <div className="gb-sidebar-bottom">
        {NAV_BOTTOM.map((node) => renderTopItem(node))}
      </div>
    </aside>
  )
}
