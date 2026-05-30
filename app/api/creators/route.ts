import { listCreators, upsertCreator } from "../../../lib/server/actions";
import { getRequestUser, isSupabaseServerConfigured } from "../../../lib/server/auth";
import { getMarketplaceData, saveMarketplaceData } from "../../../lib/server/data";
import { apiFail, apiOk, readJson } from "../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const data = await getMarketplaceData();
  const { searchParams } = new URL(request.url);
  return apiOk(listCreators(data, searchParams));
}

export async function POST(request: Request) {
  const body = await readJson(request);
  const actor = await getRequestUser(request);
  if (isSupabaseServerConfigured() && !actor) {
    return apiFail(401, "请先登录后再完善展示页");
  }

  const data = await getMarketplaceData();
  const creator = upsertCreator(data, actor ? { ...body, userId: actor.id, id: `c-${actor.id}` } : body);
  await saveMarketplaceData(data);
  return apiOk(creator);
}
