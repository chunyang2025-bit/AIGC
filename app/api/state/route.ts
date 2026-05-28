import { getMarketplaceData } from "../../../lib/server/data";
import { publicMarketplaceData } from "../../../lib/server/actions";
import { apiOk } from "../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getMarketplaceData();
  return apiOk(publicMarketplaceData(data));
}
