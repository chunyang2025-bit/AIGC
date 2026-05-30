import { BuyerProfile, CreatorProfile, MarketplaceData, Project } from "./types";

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
  const leadProjectIds = new Set(data.orders.filter((order) => order.creatorId === creator?.id).map((order) => order.projectId));
  const recommended = openProjects
    .filter((project) => matchedProjectIds.has(project.id) || creatorProjectScore(creator, project) >= 55)
    .slice(0, 8);
  const highBudget = [...openProjects].sort((a, b) => b.budget - a.budget).slice(0, 6);
  const contacted = data.projects.filter((project) => leadProjectIds.has(project.id));

  return {
    recommended,
    highBudget,
    contacted
  };
}
