import type { InvoicePaperData } from "./InvoicePaper";
import { amountInWords, clean, fmtDate, kwd } from "../utils/invoiceLayout";

/** Phone-friendly, reflowing version of the invoice. PDF / image exports always use the A4 InvoicePaper. */
export function InvoiceMobileView({ data }: { data: InvoicePaperData }) {
  const { shop, customer, lines } = data;
  const totalQty = lines.reduce((s, l) => s + l.quantity, 0);
  const phone = clean(shop?.phone) || clean(shop?.whatsapp);
  const custPhone = clean(customer?.phone);
  const custAddress = clean(customer?.address);

  return (
    <div className="overflow-hidden rounded-2xl bg-white text-slate-900 shadow-soft ring-1 ring-slate-200">
      <div className="h-2 bg-gradient-to-r from-navy-900 to-brand-500" />
      <div className="space-y-5 p-4">
        <header className="flex items-center gap-3 border-b-2 border-navy-900 pb-4">
          {shop?.logoUrl && <img src={shop.logoUrl} alt="Shop logo" className="h-14 w-14 shrink-0 object-contain" />}
          <div className="min-w-0 flex-1 text-center">
            {shop?.arabicName && <p dir="rtl" className="text-[17px] font-bold leading-snug text-navy-900">{shop.arabicName}</p>}
            {shop?.englishName
              ? <p className="text-[14px] font-extrabold leading-snug text-navy-900">{shop.englishName}</p>
              : !shop?.arabicName && <p className="text-[15px] font-extrabold text-navy-900">{shop?.name ?? "Tailor Shop"}</p>}
            {phone && <p className="mt-1 text-[11px] font-semibold text-slate-600">Tel / WhatsApp: {phone}</p>}
          </div>
        </header>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-2xl font-extrabold tracking-[0.06em] text-navy-900">INVOICE</h3>
            {data.subject && <p dir="auto" className="mt-1 break-words text-sm text-slate-600">{data.subject}</p>}
          </div>
          <dl className="shrink-0 space-y-0.5 text-right text-[12px]">
            <div><dt className="inline text-slate-500">No </dt><dd className="inline font-bold">{data.invoiceNo}</dd></div>
            <div><dt className="inline text-slate-500">Date </dt><dd className="inline font-bold">{fmtDate(data.issuedAt)}</dd></div>
            {data.modelNo && <div><dt className="inline text-slate-500">Model </dt><dd className="inline font-bold">{data.modelNo}</dd></div>}
          </dl>
        </div>

        <section className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Bill To</p>
          <p dir="auto" className="mt-1 text-[15px] font-bold">{customer?.name || "Customer"}</p>
          {custPhone && <p className="text-[12px] text-slate-600">{custPhone}</p>}
          {custAddress && <p dir="auto" className="break-words text-[12px] text-slate-600">{custAddress}</p>}
        </section>

        <section className="space-y-2.5">
          {lines.map((line, i) => {
            const orderNo = clean(line.orderNo);
            return (
              <div key={line.id} className="flex gap-3 rounded-xl border border-slate-200 p-3">
                {line.imagePath
                  ? <img src={line.imagePath} alt="Design" className="h-16 w-16 shrink-0 rounded-lg border border-slate-200 bg-white object-contain" />
                  : <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-400">{i + 1}</span>}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p dir="auto" className="min-w-0 break-words text-[13px] font-semibold leading-snug">{line.description || "—"}</p>
                    <p className="shrink-0 text-[13px] font-extrabold tabular-nums text-navy-900">{kwd(line.totalFils)}</p>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {orderNo && <span className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-600">Order {orderNo}</span>}
                    {line.quantity} × {kwd(line.unitPriceFils)} K.D.
                  </p>
                  {line.orderDate && <p className="mt-0.5 text-[11px] text-slate-400">{new Date(line.orderDate).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</p>}
                </div>
              </div>
            );
          })}
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-300">
          <div className="flex items-center justify-between px-4 py-2.5 text-[12px]">
            <span className="font-semibold text-slate-500">Total Qty</span>
            <span className="font-bold">{totalQty}</span>
          </div>
          <div className="flex items-center justify-between gap-3 bg-navy-900 px-4 py-3 text-white">
            <span className="text-[11px] font-bold uppercase tracking-[0.15em]">Grand Total</span>
            <span className="text-[19px] font-extrabold tabular-nums">K.D. {kwd(data.totalFils)}</span>
          </div>
        </section>

        <p className="rounded-xl bg-slate-50 px-4 py-3 text-[12px] font-bold uppercase leading-snug tracking-wide text-navy-900 ring-1 ring-slate-200">
          {amountInWords(data.totalFils)}
        </p>

        {data.notes && (
          <section className="border-t border-slate-200 pt-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Notes / Terms</p>
            <p dir="auto" className="mt-1 whitespace-pre-wrap break-words text-[12px] leading-relaxed text-slate-700">{data.notes}</p>
          </section>
        )}
      </div>
    </div>
  );
}
