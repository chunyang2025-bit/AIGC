const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://127.0.0.1:3023";
const healthUrl = `${baseUrl.replace(/\/$/, "")}/api/health`;

if (!process.env.NEXT_PUBLIC_APP_URL && !process.env.APP_URL) {
  console.warn("WARN NEXT_PUBLIC_APP_URL/APP_URL is not set. Falling back to local development URL.");
}

if (!baseUrl.startsWith("https://") && !baseUrl.includes("127.0.0.1") && !baseUrl.includes("localhost")) {
  console.error("FAIL Production URL must use HTTPS.");
  process.exit(1);
}

const response = await fetch(healthUrl, {
  headers: { Accept: "application/json" }
});

if (!response.ok) {
  console.error(`Health check request failed: ${response.status} ${response.statusText}`);
  process.exit(1);
}

const payload = await response.json();
const data = payload.data;
const checks = Array.isArray(data?.checks) ? data.checks : [];
const failed = checks.filter((check) => !check.ok);
const warnings = checks.filter((check) => check.ok && /建议|未配置|请确认/.test(String(check.message || "")));
const aiStoryProvider = data?.aiStoryProvider || {};

console.log(`Production check: ${healthUrl}`);
console.log(`Environment: ${data?.environment || "unknown"}`);
for (const check of checks) {
  console.log(`${check.ok ? "PASS" : "FAIL"} ${check.name}: ${check.message}`);
}

if (!data?.ok || failed.length) {
  console.error(`Production check failed: ${failed.length} failing check(s).`);
  process.exit(1);
}

if (warnings.length) {
  console.warn(`Production check passed with ${warnings.length} warning(s). Review optional/recommended integrations before broader rollout.`);
}

if (!aiStoryProvider.configured) {
  console.warn("WARN AI story provider is not configured.");
} else {
  console.log(`AI story provider: ${aiStoryProvider.provider} / ${aiStoryProvider.model}`);
}

if (data?.passwordReset?.recoveryUrl) {
  console.log(`Password reset redirect: ${data.passwordReset.recoveryUrl}`);
}

console.log("Production check passed.");
