import { pagedCreators, upsertCreator } from "../../../lib/server/actions";
import { getRequestUser, getServerSupabase, isSupabaseServerConfigured } from "../../../lib/server/auth";
import { getMarketplaceData, invalidateMarketplaceCache, saveMarketplaceData } from "../../../lib/server/data";
import { rateLimit } from "../../../lib/server/rate-limit";
import { logRouteFailure, logRouteInfo } from "../../../lib/server/route-log";
import { apiFail, apiOk, readJson } from "../../../lib/server/response";
import { CreatorProfile, MarketplaceData, User } from "../../../lib/types";

export const dynamic = "force-dynamic";

function toUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id || ""),
    name: String(row.name || ""),
    account: row.account ? String(row.account) : undefined,
    phone: row.phone ? String(row.phone) : undefined,
    email: String(row.email || ""),
    role: String(row.role || "creator") as User["role"],
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
    reviewDraft: row.review_draft && typeof row.review_draft === "object" ? row.review_draft as Record<string, unknown> : undefined,
    reviewDraftSubmittedAt: row.review_draft_submitted_at ? String(row.review_draft_submitted_at) : undefined,
    reviewDraftRejectedReason: row.review_draft_rejected_reason ? String(row.review_draft_rejected_reason) : undefined,
    identityType: row.identity_type ? String(row.identity_type) as CreatorProfile["identityType"] : undefined,
    verificationType: row.verification_type ? String(row.verification_type) as CreatorProfile["verificationType"] : undefined,
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

function emptyData(input: { users?: User[]; creators?: CreatorProfile[] } = {}): MarketplaceData {
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
  const result = pagedCreators(data, searchParams);
  return apiOk(result.items, result.meta);
}

export async function POST(request: Request) {
  const limited = rateLimit(request, "creators:upsert", 12, 60_000);
  if (!limited.allowed) {
    return apiFail(429, "提交过于频繁，请稍后再试");
  }
  const body = await readJson(request);
  const actor = await getRequestUser(request);
  if (isSupabaseServerConfigured() && !actor) {
    return apiFail(401, "请先登录后再完善展示页");
  }

  try {
    const supabase = getServerSupabase();
    if (supabase && actor) {
      const [userResult, creatorResult] = await Promise.all([
        supabase.from("app_users").select("*").eq("id", actor.id).maybeSingle(),
        supabase.from("creator_profiles").select("*").eq("user_id", actor.id).maybeSingle()
      ]);

      if (userResult.error) {
        throw new Error(userResult.error.message);
      }
      if (creatorResult.error) {
        throw new Error(creatorResult.error.message);
      }

      const existingUser = userResult.data ? toUser(userResult.data) : null;
      if (existingUser?.status === "suspended") {
        return apiFail(403, existingUser.suspendedReason || "账号已被限制，暂不能提交展示页");
      }

      const data = emptyData({
        users: existingUser ? [existingUser] : [],
        creators: creatorResult.data ? [toCreator(creatorResult.data)] : []
      });
      const creator = upsertCreator(data, { ...body, userId: actor.id, id: `c-${actor.id}` });
      const user = data.users.find((item) => item.id === actor.id);
      const activity = data.activityEvents[0];

      const { error: userWriteError } = await supabase.from("app_users").upsert({
        id: user?.id ?? actor.id,
        name: user?.name ?? creator.displayName ?? creator.name,
        account: user?.account,
        phone: user?.phone,
        email: user?.email ?? actor.email,
        role: user?.role ?? actor.role,
        status: user?.status ?? "active",
        suspended_reason: user?.suspendedReason,
        created_at: user?.createdAt ?? new Date().toISOString().slice(0, 10)
      });
      if (userWriteError) {
        throw new Error(userWriteError.message);
      }

      const { error: creatorWriteError } = await supabase.from("creator_profiles").upsert({
        id: creator.id,
        user_id: creator.userId,
        name: creator.name,
        title: creator.title,
        location: creator.location,
        bio: creator.bio,
        resume: creator.resume,
        skills: creator.skills,
        categories: creator.categories,
        portfolio: creator.portfolio,
        portfolio_items: creator.portfolioItems ?? [],
        service_packages: creator.servicePackages ?? [],
        price_min: creator.priceMin,
        price_max: creator.priceMax,
        completed_projects: creator.completedProjects,
        rating: creator.rating,
        response_time: creator.responseTime,
        verified: creator.verified,
        rejected_reason: creator.rejectedReason,
        review_draft: creator.reviewDraft,
        review_draft_submitted_at: creator.reviewDraftSubmittedAt,
        review_draft_rejected_reason: creator.reviewDraftRejectedReason,
        identity_type: creator.identityType,
        verification_type: creator.verificationType,
        credential_file: creator.credentialFile,
        qualification_files: creator.qualificationFiles ?? [],
        avatar_url: creator.avatarUrl,
        display_name: creator.displayName,
        profile_slogan: creator.profileSlogan,
        website_url: creator.websiteUrl,
        social_url: creator.socialUrl,
        service_area: creator.serviceArea,
        contact_email: creator.contactEmail,
        contact_phone: creator.contactPhone,
        training_profile: creator.trainingProfile,
        cover: creator.cover
      });
      if (creatorWriteError) {
        throw new Error(creatorWriteError.message);
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

      logRouteInfo("api/creators", "saved", {
        actorId: actor.id,
        creatorId: creator.id,
        creatorUserId: creator.userId,
        optimized: true
      });
      return apiOk(creator);
    }

    const data = await getMarketplaceData();
    const user = actor ? data.users.find((item) => item.id === actor.id) : null;
    if (user?.status === "suspended") {
      return apiFail(403, user.suspendedReason || "账号已被限制，暂不能提交展示页");
    }
    const creator = upsertCreator(data, actor ? { ...body, userId: actor.id, id: `c-${actor.id}` } : body);
    await saveMarketplaceData(data);
    logRouteInfo("api/creators", "saved", {
      actorId: actor?.id ?? null,
      creatorId: creator.id,
      creatorUserId: creator.userId
    });
    return apiOk(creator);
  } catch (error) {
    logRouteFailure("api/creators", {
      actorId: actor?.id ?? null,
      requestedCreatorId: body.id ?? null,
      requestedUserId: body.userId ?? actor?.id ?? null
    }, error);
    return apiFail(500, "展示页保存失败，请稍后重试。");
  }
}
