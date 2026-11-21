import { formatOperationsChange } from './comparison-data.js'

const number = new Intl.NumberFormat('zh-CN')
const money = value => `¥${number.format(Math.round(value))}`
const compact = value => value >= 1e6 ? `${(value / 1e6).toFixed(1)}M`
  : value >= 1e5 ? `${Math.round(value / 1e3)}k`
    : value >= 1e3 ? `${(value / 1e3).toFixed(1)}k` : number.format(Math.round(value))

function metricGroups(current) {
  return [
    ['spend', '投放消耗', [['spend', '投放消耗', money(current.spend)]]],
    ['delivery', '曝光 / CPM', [
      ['exposure', '曝光', compact(current.exposure)], ['cpm', 'CPM', current.cpm ? `¥${current.cpm.toFixed(1)}` : '—'],
    ]],
    ['inquiries', '询盘 / CPA', [
      ['inquiries', '询盘', number.format(current.inquiries)], ['cpa', 'CPA', current.cpa ? money(current.cpa) : '—'],
    ]],
    ['leads', '有效询盘', [['leads', '有效询盘', number.format(current.valid), 'valid']]],
    ['crm', 'CRM客户 / CRM立项', [
      ['crmCustomers', 'CRM客户', number.format(current.crmCustomers)], ['crmProjects', 'CRM立项', number.format(current.projects), 'projects'],
    ]],
    ['visits', '客户到店', [['visits', '客户到店', number.format(current.visits)]]],
    ['performance', '业绩金额', [['performance', '业绩金额', money(current.amount), 'amount']]],
  ]
}

export function renderOperationsOverviewMetrics(container, state, { current, changes }, renderAction = () => '') {
  const primaryMetrics = {}
  container.innerHTML = metricGroups(current).map(([key, label, items]) => {
    const [primaryKey, primaryLabel, display, metricKey = primaryKey] = items.find(([itemKey]) => itemKey === state.metricPrimary[key]) || items[0]
    primaryMetrics[key] = { key: primaryKey, label: primaryLabel, display }
    const active = state.trend === key
    const change = formatOperationsChange(changes[metricKey])
    const value = items.length === 1 ? `<strong class="metric-value" title="${display}">${display}</strong>`
      : `<span class="metric-value dual" title="点击数值切换主信息">${items.map(([itemKey, itemLabel, itemValue], index) => {
        const primary = itemKey === primaryKey
        const swap = state.metricSwap?.key === key ? state.metricSwap : null
        const animation = itemKey === swap?.to ? ' swap-grow' : itemKey === swap?.from ? ' swap-shrink' : ''
        return `${index ? '<em>/</em>' : ''}<button class="metric-value-part ${primary ? 'primary' : 'secondary'}${animation}" type="button" data-metric-series="${itemKey}" aria-label="将${itemLabel}设为主信息" aria-pressed="${primary}" title="点击将${itemLabel}设为主信息">${itemValue}</button>`
      }).join('')}</span>`
    return `<div class="metric metric-selector${active ? ' active' : ''}" data-trend-key="${key}" role="button" tabindex="0" aria-pressed="${active}" aria-label="${label}趋势指标"><span class="metric-heading"><span class="metric-label">${label}</span>${renderAction(key, primaryLabel)}</span>${value}<div class="metric-meta"><span class="metric-field period ${change.className}">${change.label}</span></div></div>`
  }).join('')
  return primaryMetrics
}
