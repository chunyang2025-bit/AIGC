"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Database, AlertTriangle, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";

const TABLE_NAME = "trial_feedback";

function explainError(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("row-level security") || lower.includes("permission denied") || lower.includes("forbidden")) {
    return "最常见的是 RLS 或权限限制。当前账号没有读这个表的权限，或者 Supabase 还没放行 anon/auth 角色。";
  }
  if (lower.includes("relation") && lower.includes("does not exist")) {
    return "表名写错了，或者这张表还没有在当前 Supabase 项目里创建。";
  }
  if (lower.includes("invalid") && lower.includes("jwt")) {
    return "登录态失效了，或者请求里带的 Supabase session/token 不对。";
  }
  if (lower.includes("network") || lower.includes("fetch failed") || lower.includes("timeout")) {
    return "网络、域名或环境变量配置有问题，客户端连不上 Supabase。";
  }
  return "一般是环境变量、表名、RLS、登录态或网络问题。先看控制台里的原始 error 最准。";
}

export default function SupabaseDebugPage() {
  const [status, setStatus] = useState("准备读取 Supabase 数据...");
  const [lastError, setLastError] = useState("");

  useEffect(() => {
    async function run() {
      if (!supabase) {
        const message = "Supabase 客户端未初始化。请检查 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY。";
        console.log("[supabase-debug] data:", null);
        console.log("[supabase-debug] error:", message);
        setStatus(message);
        setLastError(message);
        return;
      }

      const { data, error } = await supabase.from(TABLE_NAME).select("*").order("created_at", { ascending: false });
      console.log("[supabase-debug] data:", data);
      console.log("[supabase-debug] error:", error);

      if (error) {
        setLastError(error.message);
        setStatus(`读取失败：${error.message}`);
        return;
      }

      setLastError("");
      setStatus(`读取成功：${Array.isArray(data) ? data.length : 0} 条记录。`);
    }

    run();
  }, []);

  return (
    <main className="main" style={{ paddingTop: 24, paddingBottom: 24 }}>
      <section className="portalHero" style={{ marginBottom: 20 }}>
        <div className="stack">
          <span className="eyebrow">
            <Database size={15} /> Supabase 调试页
          </span>
          <div>
            <h1>表读取测试</h1>
            <p>页面加载时会直接查询 <code>{TABLE_NAME}</code>，并把 data / error 打到控制台。</p>
          </div>
          <div className="toolbarGroup">
            <Link className="btn" href="/admin">
              <ArrowLeft size={16} /> 返回后台
            </Link>
          </div>
        </div>
        <div className="portalStats">
          <div className="metric">
            <strong>目标表</strong>
            <span>{TABLE_NAME}</span>
          </div>
          <div className="metric">
            <strong>初始化方式</strong>
            <span>lib/supabase.ts</span>
          </div>
          <div className="metric">
            <strong>查看结果</strong>
            <span>浏览器 Console</span>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="cardBody stack">
          <strong>当前状态</strong>
          <p style={{ margin: 0 }}>{status}</p>
          {lastError ? (
            <div className="notice warning" style={{ marginTop: 8 }}>
              <AlertTriangle size={16} />
              <span>{explainError(lastError)}</span>
            </div>
          ) : (
            <div className="notice success" style={{ marginTop: 8 }}>
              <span>如果控制台里有 data，说明这张表能直接读到真实数据。</span>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
