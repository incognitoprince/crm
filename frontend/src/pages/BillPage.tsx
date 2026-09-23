import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getBill } from "../services/api";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import type { Invoice } from "../types";

const money = (fils: number) => "KWD " + (fils / 1000).toFixed(3);
const date = (value: string) => new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export function BillPage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    getBill(id).then(result => setInvoice(result.data)).catch(e => setError(e instanceof Error ? e.message : "Unable to load invoice"));
  }, [id]);

  if (error) return <ErrorState message={error} />;
  if (!invoice) return <LoadingState label="Loading invoice…" />;

  const order = invoice.order;
  const balance = Math.max(0, order.totalAmountFils - order.paidAmountFils);
  const shop = order.shop;
  const customer = order.customer;

  return <div className="mx-auto max-w-[1400px] space-y-5">
    <header className="flex flex-col gap-4 print:hidden lg:flex-row lg:items-end lg:justify-between">
      <div>
        <Link to="/bills" className="text-sm font-medium text-blue-700 hover:underline">← Back to Bills</Link>
        <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Finance</p>
        <h3 className="mt-1 text-3xl font-semibold tracking-tight text-navy-900">Invoice</h3>
        <p className="mt-1 text-sm text-slate-600">Review the customer and order details before printing the invoice.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => window.print()} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-navy-900 shadow-sm hover:bg-slate-50">Print preview</button>
        <button type="button" onClick={() => window.print()} className="rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-navy-800">Print invoice</button>
      </div>
    </header>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(560px,0.95fr)] print:block">
      <div className="space-y-5 print:hidden">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-lg text-blue-700">●</div>
            <div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Invoice details</p><h4 className="font-semibold text-navy-900">Customer & Order Information</h4></div>
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Customer</p>
              <p className="mt-1 text-base font-semibold text-navy-900">{customer.name}</p>
              <p className="mt-1 text-sm text-slate-600">{customer.phone}</p>
              {customer.email && <p className="text-sm text-slate-600">{customer.email}</p>}
              {customer.address && <p className="mt-2 text-xs leading-5 text-slate-500">{customer.address}</p>}
            </div>
            <div className="space-y-3">
              <div><p className="text-xs text-slate-500">Invoice number</p><p className="mt-1 font-medium text-slate-800">{invoice.invoiceNo}</p></div>
              <div><p className="text-xs text-slate-500">Invoice date</p><p className="mt-1 font-medium text-slate-800">{date(invoice.issuedAt)}</p></div>
              <div><p className="text-xs text-slate-500">Order</p><Link to={"/orders/" + order.id} className="mt-1 inline-block font-medium text-blue-700 hover:underline">{order.orderNo}</Link></div>
              <div><p className="text-xs text-slate-500">Delivery date</p><p className="mt-1 font-medium text-slate-800">{order.deliveryDate ? date(order.deliveryDate) : "Not scheduled"}</p></div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Items / Services</p><h4 className="font-semibold text-navy-900">Order summary</h4></div>
            <span className="rounded-md bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">{order.quantity} piece{order.quantity === 1 ? "" : "s"}</span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead><tr className="border-b border-slate-100 text-left text-xs text-slate-500"><th className="pb-3">#</th><th className="pb-3">Description</th><th className="pb-3 text-center">Qty</th><th className="pb-3 text-right">Amount</th></tr></thead>
              <tbody><tr className="border-b border-slate-50">
                <td className="py-4 text-slate-400">1</td>
                <td className="py-4"><p className="font-medium text-slate-800">{order.description || "Tailoring service"}</p><p className="mt-1 text-xs text-slate-500">{order.garmentMaster?.name ?? order.garment}{shop ? " · " + shop.name : ""}</p></td>
                <td className="py-4 text-center">{order.quantity}</td>
                <td className="py-4 text-right font-semibold">{money(order.totalAmountFils)}</td>
              </tr></tbody>
            </table>
          </div>
          {order.sizeBreakdowns.length > 0 && <div className="mt-4 flex flex-wrap gap-2">
            {order.sizeBreakdowns.map(size => <span key={size.id} className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600"><strong className="text-slate-800">{size.size}</strong> · {size.quantity}</span>)}
          </div>}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Notes</p>
          <h4 className="mt-1 font-semibold text-navy-900">Order notes</h4>
          <div className="mt-3 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600">{order.notes || "No notes added to this order."}</div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Bill summary</p><h4 className="font-semibold text-navy-900">Payment summary</h4></div>
            <span className={"rounded-full px-3 py-1 text-xs font-medium " + (order.paymentStatus === "PAID" ? "bg-emerald-50 text-emerald-700" : order.paymentStatus === "PARTIAL" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600")}>{order.paymentStatus}</span>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Order total</span><span className="font-medium">{money(order.totalAmountFils)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Paid</span><span>{money(order.paidAmountFils)}</span></div>
            <div className="flex justify-between border-t border-slate-100 pt-3 text-base"><span className="font-semibold text-slate-800">Balance due</span><span className="font-semibold text-rose-700">{money(balance)}</span></div>
          </div>
          {!!order.payments?.length && <div className="mt-5 border-t border-slate-100 pt-4"><p className="text-xs font-medium text-slate-500">Payments received</p><div className="mt-3 space-y-2">{order.payments.map(payment => <div key={payment.id} className="flex justify-between text-xs text-slate-600"><span>{date(payment.receivedAt)} · {payment.method.replaceAll("_", " ")}</span><span className="font-medium text-slate-800">{money(payment.amountFils)}</span></div>)}</div></div>}
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm print:border-0 print:p-0 print:shadow-none">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Preview</p><h4 className="font-semibold text-navy-900">Invoice Preview</h4></div>
          <span className="rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">{invoice.invoiceNo}</span>
        </div>
        <article className="overflow-hidden rounded-lg border border-slate-200 bg-white print:border-0">
          <header className="border-b-2 border-navy-900 p-6">
            <div className="flex items-start justify-between gap-6">
              <div><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-navy-900 text-xl text-white">✂</div><div><p className="text-2xl font-bold tracking-tight text-navy-900">StitchPro</p><p className="text-xs text-slate-500">Tailor Shop Management</p></div></div></div>
              <div className="text-right text-xs leading-5 text-slate-500"><p className="font-semibold text-slate-800">{shop?.name ?? "Tailor Shop"}</p>{shop?.area && <p>{shop.area}</p>}{shop?.phone && <p>{shop.phone}</p>}</div>
            </div>
          </header>

          <div className="p-6">
            <div className="flex items-start justify-between gap-6 border-b border-slate-100 pb-5">
              <div><p className="text-xs font-semibold text-slate-500">BILL TO</p><p className="mt-1 font-semibold text-slate-900">{customer.name}</p><p className="text-sm text-slate-600">{customer.phone}</p>{customer.address && <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">{customer.address}</p>}</div>
              <div className="text-right text-xs"><p><span className="text-slate-500">Invoice No:</span> <strong>{invoice.invoiceNo}</strong></p><p className="mt-1"><span className="text-slate-500">Invoice Date:</span> {date(invoice.issuedAt)}</p><p className="mt-1"><span className="text-slate-500">Order:</span> {order.orderNo}</p><p className="mt-1"><span className="text-slate-500">Delivery:</span> {order.deliveryDate ? date(order.deliveryDate) : "—"}</p></div>
            </div>

            <div className="mt-6 overflow-hidden rounded-md border border-slate-200">
              <table className="w-full text-sm"><thead className="bg-slate-50"><tr className="text-left text-xs text-slate-600"><th className="px-3 py-3">#</th><th className="px-3 py-3">Description</th><th className="px-3 py-3 text-center">Qty</th><th className="px-3 py-3 text-right">Amount</th></tr></thead>
                <tbody><tr><td className="px-3 py-4 text-slate-400">1</td><td className="px-3 py-4"><p className="font-medium text-slate-800">{order.description || "Tailoring service"}</p><p className="mt-1 text-xs text-slate-500">{order.garmentMaster?.name ?? order.garment}</p></td><td className="px-3 py-4 text-center">{order.quantity}</td><td className="px-3 py-4 text-right font-medium">{money(order.totalAmountFils)}</td></tr></tbody>
              </table>
            </div>

            {order.sizeBreakdowns.length > 0 && <div className="mt-4"><p className="text-xs font-semibold text-slate-500">SIZE BREAKDOWN</p><div className="mt-2 flex flex-wrap gap-2">{order.sizeBreakdowns.map(size => <span key={size.id} className="rounded bg-slate-50 px-2.5 py-1 text-xs text-slate-600">{size.size}: <strong>{size.quantity}</strong></span>)}</div></div>}

            <div className="mt-6 ml-auto max-w-xs space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{money(order.totalAmountFils)}</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-3 text-base"><span className="font-semibold text-slate-800">Total Amount</span><span className="font-bold text-navy-900">{money(order.totalAmountFils)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Paid</span><span>{money(order.paidAmountFils)}</span></div>
              <div className="flex justify-between font-semibold"><span className="text-slate-600">Balance Due</span><span className="text-rose-700">{money(balance)}</span></div>
            </div>

            {order.notes && <div className="mt-7 rounded-md bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-600">NOTES</p><p className="mt-1 text-xs leading-5 text-slate-600">{order.notes}</p></div>}
            <div className="mt-10 flex items-end justify-between gap-6 border-t border-slate-100 pt-5"><p className="text-xs text-slate-400">Thank you for your business.</p><div className="w-44 border-t border-slate-300 pt-2 text-center text-xs text-slate-400">Customer signature</div></div>
          </div>
        </article>
        <div className="mt-4 flex flex-wrap justify-end gap-2 print:hidden">
          <button type="button" onClick={() => window.print()} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-navy-900">Print invoice</button>
        </div>
      </section>
    </div>
  </div>;
}
