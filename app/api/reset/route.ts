import { getRequestUser, isSupabaseServerConfigured } from "../../../lib/server/auth";
import { getMarketplaceData, resetMarketplaceData } from "../../../lib/server/data";
import { logRouteFailure, logRouteInfo } from "../../../lib/server/route-log";
import { apiFail, apiOk } from "../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return apiFail(403, "生产环境不开放重置数据");
  }
  const actor = await getRequestUser(request);
  if (isSupabaseServerConfigured() && actor?.role !== "admin") {
    return apiFail(403, "仅开发环境平台运营可重置数据");
  }
  try {
    const data = await resetMarketplaceData();
    const persisted = await getMarketplaceData();
    logRouteInfo("api/reset", "reset", {
      actorId: actor?.id ?? null,
      responseUsers: data.users.length,
      responseBuyerProfiles: data.buyerProfiles?.length ?? 0,
      responseCreators: data.creators.length,
      responseProjects: data.projects.length,
      persistedUsers: persisted.users.length,
      persistedBuyerProfiles: persisted.buyerProfiles?.length ?? 0,
      persistedCreators: persisted.creators.length,
      persistedProjects: persisted.projects.length
    });
    return apiOk(data);
  } catch (error) {
    logRouteFailure("api/reset", {
      actorId: actor?.id ?? null
    }, error);
    return apiFail(500, "数据重置失败，请稍后重试。");
  }
}
