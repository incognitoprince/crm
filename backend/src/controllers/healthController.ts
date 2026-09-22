import type { Request, Response } from "express";
import { env } from "../config/env.js";
import { checkDatabase } from "../services/healthService.js";

function basePayload() {
  return {
    service: "tailoring-crm-api",
    version: env.APP_VERSION,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
  };
}

export function getLive(_req: Request, res: Response) {
  res.status(200).json({
    status: "ok",
    ...basePayload(),
  });
}

export async function getReady(_req: Request, res: Response) {
  const database = await checkDatabase();
  const ok = database.status === "ok";
  res.status(ok ? 200 : 503).json({
    status: ok ? "ok" : "degraded",
    ...basePayload(),
    checks: { database },
  });
}

export async function getHealth(_req: Request, res: Response) {
  const database = await checkDatabase();
  const ok = database.status === "ok";
  res.status(ok ? 200 : 503).json({
    status: ok ? "ok" : "degraded",
    ...basePayload(),
    checks: { database },
  });
}
