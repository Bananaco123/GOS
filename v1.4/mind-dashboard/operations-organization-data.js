// 运营看板共用的组织演示名册，小组归属固定，不随日期或广告筛选变化。
export const OPERATIONS_PEOPLE = [
  { name:'马凯 Kevin Ma', department:'海外营销一部', team:'投放一组' },
  { name:'刘迈 Mike Liu', department:'海外营销一部', team:'投放二组' },
  { name:'陈琳 Linda Chen', department:'海外营销二部', team:'投放一组' },
  { name:'林杰 James Lin', department:'海外营销二部', team:'投放二组' },
  { name:'王莎 Sara Wang', department:'海外营销三部', team:'投放一组' },
  { name:'赵睿 Eric Zhao', department:'海外营销三部', team:'投放二组' },
]
export const DEPARTMENTS = [...new Set(OPERATIONS_PEOPLE.map(person=>person.department))]
export const departmentOf = name => OPERATIONS_PEOPLE.find(person=>person.name===name)?.department || DEPARTMENTS[2]

export function buildOperationsOrganization(names) {
  const departments=[]
  for(const name of [...new Set(names.filter(Boolean))]) {
    const person=OPERATIONS_PEOPLE.find(item=>item.name===name)||{name,department:departmentOf(name),team:'其他运营组'}
    let department=departments.find(item=>item.value===person.department)
    if(!department){department={value:person.department,label:person.department,children:[]};departments.push(department)}
    const teamId=`${person.department}/${person.team}`
    let team=department.children.find(item=>item.value===teamId)
    if(!team){team={value:teamId,label:person.team,children:[]};department.children.push(team)}
    team.children.push({value:name,label:name})
  }
  return departments
}

export function resolveOperationsOrganization(tree, path=[]) {
  const department=tree.find(item=>item.value===path[0])
  const team=department?.children.find(item=>item.value===path[1])
  const person=team?.children.find(item=>item.value===path[2])
  const selected=[department,team,person].filter(Boolean)
  const members=person?[person.value]:team?team.children.map(item=>item.value):department?department.children.flatMap(item=>item.children.map(member=>member.value)):null
  return {organizationPath:selected.map(item=>item.value),organizationLabels:selected.map(item=>item.label),organizationOperators:members,departments:department?[department.value]:[],organizationTeam:team?.value||null,operators:person?[person.value]:[]}
}
