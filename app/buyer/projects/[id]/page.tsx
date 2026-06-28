"use client";

import { useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bot, CheckCircle2, FileBadge2, FileText, Search, Sparkles, UsersRound } from "lucide-react";
import { CreatorCard } from "@/components/CreatorCard";
import { categoryLabel, compactDate, money, orderStatusLabel, projectStatusLabel } from "@/lib/format";
import { getProjectMatches, inviteCreator, loadMarketplaceData } from "@/lib/store";
import { readAuthSession } from "@/lib/auth";
import { isCandidateCreator, readCandidateCreatorIds, toggleCandidateCreator } from "@/lib/candidates";
import { buyerProjectNextStep, creatorInviteChecklist, projectTrainingConversion } from "@/lib/opportunities";
import { trainingFormatLabel } from "@/lib/training";
import { BuyerProfile, CreatorProfile, Order, Project, ProjectMatch } from "@/lib/types";

export default function BuyerProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [session] = useState(() => readAuthSession());
  const [data, setData] = useState(() => loadMarketplaceData());
  const [project, setProject] = useState<Project | null>(() => data.projects.find((item) => item.id === params.id) ?? null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "missing">(() =>
    project ? "ready" : session?.accessToken ? "loading" : "missing"
  );
  const [matches, setMatches] = useState<ProjectMatch[]>(() => getProjectMatches(data, params.id));
  const [candidateIds, setCandidateIds] = useState(readCandidateCreatorIds(params.id));
  const [leads, setLeads] = useState<Order[]>(() => data.orders.filter((order) => order.projectId === params.id));
  const [buyerProfile, setBuyerProfile] = useState<BuyerProfile | null>(() => data.buyerProfiles?.find((profile) => profile.userId === session?.userId) ?? null);
  const [creators, setCreators] = useState<CreatorProfile[]>(() => {
    const creatorIds = new Set([
      ...matches.map((item) => item.creatorId),
      ...data.orders.filter((order) => order.projectId === params.id).map((order) => order.creatorId)
    ]);
    return data.creators.filter((creator) => creatorIds.has(creator.id));
  });

  useEffect(() => {
    if (!session?.accessToken) return;

    let active = true;
    setLoadState((current) => (current === "ready" ? current : "loading"));

    fetch(`/api/buyer/projects/${params.id}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${session.accessToken}`
      }
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        return { response, payload };
      })
      .then((payload) => {
        if (!active) return;
        if (payload.response.status === 404) {
          setLoadState("missing");
          return;
        }
        if (!payload.payload?.ok || !payload.payload.data) {
          setLoadState(project ? "ready" : "missing");
          return;
        }
        const next = payload.payload.data as {
          project: Project;
          buyerProfile: BuyerProfile | null;
          matches: ProjectMatch[];
          creators: CreatorProfile[];
          leads: Order[];
        };
        setProject(next.project);
        setBuyerProfile(next.buyerProfile);
        setMatches(next.matches);
        setCreators(next.creators);
        setLeads(next.leads);
        setData((current) => ({
          ...current,
          buyerProfiles: next.buyerProfile
            ? [
                next.buyerProfile,
                ...(current.buyerProfiles ?? []).filter((profile) => profile.id !== next.buyerProfile?.id)
              ]
            : current.buyerProfiles ?? [],
          projects: [
            next.project,
            ...current.projects.filter((item) => item.id !== next.project.id)
          ],
          matches: [
            ...next.matches,
            ...current.matches.filter((item) => item.projectId !== next.project.id)
          ],
          orders: [
            ...next.leads,
            ...current.orders.filter((item) => item.projectId !== next.project.id)
          ],
          creators: [
            ...next.creators,
            ...current.creators.filter((creator) => !next.creators.some((item) => item.id === creator.id))
          ]
        }));
        setLoadState("ready");
      })
      .catch(() => {
        if (!active) return;
        setLoadState(project ? "ready" : "missing");
      });

    return () => {
      active = false;
    };
  }, [params.id, project, session?.accessToken]);

  if (loadState === "loading") {
    return (
      <main className="main">
        <div className="notice">正在加载需求详情...</div>
      </main>
    );
  }

  if (!project || loadState === "missing") {
    notFound();
  }

  const verified = Boolean(buyerProfile?.verified);
  const canTrialInvite = Boolean(buyerProfile) && ["pending_review", "open", "matching", "in_progress"].includes(project.status);
  const isTrainingProject = project.category === "AIGC Training";
  const inviteActionLabel = isTrainingProject ? "索要培训方案" : "邀请沟通";
  const invitedActionLabel = isTrainingProject ? "已索要方案" : "已邀请";
  const inviteMessage = (creatorName: string) =>
    isTrainingProject
      ? `我们正在为「${project.title}」筛选AIGC培训服务方。请先提供课程大纲、报价、过往企业培训案例，并给出可预约15分钟沟通的时间。培训对象：${project.trainingRequirement?.audience || "待沟通"}；预计人数：${project.trainingRequirement?.headcount || "待沟通"}；培训形式：${project.trainingRequirement ? trainingFormatLabel(project.trainingRequirement.format) : "待沟通"}。`
      : `已邀请 ${creatorName} 沟通需求「${project.title}」。`;
  const nextStep = buyerProjectNextStep(project, data, Boolean(buyerProfile));
  const conversion = projectTrainingConversion(project);
  const candidateRows = candidateIds.flatMap((id) => {
    const creator = creators.find((item) => item.id === id) ?? data.creators.find((item) => item.id === id);
    if (!creator) return [];
    const match = matches.find((item) => item.creatorId === creator.id);
    const invited = leads.some((order) => order.creatorId === creator.id);
    return [{ creator, match, invited, checklist: creatorInviteChecklist(creator, project, invited) }];
  });

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
                  <span>意向预算</span>
                </div>
                <div className="metric">
                  <strong>{compactDate(project.deadline).split(",")[0]}</strong>
                  <span>沟通期限</span>
                </div>
                <div className="metric">
                  <strong>{matches.length}</strong>
                  <span>{isTrainingProject ? "推荐讲师" : "推荐创作者"}</span>
                </div>
                <div className="metric">
                  <strong>{leads.length}</strong>
                  <span>合作线索</span>
                </div>
              </div>
              <div className="notice">
                <div className="spaceBetween">
                  <strong>{nextStep.label}</strong>
                  <Link className={nextStep.tone === "green" ? "btn primary" : "btn"} href={nextStep.href}>
                    去处理
                  </Link>
                </div>
                <span>{nextStep.description}</span>
              </div>
              <div className="conversionCard">
                <div className="stack">
                  <span className="tag blue">四入口转化建议</span>
                  <strong>{conversion.label}</strong>
                  <p>{conversion.description}</p>
                  <div className="tagList">
                    {conversion.reasons.length ? conversion.reasons.map((item) => <span className="tag green" key={item}>{item}</span>) : <span className="tag">可作为备选路径</span>}
                  </div>
                </div>
                <Link className="btn" href={conversion.href}>
                  {isTrainingProject ? "发布样品代做需求" : "发布培训需求"}
                </Link>
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
              {project.trainingRequirement ? (
                <div className="agentBriefPanel">
                  <div className="spaceBetween">
                    <strong>AIGC培训需求</strong>
                    <span className="tag blue">{trainingFormatLabel(project.trainingRequirement.format)}</span>
                  </div>
                  <div className="grid two">
                    <div className="briefBlock">
                      <strong>培训对象</strong>
                      <p>{project.trainingRequirement.audience || "待沟通"}{project.trainingRequirement.headcount ? ` · ${project.trainingRequirement.headcount}人` : ""}</p>
                    </div>
                    <div className="briefBlock">
                      <strong>城市/时长</strong>
                      <p>{project.trainingRequirement.city || "线上/待沟通"} · {project.trainingRequirement.duration || "待沟通"}</p>
                    </div>
                  </div>
                  <div className="briefBlock">
                    <strong>培训主题</strong>
                    <div className="tagList">
                      {project.trainingRequirement.topics.map((item) => <span className="tag green" key={item}>{item}</span>)}
                      {!project.trainingRequirement.topics.length ? <span className="tag">待沟通</span> : null}
                    </div>
                  </div>
                  <div className="briefBlock">
                    <strong>培训目标</strong>
                    <p>{project.trainingRequirement.goal || "待沟通"}</p>
                  </div>
                  <div className="tagList">
                    {project.trainingRequirement.needCustomCases ? <span className="tag">需要企业定制案例</span> : null}
                    {project.trainingRequirement.needMaterials ? <span className="tag">需要课件/练习材料</span> : null}
                  </div>
                </div>
              ) : null}
              {isTrainingProject ? (
                <div className="notice stack">
                  <strong>培训采购下一步</strong>
                  <div className="tagList">
                    <span className="tag green">索要课程大纲</span>
                    <span className="tag green">索要报价与服务边界</span>
                    <span className="tag green">确认企业培训案例</span>
                    <span className="tag green">预约15分钟沟通</span>
                  </div>
                </div>
              ) : null}
              {project.status === "pending_review" ? (
                <div className="notice">需求正在平台运营审核中。试运营期间你可以先查看推荐并邀请沟通；审核通过后会进入公开大厅展示。</div>
              ) : null}
              {buyerProfile && !verified ? (
                <div className="notice">风险提示：当前主体未审核、未认证。可以先试用匹配和沟通，查看具体信息或推进正式合作时建议完成认证。</div>
              ) : null}
              {project.status === "rejected" ? (
                <div className="notice">
                  需求已驳回：{project.rejectedReason || "请补充资质、联系方式或需求说明后重新提交。"}
                  <Link className="btn" href={`/post-project?edit=${project.id}`}>重新提交需求</Link>
                </div>
              ) : null}
              {project.status === "removed" ? (
                <div className="notice">
                  需求已下架：{project.rejectedReason || "请联系平台运营确认原因。"}
                  <Link className="btn" href={`/post-project?edit=${project.id}`}>重新发布需求</Link>
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
                <h2>{isTrainingProject ? "推荐讲师短名单" : "匹配 Agent 推荐"}</h2>
                <p>{isTrainingProject ? "仅需求方可见。综合培训主题、对象、形式、城市、企业案例、认证状态和响应速度，优先推荐可索要方案的讲师。" : "仅派单方可见。综合品类、意向预算、技能、履约记录、认证状态和响应速度，展示10位可邀约创作者。"}</p>
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
                const creator = creators.find((item) => item.id === match.creatorId) ?? data.creators.find((item) => item.id === match.creatorId);
                if (!creator) return null;
                const invited = leads.some((order) => order.creatorId === creator.id);

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
                      canTrialInvite && !invited
                        ? () => {
                            const order = inviteCreator(project.id, creator.id, { message: inviteMessage(creator.name) });
                            if (order) {
                              router.push(`/orders/${order.id}`);
                            }
                          }
                        : undefined
                    }
                    invited={invited}
                    inviteLabel={inviteActionLabel}
                    invitedLabel={invitedActionLabel}
                  />
                );
              })}
            </div>
            {buyerProfile && !verified ? <div className="notice">未审核、未认证：可先{isTrainingProject ? "索要培训方案" : "邀请创作者"}试用流程，正式合作前建议完成认证。</div> : null}
            {!canTrialInvite ? <div className="notice">当前需求状态暂不能{isTrainingProject ? "索要培训方案" : "邀请创作者"}，请先补充或重新提交需求。</div> : null}
          </section>

          <section className="card">
            <div className="panelTop">
              <div>
                <strong>{isTrainingProject ? "推荐讲师对比表" : "推荐接单方对比表"}</strong>
                <div className="muted">{isTrainingProject ? "按培训主题、案例、报价、响应速度、认证状态和匹配理由快速比较。" : "按评分、报价、响应速度、履约记录和匹配理由快速比较。"}</div>
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
                  const invited = leads.some((order) => order.creatorId === creator.id);
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
                        <div className="toolbarGroup">
                          <button className="btn" onClick={() => setCandidateIds(toggleCandidateCreator(project.id, creator.id))} type="button">
                            {isCandidateCreator(project.id, creator.id) ? "移出候选" : "加入候选"}
                          </button>
                          <span className={invited ? "tag green" : "tag"}>{invited ? invitedActionLabel : isTrainingProject ? "未索要" : "未邀请"}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {matches.length === 0 ? (
              <div className="notice">当前需求还没有推荐结果。你可以先去创作者信息大厅手动筛选候选人。</div>
            ) : null}
          </section>
        </section>

        <aside className="card">
          <div className="cardBody stack">
            <h2 style={{ margin: 0, fontSize: 22 }}>合作线索</h2>
            {leads.length === 0 ? (
              <div className="notice">
                {isTrainingProject ? "还没有培训方案线索。你可以先从讲师短名单或候选池索要课程大纲、报价和15分钟沟通时间。" : "还没有沟通线索。你可以先从推荐列表或候选池邀请创作者，接单者主动发送资料后也会出现在这里。"}
              </div>
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
            <div className="notice">当前阶段免费发布需求，平台只记录沟通意向，不处理收款、合同和交付。</div>
          </div>
        </aside>
      </div>

      <section className="section">
        <div className="sectionHeader">
          <div>
            <h2>候选创作者对比板</h2>
            <p>{isTrainingProject ? "把候选讲师放在同一张表里比较，再根据课程大纲、企业案例、报价和沟通时间决定是否推进。" : "把候选人放在同一张表里比较，再根据邀约前检查清单决定是否沟通。"}</p>
          </div>
          <Link className="btn" href={`/creators?project=${project.id}`}>去信息大厅继续添加</Link>
        </div>
        {candidateRows.length ? (
          <section className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>{isTrainingProject ? "候选讲师" : "候选人"}</th>
                  <th>匹配</th>
                  <th>报价/服务包</th>
                  <th>响应/履约</th>
                  <th>代表作</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {candidateRows.map((row) => (
                  <tr key={row.creator.id}>
                    <td>
                      <Link href={`/creators/${row.creator.id}`}>{row.creator.displayName ?? row.creator.name}</Link>
                      <div className="muted">{row.creator.verified ? "已认证" : "待审核"} · {row.creator.categories.map(categoryLabel).join("、")}</div>
                    </td>
                    <td>{typeof row.match?.score === "number" ? `${row.match.score}%` : "手动候选"}</td>
                    <td>
                      {money(row.creator.priceMin)}-{money(row.creator.priceMax)}
                      <div className="muted">{row.creator.servicePackages?.[0]?.name ?? "未设置服务包"}</div>
                    </td>
                    <td>{row.creator.responseTime}<div className="muted">完成 {row.creator.completedProjects} 项</div></td>
                    <td>{row.creator.portfolioItems?.length ?? row.creator.portfolio.length}</td>
                    <td><span className={row.invited ? "tag green" : "tag"}>{row.invited ? invitedActionLabel : isTrainingProject ? "未索要" : "未邀请"}</span></td>
                    <td>
                      <div className="toolbarGroup">
                        <button className="btn" onClick={() => setCandidateIds(toggleCandidateCreator(project.id, row.creator.id))} type="button">移出候选</button>
                        <button
                          className="btn primary"
                          disabled={!canTrialInvite || row.invited}
                          onClick={() => {
                            const order = inviteCreator(project.id, row.creator.id, { message: inviteMessage(row.creator.name) });
                            if (order) router.push(`/orders/${order.id}`);
                          }}
                          type="button"
                        >
                          {row.invited ? invitedActionLabel : inviteActionLabel}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : (
          <div className="notice">{isTrainingProject ? "还没有候选讲师。你可以从讲师短名单或服务方大厅加入候选。" : "还没有候选创作者。你可以从推荐列表或创作者信息大厅加入候选。"}</div>
        )}
        {candidateRows.length ? (
          <div className="grid three" style={{ marginTop: 16 }}>
            {candidateRows.map((row) => (
              <article className="card" key={row.creator.id}>
                <div className="cardBody stack">
                  <div className="spaceBetween">
                    <strong>{row.creator.displayName ?? row.creator.name}</strong>
                    <span className={row.checklist.every((item) => item.done) ? "tag green" : "tag gold"}>
                      {row.checklist.filter((item) => item.done).length}/{row.checklist.length}
                    </span>
                  </div>
                  <div className="tagList">
                    {row.checklist.map((item) => (
                      <span className={item.done ? "tag green" : "tag"} key={item.label}>
                        {item.done ? "已满足" : "待确认"} · {item.label}
                      </span>
                    ))}
                  </div>
                  {row.match?.nextStep ? <div className="notice">{row.match.nextStep}</div> : null}
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
