import { reviewProject } from "../../../../../../lib/server/actions";
import { getRequestUser, getServerSupabase, isSupabaseServerConfigured } from "../../../../../../lib/server/auth";
import { getMarketplaceData, invalidateMarketplaceCache, saveMarketplaceData } from "../../../../../../lib/server/data";
import { logRouteFailure, logRouteSuccess } from "../../../../../../lib/server/route-log";
import { apiFail, apiOk, readJson } from "../../../../../../lib/server/response";
import { MarketplaceData, Project } from "../../../../../../lib/types";

export const dynamic = "force-dynamic";

function hasReason(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function toProject(row: Record<string, unknown>): Project {
  return {
    id: String(row.id || ""),
    buyerId: String(row.buyer_id || ""),
    title: String(row.title || ""),
    description: String(row.description || ""),
    category: String(row.category || "AI Short Video") as Project["category"],
    tags: Array.isArray(row.tags) ? row.tags as string[] : [],
    useCase: row.use_case ? String(row.use_case) as Project["useCase"] : undefined,
    deliverableTypes: Array.isArray(row.deliverable_types) ? row.deliverable_types as Project["deliverableTypes"] : [],
    urgency: row.urgency ? String(row.urgency) as Project["urgency"] : undefined,
    needInvoice: row.need_invoice === null || row.need_invoice === undefined ? undefined : Boolean(row.need_invoice),
    longTerm: row.long_term === null || row.long_term === undefined ? undefined : Boolean(row.long_term),
    acceptPlatformRecommend:
      row.accept_platform_recommend === null || row.accept_platform_recommend === undefined
        ? undefined
        : Boolean(row.accept_platform_recommend),
    trainingRequirement: row.training_requirement as Project["trainingRequirement"],
    budget: Number(row.budget || 0),
    deadline: typeof row.deadline === "string" ? row.deadline.slice(0, 10) : new Date().toISOString().slice(0, 10),
    status: String(row.status || "pending_review") as Project["status"],
    referenceFile: row.reference_file ? String(row.reference_file) : undefined,
    qualificationFile: row.qualification_file ? String(row.qualification_file) : undefined,
    contactEmail: row.contact_email ? String(row.contact_email) : undefined,
    contactPhone: row.contact_phone ? String(row.contact_phone) : undefined,
    agentBrief: row.agent_brief as Project["agentBrief"],
    rejectedReason: row.rejected_reason ? String(row.rejected_reason) : undefined,
    createdAt: typeof row.created_at === "string" ? row.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10)
  };
}

function emptyProjectReviewData(project: Project): MarketplaceData {
  return {
    users: [],
    buyerProfiles: [],
    creators: [],
    projects: [project],
    matches: [],
    orders: [],
    messages: [],
    reviews: [],
    reports: [],
    feedback: [],
    activityEvents: []
  };
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await readJson(request);
  const actor = await getRequestUser(request);
  if (isSupabaseServerConfigured() && actor?.role !== "admin") {
    return apiFail(403, "仅平台运营可审核需求");
  }
  const requestedStatus = String(body.status || "");
  if (["rejected", "removed"].includes(requestedStatus) && !hasReason(body.rejectedReason ?? body.reason)) {
    return apiFail(400, requestedStatus === "removed" ? "下架需求时请填写原因" : "驳回需求时请填写原因");
  }

  try {
    const supabase = getServerSupabase();
    if (supabase && actor?.role === "admin") {
      const { data: projectRow, error: projectReadError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", params.id)
        .maybeSingle();

      if (projectReadError) {
        throw new Error(projectReadError.message);
      }
      if (!projectRow) {
        return apiFail(404, "未找到待审核需求");
      }

      const data = emptyProjectReviewData(toProject(projectRow));
      const project = reviewProject(data, {
        ...body,
        id: params.id,
        actorId: actor.id,
        actorName: actor.name
      });
      if (!project) {
        return apiFail(404, "未找到待审核需求");
      }

      const activity = data.activityEvents[0];
      const { error: projectWriteError } = await supabase
        .from("projects")
        .update({
          status: project.status,
          rejected_reason: project.rejectedReason ?? null
        })
        .eq("id", params.id);

      if (projectWriteError) {
        throw new Error(projectWriteError.message);
      }

      if (activity) {
        const { error: activityError } = await supabase.from("activity_events").insert({
          id: activity.id,
          user_id: activity.userId,
          role: activity.role,
          event_type: activity.eventType,
          target_type: activity.targetType,
          target_id: activity.targetId,
          note: activity.note,
          created_at: activity.createdAt
        });
        if (activityError) {
          throw new Error(activityError.message);
        }
      }

      invalidateMarketplaceCache();

      logRouteSuccess("api/admin/projects/review", {
        actorId: actor.id,
        projectId: params.id,
        status: project.status,
        optimized: true
      });
      return apiOk(project);
    }

    const data = await getMarketplaceData();
    const project = reviewProject(data, {
      ...body,
      id: params.id,
      actorId: actor?.id,
      actorName: actor?.name
    });
    if (!project) {
      return apiFail(404, "未找到待审核需求");
    }

    await saveMarketplaceData(data);
    logRouteSuccess("api/admin/projects/review", {
      actorId: actor?.id ?? null,
      projectId: params.id,
      status: project.status
    });
    return apiOk(project);
  } catch (error) {
    logRouteFailure("api/admin/projects/review", {
      actorId: actor?.id ?? null,
      projectId: params.id,
      requestedStatus: body.status ?? null
    }, error);
    return apiFail(500, "需求审核保存失败，请稍后重试。");
  }
}
