import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { getOrders, updateOrderStatus } from "../services/api";
import type { Order, OrderStatus } from "../types";

const statuses: OrderStatus[] = ["PENDING","MEASUREMENT","CUTTING","STITCHING","QUALITY_CHECK","READY","DELIVERED","CANCELLED"];
const label = (v: string) => v.replaceAll("_", " ");
const money = (fils: number) => "KWD " + (fils / 1000).toFixed(3);

export function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [view, setView] = useState<"in-progress" | "completed">("in-progress");
  const [error, setError] = useState("");
  const load = () => getOrders().then(r => setOrders(r.data)).catch(e => setError(e.message));
  const visibleOrders = orders.filter(o => view === "completed" ? ["DELIVERED","CANCELLED"].includes(o.status) : !["DELIVERED","CANCELLED"].includes(o.status));
  useEffect(() => { load(); }, []);

  async function change(id: string, status: OrderStatus) {
    try { await updateOrderStatus(id, status); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Unable to update order"); }
  }

  if (error && !orders.length) return <ErrorState message={error} />;
  if (!orders.length) return <LoadingState label="Loading orders…" />;

  return <div className="mx-auto max-w-7xl space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-2xl font-semibold text-navy-900">Orders</h3><p className="text-sm text-slate-600">Manage orders and move them through the tailoring workflow. Click anywhere on an order card to open it.</p></div><button onClick={() => navigate("/orders/new")} className="rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-white">+ New order</button></div>
    {error && <ErrorState message={error} />}
    <div className="flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm w-fit">
      <button onClick={() => setView("in-progress")} className={"rounded-md px-4 py-2 text-sm font-medium " + (view === "in-progress" ? "bg-navy-900 text-white" : "text-slate-600")}>In progress ({orders.filter(o => !["DELIVERED","CANCELLED"].includes(o.status)).length})</button>
      <button onClick={() => setView("completed")} className={"rounded-md px-4 py-2 text-sm font-medium " + (view === "completed" ? "bg-navy-900 text-white" : "text-slate-600")}>Completed ({orders.filter(o => ["DELIVERED","CANCELLED"].includes(o.status)).length})</button>
    </div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {visibleOrders.map(o => <article key={o.id} onClick={() => navigate("/orders/" + o.id)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") navigate("/orders/" + o.id); }} role="button" tabIndex={0} className="cursor-pointer rounded-xl border border-sand-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex justify-between gap-3"><div><p className="text-xs text-slate-500">{o.orderNo}</p><p className="mt-1 font-semibold text-navy-900">{o.customer.name}</p></div><span className="rounded-full bg-sand-50 px-2 py-1 text-xs">{label(o.status)}</span></div>
        <p className="mt-3 text-sm text-slate-600">{o.description}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-slate-500">Shop</p><p>{o.shop?.name ?? "—"}</p></div><div><p className="text-xs text-slate-500">Value</p><p>{money(o.totalAmountFils)}</p></div></div>
        <div className="mt-3 flex justify-between text-xs text-slate-500"><span>{o.paymentStatus}</span><span>{o.deliveryDate ? new Date(o.deliveryDate).toLocaleDateString() : "No delivery date"}</span></div>
        <select value={o.status} onClick={e => e.stopPropagation()} onChange={e => { e.stopPropagation(); change(o.id, e.target.value as OrderStatus); }} className="mt-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">{statuses.map(s => <option key={s} value={s}>{label(s)}</option>)}</select>
      </article>)}
    </div>
    {!visibleOrders.length && <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No {view === "completed" ? "completed" : "in-progress"} orders.</div>}
  </div>;
}
