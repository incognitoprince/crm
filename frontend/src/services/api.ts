import type { HealthResponse } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export async function getHealth() {
  const response = await fetch(`${API_BASE}/api/health`, {
    headers: { Accept: "application/json" },
  });

  let body: HealthResponse | null = null;
  try {
    body = (await response.json()) as HealthResponse;
  } catch {
    body = null;
  }

  if (!body) {
    throw new Error(`Request failed (${response.status})`);
  }

  return body;
}
