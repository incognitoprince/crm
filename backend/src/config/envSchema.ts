/** Lightweight env sanity checks without extra runtime dependencies. */
export function z(env: {
  NODE_ENV: string;
  CORS_ORIGIN: string;
}): void {
  const allowed = new Set(["development", "test", "production"]);
  if (!allowed.has(env.NODE_ENV)) {
    throw new Error(`NODE_ENV must be one of ${[...allowed].join(", ")}`);
  }
  if (!env.CORS_ORIGIN) {
    throw new Error("CORS_ORIGIN is required");
  }
}
