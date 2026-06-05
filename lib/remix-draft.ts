import type { AgentBrief, CreatorProfile, DeliverableType, ProjectCategory, ProjectUrgency, ProjectUseCase, ServicePackage, TrainingProfile, TrainingRequirement } from "./types";

export type RemixProjectDraft = {
  type: "project";
  sourceProjectId: string;
  sourceTitle: string;
  project: {
    title: string;
    description: string;
    category: ProjectCategory;
    tags?: string[];
    useCase?: ProjectUseCase;
    deliverableTypes?: DeliverableType[];
    urgency?: ProjectUrgency;
    needInvoice?: boolean;
    longTerm?: boolean;
    acceptPlatformRecommend?: boolean;
    trainingRequirement?: TrainingRequirement;
    budget: number;
    deadline: string;
    agentBrief?: AgentBrief;
  };
  savedAt: string;
};

export type RemixCreatorDraft = {
  type: "creator";
  sourceCreatorId: string;
  sourceName: string;
  creator: Pick<CreatorProfile, "title" | "bio" | "skills" | "categories" | "priceMin" | "priceMax" | "responseTime" | "serviceArea"> & {
    servicePackages?: ServicePackage[];
    trainingProfile?: TrainingProfile;
  };
  savedAt: string;
};

export type RemixDraft = RemixProjectDraft | RemixCreatorDraft;

export const REMIX_DRAFT_KEY = "aigclancer-remix-draft-v1";

export function saveRemixDraft(input: Omit<RemixProjectDraft, "savedAt"> | Omit<RemixCreatorDraft, "savedAt">) {
  if (typeof window === "undefined") return;
  const payload = {
    ...input,
    savedAt: new Date().toISOString()
  } as RemixDraft;
  window.localStorage.setItem(REMIX_DRAFT_KEY, JSON.stringify(payload));
}

export function readRemixDraft() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(REMIX_DRAFT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as RemixDraft;
    if (!parsed.type || !parsed.savedAt) return null;
    return parsed;
  } catch {
    window.localStorage.removeItem(REMIX_DRAFT_KEY);
    return null;
  }
}

export function clearRemixDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(REMIX_DRAFT_KEY);
}
