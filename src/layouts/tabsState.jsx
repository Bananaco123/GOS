import { createContext, useContext, useState, useMemo } from 'react'

/**
 * 多标签页（tagsView）全局状态
 * 提升到 Provider，使「业务外壳」与「设置外壳」之间切换时标签保持一致
 */
const TabsContext = createContext(null)

export function TabsProvider({ children }) {
  const [tabs, setTabs] = useState([])
  const value = useMemo(() => ({ tabs, setTabs }), [tabs])
  return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>
}

export function useGlobalTabs() {
  const ctx = useContext(TabsContext)
  if (!ctx) return { tabs: [], setTabs: () => {} }
  return ctx
}
