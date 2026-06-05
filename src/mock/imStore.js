const STORAGE_KEY = 'os-scrm-im-v1-state-20260604'

const accountLabels = {
  north: [
    { key: 'all', label: '所有' },
    { key: 'unread', label: '未读' },
    { key: 'special', label: '特别关注' },
    { key: 'group', label: '群组' },
    { key: 'diy', label: 'DIY' },
    { key: 'factory', label: '工厂协作' },
  ],
  mena: [
    { key: 'all', label: '所有' },
    { key: 'unread', label: '未读' },
    { key: 'special', label: '特别关注' },
    { key: 'group', label: '群组' },
    { key: 'diy', label: 'Ramadan' },
    { key: 'factory', label: '报价同步' },
  ],
  sea: [
    { key: 'all', label: '所有' },
    { key: 'unread', label: '未读' },
    { key: 'special', label: '特别关注' },
    { key: 'group', label: '群组' },
    { key: 'diy', label: '安装队' },
  ],
}

export function createInitialImState() {
  return attachGeneratedHistory({
    currentAccountId: 'wa-north-01',
    activeConversationId: 'c-george-group',
    filterKey: 'all',
    accounts: [
      {
        id: 'wa-north-01',
        name: 'George Timmy Guo',
        shortName: 'GT',
        phone: '+1 861 732 8005 204',
        region: '北美项目组',
        status: 'online',
        avatarColor: '#1A4D8F',
        labels: accountLabels.north,
      },
      {
        id: 'wa-mena-02',
        name: 'Zane MENA Sales',
        shortName: 'ZS',
        phone: '+971 52 120 3273',
        region: '中东销售组',
        status: 'online',
        blinking: true,
        avatarColor: '#008C7E',
        labels: accountLabels.mena,
      },
      {
        id: 'wa-sea-03',
        name: 'Southeast Asia PM',
        shortName: 'SA',
        phone: '+65 8120 4001',
        region: '东南亚项目组',
        status: 'offline',
        avatarColor: '#C27A18',
        labels: accountLabels.sea,
      },
    ],
    conversations: [
      {
        id: 'c-george-group',
        accountId: 'wa-north-01',
        type: 'group',
        title: 'Abhishek Kandi VIP Group',
        subtitle: 'PM / 客户 / 设计师 / 报价师',
        avatar: 'AK',
        avatarColor: '#2E7BD6',
        phone: '+1 647-448-0575',
        locality: '加拿大 · 业主',
        timezoneOffset: -4,
        online: true,
        labels: ['group', 'special', 'diy'],
        unread: 0,
        pinned: true,
        muted: false,
        archived: false,
        lastAt: '今天 17:31',
        sortIndex: 1000,
        lastMessage: 'Abhishek: How about your project progress?',
      },
      {
        id: 'c-banana',
        accountId: 'wa-north-01',
        type: 'single',
        title: 'Bananaco',
        subtitle: '+86 186 6277 0457',
        avatar: 'B',
        avatarColor: '#10A86A',
        phone: '+86 186 6277 0457',
        locality: '中国 · 业主',
        timezoneOffset: 8,
        online: true,
        labels: ['unread', 'diy'],
        unread: 1,
        pinned: false,
        muted: false,
        archived: false,
        lastAt: '今天 16:45',
        sortIndex: 999,
        lastMessage: '客户: Can you send the revised drawing?',
      },
      {
        id: 'c-yvip',
        accountId: 'wa-north-01',
        type: 'group',
        title: 'YVIP1008 US Project',
        subtitle: '群组 · 9 人',
        avatar: 'YV',
        avatarColor: '#4A95E8',
        phone: '+1 646-210-3002',
        locality: '美国 · 项目群',
        timezoneOffset: -5,
        online: false,
        labels: ['group', 'unread'],
        unread: 6,
        pinned: false,
        muted: true,
        archived: false,
        lastAt: '今天 15:22',
        sortIndex: 998,
        lastMessage: 'Scarlett: Please confirm the color sample.',
      },
      {
        id: 'c-dubai',
        accountId: 'wa-mena-02',
        type: 'single',
        title: 'Nessa George',
        subtitle: '+974 5120 3273',
        avatar: 'NG',
        avatarColor: '#1A4D8F',
        phone: '+974 5120 3273',
        locality: '卡塔尔 · 业主',
        timezoneOffset: 3,
        online: true,
        labels: ['unread', 'special'],
        unread: 3,
        pinned: true,
        muted: false,
        archived: false,
        lastAt: '今天 18:08',
        sortIndex: 997,
        lastMessage: '客户: The detailed follow-up will be handled...',
      },
      {
        id: 'c-mena-group',
        accountId: 'wa-mena-02',
        type: 'group',
        title: 'Dubai Villa Design Group',
        subtitle: '群组 · 6 人',
        avatar: 'DV',
        avatarColor: '#008C7E',
        phone: '+971 50 889 1201',
        locality: '迪拜 · 项目群',
        timezoneOffset: 4,
        online: true,
        labels: ['group', 'unread'],
        unread: 2,
        pinned: false,
        muted: false,
        archived: false,
        lastAt: '今天 17:58',
        sortIndex: 996,
        lastMessage: 'SM报价师: Quotation updated.',
      },
      {
        id: 'c-sea-general',
        accountId: 'wa-sea-03',
        type: 'group',
        title: 'General George SG',
        subtitle: '群组 · 5 人',
        avatar: 'SG',
        avatarColor: '#C27A18',
        phone: '+65 9001 2281',
        locality: '新加坡 · 项目群',
        timezoneOffset: 8,
        online: false,
        labels: ['group', 'diy'],
        unread: 0,
        pinned: false,
        muted: false,
        archived: false,
        lastAt: '昨日 21:20',
        sortIndex: 995,
        lastMessage: '系统: Renee 已加入群聊',
      },
    ],
    messages: {
      'c-george-group': [
        { id: 'm-g-1', type: 'system', text: '2026年5月8日', time: '09:00' },
        { id: 'm-g-2', type: 'text', direction: 'in', sender: 'Abhishek', text: 'Hi! Dear Abhishek, How are you?', time: '17:31', status: 'read' },
        { id: 'm-g-3', type: 'text', direction: 'in', sender: 'Scarlett', text: 'How about your project progress?', time: '17:40', status: 'read', mentionable: true },
        { id: 'm-g-4', type: 'system', text: 'Timmy Guo 将 SM 报价师加入群聊', time: '18:02' },
        { id: 'm-g-5', type: 'voice', direction: 'out', sender: '我', text: '语音消息', duration: '0:14', time: '18:15', status: 'read' },
        { id: 'm-g-6', type: 'file', direction: 'out', sender: '我', text: 'Cabinet_quotation_v3.pdf', meta: '2.4 MB · PDF', time: '18:18', status: 'delivered' },
        { id: 'm-g-7', type: 'text', direction: 'out', sender: '我', text: 'Please check the updated quotation and confirm the delivery date.', time: '18:20', status: 'failed', error: '账号连接短暂异常，消息未发出' },
      ],
      'c-banana': [
        { id: 'm-b-1', type: 'system', text: '2026年5月15日', time: '10:00' },
        { id: 'm-b-2', type: 'text', direction: 'in', sender: 'Bananaco', text: 'Can you send the revised drawing?', time: '16:45', status: 'sent' },
        { id: 'm-b-3', type: 'image', direction: 'out', sender: '我', text: 'kitchen_render_preview.jpg', meta: '图片 · 已预览', time: '16:51', status: 'read' },
      ],
      'c-yvip': [
        { id: 'm-y-1', type: 'system', text: 'Yash 将 Renee 加入群聊', time: '14:02' },
        { id: 'm-y-2', type: 'text', direction: 'in', sender: 'Scarlett', text: 'Please confirm the color sample.', time: '15:22', status: 'sent' },
      ],
      'c-dubai': [
        { id: 'm-d-1', type: 'text', direction: 'in', sender: 'Nessa', text: 'The detailed follow-up will be handled tomorrow morning.', time: '18:08', status: 'sent' },
        { id: 'm-d-2', type: 'location', direction: 'in', sender: 'Nessa', text: 'Dubai Hills Villa · Gate 3', meta: '25.0607, 55.2461', time: '18:10', status: 'sent' },
      ],
      'c-mena-group': [
        { id: 'm-m-1', type: 'system', text: 'SM报价师修改了群公告', time: '17:32' },
        { id: 'm-m-2', type: 'file', direction: 'in', sender: 'SM报价师', text: 'Dubai_Villa_Quotation.xlsx', meta: '1.8 MB · Excel', time: '17:58', status: 'sent' },
      ],
      'c-sea-general': [
        { id: 'm-s-1', type: 'system', text: 'Renee 已加入群聊', time: '昨日 21:20' },
      ],
    },
    groups: {
      'c-george-group': {
        id: 'c-george-group',
        description: '2026 Q2 高端别墅项目交付群',
        owner: 'George Timmy Guo',
        createdAt: '2026-04-02',
        members: [
          { id: 'gm-1', name: 'George Timmy Guo', role: '管理员', phone: '+1 861 732 8005 204' },
          { id: 'gm-2', name: 'Abhishek Kandi', role: '客户', phone: '+86 177 0861 3923' },
          { id: 'gm-3', name: 'Scarlett Wu', role: '设计师', phone: '+86 136 3241 5719' },
          { id: 'gm-4', name: 'Bruce Lee', role: '管理员', phone: '+86 133 2673 1206' },
          { id: 'gm-5', name: 'SM报价师', role: '成员', phone: '+86 131 0679 5053' },
        ],
        pendingRequests: [
          { id: 'req-1', name: 'Install Lead - Olivia', phone: '+86 177 0861 3924', reason: '邀请链接申请入群' },
        ],
      },
      'c-yvip': {
        id: 'c-yvip',
        description: '美国项目样品确认群',
        owner: 'Yash',
        createdAt: '2026-04-20',
        members: [
          { id: 'ym-1', name: 'Yash', role: '管理员', phone: '+1 646 210 3002' },
          { id: 'ym-2', name: 'Scarlett', role: '设计师', phone: '+86 136 3241 5719' },
        ],
        pendingRequests: [],
      },
      'c-mena-group': {
        id: 'c-mena-group',
        description: 'Dubai Villa 报价与设计协作群',
        owner: 'Zane MENA Sales',
        createdAt: '2026-05-03',
        members: [
          { id: 'mm-1', name: 'Zane MENA Sales', role: '管理员', phone: '+971 52 120 3273' },
          { id: 'mm-2', name: 'SM报价师', role: '成员', phone: '+86 131 0679 5053' },
          { id: 'mm-3', name: 'Nessa George', role: '客户', phone: '+974 5120 3273' },
        ],
        pendingRequests: [
          { id: 'req-2', name: 'Dubai Installer', phone: '+971 50 889 1201', reason: '阶段协作成员申请入群' },
        ],
      },
      'c-sea-general': {
        id: 'c-sea-general',
        description: '新加坡项目交付群',
        owner: 'Southeast Asia PM',
        createdAt: '2026-05-16',
        members: [
          { id: 'sm-1', name: 'Southeast Asia PM', role: '管理员', phone: '+65 8120 4001' },
          { id: 'sm-2', name: 'Renee', role: '成员', phone: '+65 9001 2281' },
        ],
        pendingRequests: [],
      },
    },
  })
}

function buildGeneratedHistory() {
  const specs = [
    {
      accountId: 'wa-north-01',
      prefix: 'north',
      names: [
        'Kanchan Rajput',
        'Poland-Johanna Group',
        'MMVIP105 US Project',
        'Mr Nedan Glass',
        'GeorgeGroup Canada',
        'LVIP7 Philippines',
        'Olivia Toronto',
        'General George US',
        'Amit Kitchen Lead',
        'Boston Stone Project',
        'Seattle Cabinet Team',
        'Houston Villa Owner',
        'Toronto Installer Group',
        'Renee Follow Up',
        'Miami Contractor Group',
        'Vancouver Cabinet Owner',
        'Dallas Whole House',
        'New York Designer Group',
        'Calgary Stone Inquiry',
        'LA Warehouse Sync',
        'Chicago After Sales',
        'Denver Project Team',
        'Ottawa Private Owner',
        'Phoenix Installer Group',
      ],
      colors: ['#1A4D8F', '#2E7BD6', '#10A86A', '#C27A18'],
      timezoneOffset: -4,
    },
    {
      accountId: 'wa-mena-02',
      prefix: 'mena',
      names: [
        'Dubai Hills Owner',
        'Riyadh Showroom Lead',
        'Doha Villa Group',
        'Kuwait Contractor',
        'Abu Dhabi Site Team',
        'Oman Hotel Project',
        'Qatar Marble Inquiry',
        'Jeddah Cabinet Group',
        'Nessa Follow Up',
        'Villa Lighting Team',
        'Sharjah Installer',
        'MENA Factory Sync',
        'Bahrain Contractor Group',
        'Muscat Hotel Owner',
        'Riyadh Designer Team',
        'Dubai Palm Villa',
        'Doha Installer Group',
        'Kuwait After Sales',
      ],
      colors: ['#008C7E', '#1A4D8F', '#4A95E8', '#C27A18'],
      timezoneOffset: 4,
    },
    {
      accountId: 'wa-sea-03',
      prefix: 'sea',
      names: [
        'Singapore Condo Group',
        'Manila Dealer Lead',
        'Jakarta Design Team',
        'Bangkok Installer',
        'KL Cabinet Project',
        'Hanoi Villa Owner',
        'SEA After Sales',
        'General Contractor SG',
        'Penang Stone Inquiry',
        'Bali Resort Group',
        'Phuket Hotel Lead',
        'Ho Chi Minh Designer',
        'Bangkok Factory Sync',
        'Singapore Installer Group',
      ],
      colors: ['#C27A18', '#1A4D8F', '#10A86A', '#2E7BD6'],
      timezoneOffset: 8,
    },
  ]

  const conversations = []
  const messages = {}
  const groups = {}

  specs.forEach((spec) => {
    spec.names.forEach((name, index) => {
      const group = index % 3 === 1 || name.includes('Group') || name.includes('Team')
      const id = `c-${spec.prefix}-history-${index + 1}`
      const unread = index % 4 === 0 ? (index % 5) + 1 : 0
      const labels = ['all']
      if (unread) labels.push('unread')
      if (index % 5 === 0) labels.push('special')
      if (group) labels.push('group')
      if (index % 2 === 0) labels.push('diy')
      if (index % 7 === 0) labels.push('factory')

      conversations.push({
        id,
        accountId: spec.accountId,
        type: group ? 'group' : 'single',
        title: name,
        subtitle: group ? `群组 · ${5 + (index % 6)} 人` : `+${index % 2 ? '86' : '1'} ${647 + index}-448-${String(5700 + index).padStart(4, '0')}`,
        avatar: name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
        avatarColor: spec.colors[index % spec.colors.length],
        phone: `+${index % 2 ? '86' : '1'} ${647 + index}-448-${String(5700 + index).padStart(4, '0')}`,
        locality: group ? '项目协作群' : '海外业主',
        timezoneOffset: spec.timezoneOffset + (index % 3 === 0 ? 1 : 0),
        online: index % 3 !== 0,
        labels,
        unread,
        pinned: index === 0,
        muted: index % 6 === 0,
        archived: false,
        lastAt: index < 7 ? `今天 ${String(20 - index).padStart(2, '0')}:${String(12 + index).padStart(2, '0')}` : `2026年5月${String(28 - (index % 18)).padStart(2, '0')}日`,
        sortIndex: 900 - index,
        lastMessage: group
          ? `${index % 2 ? '设计师' : '客户'}: ${index % 3 ? 'Please confirm the latest drawing.' : 'Quotation has been updated.'}`
          : `${index % 2 ? '客户' : '我'}: ${index % 3 ? 'Can you share more details?' : 'I will check and reply soon.'}`,
      })

      messages[id] = [
        { id: `${id}-sys`, type: 'system', text: index < 6 ? '今天' : '2026年5月', time: '09:00' },
        { id: `${id}-in-1`, type: 'text', direction: 'in', sender: group ? '客户' : name, text: 'Hi, I would like to confirm the latest project details.', time: '10:12', status: 'sent' },
        { id: `${id}-out-1`, type: 'text', direction: 'out', sender: '我', text: 'Sure, I will check the file and send you an updated answer.', time: '10:16', status: 'delivered' },
        { id: `${id}-in-2`, type: group ? 'file' : 'text', direction: 'in', sender: group ? '设计师' : name, text: group ? 'project_reference.pdf' : 'Thanks, please keep me updated.', meta: group ? '1.2 MB · PDF' : undefined, time: '10:24', status: 'sent' },
      ]

      if (group) {
        groups[id] = {
          id,
          description: '历史项目协作群',
          owner: spec.accountId === 'wa-mena-02' ? 'Zane MENA Sales' : spec.accountId === 'wa-sea-03' ? 'Southeast Asia PM' : 'George Timmy Guo',
          createdAt: '2026-05-01',
          members: [
            { id: `${id}-owner`, name: 'PM Owner', role: '管理员', phone: '+1 861 732 8005 204' },
            { id: `${id}-client`, name: 'Client Contact', role: '客户', phone: '+86 177 0861 3923' },
            { id: `${id}-designer`, name: 'Designer', role: '成员', phone: '+86 136 3241 5719' },
          ],
          pendingRequests: index % 4 === 1 ? [{ id: `${id}-req`, name: 'Installer Applicant', phone: '+86 188 0000 9088', reason: '邀请链接申请入群' }] : [],
        }
      }
    })
  })

  return { conversations, messages, groups }
}

function attachGeneratedHistory(state) {
  const generated = buildGeneratedHistory()
  const existingIds = new Set((state.conversations || []).map((item) => item.id))
  const conversations = [
    ...(state.conversations || []),
    ...generated.conversations.filter((item) => !existingIds.has(item.id)),
  ]
  return {
    ...state,
    conversations,
    messages: { ...generated.messages, ...(state.messages || {}) },
    groups: { ...generated.groups, ...(state.groups || {}) },
  }
}

export function loadImState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createInitialImState()
    return attachGeneratedHistory({ ...createInitialImState(), ...JSON.parse(raw) })
  } catch {
    return createInitialImState()
  }
}

export function saveImState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function resetImState() {
  const next = createInitialImState()
  saveImState(next)
  return next
}
