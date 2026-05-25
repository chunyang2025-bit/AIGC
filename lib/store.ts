"use client";

import { demoData } from "./demo-data";
import { recommendCreators } from "./matching";
import { ActivityEvent, BuyerProfile, MarketplaceData, Order, Project, ProjectCategory, ProjectMatch, VerificationType } from "./types";

const STORAGE_KEY = "linggong-zhichuang-demo-v2";

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

export function loadMarketplaceData(): MarketplaceData {
  if (typeof window === "undefined") {
    return normalizeData(cloneData(demoData));
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

export function createProject(input: {
  title: string;
  description: string;
  category: ProjectCategory;
  budget: number;
  deadline: string;
  referenceFile?: string;
  qualificationFile?: string;
  contactEmail?: string;
  contactPhone?: string;
  agentBrief?: Project["agentBrief"];
}) {
  const data = loadMarketplaceData();
  const project: Project = {
    id: `p-${Date.now()}`,
    buyerId: "u-buyer-1",
    title: input.title,
    description: input.description,
    category: input.category,
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
    userId: "u-buyer-1",
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
  const data = loadMarketplaceData();
  const now = new Date().toISOString();
  const userId = "u-buyer-1";
  const profileId = "bp-self";
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
  return profile;
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
  const data = loadMarketplaceData();
  const now = new Date().toISOString();
  const userId = "u-creator-self";
  const profileId = "c-self";
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
  return profile;
}

export function getProjectMatches(data: MarketplaceData, projectId: string): ProjectMatch[] {
  const project = data.projects.find((item) => item.id === projectId);
  if (!project) return [];

  const stored = data.matches.filter((item) => item.projectId === projectId);
  if (stored.length >= 10) {
    return stored.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  return recommendCreators(project, data.creators, 10);
}

export function resetDemoData() {
  saveMarketplaceData(cloneData(demoData));
}
