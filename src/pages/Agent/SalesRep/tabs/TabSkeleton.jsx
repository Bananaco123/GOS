import { Spin } from 'antd'

export default function TabSkeleton({ title, prdSection }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 32px' }}>
      <Spin size="large" />
      <div style={{ marginTop: 24, fontSize: 16, color: 'var(--gb-text)' }}>
        {title} · 实现中
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--gb-text-muted)' }}>
        对应 PRD：{prdSection}
      </div>
    </div>
  )
}
