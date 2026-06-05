import { pagedCreators, upsertCreator } from "../../../lib/server/actions";
import { getRequestUser, isSupabaseServerConfigured } from "../../../lib/server/auth";
import { getMarketplaceData, saveMarketplaceData } from "../../../lib/server/data";
import { rateLimit } from "../../../lib/server/rate-limit";
import { apiFail, apiOk, readJson } from "../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const data = await getMarketplaceData();
  const { searchParams } = new URL(request.url);
  const result = pagedCreators(data, searchParams);
  return apiOk(result.items, result.meta);
}

export async function POST(request: Request) {
  const limited = rateLimit(request, "creators:upsert", 12, 60_000);
  if (!limited.allowed) {
    return apiFail(429, "提交过于频繁，请稍后再试");
  }
  const body = await readJson(request);
  const actor = await getRequestUser(request);
  if (isSupabaseServerConfigured() && !actor) {
    return apiFail(401, "请先登录后再完善展示页");
  }

  const data = await getMarketplaceData();
  const user = actor ? data.users.find((item) => item.id === actor.id) : null;
  if (user?.status === "suspended") {
    return apiFail(403, user.suspendedReason || "账号已被限制，暂不能提交展示页");
  }
  const creator = upsertCreator(data, actor ? { ...body, userId: actor.id, id: `c-${actor.id}` } : body);
  await saveMarketplaceData(data);
  return apiOk(creator);
}
