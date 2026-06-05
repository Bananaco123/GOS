import { useState } from 'react'
import { Timeline, Tag, Button, Tooltip, Avatar, Empty, Switch, Space, Alert } from 'antd'
import {
  HistoryOutlined, RollbackOutlined, EyeOutlined, CheckCircleFilled,
  ClockCircleOutlined, CloseCircleFilled, BulbOutlined,
} from '@ant-design/icons'

const STATE_META = {
  published: { label: '已发布', color: 'green', icon: <CheckCircleFilled style={{ color: '#10A86A' }} /> },
  'pre-release': { label: '预发布中', color: 'blue', icon: <ClockCircleOutlined style={{ color: '#2E7BD6' }} /> },
  expired: { label: '已过期', color: 'default', icon: <CloseCircleFilled style={{ color: '#9CA3AF' }} /> },
  historical: { label: '历史', color: 'default', icon: <HistoryOutlined style={{ color: '#9CA3AF' }} /> },
  draft: { label: '草稿', color: 'orange', icon: <BulbOutlined style={{ color: '#E59B26' }} /> },
}

export default function VersionsTab({ agent, versions, onRollback }) {
  const [onlyPublished, setOnlyPublished] = useState(false)
  const filtered = onlyPublished
    ? versions.filter((v) => v.state === 'published' || v.state === 'historical')
    : versions

  return (
    <>
      <section className="gb-agent-section">
        <div className="gb-agent-section-head">
          <div className="gb-agent-section-head-left">
            <div>
              <h3 className="gb-agent-section-title">
                <HistoryOutlined style={{ marginRight: 6 }} />
                配置版本管理
              </h3>
              <div className="gb-agent-section-sub">
                草稿 / 预发布 / 已发布三态流转 · 历史版本可回滚 · 在途会话沿用旧版直至结束、新会话立即生效
              </div>
            </div>
          </div>
          <Space>
            <Switch
              checked={onlyPublished}
              onChange={setOnlyPublished}
              checkedChildren="仅已发布"
              unCheckedChildren="全部版本"
            />
          </Space>
        </div>

        <div className="gb-agent-section-body">
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
            title="版本流转规则"
            description={
              <ul style={{ margin: '4px 0 0', paddingLeft: 18, fontSize: 13, color: 'var(--gb-text-secondary)' }}>
                <li>保存草稿 → 不下发，仅本地暂存</li>
                <li>预发布 → 校验配置完整性，下发到关联的测试 WhatsApp 账号验证；超 7 天未正式发布自动 expired</li>
                <li>正式发布 → 生成新版本快照，下发到全部关联账号；新会话立即生效，在途会话沿用旧版</li>
                <li>历史版本超 50 个自动归档冷存储</li>
              </ul>
            }
          />

          {filtered.length === 0 ? (
            <Empty description="暂无符合条件的版本" />
          ) : (
            <Timeline
              mode="left"
              items={filtered.map((v) => {
                const meta = STATE_META[v.state]
                const isPublished = v.state === 'published'
                return {
                  dot: meta.icon,
                  color: meta.color,
                  children: (
                    <div style={{
                      background: 'var(--gb-white)',
                      border: '1px solid var(--gb-border)',
                      borderRadius: 8,
                      padding: 16,
                      marginBottom: 8,
                      borderLeft: isPublished ? '4px solid #10A86A' : '1px solid var(--gb-border)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 16, fontWeight: 600 }}>{v.version}</span>
                            <Tag color={meta.color}>{meta.label}</Tag>
                            {isPublished && <Tag color="green">当前生效</Tag>}
                          </div>
                          <div style={{ marginTop: 4, fontSize: 12, color: 'var(--gb-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Avatar size={18} style={{ background: 'var(--gb-primary-light)', fontSize: 9 }}>
                              {v.published_by_avatar}
                            </Avatar>
                            <span>{v.published_by}</span>
                            <span style={{ color: 'var(--gb-text-muted)' }}>·</span>
                            <ClockCircleOutlined />
                            {v.published_at}
                          </div>
                        </div>
                        <Space size={6}>
                          <Tooltip title="预览此版本完整配置">
                            <Button size="small" icon={<EyeOutlined />}>查看</Button>
                          </Tooltip>
                          {!isPublished && v.state !== 'pre-release' && (
                            <Tooltip title="将此版本快照作为新版本发布">
                              <Button
                                size="small"
                                icon={<RollbackOutlined />}
                                onClick={() => onRollback(v)}
                              >
                                回滚到此版本
                              </Button>
                            </Tooltip>
                          )}
                        </Space>
                      </div>
                      <div style={{ marginTop: 12, fontSize: 13, color: 'var(--gb-text-secondary)', lineHeight: 1.6 }}>
                        {v.remark}
                      </div>
                      {v.changes?.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                          {v.changes.map((c, idx) => (
                            <div key={idx} style={{ fontSize: 12, color: 'var(--gb-text-secondary)', marginBottom: 4 }}>
                              <Tag style={{ marginRight: 4, fontSize: 10 }}>{c.module}</Tag>
                              {c.desc}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ),
                }
              })}
            />
          )}
        </div>
      </section>
    </>
  )
}
