import { DEMO_CHANNEL, DEPARTMENTS, departmentOf, filterLinkedEntries, summarizeLinkedEntries, buildPmConversionRows, buildAdHierarchy, isWon } from './demo-data.js'

const legacy = window.opsDemoLegacy
const { state } = legacy
let linkedIndex = []
const post = payload => window.parent.postMessage({ channel:DEMO_CHANNEL, ...payload }, window.location.origin)
const $ = selector => document.querySelector(selector)
const esc = value => legacy.traceText(value, '—')
const fmt = value => Number(value || 0).toLocaleString('zh-CN')
const rate = (value,base) => base ? `${(value/base*100).toFixed(1)}%` : '—'
const money = value => `¥${fmt(Math.round(value || 0))}`
const optionRows = values => [...new Set(values.filter(Boolean))].map(value => ({ value,label:value,keywords:value }))
const ids = rows => rows.map(row=>String(row.id))
window.opsDemoDepartmentOf = departmentOf
state.departments = []
state.operators = []

const department = document.createElement('div')
department.className='multi-filter demo-department-filter'
department.id='departmentMultiFilter'
department.innerHTML='<div class="multi-filter-control" id="departmentMultiControl" role="combobox" aria-label="选择部门" aria-haspopup="listbox" aria-expanded="false" aria-controls="departmentMultiOptions"><div class="multi-filter-tags" id="departmentMultiTags"></div><input class="multi-filter-input" id="departmentMultiInput" placeholder="全部部门" readonly aria-label="部门选择"><span class="multi-filter-chevron" aria-hidden="true"></span></div><div class="multi-filter-menu" id="departmentMultiOptions" role="listbox" aria-label="部门选项" hidden></div>'
$('#operatorMultiFilter').before(department)
const departmentFilter=legacy.createMultiFilter({rootId:'#departmentMultiFilter',controlId:'#departmentMultiControl',tagsId:'#departmentMultiTags',inputId:'#departmentMultiInput',menuId:'#departmentMultiOptions',stateKey:'departments',placeholder:'全部部门',single:true,options:optionRows(DEPARTMENTS)})
for(const id of ['campaign','group','ad']) $(`#${id}MultiFilter`).hidden=true
const cascade=document.createElement('div')
cascade.className='demo-ad-picker'
cascade.innerHTML='<div class="demo-ad-control"><button type="button" class="demo-ad-trigger" aria-label="选择广告" aria-haspopup="dialog" aria-expanded="false"><span>选择广告</span><i aria-hidden="true"></i></button><button type="button" class="demo-ad-clear" aria-label="清除广告选择" hidden>×</button></div><div class="demo-cascade-menu" role="dialog" aria-label="选择广告：广告计划、广告组、广告" hidden></div>'
$('#accountMultiFilter').after(cascade)
let hierarchy=[], path={campaign:null,group:null,ad:null}
const trigger=cascade.querySelector('.demo-ad-trigger'), menu=cascade.querySelector('.demo-cascade-menu'), clear=cascade.querySelector('.demo-ad-clear')
const closeCascade=()=>{menu.hidden=true;trigger.setAttribute('aria-expanded','false')}
function renderCascade(){
  const campaign=hierarchy.find(item=>item.key===path.campaign), group=campaign?.groups.find(item=>item.label===path.group)
  const columns=[{label:'广告计划',items:hierarchy.map(item=>({key:item.key,label:item.label,selected:item.key===path.campaign,branch:true}))},
    {label:'广告组',items:(campaign?.groups||[]).map(item=>({key:item.label,label:item.label,selected:item.label===path.group,branch:true}))},
    {label:'广告',items:(group?.ads||[]).map(item=>({key:item.id,label:item.label,selected:item.id===path.ad}))}]
  menu.innerHTML=columns.map((column,level)=>`<section class="demo-cascade-column"><header>${column.label}</header><div role="listbox" aria-label="${column.label}选项">${column.items.length?column.items.map(item=>`<button type="button" role="option" aria-selected="${item.selected}" data-cascade-level="${level}" data-cascade-key="${esc(item.key)}"><span>${esc(item.label)}</span>${item.branch?'<i aria-hidden="true">›</i>':''}</button>`).join(''):`<p>${level?'请选择上一级':'暂无广告'}</p>`}</div></section>`).join('')
  const ad=group?.ads.find(item=>item.id===path.ad)
  const label=ad?.label||group?.label||campaign?.label
  trigger.querySelector('span').textContent=label||'选择广告'
  trigger.title=label ? [campaign?.label,group?.label,ad?.label].filter(Boolean).join(' / ') : '选择广告'
  trigger.setAttribute('aria-label',label?`选择广告：${label}`:'选择广告')
  clear.hidden=!label
}
trigger.addEventListener('click',()=>{const open=menu.hidden;menu.hidden=!open;trigger.setAttribute('aria-expanded',String(open));if(open)renderCascade()})
function applyPath(){
  const campaign=hierarchy.find(item=>item.key===path.campaign), group=campaign?.groups.find(item=>item.label===path.group), ad=group?.ads.find(item=>item.id===path.ad)
  state.campaigns=campaign?[campaign.label]:[];state.groups=group?[group.label]:[];state.ads=ad?[ad.label]:[]
  state.adPlanIds=campaign ? (group ? (ad?[ad]:group.ads) : campaign.groups.flatMap(item=>item.ads)).map(item=>item.id) : null
  state.adsPage=1;state.pmPage=1;legacy.render()
}
menu.addEventListener('click',event=>{
  const option=event.target.closest('[data-cascade-level]');if(!option)return
  const level=Number(option.dataset.cascadeLevel), key=option.dataset.cascadeKey
  path=level===0?{campaign:key,group:null,ad:null}:level===1?{...path,group:key,ad:null}:{...path,ad:key}
  applyPath();if(level===2)closeCascade()
})
clear.addEventListener('click',()=>{path={campaign:null,group:null,ad:null};applyPath();closeCascade();trigger.focus()})
document.addEventListener('pointerdown',event=>{if(!cascade.contains(event.target))closeCascade()})
cascade.addEventListener('keydown',event=>{if(event.key==='Escape'){closeCascade();trigger.focus()}})

const toolbox=document.createElement('details')
toolbox.className='demo-toolbox'
const icon = content => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${content}</svg>`
const arrowIcon=icon('<path d="M5 12h14m-6-6 6 6-6 6"/>')
const toolsIcon=icon('<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V4h8v3M3 12h18m-11-2v4h4v-4"/>')
const calculatorIcon=icon('<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 10h1m6 0h1m-8 4h1m6 0h1m-8 4h1m6 0h1"/>')
const audienceIcon=icon('<circle cx="9" cy="7" r="3"/><path d="M3 20v-3a6 6 0 0 1 12 0v3m1-16a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 4v2"/>')
toolbox.innerHTML=`<summary aria-label="工具箱">${toolsIcon}<span>工具箱</span><i class="demo-toolbox-chevron" aria-hidden="true"></i></summary><div class="demo-toolbox-menu" role="group" aria-label="工具箱功能"><button type="button" data-demo-tool="commission"><span class="demo-tool-icon is-commission">${calculatorIcon}</span><span>提成试算</span></button><button type="button" data-demo-tool="library"><span class="demo-tool-icon is-library" aria-hidden="true">AD</span><span>广告资料库</span></button><button type="button" data-demo-tool="audience"><span class="demo-tool-icon is-audience">${audienceIcon}</span><span>人群包提取</span></button></div>`
cascade.after(toolbox)
toolbox.querySelectorAll('[data-demo-tool]').forEach(button=>button.setAttribute('aria-label',button.lastElementChild.textContent))
const metricStrip=$('#metricsStrip')
let metricScrollTimer
metricStrip.addEventListener('scroll',()=>{metricStrip.classList.add('demo-scrolling');clearTimeout(metricScrollTimer);metricScrollTimer=setTimeout(()=>metricStrip.classList.remove('demo-scrolling'),800)},{passive:true})

window.opsDemoBeforeRender=()=>{
  const inDepartment=legacy.plans.filter(plan=>!state.departments.length||state.departments.includes(departmentOf(plan.operator)))
  const operators=optionRows(inDepartment.map(plan=>plan.operator))
  state.operators=state.operators.filter(value=>operators.some(option=>option.value===value))
  const operated=inDepartment.filter(plan=>!state.operators.length||state.operators.includes(plan.operator))
  const accounts=optionRows(operated.map(plan=>plan.account))
  state.accounts=state.accounts.filter(value=>accounts.some(option=>option.value===value))
  const accounted=operated.filter(plan=>!state.accounts.length||state.accounts.includes(plan.account))
  hierarchy=buildAdHierarchy(accounted)
  if(path.campaign&&!hierarchy.some(item=>item.key===path.campaign)){
    path={campaign:null,group:null,ad:null};state.campaigns=[];state.groups=[];state.ads=[];state.adPlanIds=null
  }
  departmentFilter.refresh(optionRows(DEPARTMENTS));legacy.operatorMultiFilter.refresh(operators);legacy.accountMultiFilter.refresh(accounts)
  $('#departmentMultiTags button')?.setAttribute('aria-label','清除部门选择')
  renderCascade()
}
function scopeFor({plans=legacy.rows(),pmName,pm=false,label='当前筛选',...extra}={}){
  const scope={planIds:ids(plans),start:state.start,end:state.end,label,department:state.departments[0]||'全部部门',...extra}
  if(pm){Object.assign(scope,{pmName,region:state.pmCountry,projectType:state.pmProjectType,grade:state.pmGrade})
    if(!pmName&&state.pmSearch.trim())scope.pmNames=[...new Set(linkedIndex.map(entry=>entry.attribution.pmName))].filter(name=>name.toLocaleLowerCase().includes(state.pmSearch.trim().toLocaleLowerCase()))}
  return scope
}
const entriesFor=scope=>filterLinkedEntries(linkedIndex,scope)
const summaryFor=scope=>summarizeLinkedEntries(entriesFor(scope))
const scopes=new Map()
function countButton(scope,key,value,noun,mode='conversion'){
  scopes.set(key,{...scope,mode})
  const button=document.createElement('button')
  button.type='button';button.className='demo-opportunity-link';button.dataset.opsScope=key
  button.disabled=!value;button.innerHTML=arrowIcon
  button.title='查看详情'
  button.setAttribute('aria-label',`${scope.label}，${value}${noun}，查看关联项目与商机`)
  return button
}
function metricCell(cell,scope,key,value,noun,caption,title,mode='conversion'){
  const stack=document.createElement('div');stack.className='cell-stack'
  const line=document.createElement('span');line.className='demo-value-line'
  const number=document.createElement('strong')
  const valueButton=countButton(scope,key,value,noun,mode)
  valueButton.className='demo-metric-number';valueButton.textContent=fmt(value);number.append(valueButton)
  line.append(number,countButton(scope,key,value,noun,mode));stack.append(line)
  if(caption){const small=document.createElement('small');small.textContent=caption;small.title=title||caption;stack.append(small)}
  cell.replaceChildren(stack)
}
function plansForRow(row){return legacy.advertisingRows().filter(plan=>row.__total||(plan[state.dimension]||'未标记')===row[state.dimension])}
window.opsDemoFunnel=(row,metrics)=>{
  const entries=entriesFor(scopeFor({plans:plansForRow(row)})),summary=buildPmConversionRows(entries).total
  const byGrade=grade=>summarizeLinkedEntries(entries.filter(entry=>entry.project.level===grade)).dealCustomers
  return {...metrics,total:summary.inquiries,valid:summary.assigned,gradeA:summary.grades.a,gradeB:summary.grades.b,gradeC:summary.grades.c,floorplan:summary.floorplan,duplicate:summary.duplicate,connected:summary.connected,arrivals:summary.visits,projects:summary.projects,deals:summary.dealCustomers,amount:summary.amount,aDeals:byGrade('A'),bDeals:byGrade('B'),cDeals:byGrade('C')}
}
window.opsDemoGroupRows=rows=>rows.map(row=>{const summary=buildPmConversionRows(entriesFor(scopeFor({plans:plansForRow(row)}))).total,factor=legacy.rangeFactor();return {...row,inquiries:summary.inquiries/factor,transfers:summary.assigned/factor,visits:summary.visits/factor,projects:summary.projects/factor,deals:summary.dealCustomers/factor,amount:summary.amount/factor}})
window.opsDemoSummary=(advertising=false)=>buildPmConversionRows(entriesFor(scopeFor({plans:advertising?legacy.advertisingRows():legacy.rows()}))).total
window.opsDemoTrendTotal=key=>({projects:window.opsDemoSummary().projects,crmCustomers:window.opsDemoSummary().assigned,amount:window.opsDemoSummary().amount,inquiries:window.opsDemoSummary(true).inquiries,transfers:window.opsDemoSummary(true).assigned,visits:window.opsDemoSummary().visits})[key]
function addAdsColumn(){
  const head=$('#planHead .metric-column-row')
  if(!head.querySelector('[data-ops-column]')){
    const cell=document.createElement('th');cell.textContent='商机数';cell.dataset.opsColumn='true'
    head.querySelector('[data-sort-key="projects"]').closest('th').after(cell)
    const groups=[...$('#planHead .metric-group-row').children]
    groups.find(cell=>cell.textContent.trim()==='销售转化').colSpan=4
    groups.find(cell=>cell.textContent.trim()==='成交结果').colSpan=2
  }
  head.querySelector('[data-sort-key="projects"]').title='筛选周期内新建的项目数'
  head.querySelector('[data-ops-column]').title='筛选周期内新建的商机数'
  head.querySelector('[data-sort-key="deals"]').title='筛选周期内成交客户去重数'
  for(const row of document.querySelectorAll('#planBody .funnel-summary-row')){
    const snapshot=legacy.snapshot(row.dataset.rowKey);if(!snapshot||row.querySelector('[data-ops-cell]'))continue
    const plans=legacy.advertisingRows().filter(plan=>snapshot.isTotal||(plan[state.dimension]||'未标记')===snapshot.name)
    const scope=scopeFor({plans,label:snapshot.isTotal?'投放转化 · 当前总计':snapshot.name}), summary=summaryFor(scope)
    metricCell(row.children[11],{...scope,measure:'projects'},`project:${row.dataset.rowKey}`,summary.projects,'个项目',rate(summary.projects,snapshot.metrics.valid),'立项数 ÷ 有效询盘数')
    const cell=document.createElement('td');cell.dataset.opsCell='true';cell.dataset.label='商机数'
    metricCell(cell,{...scope,measure:'opportunities'},`opportunity:${row.dataset.rowKey}`,summary.opportunities,'个商机',rate(summary.opportunities,snapshot.metrics.valid),'商机数 ÷ 有效询盘数')
    row.children[11].after(cell)
    metricCell(row.children[13],{...scope,measure:'deals'},`won:${row.dataset.rowKey}`,summary.dealCustomers,'位成交客户',rate(summary.dealCustomers,snapshot.metrics.valid),'成交客户去重数 ÷ 有效询盘数','orders')
  }
  for(const cell of document.querySelectorAll('#planBody .analysis-detail-row>td'))cell.colSpan=15
}
window.addEventListener('ops-demo-table-render',addAdsColumn)

const pmColumns=[['name','PM'],['assigned','分配客户'],['region','项目地区'],['projectType','项目类型'],['a','A级'],['b','B级'],['c','C级'],['connected','建联数'],['projects','立项数'],['opportunities','商机数'],['dealCustomers','成交数'],['amount','成交金额']]
const periodTitles={projects:'筛选周期内新建的项目数',opportunities:'筛选周期内新建的商机数',dealCustomers:'筛选周期内成交客户去重数'}
window.opsDemoRenderPm=()=>{
  const scope=scopeFor({pm:true}), entries=entriesFor(scope), result=buildPmConversionRows(entries)
  const key={deals:'dealCustomers'}[state.pmSortKey]||state.pmSortKey
  const value=row=>['a','b','c'].includes(key)?row.grades[key]:row[key]||0
  const sorted=result.rows.sort((a,b)=>(value(a)-value(b))*(state.pmSortDir==='asc'?1:-1)||a.name.localeCompare(b.name))
  const totalPages=Math.max(1,Math.ceil(sorted.length/state.pmPageSize));state.pmPage=Math.min(Math.max(1,state.pmPage),totalPages)
  const page=sorted.slice((state.pmPage-1)*state.pmPageSize,state.pmPage*state.pmPageSize)
  $('#pmTableHead').innerHTML=pmColumns.map(([key,label])=>`<th title="${periodTitles[key]||label}">${['name','region','projectType'].includes(key)?label:`<button type="button" class="pm-sort ${state.pmSortKey===key?'active':''}" data-pm-sort="${key}">${label}<span class="pm-sort-arrow">${state.pmSortKey===key?(state.pmSortDir==='desc'?'↓':'↑'):'↕'}</span></button>`}</th>`).join('')
  $('#pmBoard colgroup').innerHTML='<col class="pm-col-name"><col class="pm-col-base"><col class="pm-col-country"><col class="pm-col-project-type">'+Array.from({length:3},()=>'<col class="pm-col-grade">').join('')+Array.from({length:4},()=>'<col class="pm-col-stage">').join('')+'<col class="pm-col-amount">'
  document.querySelectorAll('#pmGradeTabs button').forEach(button=>button.classList.toggle('active',button.dataset.pmGrade===state.pmGrade))
  $('#pmEmpty').hidden=sorted.length>0
  $('#pmTableBody').replaceChildren()
  for(const row of sorted.length?[{...result.total,total:true},...page]:[]){
    const tr=document.createElement('tr');if(row.total)tr.className='pm-total-row'
    const rowScope=scopeFor({pm:true,pmName:row.total?undefined:row.name,label:row.total?'PM 转化 · 当前总计':row.name})
    for(const [key,label] of pmColumns){
      const td=document.createElement('td');td.dataset.label=label
      if(key==='name')td.innerHTML=`<span class="pm-name">${esc(row.name)}</span>`
      else if(key==='region'||key==='projectType')td.textContent=(key==='region'?state.pmCountry:state.pmProjectType)==='all'?'—':key==='region'?state.pmCountry:state.pmProjectType
      else if(['a','b','c'].includes(key))td.innerHTML=`<div class="pm-cell grade-${key}"><strong>${fmt(row.grades[key])}</strong><small title="该等级客户数 ÷ 分配客户数">${rate(row.grades[key],row.assigned)}</small></div>`
      else if(key==='amount')td.innerHTML=`<div class="pm-cell amount"><strong>${money(row.amount)}</strong></div>`
      else if(key==='assigned')td.innerHTML=`<div class="pm-cell"><strong>${fmt(row.assigned)}</strong></div>`
      else if(key==='connected')td.innerHTML=`<div class="pm-cell connected"><strong>${fmt(row.connected)}</strong><small title="建联数 ÷ 分配客户数">${rate(row.connected,row.assigned)}</small></div>`
      else {
        const description=`${label} ÷ 分配客户数`
        const countScope={...rowScope,measure:({projects:'projects',opportunities:'opportunities',dealCustomers:'deals'})[key]||'all'}
        metricCell(td,countScope,`pm:${row.name}:${key}`,row[key],key==='projects'?'个项目':key==='opportunities'?'个商机':'位客户',rate(row[key],row.assigned),description,key==='dealCustomers'?'orders':'conversion')
        td.firstChild.className='pm-cell stage'
      }
      tr.append(td)
    }
    $('#pmTableBody').append(tr)
  }
  legacy.renderPagination('pmPagination',sorted.length,'pm')
}

window.opsDemoVisibleOrders=()=>entriesFor(scopeFor({measure:'deals'})).map(entry=>{
  const won=entry.opportunities.filter(isWon), amount=won.reduce((n,item)=>n+item.closedAmount,0),receivedAmount=won.reduce((n,item)=>n+item.receivedAmount,0)
  return {id:entry.project.id,projectName:entry.project.name,customer:entry.project.customer,pm:entry.project.pm,planId:Number(entry.attribution.planId),date:won.map(item=>item.closedAt||item.createdAt).sort().at(-1),leadDate:entry.createdAt,amount,receivedAmount,payment:receivedAmount>=amount?'已收款':'部分收款',country:entry.country,templateId:entry.traceTemplateId,orderIds:won.map(item=>item.id),touch:legacy.plans.find(item=>String(item.id)===entry.attribution.planId)?.ad}
})
window.opsDemoTraceProfile=order=>legacy.traceProfiles[order.templateId]||{country:order.country,region:order.country,role:'业主',tags:['项目咨询'],fields:['项目类型','住宅装修','客户身份','业主','需求产品','定制产品','图纸资料','已有图纸','项目阶段','交付中','国家',order.country],video:legacy.plans.find(plan=>plan.id===order.planId)?.ad||'广告素材'}
function addOrderLinks(){
  const orders=window.opsDemoVisibleOrders(), selected=orders.find(order=>order.id===state.traceOrderId)
  $('#orderAnalysisBoard .demo-total-orders')?.remove()
  if(!selected)return
  for(const card of document.querySelectorAll('.trace-project')){
    const order=orders.find(item=>item.id===card.dataset.orderId);if(!order)continue
    const wrap=document.createElement('div');wrap.className='demo-trace-project';card.before(wrap);wrap.append(card)
    const scope=scopeFor({projectIds:[order.id],label:order.projectName})
    const detail=countButton(scope,`trace-project:${order.id}`,1,'个项目','project');detail.className='demo-detail-link';detail.textContent='详情';detail.setAttribute('aria-label',`${order.projectName} 详情`);wrap.append(detail)
  }
  const planOrders=orders.filter(order=>order.planId===selected.planId), opportunityIds=planOrders.flatMap(order=>order.orderIds)
  const deal=$('#traceVideoContent .video-stats .video-stat:nth-child(2)')
  if(deal){deal.querySelector('strong').textContent=`${opportunityIds.length} 单`;const detail=countButton(scopeFor({plans:legacy.plans.filter(plan=>plan.id===selected.planId),projectIds:planOrders.map(order=>order.id),opportunityIds,label:'成交订单'}),`trace-deals:${selected.planId}`,opportunityIds.length,'个成交订单','orders');detail.className='demo-detail-link';detail.textContent='详情';detail.setAttribute('aria-label','查看成交订单详情');deal.append(detail)}
  const rows=[...document.querySelectorAll('#orderAnalysisBody tr')]
  for(const row of rows){
    const name=row.dataset.orderGroup
    const relevant=orders.filter(order=>state.orderAnalysisDimension==='pm'?name===order.pm:name===order.country)
    const column=state.orderAnalysisDimension==='pm'?2:3
    const opportunityIds=relevant.flatMap(order=>order.orderIds)
    metricCell(row.children[column],scopeFor({projectIds:relevant.map(order=>order.id),opportunityIds,label:`${state.orderAnalysisDimension==='pm'?relevant[0]?.pm:relevant[0]?.country||''} · 成交订单`}),`order-rank:${state.orderAnalysisDimension}:${name}`,opportunityIds.length,'个成交订单',null,null,'orders')
    row.children[column].firstChild.className='analysis-value'
  }
}
window.addEventListener('ops-demo-orders-render',addOrderLinks)
function openScope(button){const scope=scopes.get(button.dataset.opsScope);if(scope&&!button.disabled)post({type:'open-progress',scope})}
document.addEventListener('click',event=>{const button=event.target.closest('[data-ops-scope]');if(button){event.preventDefault();event.stopImmediatePropagation();openScope(button)}},true)
document.addEventListener('keydown',event=>{const button=event.target.closest('[data-ops-scope]');if(button&&['Enter',' '].includes(event.key)){event.preventDefault();event.stopImmediatePropagation();openScope(button)}},true)
toolbox.addEventListener('click',event=>{
  const button=event.target.closest('[data-demo-tool]');if(!button)return
  toolbox.open=false
  const scopedPlans=button.dataset.demoTool==='commission'?legacy.rows():legacy.advertisingRows()
  const plans=scopedPlans.map(plan=>({...plan,operator:legacy.plans.find(item=>item.id===plan.id)?.operator}))
  post({type:'open-tool',tool:button.dataset.demoTool,scope:scopeFor({plans:scopedPlans}),plans,factor:legacy.rangeFactor(),amount:summaryFor(scopeFor({plans:scopedPlans})).amount})
})
document.addEventListener('pointerdown',event=>{if(!toolbox.contains(event.target))toolbox.open=false})
document.addEventListener('keydown',event=>{if(event.key==='Escape')toolbox.open=false})
window.addEventListener('message',event=>{
  if(event.origin!==window.location.origin||event.source!==window.parent||event.data?.channel!==DEMO_CHANNEL)return
  if(event.data.type==='project-index'&&Array.isArray(event.data.index)){linkedIndex=event.data.index;scopes.clear();legacy.render()}
})
post({type:'ready',plans:legacy.plans,orders:legacy.orders})
legacy.render()
