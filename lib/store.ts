"use client";

import { recommendCreators } from "./matching";
import { cleanPublicMarketplaceData, createEmptyMarketplaceData } from "./public-marketplace";
import { buyerVerificationFieldsChanged, creatorVerificationFieldsChanged } from "./review-status";
import {
  AbuseReport,
  ActivityEvent,
  BuyerProfile,
  CreatorProfile,
  DeliverableType,
  MarketplaceData,
  Order,
  PortfolioItem,
  Project,
  ProjectCategory,
  ProjectMatch,
  ProjectUrgency,
  ProjectUseCase,
  ServicePackage,
  TrialFeedback,
  TrainingProfile,
  TrainingRequirement,
  User,
  VerificationType
} from "./types";
import { readAuthSession, saveAuthSession } from "./auth";

const STORAGE_KEY = "linggong-zhichuang-demo-v2";
const USE_API_KEY = "linggong-zhichuang-use-api";
const API_BASE = "";

type RequestJsonOptions = {
  throwOnError?: boolean;
  fallbackErrorMessage?: string;
};

type AccountStatePayload = {
  buyerProfile: BuyerProfile | null;
  creatorProfile: CreatorProfile | null;
  projects: Project[];
  buyerOrders: Order[];
  creatorOrders: Order[];
  creatorProjects?: Project[];
  relatedProjects?: Project[];
  matches: ProjectMatch[];
  notificationsData: MarketplaceData;
};

type PublicMarketplacePayload = {
  projects: Project[];
  creators: CreatorProfile[];
};

function cloneData(data: MarketplaceData): MarketplaceData {
  return JSON.parse(JSON.stringify(data)) as MarketplaceData;
}

function normalizeVerificationType(value?: string): VerificationType | undefined {
  if (value === "company") return "enterprise";
  if (value === "individual") return "individual";
  return value as VerificationType | undefined;
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
  const buyerProfiles = (data.buyerProfiles ?? []).map((profile) => ({
    ...profile,
    displayName: profile.displayName ?? profile.companyName,
    avatarUrl: profile.avatarUrl ?? profile.companyName.slice(0, 1),
    profileSlogan: profile.profileSlogan ?? profile.industry,
    verificationType: normalizeVerificationType(profile.verificationType) ?? "enterprise",
    websiteUrl: profile.websiteUrl ?? "",
    socialUrl: profile.socialUrl ?? "",
    serviceArea: profile.serviceArea ?? profile.location
  }));
  const creators = data.creators.map((creator) => ({
    ...creator,
    displayName: creator.displayName ?? creator.name,
    avatarUrl: creator.avatarUrl ?? creator.name.slice(0, 1),
    profileSlogan: creator.profileSlogan ?? creator.title,
    resume: creator.resume ?? `${creator.name} 已完成 ${creator.completedProjects} 个历史项目，擅长 ${creator.skills.slice(0, 3).join("、")}。`,
    verificationType: normalizeVerificationType(creator.verificationType ?? creator.identityType) ?? "individual",
    identityType: normalizeVerificationType(creator.identityType) ?? normalizeVerificationType(creator.verificationType) ?? "individual",
    qualificationFiles: creator.qualificationFiles ?? [],
    portfolioItems: creator.portfolioItems ?? [],
    servicePackages: creator.servicePackages ?? [],
    websiteUrl: creator.websiteUrl ?? "",
    socialUrl: creator.socialUrl ?? "",
    serviceArea: creator.serviceArea ?? creator.location
  }));

  return {
    ...createEmptyMarketplaceData(),
    ...data,
    messages: data.messages ?? [],
    reviews: data.reviews ?? [],
    reports: data.reports ?? [],
    feedback: data.feedback ?? [],
    activityEvents: data.activityEvents ?? [],
    buyerProfiles: dedupeProfilesByUserId(buyerProfiles, "bp"),
    creators: dedupeProfilesByUserId(creators, "c")
  };
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

function shouldUseApi() {
  if (typeof window === "undefined") return false;

  const current = window.localStorage.getItem(USE_API_KEY);
  if (current === null) {
    window.localStorage.setItem(USE_API_KEY, "true");
    return true;
  }

  return current !== "false";
}

function requestJson<T>(path: string, init?: RequestInit, options?: RequestJsonOptions): T | null {
  if (typeof window === "undefined" || !shouldUseApi()) return null;

  const xhr = new XMLHttpRequest();
  xhr.open(init?.method ?? "GET", `${API_BASE}${path}`, false);
  xhr.setRequestHeader("Accept", "application/json");
  const session = readAuthSession();
  if (session?.accessToken) {
    xhr.setRequestHeader("Authorization", `Bearer ${session.accessToken}`);
  }

  const body = init?.body;
  if (body) {
    xhr.setRequestHeader("Content-Type", "application/json");
  }

  try {
    xhr.send(typeof body === "string" ? body : undefined);
  } catch {
    if (options?.throwOnError) {
      throw new Error(options.fallbackErrorMessage || "请求失败，请稍后再试。");
    }
    return null;
  }

  try {
    const parsed = JSON.parse(xhr.responseText) as { ok?: boolean; data?: T; error?: string };
    if (xhr.status < 200 || xhr.status >= 300 || !parsed.ok || parsed.data === undefined) {
      if (options?.throwOnError) {
        throw new Error(parsed.error || options.fallbackErrorMessage || "请求失败，请稍后再试。");
      }
      return null;
    }

    return parsed.data;
  } catch {
    if (options?.throwOnError) {
      throw new Error(options.fallbackErrorMessage || "请求失败，请稍后再试。");
    }
    return null;
  }
}

async function requestJsonAsync<T>(path: string, init?: RequestInit, options?: RequestJsonOptions): Promise<T | null> {
  if (typeof window === "undefined" || !shouldUseApi()) return null;

  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  const session = readAuthSession();
  if (session?.accessToken) {
    headers.set("Authorization", `Bearer ${session.accessToken}`);
  }
  if (init?.body) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers
    });
  } catch {
    if (options?.throwOnError) {
      throw new Error(options.fallbackErrorMessage || "请求失败，请稍后再试。");
    }
    return null;
  }

  const parsed = await response.json().catch(() => null) as { ok?: boolean; data?: T; error?: string } | null;
  if (!response.ok || !parsed?.ok || parsed.data === undefined) {
    if (options?.throwOnError) {
      throw new Error(parsed?.error || options.fallbackErrorMessage || "请求失败，请稍后再试。");
    }
    return null;
  }

  return parsed.data;
}

function loadLocalMarketplaceData(): MarketplaceData {
  if (typeof window === "undefined") {
    return normalizeData(createEmptyMarketplaceData());
  }

  const cached = window.localStorage.getItem(STORAGE_KEY);
  if (!cached) {
    const localData = createEmptyMarketplaceData();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(localData));
    return normalizeData(localData);
  }

  try {
    return normalizeData(JSON.parse(cached) as MarketplaceData);
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    const localData = createEmptyMarketplaceData();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(localData));
    return normalizeData(localData);
  }
}

function hasSessionScopedData(data: MarketplaceData, session: ReturnType<typeof readAuthSession>) {
  if (!session) return true;
  if (session.role === "admin") {
    return data.users.some((user) => user.id === session.userId);
  }
  if (session.role === "creator") {
    return data.creators.some((creator) => creator.userId === session.userId);
  }
  return Boolean(data.buyerProfiles?.some((profile) => profile.userId === session.userId));
}

export function loadMarketplaceData(): MarketplaceData {
  if (typeof window === "undefined") {
    return normalizeData(createEmptyMarketplaceData());
  }

  const session = readAuthSession();
  const normalizedLocal = loadLocalMarketplaceData();
  // Avoid blocking every navigation with a synchronous full-state refresh.
  // If the current user has no local scoped data yet, fetch once from the API.
  if (session?.accessToken && !hasSessionScopedData(normalizedLocal, session)) {
    const synced = syncFromApi();
    if (synced) {
      return synced;
    }
  }

  return normalizedLocal;
}

export function loadPublicMarketplaceData(): MarketplaceData {
  if (typeof window === "undefined") {
    return createEmptyMarketplaceData();
  }

  const remote = requestJson<PublicMarketplacePayload>("/api/marketplace");
  if (!remote) {
    return createEmptyMarketplaceData();
  }

  return cleanPublicMarketplaceData(normalizeData({
    ...createEmptyMarketplaceData(),
    projects: remote.projects,
    creators: remote.creators
  }));
}

export function saveMarketplaceData(data: MarketplaceData) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}

export function cacheBuyerProfile(profile: BuyerProfile) {
  const data = loadLocalMarketplaceData();
  saveMarketplaceData({
    ...data,
    buyerProfiles: [profile, ...(data.buyerProfiles ?? []).filter((item) => item.id !== profile.id && item.userId !== profile.userId)],
    users: data.users.map((user) => (
      user.id === profile.userId
        ? { ...user, name: profile.displayName ?? profile.companyName, email: profile.contactEmail || user.email, phone: profile.contactPhone || user.phone }
        : user
    ))
  });
}

export function cacheCreatorProfile(profile: CreatorProfile) {
  const data = loadLocalMarketplaceData();
  saveMarketplaceData({
    ...data,
    creators: [profile, ...data.creators.filter((item) => item.id !== profile.id && item.userId !== profile.userId)],
    users: data.users.map((user) => (
      user.id === profile.userId
        ? { ...user, name: profile.displayName ?? profile.name, email: profile.contactEmail || user.email, phone: profile.contactPhone || user.phone }
        : user
    ))
  });
}

function syncFromApi() {
  const session = readAuthSession();
  if (session?.accessToken) {
    const accountState = requestJson<AccountStatePayload>("/api/account/state");
    if (accountState) {
      const local = loadLocalMarketplaceData();
      const relatedProjects = accountState.relatedProjects ?? [];
      const projectsById = new Map([
        ...local.projects.map((project) => [project.id, project] as const),
        ...relatedProjects.map((project) => [project.id, project] as const),
        ...accountState.projects.map((project) => [project.id, project] as const),
        ...(accountState.creatorProjects ?? []).map((project) => [project.id, project] as const)
      ]);
      const ordersById = new Map([
        ...local.orders.map((order) => [order.id, order] as const),
        ...accountState.buyerOrders.map((order) => [order.id, order] as const),
        ...accountState.creatorOrders.map((order) => [order.id, order] as const)
      ]);
      const matchesById = new Map([
        ...local.matches.map((match) => [match.id, match] as const),
        ...accountState.matches.map((match) => [match.id, match] as const)
      ]);
      const notificationData = accountState.notificationsData;
      const next = normalizeData({
        ...local,
        users: [
          ...notificationData.users,
          ...local.users.filter((user) => !notificationData.users.some((item) => item.id === user.id))
        ],
        buyerProfiles: [
          ...(accountState.buyerProfile ? [accountState.buyerProfile] : []),
          ...(notificationData.buyerProfiles ?? []),
          ...(local.buyerProfiles ?? [])
        ],
        creators: [
          ...(accountState.creatorProfile ? [accountState.creatorProfile] : []),
          ...notificationData.creators,
          ...local.creators
        ],
        projects: Array.from(projectsById.values()),
        matches: Array.from(matchesById.values()),
        orders: Array.from(ordersById.values()),
        feedback: [
          ...notificationData.feedback,
          ...local.feedback.filter((item) => !notificationData.feedback.some((remote) => remote.id === item.id))
        ],
        activityEvents: [
          ...notificationData.activityEvents,
          ...local.activityEvents.filter((item) => !notificationData.activityEvents.some((remote) => remote.id === item.id))
        ]
      });

      if (hasSessionScopedData(next, session)) {
        saveMarketplaceData(next);
        return next;
      }
    }
  }

  const remote = requestJson<MarketplaceData>("/api/state");
  if (!remote) return null;

  const normalized = normalizeData(remote);

  if (!hasSessionScopedData(normalized, session)) {
    return null;
  }

  saveMarketplaceData(normalized);
  return normalized;
}

export async function createProject(input: {
  title: string;
  description: string;
  category: ProjectCategory;
  tags?: string[];
  useCase?: ProjectUseCase;
  deliverableTypes?: DeliverableType[];
  urgency?: ProjectUrgency;
  needInvoice?: boolean;
  longTerm?: boolean;
  acceptPlatformRecommend?: boolean;
  trainingRequirement?: TrainingRequirement;
  budget: number;
  deadline: string;
  referenceFile?: string;
  qualificationFile?: string;
  contactEmail?: string;
  contactPhone?: string;
  agentBrief?: Project["agentBrief"];
}) {
  const session = readAuthSession();
  const buyerId = session?.userId ?? "u-buyer-1";
  if (shouldUseApi()) {
    const remote = await requestJsonAsync<{ project: Project; matches: ProjectMatch[] }>("/api/projects", {
      method: "POST",
      body: JSON.stringify({
        buyerId,
        ...input
      })
    }, {
      throwOnError: true,
      fallbackErrorMessage: "需求保存失败，请稍后重试。"
    });

    if (remote) {
      return remote;
    }
  }

  const data = loadMarketplaceData();
  const project: Project = {
    id: `p-${Date.now()}`,
    buyerId,
    title: input.title,
    description: input.description,
    category: input.category,
    tags: input.tags ?? [],
    useCase: input.useCase,
    deliverableTypes: input.deliverableTypes ?? [],
    urgency: input.urgency,
    needInvoice: input.needInvoice,
    longTerm: input.longTerm,
    acceptPlatformRecommend: input.acceptPlatformRecommend ?? true,
    trainingRequirement: input.trainingRequirement,
    budget: input.budget,
    deadline: input.deadline,
    status: "pending_review",
    referenceFile: input.referenceFile,
    qualificationFile: input.qualificationFile,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    agentBrief: input.agentBrief,
    createdAt: new Date().toISOString().slice(0, 10)
  };
  const matches = recommendCreators(project, data.creators, 10);
  const activityEvent: ActivityEvent = {
    id: `a-${Date.now()}`,
    userId: buyerId,
    role: "buyer",
    eventType: "post_project",
    targetType: "project",
    targetId: project.id,
    createdAt: new Date().toISOString()
  };
  const next: MarketplaceData = {
    ...data,
    projects: [project, ...data.projects],
    matches: [...matches, ...data.matches],
    activityEvents: [activityEvent, ...data.activityEvents]
  };
  saveMarketplaceData(next);
  return { project, matches };
}

export async function resubmitProject(projectId: string, input: {
  title: string;
  description: string;
  category: ProjectCategory;
  tags?: string[];
  useCase?: ProjectUseCase;
  deliverableTypes?: DeliverableType[];
  urgency?: ProjectUrgency;
  needInvoice?: boolean;
  longTerm?: boolean;
  acceptPlatformRecommend?: boolean;
  trainingRequirement?: TrainingRequirement;
  budget: number;
  deadline: string;
  referenceFile?: string;
  qualificationFile?: string;
  contactEmail?: string;
  contactPhone?: string;
  agentBrief?: Project["agentBrief"];
}) {
  if (shouldUseApi()) {
    const remote = await requestJsonAsync<{ project: Project; matches: ProjectMatch[] }>(`/api/projects/${projectId}`, {
      method: "PATCH",
      body: JSON.stringify(input)
    }, {
      throwOnError: true,
      fallbackErrorMessage: "需求重新提交失败，请稍后重试。"
    });

    if (remote) {
      return remote;
    }
  }

  const data = loadMarketplaceData();
  const project = data.projects.find((item) => item.id === projectId);
  if (!project) return null;

  const nextProject: Project = {
    ...project,
    title: input.title,
    description: input.description,
    category: input.category,
    tags: input.tags ?? [],
    useCase: input.useCase,
    deliverableTypes: input.deliverableTypes ?? [],
    urgency: input.urgency,
    needInvoice: input.needInvoice,
    longTerm: input.longTerm,
    acceptPlatformRecommend: input.acceptPlatformRecommend ?? true,
    trainingRequirement: input.trainingRequirement,
    budget: input.budget,
    deadline: input.deadline,
    status: "pending_review",
    referenceFile: input.referenceFile,
    qualificationFile: input.qualificationFile,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    agentBrief: input.agentBrief,
    rejectedReason: undefined
  };
  const matches = recommendCreators(nextProject, data.creators, 10);
  const activityEvent: ActivityEvent = {
    id: `a-${Date.now()}`,
    userId: nextProject.buyerId,
    role: "buyer",
    eventType: "post_project",
    targetType: "project",
    targetId: nextProject.id,
    createdAt: new Date().toISOString(),
    note: "重新提交需求审核"
  };
  const next: MarketplaceData = {
    ...data,
    projects: data.projects.map((item) => (item.id === projectId ? nextProject : item)),
    matches: [...matches, ...data.matches.filter((match) => match.projectId !== projectId)],
    activityEvents: [activityEvent, ...data.activityEvents]
  };
  saveMarketplaceData(next);
  return { project: nextProject, matches };
}

export function inviteCreator(projectId: string, creatorId: string, input: { message?: string } = {}) {
  const remote = requestJson<Order>(`/api/projects/${projectId}/invite`, {
    method: "POST",
    body: JSON.stringify({ creatorId, message: input.message })
  });

  if (remote) {
    return remote;
  }

  const data = loadMarketplaceData();
  const project = data.projects.find((item) => item.id === projectId);
  const creator = data.creators.find((item) => item.id === creatorId);

  if (!project || !creator || !["pending_review", "open", "matching", "in_progress"].includes(project.status)) {
    return null;
  }

  const order: Order = {
    id: `o-${Date.now()}`,
    projectId,
    buyerId: project.buyerId,
    creatorId,
    amount: project.budget,
    status: "active",
    createdAt: new Date().toISOString().slice(0, 10)
  };

  const updatedProjects = data.projects.map((item) =>
    item.id === projectId ? { ...item, status: "in_progress" as const } : item
  );

  const activityEvent: ActivityEvent = {
    id: `a-${Date.now()}`,
    userId: project.buyerId,
    role: "buyer",
    eventType: "invite_creator",
    targetType: "order",
    targetId: order.id,
    createdAt: new Date().toISOString()
  };

  const next: MarketplaceData = {
    ...data,
    projects: updatedProjects,
    orders: [order, ...data.orders],
    messages: [
      {
        id: `msg-${Date.now()}`,
        orderId: order.id,
        senderId: project.buyerId,
        body: input.message || `已邀请 ${creator.name} 沟通需求「${project.title}」。`,
        createdAt: new Date().toISOString()
      },
      ...data.messages
    ],
    activityEvents: [activityEvent, ...data.activityEvents]
  };
  saveMarketplaceData(next);
  return order;
}

export function expressInterestInProject(
  projectId: string,
  creatorId: string,
  input: {
    intro: string;
  }
) {
  const remote = requestJson<Order>(`/api/projects/${projectId}/interest`, {
    method: "POST",
    body: JSON.stringify({
      creatorId,
      intro: input.intro
    })
  });

  if (remote) {
    return remote;
  }

  const data = loadMarketplaceData();
  const project = data.projects.find((item) => item.id === projectId);
  const creator = data.creators.find((item) => item.id === creatorId);

  if (!project || !creator || !["pending_review", "open", "matching", "in_progress"].includes(project.status)) {
    return null;
  }

  const existingOrder = data.orders.find((item) => item.projectId === projectId && item.creatorId === creatorId);
  const order: Order =
    existingOrder ??
    {
      id: `o-${Date.now()}`,
      projectId,
      buyerId: project.buyerId,
      creatorId,
      amount: project.budget,
      status: "active",
      createdAt: new Date().toISOString().slice(0, 10)
    };
  const profileUrl = `/creators/${creator.id}`;
  const materials = [
    `展示页：${profileUrl}`,
    "主页内已包含主体资质、联系方式、简历/履历和代表作"
  ].filter(Boolean);
  const messageBody = [
    `${creator.name} 对需求「${project.title}」发起沟通意向。`,
    input.intro,
    materials.length ? `已发送资料：${materials.join("；")}` : ""
  ]
    .filter(Boolean)
    .join("\n");

  const updatedProjects = data.projects.map((item) =>
    item.id === projectId ? { ...item, status: "in_progress" as const } : item
  );
  const orders = existingOrder ? data.orders : [order, ...data.orders];
  const activityEvent: ActivityEvent = {
    id: `a-${Date.now()}`,
    userId: creator.userId,
    role: "creator",
    eventType: "send_message",
    targetType: "order",
    targetId: order.id,
    createdAt: new Date().toISOString()
  };
  const next: MarketplaceData = {
    ...data,
    projects: updatedProjects,
    orders,
    messages: [
      {
        id: `msg-${Date.now()}`,
        orderId: order.id,
        senderId: creator.userId,
        body: messageBody,
        attachmentUrl: profileUrl,
        createdAt: new Date().toISOString()
      },
      ...data.messages
    ],
    activityEvents: [activityEvent, ...data.activityEvents]
  };
  saveMarketplaceData(next);
  return order;
}

export function updateOrderStatus(orderId: string, status: Order["status"], input: { resultReason?: string; resultNote?: string } = {}) {
  const remote = requestJson<Order>(`/api/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, ...input })
  });

  if (remote) {
    syncFromApi();
    return;
  }

  const data = loadMarketplaceData();
  const order = data.orders.find((item) => item.id === orderId);
  const creator = order ? data.creators.find((item) => item.id === order.creatorId) : null;
  const creatorUserId = creator?.userId ?? "u-creator-1";
  const actorRole: ActivityEvent["role"] = status === "approved" || status === "not_fit" || status === "no_response" || status === "cancelled" ? "buyer" : "creator";
  const actorId = actorRole === "buyer" ? order?.buyerId ?? "u-buyer-1" : creatorUserId;
  const eventType: ActivityEvent["eventType"] = status === "approved" ? "approve_order" : status === "delivered" ? "deliver_order" : "send_message";
  const activityEvent: ActivityEvent = {
    id: `a-${Date.now()}`,
    userId: actorId,
    role: actorRole,
    eventType,
    targetType: "order",
    targetId: orderId,
    note: input.resultReason || input.resultNote || status,
    createdAt: new Date().toISOString()
  };
  const next: MarketplaceData = {
    ...data,
    orders: data.orders.map((order) => (
      order.id === orderId
        ? {
            ...order,
            status,
            resultReason: input.resultReason || order.resultReason,
            resultNote: input.resultNote || order.resultNote,
            resultUpdatedAt: new Date().toISOString()
          }
        : order
    )),
    activityEvents: [activityEvent, ...data.activityEvents]
  };
  saveMarketplaceData(next);
}

export function approveCurrentAccount(role: "buyer" | "creator") {
  const data = loadMarketplaceData();
  const session = readAuthSession();
  const target =
    role === "buyer"
      ? data.buyerProfiles?.find((profile) => profile.userId === session?.userId || profile.id === "bp-self")
      : data.creators.find((creator) => creator.userId === session?.userId || creator.id === "c-self");
  const remote = target
    ? requestJson(`/api/admin/verify`, {
        method: "PATCH",
        body: JSON.stringify({ subjectType: role, id: target.id, verified: true })
      })
    : null;

  if (remote) {
    syncFromApi();
    return;
  }

  const next: MarketplaceData =
    role === "buyer"
      ? {
          ...data,
          buyerProfiles: (data.buyerProfiles ?? []).map((profile) =>
            profile.userId === "u-buyer-1" ? { ...profile, verified: true } : profile
          )
        }
      : {
          ...data,
          creators: data.creators.map((creator) =>
            creator.id === "c-self" || creator.userId === "u-creator-self" ? { ...creator, verified: true } : creator
          )
        };
  saveMarketplaceData(next);
}

export async function upsertCurrentBuyerProfile(input: {
  companyName: string;
  displayName: string;
  avatarUrl: string;
  profileSlogan: string;
  industry: string;
  location: string;
  companyIntro: string;
  verificationType: VerificationType;
  contactEmail: string;
  contactPhone: string;
  websiteUrl: string;
  socialUrl: string;
  serviceArea: string;
  businessLicenseFile: string;
  qualificationFiles: string[];
}) {
  const session = readAuthSession();
  const userId = session?.userId ?? "u-buyer-1";
  const profileId = `bp-${userId}`;
  const remote = await requestJsonAsync<BuyerProfile>("/api/buyers", {
    method: "POST",
    body: JSON.stringify({
      id: profileId,
      userId,
      ...input
    })
  }, session?.accessToken ? {
    throwOnError: true,
    fallbackErrorMessage: "主体资料保存失败，请重新登录后再试。"
  } : undefined);

  if (remote) {
    if (session) saveAuthSession({ ...session, status: remote.verified ? "approved" : "registered" });
    cacheBuyerProfile(remote);
    return remote;
  }

  const data = loadMarketplaceData();
  const now = new Date().toISOString();
  const existing = (data.buyerProfiles ?? []).find((item) => item.id === profileId || item.userId === userId);
  const draftProfile: BuyerProfile = {
    id: profileId,
    userId,
    companyName: input.companyName,
    displayName: input.displayName,
    avatarUrl: input.avatarUrl,
    profileSlogan: input.profileSlogan,
    industry: input.industry,
    location: input.location,
    companyIntro: input.companyIntro,
    verificationType: input.verificationType,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    websiteUrl: input.websiteUrl,
    socialUrl: input.socialUrl,
    serviceArea: input.serviceArea,
    businessLicenseFile: input.businessLicenseFile,
    qualificationFiles: input.qualificationFiles,
    verified: false,
    rejectedReason: existing?.rejectedReason,
    cover: "linear-gradient(135deg, #153f31, #2457c5)"
  };
  const resetVerifiedReview = Boolean(existing?.verified) && buyerVerificationFieldsChanged(existing, draftProfile);
  const profile: BuyerProfile = existing?.verified && resetVerifiedReview
    ? keepPublishedBuyerWithDraft(existing, draftProfile)
    : {
        ...draftProfile,
        verified: existing?.verified ?? false,
        rejectedReason: existing?.rejectedReason,
        reviewDraft: undefined,
        reviewDraftSubmittedAt: undefined,
        reviewDraftRejectedReason: undefined
      };
  const users = data.users.map((user) => (user.id === userId ? { ...user, name: input.companyName, email: input.contactEmail } : user));
  const buyerProfiles = [profile, ...(data.buyerProfiles ?? []).filter((item) => item.id !== profileId && item.userId !== userId)];
  const activityEvent: ActivityEvent = {
    id: `a-${Date.now()}`,
    userId,
    role: "buyer",
    eventType: "browse",
    targetType: "buyer_profile",
    targetId: profileId,
    createdAt: now
  };
  const next: MarketplaceData = {
    ...data,
    users,
    buyerProfiles,
    activityEvents: [activityEvent, ...data.activityEvents]
  };
  saveMarketplaceData(next);
  if (session) saveAuthSession({ ...session, status: profile.verified ? "approved" : "registered" });
  return profile;
}

export async function upsertUnifiedSubjectProfile(input: {
  companyName: string;
  displayName: string;
  avatarUrl: string;
  profileSlogan: string;
  industry: string;
  location: string;
  companyIntro: string;
  verificationType: VerificationType;
  contactEmail: string;
  contactPhone: string;
  websiteUrl: string;
  socialUrl: string;
  serviceArea: string;
  businessLicenseFile: string;
  qualificationFiles: string[];
}) {
  const buyerProfile = await upsertCurrentBuyerProfile(input);
  const session = readAuthSession();
  const data = loadLocalMarketplaceData();
  const creator = data.creators.find((item) => item.userId === session?.userId);

  if (!creator || !session) {
    return buyerProfile;
  }

  const mergedCreator = {
    ...creator,
    name: input.companyName,
    displayName: input.displayName,
    avatarUrl: input.avatarUrl,
    profileSlogan: input.profileSlogan,
    location: input.location,
    bio: creator.bio || input.companyIntro,
    identityType: input.verificationType,
    verificationType: input.verificationType,
    credentialFile: input.businessLicenseFile,
    qualificationFiles: input.qualificationFiles,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    websiteUrl: input.websiteUrl,
    socialUrl: input.socialUrl,
    serviceArea: input.serviceArea
  };

  const remote = await requestJsonAsync<CreatorProfile>("/api/creators", {
    method: "POST",
    body: JSON.stringify(mergedCreator)
  }, session?.accessToken ? {
    throwOnError: true,
    fallbackErrorMessage: "主体资料同步失败，请稍后再试。"
  } : undefined);

  if (remote) {
    return buyerProfile;
  }

  const next = loadMarketplaceData();
  saveMarketplaceData({
    ...next,
    creators: [mergedCreator, ...next.creators.filter((item) => item.id !== creator.id && item.userId !== creator.userId)]
  });
  return buyerProfile;
}

export async function upsertCurrentCreatorProfile(input: {
  name: string;
  title: string;
  location: string;
  bio: string;
  resume: string;
  skills: string[];
  categories: ProjectCategory[];
  portfolio: string[];
  portfolioItems?: PortfolioItem[];
  servicePackages?: ServicePackage[];
  priceMin: number;
  priceMax: number;
  responseTime: string;
  identityType: VerificationType;
  avatarUrl: string;
  displayName: string;
  profileSlogan: string;
  websiteUrl: string;
  socialUrl: string;
  serviceArea: string;
  credentialFile: string;
  qualificationFiles: string[];
  contactEmail: string;
  contactPhone: string;
  trainingProfile?: TrainingProfile;
}) {
  const session = readAuthSession();
  const userId = session?.userId ?? "u-creator-self";
  const profileId = `c-${userId}`;
  const remote = await requestJsonAsync<CreatorProfile>("/api/creators", {
    method: "POST",
    body: JSON.stringify({
      id: profileId,
      userId,
      verificationType: input.identityType,
      ...input
    })
  }, session?.accessToken ? {
    throwOnError: true,
    fallbackErrorMessage: "服务主页保存失败，请重新登录后再试。"
  } : undefined);

  if (remote) {
    if (session) saveAuthSession({ ...session, status: remote.verified ? "approved" : "registered" });
    cacheCreatorProfile(remote);
    return remote;
  }

  const data = loadLocalMarketplaceData();
  const now = new Date().toISOString();
  const existing = data.creators.find((item) => item.id === profileId || item.userId === userId);
  const draftProfile: CreatorProfile = {
    id: profileId,
    userId,
    name: input.name,
    title: input.title,
    location: input.location,
    bio: input.bio,
    resume: input.resume,
    skills: input.skills,
    categories: input.categories,
    portfolio: input.portfolio,
    portfolioItems: input.portfolioItems,
    servicePackages: input.servicePackages,
    priceMin: input.priceMin,
    priceMax: input.priceMax,
    completedProjects: 0,
    rating: 4.6,
    responseTime: input.responseTime,
    verified: false,
    identityType: input.identityType,
    verificationType: input.identityType,
    avatarUrl: input.avatarUrl,
    displayName: input.displayName,
    profileSlogan: input.profileSlogan,
    websiteUrl: input.websiteUrl,
    socialUrl: input.socialUrl,
    serviceArea: input.serviceArea,
    credentialFile: input.credentialFile,
    qualificationFiles: input.qualificationFiles,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    trainingProfile: input.trainingProfile,
    cover: "linear-gradient(135deg, #153f31, #2f7c5f 46%, #f0b35a)"
  };
  const resetVerifiedReview = Boolean(existing?.verified) && creatorVerificationFieldsChanged(existing, draftProfile);
  const profile: CreatorProfile = existing?.verified && resetVerifiedReview
    ? keepPublishedCreatorWithDraft(existing, draftProfile)
    : {
        ...draftProfile,
        verified: existing?.verified ?? false,
        rejectedReason: existing?.rejectedReason,
        reviewDraft: undefined,
        reviewDraftSubmittedAt: undefined,
        reviewDraftRejectedReason: undefined
      };

  const existingUser = data.users.some((user) => user.id === userId);
  const users = existingUser
    ? data.users.map((user) => (user.id === userId ? { ...user, name: input.name } : user))
    : [
        {
          id: userId,
          name: input.name,
          email: input.contactEmail || "creator@demo.local",
          role: "creator" as const,
          createdAt: now.slice(0, 10)
        },
        ...data.users
      ];
  const creators = [profile, ...data.creators.filter((creator) => creator.id !== profileId && creator.userId !== userId)];
  const activityEvent: ActivityEvent = {
    id: `a-${Date.now()}`,
    userId,
    role: "creator",
    eventType: "browse",
    targetType: "creator",
    targetId: profileId,
    createdAt: now
  };
  const next: MarketplaceData = {
    ...data,
    users,
    creators,
    activityEvents: [activityEvent, ...data.activityEvents]
  };
  saveMarketplaceData(next);
  if (session) saveAuthSession({ ...session, status: profile.verified ? "approved" : "registered" });
  return profile;
}

export function verifySubject(subjectType: "buyer" | "creator", id: string, verified = true, rejectedReason?: string) {
  const remote = requestJson(`/api/admin/verify`, {
    method: "PATCH",
    body: JSON.stringify({ subjectType, id, verified, rejectedReason })
  }, {
    throwOnError: true,
    fallbackErrorMessage: "主体审核失败，请稍后重试。"
  });

  if (remote) {
    syncFromApi();
    const session = readAuthSession();
    if (session) saveAuthSession({ ...session, status: "approved" });
    return true;
  }

  throw new Error("主体审核失败，请稍后重试。");
}

export async function submitReview(subjectType: "buyer" | "creator", id: string) {
  const remote = await requestJsonAsync<BuyerProfile | CreatorProfile>("/api/review-submission", {
    method: "POST",
    body: JSON.stringify({ subjectType, id })
  });

  if (remote) {
    const session = readAuthSession();
    if (session) saveAuthSession({ ...session, status: "pending_review" });
    return remote;
  }

  const data = loadLocalMarketplaceData();
  const now = new Date().toISOString();
  const next: MarketplaceData =
    subjectType === "buyer"
      ? (() => {
          const profile = (data.buyerProfiles ?? []).find((item) => item.id === id || item.userId === id);
          const activityEvent: ActivityEvent = {
            id: `a-${Date.now()}`,
            userId: profile?.userId ?? readAuthSession()?.userId ?? "u-buyer-1",
            role: "buyer",
            eventType: "submit_review",
            targetType: "buyer_profile",
            targetId: profile?.id ?? id,
            note: profile?.reviewDraft ? "用户提交认证变更审核" : "用户提交认证审核",
            createdAt: now
          };

          return {
            ...data,
            buyerProfiles: (data.buyerProfiles ?? []).map((item) =>
              item.id === id || item.userId === id
                ? item.verified && item.reviewDraft
                  ? {
                      ...item,
                      reviewDraftSubmittedAt: now,
                      reviewDraftRejectedReason: undefined
                    }
                  : { ...item, verified: false, rejectedReason: undefined }
                : item
            ),
            activityEvents: [activityEvent, ...data.activityEvents]
          };
        })()
      : (() => {
          const creator = data.creators.find((item) => item.id === id || item.userId === id);
          const activityEvent: ActivityEvent = {
            id: `a-${Date.now()}`,
            userId: creator?.userId ?? readAuthSession()?.userId ?? "u-creator-self",
            role: "creator",
            eventType: "submit_review",
            targetType: "creator",
            targetId: creator?.id ?? id,
            note: creator?.reviewDraft ? "用户提交认证变更审核" : "用户提交认证审核",
            createdAt: now
          };

          return {
            ...data,
            creators: data.creators.map((item) =>
              item.id === id || item.userId === id
                ? item.verified && item.reviewDraft
                  ? {
                      ...item,
                      reviewDraftSubmittedAt: now,
                      reviewDraftRejectedReason: undefined
                    }
                  : { ...item, verified: false, rejectedReason: undefined }
                : item
            ),
            activityEvents: [activityEvent, ...data.activityEvents]
          };
        })();

  saveMarketplaceData(next);
  const session = readAuthSession();
  if (session) saveAuthSession({ ...session, status: "pending_review" });
  return true;
}

export function reviewProject(projectId: string, status: "open" | "rejected" | "removed", rejectedReason?: string) {
  const remote = requestJson<Project>(`/api/admin/projects/${projectId}/review`, {
    method: "PATCH",
    body: JSON.stringify({ status, rejectedReason })
  }, {
    throwOnError: true,
    fallbackErrorMessage: "需求审核失败，请稍后重试。"
  });

  if (remote) {
    syncFromApi();
    return remote;
  }

  throw new Error("需求审核失败，请稍后重试。");
}

export function submitReport(input: { targetType: AbuseReport["targetType"]; targetId: string; reason: string }) {
  const session = readAuthSession();
  const remote = requestJson<AbuseReport>("/api/reports", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      reporterId: session?.userId
    })
  });

  if (remote) {
    syncFromApi();
    return remote;
  }

  return null;
}

export function submitFeedback(input: { page: string; category: TrialFeedback["category"]; content: string; rating?: number }) {
  const session = readAuthSession();
  const remote = requestJson<TrialFeedback>("/api/feedback", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      userId: session?.userId
    })
  });

  if (remote) {
    syncFromApi();
    return remote;
  }

  return null;
}

export function resolveFeedback(feedbackId: string, status: "reviewing" | "resolved" | "dismissed", resolution?: string) {
  const remote = requestJson<TrialFeedback>(`/api/admin/feedback/${feedbackId}`, {
    method: "PATCH",
    body: JSON.stringify({ status, resolution })
  }, {
    throwOnError: true,
    fallbackErrorMessage: "试用反馈处理失败，请稍后重试。"
  });

  if (remote) {
    syncFromApi();
    return remote;
  }

  throw new Error("试用反馈处理失败，请稍后重试。");
}

export function resolveReport(reportId: string, status: "reviewing" | "resolved" | "dismissed", resolution?: string) {
  const remote = requestJson<AbuseReport>(`/api/admin/reports/${reportId}`, {
    method: "PATCH",
    body: JSON.stringify({ status, resolution })
  }, {
    throwOnError: true,
    fallbackErrorMessage: "举报处理失败，请稍后重试。"
  });

  if (remote) {
    syncFromApi();
    return remote;
  }

  throw new Error("举报处理失败，请稍后重试。");
}

export function suspendUser(userId: string, suspended = true, reason?: string) {
  const remote = requestJson<User>(`/api/admin/users/${userId}/suspend`, {
    method: "PATCH",
    body: JSON.stringify({ suspended, reason })
  }, {
    throwOnError: true,
    fallbackErrorMessage: "账号状态更新失败，请稍后重试。"
  });

  if (remote) {
    syncFromApi();
    return remote;
  }

  throw new Error("账号状态更新失败，请稍后重试。");
}

export function createOrderMessage(orderId: string, input: { senderId: string; body: string; attachmentUrl?: string }) {
  const remote = requestJson(`/api/orders/${orderId}/messages`, {
    method: "POST",
    body: JSON.stringify(input)
  });

  if (remote) {
    syncFromApi();
    return true;
  }

  return false;
}

export function getProjectMatches(data: MarketplaceData, projectId: string): ProjectMatch[] {
  const remote = requestJson<{ matches: ProjectMatch[] }>(`/api/projects/${projectId}/matches`);
  if (remote) {
    return remote.matches;
  }

  const project = data.projects.find((item) => item.id === projectId);
  if (!project) return [];

  const stored = data.matches.filter((item) => item.projectId === projectId);
  if (stored.length >= 10) {
    return stored.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  return recommendCreators(project, data.creators, 10);
}

export function resetDemoData() {
  const remote = requestJson<MarketplaceData>("/api/reset", {
    method: "POST"
  });

  if (remote) {
    saveMarketplaceData(remote);
    return;
  }

  saveMarketplaceData(createEmptyMarketplaceData());
}
