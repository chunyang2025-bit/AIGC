import { createClient } from "@supabase/supabase-js";
import { User, UserRole } from "../types";

export type ServerAuthUser = {
  id: string;
  email: string;
  phone: string;
  role: UserRole;
  name: string;
};

export function isSupabaseServerConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

function authAccount(input: Record<string, unknown>) {
  const account = String(input.account || input.email || input.phone || "").trim();
  const isEmail = account.includes("@");
  return {
    account,
    email: String(input.email || (isEmail ? account : `${account}@phone.aigclancer.local`)),
    phone: String(input.phone || (isEmail ? "" : account))
  };
}

export async function registerSupabaseUser(input: Record<string, unknown>) {
  const supabase = getServerSupabase();
  if (!supabase) return null;

  const role = ["buyer", "creator", "admin"].includes(String(input.role))
    ? (String(input.role) as UserRole)
    : "buyer";
  if (role === "admin") return null;

  const { account, email, phone } = authAccount(input);
  const password = String(input.password || "");
  if (!account || password.length < 8) return null;

  const { data, error } = await supabase.auth.admin.createUser({
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
  });

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

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

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

  return user;
}

export async function getRequestUser(request: Request): Promise<ServerAuthUser | null> {
  const supabase = getServerSupabase();
  if (!supabase) return null;

  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : "";
  if (!token) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  const metadata = data.user.user_metadata ?? {};
  const role = ["buyer", "creator", "admin"].includes(String(metadata.role))
    ? (String(metadata.role) as UserRole)
    : "buyer";

  return {
    id: data.user.id,
    email: data.user.email || "",
    phone: String(metadata.phone || data.user.phone || ""),
    role,
    name: String(metadata.name || data.user.email || data.user.phone || "用户")
  };
}
