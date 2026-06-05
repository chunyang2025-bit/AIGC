import { getRequestUser, isSupabaseServerConfigured } from "../../../lib/server/auth";
import { resetMarketplaceData } from "../../../lib/server/data";
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
  const data = await resetMarketplaceData();
  return apiOk(data);
}
