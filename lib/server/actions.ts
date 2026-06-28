import { monthlyActiveUsers, activeOrders } from "../analytics";
import { draftProjectBrief } from "../brief-agent";
import { recommendCreators } from "../matching";
import { cleanPublicCreators, cleanPublicProjects, isDemoCreator } from "../public-marketplace";
import { buyerVerificationFieldsChanged, creatorVerificationFieldsChanged } from "../review-status";
import {
  ActivityEvent,
  AbuseReport,
  BuyerProfile,
  CreatorProfile,
  MarketplaceData,
  Message,
  Order,
  OrderStatus,
  Project,
  ProjectCategory,
  TrialFeedback,
  UserRole
} from "../types";
import { ServerAuthUser } from "./auth";
import {
  asBoolean,
  asDeliverableTypes,
  asNumber,
  asProjectCategory,
  asProjectUrgency,
  asProjectUseCase,
  asStringArray,
  asVerificationType
} from "./validation";

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function paginate<T>(items: T[], searchParams: URLSearchParams, defaultLimit = 20) {
  const limit = Math.min(Math.max(Number(searchParams.get("limit") || defaultLimit) || defaultLimit, 1), 100);
  const offset = Math.max(Number(searchParams.get("offset") || 0) || 0, 0);
  return {
    items: items.slice(offset, offset + limit),
    meta: {
      total: items.length,
      limit,
      offset,
      hasMore: offset + limit < items.length
    }
  };
}

function addActivity(
  data: MarketplaceData,
  input: Pick<ActivityEvent, "userId" | "role" | "eventType" | "targetType" | "targetId"> & { note?: string }
) {
  data.activityEvents.unshift({
    id: id("a"),
    createdAt: new Date().toISOString(),
    ...input
  });
}

function adminActorLabel(input: Record<string, unknown>) {
  const actorName = String(input.actorName || input.operatorName || "").trim();
  const actorId = String(input.actorId || input.operatorId || "").trim();
  if (actorName) return `运营 ${actorName}`;
  if (actorId) return `运营(${actorId})`;
  return "平台运营";
}

function adminActionNote(input: Record<string, unknown>, detail: string) {
  return `${adminActorLabel(input)}：${detail}`;
}

function buyerDraft(profile: BuyerProfile): Record<string, unknown> {
  const { reviewDraft: _draft, reviewDraftSubmittedAt: _submittedAt, reviewDraftRejectedReason: _draftRejected, ...draft } = profile;
  return draft;
}

function creatorDraft(profile: CreatorProfile): Record<string, unknown> {
  const { reviewDraft: _draft, reviewDraftSubmittedAt: _submittedAt, reviewDraftRejectedReason: _draftRejected, ...draft } = profile;
  return draft;
}

function keepPublishedBuyerWithDraft(existing: BuyerProfile, next: BuyerProfile): BuyerProfile {
  return {
    ...existing,
    displayName: next.displayName,
    avatarUrl: next.avatarUrl,
    profileSlogan: next.profileSlogan,
    industry: next.industry,
    location: next.location,
    companyIntro: next.companyIntro,
    contactEmail: next.contactEmail,
    contactPhone: next.contactPhone,
    websiteUrl: next.websiteUrl,
    socialUrl: next.socialUrl,
    serviceArea: next.serviceArea,
    cover: next.cover,
    verified: true,
    rejectedReason: undefined,
    reviewDraft: buyerDraft(next),
    reviewDraftSubmittedAt: undefined,
    reviewDraftRejectedReason: undefined
  };
}

function keepPublishedCreatorWithDraft(existing: CreatorProfile, next: CreatorProfile): CreatorProfile {
  return {
    ...existing,
    title: next.title,
    location: next.location,
    bio: next.bio,
    resume: next.resume,
    skills: next.skills,
    categories: next.categories,
    portfolio: next.portfolio,
    portfolioItems: next.portfolioItems,
    servicePackages: next.servicePackages,
    priceMin: next.priceMin,
    priceMax: next.priceMax,
    responseTime: next.responseTime,
    avatarUrl: next.avatarUrl,
    displayName: next.displayName,
    profileSlogan: next.profileSlogan,
    websiteUrl: next.websiteUrl,
    socialUrl: next.socialUrl,
    serviceArea: next.serviceArea,
    contactEmail: next.contactEmail,
    contactPhone: next.contactPhone,
    trainingProfile: next.trainingProfile,
    cover: next.cover,
    verified: true,
    rejectedReason: undefined,
    reviewDraft: creatorDraft(next),
    reviewDraftSubmittedAt: undefined,
    reviewDraftRejectedReason: undefined
  };
}

function resolveBuyerReview(profile: BuyerProfile, verified: boolean, rejectedReason?: string): BuyerProfile {
  if (profile.reviewDraft && verified) {
    return {
      ...profile,
      ...profile.reviewDraft,
      verified: true,
      rejectedReason: undefined,
      reviewDraft: undefined,
      reviewDraftSubmittedAt: undefined,
      reviewDraftRejectedReason: undefined
    } as BuyerProfile;
  }

  if (profile.reviewDraft && profile.verified && !verified) {
    return {
      ...profile,
      reviewDraftSubmittedAt: undefined,
      reviewDraftRejectedReason: rejectedReason
    };
  }

  return {
    ...profile,
    verified,
    rejectedReason,
    reviewDraft: verified ? undefined : profile.reviewDraft,
    reviewDraftSubmittedAt: verified ? undefined : profile.reviewDraftSubmittedAt,
    reviewDraftRejectedReason: verified ? undefined : profile.reviewDraftRejectedReason
  };
}

function resolveCreatorReview(profile: CreatorProfile, verified: boolean, rejectedReason?: string): CreatorProfile {
  if (profile.reviewDraft && verified) {
    return {
      ...profile,
      ...profile.reviewDraft,
      verified: true,
      rejectedReason: undefined,
      reviewDraft: undefined,
      reviewDraftSubmittedAt: undefined,
      reviewDraftRejectedReason: undefined
    } as CreatorProfile;
  }

  if (profile.reviewDraft && profile.verified && !verified) {
    return {
      ...profile,
      reviewDraftSubmittedAt: undefined,
      reviewDraftRejectedReason: rejectedReason
    };
  }

  return {
    ...profile,
    verified,
    rejectedReason,
    reviewDraft: verified ? undefined : profile.reviewDraft,
    reviewDraftSubmittedAt: verified ? undefined : profile.reviewDraftSubmittedAt,
    reviewDraftRejectedReason: verified ? undefined : profile.reviewDraftRejectedReason
  };
}

export function publicUser<T extends { password?: string }>(user: T) {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

export function isSuspendedUser(user?: { status?: string } | null) {
  return user?.status === "suspended";
}

export function publicMarketplaceData(data: MarketplaceData): MarketplaceData {
  return {
    ...data,
    users: data.users.map((user) => publicUser(user))
  };
}

export function scopeMarketplaceData(data: MarketplaceData, actor: ServerAuthUser | null): MarketplaceData {
  const safeUsers = data.users.map((user) => publicUser(user));
  if (actor?.role === "admin") {
    return {
      ...data,
      users: safeUsers
    };
  }

  const publicProjects = data.projects.filter((project) => isPublicProject(project));
  const publicProjectIds = new Set(publicProjects.map((project) => project.id));
  const ownProjects = actor ? data.projects.filter((project) => project.buyerId === actor.id) : [];
  const ownProjectIds = new Set(ownProjects.map((project) => project.id));
  const ownCreator = actor ? data.creators.find((creator) => creator.userId === actor.id) : undefined;
  const allowedOrders = actor
    ? data.orders.filter((order) => order.buyerId === actor.id || order.creatorId === ownCreator?.id)
    : [];
  const allowedOrderIds = new Set(allowedOrders.map((order) => order.id));
  const visibleProjectsById = new Map<string, Project>();
  [...publicProjects, ...ownProjects].forEach((project) => visibleProjectsById.set(project.id, project));

  const visibleBuyerIds = new Set([
    ...publicProjects.map((project) => project.buyerId),
    ...ownProjects.map((project) => project.buyerId),
    ...allowedOrders.map((order) => order.buyerId)
  ]);
  const visibleCreatorIds = new Set([
    ...data.creators.filter((creator) => creator.verified).map((creator) => creator.id),
    ...(ownCreator ? [ownCreator.id] : []),
    ...allowedOrders.map((order) => order.creatorId)
  ]);
  const visibleFeedback = actor ? data.feedback.filter((feedback) => feedback.userId === actor.id).slice(0, 100) : [];

  return {
    users: safeUsers.filter((user) => user.id === actor?.id || visibleBuyerIds.has(user.id)),
    buyerProfiles: (data.buyerProfiles ?? []).filter((profile) => visibleBuyerIds.has(profile.userId) || profile.userId === actor?.id),
    creators: data.creators.filter((creator) => visibleCreatorIds.has(creator.id)),
    projects: Array.from(visibleProjectsById.values()),
    matches: data.matches.filter((match) => publicProjectIds.has(match.projectId) || ownProjectIds.has(match.projectId)),
    orders: allowedOrders,
    messages: data.messages.filter((message) => allowedOrderIds.has(message.orderId)),
    reviews: data.reviews.filter((review) => allowedOrderIds.has(review.orderId)),
    reports: actor ? data.reports.filter((report) => report.reporterId === actor.id).slice(0, 100) : [],
    feedback: visibleFeedback,
    activityEvents: actor ? data.activityEvents.filter((event) => event.userId === actor.id).slice(0, 100) : []
  };
}

export function getPublicMarketplace(data: MarketplaceData, includeTestData = false) {
  return {
    projects: cleanPublicProjects(data.projects.filter((project) => isPublicProject(project)), includeTestData),
    creators: cleanPublicCreators(data.creators.filter((creator) => creator.verified), includeTestData),
    metrics: getAdminMetrics(data)
  };
}

export function isPublicProject(project: Project) {
  return project.status === "open" || project.status === "matching";
}

function isTrialContactableProject(project: Project) {
  return project.status === "pending_review" || project.status === "open" || project.status === "matching" || project.status === "in_progress";
}

export function registerUser(data: MarketplaceData, input: Record<string, unknown>) {
  const role = ["buyer", "creator", "admin"].includes(String(input.role))
    ? (String(input.role) as UserRole)
    : "buyer";
  const account = String(input.account || input.email || input.phone || "").trim();
  const password = String(input.password || "");
  if (!account || password.length < 6) return null;

  const email = account.includes("@") ? account : String(input.email || `${account}@phone.aigclancer.local`);
  const phone = account.includes("@") ? String(input.phone || "") : account;
  const existing = data.users.find((item) => item.email === email || item.account === account || item.phone === account);
  if (existing) {
    return null;
  }

  const user = {
    id: id("u"),
    name: String(input.name || account || "新用户"),
    account,
    phone,
    password,
    email,
    role,
    status: "active" as const,
    createdAt: today()
  };

  data.users.unshift(user);
  addActivity(data, {
    userId: user.id,
    role,
    eventType: "login"
  });

  return user;
}

export function loginUser(data: MarketplaceData, input: Record<string, unknown>) {
  const role = ["buyer", "creator", "admin"].includes(String(input.role))
    ? (String(input.role) as UserRole)
    : undefined;
  const account = String(input.account || input.email || input.phone || "").trim();
  const authMethod = String(input.authMethod || "password");
  const password = String(input.password || "");
  const user = data.users.find((item) =>
    (item.email === account || item.account === account || item.phone === account) &&
    (role === "admin" ? item.role === "admin" : item.role !== "admin")
  );

  if (authMethod === "code") return null;
  const passwordMatches = user ? user.password ? user.password === password : password.length >= 6 : false;
  if (user && passwordMatches && isSuspendedUser(user)) return null;

  if (user && passwordMatches) {
    addActivity(data, {
      userId: user.id,
      role: role ?? user.role,
      eventType: "login"
    });
  }

  return user && passwordMatches ? user : null;
}

export function setUserPassword(data: MarketplaceData, input: Record<string, unknown>) {
  const userId = String(input.userId || "");
  const password = String(input.password || "");
  if (!userId || !/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\S]{8,32}$/.test(password)) return null;

  const user = data.users.find((item) => item.id === userId);
  if (!user || user.role === "admin") return null;

  user.password = password;
  addActivity(data, {
    userId: user.id,
    role: user.role,
    eventType: "login"
  });
  return user;
}

export function createProject(data: MarketplaceData, input: Record<string, unknown>) {
  const buyerId = String(input.buyerId || "u-buyer-1");
  const recommendationCreators = data.creators.filter((creator) => !isDemoCreator(creator));
  const project: Project = {
    id: id("p"),
    buyerId,
    title: String(input.title || "未命名需求"),
    description: String(input.description || ""),
    category: asProjectCategory(input.category),
    tags: asStringArray(input.tags),
    useCase: asProjectUseCase(input.useCase ?? input.use_case),
    deliverableTypes: asDeliverableTypes(input.deliverableTypes ?? input.deliverable_types),
    urgency: asProjectUrgency(input.urgency),
    needInvoice: asBoolean(input.needInvoice ?? input.need_invoice),
    longTerm: asBoolean(input.longTerm ?? input.long_term),
    acceptPlatformRecommend: asBoolean(input.acceptPlatformRecommend ?? input.accept_platform_recommend, true),
    trainingRequirement: input.trainingRequirement as Project["trainingRequirement"],
    budget: asNumber(input.budget, 3000),
    deadline: String(input.deadline || today()),
    status: "pending_review",
    referenceFile: input.referenceFile ? String(input.referenceFile) : undefined,
    qualificationFile: input.qualificationFile ? String(input.qualificationFile) : undefined,
    contactEmail: input.contactEmail ? String(input.contactEmail) : undefined,
    contactPhone: input.contactPhone ? String(input.contactPhone) : undefined,
    agentBrief: input.agentBrief as Project["agentBrief"],
    rejectedReason: input.rejectedReason ? String(input.rejectedReason) : undefined,
    createdAt: today()
  };
  const matches = recommendCreators(project, recommendationCreators, 10);

  data.projects.unshift(project);
  data.matches.unshift(...matches);
  addActivity(data, {
    userId: buyerId,
    role: "buyer",
    eventType: "post_project",
    targetType: "project",
    targetId: project.id
  });

  return { project, matches };
}

export function updateProject(data: MarketplaceData, projectId: string, input: Record<string, unknown>) {
  const project = data.projects.find((item) => item.id === projectId);
  if (!project) return null;
  const recommendationCreators = data.creators.filter((creator) => !isDemoCreator(creator));

  const nextProject: Project = {
    ...project,
    title: String(input.title || project.title),
    description: String(input.description || project.description),
    category: input.category ? asProjectCategory(input.category) : project.category,
    tags: input.tags ? asStringArray(input.tags) : project.tags ?? [],
    useCase: input.useCase || input.use_case ? asProjectUseCase(input.useCase ?? input.use_case) : project.useCase,
    deliverableTypes: input.deliverableTypes || input.deliverable_types ? asDeliverableTypes(input.deliverableTypes ?? input.deliverable_types) : project.deliverableTypes ?? [],
    urgency: input.urgency ? asProjectUrgency(input.urgency) : project.urgency,
    needInvoice: input.needInvoice === undefined && input.need_invoice === undefined ? project.needInvoice : asBoolean(input.needInvoice ?? input.need_invoice),
    longTerm: input.longTerm === undefined && input.long_term === undefined ? project.longTerm : asBoolean(input.longTerm ?? input.long_term),
    acceptPlatformRecommend:
      input.acceptPlatformRecommend === undefined && input.accept_platform_recommend === undefined
        ? project.acceptPlatformRecommend
        : asBoolean(input.acceptPlatformRecommend ?? input.accept_platform_recommend, true),
    trainingRequirement:
      input.trainingRequirement === undefined
        ? project.trainingRequirement
        : input.trainingRequirement as Project["trainingRequirement"],
    budget: input.budget === undefined ? project.budget : asNumber(input.budget, project.budget),
    deadline: input.deadline ? String(input.deadline) : project.deadline,
    status: "pending_review",
    referenceFile: input.referenceFile ? String(input.referenceFile) : undefined,
    qualificationFile: input.qualificationFile ? String(input.qualificationFile) : undefined,
    contactEmail: input.contactEmail ? String(input.contactEmail) : undefined,
    contactPhone: input.contactPhone ? String(input.contactPhone) : undefined,
    agentBrief: input.agentBrief as Project["agentBrief"],
    rejectedReason: undefined
  };

  data.projects = data.projects.map((item) => (item.id === projectId ? nextProject : item));
  data.matches = data.matches.filter((match) => match.projectId !== projectId);
  data.matches.unshift(...recommendCreators(nextProject, recommendationCreators, 10));
  addActivity(data, {
    userId: nextProject.buyerId,
    role: "buyer",
    eventType: "post_project",
    targetType: "project",
    targetId: nextProject.id,
    note: "重新提交需求审核"
  });

  return {
    project: nextProject,
    matches: data.matches.filter((match) => match.projectId === projectId)
  };
}

export function listProjects(data: MarketplaceData, searchParams: URLSearchParams) {
  const q = String(searchParams.get("q") || "").trim().toLowerCase();
  const category = searchParams.get("category") as ProjectCategory | null;
  const status = searchParams.get("status");

  return data.projects.filter((project) => {
    const matchedQ = q
      ? `${project.title} ${project.description}`.toLowerCase().includes(q)
      : true;
    const matchedCategory = category ? project.category === category : true;
    const matchedStatus = status ? project.status === status : true;
    const matchedVisibility = isPublicProject(project);
    return matchedQ && matchedCategory && matchedStatus && matchedVisibility;
  });
}

export function pagedProjects(data: MarketplaceData, searchParams: URLSearchParams) {
  return paginate(listProjects(data, searchParams), searchParams, 20);
}

export function getProjectMatches(data: MarketplaceData, projectId: string) {
  const project = data.projects.find((item) => item.id === projectId);
  if (!project) return null;
  const recommendationCreators = data.creators.filter((creator) => !isDemoCreator(creator));

  const stored = data.matches.filter((item) => item.projectId === projectId);
  if (stored.length >= 10) {
    return stored.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  return recommendCreators(project, recommendationCreators, 10);
}

export function inviteCreator(data: MarketplaceData, projectId: string, input: Record<string, unknown>) {
  const creatorId = String(input.creatorId || "");
  const project = data.projects.find((item) => item.id === projectId);
  const creator = data.creators.find((item) => item.id === creatorId);
  if (!project || !creator || !isTrialContactableProject(project)) return null;

  const order: Order = {
    id: id("o"),
    projectId,
    buyerId: project.buyerId,
    creatorId,
    amount: project.budget,
    status: "active",
    createdAt: today()
  };

  data.orders.unshift(order);
  data.messages.unshift({
    id: id("msg"),
    orderId: order.id,
    senderId: project.buyerId,
    body: String(input.message || `已邀请 ${creator.name} 沟通需求「${project.title}」。`),
    attachmentUrl: input.attachmentUrl ? String(input.attachmentUrl) : undefined,
    createdAt: new Date().toISOString()
  });
  data.projects = data.projects.map((item) =>
    item.id === projectId ? { ...item, status: "in_progress" as const } : item
  );
  addActivity(data, {
    userId: project.buyerId,
    role: "buyer",
    eventType: "invite_creator",
    targetType: "order",
    targetId: order.id
  });

  return order;
}

export function expressInterest(data: MarketplaceData, projectId: string, input: Record<string, unknown>) {
  const creatorId = String(input.creatorId || "c-self");
  const project = data.projects.find((item) => item.id === projectId);
  const creator = data.creators.find((item) => item.id === creatorId);
  if (!project || !creator || !isTrialContactableProject(project)) return null;

  const existing = data.orders.find((item) => item.projectId === projectId && item.creatorId === creatorId);
  const order =
    existing ??
    ({
      id: id("o"),
      projectId,
      buyerId: project.buyerId,
      creatorId,
      amount: project.budget,
      status: "active",
      createdAt: today()
    } satisfies Order);

  if (!existing) data.orders.unshift(order);

  const attachmentUrl = String(input.attachmentUrl || `/creators/${creator.id}`);
  data.messages.unshift({
    id: id("msg"),
    orderId: order.id,
    senderId: creator.userId,
    body: [
      `${creator.name} 对需求「${project.title}」发起沟通意向。`,
      String(input.intro || input.message || ""),
      `已发送展示页：${attachmentUrl}`
    ]
      .filter(Boolean)
      .join("\n"),
    attachmentUrl,
    createdAt: new Date().toISOString()
  });
  data.projects = data.projects.map((item) =>
    item.id === projectId ? { ...item, status: "in_progress" as const } : item
  );
  addActivity(data, {
    userId: creator.userId,
    role: "creator",
    eventType: "send_message",
    targetType: "order",
    targetId: order.id
  });

  return order;
}

export function listCreators(data: MarketplaceData, searchParams: URLSearchParams) {
  const q = String(searchParams.get("q") || "").trim().toLowerCase();
  const category = searchParams.get("category") as ProjectCategory | null;
  const verified = searchParams.get("verified");

  return data.creators.filter((creator) => {
    const matchedQ = q
      ? `${creator.name} ${creator.title} ${creator.bio} ${creator.skills.join(" ")}`.toLowerCase().includes(q)
      : true;
    const matchedCategory = category ? creator.categories.includes(category) : true;
    const matchedVerified = verified ? String(creator.verified) === verified : true;
    return matchedQ && matchedCategory && matchedVerified && creator.verified;
  });
}

export function pagedCreators(data: MarketplaceData, searchParams: URLSearchParams) {
  return paginate(listCreators(data, searchParams), searchParams, 24);
}

export function upsertCreator(data: MarketplaceData, input: Record<string, unknown>) {
  const profileId = String(input.id || id("c"));
  const userId = String(input.userId || "u-creator-self");
  const existingUser = data.users.find((item) => item.id === userId);
  const existing = data.creators.find((item) => item.id === profileId || item.userId === userId);
  const nextProfile: CreatorProfile = {
    id: profileId,
    userId,
    name: String(input.name || input.displayName || "新接单方"),
    title: String(input.title || input.profileSlogan || "AIGC创作者"),
    location: String(input.location || ""),
    bio: String(input.bio || ""),
    resume: String(input.resume || ""),
    skills: asStringArray(input.skills),
    categories: asStringArray(input.categories).map(asProjectCategory),
    portfolio: asStringArray(input.portfolio),
    portfolioItems: Array.isArray(input.portfolioItems) ? input.portfolioItems as CreatorProfile["portfolioItems"] : undefined,
    servicePackages: Array.isArray(input.servicePackages) ? input.servicePackages as CreatorProfile["servicePackages"] : undefined,
    priceMin: asNumber(input.priceMin, 0),
    priceMax: asNumber(input.priceMax, 0),
    completedProjects: asNumber(input.completedProjects, 0),
    rating: asNumber(input.rating, 4.6),
    responseTime: String(input.responseTime || "24小时"),
    verified: false,
    rejectedReason: existing?.rejectedReason,
    identityType: asVerificationType(input.identityType || input.verificationType),
    verificationType: asVerificationType(input.verificationType || input.identityType),
    credentialFile: input.credentialFile ? String(input.credentialFile) : undefined,
    qualificationFiles: asStringArray(input.qualificationFiles),
    avatarUrl: input.avatarUrl ? String(input.avatarUrl) : undefined,
    displayName: String(input.displayName || input.name || "新接单方"),
    profileSlogan: String(input.profileSlogan || input.title || "AIGC创作者"),
    websiteUrl: input.websiteUrl ? String(input.websiteUrl) : undefined,
    socialUrl: input.socialUrl ? String(input.socialUrl) : undefined,
    serviceArea: input.serviceArea ? String(input.serviceArea) : undefined,
    contactEmail: input.contactEmail ? String(input.contactEmail) : undefined,
    contactPhone: input.contactPhone ? String(input.contactPhone) : undefined,
    trainingProfile: input.trainingProfile as CreatorProfile["trainingProfile"],
    cover: String(input.cover || "linear-gradient(135deg, #153f31, #2f7c5f 46%, #f0b35a)")
  };
  const resetVerifiedReview = Boolean(existing?.verified) && creatorVerificationFieldsChanged(existing, nextProfile);
  const profile: CreatorProfile = existing?.verified && resetVerifiedReview
    ? keepPublishedCreatorWithDraft(existing, nextProfile)
    : {
        ...nextProfile,
        verified: existing?.verified ?? false,
        rejectedReason: existing?.rejectedReason,
        reviewDraft: undefined,
        reviewDraftSubmittedAt: undefined,
        reviewDraftRejectedReason: undefined
      };

  data.users = existingUser
    ? data.users.map((user) => (
        user.id === userId
          ? {
              ...user,
              name: profile.displayName || profile.name,
              email: profile.contactEmail || user.email,
              phone: profile.contactPhone || user.phone
            }
          : user
      ))
    : [
        {
          id: userId,
          name: profile.displayName || profile.name,
          account: profile.contactEmail || undefined,
          phone: profile.contactPhone,
          email: profile.contactEmail || `${userId}@creator.aigclancer.local`,
          role: "creator",
          status: "active",
          createdAt: today()
        },
        ...data.users
      ];
  data.creators = [profile, ...data.creators.filter((item) => item.id !== profile.id && item.userId !== profile.userId)];
  addActivity(data, {
    userId: profile.userId,
    role: "creator",
    eventType: "browse",
    targetType: "creator",
    targetId: profile.id
  });
  return profile;
}

export function upsertBuyer(data: MarketplaceData, input: Record<string, unknown>) {
  const profileId = String(input.id || id("bp"));
  const userId = String(input.userId || "u-buyer-1");
  const existingUser = data.users.find((item) => item.id === userId);
  const existing = (data.buyerProfiles ?? []).find((item) => item.id === profileId || item.userId === userId);
  const nextProfile: BuyerProfile = {
    id: profileId,
    userId,
    companyName: String(input.companyName || input.displayName || input.name || "新派单方"),
    displayName: String(input.displayName || input.name || input.companyName || "新派单方"),
    avatarUrl: input.avatarUrl ? String(input.avatarUrl) : undefined,
    profileSlogan: input.profileSlogan ? String(input.profileSlogan) : undefined,
    industry: String(input.industry || ""),
    location: String(input.location || ""),
    companyIntro: String(input.companyIntro || input.intro || ""),
    verificationType: asVerificationType(input.verificationType),
    contactEmail: String(input.contactEmail || ""),
    contactPhone: String(input.contactPhone || ""),
    websiteUrl: input.websiteUrl ? String(input.websiteUrl) : undefined,
    socialUrl: input.socialUrl ? String(input.socialUrl) : undefined,
    serviceArea: input.serviceArea ? String(input.serviceArea) : undefined,
    businessLicenseFile: String(input.businessLicenseFile || input.credentialFile || ""),
    qualificationFiles: asStringArray(input.qualificationFiles),
    verified: false,
    rejectedReason: existing?.rejectedReason,
    cover: String(input.cover || "linear-gradient(135deg, #153f31, #2457c5)")
  };
  const resetVerifiedReview = Boolean(existing?.verified) && buyerVerificationFieldsChanged(existing, nextProfile);
  const profile: BuyerProfile = existing?.verified && resetVerifiedReview
    ? keepPublishedBuyerWithDraft(existing, nextProfile)
    : {
        ...nextProfile,
        verified: existing?.verified ?? false,
        rejectedReason: existing?.rejectedReason,
        reviewDraft: undefined,
        reviewDraftSubmittedAt: undefined,
        reviewDraftRejectedReason: undefined
      };

  data.users = existingUser
    ? data.users.map((user) => (
        user.id === userId
          ? {
              ...user,
              name: profile.displayName || profile.companyName,
              email: profile.contactEmail || user.email,
              phone: profile.contactPhone || user.phone
            }
          : user
      ))
    : [
        {
          id: userId,
          name: profile.displayName || profile.companyName,
          account: profile.contactEmail || undefined,
          phone: profile.contactPhone,
          email: profile.contactEmail || `${userId}@buyer.aigclancer.local`,
          role: "buyer",
          status: "active",
          createdAt: today()
        },
        ...data.users
      ];
  data.buyerProfiles = [profile, ...(data.buyerProfiles ?? []).filter((item) => item.id !== profile.id && item.userId !== profile.userId)];
  addActivity(data, {
    userId: profile.userId,
    role: "buyer",
    eventType: "browse",
    targetType: "buyer_profile",
    targetId: profile.id
  });
  return profile;
}

export function listOrders(data: MarketplaceData, searchParams: URLSearchParams) {
  const buyerId = searchParams.get("buyerId");
  const creatorId = searchParams.get("creatorId");
  const status = searchParams.get("status");

  return data.orders.filter((order) => {
    const matchedBuyer = buyerId ? order.buyerId === buyerId : true;
    const matchedCreator = creatorId ? order.creatorId === creatorId : true;
    const matchedStatus = status ? order.status === status : true;
    return matchedBuyer && matchedCreator && matchedStatus;
  });
}

export function pagedOrders(data: MarketplaceData, searchParams: URLSearchParams) {
  return paginate(listOrders(data, searchParams), searchParams, 20);
}

export function createReport(data: MarketplaceData, input: Record<string, unknown>) {
  const reporterId = String(input.reporterId || "");
  const targetType = String(input.targetType || "") as AbuseReport["targetType"];
  const targetId = String(input.targetId || "");
  const reason = String(input.reason || "").trim();
  if (!reporterId || !["project", "creator", "buyer_profile", "order", "message"].includes(targetType) || !targetId || reason.length < 5) {
    return null;
  }

  const report: AbuseReport = {
    id: id("rpt"),
    reporterId,
    targetType,
    targetId,
    reason: reason.slice(0, 1000),
    status: "open",
    createdAt: new Date().toISOString()
  };
  data.reports.unshift(report);
  const reporter = data.users.find((user) => user.id === reporterId);
  addActivity(data, {
    userId: reporterId,
    role: reporter?.role === "admin" ? "admin" : reporter?.role === "creator" ? "creator" : "buyer",
    eventType: "report_abuse",
    targetType,
    targetId,
    note: reason.slice(0, 200)
  });
  return report;
}

export function createFeedback(data: MarketplaceData, input: Record<string, unknown>) {
  const content = String(input.content || "").trim();
  const category = String(input.category || "suggestion") as TrialFeedback["category"];
  const status = "open" as const;
  if (content.length < 3 || !["suggestion", "bug", "confusing", "missing_feature", "other"].includes(category)) {
    return null;
  }

  const userId = input.userId ? String(input.userId) : undefined;
  const user = userId ? data.users.find((item) => item.id === userId) : undefined;
  const feedback: TrialFeedback = {
    id: id("fb"),
    userId,
    role: user?.role,
    page: String(input.page || ""),
    rating: input.rating === undefined || input.rating === null || input.rating === "" ? undefined : Math.min(Math.max(Number(input.rating) || 0, 1), 5),
    category,
    content: content.slice(0, 1200),
    status,
    createdAt: new Date().toISOString()
  };

  data.feedback.unshift(feedback);
  if (userId) {
    addActivity(data, {
      userId,
      role: user?.role === "admin" ? "admin" : user?.role === "creator" ? "creator" : "buyer",
      eventType: "submit_feedback",
      targetType: "feedback",
      targetId: feedback.id,
      note: content.slice(0, 200)
    });
  }
  return feedback;
}

export function resolveFeedback(data: MarketplaceData, input: Record<string, unknown>) {
  const idValue = String(input.id || input.feedbackId || "");
  const status = String(input.status || "resolved") as TrialFeedback["status"];
  const resolution = String(input.resolution || input.note || "");
  if (!idValue || !["reviewing", "resolved", "dismissed"].includes(status)) return null;

  data.feedback = data.feedback.map((feedback) =>
    feedback.id === idValue ? { ...feedback, status, resolution: resolution || feedback.resolution } : feedback
  );
  const feedback = data.feedback.find((item) => item.id === idValue);
  if (feedback) {
    addActivity(data, {
      userId: feedback.userId || "u-admin-1",
      role: "admin",
      eventType: "resolve_feedback",
      targetType: "feedback",
      targetId: feedback.id,
      note: adminActionNote(input, `${status === "resolved" ? "已处理" : status === "dismissed" ? "暂不处理" : "处理中"}${resolution ? `：${resolution.slice(0, 200)}` : ""}`)
    });
  }
  return feedback ?? null;
}

export function resolveReport(data: MarketplaceData, input: Record<string, unknown>) {
  const idValue = String(input.id || input.reportId || "");
  const status = String(input.status || "resolved") as AbuseReport["status"];
  const resolution = String(input.resolution || input.note || "");
  if (!idValue || !["reviewing", "resolved", "dismissed"].includes(status)) return null;

  data.reports = data.reports.map((report) =>
    report.id === idValue ? { ...report, status, resolution: resolution || report.resolution } : report
  );
  const report = data.reports.find((item) => item.id === idValue);
  if (report) {
    addActivity(data, {
      userId: report.reporterId,
      role: "admin",
      eventType: "resolve_report",
      targetType: "report",
      targetId: report.id,
      note: adminActionNote(input, `${status === "resolved" ? "已处理举报" : status === "dismissed" ? "驳回举报" : "举报处理中"}${resolution ? `：${resolution}` : ""}`)
    });
  }
  return report;
}

export function suspendUser(data: MarketplaceData, input: Record<string, unknown>) {
  const idValue = String(input.id || input.userId || "");
  const suspended = input.suspended === undefined ? true : Boolean(input.suspended);
  const reason = suspended ? String(input.reason || input.suspendedReason || "违反平台规则，账号已被限制。") : undefined;
  if (!idValue) return null;

  data.users = data.users.map((user) =>
    user.id === idValue ? { ...user, status: suspended ? "suspended" : "active", suspendedReason: reason } : user
  );
  const user = data.users.find((item) => item.id === idValue);
  if (user) {
    addActivity(data, {
      userId: user.id,
      role: "admin",
      eventType: "suspend_user",
      targetType: "user",
      targetId: user.id,
      note: adminActionNote(input, suspended ? `限制账号：${reason}` : "解除账号限制")
    });
  }
  return user;
}

export function createMessage(data: MarketplaceData, orderId: string, input: Record<string, unknown>) {
  const order = data.orders.find((item) => item.id === orderId);
  if (!order) return null;

  const senderId = String(input.senderId || order.buyerId);
  const message: Message = {
    id: id("msg"),
    orderId,
    senderId,
    body: String(input.body || input.message || ""),
    attachmentUrl: input.attachmentUrl ? String(input.attachmentUrl) : undefined,
    createdAt: new Date().toISOString()
  };

  data.messages.unshift(message);
  addActivity(data, {
    userId: senderId,
    role: senderId === order.buyerId ? "buyer" : "creator",
    eventType: "send_message",
    targetType: "order",
    targetId: orderId
  });
  return message;
}

export function updateOrderStatus(data: MarketplaceData, orderId: string, input: Record<string, unknown>) {
  const status = String(input.status || "") as OrderStatus;
  if (!["active", "contacted", "meeting_scheduled", "delivered", "revision", "approved", "not_fit", "no_response", "cancelled"].includes(status)) return null;

  const order = data.orders.find((item) => item.id === orderId);
  if (!order) return null;

  const resultReason = String(input.resultReason || input.reason || "").trim();
  const resultNote = String(input.resultNote || input.note || "").trim();
  const needsReason = ["not_fit", "no_response", "cancelled"].includes(status);

  data.orders = data.orders.map((item) => (
    item.id === orderId
      ? {
          ...item,
          status,
          resultReason: resultReason || item.resultReason,
          resultNote: resultNote || item.resultNote,
          resultUpdatedAt: new Date().toISOString()
        }
      : item
  ));
  addActivity(data, {
    userId: order.buyerId,
    role: status === "approved" || status === "not_fit" || status === "no_response" || status === "cancelled" ? "buyer" : "creator",
    eventType: status === "approved" ? "approve_order" : status === "delivered" ? "deliver_order" : "send_message",
    targetType: "order",
    targetId: orderId,
    note: needsReason ? resultReason || resultNote || status : status
  });
  return data.orders.find((item) => item.id === orderId);
}

export function getAdminMetrics(data: MarketplaceData) {
  const completedOrders = data.orders.filter((order) => order.status === "approved");
  return {
    users: data.users.length,
    buyers: data.users.filter((user) => user.role === "buyer").length,
    creators: data.creators.length,
    verifiedCreators: data.creators.filter((creator) => creator.verified).length,
    projects: data.projects.length,
    openProjects: data.projects.filter((project) => project.status === "open" || project.status === "matching").length,
    leads: data.orders.length,
    activeLeads: activeOrders(data),
    intentionBudget: data.orders.reduce((sum, order) => sum + order.amount, 0),
    completedIntentionBudget: completedOrders.reduce((sum, order) => sum + order.amount, 0),
    monthlyActiveUsers: monthlyActiveUsers(data),
    monthlyActiveBuyers: monthlyActiveUsers(data, "buyer"),
    monthlyActiveCreators: monthlyActiveUsers(data, "creator"),
    pendingBuyerReviews: (data.buyerProfiles ?? []).filter((profile) => !profile.verified).length,
    pendingCreatorReviews: data.creators.filter((creator) => !creator.verified).length
  };
}

export function verifySubject(data: MarketplaceData, input: Record<string, unknown>) {
  const subjectType = String(input.subjectType || input.type);
  const idValue = String(input.id || input.subjectId || "");
  const verified = input.verified === undefined ? true : Boolean(input.verified);
  const rejectedReason = verified ? undefined : String(input.rejectedReason || input.reason || "资料不完整，请补充后重新提交。");

  if (subjectType === "buyer") {
    data.buyerProfiles = (data.buyerProfiles ?? []).map((profile) =>
      profile.id === idValue || profile.userId === idValue ? resolveBuyerReview(profile, verified, rejectedReason) : profile
    );
    const profile = data.buyerProfiles.find((item) => item.id === idValue || item.userId === idValue);
    if (profile) {
      addActivity(data, {
        userId: profile.userId,
        role: "admin",
        eventType: "review_subject",
        targetType: "buyer_profile",
        targetId: profile.id,
        note: adminActionNote(input, verified ? "主体审核通过" : `主体审核驳回：${rejectedReason}`)
      });
    }
    return profile;
  }

  data.creators = data.creators.map((creator) =>
    creator.id === idValue || creator.userId === idValue ? resolveCreatorReview(creator, verified, rejectedReason) : creator
  );
  const creator = data.creators.find((item) => item.id === idValue || item.userId === idValue);
  if (creator) {
    addActivity(data, {
      userId: creator.userId,
      role: "admin",
      eventType: "review_subject",
      targetType: "creator",
      targetId: creator.id,
      note: adminActionNote(input, verified ? "主体审核通过" : `主体审核驳回：${rejectedReason}`)
    });
  }
  return creator;
}

export function submitSubjectReview(data: MarketplaceData, input: Record<string, unknown>) {
  const subjectType = String(input.subjectType || input.type);
  const idValue = String(input.id || input.subjectId || input.userId || "");

  if (subjectType === "buyer") {
    data.buyerProfiles = (data.buyerProfiles ?? []).map((profile) =>
      profile.id === idValue || profile.userId === idValue
        ? profile.verified && profile.reviewDraft
          ? {
              ...profile,
              reviewDraftSubmittedAt: new Date().toISOString(),
              reviewDraftRejectedReason: undefined
            }
          : {
              ...profile,
              reviewDraft: buyerDraft(profile),
              reviewDraftSubmittedAt: new Date().toISOString(),
              reviewDraftRejectedReason: undefined,
              verified: false,
              rejectedReason: undefined
            }
        : profile
    );
    const profile = data.buyerProfiles.find((item) => item.id === idValue || item.userId === idValue);
    if (profile) {
      addActivity(data, {
        userId: profile.userId,
        role: "buyer",
        eventType: "submit_review",
        targetType: "buyer_profile",
        targetId: profile.id,
        note: profile.reviewDraft ? "用户提交认证变更审核" : "用户提交认证审核"
      });
    }
    return profile;
  }

  data.creators = data.creators.map((creator) =>
    creator.id === idValue || creator.userId === idValue
      ? creator.verified && creator.reviewDraft
        ? {
            ...creator,
            reviewDraftSubmittedAt: new Date().toISOString(),
            reviewDraftRejectedReason: undefined
          }
        : {
            ...creator,
            reviewDraft: creatorDraft(creator),
            reviewDraftSubmittedAt: new Date().toISOString(),
            reviewDraftRejectedReason: undefined,
            verified: false,
            rejectedReason: undefined
          }
      : creator
  );
  const creator = data.creators.find((item) => item.id === idValue || item.userId === idValue);
  if (creator) {
    addActivity(data, {
      userId: creator.userId,
      role: "creator",
      eventType: "submit_review",
      targetType: "creator",
      targetId: creator.id,
      note: creator.reviewDraft ? "用户提交认证变更审核" : "用户提交认证审核"
    });
  }
  return creator;
}

export function reviewProject(data: MarketplaceData, input: Record<string, unknown>) {
  const idValue = String(input.id || input.projectId || "");
  const status = String(input.status || "");
  if (!idValue || !["open", "rejected", "removed"].includes(status)) return null;

  const project = data.projects.find((item) => item.id === idValue);
  if (!project) return null;

  const rejectedReason =
    status === "rejected" || status === "removed"
      ? String(input.rejectedReason || input.reason || "需求信息不完整，请补充资质、联系方式或需求说明后重新提交。")
      : undefined;

  data.projects = data.projects.map((item) =>
    item.id === idValue
      ? {
          ...item,
          status: status as Project["status"],
          rejectedReason
        }
      : item
  );
  addActivity(data, {
    userId: project.buyerId,
    role: "admin",
    eventType: status === "removed" ? "remove_project" : "review_project",
    targetType: "project",
    targetId: idValue,
    note: adminActionNote(
      input,
      status === "open"
        ? "需求审核通过"
        : status === "removed"
          ? `需求下架：${rejectedReason}`
          : `需求审核驳回：${rejectedReason}`
    )
  });
  return data.projects.find((item) => item.id === idValue);
}

export function draftBrief(input: Record<string, unknown>) {
  return draftProjectBrief({
    rawIdea: String(input.rawIdea || ""),
    productName: String(input.productName || ""),
    audience: String(input.audience || ""),
    channel: String(input.channel || ""),
    style: String(input.style || "")
  });
}
