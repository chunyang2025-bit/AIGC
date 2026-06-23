const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://127.0.0.1:3027";
const origin = baseUrl.replace(/\/$/, "");

async function fetchJson(path) {
  const response = await fetch(`${origin}${path}`, {
    headers: { Accept: "application/json" }
  });
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status} ${response.statusText}`);
  }
  const payload = await response.json();
  if (!payload.ok) {
    throw new Error(`${path} returned an error response`);
  }
  return payload.data;
}

function pass(message) {
  console.log(`PASS ${message}`);
}

function warn(message) {
  console.warn(`WARN ${message}`);
}

function fail(message) {
  console.error(`FAIL ${message}`);
  process.exitCode = 1;
}

function requireMinimum(name, actual, minimum, severity = "fail") {
  if (actual >= minimum) {
    pass(`${name}: ${actual}/${minimum}`);
    return;
  }
  const message = `${name}: ${actual}/${minimum}`;
  if (severity === "warn") warn(message);
  else fail(message);
}

console.log(`Pilot readiness check: ${origin}`);

let health;
try {
  health = await fetchJson("/api/health");
} catch (error) {
  fail(`health endpoint is unavailable: ${error instanceof Error ? error.message : "unknown error"}`);
  process.exit(process.exitCode || 1);
}
const healthFailures = Array.isArray(health.checks) ? health.checks.filter((check) => !check.ok) : [];
if (health.ok && !healthFailures.length) {
  pass("health check is green");
} else {
  fail(`health check has ${healthFailures.length || "unknown"} failing item(s)`);
  for (const check of healthFailures) {
    console.error(`  - ${check.name}: ${check.message}`);
  }
}

if (health.aiStoryProvider?.configured) {
  pass(`ai story provider ready: ${health.aiStoryProvider.provider}/${health.aiStoryProvider.model}`);
} else {
  warn("ai story provider is not configured; confirm whether story generation is intentionally disabled for this pilot");
}

let marketplace;
try {
  marketplace = await fetchJson("/api/marketplace");
} catch (error) {
  fail(`marketplace endpoint is unavailable: ${error instanceof Error ? error.message : "unknown error"}`);
  process.exit(process.exitCode || 1);
}
const creators = marketplace.creators || [];
const projects = marketplace.projects || [];

const openProjects = projects.filter((project) => ["open", "matching", "in_progress"].includes(project.status));
const serviceProjects = openProjects.filter((project) => project.category !== "AIGC Training");
const trainingProjects = openProjects.filter((project) => project.category === "AIGC Training");
const approvedCreators = creators.filter((creator) => creator.verified);
const serviceCreators = approvedCreators.filter((creator) => !creator.categories?.includes("AIGC Training"));
const trainingCreators = approvedCreators.filter((creator) => creator.categories?.includes("AIGC Training"));
const projectsWithContact = openProjects.filter((project) => project.contactEmail || project.contactPhone);
let projectsWithMatches = 0;

for (const project of openProjects) {
  try {
    const matchData = await fetchJson(`/api/projects/${project.id}/matches`);
    if (Array.isArray(matchData.matches) && matchData.matches.length) {
      projectsWithMatches += 1;
    }
  } catch (error) {
    warn(`could not read matches for ${project.id}: ${error instanceof Error ? error.message : "unknown error"}`);
  }
}

requireMinimum("open project demands", openProjects.length, 3);
requireMinimum("open demands with contact", projectsWithContact.length, 3, "warn");
requireMinimum("open non-training demands", serviceProjects.length, 2);
requireMinimum("open training demands", trainingProjects.length, 1);
requireMinimum("approved service providers", serviceCreators.length, 5);
requireMinimum("approved training providers", trainingCreators.length, 2);
requireMinimum("projects with candidate matches", projectsWithMatches, 2);

const creatorsWithPackages = approvedCreators.filter((creator) => Array.isArray(creator.servicePackages) && creator.servicePackages.length);
const trainingCreatorsWithCases = trainingCreators.filter((creator) => creator.trainingProfile?.caseStudies?.length || creator.portfolioItems?.length || creator.portfolio?.length);
requireMinimum("approved providers with service packages", creatorsWithPackages.length, 3, "warn");
requireMinimum("training providers with cases or portfolio", trainingCreatorsWithCases.length, 1, "warn");

const freePilotBoundary = health.integrations?.payments?.configured === false;
if (freePilotBoundary) {
  pass("free pilot payment boundary is visible");
} else {
  warn("payments appear configured; confirm public copy does not imply escrow unless payment flow is ready");
}

if (process.exitCode) {
  console.error("Pilot readiness check failed.");
  process.exit(process.exitCode);
}

console.log("Pilot readiness check passed.");
