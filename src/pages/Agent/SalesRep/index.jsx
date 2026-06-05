import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { Tabs, App, Spin, Result, Button } from 'antd'
import {
  SettingOutlined, BarChartOutlined, SwapOutlined, HistoryOutlined, ReadOutlined,
  CommentOutlined,
} from '@ant-design/icons'

import AgentHero from './AgentHero'
import BasicTab from './tabs/BasicTab'
import ReceptionStrategyTab from './tabs/ReceptionStrategyTab'
import GradingTab from './tabs/GradingTab'
import HandoffTab from './tabs/HandoffTab'
import KnowledgeTab from './tabs/KnowledgeTab'
import VersionsTab from './tabs/VersionsTab'

import { store } from '../../../mock/store'
import { validateThresholds } from '../../../mock/gradingAndHandoff'
import './agent-page.css'

const TAB_ITEMS = [
  { key: 'basic', label: '基础配置', icon: <SettingOutlined /> },
  { key: 'strategy', label: '接待策略', icon: <CommentOutlined /> },
  { key: 'grading', label: '线索评级', icon: <BarChartOutlined /> },
  { key: 'handoff', label: '转人工', icon: <SwapOutlined /> },
  { key: 'knowledge', label: '知识库', icon: <ReadOutlined /> },
  { key: 'versions', label: '版本管理', icon: <HistoryOutlined /> },
]

export default function AgentSalesRep() {
  const { agentId } = useParams()
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const [searchParams, setSearchParams] = useSearchParams()

  const [agent, setAgent] = useState(() => store.getAgent(agentId))
  const [versions, setVersions] = useState(() => store.getConfigVersions(agentId))

  // 当 agentId 路径变化时重新加载
  useEffect(() => {
    const found = store.getAgent(agentId)
    setAgent(found)
    setVersions(store.getConfigVersions(agentId))
  }, [agentId])

  const activeTab = searchParams.get('tab') || 'basic'

  // ---- Agent 不存在的情况 ----
  if (!agent) {
    return (
      <div className="gb-agent-page" style={{ padding: 48 }}>
        <Result
          status="404"
          title="未找到该 Agent"
          subTitle={`ID：${agentId} · 可能已被删除或您没有访问权限`}
          extra={
            <Button type="primary" onClick={() => navigate('/agent/sales-rep')}>
              返回 Agent 列表
            </Button>
          }
        />
      </div>
    )
  }

  // ---- 配置修改：实时入库（即点即存，符合"一份草稿"心智） ----
  const handleChange = (next) => {
    const updated = {
      ...next,
      last_modified_at: new Date().toLocaleString('zh-CN').slice(0, 19),
      last_modified_by: 'Gao Kui',
      last_modified_by_avatar: 'GK',
    }
    setAgent(updated)
    store.setAgent(agentId, updated)
  }

  // ---- 顶部 3 按钮 ----
  const handleApplyTest = () => {
    modal.confirm({
      title: '应用到测试通道',
      content: (
        <div>
          <p>将当前配置一键应用到测试通道，使用关联的测试账号即时验证。</p>
          <p style={{ color: 'var(--gb-text-muted)', fontSize: 12 }}>
            该操作不影响线上 / 预发布通道；可重复执行。
          </p>
        </div>
      ),
      okText: '确认应用',
      onOk: () => {
        message.success('已应用到测试通道，可使用测试 WhatsApp 账号发起对话验证')
      },
    })
  }

  const handlePreRelease = () => {
    const requiredOk = checkRequiredFields(agent)
    if (!requiredOk.ok) {
      modal.warning({ title: '配置不完整', content: requiredOk.message, okText: '我知道了' })
      return
    }
    modal.confirm({
      title: '预发布到灰度通道',
      content: '将当前配置生成快照，通过关联的生产 WhatsApp 账号灰度验证。7 天内未正式发布将自动 expired。预发布为详情页发布流程的中间态，不改变该 Agent 在列表中的卡片状态。',
      okText: '确认预发布',
      onOk: () => {
        // 预发布仅作为详情页发布流程的中间态，不改变卡片层状态（草稿/接待中/暂停中）
        message.success('已下发到预发布通道（灰度验证中，7 天内可正式发布）')
      },
    })
  }

  const handlePublish = () => {
    const requiredOk = checkRequiredFields(agent)
    if (!requiredOk.ok) {
      modal.warning({ title: '配置不完整', content: requiredOk.message })
      return
    }
    const isPreRelease = agent.status === 'pre-release'
    modal.confirm({
      title: '正式发布',
      content: (
        <div>
          {!isPreRelease && (
            <div style={{ color: '#E59B26', marginBottom: 12, padding: 8, background: '#FFFAEB', borderRadius: 6 }}>
              ⚠️ 该版本尚未经过预发布验证，确认强制发布？
            </div>
          )}
          <p>新会话立即生效，在途会话沿用旧版直到结束。该动作不可撤回（但可通过版本管理回滚发布新版）。</p>
        </div>
      ),
      okText: '确认发布',
      onOk: () => {
        const nextNum = parseInt(agent.current_version.replace('v.', ''), 10) + 1
        const now = new Date().toLocaleString('zh-CN').slice(0, 19)
        const newVer = {
          ...agent,
          status: 'published',
          runtime_state: 'serving',
          current_version: `v.${nextNum}`,
          last_published_at: now,
          last_published_by: 'Gao Kui',
          last_published_by_avatar: 'GK',
        }
        const newVersionItem = {
          version: `v.${nextNum}`,
          state: 'published',
          published_at: now,
          published_by: 'Gao Kui',
          published_by_avatar: 'GK',
          remark: '本次发布修改总览（演示）',
          changes: [{ module: '基础配置 / 评级 / 转人工', desc: '若干字段修改' }],
        }
        const newVersions = [
          newVersionItem,
          ...versions.map((v) => v.state === 'published' ? { ...v, state: 'historical' } : v),
        ]
        setAgent(newVer)
        setVersions(newVersions)
        store.setAgent(agentId, newVer)
        store.setConfigVersions(agentId, newVersions)
        message.success(`已发布 ${newVer.current_version}`)
      },
    })
  }

  const handleRollback = (v) => {
    const nextNum = parseInt(agent.current_version.replace('v.', ''), 10) + 1
    const now = new Date().toLocaleString('zh-CN').slice(0, 19)
    const newVer = {
      ...agent,
      status: 'published',
      runtime_state: 'serving',
      current_version: `v.${nextNum}`,
      last_published_at: now,
      last_published_by: 'Gao Kui',
    }
    const newVersionItem = {
      version: `v.${nextNum}`,
      state: 'published',
      published_at: now,
      published_by: 'Gao Kui',
      published_by_avatar: 'GK',
      remark: `回滚自 ${v.version}：${v.remark}`,
      changes: v.changes || [],
    }
    const newVersions = [
      newVersionItem,
      ...versions.map((vv) => vv.state === 'published' ? { ...vv, state: 'historical' } : vv),
    ]
    setAgent(newVer)
    setVersions(newVersions)
    store.setAgent(agentId, newVer)
    store.setConfigVersions(agentId, newVersions)
    message.success(`已回滚到 ${v.version} 内容并发布为 ${newVer.current_version}`)
  }

  return (
    <div className="gb-agent-page">
      <AgentHero
        agent={agent}
        onApplyTest={handleApplyTest}
        onPreRelease={handlePreRelease}
        onPublish={handlePublish}
      />

      <div className="gb-agent-tabs">
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setSearchParams({ tab: key })}
          items={TAB_ITEMS.map((t) => ({
            key: t.key,
            label: <span>{t.icon} {t.label}</span>,
          }))}
        />
      </div>

      <div className="gb-agent-content">
        {activeTab === 'basic' && <BasicTab agent={agent} onChange={handleChange} />}
        {activeTab === 'strategy' && <ReceptionStrategyTab agent={agent} onChange={handleChange} />}
        {activeTab === 'grading' && <GradingTab agent={agent} onChange={handleChange} />}
        {activeTab === 'handoff' && <HandoffTab agent={agent} onChange={handleChange} />}
        {activeTab === 'knowledge' && <KnowledgeTab agent={agent} onChange={handleChange} />}
        {activeTab === 'versions' && (
          <VersionsTab agent={agent} versions={versions} onRollback={handleRollback} />
        )}
      </div>
    </div>
  )
}

// 简化版校验（与新 BasicTab 字段对齐）
function checkRequiredFields(agent) {
  const missing = []
  if (!agent.identity_card?.name) missing.push('Agent 名字')
  if (!agent.sales_group_id) missing.push('所属销售组')
  if (!agent.linked_whatsapp_accounts?.length) missing.push('至少绑定 1 个 WhatsApp 账号')
  if (!agent.knowledge_libraries?.length) missing.push('至少引用 1 个知识库')
  if (!agent.grading_config?.elements?.length) missing.push('线索评级要素')
  if (!agent.handoff_config?.triggers?.length) missing.push('转人工触发规则')

  // 评级档位合法性（不重叠 / 完整覆盖 0-100 / 不缺失中间级）
  const tc = validateThresholds(agent.grading_config?.thresholds)
  if (!tc.ok) missing.push(`评级档位不合法（${tc.errors[0]}）`)

  if (missing.length === 0) return { ok: true }
  return { ok: false, message: `缺失以下必填项：${missing.join('、')}` }
}
