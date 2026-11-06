import test from 'node:test'
import assert from 'node:assert/strict'
import { summarizeOperations, displayOperatorName, buildOperationsPmRows } from './workspace-data.js'

const plans = [
  { id: 1, name: '新加坡公寓整装', account: 'Meta 亚洲', operator: '甲', country: '新加坡', conversionSource: 'advertising', spend: 31, exposure: 2100, inquiries: 13, transfers: 9, crmCustomers: 9, projects: 4, visits: 2, deals: 2, amount: 1835 },
  { id: 2, name: '北美设计师合作', account: 'Google 北美', operator: '乙', country: '美国', conversionSource: 'advertising', spend: 42, exposure: 3100, inquiries: 17, transfers: 11, crmCustomers: 11, projects: 6, visits: 3, deals: 3, amount: 2236 },
  { id: 3, name: '老客转介绍', account: 'Meta 亚洲', operator: '甲', country: '新加坡', conversionSource: 'nonAdvertising', crmPm: 'Sarah Wong', crmRegion: '东南亚', crmProjectType: '家装', spend: 99, exposure: 999, inquiries: 99, transfers: 99, crmCustomers: 7, projects: 3, visits: 1, deals: 1, amount: 521 },
]
const addFields = ['spend', 'exposure', 'inquiries', 'valid', 'crmCustomers', 'projects', 'visits', 'deals', 'amount']
const pmSum = (rows, field) => rows.reduce((sum, row) => sum + Object.values(row[field]).reduce((value, part) => value + part, 0) + (row.crm[field] || 0), 0)

test('部门概览等于人员合计和账号合计，逐条取整不会产生跨层误差', () => {
  const summary = summarizeOperations(plans, 22.6)
  for (const dimension of ['operator', 'account']) {
    const groups = [...new Set(plans.map(plan => plan[dimension]))].map(value => summarizeOperations(plans.filter(plan => plan[dimension] === value), 22.6))
    for (const key of addFields) assert.equal(summary[key], groups.reduce((sum, group) => sum + group[key], 0), `${dimension}/${key}`)
  }
  assert.equal(summary.spend, Math.round(31 * 22.6) + Math.round(42 * 22.6))
  assert.equal(summary.valid, Math.round(9 * 22.6) + Math.round(11 * 22.6))
  assert.equal(summary.accounts, 2)
  assert.equal(summary.cpa, summary.spend / summary.inquiries)
  assert.equal(summary.cpm, summary.spend / summary.exposure * 1000)
})

test('没有数据和零分母返回明确的零值，不出现 NaN 或 Infinity', () => {
  for (const summary of [summarizeOperations([]), summarizeOperations([{ conversionSource: 'advertising', spend: 10, inquiries: 0 }]), summarizeOperations(plans, 0)]) {
    assert.ok(Object.values(summary).every(value => Number.isFinite(value)))
    assert.equal(summary.cpa, 0)
    assert.equal(summary.cpm, 0)
  }
  assert.deepEqual(buildOperationsPmRows([]), [])
})

test('PM 分配按计划事实汇总，后段人数不超过前段且金额守恒', () => {
  for (const factor of [.91, 1, 5.8, 22.6]) {
    const rows = buildOperationsPmRows(plans, factor)
    const summary = summarizeOperations(plans, factor)
    assert.equal(rows.reduce((sum, row) => sum + row.assigned, 0), summary.crmCustomers)
    assert.equal(pmSum(rows, 'projects'), summary.projects)
    assert.equal(pmSum(rows, 'deals'), summary.deals)
    assert.equal(pmSum(rows, 'amount'), summary.amount)
    for (const row of rows.filter(row => !row.crmOnly)) {
      assert.equal(Object.values(row.grades).reduce((sum, value) => sum + value, 0), row.assigned)
      for (const grade of ['a', 'b', 'c']) {
        assert.ok(row.grades[grade] >= row.connected[grade])
        assert.ok(row.connected[grade] >= row.projects[grade])
        assert.ok(row.projects[grade] >= row.deals[grade])
      }
    }
  }
})

test('选择不同广告子集只改变其贡献量，不会改写其他计划的 PM 归属', () => {
  const all = buildOperationsPmRows(plans, 1)
  const pieces = plans.flatMap(plan => buildOperationsPmRows([plan], 1))
  for (const row of all) {
    const contributions = pieces.filter(piece => piece.name === row.name && piece.crmOnly === row.crmOnly)
    assert.equal(row.assigned, contributions.reduce((sum, piece) => sum + piece.assigned, 0))
    assert.equal(pmSum([row], 'amount'), pmSum(contributions, 'amount'))
  }
  const organic = all.find(row => row.name === 'Sarah Wong')
  assert.equal(organic.crmOnly, true)
  assert.deepEqual(organic.grades, { a: 0, b: 0, c: 0 })
  assert.deepEqual(organic.crm, { projects: 3, deals: 1, amount: 521 })
})

test('地区与项目类型在计划层过滤，同一条件无数据时为空', () => {
  const asia = buildOperationsPmRows(plans, 1, { region: '东南亚', projectType: '家装' })
  assert.equal(pmSum(asia, 'amount'), 1835 + 521)
  assert.ok(asia.every(row => row.region === '东南亚' && row.projectType === '家装'))
  assert.deepEqual(buildOperationsPmRows(plans, 1, { region: '北美', projectType: '家装' }), [])
  const commercial = buildOperationsPmRows(plans, 1, { projectType: '工装' })
  assert.equal(pmSum(commercial, 'amount'), 2236)
})

test('姓名格式保留既有英文名，并避免重复括号', () => {
  assert.equal(displayOperatorName('马凯 Kevin Ma'), '马凯（Kevin Ma）')
  assert.equal(displayOperatorName('马凯（Kevin Ma）'), '马凯（Kevin Ma）')
  assert.equal(displayOperatorName('Sarah Wong'), 'Sarah Wong')
  assert.equal(displayOperatorName(''), '')
})
