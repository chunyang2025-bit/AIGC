type RouteLogMeta = Record<string, unknown>;

function asErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function logRouteInfo(route: string, event: string, meta?: RouteLogMeta) {
  console.log(`[${route}] ${event}`, meta ?? {});
}

export function logRouteSuccess(route: string, meta?: RouteLogMeta) {
  logRouteInfo(route, "success", meta);
}

export function logRouteFailure(route: string, meta: RouteLogMeta | undefined, error: unknown) {
  console.error(`[${route}] failed`, {
    ...(meta ?? {}),
    error: asErrorMessage(error)
  });
}
