"use client";

import { useEffect, useState } from "react";
import { Download, RotateCcw, ShieldCheck, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { activeOrders, monthlyActiveUsers } from "@/lib/analytics";
import { activityEventLabel, categoryLabel, money, orderStatusLabel, roleLabel, targetTypeLabel, verificationTypeLabel } from "@/lib/format";
import { resetDemoData, loadMarketplaceData, verifySubject } from "@/lib/store";
import { readAuthSession } from "@/lib/auth";

export default function AdminPage() {
  const router = useRouter();
  const session = readAuthSession();
  const data = loadMarketplaceData();
  const intentBudget = data.orders.reduce((sum, order) => sum + order.amount, 0);
  const reachedIntent = data.orders.filter((order) => order.status === "approved").length;
  const buyerMau = monthlyActiveUsers(data, "buyer");
  const creatorMau = monthlyActiveUsers(data, "creator");
  const [reviewReason, setReviewReason] = useState("资料不完整，请补充主体资质或联系方式后重新提交。");

  function exportOperationsReport() {
    const report = {
      exportedAt: new Date().toISOString(),
      platform: {
        name: "AIGClancer",
        positioning: "AIGC供需撮合与创作者入驻平台",
        launchStrategy: "免费开放入驻，派单方资质审核后发布真实需求，接单方基础入驻后通过新手任务完善资料。",
        liabilityBoundary: "平台只提供信息展示、智能匹配和沟通留痕，不托管资金，不承诺交易交付。"
      },
      summary: {
        registeredUsers: data.users.length,
        buyerProfiles: data.buyerProfiles?.length ?? 0,
        creators: data.creators.length,
        verifiedBuyerProfiles: (data.buyerProfiles ?? []).filter((profile) => profile.verified).length,
        verifiedCreators: data.creators.filter((creator) => creator.verified).length,
        projects: data.projects.length,
        publicProjects: data.projects.filter((project) => project.status === "open" || project.status === "matching").length,
        leads: data.orders.length,
        activeLeads: activeOrders(data),
        intentionBudget: intentBudget,
        reachedIntent,
        buyerMau,
        creatorMau,
        totalMau: monthlyActiveUsers(data),
        activityEvents: data.activityEvents.length,
        agentBriefs: data.projects.filter((project) => project.agentBrief).length,
        agentMatches: data.matches.length
      },
      pendingReviews: {
        buyers: (data.buyerProfiles ?? []).filter((profile) => !profile.verified).map((profile) => ({
          id: profile.id,
          name: profile.displayName ?? profile.companyName,
          type: profile.verificationType,
          contact: profile.contactEmail || profile.contactPhone
        })),
        creators: data.creators.filter((creator) => !creator.verified).map((creator) => ({
          id: creator.id,
          name: creator.displayName ?? creator.name,
          type: creator.verificationType ?? creator.identityType,
          contact: creator.contactEmail || creator.contactPhone
        }))
      },
      recentActivity: data.activityEvents.slice(-50)
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `aigclancer-operations-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    if (!session || session.role !== "admin") {
      router.push("/login?role=admin");
    }
  }, [router, session]);

  if (!session || session.role !== "admin") {
    return null;
  }

  return (
    <main className="main">
      <div className="pageHeader">
        <div>
          <h1>运营后台</h1>
          <p>查看用户审核、需求管理、合作线索、意向预算和月活数据。</p>
        </div>
        <button
          className="btn"
          onClick={exportOperationsReport}
          type="button"
        >
          <Download size={16} /> 导出运营报表
        </button>
        <button
          className="btn"
          onClick={() => {
            resetDemoData();
            router.refresh();
          }}
        >
          <RotateCcw size={16} /> 重置种子数据
        </button>
        <button
          className="btn primary"
          onClick={() => {
            data.buyerProfiles?.filter((profile) => !profile.verified).forEach((profile) => verifySubject("buyer", profile.id));
            data.creators.filter((creator) => !creator.verified).forEach((creator) => verifySubject("creator", creator.id));
            router.refresh();
          }}
        >
          <ShieldCheck size={16} /> 全部审核通过
        </button>
      </div>

      <section className="section">
        <div className="grid four">
          <div className="metric">
            <strong>{data.users.length}</strong>
            <span>注册用户数</span>
          </div>
          <div className="metric">
            <strong>{data.projects.length}</strong>
            <span>需求数量</span>
          </div>
          <div className="metric">
            <strong>{money(intentBudget)}</strong>
            <span>意向预算总额</span>
          </div>
          <div className="metric">
            <strong>{reachedIntent}</strong>
            <span>已达成意向</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <div>
            <h2>月活运营指标</h2>
            <p>用于跟踪需求方与创作者活跃情况，沉淀平台运营证明。</p>
          </div>
        </div>
        <div className="grid four">
          <div className="metric">
            <strong>{buyerMau}</strong>
            <span>需求方月活</span>
          </div>
          <div className="metric">
            <strong>{creatorMau}</strong>
            <span>创作者月活</span>
          </div>
          <div className="metric">
            <strong>{activeOrders(data)}</strong>
            <span>活跃线索</span>
          </div>
          <div className="metric">
            <strong>{data.activityEvents.length}</strong>
            <span>活跃事件留痕</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <div>
            <h2>Agent 处理指标</h2>
            <p>用于说明平台通过Agent完成需求拆解、撮合推荐和沟通线索生成。</p>
          </div>
        </div>
        <div className="grid four">
          <div className="metric">
            <strong>{data.projects.filter((project) => project.agentBrief).length}</strong>
            <span>Agent拆解需求</span>
          </div>
          <div className="metric">
            <strong>{data.matches.length}</strong>
            <span>Agent推荐记录</span>
          </div>
          <div className="metric">
            <strong>{data.matches.filter((match) => match.risk).length}</strong>
            <span>风险提示生成</span>
          </div>
          <div className="metric">
            <strong>{data.orders.length}</strong>
            <span>合作线索</span>
          </div>
        </div>
      </section>

      <div className="grid two">
        <section className="card">
          <div className="panelTop">
            <div>
              <strong>派单方审核</strong>
              <div className="muted">派单方通过审核后可发布需求和邀请创作者。</div>
            </div>
            <ShieldCheck size={18} />
          </div>
          <div className="cardBody">
            <div className="field">
              <label htmlFor="review-reason">驳回原因模板</label>
              <input id="review-reason" value={reviewReason} onChange={(event) => setReviewReason(event.target.value)} />
            </div>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>主体</th>
                <th>类型</th>
                <th>联系方式</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {(data.buyerProfiles ?? []).map((profile) => (
                <tr key={profile.id}>
                  <td>{profile.displayName ?? profile.companyName}</td>
                  <td>{verificationTypeLabel(profile.verificationType ?? "other")}</td>
                  <td>{profile.contactEmail || profile.contactPhone || "-"}</td>
                  <td>
                    <span className={profile.verified ? "tag green" : "tag gold"}>{profile.verified ? "已认证" : "待审核"}</span>
                    {!profile.verified && profile.rejectedReason ? <div className="muted">{profile.rejectedReason}</div> : null}
                  </td>
                  <td>
                    <button
                      className="btn"
                      disabled={profile.verified}
                      onClick={() => {
                        verifySubject("buyer", profile.id);
                        router.refresh();
                      }}
                      type="button"
                    >
                      审核通过
                    </button>
                    <button
                      className="btn"
                      disabled={profile.verified}
                      onClick={() => {
                        verifySubject("buyer", profile.id, false, reviewReason);
                        router.refresh();
                      }}
                      type="button"
                    >
                      驳回
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card">
          <div className="panelTop">
            <div>
              <strong>创作者审核</strong>
              <div className="muted">创作者通过审核后可被需求方邀请合作。</div>
            </div>
            <UsersRound size={18} />
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>创作者</th>
                <th>服务品类</th>
                <th>评分</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {data.creators.map((creator) => (
                <tr key={creator.id}>
                  <td>{creator.name}</td>
                  <td>{creator.categories.map(categoryLabel).join("、")}</td>
                  <td>{creator.rating.toFixed(1)}</td>
                  <td>
                    <span className={creator.verified ? "tag green" : "tag gold"}>{creator.verified ? "已认证" : "待审核"}</span>
                    {!creator.verified && creator.rejectedReason ? <div className="muted">{creator.rejectedReason}</div> : null}
                  </td>
                  <td>
                    <button
                      className="btn"
                      disabled={creator.verified}
                      onClick={() => {
                        verifySubject("creator", creator.id);
                        router.refresh();
                      }}
                      type="button"
                    >
                      审核通过
                    </button>
                    <button
                      className="btn"
                      disabled={creator.verified}
                      onClick={() => {
                        verifySubject("creator", creator.id, false, reviewReason);
                        router.refresh();
                      }}
                      type="button"
                    >
                      驳回
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <div className="grid two">
        <section className="card">
          <div className="panelTop">
            <div>
              <strong>合作线索管理</strong>
              <div className="muted">监控已建立联系、继续沟通和已达成意向的线索。</div>
            </div>
            <ShieldCheck size={18} />
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>线索</th>
                <th>需求</th>
                <th>意向预算</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {data.orders.map((order) => {
                const project = data.projects.find((item) => item.id === order.projectId);
                return (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{project?.title ?? "需求"}</td>
                    <td>{money(order.amount)}</td>
                    <td>
                      <span className="tag blue">{orderStatusLabel(order.status)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </div>

      <section className="section">
        <div className="sectionHeader">
          <div>
            <h2>最近活跃记录</h2>
            <p>记录登录、浏览、发布需求、邀请、发消息、发送资料和达成意向等关键行为。</p>
          </div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>用户</th>
              <th>角色</th>
              <th>事件</th>
              <th>对象</th>
              <th>时间</th>
            </tr>
          </thead>
          <tbody>
            {data.activityEvents.slice().reverse().map((event) => {
              const user = data.users.find((item) => item.id === event.userId);
              return (
                <tr key={event.id}>
                  <td>{user?.name ?? event.userId}</td>
                  <td>{roleLabel(event.role)}</td>
                  <td>{activityEventLabel(event.eventType)}</td>
                  <td>{event.targetType ? `${targetTypeLabel(event.targetType)}：${event.targetId}` : "-"}</td>
                  <td>{new Date(event.createdAt).toLocaleString("zh-CN")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </main>
  );
}
