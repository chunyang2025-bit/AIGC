import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const requiredFiles = [
  "package.json",
  "next.config.mjs",
  "supabase/schema.sql",
  ".env.production.example",
  "vercel.json"
];

const requiredProductionEnv = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_INVITE_CODE"
];

function fail(message) {
  console.error(`FAIL ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`PASS ${message}`);
}

console.log("Predeploy check started.");

for (const file of requiredFiles) {
  if (existsSync(file)) {
    pass(`${file} exists`);
  } else {
    fail(`${file} is missing`);
  }
}

const envExample = readFileSync(".env.production.example", "utf8");
for (const name of requiredProductionEnv) {
  if (envExample.includes(`${name}=`)) {
    pass(`${name} is documented`);
  } else {
    fail(`${name} is missing from .env.production.example`);
  }
}

try {
  execFileSync("npm", ["run", "lint"], { stdio: "inherit" });
  pass("lint passed");
} catch {
  fail("lint failed");
}

try {
  execFileSync("npx", ["tsc", "--noEmit"], { stdio: "inherit" });
  pass("type check passed");
} catch {
  fail("type check failed");
}

try {
  execFileSync("npm", ["run", "build"], { stdio: "inherit" });
  pass("production build passed");
} catch {
  fail("production build failed");
}

if (process.exitCode) {
  console.error("Predeploy check failed.");
  process.exit(process.exitCode);
}

console.log("Predeploy check passed.");
