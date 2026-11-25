import { PROJECT_DASHBOARD_DEPARTMENTS, PM_SALES_TEAM_NAMES } from '../performance-organization.js'

// 运营人员的归属独立于 PM 名册，部门和事业组使用业绩看板的组织目录。
const assignments = [
  ['马凯 Kevin Ma', 'north-america', 0],
  ['刘迈 Mike Liu', 'north-america', 1],
  ['陈琳 Linda Chen', 'custom-division', 0],
  ['林杰 James Lin', 'furniture-division', 0],
  ['王莎 Sara Wang', 'middle-east', 0],
  ['赵睿 Eric Zhao', 'wisdom-center', 0],
]
export const OPERATIONS_ROSTER = assignments.map(([name, departmentId, teamIndex]) => ({
  name, departmentId, team: PM_SALES_TEAM_NAMES[departmentId][teamIndex],
  department: PROJECT_DASHBOARD_DEPARTMENTS.find(item => item.value === departmentId).label,
}))
export const departmentOf = name => OPERATIONS_ROSTER.find(person => person.name === name)?.department ?? ''

export function getPresetMonth(preset, now = new Date()) {
  const date = new Date(now.getFullYear(), now.getMonth() - (preset === 'previous' ? 1 : 0), 1)
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0')
}

export function getMonthPeriod(startMonth, endMonth) {
  const monthPattern = /^[1-9]\d{3}-(0[1-9]|1[0-2])$/
  if (!monthPattern.test(startMonth) || !monthPattern.test(endMonth) || startMonth > endMonth) return null
  const [year, month] = endMonth.split('-').map(Number)
  const lastDay = new Date(year, month, 0).getDate()
  return { start: startMonth + '-01', end: endMonth + '-' + lastDay }
}

export function mountFilters(state, render) {
  const department = document.getElementById('opsDepartment')
  const group = document.getElementById('opsGroup')
  const start = document.getElementById('startDate')
  const end = document.getElementById('endDate')
  const presets = document.querySelectorAll('#rangePreset [data-range]')
  function apply(period) {
    Object.assign(state, period, { adsPage: 1, pmPage: 1 })
    render()
  }
  function applyMonths(from, to) {
    const period = getMonthPeriod(from, to)
    if (!period) return
    start.value = from
    end.value = to
    for (const button of presets) {
      const selected = from === to && from === getPresetMonth(button.dataset.range)
      button.classList.toggle('active', selected)
      button.setAttribute('aria-pressed', String(selected))
    }
    apply(period)
  }
  for (const button of presets) button.addEventListener('click', () => {
    const month = getPresetMonth(button.dataset.range)
    applyMonths(month, month)
  })
  start.addEventListener('change', () => {
    const from = start.value || state.start.slice(0, 7)
    applyMonths(from, from > end.value ? from : end.value)
  })
  end.addEventListener('change', () => {
    const to = end.value || state.end.slice(0, 7)
    applyMonths(to < start.value ? to : start.value, to)
  })
  function applyOrganization() {
    const departmentId = department.value
    const departmentName = PROJECT_DASHBOARD_DEPARTMENTS.find(item => item.value === departmentId)?.label
    const operators = OPERATIONS_ROSTER.filter(person => person.departmentId === departmentId && (!group.value || person.team === group.value))
    apply({ department: departmentName || '', organizationTeam: group.value,
      organizationOperators: departmentId ? operators.map(person => person.name) : null })
  }
  department.append(...PROJECT_DASHBOARD_DEPARTMENTS.map(item => new Option(item.label, item.value)))
  department.addEventListener('change', () => {
    group.length = 1
    group.append(...(PM_SALES_TEAM_NAMES[department.value] || []).map(label => new Option(label, label)))
    group.disabled = !department.value
    window.GOSDashboardSelect?.sync(group)
    applyOrganization()
  })
  group.addEventListener('change', applyOrganization)
  const current = getPresetMonth('current')
  applyMonths(current, current)
}
