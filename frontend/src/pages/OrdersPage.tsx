import { useEffect, useState } from "react";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { getOrders, updateOrderStatus } from "../services/api";
import type { Order, OrderStatus } from "../types";

const statuses: OrderStatus[] = ["PENDING","MEASUREMENT","CUTTING","STITCHING","QUALITY_CHECK","READY","DELIVERED","CANCELLED"];
const label = (v: string) => v.replaceAll("_", " ");
const money = (fils: number) => "KWD " + (fils / 1000).toFixed(3);

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const load = () => getOrders().then(r => setOrders(r.data)).catch(e => setError(e.message));
  useEffect(() => { load(); }, []);

  async function change(id: string, status: OrderStatus) {
    try { await updateOrderStatus(id, status); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Unable to update order"); }
  }

  if (error && !orders.length) return <ErrorState message={error} />;
  if (!orders.length) return <LoadingState label="Loading orders…" />;

  return <div className="mx-auto max-w-7xl space-y-5">
    <div><h3 className="text-2xl font-semibold text-navy-900">Orders</h3><p className="text-sm text-slate-600">Move demo orders through the tailoring workflow.</p></div>
    {error && <ErrorState message={error} />}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {orders.map(o => <article key={o.id} className="rounded-xl border border-sand-100 bg-white p-5 shadow-sm">
        <div className="flex justify-between gap-3"><div><p className="text-xs text-slate-500">{o.orderNo}</p><h4 className="mt-1 font-semibold text-navy-900">{o.customer.name}</h4></div><span className="rounded-full bg-sand-50 px-2 py-1 text-xs">{label(o.status)}</span></div>
        <p className="mt-3 text-sm text-slate-600">{o.description}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-slate-500">Shop</p><p>{o.shop?.name ?? "—"}</p></div><div><p className="text-xs text-slate-500">Value</p><p>{money(o.totalAmountFils)}</p></div></div>
        <select value={o.status} onChange={e => change(o.id, e.target.value as OrderStatus)} className="mt-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">{statuses.map(s => <option key={s} value={s}>{label(s)}</option>)}</select>
      </article>)}
    </div>
  </div>;
}
