import { useNavigate } from 'react-router-dom'
import { Button, Space, Tag } from 'antd'
import { ArrowRightOutlined, FileTextOutlined, RobotOutlined, BookOutlined } from '@ant-design/icons'

import './placeholder.css'

/**
 * 占位页：本期 PRD 范围外的菜单点击后落在这里。
 * 设计原则（按用户要求"不要 demo 思路"）：
 *   - 不是"建设中"，而是说明清楚「为什么这里现在是占位」+「对应的下一步动作」
 *   - 提供两个真实可点击的引导：
 *     1) 去 G-Builder OS V1 交互规范看本菜单的设计预期
 *     2) 去 PRD 看 / 去本期可用的两个真实页面
 */

const META = {
  workbench: {
    title: '工作台',
    sub: '日常入口 · 个人任务台',
    desc: '工作台是当前登录用户的个人任务首页，汇集今日 KPI、AI 推送的待办、近期会话和快捷入口。',
    specSection: 'G-Builder OS · §4.1 工作台',
  },
  scrm: {
    title: 'SCRM 销售工作台',
    sub: 'IM 4 栏布局 · 渠道 / 会话 / 聊天 / 客户档案',
    desc: 'SCRM 销售工作台承载销售一线全部会话与客户管理动作，采用 4 栏布局（渠道图标栏 / 会话列表 / 聊天工作区 / 客户档案功能侧边栏）。',
    specSection: 'G-Builder OS · §4.2 SCRM 销售工作台',
  },
  lead: {
    title: '线索分配',
    sub: '会话管理 · 渠道侧新进的线索池',
    desc: '线索分配承载"待分配池查看 + 单条/批量分配 + 分配规则配置"3 类动作，由 AI 业务员收集后等待分配到具体 PM。',
    specSection: 'G-Builder OS · §4.3 线索分配',
  },
  handover: {
    title: '转人工',
    sub: '会话管理 · AI 业务员请求转人工的会话队列',
    desc: 'AI 业务员在会话中识别到"需要人工接管"的请求队列，承载"待接管队列查看 + 一键接管 + 队列状态监控"。',
    specSection: 'G-Builder OS · §4.4 转人工',
  },
  'sales-king': {
    title: 'AI 销冠',
    sub: 'AGENT · 基于知识库为 PM 推送话术建议',
    desc: 'AI 销冠是基于公司/部门/个人三级知识库，为 PM 推送实时话术建议、回答客户难点的 Agent。',
    specSection: 'G-Builder OS · §4.5.5 AI 销冠',
  },
  pm: {
    title: 'PM 看板',
    sub: '数据看板 · PM 个人视角',
    desc: 'PM 个人视角的能力雷达 + 客户漏斗 + 卡点客户 + 今日待办，与工作台首页待办联动。',
    specSection: 'G-Builder OS · §4.6 PM 看板',
  },
  dept: {
    title: '部门看板',
    sub: '数据看板 · 部门主管视角',
    desc: '部门主管视角的团队人效全景、项目卡点全景、培训需求建议。',
    specSection: 'G-Builder OS · §4.7 部门看板',
  },
  settings: {
    title: '设置',
    sub: '个人设置 · 工作偏好 · AI 与翻译 · 系统信息',
    desc: '承载 V1 必要的系统设置：个人信息、工作偏好、AI 与翻译、系统信息四个分组。',
    specSection: 'G-Builder OS · §4.9 设置',
  },
}

export default function PlaceholderPage({ navKey }) {
  const navigate = useNavigate()
  const meta = META[navKey] || { title: '页面', sub: '占位', desc: '此处为占位页。', specSection: '' }

  return (
    <div className="gb-placeholder">
      <div className="gb-placeholder-inner">
        <Tag color="default" style={{ marginBottom: 16, fontWeight: 500 }}>
          本期 PRD 范围外 · 已按 G-Builder OS V1 规范预留入口
        </Tag>

        <h1 className="gb-placeholder-title">{meta.title}</h1>
        <div className="gb-placeholder-sub">{meta.sub}</div>

        <p className="gb-placeholder-desc">{meta.desc}</p>

        <div className="gb-placeholder-specbox">
          <FileTextOutlined style={{ color: 'var(--gb-primary)', marginRight: 6 }} />
          交互规范预期：<strong>{meta.specSection}</strong>
        </div>

        <div className="gb-placeholder-context">
          <div className="gb-placeholder-context-title">本期 SCRM「AI 业务员配合功能」PRD 落地的两个真实页面：</div>
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

        <div className="gb-placeholder-divider" />

        <div className="gb-placeholder-foot">
          <span className="gb-placeholder-foot-line">
            说明：G-Builder OS 是敬城海外营销全链路的操作系统底座，V1 范围共 10 个一级页面 + 2 个 Agent 详情页。
          </span>
          <span className="gb-placeholder-foot-line">
            本期 PRD（《SCRM-AI业务员配合功能-PRD v2》）只覆盖其中 2 块：「AI 业务员」和「知识库」。其余 8 个菜单保留侧边栏入口、暂不实现具体页面。
          </span>
        </div>
      </div>
    </div>
  )
}
