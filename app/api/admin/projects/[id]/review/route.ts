import { reviewProject } from "../../../../../../lib/server/actions";
import { getRequestUser, isSupabaseServerConfigured } from "../../../../../../lib/server/auth";
import { getMarketplaceData, saveMarketplaceData } from "../../../../../../lib/server/data";
import { apiFail, apiOk, readJson } from "../../../../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await readJson(request);
  const actor = await getRequestUser(request);
  if (isSupabaseServerConfigured() && actor?.role !== "admin") {
    return apiFail(403, "仅平台运营可审核需求");
  }

  const data = await getMarketplaceData();
  const project = reviewProject(data, { ...body, id: params.id });
  if (!project) {
    return apiFail(404, "未找到待审核需求");
  }

  await saveMarketplaceData(data);
  return apiOk(project);
}
