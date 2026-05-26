import { getPublicMarketplace } from "../../../lib/server/actions";
import { getMarketplaceData } from "../../../lib/server/data";
import { apiOk } from "../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getMarketplaceData();
  return apiOk(getPublicMarketplace(data));
}
