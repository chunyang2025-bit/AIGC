import { getPublicMarketplace } from "../../../lib/server/actions";
import { getServerSupabase } from "../../../lib/server/auth";
import { cleanPublicCreators, cleanPublicProjects } from "../../../lib/public-marketplace";
import { apiOk } from "../../../lib/server/response";
import { CreatorProfile, Project } from "../../../lib/types";

export const dynamic = "force-dynamic";

function emptyMarketplacePayload() {
  return apiOk({
    projects: [],
    creators: [],
    metrics: {
      users: 0,
      buyers: 0,
      creators: 0,
      verifiedCreators: 0,
      projects: 0,
      openProjects: 0,
      leads: 0,
      activeLeads: 0,
      intentionBudget: 0,
      completedIntentionBudget: 0,
      monthlyActiveUsers: 0,
      monthlyActiveBuyers: 0,
      monthlyActiveCreators: 0,
      pendingBuyerReviews: 0,
      pendingCreatorReviews: 0
    }
  });
}

function toDate(value: unknown) {
  return typeof value === "string" ? value.slice(0, 10) : new Date().toISOString().slice(0, 10);
}

function toProject(row: Record<string, unknown>): Project {
  return {
    id: String(row.id),
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

function toCreator(row: Record<string, unknown>): CreatorProfile {
  return {
    id: String(row.id),
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

export async function GET(request: Request) {
  const includeTestData = new URL(request.url).searchParams.get("includeTestData") === "1";
  const supabase = getServerSupabase();
  if (supabase) {
    const activityWindowStart = new Date();
    activityWindowStart.setDate(activityWindowStart.getDate() - 30);
    const [
      projects,
      creators,
      recentActivity,
      ordersForMetrics,
      pendingBuyerReviewsCount,
      pendingCreatorReviewsCount
    ] = await Promise.all([
      supabase
        .from("projects")
        .select("*")
        .in("status", ["open", "matching"])
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("creator_profiles")
        .select("*")
        .eq("verified", true)
        .order("rating", { ascending: false })
        .limit(100),
      supabase
        .from("activity_events")
        .select("user_id, role, created_at")
        .gte("created_at", activityWindowStart.toISOString())
        .limit(1000),
      supabase
        .from("orders")
        .select("amount, status, project_id, creator_id")
        .limit(1000),
      supabase.from("buyer_profiles").select("id", { count: "exact", head: true }).eq("verified", false),
      supabase.from("creator_profiles").select("id", { count: "exact", head: true }).eq("verified", false)
    ]);

    const firstError = [
      projects.error,
      creators.error,
      recentActivity.error,
      ordersForMetrics.error,
      pendingBuyerReviewsCount.error,
      pendingCreatorReviewsCount.error
    ].find(Boolean);

    if (!firstError) {
      const publicProjects = cleanPublicProjects((projects.data ?? []).map((row) => toProject(row)), includeTestData);
      const publicCreators = cleanPublicCreators((creators.data ?? []).map((row) => toCreator(row)), includeTestData);
      const publicBuyerIds = new Set(publicProjects.map((project) => project.buyerId));
      const publicCreatorUserIds = new Set(publicCreators.map((creator) => creator.userId));
      const publicProjectIds = new Set(publicProjects.map((project) => project.id));
      const publicCreatorIds = new Set(publicCreators.map((creator) => creator.id));
      const activeUserIds = new Set((recentActivity.data ?? []).map((event) => String(event.user_id)));
      const activeBuyerIds = new Set(
        (recentActivity.data ?? [])
          .filter((event) => event.role === "buyer")
          .map((event) => String(event.user_id))
      );
      const activeCreatorIds = new Set(
        (recentActivity.data ?? [])
          .filter((event) => event.role === "creator")
          .map((event) => String(event.user_id))
      );
      const visibleUserIds = new Set([...Array.from(publicBuyerIds), ...Array.from(publicCreatorUserIds)]);
      const orders = (ordersForMetrics.data ?? []).filter((order) => (
        publicProjectIds.has(String(order.project_id)) && publicCreatorIds.has(String(order.creator_id))
      ));
      const activeOrders = orders.filter((order) => ["active", "delivered", "revision"].includes(String(order.status)));

      return apiOk({
        projects: publicProjects,
        creators: publicCreators,
        metrics: {
          users: visibleUserIds.size,
          buyers: publicBuyerIds.size,
          creators: publicCreators.length,
          verifiedCreators: publicCreators.length,
          projects: publicProjects.length,
          openProjects: publicProjects.filter((project) => project.status === "open" || project.status === "matching").length,
          leads: orders.length,
          activeLeads: activeOrders.length,
          intentionBudget: orders.reduce((sum, order) => sum + Number(order.amount || 0), 0),
          completedIntentionBudget: orders
            .filter((order) => order.status === "approved")
            .reduce((sum, order) => sum + Number(order.amount || 0), 0),
          monthlyActiveUsers: Array.from(activeUserIds).filter((userId) => visibleUserIds.has(userId)).length,
          monthlyActiveBuyers: Array.from(activeBuyerIds).filter((userId) => publicBuyerIds.has(userId)).length,
          monthlyActiveCreators: Array.from(activeCreatorIds).filter((userId) => publicCreatorUserIds.has(userId)).length,
          pendingBuyerReviews: includeTestData ? pendingBuyerReviewsCount.count ?? 0 : 0,
          pendingCreatorReviews: includeTestData ? pendingCreatorReviewsCount.count ?? 0 : 0
        }
      });
    }
  }

  if (includeTestData) {
    return apiOk(getPublicMarketplace({
      users: [],
      buyerProfiles: [],
      creators: [],
      projects: [],
      matches: [],
      orders: [],
      messages: [],
      reviews: [],
      reports: [],
      feedback: [],
      activityEvents: []
    }, true));
  }

  return emptyMarketplacePayload();
}
