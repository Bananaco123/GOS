import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Button, Input, Select, Table, Tag, Space, Avatar, Drawer, Form, App, Empty,
  Tooltip, Result, Divider, Dropdown,
} from 'antd'
import {
  SearchOutlined, PlusOutlined, EditOutlined, FolderOutlined, FileTextOutlined,
  ThunderboltOutlined, BulbOutlined, AppstoreOutlined, MenuFoldOutlined,
  MenuUnfoldOutlined, CloudUploadOutlined, RobotOutlined,
} from '@ant-design/icons'

import { useAuth } from '../../auth/AuthContext'
import { store } from '../../mock/store'
import { libraryById } from '../../mock/library'
import { KB_GROUPS_FLAT, KB_TAGS, KB_KINDS, kindMeta, DOC_FORMATS } from '../../mock/knowledge'
import { deptName, userById } from '../../mock/org'
import { entryRefAgents, groupAncestors } from '../../utils/kbRefs'
import { KindTag, StatusBadge } from './kbShared'
import DocExtractModal from './DocExtractModal'
import ExcelImportModal from './ExcelImportModal'
import './knowledge.css'

const nowStamp = () => new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-').slice(0, 16)

function visibleScopeText(lib) {
  if (!lib) return ''
  if (lib.scope === 'company') return '全公司'
  if (lib.scope === 'dept') return deptName(lib.owner_dept_id)
  if (lib.scope === 'self') return userById(lib.owner_user_id)?.name || '本人'
  return ''
}

export default function LibraryDetail() {
  const { libraryId } = useParams()
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const { user, hasPerm } = useAuth()

  const canManage = hasPerm('knowledge.manage')
  const canCreate = hasPerm('knowledge.create')
  const canEdit = hasPerm('knowledge.edit')
  const canDelete = hasPerm('knowledge.delete')

  const lib = useMemo(() => libraryById(libraryId, store.getKbLibraries()), [libraryId])
  const agents = useMemo(() => store.getAgents(), [])

  const [allEntries, setAllEntries] = useState(() => store.getKbEntries())
  const writeEntries = (next) => { setAllEntries(next); store.setKbEntries(next) }

  const libEntries = useMemo(() => allEntries.filter((e) => e.library_id === libraryId), [allEntries, libraryId])
  // 本库分组：优先取归属本库的分组；复制库等无归属分组时，按条目实际用到的分组（含祖先）推导
  const libGroups = useMemo(() => {
    const owned = KB_GROUPS_FLAT.filter((g) => g.library_id === libraryId)
    if (owned.length) return owned
    const ids = new Set()
    libEntries.forEach((e) => groupAncestors(e.group_id).forEach((g) => ids.add(g)))
    return KB_GROUPS_FLAT.filter((g) => ids.has(g.id))
  }, [libraryId, libEntries])
  const liveList = useMemo(() => libEntries.filter((e) => e.status !== 'offline'), [libEntries])

  const [groupFilter, setGroupFilter] = useState(null)
  const [kindFilter, setKindFilter] = useState(null)
  const [statusFilter, setStatusFilter] = useState(null)
  const [search, setSearch] = useState('')
  const [groupsCollapsed, setGroupsCollapsed] = useState(false)
  const [selectedKeys, setSelectedKeys] = useState([])

  const filtered = useMemo(() => liveList.filter((e) => {
    if (groupFilter && e.group_id !== groupFilter) return false
    if (kindFilter && e.kind !== kindFilter) return false
    if (statusFilter === 'live' && !(e.status === 'published' && !e.pending)) return false
    if (statusFilter === 'pending' && !e.pending) return false
    if (search && !e.title.toLowerCase().includes(search.toLowerCase()) && !e.summary?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [liveList, groupFilter, kindFilter, statusFilter, search])

  const [viewEntry, setViewEntry] = useState(null)
  const [editEntry, setEditEntry] = useState(null)
  const [createKind, setCreateKind] = useState(null)
  const [extractOpen, setExtractOpen] = useState(false)
  const [excelOpen, setExcelOpen] = useState(false)
  const [form] = Form.useForm()

  if (!lib) {
    return <div className="gb-kb-page"><Result status="404" title="库不存在或无权访问" extra={<Button type="primary" onClick={() => navigate('/knowledge')}>返回知识库</Button>} /></div>
  }

  // ---------- 表单 ----------
  const openCreate = (kind) => { setCreateKind(kind); form.resetFields(); form.setFieldsValue({ kind, group_id: libGroups[0]?.id, similar_questions: [] }) }
  const openEdit = (entry) => { setEditEntry(entry); form.resetFields(); form.setFieldsValue(entry) }
  const closeForm = () => { setEditEntry(null); setCreateKind(null); form.resetFields() }

  const handleSubmit = async (publish) => {
    let v
    try { v = await form.validateFields() } catch { return }
    if (editEntry) {
      writeEntries(allEntries.map((e) => e.id === editEntry.id
        ? { ...e, ...v, status: publish ? 'published' : e.status, pending: !publish, updated_at: nowStamp(), contributor: user?.name || e.contributor, contributor_avatar: user?.avatar || e.contributor_avatar }
        : e))
      message.success(publish ? '已保存并发布，知识已生效' : '已保存（待发布）')
    } else {
      const newEntry = {
        id: `ke-new-${Date.now()}`, kind: createKind, ...v,
        library_id: libraryId, status: publish ? 'published' : 'draft', pending: !publish,
        used_count: 0, contributor: user?.name || '—', contributor_avatar: user?.avatar || '—', updated_at: nowStamp(),
      }
      writeEntries([newEntry, ...allEntries])
      message.success(publish ? '已新建并发布，知识已生效' : '已新建（待发布）')
    }
    closeForm()
  }

  // ---------- 单条操作（除删除外无二次确认） ----------
  // 发布 = 生效中（绝不隐藏内容）；下线 = 转待发布（取消生效，可编辑或再次发布）。两者互为开关。
  const publishOne = (entry) => {
    writeEntries(allEntries.map((e) => (e.id === entry.id && e.pending ? { ...e, status: 'published', pending: false } : e)))
    message.success('已发布，知识已生效')
  }
  const offlineMark = (entry) => {
    writeEntries(allEntries.map((e) => e.id === entry.id ? { ...e, pending: true, updated_at: nowStamp() } : e))
    message.success('已下线，转为待发布')
  }
  const removeOne = (entry) => {
    modal.confirm({ title: `删除「${entry.title}」？`, content: '删除后不可恢复。', okText: '删除', okButtonProps: { danger: true }, onOk: () => { writeEntries(allEntries.filter((e) => e.id !== entry.id)); message.success('已删除') } })
  }

  // ---------- 批量 ----------
  const selectedSet = new Set(selectedKeys)
  const batchPublish = () => {
    writeEntries(allEntries.map((e) => (selectedSet.has(e.id) && e.pending ? { ...e, status: 'published', pending: false } : e)))
    message.success('已批量发布')
    setSelectedKeys([])
  }
  const batchOffline = () => {
    writeEntries(allEntries.map((e) => (selectedSet.has(e.id) && e.status === 'published' && !e.pending ? { ...e, pending: true, updated_at: nowStamp() } : e)))
    message.success('已批量下线')
    setSelectedKeys([])
  }
  const batchDelete = () => {
    modal.confirm({ title: `删除选中的 ${selectedKeys.length} 条？`, okText: '删除', okButtonProps: { danger: true }, onOk: () => { writeEntries(allEntries.filter((e) => !selectedSet.has(e.id))); message.success('已删除'); setSelectedKeys([]) } })
  }

  const saveBatchQa = (qaList, groupId) => {
    const news = qaList.map((qa, i) => ({
      id: `ke-batch-${Date.now()}-${i}`, kind: 'qa', title: qa.q, content: qa.a,
      similar_questions: qa.sims || [], summary: qa.a.slice(0, 60), group_id: groupId,
      library_id: libraryId, status: 'draft', pending: true,
      used_count: 0, contributor: user?.name || '—', contributor_avatar: user?.avatar || '—', updated_at: nowStamp(),
    }))
    writeEntries([...news, ...allEntries])
  }

  // ---------- 库级操作 ----------
  const deleteLib = () => {
    modal.confirm({
      title: `删除知识库「${lib.name}」？`,
      content: '将同时删除该库内全部知识条目，删除后不可恢复。',
      okText: '删除', okButtonProps: { danger: true },
      onOk: () => {
        store.deleteKbLibrary(libraryId)
        store.setKbEntries(store.getKbEntries().filter((e) => e.library_id !== libraryId))
        message.success('知识库已删除')
        navigate('/knowledge')
      },
    })
  }
  const copyLib = () => {
    const newId = `lib-copy-${Date.now()}`
    const newLib = {
      ...lib, id: newId, name: `${lib.name}（副本）`,
      created_by: user?.name || lib.created_by, created_by_avatar: user?.avatar || lib.created_by_avatar, created_at: nowStamp(),
      updated_by: user?.name || lib.updated_by, updated_by_avatar: user?.avatar || lib.updated_by_avatar, updated_at: nowStamp(),
      total_recall: 0,
    }
    store.createKbLibrary(newLib)
    const copies = allEntries.filter((e) => e.library_id === libraryId).map((e, i) => ({ ...e, id: `${e.id}-copy-${Date.now()}-${i}`, library_id: newId }))
    store.setKbEntries([...copies, ...store.getKbEntries()])
    message.success(`已复制为「${newLib.name}」`)
    navigate(`/knowledge/lib/${newId}`)
  }

  // ---------- 表格列 ----------
  const columns = [
    {
      title: '知识点', key: 'title',
      render: (_, r) => (
        <div>
          <a onClick={() => setViewEntry(r)} style={{ fontWeight: 500, fontSize: 13 }}>{r.title}</a>
          <div style={{ marginTop: 4, fontSize: 12, color: 'var(--gb-text-muted)', maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.summary}</div>
        </div>
      ),
    },
    { title: '类型', dataIndex: 'kind', width: 108, render: (v) => <KindTag kind={v} /> },
    { title: '分组', dataIndex: 'group_id', width: 148, render: (v) => <span style={{ fontSize: 12, color: 'var(--gb-text-secondary)' }}>{KB_GROUPS_FLAT.find((g) => g.id === v)?.path || v}</span> },
    { title: '状态', key: 'status', width: 100, render: (_, r) => <StatusBadge status={r.status} pending={r.pending} /> },
    { title: '命中次数', dataIndex: 'used_count', width: 96, align: 'right', sorter: (a, b) => a.used_count - b.used_count, render: (v) => <span className="gb-mono" style={{ fontSize: 12 }}>{v.toLocaleString()}</span> },
    {
      title: '上次更新', key: 'contributor', width: 158,
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Avatar size={20} style={{ background: 'var(--gb-primary-light)', fontSize: 10 }}>{r.contributor_avatar}</Avatar>
          <div><div style={{ fontSize: 12 }}>{r.contributor}</div><div style={{ fontSize: 11, color: 'var(--gb-text-muted)' }}>{r.updated_at}</div></div>
        </div>
      ),
    },
    {
      title: '操作', key: 'action', width: 200, fixed: 'right',
      render: (_, r) => (
        <Space size={2}>
          {r.pending
            ? <Button type="link" size="small" disabled={!canManage} onClick={() => publishOne(r)}>发布</Button>
            : <Button type="link" size="small" disabled={!canEdit} onClick={() => offlineMark(r)}>下线</Button>}
          <Button type="link" size="small" onClick={() => setViewEntry(r)}>查看</Button>
          <Button type="link" size="small" disabled={!canEdit || !r.pending} onClick={() => openEdit(r)}>编辑</Button>
          <Button type="link" size="small" danger disabled={!canDelete} onClick={() => removeOne(r)}>删除</Button>
        </Space>
      ),
    },
  ]

  // ---------- 表单内容 ----------
  const formKind = editEntry ? editEntry.kind : createKind
  const entryForm = (
    <Form form={form} layout="vertical">
      <Form.Item name="kind" hidden><Input /></Form.Item>
      {formKind === 'qa' ? (
        <>
          <Form.Item name="title" label="知识点" rules={[{ required: true, message: '请输入知识点' }]}>
            <Input maxLength={80} showCount placeholder="如：加拿大到货时间多久？" />
          </Form.Item>
          <Form.Item name="group_id" label="所属分组" rules={[{ required: true, message: '请选择分组' }]}>
            <Select showSearch optionFilterProp="label" options={libGroups.map((g) => ({ value: g.id, label: g.path }))} placeholder="一个知识点只能归属一个分组" />
          </Form.Item>
          <Form.Item name="similar_questions" label="相似问" tooltip="非必填。同一知识点的不同问法">
            <Select mode="tags" placeholder="输入后回车，可加多个相似问法" tokenSeparators={[',', '，']} />
          </Form.Item>
          <Form.Item name="content" label="回复策略" rules={[{ required: true, message: '请输入回复策略' }]}>
            <Input.TextArea rows={6} placeholder="AI 命中该知识点后回复客户的内容 / 话术策略" />
          </Form.Item>
        </>
      ) : (
        <>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input maxLength={80} showCount placeholder="如：现代风厨柜 2026 春季新品" />
          </Form.Item>
          <Form.Item name="group_id" label="所属分组" rules={[{ required: true, message: '请选择分组' }]}>
            <Select showSearch optionFilterProp="label" options={libGroups.map((g) => ({ value: g.id, label: g.path }))} placeholder="一个知识点只能归属一个分组" />
          </Form.Item>
          <Form.Item label="附件" required>
            <div className="gb-kb-extract-drop" onClick={() => { form.setFieldsValue({ file_url: 'uploaded-file.pdf', file_size: '3.2 MB' }); message.info('演示态：已载入示例附件') }}>
              <CloudUploadOutlined style={{ fontSize: 24, color: 'var(--gb-primary)' }} />
              <div>点击或拖拽上传 PDF / Word / Excel / 图片 / 视频</div>
              <Form.Item name="file_url" noStyle><Input type="hidden" /></Form.Item>
            </div>
          </Form.Item>
          <Form.Item
            name="summary"
            label={<Space>摘要<Button size="small" type="link" icon={<BulbOutlined />} onClick={() => { form.setFieldsValue({ summary: 'AI 自动生成：本文件包含产品规格、价格区间与适用场景，供命中时做语义匹配。' }); message.success('已 AI 自动生成摘要，可继续编辑') }}>AI 自动生成</Button></Space>}
            rules={[{ required: true, message: '文档类的摘要必填（命中按摘要匹配）' }]}
          >
            <Input.TextArea rows={3} maxLength={200} showCount placeholder="附件本体不解析，命中主要按摘要做语义匹配——请填写高质量摘要" />
          </Form.Item>
        </>
      )}
    </Form>
  )

  return (
    <div className="gb-kb-page">
      {/* 库头 */}
      <div className="gb-kb-lib-detail-head">
        <div className="gb-kb-lib-detail-headrow">
          <Space size={12} align="center">
            <div className="gb-kb-lib-detail-icon" style={{ background: `${lib.color}16`, color: lib.color }}><FolderOutlined /></div>
            <div>
              <div className="gb-kb-lib-detail-name">{lib.name}</div>
              <div className="gb-kb-lib-detail-desc">可见范围：{visibleScopeText(lib)}</div>
            </div>
          </Space>
          {canManage && (
            <Space>
              <Button danger onClick={deleteLib}>删除</Button>
              <Button onClick={copyLib}>复制</Button>
            </Space>
          )}
        </div>
      </div>

      {/* 主体 */}
      <div className="gb-kb-lib-detail-body" style={{ gridTemplateColumns: groupsCollapsed ? '1fr' : '220px 1fr' }}>
        {!groupsCollapsed && (
          <div className="gb-kb-lib-groups">
            <div className="gb-kb-lib-groups-title">
              <span>库内分组</span>
              <Tooltip title="收起分组"><Button type="text" size="small" icon={<MenuFoldOutlined />} onClick={() => setGroupsCollapsed(true)} /></Tooltip>
            </div>
            <div className={`gb-kb-group-item ${!groupFilter ? 'is-active' : ''}`} onClick={() => setGroupFilter(null)}>
              <AppstoreOutlined /> 全部条目 <span className="gb-kb-group-count">{liveList.length}</span>
            </div>
            {libGroups.filter((g) => g.level === 1).map((top) => {
              const subs = libGroups.filter((g) => g.parent_id === top.id)
              const topCount = liveList.filter((e) => e.group_id === top.id).length
              return (
                <div key={top.id}>
                  <div className={`gb-kb-group-item ${groupFilter === top.id ? 'is-active' : ''}`} onClick={() => setGroupFilter(top.id)}>
                    <FolderOutlined /> {top.name} <span className="gb-kb-group-count">{topCount}</span>
                  </div>
                  {subs.map((sub) => {
                    const c = liveList.filter((e) => e.group_id === sub.id).length
                    return (
                      <div key={sub.id} className={`gb-kb-group-item is-sub ${groupFilter === sub.id ? 'is-active' : ''}`} onClick={() => setGroupFilter(sub.id)}>
                        <span style={{ color: 'var(--gb-text-muted)' }}>└</span> {sub.name} <span className="gb-kb-group-count">{c}</span>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}

        <div className="gb-kb-lib-entries">
          <div className="gb-kb-toolbar">
            {groupsCollapsed && <Tooltip title="展开分组"><Button icon={<MenuUnfoldOutlined />} onClick={() => setGroupsCollapsed(false)} /></Tooltip>}
            <Input prefix={<SearchOutlined />} placeholder="搜索知识点 / 摘要" value={search} onChange={(e) => setSearch(e.target.value)} allowClear style={{ width: 220 }} />
            <Select placeholder="类型" allowClear value={kindFilter} onChange={setKindFilter} style={{ width: 130 }} options={KB_KINDS.map((k) => ({ value: k.id, label: k.name }))} />
            <Select placeholder="状态" allowClear value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }} options={[{ value: 'live', label: '生效中' }, { value: 'pending', label: '待发布' }]} />
            <div style={{ flex: 1 }} />
            {canCreate && (
              <Space>
                <Button icon={<ThunderboltOutlined />} onClick={() => setExtractOpen(true)}>文档提取</Button>
                <Button icon={<CloudUploadOutlined />} onClick={() => setExcelOpen(true)}>Excel 导入</Button>
                <Dropdown
                  trigger={['click']}
                  menu={{ items: [
                    { key: 'qa', label: <KindTag kind="qa" solid /> },
                    { key: 'doc', label: <KindTag kind="doc" solid /> },
                  ], onClick: ({ key }) => openCreate(key) }}
                >
                  <Button type="primary" icon={<PlusOutlined />}>新建条目</Button>
                </Dropdown>
              </Space>
            )}
          </div>

          {selectedKeys.length > 0 && (
            <div className="gb-kb-batch-bar">
              <span>已选 <strong>{selectedKeys.length}</strong> 项</span>
              <Space>
                {canEdit && <Button size="small" onClick={batchOffline}>批量下线</Button>}
                {canManage && <Button size="small" onClick={batchPublish}>批量发布</Button>}
                {canDelete && <Button size="small" danger onClick={batchDelete}>批量删除</Button>}
                <Button size="small" type="text" onClick={() => setSelectedKeys([])}>取消选择</Button>
              </Space>
            </div>
          )}

          <div className="gb-kb-table-wrap">
            <Table
              columns={columns}
              dataSource={filtered}
              rowKey="id"
              size="middle"
              scroll={{ x: 1080 }}
              rowSelection={{ selectedRowKeys: selectedKeys, onChange: setSelectedKeys }}
              pagination={{ pageSize: 8, showTotal: (n) => `共 ${n} 条` }}
              locale={{ emptyText: <Empty description={canCreate ? '该分组暂无条目，可新建 / 提取 / 导入' : '暂无条目'} /> }}
            />
          </div>
        </div>
      </div>

      {/* 查看抽屉（已发布不可直接编辑） */}
      <Drawer
        title={viewEntry?.title} open={!!viewEntry} onClose={() => setViewEntry(null)} width={620}
        extra={canEdit && viewEntry?.pending && <Button icon={<EditOutlined />} onClick={() => { openEdit(viewEntry); setViewEntry(null) }}>编辑</Button>}
      >
        {viewEntry && (
          <>
            <Space wrap style={{ marginBottom: 16 }}>
              <KindTag kind={viewEntry.kind} />
              <StatusBadge status={viewEntry.status} pending={viewEntry.pending} />
              {viewEntry.tags?.map((tid) => { const t = KB_TAGS.find((x) => x.id === tid); return <Tag key={tid} color={t?.color}>{t?.name}</Tag> })}
            </Space>
            <div style={{ fontSize: 13, color: 'var(--gb-text-secondary)', marginBottom: 12, lineHeight: 1.9 }}>
              <FolderOutlined /> 分组：{KB_GROUPS_FLAT.find((g) => g.id === viewEntry.group_id)?.path}<br />
              <RobotOutlined /> 被 {entryRefAgents(viewEntry, agents).length} 个 Agent 引用 · <ThunderboltOutlined /> 累计命中 {viewEntry.used_count.toLocaleString()} 次<br />
              <Avatar size={16} style={{ background: 'var(--gb-primary-light)', fontSize: 9, marginRight: 4 }}>{viewEntry.contributor_avatar}</Avatar>
              {viewEntry.contributor} · {viewEntry.updated_at}
            </div>
            {viewEntry.kind === 'qa' && viewEntry.similar_questions?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--gb-text-muted)' }}>相似问：</span>
                {viewEntry.similar_questions.map((s, i) => <Tag key={i} style={{ fontSize: 11 }}>{s}</Tag>)}
              </div>
            )}
            {!viewEntry.pending && canEdit && (
              <div style={{ fontSize: 12, color: 'var(--gb-text-muted)', marginBottom: 8 }}>已发布知识需先「下线」后才能编辑。</div>
            )}
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ fontSize: 12, color: 'var(--gb-text-muted)', marginBottom: 6 }}>{viewEntry.kind === 'qa' ? '回复策略' : '摘要 / 内容'}</div>
            <div style={{ fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-wrap', padding: 16, background: 'var(--gb-bg-secondary)', borderRadius: 8 }}>{viewEntry.content}</div>
            {viewEntry.file_url && (
              <div style={{ marginTop: 16, padding: 12, background: '#F0F4F8', borderRadius: 8, fontSize: 13 }}>
                <FileTextOutlined style={{ marginRight: 8 }} />附件：{viewEntry.file_url}{viewEntry.file_size ? ` · ${viewEntry.file_size}` : ''}
                {viewEntry.doc_format && <Tag color={DOC_FORMATS[viewEntry.doc_format]?.color} style={{ marginLeft: 8 }}>{DOC_FORMATS[viewEntry.doc_format]?.label}</Tag>}
              </div>
            )}
          </>
        )}
      </Drawer>

      {/* 新建/编辑抽屉：按钮右下角，三并列 */}
      <Drawer
        title={editEntry ? '编辑条目' : `新建条目 · ${kindMeta(createKind)?.name || ''}`}
        open={!!editEntry || !!createKind} onClose={closeForm} width={620}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={closeForm}>取消</Button>
            <Button onClick={() => handleSubmit(false)}>保存</Button>
            <Button type="primary" onClick={() => handleSubmit(true)}>保存并发布</Button>
          </div>
        }
      >
        {entryForm}
      </Drawer>

      <DocExtractModal open={extractOpen} onClose={() => setExtractOpen(false)} groups={libGroups} onSave={saveBatchQa} user={user} />
      <ExcelImportModal open={excelOpen} onClose={() => setExcelOpen(false)} groups={libGroups} onSave={saveBatchQa} />
    </div>
  )
}
