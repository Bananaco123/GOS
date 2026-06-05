/**
 * WhatsApp 云账号 Mock 数据（按 PRD §5.1.2 / §3.3）
 *
 * 字段说明：
 *   bsuid: WhatsApp 云账号唯一 ID（脱敏只显示后 4 位）
 *   sales_group_id: 归属销售组（PRD 强制：跨销售组不可借用）
 *   status: 'online' | 'offline'
 *   ref_agent_id: 当前被哪个 Agent 实例引用（null 表示未引用），同一时刻仅可被 1 个 Agent 引用
 *   is_test: 备注中含"测试"关键字（PRD §5.1.5 预发布通道识别用）
 *   online_duration: 在线账号的本次在线时长（离线为 null）
 *   last_online_at: 上次在线时间（离线账号用于「上次在线」列展示）
 */

// 在线账号的「本次在线时长」查表（演示用）
const ONLINE_DURATION = {
  'BS-OK-NA-A01-x9F2': '6 小时',
  'BS-OK-NA-A02-7gK1': '1 天 8 小时',
  'BS-OK-NA-A04-aZ3v': '3 小时',
  'BS-OK-NA-T01-Tt0q': '12 小时',
  'BS-OK-NA-A05-9wQt': '40 分钟',
  'BS-OK-MEA-A01-uW2x': '2 天 3 小时',
  'BS-OK-MEA-A02-bV6m': '5 小时',
  'BS-OK-SEA-A01-cR4n': '9 小时',
  'BS-OK-SEA-A02-dT7p': '1 小时',
  'BS-OK-SEA-T01-fU9j': '25 分钟',
}

export const CLOUD_ACCOUNTS = [
  // ---- 北美组（用于演示）----
  {
    bsuid: 'BS-OK-NA-A01-x9F2',
    account_name: 'OK-Group-NA-A1',
    phone: '+1 416 ****0575',
    sales_group_id: 'sg-na',
    owner_name: 'Mike Liu',
    owner_avatar: 'ML',
    status: 'online',
    ref_agent_id: 'agent-na-formal',
    remark: '北美主力账号',
    is_test: false,
    last_online_at: '2026-06-01 00:48:23',
  },
  {
    bsuid: 'BS-OK-NA-A02-7gK1',
    account_name: 'OK-Group-NA-A2',
    phone: '+1 647 ****1842',
    sales_group_id: 'sg-na',
    owner_name: 'Linda Chen',
    owner_avatar: 'LC',
    status: 'online',
    ref_agent_id: 'agent-na-formal',
    remark: '北美主力账号',
    is_test: false,
    last_online_at: '2026-06-01 00:51:02',
  },
  {
    bsuid: 'BS-OK-NA-A03-2mP8',
    account_name: 'OK-Group-NA-A3',
    phone: '+1 905 ****2391',
    sales_group_id: 'sg-na',
    owner_name: 'James Lin',
    owner_avatar: 'JL',
    status: 'offline',
    ref_agent_id: 'agent-na-formal',
    remark: '北美 GTA 区域 · 需补登',
    is_test: false,
    last_online_at: '2026-05-31 16:24:08',
  },
  {
    bsuid: 'BS-OK-NA-A04-aZ3v',
    account_name: 'OK-Group-NA-A4',
    phone: '+1 514 ****8847',
    sales_group_id: 'sg-na',
    owner_name: 'Sara Wang',
    owner_avatar: 'SW',
    status: 'online',
    ref_agent_id: null,
    remark: '魁北克 · 法语市场',
    is_test: false,
    last_online_at: '2026-06-01 00:32:15',
  },
  {
    bsuid: 'BS-OK-NA-T01-Tt0q',
    account_name: 'OK-Group-NA-Test01',
    phone: '+1 416 ****0099',
    sales_group_id: 'sg-na',
    owner_name: 'Gao Kui',
    owner_avatar: 'GK',
    status: 'online',
    ref_agent_id: 'agent-na-formal',
    remark: '测试通道账号 · 仅用于预发布验证',
    is_test: true,
    last_online_at: '2026-06-01 00:53:48',
  },
  {
    bsuid: 'BS-OK-NA-A05-9wQt',
    account_name: 'OK-Group-NA-A5',
    phone: '+1 778 ****6271',
    sales_group_id: 'sg-na',
    owner_name: 'Eric Zhao',
    owner_avatar: 'EZ',
    status: 'online',
    ref_agent_id: null,
    remark: '温哥华区',
    is_test: false,
    last_online_at: '2026-06-01 00:42:01',
  },

  // ---- 中东组 ----
  {
    bsuid: 'BS-OK-MEA-A01-uW2x',
    account_name: 'OK-Group-MEA-A1',
    phone: '+971 50 ****3349',
    sales_group_id: 'sg-mea',
    owner_name: 'Hassan Al',
    owner_avatar: 'HA',
    status: 'online',
    ref_agent_id: null,
    remark: '迪拜主账号',
    is_test: false,
    last_online_at: '2026-06-01 00:50:18',
  },
  {
    bsuid: 'BS-OK-MEA-A02-bV6m',
    account_name: 'OK-Group-MEA-A2',
    phone: '+966 55 ****7720',
    sales_group_id: 'sg-mea',
    owner_name: 'Khalid Bin',
    owner_avatar: 'KB',
    status: 'online',
    ref_agent_id: null,
    remark: '沙特利雅得',
    is_test: false,
    last_online_at: '2026-06-01 00:45:33',
  },

  // ---- 东南亚组 ----
  {
    bsuid: 'BS-OK-SEA-A01-cR4n',
    account_name: 'OK-Group-SEA-A1',
    phone: '+65 9128 ****52',
    sales_group_id: 'sg-sea',
    owner_name: 'Wei Chen',
    owner_avatar: 'WC',
    status: 'online',
    ref_agent_id: null,
    remark: '新加坡主账号',
    is_test: false,
    last_online_at: '2026-06-01 00:48:22',
  },
  {
    bsuid: 'BS-OK-SEA-A02-dT7p',
    account_name: 'OK-Group-SEA-A2',
    phone: '+60 12 ****8849',
    sales_group_id: 'sg-sea',
    owner_name: 'Vivian Tan',
    owner_avatar: 'VT',
    status: 'online',
    ref_agent_id: null,
    remark: '吉隆坡',
    is_test: false,
    last_online_at: '2026-06-01 00:51:09',
  },
  {
    bsuid: 'BS-OK-SEA-A03-eY3k',
    account_name: 'OK-Group-SEA-A3',
    phone: '+62 811 ****7281',
    sales_group_id: 'sg-sea',
    owner_name: 'Bambang H',
    owner_avatar: 'BH',
    status: 'offline',
    ref_agent_id: null,
    remark: '雅加达 · 长期未上线',
    is_test: false,
    last_online_at: '2026-05-28 09:12:00',
  },
  {
    bsuid: 'BS-OK-SEA-T01-fU9j',
    account_name: 'OK-Group-SEA-Test01',
    phone: '+65 9001 ****81',
    sales_group_id: 'sg-sea',
    owner_name: 'Wei Chen',
    owner_avatar: 'WC',
    status: 'online',
    ref_agent_id: null,
    remark: '测试通道账号',
    is_test: true,
    last_online_at: '2026-06-01 00:39:48',
  },
].map((a) => ({
  ...a,
  // online_duration：在线账号的「本次在线时长」；离线账号为 null（改用 last_online_at 作为「上次在线」）
  online_duration: a.status === 'online' ? (ONLINE_DURATION[a.bsuid] || '在线中') : null,
}))

/** 取某销售组下所有账号（PRD §5.1.2：跨销售组不可借用） */
export const accountsBySalesGroup = (sgId) => CLOUD_ACCOUNTS.filter((a) => a.sales_group_id === sgId)

/** 取某账号当前是否被某 Agent 引用 */
export const accountRefByAgent = (bsuid) => CLOUD_ACCOUNTS.find((a) => a.bsuid === bsuid)?.ref_agent_id || null
