import { getMarketplaceData } from "../../../../lib/server/data";
import { apiFail, apiOk } from "../../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const data = await getMarketplaceData();
  const order = data.orders.find((item) => item.id === params.id);

  if (!order) {
    return apiFail(404, "未找到合作线索");
  }

  return apiOk({
    order,
    project: data.projects.find((item) => item.id === order.projectId),
    buyer: data.buyerProfiles?.find((item) => item.userId === order.buyerId),
    creator: data.creators.find((item) => item.id === order.creatorId),
    messages: data.messages.filter((item) => item.orderId === order.id)
  });
}
