import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { InvoicePaper, type InvoicePaperData } from "./InvoicePaper";

const base: InvoicePaperData = {
  shop: { id: "s1", name: "Shop1", area: "Area 1", arabicName: "شركة تب توب", englishName: "Tip Top Tailor", address: "Hawalli\nشارع 32", phone: "96632186" },
  customer: { name: "Test Customer", phone: "Not provided", address: null },
  invoiceNo: "INV-0001",
  issuedAt: "2026-10-13T12:00:00",
  totalFils: 12500,
  lines: [{ id: 1, description: "Dress (1 TO 6) YEAR", quantity: 2, unitPriceFils: 6250, totalFils: 12500 }],
};

describe("InvoicePaper", () => {
  it("renders header, totals and words", () => {
    const html = renderToStaticMarkup(<InvoicePaper data={base} />);
    expect(html).toContain("INV-0001");
    expect(html).toContain("13/10/2026");
    expect(html).toContain("K.D. 12.500");
    expect(html).toContain("Twelve Kuwaiti Dinars and Five Hundred Fils Only");
    expect(html).not.toContain("Not provided");
  });
  it("hides image / order columns when every line leaves them blank", () => {
    const html = renderToStaticMarkup(<InvoicePaper data={base} />);
    expect(html).not.toContain(">Image<");
    expect(html).not.toContain(">Order No<");
    expect(html).not.toContain(">Order Date<");
  });
  it("shows those columns when a line uses them", () => {
    const html = renderToStaticMarkup(
      <InvoicePaper data={{ ...base, lines: [{ ...base.lines[0], orderNo: "ORD-9", imagePath: "/x.png", orderDate: "2026-10-01T10:00:00" }] }} />,
    );
    expect(html).toContain(">Image<");
    expect(html).toContain(">Order No<");
    expect(html).toContain("ORD-9");
    expect(html).toContain(">Order Date<");
  });
});
