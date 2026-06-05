import { getProjectMatches } from "../../../../../lib/server/actions";
import { getRequestUser, isSupabaseServerConfigured } from "../../../../../lib/server/auth";
import { getMarketplaceData } from "../../../../../lib/server/data";
import { apiFail, apiOk } from "../../../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const data = await getMarketplaceData();
  const project = data.projects.find((item) => item.id === params.id);
  if (project?.status !== "open" && project?.status !== "matching") {
    const actor = await getRequestUser(request);
    const canViewPrivateProject =
      project &&
      (!isSupabaseServerConfigured() ||
        actor?.role === "admin" ||
        actor?.id === project.buyerId);
    if (!canViewPrivateProject) {
      return apiFail(404, "未找到需求");
    }
  }
  const matches = getProjectMatches(data, params.id);

  if (!matches) {
    return apiFail(404, "未找到需求");
  }

  return apiOk({
    matches,
    creators: matches
      .map((match) => data.creators.find((creator) => creator.id === match.creatorId))
      .filter(Boolean)
  });
}
