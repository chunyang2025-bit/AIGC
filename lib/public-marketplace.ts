import { CreatorProfile, MarketplaceData, Project } from "./types";

const artifactNamePatterns = [
  /^验收/,
  /^Smoke\b/i,
  /^Acceptance\b/i,
  /^Review route\b/i,
  /^协作流/,
  /^Flow Creator\b/i,
  /\bsmoke\b/i,
  /\bacceptance\b/i,
  /\breview route\b/i,
  /cache check/i
];

function textMatchesArtifact(value: unknown) {
  const text = String(value || "").trim();
  return Boolean(text && artifactNamePatterns.some((pattern) => pattern.test(text)));
}

function accountMatchesArtifact(value: unknown) {
  const text = String(value || "").trim().toLowerCase();
  return Boolean(text && (
    text.includes(".smoke.") ||
    text.includes(".acceptance.") ||
    text.includes(".review.") ||
    text.includes(".collab.") ||
    text.startsWith("smoke.") ||
    text.startsWith("acceptance.") ||
    text.startsWith("review.") ||
    text.startsWith("collab.")
  ));
}

export function isPublicProjectArtifact(project: Pick<Project, "title" | "contactEmail">) {
  return textMatchesArtifact(project.title) || accountMatchesArtifact(project.contactEmail);
}

export function isPublicCreatorArtifact(
  creator: Pick<CreatorProfile, "name" | "title" | "displayName" | "profileSlogan" | "contactEmail">
) {
  return (
    textMatchesArtifact(creator.name) ||
    textMatchesArtifact(creator.displayName) ||
    textMatchesArtifact(creator.title) ||
    textMatchesArtifact(creator.profileSlogan) ||
    accountMatchesArtifact(creator.contactEmail)
  );
}

export function cleanPublicProjects(projects: Project[], includeTestData = false) {
  return includeTestData ? projects : projects.filter((project) => !isPublicProjectArtifact(project));
}

export function cleanPublicCreators(creators: CreatorProfile[], includeTestData = false) {
  return includeTestData ? creators : creators.filter((creator) => !isPublicCreatorArtifact(creator));
}

export function cleanPublicMarketplaceData(data: MarketplaceData, includeTestData = false): MarketplaceData {
  const projects = cleanPublicProjects(data.projects, includeTestData);
  const creators = cleanPublicCreators(data.creators, includeTestData);
  const visibleProjectIds = new Set(projects.map((project) => project.id));
  const visibleCreatorIds = new Set(creators.map((creator) => creator.id));
  const visibleBuyerIds = new Set(projects.map((project) => project.buyerId));

  return {
    ...data,
    users: data.users.filter((user) => visibleBuyerIds.has(user.id) || creators.some((creator) => creator.userId === user.id)),
    buyerProfiles: (data.buyerProfiles ?? []).filter((profile) => visibleBuyerIds.has(profile.userId)),
    creators,
    projects,
    matches: data.matches.filter((match) => visibleProjectIds.has(match.projectId) && visibleCreatorIds.has(match.creatorId)),
    orders: data.orders.filter((order) => visibleProjectIds.has(order.projectId) && visibleCreatorIds.has(order.creatorId)),
    messages: [],
    reviews: data.reviews.filter((review) => visibleCreatorIds.has(review.creatorId)),
    reports: [],
    feedback: [],
    activityEvents: []
  };
}
