/**
 * localStorage 持久层
 * v5 修订：单 Agent → 多 Agent，store API 接受 agentId 参数
 */

import { AGENTS, CONFIG_VERSIONS_BY_AGENT, CONTACTS } from './agent'
import { KB_ENTRIES, KB_GROUPS, KB_TYPES, KB_TAGS } from './knowledge'
import { KB_LIBRARIES } from './library'
import { CLOUD_ACCOUNTS } from './cloudAccounts'

const NS = 'gb-os-v9'

const KEYS = {
  AGENTS: `${NS}/agents`,
  CONFIG_VERSIONS_BY_AGENT: `${NS}/config-versions-by-agent`,
  KB_LIBRARIES: `${NS}/kb-libraries`,
  KB_ENTRIES: `${NS}/kb-entries`,
  KB_GROUPS: `${NS}/kb-groups`,
  KB_TYPES: `${NS}/kb-types`,
  KB_TAGS: `${NS}/kb-tags`,
  CLOUD_ACCOUNTS: `${NS}/cloud-accounts`,
}

function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.warn('[gb-store] localStorage 写入失败：', err)
  }
}

export const store = {
  // ---- Agents (多 Agent) ----
  getAgents: () => safeGet(KEYS.AGENTS, AGENTS),
  setAgents: (agents) => safeSet(KEYS.AGENTS, agents),
  getAgent: (id) => store.getAgents().find((a) => a.id === id),
  setAgent: (id, next) => {
    const all = store.getAgents()
    const updated = all.map((a) => a.id === id ? next : a)
    safeSet(KEYS.AGENTS, updated)
  },
  createAgent: (agent) => {
    const all = store.getAgents()
    safeSet(KEYS.AGENTS, [agent, ...all])
  },
  deleteAgent: (id) => {
    const all = store.getAgents()
    safeSet(KEYS.AGENTS, all.filter((a) => a.id !== id))
  },

  // ---- 联系人（通知人工候选） ----
  getContacts: () => CONTACTS,

  // ---- 配置版本 ----
  getConfigVersions: (agentId) => {
    const all = safeGet(KEYS.CONFIG_VERSIONS_BY_AGENT, CONFIG_VERSIONS_BY_AGENT)
    return all[agentId] || []
  },
  setConfigVersions: (agentId, vs) => {
    const all = safeGet(KEYS.CONFIG_VERSIONS_BY_AGENT, CONFIG_VERSIONS_BY_AGENT)
    safeSet(KEYS.CONFIG_VERSIONS_BY_AGENT, { ...all, [agentId]: vs })
  },

  // ---- 知识库 · 库 ----
  getKbLibraries: () => safeGet(KEYS.KB_LIBRARIES, KB_LIBRARIES),
  setKbLibraries: (libs) => safeSet(KEYS.KB_LIBRARIES, libs),
  getKbLibrary: (id) => store.getKbLibraries().find((l) => l.id === id),
  createKbLibrary: (lib) => safeSet(KEYS.KB_LIBRARIES, [lib, ...store.getKbLibraries()]),
  updateKbLibrary: (id, patch) => safeSet(
    KEYS.KB_LIBRARIES,
    store.getKbLibraries().map((l) => (l.id === id ? { ...l, ...patch } : l)),
  ),
  deleteKbLibrary: (id) => safeSet(KEYS.KB_LIBRARIES, store.getKbLibraries().filter((l) => l.id !== id)),

  // ---- 知识库 · 条目 ----
  getKbEntries: () => safeGet(KEYS.KB_ENTRIES, KB_ENTRIES),
  setKbEntries: (entries) => safeSet(KEYS.KB_ENTRIES, entries),
  getKbGroups: () => safeGet(KEYS.KB_GROUPS, KB_GROUPS),
  setKbGroups: (groups) => safeSet(KEYS.KB_GROUPS, groups),
  getKbTypes: () => safeGet(KEYS.KB_TYPES, KB_TYPES),
  setKbTypes: (types) => safeSet(KEYS.KB_TYPES, types),
  getKbTags: () => safeGet(KEYS.KB_TAGS, KB_TAGS),
  setKbTags: (tags) => safeSet(KEYS.KB_TAGS, tags),

  // 批量发布该库所有「待发布」条目 → 生效中（发布 = 生效，绝不隐藏内容）
  publishKbLibrary: (libraryId) => {
    const entries = store.getKbEntries()
    let affected = 0
    const next = entries.map((e) => {
      if (e.library_id !== libraryId || !e.pending) return e
      affected += 1
      return { ...e, status: 'published', pending: false }
    })
    if (affected > 0) safeSet(KEYS.KB_ENTRIES, next)
    return affected
  },

  // ---- 云账号 ----
  getCloudAccounts: () => safeGet(KEYS.CLOUD_ACCOUNTS, CLOUD_ACCOUNTS),
  setCloudAccounts: (accounts) => safeSet(KEYS.CLOUD_ACCOUNTS, accounts),

  // ---- Reset ----
  resetAll: () => {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k))
  },
}

export const STORE_KEYS = KEYS
