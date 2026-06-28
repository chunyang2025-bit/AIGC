import { demoData } from "../demo-data";
import {
  ActivityEvent,
  AbuseReport,
  BuyerProfile,
  CreatorProfile,
  DeliverableType,
  MarketplaceData,
  Message,
  Order,
  PortfolioItem,
  Project,
  ProjectMatch,
  Review,
  ServicePackage,
  TrialFeedback,
  User
} from "../types";
import { createClient } from "@supabase/supabase-js";

const globalStore = globalThis as typeof globalThis & {
  __aigcMarketplaceData?: MarketplaceData;
  __aigcMarketplaceDataCache?: {
    data: MarketplaceData;
    expiresAt: number;
  };
};

const MARKETPLACE_CACHE_TTL_MS = 5_000;

function cloneData(data: MarketplaceData): MarketplaceData {
  return JSON.parse(JSON.stringify(data)) as MarketplaceData;
}

function dedupeProfilesByUserId<T extends { id: string; userId: string }>(items: T[], canonicalPrefix: string): T[] {
  const byUserId = new Map<string, T>();

  for (const item of items) {
    const current = byUserId.get(item.userId);
    const isCanonical = item.id === `${canonicalPrefix}-${item.userId}`;
    const currentIsCanonical = current?.id === `${canonicalPrefix}-${item.userId}`;

    if (!current || isCanonical || !currentIsCanonical) {
      byUserId.set(item.userId, item);
    }
  }

  return Array.from(byUserId.values());
}

function normalizeData(data: MarketplaceData): MarketplaceData {
  return {
    users: data.users ?? [],
    buyerProfiles: dedupeProfilesByUserId(data.buyerProfiles ?? [], "bp"),
    creators: dedupeProfilesByUserId(data.creators ?? [], "c"),
    projects: (data.projects ?? []).map((project) => ({
      ...project,
      status: project.status === "pending_review" ? "open" : project.status
    })),
    matches: data.matches ?? [],
    orders: data.orders ?? [],
    messages: data.messages ?? [],
    reviews: data.reviews ?? [],
    reports: data.reports ?? [],
    feedback: data.feedback ?? [],
    activityEvents: data.activityEvents ?? []
  };
}

function readMarketplaceCache() {
  const cached = globalStore.__aigcMarketplaceDataCache;
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    globalStore.__aigcMarketplaceDataCache = undefined;
    return null;
  }
  return normalizeData(cloneData(cached.data));
}

function writeMarketplaceCache(data: MarketplaceData) {
  globalStore.__aigcMarketplaceDataCache = {
    data: normalizeData(cloneData(data)),
    expiresAt: Date.now() + MARKETPLACE_CACHE_TTL_MS
  };
}

function clearMarketplaceCache() {
  globalStore.__aigcMarketplaceDataCache = undefined;
}

export function invalidateMarketplaceCache() {
  clearMarketplaceCache();
}

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    global: {
      fetch: (input, init) => fetch(input, {
        ...init,
        cache: "no-store"
      })
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

function requirePersistentStore() {
  return Boolean(getServerSupabase()) || process.env.NODE_ENV === "production";
}

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
    portfolioItems: toArray<PortfolioItem>(row.portfolio_items),
    servicePackages: toArray<ServicePackage>(row.service_packages),
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
    qualificationFiles: toArray<string>(row.qualification_files),
    reviewDraft: row.review_draft && typeof row.review_draft === "object" ? row.review_draft as Record<string, unknown> : undefined,
    reviewDraftSubmittedAt: row.review_draft_submitted_at ? String(row.review_draft_submitted_at) : undefined,
    reviewDraftRejectedReason: row.review_draft_rejected_reason ? String(row.review_draft_rejected_reason) : undefined,
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
    deliverableTypes: toArray<DeliverableType>(row.deliverable_types),
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

function mapReport(row: Record<string, unknown>): AbuseReport {
  return {
    id: String(row.id),
    reporterId: String(row.reporter_id),
    targetType: String(row.target_type || "project") as AbuseReport["targetType"],
    targetId: String(row.target_id || ""),
    reason: String(row.reason || ""),
    status: String(row.status || "open") as AbuseReport["status"],
    resolution: row.resolution ? String(row.resolution) : undefined,
    createdAt: String(row.created_at || new Date().toISOString())
  };
}

function mapFeedback(row: Record<string, unknown>): TrialFeedback {
  return {
    id: String(row.id),
    userId: row.user_id ? String(row.user_id) : undefined,
    role: row.role ? String(row.role) as TrialFeedback["role"] : undefined,
    page: String(row.page || ""),
    rating: row.rating === null || row.rating === undefined ? undefined : Number(row.rating),
    category: String(row.category || "suggestion") as TrialFeedback["category"],
    content: String(row.content || ""),
    status: String(row.status || "open") as TrialFeedback["status"],
    resolution: row.resolution ? String(row.resolution) : undefined,
    createdAt: String(row.created_at || new Date().toISOString())
  };
}

async function readSupabaseState() {
  const supabase = getServerSupabase();
  if (!supabase) return null;

  const cached = readMarketplaceCache();
  if (cached) {
    return cached;
  }

  const [
    users,
    buyerProfiles,
    creators,
    projects,
    matches,
    orders,
    messages,
    reviews,
    reports,
    feedback,
    activityEvents
  ] = await Promise.all([
    supabase.from("app_users").select("*").order("created_at", { ascending: false }),
    supabase.from("buyer_profiles").select("*"),
    supabase.from("creator_profiles").select("*"),
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase.from("project_matches").select("*"),
    supabase.from("orders").select("*").order("created_at", { ascending: false }),
    supabase.from("messages").select("*").order("created_at", { ascending: false }),
    supabase.from("reviews").select("*"),
    supabase.from("abuse_reports").select("*").order("created_at", { ascending: false }),
    supabase.from("trial_feedback").select("*").order("created_at", { ascending: false }),
    supabase.from("activity_events").select("*").order("created_at", { ascending: false })
  ]);

  const firstError = [
    users.error,
    buyerProfiles.error,
    creators.error,
    projects.error,
    matches.error,
    orders.error,
    messages.error,
    reviews.error,
    reports.error,
    feedback.error,
    activityEvents.error
  ].find(Boolean);

  if (firstError) {
    throw new Error(`Supabase read failed: ${firstError.message}`);
  }

  const normalized = normalizeData({
    users: (users.data ?? []).map((row) => mapUser(row)),
    buyerProfiles: (buyerProfiles.data ?? []).map((row) => mapBuyer(row)),
    creators: (creators.data ?? []).map((row) => mapCreator(row)),
    projects: (projects.data ?? []).map((row) => mapProject(row)),
    matches: (matches.data ?? []).map((row) => mapMatch(row)),
    orders: (orders.data ?? []).map((row) => mapOrder(row)),
    messages: (messages.data ?? []).map((row) => mapMessage(row)),
    reviews: (reviews.data ?? []).map((row) => mapReview(row)),
    reports: (reports.data ?? []).map((row) => mapReport(row)),
    feedback: (feedback.data ?? []).map((row) => mapFeedback(row)),
    activityEvents: (activityEvents.data ?? []).map((row) => mapActivity(row))
  });
  writeMarketplaceCache(normalized);
  return normalized;
}

async function writeSupabaseState(data: MarketplaceData) {
  const supabase = getServerSupabase();
  if (!supabase) return null;

  const normalized = normalizeData(cloneData(data));
  const mapBuyerProfile = (profile: BuyerProfile, includeDraftFields: boolean) => ({
    id: profile.id,
    user_id: profile.userId,
    company_name: profile.companyName,
    display_name: profile.displayName,
    avatar_url: profile.avatarUrl,
    profile_slogan: profile.profileSlogan,
    industry: profile.industry,
    location: profile.location,
    company_intro: profile.companyIntro,
    verification_type: profile.verificationType,
    contact_email: profile.contactEmail,
    contact_phone: profile.contactPhone,
    website_url: profile.websiteUrl,
    social_url: profile.socialUrl,
    service_area: profile.serviceArea,
    business_license_file: profile.businessLicenseFile,
    qualification_files: profile.qualificationFiles ?? [],
    verified: profile.verified,
    rejected_reason: profile.rejectedReason,
    ...(includeDraftFields
      ? {
          review_draft: profile.reviewDraft,
          review_draft_submitted_at: profile.reviewDraftSubmittedAt,
          review_draft_rejected_reason: profile.reviewDraftRejectedReason
        }
      : {}),
    cover: profile.cover
  });
  const mapCreatorProfile = (creator: CreatorProfile, includeDraftFields: boolean) => ({
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
    identity_type: creator.identityType,
    verification_type: creator.verificationType,
    credential_file: creator.credentialFile,
    qualification_files: creator.qualificationFiles ?? [],
    ...(includeDraftFields
      ? {
          review_draft: creator.reviewDraft,
          review_draft_submitted_at: creator.reviewDraftSubmittedAt,
          review_draft_rejected_reason: creator.reviewDraftRejectedReason
        }
      : {}),
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
  const isMissingDraftColumnError = (message: string) =>
    message.includes("review_draft") && message.includes("column");
  const writeSteps = [
    {
      label: "app_users",
      run: () => supabase.from("app_users").upsert(normalized.users.map((user) => ({
        id: user.id,
        name: user.name,
        account: user.account,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status ?? "active",
        suspended_reason: user.suspendedReason,
        created_at: user.createdAt
      })))
    },
    {
      label: "buyer_profiles",
      run: () => supabase.from("buyer_profiles").upsert((normalized.buyerProfiles ?? []).map((profile) => (
        mapBuyerProfile(profile, true)
      ))),
      fallback: () => supabase.from("buyer_profiles").upsert((normalized.buyerProfiles ?? []).map((profile) => (
        mapBuyerProfile(profile, false)
      )))
    },
    {
      label: "creator_profiles",
      run: () => supabase.from("creator_profiles").upsert(normalized.creators.map((creator) => (
        mapCreatorProfile(creator, true)
      ))),
      fallback: () => supabase.from("creator_profiles").upsert(normalized.creators.map((creator) => (
        mapCreatorProfile(creator, false)
      )))
    },
    {
      label: "projects",
      run: () => supabase.from("projects").upsert(normalized.projects.map((project) => ({
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
      })))
    },
    {
      label: "project_matches",
      run: () => supabase.from("project_matches").upsert(normalized.matches.map((match) => ({
        id: match.id,
        project_id: match.projectId,
        creator_id: match.creatorId,
        score: match.score,
        reason: match.reason,
        risk: match.risk,
        next_step: match.nextStep
      })))
    },
    {
      label: "orders",
      run: () => supabase.from("orders").upsert(normalized.orders.map((order) => ({
        id: order.id,
        project_id: order.projectId,
        buyer_id: order.buyerId,
        creator_id: order.creatorId,
        amount: order.amount,
        status: order.status,
        result_reason: order.resultReason,
        result_note: order.resultNote,
        result_updated_at: order.resultUpdatedAt,
        deliverable_url: order.deliverableUrl,
        created_at: order.createdAt
      })))
    },
    {
      label: "messages",
      run: () => supabase.from("messages").upsert(normalized.messages.map((message) => ({
        id: message.id,
        order_id: message.orderId,
        sender_id: message.senderId,
        body: message.body,
        attachment_url: message.attachmentUrl,
        created_at: message.createdAt
      })))
    },
    {
      label: "reviews",
      run: () => supabase.from("reviews").upsert(normalized.reviews.map((review) => ({
        id: review.id,
        order_id: review.orderId,
        buyer_id: review.buyerId,
        creator_id: review.creatorId,
        rating: review.rating,
        comment: review.comment,
        created_at: review.createdAt
      })))
    },
    {
      label: "abuse_reports",
      run: () => supabase.from("abuse_reports").upsert(normalized.reports.map((report) => ({
        id: report.id,
        reporter_id: report.reporterId,
        target_type: report.targetType,
        target_id: report.targetId,
        reason: report.reason,
        status: report.status,
        resolution: report.resolution,
        created_at: report.createdAt
      })))
    },
    {
      label: "trial_feedback",
      run: () => supabase.from("trial_feedback").upsert(normalized.feedback.map((feedback) => ({
        id: feedback.id,
        user_id: feedback.userId,
        role: feedback.role,
        page: feedback.page,
        rating: feedback.rating,
        category: feedback.category,
        content: feedback.content,
        status: feedback.status,
        resolution: feedback.resolution,
        created_at: feedback.createdAt
      })))
    },
    {
      label: "activity_events",
      run: () => supabase.from("activity_events").upsert(normalized.activityEvents.map((event) => ({
        id: event.id,
        user_id: event.userId,
        role: event.role,
        event_type: event.eventType,
        target_type: event.targetType,
        target_id: event.targetId,
        note: event.note,
        created_at: event.createdAt
      })))
    }
  ];

  for (const step of writeSteps) {
    const result = await step.run();
    if (result.error) {
      if (step.fallback && isMissingDraftColumnError(result.error.message)) {
        console.warn(`[supabase] ${step.label} is missing review draft columns; retrying without draft fields`);
        const fallback = await step.fallback();
        if (!fallback.error) {
          continue;
        }
      }
      throw new Error(`Supabase write failed at ${step.label}: ${result.error.message}`);
    }
  }

  writeMarketplaceCache(normalized);
  return normalized;
}

async function clearSupabaseState() {
  const supabase = getServerSupabase();
  if (!supabase) return null;

  const deleteSteps = [
    () => supabase.from("project_matches").delete().neq("id", ""),
    () => supabase.from("messages").delete().neq("id", ""),
    () => supabase.from("reviews").delete().neq("id", ""),
    () => supabase.from("orders").delete().neq("id", ""),
    () => supabase.from("abuse_reports").delete().neq("id", ""),
    () => supabase.from("trial_feedback").delete().neq("id", ""),
    () => supabase.from("activity_events").delete().neq("id", ""),
    () => supabase.from("projects").delete().neq("id", ""),
    () => supabase.from("creator_profiles").delete().neq("id", ""),
    () => supabase.from("buyer_profiles").delete().neq("id", ""),
    () => supabase.from("app_users").delete().neq("id", "")
  ];

  for (const run of deleteSteps) {
    const result = await run();
    if (result.error) {
      throw new Error(`Supabase reset failed: ${result.error.message}`);
    }
  }

  clearMarketplaceCache();
  return true;
}

export async function getMarketplaceData(): Promise<MarketplaceData> {
  const remote = await readSupabaseState();
  if (remote) {
    return normalizeData(cloneData(remote));
  }

  if (requirePersistentStore()) {
    throw new Error("Production runtime requires Supabase server configuration. Demo memory data is disabled in production.");
  }

  if (!globalStore.__aigcMarketplaceData) {
    globalStore.__aigcMarketplaceData = normalizeData(cloneData(demoData));
  }

  return normalizeData(cloneData(globalStore.__aigcMarketplaceData));
}

export async function saveMarketplaceData(data: MarketplaceData): Promise<MarketplaceData> {
  const remote = await writeSupabaseState(data);
  if (remote) {
    return normalizeData(cloneData(remote));
  }

  if (requirePersistentStore()) {
    throw new Error("Production runtime requires Supabase server configuration. Demo memory data is disabled in production.");
  }

  globalStore.__aigcMarketplaceData = normalizeData(cloneData(data));
  writeMarketplaceCache(globalStore.__aigcMarketplaceData);
  return getMarketplaceData();
}

export async function updateMarketplaceData<T>(
  updater: (data: MarketplaceData) => T | Promise<T>
): Promise<T> {
  const data = await getMarketplaceData();
  const result = await updater(data);
  await saveMarketplaceData(data);
  return result;
}

export async function resetMarketplaceData() {
  if (getServerSupabase()) {
    await clearSupabaseState();
  }
  return saveMarketplaceData(cloneData(demoData));
}
