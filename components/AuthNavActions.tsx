"use client";

import Link from "next/link";
import { Bell, LogIn, LogOut, Plus } from "lucide-react";
import { clearAuthSession, readAuthSession } from "@/lib/auth";
import { notificationsForUser } from "@/lib/growth";
import { loadMarketplaceData } from "@/lib/store";

export function AuthNavActions() {
  const session = readAuthSession();
  const data = session ? loadMarketplaceData() : null;
  const notificationCount = session && data ? notificationsForUser(data, session.userId).length : 0;

  if (!session) {
    return (
      <>
        <Link className="btn ghost" href="/login?role=accept&next=%2Faccount%2Fcapabilities%3Fintent%3Dservice&intent=service">
          <LogIn size={16} /> 我要接单
        </Link>
        <Link className="btn primary" href="/login?role=dispatch&next=%2Faccount%2Fcapabilities%3Fintent%3Ddispatch&intent=dispatch">
          <Plus size={16} /> 我要派单
        </Link>
      </>
    );
  }

  return (
    <>
      <Link className="btn ghost" href="/account">
        <LogIn size={16} /> 主体中心
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
