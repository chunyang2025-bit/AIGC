"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bot, BriefcaseBusiness, CheckCircle2, Clock, Plus, Search, UsersRound } from "lucide-react";
import { compactDate, money, orderStatusLabel, projectStatusLabel } from "@/lib/format";
import { loadMarketplaceData } from "@/lib/store";
import { isApproved, readAuthSession } from "@/lib/auth";
import { buyerActionItems, buyerProjectNextStep } from "@/lib/opportunities";
import { FirstActionPanel } from "@/components/FirstActionPanel";

export default function BuyerPortalPage() {
  const router = useRouter();
  const data = loadMarketplaceData();
  const session = readAuthSession();
  const buyerId = session?.userId ?? "";
  const buyerProfile = data.buyerProfiles?.find((profile) => profile.userId === buyerId);
  const approved = buyerProfile?.verified ?? isApproved(session);
  const projects = data.projects.filter((project) => project.buyerId === buyerId);
  const leads = data.orders.filter((order) => order.buyerId === buyerId);
  const activeLeads = leads.filter((order) => order.status !== "approved");
  const agentProjects = projects.filter((project) => project.agentBrief);
  const actionItems = buyerActionItems(data, buyerId, approved);
  const openProject = projects.find((project) => project.status === "open" || project.status === "matching");
  const hasTrainingDemand = projects.some((project) => project.category === "AIGC Training");
  const firstAction = !approved
    ? {
        title: "先让主体审核通过，才能正式发布和邀请",
        description: "审核期间可以继续完善主体资料，也可以先浏览服务方大厅，记下想沟通的候选方。",
        primaryLabel: "完善主体资料",
        primaryHref: "/account/profile",
        secondaryLabel: "查看服务方大厅",
        secondaryHref: "/creators"
      }
    : !projects.length
      ? {
          title: "发布第一个需求，让平台开始推荐服务方",
          description: "用 Brief Agent 把一句话想法变成可审核、可匹配的需求。项目交付和培训需求都可以发布。",
          primaryLabel: "发布项目需求",
          primaryHref: "/post-project",
          secondaryLabel: "发布培训需求",
          secondaryHref: "/post-project?category=AIGC%20Training"
        }
      : !leads.length
        ? {
            title: "邀请 2-3 位候选服务方，产生第一条沟通线索",
            description: openProject ? `优先处理「${openProject.title}」，从匹配推荐或服务方大厅发起邀请。` : "需求审核通过后，立即邀请候选服务方沟通。",
            primaryLabel: openProject ? "查看匹配推荐" : "查看我的需求",
            primaryHref: openProject ? `/buyer/projects/${openProject.id}` : "/buyer",
            secondaryLabel: "查看服务方大厅",
            secondaryHref: "/creators"
          }
        : {
            title: "跟进沟通线索，确认是否适合继续合作",
            description: "把线索状态更新清楚，能帮助运营判断平台是否真的完成撮合。",
            primaryLabel: "查看合作线索",
            primaryHref: `/orders/${leads[0].id}`,
            secondaryLabel: "继续发布新需求",
            secondaryHref: "/post-project"
          };

  useEffect(() => {
    if (!session) {
      router.push("/login?role=dispatch");
      return;
    }

    if (!buyerProfile) {
      router.push("/account/profile");
    }
  }, [buyerProfile, router, session]);

  if (!session || !buyerProfile) {
    return null;
  }

  return (
    <main className="main">
      <section className="portalHero">
        <div className="stack">
          <span className="eyebrow">
            <BriefcaseBusiness size={15} /> 我要派单
          </span>
          <div>
            <h1>我的派单后台</h1>
            <p>免费发布内容需求，启动 Brief Agent，审核通过后查看匹配结果，并邀请创作者建立沟通线索。</p>
          </div>
          <div className="toolbarGroup">
            <Link className={approved ? "btn primary" : "btn"} href={approved ? "/post-project" : "/account/profile"}>
              <Plus size={16} /> 启动需求 Agent
            </Link>
            <Link className="btn" href="/account/capabilities?intent=service">
              <UsersRound size={16} /> 添加服务方身份
            </Link>
            <Link className="btn" href="/creators">
              <Search size={16} /> 创作者信息大厅
            </Link>
          </div>
        </div>
        <div className="portalStats">
          <div className="metric">
            <strong>{projects.length}</strong>
            <span>我的需求</span>
          </div>
          <div className="metric">
            <strong>{activeLeads.length}</strong>
            <span>沟通中线索</span>
          </div>
          <div className="metric">
            <strong>{agentProjects.length}</strong>
            <span>Agent拆解需求</span>
          </div>
        </div>
      </section>

      {!approved ? (
        <section className="notice">
          你的主体资料正在审核中。审核通过后才能正式发布需求和主动邀请创作者；审核期间可以继续完善主页、浏览创作者信息大厅。
        </section>
      ) : null}

      <FirstActionPanel
        eyebrow="派单方下一步"
        title={firstAction.title}
        description={firstAction.description}
        primaryLabel={firstAction.primaryLabel}
        primaryHref={firstAction.primaryHref}
        secondaryLabel={firstAction.secondaryLabel}
        secondaryHref={firstAction.secondaryHref}
        steps={[
          { label: "主体审核", done: approved },
          { label: "发布需求", done: Boolean(projects.length) },
          { label: "培训需求", done: hasTrainingDemand },
          { label: "首条线索", done: Boolean(leads.length) }
        ]}
      />

      <section className="section">
        <div className="sectionHeader">
          <div>
            <h2>今日待办</h2>
            <p>把派单方最该做的下一步放在这里，减少从注册到邀约之间的流失。</p>
          </div>
        </div>
        <div className="grid four">
          {actionItems.map((item) => (
            <article className="card" key={item.label}>
              <div className="cardBody stack">
                <div className="spaceBetween">
                  <strong>{item.label}</strong>
                  <span className={item.done ? "tag green" : "tag gold"}>{item.done ? "已处理" : "待处理"}</span>
                </div>
                <p className="muted" style={{ margin: 0 }}>{item.description}</p>
                <Link className={item.done ? "btn" : "btn primary"} href={item.href}>
                  {item.done ? "查看" : "去处理"}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="split">
        <section className="card">
          <div className="panelTop">
            <div>
              <strong>我的需求</strong>
              <div className="muted">需求方免费发布的项目、审核状态和匹配状态。</div>
            </div>
            <Bot size={18} />
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>需求</th>
                <th>Agent</th>
                <th>意向预算</th>
                <th>状态</th>
                <th>截止</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => {
                const nextStep = buyerProjectNextStep(project, data, approved);
                return (
                  <tr key={project.id}>
                    <td>
                      <Link href={`/buyer/projects/${project.id}`}>{project.title}</Link>
                      <div className="muted">{nextStep.description}</div>
                      {(project.status === "rejected" || project.status === "removed") && project.rejectedReason ? (
                        <div className="muted">{project.rejectedReason}</div>
                      ) : null}
                    </td>
                    <td>{project.agentBrief ? "已拆解" : "未拆解"}</td>
                    <td>{money(project.budget)}</td>
                    <td>{projectStatusLabel(project.status)}</td>
                    <td>{compactDate(project.deadline)}</td>
                    <td>
                      <Link className={nextStep.tone === "green" ? "btn primary" : "btn"} href={nextStep.href}>
                        {nextStep.label}
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {!projects.length ? (
                <tr>
                  <td colSpan={6}>
                    <div className="emptyState">
                      <strong>还没有发布需求</strong>
                      <span>先用 Brief Agent 把想法整理成清晰需求，提交审核后即可进入匹配。</span>
                      <Link className="btn primary" href={approved ? "/post-project" : "/account/profile"}>
                        <Plus size={16} /> {approved ? "发布第一个需求" : "完善主体资料"}
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>

        <aside className="card">
          <div className="cardBody stack">
            <h2 style={{ margin: 0, fontSize: 22 }}>合作线索</h2>
            {leads.map((order) => {
              const project = data.projects.find((item) => item.id === order.projectId);
              const creator = data.creators.find((item) => item.id === order.creatorId);
              return (
                <Link className="card" href={`/orders/${order.id}`} key={order.id}>
                  <div className="cardBody stack">
                    <div className="spaceBetween">
                      <strong>{project?.title ?? "需求"}</strong>
                      <span className="tag green">{orderStatusLabel(order.status)}</span>
                    </div>
                    <div className="muted">接单方：{creator?.name ?? "创作者"} · {money(order.amount)}</div>
                  </div>
                </Link>
              );
            })}
            {!leads.length ? (
              <div className="emptyState">
                <strong>还没有合作线索</strong>
                <span>需求审核通过后，可以从匹配推荐或创作者大厅邀请接单方。</span>
                <Link className="btn" href={projects.some((project) => project.status === "open" || project.status === "matching") ? `/creators?project=${projects.find((project) => project.status === "open" || project.status === "matching")?.id}` : "/post-project"}>
                  <Search size={16} /> {projects.length ? "去邀请创作者" : "先发布需求"}
                </Link>
              </div>
            ) : null}
            <div className="notice">
              <CheckCircle2 size={15} /> 当前阶段免费入驻、免费发布需求；平台只记录沟通意向和联系状态，后续合作与交付由双方线下或外部工具完成。
            </div>
          </div>
        </aside>
      </div>

      <section className="section">
        <div className="sectionHeader">
          <div>
            <h2>需求方下一步</h2>
            <p>平台会引导需求方把模糊想法变成清晰需求，审核通过后找到合适创作者沟通。</p>
          </div>
        </div>
        <div className="grid">
          <div className="card">
            <div className="cardBody stack">
              <Clock size={20} />
              <strong>补充参考素材</strong>
              <p className="muted" style={{ margin: 0 }}>上传产品图、Logo、品牌色和参考案例，提升匹配质量。</p>
            </div>
          </div>
          <div className="card">
            <div className="cardBody stack">
              <Bot size={20} />
              <strong>查看 Agent 推荐与信息大厅</strong>
              <p className="muted" style={{ margin: 0 }}>系统先推荐10位创作者，派单方也可以进入信息大厅自主检索并邀请。</p>
            </div>
          </div>
          <div className="card">
            <div className="cardBody stack">
              <CheckCircle2 size={20} />
              <strong>沉淀沟通线索</strong>
              <p className="muted" style={{ margin: 0 }}>平台记录邀请和沟通状态，具体合作由双方自行推进。</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
