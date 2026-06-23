import { upsertBuyer } from "../../../lib/server/actions";
import { getRequestUser, getServerSupabase, isSupabaseServerConfigured } from "../../../lib/server/auth";
import { getMarketplaceData, invalidateMarketplaceCache, saveMarketplaceData } from "../../../lib/server/data";
import { logRouteFailure, logRouteInfo } from "../../../lib/server/route-log";
import { apiFail, apiOk, readJson } from "../../../lib/server/response";
import { BuyerProfile, MarketplaceData, User } from "../../../lib/types";

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

function toBuyer(row: Record<string, unknown>): BuyerProfile {
  return {
    id: String(row.id || ""),
    userId: String(row.user_id || ""),
    companyName: String(row.company_name || ""),
    displayName: row.display_name ? String(row.display_name) : undefined,
    avatarUrl: row.avatar_url ? String(row.avatar_url) : undefined,
    profileSlogan: row.profile_slogan ? String(row.profile_slogan) : undefined,
    industry: String(row.industry || ""),
    location: String(row.location || ""),
    companyIntro: String(row.company_intro || ""),
    verificationType: row.verification_type ? String(row.verification_type) as BuyerProfile["verificationType"] : undefined,
    contactEmail: String(row.contact_email || ""),
    contactPhone: String(row.contact_phone || ""),
    websiteUrl: row.website_url ? String(row.website_url) : undefined,
    socialUrl: row.social_url ? String(row.social_url) : undefined,
    serviceArea: row.service_area ? String(row.service_area) : undefined,
    businessLicenseFile: String(row.business_license_file || ""),
    qualificationFiles: Array.isArray(row.qualification_files) ? row.qualification_files as string[] : [],
    verified: Boolean(row.verified),
    rejectedReason: row.rejected_reason ? String(row.rejected_reason) : undefined,
    reviewDraft: row.review_draft && typeof row.review_draft === "object" ? row.review_draft as Record<string, unknown> : undefined,
    reviewDraftSubmittedAt: row.review_draft_submitted_at ? String(row.review_draft_submitted_at) : undefined,
    reviewDraftRejectedReason: row.review_draft_rejected_reason ? String(row.review_draft_rejected_reason) : undefined,
    cover: String(row.cover || "linear-gradient(135deg, #153f31, #2457c5)")
  };
}

function emptyData(input: { users?: User[]; buyerProfiles?: BuyerProfile[] } = {}): MarketplaceData {
  return {
    users: input.users ?? [],
    buyerProfiles: input.buyerProfiles ?? [],
    creators: [],
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

export async function POST(request: Request) {
  const body = await readJson(request);
  const actor = await getRequestUser(request);
  if (isSupabaseServerConfigured() && !actor) {
    return apiFail(401, "请先登录后再完善主体资料");
  }

  try {
    const supabase = getServerSupabase();
    if (supabase && actor) {
      const [userResult, buyerResult] = await Promise.all([
        supabase.from("app_users").select("*").eq("id", actor.id).maybeSingle(),
        supabase.from("buyer_profiles").select("*").eq("user_id", actor.id).maybeSingle()
      ]);

      if (userResult.error) {
        throw new Error(userResult.error.message);
      }
      if (buyerResult.error) {
        throw new Error(buyerResult.error.message);
      }

      const data = emptyData({
        users: userResult.data ? [toUser(userResult.data)] : [],
        buyerProfiles: buyerResult.data ? [toBuyer(buyerResult.data)] : []
      });
      const buyer = upsertBuyer(data, { ...body, userId: actor.id, id: `bp-${actor.id}` });
      const user = data.users.find((item) => item.id === actor.id);
      const activity = data.activityEvents[0];

      const { error: userWriteError } = await supabase.from("app_users").upsert({
        id: user?.id ?? actor.id,
        name: user?.name ?? buyer.displayName ?? buyer.companyName,
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

      const { error: buyerWriteError } = await supabase.from("buyer_profiles").upsert({
        id: buyer.id,
        user_id: buyer.userId,
        company_name: buyer.companyName,
        display_name: buyer.displayName,
        avatar_url: buyer.avatarUrl,
        profile_slogan: buyer.profileSlogan,
        industry: buyer.industry,
        location: buyer.location,
        company_intro: buyer.companyIntro,
        verification_type: buyer.verificationType,
        contact_email: buyer.contactEmail,
        contact_phone: buyer.contactPhone,
        website_url: buyer.websiteUrl,
        social_url: buyer.socialUrl,
        service_area: buyer.serviceArea,
        business_license_file: buyer.businessLicenseFile,
        qualification_files: buyer.qualificationFiles ?? [],
        verified: buyer.verified,
        rejected_reason: buyer.rejectedReason,
        review_draft: buyer.reviewDraft,
        review_draft_submitted_at: buyer.reviewDraftSubmittedAt,
        review_draft_rejected_reason: buyer.reviewDraftRejectedReason,
        cover: buyer.cover
      });
      if (buyerWriteError) {
        throw new Error(buyerWriteError.message);
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

      logRouteInfo("api/buyers", "saved", {
        actorId: actor.id,
        buyerId: buyer.id,
        buyerUserId: buyer.userId,
        optimized: true
      });
      return apiOk(buyer);
    }

    const data = await getMarketplaceData();
    const buyer = upsertBuyer(data, actor ? { ...body, userId: actor.id, id: `bp-${actor.id}` } : body);
    await saveMarketplaceData(data);
    const persisted = await getMarketplaceData();
    logRouteInfo("api/buyers", "saved", {
      actorId: actor?.id ?? null,
      buyerId: buyer.id,
      buyerUserId: buyer.userId,
      persisted: Boolean((persisted.buyerProfiles ?? []).find((item) => item.userId === buyer.userId))
    });
    return apiOk(buyer);
  } catch (error) {
    logRouteFailure("api/buyers", {
      actorId: actor?.id ?? null,
      requestedBuyerId: body.id ?? null,
      requestedUserId: body.userId ?? actor?.id ?? null
    }, error);
    return apiFail(500, "主体资料保存失败，请稍后重试。");
  }
}
