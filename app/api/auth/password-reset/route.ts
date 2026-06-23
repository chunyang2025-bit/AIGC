import { userFacingErrorMessage } from "../../../../lib/error-message";
import { getServerSupabasePublicAuth } from "../../../../lib/server/auth";
import { getRuntimeAppUrl } from "../../../../lib/server/env";
import { logRouteFailure, logRouteSuccess } from "../../../../lib/server/route-log";
import { rateLimit } from "../../../../lib/server/rate-limit";
import { apiFail, apiOk, readJson } from "../../../../lib/server/response";

export const dynamic = "force-dynamic";

function normalizeAccount(value: unknown) {
  return String(value || "").trim();
}

export async function POST(request: Request) {
  const limited = rateLimit(request, "auth:password-reset", 6, 60_000);
  if (!limited.allowed) {
    return apiFail(429, "操作过于频繁，请稍后再试");
  }

  const body = await readJson(request);
  const account = normalizeAccount(body.account);
  if (!account) {
    return apiFail(400, "请输入注册邮箱。");
  }
  if (!account.includes("@")) {
    return apiFail(400, "当前仅支持邮箱找回密码。");
  }

  const supabase = getServerSupabasePublicAuth();
  if (!supabase) {
    return apiFail(501, "当前环境未启用邮箱找回密码。");
  }

  const appUrl = getRuntimeAppUrl(request);

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(account, {
      redirectTo: `${appUrl.replace(/\/$/, "")}/reset-password`
    });

    if (error) {
      return apiFail(400, userFacingErrorMessage(error, "找回密码邮件发送失败，请稍后再试。"));
    }

    logRouteSuccess("api/auth/password-reset", {
      account
    });
    return apiOk({
      sent: true
    });
  } catch (error) {
    logRouteFailure("api/auth/password-reset", {
      account
    }, error);
    return apiFail(500, "找回密码邮件发送失败，请稍后再试。");
  }
}
