/**
 * Excel 批量导入弹窗（v9 · 见「关键逻辑.md §2.13.4」）
 *   下载模板 → 选择文件（演示态载入示例）→ 预览解析的问答对 → 选分组 → 导入为草稿
 *   模板列：问(必) / 答(必) / 相似问(选,分号隔) / 标签(选)
 */
import { useState } from 'react'
import { Modal, Button, Select, Table, App } from 'antd'
import { CloudUploadOutlined, FileExcelOutlined } from '@ant-design/icons'

const SAMPLE_ROWS = [
  { q: '你们支持货到付款吗？', a: 'We support T/T 30% deposit + 70% before shipment; COD is not available for international orders.', sims: 'COD?;货到付款' },
  { q: '能提供样品吗？样品收费吗？', a: 'Yes, samples are available. Sample fee is refundable against bulk orders over USD 5,000.', sims: 'sample fee;要样品' },
  { q: '可以来工厂验厂吗？', a: 'Absolutely. We welcome factory audits — please share your preferred dates and we will arrange a tour.', sims: 'factory visit;验厂' },
  { q: '支持哪些付款方式？', a: 'We accept T/T, L/C at sight, and Alibaba Trade Assurance for verified orders.', sims: 'payment terms;付款方式' },
  { q: '能否做 OEM / 贴牌？', a: 'Yes, OEM/ODM is supported. MOQ for branded packaging starts at 200 units per SKU.', sims: 'OEM;贴牌' },
]

export default function ExcelImportModal({ open, onClose, library, groups, onSave }) {
  const { message } = App.useApp()
  const [rows, setRows] = useState([])
  const [groupId, setGroupId] = useState(null)

  const close = () => { setRows([]); setGroupId(null); onClose() }

  const handlePick = () => {
    setRows(SAMPLE_ROWS.map((r, i) => ({ key: i, ...r })))
    message.success('已解析示例文件 sales-qa.xlsx，共 5 行')
  }

  const handleImport = () => {
    if (rows.length === 0) { message.warning('请先选择文件'); return }
    if (!groupId) { message.warning('请选择落到的分组'); return }
    const qaList = rows.map((r) => ({
      id: `xls-${Date.now()}-${r.key}`,
      q: r.q,
      a: r.a,
      sims: r.sims ? r.sims.split(/[;；]/).map((s) => s.trim()).filter(Boolean) : [],
    }))
    onSave(qaList, groupId)
    message.success(`已导入 ${qaList.length} 条到草稿（待发布）`)
    close()
  }

  return (
    <Modal
      title={<span><FileExcelOutlined style={{ color: '#10A86A', marginRight: 6 }} />Excel 批量导入</span>}
      open={open}
      onCancel={close}
      width={760}
      footer={[
        <Button key="cancel" onClick={close}>取消</Button>,
        <Button key="import" type="primary" disabled={rows.length === 0} onClick={handleImport}>
          导入 {rows.length || ''} 条到草稿
        </Button>,
      ]}
    >
      {rows.length === 0 ? (
        <div className="gb-kb-extract-drop gb-kb-drop-lg" onClick={handlePick}>
          <CloudUploadOutlined style={{ fontSize: 34, color: 'var(--gb-primary)' }} />
          <div style={{ fontSize: 14, marginTop: 6 }}>点击或拖拽 Excel 文件到此上传</div>
          <div className="gb-kb-extract-drop-hint">
            模板列：问 / 答 / 相似问 / 标签 ·{' '}
            <a onClick={(e) => { e.stopPropagation(); message.success('已下载模板 template-qa.xlsx（演示）') }}>下载模板</a>
          </div>
        </div>
      ) : (
        <>
          <Table
            size="small"
            dataSource={rows}
            pagination={false}
            scroll={{ y: 240 }}
            columns={[
              { title: '问', dataIndex: 'q', width: 200, ellipsis: true },
              { title: '答', dataIndex: 'a', ellipsis: true },
              { title: '相似问', dataIndex: 'sims', width: 140, render: (v) => v ? <span style={{ fontSize: 11, color: 'var(--gb-text-muted)' }}>{v}</span> : '—' },
            ]}
          />
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
