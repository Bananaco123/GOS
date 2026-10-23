export const DEMO_CHANNEL = 'gos-operations-demo-v2'
export { DEPARTMENTS, departmentOf } from '../operations-organization-data.js'
export const WON_STAGES = ['待下单', '交付中', '已完成']
export const isWon = item => WON_STAGES.includes(item.status)
export function filterLinkedEntries(index, scope = {}) {
  const ids = new Set((scope.planIds || []).map(String))
  const inRange = date => Boolean(date) && (!scope.start || date >= scope.start) && (!scope.end || date <= scope.end)
  return index.filter(entry => {
    const source = entry.attribution
    return ids.has(String(source.planId))
      && (!scope.pmName || source.pmName === scope.pmName)
      && (!scope.pmNames || scope.pmNames.includes(source.pmName))
      && (!scope.region || scope.region === 'all' || source.region === scope.region)
      && (!scope.projectType || scope.projectType === 'all' || source.projectType === scope.projectType)
      && (!scope.grade || scope.grade === 'all' || entry.project.level.toLowerCase() === scope.grade)
      && (!scope.projectIds || scope.projectIds.includes(entry.project.id))
  }).flatMap(entry => {
    const projectCreated = inRange(entry.createdAt)
    const createdOpportunities = entry.opportunities.filter(item=>inRange(item.createdAt))
    const closedOpportunities = entry.opportunities.filter(item=>isWon(item)&&inRange(item.closedAt || item.createdAt))
    const customers = (entry.customers || [{id:entry.project.id,connected:true,level:entry.project.level,assignedAt:entry.createdAt}]).filter(customer=>inRange(customer.assignedAt || entry.createdAt))
    if (!projectCreated && !createdOpportunities.length && !closedOpportunities.length && !customers.length) return []
    if (scope.measure==='projects' && !projectCreated) return []
    let opportunities = scope.measure==='opportunities' ? createdOpportunities : scope.measure==='deals' || scope.wonOnly ? closedOpportunities : entry.opportunities
    if (scope.opportunityIds) opportunities=opportunities.filter(item=>scope.opportunityIds.includes(item.id))
    if (!opportunities.length && (scope.opportunityIds || scope.wonOnly || ['opportunities','deals'].includes(scope.measure))) return []
    const closed = opportunities.filter(item=>closedOpportunities.some(won=>won.id===item.id))
    return [{ ...entry, opportunities, customers,
      period:{projectCreated,acquired:inRange(entry.activityAt || entry.createdAt),createdOpportunityIds:opportunities.filter(item=>inRange(item.createdAt)).map(item=>item.id),closedOpportunityIds:closed.map(item=>item.id)},
      stageCounts:Object.fromEntries(Object.keys(entry.stageCounts).map(stage=>[stage,opportunities.filter(item=>item.status===stage).length])) }]
  })
}
export function summarizeLinkedEntries(entries) {
  const projectCreated=entry=>entry.period?.projectCreated ?? true
  const created=entry=>entry.period ? entry.opportunities.filter(item=>entry.period.createdOpportunityIds.includes(item.id)) : entry.opportunities
  const closed=entry=>entry.period ? entry.opportunities.filter(item=>entry.period.closedOpportunityIds.includes(item.id)) : entry.opportunities.filter(isWon)
  return {
    projects: new Set(entries.filter(projectCreated).map(entry => entry.project.id)).size,
    opportunities: new Set(entries.flatMap(entry => created(entry).map(item => item.id))).size,
    convertedProjects: entries.filter(entry=>projectCreated(entry)&&created(entry).length).length,
    dealCustomers: new Set(entries.filter(entry=>closed(entry).length).map(entry=>entry.project.customerId || entry.project.id)).size,
    orders: new Set(entries.flatMap(entry=>closed(entry).map(item=>item.id))).size,
    amount: entries.reduce((sum, entry) => sum + closed(entry).reduce((total, item) => total + (item.closedAmount || 0), 0), 0),
  }
}
// 下钻先确定项目范围，项目报价覆盖率及阶段分布始终使用该项目的完整商机。
export function buildProjectProgressEntries(index, scopedEntries) {
  const projects=new Map(index.map(entry=>[entry.project.id,entry]))
  return scopedEntries.map(entry=>{
    const full=projects.get(entry.project.id)||entry
    return {...entry,opportunities:full.opportunities,stageCounts:full.stageCounts,linkedOpportunityIds:entry.opportunities.map(item=>item.id)}
  })
}
export function buildPmConversionRows(entries) {
  const groups = new Map()
  for (const entry of entries) {
    const name = entry.attribution.pmName
    if (!groups.has(name)) groups.set(name, {name,entries:[]})
    groups.get(name).entries.push(entry)
  }
  const summarize = ({name,entries}) => {
    const totals = summarizeLinkedEntries(entries)
    const customers = entries.flatMap(entry=>entry.customers || [{id:entry.project.id,connected:true,level:entry.project.level}])
    const acquisition = key => entries.reduce((sum,entry)=>sum+((entry.period?.acquired??true)?entry.acquisition?.[key]||0:0),0)
    return { name, ...totals, inquiries:acquisition('inquiries'),visits:acquisition('visits'),floorplan:acquisition('floorplan'),duplicate:acquisition('duplicate'),assigned:customers.length, connected:customers.filter(customer=>customer.connected).length,
      grades:Object.fromEntries(['a','b','c'].map(grade=>[grade,customers.filter(customer=>customer.level.toLowerCase()===grade).length])) }
  }
  return { total:summarize({name:'总计',entries}), rows:[...groups.values()].map(summarize) }
}
export function getAudienceWindow(end, days = 7) {
  const duration = Math.min(15, Math.max(1, Math.trunc(Number(days) || 7)))
  const date = new Date(`${end}T00:00:00Z`)
  if (!Number.isFinite(date.getTime())) return null
  date.setUTCDate(date.getUTCDate() - duration + 1)
  return { start:date.toISOString().slice(0,10), end, days:duration }
}
export function buildAdHierarchy(plans) {
  const campaigns = new Map()
  for (const plan of plans) {
    const key = encodeURIComponent(JSON.stringify([plan.account,plan.name]))
    if (!campaigns.has(key)) campaigns.set(key,{key,label:plan.name,account:plan.account,groups:new Map()})
    const campaign = campaigns.get(key)
    if (!campaign.groups.has(plan.group)) campaign.groups.set(plan.group,{label:plan.group,ads:[]})
    campaign.groups.get(plan.group).ads.push({id:String(plan.id),label:plan.ad})
  }
  return [...campaigns.values()].map(campaign=>({...campaign,groups:[...campaign.groups.values()]}))
}
