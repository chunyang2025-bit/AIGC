"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Eye, Save, Sparkles, UserRound } from "lucide-react";
import { CreatorCard } from "@/components/CreatorCard";
import { categoryLabel, requiredCredentialLabel, verificationTypeLabel } from "@/lib/format";
import { upsertCurrentCreatorProfile } from "@/lib/store";
import { CreatorProfile, ProjectCategory, VerificationType } from "@/lib/types";
import { setAuthStatus } from "@/lib/auth";

const categoryOptions: ProjectCategory[] = ["AI Short Video", "Image Design", "Digital Human"];
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
  const [name, setName] = useState("青禾AIGC工作室");
  const [displayName, setDisplayName] = useState("青禾AIGC工作室");
  const [avatarUrl, setAvatarUrl] = useState("青");
  const [profileSlogan, setProfileSlogan] = useState("稳定承接电商短视频、商品图和数字人口播内容");
  const [title, setTitle] = useState("AI短视频与商品内容创作服务商");
  const [location, setLocation] = useState("杭州");
  const [bio, setBio] = useState("擅长电商商品短视频、AI商品图、数字人口播脚本与成片生产，可配合品牌方快速测试内容方向。");
  const [resume, setResume] = useState("3年AIGC内容生产经验，服务过家清、服饰、本地生活与教育课程团队，熟悉从需求拆解、脚本、分镜到成片/图片素材整理的完整流程。");
  const [skills, setSkills] = useState("商品短视频, 即梦, Runway, 数字人口播, 小红书种草");
  const [portfolio, setPortfolio] = useState("家清用品爆款短视频：https://example.com/work/home-cleaning\n服饰商品图批量生成：https://example.com/work/fashion-images\n本地生活数字人口播：https://example.com/work/local-avatar");
  const [priceMin, setPriceMin] = useState("800");
  const [priceMax, setPriceMax] = useState("5000");
  const [responseTime, setResponseTime] = useState("2小时内响应");
  const [identityType, setIdentityType] = useState<VerificationType>("enterprise");
  const [credentialFile, setCredentialFile] = useState("青禾AIGC工作室营业执照.pdf");
  const [qualificationFiles, setQualificationFiles] = useState("服务合同模板.pdf\n过往项目授权展示说明.pdf");
  const [contactEmail, setContactEmail] = useState("hello@qinghe-aigc.cn");
  const [contactPhone, setContactPhone] = useState("0571-8800-8899");
  const [websiteUrl, setWebsiteUrl] = useState("https://qinghe-aigc.example.com");
  const [socialUrl, setSocialUrl] = useState("https://www.xiaohongshu.com/user/profile/qinghe-aigc");
  const [serviceArea, setServiceArea] = useState("全国远程协作，杭州可线下面谈");
  const [categories, setCategories] = useState<ProjectCategory[]>(["AI Short Video", "Image Design"]);

  const preview = useMemo<CreatorProfile>(
    () => ({
      id: "c-preview",
      userId: "u-creator-self",
      name,
      title,
      location,
      bio,
      resume,
      skills: splitList(skills).length ? splitList(skills) : ["AI内容创作"],
      categories,
      portfolio: splitList(portfolio),
      priceMin: Number(priceMin) || 0,
      priceMax: Number(priceMax) || 0,
      completedProjects: 0,
      rating: 4.6,
      responseTime,
      verified: false,
      identityType,
      verificationType: identityType,
      credentialFile,
      qualificationFiles: splitList(qualificationFiles),
      avatarUrl,
      displayName,
      profileSlogan,
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
    setAuthStatus("pending_review");
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
                <label htmlFor="creator-avatar">头像/Logo</label>
                <input id="creator-avatar" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} />
                <span className="fieldHint">MVP阶段可填头像文字或图片链接。</span>
              </div>
              <div className="field">
                <label htmlFor="creator-location">所在城市</label>
                <input id="creator-location" value={location} onChange={(event) => setLocation(event.target.value)} required />
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
                {categoryOptions.map((category) => (
                  <button
                    className={categories.includes(category) ? "checkPill active" : "checkPill"}
                    key={category}
                    onClick={() => toggleCategory(category)}
                    type="button"
                  >
                    <CheckCircle2 size={15} />
                    {categoryLabel(category)}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label htmlFor="creator-skills">技能标签</label>
              <input id="creator-skills" value={skills} onChange={(event) => setSkills(event.target.value)} />
              <span className="fieldHint">用逗号分隔，例如：AI短视频、数字人口播、商品图。</span>
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
              <input id="creator-credential" value={credentialFile} onChange={(event) => setCredentialFile(event.target.value)} />
              <span className="fieldHint">MVP阶段先记录文件名，后续可接入真实上传和运营审核。</span>
            </div>

            <div className="field">
              <label htmlFor="creator-qualifications">其他资质/证明材料</label>
              <textarea id="creator-qualifications" value={qualificationFiles} onChange={(event) => setQualificationFiles(event.target.value)} />
              <span className="fieldHint">每行一个资质，例如品牌授权、过往案例授权、行业证书等。</span>
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
            这里是平台撮合资料，不承诺交易履约。具体合作、报价、合同和交付由双方在线下或第三方工具自行确认。
          </div>
        </aside>
      </div>
    </main>
  );
}
