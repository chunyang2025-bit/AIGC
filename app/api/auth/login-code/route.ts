import { userFacingErrorMessage } from "../../../../lib/error-message";
import { sendSupabaseLoginCode } from "../../../../lib/server/auth";
import { rateLimit } from "../../../../lib/server/rate-limit";
import { logRouteFailure, logRouteSuccess } from "../../../../lib/server/route-log";
import { apiFail, apiOk, readJson } from "../../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = rateLimit(request, "auth:login-code", 6, 60_000);
  if (!limited.allowed) {
    return apiFail(429, "验证码发送过于频繁，请稍后再试");
  }

  const body = await readJson(request);

  try {
    const result = await sendSupabaseLoginCode(body);
    if (!result) {
      return apiFail(501, "当前环境暂未开通短信验证码登录");
    }

    logRouteSuccess("api/auth/login-code", {
      role: String(body.role || ""),
      account: String(body.account || body.phone || "").trim()
    });
    return apiOk(result);
  } catch (error) {
    const message = userFacingErrorMessage(error, "验证码发送失败，请稍后再试。");
    logRouteFailure("api/auth/login-code", {
      role: String(body.role || ""),
      account: String(body.account || body.phone || "").trim()
    }, error);
    return apiFail(400, message);
  }
}
