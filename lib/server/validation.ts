import { DeliverableType, ProjectCategory, ProjectUrgency, ProjectUseCase, VerificationType } from "../types";
import { projectCategories } from "../project-categories";

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

export const projectUseCases: ProjectUseCase[] = ["marketing", "ecommerce", "training", "brand", "internal_efficiency", "product_launch", "other"];

export const deliverableTypes: DeliverableType[] = ["image", "video", "copywriting", "digital_human", "workflow", "model", "voice", "ppt", "other"];

export const projectUrgencies: ProjectUrgency[] = ["normal", "this_week", "urgent"];

export function requiredFields(body: Record<string, unknown>, fields: string[]) {
  return fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === "");
}

export function asProjectCategory(value: unknown): ProjectCategory {
  return projectCategories.includes(value as ProjectCategory) ? (value as ProjectCategory) : "AI Short Video";
}

export function asVerificationType(value: unknown): VerificationType {
  return verificationTypes.includes(value as VerificationType) ? (value as VerificationType) : "other";
}

export function asProjectUseCase(value: unknown): ProjectUseCase {
  return projectUseCases.includes(value as ProjectUseCase) ? (value as ProjectUseCase) : "marketing";
}

export function asDeliverableTypes(value: unknown): DeliverableType[] {
  return asStringArray(value).filter((item): item is DeliverableType => deliverableTypes.includes(item as DeliverableType));
}

export function asProjectUrgency(value: unknown): ProjectUrgency {
  return projectUrgencies.includes(value as ProjectUrgency) ? (value as ProjectUrgency) : "normal";
}

export function asBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value === "true" || value === "1" || value === "yes") return true;
    if (value === "false" || value === "0" || value === "no") return false;
  }
  return fallback;
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
