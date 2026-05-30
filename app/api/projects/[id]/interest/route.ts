import { expressInterest } from "../../../../../lib/server/actions";
import { getRequestUser, isSupabaseServerConfigured } from "../../../../../lib/server/auth";
import { getMarketplaceData, saveMarketplaceData } from "../../../../../lib/server/data";
import { apiFail, apiOk, readJson } from "../../../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await readJson(request);
  const actor = await getRequestUser(request);
  if (isSupabaseServerConfigured() && !actor) {
    return apiFail(401, "请先登录后再发起沟通");
  }
  const data = await getMarketplaceData();
  const currentCreator = actor ? data.creators.find((creator) => creator.userId === actor.id) : null;
  if (isSupabaseServerConfigured() && !currentCreator) {
    return apiFail(403, "请先开通接单能力并完成展示页");
  }
  const order = expressInterest(data, params.id, currentCreator ? { ...body, creatorId: currentCreator.id } : body);

  if (!order) {
    return apiFail(404, "未找到需求或接单方");
  }

  await saveMarketplaceData(data);
  return apiOk(order);
}
