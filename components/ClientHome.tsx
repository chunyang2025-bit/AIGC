"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Building2, CheckCircle2, GraduationCap, Handshake, LogIn, Plus, Search, Sparkles, UsersRound } from "lucide-react";
import { CreatorCard } from "./CreatorCard";
import { ProjectCard } from "./ProjectCard";
import { draftProjectBrief } from "@/lib/brief-agent";
import { categoryLabel, money } from "@/lib/format";
import { isImageValue } from "@/lib/file-upload";
import { loadMarketplaceData } from "@/lib/store";
import { loginNextPath } from "@/lib/auth";
import { saveGrowthToolDraft } from "@/lib/tool-draft";

type ToolMode = "project" | "training" | "pricing" | "course";

export function ClientHome() {
  const data = loadMarketplaceData();
  const [toolMode, setToolMode] = useState<ToolMode>("project");
  const [toolIdea, setToolIdea] = useState("我想做一组适合小红书和抖音的AIGC商品短视频，用来测试新品转化。");
  const [toolSaved, setToolSaved] = useState(false);
  const isTrainingTool = toolMode === "training" || toolMode === "course";
  const toolDraft = draftProjectBrief({
    rawIdea: toolIdea,
    productName: isTrainingTool ? "企业团队AI实战培训" : toolMode === "pricing" ? "AIGC服务采购" : "AIGC内容需求",
    audience: isTrainingTool ? "运营、市场、设计和内容团队" : "目标客户和潜在购买用户",
    channel: isTrainingTool ? "线下工作坊或线上培训" : "小红书、抖音、微信视频号",
    style: isTrainingTool ? "实操、案例驱动、可落地" : "清晰、有转化导向、适合平台传播"
  });
  const toolResult = isTrainingTool ? { ...toolDraft, category: "AIGC Training" as const } : toolDraft;
  const trainingCreators = data.creators.filter((creator) => creator.categories.includes("AIGC Training"));
  const trainingProjects = data.projects.filter((project) => project.category === "AIGC Training");
  const serviceCreators = data.creators.filter((creator) => !creator.categories.includes("AIGC Training"));
  const serviceProjects = data.projects.filter((project) => project.category !== "AIGC Training");
  const featured = [...trainingCreators, ...data.creators.filter((creator) => !creator.categories.includes("AIGC Training"))].slice(0, 3);
  const sampleProject = trainingProjects[0] ?? data.projects[0];
  const trainingDemanders = Array.from(new Set(trainingProjects.map((project) => project.buyerId)))
    .map((buyerId) => {
      const profile = (data.buyerProfiles ?? []).find((item) => item.userId === buyerId);
      const user = data.users.find((item) => item.id === buyerId);
      const relatedProjects = trainingProjects.filter((project) => project.buyerId === buyerId);
      return {
        id: buyerId,
        name: profile?.displayName ?? profile?.companyName ?? user?.name ?? "培训需求方",
        industry: profile?.industry ?? "行业待补充",
        location: profile?.location ?? "城市待补充",
        verified: profile?.verified,
        intro: profile?.profileSlogan ?? profile?.companyIntro ?? "正在寻找AIGC培训方案、课程大纲和可沟通讲师。",
        topics: relatedProjects.flatMap((project) => project.trainingRequirement?.topics ?? project.tags ?? []).slice(0, 4),
        demandCount: relatedProjects.length
      };
    })
    .slice(0, 3);
  const sampleMatches = sampleProject
    ? data.matches
        .filter((match) => match.projectId === sampleProject.id)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((match) => ({
          ...match,
          creator: data.creators.find((creator) => creator.id === match.creatorId)
        }))
        .filter((match) => match.creator)
    : [];
  const trainingEntry = loginNextPath("buyer", "/account/capabilities?intent=training_demand");
  const buyerEntry = loginNextPath("buyer", "/account/capabilities?intent=dispatch");
  const creatorEntry = loginNextPath("creator", "/account/capabilities?intent=service");
  const trainingCreatorEntry = loginNextPath("creator", "/account/capabilities?intent=training_provider");
  const toolPublishPath = isTrainingTool ? "/post-project?category=AIGC%20Training&draft=tool" : "/post-project?draft=tool";
  const toolPublishEntry = loginNextPath("buyer", toolPublishPath);
  const toolTabs: Array<{ value: ToolMode; label: string }> = [
    { value: "project", label: "项目Brief" },
    { value: "training", label: "培训需求" },
    { value: "pricing", label: "报价参考" },
    { value: "course", label: "课程大纲" }
  ];
  const pricingPackages = [
    {
      name: "轻量验证包",
      price: Math.round(toolResult.budget * 0.55 / 100) * 100,
      text: "适合先做1个方向或小批量样稿，验证风格和转化反馈。"
    },
    {
      name: "标准交付包",
      price: toolResult.budget,
      text: `覆盖${toolResult.agentBrief.deliverables.slice(0, 3).join("、")}。`
    },
    {
      name: "深度定制包",
      price: Math.round(toolResult.budget * 1.8 / 100) * 100,
      text: "适合多版本测试、定制案例、复盘优化或团队协作场景。"
    }
  ];
  const courseModules = [
    {
      name: "场景诊断",
      text: `围绕${toolResult.agentBrief.audience}梳理最值得先落地的AI应用场景。`
    },
    {
      name: "工具与流程",
      text: "演示常用AIGC工具、提示词方法和内容生产流程。"
    },
    {
      name: "岗位实操",
      text: "用企业真实任务完成一次从需求到结果的课堂练习。"
    },
    {
      name: "落地复盘",
      text: "输出课后作业、工具清单、验收标准和下一步陪跑建议。"
    }
  ];
  const toolPrimaryText = toolMode === "pricing"
    ? "注册后发布需求并匹配服务方"
    : toolMode === "course"
      ? "注册后发布培训需求"
      : "注册后发布这个需求";

  function saveCurrentToolDraft() {
    saveGrowthToolDraft({
      mode: toolMode,
      idea: toolIdea,
      result: toolResult
    });
    setToolSaved(true);
  }

  function updateToolMode(next: ToolMode) {
    setToolMode(next);
    setToolSaved(false);
  }

  function updateToolIdea(next: string) {
    setToolIdea(next);
    setToolSaved(false);
  }
  const entryCards = [
    {
      title: "我要派单",
      text: "免费发布需求，获得推荐服务方和候选对比。",
      href: buyerEntry,
      icon: BriefcaseBusiness,
      cta: "免费发布需求",
      primary: true
    },
    {
      title: "我要接单",
      text: "免费入驻服务商库，查看可接AIGC需求。",
      href: creatorEntry,
      icon: Handshake,
      cta: "免费入驻接单",
      primary: false
    },
    {
      title: "我要找培训",
      text: "发布培训需求，向讲师索要课程方案和报价。",
      href: trainingEntry,
      icon: GraduationCap,
      cta: "免费找培训",
      primary: true
    },
    {
      title: "我能提供培训",
      text: "展示讲师能力、企业案例和课件材料，获得培训线索。",
      href: trainingCreatorEntry,
      icon: UsersRound,
      cta: "入驻讲师库",
      primary: false
    }
  ];

  return (
    <main className="main">
      <section className="hero productHero">
        <div className="heroCopy">
          <span className="eyebrow">
            <Sparkles size={15} /> AIGC服务与培训双边市场
          </span>
          <div>
            <h1>AIGClancer</h1>
            <p>同时连接AIGC项目接派单、企业培训需求和可授课服务方。你可以找人交付项目，也可以找人培训团队；能交付和能授课的人都可以入驻。</p>
          </div>
          <div className="notice">
            试运营期免费发布、免费入驻。首批资料完整的服务方和培训服务方会优先进入首页与大厅推荐。
          </div>
          <div className="toolbarGroup">
            <Link className="btn primary" href={buyerEntry}>
              <BriefcaseBusiness size={16} /> 我要派单
            </Link>
            <Link className="btn" href={creatorEntry}>
              <Handshake size={16} /> 我要接单
            </Link>
            <Link className="btn" href={trainingEntry}>
              <GraduationCap size={16} /> 我要找培训
            </Link>
            <Link className="btn" href={trainingCreatorEntry}>
              <UsersRound size={16} /> 我能提供培训
            </Link>
          </div>
          <div className="heroKpis">
            <div>
              <strong>{data.creators.length}</strong>
              <span>入驻服务方</span>
            </div>
            <div>
              <strong>{data.projects.length}</strong>
              <span>公开需求</span>
            </div>
            <div>
              <strong>{trainingCreators.length}</strong>
              <span>培训服务方</span>
            </div>
          </div>
        </div>
        <aside className="opsBoard">
          <div className="opsHeader">
            <div>
              <span className="tag green">
                <CheckCircle2 size={13} /> 入驻开放
              </span>
              <h2>双市场概览</h2>
            </div>
            <Sparkles size={22} />
          </div>
          <div className="opsGrid">
            <div className="opsCell">
              <GraduationCap size={18} />
              <strong>{trainingCreators.length}</strong>
              <span>培训服务方</span>
            </div>
            <div className="opsCell">
              <BriefcaseBusiness size={18} />
              <strong>{data.projects.length}</strong>
              <span>项目/培训需求</span>
            </div>
            <div className="opsCell">
              <BriefcaseBusiness size={18} />
              <strong>{data.orders.length}</strong>
              <span>沟通线索</span>
            </div>
          </div>
          <div className="matchBoard">
            <div className="spaceBetween">
              <strong>推荐服务方</strong>
              <span className="tag blue">接单 + 培训</span>
            </div>
            {featured.map((creator, index) => (
              <div className="matchRow" key={creator.id}>
                <span className="avatar">
                  {isImageValue(creator.avatarUrl) ? <img alt={creator.name} src={creator.avatarUrl} /> : (creator.avatarUrl || creator.name).slice(0, 1)}
                </span>
                <div>
                  <strong>{creator.name}</strong>
                  <span>{creator.title}</span>
                </div>
                <b>{96 - index * 4}%</b>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="section">
        <div className="growthTool" id="growth-tool">
          <div className="stack">
            <span className="eyebrow">
              <Sparkles size={15} /> 免费工具
            </span>
            <h2>先生成一份可发布的需求，再决定要不要注册</h2>
            <p>输入一句话，先拿到项目 Brief、培训需求、报价参考或课程大纲。生成后再决定是否发布需求、匹配服务方或索要培训方案。</p>
            <div className="tabs">
              {toolTabs.map((tab) => (
                <button className={toolMode === tab.value ? "tab active" : "tab"} onClick={() => updateToolMode(tab.value)} type="button" key={tab.value}>
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="field">
              <label htmlFor="growth-tool-idea">一句话描述你的需求</label>
              <textarea
                id="growth-tool-idea"
                value={toolIdea}
                onChange={(event) => updateToolIdea(event.target.value)}
                placeholder="例如：想给电商团队做一次AI商品图和短视频脚本培训"
              />
            </div>
            <div className="toolbarGroup">
              <button className="btn" onClick={saveCurrentToolDraft} type="button">
                <CheckCircle2 size={16} /> {toolSaved ? "已保存，可继续发布" : toolMode === "course" ? "保存课程大纲" : toolMode === "pricing" ? "保存报价参考" : "保存这份Brief"}
              </button>
              <Link className="btn primary" href={toolPublishEntry} onClick={saveCurrentToolDraft}>
                <Plus size={16} /> {toolPrimaryText}
              </Link>
              <Link className="btn" href={isTrainingTool ? "/creators" : "/projects"}>
                <Search size={16} /> 先看看市场
              </Link>
            </div>
            <div className="notice">注册后会把这份结果自动带入发布表单，你只需要继续调整预算、周期和联系方式。</div>
          </div>
          <aside className="toolResult">
            <div className="spaceBetween">
              <span className="tag blue">{categoryLabel(toolResult.category)}</span>
              <span className="tag green">{money(toolResult.budget)} 参考预算</span>
            </div>
            <h3>{toolMode === "pricing" ? "AIGC服务报价参考" : toolMode === "course" ? "企业AI培训课程大纲" : toolResult.title}</h3>
            <p>{toolResult.agentBrief.objective}</p>
            {toolMode === "pricing" ? (
              <div className="grid three compactGrid">
                {pricingPackages.map((item) => (
                  <div className="toolMiniCard" key={item.name}>
                    <strong>{item.name}</strong>
                    <b>{money(item.price)}</b>
                    <p>{item.text}</p>
                  </div>
                ))}
              </div>
            ) : toolMode === "course" ? (
              <div className="grid two compactGrid">
                {courseModules.map((item) => (
                  <div className="toolMiniCard" key={item.name}>
                    <strong>{item.name}</strong>
                    <p>{item.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="briefBlock">
                <strong>{toolMode === "training" ? "建议课程/服务范围" : "建议交付范围"}</strong>
                <div className="tagList">
                  {toolResult.agentBrief.deliverables.slice(0, 5).map((item) => <span className="tag" key={item}>{item}</span>)}
                </div>
              </div>
            )}
            <div className="briefBlock">
              <strong>沟通确认点</strong>
              <ul className="cleanList">
                {toolResult.agentBrief.suggestedQuestions.slice(0, 3).map((item) => (
                  <li key={item}><CheckCircle2 size={15} /> {item}</li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
        <div className="valuePreview">
          <div className="sectionHeader">
            <div>
              <h2>注册前先看平台能给什么</h2>
              <p>游客可以先查看公开需求、服务方主页、培训需求样例、匹配结果和 Brief Agent 生成效果。</p>
            </div>
          </div>
          <div className="grid">
            <Link className="toolMiniCard" href="/projects">
              <strong>公开需求大厅</strong>
              <p>先看真实开放中的项目交付需求和企业培训需求。</p>
            </Link>
            <Link className="toolMiniCard" href="/creators">
              <strong>创作者/讲师大厅</strong>
              <p>查看服务主页、培训主页、案例、服务包报价和可接方向。</p>
            </Link>
            <Link className="toolMiniCard" href={sampleProject ? `/projects/${sampleProject.id}` : "/projects"}>
              <strong>示例培训需求</strong>
              <p>{sampleProject?.title ?? "查看企业AI培训需求如何被结构化展示。"}</p>
            </Link>
            <Link className="toolMiniCard" href={sampleProject ? `/projects/${sampleProject.id}` : "/projects"}>
              <strong>示例匹配结果</strong>
              <p>{sampleMatches.length ? sampleMatches.map((match) => match.creator!.name).join("、") : "查看系统如何推荐候选服务方。"}</p>
            </Link>
            <Link className="toolMiniCard" href="#growth-tool">
              <strong>Brief Agent 生成效果</strong>
              <p>不用注册，先把一句话想法整理成可发布的需求草稿。</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <div>
            <h2>选择你的入口</h2>
          </div>
        </div>
        <div className="grid four">
          {entryCards.map((item) => {
            const Icon = item.icon;
            return (
              <div className="card entryCard" key={item.title}>
                  <div className="cardBody stack">
                    <Icon size={22} />
                    <strong>{item.title}</strong>
                    <Link className={item.primary ? "btn primary" : "btn"} href={item.href}>
                      {item.primary ? <Plus size={16} /> : <LogIn size={16} />} {item.cta}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <div>
            <h2>两个市场同时运转</h2>
          </div>
        </div>
        <div className="grid two">
          <div className="card">
            <div className="cardBody stack">
              <BriefcaseBusiness size={22} />
              <strong>接派单市场</strong>
              <Link className="btn" href="/projects">
                <Search size={16} /> 查看项目需求
              </Link>
            </div>
          </div>
          <div className="card">
            <div className="cardBody stack">
              <GraduationCap size={22} />
              <strong>培训服务市场</strong>
              <Link className="btn" href="/creators">
                <UsersRound size={16} /> 查看培训服务方
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <div>
            <h2>项目需求大厅</h2>
          </div>
          <Link className="btn" href="/projects">
            查看全部项目需求 <ArrowRight size={16} />
          </Link>
        </div>
        <div className="jobList">
          {serviceProjects.slice(0, 3).map((project) => (
            <ProjectCard
              project={project}
              buyerName={data.users.find((user) => user.id === project.buyerId)?.name}
              publicMode
              key={project.id}
            />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <div>
            <h2>接单服务方信息</h2>
          </div>
          <Link className="btn" href="/creators">
            查看全部服务方 <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid">
          {serviceCreators.slice(0, 3).map((creator) => (
            <CreatorCard creator={creator} key={creator.id} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <div>
            <h2>培训需求大厅</h2>
          </div>
          <Link className="btn" href="/projects">
            查看全部培训需求 <ArrowRight size={16} />
          </Link>
        </div>
        <div className="jobList">
          {trainingProjects.slice(0, 3).map((project) => (
            <ProjectCard
              project={project}
              buyerName={data.users.find((user) => user.id === project.buyerId)?.name}
              publicMode
              key={project.id}
            />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <div>
            <h2>培训方信息</h2>
          </div>
          <Link className="btn" href="/creators">
            查看全部培训方 <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid">
          {trainingCreators.slice(0, 3).map((creator) => (
            <CreatorCard creator={creator} key={creator.id} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <div>
            <h2>培训需求方信息</h2>
          </div>
          <Link className="btn" href="/projects">
            查看培训需求方 <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid">
          {trainingDemanders.map((buyer) => (
            <Link className="card" href={`/buyers/${buyer.id}`} key={buyer.id}>
              <div className="cardBody stack">
                <div className="spaceBetween">
                  <Building2 size={22} />
                  <span className={buyer.verified ? "tag green" : "tag gold"}>{buyer.verified ? "已认证" : "待审核"}</span>
                </div>
                <div>
                  <h3 style={{ margin: "0 0 8px", fontSize: 20 }}>{buyer.name}</h3>
                  <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>{buyer.intro}</p>
                </div>
                <div className="tagList">
                  <span className="tag blue">{buyer.industry}</span>
                  <span className="tag">{buyer.location}</span>
                  <span className="tag green">{buyer.demandCount} 个培训需求</span>
                </div>
                {buyer.topics.length ? (
                  <div className="tagList">
                    {buyer.topics.map((topic) => <span className="tag" key={topic}>{topic}</span>)}
                  </div>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      </section>

    </main>
  );
}
