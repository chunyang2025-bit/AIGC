import { upsertBuyer } from "../../../lib/server/actions";
import { getMarketplaceData, saveMarketplaceData } from "../../../lib/server/data";
import { apiOk, readJson } from "../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readJson(request);

  const data = await getMarketplaceData();
  const buyer = upsertBuyer(data, body);
  await saveMarketplaceData(data);
  return apiOk(buyer);
}
