import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Tooltip } from 'antd'
import {
  ApartmentOutlined, SafetyCertificateOutlined,
  AppstoreOutlined, WalletOutlined, ArrowLeftOutlined,
} from '@ant-design/icons'

import TopBar from '../components/TopBar'
import GlobalTabs from '../components/GlobalTabs'
import Breadcrumb from '../components/Breadcrumb'
import { SETTINGS_NAV } from '../router/settingsNav'
import { useAuth } from '../auth/AuthContext'
import { useGlobalTabs } from './tabsState'

import './app-shell.css'
import './settings-layout.css'
import '../pages/Settings/settings.css'

const ITEM_ICON = {
  'set-members': <ApartmentOutlined />,
  'set-roles': <SafetyCertificateOutlined />,
  'set-product': <AppstoreOutlined />,
  'set-billing': <WalletOutlined />,
}

export default function SettingsLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { hasMenu } = useAuth()
  const { tabs, setTabs } = useGlobalTabs()
  const current = location.pathname

  return (
    <div className="gb-shell">
      <TopBar />
      <div className="gb-shell-body">
        <aside className="gb-settings-sidebar">
          <div className="gb-settings-sidebar-head" onClick={() => navigate('/home')}>
            <ArrowLeftOutlined />
            <span>设置中心</span>
          </div>
          <div className="gb-settings-sidebar-scroll">
            {SETTINGS_NAV.map((group) => {
              const items = group.items.filter((it) => hasMenu(it.key))
              if (items.length === 0) return null
              return (
                <div key={group.group} className="gb-settings-group">
                  <div className="gb-settings-group-title">{group.group}</div>
                  {items.map((it) => {
                    const active = current === it.path || current.startsWith(it.path + '/')
                    return (
                      <div
                        key={it.key}
                        className={`gb-settings-item ${active ? 'is-active' : ''}`}
                        onClick={() => navigate(it.path)}
                      >
                        {active && <span className="gb-settings-bar" />}
                        <span className="gb-settings-item-icon">{ITEM_ICON[it.key]}</span>
                        <span>{it.label}</span>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </aside>
        <main className="gb-shell-main">
          <GlobalTabs tabs={tabs} setTabs={setTabs} />
          <Breadcrumb />
          <div className="gb-shell-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
