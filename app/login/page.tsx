"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BriefcaseBusiness, CheckCircle2, Headphones, HelpCircle, LockKeyhole, Phone, ShieldCheck, Sparkles, UserCog } from "lucide-react";
import { loginAccount, registerAccount, roleProfilePath, roleWorkbenchPath } from "@/lib/auth";

const publicRoles = [
  {
    key: "dispatch",
    href: "/buyer/profile",
    icon: BriefcaseBusiness,
    title: "我要派单",
    subtitle: "机构/品牌/个人/组织",
    button: "登录/注册并完善主体主页",
    helper: "同一个账号可同时开通派单和接单能力。本次选择派单后，先完善派单方资料和资质。",
    points: ["主体基本情况展示", "上传对应资质材料", "Agent 整理历史需求"]
  },
  {
    key: "accept",
    href: "/provider/profile",
    icon: UserCog,
    title: "我要接单",
    subtitle: "创作者/工作室/接单服务商",
    button: "登录/注册并完善展示页",
    helper: "同一个账号可同时开通派单和接单能力。本次选择接单后，先完善接单展示页。",
    points: ["填写服务定位与案例方向", "进入创作者信息大厅", "再浏览公开需求并表达意向"]
  }
];

const adminRole = {
  key: "admin",
  href: "/admin",
  icon: ShieldCheck,
  title: "平台运营",
  subtitle: "平台工作人员/审核人员",
  button: "登录并进入运营后台",
  helper: "仅平台内部人员使用，查看审核、用户、需求、线索和月活数据。",
  points: ["主体资质审核", "需求与线索管理", "月活和 Agent 指标看板"]
};

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRole = searchParams.get("role");
  const visibleRoles = requestedRole === "admin" ? [adminRole] : publicRoles;
  const initialRole = visibleRoles.some((role) => role.key === requestedRole) ? requestedRole ?? "accept" : "accept";
  const [activeKey, setActiveKey] = useState(initialRole);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [statusText, setStatusText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const activeRole = visibleRoles.find((role) => role.key === activeKey) ?? visibleRoles[0];
  const ActiveIcon = activeRole.icon;
  const activeRoleValue = activeRole.key === "dispatch" ? "buyer" : activeRole.key === "accept" ? "creator" : "admin";

  function validateInput() {
    setStatusText("");
    if (!phone.trim() || !email.trim()) {
      setStatusText("请先填写手机号和邮箱。");
      return false;
    }
    return true;
  }

  function register() {
    if (!validateInput()) return;
    if (activeRoleValue === "admin") {
      setStatusText("平台运营账号不开放自助注册，请使用已分配的内部账号登录。");
      return;
    }
    try {
      setIsSubmitting(true);
      registerAccount({
        role: activeRoleValue,
        phone: phone.trim(),
        email: email.trim(),
        name: email.trim()
      });
      setMode("login");
      setStatusText("注册成功，请使用刚才的账号登录。");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "注册失败，请稍后再试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  function login() {
    if (!validateInput()) return;
    try {
      setIsSubmitting(true);
      const session = loginAccount({
        role: activeRoleValue,
        phone: phone.trim(),
        email: email.trim(),
        name: email.trim()
      });
      setStatusText("登录成功，正在进入对应工作台。");
      router.push(session.status === "approved" ? roleWorkbenchPath(session.role) : roleProfilePath(session.role));
    } catch (error) {
      const message = error instanceof Error ? error.message : "登录失败，请稍后再试。";
      if (message.includes("先注册") || message.includes("未找到账号")) {
        setMode("register");
        setStatusText("没有找到账号，请先完成注册。");
      } else {
        setStatusText(message);
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
          <span>灵工智创平台</span>
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
          <div className="posterBadge">AI内容生产</div>
          <div className="posterCard">
            <span>公开需求</span>
            <strong>在线派单</strong>
            <em>创作者展示 · Agent撮合 · 线索留痕</em>
          </div>
          <div className="posterBubble one">Brief Agent</div>
          <div className="posterBubble two">Matching Agent</div>
          <div className="posterBubble three">线索/月活统计</div>
        </div>

        <aside className="dispatchLoginPanel">
          <span className="qrLoginHint">
            演示登录
          </span>

          <div className="panelTop">
            <div>
              <strong>主体账号登录</strong>
              <div className="muted">一个主体账号，可同时开通派单和接单两种能力。</div>
            </div>
          </div>

          <div className="dispatchTabs threeTabs" role="tablist" aria-label="登录身份">
            {visibleRoles.map((role) => (
              <button
                className={role.key === activeKey ? "dispatchTab active" : "dispatchTab"}
                key={role.key}
                onClick={() => setActiveKey(role.key)}
                type="button"
              >
                {role.title}
              </button>
            ))}
          </div>

          <div className="selectedRole compact">
            <div className="roleIcon">
              <ActiveIcon size={22} />
            </div>
            <div>
              <strong>{activeRole.title}</strong>
              <span>{activeRole.subtitle}</span>
            </div>
          </div>
          <div className="notice compactNotice">
            一个账号对应一个主体，可分别开通派单能力和接单能力；本次选择只决定登录后进入哪个流程。
          </div>

          <div className="loginForm">
            <label>
              手机号
              <div className="loginInput">
                <Phone size={16} />
                <input placeholder="请输入手机号" value={phone} onChange={(event) => setPhone(event.target.value)} />
              </div>
            </label>
            <label>
              邮箱
              <div className="loginInput">
                <Sparkles size={16} />
                <input placeholder="请输入邮箱" value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
            </label>
            <label>
              验证码
              <div className="loginInput codeInput">
                <LockKeyhole size={16} />
                <input placeholder="请输入验证码" defaultValue="123456" />
                <button
                  onClick={() => setStatusText("MVP演示验证码为 123456，正式上线后接入短信服务。")}
                  type="button"
                >
                  获取验证码
                </button>
              </div>
            </label>
          </div>

          {mode === "login" ? (
            <button className="btn primary loginSubmit orange" onClick={login} disabled={isSubmitting} type="button">
              {isSubmitting ? "正在登录..." : `以${activeRole.title}能力进入`}
            </button>
          ) : (
            <button className="btn primary loginSubmit orange" onClick={register} disabled={isSubmitting} type="button">
              {isSubmitting ? "正在注册..." : "注册账号"}
            </button>
          )}

          {statusText ? <div className="notice compactNotice">{statusText}</div> : null}

          {activeRoleValue !== "admin" ? <div className="toolbarGroup">
            <span className="muted">{mode === "login" ? "还没有账号？" : "已有账号？"}</span>
            <button
              className="btn"
              onClick={() => {
                setStatusText("");
                setMode(mode === "login" ? "register" : "login");
              }}
              disabled={isSubmitting}
              type="button"
            >
              {mode === "login" ? "去注册" : "去登录"}
            </button>
          </div> : null}

          <label className="agreementCheck">
            <input type="checkbox" defaultChecked />
            <span>已阅读并同意《平台使用协议》《隐私政策》</span>
          </label>

          <div className="dispatchRoleTips">
            <p>{activeRole.helper}</p>
            {activeRole.points.map((point) => (
              <div key={point}>
                <CheckCircle2 size={15} />
                <span>{point}</span>
              </div>
            ))}
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
