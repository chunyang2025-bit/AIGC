"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Eye, Save, Sparkles, UserRound } from "lucide-react";
import { CreatorCard } from "@/components/CreatorCard";
import { credentialRequirementHint, credentialUploadOptional, requiredCredentialLabel, verificationTypeLabel } from "@/lib/format";
import { uploadCredentialFiles, uploadOrPreviewImage } from "@/lib/file-upload";
import { joinProvinceCity, provinceCityOptions, splitProvinceCity } from "@/lib/location-options";
import { projectCategoryOptions } from "@/lib/project-categories";
import { loadMarketplaceData, upsertCurrentCreatorProfile } from "@/lib/store";
import { trainingFormatOptions } from "@/lib/training";
import { CreatorProfile, PortfolioItem, ProjectCategory, ServicePackage, TrainingFormat, VerificationType } from "@/lib/types";
import { readAuthSession, setAuthCapability } from "@/lib/auth";
import { readRemixDraft } from "@/lib/remix-draft";

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

function parsePortfolioItems(value: string, fallbackCategory: ProjectCategory): PortfolioItem[] {
  return value
    .split("\n")
    .map((line, index) => {
      const [title = "", category = fallbackCategory, description = "", url = ""] = line.split("|").map((item) => item.trim());
      if (!title) return null;
      return {
        id: `pf-${index + 1}`,
        title,
        category: category as ProjectCategory,
        description,
        url,
        public: true
      } satisfies PortfolioItem;
    })
    .filter(Boolean) as PortfolioItem[];
}

function parseServicePackages(value: string): ServicePackage[] {
  return value
    .split("\n")
    .map((line, index) => {
      const [name = "", price = "0", deliveryDays = "0", revisions = "0", deliverables = "", description = ""] = line.split("|").map((item) => item.trim());
      if (!name) return null;
      return {
        id: `sp-${index + 1}`,
        name,
        price: Number(price) || 0,
        deliveryDays: Number(deliveryDays) || 0,
        revisions: Number(revisions) || 0,
        deliverables: splitList(deliverables),
        description
      } satisfies ServicePackage;
    })
    .filter(Boolean) as ServicePackage[];
}

function portfolioLines(profile?: CreatorProfile) {
  if (profile?.portfolioItems?.length) {
    return profile.portfolioItems
      .map((item) => [item.title, item.category, item.description, item.url ?? ""].join(" | "))
      .join("\n");
  }
  return (profile?.portfolio ?? []).join("\n");
}

function servicePackageLines(profile?: CreatorProfile) {
  return (profile?.servicePackages ?? [])
    .map((item) => [item.name, item.price, item.deliveryDays, item.revisions, item.deliverables.join("、"), item.description].join(" | "))
    .join("\n");
}

function ProviderProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intent = searchParams.get("category") === "AIGC Training" ? "training_provider" : "service";
  const data = loadMarketplaceData();
  const session = readAuthSession();
  const currentProfile = data.creators.find((creator) => creator.userId === session?.userId);
  const wantsTraining = searchParams.get("category") === "AIGC Training";
  const startsAsTraining = !currentProfile && wantsTraining;
  const shouldPrefillTraining = wantsTraining && !currentProfile?.trainingProfile;
  const subjectProfile = data.buyerProfiles?.find((profile) => profile.userId === session?.userId);
  const subjectName = currentProfile?.name ?? subjectProfile?.companyName ?? session?.name ?? "";
  const remixSource = searchParams.get("remix");
  const [name, setName] = useState(subjectName);
  const [displayName, setDisplayName] = useState(currentProfile?.displayName ?? subjectProfile?.displayName ?? subjectName);
  const [avatarUrl, setAvatarUrl] = useState(currentProfile?.avatarUrl ?? subjectProfile?.avatarUrl ?? subjectName.slice(0, 1));
  const [profileSlogan, setProfileSlogan] = useState(currentProfile?.profileSlogan ?? subjectProfile?.profileSlogan ?? "");
  const [title, setTitle] = useState(currentProfile?.title ?? (wantsTraining ? "AIGC企业培训讲师/服务方" : ""));
  const initialLocation = splitProvinceCity(currentProfile?.location ?? subjectProfile?.location ?? "");
  const [province, setProvince] = useState(initialLocation.province);
  const [city, setCity] = useState(initialLocation.city);
  const [bio, setBio] = useState(currentProfile?.bio ?? subjectProfile?.companyIntro ?? "");
  const [resume, setResume] = useState(currentProfile?.resume ?? "");
  const [skills, setSkills] = useState((currentProfile?.skills ?? (startsAsTraining ? ["AIGC培训", "提示词工程", "AI办公", "企业内训"] : [])).join(", "));
  const [skillDraft, setSkillDraft] = useState("");
  const [portfolio, setPortfolio] = useState(portfolioLines(currentProfile));
  const [servicePackages, setServicePackages] = useState(servicePackageLines(currentProfile) || (wantsTraining ? "AIGC实战内训 | 12000 | 7 | 1 | 培训方案、1天授课、实操案例、课件资料 | 适合企业团队快速建立AI实操能力" : ""));
  const [packageName, setPackageName] = useState("");
  const [packagePrice, setPackagePrice] = useState("");
  const [packageDeliveryDays, setPackageDeliveryDays] = useState("");
  const [packageRevisions, setPackageRevisions] = useState("1");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [packageDeliverables, setPackageDeliverables] = useState("");
  const [packageDescription, setPackageDescription] = useState("");
  const [priceMin, setPriceMin] = useState(currentProfile ? String(currentProfile.priceMin) : startsAsTraining ? "6000" : "");
  const [priceMax, setPriceMax] = useState(currentProfile ? String(currentProfile.priceMax) : startsAsTraining ? "30000" : "");
  const [responseTime, setResponseTime] = useState(currentProfile?.responseTime ?? (wantsTraining ? "4小时" : ""));
  const [identityType, setIdentityType] = useState<VerificationType>(currentProfile?.identityType ?? currentProfile?.verificationType ?? subjectProfile?.verificationType ?? "individual");
  const [credentialFile, setCredentialFile] = useState(currentProfile?.credentialFile ?? subjectProfile?.businessLicenseFile ?? "");
  const [qualificationFiles, setQualificationFiles] = useState((currentProfile?.qualificationFiles ?? subjectProfile?.qualificationFiles ?? []).join("\n"));
  const [contactEmail, setContactEmail] = useState(currentProfile?.contactEmail ?? subjectProfile?.contactEmail ?? session?.email ?? "");
  const [contactPhone, setContactPhone] = useState(currentProfile?.contactPhone ?? subjectProfile?.contactPhone ?? session?.phone ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(currentProfile?.websiteUrl ?? subjectProfile?.websiteUrl ?? "");
  const [socialUrl, setSocialUrl] = useState(currentProfile?.socialUrl ?? subjectProfile?.socialUrl ?? "");
  const [serviceArea, setServiceArea] = useState(currentProfile?.serviceArea ?? subjectProfile?.serviceArea ?? (wantsTraining ? "全国线上，可承接线下内训" : ""));
  const [categories, setCategories] = useState<ProjectCategory[]>(currentProfile?.categories ? (wantsTraining && !currentProfile.categories.includes("AIGC Training") ? [...currentProfile.categories, "AIGC Training"] : currentProfile.categories) : startsAsTraining ? ["AIGC Training"] : ["AI Short Video"]);
  const [trainingTopics, setTrainingTopics] = useState((currentProfile?.trainingProfile?.topics ?? (shouldPrefillTraining ? ["提示词工程", "AI办公提效", "AI营销内容", "AI短视频"] : [])).join("、"));
  const [trainingFormats, setTrainingFormats] = useState<TrainingFormat[]>(currentProfile?.trainingProfile?.formats ?? (shouldPrefillTraining ? ["online", "offline", "workshop"] : ["online"]));
  const [trainingAudience, setTrainingAudience] = useState((currentProfile?.trainingProfile?.audience ?? (shouldPrefillTraining ? ["运营团队", "市场团队", "设计团队", "管理层"] : [])).join("、"));
  const [trainingCities, setTrainingCities] = useState((currentProfile?.trainingProfile?.cities ?? (shouldPrefillTraining ? ["全国线上", "上海", "杭州", "北京"] : [])).join("、"));
  const [trainingCases, setTrainingCases] = useState((currentProfile?.trainingProfile?.caseStudies ?? (shouldPrefillTraining ? ["为企业团队设计AIGC实战工作坊，覆盖提示词、内容生成和业务案例练习"] : [])).join("\n"));
  const [trainingMaterials, setTrainingMaterials] = useState((currentProfile?.trainingProfile?.materials ?? (shouldPrefillTraining ? ["课件", "练习任务", "工具清单", "课后答疑"] : [])).join("、"));
  const [trainingPricingNote, setTrainingPricingNote] = useState(currentProfile?.trainingProfile?.pricingNote ?? (shouldPrefillTraining ? "支持半日、全天工作坊和长期陪跑报价。" : ""));
  const [trainingCustomizable, setTrainingCustomizable] = useState(currentProfile?.trainingProfile?.customizable ?? true);
  const [loadedCreatorRemix, setLoadedCreatorRemix] = useState("");
  const cityOptions = provinceCityOptions.find((item) => item.province === province)?.cities ?? [];
  const location = joinProvinceCity(province, city);
  const offersTraining = categories.includes("AIGC Training");
  const credentialOptional = credentialUploadOptional(identityType);
  const parsedPortfolioItems = useMemo(
    () => parsePortfolioItems(portfolio, categories[0] ?? "AI Short Video"),
    [categories, portfolio]
  );
  const parsedServicePackages = useMemo(
    () => parseServicePackages(servicePackages),
    [servicePackages]
  );

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
      portfolio: parsedPortfolioItems.length ? parsedPortfolioItems.map((item) => item.title) : splitList(portfolio),
      portfolioItems: parsedPortfolioItems,
      servicePackages: parsedServicePackages,
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
      trainingProfile: offersTraining
        ? {
            topics: splitList(trainingTopics),
            formats: trainingFormats,
            audience: splitList(trainingAudience),
            cities: splitList(trainingCities),
            caseStudies: splitList(trainingCases),
            materials: splitList(trainingMaterials),
            pricingNote: trainingPricingNote,
            customizable: trainingCustomizable
          }
        : undefined,
      cover: "linear-gradient(135deg, #153f31, #2f7c5f 46%, #f0b35a)"
    }),
    [avatarUrl, bio, categories, contactEmail, contactPhone, credentialFile, displayName, identityType, location, name, offersTraining, parsedPortfolioItems, parsedServicePackages, portfolio, priceMax, priceMin, profileSlogan, qualificationFiles, responseTime, resume, serviceArea, skills, socialUrl, title, trainingAudience, trainingCases, trainingCities, trainingCustomizable, trainingFormats, trainingMaterials, trainingPricingNote, trainingTopics, websiteUrl]
  );

  function toggleCategory(category: ProjectCategory) {
    setCategories((current) =>
      current.includes(category) ? current.filter((item) => item !== category) : [...current, category]
    );
  }

  useEffect(() => {
    if (remixSource !== "creator" || currentProfile) return;
    const remix = readRemixDraft();
    if (!remix || remix.type !== "creator") return;
    const source = remix.creator;
    setTitle(source.title);
    setBio(`参考「${remix.sourceName}」主页结构：${source.bio}`);
    setSkills(source.skills.join(", "));
    setCategories(source.categories);
    setPriceMin(String(source.priceMin || ""));
    setPriceMax(String(source.priceMax || ""));
    setResponseTime(source.responseTime || "");
    setServiceArea(source.serviceArea || "");
    if (source.servicePackages?.length) {
      setServicePackages(source.servicePackages.map((item) => [
        item.name,
        item.price,
        item.deliveryDays,
        item.revisions,
        item.deliverables.join("、"),
        item.description
      ].join(" | ")).join("\n"));
    }
    if (source.trainingProfile) {
      setTrainingTopics(source.trainingProfile.topics.join("、"));
      setTrainingFormats(source.trainingProfile.formats);
      setTrainingAudience(source.trainingProfile.audience.join("、"));
      setTrainingCities(source.trainingProfile.cities.join("、"));
      setTrainingCases(source.trainingProfile.caseStudies.join("\n"));
      setTrainingMaterials(source.trainingProfile.materials.join("、"));
      setTrainingPricingNote(source.trainingProfile.pricingNote ?? "");
      setTrainingCustomizable(source.trainingProfile.customizable);
    }
    setLoadedCreatorRemix(remix.sourceName);
  }, [currentProfile, remixSource]);

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

  function toggleTrainingFormat(format: TrainingFormat) {
    setTrainingFormats((current) =>
      current.includes(format) ? current.filter((item) => item !== format) : [...current, format]
    );
  }

  function addServicePackage() {
    const name = packageName.trim();
    if (!name) return;
    const line = [
      name,
      Number(packagePrice) || 0,
      Number(packageDeliveryDays) || 0,
      Number(packageRevisions) || 0,
      packageDeliverables.trim(),
      packageDescription.trim()
    ].join(" | ");
    setServicePackages((current) => [current.trim(), line].filter(Boolean).join("\n"));
    setPackageName("");
    setPackagePrice("");
    setPackageDeliveryDays("");
    setPackageRevisions("1");
    setPackageDeliverables("");
    setPackageDescription("");
  }

  async function handleAvatarUpload(files: FileList | null) {
    const file = files?.[0];
    if (file) {
      await uploadOrPreviewImage(file, "avatars", setAvatarUrl);
    }
  }

  async function handleCredentialUpload(files: FileList | null) {
    const [fileName] = await uploadCredentialFiles(files, "creator-credentials");
    if (fileName) {
      setCredentialFile(fileName);
    }
  }

  async function handleQualificationUpload(files: FileList | null) {
    const names = await uploadCredentialFiles(files, "creator-qualifications");
    if (names.length) {
      setQualificationFiles((current) => [...splitList(current), ...names].join("\n"));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveStatus("");
    setIsSaving(true);
    try {
      await upsertCurrentCreatorProfile({
        name,
        title,
        location,
        bio,
        resume,
        skills: preview.skills,
        categories: preview.categories.length ? preview.categories : ["AI Short Video"],
        portfolio: preview.portfolio,
        portfolioItems: preview.portfolioItems,
        servicePackages: preview.servicePackages,
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
        contactPhone,
        trainingProfile: preview.trainingProfile
      });
      setAuthCapability("creator", "registered");
      router.push(`/account/verification?intent=${encodeURIComponent(intent)}&saved=1`);
    } catch (error) {
      setSaveStatus(error instanceof Error ? error.message : "服务主页保存失败，请稍后再试。");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="main">
      <section className="profileSetupHero">
        <div className="stack">
          <span className="eyebrow">
            <UserRound size={15} /> 服务方能力
          </span>
          <div>
            <h1>{wantsTraining ? "生成培训服务主页" : "生成服务主页"}</h1>
            <p>主体资料会自动继承。先填展示名称、服务定位、方向标签、报价和联系方式；服务包、案例和介绍保存后会直接用于展示，资质材料再进入认证中心提交审核。</p>
          </div>
          <div className="profileSteps">
            <span>
              <CheckCircle2 size={15} /> 3分钟生成主页
            </span>
            <span>
              <Eye size={15} /> 首批优先展示
            </span>
            <span>
              <BriefcaseBusiness size={15} /> 分享获得线索
            </span>
          </div>
        </div>
      </section>

      <div className="profileSetupLayout">
        <section className="card">
          <div className="panelTop">
            <div>
              <strong>先生成可分享主页</strong>
              <div className="muted">试运营期免费入驻。资料越完整，越容易进入首页精选池和需求方推荐。</div>
            </div>
            <Sparkles size={18} />
          </div>
          <div className="notice">
            轻入驻建议：先完成展示名称、服务定位、可接方向、报价和联系方式；先保存主页，服务内容会先展示，资质材料再在下一步提交认证审核。
          </div>
          {currentProfile?.verified || subjectProfile?.verified ? (
            <div className="notice">
              已认证后仍可继续更新服务主页。案例、报价、介绍和服务包会直接生效；只有展示主体名称、认证类型或资质材料这类关键信息变更时，系统才会要求重新提交审核。
            </div>
          ) : null}
          {loadedCreatorRemix ? (
            <div className="notice">
              已参考「{loadedCreatorRemix}」的主页结构。请替换为你的真实服务能力、案例、报价和联系方式后再保存主页。
            </div>
          ) : null}
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

            <div className="field">
              <label htmlFor="creator-area">服务地区/协作方式</label>
              <input id="creator-area" value={serviceArea} onChange={(event) => setServiceArea(event.target.value)} />
            </div>

            <div className="field">
              <label htmlFor="creator-bio">服务介绍</label>
              <textarea id="creator-bio" value={bio} onChange={(event) => setBio(event.target.value)} required />
            </div>

            <details className="optionalSection">
              <summary>后补增强信息、服务包和认证材料</summary>
              <div className="optionalSectionBody">
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
                  <label>认证主体类型</label>
                  <div className="checkPillGrid identityGrid">
                    {verificationTypes.map((type) => (
                      <button
                        className={identityType === type ? "checkPill active" : "checkPill"}
                        key={type}
                        onClick={() => {
                          setIdentityType(type);
                          setCredentialFile(type === "individual" ? "" : `${requiredCredentialLabel(type)}.pdf`);
                        }}
                        type="button"
                      >
                        <CheckCircle2 size={15} /> {verificationTypeLabel(type)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="creator-credential">{requiredCredentialLabel(identityType)}（可后补）</label>
                  {credentialOptional ? null : <input id="creator-credential" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" type="file" onChange={(event) => handleCredentialUpload(event.target.files)} />}
                  <input
                    value={credentialFile}
                    onChange={(event) => setCredentialFile(event.target.value)}
                    placeholder={credentialOptional ? "个人主体可填写作品页、平台主页或实名备注" : "上传后自动填入文件名，也可后续补充"}
                  />
                  <span className="fieldHint">{credentialRequirementHint(identityType)} 试运营期间可先保存主页，正式认证前再补齐。</span>
                </div>

                <div className="field">
                  <label htmlFor="creator-qualifications">其他资质/证明材料</label>
                  <input id="creator-qualifications-file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" multiple type="file" onChange={(event) => handleQualificationUpload(event.target.files)} />
                  <textarea id="creator-qualifications" value={qualificationFiles} onChange={(event) => setQualificationFiles(event.target.value)} />
                  <span className="fieldHint">可多选文件；每行一个资质，例如品牌授权、过往案例授权、行业证书等。</span>
                </div>

                <div className="field">
                  <label htmlFor="service-packages">服务包/报价</label>
                  <div className="briefBlock">
                    <div className="grid two compactGrid">
                      <input aria-label="服务包名称" placeholder="服务包名称，例如：基础短视频包" value={packageName} onChange={(event) => setPackageName(event.target.value)} />
                      <input aria-label="价格" inputMode="numeric" placeholder="价格，例如：1200" value={packagePrice} onChange={(event) => setPackagePrice(event.target.value)} />
                    </div>
                    <div className="grid three compactGrid">
                      <input aria-label="交付天数" inputMode="numeric" placeholder="交付天数" value={packageDeliveryDays} onChange={(event) => setPackageDeliveryDays(event.target.value)} />
                      <input aria-label="修改次数" inputMode="numeric" placeholder="修改次数" value={packageRevisions} onChange={(event) => setPackageRevisions(event.target.value)} />
                      <input aria-label="交付物" placeholder="交付物，用顿号分隔" value={packageDeliverables} onChange={(event) => setPackageDeliverables(event.target.value)} />
                    </div>
                    <input aria-label="服务包说明" placeholder="说明，例如：适合单条短视频试投" value={packageDescription} onChange={(event) => setPackageDescription(event.target.value)} />
                    <button className="btn" onClick={addServicePackage} type="button">添加服务包</button>
                  </div>
                  <textarea
                    id="service-packages"
                    value={servicePackages}
                    onChange={(event) => setServicePackages(event.target.value)}
                    placeholder={"基础短视频包 | 1200 | 5 | 1 | 脚本、成片、字幕 | 适合单条短视频试投\n电商图片包 | 1800 | 4 | 2 | 主图、场景图、详情页图 | 适合商品上新"}
                  />
                  <span className="fieldHint">每行一个服务包，格式：名称 | 价格 | 交付天数 | 修改次数 | 交付物 | 说明。</span>
                </div>

                <div className="field">
                  <label htmlFor="creator-resume">简历/履历</label>
                  <textarea id="creator-resume" value={resume} onChange={(event) => setResume(event.target.value)} />
                  <span className="fieldHint">建议补充过往经历或培训背景；后续补全会提升推荐权重。</span>
                </div>

                <div className="field">
                  <label htmlFor="creator-portfolio">代表作</label>
                  <textarea
                    id="creator-portfolio"
                    value={portfolio}
                    onChange={(event) => setPortfolio(event.target.value)}
                    placeholder={"智能台灯短视频 | AI Short Video | 3版开头钩子和15秒竖屏成片 | https://example.com/case\n咖啡店海报系列 | Image Design | 6张社媒海报和门店屏幕图 | https://example.com/poster"}
                  />
                  <span className="fieldHint">每行一个代表作，格式：标题 | 品类英文值 | 项目说明 | 链接。旧格式纯标题也兼容。</span>
                </div>

                {offersTraining ? (
                  <div className="briefBlock">
                    <div className="spaceBetween">
                      <strong>AIGC培训能力</strong>
                      <span className="tag blue">培训服务</span>
                    </div>
                    <div className="field">
                      <label htmlFor="training-topics">可讲主题</label>
                      <input id="training-topics" value={trainingTopics} onChange={(event) => setTrainingTopics(event.target.value)} placeholder="提示词工程、AI办公、AI营销、AI设计、AI视频、数字人" />
                    </div>
                    <div className="field">
                      <label>培训形式</label>
                      <div className="tagList">
                        {trainingFormatOptions.map((item) => (
                          <button className={trainingFormats.includes(item.value) ? "tag green" : "tag"} key={item.value} onClick={() => toggleTrainingFormat(item.value)} type="button">
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid two compactGrid">
                      <div className="field">
                        <label htmlFor="training-audience">适合对象</label>
                        <input id="training-audience" value={trainingAudience} onChange={(event) => setTrainingAudience(event.target.value)} placeholder="管理层、市场团队、设计团队、教师、开发团队" />
                      </div>
                      <div className="field">
                        <label htmlFor="training-cities">可线下城市</label>
                        <input id="training-cities" value={trainingCities} onChange={(event) => setTrainingCities(event.target.value)} placeholder="全国线上、杭州、上海、北京" />
                      </div>
                    </div>
                    <div className="field">
                      <label htmlFor="training-cases">培训案例</label>
                      <textarea id="training-cases" value={trainingCases} onChange={(event) => setTrainingCases(event.target.value)} placeholder="每行一个案例，例如：为某电商团队做AI商品图工作坊，30人，半天实操" />
                    </div>
                    <div className="grid two compactGrid">
                      <div className="field">
                        <label htmlFor="training-materials">交付材料</label>
                        <input id="training-materials" value={trainingMaterials} onChange={(event) => setTrainingMaterials(event.target.value)} placeholder="课件、练习、工具清单、录播、课后答疑" />
                      </div>
                      <div className="field">
                        <label htmlFor="training-pricing">报价说明</label>
                        <input id="training-pricing" value={trainingPricingNote} onChange={(event) => setTrainingPricingNote(event.target.value)} placeholder="半日/全天/按人/按项目报价" />
                      </div>
                    </div>
                    <button className={trainingCustomizable ? "tag green" : "tag"} onClick={() => setTrainingCustomizable((value) => !value)} type="button">
                      {trainingCustomizable ? "已选择" : "可选"} · 支持企业定制案例
                    </button>
                  </div>
                ) : null}
              </div>
            </details>

            <div className="toolbarGroup">
              <button className="btn primary" disabled={isSaving} type="submit">
                <Save size={16} /> {isSaving ? "正在保存..." : "保存主页并前往资质认证"}
              </button>
              <Link className="btn" href="/creators">
                查看创作者大厅 <ArrowRight size={16} />
              </Link>
            </div>
            {saveStatus ? <div className="notice">{saveStatus}</div> : null}
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

export default function ProviderProfilePage() {
  return (
    <Suspense fallback={<main className="main"><div className="notice">正在加载接单资料表单...</div></main>}>
      <ProviderProfileContent />
    </Suspense>
  );
}
