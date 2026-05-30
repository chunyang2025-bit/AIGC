import { getRequestUser, getServerSupabase, isSupabaseServerConfigured } from "../../../lib/server/auth";
import { apiFail, apiOk } from "../../../lib/server/response";

export const dynamic = "force-dynamic";

const allowedBuckets = ["public-assets", "private-verifications"];

function safeName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const bucket = String(formData.get("bucket") || "public-assets");
  const folder = safeName(String(formData.get("folder") || "uploads"));

  if (!(file instanceof File)) {
    return apiFail(400, "缺少上传文件");
  }
  if (!allowedBuckets.includes(bucket)) {
    return apiFail(400, "上传空间不合法");
  }

  if (!isSupabaseServerConfigured()) {
    return apiFail(501, "未配置 Supabase Storage，本地演示将使用预览或文件名");
  }

  const actor = await getRequestUser(request);
  if (!actor) {
    return apiFail(401, "请先登录后再上传文件");
  }

  const supabase = getServerSupabase();
  if (!supabase) {
    return apiFail(500, "Supabase 未配置");
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const path = `${actor.id}/${folder}/${Date.now()}-${safeName(file.name || `file.${extension}`)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false
  });

  if (error) {
    return apiFail(400, error.message);
  }

  if (bucket === "public-assets") {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return apiOk({ bucket, path, url: data.publicUrl });
  }

  return apiOk({ bucket, path, url: path });
}
