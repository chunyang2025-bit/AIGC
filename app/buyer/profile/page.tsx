"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, CheckCircle2, FileBadge2, Globe2, History, Mail, Phone, Save, Sparkles } from "lucide-react";
import { compactDate, money, requiredCredentialLabel, verificationTypeLabel } from "@/lib/format";
import { loadMarketplaceData, upsertCurrentBuyerProfile } from "@/lib/store";
import { VerificationType } from "@/lib/types";
import { setAuthStatus } from "@/lib/auth";

const verificationTypes: VerificationType[] = [
  "enterprise",
  "individual_business",
  "individual",
  "government",
  "public_institution",
  "social_organization",
  "school",
  "media",
  "brand_owner",
  "other"
];

function splitList(value: string) {
  return value
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function BuyerProfilePage() {
  const router = useRouter();
  const data = loadMarketplaceData();
  const [companyName, setCompanyName] = useState("杭州北辰智能科技");
  const [displayName, setDisplayName] = useState("北辰智能内容需求中心");
  const [avatarUrl, setAvatarUrl] = useState("北");
  const [profileSlogan, setProfileSlogan] = useState("长期寻找懂智能硬件和B端软件的AIGC内容伙伴");
  const [industry, setIndustry] = useState("智能硬件 / SaaS");
  const [location, setLocation] = useState("杭州");
  const [companyIntro, setCompanyIntro] = useState("专注智能办公硬件和企业效率工具，常年需要产品短视频、SaaS说明视频和电商内容素材。");
  const [verificationType, setVerificationType] = useState<VerificationType>("enterprise");
  const [contactEmail, setContactEmail] = useState("mira@northstar.ai");
  const [contactPhone, setContactPhone] = useState("0571-8800-1024");
  const [websiteUrl, setWebsiteUrl] = useState("https://northstar.example.com");
  const [socialUrl, setSocialUrl] = useState("https://www.xiaohongshu.com/user/profile/northstar");
  const [serviceArea, setServiceArea] = useState("全国远程协作，杭州可线下面谈");
  const [businessLicenseFile, setBusinessLicenseFile] = useState("杭州北辰智能科技营业执照.pdf");
  const [qualificationFiles, setQualificationFiles] = useState("品牌授权书.pdf\n产品检测说明.pdf");

  const history = useMemo(
    () => data.projects.filter((project) => project.buyerId === "u-buyer-1").slice(0, 4),
    [data.projects]
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    upsertCurrentBuyerProfile({
      companyName,
      displayName,
      avatarUrl,
      profileSlogan,
      industry,
      location,
      companyIntro,
      verificationType,
      contactEmail,
      contactPhone,
      websiteUrl,
      socialUrl,
      serviceArea,
      businessLicenseFile,
      qualificationFiles: splitList(qualificationFiles)
    });
    setAuthStatus("pending_review");
    router.push("/buyer");
  }

  return (
    <main className="main">
      <section className="profileSetupHero">
        <div className="stack">
          <span className="eyebrow">
            <Building2 size={15} /> 派单方主体认证
          </span>
          <div>
            <h1>先完善主体主页，再发布需求</h1>
            <p>接单方会查看你的主体认证、主页装修、历史需求和联系方式。主体越清晰，越容易吸引高质量创作者主动沟通。</p>
          </div>
          <div className="profileSteps">
            <span>
              <CheckCircle2 size={15} /> 基本介绍
            </span>
            <span>
              <FileBadge2 size={15} /> 营业执照/资质
            </span>
            <span>
              <History size={15} /> Agent整理历史需求
            </span>
          </div>
        </div>
      </section>

      <div className="profileSetupLayout">
        <section className="card">
          <div className="panelTop">
            <div>
              <strong>认证资料与主页装修</strong>
              <div className="muted">参考微博认证逻辑，先选择主体类型，再补充主页展示信息和资质。</div>
            </div>
            <Sparkles size={18} />
          </div>
          <form className="cardBody form" onSubmit={handleSubmit}>
            <div className="grid two compactGrid">
              <div className="field">
                <label htmlFor="company-name">名称</label>
                <input id="company-name" value={companyName} onChange={(event) => setCompanyName(event.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="display-name">主页昵称</label>
                <input id="display-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
              </div>
            </div>

            <div className="grid two compactGrid">
              <div className="field">
                <label htmlFor="avatar-url">头像/Logo</label>
                <input id="avatar-url" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} />
                <span className="fieldHint">MVP阶段可填头像文字或图片链接。</span>
              </div>
              <div className="field">
                <label htmlFor="company-location">所在城市</label>
                <input id="company-location" value={location} onChange={(event) => setLocation(event.target.value)} required />
              </div>
            </div>

            <div className="field">
              <label htmlFor="profile-slogan">主页一句话简介</label>
              <input id="profile-slogan" value={profileSlogan} onChange={(event) => setProfileSlogan(event.target.value)} />
            </div>

            <div className="field">
              <label htmlFor="industry">行业方向</label>
              <input id="industry" value={industry} onChange={(event) => setIndustry(event.target.value)} />
            </div>

            <div className="field">
              <label>认证主体类型</label>
              <div className="checkPillGrid identityGrid">
                {verificationTypes.map((type) => (
                  <button
                    className={verificationType === type ? "checkPill active" : "checkPill"}
                    key={type}
                    onClick={() => {
                      setVerificationType(type);
                      setBusinessLicenseFile(`${requiredCredentialLabel(type)}.pdf`);
                    }}
                    type="button"
                  >
                    <CheckCircle2 size={15} /> {verificationTypeLabel(type)}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label htmlFor="intro">基本介绍</label>
              <textarea id="intro" value={companyIntro} onChange={(event) => setCompanyIntro(event.target.value)} required />
            </div>

            <div className="grid two compactGrid">
              <div className="field">
                <label htmlFor="email">联系邮箱</label>
                <input id="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="phone">联系电话</label>
                <input id="phone" value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} />
              </div>
            </div>

            <div className="grid two compactGrid">
              <div className="field">
                <label htmlFor="website">官网/作品页</label>
                <input id="website" value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="social">社媒主页</label>
                <input id="social" value={socialUrl} onChange={(event) => setSocialUrl(event.target.value)} />
              </div>
            </div>

            <div className="field">
              <label htmlFor="service-area">服务地区/协作方式</label>
              <input id="service-area" value={serviceArea} onChange={(event) => setServiceArea(event.target.value)} />
            </div>

            <div className="field">
              <label htmlFor="license">{requiredCredentialLabel(verificationType)}</label>
              <input id="license" value={businessLicenseFile} onChange={(event) => setBusinessLicenseFile(event.target.value)} />
              <span className="fieldHint">MVP阶段先记录文件名，接入 Supabase Storage 后可替换成真实上传。</span>
            </div>

            <div className="field">
              <label htmlFor="qualifications">其他有效资质</label>
              <textarea id="qualifications" value={qualificationFiles} onChange={(event) => setQualificationFiles(event.target.value)} />
              <span className="fieldHint">每行一个资质，例如品牌授权、产品检测、版权证明等。</span>
            </div>

            <div className="toolbarGroup">
              <button className="btn primary" type="submit">
                <Save size={16} /> 提交主体主页并等待审核
              </button>
              <Link className="btn" href="/buyer">
                进入派单后台 <ArrowRight size={16} />
              </Link>
            </div>
          </form>
        </section>

        <aside className="profilePreview">
          <div className="panelTop">
            <div>
              <strong>主体主页预览</strong>
              <div className="muted">接单方进入需求时可查看派单方主体资料。</div>
            </div>
            <Building2 size={18} />
          </div>
          <section className="card">
            <div className="cardBody stack">
              <div className="profilePreviewHead">
                <span className="avatar">{avatarUrl.slice(0, 1) || displayName.slice(0, 1)}</span>
                <div>
                  <strong>{displayName}</strong>
                  <div className="muted">{companyName}</div>
                </div>
              </div>
              <div className="tagList">
                <span className="tag blue">{verificationTypeLabel(verificationType)}</span>
                <span className="tag">{industry}</span>
              </div>
              <div>
                <h2 style={{ margin: 0 }}>{profileSlogan}</h2>
                <div className="muted">{location}</div>
              </div>
              <p className="muted" style={{ margin: 0, lineHeight: 1.6 }}>{companyIntro}</p>
              <div className="row muted">
                <Globe2 size={16} /> {websiteUrl}
              </div>
              <div className="row muted">
                <Mail size={16} /> {contactEmail}
              </div>
              <div className="row muted">
                <Phone size={16} /> {contactPhone}
              </div>
              <div className="notice">
                <FileBadge2 size={15} /> {businessLicenseFile || `待上传${requiredCredentialLabel(verificationType)}`}
              </div>
            </div>
          </section>
          <section className="card">
            <div className="cardBody stack">
              <strong>Agent整理的历史需求</strong>
              {history.map((project) => (
                <Link className="miniLead" href={`/projects/${project.id}`} key={project.id}>
                  <span>{project.title}</span>
                  <em>{money(project.budget)} · {compactDate(project.createdAt)}</em>
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
