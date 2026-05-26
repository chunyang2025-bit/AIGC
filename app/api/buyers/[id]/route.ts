import { getMarketplaceData } from "../../../../lib/server/data";
import { apiFail, apiOk } from "../../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const data = await getMarketplaceData();
  const buyer = data.buyerProfiles?.find((item) => item.id === params.id || item.userId === params.id);

  if (!buyer) {
    return apiFail(404, "未找到派单方");
  }

  const projects = data.projects.filter((project) => project.buyerId === buyer.userId);
  return apiOk({ buyer, projects });
}
