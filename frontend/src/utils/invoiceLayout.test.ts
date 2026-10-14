import { describe, expect, it } from "vitest";
import { amountInWords } from "./invoiceLayout";

describe("amountInWords", () => {
  it("handles zero", () => expect(amountInWords(0)).toBe("Zero Kuwaiti Dinar Only"));
  it("handles singular and plural dinars", () => {
    expect(amountInWords(1000)).toBe("One Kuwaiti Dinar Only");
    expect(amountInWords(20000)).toBe("Twenty Kuwaiti Dinars Only");
  });
  it("adds fils in words", () => expect(amountInWords(12500)).toBe("Twelve Kuwaiti Dinars and Five Hundred Fils Only"));
  it("handles amounts below one dinar", () => expect(amountInWords(750)).toBe("Seven Hundred Fifty Fils Only"));
  it("handles thousands", () => expect(amountInWords(1_234_000)).toBe("One Thousand Two Hundred Thirty Four Kuwaiti Dinars Only"));
});
