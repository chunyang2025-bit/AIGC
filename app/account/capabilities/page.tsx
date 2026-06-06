"use client";

import { Suspense, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, GraduationCap, MessageSquare, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { loadMarketplaceData, upsertCurrentBuyerProfile } from "@/lib/store";
import { readAuthSession, setAuthCapability } from "@/lib/auth";

type BusinessIntent = "dispatch" | "service" | "training_demand" | "training_provider";

function normalizeIntent(value: string | null): BusinessIntent {
  if (value === "service" || value === "training_demand" || value === "training_provider") return value;
  return "dispatch";
}

function statusText(enabled: boolean, verified?: boolean) {
  if (!enabled) return "未启用";
  return verified ? "已通过审核" : "未认证/可试用";
}

function AccountCapabilitiesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intent = normalizeIntent(searchParams.get("intent"));
  const session = useMemo(() => readAuthSession(), []);
  const data = useMemo(() => loadMarketplaceData(), []);
  const subject = data.buyerProfiles?.find((profile) => profile.userId === session?.userId);
  const creator = data.creators.find((profile) => profile.userId === session?.userId);
  const hasTrainingService = Boolean(creator?.categories.includes("AIGC Training"));

  useEffect(() => {
    if (!session) {
      router.push("/login");
      return;
    }
    if (!subject) {
      router.push(`/account/profile?intent=${intent}`);
    }
  }, [intent, router, session, subject]);

  if (!session || !subject) return null;

  function enableDemandIdentity() {
    if (!subject) return;
    upsertCurrentBuyerProfile({
      companyName: subject.companyName,
      displayName: subject.displayName ?? subject.companyName,
      avatarUrl: subject.avatarUrl ?? subject.companyName.slice(0, 1),
      profileSlogan: subject.profileSlogan ?? "",
      industry: subject.industry,
      location: subject.location,
      companyIntro: subject.companyIntro,
      verificationType: subject.verificationType ?? "enterprise",
      contactEmail: subject.contactEmail,
      contactPhone: subject.contactPhone,
      websiteUrl: subject.websiteUrl ?? "",
      socialUrl: subject.socialUrl ?? "",
      serviceArea: subject.serviceArea ?? "",
      businessLicenseFile: subject.businessLicenseFile,
      qualificationFiles: subject.qualificationFiles
    });
    setAuthCapability("buyer", subject.verified ? "approved" : "pending_review");
    router.push("/buyer");
  }

  const flows = {
    dispatch: {
      eyebrow: "需求方身份",
      icon: BriefcaseBusiness,
      title: "发布AIGC项目需求",
      description: "把图片、短视频、数字人、文案、PPT或工作流需求发布出来，获得推荐服务方和候选对比。",
      status: statusText(Boolean(subject), subject.verified),
      statusClass: subject.verified ? "tag green" : "tag gold",
      primaryLabel: subject.verified ? "发布项目需求" : "试用发布项目需求",
      primaryHref: "/post-project",
      primaryAction: undefined,
      secondaryLabel: "查看项目需求大厅",
      secondaryHref: "/projects",
      steps: [
        { label: "主体主页", done: true },
        { label: "主体认证", done: subject.verified },
        { label: "发布需求Brief", done: data.projects.some((project) => project.buyerId === session.userId && project.category !== "AIGC Training") },
        { label: "获得匹配推荐", done: data.matches.some((match) => data.projects.some((project) => project.id === match.projectId && project.buyerId === session.userId)) },
        { label: "邀请服务方沟通", done: data.orders.some((order) => order.buyerId === session.userId) }
      ]
    },
    training_demand: {
      eyebrow: "需求方身份",
      icon: GraduationCap,
      title: "发布企业AI培训需求",
      description: "说明培训对象、人数、主题、形式和目标，向讲师或培训机构索要课程方案、报价和可沟通时间。",
      status: statusText(Boolean(subject), subject.verified),
      statusClass: subject.verified ? "tag green" : "tag gold",
      primaryLabel: subject.verified ? "发布培训需求" : "试用发布培训需求",
      primaryHref: "/post-project?category=AIGC%20Training",
      primaryAction: undefined,
      secondaryLabel: "查看培训方",
      secondaryHref: "/creators",
      steps: [
        { label: "主体主页", done: true },
        { label: "主体认证", done: subject.verified },
        { label: "填写培训对象", done: data.projects.some((project) => project.buyerId === session.userId && project.trainingRequirement?.audience) },
        { label: "索要课程方案", done: data.orders.some((order) => order.buyerId === session.userId) },
        { label: "比较讲师方案", done: data.orders.filter((order) => order.buyerId === session.userId).length >= 2 }
      ]
    },
    service: {
      eyebrow: "服务方身份",
      icon: UserRound,
      title: "完善接单服务主页",
      description: "展示可交付方向、服务包报价、案例、简历和联系方式，让派单方能判断你是否适合承接项目。",
      status: statusText(Boolean(creator), creator?.verified),
      statusClass: creator?.verified ? "tag green" : creator ? "tag gold" : "tag",
      primaryLabel: creator ? "编辑服务主页" : "创建服务主页",
      primaryHref: "/provider/profile",
      primaryAction: undefined,
      secondaryLabel: "浏览可接需求",
      secondaryHref: "/projects",
      steps: [
        { label: "主体主页", done: true },
        { label: "服务主页", done: Boolean(creator) },
        { label: "服务包报价", done: Boolean(creator?.servicePackages?.length) },
        { label: "案例展示", done: Boolean(creator?.portfolioItems?.length || creator?.portfolio.length) },
        { label: "获得项目线索", done: Boolean(creator && data.orders.some((order) => order.creatorId === creator.id)) }
      ]
    },
    training_provider: {
      eyebrow: "服务方身份",
      icon: UsersRound,
      title: "完善培训方主页",
      description: "展示可讲主题、培训形式、企业案例、课件材料和报价说明，获得企业培训线索。",
      status: statusText(hasTrainingService, creator?.verified),
      statusClass: hasTrainingService && creator?.verified ? "tag green" : creator ? "tag gold" : "tag",
      primaryLabel: hasTrainingService ? "编辑培训主页" : "创建培训主页",
      primaryHref: "/provider/profile?category=AIGC%20Training",
      primaryAction: undefined,
      secondaryLabel: "查看培训需求",
      secondaryHref: "/projects",
      steps: [
        { label: "主体主页", done: true },
        { label: "培训主题", done: Boolean(creator?.trainingProfile?.topics.length) },
        { label: "培训案例", done: Boolean(creator?.trainingProfile?.caseStudies.length) },
        { label: "材料和报价", done: Boolean(creator?.trainingProfile?.materials.length && creator?.trainingProfile?.pricingNote) },
        { label: "获得培训线索", done: Boolean(creator && data.orders.some((order) => order.creatorId === creator.id)) }
      ]
    }
  };

  const current = flows[intent];
  const CurrentIcon = current.icon;
  const otherFlows = [
    { id: "dispatch", label: "项目派单", href: "/account/capabilities?intent=dispatch" },
    { id: "training_demand", label: "找培训", href: "/account/capabilities?intent=training_demand" },
    { id: "service", label: "项目接单", href: "/account/capabilities?intent=service" },
    { id: "training_provider", label: "提供培训", href: "/account/capabilities?intent=training_provider" }
  ].filter((item) => item.id !== intent);

  return (
    <main className="main">
      <section className="portalHero">
        <div className="stack">
          <span className="eyebrow">
            <ShieldCheck size={15} /> 我的业务身份
          </span>
          <div>
            <h1>{current.title}</h1>
          </div>
          <div className="toolbarGroup">
            {current.primaryHref ? (
              <Link className="btn primary" href={current.primaryHref}>
                <CurrentIcon size={16} /> {current.primaryLabel}
              </Link>
            ) : (
              <button className="btn primary" onClick={current.primaryAction} type="button">
                <CurrentIcon size={16} /> {current.primaryLabel}
              </button>
            )}
            <Link className="btn" href={current.secondaryHref}>
              <MessageSquare size={16} /> {current.secondaryLabel}
            </Link>
          </div>
        </div>
        <div className="portalStats">
          <div className="metric">
            <strong>{current.eyebrow}</strong>
            <span>当前身份</span>
          </div>
          <div className="metric">
            <strong className={current.statusClass}>{current.status}</strong>
            <span>当前状态</span>
          </div>
          <div className="metric">
            <strong>{subject.verified ? "已认证" : "未认证"}</strong>
            <span>主体主页</span>
          </div>
        </div>
      </section>

      <section className="card selectedCapability">
        <div className="cardBody stack">
          <div className="spaceBetween">
            <div>
              <span className="tag blue">{current.eyebrow}</span>
              <h2 style={{ margin: "10px 0 0" }}>{current.title}</h2>
            </div>
            <span className={current.statusClass}>{current.status}</span>
          </div>
          <div className="grid five">
            {current.steps.map((step, index) => (
              <div className="metric" key={step.label}>
                {step.done ? <CheckCircle2 size={18} /> : <span className="tag">{index + 1}</span>}
                <strong>{step.done ? "已完成" : "待完成"}</strong>
                <span>{step.label}</span>
              </div>
            ))}
          </div>
          {!subject.verified ? (
            <div className="notice">试运营期间不强制审核。你可以先使用发布、匹配和沟通功能；查看具体信息或推进正式合作时，平台会引导完成审核认证。</div>
          ) : null}
        </div>
      </section>

      <section className="card">
        <div className="cardBody stack">
          <div className="spaceBetween">
            <div>
              <strong>主体主页共用</strong>
            </div>
            <span className={subject.verified ? "tag green" : "tag gold"}>
              {subject.verified ? "已通过审核" : "未认证/待审核"}
            </span>
          </div>
          <div className="toolbarGroup">
            <Link className="btn" href={`/account/profile?intent=${intent}`}>编辑主体主页</Link>
            <Link className="btn" href="/account">返回主体中心</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <div>
            <h2>以后可添加其他业务</h2>
          </div>
        </div>
        <div className="grid three">
          {otherFlows.map((flow) => (
            <Link className="toolMiniCard" href={flow.href} key={flow.id}>
              <strong>{flow.label}</strong>
              <span className="row muted">查看 <ArrowRight size={15} /></span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

export default function AccountCapabilitiesPage() {
  return (
    <Suspense fallback={<main className="main"><div className="notice">正在加载业务身份...</div></main>}>
      <AccountCapabilitiesContent />
    </Suspense>
  );
}
