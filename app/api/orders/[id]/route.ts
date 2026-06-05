import { getRequestUser, isSupabaseServerConfigured } from "../../../../lib/server/auth";
import { getMarketplaceData } from "../../../../lib/server/data";
import { apiFail, apiOk } from "../../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const data = await getMarketplaceData();
  const actor = await getRequestUser(request);
  if (isSupabaseServerConfigured() && !actor) {
    return apiFail(401, "请先登录后再查看合作线索");
  }
  const order = data.orders.find((item) => item.id === params.id);

  if (!order) {
    return apiFail(404, "未找到合作线索");
  }
  const creator = data.creators.find((item) => item.id === order.creatorId);
  const allowed = !actor || actor.role === "admin" || order.buyerId === actor.id || creator?.userId === actor.id;
  if (isSupabaseServerConfigured() && !allowed) {
    return apiFail(403, "只能查看自己的合作线索");
  }

  return apiOk({
    order,
    project: data.projects.find((item) => item.id === order.projectId),
    buyer: data.buyerProfiles?.find((item) => item.userId === order.buyerId),
    creator,
    messages: data.messages.filter((item) => item.orderId === order.id)
  });
}
