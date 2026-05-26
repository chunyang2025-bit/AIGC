import { MarketplaceData } from "../types";

export type ApiResult<T> = {
  ok: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiError = {
  ok: false;
  error: string;
  details?: unknown;
};

export type DbTable = keyof MarketplaceData;
