import { buildOperationsOrganization, resolveOperationsOrganization } from './operations-organization-data.js'

export function mountOperationsOrganization({ anchor, names, state, render }) {
  const tree=buildOperationsOrganization(names)
  const root=document.createElement('div')
  root.className='ops-organization-filter'
  root.innerHTML='<button type="button" class="ops-organization-trigger" aria-label="选择部门、小组、人员" aria-haspopup="dialog" aria-expanded="false"><span>选择部门 / 小组 / 人员</span><i aria-hidden="true"></i></button><button type="button" class="ops-organization-clear" aria-label="清除部门、小组和人员选择" hidden>×</button><div class="ops-organization-menu" role="dialog" aria-label="部门、小组、人员三级联选" hidden></div>'
  anchor.before(root)
  anchor.hidden=true
  const trigger=root.querySelector('.ops-organization-trigger'),clear=root.querySelector('.ops-organization-clear'),menu=root.querySelector('.ops-organization-menu')
  let path=[]
  const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))
  const close=()=>{menu.hidden=true;trigger.setAttribute('aria-expanded','false')}
  function refresh() {
    const selection=resolveOperationsOrganization(tree,path)
    path=selection.organizationPath
    const department=tree.find(item=>item.value===path[0]),team=department?.children.find(item=>item.value===path[1])
    const columns=[{label:'部门',items:tree},{label:'小组',items:department?.children||[]},{label:'人员',items:team?.children||[]}]
    menu.innerHTML=columns.map((column,level)=>`<section><header>${column.label}</header><div role="listbox" aria-label="${column.label}选项">${column.items.length?column.items.map(item=>`<button type="button" role="option" aria-selected="${item.value===path[level]}" data-org-level="${level}" data-org-value="${esc(item.value)}" title="${esc(item.label)}"><span>${esc(item.label)}</span>${item.children?'<i aria-hidden="true">›</i>':''}</button>`).join(''):`<p>${level?'请选择上一级':'暂无人员'}</p>`}</div></section>`).join('')
    const label=selection.organizationLabels.join(' / ')
    trigger.querySelector('span').textContent=label||'选择部门 / 小组 / 人员'
    trigger.title=label||'选择部门 / 小组 / 人员'
    clear.hidden=!path.length
  }
  function apply() {
    Object.assign(state,resolveOperationsOrganization(tree,path),{adsPage:1,pmPage:1})
    refresh()
    render()
  }
  trigger.addEventListener('click',()=>{
    if(!menu.hidden){close();return}
    refresh();menu.hidden=false;trigger.setAttribute('aria-expanded','true')
    const rect=trigger.getBoundingClientRect(),width=Math.min(640,window.innerWidth-16)
    menu.style.width=`${width}px`
    menu.style.left=`${Math.max(8,Math.min(rect.right-width,window.innerWidth-width-8))}px`
    menu.style.top=`${Math.max(8,Math.min(rect.bottom+8,window.innerHeight-330))}px`
  })
  menu.addEventListener('click',event=>{
    const option=event.target.closest('[data-org-level]');if(!option)return
    const level=Number(option.dataset.orgLevel)
    path=[...path.slice(0,level),option.dataset.orgValue]
    apply()
    if(level===2){close();trigger.focus()}
  })
  clear.addEventListener('click',()=>{path=[];apply();close();trigger.focus()})
  document.addEventListener('pointerdown',event=>{if(!root.contains(event.target))close()})
  document.addEventListener('scroll',event=>{if(!root.contains(event.target))close()},true)
  root.addEventListener('keydown',event=>{if(event.key==='Escape'){close();trigger.focus()}})
  Object.assign(state,resolveOperationsOrganization(tree,[]))
  refresh()
  return {refresh}
}
