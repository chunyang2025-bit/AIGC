import { resolveFeedback } from "../../../../../lib/server/actions";
import { getRequestUser } from "../../../../../lib/server/auth";
import { getMarketplaceData, saveMarketplaceData } from "../../../../../lib/server/data";
import { logRouteFailure, logRouteSuccess } from "../../../../../lib/server/route-log";
import { apiFail, apiOk, readJson } from "../../../../../lib/server/response";

export const dynamic = "force-dynamic";

function hasReason(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const actor = await getRequestUser(request);
  if (actor?.role !== "admin") {
    return apiFail(403, "仅平台运营可处理试用建议");
  }

  const body = await readJson(request);
  const status = String(body.status || "");
  if (["resolved", "dismissed"].includes(status) && !hasReason(body.resolution ?? body.note)) {
    return apiFail(400, status === "dismissed" ? "暂不处理建议时请填写说明" : "处理建议时请填写说明");
  }
  try {
    const data = await getMarketplaceData();
    const feedback = resolveFeedback(data, {
      ...body,
      id: params.id,
      actorId: actor?.id,
      actorName: actor?.name
    });
    if (!feedback) {
      return apiFail(404, "未找到反馈或状态不合法");
    }

    await saveMarketplaceData(data);
    logRouteSuccess("api/admin/feedback", {
      actorId: actor?.id ?? null,
      feedbackId: params.id,
      status: body.status ?? null
    });
    return apiOk(feedback);
  } catch (error) {
    logRouteFailure("api/admin/feedback", {
      actorId: actor?.id ?? null,
      feedbackId: params.id,
      status: body.status ?? null
    }, error);
    return apiFail(500, "反馈处理失败，请稍后重试。");
  }
}
