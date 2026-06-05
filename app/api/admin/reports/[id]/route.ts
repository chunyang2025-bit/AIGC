import { resolveReport } from "../../../../../lib/server/actions";
import { getRequestUser, isSupabaseServerConfigured } from "../../../../../lib/server/auth";
import { getMarketplaceData, saveMarketplaceData } from "../../../../../lib/server/data";
import { apiFail, apiOk, readJson } from "../../../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const actor = await getRequestUser(request);
  if (isSupabaseServerConfigured() && actor?.role !== "admin") {
    return apiFail(403, "仅平台运营可处理举报");
  }

  const body = await readJson(request);
  const data = await getMarketplaceData();
  const report = resolveReport(data, { ...body, id: params.id });
  if (!report) {
    return apiFail(404, "未找到举报或状态不合法");
  }

  await saveMarketplaceData(data);
  return apiOk(report);
}
