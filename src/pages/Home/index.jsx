import { useNavigate } from 'react-router-dom'
import { Avatar, Tag, Tooltip } from 'antd'
import {
  RobotOutlined, BookOutlined, ApartmentOutlined, SafetyCertificateOutlined,
  AppstoreOutlined, WalletOutlined, ArrowRightOutlined, MessageOutlined,
} from '@ant-design/icons'

import { useAuth } from '../../auth/AuthContext'
import { dataScopeLabel } from '../../mock/rbac'
import { deptName } from '../../mock/org'
import './home.css'

const ENTRIES = [
  { key: 'sales-rep', title: 'AI 业务员', desc: '配置 Agent 接待策略、线索评级、转人工与知识库引用', icon: <RobotOutlined />, path: '/agent/sales-rep', perm: 'agent-sales-rep.view', color: '#1A4D8F' },
  { key: 'kb', title: '知识库', desc: '维护 FAQ / SOP / 产品资料，供 Agent 召回引用', icon: <BookOutlined />, path: '/knowledge', perm: 'knowledge.view', color: '#10A86A' },
  { key: 'members', title: '部门与用户', desc: '只读查看来自 2.0 的组织架构与账号状态', icon: <ApartmentOutlined />, path: '/settings/org/members', perm: 'settings-members.view', color: '#2E7BD6' },
  { key: 'roles', title: '角色与权限', desc: '配置角色的数据权限与功能权限，权限即时生效', icon: <SafetyCertificateOutlined />, path: '/settings/org/roles', perm: 'settings-roles.view', color: '#7C3AED' },
  { key: 'product', title: '产品中心', desc: '后续承接产品购买与模块开通（规划中）', icon: <AppstoreOutlined />, path: '/settings/product', perm: 'settings-product.view', color: '#E59B26' },
  { key: 'billing', title: '费用中心', desc: '后续承接额度、消耗、账单与结算（规划中）', icon: <WalletOutlined />, path: '/settings/billing', perm: 'settings-billing.view', color: '#0E7C7B' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { user, role, hasPerm } = useAuth()

  const visibleEntries = ENTRIES.filter((e) => !e.perm || hasPerm(e.perm))

  return (
    <div className="gb-home">
      {/* 欢迎横幅 */}
      <div className="gb-home-hero">
        <div className="gb-home-hero-inner">
          <Avatar size={56} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', fontSize: 22, fontWeight: 600 }}>
            {user?.avatar}
          </Avatar>
          <div style={{ flex: 1 }}>
            <h1 className="gb-home-hero-title">你好，{user?.name} 👋</h1>
            <div className="gb-home-hero-meta">
              <span>{user?.title}</span>
              <span className="gb-home-dot">·</span>
              <span>{deptName(user?.dept_id)}</span>
              <Tag color="blue" style={{ marginLeft: 8 }}>{role?.name}</Tag>
              <Tooltip title="该角色的数据权限范围">
                <Tag color="geekblue">数据范围：{dataScopeLabel(role?.data_scope)}</Tag>
              </Tooltip>
            </div>
          </div>
        </div>
        <p className="gb-home-hero-sub">
          欢迎使用 G-Builder OS 营销操作系统。这里是统一的登录入口与系统首页，下方为你有权限访问的功能入口。
        </p>
      </div>

      {/* 功能入口 */}
      <h2 className="gb-home-section-title">快捷入口</h2>
      <div className="gb-home-grid">
        {visibleEntries.map((e) => (
          <div key={e.key} className="gb-home-card" onClick={() => navigate(e.path)}>
            <div className="gb-home-card-icon" style={{ background: `${e.color}14`, color: e.color }}>
              {e.icon}
            </div>
            <div className="gb-home-card-body">
              <div className="gb-home-card-title">{e.title}</div>
              <div className="gb-home-card-desc">{e.desc}</div>
            </div>
            <ArrowRightOutlined className="gb-home-card-arrow" />
          </div>
        ))}
      </div>

      {/* 系统说明 */}
      <h2 className="gb-home-section-title" style={{ marginTop: 28 }}>关于 G-Builder OS 基础架构</h2>
      <div className="gb-home-about">
        <div className="gb-home-about-item">
          <MessageOutlined style={{ color: 'var(--gb-primary)' }} />
          <div>
            <div className="gb-home-about-title">统一身份与登录</div>
            <div className="gb-home-about-desc">账号密码 / 企业微信登录，组织与账号信息实时来自 2.0 系统，营销 OS 只读展示。</div>
          </div>
        </div>
        <div className="gb-home-about-item">
          <SafetyCertificateOutlined style={{ color: 'var(--gb-primary)' }} />
          <div>
            <div className="gb-home-about-title">角色 · 权限 · 数据范围</div>
            <div className="gb-home-about-desc">通过角色控制菜单可见性、操作权限与数据范围（本人 / 部门及下级 / 全公司），权限修改即时生效。</div>
          </div>
        </div>
        <div className="gb-home-about-item">
          <AppstoreOutlined style={{ color: 'var(--gb-primary)' }} />
          <div>
            <div className="gb-home-about-title">可扩展的平台底座</div>
            <div className="gb-home-about-desc">SCRM、AI 业务员、AI 销冠、数据看板、产品中心、费用中心等模块统一接入同一套权限与数据口径。</div>
          </div>
        </div>
      </div>
    </div>
  )
}
