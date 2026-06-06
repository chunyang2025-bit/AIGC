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
import { userFacingErrorMessage } from "@/lib/error-message";

function passwordValid(value: string) {
  return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\S]{8,32}$/.test(value);
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") === "admin" ? "admin" : "buyer";
  const requestedNext = searchParams.get("next");
  const requestedIntent = searchParams.get("intent");
  const [account, setAccount] = useState(searchParams.get("account") ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
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
        role,
        account: account.trim(),
        password,
        name: account.trim(),
        inviteCode: role === "admin" ? inviteCode.trim() : undefined
      });
      setStatusText(role === "admin" ? "后台账号注册成功，请登录运营后台。" : "注册成功，请登录后继续当前业务路径。");
      const nextQuery = requestedNext ? `&next=${encodeURIComponent(requestedNext)}` : "";
      const intentQuery = requestedIntent ? `&intent=${encodeURIComponent(requestedIntent)}` : "";
      router.push(role === "admin" ? "/login?role=admin" : `/login?account=${encodeURIComponent(account.trim())}${nextQuery}${intentQuery}`);
    } catch (error) {
      setStatusText(userFacingErrorMessage(error, "注册失败，请稍后再试。"));
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
            <h1>{role === "admin" ? "注册平台运营账号" : "注册 AIGClancer"}</h1>
            <p>{role === "admin" ? "仅平台内部人员使用。注册需要管理员邀请码，账号创建后可进入审核与风控后台。" : "先创建主体账号。登录后会按你选择的入口继续，不需要一次理解所有业务。"}</p>
          </div>

          <div className="selectedRole compact authSelectedRole">
            <div className="roleIcon">
              {role === "admin" ? <ShieldCheck size={22} /> : <UserCog size={22} />}
            </div>
            <div>
              <strong>{role === "admin" ? "平台运营" : "主体账号"}</strong>
              <span>{role === "admin" ? "审核、举报和风控后台" : "注册后继续当前业务路径"}</span>
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
            {role === "admin" ? (
              <label>
                <span>后台邀请码</span>
                <div className="authInput">
                  <ShieldCheck size={18} />
                  <input placeholder="请输入管理员邀请码" value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} />
                </div>
              </label>
            ) : null}
            <button className="authPrimary" onClick={submitRegister} disabled={isSubmitting} type="button">
              {isSubmitting ? "正在注册..." : "注册"}
            </button>
          </div>

          {statusText ? <div className="authStatus">{statusText}</div> : null}

          <div className="registerPrompt">
            <span>已有账号？</span>
            <Link href={role === "admin" ? "/login?role=admin" : "/login"}>去登录</Link>
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
              <span>{role === "admin" ? "默认本地邀请码为 AIGC-ADMIN-2026，生产环境请配置 ADMIN_INVITE_CODE" : "注册后完善主体主页，即可先试用核心功能"}</span>
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
