import { createMessage } from "../../../../../lib/server/actions";
import { getRequestUser, isSupabaseServerConfigured } from "../../../../../lib/server/auth";
import { getMarketplaceData, saveMarketplaceData } from "../../../../../lib/server/data";
import { rateLimit } from "../../../../../lib/server/rate-limit";
import { logRouteFailure, logRouteSuccess } from "../../../../../lib/server/route-log";
import { apiFail, apiOk, readJson } from "../../../../../lib/server/response";
import { requiredFields } from "../../../../../lib/server/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const limited = rateLimit(request, "messages:create", 30, 60_000);
  if (!limited.allowed) {
    return apiFail(429, "发送过于频繁，请稍后再试");
  }
  const body = await readJson(request);
  const actor = await getRequestUser(request);
  if (isSupabaseServerConfigured() && !actor) {
    return apiFail(401, "请先登录后再发送消息");
  }
  const missing = requiredFields(body, ["body"]);
  if (missing.length) {
    return apiFail(400, "缺少必要字段", { missing });
  }

  try {
    const data = await getMarketplaceData();
    const order = data.orders.find((item) => item.id === params.id);
    const user = actor ? data.users.find((item) => item.id === actor.id) : null;
    if (user?.status === "suspended") {
      return apiFail(403, user.suspendedReason || "账号已被限制，暂不能发送消息");
    }
    const creator = order ? data.creators.find((item) => item.id === order.creatorId) : null;
    const allowed = actor && order ? order.buyerId === actor.id || creator?.userId === actor.id : true;
    if (isSupabaseServerConfigured() && !allowed) {
      return apiFail(403, "只能在自己的合作线索中发送消息");
    }
    const message = createMessage(data, params.id, actor ? { ...body, senderId: actor.id } : body);
    if (!message) {
      return apiFail(404, "未找到合作线索");
    }

    await saveMarketplaceData(data);
    logRouteSuccess("api/orders/messages", {
      actorId: actor?.id ?? null,
      orderId: params.id,
      messageId: message.id
    });
    return apiOk(message);
  } catch (error) {
    logRouteFailure("api/orders/messages", {
      actorId: actor?.id ?? null,
      orderId: params.id
    }, error);
    return apiFail(500, "消息发送失败，请稍后重试。");
  }
}
