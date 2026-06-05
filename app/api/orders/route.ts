import { listOrders, paginate } from "../../../lib/server/actions";
import { getRequestUser, isSupabaseServerConfigured } from "../../../lib/server/auth";
import { getMarketplaceData } from "../../../lib/server/data";
import { apiFail, apiOk } from "../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const data = await getMarketplaceData();
  const actor = await getRequestUser(request);
  if (isSupabaseServerConfigured() && !actor) {
    return apiFail(401, "请先登录后再查看合作线索");
  }
  const { searchParams } = new URL(request.url);
  const allowedOrders = listOrders(data, searchParams).filter((order) => {
    if (!actor || actor.role === "admin") return true;
    const creator = data.creators.find((item) => item.id === order.creatorId);
    return order.buyerId === actor.id || creator?.userId === actor.id;
  });
  const result = paginate(allowedOrders, searchParams, 20);
  return apiOk(result.items, result.meta);
}
