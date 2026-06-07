"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Clock, FileBadge2, ShieldAlert, ShieldCheck, UserRound } from "lucide-react";
import { credentialUploadOptional, requiredCredentialLabel, verificationTypeLabel } from "@/lib/format";
import { loadMarketplaceData, submitReview } from "@/lib/store";
import { readAuthSession } from "@/lib/auth";
import { BuyerProfile, CreatorProfile } from "@/lib/types";

type BusinessIntent = "dispatch" | "service" | "training_demand" | "training_provider";

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

function statusLabel(hasProfile: boolean, verified?: boolean, rejectedReason?: string) {
  if (!hasProfile) return "未提交";
  if (verified) return "已认证";
  if (rejectedReason) return "需补充";
  return "待运营审核";
}

function reviewTimeLabel(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function AccountVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intent = normalizeIntent(searchParams.get("intent"));
  const session = useMemo(() => readAuthSession(), []);
  const data = useMemo(() => loadMarketplaceData(), []);
  const subject = data.buyerProfiles?.find((profile) => profile.userId === session?.userId);
  const creator = data.creators.find((profile) => profile.userId === session?.userId);
  const subjectChecklist = subjectChecks(subject);
  const creatorChecklist = creatorChecks(creator);
  const subjectScore = subjectChecklist.filter((item) => item.done).length;
  const creatorScore = creatorChecklist.filter((item) => item.done).length;
  const hasAnyProfile = Boolean(subject || creator);
  const verified = Boolean(subject?.verified || creator?.verified);
  const reviewReason = subject?.rejectedReason || creator?.rejectedReason;
  const latestReviewSubmission = data.activityEvents.find((event) =>
    event.userId === session?.userId && event.eventType === "submit_review"
  );
  const [submitStatus, setSubmitStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!session) router.push(`/login?next=${encodeURIComponent(`/account/verification?intent=${intent}`)}`);
  }, [intent, router, session]);

  if (!session) return null;

  function handleSubmitReview() {
    const targetType = creator ? "creator" : subject ? "buyer" : null;
    const targetId = creator?.id ?? subject?.id ?? "";

    if (!targetType || !targetId) {
      setSubmitStatus("请先保存主体主页或服务主页，再提交认证审核。");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("");

    try {
      submitReview(targetType, targetId);
      setSubmitStatus("认证审核已提交。现在可以去运营后台的待审核队列查看。");
      router.refresh();
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
            <h1>{statusLabel(hasAnyProfile, verified, reviewReason)}</h1>
            <p>保存主体主页即视为提交基础审核；补齐下方资料后，平台运营会在后台人工通过或驳回。</p>
          </div>
          <div className="toolbarGroup">
            <Link className="btn primary" href={continueHref(intent)}>
              <ArrowRight size={16} /> {continueLabel(intent)}
            </Link>
            <button className="btn" disabled={!hasAnyProfile || isSubmitting} onClick={handleSubmitReview} type="button">
              <ShieldCheck size={16} /> {isSubmitting ? "正在提交审核..." : "提交认证审核"}
            </button>
            <Link className="btn" href="/account/profile">
              <FileBadge2 size={16} /> 补充主体认证资料
            </Link>
            <Link className="btn" href="/provider/profile">
              <UserRound size={16} /> 补充服务方资料
            </Link>
          </div>
        </div>
        <div className="portalStats">
          <div className="metric">
            <strong>{subject ? `${subjectScore}/5` : "0/5"}</strong>
            <span>主体资料</span>
          </div>
          <div className="metric">
            <strong>{creator ? `${creatorScore}/5` : "0/5"}</strong>
            <span>服务资料</span>
          </div>
          <div className="metric">
            <strong>{verified ? "通过" : "人工审核"}</strong>
            <span>认证方式</span>
          </div>
        </div>
      </section>

      {reviewReason ? (
        <section className="notice">
          <ShieldAlert size={16} /> 上次审核意见：{reviewReason}
        </section>
      ) : null}
      {latestReviewSubmission ? (
        <section className="notice">
          <Clock size={16} /> 最近一次提交认证审核：{reviewTimeLabel(latestReviewSubmission.createdAt)}
        </section>
      ) : null}
      {submitStatus ? <section className="notice">{submitStatus}</section> : null}

      <section className="card selectedCapability">
        <div className="cardBody stack">
          <div className="spaceBetween">
            <div>
              <span className={verified ? "tag green" : hasAnyProfile ? "tag gold" : "tag"}>
                {statusLabel(hasAnyProfile, verified, reviewReason)}
              </span>
              <h2 style={{ margin: "10px 0 0" }}>认证怎么通过</h2>
            </div>
            <Clock size={20} />
          </div>
          <div className="grid four">
            <div className="metric">
              <strong>1</strong>
              <span>保存主体主页，进入审核队列</span>
            </div>
            <div className="metric">
              <strong>2</strong>
              <span>补齐联系方式和认证材料</span>
            </div>
            <div className="metric">
              <strong>3</strong>
              <span>运营后台人工核验真实性</span>
            </div>
            <div className="metric">
              <strong>4</strong>
              <span>通过后公开展示已认证标识</span>
            </div>
          </div>
          <div className="notice">
            试运营期间未认证不阻断使用，可以先发布、匹配和沟通；当用户查看具体联系方式、推进正式合作或提升公开信任时，会引导补齐认证。
          </div>
          <div className="toolbarGroup">
            <button className="btn primary" disabled={!hasAnyProfile || isSubmitting} onClick={handleSubmitReview} type="button">
              <ShieldCheck size={16} /> {isSubmitting ? "正在提交审核..." : "正式提交认证审核"}
            </button>
            <Link className="btn" href="/admin-entry">查看后台审核说明</Link>
          </div>
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
            <span className={subject?.verified ? "tag green" : subject ? "tag gold" : "tag"}>
              {statusLabel(Boolean(subject), subject?.verified, subject?.rejectedReason)}
            </span>
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
            <span className={creator?.verified ? "tag green" : creator ? "tag gold" : "tag"}>
              {statusLabel(Boolean(creator), creator?.verified, creator?.rejectedReason)}
            </span>
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

      <section className="card">
        <div className="cardBody stack">
          <div className="spaceBetween">
            <div>
              <h2 style={{ margin: 0 }}>谁来审核</h2>
              <div className="muted">普通用户不需要自己找后台入口，资料保存后会自动出现在运营后台的待审核队列。</div>
            </div>
            <ShieldCheck size={20} />
          </div>
          <div className="grid three">
            <div className="metric">
              <strong>用户</strong>
              <span>保存/补充资料</span>
            </div>
            <div className="metric">
              <strong>运营</strong>
              <span>进入后台审核主体</span>
            </div>
            <div className="metric">
              <strong>系统</strong>
              <span>更新已认证或需补充状态</span>
            </div>
          </div>
          <div className="notice">
            运营后台入口：登录平台运营账号后进入“主体审核”，可通过或驳回。驳回原因会显示在本页，用户修改主页后即重新进入审核队列。
          </div>
        </div>
      </section>
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
