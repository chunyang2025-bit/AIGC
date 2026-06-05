"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, CheckCircle2, Clock, Copy, ExternalLink, FileBadge2, FileText, Globe2, Mail, MapPin, Phone, Star } from "lucide-react";
import { categoryLabel, money, publicCredentialSummary, verificationTypeLabel } from "@/lib/format";
import { isImageValue } from "@/lib/file-upload";
import { trainingFormatLabel } from "@/lib/training";
import { loadMarketplaceData } from "@/lib/store";
import { readAuthSession } from "@/lib/auth";
import { ReportButton } from "@/components/ReportButton";
import { PortfolioItem } from "@/lib/types";
import { saveRemixDraft } from "@/lib/remix-draft";

export default function CreatorDetailPage({ params }: { params: { id: string } }) {
  const session = readAuthSession();
  const data = loadMarketplaceData();
  const creator = data.creators.find((item) => item.id === params.id);

  if (!creator) {
    notFound();
  }

  const publicCreator = creator;
  const portfolioItems: PortfolioItem[] =
    creator.portfolioItems?.length
      ? creator.portfolioItems
      : creator.portfolio.map((item, index) => ({
          id: `legacy-${index}`,
          title: item,
          category: creator.categories[0] ?? "AI Short Video",
          description: "可在沟通时围绕该代表作进一步发送脚本、成片或项目说明。",
          public: true
        }));

  const profileUrl = typeof window === "undefined" ? `/creators/${creator.id}` : `${window.location.origin}/creators/${creator.id}`;

  function saveCreatorRemix() {
    saveRemixDraft({
      type: "creator",
      sourceCreatorId: publicCreator.id,
      sourceName: publicCreator.displayName ?? publicCreator.name,
      creator: {
        title: publicCreator.title,
        bio: publicCreator.bio,
        skills: publicCreator.skills,
        categories: publicCreator.categories,
        priceMin: publicCreator.priceMin,
        priceMax: publicCreator.priceMax,
        responseTime: publicCreator.responseTime,
        serviceArea: publicCreator.serviceArea,
        servicePackages: publicCreator.servicePackages,
        trainingProfile: publicCreator.trainingProfile
      }
    });
  }

  return (
    <main className="main">
      <div className="toolbar">
        <Link className="btn" href="/creators">
          <ArrowLeft size={16} /> 返回创作者大厅
        </Link>
        <Link className="btn primary" href="/projects">
          <BriefcaseBusiness size={16} /> 查看公开需求
        </Link>
        <button className="btn" onClick={() => navigator.clipboard?.writeText(profileUrl)} type="button">
          <Copy size={16} /> 复制展示页
        </button>
        <Link className="btn" href="/provider/profile?remix=creator" onClick={saveCreatorRemix}>
          <Copy size={16} /> 参考这个主页
        </Link>
        {!session ? (
          <Link className="btn primary" href="/register">
            免费注册后联系
          </Link>
        ) : null}
      </div>

      <section className="creatorDetailHero">
        <div className="creatorDetailCover" style={{ "--media-bg": creator.cover } as React.CSSProperties}>
          <span className="avatar largeAvatar">
            {isImageValue(creator.avatarUrl) ? <img alt={creator.displayName ?? creator.name} src={creator.avatarUrl} /> : (creator.avatarUrl || creator.displayName || creator.name).slice(0, 1)}
          </span>
        </div>
        <div className="stack">
          <div className="spaceBetween">
            <div>
              <h1>{creator.displayName ?? creator.name}</h1>
              <p>{creator.profileSlogan ?? creator.title}</p>
            </div>
            <span className={creator.verified ? "tag blue" : "tag"}>
              {creator.verified ? (
                <>
                  <CheckCircle2 size={13} /> 已认证
                </>
              ) : (
                "待审核"
              )}
            </span>
          </div>
          <div className="tagList">
            <span className="tag blue">{verificationTypeLabel(creator.verificationType ?? creator.identityType ?? "individual")}</span>
            {creator.categories.map((category) => (
              <span className="tag blue" key={category}>
                {categoryLabel(category)}
              </span>
            ))}
            <span className="tag green">
              <MapPin size={13} /> {creator.location}
            </span>
            {creator.serviceArea ? <span className="tag">{creator.serviceArea}</span> : null}
          </div>
          <p className="muted" style={{ margin: 0, lineHeight: 1.7 }}>
            {creator.bio}
          </p>
          <ReportButton targetType="creator" targetId={creator.id} />
          <div className="grid four">
            <div className="metric">
              <strong>{creator.rating.toFixed(1)}</strong>
              <span>平台评分</span>
            </div>
            <div className="metric">
              <strong>{creator.completedProjects}</strong>
              <span>历史项目</span>
            </div>
            <div className="metric">
              <strong>{creator.responseTime}</strong>
              <span>响应速度</span>
            </div>
            <div className="metric">
              <strong>
                {money(creator.priceMin)}-{money(creator.priceMax)}
              </strong>
              <span>报价区间</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid two">
        <section className="card">
          <div className="panelTop">
            <div>
              <strong>技能标签</strong>
              <div className="muted">派单方用于判断服务适配度。</div>
            </div>
            <Star size={18} />
          </div>
          <div className="cardBody tagList">
            {creator.skills.map((skill) => (
              <span className="tag" key={skill}>
                {skill}
              </span>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="panelTop">
            <div>
              <strong>主体资质与联系方式</strong>
              <div className="muted">公开页只展示认证状态和联系方式，不展示身份证、证照原件或完整证件号码。</div>
            </div>
            <Clock size={18} />
          </div>
          <div className="cardBody stack">
            <div className="row muted">
              <FileBadge2 size={16} /> {publicCredentialSummary(creator.verificationType ?? creator.identityType, creator.verified)}
            </div>
            <div className="row muted">
              <Mail size={16} /> {creator.contactEmail ?? "待补充邮箱"}
            </div>
            <div className="row muted">
              <Phone size={16} /> {creator.contactPhone ?? "待补充电话"}
            </div>
            {creator.websiteUrl ? (
              <a className="row muted" href={creator.websiteUrl}>
                <Globe2 size={16} /> {creator.websiteUrl}
              </a>
            ) : null}
            {creator.socialUrl ? (
              <a className="row muted" href={creator.socialUrl}>
                <ExternalLink size={16} /> {creator.socialUrl}
              </a>
            ) : null}
            <div className="row muted">
              <FileText size={16} /> 展示页链接可由接单方发送给派单方
            </div>
            <div className="row muted">
              <CheckCircle2 size={16} /> 原始证明材料仅平台运营后台可见
            </div>
            <div className="notice">后续简历、真实作品链接和联系方式，可在沟通线索里由创作者主动发送。</div>
          </div>
        </section>
      </div>

      <section className="section">
        {creator.trainingProfile ? (
          <article className="card" style={{ marginBottom: 16 }}>
            <div className="cardBody stack">
              <div className="spaceBetween">
                <strong>AIGC培训服务能力</strong>
                <span className="tag blue">讲师/内训顾问</span>
              </div>
              <div className="tagList">
                {creator.trainingProfile.topics.map((item) => <span className="tag green" key={item}>{item}</span>)}
                {creator.trainingProfile.formats.map((item) => <span className="tag blue" key={item}>{trainingFormatLabel(item)}</span>)}
                {creator.trainingProfile.customizable ? <span className="tag">支持企业定制案例</span> : null}
              </div>
              <div className="grid two compactGrid">
                <div className="briefBlock">
                  <strong>适合对象</strong>
                  <p>{creator.trainingProfile.audience.join("、") || "待补充"}</p>
                </div>
                <div className="briefBlock">
                  <strong>可服务城市</strong>
                  <p>{creator.trainingProfile.cities.join("、") || creator.serviceArea || "全国线上"}</p>
                </div>
              </div>
              <div className="briefBlock">
                <strong>交付材料</strong>
                <p>{creator.trainingProfile.materials.join("、") || "课件、练习、工具清单等可沟通确认"}</p>
              </div>
              {creator.trainingProfile.pricingNote ? <div className="notice">{creator.trainingProfile.pricingNote}</div> : null}
              {creator.trainingProfile.caseStudies.length ? (
                <div className="briefBlock">
                  <strong>培训案例</strong>
                  <ul className="cleanList">
                    {creator.trainingProfile.caseStudies.map((item) => <li key={item}><CheckCircle2 size={15} /> {item}</li>)}
                  </ul>
                </div>
              ) : null}
            </div>
          </article>
        ) : null}
        <div className="sectionHeader">
          <div>
            <h2>服务包报价</h2>
            <p>用于快速判断预算、交付周期、修改次数和成果范围。</p>
          </div>
        </div>
        <div className="grid three">
          {(creator.servicePackages ?? []).map((item) => (
            <article className="card" key={item.id}>
              <div className="cardBody stack">
                <div className="spaceBetween">
                  <strong>{item.name}</strong>
                  <span className="tag blue">{money(item.price)}</span>
                </div>
                <div className="muted">{item.deliveryDays || "-"} 天交付 · {item.revisions} 次修改</div>
                <div className="tagList">
                  {item.deliverables.map((deliverable) => (
                    <span className="tag" key={deliverable}>{deliverable}</span>
                  ))}
                </div>
                {item.description ? <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>{item.description}</p> : null}
              </div>
            </article>
          ))}
          {!creator.servicePackages?.length ? <div className="notice">该创作者暂未设置服务包，可通过沟通线索进一步确认报价和交付范围。</div> : null}
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <div>
            <h2>简历与代表作</h2>
            <p>接单方发起沟通时会直接发送此展示页，派单方可在这里查看履历、代表作和联系方式。</p>
          </div>
        </div>
        <article className="card" style={{ marginBottom: 16 }}>
          <div className="cardBody stack">
            <span className="tag blue">简历/履历</span>
            <p className="muted" style={{ margin: 0, lineHeight: 1.7 }}>
              {creator.resume}
            </p>
          </div>
        </article>
        <div className="grid">
          {portfolioItems.map((item) => (
            <article className="card" key={item.id}>
              <div className="cardBody stack">
                <span className="tag green">{categoryLabel(item.category)}</span>
                <strong>{item.title}</strong>
                <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
                  {item.description}
                </p>
                {item.url ? <a className="btn" href={item.url}>查看作品链接</a> : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
