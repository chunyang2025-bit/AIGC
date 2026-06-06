"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BriefcaseBusiness,
  Eye,
  EyeOff,
  Headphones,
  HelpCircle,
  LockKeyhole,
  Phone,
  ShieldCheck,
  Sparkles,
  UserCog
} from "lucide-react";
import { AuthSession, loginAccount, readAuthSession, roleProfilePath, roleWorkbenchPath } from "@/lib/auth";
import { userFacingErrorMessage } from "@/lib/error-message";
import { UserRole } from "@/lib/types";

const adminRole = {
  key: "admin",
  icon: ShieldCheck,
  title: "平台运营",
  subtitle: "审核与数据后台",
  helper: "仅平台内部人员使用，查看审核、用户、需求、线索和月活数据。"
};

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRole = searchParams.get("role");
  const requestedNext = searchParams.get("next");
  const requestedIntent = searchParams.get("intent");
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const activeRoleValue: UserRole = requestedRole === "admin" ? "admin" : "buyer";
  const registerAccount = account.trim();

  function nextPath(session: AuthSession) {
    if (requestedNext && requestedNext.startsWith("/")) return requestedNext;
    if (session.status === "registered") return requestedIntent ? `${roleProfilePath(session.role)}?intent=${requestedIntent}` : roleProfilePath(session.role);
    return roleWorkbenchPath(session.role);
  }

  useEffect(() => {
    const session = readAuthSession();
    if (session && requestedNext?.startsWith("/")) {
      router.replace(requestedNext);
    }
  }, [requestedNext, router]);

  function requireAgreement() {
    if (agreed) return true;
    setStatusText("请先阅读并勾选协议后继续。");
    setShowRegisterPrompt(false);
    return false;
  }

  function loginByPassword() {
    if (!requireAgreement()) return;
    if (!account.trim() || !password.trim()) {
      setStatusText("请输入手机号/邮箱和密码。");
      setShowRegisterPrompt(false);
      return;
    }
    try {
      setIsSubmitting(true);
      const session = loginAccount({
        role: activeRoleValue,
        account: account.trim(),
        password: password.trim(),
        authMethod: "password",
        name: account.trim()
      });
      setStatusText(activeRoleValue === "admin" ? "登录成功，正在进入运营后台。" : "登录成功，正在进入主体中心。");
      setShowRegisterPrompt(false);
      router.push(nextPath(session));
    } catch (error) {
      const message = userFacingErrorMessage(error, "登录失败，请稍后再试。");
      if (activeRoleValue !== "admin" && (message.includes("未找到") || message.includes("先注册"))) {
        setStatusText("未找到账号，请先注册。");
        setShowRegisterPrompt(true);
      } else {
        setStatusText(message);
        setShowRegisterPrompt(false);
      }
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
          <Link href="/projects">
            <BriefcaseBusiness size={18} /> 派单大厅
          </Link>
          <Link href="/">
            <HelpCircle size={18} /> 帮助中心
          </Link>
          <Link href="/">
            <Headphones size={18} /> 联系客服
          </Link>
        </nav>
      </header>

      <section className="dispatchLoginMain">
        <div className="dispatchPoster" aria-label="平台介绍">
          <div className="posterBadge">真实需求</div>
          <div className="posterCard">
            <span>AIGC供需撮合</span>
            <strong>AIGClancer</strong>
            <em>认证主体 · 公开需求 · 沟通留痕</em>
          </div>
          <div className="posterBubble one">免费入驻</div>
          <div className="posterBubble two">审核后派单</div>
          <div className="posterBubble three">展示页接单</div>
        </div>

        <aside className="dispatchLoginPanel modernAuthPanel">
          <div className="authPanelHeader">
            <h1>登录 AIGClancer</h1>
            <p>登录后按你刚才选择的入口继续：发布需求、完善服务主页、发布培训需求或完善培训主页。</p>
          </div>

          <div className="selectedRole compact authSelectedRole">
            <div className="roleIcon">
              {requestedRole === "admin" ? <ShieldCheck size={22} /> : <UserCog size={22} />}
            </div>
            <div>
              <strong>{requestedRole === "admin" ? adminRole.title : "主体账号"}</strong>
              <span>{requestedRole === "admin" ? adminRole.subtitle : "登录后继续当前业务路径"}</span>
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
                <input placeholder="请输入密码" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} />
                <button onClick={() => setShowPassword((value) => !value)} type="button" title={showPassword ? "隐藏密码" : "显示密码"}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            <button className="authPrimary" onClick={loginByPassword} disabled={isSubmitting} type="button">
              {isSubmitting ? "正在登录..." : "登录"}
            </button>
          </div>

          {statusText ? <div className="authStatus">{statusText}</div> : null}
          {activeRoleValue !== "admin" ? (
            <div className="registerPrompt">
              <span>{showRegisterPrompt ? "未找到账号？" : "没有账号？"}</span>
              <Link href={`/register?account=${encodeURIComponent(registerAccount)}${requestedNext ? `&next=${encodeURIComponent(requestedNext)}` : ""}${requestedIntent ? `&intent=${encodeURIComponent(requestedIntent)}` : ""}`}>
                先注册
              </Link>
            </div>
          ) : (
            <div className="registerPrompt">
              <span>没有后台账号？</span>
              <Link href={`/register?role=admin&account=${encodeURIComponent(registerAccount)}`}>
                使用邀请码注册
              </Link>
            </div>
          )}

          <label className="modernAgreement">
            <input checked={agreed} onChange={(event) => setAgreed(event.target.checked)} type="checkbox" />
            <span>
              我已阅读并同意 AIGClancer <Link href="/terms">许可协议</Link> 和 <Link href="/privacy">隐私政策</Link>
            </span>
          </label>

          <div className="dispatchRoleTips">
            <p>{requestedRole === "admin" ? adminRole.helper : "一个主体账号可以作为需求方，也可以作为服务方。先完成当前路径，以后再添加其他业务。"}</p>
            <div>
              <UserCog size={15} />
              <span>同一主体可复用资质和主页</span>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="main"><div className="notice">正在加载登录入口...</div></main>}>
      <LoginContent />
    </Suspense>
  );
}
