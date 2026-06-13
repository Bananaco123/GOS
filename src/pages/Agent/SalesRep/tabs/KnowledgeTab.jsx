import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Table, Button, Modal, Checkbox, Radio, Tag, App, Space, Empty, Popover,
} from 'antd'
import {
  ReadOutlined, PlusOutlined, ExportOutlined, BookOutlined,
  FolderOpenOutlined, DeleteOutlined,
} from '@ant-design/icons'

import { KB_GROUPS, KB_GROUPS_FLAT } from '../../../../mock/knowledge'
import { store } from '../../../../mock/store'
import { visibleLibraries, scopeMeta } from '../../../../mock/library'
import { deptName, userById } from '../../../../mock/org'
import { groupAncestors } from '../../../../utils/kbRefs'
import { useAuth } from '../../../../auth/AuthContext'
import { ScopeTag } from '../../../Knowledge/kbShared'

// 分组 id → 路径名（一级 / 二级）
const GROUP_PATH = (() => {
  const m = {}
  KB_GROUPS_FLAT.forEach((g) => { m[g.id] = g.path })
  return m
})()

// 库归属文案（与知识库总览一致）
function ownerText(lib) {
  if (!lib) return '—'
  if (lib.scope === 'company') return '全公司'
  if (lib.scope === 'dept') return deptName(lib.owner_dept_id)
  if (lib.scope === 'self') return userById(lib.owner_user_id)?.name || '本人'
  return '—'
}

// 某库的顶层分组（含子）
const libTopGroups = (libId) => KB_GROUPS.filter((g) => g.library_id === libId)

// 条目是否「生效中」（= Agent 实际可命中）
const isLive = (e) => e.status === 'published' && !e.pending

// 某库引用项命中的「生效中」条目
function liveEntriesOf(libRef, entries) {
  return entries.filter((e) => {
    if (e.library_id !== libRef.library_id || !isLive(e)) return false
    if (libRef.groups === 'all') return true
    const anc = groupAncestors(e.group_id)
    return Array.isArray(libRef.groups) && libRef.groups.some((g) => anc.includes(g))
  })
}

export default function KnowledgeTab({ agent, onChange }) {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { user, role } = useAuth()

  const entries = useMemo(() => store.getKbEntries(), [])
  const allLibs = useMemo(() => store.getKbLibraries(), [])
  const myLibs = useMemo(() => visibleLibraries(allLibs, user, role), [allLibs, user, role])

  const refs = agent.knowledge_libraries || []
  const refLibIds = refs.map((r) => r.library_id)

  const [addOpen, setAddOpen] = useState(false)
  const [addState, setAddState] = useState({}) // { [libId]: { checked, mode:'all'|'custom', groupIds:[] } }
  const [scopeEdit, setScopeEdit] = useState(null) // { library_id, mode, groupIds }
  const setLib = (libId, patch) => setAddState((s) => ({ ...s, [libId]: { mode: 'all', groupIds: [], checked: false, ...s[libId], ...patch } }))
  const addCount = Object.values(addState).filter((v) => v.checked).length

  // 库内某分组（含子树）的生效中条目数
  const liveCountForGroup = (groupId) =>
    entries.filter((e) => isLive(e) && groupAncestors(e.group_id).includes(groupId)).length
  // 整库生效中条目数
  const libLive = (libId) =>
    entries.filter((e) => e.library_id === libId && isLive(e)).length

  // 已引用库（按 ref 顺序 + 统计）
  const linkedRows = useMemo(() => refs.map((r) => {
    const lib = allLibs.find((l) => l.id === r.library_id)
    const live = liveEntriesOf(r, entries)
    const latest = live.length ? live.map((e) => e.updated_at).sort().reverse()[0] : '—'
    return {
      key: r.library_id,
      ref: r,
      lib,
      liveCount: live.length,
      hitSum: live.reduce((s, e) => s + (e.used_count || 0), 0),
      latest,
    }
  }), [refs, allLibs, entries])

  // 可新增库（可见 − 已引用），按可见范围分区
  const addable = useMemo(() => {
    const avail = myLibs.filter((l) => !refLibIds.includes(l.id))
    return {
      company: avail.filter((l) => l.scope === 'company'),
      dept: avail.filter((l) => l.scope === 'dept'),
      self: avail.filter((l) => l.scope === 'self'),
    }
  }, [myLibs, refLibIds])
  const addableTotal = addable.company.length + addable.dept.length + addable.self.length

  // ---------- 操作（除删除外无二次确认） ----------
  const removeRef = (row) => {
    onChange({ ...agent, knowledge_libraries: refs.filter((r) => r.library_id !== row.key) })
    message.success(`已移除「${row.lib?.name || row.key}」`)
  }

  const confirmAdd = () => {
    const chosen = Object.entries(addState).filter(([, v]) => v.checked)
    if (!chosen.length) { message.warning('请至少选择 1 个知识库'); return }
    for (const [libId, v] of chosen) {
      if (v.mode === 'custom' && (!v.groupIds || v.groupIds.length === 0)) {
        const lib = allLibs.find((l) => l.id === libId)
        message.warning(`「${lib?.name || libId}」选了「指定分组」，请至少勾选 1 个分组`)
        return
      }
    }
    const added = chosen.map(([libId, v]) => ({ library_id: libId, groups: v.mode === 'custom' ? v.groupIds : 'all' }))
    onChange({ ...agent, knowledge_libraries: [...refs, ...added] })
    message.success(`已添加 ${chosen.length} 个知识库`)
    setAddOpen(false)
    setAddState({})
  }

  const openScopeEdit = (r) => setScopeEdit({
    library_id: r.library_id,
    mode: r.groups === 'all' ? 'all' : 'custom',
    groupIds: Array.isArray(r.groups) ? r.groups : [],
  })
  const saveScopeEdit = () => {
    const { library_id, mode, groupIds } = scopeEdit
    if (mode === 'custom' && groupIds.length === 0) {
      message.warning('请至少选择 1 个分组，或改选「全部分组」')
      return
    }
    const groups = mode === 'all' ? 'all' : groupIds
    onChange({ ...agent, knowledge_libraries: refs.map((r) => (r.library_id === library_id ? { ...r, groups } : r)) })
    message.success('已更新引用范围')
    setScopeEdit(null)
  }

  const editLib = scopeEdit ? allLibs.find((l) => l.id === scopeEdit.library_id) : null
  const editTops = scopeEdit ? libTopGroups(scopeEdit.library_id) : []

  // ---------- 新增弹窗分区渲染（每个库可直接选 全部/指定分组） ----------
  const renderAddSection = (title, libs) => (libs.length ? (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, color: 'var(--gb-text-muted)', margin: '0 0 8px' }}>{title}</div>
      {libs.map((l) => {
        const st = addState[l.id] || { checked: false, mode: 'all', groupIds: [] }
        const tops = libTopGroups(l.id)
        return (
          <div key={l.id} style={{ border: '1px solid var(--gb-border-light)', borderRadius: 8, marginBottom: 8, overflow: 'hidden' }}>
            <div style={{ padding: '10px 12px', background: st.checked ? 'var(--gb-bg-secondary)' : 'transparent' }}>
              <Checkbox checked={st.checked} onChange={(e) => setLib(l.id, { checked: e.target.checked })} style={{ width: '100%' }}>
                <Space size={10} align="center">
                  <BookOutlined style={{ color: scopeMeta(l.scope).color, fontSize: 18 }} />
                  <div>
                    <div style={{ fontWeight: 500 }}>{l.name} <ScopeTag scope={l.scope} size="sm" /></div>
                    <div style={{ fontSize: 11, color: 'var(--gb-text-muted)' }}>归属 {ownerText(l)} · {libLive(l.id)} 条生效中</div>
                  </div>
                </Space>
              </Checkbox>
            </div>
            {st.checked && (
              <div style={{ padding: '8px 12px 12px 40px', borderTop: '1px dashed var(--gb-border-light)' }}>
                <Radio.Group
                  value={st.mode}
                  onChange={(e) => setLib(l.id, { mode: e.target.value })}
                  size="small"
                  style={{ marginBottom: st.mode === 'custom' ? 8 : 0 }}
                >
                  <Radio value="all">全部分组</Radio>
                  <Radio value="custom">指定分组</Radio>
                </Radio.Group>
                {st.mode === 'custom' && (
                  tops.length ? (
                    <Checkbox.Group value={st.groupIds} onChange={(ids) => setLib(l.id, { groupIds: ids })} style={{ width: '100%' }}>
                      <div style={{ border: '1px solid var(--gb-border-light)', borderRadius: 6, padding: 4 }}>
                        {tops.map((top) => (
                          <div key={top.id} style={{ padding: '2px 4px' }}>
                            <Checkbox value={top.id}>
                              <span style={{ fontWeight: 500 }}>{top.name}</span>
                              <span style={{ fontSize: 11, color: 'var(--gb-text-muted)', marginLeft: 6 }}>{liveCountForGroup(top.id)} 条</span>
                            </Checkbox>
                            {(top.children || []).map((sub) => (
                              <div key={sub.id} style={{ padding: '2px 4px 2px 28px' }}>
                                <Checkbox value={sub.id}>
                                  <span style={{ color: 'var(--gb-text-muted)' }}>└ </span>{sub.name}
                                  <span style={{ fontSize: 11, color: 'var(--gb-text-muted)', marginLeft: 6 }}>{liveCountForGroup(sub.id)} 条</span>
                                </Checkbox>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </Checkbox.Group>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--gb-text-muted)' }}>该库暂无分组，将引用全部。</div>
                  )
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  ) : null)

  return (
    <>
      <section className="gb-agent-section">
        <div className="gb-agent-section-head">
          <h3 className="gb-agent-section-title">
            <ReadOutlined style={{ marginRight: 6 }} />
            知识库引用
            <Tag style={{ marginLeft: 8 }} color="blue">{refs.length} 个知识库</Tag>
          </h3>
          <Space>
            <Button icon={<ExportOutlined />} onClick={() => navigate('/knowledge')}>打开知识库</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setAddState({}); setAddOpen(true) }}>
              新增引用
            </Button>
          </Space>
        </div>

        {refs.length === 0 ? (
          <Empty
            description={<span>尚未引用任何知识库，<a onClick={() => { setAddState({}); setAddOpen(true) }}>立即添加</a></span>}
            style={{ padding: '60px 0' }}
          />
        ) : (
          <Table
            dataSource={linkedRows}
            rowKey="key"
            pagination={false}
            size="middle"
            columns={[
              {
                title: '知识库',
                key: 'lib',
                render: (_, row) => (
                  <Space align="center">
                    <BookOutlined style={{ color: scopeMeta(row.lib?.scope).color, fontSize: 18 }} />
                    <div>
                      <div style={{ fontWeight: 500 }}>{row.lib?.name || '（库已删除或无权限）'}</div>
                      <div style={{ fontSize: 11, color: 'var(--gb-text-muted)' }}>
                        <ScopeTag scope={row.lib?.scope} size="sm" /> · 归属 {ownerText(row.lib)}
                      </div>
                    </div>
                  </Space>
                ),
              },
              {
                title: '引用范围',
                key: 'range',
                width: 220,
                render: (_, row) => {
                  const g = row.ref.groups
                  if (g === 'all') {
                    return (
                      <Space>
                        <Tag color="green" style={{ margin: 0 }}>全部分组</Tag>
                        <Button type="link" size="small" onClick={() => openScopeEdit(row.ref)}>调整</Button>
                      </Space>
                    )
                  }
                  const list = (
                    <div style={{ maxWidth: 260 }}>
                      {g.map((id) => (
                        <div key={id} style={{ fontSize: 12, padding: '2px 0' }}>
                          <FolderOpenOutlined style={{ color: 'var(--gb-text-muted)', marginRight: 6 }} />
                          {GROUP_PATH[id] || id}
                        </div>
                      ))}
                    </div>
                  )
                  return (
                    <Space>
                      <Popover content={list} title="指定分组" trigger="hover" placement="top">
                        <Tag color="blue" style={{ margin: 0, cursor: 'pointer' }}>指定 {g.length} 个分组</Tag>
                      </Popover>
                      <Button type="link" size="small" onClick={() => openScopeEdit(row.ref)}>调整</Button>
                    </Space>
                  )
                },
              },
              {
                title: '生效中条目',
                dataIndex: 'liveCount',
                width: 120,
                align: 'right',
                sorter: (a, b) => a.liveCount - b.liveCount,
                render: (v) => (
                  <span>
                    <span className="gb-mono" style={{ fontWeight: 500 }}>{v}</span>
                    <span style={{ color: 'var(--gb-text-muted)', marginLeft: 4, fontSize: 12 }}>条</span>
                  </span>
                ),
              },
              {
                title: '累计命中',
                dataIndex: 'hitSum',
                width: 120,
                align: 'right',
                sorter: (a, b) => a.hitSum - b.hitSum,
                render: (v) => <span className="gb-mono" style={{ fontSize: 12, color: 'var(--gb-text-muted)' }}>{v.toLocaleString()}</span>,
              },
              {
                title: '最近更新',
                dataIndex: 'latest',
                width: 160,
                render: (v) => <span className="gb-mono" style={{ fontSize: 12, color: 'var(--gb-text-muted)' }}>{v}</span>,
              },
              {
                title: '操作',
                key: 'action',
                width: 90,
                render: (_, row) => (
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => removeRef(row)}>
                    移除
                  </Button>
                ),
              },
            ]}
          />
        )}
      </section>

      {/* ============ 新增引用（选库 + 库内可直接选「全部 / 指定分组」） ============ */}
      <Modal
        title="新增引用知识库"
        open={addOpen}
        onCancel={() => { setAddOpen(false); setAddState({}) }}
        onOk={confirmAdd}
        okText={`确认添加（已选 ${addCount}）`}
        cancelText="取消"
        width={640}
      >
        {addableTotal === 0 ? (
          <Empty description="已引用全部可见知识库" style={{ padding: '40px 0' }} />
        ) : (
          <div style={{ maxHeight: 460, overflow: 'auto', paddingRight: 4 }}>
            {renderAddSection('企业级', addable.company)}
            {renderAddSection('部门级', addable.dept)}
            {renderAddSection('个人级', addable.self)}
          </div>
        )}
        <div style={{ fontSize: 12, color: 'var(--gb-text-muted)', marginTop: 4 }}>
          仅列出当前可见的知识库；勾选库后可直接选「全部分组」或「指定分组」，添加后也能在列表里再「调整」。
        </div>
      </Modal>

      {/* ============ 调整引用范围（库内：全部 / 指定分组） ============ */}
      <Modal
        title={`调整引用范围 · ${editLib?.name || ''}`}
        open={!!scopeEdit}
        onCancel={() => setScopeEdit(null)}
        onOk={saveScopeEdit}
        okText="保存"
        cancelText="取消"
        width={560}
      >
        {scopeEdit && (
          <>
            <Radio.Group
              value={scopeEdit.mode}
              onChange={(e) => setScopeEdit((s) => ({ ...s, mode: e.target.value }))}
              style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 6 }}
            >
              <Radio value="all">全部分组<span style={{ color: 'var(--gb-text-muted)', fontSize: 12, marginLeft: 6 }}>（库内新增分组自动纳入）</span></Radio>
              <Radio value="custom">指定分组</Radio>
            </Radio.Group>

            {scopeEdit.mode === 'custom' && (
              editTops.length ? (
                <Checkbox.Group
                  value={scopeEdit.groupIds}
                  onChange={(ids) => setScopeEdit((s) => ({ ...s, groupIds: ids }))}
                  style={{ width: '100%' }}
                >
                  <div style={{ maxHeight: 340, overflow: 'auto', border: '1px solid var(--gb-border-light)', borderRadius: 6, padding: 4 }}>
                    {editTops.map((top) => (
                      <div key={top.id} style={{ borderBottom: '1px dashed var(--gb-border-light)', padding: '8px 4px' }}>
                        <div style={{ padding: '6px 8px' }}>
                          <Checkbox value={top.id}>
                            <Space>
                              <BookOutlined style={{ color: 'var(--gb-primary)' }} />
                              <span style={{ fontWeight: 500 }}>{top.name}</span>
                              <Tag color="blue" style={{ marginLeft: 4 }}>一级</Tag>
                              <span style={{ fontSize: 12, color: 'var(--gb-text-muted)' }}>{liveCountForGroup(top.id)} 条生效中</span>
                            </Space>
                          </Checkbox>
                        </div>
                        {(top.children || []).map((sub) => (
                          <div key={sub.id} style={{ padding: '4px 8px 4px 32px' }}>
                            <Checkbox value={sub.id}>
                              <Space>
                                <span style={{ color: 'var(--gb-text-muted)' }}>└</span>
                                <span>{sub.name}</span>
                                <span style={{ fontSize: 12, color: 'var(--gb-text-muted)' }}>· {liveCountForGroup(sub.id)} 条</span>
                              </Space>
                            </Checkbox>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </Checkbox.Group>
              ) : (
                <Empty description="该库暂无分组，仅支持「全部分组」" style={{ padding: '24px 0' }} />
              )
            )}
          </>
        )}
      </Modal>
    </>
  )
}
