"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Phone,
  ShieldCheck,
  Sparkles,
  UserCog
} from "lucide-react";
import { registerAccount } from "@/lib/auth";

function passwordValid(value: string) {
  return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\S]{8,32}$/.test(value);
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [account, setAccount] = useState(searchParams.get("account") ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function submitRegister() {
    if (!agreed) {
      setStatusText("请先阅读并勾选协议后注册。");
      return;
    }
    if (!account.trim()) {
      setStatusText("请输入手机号或邮箱。");
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
      registerAccount({
        role: "buyer",
        account: account.trim(),
        password,
        name: account.trim()
      });
      setStatusText("注册成功，请登录后完善主体资料。");
      router.push("/login");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "注册失败，请稍后再试。");
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
            <ShieldCheck size={18} /> 已有账号登录
          </Link>
        </nav>
      </header>

      <section className="dispatchLoginMain registerMain">
        <aside className="dispatchLoginPanel modernAuthPanel registerPanel">
          <div className="authPanelHeader">
            <h1>注册 AIGClancer</h1>
            <p>先创建主体账号。登录后进入主体中心，再选择开通派单能力、接单能力或同时开通两种能力。</p>
          </div>

          <div className="selectedRole compact authSelectedRole">
            <div className="roleIcon">
              <UserCog size={22} />
            </div>
            <div>
              <strong>主体账号</strong>
              <span>注册后进入主体中心选择能力</span>
            </div>
          </div>

          <div className="authForm">
            <label>
              <span>账号</span>
              <div className="authInput">
                <Phone size={18} />
                <input placeholder="手机号 / 邮箱" value={account} onChange={(event) => setAccount(event.target.value)} />
              </div>
            </label>
            <label>
              <span>密码</span>
              <div className="authInput">
                <LockKeyhole size={18} />
                <input placeholder="8-32位，包含字母和数字" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} />
                <button onClick={() => setShowPassword((value) => !value)} type="button" title={showPassword ? "隐藏密码" : "显示密码"}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            <label>
              <span>确认密码</span>
              <div className="authInput">
                <LockKeyhole size={18} />
                <input placeholder="请再次输入密码" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
                <button onClick={() => setShowConfirmPassword((value) => !value)} type="button" title={showConfirmPassword ? "隐藏密码" : "显示密码"}>
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            <button className="authPrimary" onClick={submitRegister} disabled={isSubmitting} type="button">
              {isSubmitting ? "正在注册..." : "注册"}
            </button>
          </div>

          {statusText ? <div className="authStatus">{statusText}</div> : null}

          <div className="registerPrompt">
            <span>已有账号？</span>
            <Link href="/login">去登录</Link>
          </div>

          <label className="modernAgreement">
            <input checked={agreed} onChange={(event) => setAgreed(event.target.checked)} type="checkbox" />
            <span>
              我已阅读并同意 AIGClancer <Link href="/terms">许可协议</Link> 和 <Link href="/privacy">隐私政策</Link>
            </span>
          </label>

          <div className="dispatchRoleTips">
            <div>
              <CheckCircle2 size={15} />
              <span>注册后需要完善主体主页并提交审核</span>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<main className="main"><div className="notice">正在加载注册入口...</div></main>}>
      <RegisterContent />
    </Suspense>
  );
}
