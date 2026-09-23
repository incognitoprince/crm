import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createBill, getBills, getOrders } from "../services/api";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import type { Invoice, Order } from "../types";

const money = (fils: number) => "KWD " + (fils / 1000).toFixed(3);

export function BillsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderId, setOrderId] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const [billResult, orderResult] = await Promise.all([getBills(), getOrders()]);
      setInvoices(billResult.data);
      setOrders(orderResult.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load bills");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const unbilledOrders = orders.filter(order =>
    order.status !== "CANCELLED" &&
    !invoices.some(invoice => invoice.orderId === order.id)
  );

  async function generate() {
    if (!orderId) return;
    setSaving(true);
    setError("");
    try {
      const result = await createBill(orderId);
      setOrderId("");
      await load();
      window.location.href = "/bills/" + result.data.id;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create bill");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label="Loading bills…" />;

  return <div className="mx-auto max-w-7xl space-y-5">
    <section>
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Finance</p>
      <h3 className="mt-1 text-2xl font-semibold text-navy-900">Bills / Invoices</h3>
      <p className="mt-1 text-sm text-slate-600">Create a bill for an order and print it for the customer.</p>
    </section>
    {error && <ErrorState message={error} onRetry={() => void load()} />}

    <div className="grid gap-3 sm:grid-cols-3">
      {[
        ["Total invoiced", money(invoices.reduce((sum, item) => sum + item.order.totalAmountFils, 0)), "bg-emerald-50 text-emerald-700"],
        ["Outstanding", money(invoices.reduce((sum, item) => sum + Math.max(0, item.order.totalAmountFils - item.order.paidAmountFils), 0)), "bg-amber-50 text-amber-700"],
        ["Invoices", String(invoices.length), "bg-blue-50 text-blue-700"],
      ].map(([label, value, tone]) => <article key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between"><span className="text-sm text-slate-500">{label}</span><span className={"h-8 min-w-8 rounded-full px-2 text-center text-xs font-semibold leading-8 " + tone}>{label === "Invoices" ? "▤" : "₹"}</span></div>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-navy-900">{value}</p>
      </article>)}
    </div>

    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <label className="flex-1 text-sm"><span className="mb-1 block text-xs text-slate-500">Order to bill</span>
          <select value={orderId} onChange={e => setOrderId(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2.5">
            <option value="">Choose order…</option>
            {unbilledOrders.map(order => <option key={order.id} value={order.id}>{order.orderNo} · {order.customer.name} · {money(order.totalAmountFils)}</option>)}
          </select>
        </label>
        <button type="button" disabled={!orderId || saving} onClick={() => void generate()} className="rounded-md bg-navy-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">{saving ? "Creating…" : "Create bill"}</button>
      </div>
      {!unbilledOrders.length && <p className="mt-3 text-xs text-slate-500">All current orders already have a bill, or there are no billable orders.</p>}
    </section>
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between"><div><h4 className="font-semibold text-navy-900">Invoice history</h4><p className="mt-0.5 text-xs text-slate-500">{invoices.length} invoice{invoices.length === 1 ? "" : "s"}</p></div></div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[650px] text-sm">
          <thead><tr className="border-b border-slate-100 text-left text-xs text-slate-500"><th className="pb-3 font-medium">Invoice</th><th className="pb-3 font-medium">Order</th><th className="pb-3 font-medium">Customer</th><th className="pb-3 font-medium">Issued</th><th className="pb-3 text-right font-medium">Total</th><th className="pb-3 text-right font-medium">Balance</th></tr></thead>
          <tbody>{invoices.map(invoice => {
            const balance = invoice.order.totalAmountFils - invoice.order.paidAmountFils;
            return <tr key={invoice.id} className="border-b border-slate-50 last:border-0">
              <td className="py-3"><Link to={"/bills/" + invoice.id} className="font-medium text-blue-700 hover:underline">{invoice.invoiceNo}</Link></td>
              <td className="py-3"><Link to={"/orders/" + invoice.order.id} className="text-blue-700 hover:underline">{invoice.order.orderNo}</Link></td>
              <td className="py-3">{invoice.order.customer.name}</td>
              <td className="py-3">{new Date(invoice.issuedAt).toLocaleDateString()}</td>
              <td className="py-3 text-right font-medium">{money(invoice.order.totalAmountFils)}</td>
              <td className="py-3 text-right">{money(Math.max(0, balance))}</td>
            </tr>;
          })}</tbody>
        </table>
        {!invoices.length && <p className="py-10 text-center text-sm text-slate-500">No bills created yet.</p>}
      </div>
    </section>
  </div>;
}
