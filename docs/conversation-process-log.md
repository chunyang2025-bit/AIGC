# AIGC 接单平台试用上线改造对话过程记录

记录时间：2026-06-14

这份文档用于保存本轮从“开放给更多人试用”到“继续往正式上线改”的主要对话过程、业务判断、代码改造方向和验证结果。

说明：中间发生过上下文压缩，因此这里保存的是可恢复到的完整工作过程总结，不是逐字逐句聊天转录。

## 一、最初目标

用户准备把 AIGC 接单平台开放给更多人试用，希望先判断：

- 最需要改什么；
- 试用入口是否可用；
- 主页资料保存是否可靠；
- 登录、个人中心、审核、后台、公开大厅等核心链路是否适合更大规模试用；
- 业务规则是否合理，是否接近正式上线产品。

## 二、入口与导航调整

### 试用入口

当前本地试用入口：

```text
http://127.0.0.1:3034
```

早期曾使用过 `3033`，后续最新入口调整为 `3034`。

### 顶部导航

根据用户反馈，顶部右侧原来的：

- 我要接单
- 我要派单

被调整为：

- 登录
- 个人中心

随后用户要求导航栏里的“主体中心”不要再单独出现，统一放到右侧。已移除左侧“主体中心”入口，让账号相关入口集中在右侧。

相关文件：

- `components/AuthNavActions.tsx`
- `app/layout.tsx`

## 三、主页保存与登录后数据恢复

用户反馈：主页信息多次填写后没有保存，重新登录后仍看到第一版页面信息。

定位到的主要问题：

- 登录后前端仍优先读取本地旧 `localStorage`；
- 服务端即使已有更新，也可能被旧缓存覆盖；
- 保存链路早期使用同步请求，导致点击保存后页面卡住。

已完成改造：

- 登录用户优先从服务端拉取当前账号数据；
- 服务端拉取成功后覆盖本地缓存；
- 保存主页/服务主页改为异步请求；
- 保存按钮显示“正在保存...”；
- 避免保存后强制整页刷新；
- 逐步把 `api/buyers`、`api/creators` 改成局部写入，不再全量重写 marketplace 数据。

相关文件：

- `lib/store.ts`
- `app/account/profile/page.tsx`
- `app/provider/profile/page.tsx`
- `app/api/buyers/route.ts`
- `app/api/creators/route.ts`

## 四、认证中心与审核链路

用户反馈：主页保存后，查看认证中心、提交审核都有卡顿。

定位到的主要问题：

- 页面进入时会拉全量 `/api/state`；
- 提交审核走全量读写；
- 提交后触发整页刷新。

已完成改造：

- 认证中心提交审核改为异步；
- `/api/review-submission` 改成只更新当前买方或服务方 profile；
- 追加 `activity_events`；
- 不再走 `getMarketplaceData() -> saveMarketplaceData()` 的整包慢路径；
- 前端保存后减少 `router.refresh()`。

相关文件：

- `app/account/verification/page.tsx`
- `app/api/review-submission/route.ts`
- `lib/store.ts`

## 五、个人中心、买方后台、服务方后台轻量化

为了更适合大规模试用，逐步把高频页面从“全量大状态”中拆出来。

新增轻量账户态接口：

- `app/api/account/state/route.ts`

它返回当前用户真正需要的数据：

- 当前用户的 buyerProfile；
- 当前用户的 creatorProfile；
- 自己的项目；
- 自己相关的订单、线索、匹配、消息；
- 个人中心通知所需数据；
- 当前审核状态。

已接入页面：

- `/account`
- `/buyer`
- `/provider`

相关文件：

- `app/account/page.tsx`
- `app/buyer/page.tsx`
- `app/provider/page.tsx`
- `app/api/account/state/route.ts`

## 六、详情页轻接口

继续将高频详情页从全量数据里拆出。

新增/改造接口：

- `app/api/buyer/projects/[id]/route.ts`
- `app/api/orders/[id]/route.ts`
- `app/api/projects/[id]/route.ts`

改造页面：

- `app/buyer/projects/[id]/page.tsx`
- `app/orders/[id]/page.tsx`
- `app/projects/[id]/page.tsx`

新的模式：

- 页面先用本地缓存秒开；
- 再异步补拉轻接口；
- 写操作后尽量局部更新，不再依赖整页刷新。

## 七、审核业务规则重构

用户提出一个关键业务问题：

> 主页保存并提交审核后，如果用户后续还想修改，是不是每次都要重新审核？

讨论后采用更接近正式产品的规则：

- 普通主页内容可以随时修改，不需要重新审核；
- 认证关键信息修改才需要重新审核；
- 保存和提交审核分开；
- 已认证用户修改关键信息时，旧的已认证主页继续展示；
- 新修改内容进入 `reviewDraft`；
- 审核通过后，草稿发布成正式版本；
- 审核驳回后，旧版继续保留，只记录草稿驳回原因。

新增/涉及字段：

- `review_draft`
- `review_draft_submitted_at`
- `review_draft_rejected_reason`

相关文件：

- `lib/review-status.ts`
- `lib/types.ts`
- `supabase/schema.sql`
- `lib/server/actions.ts`
- `lib/server/data.ts`
- `app/api/admin/verify/route.ts`
- `app/api/review-submission/route.ts`
- `app/account/verification/page.tsx`
- `app/admin/page.tsx`

重要上线提醒：

- Supabase 数据库必须同步 `supabase/schema.sql` 中新增的 `review_draft` 相关字段；
- 未迁移时系统做了兼容回退，但正式的“已发布版本 + 待审核草稿”规则不会完整生效。

## 八、运营后台审核草稿

为了让运营能真正审核草稿，后台页面增加：

- 首次待审核；
- 变更待提交；
- 变更待审核；
- 变更需补充；
- 有草稿时提示“线上已认证主页继续展示，当前审核的是变更草稿”；
- 展示关键字段差异；
- 审核通过发布草稿；
- 驳回保留旧版；
- 导出报表标记 `hasDraft`。

相关文件：

- `app/admin/page.tsx`
- `lib/review-status.ts`
- `app/api/admin/verify/route.ts`

## 九、注册、登录、项目发布与审核性能优化

自测后发现：

- 登录/注册曾经需要 8s-22s；
- 创建项目、审核项目曾经需要 13s-20s；
- 原因是这些接口仍然会整包读写 marketplace 数据。

已完成改造：

- 注册/登录不再全量写回；
- 发需求/审需求不再全量读写；
- 改为只写必要的 `app_users`、`projects`、`project_matches`、`activity_events`。

相关文件：

- `app/api/auth/register/route.ts`
- `app/api/auth/login/route.ts`
- `app/api/projects/route.ts`
- `app/api/admin/projects/[id]/review/route.ts`

效果：

- 注册：约 1s-4s；
- 登录：约 0.7s-3s；
- 发需求：约 1.6s-3.3s；
- 审需求：约 0.6s-2.1s。

## 十、注册限流与公开大厅优化

发现问题：

- 注册限流按 IP `5 次 / 60 秒`，同一公司/校园/孵化器多人试用会误伤；
- `/api/marketplace` 曾经读取较重，甚至出现约 18s 响应。

已完成改造：

- 注册限流改为 IP 防洪泛 + 账号层防重复；
- `/api/marketplace` 改成轻查询；
- 公开大厅只查公开需求、已认证服务方和必要统计。

相关文件：

- `app/api/auth/register/route.ts`
- `lib/server/rate-limit.ts`
- `app/api/marketplace/route.ts`

效果：

- `/api/marketplace` 从约 18s 降到约 1.8s 左右。

## 十一、`/api/state` 和 admin 后台优化

继续优化 `/api/state`：

- 普通 buyer/creator 走轻查询；
- admin 保留全量视角；
- `loadMarketplaceData()` 优先走 `/api/account/state`；
- 只有轻接口失败时才 fallback 到 `/api/state`。

随后对 admin 全量读取加短缓存：

- `lib/server/data.ts` 增加短缓存；
- 增加 `invalidateMarketplaceCache()`；
- 局部直写 Supabase 的关键路由写成功后主动清缓存。

这样避免：

- admin 短时间重复拉全量数据；
- 写成功后 admin 立刻读到旧缓存。

相关文件：

- `app/api/state/route.ts`
- `app/api/account/state/route.ts`
- `lib/store.ts`
- `lib/server/data.ts`

## 十二、密码找回流程

新增邮箱密码找回：

- `app/api/auth/password-reset/route.ts`
- `app/forgot-password/page.tsx`
- `app/reset-password/page.tsx`
- `lib/auth.ts`
- `lib/server/auth.ts`

随后发现本地健康检查中的密码找回回跳地址曾指向旧端口 `3030`，但当前实际试用入口是 `3034`。

已完成修复：

- 本地开发环境下，健康检查和真实找回密码接口优先按当前请求来源计算；
- 生产环境仍使用 `NEXT_PUBLIC_APP_URL`；
- 当前健康检查返回：

```text
http://127.0.0.1:3034/reset-password
```

相关文件：

- `lib/server/env.ts`
- `app/api/health/route.ts`
- `app/api/auth/password-reset/route.ts`

## 十三、公开市场测试数据隔离

自测时发现公开市场混入大量测试/验收数据，例如：

- 验收短视频需求；
- Smoke 验证服务方；
- Acceptance 测试账号；
- Review route project；
- 协作流服务方。

这会严重影响真实试用用户的信任感。

已完成改造：

- 新增公开市场清洗规则；
- 默认公开市场过滤测试/验收/回归数据；
- 自动化验收脚本显式使用 `includeTestData=1`，避免测试被误伤；
- 首页、需求大厅、创作者大厅、公开详情页都接入清洗后的公开数据源；
- 公开指标按清洗后的公开内容计算，不再被测试账号撑大。

相关文件：

- `lib/public-marketplace.ts`
- `app/api/marketplace/route.ts`
- `lib/store.ts`
- `components/ClientHome.tsx`
- `app/projects/page.tsx`
- `app/creators/page.tsx`
- `app/projects/[id]/page.tsx`
- `app/buyers/[id]/page.tsx`
- `app/creators/[id]/page.tsx`
- `scripts/local-acceptance-e2e.mjs`

最近一次抽样结果：

```json
{
  "projects": 4,
  "creators": 9,
  "badProjects": 0,
  "badCreators": 0
}
```

## 十四、当前验证记录

多轮验证中使用过：

```bash
npx tsc --noEmit
APP_URL=http://127.0.0.1:3034 node scripts/local-smoke-check.mjs
APP_URL=http://127.0.0.1:3034 node scripts/local-acceptance-e2e.mjs
npm run check:smoke
npm run check:acceptance
npm run check:collab
```

最近确认：

- `npx tsc --noEmit` 通过；
- `APP_URL=http://127.0.0.1:3034 node scripts/local-smoke-check.mjs` 通过；
- `APP_URL=http://127.0.0.1:3034 node scripts/local-acceptance-e2e.mjs` 通过；
- 默认 `/api/marketplace` 公开面测试残留为 0。

## 十五、当前仍需注意的上线事项

### 1. Supabase schema 必须同步

尤其是 `review_draft` 相关字段。否则草稿审核机制只能降级运行。

### 2. 公开测试数据已经过滤，但数据库里仍存在测试数据

当前做法是前台公开面过滤。正式上线前最好：

- 使用独立生产库；
- 或清理 Supabase 中的 smoke/acceptance/collab/review route 测试记录；
- 或给测试数据增加显式 `is_test` 字段，后续不要靠文本规则过滤。

### 3. 邮箱找回密码需要 Supabase 后台配置

需要确认：

- Supabase Auth Email provider 已启用；
- Redirect URLs 包含线上 `/reset-password`；
- 生产环境 `NEXT_PUBLIC_APP_URL` 是 HTTPS 正式域名。

### 4. admin 后台后续仍可继续拆轻

目前 admin 已经有短缓存，但正式规模变大后，建议做后台专用聚合接口。

### 5. 交易闭环仍未完全产品化

当前平台已接近“可试用供需平台”，但要成为正式交易平台，还需要补：

- 合同；
- 收款/托管；
- 发票；
- 交付验收；
- 争议处理；
- 成交/不合适/无响应的数据闭环。

## 十六、当前推荐下一步

如果继续往正式上线推进，建议优先：

1. 同步 Supabase schema；
2. 清理或隔离测试数据；
3. 配置真实线上域名和密码找回 Redirect URL；
4. 做 admin 专用聚合接口；
5. 完善交易闭环状态。

