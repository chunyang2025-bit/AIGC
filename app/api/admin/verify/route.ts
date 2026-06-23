import { verifySubject } from "../../../../lib/server/actions";
import { getRequestUser, getServerSupabase, isSupabaseServerConfigured } from "../../../../lib/server/auth";
import { getMarketplaceData, invalidateMarketplaceCache, saveMarketplaceData } from "../../../../lib/server/data";
import { logRouteFailure, logRouteSuccess } from "../../../../lib/server/route-log";
import { apiFail, apiOk, readJson } from "../../../../lib/server/response";
import { requiredFields } from "../../../../lib/server/validation";

export const dynamic = "force-dynamic";

function hasReason(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

export async function PATCH(request: Request) {
  const body = await readJson(request);
  const actor = await getRequestUser(request);
  if (isSupabaseServerConfigured() && actor?.role !== "admin") {
    return apiFail(403, "仅平台运营可审核主体");
  }
  const missing = requiredFields(body, ["subjectType", "id"]);
  if (missing.length) {
    return apiFail(400, "缺少必要字段", { missing });
  }
  if (body.verified === false && !hasReason(body.rejectedReason ?? body.reason)) {
    return apiFail(400, "驳回主体时请填写原因");
  }

  try {
    const supabase = getServerSupabase();
    if (supabase && actor?.role === "admin") {
      const subjectType = String(body.subjectType || body.type);
      const idValue = String(body.id || body.subjectId || "");
      const verified = body.verified === undefined ? true : Boolean(body.verified);
      const rejectedReason = verified ? undefined : String(body.rejectedReason || body.reason || "资料不完整，请补充后重新提交。");
      const table = subjectType === "buyer" ? "buyer_profiles" : "creator_profiles";
      const targetType = subjectType === "buyer" ? "buyer_profile" : "creator";

      const { data: existing, error: readError } = await supabase
        .from(table)
        .select("*")
        .or(`id.eq.${idValue},user_id.eq.${idValue}`)
        .maybeSingle();

      if (readError) {
        throw new Error(readError.message);
      }
      if (!existing) {
        return apiFail(404, "未找到审核主体");
      }

      const supportsDraftColumns =
        "review_draft" in existing ||
        "review_draft_submitted_at" in existing ||
        "review_draft_rejected_reason" in existing;

      let updatePayload: Record<string, unknown>;
      if (supportsDraftColumns && existing.review_draft && verified) {
        updatePayload = {
          ...(existing.review_draft as Record<string, unknown>),
          verified: true,
          rejected_reason: null,
          review_draft: null,
          review_draft_submitted_at: null,
          review_draft_rejected_reason: null
        };
      } else if (supportsDraftColumns && existing.review_draft && existing.verified && !verified) {
        updatePayload = {
          review_draft_submitted_at: null,
          review_draft_rejected_reason: rejectedReason
        };
      } else if (supportsDraftColumns) {
        updatePayload = {
          verified,
          rejected_reason: rejectedReason ?? null,
          review_draft: verified ? null : existing.review_draft,
          review_draft_submitted_at: verified ? null : existing.review_draft_submitted_at,
          review_draft_rejected_reason: verified ? null : existing.review_draft_rejected_reason
        };
      } else {
        updatePayload = {
          verified,
          rejected_reason: rejectedReason ?? null
        };
      }

      const { data: updatedRows, error: updateError } = await supabase
        .from(table)
        .update(updatePayload)
        .or(`id.eq.${idValue},user_id.eq.${idValue}`)
        .select("*")
        .limit(1);

      if (updateError) {
        throw new Error(updateError.message);
      }

      const subject = updatedRows?.[0];
      if (!subject) {
        return apiFail(404, "未找到审核主体");
      }

      const actorLabel = actor.name ? `运营 ${actor.name}` : `运营(${actor.id})`;
      const { error: activityError } = await supabase.from("activity_events").insert({
        id: `a-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        user_id: String(subject.user_id),
        role: "admin",
        event_type: "review_subject",
        target_type: targetType,
        target_id: String(subject.id),
        note: verified ? `${actorLabel}：主体审核通过` : `${actorLabel}：主体审核驳回：${rejectedReason}`,
        created_at: new Date().toISOString()
      });

      if (activityError) {
        throw new Error(activityError.message);
      }

      invalidateMarketplaceCache();

      logRouteSuccess("api/admin/verify", {
        actorId: actor.id,
        subjectType,
        subjectId: idValue,
        verified
      });
      return apiOk(subject);
    }

    const data = await getMarketplaceData();
    const subject = verifySubject(data, {
      ...body,
      actorId: actor?.id,
      actorName: actor?.name
    });
    if (!subject) {
      return apiFail(404, "未找到审核主体");
    }

    await saveMarketplaceData(data);
    logRouteSuccess("api/admin/verify", {
      actorId: actor?.id ?? null,
      subjectType: body.subjectType ?? null,
      subjectId: body.id ?? null,
      verified: body.verified ?? null
    });
    return apiOk(subject);
  } catch (error) {
    logRouteFailure("api/admin/verify", {
      actorId: actor?.id ?? null,
      subjectType: body.subjectType ?? null,
      subjectId: body.id ?? null,
      verified: body.verified ?? null
    }, error);
    return apiFail(500, "审核保存失败，请稍后重试。");
  }
}
