import { registerUser } from "../../../../lib/server/actions";
import { getMarketplaceData, saveMarketplaceData } from "../../../../lib/server/data";
import { apiFail, apiOk, readJson } from "../../../../lib/server/response";
import { requiredFields } from "../../../../lib/server/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readJson(request);
  const missing = requiredFields(body, ["name", "email", "role"]);
  if (missing.length) {
    return apiFail(400, "缺少必要字段", { missing });
  }

  const data = await getMarketplaceData();
  const user = registerUser(data, body);
  if (!user) {
    return apiFail(403, "平台运营账号不开放自助注册");
  }
  await saveMarketplaceData(data);
  return apiOk(user);
}
