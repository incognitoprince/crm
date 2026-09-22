import { describe, expect, it } from "vitest";
import { formatLatency } from "./utils/cn";

describe("formatLatency", () => {
  it("appends milliseconds", () => {
    expect(formatLatency(12)).toBe("12 ms");
  });
});
