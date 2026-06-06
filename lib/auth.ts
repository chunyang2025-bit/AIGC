"use client";

import { UserRole } from "./types";
import { userFacingErrorMessage } from "./error-message";

export type AccountStatus = "registered" | "pending_review" | "approved";

export type AuthSession = {
  userId: string;
  name?: string;
  role: UserRole;
  phone: string;
  email: string;
  accessToken?: string;
  refreshToken?: string;
  status: AccountStatus;
  createdAt: string;
};

const AUTH_KEY = "linggong-zhichuang-auth-v1";

export function readAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const cached = window.localStorage.getItem(AUTH_KEY);
  if (!cached) return null;

  try {
    return JSON.parse(cached) as AuthSession;
  } catch {
    window.localStorage.removeItem(AUTH_KEY);
    return null;
  }
}

export function saveAuthSession(session: AuthSession) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(AUTH_KEY, JSON.stringify(session));
  }
}

export function clearAuthSession() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_KEY);
  }
}

export function createAuthSession(input: { role: UserRole; phone: string; email: string }) {
  const userId =
    input.role === "buyer" ? "u-buyer-1" : input.role === "creator" ? "u-creator-self" : "u-admin-1";
  const session: AuthSession = {
    userId,
    role: input.role,
    phone: input.phone,
    email: input.email,
    status: input.role === "admin" ? "approved" : "registered",
    createdAt: new Date().toISOString()
  };
  saveAuthSession(session);
  return session;
}

function inferAccountStatus(userId: string, role: UserRole): AccountStatus {
  if (role === "admin") return "approved";

  if (typeof window === "undefined") return "registered";

  const cached = window.localStorage.getItem("linggong-zhichuang-demo-v2");
  if (!cached) return "registered";

  try {
    const state = JSON.parse(cached) as {
      buyerProfiles?: Array<{ userId: string; verified: boolean }>;
      creators?: Array<{ userId: string; verified: boolean }>;
    };
    const subject =
      role === "buyer"
        ? state.buyerProfiles?.find((profile) => profile.userId === userId)
        : state.creators?.find((creator) => creator.userId === userId);

    if (!subject) return "registered";
    return subject.verified ? "approved" : "pending_review";
  } catch {
    return "registered";
  }
}

function normalizeAccount(account: string) {
  return account.trim();
}

function accountPhone(account: string, phone?: string) {
  const normalized = normalizeAccount(account);
  if (phone) return phone;
  return normalized.includes("@") ? "" : normalized;
}

async function requestAuthUser(path: string, input: {
  role: UserRole;
  account: string;
  password?: string;
  phone?: string;
  code?: string;
  authMethod?: "password" | "code";
  name?: string;
  inviteCode?: string;
}) {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      role: input.role,
      account: normalizeAccount(input.account),
      phone: accountPhone(input.account, input.phone),
      email: normalizeAccount(input.account).includes("@") ? normalizeAccount(input.account) : `${normalizeAccount(input.account)}@phone.aigclancer.local`,
      password: input.password,
      code: input.code,
      authMethod: input.authMethod,
      name: input.name || normalizeAccount(input.account) || "新用户",
      inviteCode: input.inviteCode
    })
  });

  const parsed = await response.json().catch(() => null) as {
    ok: boolean;
    error?: string;
    data?: {
      id: string;
      name: string;
      email: string;
      phone?: string;
      role: UserRole;
      createdAt: string;
      accessToken?: string;
      refreshToken?: string;
    };
  } | null;

  if (!response.ok || !parsed?.ok) {
    throw new Error(userFacingErrorMessage(parsed?.error, "请求失败，请稍后再试。"));
  }

  return parsed.data ?? null;
}

function saveUserSession(user: {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  accessToken?: string;
  refreshToken?: string;
}, input: { account: string; phone?: string; role?: UserRole }) {
  if (!user) {
    throw new Error("账号处理失败，请检查手机号、邮箱和网络状态。");
  }

  const sessionRole = input.role ?? user.role;
  const session: AuthSession = {
    userId: user.id,
    name: user.name,
    role: sessionRole,
    phone: user.phone || input.phone || (input.account.includes("@") ? "" : input.account),
    email: user.email,
    accessToken: user.accessToken,
    refreshToken: user.refreshToken,
    status: inferAccountStatus(user.id, sessionRole),
    createdAt: new Date().toISOString()
  };
  saveAuthSession(session);
  return session;
}

export async function registerAccount(input: { role: UserRole; account: string; password: string; name?: string; inviteCode?: string }) {
  const user = await requestAuthUser("/api/auth/register", input);
  if (!user) {
    throw new Error("注册失败，请检查手机号、邮箱和网络状态。");
  }

  return user;
}

export async function loginAccount(input: {
  role: UserRole;
  account: string;
  phone?: string;
  password?: string;
  code?: string;
  authMethod?: "password" | "code";
  name?: string;
}) {
  const user = await requestAuthUser("/api/auth/login", input);
  if (!user) {
    throw new Error("未找到账号，请先注册。");
  }

  return saveUserSession(user, input);
}

export function setAuthStatus(status: AccountStatus) {
  const session = readAuthSession();
  if (session) {
    saveAuthSession({ ...session, status });
  }
}

export function setAuthCapability(role: UserRole, status: AccountStatus = "pending_review") {
  const session = readAuthSession();
  if (session) {
    saveAuthSession({ ...session, role: session.role === "admin" ? "admin" : role, status });
  }
}

export function isApproved(session: AuthSession | null) {
  return session?.status === "approved";
}

export function roleProfilePath(role: UserRole) {
  if (role === "buyer") return "/account/profile";
  if (role === "creator") return "/account/profile";
  return "/admin";
}

export function roleWorkbenchPath(role: UserRole) {
  if (role === "buyer") return "/buyer";
  if (role === "creator") return "/provider";
  return "/admin";
}

export function roleLoginPath(role: UserRole) {
  if (role === "buyer") return "/login?role=dispatch";
  if (role === "creator") return "/login?role=accept";
  return "/login?role=admin";
}

export function roleEntryPath(role: UserRole, approvedPath: string) {
  const session = readAuthSession();
  if (!session) return roleLoginPath(role);
  if (session.role === "admin") return role === "admin" ? approvedPath : roleLoginPath(role);
  if (inferAccountStatus(session.userId, role) === "registered") return roleProfilePath(role);
  return approvedPath;
}

export function loginNextPath(role: UserRole, next: string) {
  return `${roleLoginPath(role)}&next=${encodeURIComponent(next)}`;
}
