export function userFacingErrorMessage(error: unknown, fallback = "操作失败，请稍后再试。") {
  const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const message = raw.trim();
  const lower = message.toLowerCase();

  if (!message) return fallback;

  if (lower.includes("user already registered") || lower.includes("already registered") || lower.includes("already exists") || lower.includes("duplicate")) {
    return "账号已注册，请直接登录。";
  }

  if (lower.includes("invalid login credentials") || lower.includes("invalid credentials") || lower.includes("invalid password")) {
    return "账号或密码不正确。";
  }

  if (lower.includes("email not confirmed") || lower.includes("phone not confirmed")) {
    return "账号尚未完成验证，请先完成验证后再登录。";
  }

  if (lower.includes("password should be") || lower.includes("weak password")) {
    return "密码强度不符合要求，请设置 8-32 位并包含字母和数字。";
  }

  if (lower.includes("invalid email") || lower.includes("email address")) {
    return "邮箱格式不正确。";
  }

  if (lower.includes("invalid phone") || lower.includes("phone")) {
    return "手机号格式不正确。";
  }

  if (lower.includes("jwt") || lower.includes("token") || lower.includes("unauthorized")) {
    return "登录状态已失效，请重新登录。";
  }

  if (lower.includes("row-level security") || lower.includes("permission denied") || lower.includes("forbidden")) {
    return "当前账号没有权限执行该操作。";
  }

  if (lower.includes("storage") || lower.includes("bucket") || lower.includes("object")) {
    return "文件上传失败，请稍后再试。";
  }

  if (lower.includes("network") || lower.includes("fetch failed") || lower.includes("timeout")) {
    return "网络连接异常，请稍后再试。";
  }

  return /[a-zA-Z]{3,}/.test(message) ? fallback : message;
}
