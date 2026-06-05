import { generateAiStory } from "../../../../lib/server/ai-story";
import { rateLimit } from "../../../../lib/server/rate-limit";
import { apiFail, apiOk, readJson } from "../../../../lib/server/response";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = rateLimit(request, "agent:story", 6, 60_000);
  if (!limited.allowed) {
    return apiFail(429, "故事生成请求过于频繁，请稍后再试");
  }

  const body = await readJson(request);

  try {
    const result = await generateAiStory(body);
    return apiOk(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "故事生成失败";
    if (message === "Invalid admin invite code") {
      return apiFail(403, "访问码不正确");
    }
    if (message.includes("is not configured")) {
      return apiFail(500, "故事生成服务尚未配置");
    }
    if (message === "Story prompt is required") {
      return apiFail(400, "缺少故事提示词");
    }
    return apiFail(502, "AI 故事生成失败");
  }
}
