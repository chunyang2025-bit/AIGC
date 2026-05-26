import { getMarketplaceData } from "../../../../lib/server/data";
import { apiFail, apiOk } from "../../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const data = await getMarketplaceData();
  const creator = data.creators.find((item) => item.id === params.id || item.userId === params.id);

  if (!creator) {
    return apiFail(404, "未找到接单方");
  }

  const orders = data.orders.filter((order) => order.creatorId === creator.id);
  return apiOk({ creator, orders });
}
