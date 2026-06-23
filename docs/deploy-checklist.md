# AIGClancer 上线检查清单

## 1. Supabase 项目

1. 创建 Supabase Project。
2. 在 SQL Editor 执行 `supabase/schema.sql`。
3. 可选：执行 `supabase/seed.sql` 导入演示数据。正式运营时可以不导入 seed，只保留真实用户数据。
4. 在 Project Settings / API 复制：
   - Project URL
   - anon public key
   - service_role secret key

## 2. Storage

`supabase/schema.sql` 会自动创建：

- `public-assets`：公开头像、Logo、作品图。
- `private-verifications`：营业执照、组织证明、授权材料等非公开资质。

如果 SQL Editor 提示 storage policy 权限不足，可在 Storage 页面手动创建这两个 bucket，再重新执行 schema。

## 3. Auth

在 Authentication / Providers 中开启 Email provider。

在 Authentication / URL Configuration 中确认 Redirect URLs 包含：

```text
https://你的域名/reset-password
```

当前版本使用账号密码登录。手机号账号会被转换为内部邮箱格式：

```text
手机号@phone.aigclancer.local
```

短信验证码、微信扫码登录还没有正式接入，页面也不会展示这些入口。

## 4. Vercel 环境变量

在 Vercel Project Settings / Environment Variables 配置：

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
ADMIN_INVITE_CODE=
UPLOAD_PUBLIC_MAX_MB=5
UPLOAD_PRIVATE_MAX_MB=10
```

配置后重新部署。

## 5. 支付和通知

当前阶段免费入驻、免费发布需求，不涉及用户交易托管，支付配置不是上线阻塞项。代码已提供配置占位，后续如果平台要对 B 端收服务费，再确定服务商并配置：

```bash
PAYMENT_PROVIDER=
PAYMENT_API_KEY=
PAYMENT_WEBHOOK_SECRET=
NOTIFICATION_EMAIL_PROVIDER=
NOTIFICATION_EMAIL_API_KEY=
NOTIFICATION_SMS_PROVIDER=
NOTIFICATION_SMS_API_KEY=
```

如果这些变量为空，`/api/health` 会提示当前未启用线上支付/通知，但不会阻塞免费撮合模式上线。对外不要承诺平台内自动托管、自动结算或短信通知。

## 6. 部署后检查

- 首页可以打开。
- 可以注册新账号。
- 可以用账号密码登录。
- 可以从登录页发送找回密码邮件，并成功跳转 `/reset-password` 完成密码重置。
- Supabase `app_users` 能看到新增注册用户。
- Supabase `activity_events` 能记录登录、发布、沟通等活跃事件。
- 新账号登录后先进入主体主页装修。
- 可以上传头像。
- 企业/政府/组织类主体可以上传证明材料。
- Supabase `buyer_profiles` / `creator_profiles` 能看到提交后的主体资料。
- 提交主体资料后进入待审核状态。
- 管理后台可审核主体。
- 审核后可以开通派单或接单能力。
- 派单方可以发布真实需求。
- Supabase `projects` 能看到真实需求。
- 接单方可以查看公开需求并发起沟通。
- Supabase `orders` / `messages` 能看到沟通线索。
- `/api/health` 返回 `data.ok: true`。
- 执行 `npm run check:prod` 可以通过。

## 7. 正式运营前提醒

- 不要公开 `SUPABASE_SERVICE_ROLE_KEY`。
- 不要在前端代码里使用 service role key。
- `ADMIN_INVITE_CODE` 必须设置为强随机值，不要使用本地默认值。
- `NEXT_PUBLIC_APP_URL` 必须是线上 HTTPS 域名。
- 密码找回依赖 Supabase Email provider 和 `/reset-password` redirect URL，两项缺一都会导致用户无法完成重置。
- 个人主体不强制上传身份证。
- 资质材料不要在公开主页展示原始文件。
- 头像、Logo、作品图走 `public-assets`，资质文件走 `private-verifications`。
- 默认上传限制：公开素材 5MB，资质材料 10MB，可通过环境变量调整。
- 用户协议、隐私政策、审核规则需要按实际运营主体做法务审阅。
