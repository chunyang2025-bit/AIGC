"use client";

const KEY = "aigclancer-candidate-creators-v1";

type CandidateMap = Record<string, string[]>;

function readMap(): CandidateMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || "{}") as CandidateMap;
  } catch {
    return {};
  }
}

function writeMap(value: CandidateMap) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(value));
  }
}

export function readCandidateCreatorIds(projectId: string) {
  return readMap()[projectId] ?? [];
}

export function toggleCandidateCreator(projectId: string, creatorId: string) {
  const map = readMap();
  const current = map[projectId] ?? [];
  map[projectId] = current.includes(creatorId)
    ? current.filter((item) => item !== creatorId)
    : [...current, creatorId];
  writeMap(map);
  return map[projectId];
}

export function isCandidateCreator(projectId: string, creatorId: string) {
  return readCandidateCreatorIds(projectId).includes(creatorId);
}
