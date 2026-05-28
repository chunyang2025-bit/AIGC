"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Banknote, BriefcaseBusiness, CheckCircle2, FileText, FileUp, Inbox, Search, Star, UserRound } from "lucide-react";
import { categoryLabel, money, orderStatusLabel } from "@/lib/format";
import { isImageValue } from "@/lib/file-upload";
import { loadMarketplaceData } from "@/lib/store";
import { isApproved, readAuthSession } from "@/lib/auth";

export default function ProviderPortalPage() {
  const router = useRouter();
  const data = loadMarketplaceData();
  const session = readAuthSession();
  const creator = data.creators.find((item) => item.userId === session?.userId);
  useEffect(() => {
    if (!session || session.role !== "creator") {
      router.push("/login?role=accept");
      return;
    }

    if (!creator) {
      router.push("/provider/profile");
    }
  }, [creator, router, session]);

  if (!session || session.role !== "creator" || !creator) {
    return null;
  }

  const approved = creator?.verified ?? isApproved(session);
  const leads = data.orders.filter((order) => order.creatorId === creator.id);
  const invitations = data.matches
    .filter((match) => match.creatorId === creator.id)
    .map((match) => ({
      match,
      project: data.projects.find((project) => project.id === match.projectId)
    }))
    .filter((item) => item.project);
  const intentAmount = leads.reduce((sum, order) => sum + order.amount, 0);
  const onboardingTasks = [
    {
      label: "完善展示页",
      done: Boolean(creator.bio && creator.title && creator.contactEmail),
      href: "/provider/profile"
    },
    {
      label: "补充代表作",
      done: creator.portfolio.length > 0,
      href: "/provider/profile"
    },
    {
      label: "浏览公开需求",
      done: true,
      href: "/projects"
    },
    {
      label: "获得发起沟通权限",
      done: approved,
      href: "/provider/profile"
    }
  ];

  return (
    <main className="main">
      <section className="portalHero providerHero">
        <div className="stack">
          <span className="eyebrow">
            <UserRound size={15} /> 需求接受方入口
          </span>
          <div>
            <h1>需求接受方后台</h1>
            <p>适合创作者、工作室和接单服务商查看邀约、表达合作意向和沉淀沟通线索。</p>
          </div>
          <div className="toolbarGroup">
            <Link className="btn primary" href="/projects">
              <BriefcaseBusiness size={16} /> 浏览可接需求
            </Link>
            <Link className="btn" href="/buyer/profile">
              <BriefcaseBusiness size={16} /> 开通派单能力
            </Link>
            <Link className="btn" href="/provider/profile">
              <Star size={16} /> 编辑我的展示页
            </Link>
          </div>
        </div>
        <div className="providerProfile card">
          <div className="cardBody stack">
            <div className="row">
              <span className="avatar">
                {isImageValue(creator.avatarUrl) ? <img alt={creator.name} src={creator.avatarUrl} /> : (creator.avatarUrl || creator.name).slice(0, 1)}
              </span>
              <div>
                <strong>{creator.name}</strong>
                <div className="muted">{creator.title}</div>
              </div>
            </div>
            <div className="tagList">
              {creator.categories.map((category) => (
                <span className="tag blue" key={category}>
                  {categoryLabel(category)}
                </span>
              ))}
            </div>
            <div className="spaceBetween">
              <span className="tag green">
                <CheckCircle2 size={13} /> 已认证
              </span>
              <span className="muted">评分 {creator.rating.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </section>

      {!approved ? (
        <section className="notice">
          你已完成基础入驻，可以浏览公开需求并继续完善展示页。审核通过后才能向派单方发起沟通。
        </section>
      ) : null}

      <section className="section">
        <div className="sectionHeader">
          <div>
            <h2>接单方新手任务</h2>
            <p>这些任务不限制浏览，但完成后更容易被派单方看到并邀请沟通。</p>
          </div>
        </div>
        <div className="grid four">
          {onboardingTasks.map((task, index) => (
            <Link className="metric" href={task.href} key={task.label}>
              {index === 0 ? <UserRound size={18} /> : index === 1 ? <FileText size={18} /> : index === 2 ? <Search size={18} /> : <CheckCircle2 size={18} />}
              <strong>{task.done ? "已完成" : "待完成"}</strong>
              <span>{task.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="grid four">
          <div className="metric">
            <strong>{invitations.length}</strong>
            <span>收到匹配邀约</span>
          </div>
          <div className="metric">
            <strong>{leads.length}</strong>
            <span>合作线索</span>
          </div>
          <div className="metric">
            <strong>{money(intentAmount)}</strong>
            <span>意向金额</span>
          </div>
          <div className="metric">
            <strong>{creator.completedProjects}</strong>
            <span>累计完成项目</span>
          </div>
        </div>
      </section>

      <div className="grid two">
        <section className="card">
          <div className="panelTop">
            <div>
              <strong>匹配邀约</strong>
              <div className="muted">Matching Agent 推荐给你的需求。</div>
            </div>
            <Inbox size={18} />
          </div>
          <div className="cardBody stack">
            {invitations.map(({ match, project }) => (
              <Link className="card" href={`/projects/${project?.id}`} key={match.id}>
                <div className="cardBody stack">
                  <div className="spaceBetween">
                    <strong>{project?.title}</strong>
                    <span className="tag blue">{match.score}% 匹配</span>
                  </div>
                  <p className="muted" style={{ margin: 0 }}>{match.reason}</p>
                  {match.nextStep ? <div className="notice">{match.nextStep}</div> : null}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="panelTop">
            <div>
              <strong>沟通线索</strong>
              <div className="muted">需求接受方查看派单邀约，并决定是否继续沟通。</div>
            </div>
            <FileUp size={18} />
          </div>
          <div className="cardBody stack">
            {leads.map((order) => {
              const project = data.projects.find((item) => item.id === order.projectId);
              return (
                <Link className="card" href={`/orders/${order.id}`} key={order.id}>
                  <div className="cardBody stack">
                    <div className="spaceBetween">
                      <strong>{project?.title ?? "需求"}</strong>
                      <span className="tag green">{orderStatusLabel(order.status)}</span>
                    </div>
                    <div className="muted">{money(order.amount)}</div>
                  </div>
                </Link>
              );
            })}
            <div className="row muted">
              <Banknote size={16} /> 当前平台不处理收款、结算和交付，具体合作由双方自行协商。
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
