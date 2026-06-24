"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Clock, FileBadge2, ShieldAlert, ShieldCheck, UserRound } from "lucide-react";
import { credentialUploadOptional, requiredCredentialLabel, verificationTypeLabel } from "@/lib/format";
import { hasActiveReviewSubmission } from "@/lib/review-status";
import { loadMarketplaceData, submitReview } from "@/lib/store";
import { readAuthSession } from "@/lib/auth";
import { BuyerProfile, CreatorProfile } from "@/lib/types";

type BusinessIntent = "dispatch" | "service" | "training_demand" | "training_provider";
type ReviewStage = "empty" | "saved" | "submitted" | "approved" | "rejected";

function normalizeIntent(value: string | null): BusinessIntent {
  if (value === "service" || value === "training_demand" || value === "training_provider") return value;
  return "dispatch";
}

function continueHref(intent: BusinessIntent) {
  if (intent === "service") return "/provider/profile";
  if (intent === "training_provider") return "/provider/profile?category=AIGC%20Training";
  if (intent === "training_demand") return "/account/capabilities?intent=training_demand";
  return "/account/capabilities?intent=dispatch";
}

function continueLabel(intent: BusinessIntent) {
  if (intent === "service") return "继续完善接单主页";
  if (intent === "training_provider") return "继续完善培训主页";
  if (intent === "training_demand") return "继续开通找培训";
  return "继续开通派单";
}

function hasContact(profile?: BuyerProfile | CreatorProfile) {
  return Boolean(profile?.contactEmail || profile?.contactPhone);
}

function credentialReady(profile?: BuyerProfile | CreatorProfile) {
  if (!profile) return false;
  const type = profile.verificationType;
  const optional = credentialUploadOptional(type);
  if ("businessLicenseFile" in profile) {
    return optional
      ? Boolean(profile.businessLicenseFile || profile.websiteUrl || profile.socialUrl)
      : Boolean(profile.businessLicenseFile || profile.qualificationFiles?.length);
  }

  return optional
    ? Boolean(profile.credentialFile || profile.websiteUrl || profile.socialUrl || profile.portfolioItems?.length || profile.portfolio.length)
    : Boolean(profile.credentialFile || profile.qualificationFiles?.length);
}

function subjectChecks(profile?: BuyerProfile) {
  return [
    { label: "主体名称/主页昵称清晰", done: Boolean(profile?.companyName && (profile.displayName || profile.companyName)) },
    { label: "所在城市和基本介绍已填写", done: Boolean(profile?.location && profile.companyIntro) },
    { label: "至少有一种联系方式", done: hasContact(profile) },
    { label: "已选择认证主体类型", done: Boolean(profile?.verificationType) },
    { label: profile ? `${requiredCredentialLabel(profile.verificationType)}或辅助材料` : "资质或辅助材料", done: credentialReady(profile) }
  ];
}

function creatorChecks(profile?: CreatorProfile) {
  return [
    { label: "服务名称、定位和城市已填写", done: Boolean(profile?.name && profile.title && profile.location) },
    { label: "服务介绍、技能和服务方向已填写", done: Boolean(profile?.bio && profile.skills.length && profile.categories.length) },
    { label: "至少有一种联系方式", done: hasContact(profile) },
    { label: "已有作品、案例、服务包或履历", done: Boolean(profile?.portfolioItems?.length || profile?.portfolio.length || profile?.servicePackages?.length || profile?.resume) },
    { label: profile ? `${requiredCredentialLabel(profile.verificationType ?? profile.identityType)}或辅助材料` : "资质或辅助材料", done: credentialReady(profile) }
  ];
}

function reviewTimeLabel(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function getStage(input: {
  hasProfile: boolean;
  hasDraft?: boolean;
  submitted: boolean;
  verified: boolean;
  rejectedReason?: string;
}): ReviewStage {
  if (!input.hasProfile) return "empty";
  if (input.rejectedReason) return "rejected";
  if (input.hasDraft && input.submitted) return "submitted";
  if (input.hasDraft) return "saved";
  if (input.verified) return "approved";
  if (input.submitted) return "submitted";
  return "saved";
}

function stageLabel(stage: ReviewStage) {
  if (stage === "empty") return "未提交";
  if (stage === "saved") return "资料已保存";
  if (stage === "submitted") return "待运营审核";
  if (stage === "approved") return "已认证";
  return "需补充";
}

function stageClass(stage: ReviewStage) {
  if (stage === "approved") return "tag green";
  if (stage === "saved") return "tag blue";
  if (stage === "submitted" || stage === "rejected") return "tag gold";
  return "tag";
}

function stageDescription(stage: ReviewStage) {
  if (stage === "empty") return "请先保存主体主页或服务主页。";
  if (stage === "saved") return "主页资料已经保存完成，下一步只需要提交认证审核。";
  if (stage === "submitted") return "认证资料已进入运营后台待审核队列，接下来等待人工核验。";
  if (stage === "approved") return "认证已通过，可继续使用全部业务路径。";
  return "请根据审核意见补充资料后重新提交。";
}

function stageMetricLabel(stage: ReviewStage) {
  if (stage === "approved") return "已通过";
  if (stage === "submitted") return "已提交";
  if (stage === "saved") return "待提交";
  if (stage === "rejected") return "需补充";
  return "未开始";
}

function AccountVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intent = normalizeIntent(searchParams.get("intent"));
  const saved = searchParams.get("saved") === "1";
  const [session, setSession] = useState(() => readAuthSession());
  const [data, setData] = useState(() => loadMarketplaceData());
  const subject = data.buyerProfiles?.find((profile) => profile.userId === session?.userId);
  const creator = data.creators.find((profile) => profile.userId === session?.userId);
  const reviewProfile = creator ?? subject;
  const subjectChecklist = subjectChecks(subject);
  const creatorChecklist = creatorChecks(creator);
  const hasAnyProfile = Boolean(subject || creator);
  const verified = Boolean(subject?.verified || creator?.verified);
  const hasReviewDraft = Boolean(reviewProfile?.reviewDraft);
  const reviewReason = reviewProfile?.reviewDraftRejectedReason || subject?.rejectedReason || creator?.rejectedReason;
  const reviewSubmitted = session ? hasActiveReviewSubmission(data, session.userId, creator ? "creator" : "buyer_profile") : false;
  const stage = getStage({
    hasProfile: hasAnyProfile,
    hasDraft: hasReviewDraft,
    submitted: reviewSubmitted,
    verified,
    rejectedReason: reviewReason
  });
  const latestReviewSubmission = data.activityEvents.find((event) =>
    event.userId === session?.userId && event.eventType === "submit_review"
  );
  const [submitStatus, setSubmitStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!session) {
      router.push(`/login?next=${encodeURIComponent(`/account/verification?intent=${intent}`)}`);
    }
  }, [intent, router, session]);

  if (!session) return null;

  async function handleSubmitReview() {
    const targetType = creator ? "creator" : subject ? "buyer" : null;
    const targetId = creator?.id ?? subject?.id ?? "";

    if (!targetType || !targetId) {
      setSubmitStatus("请先保存主体主页或服务主页，再提交认证审核。");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("");

    try {
      await submitReview(targetType, targetId);
      setSession(readAuthSession());
      setData(loadMarketplaceData());
      setSubmitStatus("认证审核已提交，资料已进入后台待审核队列。");
      router.replace(`/account/verification?intent=${encodeURIComponent(intent)}`);
    } catch (error) {
      setSubmitStatus(error instanceof Error ? error.message : "提交认证审核失败，请稍后再试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="main">
      <section className="portalHero">
        <div className="stack">
          <span className="eyebrow">
            <ShieldCheck size={15} /> 认证中心
          </span>
          <div>
            <h1>{stageLabel(stage)}</h1>
            <p>{stageDescription(stage)}</p>
          </div>
          <div className="toolbarGroup">
            {stage === "saved" || stage === "rejected" ? (
              <button
                className="btn primary"
                disabled={isSubmitting}
                onClick={handleSubmitReview}
                type="button"
              >
                <ShieldCheck size={16} /> {isSubmitting ? "正在提交审核..." : "提交认证审核"}
              </button>
            ) : (
              <Link className="btn primary" href={continueHref(intent)}>
                <ArrowRight size={16} /> {continueLabel(intent)}
              </Link>
            )}
            {stage === "saved" || stage === "rejected" ? (
              <Link className="btn" href={continueHref(intent)}>
                <ArrowRight size={16} /> {continueLabel(intent)}
              </Link>
            ) : null}
            <Link className="btn" href="/account/profile">
              <FileBadge2 size={16} /> 补充主体资料
            </Link>
            <Link className="btn" href="/provider/profile">
              <UserRound size={16} /> 补充服务方资料
            </Link>
          </div>
        </div>
        <div className="portalStats">
          <div className="metric">
            <strong>{subject ? `${subjectChecklist.filter((item) => item.done).length}/5` : "0/5"}</strong>
            <span>主体资料</span>
          </div>
          <div className="metric">
            <strong>{creator ? `${creatorChecklist.filter((item) => item.done).length}/5` : "0/5"}</strong>
            <span>服务资料</span>
          </div>
          <div className="metric">
            <strong>{stageMetricLabel(stage)}</strong>
            <span>认证状态</span>
          </div>
        </div>
      </section>

      {saved && stage === "saved" ? (
        <section className="notice">
          <CheckCircle2 size={16} /> 主页资料已保存成功，下一步请提交认证审核。
        </section>
      ) : null}
      {stage === "saved" ? (
        <section className="notice">保存不等于送审。只有点击“提交认证审核”，资料才会进入后台待审核队列。</section>
      ) : null}
      {stage === "approved" ? (
        <section className="notice">
          已认证资料可以继续修改。简介、案例、报价、服务说明这类展示信息会直接更新；主体名称、认证类型、资质文件这类关键信息变更后，会自动回到“资料已保存”，需要你重新提交审核。
        </section>
      ) : null}
      {hasReviewDraft ? (
        <section className="notice">
          你当前有一版认证变更草稿。旧的已认证主页会继续对外展示；这版变更只有审核通过后才会替换线上版本。
        </section>
      ) : null}
      {reviewReason ? (
        <section className="notice">
          <ShieldAlert size={16} /> 上次审核意见：{reviewReason}
        </section>
      ) : null}
      {stage === "submitted" && latestReviewSubmission?.createdAt ? (
        <section className="notice">
          <Clock size={16} /> 最近一次提交认证审核：{reviewTimeLabel(latestReviewSubmission.createdAt)}
        </section>
      ) : null}
      {submitStatus ? <section className="notice">{submitStatus}</section> : null}

      <section className="card selectedCapability">
        <div className="cardBody stack">
          <div className="spaceBetween">
            <div>
              <span className={stageClass(stage)}>{stageLabel(stage)}</span>
              <h2 style={{ margin: "10px 0 0" }}>{stage === "submitted" ? "认证审核进度" : "保存后下一步"}</h2>
              <div className="muted" style={{ marginTop: 8 }}>
                {stage === "submitted" ? "资料已送入审核队列，接下来等待运营核验。" : stage === "approved" ? "认证已经通过，后续可继续使用各条业务路径。" : "主页资料已经保存完成，接下来提交认证审核即可。"}
              </div>
            </div>
            <Clock size={20} />
          </div>
          <div className="grid four">
            <div className="metric">
              <strong>1</strong>
              <span>保存主体主页</span>
            </div>
            <div className="metric">
              <strong>2</strong>
              <span>{stage === "submitted" ? "等待运营后台审核" : "提交认证审核"}</span>
            </div>
            <div className="metric">
              <strong>3</strong>
              <span>{stage === "submitted" ? "通过后公开展示已认证标识" : "运营后台人工核验真实性"}</span>
            </div>
            <div className="metric">
              <strong>4</strong>
              <span>{stage === "submitted" ? "继续发布、匹配和沟通" : "通过后公开展示已认证标识"}</span>
            </div>
          </div>
          <div className="notice">
            试运营期间未认证不阻断使用，可以先发布、匹配和沟通；查看具体信息或推进正式合作前，再完成认证即可。
          </div>
          {stage === "saved" || stage === "rejected" ? (
            <div className="toolbarGroup">
              <button className="btn primary" disabled={isSubmitting} onClick={handleSubmitReview} type="button">
                <ShieldCheck size={16} /> {isSubmitting ? "正在提交审核..." : "正式提交认证审核"}
              </button>
              <Link className="btn" href={continueHref(intent)}>继续当前业务</Link>
            </div>
          ) : null}
        </div>
      </section>

      <div className="grid two">
        <section className="card">
          <div className="panelTop">
            <div>
              <strong>主体认证标准</strong>
              <div className="muted">派单方、找培训方共用。</div>
            </div>
            <BriefcaseBusiness size={18} />
          </div>
          <div className="cardBody stack">
            <span className={stageClass(stage)}>{stageLabel(stage)}</span>
            {subject ? <div className="muted">认证类型：{verificationTypeLabel(subject.verificationType)}</div> : null}
            {subjectChecklist.map((item) => (
              <div className="miniLead" key={item.label}>
                <span>{item.label}</span>
                <em>{item.done ? "已满足" : "建议补充"}</em>
              </div>
            ))}
            <div className="toolbarGroup">
              <Link className="btn primary" href="/account/profile">补充主体资料</Link>
              {subject ? <Link className="btn" href={`/buyers/${subject.id}`}>查看公开页</Link> : null}
            </div>
          </div>
        </section>

        <section className="card">
          <div className="panelTop">
            <div>
              <strong>服务方认证标准</strong>
              <div className="muted">创作者、接单方、培训名师共用。</div>
            </div>
            <UserRound size={18} />
          </div>
          <div className="cardBody stack">
            <span className={stageClass(stage)}>{stageLabel(stage)}</span>
            {creator ? <div className="muted">认证类型：{verificationTypeLabel(creator.verificationType ?? creator.identityType)}</div> : null}
            {creatorChecklist.map((item) => (
              <div className="miniLead" key={item.label}>
                <span>{item.label}</span>
                <em>{item.done ? "已满足" : "建议补充"}</em>
              </div>
            ))}
            <div className="toolbarGroup">
              <Link className="btn primary" href="/provider/profile">补充服务资料</Link>
              {creator ? <Link className="btn" href={`/creators/${creator.id}`}>查看公开页</Link> : null}
            </div>
          </div>
        </section>
      </div>

    </main>
  );
}

export default function AccountVerificationPage() {
  return (
    <Suspense fallback={<main className="main"><div className="notice">正在加载认证中心...</div></main>}>
      <AccountVerificationContent />
    </Suspense>
  );
}
