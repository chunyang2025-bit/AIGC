import { inviteCreator } from "../../../../../lib/server/actions";
import { getRequestUser, isSupabaseServerConfigured } from "../../../../../lib/server/auth";
import { getMarketplaceData, saveMarketplaceData } from "../../../../../lib/server/data";
import { rateLimit } from "../../../../../lib/server/rate-limit";
import { apiFail, apiOk, readJson } from "../../../../../lib/server/response";
import { requiredFields } from "../../../../../lib/server/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const limited = rateLimit(request, "projects:invite", 20, 60_000);
  if (!limited.allowed) {
    return apiFail(429, "邀请过于频繁，请稍后再试");
  }
  const body = await readJson(request);
  const actor = await getRequestUser(request);
  if (isSupabaseServerConfigured() && !actor) {
    return apiFail(401, "请先登录后再邀请沟通");
  }
  const missing = requiredFields(body, ["creatorId"]);
  if (missing.length) {
    return apiFail(400, "缺少必要字段", { missing });
  }

  const data = await getMarketplaceData();
  const user = actor ? data.users.find((item) => item.id === actor.id) : null;
  if (user?.status === "suspended") {
    return apiFail(403, user.suspendedReason || "账号已被限制，暂不能邀请沟通");
  }
  const project = data.projects.find((item) => item.id === params.id);
  if (isSupabaseServerConfigured() && actor && project?.buyerId !== actor.id) {
    return apiFail(403, "只能邀请自己需求下的接单方");
  }
  if (project && !["pending_review", "open", "matching", "in_progress"].includes(project.status)) {
    return apiFail(409, "当前需求状态暂不能邀请接单方，请先补充或重新提交需求");
  }
  const order = inviteCreator(data, params.id, body);
  if (!order) {
    return apiFail(404, "未找到需求或接单方");
  }

  await saveMarketplaceData(data);
  return apiOk(order);
}
