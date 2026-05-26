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

## API

- `GET /api/marketplace`：公开需求、公开接单方、运营指标摘要
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
- `POST /api/reset`：重置演示数据

## Supabase

1. 新建 Supabase 项目。
2. 在 SQL Editor 执行 `supabase/schema.sql`。
3. 在 Vercel 配置环境变量：

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

当前 API 会在没有 Supabase 配置时使用内存 demo 数据，适合本地演示；生产环境建议接入 Supabase 持久化。
