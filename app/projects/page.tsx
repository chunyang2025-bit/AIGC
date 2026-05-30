"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BriefcaseBusiness, Filter, Plus, Search, UserCog } from "lucide-react";
import { ProjectCard } from "@/components/ProjectCard";
import { loadMarketplaceData } from "@/lib/store";
import { loginNextPath, readAuthSession } from "@/lib/auth";
import { creatorProjectScore, sortProjectsForCreator } from "@/lib/opportunities";

export default function ProjectsPage() {
  const data = loadMarketplaceData();
  const session = readAuthSession();
  const currentCreator = data.creators.find((creator) => creator.userId === session?.userId);
  const creatorEntry = loginNextPath("creator", "/provider");
  const buyerEntry = loginNextPath("buyer", "/post-project");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"recommended" | "latest" | "budget" | "verified">("recommended");
  const visibleProjects = useMemo(() => {
    const openProjects = data.projects.filter((project) => {
      const text = `${project.title} ${project.description} ${(project.tags ?? []).join(" ")}`.toLowerCase();
      return !query.trim() || text.includes(query.trim().toLowerCase());
    });
    return sortProjectsForCreator(openProjects, data, currentCreator, mode);
  }, [currentCreator, data, mode, query]);

  return (
    <main className="main">
      <div className="pageHeader">
        <div>
          <h1>公开需求大厅</h1>
          <p>接单方登录后进入这里浏览需求发布方开放的AIGC内容需求，查看详情后可表达合作意向。</p>
        </div>
        <div className="toolbarGroup">
          <Link className="btn" href={creatorEntry}>
            <UserCog size={16} /> 我的接单后台
          </Link>
          <Link className="btn primary" href={buyerEntry}>
            <Plus size={16} /> 发布需求
          </Link>
        </div>
      </div>

      <section className="publicBoardHero">
        <div>
          <span className="eyebrow">
            <BriefcaseBusiness size={15} /> 类招聘平台的公开机会列表
          </span>
          <h2>需求大厅</h2>
          <p>需求标题、预算、沟通期限和内容品类集中展示，适合接单方快速筛选可沟通项目。</p>
        </div>
        <div className="publicSearch">
          <Search size={18} />
          <input placeholder="搜索 AI短视频、商品图、数字人口播" value={query} onChange={(event) => setQuery(event.target.value)} />
          <button className="btn iconOnly" title="筛选">
            <Filter size={17} />
          </button>
        </div>
        <div className="toolbarGroup">
          <button className={mode === "recommended" ? "btn primary" : "btn"} onClick={() => setMode("recommended")} type="button">推荐给我</button>
          <button className={mode === "latest" ? "btn primary" : "btn"} onClick={() => setMode("latest")} type="button">最新发布</button>
          <button className={mode === "budget" ? "btn primary" : "btn"} onClick={() => setMode("budget")} type="button">高预算</button>
          <button className={mode === "verified" ? "btn primary" : "btn"} onClick={() => setMode("verified")} type="button">已认证派单方</button>
        </div>
      </section>

      <div className="jobList">
        {visibleProjects.map((project) => (
          <ProjectCard
            project={project}
            buyerName={data.users.find((user) => user.id === project.buyerId)?.name}
            matchScore={currentCreator ? creatorProjectScore(currentCreator, project) : undefined}
            publicMode
            key={project.id}
          />
        ))}
      </div>
    </main>
  );
}
