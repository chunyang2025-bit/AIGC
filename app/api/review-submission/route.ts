import { submitSubjectReview } from "../../../lib/server/actions";
import { getRequestUser, isSupabaseServerConfigured } from "../../../lib/server/auth";
import { getMarketplaceData, saveMarketplaceData } from "../../../lib/server/data";
import { apiFail, apiOk, readJson } from "../../../lib/server/response";
import { requiredFields } from "../../../lib/server/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readJson(request);
  const actor = await getRequestUser(request);
  if (isSupabaseServerConfigured() && !actor) {
    return apiFail(401, "请先登录后再提交认证审核");
  }

  const missing = requiredFields(body, ["subjectType", "id"]);
  if (missing.length) {
    return apiFail(400, "缺少必要字段", { missing });
  }

  const data = await getMarketplaceData();
  const subject = submitSubjectReview(data, body);
  if (!subject) {
    return apiFail(404, "未找到待提交的主体资料");
  }

  await saveMarketplaceData(data);
  return apiOk(subject);
}
