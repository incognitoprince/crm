import { describe, expect, it } from "vitest";
import { planPages } from "./invoiceExport";

describe("planPages", () => {
  it("never leaves a gap or overlap between pages", () => {
    const breaks = Array.from({ length: 40 }, (_, i) => 300 + i * 80);
    const pages = planPages(3600, breaks);
    expect(pages[0].start).toBe(0);
    expect(pages[pages.length - 1].end).toBe(3600);
    pages.forEach((p, i) => { if (i) expect(p.start).toBe(pages[i - 1].end); });
  });
  it("ends pages on a safe break, not mid-row", () => {
    const breaks = Array.from({ length: 40 }, (_, i) => 300 + i * 80);
    const pages = planPages(3600, breaks);
    pages.slice(0, -1).forEach(p => expect(breaks).toContain(p.end));
  });
  it("makes progress even when no safe break exists", () => {
    const pages = planPages(3000, []);
    expect(pages.length).toBeGreaterThan(1);
    expect(pages[pages.length - 1].end).toBe(3000);
  });
});
