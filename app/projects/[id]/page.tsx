"use client";

import { FormEvent, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { ArrowLeft, Bot, Building2, CheckCircle2, FileBadge2, FileText, Link2, Send, Sparkles, UsersRound } from "lucide-react";
import Link from "next/link";
import { categoryLabel, compactDate, money, projectStatusLabel } from "@/lib/format";
import { trainingFormatLabel } from "@/lib/training";
import { ReportButton } from "@/components/ReportButton";
import { expressInterestInProject, loadMarketplaceData } from "@/lib/store";
import { loginNextPath, readAuthSession } from "@/lib/auth";
import { creatorProjectScore, decisionScore, projectDecisionItems, trainingOpportunityItems, trainingOpportunityScore, trainingProposalText } from "@/lib/opportunities";
import { saveRemixDraft } from "@/lib/remix-draft";

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const session = readAuthSession();
  const data = loadMarketplaceData();
  const currentCreator = data.creators.find((creator) => creator.userId === session?.userId);
  const [intro, setIntro] = useState(
    `你好，我是${currentCreator?.name ?? "接单创作者"}。我看过这个需求，想进一步沟通内容方向、周期和素材范围。`
  );
  const project = data.projects.find((item) => item.id === params.id);

  if (!project) {
    notFound();
  }

  if (!["pending_review", "open", "matching", "in_progress"].includes(project.status)) {
    notFound();
  }

  const publicProject = project;
  const projectId = project.id;
  const isTrainingProject = project.category === "AIGC Training";
  const buyerProfile = (data.buyerProfiles ?? []).find((profile) => profile.userId === project.buyerId);
  const buyerName = buyerProfile?.displayName ?? buyerProfile?.companyName ?? data.users.find((user) => user.id === project.buyerId)?.name ?? "需求发布方";
  const decisionItems = projectDecisionItems(project, buyerProfile);
  const suitabilityScore = creatorProjectScore(currentCreator, project);
  const trustScore = decisionScore(project, buyerProfile);
  const trainingFitItems = isTrainingProject ? trainingOpportunityItems(currentCreator, project, buyerProfile) : [];
  const trainingFitScore = isTrainingProject ? trainingOpportunityScore(currentCreator, project, buyerProfile) : 0;
  const generatedTrainingProposal = isTrainingProject ? trainingProposalText(currentCreator, project) : "";
  const sampleMatches = data.matches
    .filter((match) => match.projectId === project.id)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((match) => ({
      ...match,
      creator: data.creators.find((creator) => creator.id === match.creatorId)
    }))
    .filter((match) => match.creator);
  const suggestedIntro = [
    `你好，我看过「${project.title}」这个需求。`,
    currentCreator ? `我这边主要做${currentCreator.categories.map(categoryLabel).join("、")}，相关能力包括${currentCreator.skills.slice(0, 4).join("、")}。` : "",
    isTrainingProject
      ? "我可以先提供课程大纲、报价和过往企业培训案例，并预约15分钟沟通确认培训对象、人数和定制案例范围。"
      : project.agentBrief?.deliverables?.length ? `我建议先确认${project.agentBrief.deliverables.slice(0, 2).join("、")}的样式参考和修改轮次。` : "我建议先确认交付范围、参考风格和修改轮次。",
    currentCreator ? `我的展示页里包含代表作、简历和联系方式，可以先供你判断是否适合继续沟通。` : ""
  ].filter(Boolean).join("\n");

  function submitInterest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentCreator) return;

    const order = expressInterestInProject(projectId, currentCreator.id, {
      intro
    });
    if (order) {
      router.push(`/orders/${order.id}`);
    }
  }

  function saveProjectRemix() {
    saveRemixDraft({
      type: "project",
      sourceProjectId: publicProject.id,
      sourceTitle: publicProject.title,
      project: {
        title: publicProject.title,
        description: publicProject.description,
        category: publicProject.category,
        tags: publicProject.tags,
        useCase: publicProject.useCase,
        deliverableTypes: publicProject.deliverableTypes,
        urgency: publicProject.urgency,
        needInvoice: publicProject.needInvoice,
        longTerm: publicProject.longTerm,
        acceptPlatformRecommend: publicProject.acceptPlatformRecommend,
        trainingRequirement: publicProject.trainingRequirement,
        budget: publicProject.budget,
        deadline: publicProject.deadline,
        agentBrief: publicProject.agentBrief
      }
    });
  }

  return (
    <main className="main">
      <div className="toolbar">
        <Link className="btn" href="/projects">
          <ArrowLeft size={16} /> 返回需求
        </Link>
        <Link
          className="btn primary"
          href={loginNextPath("buyer", `/post-project?remix=project${isTrainingProject ? "&category=AIGC%20Training" : ""}`)}
          onClick={saveProjectRemix}
        >
          <Sparkles size={16} /> {isTrainingProject ? "参考这个培训需求" : "参考这个需求发布"}
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
              <Link className="buyerInlineProfile" href={`/buyers/${project.buyerId}`}>
                <Building2 size={18} />
                <span>{buyerName}</span>
                <em>{buyerProfile?.verified ? "已认证需求方" : "待审核需求方"}</em>
              </Link>
              <div>
                <h1 style={{ margin: "0 0 10px", fontSize: 34 }}>{project.title}</h1>
                <p className="muted" style={{ margin: 0, lineHeight: 1.65 }}>
                  {project.description}
                </p>
              </div>
              {project.tags?.length ? (
                <div className="tagList">
                  {project.tags.map((tag) => (
                    <span className="tag" key={tag}>{tag}</span>
                  ))}
                </div>
              ) : null}
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
                  <strong>{categoryLabel(project.category)}</strong>
                  <span>内容品类</span>
                </div>
                <div className="metric">
                  <strong>{projectStatusLabel(project.status)}</strong>
                  <span>需求状态</span>
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
              {project.trainingRequirement ? (
                <div className="agentBriefPanel">
                  <div className="spaceBetween">
                    <strong>AIGC培训需求</strong>
                    <span className="tag blue">{trainingFormatLabel(project.trainingRequirement.format)}</span>
                  </div>
                  <div className="grid two compactGrid">
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
              {session ? <ReportButton targetType="project" targetId={project.id} /> : null}
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
                        <span className="tag blue" key={item}>{item}</span>
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
              <div className="card">
                <div className="cardBody stack">
                  <div className="spaceBetween">
                    <strong>{isTrainingProject ? "培训需求是否值得接" : "接单判断卡"}</strong>
                    <span className={(isTrainingProject ? trainingFitScore : trustScore) >= 80 ? "tag green" : "tag gold"}>
                      {isTrainingProject ? `${trainingFitScore}% 适合接` : `${trustScore}% 可信信息`}
                    </span>
                  </div>
                  <div className="grid two compactGrid">
                    <div className="metric">
                      <strong>{isTrainingProject ? `${trustScore}%` : `${suitabilityScore}%`}</strong>
                      <span>{isTrainingProject ? "需求信息完整度" : "与你的能力匹配"}</span>
                    </div>
                    <div className="metric">
                      <strong>{buyerProfile?.verified ? "已认证" : "待审核"}</strong>
                      <span>派单方主体</span>
                    </div>
                  </div>
                  {isTrainingProject ? (
                    <div className="notice stack">
                      <strong>建议先确认</strong>
                      <div className="tagList">
                        <span className="tag">课程大纲</span>
                        <span className="tag">报价口径</span>
                        <span className="tag">企业案例</span>
                        <span className="tag">课后答疑边界</span>
                      </div>
                    </div>
                  ) : null}
                  <div className="tagList">
                    {(isTrainingProject ? trainingFitItems : decisionItems).map((item) => (
                      <span className={item.done ? "tag green" : "tag"} key={item.label}>
                        {item.done ? "已具备" : "待确认"} · {item.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              {sampleMatches.length ? (
                <div className="agentBriefPanel">
                  <div className="spaceBetween">
                    <strong>
                      <Sparkles size={16} /> 示例匹配结果
                    </strong>
                    <span className="tag green">注册后可发起沟通</span>
                  </div>
                  <p className="muted" style={{ margin: 0, lineHeight: 1.6 }}>
                    先展示系统如何推荐候选服务方，帮助你判断需求发布后能得到什么结果。
                  </p>
                  <div className="grid three compactGrid">
                    {sampleMatches.map((match) => (
                      <Link className="toolMiniCard" href={`/creators/${match.creator!.id}`} key={match.id}>
                        <div className="spaceBetween">
                          <strong>{match.creator!.displayName ?? match.creator!.name}</strong>
                          <span className="tag blue">{match.score}%</span>
                        </div>
                        <p>{match.reason}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </article>
        </section>

        <aside className="stack">
          <section className="card">
            <div className="cardBody stack">
              <div>
                <h2 style={{ margin: 0, fontSize: 22 }}>{isTrainingProject ? "向需求方提交培训方案意向" : "向派单方发起沟通"}</h2>
                <p className="muted" style={{ margin: "8px 0 0", lineHeight: 1.55 }}>
                  {isTrainingProject ? "发送你的展示页，并说明可提供课程大纲、报价、企业培训案例和预约沟通时间。" : "直接发送你装修好的展示页。展示页内已包含主体资质、联系方式、简历/履历和代表作。"}
                </p>
              </div>
              {currentCreator ? (
                <form className="form compactForm" onSubmit={submitInterest}>
                  <div className="interestProfile">
                    <span className="avatar">{currentCreator.name.slice(0, 1)}</span>
                    <div>
                      <strong>{currentCreator.name}</strong>
                      <div className="muted">{currentCreator.title}</div>
                    </div>
                    <Link className="btn iconOnly" href={`/creators/${currentCreator.id}`} title="查看展示页">
                      <Link2 size={16} />
                    </Link>
                  </div>
                  <div className="field">
                    <label htmlFor="interest-intro">沟通留言</label>
                    <textarea id="interest-intro" value={intro} onChange={(event) => setIntro(event.target.value)} />
                  </div>
                  {isTrainingProject ? (
                    <div className="notice stack">
                      <strong>培训方案应包含</strong>
                      <div className="tagList">
                        <span className="tag">课程结构</span>
                        <span className="tag">报价</span>
                        <span className="tag">企业案例</span>
                        <span className="tag">课件材料</span>
                        <span className="tag">15分钟沟通时间</span>
                      </div>
                    </div>
                  ) : null}
                  <button className="btn" onClick={() => setIntro(isTrainingProject ? generatedTrainingProposal : suggestedIntro)} type="button">
                    {isTrainingProject ? "生成培训方案话术" : "生成沟通话术"}
                  </button>
                  <div className="notice">
                    <Link2 size={15} /> 将发送展示页：/creators/{currentCreator.id}
                  </div>
                  {!currentCreator.verified ? (
                    <div className="notice">
                      风险提示：你的展示页未审核、未认证。试运营期间可先发送沟通意向，查看具体信息或推进正式合作时建议完成认证。
                    </div>
                  ) : null}
                  {["pending_review", "open", "matching", "in_progress"].includes(project.status) ? (
                    <button className="btn primary" type="submit">
                      <Send size={16} /> {isTrainingProject ? "发送展示页并提交方案意向" : "发送我的展示页并邀约聊天"}
                    </button>
                  ) : (
                    <div className="notice">
                      当前需求状态暂不能发起沟通，请等待需求方补充或重新提交。
                    </div>
                  )}
                </form>
              ) : session ? (
                <Link className="btn primary" href="/provider/profile">
                  完善展示页后邀约
                </Link>
              ) : (
                <Link className="btn primary" href={loginNextPath("creator", `/projects/${project.id}`)}>
                  免费注册/登录后发起沟通
                </Link>
              )}
              {!session ? (
                <div className="notice">
                  <UsersRound size={15} /> 你可以先查看需求、Brief Agent 和示例匹配结果；联系派单方时再注册。
                </div>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
