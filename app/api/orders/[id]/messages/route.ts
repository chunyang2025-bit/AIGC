import { createMessage } from "../../../../../lib/server/actions";
import { getMarketplaceData, saveMarketplaceData } from "../../../../../lib/server/data";
import { apiFail, apiOk, readJson } from "../../../../../lib/server/response";
import { requiredFields } from "../../../../../lib/server/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await readJson(request);
  const missing = requiredFields(body, ["body"]);
  if (missing.length) {
    return apiFail(400, "缺少必要字段", { missing });
  }

  const data = await getMarketplaceData();
  const message = createMessage(data, params.id, body);
  if (!message) {
    return apiFail(404, "未找到合作线索");
  }

  await saveMarketplaceData(data);
  return apiOk(message);
}
