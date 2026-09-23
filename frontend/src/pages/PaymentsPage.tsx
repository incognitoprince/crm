import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { createPayment, getOrders, getPayments } from "../services/api";
import type { Order, Payment, PaymentMethod } from "../types";

const money = (fils: number) => "KWD " + (fils / 1000).toFixed(3);
const methods: Array<{ value: PaymentMethod; label: string }> = [
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
  { value: "OTHER", label: "Other" },
];

export function PaymentsPage() {
  const [searchParams] = useSearchParams();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderId, setOrderId] = useState(searchParams.get("orderId") ?? "");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setError("");
    try {
      const [paymentResult, orderResult] = await Promise.all([getPayments(), getOrders()]);
      setPayments(paymentResult.data);
      setOrders(orderResult.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load payments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const payableOrders = useMemo(
    () => orders.filter(order => order.status !== "CANCELLED" && order.totalAmountFils > order.paidAmountFils),
    [orders],
  );

  const visiblePayments = payments.filter(payment => {
    const value = (payment.order.orderNo + " " + payment.order.customer.name + " " + payment.method).toLowerCase();
    return value.includes(query.toLowerCase());
  });

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const selected = payableOrders.find(order => order.id === orderId);
    const amountFils = Math.round(Number(amount) * 1000);

    if (!selected) { setError("Select an order with an outstanding balance."); return; }
    if (!Number.isFinite(amountFils) || amountFils <= 0) { setError("Enter a valid payment amount."); return; }
    if (amountFils > selected.totalAmountFils - selected.paidAmountFils) { setError("Payment cannot exceed the outstanding balance."); return; }

    setSaving(true);
    try {
      await createPayment({ orderId, amountFils, method, reference: reference || undefined, notes: notes || undefined });
      setAmount("");
      setReference("");
      setNotes("");
      setOrderId("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to record payment");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label="Loading payments…" />;

  return <div className="mx-auto max-w-7xl space-y-5">
    <section>
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Finance</p>
      <h3 className="mt-1 text-2xl font-semibold text-navy-900">Payments</h3>
      <p className="mt-1 text-sm text-slate-600">Record customer payments and keep each order balance up to date.</p>
    </section>

    {error && <ErrorState message={error} onRetry={() => void load()} />}

    <div className="grid gap-3 sm:grid-cols-3">
      {[
        ["Total received", money(payments.reduce((sum, item) => sum + item.amountFils, 0)), "bg-emerald-50 text-emerald-700"],
        ["Pending amount", money(orders.reduce((sum, item) => sum + Math.max(0, item.totalAmountFils - item.paidAmountFils), 0)), "bg-amber-50 text-amber-700"],
        ["Transactions", String(payments.length), "bg-blue-50 text-blue-700"],
      ].map(([label, value, tone]) => <article key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between"><span className="text-sm text-slate-500">{label}</span><span className={"h-8 min-w-8 rounded-full px-2 text-center text-xs font-semibold leading-8 " + tone}>{label === "Transactions" ? "↗" : "₹"}</span></div>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-navy-900">{value}</p>
      </article>)}
    </div>

    <div className="grid gap-5 lg:grid-cols-3">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="font-semibold text-navy-900">Record payment</h4>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <label className="block text-sm"><span className="mb-1 block text-xs text-slate-500">Order</span>
            <select required value={orderId} onChange={e => setOrderId(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2">
              <option value="">Choose order…</option>
              {payableOrders.map(order => <option key={order.id} value={order.id}>{order.orderNo} · {order.customer.name} · {money(order.totalAmountFils - order.paidAmountFils)} due</option>)}
            </select>
          </label>
          {orderId && (() => {
            const order = payableOrders.find(item => item.id === orderId);
            return order ? <p className="rounded-md bg-slate-50 p-3 text-xs text-slate-600">Outstanding balance: <strong>{money(order.totalAmountFils - order.paidAmountFils)}</strong></p> : null;
          })()}
          <label className="block text-sm"><span className="mb-1 block text-xs text-slate-500">Amount (KWD)</span><input required type="number" min="0.001" step="0.001" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.000" className="w-full rounded-md border border-slate-300 px-3 py-2" /></label>
          <label className="block text-sm"><span className="mb-1 block text-xs text-slate-500">Payment method</span><select value={method} onChange={e => setMethod(e.target.value as PaymentMethod)} className="w-full rounded-md border border-slate-300 px-3 py-2">{methods.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <label className="block text-sm"><span className="mb-1 block text-xs text-slate-500">Reference <span className="text-slate-400">(optional)</span></span><input value={reference} onChange={e => setReference(e.target.value)} placeholder="Receipt / transaction reference" className="w-full rounded-md border border-slate-300 px-3 py-2" /></label>
          <label className="block text-sm"><span className="mb-1 block text-xs text-slate-500">Notes <span className="text-slate-400">(optional)</span></span><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full rounded-md border border-slate-300 px-3 py-2" /></label>
          <button disabled={saving || !payableOrders.length} className="w-full rounded-md bg-navy-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">{saving ? "Saving…" : "Record payment"}</button>
          {!payableOrders.length && <p className="text-xs text-slate-500">There are no orders with an outstanding balance.</p>}
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h4 className="font-semibold text-navy-900">Payment history</h4><p className="mt-0.5 text-xs text-slate-500">{payments.length} recorded payment{payments.length === 1 ? "" : "s"}</p></div><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search order or customer…" className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:w-64" /></div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead><tr className="border-b border-slate-100 text-left text-xs text-slate-500"><th className="pb-3 font-medium">Date</th><th className="pb-3 font-medium">Order</th><th className="pb-3 font-medium">Customer</th><th className="pb-3 font-medium">Method</th><th className="pb-3 font-medium">Reference</th><th className="pb-3 text-right font-medium">Amount</th></tr></thead>
            <tbody>{visiblePayments.map(payment => <tr key={payment.id} className="border-b border-slate-50 last:border-0">
              <td className="py-3">{new Date(payment.receivedAt).toLocaleDateString()}</td>
              <td className="py-3"><Link to={"/orders/" + payment.order.id} className="font-medium text-blue-700 hover:underline">{payment.order.orderNo}</Link></td>
              <td className="py-3">{payment.order.customer.name}</td><td className="py-3">{methods.find(item => item.value === payment.method)?.label}</td><td className="py-3 text-slate-500">{payment.reference || "—"}</td><td className="py-3 text-right font-semibold">{money(payment.amountFils)}</td>
            </tr>)}</tbody>
          </table>
          {!visiblePayments.length && <p className="py-10 text-center text-sm text-slate-500">No payments found.</p>}
        </div>
      </section>
    </div>
  </div>;
}
