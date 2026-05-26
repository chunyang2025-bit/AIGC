import { expressInterest } from "../../../../../lib/server/actions";
import { getMarketplaceData, saveMarketplaceData } from "../../../../../lib/server/data";
import { apiFail, apiOk, readJson } from "../../../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await readJson(request);
  const data = await getMarketplaceData();
  const order = expressInterest(data, params.id, body);

  if (!order) {
    return apiFail(404, "未找到需求或接单方");
  }

  await saveMarketplaceData(data);
  return apiOk(order);
}
