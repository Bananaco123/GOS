import { createBrowserRouter, Navigate } from 'react-router-dom'

import AppShell from '../layouts/AppShell'
import SettingsLayout from '../layouts/SettingsLayout'
import PlaceholderPage from '../pages/Placeholder'
import RequireAuth from '../auth/RequireAuth'
import RequirePerm from '../auth/RequirePerm'

import LoginPage from '../pages/Login'
import HomePage from '../pages/Home'
import AgentList from '../pages/Agent/AgentList'
import AgentSalesRep from '../pages/Agent/SalesRep'
import KnowledgeBase from '../pages/Knowledge'
import LibraryDetail from '../pages/Knowledge/LibraryDetail'
import ScrmWorkbench from '../pages/Scrm'

import Members from '../pages/Settings/Members'
import Roles from '../pages/Settings/Roles'
import CenterPlaceholder from '../pages/Settings/CenterPlaceholder'

/**
 * 路由（v8）
 *   - /login 独立登录页（外壳之外）
 *   - / 业务外壳（需登录）：首页 + AI 业务员 + 知识库 + 占位入口
 *   - /settings 设置中心外壳（需登录 + 页面级权限）：组织架构 / 产品中心 / 费用中心
 */
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },

  {
    path: '/',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      { path: 'home', element: <HomePage /> },

      // ---- 真实页面（本期 PRD 范围） ----
      { path: 'agent/sales-rep', element: <RequirePerm perm="agent-sales-rep.view"><AgentList /></RequirePerm> },
      { path: 'agent/sales-rep/:agentId', element: <RequirePerm perm="agent-sales-rep.view"><AgentSalesRep /></RequirePerm> },
      { path: 'knowledge', element: <RequirePerm perm="knowledge.view"><KnowledgeBase /></RequirePerm> },
      { path: 'knowledge/lib/:libraryId', element: <RequirePerm perm="knowledge.view"><LibraryDetail /></RequirePerm> },
      { path: 'scrm', element: <ScrmWorkbench /> },

      // ---- 占位入口 ----
      { path: 'workbench', element: <PlaceholderPage navKey="workbench" /> },
      { path: 'conversation/lead-assignment', element: <PlaceholderPage navKey="lead" /> },
      { path: 'conversation/handover', element: <PlaceholderPage navKey="handover" /> },
      { path: 'agent/sales-king', element: <PlaceholderPage navKey="sales-king" /> },
      { path: 'dashboard/pm', element: <PlaceholderPage navKey="pm" /> },
      { path: 'dashboard/department', element: <PlaceholderPage navKey="dept" /> },

      { path: '*', element: <Navigate to="/home" replace /> },
    ],
  },

  {
    path: '/settings',
    element: (
      <RequireAuth>
        <SettingsLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/settings/org/members" replace /> },
      { path: 'org/members', element: <RequirePerm perm="settings-members.view"><Members /></RequirePerm> },
      { path: 'org/roles', element: <RequirePerm perm="settings-roles.view"><Roles /></RequirePerm> },
      { path: 'product', element: <RequirePerm perm="settings-product.view"><CenterPlaceholder type="product" /></RequirePerm> },
      { path: 'billing', element: <RequirePerm perm="settings-billing.view"><CenterPlaceholder type="billing" /></RequirePerm> },
      { path: '*', element: <Navigate to="/settings/org/members" replace /> },
    ],
  },
], {
  // GitHub Pages 项目站点子路径（仓库名 jingchengjituan）
  basename: import.meta.env.BASE_URL,
})
