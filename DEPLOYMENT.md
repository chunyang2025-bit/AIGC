# 灵工智创平台上线说明

## 本地启动

```bash
npm install
npm run dev
```

浏览入口：

```text
http://127.0.0.1:3000
```

接口目录：

```text
http://127.0.0.1:3000/api
```

## 生产自检

部署前先执行：

```bash
npm run check:predeploy
```

部署后配置 `NEXT_PUBLIC_APP_URL` 为线上 HTTPS 域名，然后执行：

```bash
npm run check:prod
```

也可以直接访问：

```text
https://你的域名/api/health
```

只有 `data.ok` 为 `true` 才建议开放真实用户注册和业务投放。

完整上线清单见 `docs/deploy-checklist.md`，生产运行手册见 `docs/production-runbook.md`。

## API

- `GET /api/marketplace`：公开需求、公开接单方、运营指标摘要
- `GET /api/health`：生产环境、数据库、存储、支付、通知配置自检
- `POST /api/auth/register`：注册用户
- `POST /api/auth/login`：登录并记录月活
- `POST /api/agent/brief`：生成结构化 Brief
- `GET /api/projects`：需求列表
- `POST /api/projects`：发布需求并生成 10 个匹配
- `GET /api/projects/:id`：需求详情
- `GET /api/projects/:id/matches`：派单方查看匹配接单方
- `POST /api/projects/:id/invite`：派单方邀请接单方
- `POST /api/projects/:id/interest`：接单方发起沟通
- `GET /api/creators`：接单方大厅
- `POST /api/creators`：提交接单方展示页
- `GET /api/creators/:id`：接单方详情
- `POST /api/buyers`：提交派单方展示页
- `GET /api/buyers/:id`：派单方详情
- `GET /api/orders`：合作线索列表
- `GET /api/orders/:id`：合作线索详情
- `POST /api/orders/:id/messages`：发送沟通消息
- `PATCH /api/orders/:id/status`：更新线索状态
- `GET /api/admin/metrics`：运营数据
- `PATCH /api/admin/verify`：审核主体

## Supabase

1. 新建 Supabase 项目。
2. 在 SQL Editor 执行 `supabase/schema.sql`。
3. 在 Vercel 配置环境变量：

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL
ADMIN_INVITE_CODE
```

当前 API 会在没有 Supabase 配置时使用内存 demo 数据，适合本地演示；生产环境建议接入 Supabase 持久化。

## 支付与通知

当前阶段免费入驻、免费发布需求，不涉及用户交易托管，支付配置不是上线阻塞项。后续如果平台要对 B 端收服务费，再接入具体服务商并配置：

```text
PAYMENT_PROVIDER
PAYMENT_API_KEY
PAYMENT_WEBHOOK_SECRET
NOTIFICATION_EMAIL_PROVIDER
NOTIFICATION_EMAIL_API_KEY
NOTIFICATION_SMS_PROVIDER
NOTIFICATION_SMS_API_KEY
```

这些变量为空时，平台仍可按免费撮合模式上线，但不能视为平台内自动支付托管和通知闭环已上线。
