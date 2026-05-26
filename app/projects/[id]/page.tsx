"use client";

import { FormEvent, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { ArrowLeft, Bot, Building2, CheckCircle2, FileBadge2, FileText, Link2, Send } from "lucide-react";
import Link from "next/link";
import { categoryLabel, compactDate, money, projectStatusLabel } from "@/lib/format";
import { expressInterestInProject, loadMarketplaceData } from "@/lib/store";
import { isApproved, readAuthSession } from "@/lib/auth";

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

  if (!session) {
    router.push("/login");
    return null;
  }

  const projectId = project.id;
  const buyerProfile = (data.buyerProfiles ?? []).find((profile) => profile.userId === project.buyerId);
  const buyerName = buyerProfile?.displayName ?? buyerProfile?.companyName ?? data.users.find((user) => user.id === project.buyerId)?.name ?? "需求发布方";

  function submitInterest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentCreator || !currentCreator.verified) return;

    const order = expressInterestInProject(projectId, currentCreator.id, {
      intro
    });
    if (order) {
      router.push(`/orders/${order.id}`);
    }
  }

  return (
    <main className="main">
      <div className="toolbar">
        <Link className="btn" href="/projects">
          <ArrowLeft size={16} /> 返回需求
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
            </div>
          </article>
        </section>

        <aside className="stack">
          <section className="card">
            <div className="cardBody stack">
              <div>
                <h2 style={{ margin: 0, fontSize: 22 }}>向派单方发起沟通</h2>
                <p className="muted" style={{ margin: "8px 0 0", lineHeight: 1.55 }}>
                  直接发送你装修好的展示页。展示页内已包含主体资质、联系方式、简历/履历和代表作。
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
                  <div className="notice">
                    <Link2 size={15} /> 将发送展示页：/creators/{currentCreator.id}
                  </div>
                  {currentCreator.verified ? (
                    <button className="btn primary" type="submit">
                      <Send size={16} /> 发送我的展示页并邀约聊天
                    </button>
                  ) : (
                    <div className="notice">
                      当前账号资料已提交审核。审核通过后才能向派单方发起沟通。
                    </div>
                  )}
                </form>
              ) : session?.role === "creator" ? (
                <Link className="btn primary" href="/provider/profile">
                  完善展示页后邀约
                </Link>
              ) : (
                <Link className="btn primary" href="/login?role=accept">
                  接单方登录后邀约
                </Link>
              )}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
