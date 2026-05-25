# 灵工智创平台

连接企业需求方与AIGC创作者的AI内容生产经纪网络。

这是一个可运行的 Next.js MVP，定位为“AIGC创作者与企业需求智能撮合平台”。平台支持“我要派单 / 我要接单”双入口、独立运营后台、需求发布 Agent、匹配 Agent、创作者市场、邀请沟通、合作线索、月活指标和 Supabase 数据库结构。

## 本地运行

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

当前版本默认使用浏览器 localStorage 作为演示数据源，不配置 Supabase 也能跑通完整流程。接入真实 Supabase 项目时添加：

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Supabase

先在 Supabase SQL Editor 执行 `supabase/schema.sql`，再执行 `supabase/seed.sql` 导入演示数据。

## 已实现

- 中文创作者市场与筛选
- 需求发布 Agent：一句话需求生成结构化 Brief、预算、成果范围和沟通确认点
- 匹配 Agent：按品类、技能、预算、评分、履约记录、认证状态和响应速度推荐3位创作者
- 可解释推荐：推荐理由、风险提示、下一步建议
- 登录入口：我要派单 / 我要接单双入口
- 我要派单：发布需求、查看匹配、邀请创作者沟通
- 我要接单：查看公开需求、表达合作意向、沉淀沟通记录
- 独立运营后台：查看用户、合作线索、意向预算、月活和 Agent 处理指标
- 邀请创作者生成合作线索
- 沟通记录与意向状态流转
- 需求方/创作者工作台
- 运营后台
- 需求方月活、创作者月活、活跃线索、活跃事件留痕
- Supabase Postgres schema、RLS策略和 seed 数据

## 暂不包含

- 真实AI Agent调用
- LLM自动需求拆解
- 支付、担保交易、抽佣结算和平台内交付验收
- 复杂推荐算法
- App版本
