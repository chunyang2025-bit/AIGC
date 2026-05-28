import { monthlyActiveUsers, activeOrders } from "../analytics";
import { draftProjectBrief } from "../brief-agent";
import { recommendCreators } from "../matching";
import {
  ActivityEvent,
  BuyerProfile,
  CreatorProfile,
  MarketplaceData,
  Message,
  Order,
  OrderStatus,
  Project,
  ProjectCategory,
  UserRole
} from "../types";
import { asNumber, asProjectCategory, asStringArray, asVerificationType } from "./validation";

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addActivity(
  data: MarketplaceData,
  input: Pick<ActivityEvent, "userId" | "role" | "eventType" | "targetType" | "targetId">
) {
  data.activityEvents.unshift({
    id: id("a"),
    createdAt: new Date().toISOString(),
    ...input
  });
}

export function publicUser<T extends { password?: string }>(user: T) {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

export function publicMarketplaceData(data: MarketplaceData): MarketplaceData {
  return {
    ...data,
    users: data.users.map((user) => publicUser(user))
  };
}

export function getPublicMarketplace(data: MarketplaceData) {
  return {
    projects: data.projects.filter((project) => project.status === "open" || project.status === "matching"),
    creators: data.creators.filter((creator) => creator.verified),
    metrics: getAdminMetrics(data)
  };
}

export function registerUser(data: MarketplaceData, input: Record<string, unknown>) {
  const role = ["buyer", "creator", "admin"].includes(String(input.role))
    ? (String(input.role) as UserRole)
    : "buyer";
  if (role === "admin") {
    return null;
  }
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
  const code = String(input.code || "");
  let user = data.users.find((item) =>
    (item.email === account || item.account === account || item.phone === account) &&
    (role === "admin" ? item.role === "admin" : item.role !== "admin")
  );

  const codeMatches = authMethod === "code" && /^\d{6}$/.test(code) && account && !account.includes("@");
  if (!user && codeMatches && role && role !== "admin") {
    user = {
      id: id("u"),
      name: String(input.name || account || "新用户"),
      account,
      phone: account,
      email: `${account}@phone.aigclancer.local`,
      role,
      createdAt: today()
    };
    data.users.unshift(user);
  }

  const passwordMatches = user ? user.password ? user.password === password : password.length >= 6 : false;
  if (user && (authMethod === "code" ? codeMatches : passwordMatches)) {
    addActivity(data, {
      userId: user.id,
      role: role ?? user.role,
      eventType: "login"
    });
  }

  return user && (authMethod === "code" ? codeMatches : passwordMatches) ? user : null;
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
  const project: Project = {
    id: id("p"),
    buyerId,
    title: String(input.title || "未命名需求"),
    description: String(input.description || ""),
    category: asProjectCategory(input.category),
    tags: asStringArray(input.tags),
    budget: asNumber(input.budget, 3000),
    deadline: String(input.deadline || today()),
    status: "matching",
    referenceFile: input.referenceFile ? String(input.referenceFile) : undefined,
    qualificationFile: input.qualificationFile ? String(input.qualificationFile) : undefined,
    contactEmail: input.contactEmail ? String(input.contactEmail) : undefined,
    contactPhone: input.contactPhone ? String(input.contactPhone) : undefined,
    agentBrief: input.agentBrief as Project["agentBrief"],
    createdAt: today()
  };
  const matches = recommendCreators(project, data.creators, 10);

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
    return matchedQ && matchedCategory && matchedStatus;
  });
}

export function getProjectMatches(data: MarketplaceData, projectId: string) {
  const project = data.projects.find((item) => item.id === projectId);
  if (!project) return null;

  const stored = data.matches.filter((item) => item.projectId === projectId);
  if (stored.length >= 10) {
    return stored.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  return recommendCreators(project, data.creators, 10);
}

export function inviteCreator(data: MarketplaceData, projectId: string, input: Record<string, unknown>) {
  const creatorId = String(input.creatorId || "");
  const project = data.projects.find((item) => item.id === projectId);
  const creator = data.creators.find((item) => item.id === creatorId);
  if (!project || !creator) return null;

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
  if (!project || !creator) return null;

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
    return matchedQ && matchedCategory && matchedVerified;
  });
}

export function upsertCreator(data: MarketplaceData, input: Record<string, unknown>) {
  const profile: CreatorProfile = {
    id: String(input.id || id("c")),
    userId: String(input.userId || "u-creator-self"),
    name: String(input.name || input.displayName || "新接单方"),
    title: String(input.title || input.profileSlogan || "AIGC创作者"),
    location: String(input.location || ""),
    bio: String(input.bio || ""),
    resume: String(input.resume || ""),
    skills: asStringArray(input.skills),
    categories: asStringArray(input.categories).map(asProjectCategory),
    portfolio: asStringArray(input.portfolio),
    priceMin: asNumber(input.priceMin, 0),
    priceMax: asNumber(input.priceMax, 0),
    completedProjects: asNumber(input.completedProjects, 0),
    rating: asNumber(input.rating, 4.6),
    responseTime: String(input.responseTime || "24小时"),
    verified: false,
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
    cover: String(input.cover || "linear-gradient(135deg, #153f31, #2f7c5f 46%, #f0b35a)")
  };

  data.creators = [profile, ...data.creators.filter((item) => item.id !== profile.id)];
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
  const profile: BuyerProfile = {
    id: String(input.id || id("bp")),
    userId: String(input.userId || "u-buyer-1"),
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
    cover: String(input.cover || "linear-gradient(135deg, #153f31, #2457c5)")
  };

  data.buyerProfiles = [profile, ...(data.buyerProfiles ?? []).filter((item) => item.id !== profile.id)];
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
  if (!["active", "delivered", "revision", "approved"].includes(status)) return null;

  const order = data.orders.find((item) => item.id === orderId);
  if (!order) return null;

  data.orders = data.orders.map((item) => (item.id === orderId ? { ...item, status } : item));
  addActivity(data, {
    userId: order.buyerId,
    role: status === "approved" ? "buyer" : "creator",
    eventType: status === "approved" ? "approve_order" : status === "delivered" ? "deliver_order" : "send_message",
    targetType: "order",
    targetId: orderId
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
      profile.id === idValue || profile.userId === idValue ? { ...profile, verified, rejectedReason } : profile
    );
    return data.buyerProfiles.find((profile) => profile.id === idValue || profile.userId === idValue);
  }

  data.creators = data.creators.map((creator) =>
    creator.id === idValue || creator.userId === idValue ? { ...creator, verified, rejectedReason } : creator
  );
  return data.creators.find((creator) => creator.id === idValue || creator.userId === idValue);
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
