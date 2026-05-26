import { getMarketplaceData } from "../../../../lib/server/data";
import { apiFail, apiOk } from "../../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const data = await getMarketplaceData();
  const project = data.projects.find((item) => item.id === params.id);

  if (!project) {
    return apiFail(404, "未找到需求");
  }

  const buyer = data.buyerProfiles?.find((item) => item.userId === project.buyerId);
  return apiOk({ project, buyer });
}
