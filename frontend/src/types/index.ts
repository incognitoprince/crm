export type HealthStatus = "ok" | "degraded" | "error";

export interface DatabaseCheck {
  status: HealthStatus | "error";
  latencyMs: number;
}

export interface HealthResponse {
  status: HealthStatus;
  service: string;
  version?: string;
  timestamp: string;
  uptimeSeconds: number;
  checks?: {
    database: DatabaseCheck;
  };
}

export type AsyncState = "idle" | "loading" | "success" | "error";
