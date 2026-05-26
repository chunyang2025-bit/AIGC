import { listOrders } from "../../../lib/server/actions";
import { getMarketplaceData } from "../../../lib/server/data";
import { apiOk } from "../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const data = await getMarketplaceData();
  const { searchParams } = new URL(request.url);
  return apiOk(listOrders(data, searchParams));
}
