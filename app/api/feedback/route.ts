import { createFeedback, paginate } from "../../../lib/server/actions";
import { getRequestUser } from "../../../lib/server/auth";
import { getMarketplaceData, saveMarketplaceData } from "../../../lib/server/data";
import { rateLimit } from "../../../lib/server/rate-limit";
import { logRouteFailure, logRouteSuccess } from "../../../lib/server/route-log";
import { apiFail, apiOk, readJson } from "../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const actor = await getRequestUser(request);
  if (actor?.role !== "admin") {
    return apiFail(403, "仅平台运营可查看试用建议");
  }

  const data = await getMarketplaceData();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const feedback = data.feedback.filter((item) => (status ? item.status === status : true));
  const result = paginate(feedback, searchParams, 20);
  return apiOk(result.items, result.meta);
}

export async function POST(request: Request) {
  const limited = rateLimit(request, "feedback:create", 12, 60_000);
  if (!limited.allowed) {
    return apiFail(429, "反馈提交过于频繁，请稍后再试");
  }

  const actor = await getRequestUser(request);
  const body = await readJson(request);
  try {
    const data = await getMarketplaceData();
    const feedback = createFeedback(data, actor ? { ...body, userId: actor.id } : body);
    if (!feedback) {
      return apiFail(400, "反馈内容不完整");
    }

    await saveMarketplaceData(data);
    logRouteSuccess("api/feedback", {
      actorId: actor?.id ?? null,
      feedbackId: feedback.id,
      category: body.category ?? null
    });
    return apiOk(feedback);
  } catch (error) {
    logRouteFailure("api/feedback", {
      actorId: actor?.id ?? null,
      category: body.category ?? null
    }, error);
    return apiFail(500, "反馈提交失败，请稍后重试。");
  }
}
