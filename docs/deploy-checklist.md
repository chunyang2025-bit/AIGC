# AIGClancer 上线检查清单

## 1. Supabase 项目

1. 创建 Supabase Project。
2. 在 SQL Editor 执行 `supabase/schema.sql`。
3. 可选：执行 `supabase/seed.sql` 导入演示数据。
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
```

配置后重新部署。

## 5. 部署后检查

- 首页可以打开。
- 可以注册新账号。
- 可以用账号密码登录。
- 新账号登录后先进入主体主页装修。
- 可以上传头像。
- 企业/政府/组织类主体可以上传证明材料。
- 提交主体资料后进入待审核状态。
- 管理后台可审核主体。
- 审核后可以开通派单或接单能力。
- 派单方可以发布真实需求。
- 接单方可以查看公开需求并发起沟通。

## 6. 正式运营前提醒

- 不要公开 `SUPABASE_SERVICE_ROLE_KEY`。
- 不要在前端代码里使用 service role key。
- 个人主体不强制上传身份证。
- 资质材料不要在公开主页展示原始文件。
- 用户协议、隐私政策、审核规则需要按实际运营主体做法务审阅。
