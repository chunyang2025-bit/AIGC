"use client";

import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, CheckCircle2, Clock, ExternalLink, FileBadge2, FileText, Globe2, Mail, MapPin, Phone, Star } from "lucide-react";
import { categoryLabel, money, verificationTypeLabel } from "@/lib/format";
import { loadMarketplaceData } from "@/lib/store";
import { readAuthSession } from "@/lib/auth";

export default function CreatorDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const session = readAuthSession();
  const data = loadMarketplaceData();
  const creator = data.creators.find((item) => item.id === params.id);

  if (!creator) {
    notFound();
  }

  if (!session) {
    router.push("/login");
    return null;
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
      </div>

      <section className="creatorDetailHero">
        <div className="creatorDetailCover" style={{ "--media-bg": creator.cover } as React.CSSProperties}>
          <span className="avatar largeAvatar">{(creator.avatarUrl || creator.displayName || creator.name).slice(0, 1)}</span>
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
              <div className="muted">用于派单方判断创作者身份和后续沟通方式。</div>
            </div>
            <Clock size={18} />
          </div>
          <div className="cardBody stack">
            <div className="row muted">
              <FileBadge2 size={16} /> {creator.credentialFile ?? "待补充主体资质"}
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
            {(creator.qualificationFiles ?? []).map((file) => (
              <div className="row muted" key={file}>
                <CheckCircle2 size={16} /> {file}
              </div>
            ))}
            <div className="notice">后续简历、真实作品链接和联系方式，可在沟通线索里由创作者主动发送。</div>
          </div>
        </section>
      </div>

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
          {creator.portfolio.map((item) => (
            <article className="card" key={item}>
              <div className="cardBody stack">
                <span className="tag green">代表作</span>
                <strong>{item}</strong>
                <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
                  可在沟通时围绕该代表作进一步发送脚本、成片或项目说明。
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
