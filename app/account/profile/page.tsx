"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Building2, CheckCircle2, FileBadge2, Globe2, Mail, Phone, Save, ShieldCheck } from "lucide-react";
import { isImageValue, uploadCredentialFiles, uploadOrPreviewImage } from "@/lib/file-upload";
import { compactDate, credentialUploadOptional, money, publicCredentialSummary, requiredCredentialLabel, verificationTypeLabel } from "@/lib/format";
import { joinProvinceCity, provinceCityOptions, splitProvinceCity } from "@/lib/location-options";
import { loadMarketplaceData, upsertUnifiedSubjectProfile } from "@/lib/store";
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

function AccountProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intent = searchParams.get("intent") ?? "dispatch";
  const data = useMemo(() => loadMarketplaceData(), []);
  const session = useMemo(() => readAuthSession(), []);
  const buyerProfile = data.buyerProfiles?.find((profile) => profile.userId === session?.userId);
  const creatorProfile = data.creators.find((creator) => creator.userId === session?.userId);
  const subjectName = buyerProfile?.companyName ?? creatorProfile?.name ?? session?.name ?? "";
  const profileLocation = buyerProfile?.location ?? creatorProfile?.location ?? "";
  const initialLocation = splitProvinceCity(profileLocation);
  const [companyName, setCompanyName] = useState(subjectName);
  const [displayName, setDisplayName] = useState(buyerProfile?.displayName ?? creatorProfile?.displayName ?? subjectName);
  const [avatarUrl, setAvatarUrl] = useState(buyerProfile?.avatarUrl ?? creatorProfile?.avatarUrl ?? subjectName.slice(0, 1));
  const [profileSlogan, setProfileSlogan] = useState(buyerProfile?.profileSlogan ?? creatorProfile?.profileSlogan ?? "");
  const [industry, setIndustry] = useState(buyerProfile?.industry ?? "");
  const [province, setProvince] = useState(initialLocation.province);
  const [city, setCity] = useState(initialLocation.city);
  const [companyIntro, setCompanyIntro] = useState(buyerProfile?.companyIntro ?? creatorProfile?.bio ?? "");
  const [verificationType, setVerificationType] = useState<VerificationType>(buyerProfile?.verificationType ?? creatorProfile?.verificationType ?? "enterprise");
  const [contactEmail, setContactEmail] = useState(buyerProfile?.contactEmail ?? creatorProfile?.contactEmail ?? session?.email ?? "");
  const [contactPhone, setContactPhone] = useState(buyerProfile?.contactPhone ?? creatorProfile?.contactPhone ?? session?.phone ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(buyerProfile?.websiteUrl ?? creatorProfile?.websiteUrl ?? "");
  const [socialUrl, setSocialUrl] = useState(buyerProfile?.socialUrl ?? creatorProfile?.socialUrl ?? "");
  const [serviceArea, setServiceArea] = useState(buyerProfile?.serviceArea ?? creatorProfile?.serviceArea ?? "");
  const [businessLicenseFile, setBusinessLicenseFile] = useState(buyerProfile?.businessLicenseFile ?? creatorProfile?.credentialFile ?? "");
  const [qualificationFiles, setQualificationFiles] = useState((buyerProfile?.qualificationFiles ?? creatorProfile?.qualificationFiles ?? []).join("\n"));
  const [saveStatus, setSaveStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const cityOptions = provinceCityOptions.find((item) => item.province === province)?.cities ?? [];
  const location = joinProvinceCity(province, city);
  const credentialOptional = credentialUploadOptional(verificationType);

  const history = useMemo(
    () => data.projects.filter((project) => project.buyerId === session?.userId).slice(0, 4),
    [data.projects, session?.userId]
  );

  async function handleAvatarUpload(files: FileList | null) {
    const file = files?.[0];
    if (file) await uploadOrPreviewImage(file, "avatars", setAvatarUrl);
  }

  async function handleMainCredentialUpload(files: FileList | null) {
    const [fileName] = await uploadCredentialFiles(files, "main-credentials");
    if (fileName) setBusinessLicenseFile(fileName);
  }

  async function handleQualificationUpload(files: FileList | null) {
    const names = await uploadCredentialFiles(files, "qualifications");
    if (names.length) setQualificationFiles((current) => [...splitList(current), ...names].join("\n"));
  }

  async function saveSubjectProfile() {
    const input = {
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
    };
    const headers: HeadersInit = {
      Accept: "application/json",
      "Content-Type": "application/json"
    };

    if (session?.accessToken) {
      headers.Authorization = `Bearer ${session.accessToken}`;
    }

    const response = await fetch("/api/buyers", {
      method: "POST",
      headers,
      body: JSON.stringify(input)
    });
    const payload = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null;
    if (!response.ok || !payload?.ok) {
      throw new Error(payload?.error || "主体资料保存失败，请稍后再试。");
    }

    upsertUnifiedSubjectProfile(input);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveStatus("");
    setIsSaving(true);
    try {
      await saveSubjectProfile();
      setAuthCapability(session?.role ?? "buyer", "pending_review");
      router.push(`/account/capabilities?intent=${encodeURIComponent(intent)}`);
    } catch (error) {
      setSaveStatus(error instanceof Error ? error.message : "主体资料保存失败，请稍后再试。");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="main">
      <section className="profileSetupHero">
        <div className="stack">
          <span className="eyebrow">
            <ShieldCheck size={15} /> 统一主体主页
          </span>
          <div>
            <h1>创建主体主页</h1>
            <p>填写主体基础信息，保存后继续当前业务路径。</p>
          </div>
        </div>
      </section>

      <div className="profileSetupLayout">
        <section className="card">
          <div className="panelTop">
            <div>
              <strong>主体资料与主页装修</strong>
            </div>
            <Building2 size={18} />
          </div>
          <form className="cardBody form" onSubmit={handleSubmit}>
            <div className="notice">
              名称、头像、认证类型、城市、介绍、联系方式和资质材料会统一用于需求方主页和服务方展示页。保存后进入下一步。
            </div>
            <div className="grid two compactGrid">
              <div className="field">
                <label htmlFor="subject-name">名称</label>
                <input id="subject-name" value={companyName} onChange={(event) => setCompanyName(event.target.value)} required />
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

            <div className="grid two compactGrid">
              <div className="field">
                <label htmlFor="profile-slogan">主页一句话简介</label>
                <input id="profile-slogan" value={profileSlogan} onChange={(event) => setProfileSlogan(event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="industry">行业方向</label>
                <input id="industry" value={industry} onChange={(event) => setIndustry(event.target.value)} />
              </div>
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
                      setBusinessLicenseFile(type === "individual" ? "" : `${requiredCredentialLabel(type)}.pdf`);
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
              <label htmlFor="license">{requiredCredentialLabel(verificationType)}{credentialOptional ? "（可选）" : ""}</label>
              {credentialOptional ? null : <input id="license" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" type="file" onChange={(event) => handleMainCredentialUpload(event.target.files)} />}
              <input
                value={businessLicenseFile}
                onChange={(event) => setBusinessLicenseFile(event.target.value)}
                placeholder={credentialOptional ? "个人主体可填写作品页、平台主页或实名备注" : "上传后自动填入文件名"}
                required={!credentialOptional}
              />
            </div>

            <div className="field">
              <label htmlFor="qualifications">其他有效资质</label>
              <input id="qualifications-file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" multiple type="file" onChange={(event) => handleQualificationUpload(event.target.files)} />
              <textarea id="qualifications" value={qualificationFiles} onChange={(event) => setQualificationFiles(event.target.value)} />
            </div>

            <div className="toolbarGroup">
              <button className="btn primary" disabled={isSaving} type="submit">
                <Save size={16} /> {isSaving ? "正在保存..." : "保存主体主页并继续"}
              </button>
              <Link className="btn" href={`/account/capabilities?intent=${encodeURIComponent(intent)}`}>
                已有主体资料，继续当前业务 <ArrowRight size={16} />
              </Link>
            </div>
            {saveStatus ? <div className="notice">{saveStatus}</div> : null}
          </form>
        </section>

        <aside className="profilePreview">
          <div className="panelTop">
            <div>
              <strong>主体主页预览</strong>
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
              <p className="muted" style={{ margin: 0, lineHeight: 1.6 }}>{companyIntro || "基本介绍会展示在这里。"}</p>
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
                <FileBadge2 size={15} /> {publicCredentialSummary(verificationType, Boolean(buyerProfile?.verified || creatorProfile?.verified))}
              </div>
            </div>
          </section>
          <section className="card">
            <div className="cardBody stack">
              <strong>历史需求</strong>
              {history.length ? history.map((project) => (
                <Link className="miniLead" href={`/projects/${project.id}`} key={project.id}>
                  <span>{project.title}</span>
                  <em>{money(project.budget)} · {compactDate(project.createdAt)}</em>
                </Link>
              )) : <div className="muted">启用需求方身份后，这里会展示历史需求。</div>}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

export default function AccountProfilePage() {
  return (
    <Suspense fallback={<main className="main"><div className="notice">正在加载主体主页...</div></main>}>
      <AccountProfileContent />
    </Suspense>
  );
}
