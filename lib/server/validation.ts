import { ProjectCategory, VerificationType } from "../types";

export const projectCategories: ProjectCategory[] = ["AI Short Video", "Image Design", "Digital Human"];

export const verificationTypes: VerificationType[] = [
  "enterprise",
  "individual_business",
  "individual",
  "government",
  "public_institution",
  "social_organization",
  "school",
  "media",
  "brand_owner",
  "other"
];

export function requiredFields(body: Record<string, unknown>, fields: string[]) {
  return fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === "");
}

export function asProjectCategory(value: unknown): ProjectCategory {
  return projectCategories.includes(value as ProjectCategory) ? (value as ProjectCategory) : "AI Short Video";
}

export function asVerificationType(value: unknown): VerificationType {
  return verificationTypes.includes(value as VerificationType) ? (value as VerificationType) : "other";
}

export function asStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[,\n，、]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
