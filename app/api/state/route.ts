import { getMarketplaceData } from "../../../lib/server/data";
import { scopeMarketplaceData } from "../../../lib/server/actions";
import { getRequestUser, getServerSupabase } from "../../../lib/server/auth";
import { logRouteInfo } from "../../../lib/server/route-log";
import { apiOk } from "../../../lib/server/response";
import { ActivityEvent, BuyerProfile, CreatorProfile, MarketplaceData, Message, Order, Project, ProjectMatch, Review, TrialFeedback, User } from "../../../lib/types";

export const dynamic = "force-dynamic";

function toDate(value: unknown) {
  return typeof value === "string" ? value.slice(0, 10) : new Date().toISOString().slice(0, 10);
}

function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function mapUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    name: String(row.name || ""),
    account: row.account ? String(row.account) : undefined,
    phone: row.phone ? String(row.phone) : undefined,
    email: String(row.email || ""),
    role: String(row.role || "buyer") as User["role"],
    status: row.status ? String(row.status) as User["status"] : undefined,
    suspendedReason: row.suspended_reason ? String(row.suspended_reason) : undefined,
    createdAt: toDate(row.created_at)
  };
}

function mapBuyer(row: Record<string, unknown>): BuyerProfile {
  return {
    id: String(row.id),
    userId: String(row.user_id),
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
    qualificationFiles: toArray<string>(row.qualification_files),
    verified: Boolean(row.verified),
    rejectedReason: row.rejected_reason ? String(row.rejected_reason) : undefined,
    reviewDraft: row.review_draft && typeof row.review_draft === "object" ? row.review_draft as Record<string, unknown> : undefined,
    reviewDraftSubmittedAt: row.review_draft_submitted_at ? String(row.review_draft_submitted_at) : undefined,
    reviewDraftRejectedReason: row.review_draft_rejected_reason ? String(row.review_draft_rejected_reason) : undefined,
    cover: String(row.cover || "linear-gradient(135deg, #153f31, #2457c5)")
  };
}

function mapCreator(row: Record<string, unknown>): CreatorProfile {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    name: String(row.name || ""),
    title: String(row.title || ""),
    location: String(row.location || ""),
    bio: String(row.bio || ""),
    resume: String(row.resume || ""),
    skills: toArray<string>(row.skills),
    categories: toArray<CreatorProfile["categories"][number]>(row.categories),
    portfolio: toArray<string>(row.portfolio),
    portfolioItems: toArray<NonNullable<CreatorProfile["portfolioItems"]>[number]>(row.portfolio_items),
    servicePackages: toArray<NonNullable<CreatorProfile["servicePackages"]>[number]>(row.service_packages),
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
    qualificationFiles: toArray<string>(row.qualification_files),
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

function mapProject(row: Record<string, unknown>): Project {
  return {
    id: String(row.id),
    buyerId: String(row.buyer_id),
    title: String(row.title || ""),
    description: String(row.description || ""),
    category: String(row.category || "AI Short Video") as Project["category"],
    tags: toArray<string>(row.tags),
    useCase: row.use_case ? String(row.use_case) as Project["useCase"] : undefined,
    deliverableTypes: toArray<NonNullable<Project["deliverableTypes"]>[number]>(row.deliverable_types),
    urgency: row.urgency ? String(row.urgency) as Project["urgency"] : undefined,
    needInvoice: row.need_invoice === null || row.need_invoice === undefined ? undefined : Boolean(row.need_invoice),
    longTerm: row.long_term === null || row.long_term === undefined ? undefined : Boolean(row.long_term),
    acceptPlatformRecommend:
      row.accept_platform_recommend === null || row.accept_platform_recommend === undefined
        ? undefined
        : Boolean(row.accept_platform_recommend),
    trainingRequirement: row.training_requirement as Project["trainingRequirement"],
    budget: Number(row.budget || 0),
    deadline: toDate(row.deadline),
    status: String(row.status || "open") as Project["status"],
    referenceFile: row.reference_file ? String(row.reference_file) : undefined,
    qualificationFile: row.qualification_file ? String(row.qualification_file) : undefined,
    contactEmail: row.contact_email ? String(row.contact_email) : undefined,
    contactPhone: row.contact_phone ? String(row.contact_phone) : undefined,
    agentBrief: row.agent_brief as Project["agentBrief"],
    rejectedReason: row.rejected_reason ? String(row.rejected_reason) : undefined,
    createdAt: toDate(row.created_at)
  };
}

function mapMatch(row: Record<string, unknown>): ProjectMatch {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    creatorId: String(row.creator_id),
    score: Number(row.score || 0),
    reason: String(row.reason || ""),
    risk: row.risk ? String(row.risk) : undefined,
    nextStep: row.next_step ? String(row.next_step) : undefined
  };
}

function mapOrder(row: Record<string, unknown>): Order {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    buyerId: String(row.buyer_id),
    creatorId: String(row.creator_id),
    amount: Number(row.amount || 0),
    status: String(row.status || "active") as Order["status"],
    resultReason: row.result_reason ? String(row.result_reason) : undefined,
    resultNote: row.result_note ? String(row.result_note) : undefined,
    resultUpdatedAt: row.result_updated_at ? String(row.result_updated_at) : undefined,
    deliverableUrl: row.deliverable_url ? String(row.deliverable_url) : undefined,
    createdAt: toDate(row.created_at)
  };
}

function mapMessage(row: Record<string, unknown>): Message {
  return {
    id: String(row.id),
    orderId: String(row.order_id),
    senderId: String(row.sender_id),
    body: String(row.body || ""),
    attachmentUrl: row.attachment_url ? String(row.attachment_url) : undefined,
    createdAt: String(row.created_at || new Date().toISOString())
  };
}

function mapReview(row: Record<string, unknown>): Review {
  return {
    id: String(row.id),
    orderId: String(row.order_id),
    buyerId: String(row.buyer_id),
    creatorId: String(row.creator_id),
    rating: Number(row.rating || 0),
    comment: String(row.comment || ""),
    createdAt: toDate(row.created_at)
  };
}

function mapFeedback(row: Record<string, unknown>): TrialFeedback {
  return {
    id: String(row.id),
    userId: row.user_id ? String(row.user_id) : undefined,
    role: row.role ? String(row.role) as TrialFeedback["role"] : undefined,
    page: String(row.page || ""),
    rating: row.rating === null || row.rating === undefined ? undefined : Number(row.rating),
    category: String(row.category || "other") as TrialFeedback["category"],
    content: String(row.content || ""),
    status: String(row.status || "open") as TrialFeedback["status"],
    resolution: row.resolution ? String(row.resolution) : undefined,
    createdAt: String(row.created_at || new Date().toISOString())
  };
}

function mapActivity(row: Record<string, unknown>): ActivityEvent {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    role: String(row.role || "buyer") as ActivityEvent["role"],
    eventType: String(row.event_type || "browse") as ActivityEvent["eventType"],
    targetType: row.target_type ? String(row.target_type) as ActivityEvent["targetType"] : undefined,
    targetId: row.target_id ? String(row.target_id) : undefined,
    note: row.note ? String(row.note) : undefined,
    createdAt: String(row.created_at || new Date().toISOString())
  };
}

export async function GET(request: Request) {
  const actor = await getRequestUser(request);
  const supabase = getServerSupabase();

  if (supabase && actor && actor.role !== "admin") {
    const [buyerProfileResult, creatorProfileResult, publicProjectsResult, ownProjectsResult, feedbackResult, activityResult, reportsResult] = await Promise.all([
      supabase.from("buyer_profiles").select("*").eq("user_id", actor.id).maybeSingle(),
      supabase.from("creator_profiles").select("*").eq("user_id", actor.id).maybeSingle(),
      supabase.from("projects").select("*").in("status", ["open", "matching"]).order("created_at", { ascending: false }),
      supabase.from("projects").select("*").eq("buyer_id", actor.id).order("created_at", { ascending: false }),
      supabase.from("trial_feedback").select("*").eq("user_id", actor.id).order("created_at", { ascending: false }).limit(100),
      supabase.from("activity_events").select("*").eq("user_id", actor.id).order("created_at", { ascending: false }).limit(100),
      supabase.from("abuse_reports").select("*").eq("reporter_id", actor.id).order("created_at", { ascending: false }).limit(100)
    ]);

    const firstError = [
      buyerProfileResult.error,
      creatorProfileResult.error,
      publicProjectsResult.error,
      ownProjectsResult.error,
      feedbackResult.error,
      activityResult.error,
      reportsResult.error
    ].find(Boolean);

    if (!firstError) {
      const buyerProfile = buyerProfileResult.data ? mapBuyer(buyerProfileResult.data) : null;
      const creatorProfile = creatorProfileResult.data ? mapCreator(creatorProfileResult.data) : null;
      const creatorId = creatorProfile?.id;
      const publicProjects = (publicProjectsResult.data ?? []).map((row) => mapProject(row));
      const ownProjects = (ownProjectsResult.data ?? []).map((row) => mapProject(row));
      const visibleProjectsById = new Map<string, Project>();
      [...publicProjects, ...ownProjects].forEach((project) => visibleProjectsById.set(project.id, project));
      const publicProjectIds = publicProjects.map((project) => project.id);
      const ownProjectIds = ownProjects.map((project) => project.id);

      const [buyerOrdersResult, creatorOrdersResult, matchesResult] = await Promise.all([
        supabase.from("orders").select("*").eq("buyer_id", actor.id).order("created_at", { ascending: false }),
        creatorId
          ? supabase.from("orders").select("*").eq("creator_id", creatorId).order("created_at", { ascending: false })
          : Promise.resolve({ data: [], error: null }),
        publicProjectIds.length || ownProjectIds.length || creatorId
          ? supabase
              .from("project_matches")
              .select("*")
              .or([
                creatorId ? `creator_id.eq.${creatorId}` : "",
                publicProjectIds.length ? `project_id.in.(${publicProjectIds.join(",")})` : "",
                ownProjectIds.length ? `project_id.in.(${ownProjectIds.join(",")})` : ""
              ].filter(Boolean).join(","))
          : Promise.resolve({ data: [], error: null })
      ]);

      const secondError = [buyerOrdersResult.error, creatorOrdersResult.error, matchesResult.error].find(Boolean);
      if (!secondError) {
        const buyerOrders = (buyerOrdersResult.data ?? []).map((row) => mapOrder(row));
        const creatorOrders = (creatorOrdersResult.data ?? []).map((row) => mapOrder(row));
        const allowedOrdersMap = new Map<string, Order>();
        [...buyerOrders, ...creatorOrders].forEach((order) => allowedOrdersMap.set(order.id, order));
        const allowedOrders = Array.from(allowedOrdersMap.values());
        const allowedOrderIds = allowedOrders.map((order) => order.id);
        const relatedProjectIds = new Set<string>([
          ...publicProjectIds,
          ...ownProjectIds,
          ...allowedOrders.map((order) => order.projectId)
        ]);
        const relatedCreatorIds = new Set<string>([
          ...allowedOrders.map((order) => order.creatorId),
          ...(creatorId ? [creatorId] : [])
        ]);
        const visibleBuyerUserIds = new Set<string>([
          actor.id,
          ...Array.from(visibleProjectsById.values()).map((project) => project.buyerId),
          ...allowedOrders.map((order) => order.buyerId)
        ]);

        const [relatedProjectsResult, verifiedCreatorsResult, visibleUsersResult, visibleBuyerProfilesResult, messagesResult, reviewsResult] = await Promise.all([
          relatedProjectIds.size
            ? supabase.from("projects").select("*").in("id", Array.from(relatedProjectIds))
            : Promise.resolve({ data: [], error: null }),
          supabase.from("creator_profiles").select("*").eq("verified", true),
          visibleBuyerUserIds.size
            ? supabase.from("app_users").select("*").in("id", Array.from(visibleBuyerUserIds))
            : Promise.resolve({ data: [], error: null }),
          visibleBuyerUserIds.size
            ? supabase.from("buyer_profiles").select("*").in("user_id", Array.from(visibleBuyerUserIds))
            : Promise.resolve({ data: [], error: null }),
          allowedOrderIds.length
            ? supabase.from("messages").select("*").in("order_id", allowedOrderIds)
            : Promise.resolve({ data: [], error: null }),
          allowedOrderIds.length
            ? supabase.from("reviews").select("*").in("order_id", allowedOrderIds)
            : Promise.resolve({ data: [], error: null })
        ]);

        const thirdError = [
          relatedProjectsResult.error,
          verifiedCreatorsResult.error,
          visibleUsersResult.error,
          visibleBuyerProfilesResult.error,
          messagesResult.error,
          reviewsResult.error
        ].find(Boolean);

        if (!thirdError) {
          const relatedProjects = (relatedProjectsResult.data ?? []).map((row) => mapProject(row));
          const verifiedCreators = (verifiedCreatorsResult.data ?? []).map((row) => mapCreator(row));
          const creatorsMap = new Map<string, CreatorProfile>();
          verifiedCreators.forEach((creator) => creatorsMap.set(creator.id, creator));
          if (creatorProfile) creatorsMap.set(creatorProfile.id, creatorProfile);
          const visibleMatches = (matchesResult.data ?? []).map((row) => mapMatch(row));
          visibleMatches.forEach((match) => relatedCreatorIds.add(match.creatorId));
          const creators = Array.from(creatorsMap.values()).filter((creator) => creator.verified || relatedCreatorIds.has(creator.id));
          const projects = Array.from(new Map(relatedProjects.map((project) => [project.id, project])).values());
          const scoped: MarketplaceData = {
            users: (visibleUsersResult.data ?? []).map((row) => mapUser(row)),
            buyerProfiles: (visibleBuyerProfilesResult.data ?? []).map((row) => mapBuyer(row)),
            creators,
            projects,
            matches: visibleMatches,
            orders: allowedOrders,
            messages: (messagesResult.data ?? []).map((row) => mapMessage(row)),
            reviews: (reviewsResult.data ?? []).map((row) => mapReview(row)),
            reports: [],
            feedback: (feedbackResult.data ?? []).map((row) => mapFeedback(row)),
            activityEvents: (activityResult.data ?? []).map((row) => mapActivity(row))
          };

          logRouteInfo("api/state", "scope", {
            actorId: actor.id,
            actorRole: actor.role,
            users: scoped.users.length,
            buyerProfiles: scoped.buyerProfiles?.length ?? 0,
            creators: scoped.creators.length,
            projects: scoped.projects.length,
            optimized: true
          });
          return apiOk(scoped);
        }
      }
    }
  }

  const data = await getMarketplaceData();
  const scoped = scopeMarketplaceData(data, actor);
  logRouteInfo("api/state", "scope", {
    actorId: actor?.id ?? null,
    actorRole: actor?.role ?? null,
    rawUsers: data.users.length,
    rawBuyerProfiles: data.buyerProfiles?.length ?? 0,
    rawCreators: data.creators.length,
    rawProjects: data.projects.length,
    users: scoped.users.length,
    buyerProfiles: scoped.buyerProfiles?.length ?? 0,
    creators: scoped.creators.length,
    projects: scoped.projects.length
  });
  return apiOk(scoped);
}
