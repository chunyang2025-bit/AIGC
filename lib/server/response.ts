import { NextResponse } from "next/server";
import { ApiError, ApiResult } from "./types";
import { randomUUID } from "node:crypto";

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0"
};

export function apiOk<T>(data: T, meta?: Record<string, unknown>) {
  const requestId = randomUUID();
  return NextResponse.json<ApiResult<T>>({
    ok: true,
    data,
    requestId,
    ...(meta ? { meta } : {})
  }, {
    headers: noStoreHeaders
  });
}

export function apiFail(status: number, error: string, details?: unknown) {
  const requestId = randomUUID();
  return NextResponse.json<ApiError>(
    {
      ok: false,
      error,
      requestId,
      ...(details ? { details } : {})
    },
    {
      status,
      headers: noStoreHeaders
    }
  );
}

export async function readJson<T extends Record<string, unknown>>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    return {} as T;
  }
}
