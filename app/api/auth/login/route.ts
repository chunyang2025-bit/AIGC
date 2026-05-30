import { loginUser, publicUser } from "../../../../lib/server/actions";
import { loginSupabaseUser } from "../../../../lib/server/auth";
import { getMarketplaceData, saveMarketplaceData } from "../../../../lib/server/data";
import { apiFail, apiOk, readJson } from "../../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readJson(request);
  const data = await getMarketplaceData();
  const user = (await loginSupabaseUser(body)) ?? loginUser(data, body);

  if (!user) {
    return apiFail(404, "未找到可登录用户");
  }

  if (!data.users.some((item) => item.id === user.id)) {
    data.users.unshift(user);
  }
  await saveMarketplaceData(data);
  return apiOk(publicUser(user));
}
