import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { getOrders, getShops, updateOrderStatus } from "../services/api";
import type { Order, OrderStatus, Shop } from "../types";

const statuses: OrderStatus[] = ["PENDING","MEASUREMENT","CUTTING","STITCHING","QUALITY_CHECK","READY","DELIVERED","CANCELLED"];
const label = (v: string) => v.replaceAll("_", " ");
const money = (fils: number) => "KWD " + (fils / 1000).toFixed(3);

export function OrdersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopFilter, setShopFilter] = useState("");
  const [view, setView] = useState<"in-progress" | "completed">("in-progress");
  const [error, setError] = useState("");

  const load = () => getOrders().then(r => setOrders(r.data)).catch(e => setError(e.message));
  const visibleOrders = orders.filter(o => (shopFilter ? o.shop?.id === shopFilter : true) && (view === "completed" ? ["DELIVERED","CANCELLED"].includes(o.status) : !["DELIVERED","CANCELLED"].includes(o.status)));
  useEffect(() => { load(); getShops().then(r => setShops(r.data)).catch(e => setError(e.message)); }, []);

  async function change(id: string, status: OrderStatus) {
    try { await updateOrderStatus(id, status); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to update order"); }
  }

  if (error && !orders.length) return <ErrorState message={error} />;
  if (!orders.length) return <LoadingState label="Loading orders…" />;

  const pending = orders.filter(o => !["DELIVERED","CANCELLED"].includes(o.status)).length;
  const ready = orders.filter(o => o.status === "READY").length;
  const delivered = orders.filter(o => o.status === "DELIVERED").length;

  return <div className="mx-auto max-w-7xl space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Workflow</p><h3 className="mt-1 text-2xl font-semibold text-navy-900">Orders</h3><p className="mt-1 text-sm text-slate-600">Manage orders and move them through the tailoring workflow.</p></div>
      <button onClick={() => navigate("/orders/new")} className="rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm">+ New order</button>
    </div>

    {error && <ErrorState message={error} />}

    <div className="grid gap-3 sm:grid-cols-3">
      {[
        ["All orders", orders.length, "bg-blue-50 text-blue-700"],
        ["In progress", pending, "bg-amber-50 text-amber-700"],
        ["Ready / delivered", ready + delivered, "bg-emerald-50 text-emerald-700"],
      ].map(([title, value, tone]) => <div key={String(title)} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between"><span className="text-sm text-slate-500">{title}</span><span className={"rounded-full px-2.5 py-1 text-xs font-semibold " + tone}>{value}</span></div>
      </div>)}
    </div>

    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/70 p-3">
        <select value={shopFilter} onChange={e => setShopFilter(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700"><option value="">All shops</option>{shops.map(shop => <option key={shop.id} value={shop.id}>{shop.name}</option>)}</select>
        <button onClick={() => setView("in-progress")} className={"rounded-lg px-4 py-2 text-sm font-semibold " + (view === "in-progress" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600")}>In progress <span className="ml-1 text-xs">{pending}</span></button>
        <button onClick={() => setView("completed")} className={"rounded-lg px-4 py-2 text-sm font-semibold " + (view === "completed" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600")}>Completed <span className="ml-1 text-xs">{orders.length - pending}</span></button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full text-sm">
          <thead><tr className="border-b border-slate-100 text-left text-xs text-slate-500">
            <th className="px-4 py-3 font-semibold">Order</th><th className="px-4 py-3 font-semibold">Customer</th><th className="px-4 py-3 font-semibold">Shop</th><th className="px-4 py-3 font-semibold">Garment</th><th className="px-4 py-3 font-semibold">Qty</th><th className="px-4 py-3 font-semibold">Delivery</th>{user?.role === "OWNER" && <th className="px-4 py-3 font-semibold">Amount</th>}<th className="px-4 py-3 font-semibold">Status</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {visibleOrders.map(o => <tr key={o.id} onClick={() => navigate("/orders/" + o.id)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") navigate("/orders/" + o.id); }} role="button" tabIndex={0} className="cursor-pointer transition hover:bg-blue-50/40">
              <td className="px-4 py-3.5"><span className="font-semibold text-blue-700">{o.orderNo}</span><p className="mt-0.5 text-xs text-slate-400">{new Date(o.orderDate).toLocaleDateString()}</p></td>
              <td className="px-4 py-3.5"><span className="font-medium text-slate-800">{o.customer.name}</span><p className="mt-0.5 text-xs text-slate-500">{o.customer.phone}</p></td>
              <td className="px-4 py-3.5 text-slate-600">{o.shop?.name ?? "—"}</td>
              <td className="px-4 py-3.5 text-slate-600">{o.garmentMaster?.name ?? label(o.garment)}</td>
              <td className="px-4 py-3.5 font-medium">{o.quantity}</td>
              <td className="px-4 py-3.5 text-slate-600">{o.deliveryDate ? new Date(o.deliveryDate).toLocaleDateString() : "—"}</td>
              {user?.role === "OWNER" && <td className="px-4 py-3.5 font-semibold text-slate-800">{money(o.totalAmountFils)}</td>}
              <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}><select value={o.status} onChange={e => void change(o.id, e.target.value as OrderStatus)} className={"rounded-full border-0 px-2.5 py-1.5 text-xs font-semibold " + (o.status === "READY" ? "bg-emerald-50 text-emerald-700" : o.status === "CANCELLED" ? "bg-red-50 text-red-700" : o.status === "DELIVERED" ? "bg-slate-100 text-slate-600" : "bg-blue-50 text-blue-700")} aria-label={"Status for " + o.orderNo}>{statuses.map(s => <option key={s} value={s}>{label(s)}</option>)}</select></td>
            </tr>)}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
        <span>Showing {visibleOrders.length} of {orders.length} orders</span><span className="rounded-md bg-slate-50 px-2 py-1">Click a row to open the order</span>
      </div>
    </section>
  </div>;
}
