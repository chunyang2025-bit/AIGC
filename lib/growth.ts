import { MarketplaceData, Project } from "./types";

export type ChecklistItem = {
  label: string;
  done: boolean;
  weight: number;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  href: string;
  level: "info" | "warning" | "success";
};

export function scoreChecklist(items: ChecklistItem[]) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  const done = items.filter((item) => item.done).reduce((sum, item) => sum + item.weight, 0);
  return total ? Math.round((done / total) * 100) : 0;
}

export function projectCompleteness(input: {
  title: string;
  description: string;
  budget: number;
  deadline: string;
  referenceFile?: string;
  qualificationFile?: string;
  contactEmail?: string;
  contactPhone?: string;
  tags?: string[];
  agentBrief?: Project["agentBrief"];
}) {
  const items: ChecklistItem[] = [
    { label: "标题清晰", done: input.title.trim().length >= 8, weight: 12 },
    { label: "需求描述充分", done: input.description.trim().length >= 40, weight: 20 },
    { label: "预算明确", done: input.budget >= 500, weight: 14 },
    { label: "沟通期限明确", done: Boolean(input.deadline), weight: 10 },
    { label: "联系方式完整", done: Boolean(input.contactEmail || input.contactPhone), weight: 12 },
    { label: "上传参考资料", done: Boolean(input.referenceFile), weight: 10 },
    { label: "主体/授权资料", done: Boolean(input.qualificationFile), weight: 10 },
    { label: "标签不少于2个", done: (input.tags ?? []).length >= 2, weight: 6 },
    { label: "Agent已拆解", done: Boolean(input.agentBrief), weight: 6 }
  ];

  return {
    score: scoreChecklist(items),
    items
  };
}

export function onboardingCompleteness(input: {
  hasProfile: boolean;
  submittedReview: boolean;
  verified: boolean;
  hasCapability: boolean;
  hasLead: boolean;
}) {
  const items: ChecklistItem[] = [
    { label: "注册账号", done: true, weight: 15 },
    { label: "完善主体主页", done: input.hasProfile, weight: 20 },
    { label: "补充认证资料", done: input.submittedReview, weight: 20 },
    { label: "平台认证通过", done: input.verified, weight: 20 },
    { label: "开通派单/接单能力", done: input.hasCapability, weight: 15 },
    { label: "产生首次沟通", done: input.hasLead, weight: 10 }
  ];

  return {
    score: scoreChecklist(items),
    items
  };
}

export function notificationsForUser(data: MarketplaceData, userId: string) {
  const buyerProfile = data.buyerProfiles?.find((profile) => profile.userId === userId);
  const creatorProfile = data.creators.find((creator) => creator.userId === userId);
  const notifications: NotificationItem[] = [];

  if (!buyerProfile && !creatorProfile) {
    notifications.push({
      id: "profile-missing",
      title: "请先完善主体主页",
      body: "完善名称、城市、联系方式和认证类型后，即可开通派单/接单能力并进入试运营流程。",
      href: "/account/profile",
      level: "warning"
    });
  }

  if ((buyerProfile && !buyerProfile.verified) || (creatorProfile && !creatorProfile.verified)) {
    const reason = buyerProfile?.rejectedReason || creatorProfile?.rejectedReason;
    notifications.push({
      id: "review-pending",
      title: reason ? "认证需补充资料" : "未认证/可试用",
      body: reason || "平台运营会核验主体信息、联系方式和资质材料。试运营期间可以先使用核心功能，正式合作前建议完成认证。",
      href: "/account/profile",
      level: reason ? "warning" : "info"
    });
  }

  if (buyerProfile?.verified || creatorProfile?.verified) {
    notifications.push({
      id: "review-approved",
      title: "主体认证已通过",
      body: "现在可以继续开通派单或接单能力，并发起真实沟通。",
      href: "/account/capabilities",
      level: "success"
    });
  }

  const buyerLeads = data.orders.filter((order) => order.buyerId === userId);
  if (buyerLeads.length) {
    notifications.push({
      id: "buyer-leads",
      title: `你有 ${buyerLeads.length} 条合作线索`,
      body: "有接单方或已邀请对象进入沟通流程，请及时跟进。",
      href: "/buyer",
      level: "info"
    });
  }

  if (creatorProfile) {
    const creatorLeads = data.orders.filter((order) => order.creatorId === creatorProfile.id);
    const matches = data.matches.filter((match) => match.creatorId === creatorProfile.id);
    if (creatorLeads.length) {
      notifications.push({
        id: "creator-leads",
        title: `你有 ${creatorLeads.length} 条接单沟通`,
        body: "派单方已与你建立沟通线索，请及时查看。",
        href: "/provider",
        level: "info"
      });
    }
    if (matches.length) {
      notifications.push({
        id: "creator-matches",
        title: `你有 ${matches.length} 条匹配推荐`,
        body: "系统已把你推荐到相关需求中，可以查看适合沟通的项目。",
        href: "/provider",
        level: "info"
      });
    }
  }

  return notifications;
}

export function windowMetrics(data: MarketplaceData, days: number) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - days);
  const inWindow = (value: string) => {
    const date = new Date(value);
    return date >= start && date <= now;
  };

  return {
    registeredUsers: data.users.filter((user) => user.role !== "admin" && inWindow(user.createdAt)).length,
    activeUsers: new Set(data.activityEvents.filter((event) => inWindow(event.createdAt)).map((event) => event.userId)).size,
    buyerActiveUsers: new Set(data.activityEvents.filter((event) => event.role === "buyer" && inWindow(event.createdAt)).map((event) => event.userId)).size,
    creatorActiveUsers: new Set(data.activityEvents.filter((event) => event.role === "creator" && inWindow(event.createdAt)).map((event) => event.userId)).size,
    projects: data.projects.filter((project) => inWindow(project.createdAt)).length,
    leads: data.orders.filter((order) => inWindow(order.createdAt)).length,
    messages: data.messages.filter((message) => inWindow(message.createdAt)).length
  };
}
