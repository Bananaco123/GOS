import { buildAdHierarchy } from '../operations-demo/demo-data.js'

export function mountAdPicker(slot, api) {
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]))
  const root = document.createElement('div')
  root.className = 'ops-ad-picker'
  root.innerHTML = '<div class="ops-ad-control"><button type="button" class="ops-ad-trigger" aria-label="选择广告" aria-haspopup="dialog" aria-expanded="false"><span>选择广告</span><i></i></button><button type="button" class="ops-ad-clear" aria-label="清除广告选择" hidden>×</button></div><div class="ops-ad-menu" role="dialog" aria-label="广告计划、广告组、广告三级选择" hidden></div>'
  slot.append(root)
  const trigger = root.querySelector('.ops-ad-trigger'), menu = root.querySelector('.ops-ad-menu'), clear = root.querySelector('.ops-ad-clear')
  let hierarchy = [], path = { campaign: null, group: null, ad: null }
  const close = () => { menu.hidden = true; trigger.setAttribute('aria-expanded', 'false') }
  function refresh() {
    hierarchy = buildAdHierarchy(api.globalRows().filter(p => p.conversionSource === 'advertising'))
    const campaign = hierarchy.find(p => p.key === path.campaign), group = campaign?.groups.find(p => p.label === path.group), ad = group?.ads.find(p => p.id === path.ad)
    path = { campaign: campaign?.key || null, group: group?.label || null, ad: ad?.id || null }
    Object.assign(api.state, { campaigns: campaign ? [campaign.label] : [], groups: group ? [group.label] : [], ads: ad ? [ad.label] : [], adPlanIds: campaign ? (ad ? [ad] : group ? group.ads : campaign.groups.flatMap(g => g.ads)).map(p => p.id) : null })
    const columns = [ ['广告计划', hierarchy.map(p => ({ key: p.key, label: p.label }))], ['广告组', (campaign?.groups || []).map(p => ({ key: p.label, label: p.label }))], ['广告', (group?.ads || []).map(p => ({ key: p.id, label: p.label }))] ]
    menu.innerHTML = columns.map(([label, items], level) => `<section><header>${label}</header><div role="listbox" aria-label="${label}选项">${items.length ? items.map(item => `<button type="button" role="option" aria-selected="${item.key === Object.values(path)[level]}" data-level="${level}" data-key="${esc(item.key)}"><span>${esc(item.label)}</span>${level < 2 ? '<i>›</i>' : ''}</button>`).join('') : `<p>${level ? '请选择上一级' : '暂无广告'}</p>`}</div></section>`).join('')
    const label = ad?.label || group?.label || campaign?.label || '选择广告'
    trigger.querySelector('span').textContent = label
    trigger.title = [campaign?.label, group?.label, ad?.label].filter(Boolean).join(' / ') || label
    clear.hidden = !campaign
  }
  trigger.addEventListener('click', () => {
    if (!menu.hidden) return close()
    refresh(); menu.hidden = false; trigger.setAttribute('aria-expanded', 'true')
    const rect = trigger.getBoundingClientRect(), width = Math.min(640, innerWidth - 16)
    Object.assign(menu.style, { width: `${width}px`, left: `${Math.max(8, rect.right - width)}px`, top: `${Math.max(8, Math.min(rect.bottom + 8, innerHeight - 320))}px` })
  })
  menu.addEventListener('click', event => {
    const option = event.target.closest('[data-level]'); if (!option) return
    const level = Number(option.dataset.level), key = option.dataset.key
    path = level === 0 ? { campaign: key, group: null, ad: null } : level === 1 ? { ...path, group: key, ad: null } : { ...path, ad: key }
    api.state.adsPage = 1; api.state.pmPage = 1; api.render()
    if (level === 2) close()
  })
  clear.addEventListener('click', () => { path = { campaign: null, group: null, ad: null }; api.state.adsPage = 1; api.state.pmPage = 1; api.render(); close() })
  document.addEventListener('pointerdown', event => { if (!root.contains(event.target)) close() })
  document.addEventListener('scroll', event => { if (!root.contains(event.target)) close() }, true)
  root.addEventListener('keydown', event => { if (event.key === 'Escape') { close(); trigger.focus() } })
  return { refresh }
}
