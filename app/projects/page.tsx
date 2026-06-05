"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BriefcaseBusiness, Filter, GraduationCap, Plus, Search, UserCog } from "lucide-react";
import { ProjectCard } from "@/components/ProjectCard";
import { BetaNotice } from "@/components/BetaNotice";
import { loadMarketplaceData } from "@/lib/store";
import { loginNextPath, readAuthSession } from "@/lib/auth";
import { creatorProjectScore, sortProjectsForCreator } from "@/lib/opportunities";

export default function ProjectsPage() {
  const data = loadMarketplaceData();
  const session = readAuthSession();
  const currentCreator = data.creators.find((creator) => creator.userId === session?.userId);
  const creatorEntry = loginNextPath("creator", "/provider");
  const buyerEntry = loginNextPath("buyer", "/post-project");
  const trainingEntry = loginNextPath("buyer", "/post-project?category=AIGC%20Training");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"project" | "training" | "recommended" | "latest" | "budget" | "verified">("project");
  const [visibleCount, setVisibleCount] = useState(12);
  const visibleProjects = useMemo(() => {
    const openProjects = data.projects.filter((project) => {
      if (project.status !== "open" && project.status !== "matching") return false;
      const text = `${project.title} ${project.description} ${(project.tags ?? []).join(" ")}`.toLowerCase();
      return !query.trim() || text.includes(query.trim().toLowerCase());
    });
    if (mode === "project") {
      return sortProjectsForCreator(openProjects, data, currentCreator, "recommended")
        .sort((a, b) => Number(a.category === "AIGC Training") - Number(b.category === "AIGC Training"));
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
  const pagedProjects = visibleProjects.slice(0, visibleCount);

  return (
    <main className="main">
      <div className="pageHeader">
        <div>
          <h1>AIGC公开派单需求大厅</h1>
          <p>默认优先展示图片设计、短视频、数字人、文案、PPT和工作流等项目交付需求；培训需求保留为独立筛选。</p>
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

      <BetaNotice />

      <section className="publicBoardHero">
        <div>
          <span className="eyebrow">
            <BriefcaseBusiness size={15} /> 类招聘平台的公开机会列表
          </span>
          <h2>先看可接项目</h2>
          <p>项目交付需求是当前主市场：服务方可以先判断预算、周期、交付物和匹配度，再决定是否沟通。</p>
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
          <button className={mode === "project" ? "btn primary" : "btn"} onClick={() => { setMode("project"); setVisibleCount(12); }} type="button">派单优先</button>
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
      {visibleCount < visibleProjects.length ? (
        <div className="paginationBar">
          <span className="muted">已显示 {pagedProjects.length} / {visibleProjects.length} 个需求</span>
          <button className="btn" onClick={() => setVisibleCount((count) => count + 12)} type="button">加载更多</button>
        </div>
      ) : null}
    </main>
  );
}
