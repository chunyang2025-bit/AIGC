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
  await saveMarketplaceData(data);
  return apiOk(user);
}
