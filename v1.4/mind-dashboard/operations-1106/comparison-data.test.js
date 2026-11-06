import test from 'node:test'
import assert from 'node:assert/strict'
import { summarizeOperations } from './workspace-data.js'
import { compareOperations, rankOperationsPeople } from './comparison-data.js'

const plans = [
  { id: 1, account: 'Meta 亚洲', operator: '甲', conversionSource: 'advertising', spend: 101, exposure: 13000, inquiries: 130, transfers: 90, crmCustomers: 70, projects: 40, visits: 20, deals: 10, amount: 18350 },
  { id: 2, account: 'Google 北美', operator: '乙', conversionSource: 'advertising', spend: 142, exposure: 31000, inquiries: 170, transfers: 110, crmCustomers: 95, projects: 60, visits: 30, deals: 13, amount: 22360 },
  { id: 3, account: 'Meta 亚洲', operator: '甲', conversionSource: 'nonAdvertising', crmCustomers: 27, projects: 13, visits: 5, deals: 3, amount: 5210 },
]
const additiveFields = ['spend', 'exposure', 'inquiries', 'valid', 'crmCustomers', 'projects', 'visits', 'deals', 'amount']

test('上一周期可复现、与当前等长，当前业务数据保持不变', () => {
  const before = structuredClone(plans)
  const result = compareOperations(plans, 22.6, '2026-11-06')
  assert.deepEqual(result, compareOperations(plans, 22.6, '2026-11-06'))
  assert.deepEqual(result.current, summarizeOperations(plans, 22.6))
  assert.deepEqual(plans, before)
  assert.notDeepEqual(result.previous, compareOperations(plans, 22.6, '2026-11-05').previous)
  const changes = additiveFields.map(key => result.changes[key])
  assert.ok(changes.some(value => value > 0) && changes.some(value => value < 0))
})

test('不同人员与账号筛选后，上周期贡献量仍能精确加总到全局', () => {
  const global = compareOperations(plans, 5.8, '2026-11-06')
  for (const dimension of ['operator', 'account']) {
    const scopes = [...new Set(plans.map(plan => plan[dimension]))].map(value => compareOperations(plans.filter(plan => plan[dimension] === value), 5.8, '2026-11-06'))
    for (const period of ['current', 'previous']) {
      for (const key of additiveFields) assert.equal(global[period][key], scopes.reduce((sum, scope) => sum + scope[period][key], 0), `${period}/${dimension}/${key}`)
    }
  }
})

test('CPA、CPM 和有效询盘率由上周期实际汇总重新计算，转化阶段不倒挂', () => {
  const { current, previous, changes } = compareOperations(plans, 22.6, '2026-11-06')
  assert.equal(previous.cpa, previous.spend / previous.inquiries)
  assert.equal(previous.cpm, previous.spend / previous.exposure * 1000)
  assert.equal(previous.validRate, previous.valid / previous.inquiries * 100)
  assert.equal(changes.cpa, (current.cpa - previous.cpa) / previous.cpa * 100)
  for (const plan of plans) {
    const { previous: row } = compareOperations([plan], 22.6, '2026-11-06')
    if (plan.conversionSource === 'advertising') assert.ok(row.inquiries >= row.valid && row.valid >= row.crmCustomers)
    assert.ok(row.crmCustomers >= row.projects && row.projects >= row.deals)
    assert.ok(row.crmCustomers >= row.visits)
  }
})

test('空数据、零周期和零分母安全，增长率不使用 Infinity', () => {
  for (const result of [compareOperations([]), compareOperations(plans, 0), compareOperations([{ id: 'new', conversionSource: 'advertising', spend: 1 }])]) {
    assert.ok(Object.values(result.current).every(Number.isFinite))
    assert.ok(Object.values(result.previous).every(Number.isFinite))
    assert.ok(Object.values(result.changes).every(value => value === null || Number.isFinite(value)))
  }
  assert.ok(Object.values(compareOperations([]).changes).every(value => value === 0))
})

test('公司与部门排名按同一原始人员归属计算，同值并列、后续跳位', () => {
  const people = [
    { name: '甲', department: '一部' }, { name: '乙', department: '一部' },
    { name: '丙', department: '二部' }, { name: '丁', department: '二部' },
  ]
  const rankingPlans = [
    { operator: '甲', conversionSource: 'advertising', amount: 200, inquiries: 10 },
    { operator: '乙', conversionSource: 'advertising', amount: 200, inquiries: 20 },
    { operator: '丙', conversionSource: 'advertising', amount: 100, inquiries: 20 },
  ]
  const ranks = rankOperationsPeople(rankingPlans, people, plan => plan.operator, 1)
  assert.deepEqual(ranks.get('甲').amount, { value: 200, companyRank: 1, departmentRank: 1 })
  assert.deepEqual(ranks.get('乙').amount, { value: 200, companyRank: 1, departmentRank: 1 })
  assert.deepEqual(ranks.get('丙').amount, { value: 100, companyRank: 3, departmentRank: 1 })
  assert.deepEqual(ranks.get('丁').amount, { value: 0, companyRank: 4, departmentRank: 2 })
  assert.deepEqual(ranks.get('乙').inquiries, { value: 20, companyRank: 1, departmentRank: 1 })
  assert.deepEqual(ranks.get('甲').inquiries, { value: 10, companyRank: 3, departmentRank: 2 })
  assert.equal(rankOperationsPeople([], []).size, 0)
})

test('消耗由高到低、CPA由低到高；无询盘人员不参与CPA排名', () => {
  const people = ['甲','乙','丙','丁'].map(name => ({ name, department:'一部' }))
  const rows = [
    { operator:'甲', conversionSource:'advertising', spend:100, inquiries:10 },
    { operator:'乙', conversionSource:'advertising', spend:200, inquiries:40 },
    { operator:'丙', conversionSource:'advertising', spend:150, inquiries:30 },
    { operator:'丁', conversionSource:'advertising', spend:50, inquiries:0 },
  ]
  const ranks = rankOperationsPeople(rows, people)
  assert.deepEqual(people.map(({name}) => ranks.get(name).spend.companyRank), [3,1,2,4])
  assert.deepEqual(people.map(({name}) => ranks.get(name).cpa.companyRank), [3,1,1,null])
  assert.equal(ranks.get('丁').cpa.departmentRank, null)
  assert.ok([...rankOperationsPeople(rows, people, p=>p.operator, 0).values()].every(person=>person.cpa.companyRank===null))
})
