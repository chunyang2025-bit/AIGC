import { resolveFeedback } from "../../../../../lib/server/actions";
import { getRequestUser } from "../../../../../lib/server/auth";
import { getMarketplaceData, saveMarketplaceData } from "../../../../../lib/server/data";
import { apiFail, apiOk, readJson } from "../../../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const actor = await getRequestUser(request);
  if (actor?.role !== "admin") {
    return apiFail(403, "仅平台运营可处理试用建议");
  }

  const body = await readJson(request);
  const data = await getMarketplaceData();
  const feedback = resolveFeedback(data, { ...body, id: params.id });
  if (!feedback) {
    return apiFail(404, "未找到反馈或状态不合法");
  }

  await saveMarketplaceData(data);
  return apiOk(feedback);
}
