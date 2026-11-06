import { OPERATIONS_PEOPLE } from '../operations-organization-data.js'
import { mountOperationsOrganization } from '../operations-organization.js'
import { summarizeOperations, displayOperatorName } from './workspace-data.js'
import { compareOperations, rankOperationsPeople } from './comparison-data.js'
import { renderOperationsTrend } from './trend-chart.js'
import { mountAdPicker } from './ad-picker.js'

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]))
const number = value => new Intl.NumberFormat('zh-CN', { maximumFractionDigits:0 }).format(value)
const money = value => '¥' + number(value)
const cost = value => value > 0 ? '¥' + value.toFixed(2) : '—'
const icon = paths => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+paths+'</svg>'
const icons = {
  spend: icon('<path d="M4 10h5l10-5v14L9 14H4zM7 14l2 6h3l-2-6M22 9v6"/>'),
  inquiries: icon('<path d="M4 4h16v12h-9l-5 4v-4H4zM8 9h8M8 12h5"/>'),
  amount: icon('<rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/>'),
  rank: icon('<path d="M5 3h14v7a7 7 0 0 1-14 0zM5 5H2v3a4 4 0 0 0 4 4m13-7h3v3a4 4 0 0 1-4 4M12 17v4M8 21h8"/>'),
}
const delta = (value, key) => {
  if (value === null) return '<span class="ops-change is-neutral">较上周期 新增</span>'
  const favorable = ['cpa','cpm'].includes(key) ? value < 0 : value > 0
  const style = key === 'spend' || value === 0 ? 'is-neutral' : favorable ? 'is-good' : 'is-bad'
  return '<span class="ops-change '+style+'">'+(value > 0 ? '↑' : value < 0 ? '↓' : '—')+' 较上周期 '+(value > 0 ? '+' : '')+value.toFixed(1)+'%</span>'
}

function mountWorkspace(api) {
  const { state, plans, ownerOf, globalRows, rangeFactor } = api
  const $ = selector => document.querySelector(selector)
  const people = OPERATIONS_PEOPLE.filter(person => plans.some(plan => ownerOf(plan) === person.name))
  const local = { member:null, trend:'spend', primary:null }
  const drawer = $('#opsMemberDrawer')
  let returnFocus = null, previousOverflow = '', closeTimer = null
  const closeDrawer = () => {
    if (!drawer.open || drawer.classList.contains('is-closing')) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { drawer.close(); return }
    drawer.classList.add('is-closing')
    // 超时兜底保障后台标签页或动画被中断时也能完成关闭。
    closeTimer = window.setTimeout(() => drawer.close(), 260)
  }
  const periodLabel = () => state.start.replaceAll('-', '/') + ' — ' + state.end.replaceAll('-', '/')
  const initials = person => person.name.split(' ').slice(1).map(word => word[0]).join('').slice(0, 2)
  const comparison = rows => compareOperations(rows, rangeFactor(), state.start+'|'+state.end)
  const memberPlans = name => globalRows().filter(plan => ownerOf(plan) === name)
  const rankMap = () => rankOperationsPeople(plans.filter(plan=>!state.accounts.length||state.accounts.includes(plan.account)), people, ownerOf, rangeFactor())
  const ranksFor = person => rankMap().get(person.name)
  const scopedPeople = () => people.filter(person => globalRows().some(plan => ownerOf(plan) === person.name))

  $('#opsGlobalFilters').append($('#accountMultiFilter'))
  const organization = mountOperationsOrganization({ anchor:$('#opsPersonnelAnchor'), names:people.map(p => p.name), state, compact:true, render:() => {
    state.department = state.departments?.[0] || ''
    if (drawer.open) closeDrawer()
    api.render()
  } })
  const adPicker = mountAdPicker($('#opsAdFilterSlot'), api)
  api.beforeRender = () => adPicker.refresh()
  const orgRoot = $('.ops-organization-filter')
  const polishNames = () => orgRoot.querySelectorAll('[data-org-level="2"] span').forEach(span => { span.textContent = displayOperatorName(span.closest('button').dataset.orgValue) })
  orgRoot.addEventListener('click', polishNames)

  function renderTeam() {
    const ranks = rankMap(), rankScope = state.department ? '部门' : '公司'
    const rankOf = person => ranks.get(person.name).amount[state.department ? 'departmentRank' : 'companyRank']
    const members = scopedPeople().sort((a,b) => rankOf(a) - rankOf(b))
    $('.ops-team-caption').textContent = rankScope + '业绩排名 · ' + members.length + ' 位运营'
    $('.ops-team-caption').title = '排名按当前周期与所选账户计算，保留公司或部门的完整人员比较范围'
    $('#opsDetailPerson').title = '四项均为公司排名，按当前周期与所选账户计算；CPA由低到高，其他指标由高到低'
    $('#opsTeamGrid').innerHTML = members.length ? members.map(person => {
      const source = memberPlans(person.name), { current:m, changes } = comparison(source), rank = rankOf(person)
      return '<button type="button" class="ops-member-card rank-'+Math.min(rank,4)+'" data-ops-member="'+esc(person.name)+'" aria-label="查看'+esc(displayOperatorName(person.name))+'的运营详情">'+
        '<span class="ops-member-top"><span class="ops-member-avatar">'+initials(person)+'</span><span class="ops-member-identity"><strong class="ops-member-name" title="'+esc(displayOperatorName(person.name))+'">'+esc(displayOperatorName(person.name))+'</strong><span class="ops-member-org" title="'+esc(person.department+' · '+person.team)+'">'+esc(person.department)+' · '+esc(person.team)+'</span></span><span class="ops-rank-badge">'+icons.rank+'第 '+rank+' 名</span></span>'+
        '<span class="ops-member-metrics">'+[['spend','投放消耗',money(m.spend)],['inquiries','询盘进线',number(m.inquiries)],['amount','业绩金额',money(m.amount)]].map(([key,label,value])=>'<span class="ops-core-metric is-'+key+'"><span class="ops-metric-label">'+icons[key]+label+'</span><strong>'+value+'</strong>'+delta(changes[key],key)+'</span>').join('')+'<span class="ops-card-arrow" title="展开运营详情" aria-hidden="true">'+icon('<path d="m9 5 7 7-7 7"/>')+'</span></span>'+
        '<span class="ops-member-footer"><span>CPA <b>'+cost(m.cpa)+'</b> <i class="'+(changes.cpa<=0?'is-good':'is-bad')+'">'+(changes.cpa===null?'新增':(changes.cpa>0?'↑':'↓')+Math.abs(changes.cpa).toFixed(1)+'%')+'</i></span><span>'+m.accounts+' 个账户</span></span></button>'
    }).join('') : '<div class="ops-detail-empty">当前筛选条件下暂无团队数据</div>'
  }

  function renderMemberTrend() {
    if (!local.member) return
    renderOperationsTrend($('#opsDetailChart'), { summary:summarizeOperations(memberPlans(local.member),rangeFactor()), metric:local.trend, primary:local.primary, start:state.start, end:state.end })
    $('#opsDetailMetrics').querySelectorAll('[data-detail-trend]').forEach(card => { const active=card.dataset.detailPrimary===(local.primary||({spend:'spend',delivery:'exposure',inquiries:'inquiries',leads:'valid',crm:'crmCustomers',visits:'visits',performance:'amount'})[local.trend]); card.classList.toggle('is-active',active); card.setAttribute('aria-pressed',String(active)) })
  }

  function renderMember() {
    if (!local.member) return
    const person = scopedPeople().find(item => item.name === local.member)
    if (!person) { closeDrawer(); return }
    const source = memberPlans(person.name), accounts = [...new Set(source.map(p=>p.account))], {current:m,changes} = comparison(source), ranks = ranksFor(person)
    $('#opsDetailPerson').innerHTML = '<div class="ops-person-main"><span class="ops-member-avatar">'+initials(person)+'</span><div class="ops-person-copy"><strong>'+esc(displayOperatorName(person.name))+'</strong><p>'+esc(person.department)+' · '+esc(person.team)+'</p></div></div><div class="ops-person-ranks">'+
      [['公司投放消耗',ranks.spend.companyRank],['公司CPA',ranks.cpa.companyRank],['公司业绩',ranks.amount.companyRank],['公司询盘',ranks.inquiries.companyRank]].map(([label,value],i)=>'<span class="rank-type-'+i+'">'+icons.rank+label+'<b>'+(value===null?'暂无排名':'第 '+value+' 名')+'</b></span>').join('')+'</div>'
    $('#opsDetailPeriod').textContent = periodLabel()
    const cards = [
      ['spend','投放消耗',money(m.spend),'spend','blue'], ['exposure','曝光',number(m.exposure),'delivery','blue'], ['cpm','CPM',cost(m.cpm),'delivery','blue'],
      ['inquiries','询盘进线',number(m.inquiries),'inquiries','teal'], ['cpa','CPA',cost(m.cpa),'inquiries','teal'], ['valid','有效询盘',number(m.valid),'leads','teal'],
      ['crmCustomers','CRM客户',number(m.crmCustomers),'crm','violet'], ['projects','CRM立项',number(m.projects),'crm','violet'], ['visits','客户到店',number(m.visits),'visits','amber'], ['amount','业绩金额',money(m.amount),'performance','violet'],
    ]
    $('#opsDetailMetrics').innerHTML = cards.map(([key,label,value,trend,tone])=>'<button type="button" class="ops-detail-metric tone-'+tone+'" data-detail-trend="'+trend+'" data-detail-primary="'+key+'" aria-pressed="false"><span>'+label+'</span><strong>'+value+'</strong>'+delta(changes[key],key)+'</button>').join('')
    $('#opsDetailAccounts').innerHTML = accounts.map(account => {
      const scoped=source.filter(plan=>plan.account===account), metrics=summarizeOperations(scoped,rangeFactor())
      return '<tr><td><strong>'+esc(account)+'</strong><span>'+scoped.filter(p=>p.conversionSource==='advertising').length+' 条广告</span></td><td>'+money(metrics.spend)+'</td><td>'+number(metrics.exposure)+'</td><td>'+number(metrics.inquiries)+'</td><td>'+number(metrics.valid)+'</td><td>'+cost(metrics.cpa)+'</td><td>'+money(metrics.amount)+'</td></tr>'
    }).join('')
    $('#opsDetailAccountCount').textContent = accounts.length + ' 个账户'
    $('#opsDetailEmpty').hidden = accounts.length > 0
    $('.ops-account-table-wrap').hidden = accounts.length === 0
    renderMemberTrend()
  }

  function render() { organization.refresh(); polishNames(); renderTeam(); if (local.member) renderMember() }
  $('#opsTeamGrid').addEventListener('click', event => {
    const card = event.target.closest('[data-ops-member]'); if (!card) return
    returnFocus = card; local.member = card.dataset.opsMember; local.trend = 'spend'; local.primary = null
    previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    drawer.showModal(); renderMember(); $('#opsMemberClose').focus()
  })
  drawer.addEventListener('click', event => {
    const trend = event.target.closest('[data-detail-trend]')
    if (trend) { local.trend = trend.dataset.detailTrend; local.primary = trend.dataset.detailPrimary || null; renderMemberTrend() }
    if (event.target === drawer && event.clientX < drawer.getBoundingClientRect().left) closeDrawer()
  })
  $('#opsMemberClose').addEventListener('click', closeDrawer)
  drawer.addEventListener('cancel', event => { event.preventDefault(); closeDrawer() })
  drawer.addEventListener('animationend', event => { if (event.target===drawer && event.animationName==='opsDrawerSlideOut') drawer.close() })
  drawer.addEventListener('close', () => {
    window.clearTimeout(closeTimer); closeTimer = null; drawer.classList.remove('is-closing')
    local.member = null; document.documentElement.style.overflow = previousOverflow
    if (returnFocus?.isConnected) returnFocus.focus()
  })
  api.onRender = render
  api.render()
}

if (window.ops1106) mountWorkspace(window.ops1106)
else window.addEventListener('ops1106-ready', () => mountWorkspace(window.ops1106), { once:true })
