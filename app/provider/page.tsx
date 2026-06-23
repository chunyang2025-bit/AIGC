"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Banknote, BriefcaseBusiness, CalendarDays, CheckCircle2, Copy, FileText, FileUp, Inbox, Search, SendHorizonal, Star, UserRound } from "lucide-react";
import { categoryLabel, compactDate, money, orderStatusLabel } from "@/lib/format";
import { isImageValue } from "@/lib/file-upload";
import { loadMarketplaceData } from "@/lib/store";
import { readAuthSession } from "@/lib/auth";
import { creatorProjectScore, creatorServiceConversion, opportunityPools } from "@/lib/opportunities";
import { FirstActionPanel } from "@/components/FirstActionPanel";
import { CreatorProfile, Order, Project, ProjectMatch } from "@/lib/types";

export default function ProviderPortalPage() {
  const router = useRouter();
  const [session] = useState(() => readAuthSession());
  const [data, setData] = useState(() => loadMarketplaceData());
  const [creator, setCreator] = useState<CreatorProfile | null>(() => data.creators.find((item) => item.userId === session?.userId) ?? null);
  const [leads, setLeads] = useState<Order[]>(() => {
    const currentCreator = data.creators.find((item) => item.userId === session?.userId);
    return currentCreator ? data.orders.filter((order) => order.creatorId === currentCreator.id) : [];
  });
  const [matches, setMatches] = useState<ProjectMatch[]>(() => {
    const currentCreator = data.creators.find((item) => item.userId === session?.userId);
    return currentCreator ? data.matches.filter((match) => match.creatorId === currentCreator.id) : [];
  });
  useEffect(() => {
    if (!session) {
      router.push("/login?role=accept");
      return;
    }

    if (!creator) {
      router.push("/account/capabilities?intent=service");
    }
  }, [creator, router, session]);

  useEffect(() => {
    if (!session?.accessToken) return;

    let active = true;

    fetch("/api/account/state", {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${session.accessToken}`
      }
    })
      .then((response) => response.json().catch(() => null))
      .then((payload) => {
        if (!active || !payload?.ok || !payload.data) return;
        const next = payload.data as {
          creatorProfile: CreatorProfile | null;
          creatorOrders: Order[];
          matches: ProjectMatch[];
          notificationsData: ReturnType<typeof loadMarketplaceData>;
        };
        setCreator(next.creatorProfile);
        setLeads(next.creatorOrders);
        setMatches(next.matches);
        setData(next.notificationsData);
      })
      .catch(() => null);

    return () => {
      active = false;
    };
  }, [session?.accessToken]);

  if (!session || !creator) {
    return null;
  }

  const verified = Boolean(creator?.verified);
  const recommendedOpportunities = matches
    .map((match) => ({
      match,
      project: data.projects.find((project) => project.id === match.projectId)
    }))
    .filter((item) => item.project);
  const intentBudget = leads.reduce((sum, order) => sum + order.amount, 0);
  const pools = opportunityPools(data, creator);
  const serviceConversion = creatorServiceConversion(creator);
  const profileUrl = typeof window === "undefined" ? `/creators/${creator.id}` : `${window.location.origin}/creators/${creator.id}`;
  const topOpportunity = pools.recommended[0];
  const nextFollowUp = pools.followUp[0];
  const nextFollowUpProject = nextFollowUp ? data.projects.find((project) => project.id === nextFollowUp.projectId) : undefined;
  const firstProfileAction = pools.profileActions.find((action) => !action.done);
  const hasTrainingProfile = Boolean(creator.categories.includes("AIGC Training") && creator.trainingProfile?.topics?.length);
  const hasServicePackage = Boolean(creator.servicePackages?.length || (creator.priceMin && creator.priceMax));
  const hasPortfolio = Boolean(creator.portfolioItems?.length || creator.portfolio.length);
  const providerFirstAction = !verified
    ? {
        title: "先补齐服务主页，提高认证通过率",
        description: "试运营期间可先浏览需求并发起沟通。补齐服务定位、案例、报价和联系方式，会降低未认证带来的信任风险。",
        primaryLabel: "完善服务主页",
        primaryHref: "/provider/profile",
        secondaryLabel: "先看公开需求",
        secondaryHref: "/projects"
      }
    : !hasServicePackage
      ? {
          title: "先设置服务包或报价，让派单方能判断预算",
          description: "服务包会直接影响需求方是否愿意邀请你沟通。先给一个可理解的起步价、交付范围和周期。",
          primaryLabel: "补充服务包报价",
          primaryHref: "/provider/profile",
          secondaryLabel: "查看需求大厅",
          secondaryHref: "/projects"
        }
      : !hasPortfolio
        ? {
            title: "补充代表作，让主页可以发给客户看",
            description: "有案例的主页更容易被信任，也更适合你主动分享到社群、朋友圈或老客户。",
            primaryLabel: "补充代表作",
            primaryHref: "/provider/profile",
            secondaryLabel: "复制主页链接",
            secondaryHref: `/creators/${creator.id}`
          }
        : !leads.length
          ? {
              title: "处理一个高匹配机会，产生第一条线索",
              description: topOpportunity ? `优先查看「${topOpportunity.title}」，它和你的能力标签匹配度较高。` : "公开需求会按你的能力和服务范围推荐，先浏览一轮可接机会。",
              primaryLabel: topOpportunity ? "查看推荐机会" : "浏览可接需求",
              primaryHref: topOpportunity ? `/projects/${topOpportunity.id}` : "/projects",
              secondaryLabel: "分享我的主页",
              secondaryHref: `/creators/${creator.id}`
            }
          : {
              title: "跟进已有线索，推动一次有效沟通",
              description: "更新线索状态和沟通备注，能帮助你沉淀客户，也帮助平台判断匹配质量。",
              primaryLabel: "跟进第一条线索",
              primaryHref: `/orders/${leads[0].id}`,
              secondaryLabel: "继续找机会",
              secondaryHref: "/projects"
            };
  const onboardingTasks = [
    {
      label: "完善展示页",
      done: Boolean(creator.bio && creator.title && creator.contactEmail),
      href: "/provider/profile"
    },
    {
      label: "补充结构化代表作",
      done: Boolean(creator.portfolioItems?.length || creator.portfolio.length),
      href: "/provider/profile"
    },
    {
      label: "设置服务包报价",
      done: Boolean(creator.servicePackages?.length || (creator.priceMin && creator.priceMax)),
      href: "/provider/profile"
    },
    {
      label: "浏览公开需求",
      done: true,
      href: "/projects"
    },
    {
      label: "完成主页认证",
      done: verified,
      href: "/provider/profile"
    }
  ];

  return (
    <main className="main">
      <section className="portalHero providerHero">
        <div className="stack">
          <span className="eyebrow">
            <UserRound size={15} /> 我要接单
          </span>
          <div>
            <h1>我的接单后台</h1>
            <p>适合创作者、工作室和接单服务商查看推荐机会、表达合作意向和沉淀沟通线索。</p>
          </div>
          <div className="toolbarGroup">
            <Link className="btn primary" href="/projects">
              <BriefcaseBusiness size={16} /> 浏览可接需求
            </Link>
            <Link className="btn" href="/account/capabilities?intent=dispatch">
              <BriefcaseBusiness size={16} /> 添加需求方身份
            </Link>
            <Link className="btn" href="/provider/profile">
              <Star size={16} /> 编辑我的展示页
            </Link>
          </div>
        </div>
        <div className="providerProfile card">
          <div className="cardBody stack">
            <div className="row">
              <span className="avatar">
                {isImageValue(creator.avatarUrl) ? <img alt={creator.name} src={creator.avatarUrl} /> : (creator.avatarUrl || creator.name).slice(0, 1)}
              </span>
              <div>
                <strong>{creator.name}</strong>
                <div className="muted">{creator.title}</div>
              </div>
            </div>
            <div className="tagList">
              {creator.categories.map((category) => (
                <span className="tag blue" key={category}>
                  {categoryLabel(category)}
                </span>
              ))}
            </div>
            <div className="spaceBetween">
              <span className={verified ? "tag green" : "tag gold"}>
                <CheckCircle2 size={13} /> {verified ? "已认证" : "未认证/可试用"}
              </span>
              <span className="muted">评分 {creator.rating.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </section>

      {!verified ? (
        <section className="notice">
          风险提示：你的服务主页未审核、未认证。试运营期间可先浏览需求并发起沟通；查看具体信息或推进正式合作时建议完成认证。
        </section>
      ) : null}

      <FirstActionPanel
        eyebrow={hasTrainingProfile ? "培训方/接单方下一步" : "接单方下一步"}
        title={providerFirstAction.title}
        description={providerFirstAction.description}
        primaryLabel={providerFirstAction.primaryLabel}
        primaryHref={providerFirstAction.primaryHref}
        secondaryLabel={providerFirstAction.secondaryLabel}
        secondaryHref={providerFirstAction.secondaryHref}
        steps={[
          { label: "主页认证", done: verified },
          { label: "服务包报价", done: hasServicePackage },
          { label: "代表作", done: hasPortfolio },
          { label: "培训主页", done: hasTrainingProfile },
          { label: "首条线索", done: Boolean(leads.length) }
        ]}
      />

      <section className="section">
        <div className="sectionHeader">
          <div>
            <h2>接单方新手任务</h2>
            <p>这些任务不限制浏览，但完成后更容易被派单方看到并邀请沟通。</p>
          </div>
        </div>
        <div className="grid six">
          {onboardingTasks.map((task, index) => (
            <Link className="metric" href={task.href} key={task.label}>
              {index === 0 ? <UserRound size={18} /> : index === 1 ? <FileText size={18} /> : index === 2 ? <Banknote size={18} /> : index === 3 ? <Search size={18} /> : <CheckCircle2 size={18} />}
              <strong>{task.done ? "已完成" : "待完成"}</strong>
              <span>{task.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="grid four">
          <div className="metric">
            <strong>{recommendedOpportunities.length}</strong>
            <span>推荐机会</span>
          </div>
          <div className="metric">
            <strong>{leads.length}</strong>
            <span>合作线索</span>
          </div>
          <div className="metric">
            <strong>{money(intentBudget)}</strong>
            <span>意向预算</span>
          </div>
          <div className="metric">
            <strong>{creator.completedProjects}</strong>
            <span>累计完成项目</span>
          </div>
          <div className="metric">
            <strong>{creator.servicePackages?.length ?? 0}</strong>
            <span>服务包</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="sharePanel">
          <div className="stack">
            <span className="tag green">增长入口</span>
            <h2>分享你的服务主页，获得更多派单/培训线索</h2>
            <p>这份主页包含服务方向、案例、报价、培训能力和联系方式。发给客户、社群或朋友圈时，对方可以先看能力，再进入平台发布需求或邀请沟通。</p>
            <div className="shareUrl">{profileUrl}</div>
          </div>
          <button
            className="btn primary"
            onClick={() => navigator.clipboard?.writeText(profileUrl)}
            type="button"
          >
            <Copy size={16} /> 复制主页链接
          </button>
        </div>
      </section>

      <section className="section">
        <div className="conversionCard">
          <div className="stack">
            <span className="tag blue">四入口转化建议</span>
            <strong>{serviceConversion.label}</strong>
            <p>{serviceConversion.description}</p>
            <div className="tagList">
              {serviceConversion.reasons.length ? serviceConversion.reasons.map((item) => <span className="tag green" key={item}>{item}</span>) : <span className="tag">补齐资料后会更容易转化</span>}
            </div>
          </div>
          <Link className="btn primary" href={serviceConversion.href}>
            去完善能力
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <div>
            <h2>今日机会雷达</h2>
            <p>每天先处理这几件事：看高匹配机会、跟进已沟通线索、补齐会影响转化的资料。</p>
          </div>
        </div>
        <div className="grid four">
          <article className="opportunityAction">
            <div>
              <span className="tag blue">
                <Search size={13} /> 推荐
              </span>
              <strong>{topOpportunity?.title ?? "暂无高匹配机会"}</strong>
              <span>{topOpportunity ? `${creatorProjectScore(creator, topOpportunity)}% 适合我 · 意向预算 ${money(topOpportunity.budget)}` : "先完善服务品类和技能标签，系统会更准。"}</span>
            </div>
            <Link className="btn" href={topOpportunity ? `/projects/${topOpportunity.id}` : "/provider/profile"}>
              {topOpportunity ? "查看机会" : "完善资料"}
            </Link>
          </article>
          <article className="opportunityAction">
            <div>
              <span className="tag gold">
                <CalendarDays size={13} /> 快截止
              </span>
              <strong>{pools.dueSoon[0]?.title ?? "暂无临近截止机会"}</strong>
              <span>{pools.dueSoon[0] ? `${compactDate(pools.dueSoon[0].deadline)} · ${categoryLabel(pools.dueSoon[0].category)}` : "公开需求暂无临近截止项目。"}</span>
            </div>
            <Link className="btn" href={pools.dueSoon[0] ? `/projects/${pools.dueSoon[0].id}` : "/projects"}>查看需求</Link>
          </article>
          <article className="opportunityAction">
            <div>
              <span className="tag green">
                <SendHorizonal size={13} /> 待跟进
              </span>
              <strong>{nextFollowUpProject?.title ?? "暂无待跟进线索"}</strong>
              <span>{nextFollowUp ? `${orderStatusLabel(nextFollowUp.status)} · 意向预算 ${money(nextFollowUp.amount)}` : "发起沟通后，线索会出现在这里。"}</span>
            </div>
            <Link className="btn" href={nextFollowUp ? `/orders/${nextFollowUp.id}` : "/projects"}>{nextFollowUp ? "跟进线索" : "去找机会"}</Link>
          </article>
          <article className="opportunityAction">
            <div>
              <span className={firstProfileAction ? "tag gold" : "tag green"}>
                <CheckCircle2 size={13} /> 资料
              </span>
              <strong>{firstProfileAction?.label ?? "资料已较完整"}</strong>
              <span>{firstProfileAction ? "补齐后更容易被派单方判断和邀请。" : "继续保持服务包和代表作更新。"}</span>
            </div>
            <Link className="btn" href={firstProfileAction?.href ?? "/provider/profile"}>{firstProfileAction ? "去完善" : "查看展示页"}</Link>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <div>
            <h2>我的服务包</h2>
            <p>派单方会优先根据服务包判断意向预算、周期、修改次数和交付范围。</p>
          </div>
          <Link className="btn" href="/provider/profile">编辑服务包</Link>
        </div>
        <div className="grid three">
          {(creator.servicePackages ?? []).slice(0, 3).map((item) => (
            <article className="card" key={item.id}>
              <div className="cardBody stack">
                <div className="spaceBetween">
                  <strong>{item.name}</strong>
                  <span className="tag blue">{money(item.price)}</span>
                </div>
                <div className="muted">{item.deliveryDays || "-"} 天交付 · {item.revisions} 次修改</div>
                <div className="tagList">
                  {item.deliverables.slice(0, 4).map((deliverable) => (
                    <span className="tag" key={deliverable}>{deliverable}</span>
                  ))}
                </div>
                {item.description ? <p className="muted" style={{ margin: 0 }}>{item.description}</p> : null}
              </div>
            </article>
          ))}
          {!creator.servicePackages?.length ? <div className="notice">还没有服务包。建议至少设置基础、标准、高级三个报价档，提升派单方判断效率。</div> : null}
        </div>
      </section>

      <div className="grid two">
        <section className="card">
          <div className="panelTop">
            <div>
              <strong>推荐机会</strong>
              <div className="muted">Matching Agent 根据你的服务能力推荐的需求，不代表派单方已主动邀约。</div>
            </div>
            <Inbox size={18} />
          </div>
          <div className="cardBody stack">
            {recommendedOpportunities.map(({ match, project }) => (
              <Link className="card" href={`/projects/${project?.id}`} key={match.id}>
                <div className="cardBody stack">
                  <div className="spaceBetween">
                    <strong>{project?.title}</strong>
                    <span className="tag blue">{match.score}% 匹配</span>
                  </div>
                  <p className="muted" style={{ margin: 0 }}>{match.reason}</p>
                  {match.nextStep ? <div className="notice">{match.nextStep}</div> : null}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="panelTop">
            <div>
              <strong>沟通线索</strong>
              <div className="muted">接单方查看需求后发起沟通，或派单方邀请后生成线索。</div>
            </div>
            <FileUp size={18} />
          </div>
          <div className="cardBody stack">
            {leads.map((order) => {
              const project = data.projects.find((item) => item.id === order.projectId);
              return (
                <Link className="card" href={`/orders/${order.id}`} key={order.id}>
                  <div className="cardBody stack">
                    <div className="spaceBetween">
                      <strong>{project?.title ?? "需求"}</strong>
                      <span className="tag green">{orderStatusLabel(order.status)}</span>
                    </div>
                    <div className="muted">意向预算 {money(order.amount)}</div>
                  </div>
                </Link>
              );
            })}
            <div className="row muted">
              <Banknote size={16} /> 当前平台不处理收款、结算和交付，具体合作由双方自行协商。
            </div>
          </div>
        </section>
      </div>

      <section className="section">
        <div className="sectionHeader">
          <div>
            <h2>接单机会池</h2>
            <p>系统按你的服务类型、技能、报价区间和需求质量整理机会，方便你持续跟进。</p>
          </div>
        </div>
        <div className="grid three">
          <section className="card">
            <div className="panelTop">
              <div>
                <strong>推荐给我</strong>
                <div className="muted">优先看能力和品类匹配的需求。</div>
              </div>
              <Search size={18} />
            </div>
            <div className="cardBody stack">
              {pools.recommended.slice(0, 4).map((project) => (
                <Link className="miniLead" href={`/projects/${project.id}`} key={project.id}>
                  <span>{project.title}</span>
                  <em>{creatorProjectScore(creator, project)}% 适合我 · 意向预算 {money(project.budget)}</em>
                </Link>
              ))}
              {!pools.recommended.length ? <div className="muted">暂无推荐机会，先完善技能和可接类型。</div> : null}
            </div>
          </section>
          <section className="card">
            <div className="panelTop">
              <div>
                <strong>快截止机会</strong>
                <div className="muted">优先处理临近沟通期限的项目。</div>
              </div>
              <Banknote size={18} />
            </div>
            <div className="cardBody stack">
              {pools.dueSoon.slice(0, 4).map((project) => (
                <Link className="miniLead" href={`/projects/${project.id}`} key={project.id}>
                  <span>{project.title}</span>
                  <em>{compactDate(project.deadline)} · 意向预算 {money(project.budget)}</em>
                </Link>
              ))}
              {!pools.dueSoon.length ? <div className="muted">暂无临近截止机会。</div> : null}
            </div>
          </section>
          <section className="card">
            <div className="panelTop">
              <div>
                <strong>已沟通机会</strong>
                <div className="muted">已经建立联系的项目，适合继续跟进。</div>
              </div>
              <FileUp size={18} />
            </div>
            <div className="cardBody stack">
              {pools.contacted.slice(0, 4).map((project) => (
                <Link className="miniLead" href={`/projects/${project.id}`} key={project.id}>
                  <span>{project.title}</span>
                  <em>已发起沟通 · 意向预算 {money(project.budget)}</em>
                </Link>
              ))}
              {!pools.contacted.length ? <div className="muted">还没有发起沟通的机会。</div> : null}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
