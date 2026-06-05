import { Outlet, useLocation } from 'react-router-dom'

import TopBar from '../components/TopBar'
import PrimarySidebar from '../components/PrimarySidebar'
import Breadcrumb from '../components/Breadcrumb'
import GlobalTabs from '../components/GlobalTabs'
import { useGlobalTabs } from './tabsState'

import './app-shell.css'

/**
 * G-Builder OS · 业务外壳
 *   顶部 TopBar（含搜索框）→ 多标签页 GlobalTabs → 左侧主菜单 + 主区（面包屑 + 内容）
 */
export default function AppShell() {
  const location = useLocation()
  const { tabs, setTabs } = useGlobalTabs()

  const hideBreadcrumb = location.pathname.startsWith('/scrm')

  return (
    <div className="gb-shell">
      <TopBar />
      <div className="gb-shell-body">
        <PrimarySidebar />
        <main className="gb-shell-main">
          <GlobalTabs tabs={tabs} setTabs={setTabs} />
          {!hideBreadcrumb && <Breadcrumb />}
          <div className="gb-shell-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
