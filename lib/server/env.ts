export type EnvCheck = {
  name: string;
  ok: boolean;
  message: string;
  severity: "required" | "recommended" | "optional";
};

export const productionRequiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_INVITE_CODE",
  "NEXT_PUBLIC_APP_URL"
] as const;

export const productionRecommendedEnv = [
  "NOTIFICATION_EMAIL_PROVIDER",
  "NOTIFICATION_EMAIL_API_KEY",
  "NOTIFICATION_SMS_PROVIDER",
  "NOTIFICATION_SMS_API_KEY"
] as const;

export const productionOptionalEnv = [
  "PAYMENT_PROVIDER",
  "PAYMENT_API_KEY",
  "PAYMENT_WEBHOOK_SECRET"
] as const;

export type AiStoryProviderStatus = {
  configured: boolean;
  provider: "deepseek" | "openai" | "none";
  model: string | null;
  baseUrl: string | null;
};

export function isProductionRuntime() {
  return process.env.NODE_ENV === "production";
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3023";
}

function isLocalUrl(url: string) {
  return url.includes("127.0.0.1") || url.includes("localhost");
}

function isHttpsUrl(url: string) {
  return /^https:\/\//i.test(url);
}

export function getRequestOrigin(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");
  if (!host) return new URL(request.url).origin;

  const forwardedProto = request.headers.get("x-forwarded-proto");
  const proto = forwardedProto || new URL(request.url).protocol.replace(":", "");
  return `${proto}://${host}`;
}

export function getRuntimeAppUrl(request?: Request) {
  const configured = getAppUrl().replace(/\/$/, "");
  if (!request || isProductionRuntime()) return configured;
  return getRequestOrigin(request).replace(/\/$/, "");
}

export function getPasswordResetReadiness(appUrlInput?: string) {
  const isProduction = isProductionRuntime();
  const appUrl = (appUrlInput || getAppUrl()).replace(/\/$/, "");
  const recoveryUrl = `${appUrl}/reset-password`;
  const hasPublicAuthConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const usesHttps = appUrl.startsWith("https://");

  if (!hasPublicAuthConfig) {
    return {
      ok: !isProduction,
      recoveryUrl,
      message: isProduction
        ? "生产环境必须配置 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY 才能启用邮箱找回密码"
        : "本地开发未启用邮箱找回密码"
    };
  }

  if (isProduction && !usesHttps) {
    return {
      ok: false,
      recoveryUrl,
      message: `生产环境密码重置跳转地址必须使用 HTTPS：${recoveryUrl}`
    };
  }

  return {
    ok: true,
    recoveryUrl,
    message: `邮箱找回密码接口已就绪，请确认 Supabase Auth 已开启 Email provider，并将 ${recoveryUrl} 加入 Redirect URLs`
  };
}

export function getUploadLimits() {
  return {
    maxPublicAssetBytes: Number(process.env.UPLOAD_PUBLIC_MAX_MB || 5) * 1024 * 1024,
    maxPrivateVerificationBytes: Number(process.env.UPLOAD_PRIVATE_MAX_MB || 10) * 1024 * 1024
  };
}

export function getProductionEnvChecks() {
  const isProduction = isProductionRuntime();
  const appUrl = getAppUrl().replace(/\/$/, "");
  const inviteCode = String(process.env.ADMIN_INVITE_CODE || "");
  const supabaseUrl = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "");
  const requiredChecks: EnvCheck[] = productionRequiredEnv.map((name) => ({
    name,
    ok: Boolean(process.env[name]),
    severity: "required",
    message: process.env[name]
      ? `${name} 已配置`
      : isProduction
        ? `生产环境必须配置 ${name}`
        : `本地开发未配置 ${name}`
  }));

  const recommendedChecks: EnvCheck[] = productionRecommendedEnv.map((name) => ({
    name,
    ok: Boolean(process.env[name]),
    severity: "recommended",
    message: process.env[name] ? `${name} 已配置` : `正式商业化建议配置 ${name}`
  }));

  const optionalChecks: EnvCheck[] = productionOptionalEnv.map((name) => ({
    name,
    ok: Boolean(process.env[name]),
    severity: "optional",
    message: process.env[name] ? `${name} 已配置` : `当前免费入驻阶段可暂不配置 ${name}`
  }));

  const runtimeChecks: EnvCheck[] = [
    {
      name: "next_public_app_url_https",
      ok: !isProduction || (isHttpsUrl(appUrl) && !isLocalUrl(appUrl)),
      severity: "required",
      message: !appUrl
        ? "NEXT_PUBLIC_APP_URL 未配置"
        : !isProduction || (isHttpsUrl(appUrl) && !isLocalUrl(appUrl))
          ? `NEXT_PUBLIC_APP_URL 使用正式 HTTPS 域名：${appUrl}`
          : `生产环境 NEXT_PUBLIC_APP_URL 必须是正式 HTTPS 域名，当前为 ${appUrl}`
    },
    {
      name: "admin_invite_code_strength",
      ok: !isProduction || inviteCode.length >= 16,
      severity: "required",
      message: inviteCode.length >= 16
        ? "ADMIN_INVITE_CODE 强度已满足生产要求"
        : "生产环境 ADMIN_INVITE_CODE 建议至少 16 位"
    },
    {
      name: "supabase_url_https",
      ok: !supabaseUrl || isHttpsUrl(supabaseUrl),
      severity: "required",
      message: !supabaseUrl
        ? isProduction
          ? "生产环境必须配置 NEXT_PUBLIC_SUPABASE_URL"
          : "本地开发未配置 NEXT_PUBLIC_SUPABASE_URL"
        : isHttpsUrl(supabaseUrl)
          ? "NEXT_PUBLIC_SUPABASE_URL 使用 HTTPS"
          : `NEXT_PUBLIC_SUPABASE_URL 必须使用 HTTPS，当前为 ${supabaseUrl}`
    }
  ];

  return [...requiredChecks, ...runtimeChecks, ...recommendedChecks, ...optionalChecks];
}

export function getIntegrationStatus() {
  const paymentProvider = process.env.PAYMENT_PROVIDER || "";
  const emailProvider = process.env.NOTIFICATION_EMAIL_PROVIDER || "";
  const smsProvider = process.env.NOTIFICATION_SMS_PROVIDER || "";

  return {
    payments: {
      configured: Boolean(paymentProvider && process.env.PAYMENT_API_KEY && process.env.PAYMENT_WEBHOOK_SECRET),
      provider: paymentProvider || "not_configured"
    },
    email: {
      configured: Boolean(emailProvider && process.env.NOTIFICATION_EMAIL_API_KEY),
      provider: emailProvider || "not_configured"
    },
    sms: {
      configured: Boolean(smsProvider && process.env.NOTIFICATION_SMS_API_KEY),
      provider: smsProvider || "not_configured"
    }
  };
}

export function getAiStoryProviderStatus(): AiStoryProviderStatus {
  if (process.env.DEEPSEEK_API_KEY) {
    return {
      configured: true,
      provider: "deepseek",
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      baseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com"
    };
  }

  if (process.env.CODEX_API_KEY || process.env.OPENAI_API_KEY) {
    return {
      configured: true,
      provider: "openai",
      model: process.env.CODEX_MODEL || process.env.OPENAI_MODEL || "gpt-5.2",
      baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
    };
  }

  return {
    configured: false,
    provider: "none",
    model: null,
    baseUrl: null
  };
}
