import { getMarketplaceData } from "../../../../lib/server/data";
import { getRequestUser } from "../../../../lib/server/auth";
import { logRouteInfo } from "../../../../lib/server/route-log";
import { apiFail, apiOk } from "../../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const actor = await getRequestUser(request);
  if (!actor) {
    return apiFail(401, "请先登录后再查看线索详情");
  }

  const data = await getMarketplaceData();
  const creator = data.creators.find((item) => item.userId === actor.id);
  const order = data.orders.find((item) =>
    item.id === params.id &&
    (item.buyerId === actor.id || item.creatorId === creator?.id)
  );

  if (!order) {
    return apiFail(404, "未找到该线索");
  }

  const project = data.projects.find((item) => item.id === order.projectId) ?? null;
  const orderCreator = data.creators.find((item) => item.id === order.creatorId) ?? null;
  const messages = data.messages.filter((message) => message.orderId === order.id);
  const userIds = new Set([
    order.buyerId,
    orderCreator?.userId ?? "",
    ...messages.map((message) => message.senderId)
  ].filter(Boolean));
  const users = data.users.filter((user) => userIds.has(user.id));

  logRouteInfo("api/orders/[id]", "ready", {
    actorId: actor.id,
    orderId: order.id,
    messages: messages.length
  });

  return apiOk({
    order,
    project,
    creator: orderCreator,
    messages,
    users
  });
}
