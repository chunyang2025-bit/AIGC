# 灵工智创平台项目交接记录

更新时间：2026-05-24

## 当前产品定位

灵工智创平台不是交易担保平台，也不在平台内完成付款、交付、验收和纠纷处理。

当前定位是：

AI内容生产撮合平台，类似招聘/接单信息平台，负责让需求发布方和AIGC创作者互相发现、查看资质、发起沟通、沉淀合作线索。

核心边界：

- 平台记录用户、需求、展示页、资质、邀请、沟通线索和月活数据。
- 平台不处理收款、担保交易、佣金结算、正式合同、成果交付和纠纷。
- 页面文案尽量使用“合作线索、沟通意向、邀请沟通、发送资料、意向预算”等词，少用“订单、交付、验收、GMV”。

## 当前运行信息

项目目录：

`/Users/chunyang/Desktop/AIGC接单平台`

当前可运行命令：

```bash
npm run dev -- -H 127.0.0.1 -p 3017
npm run build
```

最近一次验证：

- `npm run build` 成功
- 本地服务端口：`http://127.0.0.1:3017/`

注意：

- 当前数据主要保存在浏览器 `localStorage` 中，key 是 `linggong-zhichuang-demo-v2`。
- 真实上线前还需要接 Supabase Auth、Postgres、Storage。

## 已完成的主要功能

### 1. 首页

路由：`/`

首页是统一前台入口，包含：

- 我要派单
- 我要接单
- 创作者信息大厅
- 运营后台
- 公开需求
- 精选创作者
- 月活、合作线索、意向预算等展示指标

首页入口逻辑：

- 我要派单 -> `/buyer/profile`
- 我要接单 -> `/provider/profile`
- 浏览公开需求 -> `/projects`

### 2. 登录页

路由：`/login`

参考国内招聘/接单平台的登录入口，分为两个主入口：

- 我要派单：登录/注册并完善主体主页
- 我要接单：登录/注册并完善展示页

运营后台不是主登录身份，只作为平台方独立后台入口。

### 3. 派单方主体主页

表单路由：`/buyer/profile`

公开展示路由：`/buyers/[id]`

当前支持填写：

- 名称
- 主页昵称
- 头像/Logo
- 主页一句话简介
- 行业方向
- 所在城市
- 基本介绍
- 认证主体类型：企业、个体工商户、个人、政府组织、事业单位、社会组织、学校/教育机构、媒体机构、品牌方、其他主体
- 联系邮箱
- 联系电话
- 官网/作品页
- 社媒主页
- 服务地区/协作方式
- 按主体类型上传对应资质
- 其他有效资质

派单方公开主页展示：

- 基本介绍
- 主页昵称、头像、主页简介
- 认证状态
- 认证主体类型
- 联系方式
- 官网、社媒、服务地区
- 主体资质
- Agent 整理的历史需求
- 历史发布需求数量、Agent拆解数量、合作线索数量

### 4. 发布需求

路由：`/post-project`

当前是 Brief Agent 风格的需求发布页。

支持填写：

- 一句话需求
- 产品/服务名称
- 发布渠道
- 目标用户
- 风格偏好
- 参考文件
- 营业执照/有效资质
- 联系邮箱
- 联系电话

确认后会创建需求，并进入匹配 Agent 推荐页。

### 5. 公开需求大厅

路由：`/projects`

未登录也能浏览公开需求，类似招聘平台职位列表。

需求卡片会展示：

- 需求标题
- 描述
- 派单方名称
- 预算
- 沟通期限
- 详情入口

派单方名称可跳转到派单方主体主页。

### 6. 需求详情页

路由：`/projects/[id]`

当前包含：

- 需求详情
- 派单方主体主页入口
- 需求相关资质
- Brief Agent 结构化信息
- Matching Agent 推荐 10 位创作者
- 合作线索列表
- 接单方主动发起沟通模块

接单方进入某个需求后，可以：

- 给派单方发送沟通留言
- 发送自己的展示页
- 发送简历链接
- 发送代表作链接
- 生成合作线索并进入聊天/线索页

### 7. 接单方创作者展示页

表单路由：`/provider/profile`

公开展示路由：`/creators/[id]`

当前支持填写：

- 展示名称
- 主页昵称
- 头像/Logo
- 主页一句话简介
- 服务定位
- 所在城市
- 认证主体类型：企业、个体工商户、个人、政府组织、事业单位、社会组织、学校/教育机构、媒体机构、品牌方、其他主体
- 可接需求类型
- 技能标签
- 报价区间
- 响应速度
- 联系邮箱
- 联系电话
- 官网/作品页
- 社媒主页
- 服务地区/协作方式
- 按主体类型上传对应资质
- 其他资质/证明材料
- 服务介绍
- 案例方向

保存后会把当前创作者放到创作者列表前面，首页精选和创作者大厅会显示。

### 8. 创作者信息大厅

路由：`/creators`

派单方可以查看所有接单方信息，并支持检索、筛选和邀请沟通。

创作者卡片可以进入创作者公开展示页。

创作者卡片现在优先展示主页昵称、头像和认证主体类型。

### 9. 合作线索/聊天页

路由：`/orders/[id]`

虽然内部路由仍叫 orders，但 UI 文案尽量呈现为“合作线索”。

当前支持：

- 查看双方消息
- 查看附件/资料链接
- 记录沟通备注
- 修改线索状态：已发送资料、继续沟通、已达成意向

平台声明：

平台只记录双方沟通意向，不处理收款、担保交易、成果交付或纠纷。

### 10. 运营后台

路由：`/admin`

当前用于展示：

- 用户数量
- 需求数量
- 创作者审核
- 合作线索
- 意向预算
- 月活数据
- Agent 处理指标

后续应该增强：

- 派单方主体审核
- 接单方资质审核
- 需求审核
- 违规/投诉记录
- 月活与留存统计

## 重要代码文件

类型定义：

- `lib/types.ts`

本地数据读写与业务动作：

- `lib/store.ts`

Demo 数据：

- `lib/demo-data.ts`

格式化文案：

- `lib/format.ts`

匹配逻辑：

- `lib/matching.ts`

Brief Agent：

- `lib/brief-agent.ts`

主要页面：

- `components/ClientHome.tsx`
- `app/login/page.tsx`
- `app/buyer/profile/page.tsx`
- `app/buyers/[id]/page.tsx`
- `app/post-project/page.tsx`
- `app/projects/page.tsx`
- `app/projects/[id]/page.tsx`
- `app/provider/profile/page.tsx`
- `app/provider/page.tsx`
- `app/creators/page.tsx`
- `app/creators/[id]/page.tsx`
- `app/orders/[id]/page.tsx`
- `app/admin/page.tsx`

全局样式：

- `app/globals.css`

## 当前数据结构重点

`MarketplaceData` 里主要包含：

- `users`
- `buyerProfiles`
- `creators`
- `projects`
- `matches`
- `orders`
- `messages`
- `reviews`
- `activityEvents`

派单方主页类型：

- `BuyerProfile`

创作者类型：

- `CreatorProfile`

创作者已经支持：

- `identityType`
- `verificationType`
- `credentialFile`
- `qualificationFiles`
- `avatarUrl`
- `displayName`
- `profileSlogan`
- `websiteUrl`
- `socialUrl`
- `serviceArea`
- `contactEmail`
- `contactPhone`

派单方主页已经支持：

- `verificationType`
- `avatarUrl`
- `displayName`
- `profileSlogan`
- `websiteUrl`
- `socialUrl`
- `serviceArea`
- `businessLicenseFile`
- `qualificationFiles`

项目需求已经支持：

- `qualificationFile`
- `contactEmail`
- `contactPhone`

## 下次建议优先继续做的事

1. 把运营后台扩展成真正的审核后台：
   - 派单方公司审核
   - 接单方个人/企业资质审核
   - 需求审核

2. 把 `orders` 内部命名逐步改成 `leads`：
   - 当前 UI 已经尽量叫“合作线索”
   - 但内部类型和路由仍叫 `Order`、`orders`

3. 加真实注册/登录流程：
   - 需求方注册后绑定 BuyerProfile
   - 创作者注册后绑定 CreatorProfile
   - 管理员独立登录

4. 接 Supabase：
   - Auth
   - Postgres schema
   - Storage 文件上传
   - Row Level Security

5. 将营业执照、简历、代表作从“文件名/链接字符串”升级为真实上传。

6. 增强 Agent 叙事：
   - 需求 Brief Agent
   - 历史需求整理 Agent
   - 创作者匹配 Agent
   - 风险提示 Agent
   - 运营审核辅助 Agent

7. 为创业补贴准备数据口径：
   - 需求方月活
   - 接单方月活
   - 新增注册数
   - 新增需求数
   - 新增合作线索数
   - 主体认证数
   - 资料发送次数

## 产品判断备忘

当前最合理的产品路径：

- 像招聘平台一样先做信息流和双边主体页
- 像 Fiverr 一样让创作者服务能力可产品化展示
- 用 Agent 做需求整理、匹配解释和审核辅助
- 不碰交易闭环，降低平台法律和履约责任
