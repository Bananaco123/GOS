import { useEffect, useMemo, useRef, useState } from 'react'
import {
  App,
  Avatar,
  Badge,
  Button,
  Checkbox,
  Drawer,
  Dropdown,
  Empty,
  Input,
  Modal,
  Popover,
  Select,
  Space,
  Tag,
  Switch,
  Tabs,
  Tooltip,
} from 'antd'
import {
  AudioOutlined,
  BellOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  CheckSquareOutlined,
  ClockCircleOutlined,
  ClearOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  DisconnectOutlined,
  DownloadOutlined,
  DownOutlined,
  EditOutlined,
  EnvironmentOutlined,
  ExclamationCircleFilled,
  FileTextOutlined,
  FolderOpenOutlined,
  GlobalOutlined,
  HeartOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  LoadingOutlined,
  MenuFoldOutlined,
  MessageOutlined,
  MoreOutlined,
  PaperClipOutlined,
  PhoneOutlined,
  PictureOutlined,
  PauseOutlined,
  PlusOutlined,
  PushpinOutlined,
  RedoOutlined,
  ReloadOutlined,
  RobotOutlined,
  SearchOutlined,
  SendOutlined,
  SmileOutlined,
  StarOutlined,
  StopOutlined,
  TeamOutlined,
  UploadOutlined,
  UserOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  UserSwitchOutlined,
  VideoCameraOutlined,
  WarningOutlined,
} from '@ant-design/icons'

import { loadImState, resetImState, saveImState } from '../../mock/imStore'
import { salesOptions } from '../../mock/conversationManagement'
import './scrm.css'

const PAGE_SIZE = 12
const TOOL_PANEL_DEFAULT_WIDTH = 580
const TOOL_PANEL_MIN_WIDTH = Math.round(TOOL_PANEL_DEFAULT_WIDTH * 0.7)
const TOOL_PANEL_MAX_WIDTH = Math.round(TOOL_PANEL_DEFAULT_WIDTH * 1.3)

const FILTER_ICONS = {
  all: <MessageOutlined />,
  unread: <BellOutlined />,
  special: <HeartOutlined />,
  group: <TeamOutlined />,
  diy: <FolderOpenOutlined />,
  factory: <FolderOpenOutlined />,
}

const TYPE_ICON = {
  image: <PictureOutlined />,
  video: <VideoCameraOutlined />,
  voice: <AudioOutlined />,
  audio: <AudioOutlined />,
  file: <FileTextOutlined />,
  location: <LinkOutlined />,
}

const CHAT_RECORD_TABS = [
  { key: 'text', label: '文字消息' },
  { key: 'media', label: '图片/视频' },
  { key: 'attachment', label: '附件' },
]

const MEDIA_MESSAGE_TYPES = ['image', 'video']
const ATTACHMENT_MESSAGE_TYPES = ['file', 'audio']
const NON_TEXT_MESSAGE_TYPES = ['system', 'file', 'image', 'video', 'audio', 'voice', 'location', 'contact']

const ATTACHMENT_PICKER_FILES = {
  file: [
    { id: 'doc-quotation', name: 'Cabinet_quotation_v4.pdf', meta: '2.8 MB · PDF', type: 'file' },
    { id: 'doc-contract', name: 'Project_contract_draft.docx', meta: '846 KB · Word', type: 'file' },
    { id: 'doc-measure', name: 'site_measurement_list.xlsx', meta: '1.2 MB · Excel', type: 'file' },
  ],
  album: [
    { id: 'album-kitchen', name: 'kitchen_reference_01.jpg', meta: '3.4 MB · 图片', type: 'image' },
    { id: 'album-floor', name: 'floor_plan_markup.png', meta: '2.1 MB · 图片', type: 'image' },
    { id: 'album-sample', name: 'material_sample_video.mp4', meta: '18.6 MB · 视频', type: 'video' },
  ],
  audio: [
    { id: 'audio-client', name: 'client_requirements_audio.mp3', meta: '0:36 · MP3', type: 'audio' },
    { id: 'audio-site', name: 'site_feedback_recording.m4a', meta: '1:12 · M4A', type: 'audio' },
    { id: 'audio-confirm', name: 'delivery_time_confirm.wav', meta: '0:24 · WAV', type: 'audio' },
  ],
}

const ATTACHMENT_PICKER_TITLE = {
  file: '选择文档',
  album: '选择照片和视频',
  audio: '选择音频',
}

const ATTACHMENT_LAST_MESSAGE = {
  file: '[文档]',
  album: '[照片/视频]',
  audio: '[音频]',
}

const MEMBER_DIRECTORY = [
  { id: 'dir-niko', name: '~Niko', phone: '+86 131 0679 5050', role: '成员', avatarColor: '#d9fdd3' },
  { id: 'dir-olivia', name: '~Olivia', phone: '+86 177 0861 3924', role: '成员', avatarColor: '#c8e6c9' },
  { id: 'dir-scarlett', name: 'Scarlett Wu', phone: '+86 136 3241 5719', role: '设计师', avatarColor: '#e1f5fe' },
  { id: 'dir-sm', name: 'SM报价师', phone: '+86 131 0679 5053', role: '成员', avatarColor: '#fff3cd' },
  { id: 'dir-install', name: 'Install Lead', phone: '+86 188 0000 1201', role: '成员', avatarColor: '#f1f5f9' },
  { id: 'dir-bruce', name: 'Bruce Lee', phone: '+86 133 2673 1206', role: '成员', avatarColor: '#ede9fe' },
]

const CONTACT_DIRECTORY = [
  { id: 'contact-kanchan', name: 'Kanchan Rajput', phone: '+1 647 448 0575', account: 'kanchan.rajput', region: '加拿大', avatar: 'KR' },
  { id: 'contact-olivia', name: '~Olivia', phone: '+86 177 0861 3923', account: 'olivia3923', region: '中国', avatar: 'O' },
  { id: 'contact-niko', name: '~Niko', phone: '+86 131 0679 5050', account: 'niko5050', region: '中国', avatar: 'N' },
  { id: 'contact-bruce', name: 'Bruce Lee', phone: '+86 133 2673 1206', account: 'bruce1206', region: '中国', avatar: 'B' },
]

const SCRM_SIDE_TOOL_ITEMS = [
  { key: 'customer', label: '客户', icon: <UserOutlined /> },
  { key: 'follow-up', label: '跟进记录', icon: <ClockCircleOutlined /> },
  { key: 'translate', label: '翻译', icon: <GlobalOutlined /> },
  { key: 'quick-reply', label: '快捷回复', icon: <MessageOutlined /> },
  { key: 'conversation', label: '会话管理', icon: <UserSwitchOutlined /> },
  { key: 'marketing', label: '营销工具', icon: <StarOutlined /> },
]

const STICKER_OPTIONS = ['😀', '🥲', '😍', '👍', '🙏', '🎉']

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function nowTime() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatLocalTime(offset = 8) {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  const local = new Date(utc + offset * 3600000)
  return `${String(local.getHours()).padStart(2, '0')}:${String(local.getMinutes()).padStart(2, '0')}:${String(local.getSeconds()).padStart(2, '0')}`
}

function formatLocalDateTime(offset = 8) {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  const local = new Date(utc + offset * 3600000)
  const date = [
    local.getFullYear(),
    String(local.getMonth() + 1).padStart(2, '0'),
    String(local.getDate()).padStart(2, '0'),
  ].join('-')
  return `${date} ${formatLocalTime(offset)} (${formatOffset(offset).replace(':00', '')})`
}

function formatOffset(offset = 8) {
  const sign = offset >= 0 ? '+' : '-'
  return `UTC${sign}${String(Math.abs(offset)).padStart(2, '0')}:00`
}

function formatRegion(locality = '') {
  return locality.split('·')[0].trim() || '未知地区'
}

function conversationListSubtitle(conversation) {
  if (!conversation) return ''
  if (conversation.type === 'single') return ''
  if (/^群组\s*·\s*\d+\s*人$/.test(conversation.subtitle || '')) return ''
  return conversation.subtitle || ''
}

function conversationListLastMessage(conversation) {
  const lastMessage = conversation?.lastMessage || ''
  if (!lastMessage) return ''
  if (/^AI业务员[:：]\s*/.test(lastMessage)) {
    return lastMessage.replace(/^AI业务员[:：]\s*/, 'AI：')
  }
  if (conversation?.aiManaged && !/^(AI|我|客户|系统|设计师|SM报价师|Scarlett|Abhishek)[:：]/.test(lastMessage)) {
    return `AI：${lastMessage}`
  }
  return lastMessage
}

function formatLastSeen(conversation) {
  if (!conversation || conversation.online) return ''
  if (conversation.lastSeen) return conversation.lastSeen
  const idScore = Array.from(conversation.id || '').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  if (idScore % 3 === 0) return '3小时前'
  if (idScore % 3 === 1) return '1天前'
  return '2天前'
}

function memberLocation(member, index = 0) {
  const phone = member.phone || ''
  if (phone.startsWith('+1')) return { region: '加拿大', offset: -4 }
  if (phone.startsWith('+971')) return { region: '阿联酋', offset: 4 }
  if (phone.startsWith('+65')) return { region: '新加坡', offset: 8 }
  if (phone.startsWith('+86')) return { region: '中国', offset: 8 }
  return { region: ['马来西亚', '菲律宾', '英国'][index % 3], offset: [8, 8, 1][index % 3] }
}

function accountUnread(state, accountId) {
  return state.conversations
    .filter((item) => item.accountId === accountId)
    .reduce((sum, item) => sum + (item.unread || 0), 0)
}

function statusText(status) {
  if (status === 'read') return '已读'
  if (status === 'delivered') return '已送达'
  if (status === 'sent') return '已发送'
  if (status === 'failed') return '发送失败'
  return '发送中'
}

function AiAgentAvatar({ size = 30 }) {
  return (
    <Avatar size={size} className="scrm-ai-agent-avatar" icon={<RobotOutlined />} />
  )
}

function MessageStatusIcon({ status }) {
  if (status === 'sending') return <LoadingOutlined spin />
  if (status === 'sent') return <CheckOutlined />
  if (status === 'delivered') return <span className="im-double-check">✓✓</span>
  if (status === 'read') return <span className="im-double-check">✓✓</span>
  if (status === 'failed') return <ExclamationCircleFilled />
  return <LoadingOutlined spin />
}

function MessageContent({ item, onPreview, onToggleVoice, playing }) {
  if (item.recalled || item.type === 'recalled') {
    return <div className="im-recalled-message">此消息已撤回</div>
  }

  const renderBody = () => {
  if (item.type === 'contact') {
    return (
      <div className="im-contact-card">
        <Avatar size={36}>{item.contact?.avatar || item.contact?.name?.slice(0, 1)}</Avatar>
        <span>
          <strong>{item.contact?.name}</strong>
          <em>{item.contact?.phone}</em>
        </span>
      </div>
    )
  }

  if (item.type === 'voice') {
    return (
      <button className={`im-voice ${playing ? 'is-playing' : ''}`} onClick={() => onToggleVoice?.(item.id)}>
        <span className="im-voice-play">{playing ? '❚❚' : '▶'}</span>
        <span className="im-voice-wave">
          {Array.from({ length: 18 }, (_, index) => <i key={index} />)}
        </span>
        <span className="im-voice-duration">{item.duration}</span>
      </button>
    )
  }

    if (['file', 'image', 'video', 'audio', 'location'].includes(item.type)) {
      return (
        <button className={`im-attachment im-attachment-${item.type}`} onClick={() => onPreview?.(item)}>
        <span className="im-attachment-icon">{TYPE_ICON[item.type]}</span>
        <span>
          <strong>{item.text}</strong>
          {item.meta && <em>{item.meta}</em>}
        </span>
      </button>
    )
  }

    return <>{item.text}</>
  }

  return (
    <>
      {item.forwarded && <div className="im-forwarded-label">↪ 已转发</div>}
      {item.quote && (
        <div className="im-quote-card">
          <div className="im-quote-head">
            <strong>{item.quote.sender}</strong>
            <span>{item.quote.phone || item.quote.time}</span>
          </div>
          <div className="im-quote-text">{item.quote.text}</div>
        </div>
      )}
      {renderBody()}
    </>
  )
}

function MessageBubble({ item, isGroup, onRetry, onAction, selectMode, selected, onSelect, highlighted, onOpenReceipt, onPreview, onToggleVoice, playingVoiceId }) {
  if (item.type === 'system') {
    return <div className="im-system-message">{item.text}</div>
  }

  const mine = item.direction === 'out'
  const aiMessage = item.agentType === 'ai' || item.sender === 'AI业务员'
  const moreMenu = {
    items: [
      { key: 'pin', icon: <PushpinOutlined />, label: item.pinned ? '取消置顶' : '置顶消息' },
      { key: 'star', icon: <StarOutlined />, label: item.starred ? '取消星标' : '星标消息' },
      { key: 'forward', icon: <SendOutlined />, label: '转发消息' },
      { key: 'edit', icon: <EditOutlined />, label: '编辑消息', disabled: !mine || item.type !== 'text' || item.status === 'failed' || item.recalled },
      { key: 'recall', icon: <CloseCircleOutlined />, label: '撤回消息', danger: true, disabled: !mine || item.recalled },
    ],
    onClick: ({ key }) => onAction(key, item),
  }

  return (
    <div
      id={`scrm-message-${item.id}`}
      className={`im-message-row ${mine ? 'is-mine' : 'is-other'} ${aiMessage ? 'is-ai-agent' : ''} ${selectMode ? 'is-selecting' : ''} ${selected ? 'is-selected' : ''} ${highlighted ? 'is-located' : ''}`}
    >
      {selectMode && (
        <Checkbox
          className="im-message-select"
          checked={selected}
          onChange={(event) => onSelect(item.id, event.target.checked)}
        />
      )}
      {!mine && <Avatar size={30} className="im-message-avatar">{item.sender?.slice(0, 1)}</Avatar>}
      <div className="im-message-stack">
        {!mine && <div className="im-message-sender">{item.sender}</div>}
        <div className="im-bubble-wrap">
          <div className={`im-bubble ${item.status === 'failed' ? 'is-failed' : ''}`}>
            <MessageContent
              item={item}
              onPreview={onPreview}
              onToggleVoice={onToggleVoice}
              playing={playingVoiceId === item.id}
            />
          </div>
          <div className="im-message-actions">
            <Tooltip title="引用回复">
              <Button size="small" icon={<MessageOutlined />} onClick={() => onAction('quote', item)} />
            </Tooltip>
            {isGroup && !mine && (
              <Button size="small" className="im-at-button" onClick={() => onAction('mention', item)}>
                @
              </Button>
            )}
            <Tooltip title="表情回应">
              <Button size="small" icon={<SmileOutlined />} onClick={() => onAction('reaction', item)} />
            </Tooltip>
            <Dropdown menu={moreMenu} trigger={['click']} placement={mine ? 'bottomRight' : 'bottomLeft'}>
              <Button size="small" icon={<MoreOutlined />} />
            </Dropdown>
          </div>
        </div>
        <div className={`im-message-meta ${item.status === 'failed' ? 'is-error' : ''}`}>
          {item.starred && <StarOutlined className="im-message-starred" />}
          {item.edited && <span className="im-message-edited">已编辑</span>}
          <span>{item.time}</span>
          {aiMessage && <span className="im-message-agent-label"><RobotOutlined />AI业务员</span>}
          {mine && item.status !== 'failed' && (
            <Tooltip title={statusText(item.status)}>
              <button
                className={`im-message-status is-${item.status}`}
                onClick={() => ['read', 'delivered'].includes(item.status) && onOpenReceipt(item)}
              >
                <MessageStatusIcon status={item.status} />
              </button>
            </Tooltip>
          )}
          {item.status === 'failed' && (
            <>
              <ExclamationCircleFilled />
              <span>{item.error}</span>
              <Button type="link" size="small" icon={<RedoOutlined />} onClick={() => onRetry(item.id)}>
                重发
              </Button>
            </>
          )}
        </div>
        {item.reaction && <div className="im-message-reaction">{item.reaction}</div>}
      </div>
      {mine && aiMessage && <AiAgentAvatar size={34} />}
    </div>
  )
}

function ScrmSideToolRail({ activeKey, onOpen }) {
  return (
    <aside className="scrm-side-tool-rail" aria-label="SCRM 业务工具栏">
      {SCRM_SIDE_TOOL_ITEMS.map((tool) => (
        <Tooltip key={tool.key} title={tool.label} placement="left">
          <button
            className={`scrm-side-tool-button ${activeKey === tool.key ? 'is-active' : ''}`}
            type="button"
            aria-label={tool.label}
            onClick={() => onOpen(tool.key)}
          >
            {tool.icon}
          </button>
        </Tooltip>
      ))}
    </aside>
  )
}

function ScrmToolSidePanel({ title, open, resizing, onResizeStart, onClose }) {
  return (
    <aside className={`scrm-tool-side-panel ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <button
        className={`scrm-tool-panel-resizer ${resizing ? 'is-dragging' : ''}`}
        type="button"
        aria-label="调整侧边栏宽度"
        onMouseDown={onResizeStart}
      />
      <div className="scrm-tool-panel-header">
        <button className="scrm-tool-panel-collapse" type="button" aria-label="收起侧边栏" onClick={onClose}>
          <MenuFoldOutlined />
        </button>
        <strong>{title}</strong>
      </div>
      <div className="scrm-tool-panel-body" />
    </aside>
  )
}

export default function ScrmWorkbench() {
  const { message, modal } = App.useApp()
  const [state, setState] = useState(() => loadImState())
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState('')
  const [quotedMessage, setQuotedMessage] = useState(null)
  const [newGroupOpen, setNewGroupOpen] = useState(false)
  const [newContactOpen, setNewContactOpen] = useState(false)
  const [contactAccountInput, setContactAccountInput] = useState('')
  const [contactSearch, setContactSearch] = useState('')
  const [contactCardOpen, setContactCardOpen] = useState(false)
  const [contactCardSearch, setContactCardSearch] = useState('')
  const [accountLoginOpen, setAccountLoginOpen] = useState(false)
  const [newListOpen, setNewListOpen] = useState(false)
  const [listPickerOpen, setListPickerOpen] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [listSearch, setListSearch] = useState('')
  const [newListConversationIds, setNewListConversationIds] = useState([])
  const [assignListOpen, setAssignListOpen] = useState(false)
  const [assignConversationId, setAssignConversationId] = useState(null)
  const [assignListKeys, setAssignListKeys] = useState([])
  const [selectMessagesMode, setSelectMessagesMode] = useState(false)
  const [selectedMessageIds, setSelectedMessageIds] = useState([])
  const [forwardOpen, setForwardOpen] = useState(false)
  const [forwardSearch, setForwardSearch] = useState('')
  const [forwardConversationIds, setForwardConversationIds] = useState([])
  const [chatSearchOpen, setChatSearchOpen] = useState(false)
  const [chatSearchQuery, setChatSearchQuery] = useState('')
  const [chatSearchTab, setChatSearchTab] = useState('text')
  const [leadTransferOpen, setLeadTransferOpen] = useState(false)
  const [leadTransferUser, setLeadTransferUser] = useState(salesOptions[0]?.value || '')
  const [highlightedMessageId, setHighlightedMessageId] = useState(null)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [receiptMessage, setReceiptMessage] = useState(null)
  const [editMessageOpen, setEditMessageOpen] = useState(false)
  const [editMessageTarget, setEditMessageTarget] = useState(null)
  const [editMessageDraft, setEditMessageDraft] = useState('')
  const [recallOpen, setRecallOpen] = useState(false)
  const [recallTarget, setRecallTarget] = useState(null)
  const [attachmentPreview, setAttachmentPreview] = useState(null)
  const [playingVoiceId, setPlayingVoiceId] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(1)
  const [attachmentPickerType, setAttachmentPickerType] = useState(null)
  const [selectedAttachmentIds, setSelectedAttachmentIds] = useState([])
  const [infoOpen, setInfoOpen] = useState(false)
  const [editingContactName, setEditingContactName] = useState(false)
  const [contactNameDraft, setContactNameDraft] = useState('')
  const [editingContactRemark, setEditingContactRemark] = useState(false)
  const [contactRemarkDraft, setContactRemarkDraft] = useState('')
  const [contactLabelPickerOpen, setContactLabelPickerOpen] = useState(false)
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [avatarUploadOpen, setAvatarUploadOpen] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')
  const [editingGroupField, setEditingGroupField] = useState(null)
  const [groupFieldDraft, setGroupFieldDraft] = useState('')
  const [newGroupName, setNewGroupName] = useState('New Project Delivery Group')
  const [newGroupMembers, setNewGroupMembers] = useState(['Abhishek Kandi', 'Scarlett Wu'])
  const [conversationWidth, setConversationWidth] = useState(360)
  const [dragging, setDragging] = useState(false)
  const [activeToolPanel, setActiveToolPanel] = useState(null)
  const [toolPanelWidth, setToolPanelWidth] = useState(TOOL_PANEL_DEFAULT_WIDTH)
  const [toolPanelDragging, setToolPanelDragging] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [, setClockTick] = useState(Date.now())
  const composerInputRef = useRef(null)

  useEffect(() => {
    saveImState(state)
  }, [state])

  useEffect(() => {
    const timer = window.setInterval(() => setClockTick(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!isRecording) return undefined
    const timer = window.setInterval(() => setRecordSeconds((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [isRecording])

  useEffect(() => {
    if (!dragging) return undefined
    const handleMove = (event) => {
      setConversationWidth((width) => clamp(width + event.movementX, 300, 560))
    }
    const stopDrag = () => setDragging(false)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', stopDrag)
    document.body.classList.add('scrm-is-resizing')
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', stopDrag)
      document.body.classList.remove('scrm-is-resizing')
    }
  }, [dragging])

  useEffect(() => {
    if (!toolPanelDragging) return undefined
    const handleMove = (event) => {
      setToolPanelWidth((width) => clamp(width - event.movementX, TOOL_PANEL_MIN_WIDTH, TOOL_PANEL_MAX_WIDTH))
    }
    const stopDrag = () => setToolPanelDragging(false)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', stopDrag)
    document.body.classList.add('scrm-is-resizing')
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', stopDrag)
      document.body.classList.remove('scrm-is-resizing')
    }
  }, [toolPanelDragging])

  const currentAccount = state.accounts.find((item) => item.id === state.currentAccountId) || state.accounts[0]

  const accountConversations = useMemo(
    () => state.conversations.filter((item) => item.accountId === currentAccount.id),
    [state.conversations, currentAccount.id],
  )
  const listConversationCandidates = useMemo(() => {
    const query = listSearch.trim().toLowerCase()
    return accountConversations.filter((item) => {
      if (!query) return true
      return `${item.title} ${item.phone || ''} ${item.subtitle || ''}`.toLowerCase().includes(query)
    })
  }, [accountConversations, listSearch])
  const assignableLists = currentAccount.labels.filter((label) => !['all', 'unread', 'special', 'group'].includes(label.key))

  const filteredConversations = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    return accountConversations
      .filter((item) => {
        if (state.filterKey === 'archived') return item.archived
        if (item.archived) return false
        if (state.filterKey === 'unread') return item.unread > 0
        if (state.filterKey === 'group') return item.type === 'group'
        if (state.filterKey === 'all') return true
        return item.labels.includes(state.filterKey)
      })
      .filter((item) => {
        if (!normalized) return true
        return `${item.title} ${item.remark || ''} ${item.subtitle} ${item.phone || ''} ${item.lastMessage}`.toLowerCase().includes(normalized)
      })
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || (b.sortIndex || 0) - (a.sortIndex || 0))
  }, [accountConversations, search, state.filterKey])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [currentAccount.id, state.filterKey, search])

  const visibleConversations = filteredConversations.slice(0, visibleCount)
  const archivedConversationCount = accountConversations.filter((item) => item.archived).length

  const activeConversation = state.filterKey === 'archived'
    ? state.conversations.find((item) => item.id === state.activeConversationId && item.accountId === currentAccount.id && item.archived) ||
      visibleConversations[0] ||
      null
    : state.conversations.find((item) => item.id === state.activeConversationId && item.accountId === currentAccount.id) ||
      visibleConversations[0] ||
      accountConversations[0]

  const activeMessages = activeConversation ? state.messages[activeConversation.id] || [] : []
  const activePinnedMessage = activeMessages.find((item) => item.pinned)
  const activeGroup = activeConversation?.type === 'group' ? state.groups[activeConversation.id] : null
  const isOffline = currentAccount.status === 'offline'
  const groupInviteLink = activeGroup?.inviteLink || `https://os-scrm.gbuilder.com/whatsapp/group/${activeGroup?.id || 'group'}/invite`
  const contactCandidates = useMemo(() => {
    const query = contactSearch.trim().toLowerCase()
    if (!query) return []
    return CONTACT_DIRECTORY
      .filter((item) => `${item.name} ${item.phone} ${item.account}`.toLowerCase().includes(query))
      .slice(0, 5)
  }, [contactSearch])
  const contactCardCandidates = useMemo(() => {
    const query = contactCardSearch.trim().toLowerCase()
    return CONTACT_DIRECTORY
      .filter((item) => {
        if (!query) return true
        return `${item.name} ${item.phone} ${item.account} ${item.region}`.toLowerCase().includes(query)
      })
      .slice(0, 8)
  }, [contactCardSearch])
  const forwardCandidates = useMemo(() => {
    const query = forwardSearch.trim().toLowerCase()
    return accountConversations
      .filter((conversation) => conversation.id !== activeConversation?.id)
      .filter((conversation) => {
        if (!query) return true
        return `${conversation.title} ${conversation.phone || ''} ${conversation.subtitle || ''}`.toLowerCase().includes(query)
      })
  }, [accountConversations, activeConversation?.id, forwardSearch])
  const chatSearchResults = useMemo(() => {
    const query = chatSearchQuery.trim().toLowerCase()
    if (!query) return []
    return activeMessages.filter((item) =>
      !NON_TEXT_MESSAGE_TYPES.includes(item.type) &&
      `${item.sender || ''} ${item.text || ''} ${item.meta || ''}`.toLowerCase().includes(query),
    )
  }, [activeMessages, chatSearchQuery])
  const mediaSearchResults = useMemo(() => {
    const query = chatSearchQuery.trim().toLowerCase()
    return activeMessages.filter((item) => {
      if (!MEDIA_MESSAGE_TYPES.includes(item.type)) return false
      if (!query) return true
      return `${item.sender || ''} ${item.text || ''} ${item.meta || ''}`.toLowerCase().includes(query)
    })
  }, [activeMessages, chatSearchQuery])
  const attachmentSearchResults = useMemo(() => {
    const query = chatSearchQuery.trim().toLowerCase()
    return activeMessages.filter((item) => {
      if (!ATTACHMENT_MESSAGE_TYPES.includes(item.type)) return false
      if (!query) return true
      return `${item.sender || ''} ${item.text || ''} ${item.meta || ''}`.toLowerCase().includes(query)
    })
  }, [activeMessages, chatSearchQuery])

  useEffect(() => {
    setQuotedMessage(null)
    setSelectMessagesMode(false)
    setSelectedMessageIds([])
    setEditingContactName(false)
    setContactNameDraft(activeConversation?.title || '')
    setEditingContactRemark(false)
    setContactRemarkDraft(activeConversation?.remark || '')
    setContactLabelPickerOpen(false)
  }, [activeConversation?.id])
  const sortedGroupMembers = useMemo(() => {
    if (!activeGroup?.members) return []
    const adminMember = activeGroup.members.find((item) => item.role === '管理员') || activeGroup.members[0]
    return activeGroup.members.map((item) => ({
      ...item,
      effectiveRole: item.id === adminMember?.id ? '管理员' : '成员',
    })).sort((a, b) => {
      if (a.effectiveRole === '管理员' && b.effectiveRole !== '管理员') return -1
      if (a.effectiveRole !== '管理员' && b.effectiveRole === '管理员') return 1
      return a.name.localeCompare(b.name)
    })
  }, [activeGroup])
  const receiptMembers = activeConversation?.type === 'group'
    ? sortedGroupMembers
    : activeConversation
      ? [{ id: activeConversation.id, name: activeConversation.title, phone: activeConversation.phone }]
      : []
  const receiptReadCount = receiptMessage?.status === 'read'
    ? activeConversation?.type === 'group'
      ? Math.max(1, Math.ceil(receiptMembers.length * 0.6))
      : receiptMembers.length
    : 0
  const receiptReadMembers = receiptMembers.slice(0, receiptReadCount)
  const receiptDeliveredMembers = receiptMembers.slice(receiptReadCount)
  const memberCandidates = useMemo(() => {
    const query = memberSearch.trim().toLowerCase()
    const existingPhones = new Set((activeGroup?.members || []).map((item) => item.phone))
    return MEMBER_DIRECTORY
      .filter((item) => !existingPhones.has(item.phone))
      .filter((item) => {
        if (!query) return true
        return `${item.name} ${item.phone}`.toLowerCase().includes(query)
      })
      .slice(0, 6)
  }, [activeGroup, memberSearch])

  const patchState = (updater) => {
    setState((prev) => (typeof updater === 'function' ? updater(prev) : updater))
  }

  const updateConversation = (conversationId, mapper) => {
    patchState((prev) => ({
      ...prev,
      conversations: prev.conversations.map((item) => {
        if (item.id !== conversationId) return item
        return typeof mapper === 'function' ? mapper(item) : { ...item, ...mapper }
      }),
    }))
  }

  const saveContactRemark = () => {
    if (!activeConversation || activeConversation.type !== 'single') return
    updateConversation(activeConversation.id, { remark: contactRemarkDraft.trim() })
    setEditingContactRemark(false)
    message.success('客户备注已更新')
  }

  const saveContactName = () => {
    const nextName = contactNameDraft.trim()
    if (!activeConversation || activeConversation.type !== 'single') return
    if (!nextName) {
      message.warning('客户姓名不能为空')
      return
    }
    updateConversation(activeConversation.id, { title: nextName })
    setEditingContactName(false)
    message.success('客户姓名已更新')
  }

  const updateContactLabel = (labelKey, selected) => {
    if (!activeConversation || activeConversation.type !== 'single') return
    updateConversation(activeConversation.id, (conversation) => {
      const labels = selected
        ? Array.from(new Set([...conversation.labels, labelKey]))
        : conversation.labels.filter((key) => key !== labelKey)
      return {
        ...conversation,
        labels,
        unread: labelKey === 'unread' ? (selected ? Math.max(conversation.unread || 0, 1) : 0) : conversation.unread,
      }
    })
  }

  const switchAccount = (accountId) => {
    patchState((prev) => {
      const first = prev.conversations.find((item) => item.accountId === accountId && !item.archived)
      return {
        ...prev,
        currentAccountId: accountId,
        activeConversationId: first?.id || prev.activeConversationId,
        filterKey: 'all',
        accounts: prev.accounts.map((item) => (item.id === accountId ? { ...item, blinking: false } : item)),
      }
    })
  }

  const selectConversation = (conversationId) => {
    patchState((prev) => ({
      ...prev,
      activeConversationId: conversationId,
      conversations: prev.conversations.map((item) =>
        item.id === conversationId
          ? { ...item, unread: 0, labels: item.labels.filter((label) => label !== 'unread') }
          : item,
      ),
    }))
  }

  const setFilter = (filterKey) => {
    patchState((prev) => ({ ...prev, filterKey }))
  }

  const handleListScroll = (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget
    if (scrollHeight - scrollTop - clientHeight < 120) {
      setVisibleCount((count) => Math.min(count + 8, filteredConversations.length))
    }
  }

  const toggleUnread = (conversation = activeConversation) => {
    if (!conversation) return
    updateConversation(conversation.id, (item) => {
      const markUnread = item.unread === 0
      const labels = markUnread ? Array.from(new Set([...item.labels, 'unread'])) : item.labels.filter((label) => label !== 'unread')
      return { ...item, unread: markUnread ? Math.max(item.unread || 0, 1) : 0, labels }
    })
    message.success(conversation.unread > 0 ? '已标记为已读' : '已标记为未读')
  }

  const togglePinned = (conversation = activeConversation) => {
    if (!conversation) return
    updateConversation(conversation.id, (item) => ({ ...item, pinned: !item.pinned }))
    message.success(conversation.pinned ? '已取消置顶' : '已置顶会话')
  }

  const toggleMuted = (conversation = activeConversation) => {
    if (!conversation) return
    updateConversation(conversation.id, (item) => ({ ...item, muted: !item.muted }))
    message.success(conversation.muted ? '已取消静音' : '已静音通知')
  }

  const toggleArchived = (conversation = activeConversation) => {
    if (!conversation) return
    updateConversation(conversation.id, { archived: !conversation.archived })
    message.success(conversation.archived ? '已取消归档聊天' : '已归档聊天')
  }

  const startGroupFromConversation = (conversation = activeConversation) => {
    if (!conversation) return
    setNewGroupName(`${conversation.title} Project Group`)
    setNewGroupMembers([conversation.title, 'Scarlett Wu'])
    setNewGroupOpen(true)
  }

  const sendMessage = () => {
    if (!draft.trim() || !activeConversation || isOffline) return
    const nextMsg = {
      id: `m-${Date.now()}`,
      type: 'text',
      direction: 'out',
      sender: '我',
      text: draft.trim(),
      time: nowTime(),
      status: 'sending',
      sentAt: Date.now(),
      quote: quotedMessage
        ? {
            id: quotedMessage.id,
            sender: quotedMessage.sender,
            phone: activeConversation.type === 'group' ? activeConversation.phone : '',
            text: quotedMessage.text || quotedMessage.meta || '[非文本消息]',
            time: quotedMessage.time,
          }
        : null,
    }
    patchState((prev) => ({
      ...prev,
      messages: {
        ...prev.messages,
        [activeConversation.id]: [...(prev.messages[activeConversation.id] || []), nextMsg],
      },
      conversations: prev.conversations.map((item) =>
        item.id === activeConversation.id
          ? { ...item, lastMessage: `我: ${nextMsg.text}`, lastAt: '刚刚', sortIndex: Date.now() }
          : item,
      ),
    }))
    setDraft('')
    setQuotedMessage(null)
    window.setTimeout(() => {
      patchState((prev) => ({
        ...prev,
        messages: {
          ...prev.messages,
          [activeConversation.id]: (prev.messages[activeConversation.id] || []).map((item) =>
            item.id === nextMsg.id && !item.recalled ? { ...item, status: 'sent' } : item,
          ),
        },
      }))
    }, 650)
    window.setTimeout(() => {
      patchState((prev) => ({
        ...prev,
        messages: {
          ...prev.messages,
          [activeConversation.id]: (prev.messages[activeConversation.id] || []).map((item) =>
            item.id === nextMsg.id && !item.recalled ? { ...item, status: 'delivered' } : item,
          ),
        },
      }))
    }, 1500)
  }

  const interveneAiConversation = () => {
    if (!activeConversation) return
    const handoffMessage = {
      id: `handoff-${Date.now()}`,
      type: 'system',
      text: `${currentAccount.name} 已介入会话`,
      time: nowTime(),
    }
    patchState((prev) => ({
      ...prev,
      conversations: prev.conversations.map((conversation) => (
        conversation.id === activeConversation.id
          ? {
              ...conversation,
              aiManaged: false,
              aiTouched: true,
              lastMessage: '系统: 人工已介入会话',
              lastAt: '刚刚',
              sortIndex: Date.now(),
            }
          : conversation
      )),
      messages: {
        ...prev.messages,
        [activeConversation.id]: [...(prev.messages[activeConversation.id] || []), handoffMessage],
      },
    }))
    message.success('已介入会话')
  }

  const toggleAiReception = (checked) => {
    if (!activeConversation) return
    patchState((prev) => ({
      ...prev,
      conversations: prev.conversations.map((conversation) => (
        conversation.id === activeConversation.id
          ? {
              ...conversation,
              aiTouched: true,
              aiManaged: checked,
              aiAgentName: conversation.aiAgentName || 'AI业务员',
            }
          : conversation
      )),
    }))
  }

  const openChatRecordSearch = () => {
    setChatSearchQuery('')
    setChatSearchTab('text')
    setChatSearchOpen(true)
  }

  const openLeadTransfer = () => {
    setLeadTransferUser(salesOptions[0]?.value || '')
    setLeadTransferOpen(true)
  }

  const confirmLeadTransfer = () => {
    if (!activeConversation || !leadTransferUser) return
    const assignee = salesOptions.find((item) => item.value === leadTransferUser)?.label || leadTransferUser
    setLeadTransferOpen(false)
    message.success(`已转派给 ${assignee}`)
  }

  const retryMessage = (messageId) => {
    if (!activeConversation) return
    patchState((prev) => ({
      ...prev,
      messages: {
        ...prev.messages,
        [activeConversation.id]: (prev.messages[activeConversation.id] || []).map((item) =>
          item.id === messageId
            ? { ...item, status: 'delivered', error: null, time: nowTime(), sentAt: Date.now() }
            : item,
        ),
      },
      conversations: prev.conversations.map((item) =>
        item.id === activeConversation.id
          ? { ...item, lastMessage: '我: Please check the updated quotation and confirm the delivery date.', lastAt: '刚刚', sortIndex: Date.now() }
          : item,
      ),
    }))
    message.success('消息已重新发送')
  }

  const handleMessageAction = (key, item) => {
    if (key === 'quote') {
      setQuotedMessage(item)
      return
    }
    if (key === 'reaction') {
      if (!activeConversation) return
      patchState((prev) => ({
        ...prev,
        messages: {
          ...prev.messages,
          [activeConversation.id]: (prev.messages[activeConversation.id] || []).map((messageItem) =>
            messageItem.id === item.id ? { ...messageItem, reaction: '😮' } : messageItem,
          ),
        },
      }))
      return
    }
    if (key === 'forward') {
      openForwardMessages([item.id])
      return
    }
    if (key === 'pin') {
      if (!activeConversation) return
      const nextPinned = !item.pinned
      patchState((prev) => ({
        ...prev,
        messages: {
          ...prev.messages,
          [activeConversation.id]: (prev.messages[activeConversation.id] || []).map((messageItem) =>
            messageItem.id === item.id
              ? { ...messageItem, pinned: nextPinned, pinnedAt: nextPinned ? Date.now() : null }
              : { ...messageItem, pinned: false, pinnedAt: null },
          ),
        },
      }))
      message.success(nextPinned ? '消息已置顶' : '已取消置顶')
      return
    }
    if (key === 'star') {
      if (!activeConversation) return
      const nextStarred = !item.starred
      patchState((prev) => ({
        ...prev,
        messages: {
          ...prev.messages,
          [activeConversation.id]: (prev.messages[activeConversation.id] || []).map((messageItem) =>
            messageItem.id === item.id ? { ...messageItem, starred: nextStarred } : messageItem,
          ),
        },
      }))
      message.success(nextStarred ? '消息已标为星标' : '已取消星标')
      return
    }
    if (key === 'mention') {
      const mentionName = item.sender?.trim()
      if (!mentionName || mentionName === '我') return
      setDraft((value) => `${value}${value && !value.endsWith(' ') ? ' ' : ''}@${mentionName} `)
      window.setTimeout(() => composerInputRef.current?.focus?.(), 0)
      return
    }
    if (key === 'edit') {
      setEditMessageTarget(item)
      setEditMessageDraft(item.text || '')
      setEditMessageOpen(true)
      return
    }
    if (key === 'recall') {
      setRecallTarget(item)
      setRecallOpen(true)
      return
    }
    message.success(`已处理 ${item.id}`)
  }

  const saveEditedMessage = () => {
    const nextText = editMessageDraft.trim()
    if (!activeConversation || !editMessageTarget || !nextText) {
      message.warning('编辑后的消息不能为空')
      return
    }
    patchState((prev) => ({
      ...prev,
      messages: {
        ...prev.messages,
        [activeConversation.id]: (prev.messages[activeConversation.id] || []).map((item) =>
          item.id === editMessageTarget.id
            ? { ...item, text: nextText, edited: true, editedAt: Date.now() }
            : item,
        ),
      },
      conversations: prev.conversations.map((item) =>
        item.id === activeConversation.id && item.lastMessage?.includes(editMessageTarget.text)
          ? { ...item, lastMessage: `我: ${nextText}` }
          : item,
      ),
    }))
    setEditMessageOpen(false)
    setEditMessageTarget(null)
    setEditMessageDraft('')
    message.success('消息已编辑')
  }

  const executeRecall = (mode) => {
    if (!activeConversation || !recallTarget) return
    if (mode === 'everyone') {
      const elapsed = recallTarget.sentAt ? Date.now() - recallTarget.sentAt : Number.POSITIVE_INFINITY
      if (elapsed > 120000) {
        message.error('撤回失败：消息已超过 2 分钟撤回时限')
        return
      }
      patchState((prev) => ({
        ...prev,
        messages: {
          ...prev.messages,
          [activeConversation.id]: (prev.messages[activeConversation.id] || []).map((item) =>
            item.id === recallTarget.id
              ? {
                  ...item,
                  type: 'recalled',
                  text: '此消息已撤回',
                  meta: null,
                  quote: null,
                  reaction: null,
                  recalled: true,
                }
              : item,
          ),
        },
      }))
      message.success('消息已为双方撤回')
    } else {
      patchState((prev) => ({
        ...prev,
        messages: {
          ...prev.messages,
          [activeConversation.id]: (prev.messages[activeConversation.id] || []).filter((item) => item.id !== recallTarget.id),
        },
      }))
      message.success('消息已仅从我们的聊天中删除')
    }
    setRecallOpen(false)
    setRecallTarget(null)
  }

  const toggleVoicePlayback = (messageId) => {
    if (playingVoiceId === messageId) {
      setPlayingVoiceId(null)
      return
    }
    setPlayingVoiceId(messageId)
    window.setTimeout(() => {
      setPlayingVoiceId((current) => (current === messageId ? null : current))
    }, 3500)
  }

  const simulateIncoming = () => {
    const account = state.accounts.find((item) => item.id !== currentAccount.id && item.status === 'online') || state.accounts[0]
    const target = state.conversations.find((item) => item.accountId === account.id && !item.archived)
    if (!target) return
    const nextMsg = {
      id: `m-in-${Date.now()}`,
      type: 'text',
      direction: 'in',
      sender: target.type === 'group' ? '客户' : target.title,
      text: 'Please check this message when you switch back.',
      time: nowTime(),
      status: 'sent',
    }
    patchState((prev) => ({
      ...prev,
      accounts: prev.accounts.map((item) => (item.id === account.id ? { ...item, blinking: true } : item)),
      conversations: prev.conversations.map((item) =>
        item.id === target.id
          ? {
              ...item,
              unread: (item.unread || 0) + 1,
              labels: Array.from(new Set([...item.labels, 'unread'])),
              lastMessage: `${nextMsg.sender}: ${nextMsg.text}`,
              lastAt: '刚刚',
              sortIndex: Date.now(),
            }
          : item,
      ),
      messages: {
        ...prev.messages,
        [target.id]: [...(prev.messages[target.id] || []), nextMsg],
      },
    }))
  }

  const setCurrentOffline = () => {
    patchState((prev) => ({
      ...prev,
      accounts: prev.accounts.map((item) => (item.id === currentAccount.id ? { ...item, status: 'offline' } : item)),
    }))
  }

  const reconnectCurrent = () => {
    patchState((prev) => ({
      ...prev,
      accounts: prev.accounts.map((item) => (item.id === currentAccount.id ? { ...item, status: 'online' } : item)),
    }))
    message.success('账号已重新扫码登录')
  }

  const updateGroupInfo = (field, value) => {
    if (!activeGroup || !activeConversation) return
    patchState((prev) => ({
      ...prev,
      conversations: prev.conversations.map((item) =>
        item.id === activeConversation.id
          ? {
              ...item,
              ...(field === 'title' ? { title: value } : {}),
              ...(field === 'avatar' ? value : {}),
            }
          : item,
      ),
      groups: {
        ...prev.groups,
        [activeGroup.id]: {
          ...prev.groups[activeGroup.id],
          ...(field === 'remark' ? { description: value } : {}),
          ...(field === 'createdAt' ? { createdAt: value } : {}),
          ...(field === 'inviteLink' ? { inviteLink: value } : {}),
        },
      },
    }))
  }

  const startGroupFieldEdit = (field, value) => {
    setEditingGroupField(field)
    setGroupFieldDraft(value || '')
  }

  const saveGroupFieldEdit = () => {
    if (!editingGroupField) return
    updateGroupInfo(editingGroupField, groupFieldDraft.trim())
    setEditingGroupField(null)
    setGroupFieldDraft('')
    message.success('群资料已更新')
  }

  const addGroupMember = (candidate) => {
    if (!activeGroup || !activeConversation || !candidate) return
    const nextMember = {
      id: `gm-${Date.now()}`,
      name: candidate.name,
      role: '成员',
      phone: candidate.phone,
    }
    patchState((prev) => ({
      ...prev,
      groups: {
        ...prev.groups,
        [activeGroup.id]: {
          ...prev.groups[activeGroup.id],
          members: [...prev.groups[activeGroup.id].members, nextMember],
        },
      },
      messages: {
        ...prev.messages,
        [activeConversation.id]: [
          ...(prev.messages[activeConversation.id] || []),
          { id: `sys-${Date.now()}`, type: 'system', text: `${nextMember.name} 已加入群聊`, time: nowTime() },
        ],
      },
    }))
    setMemberSearch('')
    message.success('已添加群成员')
  }

  const promoteGroupMember = (member) => {
    if (!activeGroup || !member || member.effectiveRole === '管理员') return
    patchState((prev) => ({
      ...prev,
      groups: {
        ...prev.groups,
        [activeGroup.id]: {
          ...prev.groups[activeGroup.id],
          members: prev.groups[activeGroup.id].members.map((item) =>
            item.id === member.id ? { ...item, role: '管理员' } : { ...item, role: '成员' },
          ),
        },
      },
      messages: {
        ...prev.messages,
        [activeGroup.id]: [
          ...(prev.messages[activeGroup.id] || []),
          { id: `sys-${Date.now()}`, type: 'system', text: `${member.name} 已被设为群组管理员`, time: nowTime() },
        ],
      },
    }))
    message.success('已设为群组管理员')
  }

  const removeGroupMember = (member) => {
    if (!activeGroup || !member || member.effectiveRole === '管理员') return
    patchState((prev) => ({
      ...prev,
      groups: {
        ...prev.groups,
        [activeGroup.id]: {
          ...prev.groups[activeGroup.id],
          members: prev.groups[activeGroup.id].members.filter((item) => item.id !== member.id),
        },
      },
      messages: {
        ...prev.messages,
        [activeGroup.id]: [
          ...(prev.messages[activeGroup.id] || []),
          { id: `sys-${Date.now()}`, type: 'system', text: `${member.name} 已被移出群聊`, time: nowTime() },
        ],
      },
    }))
    message.success('已移除群成员')
  }

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(groupInviteLink)
      message.success('邀请链接已复制')
    } catch {
      message.info(groupInviteLink)
    }
  }

  const resetInviteLink = () => {
    if (!activeGroup) return
    const nextLink = `https://os-scrm.gbuilder.com/whatsapp/group/${activeGroup.id}/invite?code=${Math.random().toString(36).slice(2, 8)}`
    updateGroupInfo('inviteLink', nextLink)
    message.success('邀请链接已重置')
  }

  const handleAvatarFile = (event) => {
    const file = event.target.files?.[0]
    if (!file || !activeConversation) return
    const reader = new FileReader()
    reader.onload = () => {
      updateGroupInfo('avatar', { avatarUrl: reader.result })
      setAvatarUploadOpen(false)
      message.success('群头像已更新')
    }
    reader.readAsDataURL(file)
  }

  const approveRequest = (requestId) => {
    if (!activeGroup) return
    const request = activeGroup.pendingRequests.find((item) => item.id === requestId)
    if (!request) return
    patchState((prev) => ({
      ...prev,
      groups: {
        ...prev.groups,
        [activeGroup.id]: {
          ...prev.groups[activeGroup.id],
          members: [...prev.groups[activeGroup.id].members, { id: `gm-${Date.now()}`, name: request.name, phone: request.phone, role: '成员' }],
          pendingRequests: prev.groups[activeGroup.id].pendingRequests.filter((item) => item.id !== requestId),
        },
      },
      messages: {
        ...prev.messages,
        [activeGroup.id]: [
          ...(prev.messages[activeGroup.id] || []),
          { id: `sys-${Date.now()}`, type: 'system', text: `${request.name} 的入群申请已通过`, time: nowTime() },
        ],
      },
    }))
    message.success('已通过入群申请')
  }

  const createManualGroup = () => {
    const id = `c-new-${Date.now()}`
    const memberRows = [
      { id: `${id}-owner`, name: currentAccount.name, role: '管理员', phone: currentAccount.phone },
      ...newGroupMembers.map((name, index) => ({
        id: `${id}-m-${index}`,
        name,
        role: '成员',
        phone: index === 0 ? '+86 177 0861 3923' : '+86 136 3241 5719',
      })),
    ]
    patchState((prev) => ({
      ...prev,
      activeConversationId: id,
      filterKey: 'all',
      conversations: [
        {
          id,
          accountId: currentAccount.id,
          type: 'group',
          title: newGroupName.trim() || 'New Project Delivery Group',
          subtitle: `群组 · ${memberRows.length} 人`,
          avatar: 'NG',
          avatarColor: '#008C7E',
          phone: currentAccount.phone,
          locality: '手动创建项目群',
          timezoneOffset: 8,
          online: true,
          labels: ['group'],
          unread: 0,
          pinned: false,
          muted: false,
          archived: false,
          lastAt: '刚刚',
          sortIndex: Date.now(),
          lastMessage: '系统: 群聊已创建',
        },
        ...prev.conversations,
      ],
      messages: {
        ...prev.messages,
        [id]: [{ id: `${id}-sys`, type: 'system', text: '群聊已创建', time: nowTime() }],
      },
      groups: {
        ...prev.groups,
        [id]: {
          id,
          description: '手动创建的项目协作群',
          owner: currentAccount.name,
          createdAt: '2026-06-04',
          members: memberRows,
          pendingRequests: [],
        },
      },
    }))
    setNewGroupOpen(false)
    message.success('已创建群聊')
  }

  const addContactConversation = (contact) => {
    if (!contact) return
    const id = `c-contact-${Date.now()}`
    patchState((prev) => ({
      ...prev,
      activeConversationId: id,
      filterKey: 'all',
      conversations: [
        {
          id,
          accountId: currentAccount.id,
          type: 'single',
          title: contact.name,
          remark: '',
          subtitle: contact.phone,
          avatar: contact.avatar,
          avatarColor: '#2f80ed',
          phone: contact.phone,
          locality: contact.region,
          timezoneOffset: currentAccount.region === 'Canada' ? -4 : 8,
          online: true,
          labels: ['all'],
          unread: 0,
          pinned: false,
          muted: false,
          archived: false,
          lastAt: '刚刚',
          sortIndex: Date.now(),
          lastMessage: '系统: 联系人已添加',
        },
        ...prev.conversations,
      ],
      messages: {
        ...prev.messages,
        [id]: [{ id: `${id}-sys`, type: 'system', text: `${contact.name} 已添加为联系人`, time: nowTime() }],
      },
    }))
    setContactSearch('')
    setNewContactOpen(false)
    message.success('已添加联系人')
  }

  const openAttachmentPicker = (type) => {
    setAttachmentPickerType(type)
    setSelectedAttachmentIds([])
  }

  const toggleAttachmentSelection = (fileId, checked) => {
    setSelectedAttachmentIds((ids) =>
      checked ? Array.from(new Set([...ids, fileId])) : ids.filter((id) => id !== fileId),
    )
  }

  const sendSelectedAttachments = () => {
    if (!activeConversation || !attachmentPickerType) return
    const selectedFiles = (ATTACHMENT_PICKER_FILES[attachmentPickerType] || [])
      .filter((file) => selectedAttachmentIds.includes(file.id))
    if (!selectedFiles.length) {
      message.warning('请先选择文件')
      return
    }
    const now = Date.now()
    const nextMessages = selectedFiles.map((file, index) => ({
      id: `m-upload-${attachmentPickerType}-${now}-${index}`,
      type: file.type,
      direction: 'out',
      sender: '我',
      text: file.name,
      meta: file.meta,
      time: nowTime(),
      status: 'delivered',
      sentAt: now + index,
    }))
    patchState((prev) => ({
      ...prev,
      messages: {
        ...prev.messages,
        [activeConversation.id]: [...(prev.messages[activeConversation.id] || []), ...nextMessages],
      },
      conversations: prev.conversations.map((item) =>
        item.id === activeConversation.id
          ? {
              ...item,
              lastMessage: `我: ${ATTACHMENT_LAST_MESSAGE[attachmentPickerType]}${selectedFiles.length > 1 ? ` ×${selectedFiles.length}` : ''}`,
              lastAt: '刚刚',
              sortIndex: Date.now(),
            }
          : item,
      ),
    }))
    setAttachmentPickerType(null)
    setSelectedAttachmentIds([])
    message.success(`已发送 ${selectedFiles.length} 个文件`)
  }

  const sendContactCard = (contact) => {
    if (!activeConversation || !contact) return
    const nextMsg = {
      id: `m-contact-${Date.now()}`,
      type: 'contact',
      direction: 'out',
      sender: '我',
      contact,
      text: `${contact.name} 联系人卡片`,
      time: nowTime(),
      status: 'delivered',
      sentAt: Date.now(),
    }
    patchState((prev) => ({
      ...prev,
      messages: {
        ...prev.messages,
        [activeConversation.id]: [...(prev.messages[activeConversation.id] || []), nextMsg],
      },
      conversations: prev.conversations.map((item) =>
        item.id === activeConversation.id
          ? { ...item, lastMessage: `我: ${contact.name} 联系人卡片`, lastAt: '刚刚', sortIndex: Date.now() }
          : item,
      ),
    }))
    setContactCardOpen(false)
    setContactCardSearch('')
  }

  const sendVoiceMessage = () => {
    if (!activeConversation) return
    const nextMsg = {
      id: `m-voice-${Date.now()}`,
      type: 'voice',
      direction: 'out',
      sender: '我',
      duration: `0:${String(recordSeconds).padStart(2, '0')}`,
      text: '语音消息',
      time: nowTime(),
      status: 'delivered',
      sentAt: Date.now(),
    }
    patchState((prev) => ({
      ...prev,
      messages: {
        ...prev.messages,
        [activeConversation.id]: [...(prev.messages[activeConversation.id] || []), nextMsg],
      },
      conversations: prev.conversations.map((item) =>
        item.id === activeConversation.id
          ? { ...item, lastMessage: '我: [语音]', lastAt: '刚刚', sortIndex: Date.now() }
          : item,
      ),
    }))
    setIsRecording(false)
    setRecordSeconds(1)
  }

  const composerPlusMenu = {
    items: [
      { key: 'file', label: '文档', icon: <FileTextOutlined /> },
      { key: 'album', label: '相册', icon: <PictureOutlined /> },
      { key: 'audio', label: '音频', icon: <AudioOutlined /> },
      { key: 'contact', label: '联系人卡片', icon: <UserAddOutlined /> },
    ],
    onClick: ({ key }) => {
      if (key === 'contact') {
        setContactCardOpen(true)
        return
      }
      openAttachmentPicker(key)
    },
  }

  const newChatMenu = {
    items: [
      { key: 'group', icon: <TeamOutlined />, label: '新建群组' },
      { key: 'contact', icon: <UserAddOutlined />, label: '添加联系人' },
    ],
    onClick: ({ key }) => {
      if (key === 'group') setNewGroupOpen(true)
      if (key === 'contact') {
        setContactAccountInput(`${currentAccount.name} · ${currentAccount.phone}`)
        setNewContactOpen(true)
      }
    },
  }

  const resetDemo = () => {
    setState(resetImState())
    setSearch('')
    setDraft('')
    setVisibleCount(PAGE_SIZE)
    message.success('演示数据已重置')
  }

  const logoutAccount = (accountId) => {
    const account = state.accounts.find((item) => item.id === accountId)
    if (!account) return
    if (state.accounts.length <= 1) {
      message.warning('至少需要保留一个 WhatsApp 账号')
      return
    }
    modal.confirm({
      title: '确认退出账号？',
      content: `退出后，${account.name} 将从当前 Demo 账号栏移除。`,
      okText: '确认退出',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        patchState((prev) => {
          const removedConversationIds = prev.conversations.filter((item) => item.accountId === accountId).map((item) => item.id)
          const accounts = prev.accounts.filter((item) => item.id !== accountId)
          const conversations = prev.conversations.filter((item) => item.accountId !== accountId)
          const nextAccountId = prev.currentAccountId === accountId ? accounts[0]?.id : prev.currentAccountId
          const nextActiveConversation =
            conversations.find((item) => item.accountId === nextAccountId && !item.archived)?.id ||
            conversations[0]?.id ||
            null
          return {
            ...prev,
            accounts,
            conversations,
            currentAccountId: nextAccountId,
            activeConversationId: removedConversationIds.includes(prev.activeConversationId) ? nextActiveConversation : prev.activeConversationId,
            messages: Object.fromEntries(Object.entries(prev.messages).filter(([id]) => !removedConversationIds.includes(id))),
            groups: Object.fromEntries(Object.entries(prev.groups).filter(([id]) => !removedConversationIds.includes(id))),
          }
        })
        message.success('账号已退出')
      },
    })
  }

  const createCustomList = () => {
    if (!newListName.trim()) {
      message.warning('请输入列表名称')
      return
    }
    const key = `custom-${Date.now()}`
    patchState((prev) => ({
      ...prev,
      accounts: prev.accounts.map((account) =>
        account.id === currentAccount.id
          ? { ...account, labels: [...account.labels, { key, label: newListName.trim() }] }
          : account,
      ),
      conversations: prev.conversations.map((conversation) =>
        newListConversationIds.includes(conversation.id)
          ? { ...conversation, labels: Array.from(new Set([...conversation.labels, key])) }
          : conversation,
      ),
      filterKey: key,
    }))
    setNewListName('')
    setNewListConversationIds([])
    setListSearch('')
    setNewListOpen(false)
    message.success('列表已创建')
  }

  const openAssignList = (conversation) => {
    const availableKeys = assignableLists.map((item) => item.key)
    setAssignConversationId(conversation.id)
    setAssignListKeys(conversation.labels.filter((key) => availableKeys.includes(key)))
    setAssignListOpen(true)
  }

  const saveAssignedLists = () => {
    if (!assignConversationId) return
    const availableKeys = assignableLists.map((item) => item.key)
    updateConversation(assignConversationId, (conversation) => ({
      ...conversation,
      labels: Array.from(new Set([
        ...conversation.labels.filter((key) => !availableKeys.includes(key)),
        ...assignListKeys,
      ])),
    }))
    setAssignListOpen(false)
    message.success('会话所属分组已更新')
  }

  const exitSelectMessages = () => {
    setSelectMessagesMode(false)
    setSelectedMessageIds([])
  }

  const toggleSelectedMessage = (messageId, checked) => {
    setSelectedMessageIds((ids) =>
      checked ? Array.from(new Set([...ids, messageId])) : ids.filter((id) => id !== messageId),
    )
  }

  const starSelectedMessages = () => {
    if (!activeConversation || !selectedMessageIds.length) return
    patchState((prev) => ({
      ...prev,
      messages: {
        ...prev.messages,
        [activeConversation.id]: (prev.messages[activeConversation.id] || []).map((item) =>
          selectedMessageIds.includes(item.id) ? { ...item, starred: true } : item,
        ),
      },
    }))
    message.success(`已将 ${selectedMessageIds.length} 条消息标为星标`)
  }

  const openForwardMessages = (messageIds = selectedMessageIds) => {
    if (!messageIds.length) {
      message.warning('请先选择消息')
      return
    }
    setSelectedMessageIds(messageIds)
    setForwardConversationIds([])
    setForwardSearch('')
    setForwardOpen(true)
  }

  const forwardSelectedMessages = () => {
    if (!activeConversation || !selectedMessageIds.length || !forwardConversationIds.length) return
    patchState((prev) => {
      const sourceMessages = (prev.messages[activeConversation.id] || []).filter((item) => selectedMessageIds.includes(item.id))
      const messages = { ...prev.messages }
      forwardConversationIds.forEach((conversationId) => {
        const forwardedMessages = sourceMessages.map((item, index) => ({
          ...item,
          id: `forward-${Date.now()}-${conversationId}-${index}`,
          direction: 'out',
          sender: '我',
          forwarded: true,
          status: 'delivered',
          time: nowTime(),
          sentAt: Date.now(),
        }))
        messages[conversationId] = [...(messages[conversationId] || []), ...forwardedMessages]
      })
      return {
        ...prev,
        messages,
        conversations: prev.conversations.map((conversation) =>
          forwardConversationIds.includes(conversation.id)
            ? {
                ...conversation,
                lastMessage: `我: [已转发] ${sourceMessages[sourceMessages.length - 1]?.text || '消息'}`,
                lastAt: '刚刚',
                sortIndex: Date.now(),
              }
            : conversation,
        ),
      }
    })
    setForwardOpen(false)
    setForwardConversationIds([])
    exitSelectMessages()
    message.success('消息已转发')
  }

  const locateChatMessage = (messageId) => {
    setChatSearchOpen(false)
    setHighlightedMessageId(messageId)
    window.setTimeout(() => {
      document.getElementById(`scrm-message-${messageId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 180)
    window.setTimeout(() => setHighlightedMessageId(null), 2200)
  }

  const cancelPinnedMessage = (messageId = activePinnedMessage?.id) => {
    if (!activeConversation || !messageId) return
    patchState((prev) => ({
      ...prev,
      messages: {
        ...prev.messages,
        [activeConversation.id]: (prev.messages[activeConversation.id] || []).map((item) =>
          item.id === messageId ? { ...item, pinned: false, pinnedAt: null } : item,
        ),
      },
    }))
  }

  const downloadAttachmentPreview = () => {
    if (!attachmentPreview) return
    message.success(`已开始下载 ${attachmentPreview.text}`)
  }

  const downloadChatRecordAttachment = (item) => {
    message.success(`已开始下载 ${item.text}`)
  }

  const locateAttachmentPreview = () => {
    if (!attachmentPreview?.id) return
    const targetId = attachmentPreview.id
    setAttachmentPreview(null)
    locateChatMessage(targetId)
  }

  const openMessageReceipt = (item) => {
    setReceiptMessage(item)
    setReceiptOpen(true)
  }

  const completeAccountLogin = () => {
    const id = `wa-new-${Date.now()}`
    patchState((prev) => ({
      ...prev,
      currentAccountId: id,
      activeConversationId: prev.activeConversationId,
      accounts: [
        ...prev.accounts,
        {
          id,
          name: 'New WhatsApp Account',
          shortName: 'NW',
          phone: '+1 900 128 6655',
          region: '新增账号',
          status: 'online',
          avatarColor: '#1f8f4d',
          labels: prev.accounts[0]?.labels || currentAccount.labels,
        },
      ],
    }))
    setAccountLoginOpen(false)
    message.success('账号已完成云端登录')
  }

  const conversationMenu = (conversation = activeConversation, source = 'chat') => ({
    items: [
      { key: 'info', icon: <InfoCircleOutlined />, label: conversation?.type === 'group' ? '群聊信息' : '联系人信息' },
      source === 'chat' ? { key: 'search', icon: <SearchOutlined />, label: '搜索聊天内容' } : null,
      source === 'chat' ? { key: 'select', icon: <CheckSquareOutlined />, label: '选择消息' } : null,
      source === 'chat' ? { type: 'divider' } : null,
      { key: 'unread', icon: <BellOutlined />, label: conversation?.unread > 0 ? '标记为已读' : '标记未读' },
      { key: 'pin', icon: <PushpinOutlined />, label: conversation?.pinned ? '取消置顶' : '置顶会话' },
      { key: 'mute', icon: <BellOutlined />, label: conversation?.muted ? '取消静音' : '静音通知' },
      { key: 'archive', icon: <FolderOpenOutlined />, label: conversation?.archived ? '取消归档聊天' : '归档聊天' },
      { type: 'divider' },
      { key: 'list', icon: <FolderOpenOutlined />, label: '更改分组' },
      conversation?.type === 'single' ? { key: 'startGroup', icon: <TeamOutlined />, label: '发起群聊' } : null,
    ].filter(Boolean),
    onClick: ({ key, domEvent }) => {
      domEvent?.stopPropagation?.()
      if (key === 'info') setInfoOpen(true)
      if (key === 'search') {
        setChatSearchQuery('')
        setChatSearchTab('text')
        setChatSearchOpen(true)
      }
      if (key === 'select') {
        setSelectMessagesMode(true)
        setSelectedMessageIds([])
      }
      if (key === 'unread') toggleUnread(conversation)
      if (key === 'pin') togglePinned(conversation)
      if (key === 'mute') toggleMuted(conversation)
      if (key === 'archive') toggleArchived(conversation)
      if (key === 'list') openAssignList(conversation)
      if (key === 'startGroup') startGroupFromConversation(conversation)
    },
  })

  const renderEditableGroupField = (field, label, value) => {
    const editing = editingGroupField === field
    return (
      <div className="scrm-editable-field">
        <span className="scrm-editable-label">{label}</span>
        <div className="scrm-editable-value">
          {editing ? (
            <>
              <Input
                size="small"
                value={groupFieldDraft}
                onChange={(event) => setGroupFieldDraft(event.target.value)}
                onPressEnter={saveGroupFieldEdit}
              />
              <Button size="small" type="primary" onClick={saveGroupFieldEdit}>保存</Button>
              <Button size="small" onClick={() => setEditingGroupField(null)}>取消</Button>
            </>
          ) : (
            <>
              <strong>{value || '-'}</strong>
              <Button
                size="small"
                type="text"
                icon={<EditOutlined />}
                onClick={() => startGroupFieldEdit(field, value)}
              />
            </>
          )}
        </div>
      </div>
    )
  }

  const renderReadonlyGroupField = (label, value) => (
    <div className="scrm-editable-field is-readonly">
      <span className="scrm-editable-label">{label}</span>
      <div className="scrm-editable-value">
        <strong>{value || '-'}</strong>
      </div>
    </div>
  )

  const openSideTool = (key) => {
    if (key === 'conversation') {
      setActiveToolPanel((panel) => (panel === 'conversation' ? null : 'conversation'))
    }
  }

  return (
    <div
      className={`scrm-shell ${activeToolPanel ? 'has-tool-panel' : ''}`}
      style={{
        '--conversation-width': `${conversationWidth}px`,
        '--tool-panel-width': `${toolPanelWidth}px`,
        '--tool-panel-column': activeToolPanel ? `${toolPanelWidth}px` : '0px',
      }}
    >
      <aside className="scrm-account-rail">
        <div className="scrm-account-rail-title">账号</div>
        <div className="scrm-account-list">
          <Tooltip title="新增账号" placement="right">
            <button className="scrm-account-add" onClick={() => setAccountLoginOpen(true)}>
              <PlusOutlined />
            </button>
          </Tooltip>
          {state.accounts.map((account) => {
            const unread = accountUnread(state, account.id)
            const active = account.id === currentAccount.id
            return (
              <button
                key={account.id}
                className={`scrm-account-button ${active ? 'is-active' : ''} ${account.blinking ? 'is-blinking' : ''} ${account.status === 'offline' ? 'is-offline' : ''}`}
                onClick={() => switchAccount(account.id)}
              >
                <Badge count={unread} size="small" offset={[-4, 4]}>
                  <Avatar size={42} style={{ background: account.avatarColor }}>{account.shortName}</Avatar>
                </Badge>
                <span className="scrm-account-expanded">
                  <strong>{account.name}</strong>
                  <em>{account.phone}</em>
                </span>
                <Tooltip title="退出账号">
                  <span
                    className="scrm-account-logout"
                    onClick={(event) => {
                      event.stopPropagation()
                      logoutAccount(account.id)
                    }}
                  >
                    <DisconnectOutlined />
                  </span>
                </Tooltip>
              </button>
            )
          })}
        </div>
        <Space orientation="vertical" size={8} className="scrm-account-tools">
          <Tooltip title="模拟非当前账号收到新消息">
            <Button shape="circle" icon={<BellOutlined />} onClick={simulateIncoming} />
          </Tooltip>
          <Tooltip title="模拟当前账号掉线">
            <Button shape="circle" danger icon={<DisconnectOutlined />} onClick={setCurrentOffline} />
          </Tooltip>
          <Tooltip title="重置演示数据">
            <Button shape="circle" icon={<ReloadOutlined />} onClick={resetDemo} />
          </Tooltip>
        </Space>
      </aside>

      <section className="scrm-conversation-pane">
        <div className="scrm-search-bar">
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索客户名称/备注名/手机号/群名"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            allowClear
            className="scrm-search"
          />
          <Dropdown menu={newChatMenu} trigger={['click']} placement="bottomRight">
            <Button className="scrm-new-chat-button" icon={<PlusOutlined />} aria-label="新聊天" />
          </Dropdown>
        </div>
        <div className="scrm-filter-row">
          {currentAccount.labels.map((label) => (
            <button
              key={label.key}
              className={`scrm-filter-chip ${state.filterKey === label.key ? 'is-active' : ''}`}
              onClick={() => setFilter(label.key)}
            >
              {FILTER_ICONS[label.key]}
              <span>{label.label}</span>
            </button>
          ))}
          <Tooltip title="创建新列表">
            <button className="scrm-filter-add" onClick={() => setNewListOpen(true)}>
              <PlusOutlined />
            </button>
          </Tooltip>
        </div>
        <button
          className={`scrm-archive-entry ${state.filterKey === 'archived' ? 'is-active' : ''}`}
          onClick={() => setFilter('archived')}
        >
          <FolderOpenOutlined />
          <span>已归档</span>
          <em>{archivedConversationCount || ''}</em>
        </button>
        {state.filterKey === 'archived' && (
          <div className="scrm-archive-notice">
            <strong>已归档会话</strong>
            <span>归档会话收到新消息后仍保持归档状态，可从会话菜单取消归档。</span>
          </div>
        )}
        <div className="scrm-conversation-list" onScroll={handleListScroll}>
          {visibleConversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`scrm-conversation-card ${activeConversation?.id === conversation.id ? 'is-active' : ''} ${conversation.archived ? 'is-archived' : ''} ${conversation.aiTouched ? 'is-ai-touched' : ''} ${conversation.aiManaged ? 'is-ai-managed' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => selectConversation(conversation.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  selectConversation(conversation.id)
                }
              }}
            >
              <span className="scrm-conversation-avatar-wrap">
                <Avatar size={44} style={{ background: conversation.avatarColor }}>{conversation.avatar}</Avatar>
                {conversation.aiTouched && (
                  <span className="scrm-ai-avatar-badge">
                    <RobotOutlined />
                  </span>
                )}
              </span>
              <span className="scrm-conversation-body">
                <span className="scrm-conversation-line">
                  <span className="scrm-conversation-name">
                    <strong>{conversation.title}</strong>
                    {conversation.type === 'single' && conversation.remark && (
                      <span className="scrm-contact-remark">{conversation.remark}</span>
                    )}
                  </span>
                  <em>{conversation.lastAt}</em>
                </span>
                {conversationListSubtitle(conversation) && (
                  <span className="scrm-conversation-sub">{conversationListSubtitle(conversation)}</span>
                )}
                {conversation.aiManaged && (
                  <span className="scrm-ai-reception-line">
                    <RobotOutlined />
                    <span>AI接待中</span>
                  </span>
                )}
                <span className="scrm-conversation-last">{conversationListLastMessage(conversation)}</span>
              </span>
              <span className="scrm-conversation-flags">
                {conversation.pinned && <PushpinOutlined />}
                {conversation.muted && <BellOutlined className="is-muted" />}
                {conversation.unread > 0 && <Badge count={conversation.unread} size="small" />}
              </span>
              <Dropdown menu={conversationMenu(conversation, 'list')} trigger={['click']} placement="bottomRight">
                <Button
                  className="scrm-conversation-more"
                  size="small"
                  icon={<MoreOutlined />}
                  onClick={(event) => event.stopPropagation()}
                />
              </Dropdown>
            </div>
          ))}
          {!visibleConversations.length && (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={state.filterKey === 'archived' ? '暂无已归档会话' : '暂无匹配会话'}
            />
          )}
          {visibleConversations.length < filteredConversations.length && (
            <div className="scrm-load-more">向下滑动加载更多 · {visibleConversations.length}/{filteredConversations.length}</div>
          )}
          {visibleConversations.length >= filteredConversations.length && filteredConversations.length > PAGE_SIZE && (
            <div className="scrm-load-more is-end">已加载当前标签下全部会话</div>
          )}
        </div>
      </section>

      <div
        className={`scrm-resizer ${dragging ? 'is-dragging' : ''}`}
        onMouseDown={() => setDragging(true)}
        title="拖拽调整会话列表宽度"
      />

      <main className="scrm-chat-pane">
        {activeConversation ? (
          <>
            <header className="scrm-chat-head">
              <div className="scrm-chat-title-block">
                <button className="scrm-chat-avatar-button" onClick={() => setInfoOpen(true)}>
                  <Avatar size={42} src={activeConversation.avatarUrl} style={{ background: activeConversation.avatarColor }}>{activeConversation.avatar}</Avatar>
                  {activeConversation.type === 'single' && (
                    <Tooltip title={`${currentAccount.name} · ${currentAccount.phone}`}>
                      <span className="scrm-chat-account-badge">{currentAccount.shortName}</span>
                    </Tooltip>
                  )}
                </button>
                <div>
                  {activeConversation.type === 'group' ? (
                    <div className="scrm-group-title-line">
                      <div className="scrm-chat-title">{activeConversation.title}</div>
                      <Tag>群组</Tag>
                      <button className="scrm-group-members-trigger" onClick={() => setInfoOpen(true)}>
                        成员 ({sortedGroupMembers.length})
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="scrm-contact-title-line">
                        <div className="scrm-chat-title">{activeConversation.title}</div>
                        {activeConversation.remark && <span className="scrm-contact-remark">{activeConversation.remark}</span>}
                      </div>
                      <div className="scrm-chat-subtitle">
                        <Tooltip title="地区/时间">
                          <span className="scrm-contact-meta-item">
                            <EnvironmentOutlined />
                            {formatRegion(activeConversation.locality)}
                          </span>
                        </Tooltip>
                        <Tooltip title="当地时间">
                          <span className="scrm-contact-meta-item">
                            <ClockCircleOutlined />
                            {formatLocalDateTime(activeConversation.timezoneOffset)}
                          </span>
                        </Tooltip>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <Space size={8} className="scrm-chat-actions">
                <div className="scrm-chat-toolstrip">
                  <Button className="scrm-chat-tool-button is-icon-only" type="text" icon={<SearchOutlined />} onClick={openChatRecordSearch} />
                  <Button className="scrm-chat-tool-button" type="text" icon={<GlobalOutlined />}>
                    翻译
                  </Button>
                  <span className="scrm-chat-tool-button scrm-ai-hosting-control">
                    <span>AI 托管</span>
                    <Switch
                      size="small"
                      checked={!!activeConversation.aiManaged}
                      onChange={toggleAiReception}
                    />
                  </span>
                  <Button className="scrm-chat-tool-button is-transfer" type="text" icon={<UserSwitchOutlined />} onClick={openLeadTransfer}>
                    转派
                  </Button>
                </div>
                <Dropdown menu={conversationMenu(activeConversation)} trigger={['click']} placement="bottomRight">
                  <Button icon={<MoreOutlined />} />
                </Dropdown>
              </Space>
            </header>

            {activePinnedMessage && (
              <div className="scrm-pinned-message-bar">
                <PushpinOutlined />
                <button
                  className="scrm-pinned-message-main"
                  onClick={() => locateChatMessage(activePinnedMessage.id)}
                >
                  <strong>{activePinnedMessage.sender || '我'}: </strong>
                  <span>{activePinnedMessage.text || activePinnedMessage.meta || '[非文本消息]'}</span>
                </button>
                <Dropdown
                  menu={{
                    items: [
                      { key: 'unpin', icon: <StopOutlined />, label: '取消置顶' },
                      { key: 'locate', icon: <SendOutlined />, label: '前往消息' },
                    ],
                    onClick: ({ key }) => {
                      if (key === 'unpin') cancelPinnedMessage(activePinnedMessage.id)
                      if (key === 'locate') locateChatMessage(activePinnedMessage.id)
                    },
                  }}
                  trigger={['click']}
                  placement="bottomRight"
                >
                  <Button type="text" icon={<DownOutlined />} />
                </Dropdown>
              </div>
            )}

            <div className="scrm-message-stream">
              {activeMessages.map((item) => (
                <MessageBubble
                  key={item.id}
                  item={item}
                  isGroup={activeConversation.type === 'group'}
                  onRetry={retryMessage}
                  onAction={handleMessageAction}
                  selectMode={selectMessagesMode && item.type !== 'system'}
                  selected={selectedMessageIds.includes(item.id)}
                  onSelect={toggleSelectedMessage}
                  highlighted={highlightedMessageId === item.id}
                  onOpenReceipt={openMessageReceipt}
                  onPreview={setAttachmentPreview}
                  onToggleVoice={toggleVoicePlayback}
                  playingVoiceId={playingVoiceId}
                />
              ))}
            </div>

            {selectMessagesMode && (
              <div className="scrm-message-selection-bar">
                <Button type="text" icon={<CloseCircleOutlined />} onClick={exitSelectMessages} />
                <strong>已选 {selectedMessageIds.length} 条</strong>
                <span />
                <Tooltip title="标为星标">
                  <Button type="text" icon={<StarOutlined />} onClick={starSelectedMessages} disabled={!selectedMessageIds.length} />
                </Tooltip>
                <Tooltip title="转发">
                  <Button type="text" icon={<SendOutlined />} onClick={() => openForwardMessages()} disabled={!selectedMessageIds.length} />
                </Tooltip>
              </div>
            )}

            <footer className={`scrm-composer ${selectMessagesMode ? 'is-hidden' : ''}`}>
              {quotedMessage && (
                <div className="scrm-composer-quote">
                  <div>
                    <strong>{quotedMessage.sender}</strong>
                    <span>{activeConversation.phone}</span>
                    <p>{quotedMessage.text || quotedMessage.meta || '[非文本消息]'}</p>
                  </div>
                  <Button type="text" icon={<CloseCircleOutlined />} onClick={() => setQuotedMessage(null)} />
                </div>
              )}
              {isRecording ? (
                <div className="scrm-voice-recorder">
                  <Button type="text" icon={<DeleteOutlined />} onClick={() => {
                    setIsRecording(false)
                    setRecordSeconds(1)
                  }} />
                  <span className="scrm-record-dot" />
                  <strong>0:{String(recordSeconds).padStart(2, '0')}</strong>
                  <span className="scrm-record-wave" />
                  <Button type="text" icon={<PauseOutlined />} />
                  <span className="scrm-record-time">1</span>
                  <Button type="primary" shape="circle" icon={<SendOutlined />} onClick={sendVoiceMessage} />
                </div>
              ) : activeConversation.aiManaged ? (
                <div className="scrm-ai-managed-composer">
                  <div className="scrm-composer-row scrm-ai-managed-input-row" aria-hidden="true">
                    <Button type="text" icon={<PlusOutlined />} tabIndex={-1} />
                    <Button type="text" icon={<SmileOutlined />} tabIndex={-1} />
                    <Input.TextArea
                      placeholder="输入消息"
                      autoSize={{ minRows: 1, maxRows: 4 }}
                      tabIndex={-1}
                      readOnly
                    />
                    <Button type="text" icon={<AudioOutlined />} tabIndex={-1} />
                  </div>
                  <div className="scrm-ai-managed-mask">
                    <Button type="primary" onClick={interveneAiConversation}>
                      介入会话
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="scrm-composer-row">
                  <Dropdown menu={composerPlusMenu} trigger={['click']} placement="topLeft">
                    <Button type="text" icon={<PlusOutlined />} />
                  </Dropdown>
                  <Popover
                    trigger="click"
                    placement="topLeft"
                    content={(
                      <div className="scrm-emoji-panel">
                        <Input prefix={<SearchOutlined />} placeholder="搜索表情符号" />
                        <div className="scrm-emoji-grid">
                          {STICKER_OPTIONS.map((emoji) => (
                            <button key={emoji} onClick={() => setDraft((value) => `${value}${emoji}`)}>
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  >
                    <Button type="text" icon={<SmileOutlined />} />
                  </Popover>
                  <Input.TextArea
                    ref={composerInputRef}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="输入消息"
                    autoSize={{ minRows: 1, maxRows: 3 }}
                    onPressEnter={(event) => {
                      if (!event.shiftKey) {
                        event.preventDefault()
                        sendMessage()
                      }
                    }}
                  />
                  {draft.trim() ? (
                    <Button type="primary" shape="circle" icon={<SendOutlined />} onClick={sendMessage} disabled={isOffline} />
                  ) : (
                    <Button type="text" icon={<AudioOutlined />} onClick={() => {
                      setRecordSeconds(1)
                      setIsRecording(true)
                    }} disabled={isOffline} />
                  )}
                </div>
              )}
            </footer>

            {isOffline && (
              <div className="scrm-offline-mask">
                <div className="scrm-offline-card">
                  <DisconnectOutlined />
                  <h2>当前 WhatsApp 账号已掉线</h2>
                  <p>{currentAccount.name} 需要重新扫码登录后才能继续收发消息。</p>
                  <Space>
                    <Button type="primary" icon={<ReloadOutlined />} onClick={reconnectCurrent}>
                      重新扫码登录
                    </Button>
                    <Button onClick={() => {
                      const online = state.accounts.find((item) => item.status === 'online')
                      if (online) switchAccount(online.id)
                    }}>
                      切换在线账号
                    </Button>
                  </Space>
                </div>
              </div>
            )}
          </>
        ) : (
          <Empty description="请选择会话" />
        )}
      </main>

      <ScrmToolSidePanel
        title="会话管理"
        open={activeToolPanel === 'conversation'}
        resizing={toolPanelDragging}
        onResizeStart={() => {
          if (activeToolPanel === 'conversation') setToolPanelDragging(true)
        }}
        onClose={() => setActiveToolPanel(null)}
      />

      <ScrmSideToolRail activeKey={activeToolPanel} onOpen={openSideTool} />

      <Drawer
        title="聊天记录"
        open={chatSearchOpen}
        onClose={() => setChatSearchOpen(false)}
        width={420}
        className="scrm-chat-search-drawer"
      >
        <div className="scrm-chat-search-panel">
          <Tabs
            className="scrm-chat-record-tabs"
            activeKey={chatSearchTab}
            onChange={(key) => {
              setChatSearchTab(key)
              setChatSearchQuery('')
            }}
            items={CHAT_RECORD_TABS}
          />

          {chatSearchTab === 'text' && (
            <>
              <Input
                className="scrm-chat-search-input"
                suffix={<SearchOutlined />}
                placeholder="搜索"
                value={chatSearchQuery}
                onChange={(event) => setChatSearchQuery(event.target.value)}
                allowClear
                autoFocus
              />
              <div className="scrm-chat-date-row">
                <button type="button">开始日期</button>
                <span>-</span>
                <button type="button">
                  结束日期
                  <CalendarOutlined />
                </button>
              </div>
              <div className="scrm-chat-search-results">
                {chatSearchResults.map((item) => (
                  <div className="scrm-chat-search-result" key={item.id}>
                    <span>
                      <strong>{item.sender || (item.direction === 'out' ? '我' : activeConversation?.title)}</strong>
                      <em>{item.text || item.meta || '[非文本消息]'}</em>
                      <time>{item.time}</time>
                    </span>
                    <Tooltip title="定位到会话">
                      <Button
                        className="scrm-locate-message"
                        icon={<EnvironmentOutlined />}
                        onClick={() => locateChatMessage(item.id)}
                      />
                    </Tooltip>
                  </div>
                ))}
                {chatSearchQuery.trim() && !chatSearchResults.length && (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="未找到匹配消息" />
                )}
              </div>
            </>
          )}

          {chatSearchTab === 'media' && (
            <div className="scrm-chat-media-panel">
              <div className="scrm-record-month">本月</div>
              <div className="scrm-media-grid">
                {mediaSearchResults.map((item) => (
                  <div className="scrm-media-card" key={item.id}>
                    <button className={`scrm-media-thumb is-${item.type}`} type="button" onClick={() => setAttachmentPreview(item)}>
                      {TYPE_ICON[item.type]}
                      <span>{item.type === 'video' ? '视频' : '图片'}</span>
                    </button>
                    <div className="scrm-media-card-meta">
                      <span>{item.time}</span>
                      <Tooltip title="定位到会话">
                        <Button size="small" type="text" icon={<EnvironmentOutlined />} onClick={() => locateChatMessage(item.id)} />
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
              {!mediaSearchResults.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无图片/视频" />}
              {!!mediaSearchResults.length && <div className="scrm-record-end"><span>没有更多了</span></div>}
            </div>
          )}

          {chatSearchTab === 'attachment' && (
            <div className="scrm-chat-attachment-panel">
              {attachmentSearchResults.map((item) => (
                <div className="scrm-attachment-record" key={item.id}>
                  <button className="scrm-attachment-record-main" type="button" onClick={() => setAttachmentPreview(item)}>
                    <span className="scrm-attachment-record-icon">{TYPE_ICON[item.type] || <FileTextOutlined />}</span>
                    <span>
                      <strong>{item.text}</strong>
                      <em>{item.sender || (item.direction === 'out' ? '我' : activeConversation?.title)} {item.time}</em>
                    </span>
                  </button>
                  <Dropdown
                    trigger={['click']}
                    placement="bottomRight"
                    menu={{
                      items: [
                        { key: 'locate', icon: <EnvironmentOutlined />, label: '跳转至会话' },
                        { key: 'download', icon: <DownloadOutlined />, label: '下载' },
                      ],
                      onClick: ({ key }) => {
                        if (key === 'locate') locateChatMessage(item.id)
                        if (key === 'download') downloadChatRecordAttachment(item)
                      },
                    }}
                  >
                    <Button className="scrm-attachment-record-more" size="small" type="text" icon={<MoreOutlined />} />
                  </Dropdown>
                </div>
              ))}
              {!attachmentSearchResults.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无附件" />}
              {!!attachmentSearchResults.length && <div className="scrm-record-end"><span>没有更多了</span></div>}
            </div>
          )}
        </div>
      </Drawer>

      <Drawer
        title="信息详情"
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        width={460}
        className="scrm-receipt-drawer"
      >
        {receiptMessage && (
          <div className="scrm-receipt-panel">
            <div className="scrm-receipt-preview">
              <div className="im-bubble">
                <MessageContent item={receiptMessage} />
              </div>
              <span>{receiptMessage.time}</span>
            </div>

            <section className="scrm-receipt-section">
              <div className="scrm-receipt-section-title">
                <span><CheckCircleOutlined /> 已读</span>
                <em>{receiptReadMembers.length ? `还有 ${receiptDeliveredMembers.length} 人未读` : '尚未已读'}</em>
              </div>
              {receiptReadMembers.length ? receiptReadMembers.map((member) => (
                <div className="scrm-receipt-member" key={`read-${member.id}`}>
                  <Avatar size={38}>{member.name?.slice(0, 1)}</Avatar>
                  <span>
                    <strong>{member.name}</strong>
                    <em>{receiptMessage.time} · {member.phone}</em>
                  </span>
                </div>
              )) : <div className="scrm-receipt-empty">-</div>}
            </section>

            <section className="scrm-receipt-section">
              <div className="scrm-receipt-section-title">
                <span><CheckCircleOutlined /> 已送达</span>
                <em>{receiptDeliveredMembers.length ? `${receiptDeliveredMembers.length} 人尚未已读` : '全部已读'}</em>
              </div>
              {receiptDeliveredMembers.length ? receiptDeliveredMembers.map((member) => (
                <div className="scrm-receipt-member" key={`delivered-${member.id}`}>
                  <Avatar size={38}>{member.name?.slice(0, 1)}</Avatar>
                  <span>
                    <strong>{member.name}</strong>
                    <em>{receiptMessage.time} · {member.phone}</em>
                  </span>
                </div>
              )) : <div className="scrm-receipt-empty">-</div>}
            </section>
          </div>
        )}
      </Drawer>

      <Modal
        title="编辑消息"
        open={editMessageOpen}
        onCancel={() => {
          setEditMessageOpen(false)
          setEditMessageTarget(null)
          setEditMessageDraft('')
        }}
        onOk={saveEditedMessage}
        okText="保存修改"
        cancelText="取消"
        width={560}
        className="scrm-edit-message-modal"
      >
        <div className="scrm-edit-message">
          <div className="scrm-edit-message-preview">
            <div className="im-bubble">
              <MessageContent item={{ ...editMessageTarget, text: editMessageDraft || editMessageTarget?.text }} />
            </div>
          </div>
          <Input.TextArea
            value={editMessageDraft}
            onChange={(event) => setEditMessageDraft(event.target.value)}
            autoSize={{ minRows: 2, maxRows: 5 }}
            placeholder="编辑消息内容"
            onPressEnter={(event) => {
              if (!event.shiftKey) {
                event.preventDefault()
                saveEditedMessage()
              }
            }}
          />
        </div>
      </Modal>

      <Modal
        title="线索分配"
        open={leadTransferOpen}
        onCancel={() => setLeadTransferOpen(false)}
        onOk={confirmLeadTransfer}
        okText="确认分配"
        cancelText="取消"
        okButtonProps={{ disabled: !leadTransferUser }}
        className="scrm-lead-transfer-modal"
      >
        {activeConversation && (
          <Space direction="vertical" size={16} className="scrm-lead-transfer-content">
            <div className="scrm-lead-transfer-brief">
              <div>
                <span>{activeConversation.type === 'group' ? '群组线索' : '客户线索'}</span>
                <strong>{activeConversation.title}</strong>
              </div>
              <p>{conversationListLastMessage(activeConversation) || '当前会话待转派给销售继续跟进。'}</p>
            </div>
            <label className="scrm-lead-transfer-field">
              <span>被分配人</span>
              <Select
                showSearch
                value={leadTransferUser}
                options={salesOptions}
                onChange={setLeadTransferUser}
                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              />
            </label>
          </Space>
        )}
      </Modal>

      <Modal
        title="撤回消息"
        open={recallOpen}
        onCancel={() => {
          setRecallOpen(false)
          setRecallTarget(null)
        }}
        footer={null}
        width={460}
        className="scrm-create-chat-modal"
      >
        <div className="scrm-recall-options">
          <div className="scrm-recall-preview">{recallTarget?.text || recallTarget?.meta || '[非文本消息]'}</div>
          <button onClick={() => executeRecall('everyone')}>
            <strong>双方撤回</strong>
            <span>2 分钟内可撤回，成功后双方均显示“此消息已撤回”。</span>
          </button>
          <button onClick={() => executeRecall('me')}>
            <strong>仅我们删除</strong>
            <span>仅从当前 SCRM 聊天记录中删除，对方仍可看到此消息。</span>
          </button>
        </div>
      </Modal>

      <Modal
        title="附件预览"
        open={!!attachmentPreview}
        onCancel={() => setAttachmentPreview(null)}
        footer={[
          <Button key="close" onClick={() => setAttachmentPreview(null)}>关闭</Button>,
          <Button key="locate" icon={<EnvironmentOutlined />} onClick={locateAttachmentPreview}>
            跳转至会话
          </Button>,
          <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={downloadAttachmentPreview}>
            下载
          </Button>,
        ]}
        width={620}
        className="scrm-attachment-preview-modal"
      >
        {attachmentPreview && (
          <div className={`scrm-attachment-preview is-${attachmentPreview.type}`}>
            <div className="scrm-preview-visual">
              {TYPE_ICON[attachmentPreview.type] || <FileTextOutlined />}
            </div>
            <strong>{attachmentPreview.text}</strong>
            <span>{attachmentPreview.meta || '点击附件后可在此预览内容'}</span>
            {attachmentPreview.type === 'image' && <div className="scrm-preview-image-placeholder">图片预览区域</div>}
            {attachmentPreview.type === 'video' && <div className="scrm-preview-video-placeholder">视频预览区域</div>}
            {attachmentPreview.type === 'location' && <div className="scrm-preview-map-placeholder">位置地图预览</div>}
          </div>
        )}
      </Modal>

      <Drawer
        title={activeConversation?.type === 'group' ? '群聊管理' : '联系人信息'}
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        size="large"
        destroyOnClose={false}
      >
        {activeConversation?.type === 'group' && activeGroup ? (
          <div className="scrm-info-drawer">
            <div className="scrm-group-edit-card">
              <div className="scrm-editable-field">
                <span className="scrm-editable-label">群头像</span>
                <div className="scrm-editable-value">
                  <button className="scrm-avatar-edit" onClick={() => setAvatarUploadOpen(true)}>
                    <Avatar
                      size={56}
                      src={activeConversation.avatarUrl}
                      style={{ background: activeConversation.avatarColor }}
                    >
                      {activeConversation.avatar}
                    </Avatar>
                    <span>点击上传头像</span>
                  </button>
                </div>
              </div>
              {renderEditableGroupField('title', '群名', activeConversation.title)}
              {renderEditableGroupField('remark', '群备注', activeGroup.description)}
              {renderReadonlyGroupField('创建时间', activeGroup.createdAt)}
            </div>

            <div className="scrm-drawer-section-title">
              <span>成员 ({activeGroup.members.length})</span>
              <Button size="small" type="primary" icon={<UserAddOutlined />} onClick={() => setAddMemberOpen(true)}>
                添加成员
              </Button>
            </div>
            <div className="scrm-member-list">
              {sortedGroupMembers.map((member, index) => {
                const isAdmin = member.effectiveRole === '管理员'
                const location = memberLocation(member, index)
                const online = index % 3 !== 2
                const menu = {
                  items: [
                    { key: 'admin', icon: <UserSwitchOutlined />, label: '设为群组管理员' },
                    { key: 'remove', icon: <UserDeleteOutlined />, label: '踢出群组', danger: true },
                  ],
                  onClick: ({ key }) => {
                    if (key === 'admin') promoteGroupMember(member)
                    if (key === 'remove') removeGroupMember(member)
                  },
                }
                return (
                <div className="scrm-member-row" key={member.id}>
                  <Avatar size={34}>{member.name.slice(0, 1)}</Avatar>
                  <span>
                    <strong>{member.name}</strong>
                    <em><PhoneOutlined /> {member.phone}</em>
                  </span>
                  <div className="scrm-member-local-status">
                    <span className={`scrm-member-presence ${online ? 'online' : 'offline'}`}>
                      {online ? '在线' : '离线'} · {location.region}
                    </span>
                    <time>{formatLocalDateTime(location.offset)}</time>
                  </div>
                  <div className="scrm-member-actions">
                    {isAdmin && <Tag color="blue">管理员</Tag>}
                    {!isAdmin && (
                      <Dropdown menu={menu} trigger={['click']} placement="bottomRight">
                        <Button size="small" type="text" icon={<MoreOutlined />} />
                      </Dropdown>
                    )}
                  </div>
                </div>
                )
              })}
            </div>
            <div className="scrm-drawer-section-title">
              <span>入群申请</span>
            </div>
            {activeGroup.pendingRequests.length ? (
              activeGroup.pendingRequests.map((request) => (
                <div className="scrm-request-row" key={request.id}>
                  <div>
                    <strong>{request.name}</strong>
                    <span>{request.phone} · {request.reason}</span>
                  </div>
                  <Space>
                    <Button size="small" type="primary" className="scrm-request-approve" onClick={() => approveRequest(request.id)}>同意</Button>
                    <Button size="small">拒绝</Button>
                  </Space>
                </div>
              ))
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无申请" />
            )}
            <Button block danger icon={<CloseCircleOutlined />}>退出群聊</Button>
          </div>
        ) : (
          <div className="scrm-info-drawer">
            <div className="scrm-contact-profile">
              <Avatar size={56} style={{ background: activeConversation?.avatarColor }}>{activeConversation?.avatar}</Avatar>
              <div>
                {editingContactName ? (
                  <div className="scrm-contact-name-editor">
                    <Input
                      value={contactNameDraft}
                      autoFocus
                      onChange={(event) => setContactNameDraft(event.target.value)}
                      onPressEnter={saveContactName}
                    />
                    <Button type="primary" size="small" onClick={saveContactName}>保存</Button>
                    <Button size="small" onClick={() => {
                      setContactNameDraft(activeConversation?.title || '')
                      setEditingContactName(false)
                    }}>取消</Button>
                  </div>
                ) : (
                  <button
                    className="scrm-contact-name-display"
                    onClick={() => {
                      setContactNameDraft(activeConversation?.title || '')
                      setEditingContactName(true)
                    }}
                  >
                    <h3>{activeConversation?.title}</h3>
                    <EditOutlined />
                  </button>
                )}
                <span className={`scrm-presence ${activeConversation?.online ? 'online' : 'offline'}`}>
                  {activeConversation?.online ? '在线' : '离线'}
                  {!activeConversation?.online && (
                    <em className="scrm-last-seen">最近在线：{formatLastSeen(activeConversation)}</em>
                  )}
                </span>
              </div>
            </div>
            <div className="scrm-contact-facts">
              <div className="scrm-contact-fact-row">
                <em>客户备注</em>
                <div className="scrm-contact-fact-value">
                  {editingContactRemark ? (
                    <div className="scrm-contact-remark-editor">
                      <Input
                        value={contactRemarkDraft}
                        placeholder="请输入客户备注"
                        autoFocus
                        onChange={(event) => setContactRemarkDraft(event.target.value)}
                        onPressEnter={saveContactRemark}
                      />
                      <Button type="primary" size="small" onClick={saveContactRemark}>保存</Button>
                      <Button size="small" onClick={() => {
                        setContactRemarkDraft(activeConversation?.remark || '')
                        setEditingContactRemark(false)
                      }}>取消</Button>
                    </div>
                  ) : (
                    <button
                      className={`scrm-contact-remark-display ${activeConversation?.remark ? '' : 'is-empty'}`}
                      onClick={() => {
                        setContactRemarkDraft(activeConversation?.remark || '')
                        setEditingContactRemark(true)
                      }}
                    >
                      <span>{activeConversation?.remark || '暂无备注'}</span>
                      <EditOutlined />
                    </button>
                  )}
                </div>
              </div>
              <div className="scrm-contact-fact-row">
                <em>国家/地区</em>
                <strong><EnvironmentOutlined /> {formatRegion(activeConversation?.locality)}</strong>
              </div>
              <div className="scrm-contact-fact-row">
                <em>当地时区</em>
                <strong className="scrm-contact-local-time">
                  <ClockCircleOutlined />
                  {formatLocalDateTime(activeConversation?.timezoneOffset)}
                </strong>
              </div>
              <div className="scrm-contact-fact-row is-labels">
                <em>标签组</em>
                <div className="scrm-contact-labels">
                  {(activeConversation?.labels || [])
                    .filter((key) => !['all', 'group'].includes(key))
                    .map((key) => {
                      const label = currentAccount.labels.find((item) => item.key === key)
                      return (
                        <Tag
                          key={key}
                          closable
                          onClose={(event) => {
                            event.preventDefault()
                            updateContactLabel(key, false)
                          }}
                        >
                          {label?.label || key}
                        </Tag>
                      )
                    })}
                  <Popover
                    trigger="click"
                    placement="bottomLeft"
                    open={contactLabelPickerOpen}
                    onOpenChange={setContactLabelPickerOpen}
                    content={(
                      <div className="scrm-contact-label-picker">
                        <strong>选择加入标签组</strong>
                        {currentAccount.labels
                          .filter((label) => !['all', 'group'].includes(label.key))
                          .map((label) => {
                            const selected = activeConversation?.labels?.includes(label.key)
                            return (
                              <button
                                key={label.key}
                                className={selected ? 'is-selected' : ''}
                                onClick={() => updateContactLabel(label.key, !selected)}
                              >
                                <Checkbox checked={selected} />
                                <span>{label.label}</span>
                              </button>
                            )
                          })}
                      </div>
                    )}
                  >
                    <button className="scrm-contact-label-add" aria-label="选择加入标签组">
                      <PlusOutlined />
                    </button>
                  </Popover>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        title="添加群成员"
        open={addMemberOpen}
        onCancel={() => setAddMemberOpen(false)}
        footer={null}
        zIndex={1200}
        width={560}
      >
        <div className="scrm-add-member-modal">
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索姓名或电话号码"
            value={memberSearch}
            onChange={(event) => setMemberSearch(event.target.value)}
            allowClear
          />
          <div className="scrm-member-suggestion-list">
            {memberCandidates.map((candidate) => (
              <button
                key={candidate.id}
                className="scrm-member-suggestion"
                onClick={() => addGroupMember(candidate)}
              >
                <Avatar size={34} style={{ background: candidate.avatarColor, color: '#075e54' }}>
                  {candidate.name.slice(0, 1)}
                </Avatar>
                <span>
                  <strong>{candidate.name}</strong>
                  <em>{candidate.phone}</em>
                </span>
                <span className="scrm-add-pill">添加</span>
              </button>
            ))}
            {!memberCandidates.length && (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无匹配人员" />
            )}
          </div>
          <div className="scrm-invite-link-box">
            <div>
              <strong>使用链接邀请加入群组</strong>
              <span>可将该网页地址发送给需要加入群聊的成员。</span>
            </div>
            <Input value={groupInviteLink} readOnly />
            <Space>
              <Button icon={<CopyOutlined />} onClick={copyInviteLink}>复制链接</Button>
              <Button icon={<ReloadOutlined />} onClick={resetInviteLink}>重置链接</Button>
            </Space>
          </div>
        </div>
      </Modal>

      <Modal
        title={`转发消息给（已选 ${selectedMessageIds.length} 条）`}
        open={forwardOpen}
        onCancel={() => setForwardOpen(false)}
        onOk={forwardSelectedMessages}
        okText="转发"
        okButtonProps={{ disabled: !forwardConversationIds.length }}
        width={520}
        className="scrm-create-chat-modal"
      >
        <div className="scrm-forward-picker">
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索姓名、群名或电话号码"
            value={forwardSearch}
            onChange={(event) => setForwardSearch(event.target.value)}
            allowClear
          />
          <span>最近聊天</span>
          <div className="scrm-forward-list">
            {forwardCandidates.map((conversation) => (
              <label key={conversation.id} className="scrm-forward-item">
                <Checkbox
                  checked={forwardConversationIds.includes(conversation.id)}
                  onChange={(event) => {
                    setForwardConversationIds((ids) =>
                      event.target.checked
                        ? [...ids, conversation.id]
                        : ids.filter((id) => id !== conversation.id),
                    )
                  }}
                />
                <Avatar size={38} style={{ background: conversation.avatarColor }}>{conversation.avatar}</Avatar>
                <span>
                  <strong>{conversation.title}</strong>
                  <em>{conversation.phone || conversation.subtitle}</em>
                </span>
              </label>
            ))}
          </div>
        </div>
      </Modal>

      <Modal
        title="创建新列表"
        open={newListOpen}
        onCancel={() => setNewListOpen(false)}
        onOk={createCustomList}
        okText="创建列表"
        okButtonProps={{ disabled: !newListName.trim() }}
        className="scrm-create-chat-modal"
      >
        <div className="scrm-create-list-form">
          <label>
            <span>列表名称</span>
            <Input
              placeholder="请输入列表名称"
              value={newListName}
              onChange={(event) => setNewListName(event.target.value)}
            />
          </label>
          <div className="scrm-create-list-included">
            <span>已包含</span>
            <button onClick={() => setListPickerOpen(true)}>
              <PlusOutlined />
              添加用户或群组
            </button>
            {!!newListConversationIds.length && (
              <div className="scrm-list-selected">
                {newListConversationIds.map((id) => {
                  const conversation = accountConversations.find((item) => item.id === id)
                  return conversation ? <Tag key={id}>{conversation.title}</Tag> : null
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        title="添加到列表"
        open={listPickerOpen}
        onCancel={() => setListPickerOpen(false)}
        onOk={() => setListPickerOpen(false)}
        okText="确认添加"
        width={560}
        className="scrm-create-chat-modal"
      >
        <div className="scrm-list-picker">
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索姓名或电话号码"
            value={listSearch}
            onChange={(event) => setListSearch(event.target.value)}
            allowClear
          />
          <span className="scrm-list-picker-title">当前账号的用户与群组</span>
          <div className="scrm-list-picker-items">
            {listConversationCandidates.map((conversation) => (
              <label key={conversation.id} className="scrm-list-picker-item">
                <Checkbox
                  checked={newListConversationIds.includes(conversation.id)}
                  onChange={(event) => {
                    setNewListConversationIds((ids) =>
                      event.target.checked
                        ? [...ids, conversation.id]
                        : ids.filter((id) => id !== conversation.id),
                    )
                  }}
                />
                <Avatar size={36} style={{ background: conversation.avatarColor }}>{conversation.avatar}</Avatar>
                <span>
                  <strong>{conversation.title}</strong>
                  <em>{conversation.phone || conversation.subtitle}</em>
                </span>
              </label>
            ))}
          </div>
        </div>
      </Modal>

      <Modal
        title="更改分组"
        open={assignListOpen}
        onCancel={() => setAssignListOpen(false)}
        onOk={saveAssignedLists}
        okText="保存"
        className="scrm-create-chat-modal"
      >
        <Checkbox.Group
          className="scrm-assign-list"
          value={assignListKeys}
          onChange={setAssignListKeys}
          options={assignableLists.map((label) => ({ label: label.label, value: label.key }))}
        />
        {!assignableLists.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请先创建分组" />}
      </Modal>

      <Modal
        open={accountLoginOpen}
        onCancel={() => setAccountLoginOpen(false)}
        footer={null}
        width={860}
        className="scrm-cloud-login-modal"
      >
        <div className="scrm-cloud-login">
          <section className="scrm-cloud-login-copy">
            <h2>云端登录</h2>
            <p>完成绑定后即可在 SCRM 中使用当前账号</p>
            <div className="scrm-login-benefit">
              <CheckCircleOutlined />
              <span>云端二次登录账号，杜绝消息丢失</span>
            </div>
            <div className="scrm-login-benefit">
              <CheckCircleOutlined />
              <span>跟进行为实时记录，防止流入公海</span>
            </div>
            <ol>
              <li>打开手机中的 WhatsApp</li>
              <li>更多选项 〉已关联设备 〉关联设备</li>
              <li>手机摄像头对准右侧二维码进行扫描</li>
            </ol>
          </section>
          <section className="scrm-cloud-login-qr">
            <div className="scrm-qr-placeholder">
              <span />
            </div>
            <strong>WhatsApp 扫描二维码完成云端登录</strong>
            <Button type="link">刷新二维码</Button>
            <Button type="primary" onClick={completeAccountLogin}>模拟完成登录</Button>
          </section>
        </div>
      </Modal>

      <Modal
        title="上传群头像"
        open={avatarUploadOpen}
        onCancel={() => setAvatarUploadOpen(false)}
        footer={null}
        zIndex={1200}
        width={460}
      >
        <div className="scrm-avatar-upload-modal">
          <Avatar
            size={72}
            src={activeConversation?.avatarUrl}
            style={{ background: activeConversation?.avatarColor }}
          >
            {activeConversation?.avatar}
          </Avatar>
          <label className="scrm-upload-drop">
            <UploadOutlined />
            <strong>选择本地图片</strong>
            <span>支持 JPG / PNG，Demo 中会立即预览到当前群头像。</span>
            <input type="file" accept="image/*" onChange={handleAvatarFile} />
          </label>
        </div>
      </Modal>

      <Modal
        title="联系人卡片"
        open={contactCardOpen}
        onCancel={() => {
          setContactCardOpen(false)
          setContactCardSearch('')
        }}
        footer={null}
        width={520}
        className="scrm-create-chat-modal"
      >
        <div className="scrm-contact-card-picker">
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索姓名、手机号或 WhatsApp 账号"
            value={contactCardSearch}
            onChange={(event) => setContactCardSearch(event.target.value)}
            allowClear
          />
          {contactCardCandidates.map((contact) => (
            <button key={contact.id} className="scrm-contact-card-option" onClick={() => sendContactCard(contact)}>
              <Avatar size={38}>{contact.avatar}</Avatar>
              <span>
                <strong>{contact.name}</strong>
                <em>{contact.phone} · {contact.account}</em>
              </span>
              <span className="scrm-add-pill">发送</span>
            </button>
          ))}
          {!contactCardCandidates.length && (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无匹配联系人" />
          )}
        </div>
      </Modal>

      <Modal
        title="新建群聊"
        open={newGroupOpen}
        onCancel={() => setNewGroupOpen(false)}
        onOk={createManualGroup}
        okText="创建群聊"
        className="scrm-create-chat-modal"
      >
        <div className="scrm-create-form">
          <label className="scrm-form-field">
            <span>群聊名称</span>
            <Input value={newGroupName} onChange={(event) => setNewGroupName(event.target.value)} />
          </label>
          <label className="scrm-form-field">
            <span>邀请成员</span>
            <Select
              mode="multiple"
              placeholder="请输入姓名或手机号"
              value={newGroupMembers}
              onChange={setNewGroupMembers}
              options={[
                { value: 'Abhishek Kandi', label: 'Abhishek Kandi' },
                { value: 'Scarlett Wu', label: 'Scarlett Wu' },
                { value: 'SM报价师', label: 'SM报价师' },
                { value: 'Install Lead', label: 'Install Lead' },
                activeConversation?.type === 'single' ? { value: activeConversation.title, label: activeConversation.title } : null,
              ].filter(Boolean)}
              style={{ width: '100%' }}
            />
          </label>
        </div>
      </Modal>

      <Modal
        title={ATTACHMENT_PICKER_TITLE[attachmentPickerType] || '选择文件'}
        open={Boolean(attachmentPickerType)}
        onCancel={() => {
          setAttachmentPickerType(null)
          setSelectedAttachmentIds([])
        }}
        onOk={sendSelectedAttachments}
        okText={`发送${selectedAttachmentIds.length ? ` ${selectedAttachmentIds.length} 个` : ''}`}
        className="scrm-attachment-picker-modal"
      >
        <div className="scrm-attachment-picker">
          <div className="scrm-attachment-picker-hint">
            最近文件
          </div>
          <div className="scrm-attachment-file-list">
            {(ATTACHMENT_PICKER_FILES[attachmentPickerType] || []).map((file) => (
              <label
                key={file.id}
                className={`scrm-attachment-file ${selectedAttachmentIds.includes(file.id) ? 'is-selected' : ''}`}
              >
                <Checkbox
                  checked={selectedAttachmentIds.includes(file.id)}
                  onChange={(event) => toggleAttachmentSelection(file.id, event.target.checked)}
                />
                <span className="scrm-attachment-file-icon">{TYPE_ICON[file.type]}</span>
                <span className="scrm-attachment-file-body">
                  <strong>{file.name}</strong>
                  <em>{file.meta}</em>
                </span>
              </label>
            ))}
          </div>
          {selectedAttachmentIds.length > 0 && (
            <div className="scrm-attachment-selected">
              <strong>已选 {selectedAttachmentIds.length} 个</strong>
              <div>
                {selectedAttachmentIds.map((id) => {
                  const file = (ATTACHMENT_PICKER_FILES[attachmentPickerType] || []).find((item) => item.id === id)
                  return file ? <Tag key={id} closable onClose={() => toggleAttachmentSelection(id, false)}>{file.name}</Tag> : null
                })}
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        title="添加联系人"
        open={newContactOpen}
        onCancel={() => setNewContactOpen(false)}
        footer={null}
        className="scrm-create-chat-modal"
      >
        <div className="scrm-create-form">
          <label className="scrm-form-field">
            <span><em>*</em> WhatsApp App账号</span>
            <Input
              placeholder="请输入 WhatsApp App 账号"
              value={contactAccountInput}
              onChange={(event) => setContactAccountInput(event.target.value)}
            />
          </label>
          <label className="scrm-form-field">
            <span><em>*</em> 用户号码</span>
            <Input
              prefix={<SearchOutlined />}
              placeholder="请输入用户号码或 WhatsApp 账号"
              value={contactSearch}
              onChange={(event) => setContactSearch(event.target.value)}
              allowClear
            />
            <small>输入 WhatsApp 用户号码或账号，可查找并生成对应会话。</small>
          </label>
          <div className="scrm-contact-result-list">
            {contactCandidates.map((contact) => (
              <button key={contact.id} className="scrm-contact-result" onClick={() => addContactConversation(contact)}>
                <Avatar size={34}>{contact.avatar}</Avatar>
                <span>
                  <strong>{contact.name}</strong>
                  <em>{contact.phone} · {contact.account}</em>
                </span>
                <span className="scrm-add-pill">添加</span>
              </button>
            ))}
            {contactSearch.trim() && !contactCandidates.length && (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无匹配联系人" />
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
