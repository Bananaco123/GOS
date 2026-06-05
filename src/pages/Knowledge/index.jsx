import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, Segmented, Button, Empty, DatePicker, Select } from 'antd'
import { BookOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

import { useAuth } from '../../auth/AuthContext'
import { store } from '../../mock/store'
import { visibleLibraries, scopeMeta } from '../../mock/library'
import { deptName, userById } from '../../mock/org'
import { libraryRefAgents } from '../../utils/kbRefs'
import { ScopeTag, AgentRefPopover } from './kbShared'
import NewLibraryModal from './NewLibraryModal'
import './knowledge.css'

const { RangePicker } = DatePicker

function ownerText(lib) {
  if (lib.scope === 'company') return '全公司'
  if (lib.scope === 'dept') return deptName(lib.owner_dept_id)
  if (lib.scope === 'self') return userById(lib.owner_user_id)?.name || '本人'
  return '—'
}

export default function KnowledgeBase() {
  const navigate = useNavigate()
  const { user, role, hasPerm } = useAuth()
  const canManage = hasPerm('knowledge.manage')

  const [libs, setLibs] = useState(() => store.getKbLibraries())
  const entries = useMemo(() => store.getKbEntries(), [])
  const agents = useMemo(() => store.getAgents(), [])

  const [scopeFilter, setScopeFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [creatorFilter, setCreatorFilter] = useState(null)
  const [range, setRange] = useState(null)
  const [newOpen, setNewOpen] = useState(false)

  const myLibs = useMemo(() => visibleLibraries(libs, user, role), [libs, user, role])

  const creatorOptions = useMemo(
    () => [...new Set(myLibs.map((l) => l.created_by))].map((c) => ({ value: c, label: c })),
    [myLibs],
  )

  const filtered = useMemo(() => myLibs.filter((l) => {
    if (scopeFilter !== 'all' && l.scope !== scopeFilter) return false
    if (search && !l.name.toLowerCase().includes(search.toLowerCase())) return false
    if (creatorFilter && l.created_by !== creatorFilter) return false
    if (range && range[0] && range[1]) {
      const d = dayjs(l.created_at)
      if (d.isBefore(range[0], 'day') || d.isAfter(range[1], 'day')) return false
    }
    return true
  }), [myLibs, scopeFilter, search, creatorFilter, range])

  const statOf = (lib) => {
    const list = entries.filter((e) => e.library_id === lib.id && e.status !== 'offline')
    return {
      live: list.filter((e) => !e.pending && e.status === 'published').length,
      pending: list.filter((e) => e.pending).length,
      total: list.length,
      refAgents: libraryRefAgents(lib.id, agents),
    }
  }

  const scopeCounts = useMemo(() => ({
    all: myLibs.length,
    company: myLibs.filter((l) => l.scope === 'company').length,
    dept: myLibs.filter((l) => l.scope === 'dept').length,
    self: myLibs.filter((l) => l.scope === 'self').length,
  }), [myLibs])

  const handleCreate = (lib) => { store.createKbLibrary(lib); setLibs(store.getKbLibraries()) }

  return (
    <div className="gb-kb-page">
      <div className="gb-kb-hero">
        <div className="gb-kb-hero-head">
          <h1 className="gb-kb-hero-title">
            <BookOutlined style={{ marginRight: 8, color: 'var(--gb-primary)' }} />
            知识库
          </h1>
          {canManage && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setNewOpen(true)}>新建知识库</Button>
          )}
        </div>

        <div className="gb-kb-lib-toolbar">
          <Segmented
            value={scopeFilter}
            onChange={setScopeFilter}
            options={[
              { label: `全部 ${scopeCounts.all}`, value: 'all' },
              { label: `${scopeMeta('company').label} ${scopeCounts.company}`, value: 'company' },
              { label: `${scopeMeta('dept').label} ${scopeCounts.dept}`, value: 'dept' },
              { label: `${scopeMeta('self').label} ${scopeCounts.self}`, value: 'self' },
            ]}
          />
          <Input prefix={<SearchOutlined />} placeholder="搜索知识库名称" value={search} onChange={(e) => setSearch(e.target.value)} allowClear style={{ width: 200 }} />
          <Select placeholder="创建人" allowClear value={creatorFilter} onChange={setCreatorFilter} options={creatorOptions} style={{ width: 140 }} />
          <RangePicker placeholder={['创建时间', '创建时间']} value={range} onChange={setRange} style={{ width: 240 }} />
        </div>
      </div>

      <div className="gb-kb-content">
        {filtered.length === 0 ? (
          <Empty description={canManage ? '没有符合条件的库' : '当前没有你可见的知识库'} style={{ padding: '80px 0' }} />
        ) : (
          <div className="gb-kb-lib-grid">
            {filtered.map((lib) => {
              const s = statOf(lib)
              return (
                <div key={lib.id} className="gb-kb-lib-card" onClick={() => navigate(`/knowledge/lib/${lib.id}`)}>
                  <div className="gb-kb-lib-card-top">
                    <div className="gb-kb-lib-card-icon" style={{ background: `${lib.color}16`, color: lib.color }}>
                      <BookOutlined />
                    </div>
                    <div className="gb-kb-lib-card-titlewrap">
                      <div className="gb-kb-lib-card-name">{lib.name}</div>
                      <div className="gb-kb-lib-card-tags">
                        <ScopeTag scope={lib.scope} size="sm" />
                      </div>
                    </div>
                  </div>

                  <div className="gb-kb-lib-card-desc">{lib.description || '—'}</div>

                  <div className="gb-kb-lib-fields" onClick={(e) => e.stopPropagation()}>
                    <div className="gb-kb-lib-field">
                      <span className="gb-kb-lib-field-label">可见范围</span>
                      <span className="gb-kb-lib-field-value">{ownerText(lib)}</span>
                    </div>
                    <div className="gb-kb-lib-field">
                      <span className="gb-kb-lib-field-label">知识条目</span>
                      <span className="gb-kb-lib-field-value">{s.total} 条</span>
                    </div>
                    <div className="gb-kb-lib-field">
                      <span className="gb-kb-lib-field-label">被引用数</span>
                      <span className="gb-kb-lib-field-value"><AgentRefPopover agents={s.refAgents} /></span>
                    </div>
                    <div className="gb-kb-lib-field">
                      <span className="gb-kb-lib-field-label">库累计命中</span>
                      <span className="gb-kb-lib-field-value gb-mono">{lib.total_recall.toLocaleString()}</span>
                    </div>
                    <div className="gb-kb-lib-field">
                      <span className="gb-kb-lib-field-label">创建人</span>
                      <span className="gb-kb-lib-field-value">{lib.created_by} · {lib.created_at}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <NewLibraryModal open={newOpen} onClose={() => setNewOpen(false)} onCreate={handleCreate} user={user} />
    </div>
  )
}
