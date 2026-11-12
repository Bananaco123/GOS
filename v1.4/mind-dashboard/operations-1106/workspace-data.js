// 1106 的概览、人员卡和渠道明细使用同一套逐条计量口径。
const gradeKeys = ['a', 'b', 'c']
const pmNames = [
  '周悦 Joy Zhou', '黄琳 Helen Huang', '吴晨 Leo Wu', '赵敏 Nina Zhao',
  '孙涛 Tony Sun', '钱菲 Faye Qian', '郑凯 Kai Zheng', '冯雪 Snow Feng',
  '韩梅 May Han', '杨帆 Frank Yang', '何静 Jane He', '郭明 Mark Guo',
  '罗莎 Rosa Luo', '谢宁 Nina Xie',
]
const pmRegions = ['东南亚', '北美', '欧洲', '中东', '非洲', '南美', '澳洲']
const pmRoster = pmNames.map((name, index) => ({name, region:pmRegions[index % pmRegions.length]}))
const regionOwners = region => pmRoster.filter(person => person.region === region).map(person => person.name)
const regionByCountry = {
  新加坡: '东南亚', 马来西亚: '东南亚', 印度尼西亚: '东南亚', 印尼: '东南亚',
  泰国: '东南亚', 菲律宾: '东南亚', 越南: '东南亚',
  美国: '北美', 加拿大: '北美', 阿联酋: '中东', 沙特阿拉伯: '中东', 沙特: '中东',
  英国: '欧洲', 法国: '欧洲', 德国: '欧洲', 意大利: '欧洲', 荷兰: '欧洲',
  巴西: '南美', 澳大利亚: '澳洲', 新西兰: '澳洲', 南非: '非洲', 肯尼亚: '非洲',
}
const numeric = value => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0
const periodValue = (value, factor) => Math.round(numeric(value) * numeric(factor))
const emptyGrades = () => ({ a: 0, b: 0, c: 0 })
const total = values => values.reduce((sum, value) => sum + value, 0)

export function displayOperatorName(raw = '') {
  const value = String(raw).trim()
  if (!value || /[（(]/.test(value)) return value
  const match = value.match(/^([^\s]+)\s+(.+)$/)
  return match && /[\u3400-\u9fff]/.test(match[1]) ? `${match[1]}（${match[2]}）` : value
}

// 主页/消息触点归入实际投放渠道；自然流仍由 conversionSource 独立标记。
export function operationsChannelOf(plan = {}) {
  const value = String(plan.advertisingChannel || plan.platform || plan.account || '').trim()
  if (/^(meta|facebook|instagram|messenger|threads|whatsapp)\b/i.test(value)) return 'Meta'
  if (/^(google|youtube)\b/i.test(value)) return 'Google Ads'
  if (/^tiktok\b/i.test(value)) return 'TikTok'
  if (/^linkedin\b/i.test(value)) return 'LinkedIn'
  return value || '未标记渠道'
}

export function summarizeOperationsChannels(plans = [], factor = 1) {
  const groups = new Map()
  for (const plan of plans) {
    const channel = operationsChannelOf(plan)
    if (!groups.has(channel)) groups.set(channel, [])
    groups.get(channel).push(plan)
  }
  return [...groups].map(([channel, source]) => ({
    channel,
    adCount: source.filter(plan => plan.conversionSource === 'advertising').length,
    ...summarizeOperations(source, factor),
  })).sort((a, b) => b.spend - a.spend || a.channel.localeCompare(b.channel))
}

export function summarizeOperations(plans = [], factor = 1) {
  const result = {
    spend: 0, exposure: 0, inquiries: 0, valid: 0,
    crmCustomers: 0, projects: 0, visits: 0, deals: 0, amount: 0,
    cpm: 0, cpa: 0, validRate: 0, accounts: 0, channels: 0,
  }
  const accounts = new Set()
  const channels = new Set()
  for (const plan of plans) {
    if (plan.account) accounts.add(plan.account)
    if (plan.conversionSource === 'advertising') {
      channels.add(operationsChannelOf(plan))
      for (const key of ['spend', 'exposure', 'inquiries']) result[key] += periodValue(plan[key], factor)
      result.valid += periodValue(plan.transfers, factor)
    }
    for (const key of ['crmCustomers', 'projects', 'visits', 'deals', 'amount']) {
      result[key] += periodValue(plan[key], factor)
    }
  }
  result.cpm = result.exposure ? result.spend / result.exposure * 1000 : 0
  result.cpa = result.inquiries ? result.spend / result.inquiries : 0
  result.validRate = result.inquiries ? result.valid / result.inquiries * 100 : 0
  result.accounts = accounts.size
  result.channels = channels.size
  return result
}

// 最大余数法；有容量时，后段人数不超过上一阶段人数。
function allocate(value, weights, capacities = weights.map(() => Infinity)) {
  let remaining = Math.min(Math.round(numeric(value)), total(capacities))
  const result = weights.map(() => 0)
  while (remaining > 0) {
    const active = weights.map((_, index) => index).filter(index => result[index] < capacities[index])
    if (!active.length) break
    const weightTotal = total(active.map(index => numeric(weights[index])))
    const shares = active.map(index => ({
      index,
      raw: remaining * (weightTotal ? numeric(weights[index]) / weightTotal : 1 / active.length),
    }))
    let allocated = 0
    for (const { index, raw } of shares) {
      const count = Math.min(Math.floor(raw), capacities[index] - result[index])
      result[index] += count
      allocated += count
    }
    remaining -= allocated
    if (!remaining) break
    shares.sort((a, b) => (b.raw % 1) - (a.raw % 1) || a.index - b.index)
    for (const { index } of shares) {
      if (remaining && result[index] < capacities[index]) {
        result[index]++
        remaining--
      }
    }
  }
  return result
}

function stableSeed(plan) {
  return [...String(plan.id ?? plan.name ?? '')].reduce((seed, char) => (seed * 31 + char.charCodeAt(0)) >>> 0, 7)
}

function projectTypeOf(plan) {
  return plan.crmProjectType || (/设计师|承包商|经销商|联营|门店|办公|酒店/.test(`${plan.name || ''} ${plan.group || ''}`) ? '工装' : '家装')
}

function newPmRow(name, crmOnly, region) {
  return {
    name, region, assigned: 0, adAssigned: 0, crmOnly,
    grades: emptyGrades(), connected: emptyGrades(), projects: emptyGrades(),
    deals: emptyGrades(), amount: emptyGrades(),
    crm: { projects: 0, deals: 0, amount: 0 },
    projectTypes: new Set(),
  }
}

export function buildOperationsPmRows(plans = [], factor = 1, filters = {}) {
  const { region = 'all', projectType = 'all' } = filters
  const rows = new Map()
  const getRow = (name, crmOnly, regionName, typeName) => {
    const key = `${name}/${crmOnly ? 'crm' : 'ad'}/${regionName}`
    if (!rows.has(key)) rows.set(key, newPmRow(name, crmOnly, regionName))
    const row = rows.get(key)
    row.projectTypes.add(typeName)
    return row
  }

  for (const plan of plans) {
    const regionName = plan.crmRegion || regionByCountry[plan.country] || '其他地区'
    const typeName = projectTypeOf(plan)
    if (region !== 'all' && region !== regionName) continue
    if (projectType !== 'all' && projectType !== typeName) continue
    const seed = stableSeed(plan)
    const candidates = regionOwners(regionName)
    // 同一 PM 固定承接一个地区；未标记地区使用独立的演示人员。
    const pool = candidates.length ? candidates : ['江晨 Chris Jiang', '唐悦 Tina Tang']
    if (plan.conversionSource !== 'advertising') {
      const row = getRow(plan.crmPm || pool[seed % pool.length], true, regionName, typeName)
      row.assigned += periodValue(plan.crmCustomers, factor)
      for (const key of ['projects', 'deals', 'amount']) row.crm[key] += periodValue(plan[key], factor)
      continue
    }

    // 固定业务归属不随筛选范围变化，运营人员和承接 PM 不直接等同。
    const owners = plan.crmPm ? [plan.crmPm] : [pool[seed % pool.length], pool[(seed + 1) % pool.length]]
    const ownerWeights = owners.length === 1 ? [1] : [3, 2]
    const assigned = periodValue(plan.transfers, factor)
    const grades = allocate(assigned, [40 + seed % 9, 34, 26 - seed % 9])
    const projectCount = Math.min(assigned, periodValue(plan.projects, factor))
    const connectedCount = Math.min(assigned, Math.max(projectCount, Math.round(assigned * .76)))
    const connected = allocate(connectedCount, [50, 32, 18], grades)
    const projects = allocate(projectCount, [56, 30, 14], connected)
    const deals = allocate(Math.min(projectCount, periodValue(plan.deals, factor)), [62, 27, 11], projects)
    const amount = allocate(periodValue(plan.amount, factor), total(deals) ? deals : projects)

    for (let gradeIndex = 0; gradeIndex < gradeKeys.length; gradeIndex++) {
      const grade = gradeKeys[gradeIndex]
      const memberGrades = allocate(grades[gradeIndex], ownerWeights)
      const memberConnected = allocate(connected[gradeIndex], ownerWeights, memberGrades)
      const memberProjects = allocate(projects[gradeIndex], ownerWeights, memberConnected)
      const memberDeals = allocate(deals[gradeIndex], ownerWeights, memberProjects)
      const memberAmount = allocate(amount[gradeIndex], total(memberDeals) ? memberDeals : ownerWeights)
      owners.forEach((name, index) => {
        const row = getRow(name, false, regionName, typeName)
        row.assigned += memberGrades[index]
        row.adAssigned += memberGrades[index]
        row.grades[grade] += memberGrades[index]
        row.connected[grade] += memberConnected[index]
        row.projects[grade] += memberProjects[index]
        row.deals[grade] += memberDeals[index]
        row.amount[grade] += memberAmount[index]
      })
    }
  }

  return [...rows.values()].map(({ projectTypes, ...row }) => ({
    ...row,
    projectType: [...projectTypes].join('、'),
  }))
}
