import type { DraftBriefResult } from "./brief-agent";

export type GrowthToolMode = "project" | "training" | "pricing" | "course";

export type SavedGrowthToolDraft = {
  mode: GrowthToolMode;
  idea: string;
  result: DraftBriefResult;
  savedAt: string;
};

export const GROWTH_TOOL_DRAFT_KEY = "aigclancer-growth-tool-draft-v1";

export function saveGrowthToolDraft(input: Omit<SavedGrowthToolDraft, "savedAt">) {
  if (typeof window === "undefined") return;
  const payload: SavedGrowthToolDraft = {
    ...input,
    savedAt: new Date().toISOString()
  };
  window.localStorage.setItem(GROWTH_TOOL_DRAFT_KEY, JSON.stringify(payload));
}

export function readGrowthToolDraft() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(GROWTH_TOOL_DRAFT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SavedGrowthToolDraft;
    if (!parsed.idea || !parsed.result?.agentBrief) return null;
    return parsed;
  } catch {
    window.localStorage.removeItem(GROWTH_TOOL_DRAFT_KEY);
    return null;
  }
}

export function clearGrowthToolDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(GROWTH_TOOL_DRAFT_KEY);
}
