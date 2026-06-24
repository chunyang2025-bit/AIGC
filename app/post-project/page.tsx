"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bot, CheckCircle2, FileText, SendHorizonal, Sparkles } from "lucide-react";
import { draftProjectBrief, DraftBriefResult } from "@/lib/brief-agent";
import { categoryLabel } from "@/lib/format";
import { deliverableTypeOptions, projectUseCaseOptions, urgencyOptions } from "@/lib/growth-taxonomy";
import { projectCategoryOptions } from "@/lib/project-categories";
import { trainingFormatLabel, trainingFormatOptions } from "@/lib/training";
import { createProject, loadMarketplaceData, resubmitProject } from "@/lib/store";
import { readAuthSession } from "@/lib/auth";
import { DeliverableType, ProjectCategory, ProjectUrgency, ProjectUseCase, TrainingFormat } from "@/lib/types";
import { projectCompleteness } from "@/lib/growth";
import { BetaNotice } from "@/components/BetaNotice";
import { clearGrowthToolDraft, readGrowthToolDraft } from "@/lib/tool-draft";
import { readRemixDraft } from "@/lib/remix-draft";

function PostProjectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = readAuthSession();
  const data = loadMarketplaceData();
  const buyerProfile = data.buyerProfiles?.find((profile) => profile.userId === session?.userId);
  const verified = Boolean(buyerProfile?.verified);
  const editProjectId = searchParams.get("edit");
  const editProject = editProjectId ? data.projects.find((project) => project.id === editProjectId && project.buyerId === session?.userId) : undefined;
  const editMode = Boolean(editProject);
  const draftSource = searchParams.get("draft");
  const startsAsTraining = !editProject && searchParams.get("category") === "AIGC Training";
  const presetInput = startsAsTraining
    ? {
        rawIdea: "希望为团队做一场AIGC实战培训，覆盖提示词、AI商品内容、短视频脚本和日常提效工具，最好能结合真实业务案例。",
        productName: "企业团队AIGC实战内训",
        audience: "运营、市场、设计和内容团队",
        channel: "线下工作坊或线上培训",
        style: "实操、案例驱动、可落地"
      }
    : {
        rawIdea: "我要给一款智能台灯做小红书和抖音投放内容，突出护眼、氛围灯和桌面美学。",
        productName: "智能台灯",
        audience: "25-35岁城市白领、学生和桌搭爱好者",
        channel: "小红书、抖音",
        style: "高级、干净、有科技感，适合种草转化"
      };
  const initialBrief = editProject?.agentBrief ?? draftProjectBrief({
    rawIdea: editProject?.description ?? presetInput.rawIdea,
    productName: editProject?.title ?? presetInput.productName,
    audience: presetInput.audience,
    channel: presetInput.channel,
    style: presetInput.style
  }).agentBrief;
  const [rawIdea, setRawIdea] = useState(editProject?.description ?? presetInput.rawIdea);
  const [productName, setProductName] = useState(editProject?.title ?? presetInput.productName);
  const [audience, setAudience] = useState(initialBrief.audience);
  const [channel, setChannel] = useState(presetInput.channel);
  const [style, setStyle] = useState(initialBrief.style);
  const [referenceFile, setReferenceFile] = useState(editProject?.referenceFile ?? (startsAsTraining ? "企业业务案例与培训目标说明.docx" : "产品图与品牌资料.zip"));
  const [qualificationFile, setQualificationFile] = useState(editProject?.qualificationFile ?? "营业执照与产品授权资料.pdf");
  const [contactEmail, setContactEmail] = useState(editProject?.contactEmail ?? buyerProfile?.contactEmail ?? "mira@northstar.ai");
  const [contactPhone, setContactPhone] = useState(editProject?.contactPhone ?? buyerProfile?.contactPhone ?? "0571-8800-1024");
  const [tagDraft, setTagDraft] = useState("");
  const [projectTags, setProjectTags] = useState<string[]>(editProject?.tags ?? (startsAsTraining ? ["企业内训", "提示词", "AI提效", "工作坊"] : ["小红书种草", "护眼产品", "桌面美学"]));
  const [useCase, setUseCase] = useState<ProjectUseCase>(editProject?.useCase ?? (startsAsTraining ? "training" : "marketing"));
  const [deliverableTypes, setDeliverableTypes] = useState<DeliverableType[]>(editProject?.deliverableTypes ?? (startsAsTraining ? ["other"] : ["video"]));
  const [urgency, setUrgency] = useState<ProjectUrgency>(editProject?.urgency ?? (startsAsTraining ? "this_week" : "normal"));
  const [needInvoice, setNeedInvoice] = useState(Boolean(editProject?.needInvoice));
  const [longTerm, setLongTerm] = useState(Boolean(editProject?.longTerm));
  const [acceptPlatformRecommend, setAcceptPlatformRecommend] = useState(editProject?.acceptPlatformRecommend ?? true);
  const [trainingTopics, setTrainingTopics] = useState((editProject?.trainingRequirement?.topics ?? (startsAsTraining ? ["提示词工程", "AI办公提效", "AI营销内容"] : [])).join("、"));
  const [trainingAudience, setTrainingAudience] = useState(editProject?.trainingRequirement?.audience ?? (startsAsTraining ? "运营、市场、设计和内容团队" : ""));
  const [trainingHeadcount, setTrainingHeadcount] = useState(editProject?.trainingRequirement?.headcount ? String(editProject.trainingRequirement.headcount) : startsAsTraining ? "30" : "");
  const [trainingFormat, setTrainingFormat] = useState<TrainingFormat>(editProject?.trainingRequirement?.format ?? (startsAsTraining ? "workshop" : "online"));
  const [trainingCity, setTrainingCity] = useState(editProject?.trainingRequirement?.city ?? (startsAsTraining ? "上海/全国线上" : ""));
  const [trainingDuration, setTrainingDuration] = useState(editProject?.trainingRequirement?.duration ?? (startsAsTraining ? "1天工作坊" : ""));
  const [trainingGoal, setTrainingGoal] = useState(editProject?.trainingRequirement?.goal ?? (startsAsTraining ? "让团队能把AI工具落到真实业务中，形成可复用的提示词、内容模板和协作流程。" : ""));
  const [needCustomCases, setNeedCustomCases] = useState(editProject?.trainingRequirement?.needCustomCases ?? true);
  const [needTrainingMaterials, setNeedTrainingMaterials] = useState(editProject?.trainingRequirement?.needMaterials ?? true);
  const [loadedToolDraft, setLoadedToolDraft] = useState(false);
  const [loadedRemixSource, setLoadedRemixSource] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [draft, setDraft] = useState<DraftBriefResult>(() =>
    editProject
      ? {
          title: editProject.title,
          description: editProject.description,
          category: editProject.category,
          budget: editProject.budget,
          deadline: editProject.deadline,
          agentBrief: initialBrief
        }
      : (() => {
          const generated = draftProjectBrief({ rawIdea, productName, audience, channel, style });
          return {
            ...generated,
            category: startsAsTraining ? "AIGC Training" : generated.category
          };
        })()
  );
  const completeness = projectCompleteness({
    title: draft.title,
    description: draft.description,
    budget: draft.budget,
    deadline: draft.deadline,
    referenceFile,
    qualificationFile,
    contactEmail,
    contactPhone,
    tags: projectTags,
    agentBrief: draft.agentBrief
  });
  const canPublish = Boolean(buyerProfile) && completeness.score >= 80;

  useEffect(() => {
    if (editProject || draftSource !== "tool") return;
    const savedDraft = readGrowthToolDraft();
    if (!savedDraft) return;
    const fromTrainingTool = savedDraft.mode === "training" || savedDraft.mode === "course" || savedDraft.result.category === "AIGC Training";
    const nextResult: DraftBriefResult = fromTrainingTool
      ? { ...savedDraft.result, category: "AIGC Training" }
      : savedDraft.result;
    setRawIdea(savedDraft.idea);
    setProductName(savedDraft.result.title);
    setAudience(savedDraft.result.agentBrief.audience);
    setStyle(savedDraft.result.agentBrief.style);
    setChannel(fromTrainingTool ? "线下工作坊或线上培训" : "小红书、抖音、微信视频号");
    setDraft(nextResult);
    setProjectTags(fromTrainingTool ? ["企业内训", "AIGC培训", "AI提效"] : [categoryLabel(nextResult.category), "Brief Agent生成"]);
    setUseCase(fromTrainingTool ? "training" : "marketing");
    setDeliverableTypes(fromTrainingTool ? ["other"] : ["video"]);
    setUrgency(fromTrainingTool ? "this_week" : "normal");
    setReferenceFile(fromTrainingTool ? "待补充：企业业务案例与培训目标说明" : "待补充：产品图、品牌资料或参考链接");
    if (fromTrainingTool) {
      setTrainingTopics(nextResult.agentBrief.deliverables.join("、"));
      setTrainingAudience(nextResult.agentBrief.audience);
      setTrainingGoal(nextResult.agentBrief.objective);
      setTrainingDuration(savedDraft.mode === "course" ? "可沟通：半日/1天/多次课" : "1天工作坊");
      setTrainingCity("全国线上/可沟通线下城市");
    }
    setLoadedToolDraft(true);
  }, [draftSource, editProject]);

  useEffect(() => {
    if (editProject || searchParams.get("remix") !== "project") return;
    const remix = readRemixDraft();
    if (!remix || remix.type !== "project") return;
    const source = remix.project;
    setRawIdea(source.description);
    setProductName(source.title);
    setAudience(source.agentBrief?.audience ?? (source.trainingRequirement?.audience || presetInput.audience));
    setChannel(source.category === "AIGC Training" ? "线下工作坊或线上培训" : presetInput.channel);
    setStyle(source.agentBrief?.style ?? presetInput.style);
    setDraft({
      title: `${source.title}（参考发布）`,
      description: source.description,
      category: source.category,
      budget: source.budget,
      deadline: source.deadline,
      agentBrief: source.agentBrief ?? draftProjectBrief({
        rawIdea: source.description,
        productName: source.title,
        audience: source.trainingRequirement?.audience || presetInput.audience,
        channel: source.category === "AIGC Training" ? "线下工作坊或线上培训" : presetInput.channel,
        style: presetInput.style
      }).agentBrief
    });
    setProjectTags([...(source.tags ?? []), "参考发布"].filter(Boolean));
    setUseCase(source.useCase ?? (source.category === "AIGC Training" ? "training" : "marketing"));
    setDeliverableTypes(source.deliverableTypes?.length ? source.deliverableTypes : source.category === "AIGC Training" ? ["other"] : ["video"]);
    setUrgency(source.urgency ?? "normal");
    setNeedInvoice(Boolean(source.needInvoice));
    setLongTerm(Boolean(source.longTerm));
    setAcceptPlatformRecommend(source.acceptPlatformRecommend ?? true);
    if (source.trainingRequirement) {
      setTrainingTopics(source.trainingRequirement.topics.join("、"));
      setTrainingAudience(source.trainingRequirement.audience);
      setTrainingHeadcount(source.trainingRequirement.headcount ? String(source.trainingRequirement.headcount) : "");
      setTrainingFormat(source.trainingRequirement.format);
      setTrainingCity(source.trainingRequirement.city ?? "");
      setTrainingDuration(source.trainingRequirement.duration ?? "");
      setTrainingGoal(source.trainingRequirement.goal);
      setNeedCustomCases(source.trainingRequirement.needCustomCases);
      setNeedTrainingMaterials(source.trainingRequirement.needMaterials);
    }
    setLoadedRemixSource(remix.sourceTitle);
  }, [editProject, presetInput.audience, presetInput.channel, presetInput.style, searchParams]);

  function generateDraft() {
    const generated = draftProjectBrief({ rawIdea, productName, audience, channel, style });
    setDraft({
      ...generated,
      category: startsAsTraining ? "AIGC Training" : generated.category
    });
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

  function toggleDeliverableType(value: DeliverableType) {
    setDeliverableTypes((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  }

  const selectedDeliverableTypes = deliverableTypes.length ? deliverableTypes : ["video" as const];
  const isTrainingProject = draft.category === "AIGC Training";
  const trainingRequirement = isTrainingProject
    ? {
        topics: trainingTopics.split(/[,，、\n]/).map((item) => item.trim()).filter(Boolean),
        audience: trainingAudience,
        headcount: Number(trainingHeadcount) || undefined,
        format: trainingFormat,
        city: trainingCity,
        duration: trainingDuration,
        goal: trainingGoal,
        needCustomCases,
        needMaterials: needTrainingMaterials
      }
    : undefined;

  return (
    <main className="main">
      <div className="pageHeader">
        <div>
          <span className="eyebrow">
            <Bot size={15} /> 真实后端发布
          </span>
          <h1>{startsAsTraining || editProject?.category === "AIGC Training" ? "培训需求发布 Agent" : "项目需求发布 Agent"}</h1>
          <p>{editMode ? "修改后重新提交。试运营期间可先查看匹配并邀请服务方，未认证状态会保留风险提示。" : startsAsTraining ? "免费提交培训需求，重点填写培训对象、人数、主题、形式、城市、时长和目标，再匹配培训服务方。" : "免费提交项目交付需求，用对话式输入生成结构化 Brief。你可以手动调整标题、意向预算、交付物和周期，再进入试运营匹配。"}</p>
        </div>
        <div className="publishHeaderMeta">
          <div className="miniInfo">
            <strong>后端写入</strong>
            <span>点击提交后会调用 `/api/projects` 写入项目表并生成推荐。</span>
          </div>
          <div className="miniInfo">
            <strong>可见反馈</strong>
            <span>失败原因会直接显示，不再静默回落到本地假成功。</span>
          </div>
        </div>
      </div>

      <BetaNotice variant={session ? "member" : "guest"} />
      {editProject?.rejectedReason ? <div className="notice">上次审核意见：{editProject.rejectedReason}</div> : null}
      {loadedToolDraft ? <div className="notice">已带入你在首页生成的 Brief。可以继续调整标题、交付范围、预算、周期和联系方式，再提交需求。</div> : null}
      {loadedRemixSource ? <div className="notice">已参考「{loadedRemixSource}」生成发布草稿。请替换成你的真实业务背景、素材范围、预算和联系方式后再提交。</div> : null}
      <div className="notice">
        {isTrainingProject
          ? "当前使用培训模板：适合企业内训、工作坊、训练营和长期陪跑。"
          : "当前使用项目交付模板：适合图片设计、AI短视频、数字人口播、文案、PPT、工作流等成果交付。"}
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
                <div className="muted">自动拆解目标、渠道、成果范围、意向预算和沟通要点</div>
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
            <div className="grid two">
              <div className="field">
                <label htmlFor="project-use-case">主要用途</label>
                <select id="project-use-case" value={useCase} onChange={(event) => setUseCase(event.target.value as ProjectUseCase)}>
                  {projectUseCaseOptions.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="project-urgency">沟通节奏</label>
                <select id="project-urgency" value={urgency} onChange={(event) => setUrgency(event.target.value as ProjectUrgency)}>
                  {urgencyOptions.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field">
              <label>希望交付什么</label>
              <div className="tagList">
                {deliverableTypeOptions.map((item) => (
                  <button className={deliverableTypes.includes(item.value) ? "tag green" : "tag"} key={item.value} onClick={() => toggleDeliverableType(item.value)} type="button">
                    {item.label}
                  </button>
                ))}
              </div>
              {!deliverableTypes.length ? <span className="fieldHint">未选择时会默认按短视频需求进行匹配。</span> : null}
            </div>
            {isTrainingProject ? (
              <div className="briefBlock">
                <div className="spaceBetween">
                  <strong>培训需求画像</strong>
                  <span className="tag blue">AIGC培训</span>
                </div>
                <div className="field">
                  <label htmlFor="training-topics">希望培训主题</label>
                  <input id="training-topics" value={trainingTopics} onChange={(event) => setTrainingTopics(event.target.value)} placeholder="提示词、AI办公、AI营销、AI设计、AI视频、数字人" />
                </div>
                <div className="grid two compactGrid">
                  <div className="field">
                    <label htmlFor="training-audience">培训对象</label>
                    <input id="training-audience" value={trainingAudience} onChange={(event) => setTrainingAudience(event.target.value)} placeholder="市场团队、管理层、设计团队、教师等" />
                  </div>
                  <div className="field">
                    <label htmlFor="training-headcount">预计人数</label>
                    <input id="training-headcount" inputMode="numeric" value={trainingHeadcount} onChange={(event) => setTrainingHeadcount(event.target.value)} placeholder="例如：30" />
                  </div>
                </div>
                <div className="grid three compactGrid">
                  <div className="field">
                    <label htmlFor="training-format">培训形式</label>
                    <select id="training-format" value={trainingFormat} onChange={(event) => setTrainingFormat(event.target.value as TrainingFormat)}>
                      {trainingFormatOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="training-city">城市</label>
                    <input id="training-city" value={trainingCity} onChange={(event) => setTrainingCity(event.target.value)} placeholder="线上可写全国" />
                  </div>
                  <div className="field">
                    <label htmlFor="training-duration">期望时长</label>
                    <input id="training-duration" value={trainingDuration} onChange={(event) => setTrainingDuration(event.target.value)} placeholder="半天、1天、3周陪跑" />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="training-goal">培训目标</label>
                  <textarea id="training-goal" value={trainingGoal} onChange={(event) => setTrainingGoal(event.target.value)} placeholder="希望团队学完后能解决什么问题，或落地到哪些业务场景" />
                </div>
                <div className="tagList">
                  <button className={needCustomCases ? "tag green" : "tag"} onClick={() => setNeedCustomCases((value) => !value)} type="button">
                    {needCustomCases ? "已选择" : "可选"} · 需要企业定制案例
                  </button>
                  <button className={needTrainingMaterials ? "tag green" : "tag"} onClick={() => setNeedTrainingMaterials((value) => !value)} type="button">
                    {needTrainingMaterials ? "已选择" : "可选"} · 需要课件/练习材料
                  </button>
                </div>
              </div>
            ) : null}
            <div className="tagList">
              <button className={longTerm ? "tag green" : "tag"} onClick={() => setLongTerm((value) => !value)} type="button">
                {longTerm ? "已选择" : "可选"} · 可能长期合作
              </button>
              <button className={needInvoice ? "tag green" : "tag"} onClick={() => setNeedInvoice((value) => !value)} type="button">
                {needInvoice ? "已选择" : "可选"} · 需要发票/合同
              </button>
              <button className={acceptPlatformRecommend ? "tag green" : "tag"} onClick={() => setAcceptPlatformRecommend((value) => !value)} type="button">
                {acceptPlatformRecommend ? "已选择" : "可选"} · 接受平台推荐
              </button>
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
            <div className="briefBlock">
              <strong>匹配画像</strong>
              <div className="tagList">
                <span className="tag blue">{projectUseCaseOptions.find((item) => item.value === useCase)?.label}</span>
                <span className="tag blue">{urgencyOptions.find((item) => item.value === urgency)?.label}</span>
                {selectedDeliverableTypes.map((item) => (
                  <span className="tag green" key={item}>
                    {deliverableTypeOptions.find((option) => option.value === item)?.label ?? item}
                  </span>
                ))}
                {longTerm ? <span className="tag">长期合作</span> : null}
                {needInvoice ? <span className="tag">需要发票/合同</span> : null}
                {acceptPlatformRecommend ? <span className="tag">接受平台推荐</span> : null}
                {trainingRequirement ? <span className="tag blue">{trainingFormatLabel(trainingRequirement.format)} · {trainingRequirement.headcount ? `${trainingRequirement.headcount}人` : "人数待定"}</span> : null}
              </div>
            </div>
            <div className="notice">
              当前免费发布需求。意向预算仅用于匹配和沟通参考，平台不托管资金，不参与合同、交易、交付和售后纠纷。
            </div>
            <div className="publishStatusBar">
              <span className={submitState === "success" ? "tag green" : submitState === "error" ? "tag gold" : submitState === "submitting" ? "tag blue" : "tag"}>
                {submitState === "success" ? "已提交" : submitState === "error" ? "提交失败" : submitState === "submitting" ? "正在提交" : "等待提交"}
              </span>
              <span className="muted">
                {submitMessage || (canPublish ? "点击后会真正调用后端写入需求，若 Supabase / 账号 / 配置有问题，这里会直接提示原因。" : "先补全需求，满足完整度后再提交。")}
              </span>
            </div>
            <div className="briefBlock">
              <div className="spaceBetween">
                <strong>需求完整度</strong>
                <span className={completeness.score >= 80 ? "tag green" : "tag gold"}>{completeness.score}%</span>
              </div>
              <div className="tagList">
                {completeness.items.map((item) => (
                  <span className={item.done ? "tag green" : "tag"} key={item.label}>
                    {item.done ? "已完成" : "待补充"} · {item.label}
                  </span>
                ))}
              </div>
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
              onClick={async () => {
                if (!canPublish) return;
                setSubmitState("submitting");
                setSubmitMessage("正在写入后端并生成推荐结果...");
                const payload = {
                  title: draft.title,
                  description: draft.description,
                  category: draft.category,
                  tags: projectTags,
                  useCase,
                  deliverableTypes: selectedDeliverableTypes,
                  urgency,
                  needInvoice,
                  longTerm,
                  acceptPlatformRecommend,
                  trainingRequirement,
                  budget: draft.budget,
                  deadline: draft.deadline,
                  referenceFile,
                  qualificationFile,
                  contactEmail,
                  contactPhone,
                  agentBrief: draft.agentBrief
                };
                try {
                  const result = editProject ? await resubmitProject(editProject.id, payload) : await createProject(payload);
                  if (!result) {
                    setSubmitState("error");
                    setSubmitMessage("后端没有返回结果，请稍后重试。若你看到的是本地草稿，说明当前没有连到真实 API。");
                    return;
                  }
                  clearGrowthToolDraft();
                  setSubmitState("success");
                  setSubmitMessage(editMode ? "需求已重新提交，正在进入审核队列。" : "需求已提交，正在进入审核队列。");
                  router.push(`/buyer/projects/${result.project.id}`);
                } catch (error) {
                  setSubmitState("error");
                  setSubmitMessage(error instanceof Error ? error.message : "需求提交失败，请稍后重试。");
                }
              }}
              disabled={!canPublish}
            >
              <SendHorizonal size={16} /> {canPublish ? (editMode ? "重新提交需求" : "提交需求并试用匹配") : buyerProfile ? "补全需求后提交" : "先完善主体主页"}
            </button>
            {canPublish ? <div className="notice">试运营期间提交后可先查看推荐并发起沟通；未审核、未认证会显示风险提示，审核通过后再进入公开大厅。</div> : null}
            {buyerProfile && !verified ? <div className="notice">当前主体主页未审核、未认证。可以先试用发布和匹配，查看具体联系方式或推进正式合作时会引导认证。</div> : null}
            {buyerProfile && completeness.score < 80 ? <div className="notice">需求完整度达到 80% 后才能提交。建议补充联系方式、参考资料、资质材料和清晰描述。</div> : null}
          </div>
        </aside>
      </div>
    </main>
  );
}

export default function PostProjectPage() {
  return (
    <Suspense fallback={<main className="main"><div className="notice">正在加载需求发布 Agent...</div></main>}>
      <PostProjectContent />
    </Suspense>
  );
}
