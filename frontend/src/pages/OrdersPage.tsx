import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { getOrders, getShops, updateOrderStatus } from "../services/api";
import type { Order, OrderStatus, Shop } from "../types";

const statuses: OrderStatus[] = ["PENDING", "MEASUREMENT", "CUTTING", "STITCHING", "QUALITY_CHECK", "READY", "DELIVERED", "CANCELLED"];
const activeStatuses: OrderStatus[] = ["PENDING", "MEASUREMENT", "CUTTING", "STITCHING", "QUALITY_CHECK", "READY"];
const label = (value: string) => value.replaceAll("_", " ");
const money = (fils: number) => "KWD " + (fils / 1000).toFixed(3);
const isDelayed = (order: Order) => Boolean(
  order.deliveryDate &&
  new Date(order.deliveryDate).getTime() < new Date().setHours(0, 0, 0, 0) &&
  !["DELIVERED", "CANCELLED"].includes(order.status),
);

export function OrdersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get("status") ?? "";
  const scopeFilter = searchParams.get("scope") ?? "in-progress";
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopFilter, setShopFilter] = useState("");
  const [search, setSearch] = useState("");
  const [deliveryFrom, setDeliveryFrom] = useState("");
  const [deliveryTo, setDeliveryTo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    return getOrders()
      .then(response => { setOrders(response.data); setError(""); })
      .catch(e => setError(e instanceof Error ? e.message : "Unable to load orders"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void load();
    getShops().then(response => setShops(response.data)).catch(e => setError(e instanceof Error ? e.message : "Unable to load shops"));
  }, []);

  const counts = useMemo(() => ({
    all: orders.length,
    inProgress: orders.filter(order => activeStatuses.includes(order.status)).length,
    pending: orders.filter(order => order.status === "PENDING").length,
    ready: orders.filter(order => order.status === "READY").length,
    delayed: orders.filter(isDelayed).length,
    delivered: orders.filter(order => order.status === "DELIVERED").length,
  }), [orders]);

  const visibleOrders = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return orders.filter(order => {
      const matchesShop = !shopFilter || order.shop?.id === shopFilter;
      const matchesStatus = statusFilter
        ? order.status === statusFilter
        : scopeFilter === "delayed"
          ? isDelayed(order)
          : scopeFilter === "all"
            ? true
            : activeStatuses.includes(order.status);
      const matchesSearch = !query || [
        order.orderNo,
        order.customer.name,
        order.customer.phone,
        order.garmentMaster?.name ?? order.garment,
        order.shop?.name ?? "",
      ].some(value => value.toLocaleLowerCase().includes(query));
      const deliveryDay = order.deliveryDate ? new Date(order.deliveryDate).toISOString().slice(0, 10) : "";
      const matchesFrom = !deliveryFrom || (deliveryDay !== "" && deliveryDay >= deliveryFrom);
      const matchesTo = !deliveryTo || (deliveryDay !== "" && deliveryDay <= deliveryTo);
      return matchesShop && matchesStatus && matchesSearch && matchesFrom && matchesTo;
    });
  }, [orders, shopFilter, statusFilter, scopeFilter, search, deliveryFrom, deliveryTo]);

  function applyQuickFilter(scope: string, status = "") {
    const next = new URLSearchParams(searchParams);
    next.delete("status");
    next.delete("scope");
    if (status) next.set("status", status);
    else if (scope !== "in-progress") next.set("scope", scope);
    setSearchParams(next);
  }

  async function change(id: string, status: OrderStatus) {
    try {
      await updateOrderStatus(id, status);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update order");
    }
  }

  if (loading && !orders.length) return <LoadingState label="Loading orders…" />;
  if (error && !orders.length) return <ErrorState message={error} onRetry={() => void load()} />;

  const quickFilters = [
    { key: "all", title: "All orders", count: counts.all, scope: "all", status: "", tone: "blue" },
    { key: "in-progress", title: "In progress", count: counts.inProgress, scope: "in-progress", status: "", tone: "amber" },
    { key: "pending", title: "Pending", count: counts.pending, scope: "", status: "PENDING", tone: "orange" },
    { key: "ready", title: "Ready for delivery", count: counts.ready, scope: "", status: "READY", tone: "violet" },
    { key: "delayed", title: "Delayed", count: counts.delayed, scope: "delayed", status: "", tone: "rose" },
    { key: "delivered", title: "Delivered", count: counts.delivered, scope: "", status: "DELIVERED", tone: "emerald" },
  ];
  const selectedQuickFilter = statusFilter || scopeFilter;

  return <div className="mx-auto max-w-7xl space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Workflow</p>
        <h3 className="mt-1 text-2xl font-semibold text-navy-900">Orders</h3>
        <p className="mt-1 text-sm text-slate-600">Filter and manage orders across every stage of your tailoring workflow.</p>
      </div>
      <button onClick={() => navigate("/orders/new")} className="rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm">+ New order</button>
    </div>

    {error && <ErrorState message={error} onRetry={() => void load()} />}

    <section aria-label="Order quick filters" className="grid gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
      {quickFilters.map(filter => {
        const active = filter.status ? statusFilter === filter.status : selectedQuickFilter === filter.scope;
        const tone = filter.tone === "blue" ? "bg-blue-50 text-blue-700" :
          filter.tone === "amber" ? "bg-amber-50 text-amber-700" :
          filter.tone === "orange" ? "bg-orange-50 text-orange-700" :
          filter.tone === "violet" ? "bg-violet-50 text-violet-700" :
          filter.tone === "rose" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700";
        return <button key={filter.key} type="button" onClick={() => applyQuickFilter(filter.scope, filter.status)}
          aria-pressed={active}
          className={"rounded-xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md " + (active ? "border-blue-400 ring-2 ring-blue-100" : "border-slate-200")}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500">{filter.title}</span>
            <span className={"rounded-full px-2.5 py-1 text-xs font-semibold " + tone}>{filter.count}</span>
          </div>
        </button>;
      })}
    </section>

    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 p-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1.5fr)_minmax(150px,1fr)_repeat(2,minmax(140px,1fr))_auto]">
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search order, customer, phone, garment…" aria-label="Search orders"
            className="h-10 min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          <select value={shopFilter} onChange={event => setShopFilter(event.target.value)} aria-label="Filter by shop"
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
            <option value="">All shops</option>{shops.map(shop => <option key={shop.id} value={shop.id}>{shop.name}</option>)}
          </select>
          <select value={statusFilter} onChange={event => applyQuickFilter("", event.target.value)} aria-label="Filter by order status"
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
            <option value="">All workflow statuses</option>{statuses.map(status => <option key={status} value={status}>{label(status)}</option>)}
          </select>
          <input type="date" value={deliveryFrom} onChange={event => setDeliveryFrom(event.target.value)} aria-label="Delivery date from"
            className="h-10 min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700" />
          <input type="date" value={deliveryTo} onChange={event => setDeliveryTo(event.target.value)} aria-label="Delivery date to"
            className="h-10 min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700" />
          <button type="button" onClick={() => { setShopFilter(""); setSearch(""); setDeliveryFrom(""); setDeliveryTo(""); applyQuickFilter("all"); }}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50">Clear filters</button>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>Filter by delivery date</span>
          <span>·</span>
          <span>{statusFilter ? label(statusFilter) : scopeFilter === "delayed" ? "Delayed orders" : scopeFilter === "all" ? "All workflow statuses" : "In progress"}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full text-sm">
          <thead><tr className="border-b border-slate-100 bg-white text-left text-xs text-slate-500">
            <th className="px-4 py-3 font-semibold">Order</th>
            <th className="px-4 py-3 font-semibold">Customer</th>
            <th className="px-4 py-3 font-semibold">Shop</th>
            <th className="px-4 py-3 font-semibold">Garment</th>
            <th className="px-4 py-3 font-semibold">Qty</th>
            <th className="px-4 py-3 font-semibold">Delivery</th>
            {user?.role === "ADMIN" && <th className="px-4 py-3 font-semibold">Amount</th>}
            <th className="px-4 py-3 font-semibold">Status</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {visibleOrders.map(order => <tr key={order.id} onClick={() => navigate("/orders/" + order.id)}
              onKeyDown={event => { if (event.key === "Enter" || event.key === " ") navigate("/orders/" + order.id); }}
              role="button" tabIndex={0} className="cursor-pointer transition hover:bg-blue-50/40">
              <td className="px-4 py-3.5"><span className="font-semibold text-blue-700">{order.orderNo}</span><p className="mt-0.5 text-xs text-slate-400">{new Date(order.orderDate).toLocaleDateString()}</p></td>
              <td className="px-4 py-3.5"><span className="font-medium text-slate-800">{order.customer.name}</span>{order.customer.phone?.trim() && order.customer.phone.trim().toLowerCase() !== "not provided" && <p className="mt-0.5 text-xs text-slate-500">{order.customer.phone}</p>}</td>
              <td className="px-4 py-3.5 text-slate-600">{order.shop?.name ?? "—"}</td>
              <td className="px-4 py-3.5 text-slate-600">{order.garmentMaster?.name ?? label(order.garment)}</td>
              <td className="px-4 py-3.5 font-medium">{order.quantity}</td>
              <td className="px-4 py-3.5 text-slate-600">{order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : "—"}</td>
              {user?.role === "ADMIN" && <td className="px-4 py-3.5 font-semibold text-slate-800">{money(order.totalAmountFils)}</td>}
              <td className="px-4 py-3.5" onClick={event => event.stopPropagation()}>
                <select value={order.status} onChange={event => void change(order.id, event.target.value as OrderStatus)}
                  className={"rounded-full border-0 px-2.5 py-1.5 text-xs font-semibold " + (order.status === "READY" ? "bg-emerald-50 text-emerald-700" : order.status === "CANCELLED" ? "bg-red-50 text-red-700" : order.status === "DELIVERED" ? "bg-slate-100 text-slate-600" : "bg-blue-50 text-blue-700")}
                  aria-label={"Status for " + order.orderNo}>
                  {statuses.map(status => <option key={status} value={status}>{label(status)}</option>)}
                </select>
              </td>
            </tr>)}
            {!visibleOrders.length && <tr><td colSpan={user?.role === "ADMIN" ? 8 : 7} className="px-4 py-12 text-center text-sm text-slate-500">No orders match the selected filters.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
        <span>Showing {visibleOrders.length} of {orders.length} orders</span>
        <span>Click an order row to open its details</span>
      </div>
    </section>
  </div>;
}
