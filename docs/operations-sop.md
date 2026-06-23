# Operations SOP

## 1. Daily Queue

Open `/admin` and process in this order:

1. Pending project reviews.
2. Pending buyer profile reviews.
3. Pending creator profile reviews.
4. Open or reviewing reports.
5. Suspended accounts that need follow-up.

During the first pilot, also record these daily numbers:

- New registrations by entry: project demand, service provider, training demand, training provider.
- Approved public projects and approved training demands.
- Approved service providers and approved training providers.
- Leads created from interest or invitation.
- Feedback items by category: bug, confusing, missing feature, suggestion, other.
- Reports and suspended accounts.
- `/api/health` failures or degraded checks.
- AI story generation failures caused by provider quota, invalid key, or upstream outage.

## 1.1 First Batch Marketplace Setup

Before inviting the first 20-50 users, make the public marketplace look alive:

- Approve at least 2 non-training project demands.
- Approve at least 1 training demand.
- Approve at least 5 service providers.
- Approve at least 2 training providers.
- Ensure at least 3 approved providers have service packages or quote notes.
- Ensure at least 1 training provider has training cases, topics, formats, and pricing notes.
- Run `NEXT_PUBLIC_APP_URL=https://your-domain.example npm run check:pilot`.

If `check:pilot` fails, fill the missing supply or demand before sending broad invitations.

## 2. Buyer Review

Approve when:

- Subject name and contact are clear.
- Verification type matches the uploaded material or stated subject.
- Company intro or service need is not obviously fake.
- Contact email or phone can be used by operations.

Reject when:

- Missing contact.
- Subject name is vague or misleading.
- Qualification material is missing for non-individual subject.
- Description contains illegal, adult, gambling, fraud, spam, or infringement risk.

Suggested rejection reason:

```text
资料不完整，请补充主体资质、联系方式或主体介绍后重新提交。
```

## 3. Creator Review

Approve when:

- Service category is clear.
- Bio, skills, price range, portfolio, and contact are present.
- Portfolio or resume can support the claimed capability.
- Public profile does not expose private ID or license images.

Reject when:

- No usable service description.
- Portfolio is empty or clearly fake.
- Price range is missing or unreasonable.
- Contact is missing.
- Content contains infringement or prohibited claims.

Suggested rejection reason:

```text
接单资料不完整，请补充服务介绍、代表作、报价区间和联系方式后重新提交。
```

## 4. Project Review

Approve when:

- Demand is concrete enough for creators to judge.
- Category, intent budget, deadline, and deliverables are clear.
- Buyer profile is verified.
- Reference or qualification material is present when needed.

Reject when:

- Demand is too vague.
- Contact is missing.
- Intent budget is missing or clearly invalid.
- There is obvious fraud, illegal content, infringement, adult, gambling, or spam risk.
- Buyer profile is not verified.

Suggested rejection reason:

```text
需求信息不完整，请补充交付范围、意向预算、联系方式或参考资料后重新提交。
```

## 5. Report Handling

Mark `reviewing` when operations starts checking.

Resolve when:

- The reported content was removed.
- The account was suspended.
- The user was warned offline.
- The issue was otherwise handled.

Dismiss when:

- Evidence is insufficient.
- The report is unrelated to platform rules.
- No violation is found.

## 6. Account Suspension

Suspend when:

- Fraud or spam is clear.
- User repeatedly posts fake projects or fake portfolios.
- User harasses others.
- User uploads illegal or infringing material.

Unsuspend when:

- The issue was resolved.
- The suspension was accidental.
- The user provided corrected materials and operations approved them.

## 7. Free Pilot Boundary

During the first pilot:

- Free onboarding.
- Free project posting.
- Intent budget is only for matching and communication.
- The platform does not escrow money.
- The platform does not guarantee delivery.
- Contract, payment, delivery, and after-sales are handled by both parties outside the platform.

## 8. Pilot Acquisition Scripts

Use different messages for the four entry groups. Do not send one generic platform invitation.

Buyer/project demand:

```text
我们在做一个 AIGC 服务撮合平台试运营。你可以免费发布图片、短视频、数字人、PPT、文案等需求，平台会帮你整理 Brief，并推荐候选服务方。前期不收平台费，也不涉及交易托管。
```

Creator/service provider:

```text
我们在开放 AIGC 服务方免费入驻。你可以创建服务主页，展示案例、报价和可接方向，试运营期间会优先进入服务商库和公开需求匹配。适合短视频、图片设计、数字人、PPT、文案、工作流等服务方。
```

Training demand:

```text
如果你们团队想做 AI 办公、AI营销、AI商品图、AI短视频或提示词培训，可以免费发布培训需求。平台会帮你整理培训目标、对象、人数和主题，并匹配可提供课程大纲和报价的讲师/机构。
```

Training provider:

```text
我们正在补充 AIGC 企业培训讲师库。你可以免费入驻，展示可讲主题、培训形式、企业案例、课件材料和报价说明，试运营期间会优先匹配企业内训、工作坊和陪跑需求。
```

Follow-up after registration:

```text
你可以先用首页的免费 Brief/培训需求生成器整理需求，不需要一上来填长表。生成后再决定是否发布需求或完善服务主页。
```
