import { createProject, listProjects } from "../../../lib/server/actions";
import { getRequestUser, isSupabaseServerConfigured } from "../../../lib/server/auth";
import { getMarketplaceData, saveMarketplaceData } from "../../../lib/server/data";
import { apiFail, apiOk, readJson } from "../../../lib/server/response";
import { requiredFields } from "../../../lib/server/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const data = await getMarketplaceData();
  const { searchParams } = new URL(request.url);
  return apiOk(listProjects(data, searchParams));
}

export async function POST(request: Request) {
  const body = await readJson(request);
  const actor = await getRequestUser(request);
  if (isSupabaseServerConfigured() && !actor) {
    return apiFail(401, "请先登录后再发布需求");
  }
  const missing = requiredFields(body, ["title", "description", "category", "budget", "deadline"]);
  if (missing.length) {
    return apiFail(400, "缺少必要字段", { missing });
  }

  const data = await getMarketplaceData();
  const result = createProject(data, actor ? { ...body, buyerId: actor.id } : body);
  await saveMarketplaceData(data);
  return apiOk(result);
}
