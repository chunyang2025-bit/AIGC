"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BriefcaseBusiness, Filter, GraduationCap, Plus, Search, UserCog } from "lucide-react";
import { ProjectCard } from "@/components/ProjectCard";
import { BetaNotice } from "@/components/BetaNotice";
import { loadPublicMarketplaceData } from "@/lib/store";
import { loginNextPath, readAuthSession } from "@/lib/auth";
import { creatorProjectScore, sortProjectsForCreator } from "@/lib/opportunities";

function ProjectsContent() {
  const searchParams = useSearchParams();
  const data = loadPublicMarketplaceData();
  const session = readAuthSession();
  const listType = searchParams.get("type") === "training" ? "training" : "dispatch";
  const currentCreator = data.creators.find((creator) => creator.userId === session?.userId);
  const creatorEntry = loginNextPath("creator", "/provider");
  const buyerEntry = loginNextPath("buyer", "/post-project");
  const trainingEntry = loginNextPath("buyer", "/post-project?category=AIGC%20Training");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"project" | "training" | "recommended" | "latest" | "budget" | "verified">(listType === "training" ? "training" : "project");
  const [visibleCount, setVisibleCount] = useState(12);
  const previewLimit = session ? visibleCount : Math.min(visibleCount, 6);
  const visibleProjects = useMemo(() => {
    const openProjects = data.projects.filter((project) => {
      if (project.status !== "open" && project.status !== "matching") return false;
      const text = `${project.title} ${project.description} ${(project.tags ?? []).join(" ")}`.toLowerCase();
      return !query.trim() || text.includes(query.trim().toLowerCase());
    });
    if (mode === "project") {
      return sortProjectsForCreator(openProjects, data, currentCreator, "recommended")
        .filter((project) => project.category !== "AIGC Training");
    }
    if (mode === "training") {
      return sortProjectsForCreator(
        openProjects.filter((project) => project.category === "AIGC Training"),
        data,
        currentCreator,
        "recommended"
      );
    }
    return sortProjectsForCreator(openProjects, data, currentCreator, mode);
  }, [currentCreator, data, mode, query]);
  const pagedProjects = visibleProjects.slice(0, previewLimit);
  const isTrainingList = mode === "training";
  const hasPublicProjects = pagedProjects.length > 0;

  return (
    <main className="main">
      <div className="pageHeader">
        <div>
          <h1>AIGC公开派单需求大厅</h1>
          <p>{isTrainingList ? "企业AI培训需求、内训课题和陪跑项目。" : "项目交付、内容制作、数字人与自动化工作流需求。"}</p>
        </div>
        <div className="toolbarGroup">
          <Link className="btn" href={creatorEntry}>
            <UserCog size={16} /> 我的接单后台
          </Link>
          <Link className="btn primary" href={buyerEntry}>
            <Plus size={16} /> 发布派单需求
          </Link>
          <Link className="btn" href={trainingEntry}>
            <GraduationCap size={16} /> 发布培训需求
          </Link>
        </div>
      </div>

      <BetaNotice variant={session ? "member" : "guest"} />

      <section className="publicBoardHero">
        <div>
          <span className="eyebrow">
            <BriefcaseBusiness size={15} /> {isTrainingList ? "培训需求" : "派单信息"}
          </span>
          <h2>{isTrainingList ? "先看培训需求" : "先看派单信息"}</h2>
          <p>{session ? "你可以直接查看需求、筛选机会并继续进入后台。" : "游客可优先查看部分信息；注册登录并开通能力后可查看全部并发起沟通。"}</p>
        </div>
        <div className="publicSearch">
          <Search size={18} />
          <input placeholder="搜索 短视频、商品图、数字人、PPT、文案、工作流" value={query} onChange={(event) => {
            setQuery(event.target.value);
            setVisibleCount(12);
          }} />
          <button className="btn iconOnly" title="筛选">
            <Filter size={17} />
          </button>
        </div>
        <div className="toolbarGroup">
          <button className={mode === "project" ? "btn primary" : "btn"} onClick={() => { setMode("project"); setVisibleCount(12); }} type="button">派单信息</button>
          <button className={mode === "recommended" ? "btn primary" : "btn"} onClick={() => { setMode("recommended"); setVisibleCount(12); }} type="button">推荐给我</button>
          <button className={mode === "latest" ? "btn primary" : "btn"} onClick={() => { setMode("latest"); setVisibleCount(12); }} type="button">最新发布</button>
          <button className={mode === "budget" ? "btn primary" : "btn"} onClick={() => { setMode("budget"); setVisibleCount(12); }} type="button">高预算</button>
          <button className={mode === "training" ? "btn primary" : "btn"} onClick={() => { setMode("training"); setVisibleCount(12); }} type="button">培训需求</button>
          <button className={mode === "verified" ? "btn primary" : "btn"} onClick={() => { setMode("verified"); setVisibleCount(12); }} type="button">已认证派单方</button>
        </div>
      </section>

      <div className="jobList">
        {pagedProjects.map((project) => (
          <ProjectCard
            project={project}
            buyerName={data.users.find((user) => user.id === project.buyerId)?.name}
            matchScore={currentCreator ? creatorProjectScore(currentCreator, project) : undefined}
            publicMode
            key={project.id}
          />
        ))}
      </div>
      {!hasPublicProjects ? (
        <section className="emptyState">
          <strong>{isTrainingList ? "暂时还没有公开培训需求" : "暂时还没有公开派单需求"}</strong>
          <span>这里目前还没有可展示的需求。你可以先发布第一个需求，或者稍后再来看看。</span>
          <div className="toolbarGroup">
            <Link className="btn primary" href={isTrainingList ? trainingEntry : buyerEntry}>
              <Plus size={16} /> {isTrainingList ? "发布培训需求" : "发布派单需求"}
            </Link>
            <Link className="btn" href={creatorEntry}>
              <UserCog size={16} /> 创建服务主页
            </Link>
          </div>
        </section>
      ) : null}
      {!session && visibleProjects.length > pagedProjects.length ? (
        <section className="notice stack">
          <strong>先注册再继续沟通</strong>
          <span>登录后可以收藏候选、开通接单能力，并查看全部需求。</span>
          <div className="toolbarGroup">
            <Link className="btn primary" href={creatorEntry}>继续入驻接单</Link>
            <Link className="btn" href="/account/capabilities?intent=service">查看服务方身份</Link>
          </div>
        </section>
      ) : null}
      {session && visibleProjects.length > pagedProjects.length ? (
        <div className="paginationBar">
          <span className="muted">已显示 {pagedProjects.length} / {visibleProjects.length} 个需求</span>
          <button className="btn" onClick={() => setVisibleCount((count) => count + 12)} type="button">加载更多</button>
        </div>
      ) : null}
    </main>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<main className="main"><div className="notice">正在加载派单信息...</div></main>}>
      <ProjectsContent />
    </Suspense>
  );
}
