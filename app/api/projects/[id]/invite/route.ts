import { inviteCreator } from "../../../../../lib/server/actions";
import { getMarketplaceData, saveMarketplaceData } from "../../../../../lib/server/data";
import { apiFail, apiOk, readJson } from "../../../../../lib/server/response";
import { requiredFields } from "../../../../../lib/server/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await readJson(request);
  const missing = requiredFields(body, ["creatorId"]);
  if (missing.length) {
    return apiFail(400, "缺少必要字段", { missing });
  }

  const data = await getMarketplaceData();
  const order = inviteCreator(data, params.id, body);
  if (!order) {
    return apiFail(404, "未找到需求或接单方");
  }

  await saveMarketplaceData(data);
  return apiOk(order);
}
