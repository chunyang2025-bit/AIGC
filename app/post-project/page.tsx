"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, CheckCircle2, FileText, SendHorizonal, Sparkles } from "lucide-react";
import { draftProjectBrief, DraftBriefResult } from "@/lib/brief-agent";
import { categoryLabel } from "@/lib/format";
import { projectCategoryOptions } from "@/lib/project-categories";
import { createProject, loadMarketplaceData } from "@/lib/store";
import { isApproved, readAuthSession } from "@/lib/auth";
import { ProjectCategory } from "@/lib/types";

export default function PostProjectPage() {
  const router = useRouter();
  const session = readAuthSession();
  const data = loadMarketplaceData();
  const buyerProfile = data.buyerProfiles?.find((profile) => profile.userId === session?.userId);
  const approved = buyerProfile?.verified ?? isApproved(session);
  const [rawIdea, setRawIdea] = useState("我要给一款智能台灯做小红书和抖音投放内容，突出护眼、氛围灯和桌面美学。");
  const [productName, setProductName] = useState("智能台灯");
  const [audience, setAudience] = useState("25-35岁城市白领、学生和桌搭爱好者");
  const [channel, setChannel] = useState("小红书、抖音");
  const [style, setStyle] = useState("高级、干净、有科技感，适合种草转化");
  const [referenceFile, setReferenceFile] = useState("产品图与品牌资料.zip");
  const [qualificationFile, setQualificationFile] = useState("营业执照与产品授权资料.pdf");
  const [contactEmail, setContactEmail] = useState("mira@northstar.ai");
  const [contactPhone, setContactPhone] = useState("0571-8800-1024");
  const [tagDraft, setTagDraft] = useState("");
  const [projectTags, setProjectTags] = useState<string[]>(["小红书种草", "护眼产品", "桌面美学"]);
  const [draft, setDraft] = useState<DraftBriefResult>(() =>
    draftProjectBrief({ rawIdea, productName, audience, channel, style })
  );

  function generateDraft() {
    setDraft(draftProjectBrief({ rawIdea, productName, audience, channel, style }));
  }

  function updateDraftField<K extends keyof DraftBriefResult>(key: K, value: DraftBriefResult[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function addProjectTag() {
    const next = tagDraft.trim();
    if (!next) return;
    setProjectTags((current) => current.includes(next) ? current : [...current, next]);
    setTagDraft("");
  }

  function removeProjectTag(tag: string) {
    setProjectTags((current) => current.filter((item) => item !== tag));
  }

  return (
    <main className="main">
      <div className="pageHeader">
        <div>
          <h1>需求发布 Agent</h1>
          <p>用对话式输入生成结构化 Brief。你可以手动调整标题、预算和周期，再进入创作者匹配。</p>
        </div>
      </div>

      <div className="agentLayout">
        <section className="card">
          <div className="panelTop">
            <div className="row">
              <span className="avatar">
                <Bot size={18} />
              </span>
              <div>
                <strong>Brief Agent</strong>
                <div className="muted">自动拆解目标、渠道、成果范围、预算和沟通要点</div>
              </div>
            </div>
            <span className="tag green">
              <Sparkles size={13} /> Agent生成
            </span>
          </div>
          <div className="cardBody form">
            <div className="field">
              <label htmlFor="idea">一句话描述你的需求</label>
              <textarea
                id="idea"
                value={rawIdea}
                onChange={(event) => setRawIdea(event.target.value)}
                placeholder="例如：我要给新品做一组短视频和商品图，用于小红书种草。"
              />
            </div>
            <div className="grid two">
              <div className="field">
                <label htmlFor="product">产品/服务名称</label>
                <input id="product" value={productName} onChange={(event) => setProductName(event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="channel">发布渠道</label>
                <input id="channel" value={channel} onChange={(event) => setChannel(event.target.value)} />
              </div>
            </div>
            <div className="grid two">
              <div className="field">
                <label htmlFor="audience">目标用户</label>
                <input id="audience" value={audience} onChange={(event) => setAudience(event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="style">风格偏好</label>
                <input id="style" value={style} onChange={(event) => setStyle(event.target.value)} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="project-category">需求类型</label>
              <select
                id="project-category"
                value={draft.category}
                onChange={(event) => {
                  const nextCategory = event.target.value as ProjectCategory;
                  setDraft((current) => ({ ...current, category: nextCategory }));
                }}
              >
                {projectCategoryOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
              <span className="fieldHint">Agent 会自动判断类型，你也可以手动调整。</span>
            </div>
            <div className="field">
              <label htmlFor="project-tags">需求标签</label>
              <div className="tagEditor">
                <div className="tagList">
                  {projectTags.map((tag) => (
                    <button className="tag removableTag" key={tag} onClick={() => removeProjectTag(tag)} type="button">
                      {tag} ×
                    </button>
                  ))}
                </div>
                <div className="tagInputRow">
                  <input
                    id="project-tags"
                    placeholder="输入自定义标签，例如：新品首发"
                    value={tagDraft}
                    onChange={(event) => setTagDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addProjectTag();
                      }
                    }}
                  />
                  <button className="btn" onClick={addProjectTag} type="button">添加标签</button>
                </div>
              </div>
            </div>
            <div className="field">
              <label htmlFor="reference">参考文件</label>
              <input id="reference" value={referenceFile} onChange={(event) => setReferenceFile(event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="qualification">营业执照/有效资质</label>
              <input id="qualification" value={qualificationFile} onChange={(event) => setQualificationFile(event.target.value)} />
            </div>
            <div className="grid two">
              <div className="field">
                <label htmlFor="contact-email">联系邮箱</label>
                <input id="contact-email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="contact-phone">联系电话</label>
                <input id="contact-phone" value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} />
              </div>
            </div>
            <button className="btn" type="button" onClick={generateDraft}>
              <Sparkles size={16} /> 重新生成 Brief
            </button>
          </div>
        </section>

        <aside className="card agentPreview">
          <div className="panelTop">
            <div>
              <strong>Agent 生成结果</strong>
              <div className="muted">确认后将进入匹配 Agent 推荐</div>
            </div>
            <FileText size={18} />
          </div>
          <div className="cardBody stack">
            <div>
              <span className="tag blue">{categoryLabel(draft.category)}</span>
              <div className="field" style={{ marginTop: 12 }}>
                <label htmlFor="draft-title">需求标题</label>
                <input id="draft-title" value={draft.title} onChange={(event) => updateDraftField("title", event.target.value)} />
              </div>
            </div>
            <div className="grid two">
              <div className="field">
                <label htmlFor="draft-budget">意向预算</label>
                <input
                  id="draft-budget"
                  inputMode="numeric"
                  value={draft.budget}
                  onChange={(event) => updateDraftField("budget", Number(event.target.value) || 0)}
                />
              </div>
              <div className="field">
                <label htmlFor="draft-deadline">沟通期限</label>
                <input id="draft-deadline" type="date" value={draft.deadline} onChange={(event) => updateDraftField("deadline", event.target.value)} />
              </div>
            </div>
            <div className="briefBlock">
              <strong>结构化需求</strong>
              <textarea value={draft.description} onChange={(event) => updateDraftField("description", event.target.value)} />
            </div>
            <div className="notice">
              平台只提供信息展示、智能匹配和沟通留痕，不托管资金，不参与合同、交易、交付和售后纠纷。
            </div>
            <div className="briefBlock">
              <strong>成果范围</strong>
              <div className="tagList">
                {draft.agentBrief.deliverables.map((item) => (
                  <span className="tag green" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="briefBlock">
              <strong>沟通确认点</strong>
              <ul className="cleanList">
                {draft.agentBrief.acceptanceCriteria.map((item) => (
                  <li key={item}>
                    <CheckCircle2 size={15} /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <button
              className="btn primary"
              onClick={() => {
                if (!approved) return;
                const { project } = createProject({
                  title: draft.title,
                  description: draft.description,
                  category: draft.category,
                  tags: projectTags,
                  budget: draft.budget,
                  deadline: draft.deadline,
                  referenceFile,
                  qualificationFile,
                  contactEmail,
                  contactPhone,
                  agentBrief: draft.agentBrief
                });
                router.push(`/buyer/projects/${project.id}`);
              }}
              disabled={!approved}
            >
              <SendHorizonal size={16} /> {approved ? "确认并启动匹配 Agent" : "审核通过后可发布需求"}
            </button>
            {!approved ? <div className="notice">当前主体主页正在审核，审核通过后才能正式发布需求。</div> : null}
          </div>
        </aside>
      </div>
    </main>
  );
}
