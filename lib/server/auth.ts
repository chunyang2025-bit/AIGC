import { createClient } from "@supabase/supabase-js";
import { User, UserRole } from "../types";

export type ServerAuthUser = {
  id: string;
  email: string;
  phone: string;
  role: UserRole;
  name: string;
};

const globalStore = globalThis as typeof globalThis & {
  __aigcAuthTokenCache?: Map<string, ServerAuthUser>;
};

function getTokenCache() {
  if (!globalStore.__aigcAuthTokenCache) {
    globalStore.__aigcAuthTokenCache = new Map<string, ServerAuthUser>();
  }
  return globalStore.__aigcAuthTokenCache;
}

function cacheAuthToken(token: string | undefined, user: ServerAuthUser) {
  if (!token) return;
  const cache = getTokenCache();
  cache.set(token, user);
  if (cache.size > 200) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
}

function readCachedAuthToken(token: string) {
  return getTokenCache().get(token) ?? null;
}

function toServerAuthUser(user: Pick<User, "id" | "email" | "phone" | "role" | "name">): ServerAuthUser {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone ?? "",
    role: user.role,
    name: user.name
  };
}

function asUserRole(value: unknown) {
  return ["buyer", "creator", "admin"].includes(String(value))
    ? (String(value) as UserRole)
    : "buyer";
}

function isRetryableErrorMessage(message?: string | null) {
  const text = (message || "").toLowerCase();
  return text.includes("fetch failed")
    || text.includes("etimedout")
    || text.includes("econnreset")
    || text.includes("enotfound")
    || text.includes("network");
}

async function wait(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryAuthCall<T extends { error?: { message?: string | null } | null }>(
  run: () => Promise<T>,
  attempts = 3
) {
  let lastResult: T | null = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    lastResult = await run();
    if (!lastResult.error || !isRetryableErrorMessage(lastResult.error.message) || attempt === attempts) {
      return lastResult;
    }
    await wait(attempt * 150);
  }

  return lastResult as T;
}

export function isSupabaseServerConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function createServerSupabaseClient(apiKey: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || !apiKey) return null;
  return createClient(url, apiKey, {
    global: {
      fetch: (input, init) => fetch(input, {
        ...init,
        cache: "no-store"
      })
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export function getServerSupabase() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return null;
  return createServerSupabaseClient(serviceRoleKey);
}

export function getServerSupabasePublicAuth() {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) return null;
  return createServerSupabaseClient(anonKey);
}

function authAccount(input: Record<string, unknown>) {
  const account = String(input.account || input.email || input.phone || "").trim();
  const isEmail = account.includes("@");
  const explicitPhone = String(input.phone || "").trim();
  const phone = !isEmail && explicitPhone.startsWith("+") ? explicitPhone : "";
  return {
    account,
    email: String(input.email || (isEmail ? account : `${account}@phone.aigclancer.local`)),
    phone
  };
}

export async function registerSupabaseUser(input: Record<string, unknown>) {
  const supabase = getServerSupabase();
  if (!supabase) return null;

  const role = ["buyer", "creator", "admin"].includes(String(input.role))
    ? (String(input.role) as UserRole)
    : "buyer";
  const { account, email, phone } = authAccount(input);
  const password = String(input.password || "");
  if (!account || password.length < 8) return null;

  const { data, error } = await retryAuthCall(() => supabase.auth.admin.createUser({
    email,
    phone: phone || undefined,
    password,
    email_confirm: true,
    phone_confirm: Boolean(phone),
    user_metadata: {
      account,
      phone,
      role,
      name: String(input.name || account || "新用户")
    }
  }));

  if (error || !data.user) {
    throw new Error(error?.message || "Supabase 注册失败");
  }

  const user: User = {
    id: data.user.id,
    name: String(input.name || account || "新用户"),
    account,
    phone,
    email,
    role,
    createdAt: new Date().toISOString().slice(0, 10)
  };

  return user;
}

export async function loginSupabaseUser(input: Record<string, unknown>) {
  const supabase = getServerSupabase();
  if (!supabase) return null;

  const { account, email, phone } = authAccount(input);
  const password = String(input.password || "");
  if (!account || !password) return null;

  const { data, error } = await retryAuthCall(() => supabase.auth.signInWithPassword({
    email,
    password
  }));

  if (error || !data.user) {
    return null;
  }

  const metadata = data.user.user_metadata ?? {};
  const role = ["buyer", "creator", "admin"].includes(String(metadata.role))
    ? (String(metadata.role) as UserRole)
    : "buyer";

  const user: User & { accessToken?: string; refreshToken?: string } = {
    id: data.user.id,
    name: String(metadata.name || account || data.user.email || "用户"),
    account: String(metadata.account || account),
    phone: String(metadata.phone || phone || data.user.phone || ""),
    email: data.user.email || email,
    role,
    createdAt: data.user.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    accessToken: data.session?.access_token,
    refreshToken: data.session?.refresh_token
  };

  cacheAuthToken(user.accessToken, toServerAuthUser(user));

  return user;
}

export async function getRequestUser(request: Request): Promise<ServerAuthUser | null> {
  const supabase = getServerSupabase();
  if (!supabase) return null;

  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : "";
  if (!token) return null;

  const cached = readCachedAuthToken(token);
  if (cached) return cached;

  const claimsResult = await retryAuthCall(() => supabase.auth.getClaims(token));
  const claims = claimsResult.data?.claims;
  if (!claimsResult.error && claims?.sub) {
    const metadata = claims.user_metadata ?? {};
    const user = {
      id: String(claims.sub),
      email: String(claims.email || ""),
      phone: String(metadata.phone || claims.phone || ""),
      role: asUserRole(metadata.role ?? claims.role),
      name: String(metadata.name || claims.email || claims.phone || "用户")
    } satisfies ServerAuthUser;
    cacheAuthToken(token, user);
    return user;
  }

  const { data, error } = await retryAuthCall(() => supabase.auth.getUser(token));
  if (error || !data.user) return null;

  const metadata = data.user.user_metadata ?? {};
  const user = {
    id: data.user.id,
    email: data.user.email || "",
    phone: String(metadata.phone || data.user.phone || ""),
    role: asUserRole(metadata.role),
    name: String(metadata.name || data.user.email || data.user.phone || "用户")
  } satisfies ServerAuthUser;
  cacheAuthToken(token, user);
  return user;
}
