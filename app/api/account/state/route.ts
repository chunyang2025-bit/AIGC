import { getMarketplaceData } from "../../../../lib/server/data";
import { hasActiveReviewSubmission } from "../../../../lib/review-status";
import { getRequestUser, getServerSupabase } from "../../../../lib/server/auth";
import { logRouteInfo } from "../../../../lib/server/route-log";
import { apiFail, apiOk } from "../../../../lib/server/response";
import { ActivityEvent, BuyerProfile, CreatorProfile, DeliverableType, MarketplaceData, Order, PortfolioItem, Project, ProjectMatch, ServicePackage, TrialFeedback } from "../../../../lib/types";

export const dynamic = "force-dynamic";

function toDate(value: unknown) {
  return typeof value === "string" ? value.slice(0, 10) : new Date().toISOString().slice(0, 10);
}

function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
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
    portfolioItems: toArray<PortfolioItem>(row.portfolio_items),
    servicePackages: toArray<ServicePackage>(row.service_packages),
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
  const status = String(row.status || "open") as Project["status"];
  return {
    id: String(row.id),
    buyerId: String(row.buyer_id),
    title: String(row.title || ""),
    description: String(row.description || ""),
    category: String(row.category || "AI Short Video") as Project["category"],
    tags: toArray<string>(row.tags),
    useCase: row.use_case ? String(row.use_case) as Project["useCase"] : undefined,
    deliverableTypes: toArray<DeliverableType>(row.deliverable_types),
    urgency: row.urgency ? String(row.urgency) as Project["urgency"] : undefined,
    needInvoice: row.need_invoice === null || row.need_invoice === undefined ? undefined : Boolean(row.need_invoice),
    longTerm: row.long_term === null || row.long_term === undefined ? undefined : Boolean(row.long_term),
    acceptPlatformRecommend: row.accept_platform_recommend === null || row.accept_platform_recommend === undefined ? undefined : Boolean(row.accept_platform_recommend),
    trainingRequirement: row.training_requirement as Project["trainingRequirement"],
    budget: Number(row.budget || 0),
    deadline: toDate(row.deadline),
    status: status === "pending_review" ? "open" : status,
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
  if (!actor) {
    return apiFail(401, "请先登录后再查看个人中心");
  }

  const supabase = getServerSupabase();
  if (supabase) {
    const [buyerProfileResult, creatorProfileResult, projectsResult, feedbackResult, activityResult] = await Promise.all([
      supabase.from("buyer_profiles").select("*").eq("user_id", actor.id).maybeSingle(),
      supabase.from("creator_profiles").select("*").eq("user_id", actor.id).maybeSingle(),
      supabase.from("projects").select("*").eq("buyer_id", actor.id).order("created_at", { ascending: false }),
      supabase.from("trial_feedback").select("*").eq("user_id", actor.id).order("created_at", { ascending: false }).limit(100),
      supabase.from("activity_events").select("*").eq("user_id", actor.id).order("created_at", { ascending: false }).limit(100)
    ]);

    const firstProfileError = [
      buyerProfileResult.error,
      creatorProfileResult.error,
      projectsResult.error,
      feedbackResult.error,
      activityResult.error
    ].find(Boolean);

    if (!firstProfileError) {
      const buyerProfile = buyerProfileResult.data ? mapBuyer(buyerProfileResult.data) : null;
      const creatorProfile = creatorProfileResult.data ? mapCreator(creatorProfileResult.data) : null;
      const projects = (projectsResult.data ?? []).map((row) => mapProject(row));
      const creatorId = creatorProfile?.id;

      const [buyerOrdersResult, creatorOrdersResult, matchesResult] = await Promise.all([
        supabase.from("orders").select("*").eq("buyer_id", actor.id).order("created_at", { ascending: false }),
        creatorId
          ? supabase.from("orders").select("*").eq("creator_id", creatorId).order("created_at", { ascending: false })
          : Promise.resolve({ data: [], error: null }),
        creatorId
          ? supabase.from("project_matches").select("*").eq("creator_id", creatorId)
          : Promise.resolve({ data: [], error: null })
      ]);

      const secondError = [buyerOrdersResult.error, creatorOrdersResult.error, matchesResult.error].find(Boolean);
      if (!secondError) {
        const buyerOrders = (buyerOrdersResult.data ?? []).map((row) => mapOrder(row));
        const creatorOrders = (creatorOrdersResult.data ?? []).map((row) => mapOrder(row));
        const matches = (matchesResult.data ?? []).map((row) => mapMatch(row));
        const relatedProjectIds = new Set<string>([
          ...buyerOrders.map((order) => order.projectId),
          ...creatorOrders.map((order) => order.projectId),
          ...matches.map((match) => match.projectId)
        ]);
        projects.forEach((project) => relatedProjectIds.add(project.id));

        const relatedProjectsResult = relatedProjectIds.size
          ? await supabase.from("projects").select("*").in("id", Array.from(relatedProjectIds))
          : { data: [], error: null };

        if (!relatedProjectsResult.error) {
          const relatedProjects = (relatedProjectsResult.data ?? []).map((row) => mapProject(row));
          const projectById = new Map(relatedProjects.map((project) => [project.id, project]));
          const creatorProjects = matches
            .map((match) => projectById.get(match.projectId))
            .filter(Boolean) as Project[];
          const notificationsData: MarketplaceData = {
            users: [{
              id: actor.id,
              name: actor.name,
              email: actor.email,
              phone: actor.phone,
              role: actor.role,
              createdAt: new Date().toISOString().slice(0, 10)
            }],
            buyerProfiles: buyerProfile ? [buyerProfile] : [],
            creators: creatorProfile ? [creatorProfile] : [],
            projects: relatedProjects,
            matches,
            orders: [...buyerOrders, ...creatorOrders],
            messages: [],
            reviews: [],
            reports: [],
            feedback: (feedbackResult.data ?? []).map((row) => mapFeedback(row)),
            activityEvents: (activityResult.data ?? []).map((row) => mapActivity(row))
          };

          logRouteInfo("api/account/state", "ready", {
            actorId: actor.id,
            buyerProfile: Boolean(buyerProfile),
            creatorProfile: Boolean(creatorProfile),
            projects: projects.length,
            buyerOrders: buyerOrders.length,
            creatorOrders: creatorOrders.length,
            optimized: true
          });

          return apiOk({
            session: actor,
            buyerProfile,
            creatorProfile,
            projects,
            buyerOrders,
            creatorOrders,
            creatorProjects,
            relatedProjects,
            matches,
            notificationsData,
            buyerSubmitted: notificationsData.activityEvents.some((event) => event.eventType === "submit_review" && event.targetType === "buyer_profile"),
            creatorSubmitted: notificationsData.activityEvents.some((event) => event.eventType === "submit_review" && event.targetType === "creator")
          });
        }
      }
    }
  }

  const data = await getMarketplaceData();
  const buyerProfile = data.buyerProfiles?.find((profile) => profile.userId === actor.id) ?? null;
  const creatorProfile = data.creators.find((profile) => profile.userId === actor.id) ?? null;
  const projects = data.projects.filter((project) => project.buyerId === actor.id);
  const buyerOrders = data.orders.filter((order) => order.buyerId === actor.id);
  const creatorOrders = creatorProfile ? data.orders.filter((order) => order.creatorId === creatorProfile.id) : [];
  const creatorProjects = creatorProfile
    ? data.projects.filter((project) => data.matches.some((match) => match.projectId === project.id && match.creatorId === creatorProfile.id))
    : [];
  const relevantProjectIds = new Set(projects.map((project) => project.id));
  const creatorLeadProjectIds = new Set(creatorOrders.map((order) => order.projectId));
  const relatedProjectIds = new Set<string>();
  relevantProjectIds.forEach((projectId) => relatedProjectIds.add(projectId));
  creatorLeadProjectIds.forEach((projectId) => relatedProjectIds.add(projectId));
  const relatedProjects = data.projects.filter((project) => relatedProjectIds.has(project.id));
  const relatedMatches = creatorProfile ? data.matches.filter((match) => match.creatorId === creatorProfile.id) : [];
  const relevantNotificationsData = {
    ...data,
    users: data.users.filter((user) => user.id === actor.id),
    buyerProfiles: buyerProfile ? [buyerProfile] : [],
    creators: creatorProfile ? [creatorProfile] : [],
    projects: relatedProjects,
    matches: relatedMatches,
    orders: [...buyerOrders, ...creatorOrders],
    messages: [],
    reviews: [],
    reports: [],
    feedback: data.feedback.filter((item) => item.userId === actor.id),
    activityEvents: data.activityEvents.filter((event) => event.userId === actor.id)
  };

  logRouteInfo("api/account/state", "ready", {
    actorId: actor.id,
    buyerProfile: Boolean(buyerProfile),
    creatorProfile: Boolean(creatorProfile),
    projects: projects.length,
    buyerOrders: buyerOrders.length,
    creatorOrders: creatorOrders.length
  });

  return apiOk({
    session: actor,
    buyerProfile,
    creatorProfile,
    projects,
    buyerOrders,
    creatorOrders,
    creatorProjects,
    relatedProjects,
    matches: relatedMatches,
    notificationsData: relevantNotificationsData,
    buyerSubmitted: hasActiveReviewSubmission(data, actor.id, "buyer_profile"),
    creatorSubmitted: hasActiveReviewSubmission(data, actor.id, "creator")
  });
}
