"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, MessageSquarePlus, Plus, RotateCcw, Search, UserCog, UsersRound } from "lucide-react";
import { CreatorCard } from "@/components/CreatorCard";
import { categoryLabel } from "@/lib/format";
import { projectCategories } from "@/lib/project-categories";
import { inviteCreator, loadMarketplaceData } from "@/lib/store";
import { ProjectCategory } from "@/lib/types";
import { isApproved, loginNextPath, readAuthSession } from "@/lib/auth";
import { isCandidateCreator, readCandidateCreatorIds, toggleCandidateCreator } from "@/lib/candidates";

const categories: Array<ProjectCategory | "All"> = ["All", ...projectCategories];

function CreatorsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const data = loadMarketplaceData();
  const session = readAuthSession();
  const projectId = searchParams.get("project");
  const project = projectId ? data.projects.find((item) => item.id === projectId) : null;
  const [category, setCategory] = useState<ProjectCategory | "All">(project?.category ?? "All");
  const [budget, setBudget] = useState("all");
  const [sort, setSort] = useState("recommended");
  const [query, setQuery] = useState("");
  const [candidateIds, setCandidateIds] = useState<string[]>(project ? readCandidateCreatorIds(project.id) : []);
  const creatorEntry = loginNextPath("creator", "/provider");
  const buyerEntry = loginNextPath("buyer", "/post-project");

  const creators = useMemo(() => {
    const filtered = data.creators.filter((creator) => {
      const matchesCategory = category === "All" || creator.categories.includes(category);
      const matchesBudget =
        budget === "all" ||
        (budget === "low" && creator.priceMin <= 800) ||
        (budget === "mid" && creator.priceMax >= 2000 && creator.priceMin <= 6000) ||
        (budget === "high" && creator.priceMax >= 8000);
      const haystack = `${creator.name} ${creator.title} ${creator.location} ${creator.bio} ${creator.skills.join(" ")} ${creator.portfolio.join(" ")}`.toLowerCase();
      return matchesCategory && matchesBudget && haystack.includes(query.toLowerCase());
    });

    return filtered.sort((a, b) => {
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "projects") return b.completedProjects - a.completedProjects;
      if (sort === "price_low") return a.priceMin - b.priceMin;
      if (project) {
        const aCategory = a.categories.includes(project.category) ? 1 : 0;
        const bCategory = b.categories.includes(project.category) ? 1 : 0;
        return bCategory - aCategory || b.rating - a.rating;
      }
      return b.completedProjects - a.completedProjects;
    });
  }, [budget, category, data.creators, project, query, sort]);

  function invite(creatorId: string) {
    if (!project) {
      router.push("/login");
      return;
    }
    const buyerProfile = data.buyerProfiles?.find((profile) => profile.userId === session?.userId);
    if (!(buyerProfile?.verified ?? isApproved(session))) {
      router.push("/account/profile");
      return;
    }
    const order = inviteCreator(project.id, creatorId);
    if (order) {
      router.push(`/orders/${order.id}`);
    }
  }

  return (
    <main className="main">
      <div className="pageHeader">
        <div>
          <h1>创作者信息大厅</h1>
          <p>派单方可自主检索所有接单方信息，查看技能、案例、价格、评分和履约记录，并主动邀请沟通。</p>
        </div>
        <div className="toolbarGroup">
          <button className="btn" onClick={() => router.push(creatorEntry)} type="button">
            <UserCog size={16} /> 我要接单
          </button>
          <button className="btn primary" onClick={() => router.push(buyerEntry)} type="button">
            <Plus size={16} /> 发布需求
          </button>
        </div>
      </div>

      {project ? (
        <section className="creatorHallNotice">
          <div>
            <span className="tag green">
              <UsersRound size={13} /> 正在为需求检索创作者
            </span>
            <h2>{project.title}</h2>
            <p>你可以使用 Agent 推荐，也可以在信息大厅中自主搜索并邀请创作者推进下一步工作。</p>
          </div>
          <button className="btn primary" onClick={() => router.push(`/projects/${project.id}`)}>
            返回匹配结果
          </button>
          <button className="btn" onClick={() => router.push(`/buyer/projects/${project.id}`)} type="button">
            候选池 {candidateIds.length}
          </button>
        </section>
      ) : null}

      <div className="toolbar">
        <div className="toolbarGroup">
          <div className="field" style={{ minWidth: 280 }}>
            <label htmlFor="creator-search">搜索</label>
            <input
              id="creator-search"
              placeholder="搜索地区、技能、工作室、案例"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="category">品类</label>
            <select id="category" value={category} onChange={(event) => setCategory(event.target.value as ProjectCategory | "All")}>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item === "All" ? "全部品类" : categoryLabel(item)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="budget">报价</label>
            <select id="budget" value={budget} onChange={(event) => setBudget(event.target.value)}>
              <option value="all">全部报价</option>
              <option value="low">入门预算</option>
              <option value="mid">中等预算</option>
              <option value="high">高预算服务</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="sort">排序</label>
            <select id="sort" value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="recommended">综合推荐</option>
              <option value="rating">评分最高</option>
              <option value="projects">完成项目最多</option>
              <option value="price_low">起步价最低</option>
            </select>
          </div>
        </div>
        <div className="toolbarGroup">
          <button className="btn iconOnly" title="应用筛选">
            <Filter size={17} />
          </button>
          <button
            className="btn iconOnly"
            title="重置筛选"
            onClick={() => {
              setCategory(project?.category ?? "All");
              setBudget("all");
              setSort("recommended");
              setQuery("");
            }}
          >
            <RotateCcw size={17} />
          </button>
          <button className="btn iconOnly" title="搜索创作者">
            <Search size={17} />
          </button>
        </div>
      </div>

      <div className="sectionHeader">
        <div>
          <h2>{creators.length} 位接单方</h2>
          <p>信息大厅展示全部可检索创作者，派单方可主动邀请交流。</p>
        </div>
        {project ? (
          <span className="tag blue">
            <MessageSquarePlus size={13} /> 可直接邀请
          </span>
        ) : null}
      </div>

      <div className="grid">
        {creators.map((creator) => (
          <CreatorCard
            creator={creator}
            key={creator.id}
            onInvite={project ? () => invite(creator.id) : undefined}
            onToggleCandidate={project ? () => setCandidateIds(toggleCandidateCreator(project.id, creator.id)) : undefined}
            candidateSelected={project ? isCandidateCreator(project.id, creator.id) : false}
          />
        ))}
      </div>
    </main>
  );
}

export default function CreatorsPage() {
  return (
    <Suspense fallback={<main className="main"><div className="notice">正在加载创作者信息大厅...</div></main>}>
      <CreatorsContent />
    </Suspense>
  );
}
