"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LockKeyhole, Mail, Sparkles } from "lucide-react";
import { requestPasswordReset } from "@/lib/auth";
import { userFacingErrorMessage } from "@/lib/error-message";

function ForgotPasswordPageContent() {
  const searchParams = useSearchParams();
  const [account, setAccount] = useState(searchParams.get("account") ?? "");
  const [statusText, setStatusText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    if (!account.trim()) {
      setStatusText("请输入注册邮箱。");
      return;
    }

    try {
      setIsSubmitting(true);
      await requestPasswordReset(account.trim());
      setStatusText("如果该邮箱已注册，重置密码邮件已发送，请前往邮箱查收。");
    } catch (error) {
      setStatusText(userFacingErrorMessage(error, "找回密码邮件发送失败，请稍后再试。"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="dispatchLoginShell">
      <header className="dispatchLoginTop">
        <Link className="brand" href="/">
          <span className="brandMark">
            <Sparkles size={18} />
          </span>
          <span>AIGClancer</span>
        </Link>
        <nav>
          <Link href="/login">
            <LockKeyhole size={18} /> 返回登录
          </Link>
        </nav>
      </header>

      <section className="dispatchLoginMain registerMain">
        <aside className="dispatchLoginPanel modernAuthPanel registerPanel">
          <div className="authPanelHeader">
            <h1>找回密码</h1>
            <p>当前试用阶段仅支持通过注册邮箱找回密码。提交后会向你的邮箱发送重置链接。</p>
          </div>

          <div className="selectedRole compact authSelectedRole">
            <div className="roleIcon">
              <Mail size={22} />
            </div>
            <div>
              <strong>邮箱找回</strong>
              <span>通过邮件进入重置密码页面</span>
            </div>
          </div>

          <div className="authForm">
            <label>
              <span>注册邮箱</span>
              <div className="authInput">
                <Mail size={18} />
                <input placeholder="请输入注册邮箱" value={account} onChange={(event) => setAccount(event.target.value)} />
              </div>
            </label>
            <button className="authPrimary" disabled={isSubmitting} onClick={submit} type="button">
              {isSubmitting ? "正在发送..." : "发送重置邮件"}
            </button>
          </div>

          {statusText ? <div className="authStatus">{statusText}</div> : null}

          <div className="registerPrompt">
            <span>想起密码了？</span>
            <Link href={`/login?account=${encodeURIComponent(account.trim())}`}>返回登录</Link>
          </div>
        </aside>
      </section>
    </main>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordPageContent />
    </Suspense>
  );
}
