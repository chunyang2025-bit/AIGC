import { publicUser, suspendUser } from "../../../../../../lib/server/actions";
import { getRequestUser, isSupabaseServerConfigured } from "../../../../../../lib/server/auth";
import { getMarketplaceData, saveMarketplaceData } from "../../../../../../lib/server/data";
import { logRouteFailure, logRouteSuccess } from "../../../../../../lib/server/route-log";
import { apiFail, apiOk, readJson } from "../../../../../../lib/server/response";

export const dynamic = "force-dynamic";

function hasReason(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const actor = await getRequestUser(request);
  if (isSupabaseServerConfigured() && actor?.role !== "admin") {
    return apiFail(403, "仅平台运营可限制账号");
  }

  const body = await readJson(request);
  const suspended = body.suspended === undefined ? true : Boolean(body.suspended);
  if (suspended && !hasReason(body.reason ?? body.suspendedReason)) {
    return apiFail(400, "限制账号时请填写原因");
  }
  try {
    const data = await getMarketplaceData();
    const user = suspendUser(data, {
      ...body,
      id: params.id,
      actorId: actor?.id,
      actorName: actor?.name
    });
    if (!user) {
      return apiFail(404, "未找到用户");
    }

    await saveMarketplaceData(data);
    logRouteSuccess("api/admin/users/suspend", {
      actorId: actor?.id ?? null,
      userId: params.id,
      suspended: body.suspended ?? true
    });
    return apiOk(publicUser(user));
  } catch (error) {
    logRouteFailure("api/admin/users/suspend", {
      actorId: actor?.id ?? null,
      userId: params.id,
      suspended: body.suspended ?? true
    }, error);
    return apiFail(500, "账号状态更新失败，请稍后重试。");
  }
}
