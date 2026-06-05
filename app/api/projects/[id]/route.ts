import { updateProject } from "../../../../lib/server/actions";
import { getMarketplaceData, saveMarketplaceData } from "../../../../lib/server/data";
import { apiFail, apiOk, readJson } from "../../../../lib/server/response";
import { getRequestUser, isSupabaseServerConfigured } from "../../../../lib/server/auth";
import { requiredFields } from "../../../../lib/server/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const data = await getMarketplaceData();
  const project = data.projects.find((item) => item.id === params.id);

  if (!project) {
    return apiFail(404, "未找到需求");
  }
  if (project.status !== "open" && project.status !== "matching") {
    const actor = await getRequestUser(request);
    const canViewPrivateProject =
      !isSupabaseServerConfigured() ||
      actor?.role === "admin" ||
      actor?.id === project.buyerId;
    if (!canViewPrivateProject) {
      return apiFail(404, "未找到需求");
    }
  }

  const buyer = data.buyerProfiles?.find((item) => item.userId === project.buyerId);
  return apiOk({ project, buyer });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await readJson(request);
  const missing = requiredFields(body, ["title", "description", "category", "budget", "deadline"]);
  if (missing.length) {
    return apiFail(400, "缺少必要字段", { missing });
  }

  const actor = await getRequestUser(request);
  if (isSupabaseServerConfigured() && !actor) {
    return apiFail(401, "请先登录后再重新提交需求");
  }

  const data = await getMarketplaceData();
  const project = data.projects.find((item) => item.id === params.id);
  if (!project) {
    return apiFail(404, "未找到需求");
  }
  if (isSupabaseServerConfigured() && actor && project.buyerId !== actor.id && actor.role !== "admin") {
    return apiFail(403, "只能编辑自己发布的需求");
  }
  if (project.status !== "rejected" && project.status !== "removed" && project.status !== "pending_review") {
    return apiFail(409, "当前状态不支持重新提交");
  }

  const user = actor ? data.users.find((item) => item.id === actor.id) : null;
  if (user?.status === "suspended") {
    return apiFail(403, user.suspendedReason || "账号已被限制，暂不能重新提交需求");
  }

  const result = updateProject(data, params.id, body);
  if (!result) {
    return apiFail(404, "未找到需求");
  }

  await saveMarketplaceData(data);
  return apiOk(result);
}
