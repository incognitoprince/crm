import { logger } from "../config/logger.js";
import { prisma } from "../config/prisma.js";

export type CheckStatus = "ok" | "error";

export async function checkDatabase(): Promise<{ status: CheckStatus; latencyMs: number }> {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "ok", latencyMs: Date.now() - started };
  } catch (error) {
    logger.error({ err: error }, "Database health check failed");
    return { status: "error", latencyMs: Date.now() - started };
  }
}
