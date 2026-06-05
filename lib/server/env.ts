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

export function isProductionRuntime() {
  return process.env.NODE_ENV === "production";
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3023";
}

export function getUploadLimits() {
  return {
    maxPublicAssetBytes: Number(process.env.UPLOAD_PUBLIC_MAX_MB || 5) * 1024 * 1024,
    maxPrivateVerificationBytes: Number(process.env.UPLOAD_PRIVATE_MAX_MB || 10) * 1024 * 1024
  };
}

export function getProductionEnvChecks() {
  const isProduction = isProductionRuntime();
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

  return [...requiredChecks, ...recommendedChecks, ...optionalChecks];
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
