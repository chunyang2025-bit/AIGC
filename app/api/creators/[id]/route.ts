import { getRequestUser, isSupabaseServerConfigured } from "../../../../lib/server/auth";
import { getMarketplaceData } from "../../../../lib/server/data";
import { apiFail, apiOk } from "../../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const data = await getMarketplaceData();
  const actor = await getRequestUser(request);
  const creator = data.creators.find((item) => item.id === params.id || item.userId === params.id);

  if (!creator) {
    return apiFail(404, "未找到接单方");
  }
  const canViewPrivate = !isSupabaseServerConfigured() || actor?.role === "admin" || actor?.id === creator.userId;
  if (!creator.verified && !canViewPrivate) {
    return apiFail(404, "未找到接单方");
  }

  const orders = canViewPrivate ? data.orders.filter((order) => order.creatorId === creator.id) : [];
  return apiOk({ creator, orders });
}
