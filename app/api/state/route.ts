import { getMarketplaceData } from "../../../lib/server/data";
import { scopeMarketplaceData } from "../../../lib/server/actions";
import { getRequestUser } from "../../../lib/server/auth";
import { apiOk } from "../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const data = await getMarketplaceData();
  const actor = await getRequestUser(request);
  return apiOk(scopeMarketplaceData(data, actor));
}
