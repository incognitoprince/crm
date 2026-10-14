import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { INVOICE_PAPER_WIDTH } from "./invoiceLayout";

export interface InvoiceRender {
  canvas: HTMLCanvasElement;
  /** Heights (CSS px from the top of the invoice) where a page may safely end. */
  breaks: number[];
  /** Full invoice height in CSS px. */
  height: number;
}

/** Renders an unscaled A4-width copy of the invoice off-screen and captures it. */
export async function renderInvoice(source: HTMLElement, scale: number): Promise<InvoiceRender> {
  await document.fonts?.ready;

  const clone = source.cloneNode(true) as HTMLElement;
  Object.assign(clone.style, {
    position: "absolute",
    left: "-100000px",
    top: "0",
    margin: "0",
    width: INVOICE_PAPER_WIDTH + "px",
    transform: "none",
    backgroundColor: "#ffffff",
  });
  document.body.appendChild(clone);

  try {
    await Promise.all(
      Array.from(clone.querySelectorAll("img")).map(
        img =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>(resolve => {
                img.addEventListener("load", () => resolve(), { once: true });
                img.addEventListener("error", () => resolve(), { once: true });
              }),
      ),
    );
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

    const top = clone.getBoundingClientRect().top;
    const height = Math.ceil(clone.getBoundingClientRect().height);
    const breaks = Array.from(clone.querySelectorAll<HTMLElement>("[data-pdf-break]"))
      .map(el => Math.round(el.getBoundingClientRect().bottom - top))
      .filter(b => b > 0 && b <= height)
      .sort((a, b) => a - b);

    const canvas = await html2canvas(clone, {
      backgroundColor: "#ffffff",
      scale,
      useCORS: true,
      allowTaint: false,
      logging: false,
      width: INVOICE_PAPER_WIDTH,
      windowWidth: INVOICE_PAPER_WIDTH,
    });
    return { canvas, breaks, height };
  } finally {
    clone.remove();
  }
}

export function canvasToPngBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error("Unable to create invoice image"))), "image/png"),
  );
}

const PAGE_H_PX = Math.round((INVOICE_PAPER_WIDTH * 297) / 210); // A4 height at the invoice width
const MARGIN_PX = 36; // breathing room at the top of continuation pages and bottom of every page
const FIT_TOLERANCE = 1.08; // a slightly-too-long invoice is shrunk onto one page instead of spilling a sliver

export interface PagePlan { start: number; end: number; topPad: number }

/** Decides where each page starts/ends (CSS px). A page only ends at a safe break
 *  (between rows/sections) unless a single block is taller than a whole page. */
export function planPages(height: number, breaks: number[]): PagePlan[] {
  const plans: PagePlan[] = [];
  let start = 0;
  while (start < height - 1) {
    const topPad = plans.length === 0 ? 0 : MARGIN_PX;
    const capacity = PAGE_H_PX - topPad - MARGIN_PX;
    let end = start + capacity;
    if (end >= height) end = height;
    else {
      const safe = breaks.filter(b => b > start + 40 && b <= end);
      if (safe.length) end = safe[safe.length - 1];
    }
    plans.push({ start, end, topPad });
    start = end;
  }
  return plans;
}

/** Builds an A4 PDF. Page breaks only happen between rows/sections, never through text. */
export function buildInvoicePdf({ canvas, breaks, height }: InvoiceRender) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const mmPerPx = pageW / INVOICE_PAPER_WIDTH;
  const ratio = canvas.width / INVOICE_PAPER_WIDTH; // canvas px per CSS px

  // One page: fit as-is, or shrink slightly if it is only a little too tall.
  if (height <= PAGE_H_PX * FIT_TOLERANCE) {
    const s = Math.min(1, PAGE_H_PX / height);
    const w = pageW * s;
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", (pageW - w) / 2, 0, w, height * mmPerPx * s);
    return pdf;
  }

  planPages(height, breaks).forEach(({ start, end, topPad }, page) => {
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = Math.max(1, Math.round((end - start) * ratio));
    const ctx = slice.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, Math.round(start * ratio), canvas.width, slice.height, 0, 0, slice.width, slice.height);

    if (page > 0) pdf.addPage();
    pdf.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", 0, topPad * mmPerPx, pageW, (end - start) * mmPerPx);
  });
  return pdf;
}
