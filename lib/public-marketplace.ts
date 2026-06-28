import { CreatorProfile, MarketplaceData, Project } from "./types";

const demoIdPatterns = [
  /^u-(?:buyer|creator)-\d+$/,
  /^bp-\d+$/,
  /^c-\d+$/,
  /^p-\d+$/,
  /^m-\d+$/,
  /^o-\d+$/,
  /^r-\d+$/
];

export function isDemoSeedId(value: unknown) {
  const text = String(value || "").trim();
  return Boolean(text && demoIdPatterns.some((pattern) => pattern.test(text)));
}

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

function isDemoProject(project: Pick<Project, "id" | "buyerId" | "title" | "contactEmail">) {
  return isDemoSeedId(project.id) || isDemoSeedId(project.buyerId) || textMatchesArtifact(project.title) || accountMatchesArtifact(project.contactEmail);
}

export function isDemoCreator(creator: Pick<CreatorProfile, "id" | "userId" | "name" | "title" | "displayName" | "profileSlogan" | "contactEmail">) {
  return (
    isDemoSeedId(creator.id) ||
    isDemoSeedId(creator.userId) ||
    textMatchesArtifact(creator.name) ||
    textMatchesArtifact(creator.displayName) ||
    textMatchesArtifact(creator.title) ||
    textMatchesArtifact(creator.profileSlogan) ||
    accountMatchesArtifact(creator.contactEmail)
  );
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
  return includeTestData ? projects : projects.filter((project) => !isDemoProject(project) && !isPublicProjectArtifact(project));
}

export function cleanPublicCreators(creators: CreatorProfile[], includeTestData = false) {
  return includeTestData ? creators : creators.filter((creator) => !isDemoCreator(creator) && !isPublicCreatorArtifact(creator));
}

export function cleanPublicMarketplaceData(data: MarketplaceData, includeTestData = false): MarketplaceData {
  const projects = cleanPublicProjects(data.projects, includeTestData);
  const creators = cleanPublicCreators(data.creators, includeTestData);
  const visibleProjectIds = new Set(projects.map((project) => project.id));
  const visibleCreatorIds = new Set(creators.map((creator) => creator.id));
  const visibleBuyerIds = new Set(projects.map((project) => project.buyerId));
  const visibleUserIds = new Set([
    ...Array.from(visibleBuyerIds),
    ...creators.map((creator) => creator.userId)
  ]);

  return {
    ...data,
    users: data.users.filter((user) => visibleUserIds.has(user.id) && !isDemoSeedId(user.id)),
    buyerProfiles: (data.buyerProfiles ?? []).filter((profile) => visibleBuyerIds.has(profile.userId) && !isDemoSeedId(profile.id)),
    creators,
    projects,
    matches: data.matches.filter((match) => visibleProjectIds.has(match.projectId) && visibleCreatorIds.has(match.creatorId) && !isDemoSeedId(match.id)),
    orders: data.orders.filter((order) => visibleProjectIds.has(order.projectId) && visibleCreatorIds.has(order.creatorId) && !isDemoSeedId(order.id)),
    messages: [],
    reviews: data.reviews.filter((review) => visibleCreatorIds.has(review.creatorId) && !isDemoSeedId(review.id)),
    reports: [],
    feedback: [],
    activityEvents: []
  };
}

export function createEmptyMarketplaceData(): MarketplaceData {
  return {
    users: [],
    buyerProfiles: [],
    creators: [],
    projects: [],
    matches: [],
    orders: [],
    messages: [],
    reviews: [],
    reports: [],
    feedback: [],
    activityEvents: []
  };
}
