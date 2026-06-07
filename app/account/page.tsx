"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, CheckCircle2, Clock, FileBadge2, GraduationCap, MessageSquare, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { compactDate, money, orderStatusLabel, projectStatusLabel } from "@/lib/format";
import { loadMarketplaceData } from "@/lib/store";
import { readAuthSession } from "@/lib/auth";
import { notificationsForUser, onboardingCompleteness } from "@/lib/growth";
import { FirstActionPanel } from "@/components/FirstActionPanel";

function statusText(hasProfile: boolean, verified?: boolean) {
  if (!hasProfile) return "未开通";
  return verified ? "已通过审核" : "未认证/可试用";
}

function statusClass(hasProfile: boolean, verified?: boolean) {
  if (!hasProfile) return "tag";
  return verified ? "tag green" : "tag gold";
}

export default function AccountPage() {
  const router = useRouter();
  const session = readAuthSession();
  const data = loadMarketplaceData();
  const buyerProfile = data.buyerProfiles?.find((profile) => profile.userId === session?.userId);
  const creatorProfile = data.creators.find((creator) => creator.userId === session?.userId);
  const hasTrainingCapability = Boolean(creatorProfile?.categories.includes("AIGC Training"));

  useEffect(() => {
    if (!session) {
      router.push("/login");
    }
  }, [router, session]);

  if (!session) return null;

  const subjectName = buyerProfile?.displayName ?? creatorProfile?.displayName ?? session.name ?? session.email;
  const hasSubjectProfile = Boolean(buyerProfile || creatorProfile);
  const subjectVerified = Boolean(buyerProfile?.verified || creatorProfile?.verified);
  const pendingReview = hasSubjectProfile && !subjectVerified;
  const myProjects = data.projects.filter((project) => project.buyerId === session.userId);
  const myBuyerLeads = data.orders.filter((order) => order.buyerId === session.userId);
  const myCreatorLeads = creatorProfile ? data.orders.filter((order) => order.creatorId === creatorProfile.id) : [];
  const projectDemands = myProjects.filter((project) => project.category !== "AIGC Training");
  const trainingDemands = myProjects.filter((project) => project.category === "AIGC Training");
  const activation = onboardingCompleteness({
    hasProfile: hasSubjectProfile,
    submittedReview: hasSubjectProfile,
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
  const firstAction = !hasSubjectProfile
    ? {
        title: "先完成主体主页，进入审核队列",
        primaryLabel: "创建主体主页",
        primaryHref: "/account/profile",
        secondaryLabel: "先看公开市场",
        secondaryHref: "/projects"
      }
    : !subjectVerified
      ? {
          title: "未认证也可以先试用完整流程",
          primaryLabel: buyerProfile ? "进入需求方后台" : "进入服务方后台",
          primaryHref: buyerProfile ? "/buyer" : "/provider",
          secondaryLabel: "查看认证状态",
          secondaryHref: "/account/verification"
        }
      : buyerProfile && !hasAnyDemand
        ? {
            title: "发布第一个需求，让系统开始匹配",
            primaryLabel: "发布项目需求",
            primaryHref: "/post-project",
            secondaryLabel: "发布培训需求",
            secondaryHref: "/post-project?category=AIGC%20Training"
          }
        : creatorProfile && !hasAnyProviderPage
          ? {
              title: "生成服务主页，获得展示和匹配入口",
              primaryLabel: "生成服务主页",
              primaryHref: "/provider/profile",
              secondaryLabel: "生成培训主页",
              secondaryHref: "/provider/profile?category=AIGC%20Training"
            }
          : !hasAnyLead
            ? {
                title: "推进第一条沟通线索",
                primaryLabel: buyerProfile ? "进入需求方后台" : "进入服务方后台",
                primaryHref: buyerProfile ? "/buyer" : "/provider",
                secondaryLabel: buyerProfile ? "查看服务方大厅" : "查看公开需求",
                secondaryHref: buyerProfile ? "/creators" : "/projects"
              }
            : {
                title: "跟进已有线索，沉淀试运营反馈",
                primaryLabel: buyerProfile ? "查看我的派单" : "查看我的接单",
                primaryHref: buyerProfile ? "/buyer" : "/provider",
                secondaryLabel: "提交试用建议",
                secondaryHref: "/account"
              };

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
            <span className={subjectVerified ? "tag green" : pendingReview ? "tag gold" : "tag"}>
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
          {pendingReview ? (
            <section className="notice">
              <Clock size={15} /> 资料已提交平台审核。预计1-2个工作日内完成；认证标准、缺项和补充入口可在认证中心查看。
              <Link className="btn" href="/account/verification">查看认证中心</Link>
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
            <em>保存主页即进入待审核；补齐联系方式、主体类型和资质材料后由运营后台人工通过。</em>
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
            <span className={statusClass(hasSubjectProfile, subjectVerified)}>
              {statusText(hasSubjectProfile, subjectVerified)}
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
              <span className={statusClass(Boolean(buyerProfile), buyerProfile?.verified)}>
                {statusText(Boolean(buyerProfile), buyerProfile?.verified)}
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
              <span className={statusClass(Boolean(creatorProfile), creatorProfile?.verified)}>
                {statusText(Boolean(creatorProfile), creatorProfile?.verified)}
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

      <div className="grid two">
        <section className="card">
          <div className="panelTop">
            <div>
              <strong>我的派单</strong>
            </div>
            <BriefcaseBusiness size={18} />
          </div>
          <div className="cardBody stack">
            <div className="grid two compactGrid">
              <div className="metric">
                <strong>{myProjects.length}</strong>
                <span>已发布需求</span>
              </div>
              <div className="metric">
                <strong>{myBuyerLeads.length}</strong>
                <span>沟通线索</span>
              </div>
            </div>
            {myProjects.slice(0, 3).map((project) => (
              <Link className="miniLead" href={`/buyer/projects/${project.id}`} key={project.id}>
                <span>{project.title}</span>
                <em>{projectStatusLabel(project.status)} · {money(project.budget)} · {compactDate(project.createdAt)}</em>
              </Link>
            ))}
            {myProjects.length === 0 ? <div className="muted">试运营期间资料填好后即可发布第一个需求。</div> : null}
            <div className="toolbarGroup">
              <Link className="btn primary" href={buyerProfile ? "/buyer" : "/account/capabilities?intent=dispatch"}>
                进入我的派单
              </Link>
              <Link className="btn" href={buyerProfile ? "/post-project" : "/account/profile"}>
                {buyerProfile ? "发布需求" : "完善派单认证"}
              </Link>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="panelTop">
            <div>
              <strong>我的接单</strong>
            </div>
            <MessageSquare size={18} />
          </div>
          <div className="cardBody stack">
            <div className="grid two compactGrid">
              <div className="metric">
                <strong>{creatorProfile ? 1 : 0}</strong>
                <span>展示页</span>
              </div>
              <div className="metric">
                <strong>{myCreatorLeads.length}</strong>
                <span>沟通线索</span>
              </div>
            </div>
            {myCreatorLeads.slice(0, 3).map((lead) => {
              const project = data.projects.find((item) => item.id === lead.projectId);
              return (
                <Link className="miniLead" href={`/orders/${lead.id}`} key={lead.id}>
                  <span>{project?.title ?? "需求沟通"}</span>
                  <em>{orderStatusLabel(lead.status)} · {money(lead.amount)} · {compactDate(lead.createdAt)}</em>
                </Link>
              );
            })}
            {creatorProfile ? (
              <Link className="miniLead" href={`/creators/${creatorProfile.id}`}>
                <span>{creatorProfile.displayName ?? creatorProfile.name}</span>
                <em>{creatorProfile.verified ? "已认证展示页" : "展示页待审核"}</em>
              </Link>
            ) : (
              <div className="muted">启用服务方身份后，这里会显示你的展示页和沟通线索。</div>
            )}
            <div className="toolbarGroup">
              <Link className="btn primary" href={creatorProfile ? "/provider" : "/account/capabilities?intent=service"}>
                进入我的接单
              </Link>
              <Link className="btn" href="/projects">
                浏览需求
              </Link>
            </div>
          </div>
        </section>
      </div>

      <section className="notice">
        <Clock size={15} /> 试运营期间不强制审核。资料填好后可先试用发布、匹配和沟通；未审核、未认证会保留风险提示，正式合作前建议完成认证。
      </section>
    </main>
  );
}
