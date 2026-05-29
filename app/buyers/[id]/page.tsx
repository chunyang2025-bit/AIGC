"use client";

import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, Building2, CheckCircle2, ExternalLink, FileBadge2, Globe2, Mail, MapPin, Phone, Sparkles } from "lucide-react";
import { categoryLabel, compactDate, money, publicCredentialSummary, verificationTypeLabel } from "@/lib/format";
import { isImageValue } from "@/lib/file-upload";
import { loadMarketplaceData } from "@/lib/store";
import { loginNextPath, readAuthSession } from "@/lib/auth";

export default function BuyerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const session = readAuthSession();
  const data = loadMarketplaceData();
  const user = data.users.find((item) => item.id === params.id);
  const profile = (data.buyerProfiles ?? []).find((item) => item.userId === params.id);

  if (!user || !profile) {
    notFound();
  }

  if (!session) {
    router.push(loginNextPath("buyer", `/buyers/${params.id}`));
    return null;
  }

  const projects = data.projects.filter((project) => project.buyerId === user.id);

  return (
    <main className="main">
      <div className="toolbar">
        <Link className="btn" href="/projects">
          <ArrowLeft size={16} /> 返回需求大厅
        </Link>
        <Link className="btn primary" href={loginNextPath("buyer", "/post-project")}>
          <BriefcaseBusiness size={16} /> 发布需求
        </Link>
      </div>

      <section className="creatorDetailHero">
        <div className="creatorDetailCover" style={{ "--media-bg": profile.cover } as React.CSSProperties}>
          <span className="avatar largeAvatar">
            {isImageValue(profile.avatarUrl) ? <img alt={profile.displayName ?? profile.companyName} src={profile.avatarUrl} /> : (profile.avatarUrl || profile.displayName || profile.companyName).slice(0, 1)}
          </span>
        </div>
        <div className="stack">
          <div className="spaceBetween">
            <div>
              <h1>{profile.displayName ?? profile.companyName}</h1>
              <p>{profile.profileSlogan ?? profile.companyIntro}</p>
            </div>
            <span className={profile.verified ? "tag blue" : "tag gold"}>
              {profile.verified ? (
                <>
                  <CheckCircle2 size={13} /> 已认证
                </>
              ) : (
                "待审核"
              )}
            </span>
          </div>
          <div className="tagList">
            <span className="tag blue">{verificationTypeLabel(profile.verificationType ?? "enterprise")}</span>
            <span className="tag blue">{profile.industry}</span>
            <span className="tag green">
              <MapPin size={13} /> {profile.location}
            </span>
            {profile.serviceArea ? <span className="tag">{profile.serviceArea}</span> : null}
          </div>
          <p className="muted" style={{ margin: 0, lineHeight: 1.7 }}>
            {profile.companyIntro}
          </p>
          <div className="grid four">
            <div className="metric">
              <strong>{projects.length}</strong>
              <span>历史需求</span>
            </div>
            <div className="metric">
              <strong>{projects.filter((project) => project.agentBrief).length}</strong>
              <span>Agent拆解</span>
            </div>
            <div className="metric">
              <strong>{data.orders.filter((order) => order.buyerId === user.id).length}</strong>
              <span>沟通线索</span>
            </div>
            <div className="metric">
              <strong>{compactDate(user.createdAt)}</strong>
              <span>入驻时间</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid two">
        <section className="card">
          <div className="panelTop">
            <div>
              <strong>联系方式</strong>
              <div className="muted">用于双方达成沟通意向后的进一步联系。</div>
            </div>
            <Building2 size={18} />
          </div>
          <div className="cardBody stack">
            <div className="row muted">
              <Mail size={16} /> {profile.contactEmail}
            </div>
            <div className="row muted">
              <Phone size={16} /> {profile.contactPhone}
            </div>
            {profile.websiteUrl ? (
              <a className="row muted" href={profile.websiteUrl}>
                <Globe2 size={16} /> {profile.websiteUrl}
              </a>
            ) : null}
            {profile.socialUrl ? (
              <a className="row muted" href={profile.socialUrl}>
                <ExternalLink size={16} /> {profile.socialUrl}
              </a>
            ) : null}
            <div className="notice">平台展示联系方式和认证状态，不展示证照原件，不参与合同、收款与交付。</div>
          </div>
        </section>

        <section className="card">
          <div className="panelTop">
            <div>
              <strong>主体资质</strong>
              <div className="muted">原始证明材料仅供平台运营后台审核，公开页不展示证照原件或完整证件号码。</div>
            </div>
            <FileBadge2 size={18} />
          </div>
          <div className="cardBody stack">
            <div className="row muted">
              <FileBadge2 size={16} /> {publicCredentialSummary(profile.verificationType, profile.verified)}
            </div>
            <div className="row muted">
              <CheckCircle2 size={16} /> 已由平台后台完成材料留存与人工审核
            </div>
          </div>
        </section>
      </div>

      <section className="section">
        <div className="sectionHeader">
          <div>
            <h2>Agent整理的历史需求</h2>
            <p>帮助接单方判断这个派单方长期需要什么类型的AIGC内容。</p>
          </div>
        </div>
        <div className="jobList">
          {projects.map((project) => (
            <Link className="projectJobCard" href={`/projects/${project.id}`} key={project.id}>
              <div className="cardBody stack">
                <div className="spaceBetween">
                  <span className="tag blue">{categoryLabel(project.category)}</span>
                  {project.agentBrief ? (
                    <span className="tag green">
                      <Sparkles size={13} /> Agent已整理
                    </span>
                  ) : null}
                </div>
                <strong>{project.title}</strong>
                <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>{project.description}</p>
                <div className="spaceBetween muted">
                  <span>{money(project.budget)}</span>
                  <span>{compactDate(project.createdAt)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
