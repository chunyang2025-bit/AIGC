"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Eye, Save, Sparkles, UserRound } from "lucide-react";
import { CreatorCard } from "@/components/CreatorCard";
import { requiredCredentialLabel, verificationTypeLabel } from "@/lib/format";
import { fileNames, readImageFile } from "@/lib/file-upload";
import { joinProvinceCity, provinceCityOptions, splitProvinceCity } from "@/lib/location-options";
import { projectCategoryOptions } from "@/lib/project-categories";
import { loadMarketplaceData, upsertCurrentCreatorProfile } from "@/lib/store";
import { CreatorProfile, ProjectCategory, VerificationType } from "@/lib/types";
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

export default function ProviderProfilePage() {
  const router = useRouter();
  const data = loadMarketplaceData();
  const session = readAuthSession();
  const currentProfile = data.creators.find((creator) => creator.userId === session?.userId);
  const subjectName = currentProfile?.name ?? session?.name ?? "";
  const [name, setName] = useState(subjectName);
  const [displayName, setDisplayName] = useState(currentProfile?.displayName ?? subjectName);
  const [avatarUrl, setAvatarUrl] = useState(currentProfile?.avatarUrl ?? subjectName.slice(0, 1));
  const [profileSlogan, setProfileSlogan] = useState(currentProfile?.profileSlogan ?? "");
  const [title, setTitle] = useState(currentProfile?.title ?? "");
  const initialLocation = splitProvinceCity(currentProfile?.location ?? "");
  const [province, setProvince] = useState(initialLocation.province);
  const [city, setCity] = useState(initialLocation.city);
  const [bio, setBio] = useState(currentProfile?.bio ?? "");
  const [resume, setResume] = useState(currentProfile?.resume ?? "");
  const [skills, setSkills] = useState((currentProfile?.skills ?? []).join(", "));
  const [skillDraft, setSkillDraft] = useState("");
  const [portfolio, setPortfolio] = useState((currentProfile?.portfolio ?? []).join("\n"));
  const [priceMin, setPriceMin] = useState(currentProfile ? String(currentProfile.priceMin) : "");
  const [priceMax, setPriceMax] = useState(currentProfile ? String(currentProfile.priceMax) : "");
  const [responseTime, setResponseTime] = useState(currentProfile?.responseTime ?? "");
  const [identityType, setIdentityType] = useState<VerificationType>(currentProfile?.identityType ?? currentProfile?.verificationType ?? "individual");
  const [credentialFile, setCredentialFile] = useState(currentProfile?.credentialFile ?? "");
  const [qualificationFiles, setQualificationFiles] = useState((currentProfile?.qualificationFiles ?? []).join("\n"));
  const [contactEmail, setContactEmail] = useState(currentProfile?.contactEmail ?? session?.email ?? "");
  const [contactPhone, setContactPhone] = useState(currentProfile?.contactPhone ?? session?.phone ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(currentProfile?.websiteUrl ?? "");
  const [socialUrl, setSocialUrl] = useState(currentProfile?.socialUrl ?? "");
  const [serviceArea, setServiceArea] = useState(currentProfile?.serviceArea ?? "");
  const [categories, setCategories] = useState<ProjectCategory[]>(currentProfile?.categories ?? ["AI Short Video"]);
  const cityOptions = provinceCityOptions.find((item) => item.province === province)?.cities ?? [];
  const location = joinProvinceCity(province, city);

  const preview = useMemo<CreatorProfile>(
    () => ({
      id: "c-preview",
      userId: "u-creator-self",
      name: name || "展示名称",
      title: title || "服务定位",
      location: location || "所在城市",
      bio: bio || "服务介绍会展示在这里，帮助派单方判断是否适合沟通。",
      resume: resume || "简历/履历会展示在这里。",
      skills: splitList(skills).length ? splitList(skills) : ["AI内容创作"],
      categories,
      portfolio: splitList(portfolio),
      priceMin: Number(priceMin) || 0,
      priceMax: Number(priceMax) || 0,
      completedProjects: 0,
      rating: 4.6,
      responseTime: responseTime || "待填写",
      verified: false,
      identityType,
      verificationType: identityType,
      credentialFile,
      qualificationFiles: splitList(qualificationFiles),
      avatarUrl,
      displayName: displayName || name || "主页昵称",
      profileSlogan: profileSlogan || "主页一句话简介",
      websiteUrl,
      socialUrl,
      serviceArea,
      contactEmail,
      contactPhone,
      cover: "linear-gradient(135deg, #153f31, #2f7c5f 46%, #f0b35a)"
    }),
    [avatarUrl, bio, categories, contactEmail, contactPhone, credentialFile, displayName, identityType, location, name, portfolio, priceMax, priceMin, profileSlogan, qualificationFiles, responseTime, resume, serviceArea, skills, socialUrl, title, websiteUrl]
  );

  function toggleCategory(category: ProjectCategory) {
    setCategories((current) =>
      current.includes(category) ? current.filter((item) => item !== category) : [...current, category]
    );
  }

  function addSkillTag() {
    const next = skillDraft.trim();
    if (!next) return;
    const current = splitList(skills);
    if (!current.includes(next)) {
      setSkills([...current, next].join(", "));
    }
    setSkillDraft("");
  }

  function removeSkillTag(tag: string) {
    setSkills(splitList(skills).filter((item) => item !== tag).join(", "));
  }

  function handleAvatarUpload(files: FileList | null) {
    const file = files?.[0];
    if (file) {
      readImageFile(file, setAvatarUrl);
    }
  }

  function handleCredentialUpload(files: FileList | null) {
    const [fileName] = fileNames(files);
    if (fileName) {
      setCredentialFile(fileName);
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
    upsertCurrentCreatorProfile({
      name,
      title,
      location,
      bio,
      resume,
      skills: preview.skills,
      categories: preview.categories.length ? preview.categories : ["AI Short Video"],
      portfolio: preview.portfolio,
      priceMin: preview.priceMin,
      priceMax: preview.priceMax,
      responseTime,
      identityType,
      avatarUrl,
      displayName,
      profileSlogan,
      websiteUrl,
      socialUrl,
      serviceArea,
      credentialFile,
      qualificationFiles: splitList(qualificationFiles),
      contactEmail,
      contactPhone
    });
    setAuthCapability("creator", "pending_review");
    router.push("/provider");
  }

  return (
    <main className="main">
      <section className="profileSetupHero">
        <div className="stack">
          <span className="eyebrow">
            <UserRound size={15} /> 接单方入驻
          </span>
          <div>
            <h1>先完善创作者展示页，再进入需求大厅</h1>
            <p>派单方会先看你的服务定位、案例方向、报价区间和响应速度。资料越完整，越容易被主动邀请沟通。</p>
          </div>
          <div className="profileSteps">
            <span>
              <CheckCircle2 size={15} /> 填写展示页
            </span>
            <span>
              <Eye size={15} /> 出现在创作者大厅
            </span>
            <span>
              <BriefcaseBusiness size={15} /> 浏览公开需求
            </span>
          </div>
        </div>
      </section>

      <div className="profileSetupLayout">
        <section className="card">
          <div className="panelTop">
            <div>
              <strong>创作者展示页资料</strong>
              <div className="muted">这些信息会展示给需求发布方，并用于匹配 Agent 进行推荐。</div>
            </div>
            <Sparkles size={18} />
          </div>
          <form className="cardBody form" onSubmit={handleSubmit}>
            <div className="grid two compactGrid">
              <div className="field">
                <label htmlFor="creator-name">展示名称</label>
                <input id="creator-name" value={name} onChange={(event) => setName(event.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="creator-display">主页昵称</label>
                <input id="creator-display" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
              </div>
            </div>

            <div className="grid two compactGrid">
              <div className="field">
                <label htmlFor="creator-avatar-file">头像/Logo</label>
                <div className="uploadBox">
                  <span className="avatar previewAvatar">
                    {avatarUrl.startsWith("data:image/") || avatarUrl.startsWith("http") ? <img alt="头像预览" src={avatarUrl} /> : avatarUrl.slice(0, 1) || displayName.slice(0, 1)}
                  </span>
                  <div>
                    <input id="creator-avatar-file" accept="image/*" type="file" onChange={(event) => handleAvatarUpload(event.target.files)} />
                    <span className="fieldHint">支持 JPG、PNG 等图片，上传后会用于创作者展示页。</span>
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
              <label htmlFor="creator-title">服务定位</label>
              <input id="creator-title" value={title} onChange={(event) => setTitle(event.target.value)} required />
            </div>

            <div className="field">
              <label>认证主体类型</label>
              <div className="checkPillGrid identityGrid">
                {verificationTypes.map((type) => (
                  <button
                    className={identityType === type ? "checkPill active" : "checkPill"}
                    key={type}
                    onClick={() => {
                      setIdentityType(type);
                      setCredentialFile(`${requiredCredentialLabel(type)}.pdf`);
                    }}
                    type="button"
                  >
                    <CheckCircle2 size={15} /> {verificationTypeLabel(type)}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>可接需求类型</label>
              <div className="checkPillGrid">
                {projectCategoryOptions.map(({ value: category, label }) => (
                  <button
                    className={categories.includes(category) ? "checkPill active" : "checkPill"}
                    key={category}
                    onClick={() => toggleCategory(category)}
                    type="button"
                  >
                    <CheckCircle2 size={15} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label htmlFor="creator-skills">技能标签</label>
              <div className="tagEditor">
                <div className="tagList">
                  {splitList(skills).map((tag) => (
                    <button className="tag removableTag" key={tag} onClick={() => removeSkillTag(tag)} type="button">
                      {tag} ×
                    </button>
                  ))}
                </div>
                <div className="tagInputRow">
                  <input
                    id="creator-skills"
                    placeholder="输入自定义标签，例如：小红书种草"
                    value={skillDraft}
                    onChange={(event) => setSkillDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addSkillTag();
                      }
                    }}
                  />
                  <button className="btn" onClick={addSkillTag} type="button">添加标签</button>
                </div>
              </div>
              <span className="fieldHint">预设类型用于筛选匹配，自定义标签用于展示更细能力；点击标签可删除。</span>
            </div>

            <div className="grid two compactGrid">
              <div className="field">
                <label htmlFor="price-min">报价下限</label>
                <input id="price-min" inputMode="numeric" value={priceMin} onChange={(event) => setPriceMin(event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="price-max">报价上限</label>
                <input id="price-max" inputMode="numeric" value={priceMax} onChange={(event) => setPriceMax(event.target.value)} />
              </div>
            </div>

            <div className="field">
              <label htmlFor="response-time">响应速度</label>
              <input id="response-time" value={responseTime} onChange={(event) => setResponseTime(event.target.value)} />
            </div>

            <div className="grid two compactGrid">
              <div className="field">
                <label htmlFor="creator-email">联系邮箱</label>
                <input id="creator-email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="creator-phone">联系电话</label>
                <input id="creator-phone" value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} />
              </div>
            </div>

            <div className="grid two compactGrid">
              <div className="field">
                <label htmlFor="creator-website">官网/作品页</label>
                <input id="creator-website" value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="creator-social">社媒主页</label>
                <input id="creator-social" value={socialUrl} onChange={(event) => setSocialUrl(event.target.value)} />
              </div>
            </div>

            <div className="field">
              <label htmlFor="creator-area">服务地区/协作方式</label>
              <input id="creator-area" value={serviceArea} onChange={(event) => setServiceArea(event.target.value)} />
            </div>

            <div className="field">
              <label htmlFor="creator-credential">{requiredCredentialLabel(identityType)}</label>
              <input id="creator-credential" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" type="file" onChange={(event) => handleCredentialUpload(event.target.files)} />
              <input value={credentialFile} onChange={(event) => setCredentialFile(event.target.value)} placeholder="上传后自动填入文件名" required />
              <span className="fieldHint">支持 PDF、图片或文档。当前 demo 保存文件名，接入 Supabase Storage 后可保存文件地址。</span>
            </div>

            <div className="field">
              <label htmlFor="creator-qualifications">其他资质/证明材料</label>
              <input id="creator-qualifications-file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" multiple type="file" onChange={(event) => handleQualificationUpload(event.target.files)} />
              <textarea id="creator-qualifications" value={qualificationFiles} onChange={(event) => setQualificationFiles(event.target.value)} />
              <span className="fieldHint">可多选文件；每行一个资质，例如品牌授权、过往案例授权、行业证书等。</span>
            </div>

            <div className="field">
              <label htmlFor="creator-bio">服务介绍</label>
              <textarea id="creator-bio" value={bio} onChange={(event) => setBio(event.target.value)} required />
            </div>

            <div className="field">
              <label htmlFor="creator-resume">简历/履历</label>
              <textarea id="creator-resume" value={resume} onChange={(event) => setResume(event.target.value)} required />
              <span className="fieldHint">这部分会展示在你的主页里，发起沟通时会随展示页一起发送给派单方。</span>
            </div>

            <div className="field">
              <label htmlFor="creator-portfolio">代表作</label>
              <textarea id="creator-portfolio" value={portfolio} onChange={(event) => setPortfolio(event.target.value)} />
              <span className="fieldHint">每行一个代表作，可写标题、链接或简短说明。发起沟通时不用重复填写，会包含在展示页里。</span>
            </div>

            <div className="toolbarGroup">
              <button className="btn primary" type="submit">
                <Save size={16} /> 提交展示页并等待审核
              </button>
              <Link className="btn" href="/creators">
                查看创作者大厅 <ArrowRight size={16} />
              </Link>
            </div>
          </form>
        </section>

        <aside className="profilePreview">
          <div className="panelTop">
            <div>
              <strong>展示效果预览</strong>
              <div className="muted">保存后会进入首页精选池和创作者信息大厅。</div>
            </div>
            <Eye size={18} />
          </div>
          <CreatorCard creator={preview} />
          <div className="notice">
            这里是你的公开展示资料，派单方会根据服务方向、代表作和联系方式判断是否继续沟通。
          </div>
        </aside>
      </div>
    </main>
  );
}
