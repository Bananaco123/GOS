import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  App,
  Alert,
  Button,
  Descriptions,
  Drawer,
  Input,
  Modal,
  Progress,
  Select,
  Space,
  Table,
  Tag,
  Timeline,
  Typography,
} from 'antd'
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  MessageOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

import { handoverQueueRecords as handoverRecords, handoverUrgencySla } from '../../mock/conversationManagement'
import './conversation.css'

const { TextArea } = Input
const { Text } = Typography

const urgencyColor = {
  高: 'error',
  中: 'warning',
  低: 'processing',
}

function nowText() {
  return dayjs().format('MM-DD HH:mm')
}

function remainingText(minutes) {
  const safe = Math.max(0, minutes)
  const hour = Math.floor(safe / 60)
  const minute = safe % 60
  if (hour > 0) return `${hour}小时${minute}分钟`
  return `${minute}分钟`
}

function countdownPercent(record) {
  const total = handoverUrgencySla[record.urgency] || 60
  if (record.status === '已处理') return 100
  if (record.overdueMinutes > 0) return 100
  return Math.round(((total - record.remainingMinutes) / total) * 100)
}

function metric(records, predicate) {
  return records.filter(predicate).length
}

export default function HandoverPage() {
  const navigate = useNavigate()
  const { message } = App.useApp()

  const [records, setRecords] = useState(handoverRecords)
  const [filters, setFilters] = useState({
    statuses: [],
    urgencies: [],
    overdue: false,
    reasons: [],
    receivers: [],
    handleEvents: [],
    quickFilter: '全部',
    keyword: '',
  })
  const [detailRecord, setDetailRecord] = useState(null)
  const [handleTarget, setHandleTarget] = useState(null)
  const [handleNote, setHandleNote] = useState('')

  const triggerReasons = useMemo(
    () => Array.from(new Set(records.map((record) => record.triggerReason))),
    [records],
  )
  const receivers = useMemo(
    () => Array.from(new Set(records.map((record) => record.receiver))),
    [records],
  )
  const handleEvents = useMemo(
    () => Array.from(new Set(records.map((record) => record.handleEvent))),
    [records],
  )

  const filteredRecords = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase()
    return records.filter((record) => {
      if (filters.quickFilter === '高紧急' && record.urgency !== '高') return false
      if (filters.statuses.length && !filters.statuses.includes(record.status)) return false
      if (filters.urgencies.length && !filters.urgencies.includes(record.urgency)) return false
      if (filters.overdue && record.overdueMinutes <= 0) return false
      if (filters.reasons.length && !filters.reasons.includes(record.triggerReason)) return false
      if (filters.receivers.length && !filters.receivers.includes(record.receiver)) return false
      if (filters.handleEvents.length && !filters.handleEvents.includes(record.handleEvent)) return false
      if (!keyword) return true
      return [record.customer, record.conversationId, record.triggerReason]
        .join(' ')
        .toLowerCase()
        .includes(keyword)
    })
  }, [filters, records])

  const stats = [
    { key: 'pending', label: '待处理', value: metric(records, (record) => record.status === '待处理') },
    { key: 'handled', label: '已处理', value: metric(records, (record) => record.status === '已处理') },
    { key: 'high', label: '高紧急', value: metric(records, (record) => record.urgency === '高'), tone: 'danger' },
    { key: 'overdue', label: '已超时', value: metric(records, (record) => record.overdueMinutes > 0), tone: 'warning' },
  ]

  const applyQuickFilter = (key) => {
    setFilters((prev) => {
      const reset = prev.quickFilter === key || (key === 'high' && prev.quickFilter === '高紧急')
      if (reset) {
        return { ...prev, quickFilter: '全部', statuses: [], urgencies: [], overdue: false }
      }
      if (key === 'pending') return { ...prev, quickFilter: key, statuses: ['待处理'], urgencies: [], overdue: false }
      if (key === 'handled') return { ...prev, quickFilter: key, statuses: ['已处理'], urgencies: [], overdue: false }
      if (key === 'high') return { ...prev, quickFilter: '高紧急', statuses: [], urgencies: ['高'], overdue: false }
      if (key === 'overdue') return { ...prev, quickFilter: key, statuses: [], urgencies: [], overdue: true }
      return prev
    })
  }

  const updateRecord = (id, updater) => {
    setRecords((prev) => prev.map((record) => (record.id === id ? updater(record) : record)))
    setDetailRecord((prev) => (prev?.id === id ? updater(prev) : prev))
  }

  const openScrm = (record) => {
    message.success(`已调起 SCRM 原会话：${record.customer}`)
    navigate('/scrm')
  }

  const confirmHandled = () => {
    if (!handleTarget) return
    const at = nowText()
    const note = handleNote.trim()
    updateRecord(handleTarget.id, (record) => ({
      ...record,
      status: '已处理',
      handleEvent: '手动完成',
      remainingMinutes: 0,
      overdueMinutes: 0,
      handledAt: at,
      handleNote: note,
      operations: [
        {
          time: at,
          operator: record.receiver,
          action: note ? `标记已处理，备注：${note}` : '标记已处理',
        },
        ...record.operations,
      ],
    }))
    message.success('已标记处理完成')
    setHandleTarget(null)
    setHandleNote('')
  }

  const columns = [
    {
      title: '客户名',
      dataIndex: 'customer',
      width: 240,
      fixed: 'left',
      render: (_, record) => (
        <div className="cm-customer-cell">
          <button className="cm-link-button" onClick={() => setDetailRecord(record)}>
            {record.customer}
          </button>
          <span>{record.country} · {record.source}</span>
          <span>{record.conversationId}</span>
        </div>
      ),
    },
    {
      title: '触发原因',
      dataIndex: 'triggerReason',
      width: 210,
      render: (reason, record) => (
        <Space direction="vertical" size={4}>
          <Tag icon={<ThunderboltOutlined />} color={urgencyColor[record.urgency]}>{reason}</Tag>
          <Text type="secondary">{record.summary}</Text>
        </Space>
      ),
    },
    {
      title: '紧急程度',
      dataIndex: 'urgency',
      width: 110,
      render: (urgency) => <Tag color={urgencyColor[urgency]}>{urgency}</Tag>,
    },
    {
      title: '倒计时 / 超时',
      dataIndex: 'remainingMinutes',
      width: 210,
      render: (_, record) => {
        if (record.status === '已处理') {
          return <Tag color="success" icon={<CheckCircleOutlined />}>已处理 {record.handledAt}</Tag>
        }
        if (record.overdueMinutes > 0) {
          return (
            <Space direction="vertical" size={6} className="cm-countdown">
              <Tag color="error" icon={<ExclamationCircleOutlined />}>已超时 {record.overdueMinutes} 分钟</Tag>
              <Text type="secondary">站内 + 企微提醒接管人和主管</Text>
            </Space>
          )
        }
        return (
          <Space direction="vertical" size={6} className="cm-countdown">
            <span>剩余 {remainingText(record.remainingMinutes)}</span>
            <Progress
              percent={countdownPercent(record)}
              showInfo={false}
              size="small"
              status={record.urgency === '高' ? 'exception' : 'active'}
            />
          </Space>
        )
      },
    },
    {
      title: '接管人 / 主管',
      dataIndex: 'receiver',
      width: 170,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text>{record.receiver}</Text>
          <Text type="secondary">{record.supervisor}</Text>
        </Space>
      ),
    },
    {
      title: '处理状态',
      dataIndex: 'status',
      width: 110,
      render: (status) => <Tag color={status === '待处理' ? 'processing' : 'success'}>{status}</Tag>,
    },
    {
      title: '关键片段',
      key: 'snippet',
      width: 120,
      render: (_, record) => (
        <button className="cm-text-action" onClick={() => setDetailRecord(record)}>查看片段</button>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 170,
      render: (_, record) => (
        <div className="cm-action-links">
          <button className="cm-text-action" onClick={() => openScrm(record)}>
            SCRM
          </button>
          {record.status === '待处理' && (
            <button className="cm-text-action is-primary" onClick={() => setHandleTarget(record)}>
              标记已处理
            </button>
          )}
        </div>
      ),
    },
    {
      title: '会话ID',
      dataIndex: 'conversationId',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <button className="cm-link-button" onClick={() => openScrm(record)}>
          {record.conversationId}
        </button>
      ),
    },
  ]

  return (
    <div className="gb-page cm-page">
      <div className="cm-page-header">
        <div>
          <h1 className="gb-page-title">转人工</h1>
          <p className="gb-page-desc">AI 业务员接待中命中人工介入规则的记录，供接管人与主管观察、处理和追踪超时。</p>
        </div>
      </div>

      <div className="cm-filter-bar">
        <Space wrap>
          <Select
            mode="multiple"
            allowClear
            placeholder="处理状态"
            value={filters.statuses}
            options={['待处理', '已处理'].map((value) => ({ value, label: value }))}
            onChange={(value) => setFilters((prev) => ({ ...prev, statuses: value }))}
            style={{ width: 130 }}
          />
          <Select
            mode="multiple"
            allowClear
            placeholder="紧急程度"
            value={filters.urgencies}
            options={['高', '中', '低'].map((value) => ({ value, label: value }))}
            onChange={(value) => setFilters((prev) => ({ ...prev, urgencies: value }))}
            style={{ width: 132 }}
          />
          <Select
            mode="multiple"
            allowClear
            placeholder="触发事件"
            value={filters.reasons}
            options={triggerReasons.map((value) => ({ value, label: value }))}
            onChange={(value) => setFilters((prev) => ({ ...prev, reasons: value }))}
            style={{ width: 210 }}
          />
          <Select
            mode="multiple"
            allowClear
            placeholder="处理事件"
            value={filters.handleEvents}
            options={handleEvents.map((value) => ({ value, label: value }))}
            onChange={(value) => setFilters((prev) => ({ ...prev, handleEvents: value }))}
            style={{ width: 154 }}
          />
          <Select
            mode="multiple"
            allowClear
            placeholder="接管人"
            value={filters.receivers}
            options={receivers.map((value) => ({ value, label: value }))}
            onChange={(value) => setFilters((prev) => ({ ...prev, receivers: value }))}
            style={{ width: 150 }}
          />
        </Space>
        <Input.Search
          allowClear
          placeholder="搜索客户名、会话 ID"
          value={filters.keyword}
          onChange={(event) => setFilters((prev) => ({ ...prev, keyword: event.target.value }))}
          style={{ width: 280 }}
        />
      </div>

      <div className="cm-stat-strip">
        {stats.map((item) => (
          <button
            className={`cm-stat ${item.tone ? `is-${item.tone}` : ''} ${filters.quickFilter === item.key || filters.quickFilter === item.label ? 'is-active' : ''}`}
            key={item.label}
            onClick={() => applyQuickFilter(item.key)}
          >
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </button>
        ))}
      </div>

      <Table
        rowKey="id"
        className="cm-table"
        columns={columns}
        dataSource={filteredRecords}
        pagination={{ pageSize: 8, showSizeChanger: false }}
        scroll={{ x: 1520 }}
      />

      <Drawer
        open={!!detailRecord}
        title={detailRecord ? `转人工详情 · ${detailRecord.customer}` : '转人工详情'}
        width={660}
        onClose={() => setDetailRecord(null)}
        extra={detailRecord && (
          <Space>
            <Button icon={<MessageOutlined />} onClick={() => openScrm(detailRecord)}>
              打开 SCRM 原会话
            </Button>
            {detailRecord.status === '待处理' && (
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => setHandleTarget(detailRecord)}>
                标记已处理
              </Button>
            )}
          </Space>
        )}
      >
        {detailRecord && (
          <div className="cm-drawer-stack">
            <section className="cm-drawer-section">
              <h3>触发信息</h3>
              <Descriptions bordered size="small" column={1}>
                <Descriptions.Item label="触发原因">{detailRecord.triggerReason}</Descriptions.Item>
                <Descriptions.Item label="紧急程度">
                  <Tag color={urgencyColor[detailRecord.urgency]}>{detailRecord.urgency}</Tag>
                  <span className="cm-inline-note">SLA {handoverUrgencySla[detailRecord.urgency]} 分钟</span>
                </Descriptions.Item>
                <Descriptions.Item label="接管人">{detailRecord.receiver}</Descriptions.Item>
                <Descriptions.Item label="主管">{detailRecord.supervisor}</Descriptions.Item>
                <Descriptions.Item label="处理状态">
                  <Tag color={detailRecord.status === '待处理' ? 'processing' : 'success'}>{detailRecord.status}</Tag>
                </Descriptions.Item>
              </Descriptions>
            </section>

            {detailRecord.overdueMinutes > 0 && (
              <Alert
                type="error"
                showIcon
                message={`已超时 ${detailRecord.overdueMinutes} 分钟`}
                description="超时后主动通过站内 + 企微提醒接管人和主管。"
              />
            )}

            <section className="cm-drawer-section">
              <h3>对话摘要</h3>
              <p>{detailRecord.summary}</p>
            </section>

            <section className="cm-drawer-section">
              <h3>触发消息前后片段</h3>
              <div className="cm-snippet-list">
                {detailRecord.snippets.map((item, index) => (
                  <div className="cm-snippet" key={`${item.speaker}-${index}`}>
                    <span>{item.speaker}</span>
                    <p>{item.text}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="cm-drawer-section">
              <h3>处理流</h3>
              <Timeline
                items={detailRecord.operations.map((item) => ({
                  children: (
                    <div>
                      <strong>{item.operator}</strong>
                      <span className="cm-timeline-time">{item.time}</span>
                      <p>{item.action}</p>
                    </div>
                  ),
                }))}
              />
            </section>
          </div>
        )}
      </Drawer>

      <Modal
        open={!!handleTarget}
        title="标记已处理"
        okText="完成"
        cancelText="取消"
        onCancel={() => setHandleTarget(null)}
        onOk={confirmHandled}
      >
        {handleTarget && (
          <Space direction="vertical" size={12} className="cm-modal-content">
            <Alert
              type="info"
              showIcon
              message={`${handleTarget.customer} · ${handleTarget.triggerReason}`}
              description="备注为选填项，点击完成后该记录进入已处理。"
            />
            <TextArea
              value={handleNote}
              onChange={(event) => setHandleNote(event.target.value)}
              placeholder="处理备注，可为空"
              rows={4}
            />
          </Space>
        )}
      </Modal>
    </div>
  )
}
