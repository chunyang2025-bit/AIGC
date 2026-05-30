import { upsertBuyer } from "../../../lib/server/actions";
import { getRequestUser, isSupabaseServerConfigured } from "../../../lib/server/auth";
import { getMarketplaceData, saveMarketplaceData } from "../../../lib/server/data";
import { apiFail, apiOk, readJson } from "../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readJson(request);
  const actor = await getRequestUser(request);
  if (isSupabaseServerConfigured() && !actor) {
    return apiFail(401, "请先登录后再完善主体资料");
  }

  const data = await getMarketplaceData();
  const buyer = upsertBuyer(data, actor ? { ...body, userId: actor.id, id: `bp-${actor.id}` } : body);
  await saveMarketplaceData(data);
  return apiOk(buyer);
}
