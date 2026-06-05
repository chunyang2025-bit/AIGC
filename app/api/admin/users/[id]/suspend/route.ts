import { publicUser, suspendUser } from "../../../../../../lib/server/actions";
import { getRequestUser, isSupabaseServerConfigured } from "../../../../../../lib/server/auth";
import { getMarketplaceData, saveMarketplaceData } from "../../../../../../lib/server/data";
import { apiFail, apiOk, readJson } from "../../../../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const actor = await getRequestUser(request);
  if (isSupabaseServerConfigured() && actor?.role !== "admin") {
    return apiFail(403, "仅平台运营可限制账号");
  }

  const body = await readJson(request);
  const data = await getMarketplaceData();
  const user = suspendUser(data, { ...body, id: params.id });
  if (!user) {
    return apiFail(404, "未找到用户");
  }

  await saveMarketplaceData(data);
  return apiOk(publicUser(user));
}
