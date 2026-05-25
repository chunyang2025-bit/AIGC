"use client";

import { UserRole } from "./types";

export type AccountStatus = "registered" | "pending_review" | "approved";

export type AuthSession = {
  userId: string;
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

export function setAuthStatus(status: AccountStatus) {
  const session = readAuthSession();
  if (session) {
    saveAuthSession({ ...session, status });
  }
}

export function isApproved(session: AuthSession | null) {
  return session?.status === "approved";
}

export function roleProfilePath(role: UserRole) {
  if (role === "buyer") return "/buyer/profile";
  if (role === "creator") return "/provider/profile";
  return "/admin";
}

export function roleLoginPath(role: UserRole) {
  if (role === "buyer") return "/login?role=dispatch";
  if (role === "creator") return "/login?role=accept";
  return "/login?role=admin";
}

export function roleEntryPath(role: UserRole, approvedPath: string) {
  const session = readAuthSession();
  if (!session || session.role !== role) return roleLoginPath(role);
  if (!isApproved(session)) return roleProfilePath(role);
  return approvedPath;
}
