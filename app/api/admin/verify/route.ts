import { verifySubject } from "../../../../lib/server/actions";
import { getMarketplaceData, saveMarketplaceData } from "../../../../lib/server/data";
import { apiFail, apiOk, readJson } from "../../../../lib/server/response";
import { requiredFields } from "../../../../lib/server/validation";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const body = await readJson(request);
  const missing = requiredFields(body, ["subjectType", "id"]);
  if (missing.length) {
    return apiFail(400, "缺少必要字段", { missing });
  }

  const data = await getMarketplaceData();
  const subject = verifySubject(data, body);
  if (!subject) {
    return apiFail(404, "未找到审核主体");
  }

  await saveMarketplaceData(data);
  return apiOk(subject);
}
