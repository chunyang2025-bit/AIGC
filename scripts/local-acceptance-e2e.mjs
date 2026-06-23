import fs from "node:fs";
import path from "node:path";

const origin = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3031";
const baseUrl = origin.replace(/\/$/, "");
const envLocal = path.join(process.cwd(), ".env.local");

function readEnvValue(name) {
  if (!fs.existsSync(envLocal)) return "";
  const content = fs.readFileSync(envLocal, "utf8");
  const match = content.match(new RegExp(`^${name}=(.*)$`, "m"));
  return match ? match[1].trim() : "";
}

function logStep(message) {
  console.log(`\n== ${message}`);
}

function pass(message) {
  console.log(`PASS ${message}`);
}

function fail(message) {
  throw new Error(message);
}

async function request(pathname, { method = "GET", token, body } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
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

function expect(condition, message) {
  if (!condition) fail(message);
}

function buyerPayload(account) {
  return {
    companyName: "验收需求方",
    displayName: "验收需求方主页",
    avatarUrl: "验",
    profileSlogan: "用于本地验收",
    industry: "AI 服务采购",
    location: "上海 / 上海",
    companyIntro: "这是一次完整验收流程里的需求方主体主页。",
    verificationType: "enterprise",
    contactEmail: account,
    contactPhone: "",
    websiteUrl: "https://buyer-acceptance.example.com",
    socialUrl: "https://xiaohongshu.com/buyer-acceptance",
    serviceArea: "全国",
    businessLicenseFile: "buyer-license.pdf",
    qualificationFiles: ["buyer-qualification.pdf"]
  };
}

function creatorPayload(account, { training = false } = {}) {
  return {
    name: training ? "验收培训服务方" : "验收接单服务方",
    title: training ? "AIGC 企业培训讲师" : "AIGC 项目交付服务方",
    location: "杭州 / 杭州",
    bio: training ? "负责企业培训、工作坊和讲师交付。" : "负责短视频、图像设计和交付型项目承接。",
    resume: "5 年相关经验，作为验收用例创建。",
    skills: training ? ["AIGC培训", "提示词工程", "AI办公"] : ["AI短视频", "提示词工程", "品牌视觉"],
    categories: training ? ["AIGC Training"] : ["AI Short Video", "Brand Visual"],
    portfolio: training ? ["企业培训案例"] : ["短视频案例", "品牌视觉案例"],
    portfolioItems: [
      {
        id: training ? "pf-training-1" : "pf-service-1",
        title: training ? "企业培训案例" : "短视频项目案例",
        category: training ? "AIGC Training" : "AI Short Video",
        description: training ? "覆盖提示词、AI办公和内容生成。" : "展示短视频脚本、分镜和成片。",
        url: training ? "https://creator-acceptance.example.com/training" : "https://creator-acceptance.example.com/service",
        public: true
      }
    ],
    servicePackages: [
      {
        id: training ? "sp-training-1" : "sp-service-1",
        name: training ? "AIGC 培训工作坊" : "AIGC 项目交付包",
        price: training ? 12000 : 6000,
        deliveryDays: training ? 7 : 5,
        revisions: 1,
        deliverables: training ? ["培训方案", "课件", "答疑"] : ["脚本", "素材", "成片"],
        description: training ? "适合企业团队内训。" : "适合试运营阶段项目交付。"
      }
    ],
    priceMin: training ? 8000 : 3000,
    priceMax: training ? 30000 : 12000,
    responseTime: "4小时",
    identityType: training ? "enterprise" : "individual",
    avatarUrl: training ? "培" : "接",
    displayName: training ? "验收培训主页" : "验收接单主页",
    profileSlogan: training ? "企业培训与陪跑" : "项目交付与制作",
    websiteUrl: training ? "https://creator-acceptance.example.com/training" : "https://creator-acceptance.example.com/service",
    socialUrl: "https://xiaohongshu.com/creator-acceptance",
    serviceArea: training ? "全国线上，可线下内训" : "全国线上",
    credentialFile: training ? "training-license.pdf" : "creator-license.pdf",
    qualificationFiles: training ? ["training-qualification.pdf"] : ["creator-qualification.pdf"],
    contactEmail: account,
    contactPhone: "",
    trainingProfile: training
      ? {
          topics: ["提示词工程", "AI办公提效"],
          formats: ["online", "workshop"],
          audience: ["运营团队", "管理层"],
          cities: ["全国线上", "上海"],
          caseStudies: ["企业 AI 培训实战工作坊"],
          materials: ["课件", "练习任务", "工具清单"],
          pricingNote: "支持半日或全天培训报价。",
          customizable: true
        }
      : undefined
  };
}

function projectPayload({ title, category, buyerEmail }) {
  const common = {
    title,
    description: `${title} 的验收需求，用于验证发布、审核和公开展示链路。`,
    category,
    budget: category === "AIGC Training" ? 12000 : 5000,
    deadline: "2026-06-30",
    contactEmail: buyerEmail,
    contactPhone: "",
    tags: category === "AIGC Training" ? ["培训", "企业内训"] : ["短视频", "品牌"],
    acceptPlatformRecommend: true
  };

  if (category === "AIGC Training") {
    return {
      ...common,
      trainingRequirement: {
        topics: ["提示词工程", "AI办公提效"],
        audience: "企业内部团队",
        headcount: 30,
        format: "online",
        city: "上海",
        duration: "1天",
        goal: "建立团队 AI 实操能力",
        needCustomCases: true,
        needMaterials: true
      }
    };
  }

  return common;
}

const runId = Date.now();
const password = `Accept${runId}A1`;
const adminInviteCode = readEnvValue("ADMIN_INVITE_CODE");
const shouldReset = process.env.ALLOW_RESET === "true";

if (!adminInviteCode) {
  fail("未在 .env.local 中找到 ADMIN_INVITE_CODE");
}

const accounts = {
  admin: `admin.acceptance.${runId}@example.com`,
  buyer: `buyer.acceptance.${runId}@example.com`,
  creator: `creator.acceptance.${runId}@example.com`,
  trainer: `trainer.acceptance.${runId}@example.com`
};

logStep(`Acceptance flow against ${baseUrl}`);
console.log(`Reset mode: ${shouldReset ? "enabled" : "disabled"}`);

const health = await request("/api/health");
expect(health.ok, "health endpoint is not green");
pass("health endpoint is green");

logStep("Register and login admin");
const admin = await registerAndLogin({
  role: "admin",
  account: accounts.admin,
  password,
  inviteCode: adminInviteCode
});
expect(admin.accessToken, "admin login did not return an access token");
pass("admin registration and login succeeded");

if (shouldReset) {
  logStep("Reset marketplace data");
  await request("/api/reset", {
    method: "POST",
    token: admin.accessToken
  });
  pass("reset endpoint succeeded");
} else {
  pass("skipping reset; set ALLOW_RESET=true to clear marketplace data before acceptance");
}

logStep("Register and login buyer");
const buyer = await registerAndLogin({
  role: "buyer",
  account: accounts.buyer,
  password
});
expect(buyer.accessToken, "buyer login did not return an access token");
pass("buyer registration and login succeeded");

logStep("Save buyer profile");
const savedBuyer = await request("/api/buyers", {
  method: "POST",
  token: buyer.accessToken,
  body: buyerPayload(accounts.buyer)
});
expect(savedBuyer.userId === buyer.id, "buyer profile userId does not match login user");
pass("buyer profile saved");

const adminStateAfterBuyerSave = await request("/api/state", { token: admin.accessToken });
const buyerInAdminState = adminStateAfterBuyerSave.buyerProfiles?.find((profile) => profile.userId === buyer.id);
if (!buyerInAdminState) {
  console.log("DEBUG admin state after buyer save", JSON.stringify({
    users: adminStateAfterBuyerSave.users?.slice(-5),
    buyerProfiles: adminStateAfterBuyerSave.buyerProfiles?.slice(-5)
  }, null, 2));
}
expect(buyerInAdminState?.companyName === "验收需求方", "buyer profile is missing from admin state right after save");
pass("buyer profile is visible in admin state");

logStep("Buyer relogin and persistence check");
const buyerRelogin = await request("/api/auth/login", {
  method: "POST",
  body: {
    role: "buyer",
    account: accounts.buyer,
    password,
    authMethod: "password",
    name: accounts.buyer
  }
});
expect(buyerRelogin.accessToken, "buyer relogin did not return an access token");
await request("/api/buyers", {
  method: "POST",
  token: buyerRelogin.accessToken,
  body: {
    ...buyerPayload(accounts.buyer),
    profileSlogan: "用于本地验收-重登复写"
  }
});
const buyerState = await request("/api/state", { token: buyerRelogin.accessToken });
const buyerProfile = buyerState.buyerProfiles?.find((profile) => profile.userId === buyer.id);
if (!buyerProfile?.companyName) {
  console.log("DEBUG buyer state", JSON.stringify({
    hasAccessToken: Boolean(buyerRelogin.accessToken),
    buyerProfiles: buyerState.buyerProfiles,
    users: buyerState.users,
    actorId: buyer.id
  }, null, 2));
}
expect(buyerProfile?.companyName === "验收需求方", "buyer profile was not restored after relogin");
pass("buyer profile persists after relogin");

logStep("Buyer submit review, reject, resubmit, approve");
await request("/api/review-submission", {
  method: "POST",
  token: buyerRelogin.accessToken,
  body: { subjectType: "buyer", id: `bp-${buyer.id}` }
});
let buyerReviewState = await request("/api/state", { token: buyerRelogin.accessToken });
expect(
  buyerReviewState.activityEvents?.some((event) => event.eventType === "submit_review" && event.targetType === "buyer_profile"),
  "buyer submit review event is missing"
);
await request("/api/admin/verify", {
  method: "PATCH",
  token: admin.accessToken,
  body: {
    subjectType: "buyer",
    id: `bp-${buyer.id}`,
    verified: false,
    rejectedReason: "资料还需补充联系人信息"
  }
});
buyerReviewState = await request("/api/state", { token: buyerRelogin.accessToken });
expect(
  buyerReviewState.buyerProfiles?.find((profile) => profile.userId === buyer.id)?.rejectedReason === "资料还需补充联系人信息",
  "buyer rejection reason did not round-trip"
);
await request("/api/review-submission", {
  method: "POST",
  token: buyerRelogin.accessToken,
  body: { subjectType: "buyer", id: `bp-${buyer.id}` }
});
await request("/api/admin/verify", {
  method: "PATCH",
  token: admin.accessToken,
  body: { subjectType: "buyer", id: `bp-${buyer.id}`, verified: true }
});
buyerReviewState = await request("/api/state", { token: buyerRelogin.accessToken });
expect(
  buyerReviewState.buyerProfiles?.find((profile) => profile.userId === buyer.id)?.verified === true,
  "buyer approval did not take effect"
);
pass("buyer review flow passed");

logStep("Register and login service creator");
const creator = await registerAndLogin({
  role: "creator",
  account: accounts.creator,
  password
});
expect(creator.accessToken, "creator login did not return an access token");
pass("creator registration and login succeeded");

logStep("Save creator profile");
const savedCreator = await request("/api/creators", {
  method: "POST",
  token: creator.accessToken,
  body: creatorPayload(accounts.creator)
});
expect(savedCreator.userId === creator.id, "creator profile userId does not match login user");
pass("creator profile saved");

logStep("Creator relogin and persistence check");
const creatorRelogin = await request("/api/auth/login", {
  method: "POST",
  body: {
    role: "creator",
    account: accounts.creator,
    password,
    authMethod: "password",
    name: accounts.creator
  }
});
expect(creatorRelogin.accessToken, "creator relogin did not return an access token");
let creatorState = await request("/api/state", { token: creatorRelogin.accessToken });
expect(
  creatorState.creators?.find((profile) => profile.userId === creator.id)?.displayName === "验收接单主页",
  "creator profile was not restored after relogin"
);
pass("creator profile persists after relogin");

logStep("Creator submit review and approve");
await request("/api/review-submission", {
  method: "POST",
  token: creatorRelogin.accessToken,
  body: { subjectType: "creator", id: `c-${creator.id}` }
});
await request("/api/admin/verify", {
  method: "PATCH",
  token: admin.accessToken,
  body: { subjectType: "creator", id: `c-${creator.id}`, verified: true }
});
creatorState = await request("/api/state", { token: creatorRelogin.accessToken });
expect(
  creatorState.creators?.find((profile) => profile.userId === creator.id)?.verified === true,
  "creator approval did not take effect"
);
pass("creator review flow passed");

logStep("Register and login training creator");
const trainer = await registerAndLogin({
  role: "creator",
  account: accounts.trainer,
  password
});
const trainerLogin = await request("/api/auth/login", {
  method: "POST",
  body: {
    role: "creator",
    account: accounts.trainer,
    password,
    authMethod: "password",
    name: accounts.trainer
  }
});
await request("/api/creators", {
  method: "POST",
  token: trainerLogin.accessToken,
  body: creatorPayload(accounts.trainer, { training: true })
});
await request("/api/review-submission", {
  method: "POST",
  token: trainerLogin.accessToken,
  body: { subjectType: "creator", id: `c-${trainer.id}` }
});
await request("/api/admin/verify", {
  method: "PATCH",
  token: admin.accessToken,
  body: { subjectType: "creator", id: `c-${trainer.id}`, verified: true }
});
pass("training creator flow passed");

logStep("Buyer create and publish three projects");
const projectSpecs = [
  { title: `验收短视频需求 A ${runId}`, category: "AI Short Video" },
  { title: `验收品牌视觉需求 B ${runId}`, category: "Brand Visual" },
  { title: `验收企业培训需求 C ${runId}`, category: "AIGC Training" }
];
const createdProjects = [];
for (const spec of projectSpecs) {
  const created = await request("/api/projects", {
    method: "POST",
    token: buyerRelogin.accessToken,
    body: projectPayload({ ...spec, buyerEmail: accounts.buyer })
  });
  createdProjects.push(created.project);
  await request(`/api/admin/projects/${created.project.id}/review`, {
    method: "PATCH",
    token: admin.accessToken,
    body: { status: "open" }
  });
}

const publicMarketplace = await request("/api/marketplace?includeTestData=1");
const publicProjectTitles = new Set((publicMarketplace.projects || []).map((project) => project.title));
expect(projectSpecs.every((project) => publicProjectTitles.has(project.title)), "not all projects became public after admin review");
pass("project publish and admin review flow passed");

logStep("Acceptance summary");
console.log(JSON.stringify({
  resetUsed: shouldReset,
  accounts,
  buyerId: buyer.id,
  creatorId: creator.id,
  trainerId: trainer.id,
  projectIds: createdProjects.map((project) => project.id)
}, null, 2));

console.log("\nAcceptance flow completed successfully.");
