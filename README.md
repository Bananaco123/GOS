# GOS V1.1 Demo

## 项目说明

本 demo 基于 `demo V1.0` 复制版本调整，保留 GOS 合并 demo 的主体能力，同时收敛导航和登录页展示范围。

## 本版调整

- 登录页删除左侧模块说明文案。
- 登录页标题由“登录营销 OS”调整为“登录营销 GOS”。
- 登录页主标语删除“空间”后的逗号。
- 移除独立“工作台”入口。
- 移除“数据看板”模块及 PM 看板、部门看板入口。
- 移除顶部全局搜索栏。

## 核心路由

| 路由 | 页面 | 状态 |
| --- | --- | --- |
| `/login` | 登录页 | 真实页面 |
| `/home` | 首页 | 真实页面 |
| `/scrm` | SCRM 销售工作台 | 真实页面 |
| `/conversation/lead-assignment` | 线索分配 | 真实页面 |
| `/conversation/handover` | 转人工 | 真实页面 |
| `/agent/sales-rep` | AI 业务员列表 | 真实页面 |
| `/agent/sales-rep/:agentId` | AI 业务员详情 | 真实页面 |
| `/agent/sales-king` | AI 销冠 | 占位页 |
| `/knowledge` | 知识库 | 真实页面 |
| `/knowledge/lib/:libraryId` | 知识库详情 | 真实页面 |
| `/settings/org/members` | 部门与用户 | 真实页面 |
| `/settings/org/roles` | 角色与权限 | 真实页面 |

## 启动方式

```bash
npm install
npm run dev
```

构建验证：

```bash
npm run build
```

GitHub Pages 构建：

```bash
npm run build:pages
```

本项目沿用 Vite `base: /jingchengjituan/`，本地预览请访问：

```text
http://localhost:5179/jingchengjituan/login
```

线上预览地址：

```text
https://bananaco123.github.io/GOS/
```
