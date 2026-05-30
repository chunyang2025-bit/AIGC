"use client";

import { demoData } from "./demo-data";
import { recommendCreators } from "./matching";
import { ActivityEvent, BuyerProfile, MarketplaceData, Order, Project, ProjectCategory, ProjectMatch, VerificationType } from "./types";
import { readAuthSession, saveAuthSession } from "./auth";

const STORAGE_KEY = "linggong-zhichuang-demo-v2";
const USE_API_KEY = "linggong-zhichuang-use-api";
const API_BASE = "";

function cloneData(data: MarketplaceData): MarketplaceData {
  return JSON.parse(JSON.stringify(data)) as MarketplaceData;
}

function normalizeVerificationType(value?: string): VerificationType | undefined {
  if (value === "company") return "enterprise";
  if (value === "individual") return "individual";
  return value as VerificationType | undefined;
}

function normalizeData(data: MarketplaceData): MarketplaceData {
  const demo = cloneData(demoData);
  return {
    ...data,
    buyerProfiles: (data.buyerProfiles ?? demo.buyerProfiles ?? []).map((profile) => ({
      ...profile,
      displayName: profile.displayName ?? profile.companyName,
      avatarUrl: profile.avatarUrl ?? profile.companyName.slice(0, 1),
      profileSlogan: profile.profileSlogan ?? profile.industry,
      verificationType: normalizeVerificationType(profile.verificationType) ?? "enterprise",
      websiteUrl: profile.websiteUrl ?? "",
      socialUrl: profile.socialUrl ?? "",
      serviceArea: profile.serviceArea ?? profile.location
    })),
    creators: data.creators.map((creator) => ({
      ...creator,
      displayName: creator.displayName ?? creator.name,
      avatarUrl: creator.avatarUrl ?? creator.name.slice(0, 1),
      profileSlogan: creator.profileSlogan ?? creator.title,
      resume: creator.resume ?? `${creator.name} 已完成 ${creator.completedProjects} 个历史项目，擅长 ${creator.skills.slice(0, 3).join("、")}。`,
      verificationType: normalizeVerificationType(creator.verificationType ?? creator.identityType) ?? "individual",
      identityType: normalizeVerificationType(creator.identityType) ?? normalizeVerificationType(creator.verificationType) ?? "individual",
      qualificationFiles: creator.qualificationFiles ?? [],
      websiteUrl: creator.websiteUrl ?? "",
      socialUrl: creator.socialUrl ?? "",
      serviceArea: creator.serviceArea ?? creator.location
    }))
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

function requestJson<T>(path: string, init?: RequestInit): T | null {
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
    return null;
  }

  if (xhr.status < 200 || xhr.status >= 300) return null;

  try {
    const parsed = JSON.parse(xhr.responseText) as { ok: boolean; data?: T };
    return parsed.ok && parsed.data !== undefined ? parsed.data : null;
  } catch {
    return null;
  }
}

export function loadMarketplaceData(): MarketplaceData {
  if (typeof window === "undefined") {
    return normalizeData(cloneData(demoData));
  }

  const remote = requestJson<MarketplaceData>("/api/state");
  if (remote) {
    const normalized = normalizeData(remote);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  const cached = window.localStorage.getItem(STORAGE_KEY);
  if (!cached) {
    const initial = cloneData(demoData);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return normalizeData(initial);
  }

  try {
    const parsed = JSON.parse(cached) as MarketplaceData;
    return normalizeData(parsed);
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return normalizeData(cloneData(demoData));
  }
}

export function saveMarketplaceData(data: MarketplaceData) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}

function syncFromApi() {
  const remote = requestJson<MarketplaceData>("/api/state");
  if (!remote) return null;

  const normalized = normalizeData(remote);
  saveMarketplaceData(normalized);
  return normalized;
}

export function createProject(input: {
  title: string;
  description: string;
  category: ProjectCategory;
  tags?: string[];
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
  const remote = requestJson<{ project: Project; matches: ProjectMatch[] }>("/api/projects", {
    method: "POST",
    body: JSON.stringify({
      buyerId,
      ...input
    })
  });

  if (remote) {
    syncFromApi();
    return remote;
  }

  const data = loadMarketplaceData();
  const project: Project = {
    id: `p-${Date.now()}`,
    buyerId,
    title: input.title,
    description: input.description,
    category: input.category,
    tags: input.tags ?? [],
    budget: input.budget,
    deadline: input.deadline,
    status: "matching",
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

export function inviteCreator(projectId: string, creatorId: string) {
  const remote = requestJson<Order>(`/api/projects/${projectId}/invite`, {
    method: "POST",
    body: JSON.stringify({ creatorId })
  });

  if (remote) {
    syncFromApi();
    return remote;
  }

  const data = loadMarketplaceData();
  const project = data.projects.find((item) => item.id === projectId);
  const creator = data.creators.find((item) => item.id === creatorId);

  if (!project || !creator) {
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
        body: `已邀请 ${creator.name} 沟通需求「${project.title}」。`,
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
    syncFromApi();
    return remote;
  }

  const data = loadMarketplaceData();
  const project = data.projects.find((item) => item.id === projectId);
  const creator = data.creators.find((item) => item.id === creatorId);

  if (!project || !creator) {
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

export function updateOrderStatus(orderId: string, status: Order["status"]) {
  const remote = requestJson<Order>(`/api/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });

  if (remote) {
    syncFromApi();
    return;
  }

  const data = loadMarketplaceData();
  const order = data.orders.find((item) => item.id === orderId);
  const creator = order ? data.creators.find((item) => item.id === order.creatorId) : null;
  const creatorUserId = creator?.userId ?? "u-creator-1";
  const actorRole: ActivityEvent["role"] = status === "approved" ? "buyer" : "creator";
  const actorId = status === "approved" ? order?.buyerId ?? "u-buyer-1" : creatorUserId;
  const eventType: ActivityEvent["eventType"] = status === "approved" ? "approve_order" : status === "delivered" ? "deliver_order" : "send_message";
  const activityEvent: ActivityEvent = {
    id: `a-${Date.now()}`,
    userId: actorId,
    role: actorRole,
    eventType,
    targetType: "order",
    targetId: orderId,
    createdAt: new Date().toISOString()
  };
  const next: MarketplaceData = {
    ...data,
    orders: data.orders.map((order) => (order.id === orderId ? { ...order, status } : order)),
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

export function upsertCurrentBuyerProfile(input: {
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
  const remote = requestJson<BuyerProfile>("/api/buyers", {
    method: "POST",
    body: JSON.stringify({
      id: profileId,
      userId,
      ...input
    })
  });

  if (remote) {
    if (session) saveAuthSession({ ...session, status: "pending_review" });
    syncFromApi();
    return remote;
  }

  const data = loadMarketplaceData();
  const now = new Date().toISOString();
  const profile: BuyerProfile = {
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
    cover: "linear-gradient(135deg, #153f31, #2457c5)"
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
  if (session) saveAuthSession({ ...session, status: "pending_review" });
  return profile;
}

export function upsertUnifiedSubjectProfile(input: {
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
  const buyerProfile = upsertCurrentBuyerProfile(input);
  const session = readAuthSession();
  const data = loadMarketplaceData();
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

  const remote = requestJson<BuyerProfile>("/api/creators", {
    method: "POST",
    body: JSON.stringify(mergedCreator)
  });

  if (remote) {
    syncFromApi();
    return buyerProfile;
  }

  const next = loadMarketplaceData();
  saveMarketplaceData({
    ...next,
    creators: [mergedCreator, ...next.creators.filter((item) => item.id !== creator.id)]
  });
  return buyerProfile;
}

export function upsertCurrentCreatorProfile(input: {
  name: string;
  title: string;
  location: string;
  bio: string;
  resume: string;
  skills: string[];
  categories: ProjectCategory[];
  portfolio: string[];
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
}) {
  const session = readAuthSession();
  const userId = session?.userId ?? "u-creator-self";
  const profileId = `c-${userId}`;
  const remote = requestJson<BuyerProfile>("/api/creators", {
    method: "POST",
    body: JSON.stringify({
      id: profileId,
      userId,
      verificationType: input.identityType,
      ...input
    })
  });

  if (remote) {
    if (session) saveAuthSession({ ...session, status: "pending_review" });
    syncFromApi();
    return remote;
  }

  const data = loadMarketplaceData();
  const now = new Date().toISOString();
  const profile = {
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
    cover: "linear-gradient(135deg, #153f31, #2f7c5f 46%, #f0b35a)"
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
  const creators = [profile, ...data.creators.filter((creator) => creator.id !== profileId)];
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
  if (session) saveAuthSession({ ...session, status: "pending_review" });
  return profile;
}

export function verifySubject(subjectType: "buyer" | "creator", id: string, verified = true, rejectedReason?: string) {
  const remote = requestJson(`/api/admin/verify`, {
    method: "PATCH",
    body: JSON.stringify({ subjectType, id, verified, rejectedReason })
  });

  if (remote) {
    syncFromApi();
    const session = readAuthSession();
    if (session) saveAuthSession({ ...session, status: "approved" });
    return true;
  }

  return false;
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

  saveMarketplaceData(cloneData(demoData));
}
