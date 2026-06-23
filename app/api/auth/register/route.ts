import { publicUser, registerUser } from "../../../../lib/server/actions";
import { userFacingErrorMessage } from "../../../../lib/error-message";
import { getServerSupabase, registerSupabaseUser } from "../../../../lib/server/auth";
import { getMarketplaceData, invalidateMarketplaceCache, saveMarketplaceData } from "../../../../lib/server/data";
import { rateLimit } from "../../../../lib/server/rate-limit";
import { logRouteFailure, logRouteSuccess } from "../../../../lib/server/route-log";
import { apiFail, apiOk, readJson } from "../../../../lib/server/response";
import { requiredFields } from "../../../../lib/server/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readJson(request);
  const missing = requiredFields(body, ["name", "role"]);
  if (missing.length) {
    return apiFail(400, "缺少必要字段", { missing });
  }

  const account = String(body.account || body.email || body.phone || "").trim();
  if (!account) {
    return apiFail(400, "缺少必要字段", { missing: ["account"] });
  }
  const ipLimited = rateLimit(request, "auth:register:ip", process.env.NODE_ENV === "production" ? 30 : 100, 60_000);
  if (!ipLimited.allowed) {
    return apiFail(429, "当前网络注册人数较多，请稍后再试");
  }
  const accountLimited = rateLimit(request, `auth:register:account:${account.toLowerCase()}`, 3, 60_000);
  if (!accountLimited.allowed) {
    return apiFail(429, "该账号注册尝试过于频繁，请稍后再试");
  }

  try {
    const normalizedBody = {
      ...body,
      role: String(body.role || "buyer"),
      account,
      email: String(body.email || (account.includes("@") ? account : `${account}@phone.aigclancer.local`)),
      phone: String(body.phone || "").trim().startsWith("+") ? String(body.phone || "").trim() : ""
    };

    if (String(normalizedBody.role) === "admin") {
      const inviteCode = String(body.inviteCode || "");
      const expectedCode = process.env.ADMIN_INVITE_CODE || (process.env.NODE_ENV !== "production" ? "AIGC-ADMIN-2026" : "");
      if (!expectedCode || inviteCode !== expectedCode) {
        return apiFail(403, "后台人员注册邀请码不正确");
      }
    }

    const supabase = getServerSupabase();
    if (supabase) {
      const user = await registerSupabaseUser(normalizedBody);
      if (!user) {
        return apiFail(403, "注册失败，请检查账号信息");
      }

      const createdAt = user.createdAt || new Date().toISOString().slice(0, 10);
      const { error: userWriteError } = await supabase.from("app_users").upsert({
        id: user.id,
        name: user.name,
        account: user.account,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: "active",
        suspended_reason: null,
        created_at: createdAt
      });
      if (userWriteError) {
        throw new Error(userWriteError.message);
      }

      const { error: activityError } = await supabase.from("activity_events").insert({
        id: `a-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        user_id: user.id,
        role: user.role,
        event_type: "login",
        target_type: null,
        target_id: null,
        note: "用户注册完成",
        created_at: new Date().toISOString()
      });
      if (activityError) {
        throw new Error(activityError.message);
      }

      invalidateMarketplaceCache();

      logRouteSuccess("api/auth/register", {
        userId: user.id,
        role: user.role,
        account: normalizedBody.account,
        optimized: true
      });
      return apiOk(publicUser(user));
    }

    const data = await getMarketplaceData();
    const user = registerUser(data, normalizedBody);
    if (!user) {
      return apiFail(403, "注册失败，请检查账号信息");
    }
    await saveMarketplaceData(data);
    logRouteSuccess("api/auth/register", {
      userId: user.id,
      role: user.role,
      account: normalizedBody.account
    });
    return apiOk(publicUser(user));
  } catch (error) {
    const role = String(body.role || "buyer");
    const message = userFacingErrorMessage(error, "注册失败，请稍后再试。");
    logRouteFailure("api/auth/register", {
      role,
      account
    }, error);
    return apiFail(400, message);
  }
}
