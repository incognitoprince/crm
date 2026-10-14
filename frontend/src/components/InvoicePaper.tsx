import { forwardRef } from "react";
import type { Customer, Shop } from "../types";
import { INVOICE_PAPER_WIDTH, amountInWords } from "../utils/invoiceLayout";

export interface InvoicePaperLine {
  id: string | number;
  imagePath?: string | null;
  orderNo?: string | null;
  orderDate?: string | null;
  description: string;
  quantity: number;
  unitPriceFils: number;
  totalFils: number;
}

export interface InvoicePaperData {
  shop?: Shop | null;
  customer?: Pick<Customer, "name" | "phone" | "address"> | null;
  invoiceNo: string;
  issuedAt: string;
  subject?: string | null;
  modelNo?: string | null;
  notes?: string | null;
  lines: InvoicePaperLine[];
  totalFils: number;
}

const kwd = (fils: number) =>
  (fils / 1000).toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });

const fmtDate = (v: string) =>
  new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });

const clean = (v?: string | null) => {
  const t = v?.trim() ?? "";
  return t && t.toLowerCase() !== "not provided" ? t : "";
};

const NAVY = "#0f2f66";

export const InvoicePaper = forwardRef<HTMLDivElement, { data: InvoicePaperData }>(function InvoicePaper({ data }, ref) {
  const { shop, customer, lines } = data;
  const totalQty = lines.reduce((s, l) => s + l.quantity, 0);

  // Manual invoices often leave these blank: hide a column when nothing uses it.
  const showImage = lines.some(l => !!l.imagePath);
  const showOrderNo = lines.some(l => !!clean(l.orderNo));
  const showOrderDate = lines.some(l => !!l.orderDate);

  const phone = clean(shop?.phone) || clean(shop?.whatsapp);
  const addressLines = (shop?.address ?? "").split("\n").map(s => s.trim()).filter(Boolean);
  const custPhone = clean(customer?.phone);
  const custAddress = clean(customer?.address);
  const shopName = shop?.englishName || shop?.arabicName ? null : shop?.name ?? "Tailor Shop";

  const cols: Array<{ key: string; w?: number }> = [
    { key: "#", w: 34 },
    ...(showImage ? [{ key: "image", w: 86 }] : []),
    ...(showOrderNo ? [{ key: "orderNo", w: 92 }] : []),
    ...(showOrderDate ? [{ key: "orderDate", w: 112 }] : []),
    { key: "details" },
    { key: "qty", w: 52 },
    { key: "rate", w: 84 },
    { key: "total", w: 92 },
  ];

  const th = "px-2.5 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em]";
  const td = "px-2.5 py-2.5 align-middle text-[12px]";

  return (
    <div
      ref={ref}
      className="invoice-paper invoice-printable bg-white text-slate-900"
      style={{ width: INVOICE_PAPER_WIDTH, fontFamily: '"Plus Jakarta Sans Variable","Noto Naskh Arabic Variable",ui-sans-serif,system-ui,sans-serif' }}
    >
      <div data-pdf-break style={{ height: 8, background: `linear-gradient(90deg, ${NAVY}, #2f86f6)` }} />
      <div className="px-10 pb-10 pt-8">
        {/* ---------- Shop header ---------- */}
        <header data-pdf-break>
          <div className="grid grid-cols-[96px_minmax(0,1fr)_96px] items-center gap-3">
            <div className="flex h-24 items-center justify-start">
              {shop?.logoUrl && <img crossOrigin="anonymous" src={shop.logoUrl} alt="Shop logo" className="max-h-24 max-w-[96px] object-contain" />}
            </div>
            <div className="min-w-0 text-center">
              {shop?.arabicName && <p dir="rtl" className="text-[22px] font-bold leading-snug" style={{ color: NAVY }}>{shop.arabicName}</p>}
              {shop?.englishName && <p className="text-[19px] font-extrabold leading-snug tracking-tight" style={{ color: NAVY }}>{shop.englishName}</p>}
              {shopName && <p className="text-[20px] font-extrabold leading-snug" style={{ color: NAVY }}>{shopName}</p>}
              {addressLines.length > 0 && (
                <div className="mt-1.5 space-y-0.5 text-[10px] leading-snug text-slate-600">
                  {addressLines.map((line, i) => <p key={i} dir="auto">{line}</p>)}
                </div>
              )}
              {(phone || shop?.email) && (
                <p className="mt-1.5 text-[11px] font-semibold text-slate-700">
                  {phone && <span>Tel / WhatsApp: {phone}</span>}
                  {phone && shop?.email && <span className="mx-2 text-slate-300">|</span>}
                  {shop?.email && <span>{shop.email}</span>}
                </p>
              )}
            </div>
            <div />
          </div>
          <div className="mt-5 h-[2px] w-full" style={{ background: NAVY }} />
        </header>

        {/* ---------- Title + meta ---------- */}
        <section data-pdf-break className="mt-6 grid grid-cols-[1fr_auto] items-start gap-6">
          <div>
            <h1 className="text-[34px] font-extrabold leading-none tracking-[0.06em]" style={{ color: NAVY }}>INVOICE</h1>
            {data.subject && <p dir="auto" className="mt-2 max-w-[360px] break-words text-[13px] font-medium text-slate-600">{data.subject}</p>}
          </div>
          <div className="min-w-[240px] overflow-hidden rounded-xl border border-slate-300 text-[12px]">
            <div className="flex items-center justify-between gap-6 px-3.5 py-2">
              <span className="font-semibold text-slate-500">Invoice No</span>
              <span className="font-bold">{data.invoiceNo}</span>
            </div>
            <div className="flex items-center justify-between gap-6 border-t border-slate-200 px-3.5 py-2">
              <span className="font-semibold text-slate-500">Invoice Date</span>
              <span className="font-bold">{fmtDate(data.issuedAt)}</span>
            </div>
            {data.modelNo && (
              <div className="flex items-center justify-between gap-6 border-t border-slate-200 px-3.5 py-2">
                <span className="font-semibold text-slate-500">Model No</span>
                <span className="font-bold">{data.modelNo}</span>
              </div>
            )}
          </div>
        </section>

        {/* ---------- Bill to ---------- */}
        <section data-pdf-break className="mt-5 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Bill To</p>
          <p dir="auto" className="mt-1 text-[15px] font-bold">{customer?.name || "Customer"}</p>
          {custPhone && <p className="text-[12px] text-slate-600">{custPhone}</p>}
          {custAddress && <p dir="auto" className="break-words text-[12px] text-slate-600">{custAddress}</p>}
        </section>

        {/* ---------- Items ---------- */}
        <section className="mt-5">
          <div className="overflow-hidden rounded-xl border border-slate-300">
            <table className="w-full table-fixed border-collapse">
              <colgroup>{cols.map(c => <col key={c.key} style={c.w ? { width: c.w } : undefined} />)}</colgroup>
              <thead>
                <tr data-pdf-break style={{ background: NAVY, color: "#fff" }}>
                  <th className={th + " text-center"}>#</th>
                  {showImage && <th className={th + " text-center"}>Image</th>}
                  {showOrderNo && <th className={th + " text-center"}>Order No</th>}
                  {showOrderDate && <th className={th + " text-center"}>Order Date</th>}
                  <th className={th + " text-left"}>Details</th>
                  <th className={th + " text-center"}>Qty</th>
                  <th className={th + " text-right"}>Rate (K.D.)</th>
                  <th className={th + " text-right"}>Total (K.D.)</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => (
                  <tr key={line.id} data-pdf-break style={{ background: i % 2 ? "#f8fafc" : "#fff" }} className="border-t border-slate-200">
                    <td className={td + " text-center font-semibold text-slate-400"}>{i + 1}</td>
                    {showImage && (
                      <td className={td + " text-center"}>
                        {line.imagePath
                          ? <img crossOrigin="anonymous" src={line.imagePath} alt="Design" className="mx-auto h-[64px] w-[64px] rounded-lg border border-slate-200 bg-white object-contain" />
                          : <span className="text-slate-300">—</span>}
                      </td>
                    )}
                    {showOrderNo && <td className={td + " break-words text-center font-semibold"}>{clean(line.orderNo) || "—"}</td>}
                    {showOrderDate && <td className={td + " text-center text-[11px]"}>{line.orderDate ? new Date(line.orderDate).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }) : "—"}</td>}
                    <td dir="auto" className={td + " whitespace-pre-wrap break-words text-left"}>{line.description || <span className="text-slate-300">—</span>}</td>
                    <td className={td + " text-center font-semibold"}>{line.quantity}</td>
                    <td className={td + " text-right tabular-nums"}>{kwd(line.unitPriceFils)}</td>
                    <td className={td + " text-right font-bold tabular-nums"}>{kwd(line.totalFils)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ---------- Totals ---------- */}
        <section data-pdf-break className="mt-5 grid grid-cols-[1fr_290px] items-stretch gap-5">
          <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Amount in words</p>
            <p className="mt-1.5 text-[13px] font-bold uppercase leading-snug tracking-wide" style={{ color: NAVY }}>{amountInWords(data.totalFils)}</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-300">
            <div className="flex items-center justify-between px-4 py-2.5 text-[12px]">
              <span className="font-semibold text-slate-500">Total Qty</span>
              <span className="font-bold">{totalQty}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 text-white" style={{ background: NAVY }}>
              <span className="text-[11px] font-bold uppercase tracking-[0.15em]">Grand Total</span>
              <span className="text-[18px] font-extrabold tabular-nums">K.D. {kwd(data.totalFils)}</span>
            </div>
          </div>
        </section>

        {/* ---------- Notes ---------- */}
        {data.notes && (
          <section data-pdf-break className="mt-5 border-t border-slate-200 pt-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Notes / Terms</p>
            <p dir="auto" className="mt-1.5 whitespace-pre-wrap break-words text-[12px] leading-relaxed text-slate-700">{data.notes}</p>
          </section>
        )}

        {/* ---------- Signatures ---------- */}
        <section data-pdf-break className="mt-16 grid grid-cols-2 gap-16 text-[12px]">
          <div className="border-t border-slate-500 pt-2 font-semibold text-slate-600">Receiver&apos;s Sign.</div>
          <div className="border-t border-slate-500 pt-2 text-right font-semibold text-slate-600">Salesman Sign.</div>
        </section>
      </div>
    </div>
  );
});
