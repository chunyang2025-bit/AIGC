"use client";

import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, CircleDollarSign, LogIn, Plus, Search, Sparkles, TrendingUp, UsersRound } from "lucide-react";
import { CreatorCard } from "./CreatorCard";
import { ProjectCard } from "./ProjectCard";
import { monthlyActiveUsers } from "@/lib/analytics";
import { loadMarketplaceData } from "@/lib/store";
import { money } from "@/lib/format";
import { roleEntryPath } from "@/lib/auth";

export function ClientHome() {
  const data = loadMarketplaceData();
  const featured = data.creators.slice(0, 3);
  const projects = data.projects.slice(0, 3);
  const intentBudget = data.orders.reduce((sum, order) => sum + order.amount, 0);
  const buyerMau = monthlyActiveUsers(data, "buyer");
  const creatorMau = monthlyActiveUsers(data, "creator");
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
            <p>用需求发布 Agent 拆解 Brief，用匹配 Agent 推荐创作者，平台只促成双方建立联系。</p>
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
              <strong>{buyerMau}</strong>
              <span>需求方月活</span>
            </div>
            <div>
              <strong>{creatorMau}</strong>
              <span>创作者月活</span>
            </div>
            <div>
              <strong>{money(intentBudget)}</strong>
              <span>意向预算</span>
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
              <strong>{data.orders.length}</strong>
              <span>合作线索</span>
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
            <h2>派单信息</h2>
            <p>公开展示部分派单需求，登录后可查看完整需求和派单方主页。</p>
          </div>
          <Link className="btn" href="/projects">
            查看所有 <ArrowRight size={16} />
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
            <h2>接单信息</h2>
            <p>公开展示部分接单方能力信息，登录后可查看完整装修页和代表作。</p>
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
