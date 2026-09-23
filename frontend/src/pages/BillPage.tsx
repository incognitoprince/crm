import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getBill } from "../services/api";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import type { Invoice } from "../types";

const money = (fils: number) => "KWD " + (fils / 1000).toFixed(3);

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

  return <div className="mx-auto max-w-3xl space-y-4">
    <div className="flex items-center justify-between print:hidden">
      <Link to="/bills" className="text-sm font-medium text-navy-900 hover:underline">← Bills / Invoices</Link>
      <button type="button" onClick={() => window.print()} className="rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-white">Print bill</button>
    </div>
    <article className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm print:border-0 print:p-0 print:shadow-none">
      <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">StitchPro</p><h1 className="mt-1 text-2xl font-semibold text-navy-900">Invoice</h1><p className="mt-1 text-sm text-slate-500">{invoice.invoiceNo}</p></div>
        <div className="text-left text-sm sm:text-right"><p className="text-slate-500">Issued</p><p className="font-medium text-slate-800">{new Date(invoice.issuedAt).toLocaleDateString()}</p></div>
      </header>
      <section className="grid gap-5 border-b border-slate-200 py-6 sm:grid-cols-2">
        <div><p className="text-xs text-slate-500">Bill to</p><p className="mt-1 font-semibold text-slate-900">{order.customer.name}</p><p className="text-sm text-slate-600">{order.customer.phone}</p>{order.customer.email && <p className="text-sm text-slate-600">{order.customer.email}</p>}</div>
        <div className="sm:text-right"><p className="text-xs text-slate-500">Order</p><p className="mt-1 font-semibold text-slate-900">{order.orderNo}</p><p className="text-sm text-slate-600">{order.shop?.name ?? "Shop not assigned"}</p></div>
      </section>
      <section className="py-6">
        <table className="w-full text-sm"><thead><tr className="border-b border-slate-200 text-left text-xs text-slate-500"><th className="pb-3">Description</th><th className="pb-3 text-center">Qty</th><th className="pb-3 text-right">Amount</th></tr></thead>
          <tbody><tr className="border-b border-slate-100"><td className="py-4"><p className="font-medium text-slate-800">{order.description || order.garment}</p><p className="mt-1 text-xs text-slate-500">{order.garmentMaster?.name ?? order.garment}</p></td><td className="py-4 text-center">{order.quantity}</td><td className="py-4 text-right font-medium">{money(order.totalAmountFils)}</td></tr></tbody>
        </table>
      </section>
      <section className="ml-auto max-w-sm border-t border-slate-200 pt-4">
        <div className="flex justify-between py-1 text-sm"><span className="text-slate-500">Total</span><span className="font-semibold">{money(order.totalAmountFils)}</span></div>
        <div className="flex justify-between py-1 text-sm"><span className="text-slate-500">Paid</span><span>{money(order.paidAmountFils)}</span></div>
        <div className="mt-2 flex justify-between border-t border-slate-200 pt-3 text-base"><span className="font-semibold text-slate-800">Balance due</span><span className="font-semibold text-rose-700">{money(balance)}</span></div>
      </section>
      {!!order.payments?.length && <section className="mt-8 border-t border-slate-200 pt-5"><h2 className="text-sm font-semibold text-slate-800">Payment history</h2><div className="mt-3 space-y-2">{order.payments.map(payment => <div key={payment.id} className="flex justify-between text-xs text-slate-600"><span>{new Date(payment.receivedAt).toLocaleDateString()} · {payment.method.replaceAll("_", " ")}</span><span className="font-medium text-slate-800">{money(payment.amountFils)}</span></div>)}</div></section>}
      <footer className="mt-10 border-t border-slate-100 pt-4 text-center text-xs text-slate-400">Thank you for your business.</footer>
    </article>
  </div>;
}
