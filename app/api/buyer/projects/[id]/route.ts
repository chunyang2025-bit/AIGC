import { getMarketplaceData } from "../../../../../lib/server/data";
import { getRequestUser } from "../../../../../lib/server/auth";
import { logRouteInfo } from "../../../../../lib/server/route-log";
import { apiFail, apiOk } from "../../../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const actor = await getRequestUser(request);
  if (!actor) {
    return apiFail(401, "请先登录后再查看需求详情");
  }

  const data = await getMarketplaceData();
  const project = data.projects.find((item) => item.id === params.id && item.buyerId === actor.id);
  if (!project) {
    return apiFail(404, "未找到该需求");
  }

  const buyerProfile = data.buyerProfiles?.find((profile) => profile.userId === actor.id) ?? null;
  const matches = data.matches.filter((item) => item.projectId === project.id);
  const creatorIds = new Set(matches.map((item) => item.creatorId));
  const leads = data.orders.filter((order) => order.projectId === project.id);
  leads.forEach((order) => creatorIds.add(order.creatorId));
  const creators = data.creators.filter((creator) => creatorIds.has(creator.id));

  logRouteInfo("api/buyer/projects/[id]", "ready", {
    actorId: actor.id,
    projectId: project.id,
    matches: matches.length,
    leads: leads.length
  });

  return apiOk({
    project,
    buyerProfile,
    matches,
    creators,
    leads
  });
}
