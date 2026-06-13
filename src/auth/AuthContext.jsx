import { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react'

import { USERS, userById } from '../mock/org'
import { ROLES, roleById, MENU_VIEW_PERM, ALL_PERMISSION_KEYS } from '../mock/rbac'
import { store } from '../mock/store'

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

// 含秒时间戳（系统日志用）
const stamp = () => new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')

function transferOwnedAssets(source, target) {
  const libraries = store.getKbLibraries()
  let knowledgeCount = 0
  store.setKbLibraries(libraries.map((lib) => {
    if (lib.scope !== 'self' || lib.owner_user_id !== source.id) return lib
    knowledgeCount += 1
    return { ...lib, owner_user_id: target.id }
  }))

  const cloudAccounts = store.getCloudAccounts()
  let cloudAccountCount = 0
  store.setCloudAccounts(cloudAccounts.map((account) => {
    if (account.owner_name !== source.name) return account
    cloudAccountCount += 1
    return { ...account, owner_name: target.name, owner_avatar: target.avatar }
  }))

  return { knowledgeCount, cloudAccountCount }
}

// 种子系统日志（演示历史，倒序；与初始用户态一致：Vivian 停用 / Eric 离职）
const SEED_LOGS = [
  { id: 'log-s1', time: '2026-06-05 18:22:10', actor: 'Gao Kui', actor_avatar: 'GK', type: 'role_perm', text: 'Gao Kui 修改了角色「知识库管理员」的权限' },
  { id: 'log-s2', time: '2026-06-05 10:04:55', actor: 'Gao Kui', actor_avatar: 'GK', type: 'account_status', text: 'Gao Kui 停用了 Vivian Tan 的账号' },
  { id: 'log-s3', time: '2026-06-03 16:40:12', actor: 'Mike Liu', actor_avatar: 'ML', type: 'account_role', text: 'Mike Liu 修改了 James Lin 的角色为 普通用户' },
  { id: 'log-s4', time: '2026-06-02 09:15:33', actor: 'Gao Kui', actor_avatar: 'GK', type: 'handover', text: 'Gao Kui 将 Eric Zhao 的数据资产交接给 Linda Chen，账号状态未变更' },
  { id: 'log-s5', time: '2026-05-30 14:08:47', actor: 'Gao Kui', actor_avatar: 'GK', type: 'role_add', text: 'Gao Kui 新增了角色「知识库管理员」' },
  { id: 'log-s6', time: '2026-05-28 11:20:05', actor: 'Sara Wang', actor_avatar: 'SW', type: 'account_add', text: 'Sara Wang 新增了用户 COCO（角色：普通用户）' },
]

export function AuthProvider({ children }) {
  const [userId, setUserId] = useState(() => readStored()?.userId || null)
  // 角色配置（演示期可被「角色与权限」修改）
  const [roles, setRoles] = useState(() => ROLES.map((r) => ({ ...r, permissions: [...r.permissions] })))
  // 用户（演示期可被「部门与用户」新增/改角色/停用启用/交接/删除）；初始来自 2.0 用户
  const [users, setUsers] = useState(() => USERS.map((u) => ({ ...u })))
  // 系统日志（演示期内存态，与角色一致；含种子历史）
  const [logs, setLogs] = useState(() => SEED_LOGS.map((l) => ({ ...l })))

  const persist = (uid) => {
    if (uid) localStorage.setItem(STORAGE_KEY, JSON.stringify({ userId: uid }))
    else localStorage.removeItem(STORAGE_KEY)
  }

  const login = useCallback((uid) => { setUserId(uid); persist(uid) }, [])
  const logout = useCallback(() => { setUserId(null); persist(null) }, [])

  const user = userId ? (users.find((u) => u.id === userId) || userById(userId)) : null
  const effectiveRoles = useMemo(
    () => roles.map((r) => (r.locked ? { ...r, permissions: ALL_PERMISSION_KEYS } : r)),
    [roles],
  )
  const role = user ? effectiveRoles.find((r) => r.id === user.role_id) : null

  // 当前操作人（写日志用，ref 避免闭包过期）
  const actorRef = useRef(null)
  actorRef.current = user ? { name: user.name, avatar: user.avatar } : { name: '系统', avatar: 'SY' }

  const pushLog = useCallback((type, text) => {
    setLogs((prev) => [
      { id: `log-${Date.now()}-${prev.length}`, time: stamp(), actor: actorRef.current.name, actor_avatar: actorRef.current.avatar, type, text },
      ...prev,
    ])
  }, [])

  const hasPerm = useCallback((permKey) => {
    if (!role) return false
    return role.permissions.includes(permKey)
  }, [role])

  const hasMenu = useCallback((menuKey) => {
    const permKey = MENU_VIEW_PERM[menuKey]
    if (!permKey) return true
    return hasPerm(permKey)
  }, [hasPerm])

  // ---------- 角色操作（即时生效 + 写日志） ----------
  const updateRole = useCallback((roleId, patch) => {
    setRoles((prev) => prev.map((r) => (r.id === roleId ? { ...r, ...patch } : r)))
    pushLog('role_perm', `${actorRef.current.name} 修改了角色「${patch.name || roleById(roleId)?.name || ''}」的权限`)
  }, [pushLog])

  const addRole = useCallback((newRole) => {
    setRoles((prev) => [...prev, newRole])
    pushLog('role_add', `${actorRef.current.name} 新增了角色「${newRole.name}」`)
  }, [pushLog])

  const removeRole = useCallback((roleId) => {
    setRoles((prev) => {
      const r = prev.find((x) => x.id === roleId)
      if (r) pushLog('role_delete', `${actorRef.current.name} 删除了角色「${r.name}」`)
      return prev.filter((x) => x.id !== roleId)
    })
  }, [pushLog])

  // ---------- 用户操作（即时生效 + 写日志） ----------
  const addUser = useCallback((u) => {
    setUsers((prev) => [{ ...u }, ...prev])
    pushLog('account_add', `${actorRef.current.name} 新增了用户 ${u.name}（角色：${roleById(u.role_id)?.name || '普通用户'}）`)
  }, [pushLog])

  const updateUserRole = useCallback((uid, roleId) => {
    setUsers((prev) => prev.map((u) => {
      if (u.id !== uid) return u
      pushLog('account_role', `${actorRef.current.name} 修改了 ${u.name} 的角色为 ${roleById(roleId)?.name || roleId}`)
      return { ...u, role_id: roleId }
    }))
  }, [pushLog])

  const setUserStatus = useCallback((uid, status) => {
    setUsers((prev) => prev.map((u) => {
      if (u.id !== uid) return u
      pushLog('account_status', `${actorRef.current.name} ${status === 'active' ? '启用' : '停用'}了 ${u.name} 的账号`)
      return { ...u, status }
    }))
  }, [pushLog])

  const handoverUser = useCallback((uid, targetUid) => {
    const source = users.find((x) => x.id === uid)
    const target = users.find((x) => x.id === targetUid)
    if (!source || !target || source.id === target.id || source.status !== 'active' || target.status !== 'active') return

    const assets = transferOwnedAssets(source, target)
    pushLog(
      'handover',
      `${actorRef.current.name} 将 ${source.name} 的数据资产交接给 ${target.name}，知识库 ${assets.knowledgeCount} 个、云账号 ${assets.cloudAccountCount} 个，账号状态未变更`,
    )
  }, [users, pushLog])

  const removeUser = useCallback((uid) => {
    setUsers((prev) => {
      const u = prev.find((x) => x.id === uid)
      if (u) pushLog('account_delete', `${actorRef.current.name} 删除了账号 ${u.name}`)
      return prev.filter((x) => x.id !== uid)
    })
  }, [pushLog])

  // 兼容旧 API
  const assignRole = updateUserRole

  const countUsersOfRole = useCallback(
    (roleId) => users.filter((u) => u.role_id === roleId).length,
    [users],
  )

  const value = useMemo(
    () => ({
      isAuthenticated: !!user,
      user,
      role,
      roles: effectiveRoles,
      users,
      logs,
      dataScope: role?.data_scope || null,
      login,
      logout,
      hasPerm,
      hasMenu,
      updateRole,
      addRole,
      removeRole,
      addUser,
      updateUserRole,
      setUserStatus,
      handoverUser,
      removeUser,
      assignRole,
      countUsersOfRole,
    }),
    [user, role, effectiveRoles, users, logs, login, logout, hasPerm, hasMenu, updateRole, addRole, removeRole, addUser, updateUserRole, setUserStatus, handoverUser, removeUser, assignRole, countUsersOfRole],
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
