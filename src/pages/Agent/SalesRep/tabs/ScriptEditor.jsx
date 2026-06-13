import { useRef } from 'react'
import { Input, Button, Dropdown, Tooltip } from 'antd'
import {
  BoldOutlined, ItalicOutlined, SmileOutlined, PaperClipOutlined, FunctionOutlined,
} from '@ant-design/icons'

import { TEMPLATE_VARIABLES, SCRIPT_ATTACHMENTS, QUICK_EMOJIS } from '../../../../mock/automation'

/**
 * 轻量话术编辑器：Input.TextArea + 工具栏
 *   - 加粗 *text* / 斜体 _text_（WhatsApp 标记风格）
 *   - emoji / 插入变量 {key} / 插入图册附件 [附件:名称]
 *   - 在光标处插入，无重型富文本依赖
 */
export default function ScriptEditor({
  value = '',
  onChange,
  placeholder,
  rows = 3,
  maxLength = 600,
  variables = TEMPLATE_VARIABLES,
}) {
  const ref = useRef(null)
  const getEl = () => ref.current?.resizableTextArea?.textArea || null

  const applyAtCursor = (mut) => {
    const el = getEl()
    const start = el ? el.selectionStart : value.length
    const end = el ? el.selectionEnd : value.length
    const { next, caret } = mut(value, start, end)
    onChange(next)
    requestAnimationFrame(() => {
      const e2 = getEl()
      if (e2) { e2.focus(); e2.setSelectionRange(caret, caret) }
    })
  }

  const insert = (text) =>
    applyAtCursor((v, s, e) => ({ next: v.slice(0, s) + text + v.slice(e), caret: s + text.length }))

  const wrap = (pre, suf) =>
    applyAtCursor((v, s, e) => {
      const sel = v.slice(s, e) || '文本'
      return { next: v.slice(0, s) + pre + sel + suf + v.slice(e), caret: s + pre.length + sel.length + suf.length }
    })

  const varMenu = {
    items: variables.map((vv) => ({ key: vv.key, label: `{${vv.key}}  ·  ${vv.label}` })),
    onClick: ({ key }) => insert(`{${key}}`),
  }
  const attachMenu = {
    items: SCRIPT_ATTACHMENTS.map((a) => ({ key: a, label: a })),
    onClick: ({ key }) => insert(`[附件:${key}]`),
  }
  const emojiMenu = {
    items: QUICK_EMOJIS.map((em) => ({ key: em, label: <span style={{ fontSize: 16 }}>{em}</span> })),
    onClick: ({ key }) => insert(key),
  }

  const divider = <span style={{ width: 1, height: 16, background: 'var(--gb-border-light)', margin: '0 6px' }} />

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '2px 0 6px', flexWrap: 'wrap' }}>
        <Tooltip title="加粗 *text*"><Button type="text" size="small" icon={<BoldOutlined />} onClick={() => wrap('*', '*')} /></Tooltip>
        <Tooltip title="斜体 _text_"><Button type="text" size="small" icon={<ItalicOutlined />} onClick={() => wrap('_', '_')} /></Tooltip>
        <Dropdown menu={emojiMenu} trigger={['click']} placement="bottomLeft">
          <Button type="text" size="small" icon={<SmileOutlined />} />
        </Dropdown>
        {divider}
        <Dropdown menu={varMenu} trigger={['click']} placement="bottomLeft">
          <Button type="text" size="small" icon={<FunctionOutlined />}>插入变量</Button>
        </Dropdown>
        <Dropdown menu={attachMenu} trigger={['click']} placement="bottomLeft">
          <Button type="text" size="small" icon={<PaperClipOutlined />}>插入图册/附件</Button>
        </Dropdown>
      </div>
      <Input.TextArea
        ref={ref}
        value={value}
        rows={rows}
        maxLength={maxLength}
        showCount
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
