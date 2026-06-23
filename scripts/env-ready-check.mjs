const required = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_INVITE_CODE"
];

const aiProviders = [
  ["DEEPSEEK_API_KEY", "DEEPSEEK_MODEL", "DEEPSEEK_BASE_URL"],
  ["CODEX_API_KEY", "CODEX_MODEL"],
  ["OPENAI_API_KEY", "OPENAI_MODEL", "OPENAI_BASE_URL"]
];

const recommended = [
  "NOTIFICATION_EMAIL_PROVIDER",
  "NOTIFICATION_EMAIL_API_KEY",
  "NOTIFICATION_SMS_PROVIDER",
  "NOTIFICATION_SMS_API_KEY"
];

const optional = [
  "PAYMENT_PROVIDER",
  "PAYMENT_API_KEY",
  "PAYMENT_WEBHOOK_SECRET"
];

function mask(value) {
  if (!value) return "";
  if (value.length <= 8) return "********";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function printGroup(title, names, requiredGroup) {
  console.log(`\n${title}`);
  for (const name of names) {
    const value = process.env[name] || "";
    const ok = Boolean(value);
    console.log(`${ok ? "PASS" : requiredGroup ? "FAIL" : "WARN"} ${name}${ok ? `=${mask(value)}` : " is not set"}`);
    if (requiredGroup && !ok) process.exitCode = 1;
  }
}

console.log("Production environment readiness check.");
printGroup("Required", required, true);
printGroup("Recommended", recommended, false);
printGroup("Optional for free pilot", optional, false);

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
if (appUrl && !appUrl.startsWith("https://")) {
  console.error("\nFAIL NEXT_PUBLIC_APP_URL must be an HTTPS production domain.");
  process.exitCode = 1;
}

const adminInviteCode = process.env.ADMIN_INVITE_CODE || "";
if (adminInviteCode && adminInviteCode.length < 16) {
  console.error("\nFAIL ADMIN_INVITE_CODE should be at least 16 characters.");
  process.exitCode = 1;
}

const hasAiProvider = aiProviders.some(([key]) => Boolean(process.env[key]));
if (!hasAiProvider) {
  console.error("\nFAIL Configure at least one AI story provider: DEEPSEEK_API_KEY, CODEX_API_KEY, or OPENAI_API_KEY.");
  process.exitCode = 1;
}

if (appUrl) {
  const recoveryUrl = `${appUrl.replace(/\/$/, "")}/reset-password`;
  console.log("\nManual auth checks");
  console.log(`WARN Supabase Auth > Providers must enable Email for password recovery.`);
  console.log(`WARN Supabase Auth redirect URLs should include ${recoveryUrl}`);
  console.log("WARN Run one real password-reset email test before broader rollout.");
}

if (hasAiProvider) {
  console.log("\nAI story checks");
  if (process.env.DEEPSEEK_API_KEY) {
    console.log(`PASS DEEPSEEK provider selected (${mask(process.env.DEEPSEEK_MODEL || "deepseek-chat")})`);
  } else if (process.env.CODEX_API_KEY) {
    console.log(`PASS CODEX provider selected (${mask(process.env.CODEX_MODEL || "gpt-5.2")})`);
  } else if (process.env.OPENAI_API_KEY) {
    console.log(`PASS OPENAI provider selected (${mask(process.env.OPENAI_MODEL || "gpt-5.2")})`);
  }
}

if (process.exitCode) {
  console.error("\nProduction environment is not ready.");
  process.exit(process.exitCode);
}

console.log("\nProduction environment required variables are ready.");
