import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();

describe("health and security baseline", () => {
  it("returns live status without querying the database", async () => {
    const response = await request(app).get("/api/health/live");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.service).toBe("tailoring-crm-api");
  });

  it("returns 404 for unknown routes", async () => {
    const response = await request(app).get("/api/does-not-exist");
    expect(response.status).toBe(404);
    expect(response.body.code).toBe("NOT_FOUND");
  });

  it("requires authentication for protected APIs", async () => {
    for (const url of ["/api/customers", "/api/orders", "/api/bills", "/api/users"]) {
      const response = await request(app).get(url);
      expect(response.status).toBe(401);
    }
  });

  it("does not expose the current user without a session", async () => {
    const response = await request(app).get("/api/auth/me");
    expect(response.status).toBe(401);
  });

  it("rejects cross-origin state-changing requests before authentication", async () => {
    const response = await request(app)
      .post("/api/auth/logout")
      .set("Origin", "https://evil.example");
    expect(response.status).toBe(403);
    expect(response.body.code).toBe("ORIGIN_NOT_ALLOWED");
  });
});
