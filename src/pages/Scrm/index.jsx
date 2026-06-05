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
  SearchOutlined,
  SendOutlined,
  SmileOutlined,
  StarOutlined,
  StopOutlined,
  TeamOutlined,
  UploadOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  UserSwitchOutlined,
  WarningOutlined,
} from '@ant-design/icons'

import { loadImState, resetImState, saveImState } from '../../mock/imStore'
import './scrm.css'

const PAGE_SIZE = 12

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
  voice: <AudioOutlined />,
  file: <FileTextOutlined />,
  location: <LinkOutlined />,
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

  if (['file', 'image', 'location'].includes(item.type)) {
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
  const moreMenu = {
    items: [
      { key: 'pin', icon: <PushpinOutlined />, label: '置顶消息' },
      { key: 'forward', icon: <SendOutlined />, label: '转发消息' },
      { key: 'edit', icon: <EditOutlined />, label: '编辑消息', disabled: !mine || item.type !== 'text' || item.status === 'failed' || item.recalled },
      { key: 'recall', icon: <CloseCircleOutlined />, label: '撤回消息', danger: true, disabled: !mine || item.recalled },
    ],
    onClick: ({ key }) => onAction(key, item),
  }

  return (
    <div
      id={`scrm-message-${item.id}`}
      className={`im-message-row ${mine ? 'is-mine' : 'is-other'} ${selectMode ? 'is-selecting' : ''} ${selected ? 'is-selected' : ''} ${highlighted ? 'is-located' : ''}`}
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
    </div>
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
  const [infoOpen, setInfoOpen] = useState(false)
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
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [, setClockTick] = useState(Date.now())
  const uploadInputRef = useRef(null)
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
      item.type !== 'system' &&
      `${item.sender || ''} ${item.text || ''} ${item.meta || ''}`.toLowerCase().includes(query),
    )
  }, [activeMessages, chatSearchQuery])

  useEffect(() => {
    setQuotedMessage(null)
    setSelectMessagesMode(false)
    setSelectedMessageIds([])
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
    message.success(conversation.muted ? '已开启通知' : '已静音通知')
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
    const copy = {
      pin: '消息已置顶',
      recall: '消息已撤回',
    }
    message.success(copy[key] || `已处理 ${item.id}`)
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

  const handleComposerUpload = (event) => {
    const file = event.target.files?.[0]
    if (file) message.success(`已选择 ${file.name}`)
    event.target.value = ''
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
      uploadInputRef.current?.click()
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
        setChatSearchOpen(true)
      }
      if (key === 'select') {
        setSelectMessagesMode(true)
        setSelectedMessageIds([])
      }
      if (key === 'unread') toggleUnread(conversation)
      if (key === 'pin') togglePinned(conversation)
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

  return (
    <div className="scrm-shell" style={{ '--conversation-width': `${conversationWidth}px` }}>
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
              className={`scrm-conversation-card ${activeConversation?.id === conversation.id ? 'is-active' : ''} ${conversation.archived ? 'is-archived' : ''}`}
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
              <Avatar size={44} style={{ background: conversation.avatarColor }}>{conversation.avatar}</Avatar>
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
                <span className="scrm-conversation-sub">{conversation.subtitle}</span>
                <span className="scrm-conversation-last">{conversation.lastMessage}</span>
              </span>
              <span className="scrm-conversation-flags">
                {conversation.pinned && <PushpinOutlined />}
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
                <Dropdown menu={conversationMenu(activeConversation)} trigger={['click']} placement="bottomRight">
                  <Button icon={<MoreOutlined />} />
                </Dropdown>
              </Space>
            </header>

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
              <input
                ref={uploadInputRef}
                className="scrm-hidden-file"
                type="file"
                onChange={handleComposerUpload}
              />
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

      <aside className="scrm-crm-reserved-panel">
        <div className="scrm-reserved-title">CRM / ERP 预留区</div>
        <div className="scrm-reserved-card">
          <strong>CRM 关系</strong>
          <span>客户关系、联系人归属、商机关系将在这里承载。</span>
        </div>
        <div className="scrm-reserved-card">
          <strong>ERP 交互</strong>
          <span>订单、报价、交付、售后状态预留接入位。</span>
        </div>
        <div className="scrm-reserved-hint">
          群资料、成员管理、入群审批等 WhatsApp 操作从顶部头像或更多菜单打开，不占用此栏。
        </div>
      </aside>

      <Drawer
        title="搜索消息"
        open={chatSearchOpen}
        onClose={() => setChatSearchOpen(false)}
        width={460}
        className="scrm-chat-search-drawer"
      >
        <div className="scrm-chat-search-panel">
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索当前会话内容"
            value={chatSearchQuery}
            onChange={(event) => setChatSearchQuery(event.target.value)}
            allowClear
            autoFocus
          />
          <div className="scrm-chat-search-results">
            {chatSearchResults.map((item) => (
              <div className="scrm-chat-search-result" key={item.id}>
                <span>
                  <strong>{item.sender || (item.direction === 'out' ? '我' : activeConversation?.title)}</strong>
                  <em>{item.text || item.meta || '[非文本消息]'}</em>
                  <time>{item.time}</time>
                </span>
                <Tooltip title="定位到消息">
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
            {!chatSearchQuery.trim() && (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="输入关键词搜索当前会话" />
            )}
          </div>
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
        footer={null}
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
                <h3>{activeConversation?.title}</h3>
                <span className={`scrm-presence ${activeConversation?.online ? 'online' : 'offline'}`}>
                  {activeConversation?.online ? '在线' : '离线'}
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
        onCancel={() => setContactCardOpen(false)}
        footer={null}
        width={520}
        className="scrm-create-chat-modal"
      >
        <div className="scrm-contact-card-picker">
          {CONTACT_DIRECTORY.map((contact) => (
            <button key={contact.id} className="scrm-contact-card-option" onClick={() => sendContactCard(contact)}>
              <Avatar size={38}>{contact.avatar}</Avatar>
              <span>
                <strong>{contact.name}</strong>
                <em>{contact.phone} · {contact.account}</em>
              </span>
              <span className="scrm-add-pill">发送</span>
            </button>
          ))}
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
