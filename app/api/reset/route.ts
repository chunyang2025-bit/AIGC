import { resetMarketplaceData } from "../../../lib/server/data";
import { apiFail, apiOk } from "../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return apiFail(403, "生产环境不开放重置数据");
  }
  const data = await resetMarketplaceData();
  return apiOk(data);
}
