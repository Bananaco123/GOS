/**
 * 知识库 Mock 数据（v9 重构 · 见「关键逻辑.md §2.13」）
 *
 * 三层架构：库（Library）→ 分组（≤2 级树）→ 条目
 *   - 库：最高组织单元，带可见范围（企业/部门/个人），定义在 mock/library.js
 *   - 分组：归属于某个库（顶层分组带 library_id，子分组继承）
 *   - 条目：归属于某个分组；两大类 kind = 'qa'（问答类）/ 'doc'（文档多模态类）
 *
 * 条目状态机（简化 3 态 + 待发布标记）：
 *   - status: 'published'(生效中) / 'draft'(草稿) / 'offline'(已下线)   ← 线上生效态，驱动 Agent 召回
 *   - pending: true/false                                              ← 是否有未发布改动（● 待发布）
 */

// ============================================================
// 知识类型：两大类（kind）
// ============================================================
export const KB_KINDS = [
  { id: 'qa', name: '问答类', color: 'blue', icon: 'qa', desc: '知识点 + 相似问 + 回复策略' },
  { id: 'doc', name: '文档类', color: 'purple', icon: 'doc', desc: '上传文件 + 摘要（附件本体不在 SCRM 侧解析）' },
]
export const kindMeta = (id) => KB_KINDS.find((k) => k.id === id)

// 文档多模态类的附件格式（仅展示属性，不再是独立"类型"）
export const DOC_FORMATS = {
  pdf: { label: 'PDF', color: 'orange' },
  doc: { label: '文档', color: 'cyan' },
  excel: { label: 'Excel', color: 'green' },
  image: { label: '图片', color: 'green' },
  video: { label: '视频', color: 'purple' },
}

// 旧 5 类 → 兼容映射（KnowledgeTab 等历史代码若引用 KB_TYPES 仍可用）
export const KB_TYPES = [
  { id: 'kt-faq', name: 'FAQ 对', color: 'blue', kind: 'qa' },
  { id: 'kt-doc', name: '文档', color: 'cyan', kind: 'doc', format: 'doc' },
  { id: 'kt-img', name: '图片附件', color: 'green', kind: 'doc', format: 'image' },
  { id: 'kt-pdf', name: 'PDF 资料', color: 'orange', kind: 'doc', format: 'pdf' },
  { id: 'kt-video', name: '视频', color: 'purple', kind: 'doc', format: 'video' },
]

// ============================================================
// 知识库分组（树形）· 顶层分组带 library_id，子分组继承
// ============================================================
export const KB_GROUPS = [
  {
    id: 'kg-product',
    name: '产品图册',
    code: 'product_catalog',
    description: '全品类产品图册、效果图、规格说明',
    parent_id: null,
    library_id: 'lib-na',
    order: 1,
    children: [
      { id: 'kg-product-kitchen', name: '厨柜', code: 'kitchen_cabinet', parent_id: 'kg-product', order: 1 },
      { id: 'kg-product-wardrobe', name: '衣柜', code: 'wardrobe', parent_id: 'kg-product', order: 2 },
      { id: 'kg-product-flooring', name: '地板', code: 'flooring', parent_id: 'kg-product', order: 3 },
      { id: 'kg-product-whole', name: '整装', code: 'whole_house', parent_id: 'kg-product', order: 4 },
    ],
  },
  {
    id: 'kg-faq',
    name: '通用 FAQ',
    code: 'general_faq',
    description: '客户高频问题与标准回答',
    parent_id: null,
    library_id: 'lib-company',
    order: 2,
    children: [
      { id: 'kg-faq-shipping', name: '物流 FAQ', code: 'shipping_faq', parent_id: 'kg-faq', order: 1 },
      { id: 'kg-faq-warranty', name: '质保 FAQ', code: 'warranty_faq', parent_id: 'kg-faq', order: 2 },
      { id: 'kg-faq-install', name: '安装 FAQ', code: 'install_faq', parent_id: 'kg-faq', order: 3 },
    ],
  },
  {
    id: 'kg-sop',
    name: 'SOP 话术',
    code: 'sop_scripts',
    description: '不同场景的标准应对话术',
    parent_id: null,
    library_id: 'lib-na',
    order: 3,
    children: [
      { id: 'kg-sop-pricing', name: '定价话术', code: 'pricing_sop', parent_id: 'kg-sop', order: 1 },
      { id: 'kg-sop-emotion', name: '情绪安抚', code: 'emotion_sop', parent_id: 'kg-sop', order: 2 },
      { id: 'kg-sop-wakeup', name: '唤醒话术', code: 'wakeup_sop', parent_id: 'kg-sop', order: 3 },
    ],
  },
  {
    id: 'kg-policy',
    name: '公司政策',
    code: 'company_policy',
    description: '退换货、保密、合规等政策文件',
    parent_id: null,
    library_id: 'lib-company',
    order: 4,
    children: [
      { id: 'kg-policy-return', name: '退换货', code: 'return_policy', parent_id: 'kg-policy', order: 1 },
      { id: 'kg-policy-compliance', name: '合规与隐私', code: 'compliance_policy', parent_id: 'kg-policy', order: 2 },
    ],
  },
  {
    id: 'kg-case',
    name: '成功案例',
    code: 'success_cases',
    description: '已成交客户案例，用于背书',
    parent_id: null,
    library_id: 'lib-na',
    order: 5,
    children: [
      { id: 'kg-case-high', name: '高客单案例', code: 'high_budget_case', parent_id: 'kg-case', order: 1 },
      { id: 'kg-case-std', name: '标准案例', code: 'std_case', parent_id: 'kg-case', order: 2 },
    ],
  },
  // ---- v9 新增：东南亚销售库（部门级·海外营销二部）的分组 ----
  {
    id: 'kg-sea',
    name: '东南亚本地化',
    code: 'sea_local',
    description: '东南亚三国（新马印）本地化政策与话术',
    parent_id: null,
    library_id: 'lib-sea',
    order: 6,
    children: [
      { id: 'kg-sea-faq', name: '本地化 FAQ', code: 'sea_faq', parent_id: 'kg-sea', order: 1 },
    ],
  },
  // ---- v9 新增：个人草稿库（个人级·Gao Kui）的分组 ----
  {
    id: 'kg-my',
    name: '我的话术草稿',
    code: 'my_scratch',
    description: '个人暂存、尚未沉淀到团队库的草稿',
    parent_id: null,
    library_id: 'lib-my',
    order: 7,
    children: [
      { id: 'kg-my-followup', name: '跟进催单', code: 'my_followup', parent_id: 'kg-my', order: 1 },
      { id: 'kg-my-pricing', name: '议价话术', code: 'my_pricing', parent_id: 'kg-my', order: 2 },
    ],
  },
]

// 扁平化分组（含层级路径 + library_id 继承）
export const KB_GROUPS_FLAT = (() => {
  const result = []
  KB_GROUPS.forEach((top) => {
    result.push({ ...top, path: top.name, level: 1, isLeaf: !top.children?.length, library_id: top.library_id })
    if (top.children) {
      top.children.forEach((sub) => {
        result.push({ ...sub, path: `${top.name} / ${sub.name}`, level: 2, isLeaf: true, library_id: top.library_id })
      })
    }
  })
  return result
})()

// 分组 id → 库 id 映射
export const KB_GROUP_LIBRARY = (() => {
  const map = {}
  KB_GROUPS_FLAT.forEach((g) => { map[g.id] = g.library_id })
  return map
})()
export const groupLibraryId = (groupId) => KB_GROUP_LIBRARY[groupId] || null

// ============================================================
// 知识库标签
// ============================================================
export const KB_TAGS = [
  { id: 'tag-na', name: '北美市场', color: 'blue' },
  { id: 'tag-mea', name: '中东市场', color: 'cyan' },
  { id: 'tag-sea', name: '东南亚市场', color: 'green' },
  { id: 'tag-high-budget', name: '高客单', color: 'red' },
  { id: 'tag-low-budget', name: '中低客单', color: 'gold' },
  { id: 'tag-builder', name: 'Builder 客户', color: 'purple' },
  { id: 'tag-homeowner', name: '业主客户', color: 'magenta' },
  { id: 'tag-designer', name: '设计师客户', color: 'orange' },
  { id: 'tag-must-have', name: '必备话术', color: 'red' },
  { id: 'tag-high-frequency', name: '高频问题', color: 'volcano' },
]

// ============================================================
// 知识库条目
// ============================================================
export const KB_ENTRIES = [
  // ---- FAQ（问答类）----
  {
    id: 'ke-faq-001',
    title: '加拿大到货时间多久？',
    type_id: 'kt-faq',
    group_id: 'kg-faq-shipping',
    tags: ['tag-na', 'tag-high-frequency'],
    status: 'published',
    contributor: 'Mike Liu',
    contributor_avatar: 'ML',
    used_count: 1247,
    updated_at: '2026-05-28 14:32',
    summary: '加拿大全境海运 6-8 周，多伦多/温哥华空运补货 14 天',
    similar_questions: ['How long is delivery to Canada?', '发到加拿大要多久', 'Canada shipping time'],
    content: 'Q: How long does shipping take to Canada?\n\nA: For sea freight to Toronto / Vancouver / Montreal, the standard delivery window is 6-8 weeks door-to-port. We also offer air-freight top-up for urgent items at 14 days. Customs clearance and last-mile delivery typically add 3-5 business days.',
  },
  {
    id: 'ke-faq-002',
    title: '迪拜地区如何报关？',
    type_id: 'kt-faq',
    group_id: 'kg-faq-shipping',
    tags: ['tag-mea', 'tag-high-frequency'],
    status: 'published',
    contributor: 'Hassan Al',
    contributor_avatar: 'HA',
    used_count: 482,
    updated_at: '2026-05-24 09:18',
    summary: '迪拜杰贝阿里港 FCL/LCL 双通道；建议客户提前提供 ITC、HS Code',
    content: 'Q: How does customs clearance work for Dubai?\n\nA: We use Jebel Ali Port for both FCL (full container) and LCL (consolidated) shipments. For smooth clearance, please provide: 1) Importer Trade Code (ITC); 2) HS Code for each item; 3) Final invoice in customs format. Average clearance: 5-7 business days after arrival.',
  },
  {
    id: 'ke-faq-003',
    title: '质保期是多久？包含哪些范围？',
    type_id: 'kt-faq',
    group_id: 'kg-faq-warranty',
    tags: ['tag-high-frequency', 'tag-must-have'],
    status: 'published',
    contributor: 'Linda Chen',
    contributor_avatar: 'LC',
    used_count: 2891,
    updated_at: '2026-05-30 16:48',
    summary: '主体 10 年 / 五金 3 年 / 漆面 5 年；正常使用与运输损坏均覆盖',
    similar_questions: ['What is the warranty?', '保修多久', 'warranty coverage'],
    content: 'Q: What is your warranty policy?\n\nA: Standard warranty:\n- Cabinet body: 10 years\n- Hardware (hinges/slides): 3 years\n- Surface finish (paint/laminate): 5 years\n\nCovered: normal use defects, shipping damage (must report within 7 days of receipt).\nNot covered: misuse, water damage from external sources, third-party modification.',
  },
  {
    id: 'ke-faq-004',
    title: '是否提供上门安装服务？',
    type_id: 'kt-faq',
    group_id: 'kg-faq-install',
    tags: ['tag-na', 'tag-high-frequency'],
    status: 'published',
    contributor: 'Sara Wang',
    contributor_avatar: 'SW',
    used_count: 938,
    updated_at: '2026-05-22 11:00',
    summary: '北美仅多伦多 / 温哥华 / 蒙特利尔 3 城自营安装；其它城市合作 Builder',
    content: 'Q: Do you provide on-site installation?\n\nA: We currently offer in-house installation in Greater Toronto Area, Vancouver Metro, and Montreal. For other cities in Canada/US, we partner with local certified builders — we can recommend one in your area or work with your own builder.',
  },
  {
    id: 'ke-faq-005',
    title: 'Builder 批发价是怎么算的？',
    type_id: 'kt-faq',
    group_id: 'kg-faq',
    tags: ['tag-builder', 'tag-na'],
    status: 'published',
    contributor: 'James Lin',
    contributor_avatar: 'JL',
    used_count: 421,
    updated_at: '2026-05-18 10:24',
    summary: 'Builder 6 单 / 年起，享 18%-25% 折扣，独立账期 30 天',
    content: 'Q: How does Builder pricing work?\n\nA: For verified Builders with ≥6 projects/year:\n- 18% off MSRP on cabinets\n- 25% off on hardware bundles\n- Net 30 payment terms\n- Dedicated account manager\n\nPlease submit your business license + recent 3 invoices for verification.',
  },

  // ---- 产品图册（文档多模态类）----
  {
    id: 'ke-cat-kitchen-modern',
    title: '现代风厨柜系列 · 2026 春季新品',
    type_id: 'kt-pdf',
    group_id: 'kg-product-kitchen',
    tags: ['tag-na', 'tag-high-budget', 'tag-must-have'],
    status: 'published',
    contributor: 'Eric Zhao',
    contributor_avatar: 'EZ',
    used_count: 3201,
    updated_at: '2026-05-15 09:00',
    summary: '20 款现代风厨柜，含规格 / 材质 / 价格区间 / 渲染效果图',
    content: '本图册包含 2026 春季新品 20 款现代风厨柜：\n- 配色系列：哑光白 / 烟熏灰 / 雾橡木 / 焦糖榉木\n- 价格区间：USD 12,800 - USD 28,500（10×12 ft 标准厨房）\n- 材质：欧标 E1 板 / 软关闭五金 / 进口铰链\n- 包含 3 种岛台方案与 5 种把手风格',
    file_url: 'kitchen-modern-2026-spring.pdf',
    file_size: '12.4 MB',
  },
  {
    id: 'ke-cat-wardrobe-walkin',
    title: '步入式衣帽间系列',
    type_id: 'kt-pdf',
    group_id: 'kg-product-wardrobe',
    tags: ['tag-high-budget', 'tag-homeowner'],
    status: 'published',
    contributor: 'Linda Chen',
    contributor_avatar: 'LC',
    used_count: 1842,
    updated_at: '2026-05-12 14:18',
    summary: '12 款步入式衣帽间方案 + 模块化定制工具',
    content: '步入式衣帽间系列包含 12 套方案模板：\n- 适用面积：6 ft × 8 ft 至 12 ft × 16 ft\n- 模块组合：双面柜体 / 中岛抽屉 / 玻璃门展柜 / LED 感应灯\n- 起步价：USD 8,500',
    file_url: 'wardrobe-walkin.pdf',
    file_size: '8.2 MB',
  },
  {
    id: 'ke-cat-flooring',
    title: '强化木地板全品类目录',
    type_id: 'kt-pdf',
    group_id: 'kg-product-flooring',
    tags: ['tag-low-budget'],
    status: 'published',
    contributor: 'Mike Liu',
    contributor_avatar: 'ML',
    used_count: 624,
    updated_at: '2026-04-28 11:45',
    summary: '5 个系列 35 个 SKU，含 AC3/AC4 等级耐磨与防水说明',
    content: '强化木地板目录涵盖：\n- 经典系列（AC3 耐磨，住宅）\n- 商用系列（AC4 耐磨）\n- 防水系列（专为厨房/卫生间）\n- 仿真木纹 / 大理石纹 / 水泥纹 三大风格',
    file_url: 'flooring-catalog-2026.pdf',
    file_size: '6.7 MB',
  },
  {
    id: 'ke-cat-whole-package',
    title: '整装方案 · 100㎡ 户型',
    type_id: 'kt-pdf',
    group_id: 'kg-product-whole',
    tags: ['tag-high-budget', 'tag-must-have'],
    status: 'published',
    contributor: 'Sara Wang',
    contributor_avatar: 'SW',
    used_count: 1156,
    updated_at: '2026-05-08 16:30',
    summary: '北美主流 100㎡ 户型整装包：厨柜 + 衣柜 + 地板 + 五金一站式',
    content: '100㎡ 户型整装方案：\n- 标准包：USD 32,800（含主体材料 + 五金）\n- 升级包：USD 48,500（增加岛台 + 步入式衣帽间）\n- 旗舰包：USD 68,500（全屋定制 + 智能感应）\n\n3 种户型布局可选，含 3D 渲染图。',
    file_url: 'whole-package-100sqm.pdf',
    file_size: '18.9 MB',
  },
  {
    id: 'ke-cat-kitchen-classic',
    title: '经典美式厨柜系列',
    type_id: 'kt-pdf',
    group_id: 'kg-product-kitchen',
    tags: ['tag-na', 'tag-homeowner'],
    status: 'published',
    contributor: 'Mike Liu', contributor_avatar: 'ML',
    used_count: 712,
    updated_at: '2026-05-14 10:20',
    summary: '15 款经典美式实木厨柜，含护墙板与造型线条配置',
    content: '经典美式厨柜系列：\n- 实木门板（樱桃木 / 枫木 / 橡木）\n- 价格区间：USD 15,800 - USD 32,000\n- 含护墙板、罗马柱、造型线条选配',
    file_url: 'kitchen-classic.pdf', file_size: '10.1 MB',
  },
  {
    id: 'ke-cat-kitchen-island',
    title: '厨房中岛定制方案',
    type_id: 'kt-pdf',
    group_id: 'kg-product-kitchen',
    tags: ['tag-na', 'tag-high-budget'],
    status: 'published',
    contributor: 'Sara Wang', contributor_avatar: 'SW',
    used_count: 489,
    updated_at: '2026-05-11 15:40',
    summary: '8 种中岛方案：含水槽位、早餐吧台、储物组合',
    content: '厨房中岛定制方案：\n- 尺寸：4-10 ft\n- 台面：石英石 / 大理石 / 不锈钢\n- 可集成水槽、洗碗机、早餐吧台',
    file_url: 'kitchen-island.pdf', file_size: '7.3 MB',
  },
  {
    id: 'ke-cat-wardrobe-sliding',
    title: '推拉门衣柜系列',
    type_id: 'kt-pdf',
    group_id: 'kg-product-wardrobe',
    tags: ['tag-na', 'tag-low-budget'],
    status: 'published',
    contributor: 'Linda Chen', contributor_avatar: 'LC',
    used_count: 356,
    updated_at: '2026-05-09 09:30',
    summary: '10 款推拉门衣柜，适合小户型，含软关闭轨道',
    content: '推拉门衣柜系列：\n- 门板：镜面 / 烤漆 / 木纹\n- 起步价：USD 3,200\n- 软关闭轨道、防尘条标配',
    file_url: 'wardrobe-sliding.pdf', file_size: '6.0 MB',
  },
  {
    id: 'ke-cat-flooring-spc',
    title: 'SPC 石塑地板目录',
    type_id: 'kt-pdf',
    group_id: 'kg-product-flooring',
    tags: ['tag-na', 'tag-low-budget'],
    status: 'published',
    contributor: 'Mike Liu', contributor_avatar: 'ML',
    used_count: 271,
    updated_at: '2026-05-06 14:00',
    summary: '防水耐磨 SPC 石塑地板，22 个花色，适合厨卫与商用',
    content: 'SPC 石塑地板：\n- 100% 防水，适合厨房 / 卫生间\n- 锁扣安装、免胶\n- 22 个花色，AC5 耐磨',
    file_url: 'flooring-spc.pdf', file_size: '4.8 MB',
  },
  {
    id: 'ke-cat-whole-condo',
    title: '整装方案 · 60㎡ 公寓户型',
    type_id: 'kt-pdf',
    group_id: 'kg-product-whole',
    tags: ['tag-na', 'tag-low-budget'],
    status: 'published',
    contributor: 'Sara Wang', contributor_avatar: 'SW',
    used_count: 198,
    updated_at: '2026-05-04 11:10',
    summary: '60㎡ 一居公寓整装包：厨柜 + 衣柜 + 地板，适合出租 / 转售',
    content: '60㎡ 公寓整装方案：\n- 标准包：USD 18,800\n- 适合出租 / 转售项目\n- 7-10 天快速交付',
    file_url: 'whole-condo-60sqm.pdf', file_size: '9.2 MB',
  },
  {
    id: 'ke-sop-followup-002',
    title: 'SOP-跟进-002 · 报价后 48h 无回复跟进',
    type_id: 'kt-faq',
    group_id: 'kg-sop-wakeup',
    tags: ['tag-must-have'],
    status: 'published',
    contributor: 'Gao Kui', contributor_avatar: 'GK',
    used_count: 633,
    updated_at: '2026-05-19 16:00',
    summary: '客户收到报价后 48 小时未回复的标准跟进话术',
    content: '触发条件：已发送报价 + 48 小时无回复。\n\n标准话术：\n"Hi {customer_name}, just checking if you had any questions about the quote I sent. Happy to adjust the scope or walk you through the options on a quick call."',
  },

  // ---- SOP 话术（问答类，话术作为标准答案）----
  {
    id: 'ke-sop-pricing-001',
    title: 'SOP-定价话术-001 · 客户直接问价的软引导',
    type_id: 'kt-faq',
    group_id: 'kg-sop-pricing',
    tags: ['tag-must-have', 'tag-high-frequency'],
    status: 'published',
    contributor: 'Gao Kui',
    contributor_avatar: 'GK',
    used_count: 4521,
    updated_at: '2026-05-30 09:00',
    summary: '客户未提供核心信息就问价时的标准回应，引导回主流程',
    similar_questions: ['how much', 'what is the price', '多少钱', 'quote please'],
    content: '触发条件：客户消息含 "how much"、"price"、"quote" 等关键词，但核心要素（项目类型/预算/国家/数量）未收齐。\n\n标准话术：\n"Great question! Our pricing varies significantly based on a few factors. To give you the most accurate quote, could you share:\n1. What products you\'re looking at (kitchen, wardrobe, full house package)?\n2. Approximate size or units?\n3. Your delivery country?\n\nWith this info, I can pull together a personalized quote in 24 hours."',
  },
  {
    id: 'ke-sop-emotion-001',
    title: 'SOP-情绪安抚-001 · 客户辱骂或投诉的首句应对',
    type_id: 'kt-faq',
    group_id: 'kg-sop-emotion',
    tags: ['tag-must-have'],
    status: 'published',
    contributor: 'Gao Kui',
    contributor_avatar: 'GK',
    used_count: 187,
    updated_at: '2026-05-28 15:24',
    summary: '客户情绪异常时 AI 业务员的首句回应，同时触发"异常+紧急"转人工',
    content: '触发条件：客户消息匹配辱骂 / 投诉 / 威胁关键词。\n\n标准话术（中英双语备用）：\n"I sincerely apologize for the experience that\'s upset you. Your concerns are taken seriously — I\'m transferring this conversation to our senior account manager right now, who will respond within 5 minutes."\n\n同时：\n- 触发"异常+紧急"组合，SLA 5 分钟\n- 销售组长直派 + 部门管理员抄送\n- 客户档案打"情绪敏感"标签',
  },
  {
    id: 'ke-sop-wakeup-stage-1',
    title: 'SOP-唤醒-阶段1 · 询盘后 24h 未回复',
    type_id: 'kt-faq',
    group_id: 'kg-sop-wakeup',
    tags: ['tag-must-have'],
    status: 'published',
    contributor: 'Linda Chen',
    contributor_avatar: 'LC',
    used_count: 892,
    updated_at: '2026-05-25 10:12',
    summary: '客户初次询盘后 24 小时未回复的唤醒话术',
    content: '触发条件：客户最近一条消息 24 小时前 + 当前阶段 = 询盘起点。\n\n标准话术：\n"Hi {customer_name}, just following up on your inquiry about {product_type}. Did you have a chance to look over the initial info? Happy to send a customized brochure or jump on a quick call — whatever works best for you!"\n\n限制：单客户最多唤醒 1 次；唤醒后再 48h 无响应则停止 AI 接待。',
  },

  // ---- 公司政策（文档多模态类）----
  {
    id: 'ke-policy-return',
    title: '退换货政策 v2.3',
    type_id: 'kt-doc',
    group_id: 'kg-policy-return',
    tags: [],
    status: 'published',
    contributor: 'Gao Kui',
    contributor_avatar: 'GK',
    used_count: 234,
    updated_at: '2026-04-15 09:00',
    summary: '正常质量问题 30 天无理由退换；定制品仅生产环节缺陷可退',
    content: '退换货政策摘要：\n- 标准品：30 天无理由退换，客户承担来回运费\n- 定制品：仅限"出厂时缺陷"可退换，自收货起 7 天内提出\n- 损伤申诉：必须在签收 48 小时内拍照+视频上报\n- 例外条款：详见 PDF 附件',
    file_url: 'return-policy-v2.3.pdf',
    file_size: '1.2 MB',
  },

  // ---- 成功案例（文档多模态类）----
  {
    id: 'ke-case-kanchan',
    title: '案例-Kanchan Rajput 多伦多别墅整装',
    type_id: 'kt-doc',
    group_id: 'kg-case-high',
    tags: ['tag-na', 'tag-high-budget'],
    status: 'published',
    contributor: 'Mike Liu',
    contributor_avatar: 'ML',
    used_count: 156,
    updated_at: '2026-05-20 16:00',
    summary: '加拿大业主 + 旗舰整装包 USD 23,400，从询盘到成交 14 天',
    content: '客户：Kanchan Rajput\n国家：加拿大多伦多\n项目类型：别墅整装\n成交金额：USD 23,400\n成交周期：14 天\n\n关键节点：\n1. TikTok 广告 → WhatsApp 询盘\n2. AI 业务员 8 轮对话收齐 6 维信息，评级 A\n3. PM 接手 24h 内提供 3D 渲染\n4. 报价 → 议价 → 成交\n\n复盘要点：高客单业主对"3D 渲染速度"敏感，建议 A 级客户接手后 24h 内出图。',
  },

  // ---- 东南亚销售库（部门级·海外营销二部）----
  {
    id: 'ke-sea-001',
    title: '新加坡 GST 怎么计算？',
    type_id: 'kt-faq',
    group_id: 'kg-sea-faq',
    tags: ['tag-sea', 'tag-high-frequency'],
    status: 'published',
    contributor: 'Wei Chen',
    contributor_avatar: 'WC',
    used_count: 318,
    updated_at: '2026-05-29 10:30',
    summary: '新加坡进口 GST 9%，按 CIF + 关税计征；提供 GST 注册号可抵扣',
    similar_questions: ['Singapore GST', '新加坡税怎么算', 'how much tax in SG'],
    content: 'Q: How is GST calculated for Singapore?\n\nA: Singapore import GST is 9%, levied on CIF value plus duty. If you provide a valid GST registration number, the input tax is claimable. Typical lead time for SG clearance: 3-5 business days.',
  },
  {
    id: 'ke-sea-002',
    title: '东南亚三国本地化产品目录',
    type_id: 'kt-pdf',
    group_id: 'kg-sea-faq',
    tags: ['tag-sea'],
    status: 'published',
    contributor: 'COCO',
    contributor_avatar: 'CC',
    used_count: 96,
    updated_at: '2026-05-27 14:00',
    summary: '新马印三国本地化目录：本地电压/插座标准、热带防潮工艺、清真认证说明',
    content: '东南亚三国本地化目录：\n- 电压/插座：新加坡 230V / 马来 240V / 印尼 220V\n- 防潮工艺：热带高湿环境专用封边\n- 清真认证：印尼市场提供 Halal 物料证明',
    file_url: 'sea-localized-catalog.pdf',
    file_size: '5.1 MB',
  },
  {
    id: 'ke-sea-draft-001',
    title: '【草稿】印尼清真认证（Halal）常见问题',
    type_id: 'kt-faq',
    group_id: 'kg-sea-faq',
    tags: ['tag-sea'],
    status: 'draft',
    pending: true,
    contributor: 'COCO',
    contributor_avatar: 'CC',
    used_count: 0,
    updated_at: '2026-06-02 16:20',
    summary: '印尼市场清真认证流程与所需物料证明（草稿待补全）',
    content: 'Q: Do your products have Halal certification for Indonesia?\n\nA: （草稿待补全）We provide Halal material certificates for the Indonesian market...',
  },

  // ---- 草稿态条目（演示用，含 ● 待发布）----
  {
    id: 'ke-draft-001',
    title: '【草稿】智能家居集成 FAQ',
    type_id: 'kt-faq',
    group_id: 'kg-faq',
    tags: ['tag-high-budget'],
    status: 'draft',
    pending: true,
    contributor: 'Sara Wang',
    contributor_avatar: 'SW',
    used_count: 0,
    updated_at: '2026-05-31 23:48',
    summary: '客户咨询智能家居集成（HomeKit / Google Home / Alexa）兼容性问题',
    content: 'Q: Are your cabinets compatible with smart home systems?\n\nA: （草稿待补全）Our smart-ready cabinets support HomeKit / Google Home / Alexa for lighting and sensor modules...',
  },
  {
    id: 'ke-draft-002',
    title: '【草稿】SOP-客户图纸版本不一致处理',
    type_id: 'kt-faq',
    group_id: 'kg-sop',
    tags: ['tag-builder'],
    status: 'draft',
    pending: true,
    contributor: 'Eric Zhao',
    contributor_avatar: 'EZ',
    used_count: 0,
    updated_at: '2026-05-30 11:24',
    summary: 'Builder 客户提供多个版本图纸时的标准处理流程',
    content: '草稿内容暂存中...',
  },
  {
    id: 'ke-my-001',
    title: '【草稿】高客单客户的 3D 渲染催单话术',
    type_id: 'kt-faq',
    group_id: 'kg-my-followup',
    tags: ['tag-high-budget', 'tag-must-have'],
    status: 'draft',
    pending: true,
    contributor: 'Gao Kui',
    contributor_avatar: 'GK',
    used_count: 0,
    updated_at: '2026-06-02 18:10',
    summary: '个人暂存：A 级客户接手后 24h 内出 3D 渲染的内部催单话术',
    content: '个人草稿：用于提醒 PM 对 A 级客户 24h 内出图，尚未沉淀到团队库。',
  },

  // ---- 下线条目（演示用）----
  {
    id: 'ke-offline-001',
    title: '欧元区报价模板（已下线，使用 v3.5 替代）',
    type_id: 'kt-doc',
    group_id: 'kg-policy-compliance',
    tags: [],
    status: 'offline',
    contributor: 'Hassan Al',
    contributor_avatar: 'HA',
    used_count: 89,
    updated_at: '2026-03-18 14:00',
    summary: '【已下线】请使用 ke-policy-return v2.3 + 单独的欧元区汇率换算表',
    content: '此条目已于 2026-04 下线，被引用的 Agent 应当移除引用关系。',
    file_url: 'eur-quote-template-v3.0.xlsx',
    file_size: '0.3 MB',
  },
]

// ============================================================
// 后处理：为每条注入派生字段（kind / library_id / pending / similar_questions / doc_format）
//   —— 避免逐条手填，且保证与分组→库映射一致
// ============================================================
KB_ENTRIES.forEach((e) => {
  const typeMeta = KB_TYPES.find((t) => t.id === e.type_id)
  if (!e.kind) e.kind = typeMeta?.kind || 'qa'
  if (e.kind === 'doc' && !e.doc_format) e.doc_format = typeMeta?.format || 'doc'
  if (e.kind === 'qa' && !e.similar_questions) e.similar_questions = []
  e.library_id = groupLibraryId(e.group_id)
  if (e.pending === undefined) e.pending = false
})
