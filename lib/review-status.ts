import { BuyerProfile, CreatorProfile, MarketplaceData } from "./types";

type ReviewTargetType = "buyer_profile" | "creator";
type ReviewEventLike = {
  userId?: string;
  eventType?: string;
  targetType?: string;
  createdAt?: string;
};

function normalizeValue(value?: string) {
  return String(value ?? "").trim();
}

function normalizeList(values?: string[]) {
  return Array.from(new Set((values ?? []).map((item) => item.trim()).filter(Boolean))).sort();
}

function sameList(a?: string[], b?: string[]) {
  const left = normalizeList(a);
  const right = normalizeList(b);
  if (left.length !== right.length) return false;
  return left.every((item, index) => item === right[index]);
}

function latestEventTime(
  data: { activityEvents?: ReviewEventLike[] },
  userId: string,
  targetType: ReviewTargetType,
  eventType: "browse" | "submit_review"
) {
  let latest = 0;

  for (const event of data.activityEvents ?? []) {
    if (event.userId !== userId || event.targetType !== targetType || event.eventType !== eventType) continue;
    const timestamp = Date.parse(event.createdAt ?? "");
    if (!Number.isNaN(timestamp) && timestamp > latest) {
      latest = timestamp;
    }
  }

  return latest;
}

export function hasActiveReviewSubmission(
  data: { activityEvents?: ReviewEventLike[] },
  userId: string,
  targetType: ReviewTargetType
) {
  const latestSubmit = latestEventTime(data, userId, targetType, "submit_review");
  if (!latestSubmit) return false;

  const latestProfileSave = latestEventTime(data, userId, targetType, "browse");
  return latestSubmit >= latestProfileSave;
}

export function buyerVerificationFieldsChanged(existing: BuyerProfile | null | undefined, next: BuyerProfile) {
  if (!existing) return false;

  return (
    normalizeValue(existing.companyName) !== normalizeValue(next.companyName) ||
    normalizeValue(existing.verificationType) !== normalizeValue(next.verificationType) ||
    normalizeValue(existing.businessLicenseFile) !== normalizeValue(next.businessLicenseFile) ||
    !sameList(existing.qualificationFiles, next.qualificationFiles)
  );
}

export function creatorVerificationFieldsChanged(existing: CreatorProfile | null | undefined, next: CreatorProfile) {
  if (!existing) return false;

  return (
    normalizeValue(existing.name) !== normalizeValue(next.name) ||
    normalizeValue(existing.identityType ?? existing.verificationType) !== normalizeValue(next.identityType ?? next.verificationType) ||
    normalizeValue(existing.credentialFile) !== normalizeValue(next.credentialFile) ||
    !sameList(existing.qualificationFiles, next.qualificationFiles)
  );
}

function displayValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.length ? value.join("、") : "未填写";
  }
  const text = String(value ?? "").trim();
  return text || "未填写";
}

export function buyerReviewDiff(profile: BuyerProfile) {
  const draft = profile.reviewDraft as Partial<BuyerProfile> | undefined;
  if (!draft) return [];

  const fields: Array<{ key: keyof BuyerProfile; label: string }> = [
    { key: "companyName", label: "主体名称" },
    { key: "verificationType", label: "认证主体类型" },
    { key: "businessLicenseFile", label: "主资质文件" },
    { key: "qualificationFiles", label: "补充资质" },
    { key: "contactEmail", label: "联系邮箱" },
    { key: "contactPhone", label: "联系电话" }
  ];

  return fields.flatMap(({ key, label }) => {
    const current = profile[key];
    const next = draft[key];
    if (JSON.stringify(current ?? null) === JSON.stringify(next ?? null)) return [];
    return [{
      key: String(key),
      label,
      current: displayValue(current),
      next: displayValue(next)
    }];
  });
}

export function creatorReviewDiff(profile: CreatorProfile) {
  const draft = profile.reviewDraft as Partial<CreatorProfile> | undefined;
  if (!draft) return [];

  const fields: Array<{ key: keyof CreatorProfile; label: string }> = [
    { key: "name", label: "展示主体名称" },
    { key: "verificationType", label: "认证主体类型" },
    { key: "credentialFile", label: "主资质文件" },
    { key: "qualificationFiles", label: "补充资质" },
    { key: "contactEmail", label: "联系邮箱" },
    { key: "contactPhone", label: "联系电话" }
  ];

  return fields.flatMap(({ key, label }) => {
    const current = profile[key];
    const next = draft[key];
    if (JSON.stringify(current ?? null) === JSON.stringify(next ?? null)) return [];
    return [{
      key: String(key),
      label,
      current: displayValue(current),
      next: displayValue(next)
    }];
  });
}
