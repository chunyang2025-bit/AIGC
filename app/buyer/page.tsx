"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bot, BriefcaseBusiness, CheckCircle2, Clock, Plus, Search, UsersRound } from "lucide-react";
import { compactDate, money, orderStatusLabel, projectStatusLabel } from "@/lib/format";
import { loadMarketplaceData } from "@/lib/store";
import { readAuthSession } from "@/lib/auth";
import { buyerActionItems, buyerProjectNextStep } from "@/lib/opportunities";
import { FirstActionPanel } from "@/components/FirstActionPanel";
import { BuyerProfile, Order, Project } from "@/lib/types";

export default function BuyerPortalPage() {
  const router = useRouter();
  const [session] = useState(() => readAuthSession());
  const [data, setData] = useState(() => loadMarketplaceData());
  const buyerId = session?.userId ?? "";
  const [buyerProfile, setBuyerProfile] = useState<BuyerProfile | null>(() => data.buyerProfiles?.find((profile) => profile.userId === buyerId) ?? null);
  const [projects, setProjects] = useState<Project[]>(() => data.projects.filter((project) => project.buyerId === buyerId));
  const [leads, setLeads] = useState<Order[]>(() => data.orders.filter((order) => order.buyerId === buyerId));
  const verified = Boolean(buyerProfile?.verified);
  const activeLeads = leads.filter((order) => order.status !== "approved");
  const agentProjects = projects.filter((project) => project.agentBrief);
  const actionItems = buyerActionItems(data, buyerId, Boolean(buyerProfile));
  const openProject = projects.find((project) => ["pending_review", "open", "matching", "in_progress"].includes(project.status));
  const hasTrainingDemand = projects.some((project) => project.category === "AIGC Training");
  const firstAction = !projects.length
      ? {
          title: "发布第一个需求，让平台开始推荐服务方",
          description: "用 Brief Agent 把一句话想法变成可匹配的需求。试运营期间可先发布、匹配和邀请。",
          primaryLabel: "发布项目需求",
          primaryHref: "/post-project",
          secondaryLabel: "发布培训需求",
          secondaryHref: "/post-project?category=AIGC%20Training"
        }
      : !leads.length
        ? {
            title: "邀请 2-3 位候选服务方，产生第一条沟通线索",
            description: openProject ? `优先处理「${openProject.title}」，从匹配推荐或服务方大厅发起邀请。` : "先从已发布需求进入匹配推荐，邀请候选服务方沟通。",
            primaryLabel: openProject ? "查看匹配推荐" : "查看我的需求",
            primaryHref: openProject ? `/buyer/projects/${openProject.id}` : "/buyer",
            secondaryLabel: "查看服务方大厅",
            secondaryHref: "/creators"
          }
        : {
            title: "跟进沟通线索，确认是否适合继续合作",
            description: "把线索状态更新清楚，能帮助运营判断平台是否真的完成撮合。",
            primaryLabel: "查看沟通线索",
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
          projects: Project[];
          buyerOrders: Order[];
          notificationsData: ReturnType<typeof loadMarketplaceData>;
        };
        setBuyerProfile(next.buyerProfile);
        setProjects(next.projects);
        setLeads(next.buyerOrders);
        setData(next.notificationsData);
      })
      .catch(() => null);

    return () => {
      active = false;
    };
  }, [session?.accessToken]);

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
            <p>免费发布内容需求，启动 Brief Agent，试运营期间可先查看匹配结果并邀请创作者建立沟通线索。</p>
          </div>
          <div className="toolbarGroup">
            <Link className="btn primary" href="/post-project">
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

      {!verified ? (
        <section className="notice">
          风险提示：你的主体资料未审核、未认证。试运营期间可先发布需求、查看匹配并邀请沟通；查看具体信息或推进正式合作时建议完成认证。
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
          { label: "主体认证", done: verified },
          { label: "发布需求", done: Boolean(projects.length) },
          { label: "培训需求", done: hasTrainingDemand },
          { label: "首条沟通", done: Boolean(leads.length) }
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
              <div className="muted">需求方免费发布的项目、发布状态和匹配状态。</div>
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
                const nextStep = buyerProjectNextStep(project, data, Boolean(buyerProfile));
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
                      <span>先用 Brief Agent 把想法整理成清晰需求，提交后即可进入试运营匹配。</span>
                      <Link className="btn primary" href="/post-project">
                        <Plus size={16} /> 发布第一个需求
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
            <h2 style={{ margin: 0, fontSize: 22 }}>沟通线索</h2>
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
                <strong>还没有沟通线索</strong>
                <span>发布需求后，可以从匹配推荐或创作者大厅邀请接单方。</span>
                <Link className="btn" href={projects.some((project) => ["pending_review", "open", "matching", "in_progress"].includes(project.status)) ? `/creators?project=${projects.find((project) => ["pending_review", "open", "matching", "in_progress"].includes(project.status))?.id}` : "/post-project"}>
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
            <p>平台会引导需求方把模糊想法变成清晰需求，先试用匹配和沟通，再用认证提升信任。</p>
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
