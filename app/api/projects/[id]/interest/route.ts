import { expressInterest } from "../../../../../lib/server/actions";
import { getRequestUser, isSupabaseServerConfigured } from "../../../../../lib/server/auth";
import { getMarketplaceData, saveMarketplaceData } from "../../../../../lib/server/data";
import { rateLimit } from "../../../../../lib/server/rate-limit";
import { logRouteFailure, logRouteSuccess } from "../../../../../lib/server/route-log";
import { apiFail, apiOk, readJson } from "../../../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const limited = rateLimit(request, "projects:interest", 20, 60_000);
  if (!limited.allowed) {
    return apiFail(429, "发起沟通过于频繁，请稍后再试");
  }
  const body = await readJson(request);
  const actor = await getRequestUser(request);
  if (isSupabaseServerConfigured() && !actor) {
    return apiFail(401, "请先登录后再发起沟通");
  }
  try {
    const data = await getMarketplaceData();
    const user = actor ? data.users.find((item) => item.id === actor.id) : null;
    if (user?.status === "suspended") {
      return apiFail(403, user.suspendedReason || "账号已被限制，暂不能发起沟通");
    }
    const project = data.projects.find((item) => item.id === params.id);
    if (project && !["pending_review", "open", "matching", "in_progress"].includes(project.status)) {
      return apiFail(409, "当前需求状态暂不能发起沟通，请等待需求方补充或重新提交");
    }
    const currentCreator = actor ? data.creators.find((creator) => creator.userId === actor.id) : null;
    if (isSupabaseServerConfigured() && !currentCreator) {
      return apiFail(403, "请先开通接单能力并完成展示页");
    }
    const order = expressInterest(data, params.id, currentCreator ? { ...body, creatorId: currentCreator.id } : body);

    if (!order) {
      return apiFail(404, "未找到需求或接单方");
    }

    await saveMarketplaceData(data);
    logRouteSuccess("api/projects/interest", {
      actorId: actor?.id ?? null,
      projectId: params.id,
      creatorId: currentCreator?.id ?? body.creatorId ?? null,
      orderId: order.id
    });
    return apiOk(order);
  } catch (error) {
    logRouteFailure("api/projects/interest", {
      actorId: actor?.id ?? null,
      projectId: params.id
    }, error);
    return apiFail(500, "发起沟通失败，请稍后重试。");
  }
}
