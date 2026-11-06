import test from 'node:test'
import assert from 'node:assert/strict'
import { operationsTrendSeries, TREND_GROUPS } from './trend-chart.js'

const summary = { spend: 7594, exposure: 43819841, inquiries: 5357, valid: 4090, crmCustomers: 4090, projects: 1378, visits: 813, amount: 390076 }
const options = { summary, start: '2026-10-08', end: '2026-11-06' }
const sum = values => values.reduce((a, b) => a + b, 0)

test('所有数量与金额趋势点合计等于当前筛选期的指标', () => {
  for (const [metric] of TREND_GROUPS) {
    for (const series of operationsTrendSeries({ ...options, metric }).series) {
      if (series.key in summary) assert.equal(sum(series.values), summary[series.key])
    }
  }
})

test('成本指标使用同一时点消耗和分母计算，主次切换仍保留独立量纲', () => {
  const spend = operationsTrendSeries({ ...options, metric: 'spend' }).series[0].values
  for (const [metric, denominator, ratio, multiple] of [['delivery', 'exposure', 'cpm', 1000], ['inquiries', 'inquiries', 'cpa', 1]]) {
    const { series } = operationsTrendSeries({ ...options, metric, primary: ratio })
    assert.equal(series[0].key, ratio)
    assert.equal(series[0].axis, 'right')
    const base = series.find(s => s.key === denominator)
    series[0].values.forEach((value, i) => assert.equal(value, spend[i] / base.values[i] * multiple))
  }
  assert.equal(operationsTrendSeries({ ...options, metric: 'crm', primary: 'crmProjects' }).series[0].key, 'projects')
})

test('单日与空数据保持可绘制，等级数量逐点守恒', () => {
  const { labels, series } = operationsTrendSeries({ ...options, end: options.start, metric: 'leads' })
  assert.equal(labels.length, 12)
  assert.equal(labels[0], '00:00')
  series[0].values.forEach((value, i) => assert.equal(value, series[1].values[i] + series[2].values[i] + series[3].values[i]))
  for (const [metric] of TREND_GROUPS) {
    const empty = operationsTrendSeries({ ...options, metric, summary: Object.fromEntries(Object.keys(summary).map(key => [key, 0])) })
    assert.ok(empty.series.every(s => s.values.every(value => value === 0)))
  }
})
