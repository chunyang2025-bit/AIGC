"use client";

import Link from "next/link";
import { BriefcaseBusiness, Filter, Plus, Search, UserCog } from "lucide-react";
import { ProjectCard } from "@/components/ProjectCard";
import { loadMarketplaceData } from "@/lib/store";
import { roleEntryPath } from "@/lib/auth";

export default function ProjectsPage() {
  const data = loadMarketplaceData();
  const creatorEntry = roleEntryPath("creator", "/provider");
  const buyerEntry = roleEntryPath("buyer", "/post-project");

  return (
    <main className="main">
      <div className="pageHeader">
        <div>
          <h1>公开需求大厅</h1>
          <p>接单方登录后进入这里浏览公开发布的AIGC内容需求，查看详情后可表达合作意向。</p>
        </div>
        <div className="toolbarGroup">
          <Link className="btn" href={creatorEntry}>
            <UserCog size={16} /> 我要接单
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
          <h2>派单大厅</h2>
          <p>需求标题、预算、沟通期限和内容品类集中展示，适合接单方快速筛选可沟通项目。</p>
        </div>
        <div className="publicSearch">
          <Search size={18} />
          <input placeholder="搜索 AI短视频、商品图、数字人口播" />
          <button className="btn iconOnly" title="筛选">
            <Filter size={17} />
          </button>
        </div>
      </section>

      <div className="jobList">
        {data.projects.map((project) => (
          <ProjectCard
            project={project}
            buyerName={data.users.find((user) => user.id === project.buyerId)?.name}
            publicMode
            key={project.id}
          />
        ))}
      </div>
    </main>
  );
}
