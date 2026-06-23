import fs from "node:fs";
import path from "node:path";

const origin = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3023";
const baseUrl = origin.replace(/\/$/, "");
const envLocal = path.join(process.cwd(), ".env.local");

function readEnvValue(name) {
  if (!fs.existsSync(envLocal)) return "";
  const content = fs.readFileSync(envLocal, "utf8");
  const match = content.match(new RegExp(`^${name}=(.*)$`, "m"));
  return match ? match[1].trim() : "";
}

function pass(message) {
  console.log(`PASS ${message}`);
}

function fail(message) {
  throw new Error(message);
}

function expect(condition, message) {
  if (!condition) fail(message);
}

async function request(pathname, { method = "GET", token, body } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store"
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.ok) {
    const message = payload?.error || `${pathname} returned ${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  return payload.data;
}

async function registerAndLogin({ role, account, password, inviteCode }) {
  await request("/api/auth/register", {
    method: "POST",
    body: {
      role,
      account,
      password,
      name: account,
      inviteCode
    }
  });

  return request("/api/auth/login", {
    method: "POST",
    body: {
      role,
      account,
      password,
      authMethod: "password",
      name: account
    }
  });
}

async function createApprovedProject({ buyerToken, adminToken, buyerEmail, title }) {
  const created = await request("/api/projects", {
    method: "POST",
    token: buyerToken,
    body: {
      title,
      description: `${title} 的协作流回归需求。`,
      category: "AI Short Video",
      budget: 5200,
      deadline: "2026-06-30",
      contactEmail: buyerEmail,
      tags: ["协作流", "回归"],
      acceptPlatformRecommend: true
    }
  });

  await request(`/api/admin/projects/${created.project.id}/review`, {
    method: "PATCH",
    token: adminToken,
    body: { status: "open" }
  });

  return created.project;
}

const runId = Date.now();
const password = `Collab${runId}A1`;
const adminInviteCode = readEnvValue("ADMIN_INVITE_CODE");

if (!adminInviteCode) {
  fail("未在 .env.local 中找到 ADMIN_INVITE_CODE");
}

const accounts = {
  admin: `admin.collab.${runId}@example.com`,
  buyer: `buyer.collab.${runId}@example.com`,
  creatorA: `creatora.collab.${runId}@example.com`,
  creatorB: `creatorb.collab.${runId}@example.com`
};

console.log(`Local collab flow check against ${baseUrl}`);

const health = await request("/api/health");
expect(health.ok, "health endpoint is not green");
pass("health endpoint is green");

const admin = await registerAndLogin({
  role: "admin",
  account: accounts.admin,
  password,
  inviteCode: adminInviteCode
});
pass("admin registration and login succeeded");

const buyer = await registerAndLogin({
  role: "buyer",
  account: accounts.buyer,
  password
});
await request("/api/buyers", {
  method: "POST",
  token: buyer.accessToken,
  body: {
    companyName: "协作流验收需求方",
    displayName: "协作流 Buyer",
    avatarUrl: "协",
    profileSlogan: "用于协作流回归",
    industry: "QA",
    location: "Shanghai",
    companyIntro: "collab flow buyer",
    verificationType: "enterprise",
    contactEmail: accounts.buyer,
    contactPhone: "",
    businessLicenseFile: "buyer-license.pdf",
    qualificationFiles: ["buyer-qualification.pdf"]
  }
});
await request("/api/review-submission", {
  method: "POST",
  token: buyer.accessToken,
  body: { subjectType: "buyer", id: `bp-${buyer.id}` }
});
await request("/api/admin/verify", {
  method: "PATCH",
  token: admin.accessToken,
  body: { subjectType: "buyer", id: `bp-${buyer.id}`, verified: true }
});
pass("buyer profile and review flow passed");

const creatorA = await registerAndLogin({
  role: "creator",
  account: accounts.creatorA,
  password
});
await request("/api/creators", {
  method: "POST",
  token: creatorA.accessToken,
  body: {
    name: "协作流服务方 A",
    title: "AIGC Flow Creator A",
    location: "Hangzhou",
    bio: "creator a",
    resume: "creator a resume",
    skills: ["AI短视频", "提示词工程"],
    categories: ["AI Short Video"],
    portfolio: ["creator a portfolio"],
    portfolioItems: [],
    servicePackages: [],
    priceMin: 1200,
    priceMax: 3600,
    responseTime: "1小时",
    identityType: "individual",
    avatarUrl: "A",
    displayName: "Flow Creator A",
    profileSlogan: "interest path",
    websiteUrl: "https://example.com/creator-a",
    socialUrl: "https://example.com/creator-a/social",
    serviceArea: "remote",
    credentialFile: "creator-a-license.pdf",
    qualificationFiles: ["creator-a-qualification.pdf"],
    contactEmail: accounts.creatorA,
    contactPhone: ""
  }
});
await request("/api/review-submission", {
  method: "POST",
  token: creatorA.accessToken,
  body: { subjectType: "creator", id: `c-${creatorA.id}` }
});
await request("/api/admin/verify", {
  method: "PATCH",
  token: admin.accessToken,
  body: { subjectType: "creator", id: `c-${creatorA.id}`, verified: true }
});

const creatorB = await registerAndLogin({
  role: "creator",
  account: accounts.creatorB,
  password
});
await request("/api/creators", {
  method: "POST",
  token: creatorB.accessToken,
  body: {
    name: "协作流服务方 B",
    title: "AIGC Flow Creator B",
    location: "Suzhou",
    bio: "creator b",
    resume: "creator b resume",
    skills: ["AI短视频", "品牌视觉"],
    categories: ["AI Short Video"],
    portfolio: ["creator b portfolio"],
    portfolioItems: [],
    servicePackages: [],
    priceMin: 1400,
    priceMax: 4200,
    responseTime: "2小时",
    identityType: "individual",
    avatarUrl: "B",
    displayName: "Flow Creator B",
    profileSlogan: "invite path",
    websiteUrl: "https://example.com/creator-b",
    socialUrl: "https://example.com/creator-b/social",
    serviceArea: "remote",
    credentialFile: "creator-b-license.pdf",
    qualificationFiles: ["creator-b-qualification.pdf"],
    contactEmail: accounts.creatorB,
    contactPhone: ""
  }
});
await request("/api/review-submission", {
  method: "POST",
  token: creatorB.accessToken,
  body: { subjectType: "creator", id: `c-${creatorB.id}` }
});
await request("/api/admin/verify", {
  method: "PATCH",
  token: admin.accessToken,
  body: { subjectType: "creator", id: `c-${creatorB.id}`, verified: true }
});
pass("creator profiles and review flow passed");

const project = await createApprovedProject({
  buyerToken: buyer.accessToken,
  adminToken: admin.accessToken,
  buyerEmail: accounts.buyer,
  title: `协作流回归需求 ${runId}`
});
pass("project publish and admin review flow passed");

const orderFromInterest = await request(`/api/projects/${project.id}/interest`, {
  method: "POST",
  token: creatorA.accessToken,
  body: {
    message: "我对这个需求感兴趣，附上展示页。",
    attachmentUrl: `https://example.com/creator-a/${runId}`
  }
});
expect(orderFromInterest.projectId === project.id, "interest order projectId mismatch");
pass("creator interest flow passed");

const orderFromInvite = await request(`/api/projects/${project.id}/invite`, {
  method: "POST",
  token: buyer.accessToken,
  body: {
    creatorId: `c-${creatorB.id}`,
    message: "想邀请你进一步沟通这个需求。"
  }
});
expect(orderFromInvite.projectId === project.id, "invite order projectId mismatch");
pass("buyer invite flow passed");

const message = await request(`/api/orders/${orderFromInterest.id}/messages`, {
  method: "POST",
  token: buyer.accessToken,
  body: {
    body: "我们周三下午沟通下细节。"
  }
});
expect(message.orderId === orderFromInterest.id, "message orderId mismatch");
pass("order message flow passed");

const contactedOrder = await request(`/api/orders/${orderFromInterest.id}/status`, {
  method: "PATCH",
  token: creatorA.accessToken,
  body: {
    status: "contacted",
    note: "已回复需求方"
  }
});
expect(contactedOrder.status === "contacted", "contacted status did not persist");

const approvedOrder = await request(`/api/orders/${orderFromInterest.id}/status`, {
  method: "PATCH",
  token: buyer.accessToken,
  body: {
    status: "approved",
    note: "进入合作"
  }
});
expect(approvedOrder.status === "approved", "approved status did not persist");
pass("order status flow passed");

const report = await request("/api/reports", {
  method: "POST",
  token: buyer.accessToken,
  body: {
    targetType: "creator",
    targetId: orderFromInvite.creatorId,
    reason: "这是一次协作流回归举报样本"
  }
});
expect(report.status === "open", "report did not open");

const resolvedReport = await request(`/api/admin/reports/${report.id}`, {
  method: "PATCH",
  token: admin.accessToken,
  body: {
    status: "resolved",
    resolution: "已记录并处理"
  }
});
expect(resolvedReport.status === "resolved", "report was not resolved");
pass("report submit and resolve flow passed");

const feedback = await request("/api/feedback", {
  method: "POST",
  token: creatorB.accessToken,
  body: {
    category: "suggestion",
    page: "/projects",
    rating: 5,
    content: "这是一条协作流回归反馈。"
  }
});
expect(feedback.status === "open", "feedback did not open");

const resolvedFeedback = await request(`/api/admin/feedback/${feedback.id}`, {
  method: "PATCH",
  token: admin.accessToken,
  body: {
    status: "resolved",
    resolution: "已采纳"
  }
});
expect(resolvedFeedback.status === "resolved", "feedback was not resolved");
pass("feedback submit and resolve flow passed");

const adminState = await request("/api/state", { token: admin.accessToken });
expect(adminState.orders?.some((order) => order.id === orderFromInterest.id), "interest order missing from admin state");
expect(adminState.orders?.some((order) => order.id === orderFromInvite.id), "invite order missing from admin state");
expect(adminState.messages?.some((item) => item.id === message.id), "message missing from admin state");
expect(adminState.reports?.some((item) => item.id === report.id && item.status === "resolved"), "resolved report missing from admin state");
expect(adminState.feedback?.some((item) => item.id === feedback.id && item.status === "resolved"), "resolved feedback missing from admin state");
pass("admin state reflects collaboration artifacts");

console.log(JSON.stringify({
  ok: true,
  checkedAt: new Date().toISOString(),
  accounts,
  projectId: project.id,
  interestOrderId: orderFromInterest.id,
  inviteOrderId: orderFromInvite.id,
  messageId: message.id,
  reportId: report.id,
  feedbackId: feedback.id
}, null, 2));

console.log("\nLocal collab flow check completed successfully.");
