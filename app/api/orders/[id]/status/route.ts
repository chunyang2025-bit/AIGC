import { updateOrderStatus } from "../../../../../lib/server/actions";
import { getRequestUser, isSupabaseServerConfigured } from "../../../../../lib/server/auth";
import { getMarketplaceData, saveMarketplaceData } from "../../../../../lib/server/data";
import { apiFail, apiOk, readJson } from "../../../../../lib/server/response";
import { requiredFields } from "../../../../../lib/server/validation";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await readJson(request);
  const actor = await getRequestUser(request);
  if (isSupabaseServerConfigured() && !actor) {
    return apiFail(401, "请先登录后再更新合作线索");
  }
  const missing = requiredFields(body, ["status"]);
  if (missing.length) {
    return apiFail(400, "缺少必要字段", { missing });
  }

  const data = await getMarketplaceData();
  const currentOrder = data.orders.find((item) => item.id === params.id);
  const creator = currentOrder ? data.creators.find((item) => item.id === currentOrder.creatorId) : null;
  const allowed = actor && currentOrder ? currentOrder.buyerId === actor.id || creator?.userId === actor.id : true;
  if (isSupabaseServerConfigured() && !allowed) {
    return apiFail(403, "只能更新自己的合作线索");
  }
  const order = updateOrderStatus(data, params.id, body);
  if (!order) {
    return apiFail(404, "未找到合作线索或状态不合法");
  }

  await saveMarketplaceData(data);
  return apiOk(order);
}
