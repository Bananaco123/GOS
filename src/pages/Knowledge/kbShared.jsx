/**
 * 知识库共享小组件（v9）
 *   - ScopeTag        库可见范围徽标（企业/部门/个人）
 *   - KindTag         知识类型徽标（问答类/文档多模态类）
 *   - StatusBadge     条目状态（生效中/草稿/已下线）+ ● 待发布标记
 *   - AgentRefPopover 引用 Agent 数 + hover 浮层（哪个类型的哪个 Agent）
 */
import { Tag, Popover, List, Avatar, Empty } from 'antd'
import {
  GlobalOutlined, TeamOutlined, UserOutlined, RobotOutlined,
  MessageOutlined, FileTextOutlined,
} from '@ant-design/icons'

import { scopeMeta } from '../../mock/library'
import { kindMeta } from '../../mock/knowledge'
import { agentTypeMeta } from '../../utils/kbRefs'

const SCOPE_ICON = { company: <GlobalOutlined />, dept: <TeamOutlined />, self: <UserOutlined /> }

export function ScopeTag({ scope, size }) {
  const m = scopeMeta(scope)
  return (
    <Tag color={m.tag} style={{ fontSize: size === 'sm' ? 11 : 12, margin: 0 }}>
      {SCOPE_ICON[scope]} {m.label}
    </Tag>
  )
}

const KIND_SOLID = { qa: '#1A4D8F', doc: '#7C3AED' }

export function KindTag({ kind, solid }) {
  const m = kindMeta(kind)
  return (
    <Tag color={solid ? KIND_SOLID[kind] : m?.color} style={{ margin: 0 }}>
      {kind === 'qa' ? <MessageOutlined /> : <FileTextOutlined />} {m?.name}
    </Tag>
  )
}

// 仅两态：生效中 / 待发布（样式一致，无前置图标）
export function StatusBadge({ status, pending }) {
  if (pending) return <Tag color="orange" style={{ margin: 0 }}>待发布</Tag>
  if (status === 'offline') return <Tag style={{ margin: 0 }}>已下线</Tag>
  return <Tag color="green" style={{ margin: 0 }}>生效中</Tag>
}

export function AgentRefPopover({ agents, salesGroupName }) {
  const count = agents?.length || 0
  const content = count === 0 ? (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无 Agent 引用" style={{ width: 220, margin: '8px 0' }} />
  ) : (
    <List
      size="small"
      style={{ width: 280 }}
      dataSource={agents}
      renderItem={(a) => {
        const t = agentTypeMeta(a)
        return (
          <List.Item style={{ padding: '8px 0' }}>
            <List.Item.Meta
              avatar={<Avatar size={28} style={{ background: a.identity_card?.avatar_bg || '#1A4D8F', fontSize: 11 }}>{a.identity_card?.avatar_initials || 'A'}</Avatar>}
              title={<span style={{ fontSize: 13 }}>{a.display_name}</span>}
              description={
                <span style={{ fontSize: 11 }}>
                  <Tag color="blue" style={{ fontSize: 10, margin: 0, marginRight: 4 }}>{t.product}</Tag>
                  <Tag color={t.variantColor} style={{ fontSize: 10, margin: 0 }}>{t.variant}</Tag>
                </span>
              }
            />
          </List.Item>
        )
      }}
    />
  )
  return (
    <Popover content={content} title="引用此知识的 Agent" trigger="hover" placement="left">
      <Tag icon={<RobotOutlined />} color={count ? 'blue' : 'default'} style={{ cursor: 'pointer', margin: 0 }}>
        {count}
      </Tag>
    </Popover>
  )
}
