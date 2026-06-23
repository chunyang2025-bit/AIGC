import { createReport, paginate } from "../../../lib/server/actions";
import { getRequestUser, isSupabaseServerConfigured } from "../../../lib/server/auth";
import { getMarketplaceData, saveMarketplaceData } from "../../../lib/server/data";
import { rateLimit } from "../../../lib/server/rate-limit";
import { logRouteFailure, logRouteSuccess } from "../../../lib/server/route-log";
import { apiFail, apiOk, readJson } from "../../../lib/server/response";
import { requiredFields } from "../../../lib/server/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const actor = await getRequestUser(request);
  if (isSupabaseServerConfigured() && actor?.role !== "admin") {
    return apiFail(403, "仅平台运营可查看举报列表");
  }

  const data = await getMarketplaceData();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const reports = data.reports.filter((report) => (status ? report.status === status : true));
  const result = paginate(reports, searchParams, 20);
  return apiOk(result.items, result.meta);
}

export async function POST(request: Request) {
  const limited = rateLimit(request, "reports:create", 10, 60_000);
  if (!limited.allowed) {
    return apiFail(429, "举报提交过于频繁，请稍后再试");
  }

  const body = await readJson(request);
  const actor = await getRequestUser(request);
  if (isSupabaseServerConfigured() && !actor) {
    return apiFail(401, "请先登录后再提交举报");
  }
  const missing = requiredFields(body, ["targetType", "targetId", "reason"]);
  if (missing.length) {
    return apiFail(400, "缺少必要字段", { missing });
  }

  try {
    const data = await getMarketplaceData();
    const user = actor ? data.users.find((item) => item.id === actor.id) : null;
    if (user?.status === "suspended") {
      return apiFail(403, user.suspendedReason || "账号已被限制，暂不能提交举报");
    }

    const report = createReport(data, actor ? { ...body, reporterId: actor.id } : body);
    if (!report) {
      return apiFail(400, "举报内容不完整");
    }

    await saveMarketplaceData(data);
    logRouteSuccess("api/reports", {
      actorId: actor?.id ?? null,
      reportId: report.id,
      targetType: body.targetType ?? null,
      targetId: body.targetId ?? null
    });
    return apiOk(report);
  } catch (error) {
    logRouteFailure("api/reports", {
      actorId: actor?.id ?? null,
      targetType: body.targetType ?? null,
      targetId: body.targetId ?? null
    }, error);
    return apiFail(500, "举报提交失败，请稍后重试。");
  }
}
