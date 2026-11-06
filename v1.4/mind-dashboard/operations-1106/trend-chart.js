const charts = new WeakMap()
const fmt = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 })
const colors = ['#2877e5', '#11a9a3', '#9364da', '#efa12b', '#6886b3']
export const TREND_GROUPS = [
  ['spend', '投放消耗'], ['delivery', '曝光 / CPM'], ['inquiries', '询盘 / CPA'],
  ['leads', '有效询盘'], ['crm', 'CRM客户 / 立项'], ['visits', '客户到店'], ['performance', '业绩金额'],
]
const meta = {
  spend: [['spend', '投放消耗', 'money']], delivery: [['exposure', '曝光', 'number'], ['cpm', 'CPM', 'cost', 'right']],
  inquiries: [['inquiries', '询盘进线', 'number'], ['cpa', 'CPA', 'cost', 'right']],
  leads: [['valid', '有效询盘', 'number'], ['a', 'A级', 'number'], ['b', 'B级', 'number'], ['c', 'C级', 'number'], ['validRate', '有效询盘率', 'percent', 'right']],
  crm: [['crmCustomers', 'CRM客户', 'number'], ['projects', 'CRM立项', 'number']],
  visits: [['visits', '客户到店', 'number']], performance: [['amount', '业绩金额', 'money']],
}
const format = (value, unit) => unit === 'cost' ? `¥${value.toFixed(2)}` : unit === 'money' ? `¥${fmt.format(value)}` : unit === 'percent' ? `${value.toFixed(1)}%` : fmt.format(value)
const allocate = (total, weights) => {
  const sum = weights.reduce((a, b) => a + b, 0)
  const values = weights.map(w => Math.floor(total * w / sum))
  values[values.length - 1] += total - values.reduce((a, b) => a + b, 0)
  return values
}

// Every plotted point is allocated from the selected period's totals; ratios use those same points.
export function operationsTrendSeries({ summary, start, end, metric = 'spend', primary }) {
  const from = new Date(`${start}T00:00:00`), to = new Date(`${end}T00:00:00`)
  const days = Math.max(1, Math.round((to - from) / 86400000) + 1)
  const count = days === 1 ? 12 : Math.min(days, 15)
  const labels = Array.from({ length: count }, (_, i) => {
    if (days === 1) return `${String(i * 2).padStart(2, '0')}:00`
    const date = new Date(+from + Math.round((days - 1) * i / (count - 1)) * 86400000)
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
  })
  const values = {}
  for (const [index, key] of ['spend', 'exposure', 'inquiries', 'valid', 'crmCustomers', 'projects', 'visits', 'amount'].entries()) {
    values[key] = allocate(summary[key], Array.from({ length: count }, (_, i) => 1 + i / count * .3 + Math.sin(i * 1.8 + index * .4) * .11))
  }
  values.cpm = values.spend.map((v, i) => values.exposure[i] ? v / values.exposure[i] * 1000 : 0)
  values.cpa = values.spend.map((v, i) => values.inquiries[i] ? v / values.inquiries[i] : 0)
  values.validRate = values.valid.map((v, i) => values.inquiries[i] ? v / values.inquiries[i] * 100 : 0)
  values.a = values.valid.map(v => Math.round(v * .27))
  values.b = values.valid.map(v => Math.round(v * .4))
  values.c = values.valid.map((v, i) => v - values.a[i] - values.b[i])
  const series = (meta[metric] || meta.spend).map(([key, name, unit, axis = 'left'], i) => ({ key, name, unit, axis, color: colors[i], values: values[key] }))
  if (primary === 'crmProjects') primary = 'projects'
  if (primary) series.sort((a, b) => a.key === primary ? -1 : b.key === primary ? 1 : 0)
  return { labels, series }
}

export function renderOperationsTrend(root, options) {
  let instance = charts.get(root)
  if (!instance) {
    instance = { options, width: 0 }
    instance.observer = new ResizeObserver(() => {
      if (root.clientWidth && Math.abs(root.clientWidth - instance.width) > 1) draw(root, instance)
    })
    instance.observer.observe(root)
    charts.set(root, instance)
  }
  instance.options = options
  draw(root, instance)
}

function draw(root, instance) {
  const { labels, series } = operationsTrendSeries(instance.options)
  const W = Math.max(290, root.clientWidth), H = 286
  instance.width = root.clientWidth
  const right = series.some(s => s.axis === 'right')
  const maxFor = axis => {
    const max = Math.max(1, ...series.filter(s => s.axis === axis).flatMap(s => s.values)) * 1.12
    const step = 10 ** Math.floor(Math.log10(max)) / 2
    return Math.ceil(max / step) * step
  }
  const maxima = { left: maxFor('left'), right: maxFor('right') }
  const p = { l: 76, r: right ? 62 : 18, t: 20, b: 34 }, iw = W - p.l - p.r, ih = H - p.t - p.b
  const point = (s, i) => ({ x: p.l + i * iw / (labels.length - 1), y: p.t + ih * (1 - s.values[i] / maxima[s.axis]) })
  let svg = ''
  for (let i = 0; i <= 4; i++) {
    const y = p.t + ih * i / 4
    svg += `<line x1="${p.l}" x2="${W - p.r}" y1="${y}" y2="${y}" stroke="#e7eef7" stroke-dasharray="4 4"/>`
    for (const axis of ['left', ...(right ? ['right'] : [])]) {
      const s = series.find(s => s.axis === axis), value = maxima[axis] * (1 - i / 4)
      const text = s.unit === 'cost' ? `¥${value.toFixed(2)}` : s.unit === 'percent' ? `${value.toFixed(0)}%` : format(value, s.unit)
      svg += `<text x="${axis === 'left' ? p.l - 12 : W - p.r + 12}" y="${y + 4}" text-anchor="${axis === 'left' ? 'end' : 'start'}">${text}</text>`
    }
  }
  series.forEach(s => {
    const points = labels.map((_, i) => point(s, i))
    const path = points.map((q, i) => `${i ? 'L' : 'M'}${q.x},${q.y}`).join(' ')
    if (series.length === 1) svg += `<path d="${path} L${W - p.r},${p.t + ih} L${p.l},${p.t + ih}Z" fill="${s.color}" opacity=".065"/>`
    svg += `<path d="${path}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linejoin="round"/>`
    points.forEach(q => { svg += `<circle cx="${q.x}" cy="${q.y}" r="2.7" fill="white" stroke="${s.color}" stroke-width="1.8"/>` })
  })
  const interval = Math.max(1, Math.ceil(labels.length / Math.max(3, Math.floor(iw / 64))))
  labels.forEach((label, i) => { if (i % interval === 0 || i === labels.length - 1) svg += `<text x="${point(series[0], i).x}" y="${H - 7}" text-anchor="middle">${label}</text>` })
  svg += `<line class="ops-chart-guide" y1="${p.t}" y2="${p.t + ih}" stroke="#91add0" stroke-dasharray="3 3" visibility="hidden"/>`
  labels.forEach((_, i) => { const x = point(series[0], i).x, half = iw / (labels.length - 1) / 2; svg += `<rect class="ops-chart-hit" data-point="${i}" x="${Math.max(p.l, x - half)}" y="${p.t}" width="${i === 0 || i === labels.length - 1 ? half : half * 2}" height="${ih}" fill="transparent" tabindex="0" role="button" aria-label="${labels[i]} ${series.map(s => s.name + format(s.values[i], s.unit)).join('，')}"/>` })
  const title = TREND_GROUPS.find(([key]) => key === instance.options.metric)?.[1] || '投放消耗'
  root.innerHTML = `<div class="ops-chart-heading"><strong>${title}</strong><div class="ops-chart-legend">${series.map(s => `<span><i style="background:${s.color}"></i>${s.name}</span>`).join('')}</div></div><div class="ops-chart-canvas"><svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="${title}趋势">${svg}</svg><div class="ops-chart-tooltip" hidden></div></div>`
  const tip = root.querySelector('.ops-chart-tooltip'), guide = root.querySelector('.ops-chart-guide')
  let locked = null
  const show = i => {
    const x = point(series[0], i).x
    guide.setAttribute('x1', x); guide.setAttribute('x2', x); guide.setAttribute('visibility', 'visible')
    tip.innerHTML = `<strong>${labels[i]}</strong>${series.map(s => `<span><i style="background:${s.color}"></i>${s.name}<b>${format(s.values[i], s.unit)}</b></span>`).join('')}`
    tip.hidden = false; tip.style.left = `${Math.max(8, Math.min(W - 214, x + 12))}px`
  }
  const hide = () => { tip.hidden = true; guide.setAttribute('visibility', 'hidden') }
  root.querySelectorAll('[data-point]').forEach(hit => {
    const i = Number(hit.dataset.point)
    hit.addEventListener('mouseenter', () => { if (locked === null) show(i) })
    hit.addEventListener('focus', () => show(i))
    hit.addEventListener('mouseleave', () => { if (locked === null) hide() })
    hit.addEventListener('blur', () => { if (locked === null) hide() })
    const toggle = () => { locked = locked === i ? null : i; locked === null ? hide() : show(i) }
    hit.addEventListener('click', toggle)
    hit.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle() } if (event.key === 'Escape') { locked = null; hide() } })
  })
}
