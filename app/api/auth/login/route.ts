import { loginUser } from "../../../../lib/server/actions";
import { getMarketplaceData, saveMarketplaceData } from "../../../../lib/server/data";
import { apiFail, apiOk, readJson } from "../../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readJson(request);
  const data = await getMarketplaceData();
  const user = loginUser(data, body);

  if (!user) {
    return apiFail(404, "未找到可登录用户");
  }

  await saveMarketplaceData(data);
  return apiOk(user);
}
