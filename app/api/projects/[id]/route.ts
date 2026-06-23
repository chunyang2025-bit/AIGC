import { isPublicProject, updateProject } from "../../../../lib/server/actions";
import { getMarketplaceData, saveMarketplaceData } from "../../../../lib/server/data";
import { getRequestUser, isSupabaseServerConfigured } from "../../../../lib/server/auth";
import { logRouteInfo } from "../../../../lib/server/route-log";
import { apiFail, apiOk, readJson } from "../../../../lib/server/response";
import { requiredFields } from "../../../../lib/server/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const actor = await getRequestUser(request);
  const data = await getMarketplaceData();
  const project = data.projects.find((item) => item.id === params.id);

  if (!project) {
    return apiFail(404, "未找到该需求");
  }

  const creator = actor ? data.creators.find((item) => item.userId === actor.id) : null;
  const canView = isPublicProject(project) || project.status === "pending_review" || project.status === "in_progress";
  if (!canView && actor?.role !== "admin" && project.buyerId !== actor?.id && creator?.id !== data.orders.find((order) => order.projectId === project.id)?.creatorId) {
    return apiFail(404, "未找到该需求");
  }

  const buyerProfile = data.buyerProfiles?.find((profile) => profile.userId === project.buyerId) ?? null;
  const sampleMatches = data.matches
    .filter((match) => match.projectId === project.id)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  const sampleCreatorIds = new Set(sampleMatches.map((match) => match.creatorId));
  const sampleCreators = data.creators.filter((creatorItem) => sampleCreatorIds.has(creatorItem.id));

  logRouteInfo("api/projects/[id]", "ready", {
    actorId: actor?.id ?? null,
    projectId: project.id,
    public: isPublicProject(project),
    sampleMatches: sampleMatches.length
  });

  return apiOk({
    project,
    buyerProfile,
    currentCreator: creator,
    sampleMatches,
    sampleCreators
  });
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
