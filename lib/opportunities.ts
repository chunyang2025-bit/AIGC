import { BuyerProfile, CreatorProfile, MarketplaceData, Project } from "./types";
import { trainingFormatLabel } from "./training";

export function creatorProjectScore(creator: CreatorProfile | undefined, project: Project) {
  if (!creator) return 0;
  let score = 0;
  if (creator.categories.includes(project.category)) score += 45;
  const text = `${project.title} ${project.description} ${(project.tags ?? []).join(" ")}`.toLowerCase();
  const skillHits = creator.skills.filter((skill) => text.includes(skill.toLowerCase())).length;
  score += Math.min(skillHits * 8, 24);
  if (project.budget >= creator.priceMin && (!creator.priceMax || project.budget <= creator.priceMax)) score += 18;
  if (project.agentBrief) score += 7;
  if (project.referenceFile) score += 3;
  if (project.qualificationFile) score += 3;
  return Math.min(score, 100);
}

export function projectDecisionItems(project: Project, buyerProfile?: BuyerProfile) {
  return [
    { label: "预算明确", done: project.budget > 0 },
    { label: "派单方已认证", done: Boolean(buyerProfile?.verified) },
    { label: "需求已结构化", done: Boolean(project.agentBrief) },
    { label: "有参考资料", done: Boolean(project.referenceFile) },
    { label: "联系方式完整", done: Boolean(project.contactEmail || project.contactPhone) },
    { label: "交付周期明确", done: Boolean(project.deadline) }
  ];
}

export function decisionScore(project: Project, buyerProfile?: BuyerProfile) {
  const items = projectDecisionItems(project, buyerProfile);
  return Math.round((items.filter((item) => item.done).length / items.length) * 100);
}

export function trainingOpportunityItems(creator: CreatorProfile | undefined, project: Project, buyerProfile?: BuyerProfile) {
  const requirement = project.trainingRequirement;
  const profile = creator?.trainingProfile;
  const requirementTopics = requirement?.topics ?? [];
  const creatorTopics = profile?.topics ?? [];
  const topicMatched = requirementTopics.length
    ? requirementTopics.some((topic) => creatorTopics.includes(topic))
    : project.category === "AIGC Training";
  const city = requirement?.city?.trim();
  const creatorCities = profile?.cities ?? [];
  const cityMatched = !city || creatorCities.some((item) => item === "全国" || item.includes(city) || city.includes(item));
  const budgetMatched = Boolean(creator && project.budget >= creator.priceMin && (!creator.priceMax || project.budget <= creator.priceMax));

  return [
    { label: "培训主题匹配", done: topicMatched },
    { label: "培训形式支持", done: Boolean(requirement?.format && profile?.formats.includes(requirement.format)) },
    { label: "城市/线上可承接", done: cityMatched },
    { label: "预算匹配报价", done: budgetMatched },
    { label: "需要定制案例", done: !requirement?.needCustomCases || Boolean(profile?.customizable) },
    { label: "课件材料可交付", done: !requirement?.needMaterials || Boolean(profile?.materials.length) },
    { label: "需求方已认证", done: Boolean(buyerProfile?.verified) },
    { label: "目标对象清楚", done: Boolean(requirement?.goal && requirement.audience) }
  ];
}

export function trainingOpportunityScore(creator: CreatorProfile | undefined, project: Project, buyerProfile?: BuyerProfile) {
  const items = trainingOpportunityItems(creator, project, buyerProfile);
  return Math.round((items.filter((item) => item.done).length / items.length) * 100);
}

export function trainingProposalText(creator: CreatorProfile | undefined, project: Project) {
  const requirement = project.trainingRequirement;
  const profile = creator?.trainingProfile;
  const topics = requirement?.topics.length ? requirement.topics : profile?.topics.slice(0, 3) ?? ["AIGC工具应用", "业务场景实操"];
  const modules = topics.slice(0, 4).map((topic, index) => `${index + 1}. ${topic}：结合岗位场景讲解方法，并安排实操练习。`);
  const materials = profile?.materials.length ? profile.materials.join("、") : "课程大纲、课件、练习任务和工具清单";
  const pricing = profile?.pricingNote || (creator ? `${creator.priceMin}-${creator.priceMax} 元区间，可按人数和定制深度确认` : "可按培训时长、人数和定制深度报价");
  const format = trainingFormatLabel(requirement?.format);
  const audience = requirement?.audience || "参训学员";
  const city = requirement?.city ? `，地点可按${requirement.city}安排` : "";
  const duration = requirement?.duration ? `，建议时长为${requirement.duration}` : "";

  return [
    `你好，我看过「${project.title}」这个培训需求。`,
    creator ? `我是${creator.name}，主要提供${creator.categories.join("、")}相关培训服务。` : "",
    `初步判断可以围绕${audience}设计${format}${city}${duration}。`,
    `我建议先按以下结构出一版课程方案：\n${modules.join("\n")}`,
    `我可以提供的材料包括：${materials}。`,
    `报价方式：${pricing}。`,
    "为了让方案更贴合业务，建议先确认参训人数、学员基础、是否需要企业内部案例、课后答疑边界，以及可预约的15分钟沟通时间。"
  ].filter(Boolean).join("\n\n");
}

export function projectTrainingConversion(project: Project) {
  if (project.category === "AIGC Training") {
    return {
      label: "先做样品再培训",
      description: "如果需求很急、需要定制案例或团队还没有标准样例，可以先找服务方做一版样品，再把样品沉淀成培训案例。",
      href: "/post-project",
      reasons: [
        project.urgency === "urgent" || project.urgency === "this_week" ? "时间紧，适合先找人落地样品" : "",
        project.trainingRequirement?.needCustomCases ? "需要企业定制案例" : "",
        project.trainingRequirement?.needMaterials ? "需要课件/练习材料" : ""
      ].filter(Boolean)
    };
  }

  const text = `${project.title} ${project.description} ${(project.tags ?? []).join(" ")}`.toLowerCase();
  const keywordHit = ["培训", "教", "学习", "团队", "内部", "流程", "提效", "提示词", "陪跑"].some((keyword) => text.includes(keyword.toLowerCase()));
  const worthTraining = Boolean(project.longTerm || project.useCase === "training" || project.useCase === "internal_efficiency" || keywordHit);

  return {
    label: "同时找培训/陪跑",
    description: worthTraining
      ? "这个需求可能会重复发生，适合让服务方先做交付，也同步找讲师把流程教给团队。"
      : "如果后续想让团队自己掌握方法，可以把这个项目复用为培训需求。",
    href: "/post-project?category=AIGC%20Training",
    reasons: [
      project.longTerm ? "有长期合作意向" : "",
      project.useCase === "training" || project.useCase === "internal_efficiency" ? "更偏内部能力建设" : "",
      keywordHit ? "描述里出现团队/流程/提效等培训信号" : ""
    ].filter(Boolean)
  };
}

export function creatorServiceConversion(creator: CreatorProfile | undefined) {
  if (!creator) {
    return {
      label: "完善服务能力",
      description: "先补齐展示页、代表作和报价，系统才能判断适合接单还是提供培训。",
      href: "/provider/profile",
      reasons: ["展示页越完整，转化路径越清楚"]
    };
  }

  const offersTraining = creator.categories.includes("AIGC Training");
  if (offersTraining) {
    return {
      label: "补充落地服务",
      description: "培训后很多需求方会继续要样品、陪跑和流程搭建。可以补充项目落地能力，让培训线索继续转成接单机会。",
      href: "/provider/profile",
      reasons: [
        creator.trainingProfile?.caseStudies.length ? "已有培训案例" : "",
        creator.trainingProfile?.materials.length ? "已有课件/材料" : "",
        creator.categories.length === 1 ? "目前只填写了培训能力" : "已同时具备培训和交付能力"
      ].filter(Boolean)
    };
  }

  return {
    label: "增加培训服务",
    description: "如果你已经有成熟案例、服务包或固定流程，可以把经验包装成企业培训/陪跑，提升客单价和复购。",
    href: "/provider/profile?category=AIGC%20Training",
    reasons: [
      creator.portfolioItems?.length || creator.portfolio.length ? "已有代表作" : "",
      creator.servicePackages?.length ? "已有服务包报价" : "",
      creator.completedProjects > 0 ? "已有交付记录" : ""
    ].filter(Boolean)
  };
}

export function buyerProjectNextStep(project: Project, data: MarketplaceData, approved: boolean) {
  const leads = data.orders.filter((order) => order.projectId === project.id);
  const matches = data.matches.filter((match) => match.projectId === project.id);
  const hasActiveLead = leads.some((order) => order.status === "active" || order.status === "revision");

  if (!approved) {
    return {
      label: "继续完善认证",
      description: "试运营期间可先使用匹配和邀约；完成认证后会提升信任并进入更正式的展示。",
      href: "/account/profile",
      tone: "gold" as const
    };
  }

  if (project.status === "pending_review") {
    return {
      label: leads.length ? "跟进试用线索" : matches.length ? "邀请推荐创作者" : "查看匹配推荐",
      description: "这是一条历史待审核需求。你仍可先查看推荐并继续沟通，建议后续按新的直接发布流程更新需求状态。",
      href: `/buyer/projects/${project.id}`,
      tone: "green" as const
    };
  }

  if (project.status === "rejected") {
    return {
      label: "修改后重新提交",
      description: project.rejectedReason || "补充资质、联系方式或需求说明后重新提交。",
      href: `/post-project?edit=${project.id}`,
      tone: "gold" as const
    };
  }

  if (project.status === "removed") {
    return {
      label: "重新发布需求",
      description: project.rejectedReason || "确认下架原因后重新整理需求。",
      href: `/post-project?edit=${project.id}`,
      tone: "gold" as const
    };
  }

  if ((project.status === "open" || project.status === "matching") && leads.length === 0) {
    return {
      label: matches.length ? "邀请推荐创作者" : "去信息大厅选人",
      description: matches.length ? `已有 ${matches.length} 位推荐创作者，建议先邀请 2-3 位沟通。` : "当前没有推荐结果，可以手动筛选候选创作者。",
      href: matches.length ? `/buyer/projects/${project.id}` : `/creators?project=${project.id}`,
      tone: "green" as const
    };
  }

  if (hasActiveLead) {
    return {
      label: "跟进沟通线索",
      description: "已有线索处于沟通中，建议及时回复并标记结果。",
      href: `/buyer/projects/${project.id}`,
      tone: "green" as const
    };
  }

  if (leads.length > 0) {
    return {
      label: "复盘线索结果",
      description: "已有沟通记录，可以继续邀约候选人或复盘是否适合。",
      href: `/buyer/projects/${project.id}`,
      tone: "blue" as const
    };
  }

  return {
    label: "查看项目进展",
    description: "查看推荐、候选和合作线索。",
    href: `/buyer/projects/${project.id}`,
    tone: "blue" as const
  };
}

export function buyerActionItems(data: MarketplaceData, buyerId: string, approved: boolean) {
  const projects = data.projects.filter((project) => project.buyerId === buyerId);
  const openProject = projects.find((project) => ["pending_review", "open", "matching", "in_progress"].includes(project.status) && !data.orders.some((order) => order.projectId === project.id));
  const rejectedProject = projects.find((project) => project.status === "rejected" || project.status === "removed");
  const activeLead = data.orders.find((order) => order.buyerId === buyerId && (order.status === "active" || order.status === "revision"));

  return [
    {
      label: approved ? "发布新需求" : "完善主体资料",
      description: approved ? "用 Brief Agent 快速整理一个可匹配的需求。" : "试运营期间可先发布和邀请，完善认证后更容易被信任。",
      href: approved ? "/post-project" : "/account/profile",
      done: approved ? projects.length > 0 : false
    },
    {
      label: openProject ? "邀请推荐创作者" : "等待可邀约需求",
      description: openProject ? `「${openProject.title}」可以先邀请 2-3 位创作者沟通。` : "发布需求后，这里会提醒你邀请候选创作者。",
      href: openProject ? `/buyer/projects/${openProject.id}` : "/buyer",
      done: !openProject
    },
    {
      label: activeLead ? "回复沟通线索" : "暂无待回复线索",
      description: activeLead ? "已有合作线索处于沟通中，建议及时查看消息和结果。" : "产生线索后，这里会提醒你继续推进。",
      href: activeLead ? `/orders/${activeLead.id}` : "/buyer",
      done: !activeLead
    },
    {
      label: rejectedProject ? "处理被驳回需求" : "暂无被驳回需求",
      description: rejectedProject ? `「${rejectedProject.title}」需要修改后重新提交。` : "被驳回或下架的需求会在这里提醒。",
      href: rejectedProject ? `/post-project?edit=${rejectedProject.id}` : "/buyer",
      done: !rejectedProject
    }
  ];
}

export function creatorInviteChecklist(creator: CreatorProfile, project: Project, invited: boolean) {
  return [
    { label: "需求可试用沟通", done: ["pending_review", "open", "matching", "in_progress"].includes(project.status) },
    { label: "接单方已认证", done: creator.verified },
    { label: "服务品类匹配", done: creator.categories.includes(project.category) },
    { label: "意向预算匹配报价", done: project.budget >= creator.priceMin && project.budget <= creator.priceMax },
    { label: "已设置服务包", done: Boolean(creator.servicePackages?.length) },
    { label: "已有代表作", done: Boolean(creator.portfolioItems?.length || creator.portfolio.length) },
    { label: "尚未邀请", done: !invited }
  ];
}

export function sortProjectsForCreator(
  projects: Project[],
  data: MarketplaceData,
  creator: CreatorProfile | undefined,
  mode: "recommended" | "latest" | "budget" | "verified"
) {
  const withBuyer = (project: Project) => data.buyerProfiles?.find((profile) => profile.userId === project.buyerId);
  const list = [...projects];
  if (mode === "latest") {
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  if (mode === "budget") {
    return list.sort((a, b) => b.budget - a.budget);
  }
  if (mode === "verified") {
    return list.sort((a, b) => Number(Boolean(withBuyer(b)?.verified)) - Number(Boolean(withBuyer(a)?.verified)));
  }
  return list.sort((a, b) => creatorProjectScore(creator, b) - creatorProjectScore(creator, a));
}

export function opportunityPools(data: MarketplaceData, creator: CreatorProfile | undefined) {
  const openProjects = data.projects.filter((project) => project.status === "open" || project.status === "matching");
  const matchedProjectIds = new Set(data.matches.filter((match) => match.creatorId === creator?.id).map((match) => match.projectId));
  const creatorLeads = data.orders.filter((order) => order.creatorId === creator?.id);
  const leadProjectIds = new Set(creatorLeads.map((order) => order.projectId));
  const recommended = openProjects
    .filter((project) => matchedProjectIds.has(project.id) || creatorProjectScore(creator, project) >= 55)
    .slice(0, 8);
  const highBudget = [...openProjects].sort((a, b) => b.budget - a.budget).slice(0, 6);
  const dueSoon = [...openProjects]
    .filter((project) => new Date(project.deadline).getTime() >= Date.now())
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 6);
  const contacted = data.projects.filter((project) => leadProjectIds.has(project.id));
  const followUp = creatorLeads.filter((order) => order.status === "active" || order.status === "revision");
  const profileActions = [
    { label: "补充服务包", done: Boolean(creator?.servicePackages?.length), href: "/provider/profile" },
    { label: "补充代表作", done: Boolean(creator?.portfolioItems?.length || creator?.portfolio.length), href: "/provider/profile" },
    { label: "完善联系方式", done: Boolean(creator?.contactEmail || creator?.contactPhone), href: "/provider/profile" }
  ];

  return {
    recommended,
    highBudget,
    dueSoon,
    contacted,
    followUp,
    profileActions
  };
}
