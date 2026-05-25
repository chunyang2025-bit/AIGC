"use client";

import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bot, CheckCircle2, FileBadge2, FileText, Search, Sparkles, UsersRound } from "lucide-react";
import { CreatorCard } from "@/components/CreatorCard";
import { categoryLabel, compactDate, money, orderStatusLabel, projectStatusLabel } from "@/lib/format";
import { getProjectMatches, inviteCreator, loadMarketplaceData } from "@/lib/store";
import { isApproved, readAuthSession } from "@/lib/auth";

export default function BuyerProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const session = readAuthSession();
  const data = loadMarketplaceData();
  const project = data.projects.find((item) => item.id === params.id);

  if (!project) {
    notFound();
  }

  const matches = getProjectMatches(data, project.id);
  const leads = data.orders.filter((order) => order.projectId === project.id);

  return (
    <main className="main">
      <div className="toolbar">
        <Link className="btn" href="/buyer">
          <ArrowLeft size={16} /> 返回派单后台
        </Link>
        <Link className="btn primary" href={`/creators?project=${project.id}`}>
          <Search size={16} /> 创作者信息大厅
        </Link>
      </div>

      <div className="split">
        <section className="stack">
          <article className="card">
            <div className="cardBody stack">
              <div className="spaceBetween">
                <span className="tag blue">{categoryLabel(project.category)}</span>
                <span className="tag gold">{projectStatusLabel(project.status)}</span>
              </div>
              <div>
                <h1 style={{ margin: "0 0 10px", fontSize: 34 }}>{project.title}</h1>
                <p className="muted" style={{ margin: 0, lineHeight: 1.65 }}>
                  {project.description}
                </p>
              </div>
              <div className="grid four">
                <div className="metric">
                  <strong>{money(project.budget)}</strong>
                  <span>预算</span>
                </div>
                <div className="metric">
                  <strong>{compactDate(project.deadline).split(",")[0]}</strong>
                  <span>沟通期限</span>
                </div>
                <div className="metric">
                  <strong>{matches.length}</strong>
                  <span>推荐创作者</span>
                </div>
                <div className="metric">
                  <strong>{leads.length}</strong>
                  <span>合作线索</span>
                </div>
              </div>
              {project.referenceFile ? (
                <div className="notice">
                  <FileText size={15} /> 已上传参考文件：{project.referenceFile}
                </div>
              ) : null}
              {project.qualificationFile ? (
                <div className="notice">
                  <FileBadge2 size={15} /> 需求相关资质：{project.qualificationFile}
                </div>
              ) : null}
              {project.agentBrief ? (
                <div className="agentBriefPanel">
                  <div className="spaceBetween">
                    <strong>
                      <Bot size={16} /> Brief Agent 已拆解
                    </strong>
                    <span className="tag green">结构化需求</span>
                  </div>
                  <div className="grid two">
                    <div className="briefBlock">
                      <strong>目标用户</strong>
                      <p>{project.agentBrief.audience}</p>
                    </div>
                    <div className="briefBlock">
                      <strong>风格方向</strong>
                      <p>{project.agentBrief.style}</p>
                    </div>
                  </div>
                  <div className="briefBlock">
                    <strong>成果范围</strong>
                    <div className="tagList">
                      {project.agentBrief.deliverables.map((item) => (
                        <span className="tag blue" key={item}>
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="briefBlock">
                    <strong>沟通确认点</strong>
                    <ul className="cleanList">
                      {project.agentBrief.acceptanceCriteria.map((item) => (
                        <li key={item}>
                          <CheckCircle2 size={15} /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>
          </article>

          <section>
            <div className="sectionHeader">
              <div>
                <h2>匹配 Agent 推荐</h2>
                <p>仅派单方可见。综合品类、预算、技能、履约记录、认证状态和响应速度，展示10位可邀约创作者。</p>
              </div>
              <div className="toolbarGroup">
                <span className="tag green">
                  <Sparkles size={13} /> 可解释推荐
                </span>
                <Link className="btn" href={`/creators?project=${project.id}`}>
                  <UsersRound size={16} /> 自主检索更多
                </Link>
              </div>
            </div>
            <div className="grid">
              {matches.map((match) => {
                const creator = data.creators.find((item) => item.id === match.creatorId);
                if (!creator) return null;

                return (
                  <CreatorCard
                    creator={creator}
                    key={match.id}
                    matchScore={match.score}
                    reason={match.reason}
                    risk={match.risk}
                    nextStep={match.nextStep}
                    onInvite={
                      isApproved(session)
                        ? () => {
                            const order = inviteCreator(project.id, creator.id);
                            if (order) {
                              router.push(`/orders/${order.id}`);
                            }
                          }
                        : undefined
                    }
                  />
                );
              })}
            </div>
            {!isApproved(session) ? <div className="notice">当前主体主页正在审核，审核通过后才能邀请创作者。</div> : null}
          </section>
        </section>

        <aside className="card">
          <div className="cardBody stack">
            <h2 style={{ margin: 0, fontSize: 22 }}>合作线索</h2>
            {leads.length === 0 ? (
              <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
                邀请创作者，或接单者主动发送资料后，会在这里生成沟通线索。
              </p>
            ) : (
              leads.map((order) => {
                const creator = data.creators.find((item) => item.id === order.creatorId);
                return (
                  <Link className="card" href={`/orders/${order.id}`} key={order.id}>
                    <div className="cardBody stack">
                      <strong>{creator?.name ?? "创作者"}</strong>
                      <span className="tag green">{orderStatusLabel(order.status)}</span>
                      <span className="muted">{money(order.amount)}</span>
                    </div>
                  </Link>
                );
              })
            )}
            <div className="notice">平台只记录沟通意向，不处理收款、合同和交付。</div>
          </div>
        </aside>
      </div>
    </main>
  );
}
