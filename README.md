# AIGClancer

连接派单方与AIGC接单方的内容生产撮合平台。

这是一个可运行的 Next.js MVP，定位为“AIGC创作者与需求方智能撮合平台”。平台支持“我要派单 / 我要接单”双入口、主体主页装修、资质审核、公开需求大厅、创作者信息大厅、邀请沟通、合作线索、月活指标和 Supabase 数据库结构。

## 本地运行

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

当前版本在本地可完整跑通受控 Demo。没有配置 Supabase 时会使用本地演示数据源；配置 Supabase 后，注册/登录走 Supabase Auth，核心业务数据写入结构化业务表，写入接口会校验 Bearer Token，头像和资质材料会上传到 Supabase Storage。

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Supabase

先在 Supabase SQL Editor 执行 `supabase/schema.sql`，再执行 `supabase/seed.sql` 导入演示数据。

完整上线步骤见 [docs/deploy-checklist.md](docs/deploy-checklist.md)。

需要准备两个 Storage bucket：

- `public-assets`：公开头像、Logo、作品图。
- `private-verifications`：营业执照、组织证明、授权材料等非公开资质。

部署到 Vercel 时配置：

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## 已实现

- 中文创作者市场与筛选
- 需求发布 Agent：一句话需求生成结构化 Brief、预算、成果范围和沟通确认点
- 匹配 Agent：按品类、技能、预算、评分、履约记录、认证状态和响应速度推荐10位创作者
- 可解释推荐：推荐理由、风险提示、下一步建议
- 账号密码登录与注册入口
- 统一主体中心：同一主体可同时开通派单能力和接单能力
- 主体主页装修：头像、名称、简介、联系方式、城市、能力标签、代表作、证明材料
- 主体认证审核：个人、企业、个体工商户、政府组织、事业单位、社会组织等
- 我要派单：发布需求、查看匹配、邀请创作者沟通
- 我要接单：查看公开需求、表达合作意向、沉淀沟通记录
- 独立运营后台：查看用户、合作线索、意向预算、月活和 Agent 处理指标
- 邀请创作者生成合作线索
- 沟通记录与意向状态流转
- 需求方/创作者工作台
- 运营后台
- 需求方月活、创作者月活、活跃线索、活跃事件留痕
- Supabase Postgres 结构化业务表、RLS策略和 seed 数据
- 试运营免费模式：免费入驻、免费发布需求，意向预算仅用于匹配参考

## 暂不包含

- 真实AI Agent调用
- 微信扫码登录、短信验证码登录
- 支付、担保交易、抽佣结算、B端服务费收取和平台内交付验收
- 复杂推荐算法
- App版本

## 上线前必须完成

- 继续把后台和线索详情页做更细的运营权限审计。
- 接入短信验证码或微信扫码前，不要在正式页面展示对应登录入口。
- 隐私政策、用户协议、资质审核规则需要根据实际运营主体做法务审阅。
