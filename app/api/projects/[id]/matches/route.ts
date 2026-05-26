import { getProjectMatches } from "../../../../../lib/server/actions";
import { getMarketplaceData } from "../../../../../lib/server/data";
import { apiFail, apiOk } from "../../../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const data = await getMarketplaceData();
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
