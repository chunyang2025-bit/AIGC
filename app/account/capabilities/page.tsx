"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, CheckCircle2, MessageSquare, ShieldCheck, UserRound } from "lucide-react";
import { loadMarketplaceData, upsertCurrentBuyerProfile } from "@/lib/store";
import { loginNextPath, readAuthSession, setAuthCapability } from "@/lib/auth";

function statusText(enabled: boolean, verified?: boolean) {
  if (!enabled) return "未开通";
  return verified ? "已通过审核" : "待平台审核";
}

export default function AccountCapabilitiesPage() {
  const router = useRouter();
  const session = readAuthSession();
  const data = loadMarketplaceData();
  const subject = data.buyerProfiles?.find((profile) => profile.userId === session?.userId);
  const creator = data.creators.find((profile) => profile.userId === session?.userId);

  useEffect(() => {
    if (!session) {
      router.push("/login");
      return;
    }
    if (!subject) {
      router.push("/account/profile");
    }
  }, [router, session, subject]);

  if (!session || !subject) return null;

  function openBuyerCapability() {
    if (!subject) return;
    upsertCurrentBuyerProfile({
      companyName: subject.companyName,
      displayName: subject.displayName ?? subject.companyName,
      avatarUrl: subject.avatarUrl ?? subject.companyName.slice(0, 1),
      profileSlogan: subject.profileSlogan ?? "",
      industry: subject.industry,
      location: subject.location,
      companyIntro: subject.companyIntro,
      verificationType: subject.verificationType ?? "enterprise",
      contactEmail: subject.contactEmail,
      contactPhone: subject.contactPhone,
      websiteUrl: subject.websiteUrl ?? "",
      socialUrl: subject.socialUrl ?? "",
      serviceArea: subject.serviceArea ?? "",
      businessLicenseFile: subject.businessLicenseFile,
      qualificationFiles: subject.qualificationFiles
    });
    setAuthCapability("buyer", subject.verified ? "approved" : "pending_review");
    router.push(subject.verified ? "/buyer" : "/account");
  }

  return (
    <main className="main">
      <section className="portalHero">
        <div className="stack">
          <span className="eyebrow">
            <ShieldCheck size={15} /> 能力开通
          </span>
          <div>
            <h1>{subject.displayName ?? subject.companyName}</h1>
            <p>主体主页只需维护一次。你可以在同一个主体下开通派单能力、接单能力，或同时开通两种能力。</p>
          </div>
        </div>
        <div className="portalStats">
          <div className="metric">
            <strong>{subject ? 1 : 0}</strong>
            <span>主体主页</span>
          </div>
          <div className="metric">
            <strong>{subject.verified ? 1 : 0}</strong>
            <span>主体审核</span>
          </div>
          <div className="metric">
            <strong>{[subject, creator].filter(Boolean).length}</strong>
            <span>已开通能力</span>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="cardBody stack">
          <div className="spaceBetween">
            <div>
              <strong>主体认证状态</strong>
              <div className="muted">派单和接单能力共用主体资质审核。</div>
            </div>
            <span className={subject.verified ? "tag green" : "tag gold"}>
              {subject.verified ? "已通过审核" : "待平台审核"}
            </span>
          </div>
          <div className="toolbarGroup">
            <Link className="btn" href="/account/profile">编辑主体主页</Link>
            <Link className="btn" href="/account">返回主体中心</Link>
          </div>
        </div>
      </section>

      <div className="grid two">
        <section className="card">
          <div className="cardBody stack">
            <div className="spaceBetween">
              <BriefcaseBusiness size={22} />
              <span className={subject.verified ? "tag green" : "tag gold"}>{statusText(Boolean(subject), subject.verified)}</span>
            </div>
            <div>
              <h2 style={{ margin: 0 }}>派单能力</h2>
              <p className="muted">使用同一主体主页发布真实需求，查看匹配推荐，并主动邀请接单方沟通。主体审核通过后即可发布需求。</p>
            </div>
            <button className="btn primary" onClick={openBuyerCapability} type="button">
              {subject.verified ? "进入派单工作台" : "开通派单能力并等待审核"}
            </button>
            <Link className="btn" href={loginNextPath("buyer", "/post-project")}>发布需求</Link>
          </div>
        </section>

        <section className="card">
          <div className="cardBody stack">
            <div className="spaceBetween">
              <UserRound size={22} />
              <span className={creator?.verified ? "tag green" : creator ? "tag gold" : "tag"}>
                {statusText(Boolean(creator), creator?.verified)}
              </span>
            </div>
            <div>
              <h2 style={{ margin: 0 }}>接单能力</h2>
              <p className="muted">继承主体主页后，只补充可接需求类型、技能标签、报价区间、简历和代表作。接单资料审核通过后可主动发起沟通。</p>
            </div>
            <Link className="btn primary" href="/provider/profile">
              {creator ? "编辑接单能力" : "开通接单能力"}
            </Link>
            <Link className="btn" href="/projects">
              <MessageSquare size={16} /> 浏览需求大厅
            </Link>
          </div>
        </section>
      </div>

      <section className="notice">
        <CheckCircle2 size={15} /> 建议先完善主体主页并提交审核，再根据业务需要开通派单或接单能力。
      </section>
    </main>
  );
}
