import { useNavigate } from 'react-router-dom'
import { Button, Space, Tag } from 'antd'
import { ArrowRightOutlined, FileTextOutlined, RobotOutlined, BookOutlined } from '@ant-design/icons'

import './placeholder.css'

const META = {
  'sales-king': {
    title: 'AI 销冠',
    sub: 'AGENT · 基于知识库为 PM 推送话术建议',
    desc: 'AI 销冠是基于公司、部门、个人三级知识库，为 PM 推送实时话术建议并辅助回答客户难点的 Agent。',
    specSection: 'G-Builder OS · AI 销冠',
  },
  settings: {
    title: '设置',
    sub: '个人设置 · 工作偏好 · AI 与翻译 · 系统信息',
    desc: '承载 V1 必要的系统设置能力。',
    specSection: 'G-Builder OS · 设置',
  },
}

export default function PlaceholderPage({ navKey }) {
  const navigate = useNavigate()
  const meta = META[navKey] || { title: '页面', sub: '占位', desc: '此处为占位页。', specSection: '' }

  return (
    <div className="gb-placeholder">
      <div className="gb-placeholder-inner">
        <Tag color="default" style={{ marginBottom: 16, fontWeight: 500 }}>
          当前页面暂未进入真实实现范围
        </Tag>

        <h1 className="gb-placeholder-title">{meta.title}</h1>
        <div className="gb-placeholder-sub">{meta.sub}</div>

        <p className="gb-placeholder-desc">{meta.desc}</p>

        <div className="gb-placeholder-specbox">
          <FileTextOutlined style={{ color: 'var(--gb-primary)', marginRight: 6 }} />
          交互规范预期：<strong>{meta.specSection}</strong>
        </div>

        <div className="gb-placeholder-context">
          <div className="gb-placeholder-context-title">当前 demo 已接入的真实页面：</div>
          <Space size={12} wrap>
            <Button
              type="primary"
              icon={<RobotOutlined />}
              onClick={() => navigate('/agent/sales-rep')}
            >
              AI 业务员
              <ArrowRightOutlined />
            </Button>
            <Button
              icon={<BookOutlined />}
              onClick={() => navigate('/knowledge')}
            >
              知识库
              <ArrowRightOutlined />
            </Button>
          </Space>
        </div>
      </div>
    </div>
  )
}
