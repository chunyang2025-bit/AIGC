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

function normalizePhoneNumber(value: unknown) {
  const raw = String(value || "").trim().replace(/\s+/g, "");
  if (!raw) return "";
  if (raw.startsWith("+")) {
    const digits = raw.slice(1).replace(/\D/g, "");
    return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : "";
  }

  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+86${digits}`;
  }
  if (digits.length >= 8 && digits.length <= 15) {
    return `+${digits}`;
  }
  return "";
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
  const explicitPhone = normalizePhoneNumber(input.phone);
  const phone = !isEmail ? (explicitPhone || normalizePhoneNumber(account)) : "";
  return {
    account,
    email: String(input.email || (isEmail ? account : `${account}@phone.aigclancer.local`)),
    phone
  };
}

async function findStoredSupabaseUser(
  supabase: NonNullable<ReturnType<typeof getServerSupabase>>,
  input: { account: string; email: string; phone: string }
) {
  const readBy = async (field: "phone" | "account" | "email", value: string) => {
    const { data, error } = await supabase
      .from("app_users")
      .select("id,name,account,phone,email,role,status,suspended_reason,created_at")
      .eq(field, value)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || "读取账号失败");
    }
    return data;
  };

  const candidates = [
    input.phone ? await readBy("phone", input.phone) : null,
    input.account ? await readBy("account", input.account) : null,
    input.email ? await readBy("email", input.email) : null
  ];

  for (const candidate of candidates) {
    if (candidate?.id) {
      return candidate;
    }
  }

  return null;
}

async function buildSupabaseLoginUser(input: {
  authUser: {
    id: string;
    email?: string | null;
    phone?: string | null;
    created_at?: string | null;
    user_metadata?: Record<string, unknown> | null;
  };
  session?: {
    access_token?: string;
    refresh_token?: string;
  } | null;
  account: string;
  phone: string;
  fallbackRole?: UserRole;
}) {
  const metadata = input.authUser.user_metadata ?? {};
  const role = ["buyer", "creator", "admin"].includes(String(metadata.role))
    ? (String(metadata.role) as UserRole)
    : (input.fallbackRole ?? "buyer");

  const user: User & { accessToken?: string; refreshToken?: string } = {
    id: input.authUser.id,
    name: String(metadata.name || input.account || input.authUser.email || "用户"),
    account: String(metadata.account || input.account),
    phone: String(metadata.phone || input.phone || input.authUser.phone || ""),
    email: input.authUser.email || (input.account.includes("@") ? input.account : `${input.account}@phone.aigclancer.local`),
    role,
    createdAt: input.authUser.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    accessToken: input.session?.access_token,
    refreshToken: input.session?.refresh_token
  };

  cacheAuthToken(user.accessToken, toServerAuthUser(user));
  return user;
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
  const authMethod = String(input.authMethod || "password");

  if (authMethod === "code") {
    const code = String(input.code || "").trim();
    const publicAuth = getServerSupabasePublicAuth();
    if (!account || !phone || !code || !publicAuth) return null;

    const { data, error } = await retryAuthCall(() => publicAuth.auth.verifyOtp({
      phone,
      token: code,
      type: "sms"
    }));

    if (error || !data.user) {
      return null;
    }

    const storedUser = await findStoredSupabaseUser(supabase, { account, email, phone });
    const fallbackRole = storedUser?.role ? asUserRole(storedUser.role) : undefined;
    return buildSupabaseLoginUser({
      authUser: {
        ...data.user,
        user_metadata: {
          ...data.user.user_metadata,
          account: storedUser?.account || data.user.user_metadata?.account || account,
          phone: storedUser?.phone || data.user.user_metadata?.phone || phone,
          name: storedUser?.name || data.user.user_metadata?.name || account,
          role: storedUser?.role || data.user.user_metadata?.role || fallbackRole
        }
      },
      session: data.session,
      account,
      phone,
      fallbackRole
    });
  }

  const password = String(input.password || "");
  if (!account || !password) return null;

  const { data, error } = await retryAuthCall(() => supabase.auth.signInWithPassword({
    email,
    password
  }));

  if (error || !data.user) {
    return null;
  }

  return buildSupabaseLoginUser({
    authUser: data.user,
    session: data.session,
    account,
    phone
  });
}

export async function sendSupabaseLoginCode(input: Record<string, unknown>) {
  const supabase = getServerSupabase();
  const publicAuth = getServerSupabasePublicAuth();
  if (!supabase || !publicAuth) return null;

  const requestedRole = asUserRole(input.role);
  if (requestedRole === "admin") {
    throw new Error("后台账号暂不支持短信验证码登录");
  }

  const { account, email, phone } = authAccount(input);
  if (!account || !phone) {
    throw new Error("请输入可接收短信的手机号");
  }

  const storedUser = await findStoredSupabaseUser(supabase, { account, email, phone });
  if (!storedUser?.id) {
    throw new Error("未找到账号，请先注册。");
  }

  const storedRole = asUserRole(storedUser.role);
  if (storedRole === "admin") {
    throw new Error("后台账号暂不支持短信验证码登录");
  }
  if (String(storedUser.status || "") === "suspended") {
    throw new Error(String(storedUser.suspended_reason || "账号已被限制登录"));
  }

  const { data: authLookup, error: lookupError } = await retryAuthCall(() => supabase.auth.admin.getUserById(String(storedUser.id)));
  if (lookupError || !authLookup.user) {
    throw new Error(lookupError?.message || "未找到可登录用户");
  }

  const userMetadata = authLookup.user.user_metadata ?? {};
  const { error: syncError } = await retryAuthCall(() => supabase.auth.admin.updateUserById(String(storedUser.id), {
    phone,
    phone_confirm: true,
    user_metadata: {
      ...userMetadata,
      account: String(storedUser.account || account),
      phone,
      role: storedRole,
      name: String(storedUser.name || userMetadata.name || account)
    }
  }));
  if (syncError) {
    throw new Error(syncError.message || "手机号同步失败");
  }

  const { error: profileSyncError } = await supabase
    .from("app_users")
    .update({ phone })
    .eq("id", String(storedUser.id));
  if (profileSyncError) {
    throw new Error(profileSyncError.message || "手机号保存失败");
  }

  const { error } = await retryAuthCall(() => publicAuth.auth.signInWithOtp({
    phone,
    options: {
      shouldCreateUser: false
    }
  }));

  if (error) {
    throw new Error(error.message || "验证码发送失败");
  }

  return {
    phone
  };
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
