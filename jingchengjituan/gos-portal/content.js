// Replace this example release set with the client's approved release history.
// An installer URL is required before any download action becomes available.
export const releaseCatalog = {
  example: true,
  latestId: '1.3.0',
  releases: [
    {
      id: '1.3.0', date: '2026-09-18', title: '让协作，更进一步',
      summary: '客户连接、AI 协同与业务洞察，在同一个客户端中有序展开。',
      retainInstaller: true,
      installers: { windows: null, macos: null },
      changes: [
        { type: '新增', text: '集中查看客户会话与业务协同入口。' },
        { type: '优化', text: '调整 AI 助手与知识引用的使用体验。' },
        { type: '优化', text: '完善业务看板的信息层级。' },
      ],
    },
    {
      id: '1.2.2', date: '2026-09-04', title: '把细节，打磨得更顺手',
      summary: '围绕会话与线索，优化日常工作体验。',
      retainInstaller: true,
      installers: { windows: null, macos: null },
      changes: [
        { type: '优化', text: '优化会话列表与线索查看体验。' },
        { type: '修复', text: '修复部分界面的显示问题。' },
      ],
    },
    {
      id: '1.2.1', date: '2026-08-28', title: '一次小而重要的改进',
      summary: '持续改善客户端的日常使用体验。',
      retainInstaller: false,
      installers: { windows: null, macos: null },
      changes: [{ type: '优化', text: '调整部分操作提示与界面反馈。' }],
    },
    {
      id: '1.2.0', date: '2026-08-14', title: '让团队知识，流动起来',
      summary: '将团队知识与 AI 协同入口连接起来。',
      retainInstaller: true,
      installers: { windows: null, macos: null },
      changes: [
        { type: '新增', text: '增加团队知识的集中查看入口。' },
        { type: '优化', text: '优化 AI 助手的内容展示。' },
      ],
    },
  ],
}

export const collections = [
  { id: 'start', title: '快速开始', description: '从安装到上手，开始第一项工作。', icon: 'grid', color: 'blue' },
  { id: 'customer', title: '客户与会话', description: '让沟通有上下文，让跟进有方向。', icon: 'chat', color: 'cyan' },
  { id: 'ai', title: 'AI 协同', description: '认识并用好你的智能工作伙伴。', icon: 'spark', color: 'violet' },
  { id: 'knowledge', title: '知识与数据', description: '沉淀团队经验，看见业务变化。', icon: 'book', color: 'green' },
]

export const articles = [
  {
    id: 'install-client', collection: 'start', title: '下载与安装 GOS 客户端',
    description: '选择适合当前系统的安装包，完成首次准备。',
    keywords: ['Windows', 'macOS', '下载', '安装', '客户端'],
    sections: [
      { title: '选择你的系统', text: '进入版本下载，在同一个版本的下载区域选择 Windows 或 macOS 安装包。两个系统同期发布，共用版本号与更新记录。' },
      { title: '获取安装包', text: '在最新版本区域下载安装包。按钮不可用时，表示该系统的安装包暂未提供。' },
      { title: '安装并打开客户端', text: '下载完成后，按安装程序的指引完成安装，再从电脑中打开 GOS 客户端。' },
    ], action: { view: 'downloads', label: '前往版本下载' },
  },
  {
    id: 'workspace-basics', collection: 'start', title: '认识你的工作空间',
    description: '了解 GOS 的主要工作区域与常用入口。', keywords: ['登录', '首页', '导航', '工作台'],
    sections: [
      { title: '进入工作空间', text: '打开 GOS 客户端并完成登录，进入团队的工作空间。' },
      { title: '认识主要入口', text: '通过导航访问销售工作台、会话管理、AI 助手、知识库与业务看板。' },
      { title: '从具体任务开始', text: '先选择一条客户会话，或向 AI 助手提出一个明确的业务问题。可见功能以当前账号权限为准。' },
    ],
  },
  {
    id: 'release-guide', collection: 'start', title: '查看版本与更新记录',
    description: '了解最新变化，找到保留的历史版本。', keywords: ['历史版本', '升级', '更新记录', '时间轴'],
    sections: [
      { title: '查看最新版本', text: '版本下载页首先展示最新版本及对应系统的安装包入口。' },
      { title: '了解更新内容', text: '更新时间轴按日期从新到旧排列，展开一条记录即可查看新增、优化与修复内容。' },
      { title: '查找历史版本', text: '历史版本区域提供部分保留版本的入口。并非每条更新记录都保留安装包，具体以对应版本的下载状态为准。' },
    ], action: { view: 'downloads', label: '查看版本记录' },
  },
  {
    id: 'customer-conversations', collection: 'customer', title: '查看与管理客户会话',
    description: '结合沟通记录，了解客户需求与业务背景。', keywords: ['SCRM', '消息', '客户', '会话'],
    sections: [
      { title: '找到客户会话', text: '进入销售工作台，在会话列表中选择需要处理的客户会话。' },
      { title: '阅读沟通上下文', text: '查看消息及相关资料，确认客户当前关注的问题与已沟通的内容。' },
      { title: '继续跟进', text: '结合当前业务进度继续沟通。涉及价格、交期等重要信息时，先核实依据。' },
    ],
  },
  {
    id: 'lead-handover', collection: 'customer', title: '线索分配与人工交接',
    description: '在团队协作中接续线索，减少信息遗漏。', keywords: ['线索', '转人工', '交接', '分配'],
    sections: [
      { title: '查看待处理事项', text: '从会话管理进入线索分配或转人工，查看当前账号可处理的事项。' },
      { title: '了解交接背景', text: '先阅读相关会话，确认客户问题与已有处理进展。' },
      { title: '按团队分工接续', text: '根据团队的分配与交接规则继续跟进，以页面实际提供的操作为准。' },
    ],
  },
  {
    id: 'choose-ai', collection: 'ai', title: '选择合适的 AI 助手',
    description: '认识 AI 业务员、AI 销冠与 AI 翻译。', keywords: ['业务员', '销冠', '翻译', '助手', 'AI'],
    sections: [
      { title: 'AI 业务员', text: '进入 AI 业务员，查看与客户接待、线索跟进有关的配置与工作入口。' },
      { title: 'AI 销冠', text: '围绕具体客户或业务问题，结合关联会话与知识进行分析。' },
      { title: 'AI 翻译', text: '需要跨语言理解与沟通时，使用 AI 翻译入口处理相关内容。' },
    ],
  },
  {
    id: 'ai-context', collection: 'ai', title: '让 AI 更好地理解你的问题',
    description: '提供目标与上下文，获得更有用的回答。', keywords: ['提问', '提示词', '上下文', '引用', 'AI'],
    sections: [
      { title: '把目标说清楚', text: '说明想解决的问题，以及希望得到总结、分析还是行动建议。' },
      { title: '提供相关背景', text: '关联必要的会话或知识，并补充当前业务情况，避免让助手猜测关键事实。' },
      { title: '核对后再使用', text: '检查回答与引用依据，重要结论结合实际业务再次确认。' },
    ],
  },
  {
    id: 'team-knowledge', collection: 'knowledge', title: '认识团队知识库',
    description: '把产品资料与团队经验放在可查找的位置。', keywords: ['知识库', '资料', '文档', '经验'],
    sections: [
      { title: '找到团队资料', text: '通过知识库入口查看当前账号有权限访问的内容。' },
      { title: '理解资料范围', text: '阅读资料前确认主题、内容与适用场景，注意不同版本之间的差异。' },
      { title: '连接业务问题', text: '在 AI 协同中按需要关联知识，让回答拥有更明确的业务依据。' },
    ],
  },
  {
    id: 'business-insights', collection: 'knowledge', title: '查看与理解业务看板',
    description: '选择观察范围，从指标变化中找到线索。', keywords: ['运营', '项目', '业务', '看板', '筛选', '数据'],
    sections: [
      { title: '选择观察视角', text: '进入运营看板、项目看板或业务看板，选择与当前问题有关的视角。' },
      { title: '确认数据范围', text: '按页面提供的时间与业务条件筛选，先了解当前指标的范围。' },
      { title: '结合明细理解变化', text: '从指标与趋势进入具体问题，结合业务背景判断下一步行动。' },
    ],
  },
]

export const faqs = [
  { id: 'supported-systems', collection: 'start', question: 'GOS 支持哪些操作系统？', answer: 'GOS 提供 Windows 和 macOS 客户端。请在版本下载中选择与你的电脑系统一致的安装包。' },
  { id: 'history-downloads', collection: 'start', question: '可以下载历史版本吗？', answer: '可以，历史版本区域保留部分版本。点击对应版本查看详情与系统安装包；仅有更新记录的版本不提供下载入口。' },
  { id: 'missing-installer', collection: 'start', question: '为什么下载按钮暂时不可用？', answer: '这表示当前系统与版本的安装包暂未提供。你仍可查看更新记录，安装包提供后即可下载。' },
  { id: 'missing-function', collection: 'customer', question: '为什么看不到某些功能入口？', answer: '可见功能与当前账号权限有关。请先确认登录账号和所在团队，再联系团队管理员核对权限。' },
  { id: 'ai-answer', collection: 'ai', question: 'AI 的回答需要再次核对吗？', answer: '需要。请结合回答引用的资料与实际业务情况，核对价格、交期、客户承诺等重要信息后再使用。' },
  { id: 'dashboard-range', collection: 'knowledge', question: '看板数据为什么会不一样？', answer: '不同看板、时间或业务筛选可能对应不同数据范围。比较前请先对齐时间与筛选条件，再核对指标含义。' },
]
