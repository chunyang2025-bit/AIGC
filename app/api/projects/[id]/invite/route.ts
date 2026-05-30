import { inviteCreator } from "../../../../../lib/server/actions";
import { getRequestUser, isSupabaseServerConfigured } from "../../../../../lib/server/auth";
import { getMarketplaceData, saveMarketplaceData } from "../../../../../lib/server/data";
import { apiFail, apiOk, readJson } from "../../../../../lib/server/response";
import { requiredFields } from "../../../../../lib/server/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await readJson(request);
  const actor = await getRequestUser(request);
  if (isSupabaseServerConfigured() && !actor) {
    return apiFail(401, "请先登录后再邀请沟通");
  }
  const missing = requiredFields(body, ["creatorId"]);
  if (missing.length) {
    return apiFail(400, "缺少必要字段", { missing });
  }

  const data = await getMarketplaceData();
  const project = data.projects.find((item) => item.id === params.id);
  if (isSupabaseServerConfigured() && actor && project?.buyerId !== actor.id) {
    return apiFail(403, "只能邀请自己需求下的接单方");
  }
  const order = inviteCreator(data, params.id, body);
  if (!order) {
    return apiFail(404, "未找到需求或接单方");
  }

  await saveMarketplaceData(data);
  return apiOk(order);
}
