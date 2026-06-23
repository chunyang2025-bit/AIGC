import { createProject, pagedProjects } from "../../../lib/server/actions";
import { getRequestUser, getServerSupabase, isSupabaseServerConfigured } from "../../../lib/server/auth";
import { getMarketplaceData, invalidateMarketplaceCache, saveMarketplaceData } from "../../../lib/server/data";
import { rateLimit } from "../../../lib/server/rate-limit";
import { logRouteFailure, logRouteInfo } from "../../../lib/server/route-log";
import { apiFail, apiOk, readJson } from "../../../lib/server/response";
import { CreatorProfile, MarketplaceData, Project, User } from "../../../lib/types";
import { asVerificationType, requiredFields } from "../../../lib/server/validation";

export const dynamic = "force-dynamic";

function toUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id || ""),
    name: String(row.name || ""),
    account: row.account ? String(row.account) : undefined,
    phone: row.phone ? String(row.phone) : undefined,
    email: String(row.email || ""),
    role: String(row.role || "buyer") as User["role"],
    status: row.status ? String(row.status) as User["status"] : undefined,
    suspendedReason: row.suspended_reason ? String(row.suspended_reason) : undefined,
    createdAt: typeof row.created_at === "string" ? String(row.created_at).slice(0, 10) : new Date().toISOString().slice(0, 10)
  };
}

function toCreator(row: Record<string, unknown>): CreatorProfile {
  return {
    id: String(row.id || ""),
    userId: String(row.user_id || ""),
    name: String(row.name || ""),
    title: String(row.title || ""),
    location: String(row.location || ""),
    bio: String(row.bio || ""),
    resume: String(row.resume || ""),
    skills: Array.isArray(row.skills) ? row.skills as string[] : [],
    categories: Array.isArray(row.categories) ? row.categories as CreatorProfile["categories"] : [],
    portfolio: Array.isArray(row.portfolio) ? row.portfolio as string[] : [],
    portfolioItems: Array.isArray(row.portfolio_items) ? row.portfolio_items as CreatorProfile["portfolioItems"] : [],
    servicePackages: Array.isArray(row.service_packages) ? row.service_packages as CreatorProfile["servicePackages"] : [],
    priceMin: Number(row.price_min || 0),
    priceMax: Number(row.price_max || 0),
    completedProjects: Number(row.completed_projects || 0),
    rating: Number(row.rating || 4.6),
    responseTime: String(row.response_time || ""),
    verified: Boolean(row.verified),
    rejectedReason: row.rejected_reason ? String(row.rejected_reason) : undefined,
    identityType: row.identity_type ? asVerificationType(row.identity_type) : undefined,
    verificationType: row.verification_type ? asVerificationType(row.verification_type) : undefined,
    credentialFile: row.credential_file ? String(row.credential_file) : undefined,
    qualificationFiles: Array.isArray(row.qualification_files) ? row.qualification_files as string[] : [],
    avatarUrl: row.avatar_url ? String(row.avatar_url) : undefined,
    displayName: row.display_name ? String(row.display_name) : undefined,
    profileSlogan: row.profile_slogan ? String(row.profile_slogan) : undefined,
    websiteUrl: row.website_url ? String(row.website_url) : undefined,
    socialUrl: row.social_url ? String(row.social_url) : undefined,
    serviceArea: row.service_area ? String(row.service_area) : undefined,
    contactEmail: row.contact_email ? String(row.contact_email) : undefined,
    contactPhone: row.contact_phone ? String(row.contact_phone) : undefined,
    trainingProfile: row.training_profile as CreatorProfile["trainingProfile"],
    cover: String(row.cover || "linear-gradient(135deg, #153f31, #2f7c5f 46%, #f0b35a)")
  };
}

function emptyProjectData(input: { users?: User[]; creators?: MarketplaceData["creators"] } = {}): MarketplaceData {
  return {
    users: input.users ?? [],
    buyerProfiles: [],
    creators: input.creators ?? [],
    projects: [],
    matches: [],
    orders: [],
    messages: [],
    reviews: [],
    reports: [],
    feedback: [],
    activityEvents: []
  };
}

export async function GET(request: Request) {
  const data = await getMarketplaceData();
  const { searchParams } = new URL(request.url);
  const result = pagedProjects(data, searchParams);
  return apiOk(result.items, result.meta);
}

export async function POST(request: Request) {
  const limited = rateLimit(request, "projects:create", 8, 60_000);
  if (!limited.allowed) {
    return apiFail(429, "发布过于频繁，请稍后再试");
  }
  const body = await readJson(request);
  const actor = await getRequestUser(request);
  if (isSupabaseServerConfigured() && !actor) {
    return apiFail(401, "请先登录后再发布需求");
  }
  const missing = requiredFields(body, ["title", "description", "category", "budget", "deadline"]);
  if (missing.length) {
    return apiFail(400, "缺少必要字段", { missing });
  }

  try {
    const supabase = getServerSupabase();
    if (supabase && actor) {
      const [userResult, creatorsResult] = await Promise.all([
        supabase.from("app_users").select("*").eq("id", actor.id).maybeSingle(),
        supabase.from("creator_profiles").select("*").eq("verified", true)
      ]);

      if (userResult.error) {
        throw new Error(userResult.error.message);
      }
      if (creatorsResult.error) {
        throw new Error(creatorsResult.error.message);
      }

      const user = userResult.data ? toUser(userResult.data) : null;
      if (user?.status === "suspended") {
        return apiFail(403, user.suspendedReason || "账号已被限制，暂不能发布需求");
      }

      const data = emptyProjectData({
        users: user ? [user] : [],
        creators: (creatorsResult.data ?? []).map((row) => toCreator(row))
      });
      const result = createProject(data, { ...body, buyerId: actor.id });
      const project = result.project;
      const matches = result.matches;
      const activity = data.activityEvents[0];

      const { error: projectWriteError } = await supabase.from("projects").insert({
        id: project.id,
        buyer_id: project.buyerId,
        title: project.title,
        description: project.description,
        category: project.category,
        tags: project.tags ?? [],
        use_case: project.useCase,
        deliverable_types: project.deliverableTypes ?? [],
        urgency: project.urgency,
        need_invoice: project.needInvoice,
        long_term: project.longTerm,
        accept_platform_recommend: project.acceptPlatformRecommend,
        training_requirement: project.trainingRequirement,
        budget: project.budget,
        deadline: project.deadline,
        status: project.status,
        reference_file: project.referenceFile,
        qualification_file: project.qualificationFile,
        contact_email: project.contactEmail,
        contact_phone: project.contactPhone,
        agent_brief: project.agentBrief,
        rejected_reason: project.rejectedReason,
        created_at: project.createdAt
      });
      if (projectWriteError) {
        throw new Error(projectWriteError.message);
      }

      if (matches.length) {
        const { error: matchesWriteError } = await supabase.from("project_matches").upsert(matches.map((match) => ({
          id: match.id,
          project_id: match.projectId,
          creator_id: match.creatorId,
          score: match.score,
          reason: match.reason,
          risk: match.risk,
          next_step: match.nextStep
        })));
        if (matchesWriteError) {
          throw new Error(matchesWriteError.message);
        }
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

      logRouteInfo("api/projects", "created", {
        actorId: actor.id,
        projectId: result.project.id,
        status: result.project.status,
        category: result.project.category,
        optimized: true
      });
      return apiOk(result);
    }

    const data = await getMarketplaceData();
    const user = actor ? data.users.find((item) => item.id === actor.id) : null;
    if (user?.status === "suspended") {
      return apiFail(403, user.suspendedReason || "账号已被限制，暂不能发布需求");
    }
    const result = createProject(data, actor ? { ...body, buyerId: actor.id } : body);
    await saveMarketplaceData(data);
    logRouteInfo("api/projects", "created", {
      actorId: actor?.id ?? null,
      projectId: result.project.id,
      status: result.project.status,
      category: result.project.category
    });
    return apiOk(result);
  } catch (error) {
    logRouteFailure("api/projects", {
      actorId: actor?.id ?? null,
      title: body.title ?? null,
      category: body.category ?? null
    }, error);
    return apiFail(500, "需求保存失败，请稍后重试。");
  }
}
