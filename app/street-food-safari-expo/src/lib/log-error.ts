export function logError(error: unknown, context?: Record<string, unknown>): void {
  if (context && Object.keys(context).length > 0) {
    console.error("[error]", error, context);
  } else {
    console.error("[error]", error);
  }
}
