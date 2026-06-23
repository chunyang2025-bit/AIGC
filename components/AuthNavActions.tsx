"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, LogIn, LogOut, UserRound } from "lucide-react";
import { AUTH_SESSION_EVENT, clearAuthSession, readAuthSession } from "@/lib/auth";
import { notificationsForUser } from "@/lib/growth";
import { loadMarketplaceData } from "@/lib/store";

export function AuthNavActions() {
  const [session, setSession] = useState(() => readAuthSession());
  const data = session ? loadMarketplaceData() : null;
  const notificationCount = session && data ? notificationsForUser(data, session.userId).length : 0;

  useEffect(() => {
    const refresh = () => setSession(readAuthSession());
    window.addEventListener(AUTH_SESSION_EVENT, refresh);
    window.addEventListener("storage", refresh);
    refresh();
    return () => {
      window.removeEventListener(AUTH_SESSION_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (!session) {
    return (
      <>
        <Link className="btn ghost" href="/login?next=%2Faccount">
          <LogIn size={16} /> 登录
        </Link>
        <Link className="btn primary" href="/account">
          <UserRound size={16} /> 个人中心
        </Link>
      </>
    );
  }

  return (
    <>
      <Link className="btn ghost" href="/account">
        <UserRound size={16} /> 个人中心
      </Link>
      <Link className="btn ghost" href="/account">
        <Bell size={16} /> 通知{notificationCount ? ` ${notificationCount}` : ""}
      </Link>
      <button
        className="btn"
        onClick={() => {
          clearAuthSession();
          window.location.href = "/";
        }}
        type="button"
      >
        <LogOut size={16} /> 退出登录
      </button>
    </>
  );
}
