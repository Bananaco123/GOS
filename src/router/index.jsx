import { createBrowserRouter, Navigate } from 'react-router-dom'

import AppShell from '../layouts/AppShell'
import SettingsLayout from '../layouts/SettingsLayout'
import PlaceholderPage from '../pages/Placeholder'
import RequireAuth from '../auth/RequireAuth'
import RequirePerm from '../auth/RequirePerm'

import LoginPage from '../pages/Login'
import HomePage from '../pages/Home'
import ScrmWorkbench from '../pages/Scrm'
import LeadAssignmentPage from '../pages/Conversation/LeadAssignment'
import HandoverPage from '../pages/Conversation/Handover'
import AgentList from '../pages/Agent/AgentList'
import AgentSalesRep from '../pages/Agent/SalesRep'
import KnowledgeBase from '../pages/Knowledge'
import LibraryDetail from '../pages/Knowledge/LibraryDetail'

import Members from '../pages/Settings/Members'
import Roles from '../pages/Settings/Roles'
import SystemLog from '../pages/Settings/SystemLog'
import CenterPlaceholder from '../pages/Settings/CenterPlaceholder'

/**
 * 路由（v8）
 *   - /login 独立登录页（外壳之外）
 *   - / 业务外壳（需登录）：首页 + AI 业务员 + 知识库 + 占位入口
 *   - /settings 设置中心外壳（需登录 + 页面级权限）：组织架构
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

      // ---- 占位入口 ----
      { path: 'scrm', element: <RequirePerm perm="scrm.view"><ScrmWorkbench /></RequirePerm> },
      { path: 'conversation/lead-assignment', element: <RequirePerm perm="conversation-lead.view"><LeadAssignmentPage /></RequirePerm> },
      { path: 'conversation/handover', element: <RequirePerm perm="conversation-handover.view"><HandoverPage /></RequirePerm> },
      { path: 'agent/sales-king', element: <PlaceholderPage navKey="sales-king" /> },

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
      { path: 'scrm/cloud-accounts', element: <RequirePerm perm="settings-cloud-accounts.view"><CenterPlaceholder type="cloudAccounts" /></RequirePerm> },
      { path: 'org/members', element: <RequirePerm perm="settings-members.view"><Members /></RequirePerm> },
      { path: 'org/roles', element: <RequirePerm perm="settings-roles.view"><Roles /></RequirePerm> },
      { path: 'org/logs', element: <RequirePerm perm="settings-log.view"><SystemLog /></RequirePerm> },
      { path: '*', element: <Navigate to="/settings/org/members" replace /> },
    ],
  },
], {
  // GitHub Pages 项目站点子路径（仓库名 jingchengjituan）
  basename: import.meta.env.BASE_URL,
})
