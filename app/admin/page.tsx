"use client";

import { useEffect, useState } from "react";
import { BriefcaseBusiness, Clock3, Download, ShieldCheck, UsersRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { activeOrders, monthlyActiveUsers } from "@/lib/analytics";
import { activityEventLabel, categoryLabel, money, orderResultReasonLabel, orderStatusLabel, projectStatusLabel, roleLabel, targetTypeLabel, verificationTypeLabel } from "@/lib/format";
import { deliverableTypeLabel, projectUseCaseLabel, urgencyLabel } from "@/lib/growth-taxonomy";
import { trainingFormatLabel } from "@/lib/training";
import { loadMarketplaceData, resolveFeedback, resolveReport, reviewProject, suspendUser, verifySubject } from "@/lib/store";
import { readAuthSession } from "@/lib/auth";
import { windowMetrics } from "@/lib/growth";

function countBy(values: string[]) {
  const counts = values.reduce<Record<string, number>>((acc, value) => {
    const key = value || "未填写";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function feedbackCategoryLabel(value: string) {
  const labels: Record<string, string> = {
    suggestion: "建议",
    bug: "问题",
    confusing: "看不懂",
    missing_feature: "缺功能",
    other: "其他"
  };
  return labels[value] ?? value;
}

function feedbackStatusLabel(value: string) {
  const labels: Record<string, string> = {
    open: "待处理",
    reviewing: "处理中",
    resolved: "已处理",
    dismissed: "暂不处理"
  };
  return labels[value] ?? value;
}

export default function AdminPage() {
  const router = useRouter();
  const session = readAuthSession();
  const data = loadMarketplaceData();
  const intentBudget = data.orders.reduce((sum, order) => sum + order.amount, 0);
  const reachedIntent = data.orders.filter((order) => order.status === "approved").length;
  const buyerMau = monthlyActiveUsers(data, "buyer");
  const creatorMau = monthlyActiveUsers(data, "creator");
  const verifiedSubjects = (data.buyerProfiles ?? []).filter((profile) => profile.verified).length + data.creators.filter((creator) => creator.verified).length;
  const pendingSubjects = (data.buyerProfiles ?? []).filter((profile) => !profile.verified).length + data.creators.filter((creator) => !creator.verified).length;
  const pendingProjects = data.projects.filter((project) => project.status === "pending_review").length;
  const openReports = data.reports.filter((report) => report.status === "open" || report.status === "reviewing").length;
  const openFeedback = data.feedback.filter((feedback) => feedback.status === "open" || feedback.status === "reviewing").length;
  const suspendedUsers = data.users.filter((user) => user.status === "suspended").length;
  const pendingBuyerProfiles = (data.buyerProfiles ?? []).filter((profile) => !profile.verified);
  const pendingCreators = data.creators.filter((creator) => !creator.verified);
  const pendingProjectReviews = data.projects.filter((project) => project.status === "pending_review");
  const activeReports = data.reports.filter((report) => report.status === "open" || report.status === "reviewing");
  const activeFeedback = data.feedback.filter((feedback) => feedback.status === "open" || feedback.status === "reviewing");
  const suspendedAccounts = data.users.filter((user) => user.status === "suspended");
  const subjectProfiles = new Set([
    ...(data.buyerProfiles ?? []).map((profile) => profile.userId),
    ...data.creators.map((creator) => creator.userId)
  ]);
  const submittedReviews = (data.buyerProfiles?.length ?? 0) + data.creators.length;
  const publishedProjectUsers = new Set(data.projects.map((project) => project.buyerId));
  const communicatingUsers = new Set([
    ...data.orders.map((order) => order.buyerId),
    ...data.orders
      .map((order) => data.creators.find((creator) => creator.id === order.creatorId)?.userId)
      .filter(Boolean)
  ]);
  const funnel = [
    { label: "注册账号", value: data.users.filter((user) => user.role !== "admin").length },
    { label: "完善主体主页", value: subjectProfiles.size },
    { label: "提交审核资料", value: submittedReviews },
    { label: "审核通过主体", value: verifiedSubjects },
    { label: "发布需求主体", value: publishedProjectUsers.size },
    { label: "产生沟通主体", value: communicatingUsers.size }
  ];
  const [reviewReason, setReviewReason] = useState("资料不完整，请补充主体资质或联系方式后重新提交。");
  const [projectQuery, setProjectQuery] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState("pending_review");
  const [projectEntryFilter, setProjectEntryFilter] = useState<"all" | "service" | "training">("all");
  const [metricWindow, setMetricWindow] = useState<7 | 30>(30);
  const selectedMetrics = windowMetrics(data, metricWindow);
  const sevenDayMetrics = windowMetrics(data, 7);
  const thirtyDayMetrics = windowMetrics(data, 30);
  const recentOrders = data.orders.slice(0, 20);
  const recentActivity = data.activityEvents.slice().reverse().slice(0, 50);
  const recentReviewSubmissions = data.activityEvents
    .filter((event) => event.eventType === "submit_review")
    .slice(0, 8)
    .map((event) => {
      const buyer = (data.buyerProfiles ?? []).find((profile) => profile.id === event.targetId || profile.userId === event.userId);
      const creator = data.creators.find((profile) => profile.id === event.targetId || profile.userId === event.userId);
      const user = data.users.find((item) => item.id === event.userId);

      return {
        ...event,
        label:
          buyer?.displayName ??
          buyer?.companyName ??
          creator?.displayName ??
          creator?.name ??
          user?.name ??
          event.userId,
        contact:
          buyer?.contactEmail ||
          buyer?.contactPhone ||
          creator?.contactEmail ||
          creator?.contactPhone ||
          user?.email ||
          user?.phone ||
          "-"
      };
    });
  const contactedLeads = data.orders.filter((order) => ["contacted", "meeting_scheduled", "revision", "delivered", "approved"].includes(order.status));
  const meetingLeads = data.orders.filter((order) => order.status === "meeting_scheduled");
  const intentLeads = data.orders.filter((order) => order.status === "approved");
  const noResponseLeads = data.orders.filter((order) => order.status === "no_response");
  const closedLeads = data.orders.filter((order) => ["not_fit", "no_response", "cancelled"].includes(order.status));
  const topCloseReasons = countBy(closedLeads.map((order) => orderResultReasonLabel(order.resultReason))).slice(0, 6);
  const filteredProjects = data.projects.filter((project) => {
    const buyer = data.buyerProfiles?.find((profile) => profile.userId === project.buyerId);
    const buyerName = buyer?.displayName ?? buyer?.companyName ?? data.users.find((user) => user.id === project.buyerId)?.name ?? "";
    const haystack = `${project.title} ${project.description} ${project.tags?.join(" ") ?? ""} ${buyerName}`.toLowerCase();
    const matchesQuery = !projectQuery.trim() || haystack.includes(projectQuery.trim().toLowerCase());
    const matchesStatus = projectStatusFilter === "all" || project.status === projectStatusFilter;
    const matchesEntry =
      projectEntryFilter === "all" ||
      (projectEntryFilter === "training" ? project.category === "AIGC Training" : project.category !== "AIGC Training");
    return matchesQuery && matchesStatus && matchesEntry;
  });
  const topCategories = countBy(data.projects.map((project) => categoryLabel(project.category))).slice(0, 6);
  const topCreatorCategories = countBy(data.creators.flatMap((creator) => creator.categories.map(categoryLabel))).slice(0, 6);
  const topUseCases = countBy(data.projects.map((project) => projectUseCaseLabel(project.useCase))).slice(0, 6);
  const topDeliverables = countBy(data.projects.flatMap((project) => (project.deliverableTypes?.length ? project.deliverableTypes : ["未填写"]).map(deliverableTypeLabel))).slice(0, 6);
  const topRegions = countBy([
    ...(data.buyerProfiles ?? []).map((profile) => profile.location || "未填写"),
    ...data.creators.map((creator) => creator.location || "未填写")
  ]).slice(0, 6);
  const urgentProjects = data.projects.filter((project) => project.urgency === "urgent" || project.urgency === "this_week").length;
  const longTermProjects = data.projects.filter((project) => project.longTerm).length;
  const invoiceProjects = data.projects.filter((project) => project.needInvoice).length;
  const trainingCreators = data.creators.filter((creator) => creator.categories.includes("AIGC Training"));
  const trainingCreatorsWithTopics = trainingCreators.filter((creator) => creator.trainingProfile?.topics.length);
  const trainingCreatorsWithCases = trainingCreators.filter((creator) => creator.trainingProfile?.caseStudies.length);
  const trainingCreatorsWithPricing = trainingCreators.filter((creator) => creator.trainingProfile?.pricingNote);
  const trainingCreatorsWithMaterials = trainingCreators.filter((creator) => creator.trainingProfile?.materials.length);
  const trainingCreatorsWithCities = trainingCreators.filter((creator) => creator.trainingProfile?.cities.length);
  const trainingProjects = data.projects.filter((project) => project.category === "AIGC Training");
  const serviceProjects = data.projects.filter((project) => project.category !== "AIGC Training");
  const serviceCreators = data.creators.filter((creator) => !creator.categories.includes("AIGC Training") || creator.categories.length > 1);
  const trainingCreatorIds = new Set(trainingCreators.map((creator) => creator.id));
  const serviceProjectIds = new Set(serviceProjects.map((project) => project.id));
  const trainingProjectIds = new Set(trainingProjects.map((project) => project.id));
  const serviceLeads = data.orders.filter((order) => serviceProjectIds.has(order.projectId));
  const trainingLeads = data.orders.filter((order) => trainingProjectIds.has(order.projectId));
  const trainingProviderLeads = data.orders.filter((order) => trainingCreatorIds.has(order.creatorId));
  const projectToTrainingOpportunities = serviceProjects.filter((project) => project.longTerm || project.useCase === "training" || project.useCase === "internal_efficiency");
  const trainingToServiceOpportunities = trainingProjects.filter((project) => project.urgency === "urgent" || project.urgency === "this_week" || project.trainingRequirement?.needCustomCases);
  const serviceToTrainingCreators = serviceCreators.filter((creator) => !creator.categories.includes("AIGC Training") && Boolean(creator.servicePackages?.length || creator.portfolioItems?.length || creator.portfolio.length));
  const trainingToServiceCreators = trainingCreators.filter((creator) => creator.categories.length === 1);
  const fourEntryMetrics = [
    {
      label: "我要派单",
      value: serviceProjects.length,
      sub: `${serviceLeads.length} 条项目沟通线索`,
      status: serviceProjects.length >= serviceCreators.length ? "需求强" : "供给强",
      href: "/post-project"
    },
    {
      label: "我要接单",
      value: serviceCreators.length,
      sub: `${serviceCreators.filter((creator) => creator.verified).length} 个已认证服务方`,
      status: serviceCreators.length >= serviceProjects.length ? "供给充足" : "需补服务方",
      href: "/creators"
    },
    {
      label: "我要找培训",
      value: trainingProjects.length,
      sub: `${trainingLeads.length} 条培训需求线索`,
      status: trainingProjects.length >= trainingCreators.length ? "需求强" : "待拉需求",
      href: "/post-project?category=AIGC%20Training"
    },
    {
      label: "我能提供培训",
      value: trainingCreators.length,
      sub: `${trainingProviderLeads.length} 条讲师相关线索`,
      status: trainingCreators.length >= trainingProjects.length ? "讲师充足" : "需补讲师",
      href: "/provider/profile?category=AIGC%20Training"
    }
  ];
  const fourEntryAdvice = [
    serviceProjects.length < 3 ? "项目派单需求样本偏少，建议用行业案例引导企业发布真实交付需求。" : "",
    serviceCreators.length < 8 ? "接单服务方供给还不厚，建议优先邀请短视频、图片设计、数字人口播服务方入驻。" : "",
    trainingProjects.length < 3 ? "培训需求仍需拉新，可用企业内训、岗位提效工作坊作为BD话术。" : "",
    trainingCreators.length < 5 ? "培训讲师池还偏薄，建议优先补提示词、AI办公、AI营销内容三个主题。" : ""
  ].filter(Boolean);
  const entryFunnels = [
    {
      label: "我要派单",
      steps: [
        { label: "主体资料", value: data.buyerProfiles?.length ?? 0 },
        { label: "主体通过", value: (data.buyerProfiles ?? []).filter((profile) => profile.verified).length },
        { label: "发布项目", value: serviceProjects.length },
        { label: "产生线索", value: serviceLeads.length }
      ]
    },
    {
      label: "我要接单",
      steps: [
        { label: "服务方资料", value: serviceCreators.length },
        { label: "服务方通过", value: serviceCreators.filter((creator) => creator.verified).length },
        { label: "可接项目", value: serviceCreators.filter((creator) => creator.categories.some((category) => category !== "AIGC Training")).length },
        { label: "产生线索", value: data.orders.filter((order) => serviceCreators.some((creator) => creator.id === order.creatorId)).length }
      ]
    },
    {
      label: "我要找培训",
      steps: [
        { label: "主体资料", value: data.buyerProfiles?.length ?? 0 },
        { label: "主体通过", value: (data.buyerProfiles ?? []).filter((profile) => profile.verified).length },
        { label: "发布培训", value: trainingProjects.length },
        { label: "培训线索", value: trainingLeads.length }
      ]
    },
    {
      label: "我能提供培训",
      steps: [
        { label: "服务方资料", value: data.creators.length },
        { label: "培训能力", value: trainingCreators.length },
        { label: "讲师通过", value: trainingCreators.filter((creator) => creator.verified).length },
        { label: "讲师线索", value: trainingProviderLeads.length }
      ]
    }
  ];
  const topTrainingTopics = countBy([
    ...trainingCreators.flatMap((creator) => creator.trainingProfile?.topics ?? []),
    ...trainingProjects.flatMap((project) => project.trainingRequirement?.topics ?? [])
  ]).slice(0, 6);
  const topTrainingFormats = countBy([
    ...trainingCreators.flatMap((creator) => (creator.trainingProfile?.formats ?? []).map(trainingFormatLabel)),
    ...trainingProjects.map((project) => trainingFormatLabel(project.trainingRequirement?.format))
  ]).slice(0, 6);
  const topTrainingCities = countBy([
    ...trainingCreators.flatMap((creator) => creator.trainingProfile?.cities ?? []),
    ...trainingProjects.map((project) => project.trainingRequirement?.city || "未填写")
  ]).slice(0, 6);

  function confirmAction(message: string) {
    return window.confirm(message);
  }

  function reportTargetHref(targetType: string, targetId: string) {
    if (targetType === "project") return `/projects/${targetId}`;
    if (targetType === "creator") return `/creators/${targetId}`;
    if (targetType === "buyer_profile") return `/buyers/${targetId}`;
    if (targetType === "order" || targetType === "message") return `/orders/${targetId}`;
    return "";
  }

  function exportOperationsReport() {
    const report = {
      exportedAt: new Date().toISOString(),
      platform: {
        name: "AIGClancer",
        positioning: "AIGC供需撮合与创作者入驻平台",
        launchStrategy: "免费开放入驻，派单方资质审核后发布真实需求，接单方基础入驻后通过新手任务完善资料。",
        liabilityBoundary: "平台只提供信息展示、智能匹配和沟通留痕，不托管资金，不承诺交易交付。"
      },
      summary: {
        registeredUsers: data.users.length,
        buyerProfiles: data.buyerProfiles?.length ?? 0,
        creators: data.creators.length,
        verifiedBuyerProfiles: (data.buyerProfiles ?? []).filter((profile) => profile.verified).length,
        verifiedCreators: data.creators.filter((creator) => creator.verified).length,
        projects: data.projects.length,
        publicProjects: data.projects.filter((project) => project.status === "open" || project.status === "matching").length,
        leads: data.orders.length,
        activeLeads: activeOrders(data),
        contactedLeads: contactedLeads.length,
        meetingLeads: meetingLeads.length,
        intentLeads: intentLeads.length,
        noResponseLeads: noResponseLeads.length,
        closedLeads: closedLeads.length,
        intentionBudget: intentBudget,
        reachedIntent,
        buyerMau,
        creatorMau,
        totalMau: monthlyActiveUsers(data),
        activityEvents: data.activityEvents.length,
        trialFeedback: data.feedback.length,
        openFeedback,
        agentBriefs: data.projects.filter((project) => project.agentBrief).length,
        agentMatches: data.matches.length
      },
      windows: {
        sevenDays: sevenDayMetrics,
        thirtyDays: thirtyDayMetrics
      },
      supplyDemandSegments: {
        fourEntries: fourEntryMetrics,
        entryFunnels,
        demandCategories: topCategories,
        creatorCategories: topCreatorCategories,
        projectUseCases: topUseCases,
        deliverables: topDeliverables,
        regions: topRegions,
        urgentProjects,
        longTermProjects,
        invoiceProjects,
        recommendableProjects: data.projects.filter((project) => project.acceptPlatformRecommend !== false).length
      },
      trainingMarket: {
        creators: trainingCreators.length,
        projects: trainingProjects.length,
        leads: trainingLeads.length,
        providerQuality: {
          withTopics: trainingCreatorsWithTopics.length,
          withCases: trainingCreatorsWithCases.length,
          withPricing: trainingCreatorsWithPricing.length,
          withMaterials: trainingCreatorsWithMaterials.length,
          withCities: trainingCreatorsWithCities.length
        },
        topics: topTrainingTopics,
        formats: topTrainingFormats,
        cities: topTrainingCities
      },
      conversionOpportunities: {
        projectToTraining: projectToTrainingOpportunities.length,
        trainingToService: trainingToServiceOpportunities.length,
        serviceToTrainingCreators: serviceToTrainingCreators.length,
        trainingToServiceCreators: trainingToServiceCreators.length
      },
      leadQuality: {
        contacted: contactedLeads.length,
        meetings: meetingLeads.length,
        reachedIntent: intentLeads.length,
        noResponse: noResponseLeads.length,
        closed: closedLeads.length,
        closeReasons: topCloseReasons
      },
      pendingReviews: {
        buyers: (data.buyerProfiles ?? []).filter((profile) => !profile.verified).map((profile) => ({
          id: profile.id,
          name: profile.displayName ?? profile.companyName,
          type: profile.verificationType,
          contact: profile.contactEmail || profile.contactPhone
        })),
        creators: data.creators.filter((creator) => !creator.verified).map((creator) => ({
          id: creator.id,
          name: creator.displayName ?? creator.name,
          type: creator.verificationType ?? creator.identityType,
          contact: creator.contactEmail || creator.contactPhone
        }))
      },
      recentActivity: data.activityEvents.slice(-50)
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `aigclancer-operations-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    if (!session || session.role !== "admin") {
      router.push("/login?role=admin");
    }
  }, [router, session]);

  if (!session || session.role !== "admin") {
    return null;
  }

  return (
    <main className="main">
      <div className="pageHeader">
        <div>
          <h1>运营后台</h1>
          <p>查看用户审核、需求管理、合作线索、意向预算和月活数据。</p>
        </div>
        <button
          className="btn"
          onClick={exportOperationsReport}
          type="button"
        >
          <Download size={16} /> 导出运营报表
        </button>
        <button
          className="btn primary"
          onClick={() => {
            if (!confirmAction("确定要将全部待审核主体标记为审核通过吗？")) return;
            data.buyerProfiles?.filter((profile) => !profile.verified).forEach((profile) => verifySubject("buyer", profile.id));
            data.creators.filter((creator) => !creator.verified).forEach((creator) => verifySubject("creator", creator.id));
            router.refresh();
          }}
        >
          <ShieldCheck size={16} /> 全部审核通过
        </button>
      </div>

      <section className="section">
        <div className="grid four">
          <div className="metric">
            <strong>{data.users.length}</strong>
            <span>注册用户数</span>
          </div>
          <div className="metric">
            <strong>{pendingProjects}</strong>
            <span>待审核需求</span>
          </div>
          <div className="metric">
            <strong>{verifiedSubjects}</strong>
            <span>审核通过主体</span>
          </div>
          <div className="metric">
            <strong>{pendingSubjects}</strong>
            <span>待审核主体</span>
          </div>
          <div className="metric">
            <strong>{openReports}</strong>
            <span>待处理举报</span>
          </div>
          <div className="metric">
            <strong>{suspendedUsers}</strong>
            <span>受限账号</span>
          </div>
          <div className="metric">
            <strong>{money(intentBudget)}</strong>
            <span>意向预算总额</span>
          </div>
          <div className="metric">
            <strong>{reachedIntent}</strong>
            <span>已达成意向</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <div>
            <h2>今日待处理</h2>
            <p>运营优先处理这些事项，减少审核积压和风险滞留。</p>
          </div>
        </div>
        <div className="grid four">
          <article className="card">
            <div className="cardBody stack">
              <div className="spaceBetween">
                <strong>主体审核</strong>
                <span className={pendingSubjects ? "tag gold" : "tag green"}>{pendingSubjects}</span>
              </div>
              <p className="muted" style={{ margin: 0 }}>派单方 {pendingBuyerProfiles.length} 个，接单方 {pendingCreators.length} 个。</p>
            </div>
          </article>
          <article className="card">
            <div className="cardBody stack">
              <div className="spaceBetween">
                <strong>需求审核</strong>
                <span className={pendingProjectReviews.length ? "tag gold" : "tag green"}>{pendingProjectReviews.length}</span>
              </div>
              <p className="muted" style={{ margin: 0 }}>{pendingProjectReviews[0]?.title ?? "暂无待审核需求。"}</p>
            </div>
          </article>
          <article className="card">
            <div className="cardBody stack">
              <div className="spaceBetween">
                <strong>举报处理</strong>
                <span className={activeReports.length ? "tag gold" : "tag green"}>{activeReports.length}</span>
              </div>
              <p className="muted" style={{ margin: 0 }}>{activeReports[0]?.reason ?? "暂无待处理举报。"}</p>
            </div>
          </article>
          <article className="card">
            <div className="cardBody stack">
              <div className="spaceBetween">
                <strong>试用建议</strong>
                <span className={activeFeedback.length ? "tag gold" : "tag green"}>{activeFeedback.length}</span>
              </div>
              <p className="muted" style={{ margin: 0 }}>{activeFeedback[0]?.content ?? "暂无待处理建议。"}</p>
            </div>
          </article>
          <article className="card">
            <div className="cardBody stack">
              <div className="spaceBetween">
                <strong>受限账号</strong>
                <span className={suspendedAccounts.length ? "tag gold" : "tag green"}>{suspendedAccounts.length}</span>
              </div>
              <p className="muted" style={{ margin: 0 }}>{suspendedAccounts[0]?.name ?? "暂无受限账号。"}</p>
            </div>
          </article>
        </div>
      </section>

      <section className="card">
        <div className="panelTop">
          <div>
            <strong>最新认证提交</strong>
            <div className="muted">这里只显示用户主动点击“提交认证审核”的记录。</div>
          </div>
          <Clock3 size={18} />
        </div>
        <div className="cardBody stack">
          {recentReviewSubmissions.length ? recentReviewSubmissions.map((event) => (
            <div className="miniLead" key={event.id}>
              <span>{event.label} · {targetTypeLabel(event.targetType)}</span>
              <em>{event.contact} · {new Date(event.createdAt).toLocaleString("zh-CN", { hour12: false })}</em>
            </div>
          )) : <div className="muted">还没有用户正式提交认证审核。</div>}
          <div className="notice">
            审核动作仍在下方“派单方审核”和“创作者审核”区完成；这里负责明确告诉你哪些资料是最新送审的。
          </div>
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <div>
            <h2>月活运营指标</h2>
            <p>用于跟踪需求方与创作者活跃情况，沉淀平台运营证明。</p>
          </div>
        </div>
        <div className="grid four">
          <div className="metric">
            <strong>{buyerMau}</strong>
            <span>需求方月活</span>
          </div>
          <div className="metric">
            <strong>{creatorMau}</strong>
            <span>创作者月活</span>
          </div>
          <div className="metric">
            <strong>{activeOrders(data)}</strong>
            <span>活跃线索</span>
          </div>
          <div className="metric">
            <strong>{data.activityEvents.length}</strong>
            <span>活跃事件留痕</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <div>
            <h2>{metricWindow}日增长看板</h2>
            <p>用于上线后观察注册、活跃、需求发布、沟通线索和消息互动。</p>
          </div>
          <div className="toolbarGroup">
            <button className={metricWindow === 7 ? "btn primary" : "btn"} onClick={() => setMetricWindow(7)} type="button">7日</button>
            <button className={metricWindow === 30 ? "btn primary" : "btn"} onClick={() => setMetricWindow(30)} type="button">30日</button>
          </div>
        </div>
        <div className="grid six">
          <div className="metric">
            <strong>{selectedMetrics.registeredUsers}</strong>
            <span>新增注册</span>
          </div>
          <div className="metric">
            <strong>{selectedMetrics.activeUsers}</strong>
            <span>活跃用户</span>
          </div>
          <div className="metric">
            <strong>{selectedMetrics.buyerActiveUsers}</strong>
            <span>派单方活跃</span>
          </div>
          <div className="metric">
            <strong>{selectedMetrics.creatorActiveUsers}</strong>
            <span>接单方活跃</span>
          </div>
          <div className="metric">
            <strong>{selectedMetrics.projects}</strong>
            <span>新增需求</span>
          </div>
          <div className="metric">
            <strong>{selectedMetrics.leads}</strong>
            <span>新增沟通线索</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <div>
            <h2>撮合质量看板</h2>
            <p>试运营期间重点看线索是否真的聊上、约上、达成意向，以及失败原因集中在哪里。</p>
          </div>
        </div>
        <div className="grid five">
          <div className="metric">
            <strong>{data.orders.length}</strong>
            <span>沟通线索</span>
          </div>
          <div className="metric">
            <strong>{contactedLeads.length}</strong>
            <span>已联系/沟通</span>
          </div>
          <div className="metric">
            <strong>{meetingLeads.length}</strong>
            <span>已约沟通</span>
          </div>
          <div className="metric">
            <strong>{intentLeads.length}</strong>
            <span>达成合作意向</span>
          </div>
          <div className="metric">
            <strong>{noResponseLeads.length}</strong>
            <span>无回复线索</span>
          </div>
        </div>
        <div className="grid two">
          <article className="card">
            <div className="cardBody stack">
              <strong>关闭原因 Top</strong>
              <div className="tagList">
                {topCloseReasons.map((item) => <span className="tag gold" key={item.label}>{item.label} · {item.value}</span>)}
                {!topCloseReasons.length ? <span className="tag">暂无关闭原因</span> : null}
              </div>
            </div>
          </article>
          <article className="card">
            <div className="cardBody stack">
              <strong>试运营判断</strong>
              <div className="tagList">
                <span className="tag blue">线索联系率 {data.orders.length ? Math.round((contactedLeads.length / data.orders.length) * 100) : 0}%</span>
                <span className="tag green">意向转化率 {data.orders.length ? Math.round((intentLeads.length / data.orders.length) * 100) : 0}%</span>
                <span className="tag gold">关闭率 {data.orders.length ? Math.round((closedLeads.length / data.orders.length) * 100) : 0}%</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <div>
            <h2>四入口与供需分层</h2>
            <p>按派单、接单、找培训、提供培训四个入口观察转化基础，再看哪些方向供给多、需求多、响应更急。</p>
          </div>
        </div>
        <div className="grid four">
          {fourEntryMetrics.map((item) => (
            <article className="card" key={item.label}>
              <div className="cardBody stack">
                <div className="spaceBetween">
                  <strong>{item.label}</strong>
                  <span className={item.status.includes("需") || item.status.includes("待") ? "tag gold" : "tag green"}>{item.status}</span>
                </div>
                <div className="metric inlineMetric">
                  <strong>{item.value}</strong>
                  <span>{item.sub}</span>
                </div>
                <Link className="btn" href={item.href}>查看入口</Link>
              </div>
            </article>
          ))}
        </div>
        {fourEntryAdvice.length ? (
          <div className="notice stack">
            <strong>四入口运营建议</strong>
            <div className="tagList">
              {fourEntryAdvice.map((item) => <span className="tag gold" key={item}>{item}</span>)}
            </div>
          </div>
        ) : (
          <div className="notice">四个入口当前都有基础样本，下一步重点观察访问到发布/入驻的转化率。</div>
        )}
        <div className="grid four">
          {entryFunnels.map((entry) => (
            <article className="card" key={entry.label}>
              <div className="cardBody stack">
                <strong>{entry.label}漏斗</strong>
                {entry.steps.map((step, index) => (
                  <div className="spaceBetween" key={step.label}>
                    <span className="muted">{index + 1}. {step.label}</span>
                    <span className="tag blue">{step.value}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
        <div className="grid four">
          <div className="metric">
            <strong>{projectToTrainingOpportunities.length}</strong>
            <span>派单可转培训</span>
          </div>
          <div className="metric">
            <strong>{trainingToServiceOpportunities.length}</strong>
            <span>培训可转样品</span>
          </div>
          <div className="metric">
            <strong>{serviceToTrainingCreators.length}</strong>
            <span>接单者可补培训</span>
          </div>
          <div className="metric">
            <strong>{trainingToServiceCreators.length}</strong>
            <span>讲师可补落地</span>
          </div>
        </div>
        <div className="grid four">
          <div className="metric">
            <strong>{urgentProjects}</strong>
            <span>急单/本周沟通需求</span>
          </div>
          <div className="metric">
            <strong>{longTermProjects}</strong>
            <span>长期合作意向</span>
          </div>
          <div className="metric">
            <strong>{invoiceProjects}</strong>
            <span>需要发票/合同</span>
          </div>
          <div className="metric">
            <strong>{data.projects.filter((project) => project.acceptPlatformRecommend !== false).length}</strong>
            <span>接受平台推荐需求</span>
          </div>
        </div>
        <div className="grid two">
          <article className="card">
            <div className="cardBody stack">
              <strong>需求赛道 Top</strong>
              <div className="tagList">
                {topCategories.map((item) => <span className="tag blue" key={item.label}>{item.label} · {item.value}</span>)}
              </div>
            </div>
          </article>
          <article className="card">
            <div className="cardBody stack">
              <strong>供给赛道 Top</strong>
              <div className="tagList">
                {topCreatorCategories.map((item) => <span className="tag green" key={item.label}>{item.label} · {item.value}</span>)}
              </div>
            </div>
          </article>
          <article className="card">
            <div className="cardBody stack">
              <strong>需求用途 Top</strong>
              <div className="tagList">
                {topUseCases.map((item) => <span className="tag" key={item.label}>{item.label} · {item.value}</span>)}
              </div>
            </div>
          </article>
          <article className="card">
            <div className="cardBody stack">
              <strong>交付物 Top</strong>
              <div className="tagList">
                {topDeliverables.map((item) => <span className="tag" key={item.label}>{item.label} · {item.value}</span>)}
              </div>
            </div>
          </article>
          <article className="card">
            <div className="cardBody stack">
              <strong>地区分布 Top</strong>
              <div className="tagList">
                {topRegions.map((item) => <span className="tag" key={item.label}>{item.label} · {item.value}</span>)}
              </div>
            </div>
          </article>
          <article className="card">
            <div className="cardBody stack">
              <strong>沟通节奏</strong>
              <div className="tagList">
                {countBy(data.projects.map((project) => urgencyLabel(project.urgency))).map((item) => <span className="tag" key={item.label}>{item.label} · {item.value}</span>)}
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <div>
            <h2>AIGC培训市场</h2>
            <p>单独观察培训讲师、培训需求、培训线索和热门主题，避免和课程内容制作混在一起。</p>
          </div>
        </div>
        <div className="grid four">
          <div className="metric">
            <strong>{trainingCreators.length}</strong>
            <span>培训服务讲师</span>
          </div>
          <div className="metric">
            <strong>{trainingProjects.length}</strong>
            <span>培训需求</span>
          </div>
          <div className="metric">
            <strong>{trainingLeads.length}</strong>
            <span>培训沟通线索</span>
          </div>
          <div className="metric">
            <strong>{trainingProjects.filter((project) => project.trainingRequirement?.needCustomCases).length}</strong>
            <span>需定制案例</span>
          </div>
        </div>
        <div className="sectionHeader compactHeader">
          <div>
            <h3>讲师供给质量</h3>
            <p>用于判断培训服务方是否已经具备可邀约、可报价、可展示案例的基础。</p>
          </div>
        </div>
        <div className="grid five">
          <div className="metric">
            <strong>{trainingCreatorsWithTopics.length}</strong>
            <span>有培训主题</span>
          </div>
          <div className="metric">
            <strong>{trainingCreatorsWithCases.length}</strong>
            <span>有企业案例</span>
          </div>
          <div className="metric">
            <strong>{trainingCreatorsWithPricing.length}</strong>
            <span>有报价说明</span>
          </div>
          <div className="metric">
            <strong>{trainingCreatorsWithMaterials.length}</strong>
            <span>有课件材料</span>
          </div>
          <div className="metric">
            <strong>{trainingCreatorsWithCities.length}</strong>
            <span>有城市覆盖</span>
          </div>
        </div>
        <div className="grid three">
          <article className="card">
            <div className="cardBody stack">
              <strong>热门培训主题</strong>
              <div className="tagList">
                {topTrainingTopics.map((item) => <span className="tag green" key={item.label}>{item.label} · {item.value}</span>)}
                {!topTrainingTopics.length ? <span className="tag">暂无数据</span> : null}
              </div>
            </div>
          </article>
          <article className="card">
            <div className="cardBody stack">
              <strong>培训形式</strong>
              <div className="tagList">
                {topTrainingFormats.map((item) => <span className="tag blue" key={item.label}>{item.label} · {item.value}</span>)}
                {!topTrainingFormats.length ? <span className="tag">暂无数据</span> : null}
              </div>
            </div>
          </article>
          <article className="card">
            <div className="cardBody stack">
              <strong>城市分布</strong>
              <div className="tagList">
                {topTrainingCities.map((item) => <span className="tag" key={item.label}>{item.label} · {item.value}</span>)}
                {!topTrainingCities.length ? <span className="tag">暂无数据</span> : null}
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <div>
            <h2>入驻转化漏斗</h2>
            <p>从注册到资料完善、审核、发布需求和发起沟通，判断用户在哪一步流失。</p>
          </div>
        </div>
        <div className="grid six">
          {funnel.map((item, index) => (
            <div className="metric" key={item.label}>
              <strong>{item.value}</strong>
              <span>{index + 1}. {item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <div>
            <h2>Agent 处理指标</h2>
            <p>用于说明平台通过Agent完成需求拆解、撮合推荐和沟通线索生成。</p>
          </div>
        </div>
        <div className="grid four">
          <div className="metric">
            <strong>{data.projects.filter((project) => project.agentBrief).length}</strong>
            <span>Agent拆解需求</span>
          </div>
          <div className="metric">
            <strong>{data.matches.length}</strong>
            <span>Agent推荐记录</span>
          </div>
          <div className="metric">
            <strong>{data.matches.filter((match) => match.risk).length}</strong>
            <span>风险提示生成</span>
          </div>
          <div className="metric">
            <strong>{data.orders.length}</strong>
            <span>合作线索</span>
          </div>
        </div>
      </section>

      <div className="grid two">
        <section className="card">
          <div className="panelTop">
            <div>
              <strong>需求审核</strong>
              <div className="muted">审核通过后需求才会进入公开大厅并开放创作者沟通。</div>
            </div>
            <BriefcaseBusiness size={18} />
          </div>
          <div className="cardBody">
            <div className="grid two compactGrid">
              <div className="field">
                <label htmlFor="project-review-search">搜索需求</label>
                <input id="project-review-search" value={projectQuery} onChange={(event) => setProjectQuery(event.target.value)} placeholder="标题、标签、派单方" />
              </div>
              <div className="field">
                <label htmlFor="project-review-status">状态</label>
                <select id="project-review-status" value={projectStatusFilter} onChange={(event) => setProjectStatusFilter(event.target.value)}>
                  <option value="pending_review">待审核</option>
                  <option value="open">开放中</option>
                  <option value="matching">匹配中</option>
                  <option value="in_progress">进行中</option>
                  <option value="rejected">已驳回</option>
                  <option value="removed">已下架</option>
                  <option value="all">全部</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="project-review-entry">入口类型</label>
                <select id="project-review-entry" value={projectEntryFilter} onChange={(event) => setProjectEntryFilter(event.target.value as "all" | "service" | "training")}>
                  <option value="all">全部入口</option>
                  <option value="service">派单需求</option>
                  <option value="training">培训需求</option>
                </select>
              </div>
            </div>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>需求</th>
                <th>派单方</th>
                <th>意向预算</th>
                <th>资料</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => {
                const buyer = data.buyerProfiles?.find((profile) => profile.userId === project.buyerId);
                return (
                  <tr key={project.id}>
                    <td>
                      <strong>{project.title}</strong>
                      <div className="muted">{categoryLabel(project.category)} · {project.tags?.slice(0, 3).join("、") || "无标签"}</div>
                      <div className="muted">
                        {projectUseCaseLabel(project.useCase)} · {urgencyLabel(project.urgency)} · {(project.deliverableTypes?.length ? project.deliverableTypes.map(deliverableTypeLabel).join("、") : "交付物未填写")}
                      </div>
                      {project.trainingRequirement ? (
                        <div className="muted">
                          培训：{trainingFormatLabel(project.trainingRequirement.format)} · {project.trainingRequirement.audience || "对象未填"} · {project.trainingRequirement.headcount ? `${project.trainingRequirement.headcount}人` : "人数未填"}
                        </div>
                      ) : null}
                      {(project.status === "rejected" || project.status === "removed") && project.rejectedReason ? <div className="muted">{project.rejectedReason}</div> : null}
                    </td>
                    <td>{buyer?.displayName ?? buyer?.companyName ?? data.users.find((user) => user.id === project.buyerId)?.name ?? project.buyerId}</td>
                    <td>{money(project.budget)}</td>
                    <td>
                      <div className="muted">{project.referenceFile || "未上传参考文件"}</div>
                      <div className="muted">{project.qualificationFile || "未上传资质材料"}</div>
                    </td>
                    <td>
                      <span className={project.status === "open" || project.status === "matching" ? "tag green" : project.status === "rejected" || project.status === "removed" ? "tag" : "tag gold"}>
                        {projectStatusLabel(project.status)}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn"
                        disabled={project.status === "open" || project.status === "matching"}
                        onClick={() => {
                          if (!confirmAction(`确定审核通过需求「${project.title}」吗？通过后会公开展示。`)) return;
                          reviewProject(project.id, "open");
                          router.refresh();
                        }}
                        type="button"
                      >
                        审核通过
                      </button>
                      <button
                        className="btn"
                        disabled={project.status === "rejected" || project.status === "removed"}
                        onClick={() => {
                          if (!confirmAction(`确定驳回需求「${project.title}」吗？`)) return;
                          reviewProject(project.id, "rejected", reviewReason);
                          router.refresh();
                        }}
                        type="button"
                      >
                        驳回
                      </button>
                      <button
                        className="btn danger"
                        disabled={project.status === "removed"}
                        onClick={() => {
                          if (!confirmAction(`确定下架需求「${project.title}」吗？下架后不会公开展示。`)) return;
                          reviewProject(project.id, "removed", reviewReason || "平台运营下架。");
                          router.refresh();
                        }}
                        type="button"
                      >
                        下架
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!filteredProjects.length ? (
                <tr>
                  <td colSpan={6}>
                    <div className="muted">暂无符合条件的需求。</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>

        <section className="card">
          <div className="panelTop">
            <div>
              <strong>派单方审核</strong>
              <div className="muted">派单方通过审核后可发布需求和邀请创作者。</div>
            </div>
            <ShieldCheck size={18} />
          </div>
          <div className="cardBody">
            <div className="field">
              <label htmlFor="review-reason">驳回原因模板</label>
              <input id="review-reason" value={reviewReason} onChange={(event) => setReviewReason(event.target.value)} />
            </div>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>主体</th>
                <th>类型</th>
                <th>联系方式</th>
                <th>后台材料</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {(data.buyerProfiles ?? []).map((profile) => {
                  const user = data.users.find((item) => item.id === profile.userId);
                  const suspended = user?.status === "suspended";
                  return (
                    <tr key={profile.id}>
                      <td>{profile.displayName ?? profile.companyName}</td>
                      <td>{verificationTypeLabel(profile.verificationType ?? "other")}</td>
                      <td>{profile.contactEmail || profile.contactPhone || "-"}</td>
                      <td>
                        <div className="muted">{profile.businessLicenseFile || "个人主体可无证件照片"}</div>
                        {profile.qualificationFiles.length ? <div className="muted">{profile.qualificationFiles.join("、")}</div> : null}
                      </td>
                      <td>
                        <span className={profile.verified ? "tag green" : "tag gold"}>{profile.verified ? "已认证" : "待审核"}</span>
                        {suspended ? <span className="tag">账号受限</span> : null}
                        {!profile.verified && profile.rejectedReason ? <div className="muted">{profile.rejectedReason}</div> : null}
                      </td>
                      <td>
                        <button
                          className="btn"
                          disabled={profile.verified}
                          onClick={() => {
                            if (!confirmAction(`确定审核通过「${profile.displayName ?? profile.companyName}」吗？`)) return;
                            verifySubject("buyer", profile.id);
                            router.refresh();
                          }}
                          type="button"
                        >
                          审核通过
                        </button>
                        <button
                          className="btn"
                          disabled={profile.verified}
                          onClick={() => {
                            if (!confirmAction(`确定驳回「${profile.displayName ?? profile.companyName}」吗？`)) return;
                            verifySubject("buyer", profile.id, false, reviewReason);
                            router.refresh();
                          }}
                          type="button"
                        >
                          驳回
                        </button>
                        <button
                          className={suspended ? "btn" : "btn danger"}
                          onClick={() => {
                            if (!confirmAction(suspended ? `确定解除「${profile.displayName ?? profile.companyName}」账号限制吗？` : `确定封禁「${profile.displayName ?? profile.companyName}」对应账号吗？`)) return;
                            suspendUser(profile.userId, !suspended, reviewReason || "主体资料存在风险，账号已被限制。");
                            router.refresh();
                          }}
                          type="button"
                        >
                          {suspended ? "解除封禁" : "封禁"}
                        </button>
                      </td>
                    </tr>
                  );
              })}
            </tbody>
          </table>
        </section>

        <section className="card">
          <div className="panelTop">
            <div>
              <strong>创作者审核</strong>
              <div className="muted">创作者通过审核后可被需求方邀请合作。</div>
            </div>
            <UsersRound size={18} />
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>创作者</th>
                <th>服务品类</th>
                <th>评分</th>
                <th>后台材料</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {data.creators.map((creator) => {
                const user = data.users.find((item) => item.id === creator.userId);
                const suspended = user?.status === "suspended";
                return (
                  <tr key={creator.id}>
                    <td>{creator.name}</td>
                    <td>{creator.categories.map(categoryLabel).join("、")}</td>
                    <td>{creator.rating.toFixed(1)}</td>
                    <td>
                      <div className="muted">{creator.credentialFile || "个人主体可无证件照片"}</div>
                      {creator.qualificationFiles?.length ? <div className="muted">{creator.qualificationFiles.join("、")}</div> : null}
                    </td>
                    <td>
                      <span className={creator.verified ? "tag green" : "tag gold"}>{creator.verified ? "已认证" : "待审核"}</span>
                      {suspended ? <span className="tag">账号受限</span> : null}
                      {!creator.verified && creator.rejectedReason ? <div className="muted">{creator.rejectedReason}</div> : null}
                    </td>
                    <td>
                      <button
                        className="btn"
                        disabled={creator.verified}
                        onClick={() => {
                          if (!confirmAction(`确定审核通过「${creator.name}」吗？`)) return;
                          verifySubject("creator", creator.id);
                          router.refresh();
                        }}
                        type="button"
                      >
                        审核通过
                      </button>
                      <button
                        className="btn"
                        disabled={creator.verified}
                        onClick={() => {
                          if (!confirmAction(`确定驳回「${creator.name}」吗？`)) return;
                          verifySubject("creator", creator.id, false, reviewReason);
                          router.refresh();
                        }}
                        type="button"
                      >
                        驳回
                      </button>
                      <button
                        className={suspended ? "btn" : "btn danger"}
                        onClick={() => {
                          if (!confirmAction(suspended ? `确定解除「${creator.name}」账号限制吗？` : `确定封禁「${creator.name}」对应账号吗？`)) return;
                          suspendUser(creator.userId, !suspended, reviewReason || "接单资料存在风险，账号已被限制。");
                          router.refresh();
                        }}
                        type="button"
                      >
                        {suspended ? "解除封禁" : "封禁"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section className="card">
          <div className="panelTop">
            <div>
              <strong>举报与风控</strong>
              <div className="muted">处理用户提交的违规、虚假信息、骚扰和侵权举报。</div>
            </div>
            <ShieldCheck size={18} />
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>举报对象</th>
                <th>举报人</th>
                <th>原因</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {data.reports.slice(0, 20).map((report) => {
                const reporter = data.users.find((user) => user.id === report.reporterId);
                const href = reportTargetHref(report.targetType, report.targetId);
                return (
                  <tr key={report.id}>
                    <td>
                      {href ? (
                        <Link href={href}>{targetTypeLabel(report.targetType)}：{report.targetId}</Link>
                      ) : (
                        <span>{targetTypeLabel(report.targetType)}：{report.targetId}</span>
                      )}
                    </td>
                    <td>{reporter?.name ?? report.reporterId}</td>
                    <td>{report.reason}</td>
                    <td>
                      <span className={report.status === "resolved" ? "tag green" : report.status === "dismissed" ? "tag" : "tag gold"}>
                        {report.status === "open" ? "待处理" : report.status === "reviewing" ? "处理中" : report.status === "resolved" ? "已处理" : "已驳回"}
                      </span>
                      {report.resolution ? <div className="muted">{report.resolution}</div> : null}
                    </td>
                    <td>
                      <button
                        className="btn"
                        disabled={report.status === "reviewing"}
                        onClick={() => {
                          if (!confirmAction("确定将该举报标记为处理中吗？")) return;
                          resolveReport(report.id, "reviewing", "运营已开始核查。");
                          router.refresh();
                        }}
                        type="button"
                      >
                        标记处理中
                      </button>
                      <button
                        className="btn"
                        disabled={report.status === "resolved"}
                        onClick={() => {
                          if (!confirmAction("确定将该举报标记为已处理吗？")) return;
                          resolveReport(report.id, "resolved", "已处理并记录。");
                          router.refresh();
                        }}
                        type="button"
                      >
                        已处理
                      </button>
                      <button
                        className="btn"
                        disabled={report.status === "dismissed"}
                        onClick={() => {
                          if (!confirmAction("确定驳回该举报吗？")) return;
                          resolveReport(report.id, "dismissed", "未发现违规或证据不足。");
                          router.refresh();
                        }}
                        type="button"
                      >
                        驳回举报
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!data.reports.length ? (
                <tr>
                  <td colSpan={5}>
                    <div className="muted">暂无举报记录。</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>

        <section className="card">
          <div className="panelTop">
            <div>
              <strong>试运营建议</strong>
              <div className="muted">收集用户在试用期间遇到的问题、看不懂的流程和想要的功能。</div>
            </div>
            <ShieldCheck size={18} />
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>建议</th>
                <th>用户</th>
                <th>类型/评分</th>
                <th>页面</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {data.feedback.slice(0, 30).map((feedback) => {
                const user = data.users.find((item) => item.id === feedback.userId);
                return (
                  <tr key={feedback.id}>
                    <td>{feedback.content}</td>
                    <td>{user?.name ?? "匿名用户"}</td>
                    <td>{feedbackCategoryLabel(feedback.category)} · {feedback.rating ? `${feedback.rating}分` : "未评分"}</td>
                    <td>{feedback.page || "-"}</td>
                    <td>
                      <span className={feedback.status === "resolved" ? "tag green" : feedback.status === "dismissed" ? "tag" : "tag gold"}>
                        {feedbackStatusLabel(feedback.status)}
                      </span>
                      {feedback.resolution ? <div className="muted">{feedback.resolution}</div> : null}
                    </td>
                    <td>
                      <button
                        className="btn"
                        disabled={feedback.status === "reviewing"}
                        onClick={() => {
                          if (!confirmAction("确定将该建议标记为处理中吗？")) return;
                          resolveFeedback(feedback.id, "reviewing", "运营已记录并开始评估。");
                          router.refresh();
                        }}
                        type="button"
                      >
                        处理中
                      </button>
                      <button
                        className="btn"
                        disabled={feedback.status === "resolved"}
                        onClick={() => {
                          if (!confirmAction("确定将该建议标记为已处理吗？")) return;
                          resolveFeedback(feedback.id, "resolved", "已处理或纳入产品迭代。");
                          router.refresh();
                        }}
                        type="button"
                      >
                        已处理
                      </button>
                      <button
                        className="btn"
                        disabled={feedback.status === "dismissed"}
                        onClick={() => {
                          if (!confirmAction("确定暂不处理该建议吗？")) return;
                          resolveFeedback(feedback.id, "dismissed", "暂不处理，已保留记录。");
                          router.refresh();
                        }}
                        type="button"
                      >
                        暂不处理
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!data.feedback.length ? (
                <tr>
                  <td colSpan={6}>
                    <div className="muted">暂无试用建议。</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>
      </div>

      <div className="grid two">
        <section className="card">
          <div className="panelTop">
            <div>
              <strong>合作线索管理</strong>
              <div className="muted">展示最近20条合作线索，完整数据可导出运营报表。</div>
            </div>
            <ShieldCheck size={18} />
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>线索</th>
                <th>需求</th>
                <th>意向预算</th>
                <th>状态</th>
                <th>结果原因</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => {
                const project = data.projects.find((item) => item.id === order.projectId);
                return (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{project?.title ?? "需求"}</td>
                    <td>{money(order.amount)}</td>
                    <td>
                      <span className="tag blue">{orderStatusLabel(order.status)}</span>
                    </td>
                    <td>{order.resultReason ? orderResultReasonLabel(order.resultReason) : "未填写"}</td>
                  </tr>
                );
              })}
              {!recentOrders.length ? (
                <tr>
                  <td colSpan={5}>
                    <div className="muted">暂无合作线索。</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>
      </div>

      <section className="section">
        <div className="sectionHeader">
          <div>
            <h2>最近活跃记录</h2>
            <p>展示最近50条关键行为，完整数据可导出运营报表。</p>
          </div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>用户</th>
              <th>角色</th>
              <th>事件</th>
              <th>对象</th>
              <th>备注</th>
              <th>时间</th>
            </tr>
          </thead>
          <tbody>
            {recentActivity.map((event) => {
              const user = data.users.find((item) => item.id === event.userId);
              return (
                <tr key={event.id}>
                  <td>{user?.name ?? event.userId}</td>
                  <td>{roleLabel(event.role)}</td>
                  <td>{activityEventLabel(event.eventType)}</td>
                  <td>{event.targetType ? `${targetTypeLabel(event.targetType)}：${event.targetId}` : "-"}</td>
                  <td>{event.note || "-"}</td>
                  <td>{new Date(event.createdAt).toLocaleString("zh-CN")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </main>
  );
}
