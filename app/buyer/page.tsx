"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bot, BriefcaseBusiness, CheckCircle2, Clock, Plus, Search, UsersRound } from "lucide-react";
import { compactDate, money, orderStatusLabel, projectStatusLabel } from "@/lib/format";
import { loadMarketplaceData } from "@/lib/store";
import { isApproved, readAuthSession } from "@/lib/auth";

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
            <BriefcaseBusiness size={15} /> 需求发布方入口
          </span>
          <div>
            <h1>需求发布方工作台</h1>
          <p>发布内容需求，启动 Brief Agent，查看匹配结果，并邀请创作者建立沟通线索。</p>
          </div>
          <div className="toolbarGroup">
            <Link className={approved ? "btn primary" : "btn"} href={approved ? "/post-project" : "/account/profile"}>
              <Plus size={16} /> 启动需求 Agent
            </Link>
            <Link className="btn" href="/account/capabilities">
              <UsersRound size={16} /> 开通接单能力
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

      <div className="split">
        <section className="card">
          <div className="panelTop">
            <div>
              <strong>我的需求</strong>
              <div className="muted">需求方发布的项目和匹配状态。</div>
            </div>
            <Bot size={18} />
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>需求</th>
                <th>Agent</th>
                <th>预算</th>
                <th>状态</th>
                <th>截止</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  <td>
                    <Link href={`/buyer/projects/${project.id}`}>{project.title}</Link>
                  </td>
                  <td>{project.agentBrief ? "已拆解" : "未拆解"}</td>
                  <td>{money(project.budget)}</td>
                  <td>{projectStatusLabel(project.status)}</td>
                  <td>{compactDate(project.deadline)}</td>
                  <td>
                    <Link className="btn" href={`/creators?project=${project.id}`}>
                      <UsersRound size={16} /> 邀请创作者
                    </Link>
                  </td>
                </tr>
              ))}
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
                    <div className="muted">需求接受方：{creator?.name ?? "创作者"} · {money(order.amount)}</div>
                  </div>
                </Link>
              );
            })}
            <div className="notice">
              <CheckCircle2 size={15} /> 平台只记录沟通意向和联系状态，后续交易与交付由双方线下或外部工具完成。
            </div>
          </div>
        </aside>
      </div>

      <section className="section">
        <div className="sectionHeader">
          <div>
            <h2>需求方下一步</h2>
            <p>平台会引导需求方把模糊想法变成清晰需求，并找到合适创作者沟通。</p>
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
