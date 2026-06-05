import { isPublicProject } from "../../../../lib/server/actions";
import { getRequestUser, isSupabaseServerConfigured } from "../../../../lib/server/auth";
import { getMarketplaceData } from "../../../../lib/server/data";
import { apiFail, apiOk } from "../../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const data = await getMarketplaceData();
  const actor = await getRequestUser(request);
  const buyer = data.buyerProfiles?.find((item) => item.id === params.id || item.userId === params.id);

  if (!buyer) {
    return apiFail(404, "未找到派单方");
  }

  const canViewPrivate = !isSupabaseServerConfigured() || actor?.role === "admin" || actor?.id === buyer.userId;
  const projects = data.projects.filter((project) => project.buyerId === buyer.userId && (canViewPrivate || isPublicProject(project)));
  return apiOk({ buyer, projects });
}
