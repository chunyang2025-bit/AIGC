import { publicUser, registerUser } from "../../../../lib/server/actions";
import { userFacingErrorMessage } from "../../../../lib/error-message";
import { registerSupabaseUser } from "../../../../lib/server/auth";
import { getMarketplaceData, saveMarketplaceData } from "../../../../lib/server/data";
import { rateLimit } from "../../../../lib/server/rate-limit";
import { apiFail, apiOk, readJson } from "../../../../lib/server/response";
import { requiredFields } from "../../../../lib/server/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = rateLimit(request, "auth:register", 5, 60_000);
  if (!limited.allowed) {
    return apiFail(429, "注册过于频繁，请稍后再试");
  }
  const body = await readJson(request);
  const missing = requiredFields(body, ["name", "role"]);
  if (missing.length) {
    return apiFail(400, "缺少必要字段", { missing });
  }

  const account = String(body.account || body.email || body.phone || "").trim();
  if (!account) {
    return apiFail(400, "缺少必要字段", { missing: ["account"] });
  }

  const normalizedBody = {
    ...body,
    role: String(body.role || "buyer"),
    account,
    email: String(body.email || (account.includes("@") ? account : `${account}@phone.aigclancer.local`)),
    phone: String(body.phone || (account.includes("@") ? "" : account))
  };

  const data = await getMarketplaceData();
  if (String(normalizedBody.role) === "admin") {
    const inviteCode = String(body.inviteCode || "");
    const expectedCode = process.env.ADMIN_INVITE_CODE || (process.env.NODE_ENV !== "production" ? "AIGC-ADMIN-2026" : "");
    if (!expectedCode || inviteCode !== expectedCode) {
      return apiFail(403, "后台人员注册邀请码不正确");
    }
  }
  let user;

  try {
    user = await registerSupabaseUser(normalizedBody);
  } catch (error) {
    return apiFail(400, userFacingErrorMessage(error, "注册失败，请稍后再试。"));
  }

  user = user ?? registerUser(data, normalizedBody);
  if (!user) {
    return apiFail(403, "注册失败，请检查账号信息");
  }
  if (!data.users.some((item) => item.id === user.id)) {
    data.users.unshift(user);
  }
  await saveMarketplaceData(data);
  return apiOk(publicUser(user));
}
