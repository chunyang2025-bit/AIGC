"use client";

import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, FileBadge2, LogIn, Plus, Search, Sparkles, UsersRound } from "lucide-react";
import { CreatorCard } from "./CreatorCard";
import { ProjectCard } from "./ProjectCard";
import { isImageValue } from "@/lib/file-upload";
import { loadMarketplaceData } from "@/lib/store";
import { loginNextPath } from "@/lib/auth";

export function ClientHome() {
  const data = loadMarketplaceData();
  const featured = data.creators.slice(0, 3);
  const projects = data.projects.slice(0, 3);
  const buyerEntry = loginNextPath("buyer", "/post-project");
  const creatorEntry = loginNextPath("creator", "/provider");

  return (
    <main className="main">
      <section className="hero productHero">
        <div className="heroCopy">
          <span className="eyebrow">
            <Sparkles size={15} /> AIGC供需撮合平台
          </span>
          <div>
            <h1>AIGClancer</h1>
            <p>连接真实内容需求与AIGC创作者。派单方发布需求，接单方展示能力，双方在平台上建立合作沟通。</p>
          </div>
          <div className="toolbarGroup">
            <Link className="btn primary" href="/projects">
              <Search size={16} /> 浏览公开需求
            </Link>
            <Link className="btn" href={creatorEntry}>
              <LogIn size={16} /> 我要接单
            </Link>
            <Link className="btn" href={buyerEntry}>
              <Plus size={16} /> 我要派单
            </Link>
          </div>
          <div className="heroKpis">
            <div>
              <strong>{data.creators.length}</strong>
              <span>入驻接单方</span>
            </div>
            <div>
              <strong>{data.projects.length}</strong>
              <span>公开需求</span>
            </div>
            <div>
              <strong>{data.orders.length}</strong>
              <span>沟通线索</span>
            </div>
          </div>
        </div>
        <aside className="opsBoard">
          <div className="opsHeader">
            <div>
              <span className="tag green">
                <CheckCircle2 size={13} /> 入驻开放
              </span>
              <h2>平台概览</h2>
            </div>
            <Sparkles size={22} />
          </div>
          <div className="opsGrid">
            <div className="opsCell">
              <UsersRound size={18} />
              <strong>{data.creators.length}</strong>
              <span>入驻创作者</span>
            </div>
            <div className="opsCell">
              <BriefcaseBusiness size={18} />
              <strong>{data.projects.length}</strong>
              <span>发布需求</span>
            </div>
            <div className="opsCell">
              <BriefcaseBusiness size={18} />
              <strong>{data.orders.length}</strong>
              <span>沟通线索</span>
            </div>
          </div>
          <div className="matchBoard">
            <div className="spaceBetween">
              <strong>推荐接单方</strong>
              <span className="tag blue">按需求匹配</span>
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
        <div className="sectionHeader">
          <div>
            <h2>入驻 AIGClancer</h2>
            <p>派单方完成资质审核后发布真实需求；接单方可先展示能力，再补充认证提升曝光。</p>
          </div>
        </div>
        <div className="grid two">
          <div className="card">
            <div className="cardBody stack">
              <UsersRound size={22} />
              <strong>我要接单</strong>
              <p className="muted" style={{ margin: 0 }}>创建展示页，展示服务定位、联系方式、简历和代表作，获取更多内容需求机会。</p>
              <Link className="btn primary" href={creatorEntry}>
                <LogIn size={16} /> 我要接单
              </Link>
            </div>
          </div>
          <div className="card">
            <div className="cardBody stack">
              <FileBadge2 size={22} />
              <strong>我要派单</strong>
              <p className="muted" style={{ margin: 0 }}>完成主体认证后发布AIGC内容需求，获得接单方推荐，也可以自主检索并邀请沟通。</p>
              <Link className="btn primary" href={buyerEntry}>
                <Plus size={16} /> 我要派单
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <div>
            <h2>公开需求</h2>
            <p>浏览正在开放沟通的AIGC内容需求。</p>
          </div>
          <Link className="btn" href="/projects">
            查看全部需求 <ArrowRight size={16} />
          </Link>
        </div>
        <div className="jobList">
          {projects.map((project) => (
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
            <h2>精选创作者</h2>
            <p>查看已入驻接单方的服务方向、案例能力和沟通响应。</p>
          </div>
          <Link className="btn" href="/creators">
            查看所有 <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid">
          {featured.map((creator) => (
            <CreatorCard creator={creator} key={creator.id} />
          ))}
        </div>
      </section>

    </main>
  );
}
