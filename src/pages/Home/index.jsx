import { Avatar, Tag } from 'antd'
import {
  BookOutlined, MessageOutlined, PlayCircleFilled, RobotOutlined,
  SwapOutlined, TeamOutlined,
} from '@ant-design/icons'

import { useAuth } from '../../auth/AuthContext'
import { dataScopeLabel } from '../../mock/rbac'
import { deptName } from '../../mock/org'
import './home.css'

const FEATURES = [
  {
    key: 'scrm',
    title: 'SCRM',
    subtitle: '客户会话、上下文、CRM 预留区在一个工作台内协同',
    icon: <MessageOutlined />,
    duration: '00:42',
    accent: '#1A4D8F',
  },
  {
    key: 'lead',
    title: '线索分配',
    subtitle: '把 AI 生成的线索表单按等级、负载和跟进状态分配给销售',
    icon: <TeamOutlined />,
    duration: '00:36',
    accent: '#00A3B4',
  },
  {
    key: 'handover',
    title: '转人工',
    subtitle: '识别需要人工介入的会话，按队列、SLA 和接管动作处理',
    icon: <SwapOutlined />,
    duration: '00:31',
    accent: '#E59B26',
  },
  {
    key: 'knowledge',
    title: 'AI 业务员知识库',
    subtitle: '把产品资料、FAQ、SOP 与 AI 业务员的接待策略连接起来',
    icon: <RobotOutlined />,
    duration: '00:48',
    accent: '#10A86A',
  },
]

function MediaPreview({ type, accent }) {
  return (
    <div className={`gb-home-media gb-home-media-${type}`} style={{ '--feature-accent': accent }}>
      <div className="gb-home-media-top">
        <span />
        <span />
        <span />
      </div>
      <div className="gb-home-media-stage">
        {type === 'scrm' && (
          <>
            <div className="gb-media-sidebar">
              <i />
              <i />
              <i />
              <i />
            </div>
            <div className="gb-media-chat">
              <b />
              <b />
              <b />
            </div>
            <div className="gb-media-panel">
              <i />
              <i />
              <i />
            </div>
          </>
        )}
        {type === 'lead' && (
          <>
            <div className="gb-media-filter">
              <i />
              <i />
              <i />
            </div>
            <div className="gb-media-table">
              <b />
              <b />
              <b />
              <b />
            </div>
            <div className="gb-media-flow">
              <span />
              <span />
              <span />
            </div>
          </>
        )}
        {type === 'handover' && (
          <>
            <div className="gb-media-queue">
              <b />
              <b />
              <b />
            </div>
            <div className="gb-media-sla">
              <i />
              <i />
            </div>
            <div className="gb-media-action" />
          </>
        )}
        {type === 'knowledge' && (
          <>
            <div className="gb-media-bot">
              <RobotOutlined />
            </div>
            <div className="gb-media-nodes">
              <i />
              <i />
              <i />
              <i />
            </div>
            <div className="gb-media-doc">
              <BookOutlined />
            </div>
          </>
        )}
        <div className="gb-home-play">
          <PlayCircleFilled />
        </div>
      </div>
      <div className="gb-home-media-timeline">
        <span />
      </div>
    </div>
  )
}

export default function HomePage() {
  const { user, role } = useAuth()

  return (
    <div className="gb-home">
      <section className="gb-home-intro">
        <div className="gb-home-intro-copy">
          <div className="gb-home-intro-main">
            <div>
              <div className="gb-home-kicker">GOS V1.1 功能导览</div>
              <h1>从会话接待到 AI 知识资产的营销工作流</h1>
              <p>
                首页用于承载核心功能介绍。当前先用抽象媒体预览表达模块形态，后续可替换为真实 UI 截图、产品短片或操作演示。
              </p>
            </div>
            <div className="gb-home-user-strip">
              <Avatar size={34} style={{ background: '#1A4D8F' }}>{user?.avatar}</Avatar>
              <div>
                <strong>{user?.name}</strong>
                <span>{user?.title} · {deptName(user?.dept_id)}</span>
              </div>
              <Tag color="blue">{role?.name}</Tag>
              <Tag color="geekblue">数据范围：{dataScopeLabel(role?.data_scope)}</Tag>
            </div>
          </div>
        </div>
      </section>

      <div className="gb-home-section-head">
        <h2>核心功能演示</h2>
        <span>抽象视频预览 · 后续替换真实 UI 图片</span>
      </div>

      <section className="gb-home-feature-grid">
        {FEATURES.map((feature) => (
          <article className="gb-home-feature" key={feature.key} style={{ '--feature-accent': feature.accent }}>
            <div className="gb-home-feature-head">
              <div className="gb-home-feature-icon">{feature.icon}</div>
              <div>
                <h2>{feature.title}</h2>
                <p>{feature.subtitle}</p>
              </div>
              <span className="gb-home-duration">{feature.duration}</span>
            </div>
            <MediaPreview type={feature.key} accent={feature.accent} />
          </article>
        ))}
      </section>
    </div>
  )
}
