// ponytail: prod has no external telemetry sink, so this just logs. Wire to Sentry/etc. here if needed.
export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  console.error("[error-boundary]", error, {
    route: window.location.pathname,
    ...context,
  });
}
