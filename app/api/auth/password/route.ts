import { publicUser, setUserPassword } from "../../../../lib/server/actions";
import { getMarketplaceData, saveMarketplaceData } from "../../../../lib/server/data";
import { apiFail, apiOk, readJson } from "../../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readJson(request);
  const data = await getMarketplaceData();
  const user = setUserPassword(data, body);

  if (!user) {
    return apiFail(400, "密码设置失败");
  }

  await saveMarketplaceData(data);
  return apiOk(publicUser(user));
}
