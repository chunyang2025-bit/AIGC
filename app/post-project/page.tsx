"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, CheckCircle2, FileText, SendHorizonal, Sparkles } from "lucide-react";
import { draftProjectBrief, DraftBriefResult } from "@/lib/brief-agent";
import { categoryLabel, money } from "@/lib/format";
import { createProject } from "@/lib/store";
import { isApproved, readAuthSession } from "@/lib/auth";

export default function PostProjectPage() {
  const router = useRouter();
  const session = readAuthSession();
  const [rawIdea, setRawIdea] = useState("我要给一款智能台灯做小红书和抖音投放内容，突出护眼、氛围灯和桌面美学。");
  const [productName, setProductName] = useState("智能台灯");
  const [audience, setAudience] = useState("25-35岁城市白领、学生和桌搭爱好者");
  const [channel, setChannel] = useState("小红书、抖音");
  const [style, setStyle] = useState("高级、干净、有科技感，适合种草转化");
  const [referenceFile, setReferenceFile] = useState("产品图与品牌资料.zip");
  const [qualificationFile, setQualificationFile] = useState("营业执照与产品授权资料.pdf");
  const [contactEmail, setContactEmail] = useState("mira@northstar.ai");
  const [contactPhone, setContactPhone] = useState("0571-8800-1024");
  const [draft, setDraft] = useState<DraftBriefResult>(() =>
    draftProjectBrief({ rawIdea, productName, audience, channel, style })
  );

  function generateDraft() {
    setDraft(draftProjectBrief({ rawIdea, productName, audience, channel, style }));
  }

  return (
    <main className="main">
      <div className="pageHeader">
        <div>
          <h1>需求发布 Agent</h1>
          <p>用对话式输入生成结构化 Brief，再进入创作者智能匹配，系统会先推荐10位可邀约创作者。</p>
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
              <h2 style={{ margin: "12px 0 0", fontSize: 26 }}>{draft.title}</h2>
            </div>
            <div className="grid two">
              <div className="metric">
                <strong>{money(draft.budget)}</strong>
                <span>Agent建议预算</span>
              </div>
              <div className="metric">
                <strong>{draft.deadline.slice(5)}</strong>
                <span>建议沟通期限</span>
              </div>
            </div>
            <div className="briefBlock">
              <strong>结构化需求</strong>
              <p>{draft.description}</p>
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
                if (!isApproved(session)) return;
                const { project } = createProject({
                  title: draft.title,
                  description: draft.description,
                  category: draft.category,
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
              disabled={!isApproved(session)}
            >
              <SendHorizonal size={16} /> {isApproved(session) ? "确认并启动匹配 Agent" : "审核通过后可发布需求"}
            </button>
            {!isApproved(session) ? <div className="notice">当前主体主页正在审核，审核通过后才能正式发布需求。</div> : null}
          </div>
        </aside>
      </div>
    </main>
  );
}
