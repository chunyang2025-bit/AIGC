import { updateOrderStatus } from "../../../../../lib/server/actions";
import { getMarketplaceData, saveMarketplaceData } from "../../../../../lib/server/data";
import { apiFail, apiOk, readJson } from "../../../../../lib/server/response";
import { requiredFields } from "../../../../../lib/server/validation";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await readJson(request);
  const missing = requiredFields(body, ["status"]);
  if (missing.length) {
    return apiFail(400, "缺少必要字段", { missing });
  }

  const data = await getMarketplaceData();
  const order = updateOrderStatus(data, params.id, body);
  if (!order) {
    return apiFail(404, "未找到合作线索或状态不合法");
  }

  await saveMarketplaceData(data);
  return apiOk(order);
}
