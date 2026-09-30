import { describe, expect, it } from "vitest";
import {
  createSessionConfig,
  REMEMBER_ME_SESSION_SECONDS,
  setSessionCookie,
  TEMPORARY_SESSION_SECONDS,
} from "../src/middleware/auth.js";

describe("session configuration", () => {
  const now = new Date("2026-09-30T12:00:00.000Z");

  it("creates a persistent 30-day session when Remember me is selected", () => {
    const config = createSessionConfig(true, now);
    const headers = new Map<string, string>();
    const response = { setHeader: (name: string, value: string) => headers.set(name, value) };

    setSessionCookie(response, "session-token", config.maxAgeSeconds);

    expect(config.maxAgeSeconds).toBe(REMEMBER_ME_SESSION_SECONDS);
    expect(config.expiresAt.getTime()).toBe(now.getTime() + REMEMBER_ME_SESSION_SECONDS * 1000);
    expect(headers.get("Set-Cookie")).toContain(`Max-Age=${REMEMBER_ME_SESSION_SECONDS}`);
  });

  it("creates a non-persistent, short-lived session when Remember me is not selected", () => {
    const config = createSessionConfig(false, now);
    const headers = new Map<string, string>();
    const response = { setHeader: (name: string, value: string) => headers.set(name, value) };

    setSessionCookie(response, "session-token", config.maxAgeSeconds);

    expect(config.expiresAt.getTime()).toBe(now.getTime() + TEMPORARY_SESSION_SECONDS * 1000);
    expect(headers.get("Set-Cookie")).toContain("tailoring-session=session-token");
    expect(headers.get("Set-Cookie")).not.toContain("Max-Age=");
  });
});
