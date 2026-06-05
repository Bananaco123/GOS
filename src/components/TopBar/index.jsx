import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, Badge, Dropdown, Avatar, Popover, List, Tag, Empty, Tooltip, App } from 'antd'
import {
  SearchOutlined, BellOutlined, UserOutlined, LogoutOutlined,
  SettingOutlined, SwapOutlined,
} from '@ant-design/icons'

import { useAuth, DEMO_IDENTITIES } from '../../auth/AuthContext'
import { deptName } from '../../mock/org'

import './topbar.css'

const MOCK_NOTIFICATIONS = [
  {
    id: 'n-1',
    type: 'warning',
    title: '转人工待接管：客户情绪异常',
    desc: 'Agent「敬城-北美-正式接待」命中「客户情绪异常」规则，已通知 Aril / COCO，请尽快接管',
    time: '3 分钟前',
  },
  {
    id: 'n-2',
    type: 'info',
    title: '线索转派提醒',
    desc: '一条 A 级线索已从「敬城-北美组」转派给你，请在 15 分钟内响应',
    time: '12 分钟前',
  },
  {
    id: 'n-3',
    type: 'danger',
    title: '转人工超时预警',
    desc: '规则「客户要求转人工」命中后超过 5 分钟未响应，已升级通知组长',
    time: '28 分钟前',
  },
  {
    id: 'n-4',
    type: 'success',
    title: 'Agent 配置 v.13 已正式发布',
    desc: '发布人 Gao Kui · 在途会话沿用旧版，新会话立即生效',
    time: '昨日 16:08',
  },
]

const TYPE_COLOR = { danger: 'red', warning: 'orange', info: 'blue', success: 'green' }
const TYPE_LABEL = { danger: '严重', warning: '待办', info: '通知', success: '已完成' }

export default function TopBar() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { user, role, login, logout } = useAuth()
  const [searchOpen, setSearchOpen] = useState(false)
  const [unread, setUnread] = useState(MOCK_NOTIFICATIONS.length)

  const handleLogout = () => {
    logout()
    message.success('已退出登录')
    navigate('/login', { replace: true })
  }

  const switchIdentity = (uid) => {
    login(uid)
    navigate('/home')
    message.success('已切换演示身份')
  }

  const notificationContent = (
    <div className="gb-topbar-notification">
      <div className="gb-topbar-notification-head">
        <span className="gb-topbar-notification-title">最近通知</span>
        <a onClick={() => setUnread(0)}>全部标为已读</a>
      </div>
      <List
        dataSource={MOCK_NOTIFICATIONS}
        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无通知" /> }}
        renderItem={(item) => (
          <List.Item className="gb-topbar-notification-item">
            <div className="gb-topbar-notification-item-inner">
              <Tag color={TYPE_COLOR[item.type]} style={{ marginRight: 8, marginBottom: 0 }}>
                {TYPE_LABEL[item.type]}
              </Tag>
              <div className="gb-topbar-notification-item-body">
                <div className="gb-topbar-notification-item-title">{item.title}</div>
                <div className="gb-topbar-notification-item-desc">{item.desc}</div>
                <div className="gb-topbar-notification-item-time">{item.time}</div>
              </div>
            </div>
          </List.Item>
        )}
      />
      <div className="gb-topbar-notification-foot">
        <a>查看全部通知</a>
      </div>
    </div>
  )

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '个人中心' },
    { key: 'settings', icon: <SettingOutlined />, label: '设置', onClick: () => navigate('/settings') },
    {
      key: 'switch',
      icon: <SwapOutlined />,
      label: '切换演示身份',
      children: DEMO_IDENTITIES.map((d) => ({
        key: d.userId,
        label: d.label,
        onClick: () => switchIdentity(d.userId),
      })),
    },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true, onClick: handleLogout },
  ]

  return (
    <header className="gb-topbar">
      <div className="gb-topbar-left" onClick={() => navigate('/home')}>
        <div className="gb-topbar-logo">G</div>
        <div className="gb-topbar-brand">
          <div className="gb-topbar-brand-name">G-Builder OS</div>
          <div className="gb-topbar-brand-version">V1.0</div>
        </div>
      </div>

      <div className="gb-topbar-search">
        <Input
          prefix={<SearchOutlined style={{ color: 'var(--gb-text-muted)' }} />}
          placeholder="搜索"
          allowClear
          onFocus={() => setSearchOpen(true)}
          onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
          style={{ background: 'var(--gb-bg-secondary)', border: 'none', height: 36, borderRadius: 8 }}
        />
        {searchOpen && (
          <div className="gb-topbar-search-dropdown">
            <div className="gb-topbar-search-section">
              <div className="gb-topbar-search-section-title">最近搜索</div>
              <div className="gb-topbar-search-chip">敬城-北美-正式接待</div>
              <div className="gb-topbar-search-chip">角色与权限</div>
              <div className="gb-topbar-search-chip">部门与用户</div>
            </div>
          </div>
        )}
      </div>

      <div className="gb-topbar-right">
        <Popover
          content={notificationContent}
          trigger="click"
          placement="bottomRight"
          overlayClassName="gb-topbar-notification-popover"
        >
          <Tooltip title="通知">
            <div className="gb-topbar-icon-btn">
              <Badge count={unread} size="small" offset={[-2, 2]}>
                <BellOutlined style={{ fontSize: 18 }} />
              </Badge>
            </div>
          </Tooltip>
        </Popover>

        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
          <div className="gb-topbar-user">
            <Avatar size={32} style={{ background: 'var(--gb-primary)' }}>
              {user?.avatar || 'U'}
            </Avatar>
            <div className="gb-topbar-user-info">
              <div className="gb-topbar-user-name">{user?.name || '未登录'}</div>
              <div className="gb-topbar-user-role">
                {role?.name || '-'} · {deptName(user?.dept_id)}
              </div>
            </div>
          </div>
        </Dropdown>
      </div>
    </header>
  )
}
