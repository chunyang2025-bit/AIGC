import { resetMarketplaceData } from "../../../lib/server/data";
import { apiOk } from "../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function POST() {
  const data = await resetMarketplaceData();
  return apiOk(data);
}
