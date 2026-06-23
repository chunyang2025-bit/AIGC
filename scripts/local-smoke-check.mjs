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

const runId = Date.now();
const password = `Smoke${runId}A1`;
const adminInviteCode = readEnvValue("ADMIN_INVITE_CODE");

if (!adminInviteCode) {
  fail("未在 .env.local 中找到 ADMIN_INVITE_CODE");
}

const accounts = {
  admin: `admin.smoke.${runId}@example.com`,
  buyer: `buyer.smoke.${runId}@example.com`,
  creator: `creator.smoke.${runId}@example.com`
};

console.log(`Local smoke check against ${baseUrl}`);

const health = await request("/api/health");
expect(health.ok, "health endpoint is not green");
pass("health endpoint is green");

const admin = await registerAndLogin({
  role: "admin",
  account: accounts.admin,
  password,
  inviteCode: adminInviteCode
});
expect(admin.accessToken, "admin login did not return an access token");
pass("admin registration and login succeeded");

const buyer = await registerAndLogin({
  role: "buyer",
  account: accounts.buyer,
  password
});
expect(buyer.accessToken, "buyer login did not return an access token");
pass("buyer registration and login succeeded");

const savedBuyer = await request("/api/buyers", {
  method: "POST",
  token: buyer.accessToken,
  body: {
    companyName: "Smoke 验证需求方",
    displayName: "Smoke Buyer",
    avatarUrl: "S",
    profileSlogan: "cache check",
    industry: "QA",
    location: "Shanghai",
    companyIntro: "smoke test buyer",
    verificationType: "enterprise",
    contactEmail: accounts.buyer,
    contactPhone: "",
    websiteUrl: "https://example.com/buyer",
    socialUrl: "https://example.com/buyer/social",
    serviceArea: "remote",
    businessLicenseFile: "buyer-license.pdf",
    qualificationFiles: ["buyer-qualification.pdf"]
  }
});
expect(savedBuyer.userId === buyer.id, "buyer profile userId does not match login user");
pass("buyer profile saved");

const adminState = await request("/api/state", { token: admin.accessToken });
const buyerState = await request("/api/state", { token: buyer.accessToken });
const buyerInAdminState = adminState.buyerProfiles?.find((profile) => profile.userId === buyer.id);
const buyerInSelfState = buyerState.buyerProfiles?.find((profile) => profile.userId === buyer.id);
expect(buyerInAdminState?.companyName === "Smoke 验证需求方", "buyer profile is missing from admin state");
expect(buyerInSelfState?.companyName === "Smoke 验证需求方", "buyer profile is missing from buyer state");
pass("buyer profile is visible immediately in state API");

const creator = await registerAndLogin({
  role: "creator",
  account: accounts.creator,
  password
});
expect(creator.accessToken, "creator login did not return an access token");
pass("creator registration and login succeeded");

const savedCreator = await request("/api/creators", {
  method: "POST",
  token: creator.accessToken,
  body: {
    name: "Smoke 验证服务方",
    title: "AIGC Smoke Creator",
    location: "Hangzhou",
    bio: "smoke test creator",
    resume: "cache check resume",
    skills: ["AI短视频", "提示词工程"],
    categories: ["AI Short Video"],
    portfolio: ["smoke portfolio"],
    portfolioItems: [],
    servicePackages: [],
    priceMin: 1000,
    priceMax: 3000,
    responseTime: "1小时",
    identityType: "individual",
    avatarUrl: "C",
    displayName: "Smoke Creator",
    profileSlogan: "cache check",
    websiteUrl: "https://example.com/creator",
    socialUrl: "https://example.com/creator/social",
    serviceArea: "remote",
    credentialFile: "creator-license.pdf",
    qualificationFiles: ["creator-qualification.pdf"],
    contactEmail: accounts.creator,
    contactPhone: ""
  }
});
expect(savedCreator.userId === creator.id, "creator profile userId does not match login user");
pass("creator profile saved");

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

const creatorState = await request("/api/state", { token: creatorRelogin.accessToken });
const creatorProfile = creatorState.creators?.find((profile) => profile.userId === creator.id);
expect(creatorProfile?.displayName === "Smoke Creator", "creator profile was not restored after relogin");
pass("creator profile persists after relogin");

console.log(JSON.stringify({
  ok: true,
  checkedAt: new Date().toISOString(),
  accounts,
  buyerProfileId: savedBuyer.id,
  creatorProfileId: savedCreator.id,
  buyerVisibleToAdmin: true,
  buyerVisibleToSelf: true,
  creatorVisibleAfterRelogin: true
}, null, 2));

console.log("\nLocal smoke check completed successfully.");
