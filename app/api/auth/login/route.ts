import { loginUser, publicUser } from "../../../../lib/server/actions";
import { userFacingErrorMessage } from "../../../../lib/error-message";
import { getServerSupabase, loginSupabaseUser } from "../../../../lib/server/auth";
import { getMarketplaceData, invalidateMarketplaceCache, saveMarketplaceData } from "../../../../lib/server/data";
import { rateLimit } from "../../../../lib/server/rate-limit";
import { logRouteFailure, logRouteSuccess } from "../../../../lib/server/route-log";
import { apiFail, apiOk, readJson } from "../../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = rateLimit(request, "auth:login", 12, 60_000);
  if (!limited.allowed) {
    return apiFail(429, "登录尝试过于频繁，请稍后再试");
  }
  const body = await readJson(request);

  try {
    const supabase = getServerSupabase();
    if (supabase) {
      const user = await loginSupabaseUser(body);
      if (!user) {
        return apiFail(404, "未找到可登录用户");
      }

      const { data: storedUser, error: userReadError } = await supabase
        .from("app_users")
        .select("id,status,suspended_reason")
        .eq("id", user.id)
        .maybeSingle();

      if (userReadError) {
        throw new Error(userReadError.message);
      }
      if (storedUser?.status === "suspended") {
        return apiFail(403, String(storedUser.suspended_reason || "账号已被限制登录"));
      }

      const { error: activityError } = await supabase.from("activity_events").insert({
        id: `a-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        user_id: user.id,
        role: user.role,
        event_type: "login",
        target_type: null,
        target_id: null,
        note: "用户登录",
        created_at: new Date().toISOString()
      });
      if (activityError) {
        throw new Error(activityError.message);
      }

      invalidateMarketplaceCache();

      logRouteSuccess("api/auth/login", {
        userId: user.id,
        role: user.role,
        account: String(body.account || body.email || body.phone || "").trim(),
        optimized: true
      });
      return apiOk(publicUser(user));
    }

    const data = await getMarketplaceData();
    const user = loginUser(data, body);
    if (!user) {
      return apiFail(404, "未找到可登录用户");
    }
    const storedUser = data.users.find((item) => item.id === user.id);
    if (storedUser?.status === "suspended") {
      return apiFail(403, storedUser.suspendedReason || "账号已被限制登录");
    }

    await saveMarketplaceData(data);
    logRouteSuccess("api/auth/login", {
      userId: user.id,
      role: user.role,
      account: String(body.account || body.email || body.phone || "").trim()
    });
    return apiOk(publicUser(user));
  } catch (error) {
    const account = String(body.account || body.email || body.phone || "").trim();
    const message = userFacingErrorMessage(error, "登录失败，请稍后再试。");
    logRouteFailure("api/auth/login", {
      role: String(body.role || ""),
      account
    }, error);
    return apiFail(400, message);
  }
}
