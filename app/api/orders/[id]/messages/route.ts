import { createMessage } from "../../../../../lib/server/actions";
import { getRequestUser, isSupabaseServerConfigured } from "../../../../../lib/server/auth";
import { getMarketplaceData, saveMarketplaceData } from "../../../../../lib/server/data";
import { apiFail, apiOk, readJson } from "../../../../../lib/server/response";
import { requiredFields } from "../../../../../lib/server/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await readJson(request);
  const actor = await getRequestUser(request);
  if (isSupabaseServerConfigured() && !actor) {
    return apiFail(401, "请先登录后再发送消息");
  }
  const missing = requiredFields(body, ["body"]);
  if (missing.length) {
    return apiFail(400, "缺少必要字段", { missing });
  }

  const data = await getMarketplaceData();
  const order = data.orders.find((item) => item.id === params.id);
  const creator = order ? data.creators.find((item) => item.id === order.creatorId) : null;
  const allowed = actor && order ? order.buyerId === actor.id || creator?.userId === actor.id : true;
  if (isSupabaseServerConfigured() && !allowed) {
    return apiFail(403, "只能在自己的合作线索中发送消息");
  }
  const message = createMessage(data, params.id, actor ? { ...body, senderId: actor.id } : body);
  if (!message) {
    return apiFail(404, "未找到合作线索");
  }

  await saveMarketplaceData(data);
  return apiOk(message);
}
