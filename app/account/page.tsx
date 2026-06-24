"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, CheckCircle2, Clock, FileBadge2, GraduationCap, MessageSquare, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { hasActiveReviewSubmission } from "@/lib/review-status";
import { loadMarketplaceData } from "@/lib/store";
import { readAuthSession } from "@/lib/auth";
import { getLandingAction, getReviewStage, notificationsForUser, onboardingCompleteness, type ReviewStage } from "@/lib/growth";
import { FirstActionPanel } from "@/components/FirstActionPanel";
import { ShortcutGrid } from "@/components/ShortcutGrid";
import { BuyerProfile, CreatorProfile, Order, Project } from "@/lib/types";

function statusText(stage: ReviewStage) {
  if (stage === "approved") return "已认证";
  if (stage === "submitted") return "待运营审核";
  if (stage === "saved") return "资料已保存";
  if (stage === "rejected") return "需补充资料";
  return "未开通";
}

function statusClass(stage: ReviewStage) {
  if (stage === "approved") return "tag green";
  if (stage === "saved") return "tag blue";
  if (stage === "submitted" || stage === "rejected") return "tag gold";
  return "tag";
}

export default function AccountPage() {
  const router = useRouter();
  const [session] = useState(() => readAuthSession());
  const [data, setData] = useState(() => loadMarketplaceData());
  const [buyerProfile, setBuyerProfile] = useState<BuyerProfile | null>(() => data.buyerProfiles?.find((profile) => profile.userId === session?.userId) ?? null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(() => data.creators.find((creator) => creator.userId === session?.userId) ?? null);
  const [myProjects, setMyProjects] = useState<Project[]>(() => data.projects.filter((project) => project.buyerId === session?.userId));
  const [myBuyerLeads, setMyBuyerLeads] = useState<Order[]>(() => data.orders.filter((order) => order.buyerId === session?.userId));
  const [myCreatorLeads, setMyCreatorLeads] = useState<Order[]>(() => {
    const currentCreator = data.creators.find((creator) => creator.userId === session?.userId);
    return currentCreator ? data.orders.filter((order) => order.creatorId === currentCreator.id) : [];
  });
  const hasTrainingCapability = Boolean(creatorProfile?.categories.includes("AIGC Training"));

  useEffect(() => {
    if (!session) {
      router.push("/login");
    }
  }, [router, session]);

  useEffect(() => {
    if (!session?.accessToken) return;

    let active = true;

    fetch("/api/account/state", {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${session.accessToken}`
      }
    })
      .then((response) => response.json().catch(() => null))
      .then((payload) => {
        if (!active || !payload?.ok || !payload.data) return;
        const next = payload.data as {
          buyerProfile: BuyerProfile | null;
          creatorProfile: CreatorProfile | null;
          projects: Project[];
          buyerOrders: Order[];
          creatorOrders: Order[];
          notificationsData: ReturnType<typeof loadMarketplaceData>;
        };
        setBuyerProfile(next.buyerProfile);
        setCreatorProfile(next.creatorProfile);
        setMyProjects(next.projects);
        setMyBuyerLeads(next.buyerOrders);
        setMyCreatorLeads(next.creatorOrders);
        setData(next.notificationsData);
      })
      .catch(() => null);

    return () => {
      active = false;
    };
  }, [session?.accessToken]);

  if (!session) return null;

  const subjectName = buyerProfile?.displayName ?? creatorProfile?.displayName ?? session.name ?? session.email;
  const hasSubjectProfile = Boolean(buyerProfile || creatorProfile);
  const subjectVerified = Boolean(buyerProfile?.verified || creatorProfile?.verified);
  const buyerSubmitted = hasActiveReviewSubmission(data, session.userId, "buyer_profile");
  const creatorSubmitted = hasActiveReviewSubmission(data, session.userId, "creator");
  const subjectSubmitted = buyerSubmitted || creatorSubmitted;
  const buyerHasDraft = Boolean(buyerProfile?.reviewDraft);
  const creatorHasDraft = Boolean(creatorProfile?.reviewDraft);
  const subjectHasDraft = buyerHasDraft || creatorHasDraft;
  const subjectRejectedReason = buyerProfile?.reviewDraftRejectedReason || creatorProfile?.reviewDraftRejectedReason || buyerProfile?.rejectedReason || creatorProfile?.rejectedReason;
  const subjectStage = getReviewStage({
    hasProfile: hasSubjectProfile,
    hasDraft: subjectHasDraft,
    submitted: subjectSubmitted,
    verified: subjectVerified,
    rejectedReason: subjectRejectedReason
  });
  const buyerStage = getReviewStage({
    hasProfile: Boolean(buyerProfile),
    hasDraft: buyerHasDraft,
    submitted: buyerSubmitted,
    verified: Boolean(buyerProfile?.verified),
    rejectedReason: buyerProfile?.reviewDraftRejectedReason || buyerProfile?.rejectedReason
  });
  const creatorStage = getReviewStage({
    hasProfile: Boolean(creatorProfile),
    hasDraft: creatorHasDraft,
    submitted: creatorSubmitted,
    verified: Boolean(creatorProfile?.verified),
    rejectedReason: creatorProfile?.reviewDraftRejectedReason || creatorProfile?.rejectedReason
  });
  const projectDemands = myProjects.filter((project) => project.category !== "AIGC Training");
  const trainingDemands = myProjects.filter((project) => project.category === "AIGC Training");
  const activation = onboardingCompleteness({
    hasProfile: hasSubjectProfile,
    submittedReview: subjectSubmitted || subjectVerified,
    verified: subjectVerified,
    hasCapability: Boolean(buyerProfile || creatorProfile),
    hasLead: myBuyerLeads.length + myCreatorLeads.length > 0
  });
  const activationSteps = activation.items.map((item, index) => ({
    ...item,
    href: index === 1 ? "/account/profile" : index === 2 || index === 3 ? "/account/verification" : index === 4 ? "/account/capabilities?intent=dispatch" : index === 5 ? buyerProfile ? "/buyer" : "/provider" : "/account"
  }));
  const notifications = notificationsForUser(data, session.userId);
  const hasAnyDemand = myProjects.length > 0;
  const hasAnyProviderPage = Boolean(creatorProfile?.bio && creatorProfile?.title && (creatorProfile?.servicePackages?.length || creatorProfile?.portfolio.length));
  const hasAnyLead = myBuyerLeads.length + myCreatorLeads.length > 0;
  const firstAction = getLandingAction({
    hasProfile: hasSubjectProfile,
    stage: subjectStage,
    isBuyer: Boolean(buyerProfile),
    hasAnyDemand,
    hasAnyProviderPage,
    hasAnyLead
  });

  return (
    <main className="main">
      <section className="portalHero">
        <div className="stack">
          <span className="eyebrow">
            <ShieldCheck size={15} /> 主体总控台
          </span>
          <div>
            <h1>{subjectName}</h1>
          </div>
        </div>
        <div className="portalStats">
          <div className="metric">
            <strong>{hasSubjectProfile ? 1 : 0}</strong>
            <span>主体主页</span>
          </div>
          <div className="metric">
            <strong>{subjectVerified ? 1 : 0}</strong>
            <span>主体认证</span>
          </div>
          <div className="metric">
            <strong>{[buyerProfile, creatorProfile, buyerProfile, hasTrainingCapability].filter(Boolean).length}</strong>
            <span>已启用业务</span>
          </div>
        </div>
      </section>

      <FirstActionPanel
        eyebrow="下一步只做这件事"
        title={firstAction.title}
        primaryLabel={firstAction.primaryLabel}
        primaryHref={firstAction.primaryHref}
        secondaryLabel={firstAction.secondaryLabel}
        secondaryHref={firstAction.secondaryHref}
        steps={[
          { label: "主体资料", done: hasSubjectProfile },
          { label: "平台审核", done: subjectVerified },
          { label: "需求/主页", done: hasAnyDemand || hasAnyProviderPage },
          { label: "首条线索", done: hasAnyLead }
        ]}
      />

      <section className="card">
        <div className="cardBody stack">
          <div className="spaceBetween">
            <div>
              <h2 style={{ margin: 0 }}>入驻进度</h2>
            </div>
            <span className={statusClass(subjectStage)}>
              完整度 {activation.score}%
            </span>
          </div>
          <div className="grid six">
            {activationSteps.map((step, index) => (
              <Link className="metric" href={step.href} key={step.label}>
                {index === 0 ? <CheckCircle2 size={18} /> : index === 1 ? <FileBadge2 size={18} /> : index === 3 ? <ShieldCheck size={18} /> : <UserRound size={18} />}
                <strong>{step.done ? "已完成" : `第${index + 1}步`}</strong>
                <span>{step.label}</span>
              </Link>
            ))}
          </div>
          {subjectStage === "submitted" ? (
            <section className="notice">
              <Clock size={15} /> 认证资料已提交，正在等待运营人工核验。预计1-2个工作日内完成；认证标准、缺项和补充入口可在认证中心查看。
              <Link className="btn" href="/account/verification">查看认证中心</Link>
            </section>
          ) : null}
          {subjectStage === "saved" || subjectStage === "rejected" ? (
            <section className="notice">
              <FileBadge2 size={15} /> 主页资料已经保存，但还没有进入审核队列。下一步请到认证中心点击“提交认证审核”。
              <Link className="btn" href="/account/verification">进入认证中心</Link>
            </section>
          ) : null}
          {!hasSubjectProfile ? (
            <section className="notice">
              <CheckCircle2 size={15} /> 建议先创建主体主页。主页完成后，根据当前目标选择一条业务路径继续。
            </section>
          ) : null}
        </div>
      </section>

      <section className="card">
        <div className="cardBody stack">
          <div className="spaceBetween">
            <div>
              <h2 style={{ margin: 0 }}>站内通知</h2>
            </div>
            <span className="tag blue">{notifications.length + 2} 条</span>
          </div>
          <Link className="miniLead" href="/account/capabilities?intent=dispatch">
            <span>新手教程：主体主页和四个业务身份</span>
            <em>先维护主体主页，再按当前目标启用派单、找培训、接单或提供培训。</em>
          </Link>
          <Link className="miniLead" href="/account/verification">
            <span>认证教程：提交方式、审核入口和通过标准</span>
            <em>保存主页后进入认证中心；点击提交认证审核后，资料才会进入运营后台待审核队列。</em>
          </Link>
          {notifications.length ? notifications.map((item) => (
            <Link className="miniLead" href={item.href} key={item.id}>
              <span>{item.title}</span>
              <em>{item.body}</em>
            </Link>
          )) : null}
        </div>
      </section>

      <section className="card">
        <div className="cardBody stack">
          <div className="spaceBetween">
            <ShieldCheck size={22} />
            <span className={statusClass(subjectStage)}>
              {statusText(subjectStage)}
            </span>
          </div>
          <div>
            <h2 style={{ margin: 0 }}>主体主页</h2>
          </div>
          <div className="toolbarGroup">
            <Link className="btn primary" href="/account/profile">
              {hasSubjectProfile ? "查看/编辑主体主页" : "创建主体主页"}
            </Link>
            <Link className="btn" href="/account/verification">
              认证中心
            </Link>
            <Link className="btn" href="/account/capabilities?intent=dispatch">
              管理业务身份
            </Link>
          </div>
        </div>
      </section>

      <div className="grid two">
        <section className="card">
          <div className="cardBody stack">
            <div className="spaceBetween">
              <BriefcaseBusiness size={22} />
              <span className={statusClass(buyerStage)}>
                {statusText(buyerStage)}
              </span>
            </div>
            <div>
              <h2 style={{ margin: 0 }}>需求方身份</h2>
            </div>
            <div className="grid two compactGrid">
              <div className="metric">
                <strong>{projectDemands.length}</strong>
                <span>项目需求</span>
              </div>
              <div className="metric">
                <strong>{trainingDemands.length}</strong>
                <span>培训需求</span>
              </div>
            </div>
            <div className="toolbarGroup">
              <Link className="btn primary" href={buyerProfile ? "/buyer" : "/account/capabilities?intent=dispatch"}>
                {buyerProfile ? "进入需求方后台" : "先完善主体主页"}
              </Link>
              <Link className="btn" href={buyerProfile ? "/post-project" : "/account/profile"}>
                {buyerProfile ? "发布项目需求" : "补充主体资料"}
              </Link>
              <Link className="btn" href={buyerProfile ? "/post-project?category=AIGC%20Training" : "/account/capabilities?intent=training_demand"}>
                {buyerProfile ? "发布培训需求" : "准备找培训"}
              </Link>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="cardBody stack">
            <div className="spaceBetween">
              <UserRound size={22} />
              <span className={statusClass(creatorStage)}>
                {statusText(creatorStage)}
              </span>
            </div>
            <div>
              <h2 style={{ margin: 0 }}>服务方身份</h2>
            </div>
            <div className="grid two compactGrid">
              <div className="metric">
                <strong>{creatorProfile ? 1 : 0}</strong>
                <span>服务主页</span>
              </div>
              <div className="metric">
                <strong>{hasTrainingCapability ? 1 : 0}</strong>
                <span>培训主页</span>
              </div>
            </div>
            <div className="toolbarGroup">
              <Link className="btn primary" href={creatorProfile ? "/provider" : "/account/capabilities?intent=service"}>
                {creatorProfile ? "进入服务方后台" : "先完善主体主页"}
              </Link>
              <Link className="btn" href="/provider/profile">
                完善接单主页
              </Link>
              <Link className="btn" href="/provider/profile?category=AIGC%20Training">
                完善培训主页
              </Link>
            </div>
          </div>
        </section>
      </div>

      <ShortcutGrid
        title="我的常用入口"
        description="把你最常用的动作放前面，减少在后台之间来回跳的成本。"
        items={[
          {
            title: "我的派单",
            href: "/buyer",
            text: `${myProjects.length} 个需求 · ${myBuyerLeads.length} 条沟通线索`,
            icon: BriefcaseBusiness
          },
          {
            title: "发布需求",
            href: buyerProfile ? "/post-project" : "/account/profile",
            text: buyerProfile ? "继续发布项目或培训需求。" : "先完善派单认证。",
            icon: UserRound
          },
          {
            title: "我的接单",
            href: "/provider",
            text: `${creatorProfile ? 1 : 0} 个展示页 · ${myCreatorLeads.length} 条沟通线索`,
            icon: MessageSquare
          },
          {
            title: "浏览需求",
            href: "/projects",
            text: "回到公开市场继续筛选机会。",
            icon: Clock
          }
        ]}
      />

      <section className="notice">
        <Clock size={15} /> 试运营期间不强制审核。资料保存后可先试用发布、匹配和沟通；正式合作前建议提交认证审核并等待通过。
      </section>
    </main>
  );
}
