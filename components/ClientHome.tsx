"use client";

import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, CircleDollarSign, FileBadge2, LogIn, Plus, Search, Sparkles, TrendingUp, UsersRound } from "lucide-react";
import { CreatorCard } from "./CreatorCard";
import { ProjectCard } from "./ProjectCard";
import { loadMarketplaceData } from "@/lib/store";
import { money } from "@/lib/format";
import { roleEntryPath } from "@/lib/auth";

export function ClientHome() {
  const data = loadMarketplaceData();
  const featured = data.creators.slice(0, 3);
  const projects = data.projects.slice(0, 3);
  const intentBudget = data.orders.reduce((sum, order) => sum + order.amount, 0);
  const buyerEntry = roleEntryPath("buyer", "/post-project");
  const creatorEntry = roleEntryPath("creator", "/provider");

  return (
    <main className="main">
      <section className="hero productHero">
        <div className="heroCopy">
          <span className="eyebrow">
            <Sparkles size={15} /> AI内容生产经纪 Agent 网络
          </span>
          <div>
            <h1>灵工智创平台</h1>
            <p>免费开放入驻的AIGC供需撮合平台。派单方发布内容需求，接单方装修展示页，平台用 Agent 推荐合适的沟通对象。</p>
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
                <CheckCircle2 size={13} /> 运营中
              </span>
              <h2>Agent 运营概览</h2>
            </div>
            <TrendingUp size={22} />
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
              <CircleDollarSign size={18} />
              <strong>{money(intentBudget)}</strong>
              <span>意向预算</span>
            </div>
          </div>
          <div className="matchBoard">
            <div className="spaceBetween">
              <strong>匹配 Agent 队列</strong>
              <span className="tag blue">可解释推荐</span>
            </div>
            {featured.map((creator, index) => (
              <div className="matchRow" key={creator.id}>
                <span className="avatar">{creator.name.slice(0, 1)}</span>
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
            <h2>免费开放入驻</h2>
            <p>先完成基础资料即可加入平台；补充认证材料后获得更高曝光和主动沟通权限。</p>
          </div>
        </div>
        <div className="grid two">
          <div className="card">
            <div className="cardBody stack">
              <UsersRound size={22} />
              <strong>接单方免费入驻</strong>
              <p className="muted" style={{ margin: 0 }}>创建展示页，展示服务定位、联系方式、简历和代表作；认证通过后可主动向派单方发起沟通。</p>
              <Link className="btn primary" href={creatorEntry}>
                <LogIn size={16} /> 免费成为接单方
              </Link>
            </div>
          </div>
          <div className="card">
            <div className="cardBody stack">
              <FileBadge2 size={22} />
              <strong>派单方免费发布需求</strong>
              <p className="muted" style={{ margin: 0 }}>发布AIGC内容需求，获得10位接单方推荐，也可以在创作者信息大厅自主检索并邀请沟通。</p>
              <Link className="btn primary" href={buyerEntry}>
                <Plus size={16} /> 免费发布需求
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <div>
            <h2>公开需求</h2>
            <p>像招聘平台一样，创作者未登录也能先浏览企业发布的内容需求。</p>
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
            <p>把AIGC能力做成可比较、可检索、可联系的标准化服务展示。</p>
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
