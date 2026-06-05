import { Button, Tooltip } from 'antd'
import {
  ArrowLeftOutlined,
  ExperimentOutlined,
  CloudUploadOutlined,
  SendOutlined,
  TeamOutlined,
  ApiOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

import { SALES_GROUPS } from '../../../mock/salesGroups'
import { getAgentStatus } from '../../../utils/agentStatus'

export default function AgentHero({ agent, onApplyTest, onPreRelease, onPublish }) {
  const navigate = useNavigate()
  const salesGroup = SALES_GROUPS.find((sg) => sg.id === agent.sales_group_id)
  const status = getAgentStatus(agent)

  return (
    <div className="gb-agent-hero">
      <div className="gb-agent-hero-inner">
        {/* 返回（统一圆形符号按钮，垂直居中） */}
        <Tooltip title="返回 AI 业务员列表">
          <button
            type="button"
            className="gb-agent-hero-back"
            onClick={() => navigate('/agent/sales-rep')}
            aria-label="返回"
          >
            <ArrowLeftOutlined />
          </button>
        </Tooltip>

        <div
          className="gb-agent-hero-avatar"
          style={{ background: agent.identity_card.avatar_bg || 'rgba(255, 255, 255, 0.18)' }}
        >
          {agent.identity_card.avatar_initials || 'AI'}
        </div>

        <div className="gb-agent-hero-main">
          <h1 className="gb-agent-hero-name">
            <span>{agent.display_name}</span>
            <span
              className="gb-agent-hero-status-pill"
              style={{
                background: 'rgba(255, 255, 255, 0.16)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#fff',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: status.dot }} />
              {status.label}
            </span>
            <span className="gb-agent-hero-version">{agent.current_version}</span>
          </h1>

          <div className="gb-agent-hero-meta">
            <span className="gb-agent-hero-meta-item">
              <TeamOutlined />
              销售组：{salesGroup?.name || agent.sales_group_id}
            </span>
            <span className="gb-agent-hero-meta-item">
              <ApiOutlined />
              Agent ID：
              <span style={{ fontFamily: 'SFMono-Regular, Menlo, monospace', fontSize: 12, marginLeft: 4 }}>
                {agent.short_id || agent.id}
              </span>
            </span>
            <span className="gb-agent-hero-meta-item">
              <ClockCircleOutlined />
              最后修改：{agent.last_modified_at} · {agent.last_modified_by}
            </span>
          </div>
        </div>

        <div className="gb-agent-hero-toolbar">
          <Tooltip title="将当前配置应用到测试通道，使用关联测试账号即时验证（不影响线上）">
            <Button
              ghost
              icon={<ExperimentOutlined />}
              onClick={onApplyTest}
              style={{ borderColor: 'rgba(255, 255, 255, 0.4)', color: 'white' }}
            >
              应用测试
            </Button>
          </Tooltip>
          <Tooltip title="下发到预发布通道，由生产 WhatsApp 账号灰度验证（7 天内未正式发布将自动 expired）">
            <Button
              ghost
              icon={<CloudUploadOutlined />}
              onClick={onPreRelease}
              style={{ borderColor: 'rgba(255, 255, 255, 0.4)', color: 'white' }}
            >
              预发布
            </Button>
          </Tooltip>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={onPublish}
            style={{ background: 'white', color: '#1A4D8F', fontWeight: 600 }}
          >
            正式发布
          </Button>
        </div>
      </div>
    </div>
  )
}
