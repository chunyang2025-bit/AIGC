import { NextResponse } from "next/server";
import { ApiError, ApiResult } from "./types";

export function apiOk<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json<ApiResult<T>>({
    ok: true,
    data,
    ...(meta ? { meta } : {})
  });
}

export function apiFail(status: number, error: string, details?: unknown) {
  return NextResponse.json<ApiError>(
    {
      ok: false,
      error,
      ...(details ? { details } : {})
    },
    { status }
  );
}

export async function readJson<T extends Record<string, unknown>>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    return {} as T;
  }
}
