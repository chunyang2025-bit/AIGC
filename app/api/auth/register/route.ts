import { publicUser, registerUser } from "../../../../lib/server/actions";
import { registerSupabaseUser } from "../../../../lib/server/auth";
import { getMarketplaceData, saveMarketplaceData } from "../../../../lib/server/data";
import { apiFail, apiOk, readJson } from "../../../../lib/server/response";
import { requiredFields } from "../../../../lib/server/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readJson(request);
  const missing = requiredFields(body, ["name", "role"]);
  if (missing.length) {
    return apiFail(400, "缺少必要字段", { missing });
  }

  const account = String(body.account || body.email || body.phone || "").trim();
  if (!account) {
    return apiFail(400, "缺少必要字段", { missing: ["account"] });
  }

  const normalizedBody = {
    ...body,
    account,
    email: String(body.email || (account.includes("@") ? account : `${account}@phone.aigclancer.local`)),
    phone: String(body.phone || (account.includes("@") ? "" : account))
  };

  const data = await getMarketplaceData();
  let user;

  try {
    user = await registerSupabaseUser(normalizedBody);
  } catch (error) {
    return apiFail(400, error instanceof Error ? error.message : "注册失败");
  }

  user = user ?? registerUser(data, normalizedBody);
  if (!user) {
    return apiFail(403, "平台运营账号不开放自助注册");
  }
  if (!data.users.some((item) => item.id === user.id)) {
    data.users.unshift(user);
  }
  await saveMarketplaceData(data);
  return apiOk(publicUser(user));
}
