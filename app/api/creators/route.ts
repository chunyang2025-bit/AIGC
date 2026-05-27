import { listCreators, upsertCreator } from "../../../lib/server/actions";
import { getMarketplaceData, saveMarketplaceData } from "../../../lib/server/data";
import { apiOk, readJson } from "../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const data = await getMarketplaceData();
  const { searchParams } = new URL(request.url);
  return apiOk(listCreators(data, searchParams));
}

export async function POST(request: Request) {
  const body = await readJson(request);

  const data = await getMarketplaceData();
  const creator = upsertCreator(data, body);
  await saveMarketplaceData(data);
  return apiOk(creator);
}
