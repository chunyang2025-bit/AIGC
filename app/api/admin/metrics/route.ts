import { getAdminMetrics } from "../../../../lib/server/actions";
import { getRequestUser, isSupabaseServerConfigured } from "../../../../lib/server/auth";
import { getMarketplaceData } from "../../../../lib/server/data";
import { apiFail, apiOk } from "../../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const actor = await getRequestUser(request);
  if (isSupabaseServerConfigured() && actor?.role !== "admin") {
    return apiFail(403, "仅平台运营可查看运营指标");
  }
  const data = await getMarketplaceData();
  return apiOk(getAdminMetrics(data));
}
