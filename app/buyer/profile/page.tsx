"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, CheckCircle2, FileBadge2, Globe2, History, Mail, Phone, Save, Sparkles } from "lucide-react";
import { compactDate, money, requiredCredentialLabel, verificationTypeLabel } from "@/lib/format";
import { fileNames, isImageValue, readImageFile } from "@/lib/file-upload";
import { joinProvinceCity, provinceCityOptions, splitProvinceCity } from "@/lib/location-options";
import { loadMarketplaceData, upsertCurrentBuyerProfile } from "@/lib/store";
import { VerificationType } from "@/lib/types";
import { readAuthSession, setAuthCapability } from "@/lib/auth";

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
  const session = readAuthSession();
  const currentProfile = data.buyerProfiles?.find((profile) => profile.userId === session?.userId);
  const subjectName = currentProfile?.companyName ?? session?.name ?? "";
  const [companyName, setCompanyName] = useState(subjectName);
  const [displayName, setDisplayName] = useState(currentProfile?.displayName ?? subjectName);
  const [avatarUrl, setAvatarUrl] = useState(currentProfile?.avatarUrl ?? subjectName.slice(0, 1));
  const [profileSlogan, setProfileSlogan] = useState(currentProfile?.profileSlogan ?? "");
  const [industry, setIndustry] = useState(currentProfile?.industry ?? "");
  const initialLocation = splitProvinceCity(currentProfile?.location ?? "");
  const [province, setProvince] = useState(initialLocation.province);
  const [city, setCity] = useState(initialLocation.city);
  const [companyIntro, setCompanyIntro] = useState(currentProfile?.companyIntro ?? "");
  const [verificationType, setVerificationType] = useState<VerificationType>(currentProfile?.verificationType ?? "enterprise");
  const [contactEmail, setContactEmail] = useState(currentProfile?.contactEmail ?? session?.email ?? "");
  const [contactPhone, setContactPhone] = useState(currentProfile?.contactPhone ?? session?.phone ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(currentProfile?.websiteUrl ?? "");
  const [socialUrl, setSocialUrl] = useState(currentProfile?.socialUrl ?? "");
  const [serviceArea, setServiceArea] = useState(currentProfile?.serviceArea ?? "");
  const [businessLicenseFile, setBusinessLicenseFile] = useState(currentProfile?.businessLicenseFile ?? "");
  const [qualificationFiles, setQualificationFiles] = useState((currentProfile?.qualificationFiles ?? []).join("\n"));

  const history = useMemo(
    () => data.projects.filter((project) => project.buyerId === session?.userId).slice(0, 4),
    [data.projects, session?.userId]
  );
  const cityOptions = provinceCityOptions.find((item) => item.province === province)?.cities ?? [];
  const location = joinProvinceCity(province, city);

  function handleAvatarUpload(files: FileList | null) {
    const file = files?.[0];
    if (file) {
      readImageFile(file, setAvatarUrl);
    }
  }

  function handleMainCredentialUpload(files: FileList | null) {
    const [fileName] = fileNames(files);
    if (fileName) {
      setBusinessLicenseFile(fileName);
    }
  }

  function handleQualificationUpload(files: FileList | null) {
    const names = fileNames(files);
    if (names.length) {
      setQualificationFiles((current) => [...splitList(current), ...names].join("\n"));
    }
  }

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
    setAuthCapability("buyer", "pending_review");
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
            <p>接单方会查看你的主体认证、主页装修、历史需求和联系方式。派单方需通过资质审核后，才能发布真实需求和邀请接单方沟通。</p>
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
              <div className="muted">参考平台主体认证逻辑，先选择主体类型，再补充主页展示信息和有效资质。</div>
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
                <label htmlFor="avatar-file">头像/Logo</label>
                <div className="uploadBox">
                  <span className="avatar previewAvatar">
                    {isImageValue(avatarUrl) ? <img alt="头像预览" src={avatarUrl} /> : avatarUrl.slice(0, 1) || displayName.slice(0, 1)}
                  </span>
                  <div>
                    <input id="avatar-file" accept="image/*" type="file" onChange={(event) => handleAvatarUpload(event.target.files)} />
                    <span className="fieldHint">支持 JPG、PNG 等图片，上传后会用于主体主页展示。</span>
                  </div>
                </div>
              </div>
              <div className="field">
                <label>所在城市</label>
                <div className="grid two compactGrid">
                  <select
                    aria-label="省份"
                    value={province}
                    onChange={(event) => {
                      const nextProvince = event.target.value;
                      const nextCities = provinceCityOptions.find((item) => item.province === nextProvince)?.cities ?? [];
                      setProvince(nextProvince);
                      setCity(nextCities[0] ?? "");
                    }}
                    required
                  >
                    <option value="">选择省份</option>
                    {provinceCityOptions.map((item) => (
                      <option key={item.province} value={item.province}>{item.province}</option>
                    ))}
                  </select>
                  <select aria-label="城市" value={city} onChange={(event) => setCity(event.target.value)} required>
                    <option value="">选择城市</option>
                    {cityOptions.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
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
              <input id="license" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" type="file" onChange={(event) => handleMainCredentialUpload(event.target.files)} />
              <input value={businessLicenseFile} onChange={(event) => setBusinessLicenseFile(event.target.value)} placeholder="上传后自动填入文件名" required />
              <span className="fieldHint">支持 PDF、图片或文档。当前 demo 保存文件名，接入 Supabase Storage 后可保存文件地址。</span>
            </div>

            <div className="field">
              <label htmlFor="qualifications">其他有效资质</label>
              <input id="qualifications-file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" multiple type="file" onChange={(event) => handleQualificationUpload(event.target.files)} />
              <textarea id="qualifications" value={qualificationFiles} onChange={(event) => setQualificationFiles(event.target.value)} />
              <span className="fieldHint">可多选文件；每行一个资质，例如品牌授权、产品检测、版权证明等。</span>
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
                <span className="avatar">
                  {isImageValue(avatarUrl) ? <img alt="头像预览" src={avatarUrl} /> : avatarUrl.slice(0, 1) || displayName.slice(0, 1)}
                </span>
                <div>
                  <strong>{displayName || "主页昵称"}</strong>
                  <div className="muted">{companyName || "主体名称"}</div>
                </div>
              </div>
              <div className="tagList">
                <span className="tag blue">{verificationTypeLabel(verificationType)}</span>
                <span className="tag">{industry || "行业方向"}</span>
              </div>
              <div>
                <h2 style={{ margin: 0 }}>{profileSlogan || "主页一句话简介"}</h2>
                <div className="muted">{location || "所在城市"}</div>
              </div>
              <p className="muted" style={{ margin: 0, lineHeight: 1.6 }}>{companyIntro || "基本介绍会展示在这里，帮助接单方判断是否适合沟通。"}</p>
              <div className="row muted">
                <Globe2 size={16} /> {websiteUrl || "官网/作品页"}
              </div>
              <div className="row muted">
                <Mail size={16} /> {contactEmail || "联系邮箱"}
              </div>
              <div className="row muted">
                <Phone size={16} /> {contactPhone || "联系电话"}
              </div>
              <div className="notice">
                <FileBadge2 size={15} /> {businessLicenseFile || `待上传${requiredCredentialLabel(verificationType)}`}
              </div>
            </div>
          </section>
          <section className="card">
            <div className="cardBody stack">
              <strong>Agent整理的历史需求</strong>
              {history.length ? history.map((project) => (
                <Link className="miniLead" href={`/projects/${project.id}`} key={project.id}>
                  <span>{project.title}</span>
                  <em>{money(project.budget)} · {compactDate(project.createdAt)}</em>
                </Link>
              )) : <div className="muted">发布需求后，Agent 会在这里整理历史需求。</div>}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
