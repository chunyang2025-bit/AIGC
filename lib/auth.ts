"use client";

import { UserRole } from "./types";

export type AccountStatus = "registered" | "pending_review" | "approved";

export type AuthSession = {
  userId: string;
  name?: string;
  role: UserRole;
  phone: string;
  email: string;
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

function requestState() {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", "/api/state", false);
  xhr.setRequestHeader("Accept", "application/json");

  try {
    xhr.send();
  } catch {
    return null;
  }

  if (xhr.status < 200 || xhr.status >= 300) return null;

  try {
    return JSON.parse(xhr.responseText) as {
      ok: boolean;
      data?: {
        buyerProfiles?: Array<{ userId: string; verified: boolean }>;
        creators: Array<{ userId: string; verified: boolean }>;
      };
    };
  } catch {
    return null;
  }
}

function inferAccountStatus(userId: string, role: UserRole): AccountStatus {
  if (role === "admin") return "approved";

  const state = requestState();
  if (!state?.ok || !state.data) return "registered";

  const subject =
    role === "buyer"
      ? state.data.buyerProfiles?.find((profile) => profile.userId === userId)
      : state.data.creators.find((creator) => creator.userId === userId);

  if (!subject) return "registered";
  return subject.verified ? "approved" : "pending_review";
}

function normalizeAccount(account: string) {
  return account.trim();
}

function requestAuthUser(path: string, input: {
  role: UserRole;
  account: string;
  password?: string;
  phone?: string;
  code?: string;
  authMethod?: "password" | "code";
  name?: string;
}) {
  const xhr = new XMLHttpRequest();
  xhr.open("POST", path, false);
  xhr.setRequestHeader("Accept", "application/json");
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(
    JSON.stringify({
      role: input.role,
      account: normalizeAccount(input.account),
      phone: input.phone || normalizeAccount(input.account),
      email: normalizeAccount(input.account).includes("@") ? normalizeAccount(input.account) : `${normalizeAccount(input.account)}@phone.aigclancer.local`,
      password: input.password,
      code: input.code,
      authMethod: input.authMethod,
      name: input.name || normalizeAccount(input.account) || "新用户"
    })
  );

  if (xhr.status < 200 || xhr.status >= 300) {
    return null;
  }

  const parsed = JSON.parse(xhr.responseText) as {
    ok: boolean;
    data?: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      createdAt: string;
    };
  };

  return parsed.ok ? parsed.data ?? null : null;
}

function saveUserSession(user: {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
}, input: { account: string; phone?: string; role?: UserRole }) {
  if (!user) {
    throw new Error("账号处理失败，请检查手机号、邮箱和网络状态。");
  }

  const sessionRole = input.role ?? user.role;
  const session: AuthSession = {
    userId: user.id,
    name: user.name,
    role: sessionRole,
    phone: input.phone || (input.account.includes("@") ? "" : input.account),
    email: user.email,
    status: inferAccountStatus(user.id, sessionRole),
    createdAt: new Date().toISOString()
  };
  saveAuthSession(session);
  return session;
}

export function registerAccount(input: { role: UserRole; account: string; password: string; name?: string }) {
  const user = requestAuthUser("/api/auth/register", input);
  if (!user) {
    throw new Error("注册失败，请检查手机号、邮箱和网络状态。");
  }

  return user;
}

export function loginAccount(input: {
  role: UserRole;
  account: string;
  phone?: string;
  password?: string;
  code?: string;
  authMethod?: "password" | "code";
  name?: string;
}) {
  const user = requestAuthUser("/api/auth/login", input);
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
    saveAuthSession({ ...session, role: session.role === "admin" ? "admin" : "buyer", status });
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
  if (role !== "admin") return "/account";
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
  if (inferAccountStatus(session.userId, role) !== "approved") return roleProfilePath(role);
  return approvedPath;
}

export function loginNextPath(role: UserRole, next: string) {
  return `${roleLoginPath(role)}&next=${encodeURIComponent(next)}`;
}
