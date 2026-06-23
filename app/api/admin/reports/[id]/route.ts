import { resolveReport } from "../../../../../lib/server/actions";
import { getRequestUser, isSupabaseServerConfigured } from "../../../../../lib/server/auth";
import { getMarketplaceData, saveMarketplaceData } from "../../../../../lib/server/data";
import { logRouteFailure, logRouteSuccess } from "../../../../../lib/server/route-log";
import { apiFail, apiOk, readJson } from "../../../../../lib/server/response";

export const dynamic = "force-dynamic";

function hasReason(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const actor = await getRequestUser(request);
  if (isSupabaseServerConfigured() && actor?.role !== "admin") {
    return apiFail(403, "仅平台运营可处理举报");
  }

  const body = await readJson(request);
  const status = String(body.status || "");
  if (["resolved", "dismissed"].includes(status) && !hasReason(body.resolution ?? body.note)) {
    return apiFail(400, status === "dismissed" ? "驳回举报时请填写处理说明" : "处理举报时请填写处理说明");
  }
  try {
    const data = await getMarketplaceData();
    const report = resolveReport(data, {
      ...body,
      id: params.id,
      actorId: actor?.id,
      actorName: actor?.name
    });
    if (!report) {
      return apiFail(404, "未找到举报或状态不合法");
    }

    await saveMarketplaceData(data);
    logRouteSuccess("api/admin/reports", {
      actorId: actor?.id ?? null,
      reportId: params.id,
      status: body.status ?? null
    });
    return apiOk(report);
  } catch (error) {
    logRouteFailure("api/admin/reports", {
      actorId: actor?.id ?? null,
      reportId: params.id,
      status: body.status ?? null
    }, error);
    return apiFail(500, "举报处理失败，请稍后重试。");
  }
}
