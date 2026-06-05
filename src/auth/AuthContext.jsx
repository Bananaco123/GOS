import { createContext, useContext, useState, useCallback, useMemo } from 'react'

import { USERS, userById } from '../mock/org'
import { ROLES, roleById, MENU_VIEW_PERM } from '../mock/rbac'

const STORAGE_KEY = 'gb-os-v8-auth'

const AuthContext = createContext(null)

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [userId, setUserId] = useState(() => readStored()?.userId || null)
  // 角色配置在演示期可被「角色与权限」页面修改，这里持有一份可变副本
  const [roles, setRoles] = useState(() => ROLES.map((r) => ({ ...r, permissions: [...r.permissions] })))
  // 用户 → 角色 分配（演示期可被「角色与用户」页面修改），初始来自 2.0 用户的 role_id
  const [userRoles, setUserRoles] = useState(() => {
    const map = {}
    USERS.forEach((u) => { map[u.id] = u.role_id })
    return map
  })

  const persist = (uid) => {
    if (uid) localStorage.setItem(STORAGE_KEY, JSON.stringify({ userId: uid }))
    else localStorage.removeItem(STORAGE_KEY)
  }

  const login = useCallback((uid) => {
    setUserId(uid)
    persist(uid)
  }, [])

  const logout = useCallback(() => {
    setUserId(null)
    persist(null)
  }, [])

  const user = userId ? userById(userId) : null
  const role = user ? roles.find((r) => r.id === userRoles[user.id]) : null

  const assignRole = useCallback((uid, roleId) => {
    setUserRoles((prev) => ({ ...prev, [uid]: roleId }))
  }, [])

  const countUsersOfRole = useCallback(
    (roleId) => Object.values(userRoles).filter((rid) => rid === roleId).length,
    [userRoles],
  )

  const hasPerm = useCallback(
    (permKey) => {
      if (!role) return false
      return role.permissions.includes(permKey)
    },
    [role],
  )

  // 菜单可见性：有映射则按对应 view 权限；无映射默认可见
  const hasMenu = useCallback(
    (menuKey) => {
      const permKey = MENU_VIEW_PERM[menuKey]
      if (!permKey) return true
      return hasPerm(permKey)
    },
    [hasPerm],
  )

  // 更新某角色权限（角色与权限页用）；立即生效
  const updateRole = useCallback((roleId, patch) => {
    setRoles((prev) => prev.map((r) => (r.id === roleId ? { ...r, ...patch } : r)))
  }, [])

  const addRole = useCallback((newRole) => {
    setRoles((prev) => [...prev, newRole])
  }, [])

  const removeRole = useCallback((roleId) => {
    setRoles((prev) => prev.filter((r) => r.id !== roleId))
  }, [])

  const value = useMemo(
    () => ({
      isAuthenticated: !!user,
      user,
      role,
      roles,
      userRoles,
      dataScope: role?.data_scope || null,
      login,
      logout,
      hasPerm,
      hasMenu,
      updateRole,
      addRole,
      removeRole,
      assignRole,
      countUsersOfRole,
    }),
    [user, role, roles, userRoles, login, logout, hasPerm, hasMenu, updateRole, addRole, removeRole, assignRole, countUsersOfRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

// 可登录的演示身份（每个对应一个真实预设用户 / 角色）
export const DEMO_IDENTITIES = [
  { userId: 'u-gao', label: 'Gao Kui · 超级管理员' },
  { userId: 'u-mike', label: 'Mike Liu · 普通管理员' },
  { userId: 'u-linda', label: 'Linda Chen · 普通用户' },
  { userId: 'u-sara', label: 'Sara Wang · 知识库管理员（自定义角色）' },
]

export { USERS, ROLES }
