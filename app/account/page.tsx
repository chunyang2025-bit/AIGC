"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, CheckCircle2, Clock, FileBadge2, MessageSquare, ShieldCheck, UserRound } from "lucide-react";
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
  const hasSubjectProfile = Boolean(buyerProfile || creatorProfile);
  const subjectVerified = Boolean(buyerProfile?.verified || creatorProfile?.verified);
  const pendingReview = hasSubjectProfile && !subjectVerified;
  const myProjects = data.projects.filter((project) => project.buyerId === session.userId);
  const myBuyerLeads = data.orders.filter((order) => order.buyerId === session.userId);
  const myCreatorLeads = creatorProfile ? data.orders.filter((order) => order.creatorId === creatorProfile.id) : [];
  const activationSteps = [
    { label: "注册账号", done: true, href: "/account" },
    { label: "完善主体主页", done: hasSubjectProfile, href: "/account/profile" },
    { label: "提交资质审核", done: hasSubjectProfile, href: "/account/profile" },
    { label: "平台审核通过", done: subjectVerified, href: "/account" },
    { label: "开通派单/接单", done: Boolean(buyerProfile || creatorProfile), href: "/account/capabilities" },
    { label: "完成首次沟通", done: myBuyerLeads.length + myCreatorLeads.length > 0, href: buyerProfile ? "/buyer" : "/provider" }
  ];

  return (
    <main className="main">
      <section className="portalHero">
        <div className="stack">
          <span className="eyebrow">
            <ShieldCheck size={15} /> 主体总控台
          </span>
          <div>
            <h1>{subjectName}</h1>
            <p>先维护一份主体主页，再选择开通派单能力、接单能力，或同时开通两种能力。</p>
          </div>
        </div>
        <div className="portalStats">
          <div className="metric">
            <strong>{hasSubjectProfile ? 1 : 0}</strong>
            <span>主体主页</span>
          </div>
          <div className="metric">
            <strong>{subjectVerified ? 1 : 0}</strong>
            <span>主体审核</span>
          </div>
          <div className="metric">
            <strong>{[buyerProfile, creatorProfile].filter(Boolean).length}</strong>
            <span>已开通能力</span>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="cardBody stack">
          <div className="spaceBetween">
            <div>
              <h2 style={{ margin: 0 }}>入驻进度</h2>
              <p className="muted">新主体按这个顺序完成入驻。审核通过前可以继续完善资料和浏览公开信息。</p>
            </div>
            <span className={subjectVerified ? "tag green" : pendingReview ? "tag gold" : "tag"}>
              {subjectVerified ? "已完成入驻" : pendingReview ? "审核中" : "待完善"}
            </span>
          </div>
          <div className="grid six">
            {activationSteps.map((step, index) => (
              <Link className="metric" href={step.href} key={step.label}>
                {index === 0 ? <CheckCircle2 size={18} /> : index === 1 ? <FileBadge2 size={18} /> : index === 3 ? <ShieldCheck size={18} /> : <UserRound size={18} />}
                <strong>{step.done ? "已完成" : `第${index + 1}步`}</strong>
                <span>{step.label}</span>
              </Link>
            ))}
          </div>
          {pendingReview ? (
            <section className="notice">
              <Clock size={15} /> 资料已提交平台审核。预计1-2个工作日内完成；如被驳回，运营后台会记录原因，你可以回到主体主页修改后再次提交。
            </section>
          ) : null}
          {!hasSubjectProfile ? (
            <section className="notice">
              <CheckCircle2 size={15} /> 建议先创建主体主页。主页完成后再选择开通派单能力、接单能力，或两种能力同时开通。
            </section>
          ) : null}
        </div>
      </section>

      <section className="card">
        <div className="cardBody stack">
          <div className="spaceBetween">
            <ShieldCheck size={22} />
            <span className={statusClass(hasSubjectProfile, subjectVerified)}>
              {statusText(hasSubjectProfile, subjectVerified)}
            </span>
          </div>
          <div>
            <h2 style={{ margin: 0 }}>主体主页</h2>
            <p className="muted">名称、头像/Logo、主体类型、城市、基本介绍、联系方式和资质材料只维护一次，派单和接单共用。</p>
          </div>
          <div className="toolbarGroup">
            <Link className="btn primary" href="/account/profile">
              {hasSubjectProfile ? "查看/编辑主体主页" : "创建主体主页"}
            </Link>
            <Link className="btn" href="/account/capabilities">
              选择开通能力
            </Link>
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
              <p className="muted">完善主体认证后发布需求、查看匹配推荐，并邀请接单方沟通。</p>
            </div>
            <div className="toolbarGroup">
              <Link className="btn primary" href={buyerProfile?.verified ? "/buyer" : "/account/capabilities"}>
                {buyerProfile ? "进入/开通派单能力" : "先完善主体主页"}
              </Link>
              <Link className="btn" href={buyerProfile?.verified ? "/post-project" : "/account/profile"}>
                {buyerProfile?.verified ? "发布需求" : "补充主体资料"}
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
              <p className="muted">完善展示页和资质认证后进入需求大厅，向派单方发送主页、简历和代表作。</p>
            </div>
            <div className="toolbarGroup">
              <Link className="btn primary" href={creatorProfile?.verified ? "/provider" : "/account/capabilities"}>
                {creatorProfile ? "进入/开通接单能力" : "先完善主体主页"}
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
              <Link className="btn primary" href={buyerProfile?.verified ? "/buyer" : "/account/capabilities"}>
                进入我的派单
              </Link>
              <Link className="btn" href={buyerProfile?.verified ? "/post-project" : "/account/profile"}>
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
              <Link className="btn primary" href={creatorProfile?.verified ? "/provider" : "/account/capabilities"}>
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
