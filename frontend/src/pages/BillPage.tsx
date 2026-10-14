import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getBill } from "../services/api";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { FitToWidth } from "../components/FitToWidth";
import { InvoiceMobileView } from "../components/InvoiceMobileView";
import { Icon, type IconName } from "../components/Icons";
import { InvoicePaper, type InvoicePaperData } from "../components/InvoicePaper";
import { INVOICE_PAPER_WIDTH } from "../utils/invoiceLayout";
import { buildInvoicePdf, canvasToPngBlob, renderInvoice } from "../utils/invoiceExport";
import type { Invoice } from "../types";

type Action = "pdf" | "image" | "share-pdf" | "share-image";

function toPaperData(invoice: Invoice): InvoicePaperData {
  return {
    shop: invoice.shop ?? invoice.order?.shop ?? null,
    customer: invoice.customer ?? invoice.order?.customer ?? null,
    invoiceNo: invoice.invoiceNo,
    issuedAt: invoice.issuedAt,
    subject: invoice.subject,
    modelNo: invoice.modelNo,
    notes: invoice.notes,
    totalFils: invoice.totalFils,
    lines: invoice.lines.map(l => ({
      id: l.id,
      imagePath: l.imagePath,
      orderNo: l.orderNo ?? l.order?.orderNo ?? null,
      orderDate: l.orderDate,
      description: l.description,
      quantity: l.quantity,
      unitPriceFils: l.unitPriceFils,
      totalFils: l.totalFils,
    })),
  };
}

function ActionButton({ icon, label, busyLabel, busy, disabled, onClick, variant = "secondary" }: {
  icon: IconName; label: string; busyLabel: string; busy: boolean; disabled: boolean; onClick: () => void; variant?: "primary" | "secondary";
}) {
  const base = "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 sm:h-10 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
  const style = variant === "primary"
    ? "bg-blue-600 text-white"
    : "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-brand-300 hover:text-brand-700";
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={base + " " + style}>
      {busy
        ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        : <Icon name={icon} className="h-[17px] w-[17px]" />}
      {busy ? busyLabel : label}
    </button>
  );
}

export function BillPage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<Action | "">("");
  const paperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (id) getBill(id).then(r => setInvoice(r.data)).catch(e => setError(e instanceof Error ? e.message : "Unable to load invoice"));
  }, [id]);

  if (error && !invoice) return <ErrorState message={error} />;
  if (!invoice) return <LoadingState label="Loading invoice…" />;

  const fileBase = "invoice-" + invoice.invoiceNo;

  async function run(action: Action, task: () => Promise<void>) {
    setBusy(action);
    setError("");
    try {
      await task();
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return; // user closed the share sheet
      setError(e instanceof Error ? e.message : "Something went wrong while preparing the invoice");
    } finally {
      setBusy("");
    }
  }

  function save(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function share(file: File) {
    if (!navigator.share || !navigator.canShare || !navigator.canShare({ files: [file] })) {
      throw new Error("Direct sharing needs HTTPS and a device that supports file sharing. Please use Download on this device.");
    }
    await navigator.share({ title: "Invoice " + invoice!.invoiceNo, text: "Invoice " + invoice!.invoiceNo, files: [file] });
  }

  const needPaper = () => {
    if (!paperRef.current) throw new Error("Invoice is not ready yet");
    return paperRef.current;
  };

  const downloadPdf = () => run("pdf", async () => {
    const pdf = buildInvoicePdf(await renderInvoice(needPaper(), 2));
    pdf.save(fileBase + ".pdf");
  });
  const downloadImage = () => run("image", async () => {
    const r = await renderInvoice(needPaper(), 3);
    save(await canvasToPngBlob(r.canvas), fileBase + ".png");
  });
  const sharePdf = () => run("share-pdf", async () => {
    const blob = buildInvoicePdf(await renderInvoice(needPaper(), 2)).output("blob");
    await share(new File([blob], fileBase + ".pdf", { type: "application/pdf" }));
  });
  const shareImage = () => run("share-image", async () => {
    const r = await renderInvoice(needPaper(), 3);
    await share(new File([await canvasToPngBlob(r.canvas)], fileBase + ".png", { type: "image/png" }));
  });

  const anyBusy = busy !== "";
  const paperData = toPaperData(invoice);

  return (
    <div className="mx-auto max-w-[900px] space-y-5">
      <div className="flex flex-col gap-4 print:hidden lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link to="/bills" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-800">
            <Icon name="arrowLeft" className="h-4 w-4" /> Back to Bills
          </Link>
          <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-navy-900">Invoice {invoice.invoiceNo}</h2>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <ActionButton variant="primary" icon="download" label="Download PDF" busyLabel="Preparing…" busy={busy === "pdf"} disabled={anyBusy} onClick={() => void downloadPdf()} />
          <ActionButton icon="image" label="Download Image" busyLabel="Preparing…" busy={busy === "image"} disabled={anyBusy} onClick={() => void downloadImage()} />
          <ActionButton icon="share" label="Share PDF" busyLabel="Preparing…" busy={busy === "share-pdf"} disabled={anyBusy} onClick={() => void sharePdf()} />
          <ActionButton icon="share" label="Share Image" busyLabel="Preparing…" busy={busy === "share-image"} disabled={anyBusy} onClick={() => void shareImage()} />
          <span className="hidden md:contents"><ActionButton icon="printer" label="Print" busyLabel="Print" busy={false} disabled={anyBusy} onClick={() => window.print()} /></span>
        </div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 print:hidden">{error}</div>}

      {/* Phones: reflowing layout. The A4 paper below stays mounted (hidden) so PDF/image export still uses it. */}
      <div className="md:hidden print:hidden"><InvoiceMobileView data={paperData} /></div>

      <div className="invoice-stage hidden rounded-3xl bg-gradient-to-b from-slate-200/70 to-slate-200/40 p-3 sm:p-6 md:block print:block print:bg-transparent print:p-0">
        <FitToWidth width={INVOICE_PAPER_WIDTH} className="overflow-hidden rounded-md shadow-[0_20px_60px_-15px_rgba(15,47,102,0.35)] print:overflow-visible print:shadow-none">
          <InvoicePaper ref={paperRef} data={paperData} />
        </FitToWidth>
      </div>
    </div>
  );
}
