import { loginUser, publicUser } from "../../../../lib/server/actions";
import { userFacingErrorMessage } from "../../../../lib/error-message";
import { loginSupabaseUser } from "../../../../lib/server/auth";
import { getMarketplaceData, saveMarketplaceData } from "../../../../lib/server/data";
import { rateLimit } from "../../../../lib/server/rate-limit";
import { apiFail, apiOk, readJson } from "../../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = rateLimit(request, "auth:login", 12, 60_000);
  if (!limited.allowed) {
    return apiFail(429, "登录尝试过于频繁，请稍后再试");
  }
  const body = await readJson(request);
  const data = await getMarketplaceData();
  let user;

  try {
    user = (await loginSupabaseUser(body)) ?? loginUser(data, body);
  } catch (error) {
    return apiFail(400, userFacingErrorMessage(error, "登录失败，请稍后再试。"));
  }

  if (!user) {
    return apiFail(404, "未找到可登录用户");
  }
  const storedUser = data.users.find((item) => item.id === user.id);
  if (storedUser?.status === "suspended") {
    return apiFail(403, storedUser.suspendedReason || "账号已被限制登录");
  }

  if (!data.users.some((item) => item.id === user.id)) {
    data.users.unshift(user);
  }
  await saveMarketplaceData(data);
  return apiOk(publicUser(user));
}
