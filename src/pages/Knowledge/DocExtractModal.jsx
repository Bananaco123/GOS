/**
 * 文档提取弹窗（v9 · 见「关键逻辑.md §2.13.5」）
 *   输入（粘贴文本 / 上传文档 / 图片OCR）→ AI 解析问答对 → 逐条编辑/删除
 *   → 可「追加提取」增量补充、可调本批对数 → 选库内分组 → 保存为草稿
 *
 * 演示态：解析为前端 mock（真实实现由 SCRM 编排、抽取调外部 AI，见关键逻辑 §2.13.5）。
 */
import { useState } from 'react'
import {
  Modal, Tabs, Input, InputNumber, Button, Select, App, Space, Spin, Tag,
} from 'antd'
import {
  FileTextOutlined, CloudUploadOutlined, PictureOutlined, DeleteOutlined,
  PlusOutlined, ThunderboltOutlined, RobotOutlined,
} from '@ant-design/icons'

// 解析素材池（家居供应链海外销售 SOP 问答）
const QA_POOL = [
  { q: '初次联系时，如何向客户介绍自己和公司背景？', a: '您好，非常高兴通过我的同事获得您的联系方式。我是来自 OK Group 的项目经理 [您的名字]，将全程对接您的需求。' },
  { q: '如何询问客户的项目是家庭还是商业用途？', a: '想问下您，这是为自己家采购，还是商业用途呢？比如用于办公室、公寓、酒店或转售项目等。' },
  { q: '前端同事移交客户后，项目经理如何承接对话？', a: '您好 [客户名]，很高兴从我的同事那里获得您的联系方式。我是 OK Group 的项目经理，将作为您的专属对接人。' },
  { q: '客户已读不回，应如何展示公司实力以打破僵局？', a: '我们的建筑材料已出口到全球 150 多个国家和地区，无论您是家庭装修还是商业空间打造，我们都能支持。' },
  { q: '我们具体提供哪些品类的产品？', a: '产品涵盖 15000 多种单品，包括：橱柜、衣柜、门窗、地板、墙板、家具、照明、天然石材、电器、洁具、瓷砖、金属、玻璃制品等。' },
  { q: '客户需要从头到尾的全套家具（A-Z），该如何回应？', a: '那我们正是您要找的供应商。我们能提供全屋一站式定制解决方案，做您可靠的合作伙伴。' },
  { q: '如何引导客户通过 WhatsApp 接收产品目录？', a: '如果方便的话，我通过 WhatsApp 给您发送一些感兴趣品类的产品目录吗？您可以随时截图喜欢的款式发给我。' },
  { q: '发送综合画册后，如何跟进客户的反馈？', a: '请查看我们的综合画册，这能帮助您大致了解我们能为您提供什么。请问画册中有引起您注意的产品吗？' },
  { q: '针对特定品类发送目录后，如何促进客户互动？', a: '我先与您分享 [具体品类] 的目录。请随意浏览，如果喜欢任何物品，截图发我即可进一步讨论细节。' },
  { q: '如果客户对全案定制感兴趣，我们有哪些核心优势？', a: '我们专注于全屋一站式解决方案，拥有 13 个产品部门的专业团队，能供应并定制所有类型的 fixtures 和 furniture。' },
  { q: '客户询问最小起订量（MOQ）该怎么回答？', a: '我们支持灵活起订，小批量样板与整柜均可；具体 MOQ 取决于品类，我会为您匹配最优方案。' },
  { q: '客户担心海运周期太久，如何安抚？', a: '标准海运为 6-8 周，紧急订单可空运补货 14 天到达，全程提供物流追踪，让您随时掌握进度。' },
]

export default function DocExtractModal({ open, onClose, library, groups, onSave, user }) {
  const { message } = App.useApp()
  const [source, setSource] = useState('text')
  const [text, setText] = useState('')
  const [batchN, setBatchN] = useState(10)
  const [loading, setLoading] = useState(false)
  const [qaList, setQaList] = useState([])      // 解析出的问答对 [{id, q, a}]
  const [poolIdx, setPoolIdx] = useState(0)
  const [groupId, setGroupId] = useState(null)

  const reset = () => {
    setSource('text'); setText(''); setBatchN(10); setLoading(false)
    setQaList([]); setPoolIdx(0); setGroupId(null)
  }
  const close = () => { reset(); onClose() }

  // 模拟抽取 n 条（从池中接着取，循环则加"追加"标记避免完全重复）
  const drawFromPool = (start, n) => {
    const out = []
    for (let i = 0; i < n; i++) {
      const base = QA_POOL[(start + i) % QA_POOL.length]
      const round = Math.floor((start + i) / QA_POOL.length)
      out.push({
        id: `qa-${Date.now()}-${start + i}-${Math.round(Math.random() * 1e4)}`,
        q: round > 0 ? `${base.q}（追加 ${round}）` : base.q,
        a: base.a,
      })
    }
    return out
  }

  const handleExtract = () => {
    if (source === 'text' && !text.trim()) {
      message.warning('请先粘贴/输入一段文本')
      return
    }
    setLoading(true)
    setTimeout(() => {
      const drawn = drawFromPool(0, batchN)
      setQaList(drawn)
      setPoolIdx(batchN)
      setLoading(false)
      message.success(`已解析出 ${drawn.length} 组问答对，可逐条编辑后保存`)
    }, 900)
  }

  const handleAppend = () => {
    setLoading(true)
    setTimeout(() => {
      const drawn = drawFromPool(poolIdx, batchN)
      setQaList((prev) => [...prev, ...drawn])
      setPoolIdx((i) => i + batchN)
      setLoading(false)
      message.success(`已追加解析 ${drawn.length} 组`)
    }, 700)
  }

  const updateItem = (id, key, val) => setQaList((prev) => prev.map((x) => (x.id === id ? { ...x, [key]: val } : x)))
  const removeItem = (id) => setQaList((prev) => prev.filter((x) => x.id !== id))

  const handleSave = () => {
    if (qaList.length === 0) { message.warning('没有可保存的问答对'); return }
    if (!groupId) { message.warning('请选择要落到的分组'); return }
    onSave(qaList, groupId)
    message.success(`已保存 ${qaList.length} 条到草稿（待发布）`)
    close()
  }

  const inputArea = (
    <Tabs
      activeKey={source}
      onChange={setSource}
      items={[
        {
          key: 'text', label: <span><FileTextOutlined /> 粘贴文本</span>,
          children: (
            <Input.TextArea
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="粘贴一段文档/话术文本，AI 将自动解析其中的问答对…"
            />
          ),
        },
        {
          key: 'file', label: <span><CloudUploadOutlined /> 上传文档</span>,
          children: (
            <div className="gb-kb-extract-drop" onClick={() => { setText('（已选择示例文档：sales-sop.pdf）'); message.info('演示态：已载入示例文档') }}>
              <CloudUploadOutlined style={{ fontSize: 28, color: 'var(--gb-primary)' }} />
              <div>点击选择 PDF / Word / Excel 文件（演示态载入示例）</div>
              <div className="gb-kb-extract-drop-hint">单文件 ≤ 50MB，由外部 AI 解析正文后抽取问答对</div>
            </div>
          ),
        },
        {
          key: 'ocr', label: <span><PictureOutlined /> 图片 OCR</span>,
          children: (
            <div className="gb-kb-extract-drop" onClick={() => { setText('（已选择示例图片：catalog-page.png）'); message.info('演示态：已载入示例图片') }}>
              <PictureOutlined style={{ fontSize: 28, color: 'var(--gb-primary)' }} />
              <div>点击选择图片（演示态载入示例）</div>
              <div className="gb-kb-extract-drop-hint">图片先 OCR 转文本，再抽取问答对</div>
            </div>
          ),
        },
      ]}
    />
  )

  return (
    <Modal
      title={<span><RobotOutlined style={{ color: 'var(--gb-primary)', marginRight: 6 }} />文档提取</span>}
      open={open}
      onCancel={close}
      width={860}
      footer={qaList.length === 0 ? (
        <div className="gb-kb-extract-footer">
          <Space><span style={{ fontSize: 13 }}>本次解析问题数</span><InputNumber min={1} max={30} value={batchN} onChange={(v) => setBatchN(v || 10)} /></Space>
          <Space>
            <Button onClick={close}>取消</Button>
            <Button type="primary" icon={<ThunderboltOutlined />} loading={loading} onClick={handleExtract}>开始解析</Button>
          </Space>
        </div>
      ) : (
        <Space>
          <Button onClick={close}>取消</Button>
          <Button onClick={() => message.success('已复制全部问答对到剪贴板（演示）')}>复制</Button>
          <Button type="primary" onClick={handleSave}>保存 {qaList.length} 条到草稿</Button>
        </Space>
      )}
    >
      {qaList.length === 0 ? (
        <>
          {inputArea}
          {loading && <div style={{ textAlign: 'center', padding: 24 }}><Spin tip="AI 解析中…" /></div>}
        </>
      ) : (
        <>
          <div className="gb-kb-extract-resulthead">
            <Space>
              <Tag color="blue">{qaList.length} 组问答对</Tag>
              <span style={{ fontSize: 12, color: 'var(--gb-text-muted)' }}>逐条可编辑 / 删除</span>
            </Space>
            <Space>
              <span style={{ fontSize: 13 }}>本次解析问题数</span>
              <InputNumber size="small" min={1} max={30} value={batchN} onChange={(v) => setBatchN(v || 10)} style={{ width: 64 }} />
              <Button size="small" icon={<PlusOutlined />} loading={loading} onClick={handleAppend}>追加提取</Button>
            </Space>
          </div>

          <div className="gb-kb-extract-list">
            {qaList.map((item, idx) => (
              <div key={item.id} className="gb-kb-extract-item">
                <div className="gb-kb-extract-item-idx">{idx + 1}</div>
                <div className="gb-kb-extract-item-body">
                  <div className="gb-kb-extract-qa">
                    <span className="gb-kb-extract-q-label">Q</span>
                    <Input variant="borderless" value={item.q} onChange={(e) => updateItem(item.id, 'q', e.target.value)} />
                  </div>
                  <div className="gb-kb-extract-qa">
                    <span className="gb-kb-extract-a-label">A</span>
                    <Input.TextArea variant="borderless" autoSize value={item.a} onChange={(e) => updateItem(item.id, 'a', e.target.value)} />
                  </div>
                </div>
                <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => removeItem(item.id)} />
              </div>
            ))}
          </div>

          <div className="gb-kb-extract-savebar">
            <span style={{ fontSize: 13 }}>保存到分组：</span>
            <Select
              placeholder="选择该库内的分组"
              style={{ width: 280 }}
              value={groupId}
              onChange={setGroupId}
              options={groups.map((g) => ({ value: g.id, label: g.path }))}
            />
          </div>
        </>
      )}
    </Modal>
  )
}
