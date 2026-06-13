import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  App,
  Alert,
  Button,
  DatePicker,
  Drawer,
  Input,
  Modal,
  Radio,
  Select,
  Space,
  Segmented,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd'
import {
  BulbOutlined,
  MessageOutlined,
  ReloadOutlined,
  SendOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

import {
  leadAssignmentRecords as leadRecords,
  salesOptions,
} from '../../mock/conversationManagement'
import './conversation.css'

const { Text } = Typography

function nowText() {
  return dayjs().format('MM-DD HH:mm')
}

function canReassign(record) {
  return record.timeout || record.followStatus === '建联失败' || record.canReassign
}

function crmColor(status) {
  if (status === 'CRM 私池') return 'success'
  if (status === 'CRM 公海') return 'warning'
  return 'default'
}

function assignStatusClass(status) {
  return status === '待分配' ? 'is-pending' : 'is-assigned'
}

function followStatusClass(status) {
  if (status === '待建联' || status === '待发起建联') return 'is-waiting'
  if (status === '待客户回复') return 'is-processing'
  if (status === '已建联') return 'is-success'
  if (status === '建联失败') return 'is-error'
  return 'is-default'
}

function metric(records, predicate) {
  return records.filter(predicate).length
}

const assistantPeriods = [
  { label: '今日', value: 'today' },
  { label: '昨日', value: 'yesterday' },
  { label: '近3天', value: '3d' },
  { label: '近7天', value: '7d' },
  { label: '近30天', value: '30d' },
]

const assistantThinkingSteps = ['读取当前线索池', '统计近30天分配与跟进表现', '评估线索价值和销售负载', '生成可人工确认的调度建议']
const ratingKeys = ['A级', 'B级', 'C级', 'D级']
const ratingWeight = { A级: 100, B级: 72, C级: 48, D级: 24 }

function getPeriodDays(period) {
  if (period === '3d') return 3
  if (period === '7d') return 7
  if (period === '30d') return 30
  return 1
}

function normalizeRating(record) {
  if (record.rating) return record.rating
  return record.aiLevel ? `${record.aiLevel}级` : 'D级'
}

function getRecordDate(record) {
  return record.assignmentAt || record.triggerAt
}

function getDemoToday(records) {
  const dates = records
    .map(getRecordDate)
    .filter(Boolean)
    .map((date) => dayjs(date))
    .filter((date) => date.isValid())

  if (!dates.length) return dayjs()
  return dates.reduce((latest, date) => (date.isAfter(latest) ? date : latest), dates[0])
}

function isRecordInPeriod(record, period, today) {
  const date = dayjs(getRecordDate(record))
  if (!date.isValid()) return false
  if (period === 'today') return date.isSame(today, 'day')
  if (period === 'yesterday') return date.isSame(today.subtract(1, 'day'), 'day')
  const days = period === '3d' ? 3 : period === '7d' ? 7 : 30
  return date.isSame(today, 'day') || date.isAfter(today.subtract(days, 'day'), 'day')
}

function getPeriodLabel(period) {
  return assistantPeriods.find((item) => item.value === period)?.label || '近30天'
}

function getSalesLabel(value) {
  return salesOptions.find((item) => item.value === value)?.label || value
}

function buildSalesStats(records, period) {
  const today = getDemoToday(records)
  const scopedRecords = records.filter((record) => isRecordInPeriod(record, period, today))
  const periodDays = getPeriodDays(period)
  const dailyBaselines = [4, 5, 3, 4]

  const rows = salesOptions.map((sales, index) => {
    const assignedRecords = scopedRecords.filter((record) => record.assignee === sales.value)
    const ratingCounts = ratingKeys.reduce((acc, key) => {
      acc[key] = assignedRecords.filter((record) => normalizeRating(record) === key).length
      return acc
    }, {})
    const displayTotal = Math.max(assignedRecords.length, dailyBaselines[index % dailyBaselines.length] * periodDays + (periodDays > 1 ? index : 0))
    const displayA = Math.max(ratingCounts['A级'], Math.round(displayTotal * (index === 2 ? 0.28 : 0.2)))
    const displayB = Math.max(ratingCounts['B级'], Math.round(displayTotal * 0.34))
    const displayC = Math.max(ratingCounts['C级'], Math.round(displayTotal * 0.28))
    const displayD = Math.max(0, displayTotal - displayA - displayB - displayC)
    const connected = Math.max(
      assignedRecords.filter((record) => record.followStatus === '已建联').length,
      Math.round(displayTotal * (index === 0 ? 0.58 : 0.48)),
    )
    const waiting = Math.max(
      assignedRecords.filter((record) => ['待发起建联', '待建联', '待客户回复'].includes(record.followStatus)).length,
      Math.round(displayTotal * 0.28),
    )
    const timeout = Math.max(assignedRecords.filter((record) => record.timeout).length, index === 1 ? Math.ceil(periodDays / 2) : Math.floor(periodDays / 4))
    const valueScore = assignedRecords.reduce((sum, record) => sum + (ratingWeight[normalizeRating(record)] || 0), 0) || (displayA * 100 + displayB * 72 + displayC * 48 + displayD * 24)

    return {
      key: sales.value,
      sales: sales.value,
      role: sales.label.replace(`${sales.value} · `, ''),
      total: displayTotal,
      connected,
      waiting,
      timeout,
      valueScore,
      activityScore: displayTotal ? Math.round((connected / displayTotal) * 100) : 72,
      'A级': displayA,
      'B级': displayB,
      'C级': displayC,
      'D级': displayD,
    }
  })
  const maxTotal = Math.max(...rows.map((item) => item.total))
  return rows.map((item) => ({ ...item, isMaxTotal: item.total === maxTotal }))
}

function getSalesFitScore(record, sales, salesStat) {
  const label = getSalesLabel(sales.value)
  const rating = normalizeRating(record)
  const highValueBonus = rating === 'A级' && label.includes('大客户') ? -18 : 0
  const northAmericaBonus = record.source?.includes('北美') && label.includes('北美') ? -16 : 0
  const asiaBonus = record.source?.includes('南亚') && label.includes('东南亚') ? -12 : 0
  const europeBonus = record.country && ['France', 'Germany', 'United Kingdom'].includes(record.country) && label.includes('欧洲') ? -12 : 0
  const loadPenalty = salesStat.total * 8 + salesStat['A级'] * 4 + salesStat.timeout * 14
  const activityBonus = salesStat.connected * -4

  return loadPenalty + activityBonus + highValueBonus + northAmericaBonus + asiaBonus + europeBonus
}

function buildRecommendations(records) {
  const salesStats = buildSalesStats(records, '30d')
  const eligibleRecords = records
    .filter((record) => record.assignStatus === '待分配' || canReassign(record))
    .sort((a, b) => (b.score || 0) - (a.score || 0))

  return eligibleRecords.map((record) => {
    const rankedSales = salesOptions
      .map((sales) => {
        const stat = salesStats.find((item) => item.sales === sales.value)
        return { sales: sales.value, score: getSalesFitScore(record, sales, stat) }
      })
      .sort((a, b) => a.score - b.score)

    const target = rankedSales[0]?.sales || salesOptions[0].value
    const targetStat = salesStats.find((item) => item.sales === target)
    const reason = [
      normalizeRating(record),
      record.timeout ? '原跟进超时，建议重新分配' : '待进入人工跟进',
      targetStat?.total ? `${target}当前负载${targetStat.total}条` : `${target}当前负载较低`,
      targetStat?.connected ? `已建联${targetStat.connected}条` : '近期可承接新增线索',
    ].join('，')

    return {
      key: record.id,
      id: record.id,
      customer: record.customer,
      rating: normalizeRating(record),
      score: record.score || 0,
      source: record.source,
      status: record.assignStatus,
      currentAssignee: record.assignee,
      suggestedAssignee: target,
      reason,
      confidence: Math.max(76, Math.min(96, 96 - Math.max(0, rankedSales[0]?.score || 0))),
    }
  })
}

function getFactorCategory(item) {
  return item.category || item.infoType || '-'
}

function getFactorDetail(item) {
  return item.detail || item.option || '-'
}

function renderRatingPreview(record) {
  return (
    <div className="cm-rating-popover">
      <div className="cm-rating-popover-head">
        <span>{record.rating}</span>
      </div>
      <div className="cm-rating-popover-list">
        {record.ratingFactors.map((item) => (
          <div className="cm-rating-popover-row" key={`${getFactorCategory(item)}-${getFactorDetail(item)}`}>
            <span>{getFactorCategory(item)}</span>
            <p>{getFactorDetail(item)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function getLifecycleItems(record) {
  const items = record.lifecycle || record.timeline || []
  return [...items].sort((a, b) => String(b.time).localeCompare(String(a.time)))
}

function renderSnippetContext(item) {
  const context = item.context || {}
  return (
    <div className="cm-snippet-context-card">
      {context.prev && <p>{context.prev}</p>}
      <p className="is-current">{context.current || item.text}</p>
      {context.next && <p>{context.next}</p>}
    </div>
  )
}

export default function LeadAssignmentPage() {
  const navigate = useNavigate()
  const { message } = App.useApp()

  const [records, setRecords] = useState(leadRecords)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [filters, setFilters] = useState({
    aiLevel: '全部',
    ratings: [],
    assignStatuses: [],
    followStatuses: [],
    sources: [],
    crm: '全部',
    assignee: '全部',
    triggerEvents: [],
    assignmentEvents: [],
    triggerDate: null,
    assignmentDate: null,
    timeout: false,
    quickFilter: '全部',
    keyword: '',
  })
  const [detailRecord, setDetailRecord] = useState(null)
  const [assignTarget, setAssignTarget] = useState(null)
  const [assignUser, setAssignUser] = useState(salesOptions[0].value)
  const [batchAssignOpen, setBatchAssignOpen] = useState(false)
  const [batchAssignUser, setBatchAssignUser] = useState(salesOptions[0].value)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [assistantView, setAssistantView] = useState(null)
  const [assistantPhase, setAssistantPhase] = useState('idle')
  const [assistantStepIndex, setAssistantStepIndex] = useState(0)
  const [assistantPeriod, setAssistantPeriod] = useState('today')
  const [recommendationOverrides, setRecommendationOverrides] = useState({})
  const [ignoredRecommendationIds, setIgnoredRecommendationIds] = useState([])
  const [selectedRecommendationKeys, setSelectedRecommendationKeys] = useState([])
  const [ratingTarget, setRatingTarget] = useState(null)
  const [ratingDraft, setRatingDraft] = useState('A级')
  const [ratingReason, setRatingReason] = useState('')

  const followStatusOptions = useMemo(
    () => Array.from(new Set(records.map((record) => record.followStatus))),
    [records],
  )

  const filteredRecords = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase()
    return records.filter((record) => {
      if (filters.quickFilter === '可再次分配' && !canReassign(record)) return false
      if (filters.ratings.length && !filters.ratings.includes(record.rating)) return false
      if (filters.assignStatuses.length && !filters.assignStatuses.includes(record.assignStatus)) return false
      if (filters.followStatuses.length && !filters.followStatuses.includes(record.followStatus)) return false
      if (filters.sources.length && !filters.sources.includes(record.source)) return false
      if (filters.crm !== '全部' && record.crmStatus !== filters.crm) return false
      if (filters.assignee !== '全部' && record.assignee !== filters.assignee) return false
      if (filters.triggerEvents.length && !filters.triggerEvents.includes(record.triggerEvent)) return false
      if (filters.assignmentEvents.length && !filters.assignmentEvents.includes(record.assignmentEvent)) return false
      if (filters.triggerDate && record.triggerAt !== filters.triggerDate.format('YYYY-MM-DD')) return false
      if (filters.assignmentDate && record.assignmentAt !== filters.assignmentDate.format('YYYY-MM-DD')) return false
      if (filters.timeout && !record.timeout) return false
      if (!keyword) return true
      return [record.customer, record.account, record.whatsappAccount, record.conversationId]
        .join(' ')
        .toLowerCase()
        .includes(keyword)
    })
  }, [filters, records])

  const stats = [
    { key: 'pending', label: '待分配线索', value: metric(records, (record) => record.assignStatus === '待分配') },
    { key: 'assigned', label: '已分配线索', value: metric(records, (record) => record.assignStatus === '已分配') },
    { key: 'timeout', label: '跟进超时', value: metric(records, (record) => record.timeout), tone: 'danger' },
    { key: 'reassign', label: '可再次分配', value: metric(records, canReassign), tone: 'warning' },
  ]

  const assistantSalesStats = useMemo(
    () => buildSalesStats(records, assistantPeriod),
    [assistantPeriod, records],
  )

  const assistantRecommendations = useMemo(
    () => buildRecommendations(records).filter((item) => !ignoredRecommendationIds.includes(item.id)),
    [ignoredRecommendationIds, records],
  )

  const topLoadedSales = assistantSalesStats.reduce(
    (current, item) => (item.total > current.total ? item : current),
    assistantSalesStats[0] || { total: 0, sales: '-' },
  )

  const bestActiveSales = assistantSalesStats.reduce(
    (current, item) => (item.activityScore > current.activityScore ? item : current),
    assistantSalesStats[0] || { activityScore: 0, sales: '-' },
  )

  useEffect(() => {
    if (!assistantView || assistantPhase !== 'thinking') return undefined
    const timers = assistantThinkingSteps.map((_, index) => (
      window.setTimeout(() => setAssistantStepIndex(index), index * 650)
    ))
    timers.push(window.setTimeout(() => setAssistantPhase('done'), 3000))
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [assistantPhase, assistantView])

  const updateRecord = (id, updater) => {
    setRecords((prev) => prev.map((record) => (record.id === id ? updater(record) : record)))
    setDetailRecord((prev) => (prev?.id === id ? updater(prev) : prev))
  }

  const openScrm = (record) => {
    message.success(`已调起 SCRM 原会话：${record.customer}`)
    navigate('/scrm')
  }

  const applyQuickFilter = (key) => {
    setFilters((prev) => {
      const quickKey = key === 'reassign' ? '可再次分配' : key
      if (prev.quickFilter === quickKey) {
        return { ...prev, quickFilter: '全部', assignStatuses: [], timeout: false }
      }
      if (key === 'pending') return { ...prev, quickFilter: 'pending', assignStatuses: ['待分配'], timeout: false }
      if (key === 'assigned') return { ...prev, quickFilter: 'assigned', assignStatuses: ['已分配'], timeout: false }
      if (key === 'timeout') return { ...prev, quickFilter: 'timeout', assignStatuses: [], timeout: true }
      if (key === 'reassign') return { ...prev, quickFilter: '可再次分配', assignStatuses: [], timeout: false }
      return prev
    })
  }

  const beginAssign = (record) => {
    setAssignTarget(record)
    setAssignUser(record.assignee && record.assignee !== '-' ? record.assignee : salesOptions[0].value)
  }

  const beginRatingEdit = (record) => {
    setRatingTarget(record)
    setRatingDraft(record.rating)
    setRatingReason('')
  }

  const refreshAssignmentDetail = () => {
    message.success('分配详情已刷新')
  }

  const applyAssignment = (record, assignee, isReassign) => ({
    ...record,
    assignStatus: '已分配',
    mainStatus: '已分配',
    followStatus: '待发起建联',
    subStatus: '待发起建联',
    assignee,
    assignmentEvent: isReassign ? '再次分配' : '首次分配',
    timeout: false,
    timeoutText: '',
    reassignReason: '',
    lastAction: `${isReassign ? 'PM 再次分配' : 'PM 分配'}给 ${assignee}`,
    lastActionAt: nowText(),
    timeline: [
      ...record.timeline,
      {
        time: nowText(),
        title: isReassign ? '再次分配' : '完成分配',
        desc: `PM 二次确认后分配给 ${assignee}。`,
      },
    ],
    operations: [
      {
        time: nowText(),
        operator: 'PM Mike Liu',
        action: `${isReassign ? '再次分配' : '分配'}给 ${assignee}`,
      },
      ...record.operations,
    ],
  })

  const confirmAssign = () => {
    if (!assignTarget || !assignUser) return
    const isReassign = assignTarget.mainStatus === '已分配'
    updateRecord(assignTarget.id, (record) => applyAssignment(record, assignUser, isReassign))
    message.success(isReassign ? '已完成再次分配' : '已完成分配')
    setAssignTarget(null)
  }

  const confirmRatingEdit = () => {
    if (!ratingTarget || !ratingReason.trim()) {
      message.warning('请填写修改原因')
      return
    }
    const scoreMap = { A级: 92, B级: 78, C级: 60, D级: 42 }
    updateRecord(ratingTarget.id, (record) => ({
      ...record,
      rating: ratingDraft,
      aiLevel: ratingDraft.replace('级', ''),
      score: scoreMap[ratingDraft],
      lastAction: `PM 修改评级为${ratingDraft}`,
      lastActionAt: nowText(),
      operations: [
        {
          time: nowText(),
          operator: 'PM Mike Liu',
          action: `修改评级为${ratingDraft}，原因：${ratingReason.trim()}`,
        },
        ...record.operations,
      ],
    }))
    message.success('评级已修改')
    setRatingTarget(null)
  }

  const confirmBatchAssign = () => {
    const selected = records.filter((record) => selectedRowKeys.includes(record.id))
    const eligibleIds = selected
      .filter((record) => record.assignStatus === '待分配' || canReassign(record))
      .map((record) => record.id)

    if (eligibleIds.length === 0) {
      message.warning('当前选择的线索暂无可分配项')
      return
    }

    setRecords((prev) => prev.map((record) => (
      eligibleIds.includes(record.id)
        ? applyAssignment(record, batchAssignUser, record.assignStatus === '已分配')
        : record
    )))
    setSelectedRowKeys([])
    setBatchAssignOpen(false)
    message.success('批量分配已完成')
  }

  const startAssistantQuestion = (view) => {
    setAssistantView(view)
    setAssistantPhase('thinking')
    setAssistantStepIndex(0)
    if (view === 'recommendation') {
      setAssistantPeriod('7d')
    }
  }

  const executeRecommendations = (ids) => {
    const rows = assistantRecommendations.filter((item) => ids.includes(item.id))
    if (!rows.length) {
      message.warning('请先选择可执行的建议')
      return
    }

    const assignmentMap = new Map(rows.map((item) => [
      item.id,
      recommendationOverrides[item.id] || item.suggestedAssignee,
    ]))

    setRecords((prev) => prev.map((record) => {
      const assignee = assignmentMap.get(record.id)
      if (!assignee) return record
      return applyAssignment(record, assignee, record.assignStatus === '已分配')
    }))
    setSelectedRecommendationKeys([])
    setIgnoredRecommendationIds((prev) => Array.from(new Set([...prev, ...ids])))
    message.success(`已执行 ${rows.length} 条分配建议`)
  }

  const ignoreRecommendation = (id) => {
    setIgnoredRecommendationIds((prev) => Array.from(new Set([...prev, id])))
    setSelectedRecommendationKeys((prev) => prev.filter((key) => key !== id))
  }

  const columns = [
    {
      title: '客户信息',
      dataIndex: 'customer',
      width: 280,
      fixed: 'left',
      render: (_, record) => (
        <div className="cm-customer-cell">
          <div className="cm-customer-title-row">
            <button className="cm-link-button" onClick={() => setDetailRecord(record)}>
              {record.customer}
            </button>
            <div className="cm-customer-tags">
              {record.customerTags?.map((tag) => (
                <span className="cm-customer-tag" key={tag}>{tag}</span>
              ))}
            </div>
          </div>
          <div className="cm-customer-meta">
            <span className="cm-customer-line">
              <em>手机号</em>
              <strong>{record.whatsappAccount}</strong>
            </span>
          </div>
        </div>
      ),
    },
    {
      title: '线索评级',
      dataIndex: 'rating',
      width: 120,
      render: (rating, record) => (
        <div className="cm-rating-cell">
          <span className={`cm-rating-chip is-${record.aiLevel.toLowerCase()}`}>{rating}</span>
          <div className="cm-rating-hover-card">
            {renderRatingPreview(record)}
          </div>
        </div>
      ),
    },
    {
      title: '线索摘要',
      dataIndex: 'summary',
      width: 340,
      render: (summary) => <span className="cm-summary-text">{summary}</span>,
    },
    {
      title: '分配状态',
      dataIndex: 'assignStatus',
      width: 120,
      render: (status) => <span className={`cm-status-pill ${assignStatusClass(status)}`}>{status}</span>,
    },
    {
      title: '跟进状态',
      dataIndex: 'followStatus',
      width: 210,
      render: (_, record) => (
        <div className="cm-follow-cell">
          {record.followStatus ? (
            <span className={`cm-status-pill ${followStatusClass(record.followStatus)}`}>
              {record.followStatus}
            </span>
          ) : (
            <Text type="secondary">-</Text>
          )}
          {record.timeout && <span className="cm-timeout-note">跟进超时 {record.timeoutText}</span>}
        </div>
      ),
    },
    {
      title: 'CRM 归属',
      dataIndex: 'crmStatus',
      width: 160,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          <Tag color={crmColor(record.crmStatus)}>{record.crmStatus}</Tag>
          <Text type="secondary">{record.crmOwner}</Text>
        </Space>
      ),
    },
    {
      title: '被分配人',
      dataIndex: 'assignee',
      width: 130,
      render: (assignee) => <Text>{assignee}</Text>,
    },
    {
      title: '分配人',
      dataIndex: 'allocator',
      width: 120,
      render: (allocator) => <Text>{allocator}</Text>,
    },
    {
      title: '触发时间',
      dataIndex: 'triggerTime',
      width: 130,
      render: (time) => <Text>{time}</Text>,
    },
    {
      title: '分配时间',
      dataIndex: 'assignmentTime',
      width: 130,
      render: (time) => <Text>{time || '-'}</Text>,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => {
        const assignedLocked = record.assignStatus === '已分配' && !canReassign(record)
        return (
          <Space size={10}>
            <button className="cm-text-action" onClick={() => setDetailRecord(record)}>详情</button>
            <button
              className="cm-text-action"
              disabled={assignedLocked}
              onClick={() => beginAssign(record)}
            >
              {canReassign(record) ? '再次分配' : '分配'}
            </button>
          </Space>
        )
      },
    },
  ]

  const assistantDistributionColumns = [
    {
      title: '销售',
      dataIndex: 'sales',
      fixed: 'left',
      width: 150,
      render: (value, record) => (
        <div className="cm-assistant-sales-cell">
          <strong>{value}</strong>
          <span>{record.role}</span>
        </div>
      ),
    },
    {
      title: '分配量',
      dataIndex: 'total',
      sorter: (a, b) => a.total - b.total,
      width: 86,
      render: (value, record) => <strong className={record.isMaxTotal ? 'cm-assistant-max-value' : ''}>{value}</strong>,
    },
    { title: 'A级', dataIndex: 'A级', sorter: (a, b) => a['A级'] - b['A级'], width: 72 },
    { title: 'B级', dataIndex: 'B级', sorter: (a, b) => a['B级'] - b['B级'], width: 72 },
    { title: 'C级', dataIndex: 'C级', sorter: (a, b) => a['C级'] - b['C级'], width: 72 },
    { title: 'D级', dataIndex: 'D级', sorter: (a, b) => a['D级'] - b['D级'], width: 72 },
    { title: '超时', dataIndex: 'timeout', sorter: (a, b) => a.timeout - b.timeout, width: 72 },
    { title: '已建联', dataIndex: 'connected', sorter: (a, b) => a.connected - b.connected, width: 86 },
    { title: '待跟进', dataIndex: 'waiting', sorter: (a, b) => a.waiting - b.waiting, width: 86 },
  ]

  const assistantRecommendationColumns = [
    {
      title: '线索',
      dataIndex: 'customer',
      width: 190,
      render: (value, record) => (
        <div className="cm-assistant-lead-cell">
          <strong>{value}</strong>
          <span>{record.source} · {record.status}</span>
        </div>
      ),
    },
    {
      title: '等级',
      dataIndex: 'rating',
      width: 72,
      render: (value) => <Tag color={value === 'A级' ? 'red' : value === 'B级' ? 'blue' : 'default'}>{value}</Tag>,
    },
    {
      title: '建议销售',
      dataIndex: 'suggestedAssignee',
      width: 180,
      render: (value, record) => (
        <Select
          size="small"
          value={recommendationOverrides[record.id] || value}
          options={salesOptions}
          onChange={(nextValue) => {
            setRecommendationOverrides((prev) => ({ ...prev, [record.id]: nextValue }))
          }}
          className="cm-assistant-select"
        />
      ),
    },
    {
      title: '建议依据',
      dataIndex: 'reason',
      render: (value, record) => (
        <div className="cm-assistant-reason">
          <p>{value}</p>
          <span>置信度 {record.confidence}%</span>
        </div>
      ),
    },
    {
      title: '操作',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size={8}>
          <button className="cm-text-action" onClick={() => setDetailRecord(records.find((item) => item.id === record.id))}>详情</button>
          <button className="cm-text-action is-primary" onClick={() => executeRecommendations([record.id])}>执行</button>
          <button className="cm-text-action" onClick={() => ignoreRecommendation(record.id)}>忽略</button>
        </Space>
      ),
    },
  ]

  const renderAssistantThinking = () => (
    <div className="cm-assistant-thinking">
      <div className="cm-assistant-thinking-head">
        <span className="cm-assistant-orbit" />
        <strong>正在思考</strong>
      </div>
      {assistantThinkingSteps.slice(0, assistantStepIndex + 1).map((step, index) => (
        <div className="cm-assistant-thought is-active" key={step}>
          <span />
          <p>{step}</p>
          <em>{index + 1}秒</em>
        </div>
      ))}
    </div>
  )

  const renderAssistantElapsed = () => (
    <div className="cm-assistant-elapsed">
      <span className="cm-assistant-elapsed-icon" />
      <strong>已处理</strong>
      <em>{assistantView === 'summary' ? '9m 24s' : '11m 08s'}</em>
      <i>›</i>
    </div>
  )

  const renderAssistantSummary = () => (
    <div className="cm-assistant-answer">
      <div className="cm-assistant-section">
        <h3>近期分配情况</h3>
        <p>
          {getPeriodLabel(assistantPeriod)}共统计到 {assistantSalesStats.reduce((sum, item) => sum + item.total, 0)} 条已分配线索。
          当前 {topLoadedSales.sales} 承接量最高，为 {topLoadedSales.total} 条；
          {bestActiveSales.sales} 的建联积极性相对更好，建联率约 {bestActiveSales.activityScore}%。
          待分配线索 {stats[0].value} 条、可再次分配 {stats[3].value} 条，建议优先处理 A/B 级和超时线索。
        </p>
      </div>
      <div className="cm-assistant-kpi-row">
        <div>
          <span>总分配量</span>
          <strong>{assistantSalesStats.reduce((sum, item) => sum + item.total, 0)}</strong>
        </div>
        <div className="is-highlight">
          <span>最高承接</span>
          <strong>{topLoadedSales.sales}</strong>
          <em>{topLoadedSales.total} 条</em>
        </div>
        <div>
          <span>建联表现</span>
          <strong>{bestActiveSales.sales}</strong>
          <em>{bestActiveSales.activityScore}%</em>
        </div>
      </div>
      <Segmented
        block
        options={assistantPeriods}
        value={assistantPeriod}
        onChange={setAssistantPeriod}
        className="cm-assistant-periods"
      />
      <Table
        size="small"
        rowKey="key"
        columns={assistantDistributionColumns}
        dataSource={assistantSalesStats}
        pagination={false}
        scroll={{ x: 820 }}
        className="cm-assistant-table"
      />
    </div>
  )

  const renderAssistantRecommendations = () => (
    <div className="cm-assistant-answer">
      <div className="cm-assistant-section">
        <h3>线索分配建议</h3>
        <p>
          我先按近期负载、线索等级、跟进积极性和超时风险做平衡。建议优先执行 {assistantRecommendations.length} 条可处理线索：
          高价值线索优先分给低负载且建联表现稳定的销售，超时线索优先重新分配，避免继续沉淀。
        </p>
      </div>
      <div className="cm-assistant-kpi-row">
        <div>
          <span>可执行建议</span>
          <strong>{assistantRecommendations.length}</strong>
        </div>
        <div className="is-highlight">
          <span>高价值优先</span>
          <strong>{assistantRecommendations.filter((item) => item.rating === 'A级').length}</strong>
          <em>A级</em>
        </div>
        <div>
          <span>需再分配</span>
          <strong>{assistantRecommendations.filter((item) => item.status === '已分配').length}</strong>
          <em>超时/失败</em>
        </div>
      </div>
      <div className="cm-assistant-recommendation-actions">
        <Text type="secondary">已选 {selectedRecommendationKeys.length} 条</Text>
        <Space>
          <Button onClick={() => executeRecommendations(selectedRecommendationKeys)} disabled={!selectedRecommendationKeys.length}>
            执行选中建议
          </Button>
          <Button type="primary" onClick={() => executeRecommendations(assistantRecommendations.map((item) => item.id))} disabled={!assistantRecommendations.length}>
            全部执行
          </Button>
        </Space>
      </div>
      <Table
        size="small"
        rowKey="id"
        columns={assistantRecommendationColumns}
        dataSource={assistantRecommendations}
        pagination={{ pageSize: 5, showSizeChanger: false }}
        rowSelection={{
          selectedRowKeys: selectedRecommendationKeys,
          onChange: setSelectedRecommendationKeys,
          preserveSelectedRowKeys: false,
        }}
        scroll={{ x: 880 }}
        className="cm-assistant-table"
      />
    </div>
  )

  const renderAssistantFollowups = () => (
    <div className="cm-assistant-followups">
      <strong>继续提问</strong>
      {assistantView === 'summary' ? (
        <>
          <button onClick={() => setAssistantPeriod('7d')}>近7天A级线索集中在哪些销售？</button>
          <button onClick={() => startAssistantQuestion('recommendation')}>基于这些情况给我分配建议</button>
        </>
      ) : (
        <>
          <button onClick={() => startAssistantQuestion('summary')}>先看近期分配统计</button>
          <button onClick={() => message.info('已聚焦A级和超时线索，可继续调整销售后执行')}>只看A级和超时线索</button>
        </>
      )}
    </div>
  )

  return (
    <div className="gb-page cm-page">
      <div className="cm-page-header">
        <div>
          <h1 className="gb-page-title">线索分配</h1>
          <p className="gb-page-desc">AI 业务员接待后生成的线索表单，供 PM 分配、监督跟进并查看 SCRM 上下文。</p>
        </div>
        <Button onClick={() => setAssistantOpen(true)}>分配助手</Button>
      </div>

      <div className="cm-filter-bar">
        <Space>
          <Select
            mode="multiple"
            allowClear
            placeholder="选择线索等级"
            value={filters.ratings}
            options={['A级', 'B级', 'C级', 'D级'].map((value) => ({ value, label: value }))}
            onChange={(value) => setFilters((prev) => ({ ...prev, ratings: value }))}
            style={{ width: 150 }}
          />
          <Select
            mode="multiple"
            allowClear
            placeholder="来源渠道"
            value={filters.sources}
            options={['agent南美', 'agent北美', 'agent南亚'].map((value) => ({ value, label: value }))}
            onChange={(value) => setFilters((prev) => ({ ...prev, sources: value }))}
            style={{ width: 160 }}
          />
          <Select
            mode="multiple"
            allowClear
            placeholder="选择跟进状态"
            value={filters.followStatuses}
            options={followStatusOptions.map((value) => ({ value, label: value }))}
            onChange={(value) => setFilters((prev) => ({ ...prev, followStatuses: value }))}
            style={{ width: 180 }}
          />
          <DatePicker
            placeholder="触发时间"
            value={filters.triggerDate}
            onChange={(value) => setFilters((prev) => ({ ...prev, triggerDate: value }))}
            style={{ width: 136 }}
          />
          <DatePicker
            placeholder="分配时间"
            value={filters.assignmentDate}
            onChange={(value) => setFilters((prev) => ({ ...prev, assignmentDate: value }))}
            style={{ width: 136 }}
          />
          <Select
            allowClear
            placeholder="被分配人"
            value={filters.assignee === '全部' ? undefined : filters.assignee}
            options={salesOptions.map((item) => ({ value: item.value, label: item.value }))}
            onChange={(value) => setFilters((prev) => ({ ...prev, assignee: value || '全部' }))}
            style={{ width: 142 }}
          />
        </Space>
        <Input.Search
          allowClear
          placeholder="搜索客户名、WhatsApp ID"
          value={filters.keyword}
          onChange={(event) => setFilters((prev) => ({ ...prev, keyword: event.target.value }))}
          style={{ width: 280 }}
        />
      </div>

      <div className="cm-stat-strip">
        {stats.map((item) => {
          const activeKey = item.key === 'reassign' ? '可再次分配' : item.key
          return (
            <button
              className={`cm-stat ${item.tone ? `is-${item.tone}` : ''} ${filters.quickFilter === activeKey ? 'is-active' : ''}`}
              key={item.label}
              onClick={() => applyQuickFilter(item.key)}
            >
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </button>
          )
        })}
      </div>

      {selectedRowKeys.length > 0 && (
        <div className="cm-table-toolbar">
          <Text type="secondary">已选 {selectedRowKeys.length} 条</Text>
          <Button
            type="primary"
            className="cm-batch-button"
            onClick={() => setBatchAssignOpen(true)}
          >
            批量分配
          </Button>
        </div>
      )}

      <Table
        rowKey="id"
        className="cm-table"
        columns={columns}
        dataSource={filteredRecords}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
          preserveSelectedRowKeys: true,
        }}
        pagination={{ pageSize: 10, showSizeChanger: false }}
        scroll={{ x: 1780 }}
      />

      <Drawer
        open={!!detailRecord}
        title={detailRecord ? `线索详情 · ${detailRecord.customer}` : '线索详情'}
        width={780}
        onClose={() => setDetailRecord(null)}
        extra={detailRecord && (
          <Space>
            <Button icon={<MessageOutlined />} onClick={() => openScrm(detailRecord)}>
              定位原会话
            </Button>
            <Button onClick={() => beginRatingEdit(detailRecord)}>修改评级</Button>
            <Button type="primary" onClick={() => beginAssign(detailRecord)}>分配</Button>
          </Space>
        )}
      >
        {detailRecord && (
          <Tabs
            className="cm-detail-tabs"
            items={[
              {
                key: 'rating',
                label: 'AI 评级',
                children: (
                  <div className="cm-drawer-stack">
                    <section className="cm-drawer-section cm-rating-section">
                      <div className="cm-rating-stamp">
                        <span>{detailRecord.aiLevel}级</span>
                        <strong>{detailRecord.score}分</strong>
                      </div>
                      <h3>线索评级</h3>
                      <table className="cm-rating-table">
                        <thead>
                          <tr>
                            <th>要素类别</th>
                            <th>要素详情</th>
                            <th>得分权重</th>
                          </tr>
                        </thead>
                        <tbody>
                        {detailRecord.ratingFactors.map((item) => (
                            <tr key={`${getFactorCategory(item)}-${getFactorDetail(item)}`}>
                              <td>{getFactorCategory(item)}</td>
                              <td>{getFactorDetail(item)}</td>
                              <td>{item.score}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </section>

                    <section className="cm-drawer-section cm-ai-summary-section">
                      <h3>AI 总结</h3>
                      <p>{detailRecord.aiSummary}</p>
                    </section>

                    <section className="cm-drawer-section">
                      <h3>关键对话片段</h3>
                      <div className="cm-snippet-list">
                        {detailRecord.snippets
                          .filter((item) => item.speaker === '客户')
                          .map((item, index) => (
                          <div className="cm-snippet cm-snippet-with-action" key={`${item.speaker}-${index}`}>
                            <div>
                              <span>{item.speaker}</span>
                              <p>{item.text}</p>
                            </div>
                            <div className="cm-snippet-action-wrap">
                              <button className="cm-locate-button" onClick={() => openScrm(detailRecord)}>详情</button>
                              {renderSnippetContext(item)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                ),
              },
              {
                key: 'assignment',
                label: '分配详情',
                children: (
                  <div className="cm-drawer-stack">
                    <section className="cm-drawer-section">
                      <div className="cm-section-head">
                        <h3>基本信息</h3>
                        <Button
                          size="small"
                          icon={<ReloadOutlined />}
                          onClick={refreshAssignmentDetail}
                        >
                          刷新
                        </Button>
                      </div>
                      <div className="cm-detail-info-grid">
                        <div><span>客户名</span><strong>{detailRecord.customer}</strong></div>
                        <div><span>账号名</span><strong>{detailRecord.account}</strong></div>
                        <div><span>手机号</span><strong>{detailRecord.whatsappAccount}</strong></div>
                        <div><span>客户进线时间</span><strong>{detailRecord.triggerTime}</strong></div>
                        <div><span>推送时间</span><strong>{detailRecord.pushTime}</strong></div>
                        <div><span>分配时间</span><strong>{detailRecord.assignmentTime || '-'}</strong></div>
                        <div><span>分配人</span><strong>{detailRecord.allocator}</strong></div>
                        <div><span>被分配人</span><strong>{detailRecord.assignee}</strong></div>
                        <div><span>跟进状态</span><strong>{detailRecord.followStatus}</strong></div>
                        <div><span>CRM 状态</span><strong>{detailRecord.crmStatus}</strong></div>
                      </div>
                    </section>

                    <section className="cm-drawer-section">
                      <h3>客户生命周期</h3>
                      <div className="cm-lifecycle-list">
                        {getLifecycleItems(detailRecord).map((item, index) => (
                          <div className="cm-lifecycle-item" key={`${item.time}-${item.title}-${index}`}>
                            <div className="cm-lifecycle-node" />
                            <div className="cm-lifecycle-content">
                              <div className="cm-lifecycle-head">
                                <strong>{item.title}</strong>
                                <span>{item.time}</span>
                              </div>
                              <p>{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                ),
              },
            ]}
          />
        )}
      </Drawer>

      <Modal
        open={!!assignTarget}
        title="线索分配"
        okText="确认分配"
        cancelText="取消"
        onCancel={() => setAssignTarget(null)}
        onOk={confirmAssign}
        okButtonProps={{ disabled: !assignUser }}
      >
        {assignTarget && (
          <Space direction="vertical" size={16} className="cm-modal-content">
            <div className="cm-assign-brief">
              <div>
                <span>{assignTarget.rating}</span>
                <strong>{assignTarget.customer}</strong>
              </div>
              <p>{assignTarget.summary}</p>
            </div>
            {assignTarget.reassignReason && (
              <Alert type="warning" showIcon message={`再次分配原因：${assignTarget.reassignReason}`} />
            )}
            <div className="cm-field-label">被分配人</div>
            <Select
              showSearch
              value={assignUser}
              options={salesOptions}
              onChange={setAssignUser}
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              className="cm-full-width"
            />
          </Space>
        )}
      </Modal>

      <Modal
        open={!!ratingTarget}
        title="修改评级"
        okText="确认修改"
        cancelText="取消"
        onCancel={() => setRatingTarget(null)}
        onOk={confirmRatingEdit}
      >
        <Space direction="vertical" size={16} className="cm-modal-content">
          <div className="cm-field-label">线索等级</div>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={ratingDraft}
            onChange={(event) => setRatingDraft(event.target.value)}
            options={['A级', 'B级', 'C级', 'D级'].map((value) => ({ label: value, value }))}
          />
          <div className="cm-field-label">修改原因</div>
          <Input.TextArea
            value={ratingReason}
            onChange={(event) => setRatingReason(event.target.value)}
            placeholder="请输入修改原因，例如：客户补充了预算和项目面积，线索质量提升"
            rows={4}
          />
        </Space>
      </Modal>

      <Modal
        open={batchAssignOpen}
        title="批量分配线索"
        okText="确认分配"
        cancelText="取消"
        onCancel={() => setBatchAssignOpen(false)}
        onOk={confirmBatchAssign}
      >
        <Space direction="vertical" size={16} className="cm-modal-content">
          <Alert
            type="info"
            showIcon
            message="将仅分配当前选择中可分配或可再次分配的线索"
          />
          <Select
            value={batchAssignUser}
            options={salesOptions}
            onChange={setBatchAssignUser}
            className="cm-full-width"
          />
        </Space>
      </Modal>

      <Drawer
        open={assistantOpen}
        title="分配助手"
        width="min(50vw, 860px)"
        onClose={() => setAssistantOpen(false)}
        className="cm-assistant-drawer"
      >
        <div className="cm-assistant-window">
          {!assistantView && (
            <div className="cm-assistant-home">
              <div className="cm-assistant-greeting">
                <BulbOutlined />
                <h3>Hi，我可以帮你看分配情况和下一步怎么分</h3>
                <p>问答范围：当前线索分配池、销售负载、评级、跟进状态和可再次分配线索。</p>
              </div>
              <div className="cm-assistant-preset-list">
                <button onClick={() => startAssistantQuestion('summary')}>近期分配情况</button>
                <button onClick={() => startAssistantQuestion('recommendation')}>线索分配建议</button>
              </div>
            </div>
          )}

          {assistantView && (
            <>
              <div className="cm-assistant-bubble is-user">
                {assistantView === 'summary' ? '近期分配情况' : '线索分配建议'}
              </div>
              {assistantPhase === 'thinking' && renderAssistantThinking()}
              {assistantPhase === 'done' && (
                <>
                  {renderAssistantElapsed()}
                  <div className="cm-assistant-bubble is-agent">
                    {assistantView === 'summary' ? renderAssistantSummary() : renderAssistantRecommendations()}
                  </div>
                  {renderAssistantFollowups()}
                </>
              )}
            </>
          )}

          <div className="cm-assistant-input-box">
            <Input
              placeholder="有问题尽管问我..."
              onPressEnter={() => startAssistantQuestion('recommendation')}
              suffix={<Button type="text" shape="circle" icon={<SendOutlined />} onClick={() => startAssistantQuestion('recommendation')} />}
            />
            <div className="cm-assistant-input-shortcuts">
              <button onClick={() => startAssistantQuestion('summary')}>近期分配情况</button>
              <button onClick={() => startAssistantQuestion('recommendation')}>线索分配建议</button>
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
