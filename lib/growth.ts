import { hasActiveReviewSubmission } from "./review-status";
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

export type ReviewStage = "empty" | "saved" | "submitted" | "approved" | "rejected";

export type LandingAction = {
  title: string;
  description?: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
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
    { label: "提交认证审核", done: input.submittedReview, weight: 20 },
    { label: "平台认证通过", done: input.verified, weight: 20 },
    { label: "开通派单/接单能力", done: input.hasCapability, weight: 15 },
    { label: "产生首次沟通", done: input.hasLead, weight: 10 }
  ];

  return {
    score: scoreChecklist(items),
    items
  };
}

export function getReviewStage(input: {
  hasProfile: boolean;
  hasDraft?: boolean;
  submitted: boolean;
  verified: boolean;
  rejectedReason?: string;
}): ReviewStage {
  if (!input.hasProfile) return "empty";
  if (input.rejectedReason) return "rejected";
  if (input.hasDraft && input.submitted) return "submitted";
  if (input.hasDraft) return "saved";
  if (input.verified) return "approved";
  if (input.submitted) return "submitted";
  return "saved";
}

export function getLandingAction(input: {
  hasProfile: boolean;
  stage: ReviewStage;
  isBuyer: boolean;
  hasAnyDemand: boolean;
  hasAnyProviderPage: boolean;
  hasAnyLead: boolean;
}): LandingAction {
  if (!input.hasProfile) {
    return {
      title: "先创建主体主页，再进入试运营工作台",
      primaryLabel: "创建主体主页",
      primaryHref: "/account/profile",
      secondaryLabel: "先看公开市场",
      secondaryHref: "/projects"
    };
  }

  if (input.stage === "saved" || input.stage === "rejected") {
    return {
      title: input.stage === "rejected" ? "先补充资料，再重新提交认证审核" : "主页已保存，下一步提交认证审核",
      primaryLabel: "进入认证中心",
      primaryHref: "/account/verification",
      secondaryLabel: input.stage === "rejected" ? "补充主体资料" : "继续试用业务",
      secondaryHref: "/account/verification"
    };
  }

  if (input.stage === "submitted") {
    return {
      title: "资料已进入待审核，先继续试用业务流程",
      primaryLabel: input.isBuyer ? "进入需求方后台" : "进入服务方后台",
      primaryHref: input.isBuyer ? "/buyer" : "/provider",
      secondaryLabel: "查看认证状态",
      secondaryHref: "/account/verification"
    };
  }

  if (input.isBuyer && !input.hasAnyDemand) {
    return {
      title: "发布第一个需求，让系统开始匹配",
      primaryLabel: "发布项目需求",
      primaryHref: "/post-project",
      secondaryLabel: "发布培训需求",
      secondaryHref: "/post-project?category=AIGC%20Training"
    };
  }

  if (!input.isBuyer && !input.hasAnyProviderPage) {
    return {
      title: "生成服务主页，获得展示和匹配入口",
      primaryLabel: "生成服务主页",
      primaryHref: "/provider/profile",
      secondaryLabel: "生成培训主页",
      secondaryHref: "/provider/profile?category=AIGC%20Training"
    };
  }

  if (!input.hasAnyLead) {
    return {
      title: "推进第一条沟通线索",
      primaryLabel: input.isBuyer ? "进入需求方后台" : "进入服务方后台",
      primaryHref: input.isBuyer ? "/buyer" : "/provider",
      secondaryLabel: input.isBuyer ? "查看服务方大厅" : "查看公开需求",
      secondaryHref: input.isBuyer ? "/creators" : "/projects"
    };
  }

  return {
    title: "跟进已有线索，沉淀试运营反馈",
    primaryLabel: input.isBuyer ? "查看我的派单" : "查看我的接单",
    primaryHref: input.isBuyer ? "/buyer" : "/provider",
    secondaryLabel: "提交试用建议",
    secondaryHref: "/account"
  };
}

export function notificationsForUser(data: MarketplaceData, userId: string) {
  const buyerProfile = data.buyerProfiles?.find((profile) => profile.userId === userId);
  const creatorProfile = data.creators.find((creator) => creator.userId === userId);
  const buyerSubmitted = hasActiveReviewSubmission(data, userId, "buyer_profile");
  const creatorSubmitted = hasActiveReviewSubmission(data, userId, "creator");
  const notifications: NotificationItem[] = [];
  const draftReason = buyerProfile?.reviewDraftRejectedReason || creatorProfile?.reviewDraftRejectedReason;
  const hasDraft = Boolean(buyerProfile?.reviewDraft || creatorProfile?.reviewDraft);
  const pendingDraft = (buyerProfile?.reviewDraft && buyerSubmitted) || (creatorProfile?.reviewDraft && creatorSubmitted);

  if (!buyerProfile && !creatorProfile) {
    notifications.push({
      id: "profile-missing",
      title: "请先完善主体主页",
      body: "完善名称、城市、联系方式和认证类型后，即可开通派单/接单能力并进入试运营流程。",
      href: "/account/profile",
      level: "warning"
    });
  }

  if (hasDraft || (buyerProfile && !buyerProfile.verified) || (creatorProfile && !creatorProfile.verified)) {
    const reason = draftReason || buyerProfile?.rejectedReason || creatorProfile?.rejectedReason;
    const pending =
      pendingDraft ||
      (buyerProfile && !buyerProfile.verified && buyerSubmitted) ||
      (creatorProfile && !creatorProfile.verified && creatorSubmitted);
    notifications.push({
      id: "review-pending",
      title: reason ? (hasDraft ? "认证变更需补充资料" : "认证需补充资料") : pending ? (hasDraft ? "认证变更待审核" : "认证待运营审核") : hasDraft ? "认证变更已保存" : "主页资料已保存",
      body:
        reason ||
        (pending
          ? hasDraft
            ? "新的认证变更资料已提交审核，旧的已认证主页会继续展示，审核通过后再替换。"
            : "认证资料已提交，正在等待运营人工核验。试运营期间可以先继续使用发布、匹配和沟通功能。"
          : hasDraft
            ? "你保存了一版认证变更草稿。进入认证中心提交审核后，新的主体信息或资质才会替换当前已认证主页。"
            : "主页资料已经保存，但还没有提交认证审核。进入认证中心点一下“提交认证审核”就会进入待审核队列。"),
      href: "/account/verification",
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
      title: `你有 ${buyerLeads.length} 条沟通线索`,
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
