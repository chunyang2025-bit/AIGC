import { createProject, listProjects } from "../../../lib/server/actions";
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
  const missing = requiredFields(body, ["title", "description", "category", "budget", "deadline"]);
  if (missing.length) {
    return apiFail(400, "缺少必要字段", { missing });
  }

  const data = await getMarketplaceData();
  const result = createProject(data, body);
  await saveMarketplaceData(data);
  return apiOk(result);
}
