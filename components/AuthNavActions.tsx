"use client";

import Link from "next/link";
import { LogIn, LogOut, Plus } from "lucide-react";
import { clearAuthSession, readAuthSession } from "@/lib/auth";

export function AuthNavActions() {
  const session = readAuthSession();

  if (!session) {
    return (
      <>
        <Link className="btn ghost" href="/login?role=accept&next=%2Fprovider">
          <LogIn size={16} /> 我要接单
        </Link>
        <Link className="btn primary" href="/login?role=dispatch&next=%2Fpost-project">
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
