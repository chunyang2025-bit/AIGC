import { publicUser, setUserPassword } from "../../../../lib/server/actions";
import { getRequestUser, isSupabaseServerConfigured } from "../../../../lib/server/auth";
import { getMarketplaceData, saveMarketplaceData } from "../../../../lib/server/data";
import { logRouteFailure, logRouteSuccess } from "../../../../lib/server/route-log";
import { apiFail, apiOk, readJson } from "../../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!isSupabaseServerConfigured()) {
    return apiFail(501, "当前环境暂不支持站内改密，请使用注册登录链路继续体验。");
  }
  const actor = await getRequestUser(request);
  if (!actor) {
    return apiFail(401, "请先登录后再修改密码");
  }
  if (String(body.userId || "") !== actor.id) {
    return apiFail(403, "只能修改自己的密码");
  }

  try {
    const data = await getMarketplaceData();
    const user = setUserPassword(data, body);

    if (!user) {
      return apiFail(400, "密码设置失败");
    }

    await saveMarketplaceData(data);
    logRouteSuccess("api/auth/password", {
      actorId: actor.id,
      userId: user.id
    });
    return apiOk(publicUser(user));
  } catch (error) {
    logRouteFailure("api/auth/password", {
      actorId: actor.id,
      userId: body.userId ?? null,
    }, error);
    return apiFail(500, "密码设置失败，请稍后重试。");
  }
}
