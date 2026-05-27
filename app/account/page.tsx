"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, Clock, MessageSquare, ShieldCheck, UserRound } from "lucide-react";
import { compactDate, money, orderStatusLabel, projectStatusLabel } from "@/lib/format";
import { loadMarketplaceData } from "@/lib/store";
import { readAuthSession } from "@/lib/auth";

function statusText(hasProfile: boolean, verified?: boolean) {
  if (!hasProfile) return "未开通";
  return verified ? "已通过审核" : "待平台审核";
}

function statusClass(hasProfile: boolean, verified?: boolean) {
  if (!hasProfile) return "tag";
  return verified ? "tag green" : "tag gold";
}

export default function AccountPage() {
  const router = useRouter();
  const session = readAuthSession();
  const data = loadMarketplaceData();
  const buyerProfile = data.buyerProfiles?.find((profile) => profile.userId === session?.userId);
  const creatorProfile = data.creators.find((creator) => creator.userId === session?.userId);

  useEffect(() => {
    if (!session) {
      router.push("/login");
    }
  }, [router, session]);

  if (!session) return null;

  const subjectName = buyerProfile?.displayName ?? creatorProfile?.displayName ?? session.name ?? session.email;
  const myProjects = data.projects.filter((project) => project.buyerId === session.userId);
  const myBuyerLeads = data.orders.filter((order) => order.buyerId === session.userId);
  const myCreatorLeads = creatorProfile ? data.orders.filter((order) => order.creatorId === creatorProfile.id) : [];

  return (
    <main className="main">
      <section className="portalHero">
        <div className="stack">
          <span className="eyebrow">
            <ShieldCheck size={15} /> 主体中心
          </span>
          <div>
            <h1>{subjectName}</h1>
            <p>一个账号对应一个主体。你可以分别管理派单能力和接单能力，在这里查看我的派单、我的接单和审核状态。</p>
          </div>
        </div>
        <div className="portalStats">
          <div className="metric">
            <strong>{buyerProfile ? 1 : 0}</strong>
            <span>派单能力</span>
          </div>
          <div className="metric">
            <strong>{creatorProfile ? 1 : 0}</strong>
            <span>接单能力</span>
          </div>
          <div className="metric">
            <strong>{[buyerProfile, creatorProfile].filter(Boolean).length}</strong>
            <span>已开通能力</span>
          </div>
        </div>
      </section>

      <div className="grid two">
        <section className="card">
          <div className="cardBody stack">
            <div className="spaceBetween">
              <BriefcaseBusiness size={22} />
              <span className={statusClass(Boolean(buyerProfile), buyerProfile?.verified)}>
                {statusText(Boolean(buyerProfile), buyerProfile?.verified)}
              </span>
            </div>
            <div>
              <h2 style={{ margin: 0 }}>派单能力</h2>
              <p className="muted">发布需求、启动 Brief Agent、查看匹配推荐并邀请创作者沟通。</p>
            </div>
            <div className="toolbarGroup">
              <Link className="btn primary" href={buyerProfile?.verified ? "/buyer" : "/buyer/profile"}>
                {buyerProfile ? "查看/编辑派单资料" : "开通派单能力"}
              </Link>
              <Link className="btn" href={buyerProfile?.verified ? "/post-project" : "/buyer/profile"}>
                {buyerProfile?.verified ? "发布需求" : "补充认证"}
              </Link>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="cardBody stack">
            <div className="spaceBetween">
              <UserRound size={22} />
              <span className={statusClass(Boolean(creatorProfile), creatorProfile?.verified)}>
                {statusText(Boolean(creatorProfile), creatorProfile?.verified)}
              </span>
            </div>
            <div>
              <h2 style={{ margin: 0 }}>接单能力</h2>
              <p className="muted">装修创作者展示页，进入需求大厅，向派单方发送主页、简历和代表作。</p>
            </div>
            <div className="toolbarGroup">
              <Link className="btn primary" href={creatorProfile?.verified ? "/provider" : "/provider/profile"}>
                {creatorProfile ? "查看/编辑接单资料" : "开通接单能力"}
              </Link>
              <Link className="btn" href="/projects">浏览需求</Link>
            </div>
          </div>
        </section>
      </div>

      <div className="grid two">
        <section className="card">
          <div className="panelTop">
            <div>
              <strong>我的派单</strong>
              <div className="muted">查看已发布需求、匹配推荐和沟通线索。</div>
            </div>
            <BriefcaseBusiness size={18} />
          </div>
          <div className="cardBody stack">
            <div className="grid two compactGrid">
              <div className="metric">
                <strong>{myProjects.length}</strong>
                <span>已发布需求</span>
              </div>
              <div className="metric">
                <strong>{myBuyerLeads.length}</strong>
                <span>沟通线索</span>
              </div>
            </div>
            {myProjects.slice(0, 3).map((project) => (
              <Link className="miniLead" href={`/buyer/projects/${project.id}`} key={project.id}>
                <span>{project.title}</span>
                <em>{projectStatusLabel(project.status)} · {money(project.budget)} · {compactDate(project.createdAt)}</em>
              </Link>
            ))}
            {myProjects.length === 0 ? <div className="muted">通过审核后发布第一个需求。</div> : null}
            <div className="toolbarGroup">
              <Link className="btn primary" href={buyerProfile?.verified ? "/buyer" : "/buyer/profile"}>
                进入我的派单
              </Link>
              <Link className="btn" href={buyerProfile?.verified ? "/post-project" : "/buyer/profile"}>
                {buyerProfile?.verified ? "发布需求" : "完善派单认证"}
              </Link>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="panelTop">
            <div>
              <strong>我的接单</strong>
              <div className="muted">查看展示页、收到的邀约和接单沟通。</div>
            </div>
            <MessageSquare size={18} />
          </div>
          <div className="cardBody stack">
            <div className="grid two compactGrid">
              <div className="metric">
                <strong>{creatorProfile ? 1 : 0}</strong>
                <span>展示页</span>
              </div>
              <div className="metric">
                <strong>{myCreatorLeads.length}</strong>
                <span>沟通线索</span>
              </div>
            </div>
            {myCreatorLeads.slice(0, 3).map((lead) => {
              const project = data.projects.find((item) => item.id === lead.projectId);
              return (
                <Link className="miniLead" href={`/orders/${lead.id}`} key={lead.id}>
                  <span>{project?.title ?? "需求沟通"}</span>
                  <em>{orderStatusLabel(lead.status)} · {money(lead.amount)} · {compactDate(lead.createdAt)}</em>
                </Link>
              );
            })}
            {creatorProfile ? (
              <Link className="miniLead" href={`/creators/${creatorProfile.id}`}>
                <span>{creatorProfile.displayName ?? creatorProfile.name}</span>
                <em>{creatorProfile.verified ? "已认证展示页" : "展示页待审核"}</em>
              </Link>
            ) : (
              <div className="muted">开通接单能力后，这里会显示你的展示页和沟通线索。</div>
            )}
            <div className="toolbarGroup">
              <Link className="btn primary" href={creatorProfile?.verified ? "/provider" : "/provider/profile"}>
                进入我的接单
              </Link>
              <Link className="btn" href="/projects">
                浏览需求
              </Link>
            </div>
          </div>
        </section>
      </div>

      <section className="notice">
        <Clock size={15} /> 派单方需完成主体资质审核后才能发布需求；接单方审核通过后可主动发起沟通。
      </section>
    </main>
  );
}
