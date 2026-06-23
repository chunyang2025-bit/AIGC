"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { userFacingErrorMessage } from "@/lib/error-message";

function passwordValid(value: string) {
  return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\S]{8,32}$/.test(value);
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [statusText, setStatusText] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [ready, setReady] = useState(false);
  const supabaseClient = supabase;

  useEffect(() => {
    if (!supabaseClient) {
      setStatusText("当前环境未启用邮箱找回密码。");
      return;
    }
    const client = supabaseClient;

    let active = true;

    async function syncSession() {
      const { data } = await client.auth.getSession();
      if (!active) return;
      const email = data.session?.user?.email || "";
      setRecoveryEmail(email);
      setReady(Boolean(data.session));
      if (!data.session) {
        setStatusText("重置链接无效或已过期，请重新申请找回密码。");
      }
    }

    syncSession();

    const { data: listener } = client.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        setRecoveryEmail(session?.user?.email || "");
        setReady(Boolean(session));
        if (!session) {
          setStatusText("重置链接无效或已过期，请重新申请找回密码。");
        }
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabaseClient]);

  async function submit() {
    if (!supabaseClient) {
      setStatusText("当前环境未启用邮箱找回密码。");
      return;
    }
    const client = supabaseClient;
    if (!ready) {
      setStatusText("重置链接无效或已过期，请重新申请找回密码。");
      return;
    }
    if (!passwordValid(password)) {
      setStatusText("密码长度必须是8-32位，并同时包含字母和数字。");
      return;
    }
    if (password !== confirmPassword) {
      setStatusText("两次输入的密码不一致。");
      return;
    }

    try {
      setIsSubmitting(true);
      const { data, error } = await client.auth.updateUser({
        password
      });
      if (error) {
        throw error;
      }

      const email = data.user?.email || recoveryEmail;
      await client.auth.signOut();
      router.push(`/login?account=${encodeURIComponent(email)}&reset=success`);
    } catch (error) {
      setStatusText(userFacingErrorMessage(error, "密码重置失败，请稍后再试。"));
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
            <h1>重置密码</h1>
            <p>请设置一个新的登录密码。密码需为 8-32 位，并同时包含字母和数字。</p>
          </div>

          <div className="authForm">
            <label>
              <span>新密码</span>
              <div className="authInput">
                <LockKeyhole size={18} />
                <input placeholder="8-32位，包含字母和数字" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} />
                <button onClick={() => setShowPassword((value) => !value)} type="button" title={showPassword ? "隐藏密码" : "显示密码"}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            <label>
              <span>确认新密码</span>
              <div className="authInput">
                <LockKeyhole size={18} />
                <input placeholder="请再次输入新密码" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
                <button onClick={() => setShowConfirmPassword((value) => !value)} type="button" title={showConfirmPassword ? "隐藏密码" : "显示密码"}>
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            <button className="authPrimary" disabled={isSubmitting || !ready} onClick={submit} type="button">
              {isSubmitting ? "正在保存..." : "保存新密码"}
            </button>
          </div>

          {statusText ? <div className="authStatus">{statusText}</div> : null}

          <div className="registerPrompt">
            <span>没有收到邮件或链接失效？</span>
            <Link href={`/forgot-password?account=${encodeURIComponent(recoveryEmail)}`}>重新申请</Link>
          </div>
        </aside>
      </section>
    </main>
  );
}
