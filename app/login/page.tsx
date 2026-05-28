"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BriefcaseBusiness,
  CheckCircle2,
  Eye,
  EyeOff,
  Headphones,
  HelpCircle,
  LockKeyhole,
  MessageCircle,
  Phone,
  QrCode,
  ShieldCheck,
  Sparkles,
  UserCog
} from "lucide-react";
import { AuthSession, loginAccount, roleProfilePath, roleWorkbenchPath, saveAuthSession } from "@/lib/auth";

const publicRoles = [
  {
    key: "dispatch",
    icon: BriefcaseBusiness,
    title: "我要派单",
    subtitle: "发布真实需求",
    helper: "完成主体资料和资质审核后，可发布内容需求并邀请接单方沟通。"
  },
  {
    key: "accept",
    icon: UserCog,
    title: "我要接单",
    subtitle: "展示能力并沟通需求",
    helper: "创建展示页后可浏览公开需求；审核通过后可主动向派单方发起沟通。"
  }
];

const adminRole = {
  key: "admin",
  icon: ShieldCheck,
  title: "平台运营",
  subtitle: "审核与数据后台",
  helper: "仅平台内部人员使用，查看审核、用户、需求、线索和月活数据。"
};

type LoginMethod = "wechat" | "code" | "password";

function passwordValid(value: string) {
  return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\S]{8,32}$/.test(value);
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRole = searchParams.get("role");
  const visibleRoles = requestedRole === "admin" ? [adminRole] : publicRoles;
  const initialRole = visibleRoles.some((role) => role.key === requestedRole) ? requestedRole ?? "accept" : "accept";
  const [activeKey, setActiveKey] = useState(initialRole);
  const [method, setMethod] = useState<LoginMethod>(requestedRole === "admin" ? "password" : "wechat");
  const [account, setAccount] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pendingSession, setPendingSession] = useState<AuthSession | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const activeRole = visibleRoles.find((role) => role.key === activeKey) ?? visibleRoles[0];
  const ActiveIcon = activeRole.icon;
  const activeRoleValue = activeRole.key === "dispatch" ? "buyer" : activeRole.key === "accept" ? "creator" : "admin";

  function nextPath(session: AuthSession) {
    return session.status === "approved" ? roleWorkbenchPath(session.role) : roleProfilePath(session.role);
  }

  function requireAgreement() {
    if (agreed) return true;
    setStatusText("请先阅读并勾选协议后继续。");
    return false;
  }

  function loginByPassword() {
    if (!requireAgreement()) return;
    if (!account.trim() || !password.trim()) {
      setStatusText("请输入手机号/邮箱和密码。");
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
      setStatusText("登录成功，正在进入对应工作台。");
      router.push(nextPath(session));
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "登录失败，请稍后再试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  function loginByCode() {
    if (!requireAgreement()) return;
    if (!phone.trim()) {
      setStatusText("请输入手机号。");
      return;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      setStatusText("请输入6位短信验证码。");
      return;
    }
    try {
      setIsSubmitting(true);
      const session = loginAccount({
        role: activeRoleValue,
        account: phone.trim(),
        phone: phone.trim(),
        code: code.trim(),
        authMethod: "code",
        name: phone.trim()
      });
      setPendingSession(session);
      setPassword("");
      setConfirmPassword("");
      setStatusText("验证码登录成功，请先设置密码，便于下次账号密码登录。");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "验证码登录失败，请稍后再试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitPassword() {
    if (!pendingSession) return;
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
      const response = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: pendingSession.userId, password })
      });
      if (!response.ok) throw new Error("密码设置失败，请稍后再试。");
      saveAuthSession(pendingSession);
      setStatusText("密码设置成功，正在进入对应工作台。");
      router.push(nextPath(pendingSession));
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "密码设置失败，请稍后再试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  function wechatLogin() {
    if (!requireAgreement()) return;
    setStatusText("微信扫码登录需要接入微信开放平台。当前 demo 请使用验证码登录。");
  }

  if (pendingSession) {
    return (
      <main className="passwordSetupShell">
        <section className="passwordSetupPanel">
          <h1>设置密码</h1>
          <label className="passwordLine">
            <input
              placeholder="请输入新密码"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button onClick={() => setShowPassword((value) => !value)} type="button" title={showPassword ? "隐藏密码" : "显示密码"}>
              {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
            </button>
          </label>
          <label className="passwordLine">
            <input
              placeholder="请再次输入密码"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
            <button onClick={() => setShowConfirmPassword((value) => !value)} type="button" title={showConfirmPassword ? "隐藏密码" : "显示密码"}>
              {showConfirmPassword ? <EyeOff size={22} /> : <Eye size={22} />}
            </button>
          </label>
          <p>密码长度必须是8-32位，同时包含字母和数字</p>
          <button className="passwordPrimary" onClick={submitPassword} disabled={isSubmitting} type="button">
            {isSubmitting ? "正在设置..." : "立即登录"}
          </button>
          {statusText ? <div className="passwordStatus">{statusText}</div> : null}
        </section>
      </main>
    );
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
            <p>验证码登录会自动完成注册，首次登录后需要设置密码。</p>
          </div>

          <div className="authMethodTabs" role="tablist" aria-label="登录方式">
            <button className={method === "wechat" ? "active" : ""} onClick={() => setMethod("wechat")} type="button">
              微信登录
            </button>
            <button className={method === "code" ? "active" : ""} onClick={() => setMethod("code")} type="button">
              验证码登录
            </button>
            <button className={method === "password" ? "active" : ""} onClick={() => setMethod("password")} type="button">
              密码登录
            </button>
          </div>

          <div className="authRoleSwitch" role="tablist" aria-label="账号身份">
            {visibleRoles.map((role) => {
              const RoleIcon = role.icon;
              return (
                <button className={role.key === activeKey ? "active" : ""} key={role.key} onClick={() => setActiveKey(role.key)} type="button">
                  <RoleIcon size={16} />
                  <span>{role.title}</span>
                </button>
              );
            })}
          </div>

          <div className="selectedRole compact authSelectedRole">
            <div className="roleIcon">
              <ActiveIcon size={22} />
            </div>
            <div>
              <strong>{activeRole.title}</strong>
              <span>{activeRole.subtitle}</span>
            </div>
          </div>

          {method === "wechat" ? (
            <div className="wechatLoginBox">
              <div className={agreed ? "mockQr" : "mockQr locked"}>
                <QrCode size={118} />
                {!agreed ? <strong>请先同意并勾选许可协议和隐私政策</strong> : null}
              </div>
              <button className="wechatAction" onClick={wechatLogin} type="button">
                <MessageCircle size={22} /> 微信扫码即可完成注册登录
              </button>
              <div className="thirdPartyLogin">
                <span />
                <em>使用其他方式登录</em>
                <span />
              </div>
              <div className="thirdPartyButtons" aria-label="其他登录方式">
                <button onClick={() => setStatusText("QQ 登录暂未接入，请使用验证码登录。")} type="button">Q</button>
                <button onClick={() => setStatusText("Apple 登录暂未接入，请使用验证码登录。")} type="button">A</button>
                <button onClick={() => setStatusText("抖音登录暂未接入，请使用验证码登录。")} type="button">抖</button>
              </div>
            </div>
          ) : null}

          {method === "code" ? (
            <div className="authForm">
              <label>
                <span>手机号</span>
                <div className="authInput">
                  <Phone size={18} />
                  <input placeholder="请输入手机号" value={phone} onChange={(event) => setPhone(event.target.value)} />
                </div>
              </label>
              <label>
                <span>验证码</span>
                <div className="authInput codeInput">
                  <LockKeyhole size={18} />
                  <input placeholder="请输入6位验证码" value={code} onChange={(event) => setCode(event.target.value)} />
                  <button onClick={() => setStatusText("验证码已发送。测试阶段可输入任意6位数字。")} type="button">
                    获取验证码
                  </button>
                </div>
              </label>
              <button className="authPrimary" onClick={loginByCode} disabled={isSubmitting} type="button">
                {isSubmitting ? "正在登录..." : "登录 / 注册"}
              </button>
            </div>
          ) : null}

          {method === "password" ? (
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
          ) : null}

          {statusText ? <div className="authStatus">{statusText}</div> : null}

          <label className="modernAgreement">
            <input checked={agreed} onChange={(event) => setAgreed(event.target.checked)} type="checkbox" />
            <span>
              我已阅读并同意 AIGClancer <Link href="/terms">许可协议</Link> 和 <Link href="/privacy">隐私政策</Link>，未注册账号登录时会自动创建账号
            </span>
          </label>

          <div className="dispatchRoleTips">
            <p>{activeRole.helper}</p>
            <div>
              <CheckCircle2 size={15} />
              <span>同一主体可同时开通派单和接单能力</span>
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
