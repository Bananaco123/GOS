// 外部看板与个人详情共用分析能力，局部筛选和展开状态在关闭详情后恢复。
const defaults = () => ({
  board: 'ads', dimension: 'channel', conversionSource: 'all',
  sortKey: 'inquiries', sortDir: 'desc', orderAnalysisDimension: 'pm',
  expandedRowKeys: new Set(), expandedInitialized: false,
  pmGrade: 'all', pmCountry: 'all', pmSearch: '',
  pmSortKey: 'assigned', pmSortDir: 'desc',
  adsPage: 1, pmPage: 1, adsPageSize: 15, pmPageSize: 15,
})

export function createMemberAnalysisContext({ state, globalRows, ownerOf }) {
  let member = null, saved = null
  const keys = Object.keys(defaults())
  return {
    get member() { return member },
    rows() { return globalRows().filter(plan => !member || ownerOf(plan) === member) },
    enter(name) {
      if (saved) throw new Error('请先关闭当前人员详情')
      saved = Object.fromEntries(keys.map(key => [key, structuredClone(state[key])]))
      member = name
      Object.assign(state, defaults())
    },
    leave() {
      if (!saved) return
      Object.assign(state, saved)
      saved = null
      member = null
    },
  }
}
