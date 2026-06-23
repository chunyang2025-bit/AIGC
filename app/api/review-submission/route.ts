import { submitSubjectReview } from "../../../lib/server/actions";
import { getRequestUser, getServerSupabase, isSupabaseServerConfigured } from "../../../lib/server/auth";
import { getMarketplaceData, invalidateMarketplaceCache, saveMarketplaceData } from "../../../lib/server/data";
import { logRouteFailure, logRouteSuccess } from "../../../lib/server/route-log";
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

  try {
    const supabase = getServerSupabase();
    if (supabase && actor) {
      const subjectType = String(body.subjectType || body.type);
      const table = subjectType === "buyer" ? "buyer_profiles" : "creator_profiles";
      const targetType = subjectType === "buyer" ? "buyer_profile" : "creator";
      const role = subjectType === "buyer" ? "buyer" : "creator";

      const { data: existingSubject, error: readError } = await supabase
        .from(table)
        .select("*")
        .eq("user_id", actor.id)
        .maybeSingle();

      if (readError) {
        throw new Error(readError.message);
      }
      if (!existingSubject) {
        return apiFail(404, "未找到待提交的主体资料");
      }

      const updatePayload = Boolean(existingSubject.verified) && existingSubject.review_draft
        ? {
            review_draft_submitted_at: new Date().toISOString(),
            review_draft_rejected_reason: null
          }
        : {
            verified: false,
            rejected_reason: null
          };

      const { data: subjects, error: updateError } = await supabase
        .from(table)
        .update(updatePayload)
        .eq("user_id", actor.id)
        .select("*")
        .limit(1);

      if (updateError) {
        throw new Error(updateError.message);
      }

      const subject = subjects?.[0];
      if (!subject) {
        return apiFail(404, "未找到待提交的主体资料");
      }

      const { error: activityError } = await supabase.from("activity_events").insert({
        id: `a-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        user_id: actor.id,
        role,
        event_type: "submit_review",
        target_type: targetType,
        target_id: String(subject.id),
        note: Boolean(existingSubject.verified) && existingSubject.review_draft ? "用户提交认证变更审核" : "用户提交认证审核",
        created_at: new Date().toISOString()
      });

      if (activityError) {
        throw new Error(activityError.message);
      }

      invalidateMarketplaceCache();

      logRouteSuccess("api/review-submission", {
        actorId: actor.id,
        subjectType,
        subjectId: subject.id,
        optimized: true
      });
      return apiOk(subject);
    }

    const data = await getMarketplaceData();
    const subject = submitSubjectReview(data, body);
    if (!subject) {
      return apiFail(404, "未找到待提交的主体资料");
    }

    await saveMarketplaceData(data);
    logRouteSuccess("api/review-submission", {
      actorId: actor?.id ?? null,
      subjectType: body.subjectType ?? null,
      subjectId: body.id ?? null
    });
    return apiOk(subject);
  } catch (error) {
    logRouteFailure("api/review-submission", {
      actorId: actor?.id ?? null,
      subjectType: body.subjectType ?? null,
      subjectId: body.id ?? null
    }, error);
    return apiFail(500, "提交审核失败，请稍后重试。");
  }
}
