import { Tag } from 'antd'
import {
  AppstoreOutlined, WalletOutlined, CheckCircleOutlined, ClockCircleOutlined, CloudServerOutlined,
} from '@ant-design/icons'

const CONFIG = {
  product: {
    icon: <AppstoreOutlined />,
    title: '产品中心',
    desc: '后续承接产品购买与模块开通。本期仅作为设置中心的架构占位，展示未来扩展方向。',
    color: '#E59B26',
    capabilities: [
      '可购买 / 开通的模块清单（SCRM、AI 业务员、AI 销冠、知识库等）',
      '模块开通状态与有效期管理',
      '套餐版本与功能矩阵对比',
      '开通后自动接入统一角色权限与数据口径',
    ],
  },
  billing: {
    icon: <WalletOutlined />,
    title: '费用中心',
    desc: '后续承接额度、消耗、账单与结算。本期仅作为设置中心的架构占位，展示未来扩展方向。',
    color: '#0E7C7B',
    capabilities: [
      '账户额度与余额总览',
      'AI 调用 / 坐席 / 存储等资源消耗明细',
      '账单生成与历史账单查询',
      '充值、结算与发票申请闭环',
    ],
  },
  cloudAccounts: {
    icon: <CloudServerOutlined />,
    title: '云账号管理',
    desc: '用于承接 SCRM 云账号接入、授权状态和账号配置。本期仅作为设置中心的入口占位。',
    color: '#1A4D8F',
    capabilities: [
      '云账号列表与授权状态查看',
      '账号基础配置与连接状态管理',
      '授权异常、掉线和重连处理入口',
      '后续接入统一角色权限与系统日志',
    ],
  },
}

export default function CenterPlaceholder({ type }) {
  const config = CONFIG[type] || CONFIG.product
  return (
    <div className="gb-settings-page">
      <div className="gb-settings-page-head">
        <h1 className="gb-settings-page-title">
          {config.title}
          <Tag color="orange" style={{ marginLeft: 8 }}>规划中</Tag>
        </h1>
        <p className="gb-settings-page-desc">{config.desc}</p>
      </div>

      <div
        style={{
          background: 'var(--gb-white)', border: '1px solid var(--gb-border)', borderRadius: 12,
          padding: '40px 32px', textAlign: 'center', marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 72, height: 72, borderRadius: 18, margin: '0 auto 20px',
            background: `${config.color}14`, color: config.color, display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 34,
          }}
        >
          {config.icon}
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--gb-text)', marginBottom: 6 }}>
          {config.title}正在规划中
        </div>
        <div style={{ fontSize: 13, color: 'var(--gb-text-secondary)', maxWidth: 520, margin: '0 auto' }}>
          本期作为基础架构占位，预留系统入口，避免后续接入返工。以下为后续建设方向：
        </div>
      </div>

      <div style={{ background: 'var(--gb-white)', border: '1px solid var(--gb-border)', borderRadius: 12, padding: '20px 24px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          <ClockCircleOutlined style={{ color: config.color }} />
          后续能力清单
        </div>
        {config.capabilities.map((capability, index) => (
          <div key={capability} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: index < config.capabilities.length - 1 ? '1px dashed var(--gb-border-light)' : 'none' }}>
            <CheckCircleOutlined style={{ color: 'var(--gb-text-muted)', marginTop: 3 }} />
            <span style={{ fontSize: 13, color: 'var(--gb-text-secondary)' }}>{capability}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
