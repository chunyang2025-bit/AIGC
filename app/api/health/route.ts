import { getServerSupabase, isSupabaseServerConfigured } from "../../../lib/server/auth";
import { getMarketplaceData } from "../../../lib/server/data";
import { getIntegrationStatus, getProductionEnvChecks, getUploadLimits, isProductionRuntime } from "../../../lib/server/env";
import { apiOk } from "../../../lib/server/response";

export const dynamic = "force-dynamic";

type HealthCheck = {
  name: string;
  ok: boolean;
  message: string;
};

export async function GET() {
  const checks: HealthCheck[] = [];
  const isProduction = isProductionRuntime();
  const hasSupabaseConfig = isSupabaseServerConfigured();

  getProductionEnvChecks().forEach((check) => {
    checks.push({
      name: `env_${check.name.toLowerCase()}`,
      ok: check.severity === "required" ? (!isProduction || check.ok) : true,
      message: check.message
    });
  });

  checks.push({
    name: "supabase_server_config",
    ok: !isProduction || hasSupabaseConfig,
    message: hasSupabaseConfig ? "Supabase 服务端配置已就绪" : isProduction ? "生产环境必须配置 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY" : "本地演示使用内存数据"
  });

  try {
    const data = await getMarketplaceData();
    checks.push({
      name: "data_read",
      ok: true,
      message: `数据读取正常：${data.users.length} 用户，${data.projects.length} 需求`
    });
  } catch (error) {
    checks.push({
      name: "data_read",
      ok: false,
      message: error instanceof Error ? error.message : "数据读取失败"
    });
  }

  const supabase = getServerSupabase();
  if (supabase) {
    for (const bucket of ["public-assets", "private-verifications"]) {
      const { data, error } = await supabase.storage.getBucket(bucket);
      checks.push({
        name: `storage_${bucket}`,
        ok: Boolean(data && !error),
        message: error ? error.message : `${bucket} bucket 已就绪`
      });
    }
  } else {
    checks.push({
      name: "storage_buckets",
      ok: !isProduction,
      message: isProduction ? "生产环境未配置 Supabase Storage" : "本地演示跳过 Storage 检查"
    });
  }

  const uploadLimits = getUploadLimits();
  checks.push({
    name: "upload_limits",
    ok: uploadLimits.maxPublicAssetBytes > 0 && uploadLimits.maxPrivateVerificationBytes > 0,
    message: `公开素材 ${Math.round(uploadLimits.maxPublicAssetBytes / 1024 / 1024)}MB，资质材料 ${Math.round(uploadLimits.maxPrivateVerificationBytes / 1024 / 1024)}MB`
  });

  const integrations = getIntegrationStatus();
  checks.push({
    name: "payment_integration",
    ok: true,
    message: integrations.payments.configured ? `支付服务已配置：${integrations.payments.provider}` : "当前免费入驻阶段未启用线上支付/交易托管"
  });
  checks.push({
    name: "email_notification",
    ok: true,
    message: integrations.email.configured ? `邮件通知已配置：${integrations.email.provider}` : isProduction ? "生产环境建议配置邮件通知" : "本地开发未配置邮件通知"
  });
  checks.push({
    name: "sms_notification",
    ok: true,
    message: integrations.sms.configured ? `短信通知已配置：${integrations.sms.provider}` : isProduction ? "生产环境建议配置短信通知" : "本地开发未配置短信通知"
  });

  const ok = checks.every((check) => check.ok);
  return apiOk({
    ok,
    environment: process.env.NODE_ENV,
    checkedAt: new Date().toISOString(),
    integrations,
    checks
  });
}
