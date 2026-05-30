"use client";

import { useState } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bot, CheckCircle2, FileBadge2, FileText, Search, Sparkles, UsersRound } from "lucide-react";
import { CreatorCard } from "@/components/CreatorCard";
import { categoryLabel, compactDate, money, orderStatusLabel, projectStatusLabel } from "@/lib/format";
import { getProjectMatches, inviteCreator, loadMarketplaceData } from "@/lib/store";
import { isApproved, readAuthSession } from "@/lib/auth";
import { isCandidateCreator, readCandidateCreatorIds, toggleCandidateCreator } from "@/lib/candidates";

export default function BuyerProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const session = readAuthSession();
  const data = loadMarketplaceData();
  const project = data.projects.find((item) => item.id === params.id);

  if (!project) {
    notFound();
  }

  const matches = getProjectMatches(data, project.id);
  const [candidateIds, setCandidateIds] = useState(readCandidateCreatorIds(project.id));
  const candidateCreators = candidateIds
    .map((id) => data.creators.find((creator) => creator.id === id))
    .filter(Boolean);
  const leads = data.orders.filter((order) => order.projectId === project.id);
  const buyerProfile = data.buyerProfiles?.find((profile) => profile.userId === session?.userId);
  const approved = buyerProfile?.verified ?? isApproved(session);

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
                    onToggleCandidate={() => setCandidateIds(toggleCandidateCreator(project.id, creator.id))}
                    candidateSelected={isCandidateCreator(project.id, creator.id)}
                    onInvite={
                      approved
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
            {!approved ? <div className="notice">当前主体主页正在审核，审核通过后才能邀请创作者。</div> : null}
          </section>

          <section className="card">
            <div className="panelTop">
              <div>
                <strong>推荐接单方对比表</strong>
                <div className="muted">按评分、报价、响应速度、履约记录和匹配理由快速比较。</div>
              </div>
              <UsersRound size={18} />
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>接单方</th>
                  <th>报价</th>
                  <th>评分</th>
                  <th>响应</th>
                  <th>履约</th>
                  <th>匹配</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {matches.slice(0, 10).map((match) => {
                  const creator = data.creators.find((item) => item.id === match.creatorId);
                  if (!creator) return null;
                  return (
                    <tr key={match.id}>
                      <td>
                        <Link href={`/creators/${creator.id}`}>{creator.displayName ?? creator.name}</Link>
                        <div className="muted">{creator.verified ? "已认证" : "待审核"}</div>
                      </td>
                      <td>{money(creator.priceMin)}-{money(creator.priceMax)}</td>
                      <td>{creator.rating.toFixed(1)}</td>
                      <td>{creator.responseTime}</td>
                      <td>{creator.completedProjects} 项</td>
                      <td>{match.score}%</td>
                      <td>
                        <button className="btn" onClick={() => setCandidateIds(toggleCandidateCreator(project.id, creator.id))} type="button">
                          {isCandidateCreator(project.id, creator.id) ? "移出候选" : "加入候选"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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

      <section className="section">
        <div className="sectionHeader">
          <div>
            <h2>我的候选创作者池</h2>
            <p>先把合适的人加入候选，再逐个查看展示页或邀请沟通。</p>
          </div>
          <Link className="btn" href={`/creators?project=${project.id}`}>去信息大厅继续添加</Link>
        </div>
        <div className="grid">
          {candidateCreators.map((creator) => creator ? (
            <CreatorCard
              creator={creator}
              key={creator.id}
              onInvite={
                approved
                  ? () => {
                      const order = inviteCreator(project.id, creator.id);
                      if (order) router.push(`/orders/${order.id}`);
                    }
                  : undefined
              }
              onToggleCandidate={() => setCandidateIds(toggleCandidateCreator(project.id, creator.id))}
              candidateSelected
            />
          ) : null)}
          {!candidateCreators.length ? <div className="notice">还没有候选创作者。你可以从推荐列表或创作者信息大厅加入候选。</div> : null}
        </div>
      </section>
    </main>
  );
}
