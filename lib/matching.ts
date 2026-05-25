import { CreatorProfile, Project, ProjectMatch } from "./types";

export function scoreCreator(project: Project, creator: CreatorProfile): ProjectMatch {
  const categoryScore = creator.categories.includes(project.category) ? 45 : 0;
  const budgetCenter = (creator.priceMin + creator.priceMax) / 2;
  const budgetDistance = Math.abs(project.budget - budgetCenter);
  const budgetScore = Math.max(0, 30 - Math.round((budgetDistance / Math.max(project.budget, 1)) * 30));
  const skillScore = creator.skills.some((skill) => project.description.toLowerCase().includes(skill.toLowerCase()))
    ? 10
    : creator.categories.includes(project.category)
      ? 6
      : 0;
  const proofScore = Math.min(10, Math.round(creator.completedProjects / 8)) + Math.min(5, Math.round((creator.rating - 4) * 5));
  const score = Math.min(99, categoryScore + budgetScore + skillScore + proofScore);

  const reasonParts = [
    creator.categories.includes(project.category) ? "服务品类匹配" : "具备相邻品类经验",
    project.budget >= creator.priceMin && project.budget <= creator.priceMax ? "预算在报价范围内" : "预算接近报价范围",
    `已完成${creator.completedProjects}单`
  ];
  const risk = creator.verified
    ? creator.responseTime.includes("天")
      ? "响应时间偏长，适合非紧急项目。"
      : "履约风险较低，可优先邀约。"
    : "创作者尚未完成平台认证，建议先确认案例和可沟通时间。";
  const nextStep = project.agentBrief
    ? `建议先确认「${project.agentBrief.deliverables[0]}」的样式参考和修改轮次。`
    : "建议先确认参考案例、成果范围和后续沟通方式。";

  return {
    id: `match-${project.id}-${creator.id}`,
    projectId: project.id,
    creatorId: creator.id,
    score,
    reason: reasonParts.join("，") + "。",
    risk,
    nextStep
  };
}

export function recommendCreators(project: Project, creators: CreatorProfile[], count = 10) {
  return creators
    .map((creator) => scoreCreator(project, creator))
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}
