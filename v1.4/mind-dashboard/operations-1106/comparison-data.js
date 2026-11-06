import { summarizeOperations } from './workspace-data.js'

const countFields = ['exposure', 'inquiries', 'transfers', 'crmCustomers', 'projects', 'visits', 'deals']
const amountFields = ['spend', 'amount']
const previousRatios = {
  spend: 1.07, exposure: .95, inquiries: .93, transfers: 1.08,
  crmCustomers: .96, projects: 1.10, visits: 1.06, deals: .92, amount: .91,
}
const safeNumber = value => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0

function hash(text) {
  let value = 2166136261
  for (const char of String(text)) value = Math.imul(value ^ char.charCodeAt(0), 16777619) >>> 0
  return value
}

function previousPlan(plan, factor, periodSeed) {
  // 每条投放记录独立生成同长度上一周期，筛选或分组不会改写历史贡献量。
  const identity = plan.id ?? `${plan.account || ''}/${plan.name || ''}/${plan.ad || ''}`
  const previous = { ...plan }
  for (const field of [...amountFields, ...countFields]) {
    const currentValue = Math.round(safeNumber(plan[field]) * safeNumber(factor))
    const variation = (hash(`${identity}/${periodSeed}/${field}`) % 33 - 16) / 100
    previous[field] = Math.round(currentValue * (previousRatios[field] + variation))
  }
  if (plan.conversionSource === 'advertising') {
    previous.transfers = Math.min(previous.transfers, previous.inquiries)
    previous.crmCustomers = Math.min(previous.crmCustomers, previous.transfers)
  }
  previous.projects = Math.min(previous.projects, previous.crmCustomers)
  previous.visits = Math.min(previous.visits, previous.crmCustomers)
  previous.deals = Math.min(previous.deals, previous.projects)
  return previous
}

export function compareOperations(plans = [], factor = 1, periodSeed = '') {
  const current = summarizeOperations(plans, factor)
  const previous = summarizeOperations(plans.map(plan => previousPlan(plan, factor, periodSeed)), 1)
  const changes = Object.fromEntries(Object.keys(current).map(key => [
    key,
    previous[key] ? (current[key] - previous[key]) / previous[key] * 100 : current[key] ? null : 0,
  ]))
  return { current, previous, changes }
}

// 金额与询盘降序、CPA升序；没有询盘时不参与CPA排名，同值并列、后续跳位。
export function rankOperationsPeople(plans = [], people = [], ownerOf = plan => plan.operator, factor = 1) {
  const directory = [...new Map(people.filter(person => person?.name).map(person => [person.name, person])).values()]
  const summaries = directory.map(person => ({
    name: person.name,
    department: person.department || '',
    metrics: summarizeOperations(plans.filter(plan => ownerOf(plan) === person.name), factor),
  }))
  return new Map(summaries.map(person => {
    const ranks = Object.fromEntries(['spend', 'cpa', 'amount', 'inquiries'].map(key => {
      const eligible = key !== 'cpa' || person.metrics.inquiries > 0
      const precedes = peer => key === 'cpa'
        ? peer.metrics.inquiries > 0 && peer.metrics.cpa < person.metrics.cpa
        : peer.metrics[key] > person.metrics[key]
      return [key, {
        value: person.metrics[key],
        companyRank: eligible ? 1 + summaries.filter(precedes).length : null,
        departmentRank: eligible ? 1 + summaries.filter(peer => peer.department === person.department && precedes(peer)).length : null,
      }]
    }))
    return [person.name, { name: person.name, department: person.department, ...ranks }]
  }))
}
