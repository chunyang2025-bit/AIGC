import { MarketplaceData } from "../types";

export type ApiResult<T> = {
  ok: true;
  data: T;
  requestId: string;
  meta?: Record<string, unknown>;
};

export type ApiError = {
  ok: false;
  error: string;
  requestId: string;
  details?: unknown;
};

export type DbTable = keyof MarketplaceData;
