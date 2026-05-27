"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, CheckCircle2, Clock, ShieldCheck, UserRound } from "lucide-react";
import { loadMarketplaceData } from "@/lib/store";
import { readAuthSession } from "@/lib/auth";

function statusText(hasProfile: boolean, verified?: boolean) {
  if (!hasProfile) return "未开通";
  return verified ? "已通过审核" : "待平台审核";
}

function statusClass(hasProfile: boolean, verified?: boolean) {
  if (!hasProfile) return "tag";
  return verified ? "tag green" : "tag gold";
}

export default function AccountPage() {
  const router = useRouter();
  const session = readAuthSession();
  const data = loadMarketplaceData();
  const buyerProfile = data.buyerProfiles?.find((profile) => profile.userId === session?.userId);
  const creatorProfile = data.creators.find((creator) => creator.userId === session?.userId);

  useEffect(() => {
    if (!session) {
      router.push("/login");
    }
  }, [router, session]);

  if (!session) return null;

  const subjectName = buyerProfile?.displayName ?? creatorProfile?.displayName ?? session.name ?? session.email;

  return (
    <main className="main">
      <section className="portalHero">
        <div className="stack">
          <span className="eyebrow">
            <ShieldCheck size={15} /> 主体中心
          </span>
          <div>
            <h1>{subjectName}</h1>
            <p>一个账号对应一个主体。你可以分别开通派单能力和接单能力，每种能力都需要提交主页资料并通过平台审核。</p>
          </div>
        </div>
        <div className="portalStats">
          <div className="metric">
            <strong>{buyerProfile ? 1 : 0}</strong>
            <span>派单能力</span>
          </div>
          <div className="metric">
            <strong>{creatorProfile ? 1 : 0}</strong>
            <span>接单能力</span>
          </div>
          <div className="metric">
            <strong>{[buyerProfile, creatorProfile].filter((item) => item?.verified).length}</strong>
            <span>已通过审核</span>
          </div>
        </div>
      </section>

      <div className="grid two">
        <section className="card">
          <div className="cardBody stack">
            <div className="spaceBetween">
              <BriefcaseBusiness size={22} />
              <span className={statusClass(Boolean(buyerProfile), buyerProfile?.verified)}>
                {statusText(Boolean(buyerProfile), buyerProfile?.verified)}
              </span>
            </div>
            <div>
              <h2 style={{ margin: 0 }}>派单能力</h2>
              <p className="muted">发布需求、启动 Brief Agent、查看匹配推荐并邀请创作者沟通。</p>
            </div>
            <div className="toolbarGroup">
              <Link className="btn primary" href={buyerProfile?.verified ? "/buyer" : "/buyer/profile"}>
                {buyerProfile ? "查看/编辑派单资料" : "开通派单能力"}
              </Link>
              {buyerProfile?.verified ? <Link className="btn" href="/post-project">发布需求</Link> : null}
            </div>
          </div>
        </section>

        <section className="card">
          <div className="cardBody stack">
            <div className="spaceBetween">
              <UserRound size={22} />
              <span className={statusClass(Boolean(creatorProfile), creatorProfile?.verified)}>
                {statusText(Boolean(creatorProfile), creatorProfile?.verified)}
              </span>
            </div>
            <div>
              <h2 style={{ margin: 0 }}>接单能力</h2>
              <p className="muted">装修创作者展示页，进入需求大厅，向派单方发送主页、简历和代表作。</p>
            </div>
            <div className="toolbarGroup">
              <Link className="btn primary" href={creatorProfile?.verified ? "/provider" : "/provider/profile"}>
                {creatorProfile ? "查看/编辑接单资料" : "开通接单能力"}
              </Link>
              {creatorProfile?.verified ? <Link className="btn" href="/projects">浏览需求</Link> : null}
            </div>
          </div>
        </section>
      </div>

      <section className="notice">
        <Clock size={15} /> 提交资料后由平台运营后台审核。审核通过前可以继续编辑资料，但不能正式派单或接单。
      </section>
    </main>
  );
}
