# G-Builder OS · V1 Demo（web-im v5）

> 基于《SCRM-AI业务员配合功能-PRD v2》+《g-builder-os-interaction-spec.md》落地的可演示 Web 端 demo
>
> 与 v1-v4 的最大区别：**严格按 G-Builder OS 视觉与交互规范，不沿用任何 SCRM IM 风格元素**

---

## 一、快速启动

```bash
# 在本目录
cd pm_agent/projects/SCRM-AI业务员/04-原型demo/v7

# 安装依赖（首次 ~40s）
npm install

# 启动开发服务器
npm run dev

# → 浏览器自动打开 http://localhost:5175/
# → 默认重定向到 /agent/sales-rep（AI 业务员主页）
```

打包构建：

```bash
npm run build       # 输出到 dist/
npm run preview     # 本地预览构建产物
```

---

## 二、本期 PRD 覆盖范围

本 demo **不是 PRD 的全功能复刻**，而是按用户回答的 4 个范围决策做的**真实可用页面**实现：

| 模块 | 实现深度 | 入口路径 |
| --- | --- | --- |
| **AI 业务员** | 单 Agent 详情页 · 6 个 Tab 全量实现 | `/agent/sales-rep` |
| **知识库** | 2 Tab：知识条目（三重筛选 · 创建/编辑/上下线 · 详情抽屉） + Agent 引用关系（影响范围矩阵） | `/knowledge` |
| 其他 8 个一级菜单 | 侧边栏入口 · 点进去显示**克制专业的占位页**（说明设计预期 + 跳转到本期真实页面） | `/workbench`, `/scrm`, `/conversation/*`, `/agent/sales-king`, `/dashboard/*`, `/settings` |

> 说明：用户明确要求 "不要 demo 思路、按真实可用产品做"。所以本期实现的两块（AI 业务员 / 知识库）做到 **PRD 完整字段、真实表单、可保存到 localStorage**；其他菜单的占位页也是按真实产品的"功能不在本期范围"提示形态做，不是"建设中"。

---

## 三、目录结构

```
v5/
├── index.html                       入口 HTML
├── vite.config.js                   Vite 配置（默认端口 5175）
├── package.json                     React 19 + AntD 6 + Vite 8 + react-router-dom 7
└── src/
    ├── main.jsx                     React 入口（ConfigProvider 主题）
    ├── App.jsx                      RouterProvider
    ├── styles/
    │   ├── global.css               G-Builder OS Token（变量、reset、AntD 微调）
    │   └── theme.js                 AntD ConfigProvider Theme（科技蓝 #1A4D8F）
    ├── router/
    │   ├── index.jsx                路由结构（10 个一级 + 2 个内嵌 Tab 模块）
    │   └── nav.js                   侧边栏导航数据
    ├── layouts/
    │   ├── AppShell.jsx             全局外壳（TopBar 56px + Sidebar 240px + 面包屑 40px + 主区）
    │   └── app-shell.css
    ├── components/
    │   ├── TopBar/                  顶部 56px：Logo / 全局搜索 / 通知 / 头像下拉
    │   ├── PrimarySidebar/          左侧 240px 分组菜单（10 个一级 + 6 个二级）
    │   └── Breadcrumb/              面包屑（G-Builder OS / xx / yy）
    ├── pages/
    │   ├── Placeholder/             占位页（本期 8 个未实现菜单的统一着陆点）
    │   ├── Agent/SalesRep/          ✅ AI 业务员 · 真实页面
    │   │   ├── index.jsx            主页（Hero + Toolbar + Tabs + 内容区）
    │   │   ├── AgentHero.jsx        Agent 顶部信息条 + 发布工具栏
    │   │   ├── AccountOfflineAlert  关联账号掉线 Alert（PRD §5.1.3）
    │   │   ├── VersionDrawer.jsx    历史版本抽屉
    │   │   └── tabs/
    │   │       ├── BasicTab.jsx     基础配置：销售组 + WhatsApp 多选 + 知识库引用 + 工作时段
    │   │       ├── ReceptionTab.jsx 接待要素 + 意图任务变量（PRD §5.2）
    │   │       ├── GradingTab.jsx   线索评级配置（PRD §5.3，含实时评级预览）
    │   │       ├── HandoffTab.jsx   转人工二维矩阵（PRD §5.4）
    │   │       ├── IdentityTab.jsx  Agent 身份卡（PRD §5.1.6，含 WhatsApp 客户端预览）
    │   │       └── VersionsTab.jsx  配置版本管理 Timeline（PRD §5.1.5）
    │   └── Knowledge/                ✅ 知识库 · 真实页面
    │       ├── index.jsx             主页（Hero 统计 + 2 Tab）
    │       ├── KnowledgeEntries.jsx  Tab 1：知识条目（三重筛选 + 详情抽屉 + 创建/编辑/上下线）
    │       └── KnowledgeReferences   Tab 2：Agent 引用关系（影响范围矩阵）
    └── mock/                         数据底座（按 PRD 真实字段）
        ├── salesGroups.js            3 个销售组（北美 / 中东 / 东南亚）
        ├── cloudAccounts.js          12 个 WhatsApp 云账号（含在线/掉线/测试三态）
        ├── receptionAndIntent.js     8 个接待要素 + 6 个意图任务变量
        ├── gradingAndHandoff.js      7 个评级要素 + ABCD 阈值 + 转人工矩阵 + 6 个触发条件
        ├── knowledge.js              5 个分组（含二级）+ 5 个类型 + 10 个标签 + 17 条知识条目
        ├── agent.js                  1 个 Agent 实例（聚合上述全部配置）
        └── store.js                  localStorage 持久层（让表单"保存得上、刷新不丢"）
```

---

## 四、关键设计决策

### 4.1 与 v1-v4 的根本区别

| 维度 | v1-v4（SCRM IM 风格） | **v5（G-Builder OS）** |
| --- | --- | --- |
| 主色 | WhatsApp 绿 `#25D366` | 科技蓝 `#1A4D8F` |
| 侧边栏 | 48px 极窄垂直图标条 | **240px 分组菜单**（一级菜单 + 二级菜单 + 徽标） |
| 顶部栏 | 无 | **56px 顶部栏**（Logo / 全局搜索 / 通知 / 头像） |
| 面包屑 | 无 | **40px 面包屑**（G-Builder OS / 模块 / 子页） |
| Agent 模块命名 | "AI 业务员中心" | **"AI 业务员"**（按用户要求严格使用） |
| Agent 入口 | 列表 + 详情 | **单 Agent 直接进详情**（按用户决策 Q3） |
| 知识库 | 5 个独立二级页 | **2 Tab（条目 + 引用关系）**（按用户决策 Q4） |

### 4.2 "不要 demo 思路、按真实产品做" 的落地

| 维度 | 实现 |
| --- | --- |
| **字段完整度** | PRD §5.1-§5.4 描述的每个字段都有真实表单控件 |
| **状态机** | 草稿（有未保存）/ 草稿（已保存）/ 预发布 / 已发布 / 已过期 / 历史，全部可流转 |
| **校验** | 必填校验、配置完整性校验（缺失项提示 + 阻断发布）、引用冲突校验 |
| **数据持久化** | localStorage 全量持久化，刷新不丢、跨 Tab 切换不丢 |
| **数据真实度** | 12 个 WhatsApp 账号（含掉线、测试两态）/ 17 条知识条目（含真实英文 FAQ / 产品图册 / SOP 话术）/ 8 个历史版本 |
| **交互完整度** | Hover、选中、禁用、加载、空态、错误态、操作确认、多步弹窗、抽屉、Tooltip 全覆盖 |
| **预览能力** | 评级配置有"模拟客户得分"实时预览；身份卡有"WhatsApp 客户端聊天框"实时预览 |
| **告警机制** | 关联账号掉线时 Alert + 顶部通知 + 工具栏徽标三联动 |

---

## 五、值得重点演示的交互

| 顺序 | 入口 | 重点交互 |
| --- | --- | --- |
| 1 | 主页 → `AI 业务员 / 基础配置` | 关联 WhatsApp 账号下拉（在线/掉线/已被引用 三态）+ 知识库引用（按分组 / 按条目 / 混合）+ 引用预览图 |
| 2 | `AI 业务员 / 接待要素` | 表格内联开关 + 编辑抽屉（接待要素 + 意图任务变量都全字段） |
| 3 | `AI 业务员 / 线索评级` | **底部"评级预览"区滑动权重 + 切换"命中/未中" → 实时计算 ABCD 档位** |
| 4 | `AI 业务员 / 转人工规则` | **2×2 矩阵 4 类组合卡片**（每格独立编辑 SLA + 升级链 + 典型触发场景 Tooltip） |
| 5 | `AI 业务员 / 身份卡` | **右侧 WhatsApp 聊天框实时预览**（带变量占位填充） |
| 6 | `AI 业务员 / 版本管理` | 时间轴 + 回滚到任一历史版本（自动生成新版本快照） |
| 7 | 顶部栏「正式发布」 | 配置完整性校验 + 跳过预发布的二次确认 + 发布动作 → 版本号自增 + 历史版本流转 |
| 8 | `知识库 / 知识条目` | **三重筛选（分组 + 类型 + 标签 + 状态 + 全文搜索）** + 详情抽屉 + 新建/编辑/上下线 |
| 9 | `知识库 / Agent 引用关系` | 当前 Agent 引用面板 + **影响范围 TOP 12 热度排行** + 已下线引用提示 |
| 10 | 占位菜单（任意一个） | 看克制专业的占位页（不是敷衍的"建设中"） |

---

## 六、与上游规范文档的对应

| 本 demo | 上游规范 |
| --- | --- |
| 视觉 token / 顶栏 / 侧栏 / 面包屑 | `pm_agent/.claude/skills/web-im-demo/references/g-builder-os-interaction-spec.md` |
| 业务字段 / 状态机 / 触发条件 | `pm_agent/projects/SCRM-AI业务员/02-PRD/v2/SCRM-AI业务员配合功能-PRD.md` |
| 形态判定与三问 | `pm_agent/.claude/skills/web-im-demo/SKILL.md` |

---

## 七、技术栈

- **React 19**（含新的 `useTransition` / `useDeferredValue` 等优化）
- **Ant Design 6**（含 `App` 组件包装、`ConfigProvider` 主题、`Drawer` `Tabs` `TreeSelect` `Timeline` 等）
- **React Router 7**（含 `useSearchParams` 控制 Tab 状态）
- **Vite 8**（默认 ES Module + HMR）
- **dayjs**（时间格式化）
- **localStorage**（mock 数据持久化，无后端联调）

---

## 八、Reset Demo 数据

如果想清空 localStorage 回到初始 mock 数据：

```javascript
// 在浏览器 DevTools Console 中执行
localStorage.clear()
location.reload()
```

或在代码中：

```javascript
import { store } from './mock/store'
store.resetAll()
```
