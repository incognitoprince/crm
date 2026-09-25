import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { getDashboardSummary } from "../services/api";
import type { DashboardSummary, OrderStatus } from "../types";

const money = (fils: number) => "KWD " + (fils / 1000).toFixed(3);

const statusLabels: Record<OrderStatus, string> = {
  PENDING: "Pending",
  MEASUREMENT: "Measurement",
  CUTTING: "Cutting",
  STITCHING: "Stitching",
  QUALITY_CHECK: "Quality check",
  READY: "Ready",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const statusItems: Array<{ key: OrderStatus; className: string }> = [
  { key: "DELIVERED", className: "bg-emerald-500" },
  { key: "STITCHING", className: "bg-blue-500" },
  { key: "PENDING", className: "bg-amber-400" },
  { key: "READY", className: "bg-violet-500" },
  { key: "QUALITY_CHECK", className: "bg-orange-400" },
  { key: "MEASUREMENT", className: "bg-cyan-500" },
  { key: "CUTTING", className: "bg-indigo-500" },
  { key: "CANCELLED", className: "bg-slate-400" },
];

const cardStyles = [
  { key: "orders", label: "Total orders", icon: "▣", className: "bg-blue-50 text-blue-700" },
  { key: "paidFils", label: "Payments received", icon: "₹", className: "bg-emerald-50 text-emerald-700" },
  { key: "pending", label: "Pending orders", icon: "◷", className: "bg-amber-50 text-amber-700" },
  { key: "ready", label: "Ready for delivery", icon: "✓", className: "bg-violet-50 text-violet-700" },
  { key: "delayed", label: "Delayed orders", icon: "!", className: "bg-rose-50 text-rose-700" },
  { key: "outstandingFils", label: "Outstanding payments", icon: "¤", className: "bg-slate-100 text-slate-700" },
] as const;

function dateTime(value: string) {
  return new Intl.DateTimeFormat("en-KW", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function relativeDate(value: string) {
  const target = new Date(value);
  const today = new Date();
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const diff = Math.round((targetDay - todayDay) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return dateTime(value);
}

function statusBadge(status: OrderStatus) {
  const styles: Record<OrderStatus, string> = {
    PENDING: "bg-amber-50 text-amber-700",
    MEASUREMENT: "bg-cyan-50 text-cyan-700",
    CUTTING: "bg-indigo-50 text-indigo-700",
    STITCHING: "bg-blue-50 text-blue-700",
    QUALITY_CHECK: "bg-orange-50 text-orange-700",
    READY: "bg-violet-50 text-violet-700",
    DELIVERED: "bg-emerald-50 text-emerald-700",
    CANCELLED: "bg-slate-100 text-slate-600",
  };
  return styles[status];
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      setData((await getDashboardSummary()).data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load dashboard");
    }
  }

  useEffect(() => { void load(); }, []);

  const totalStatusOrders = useMemo(
    () => statusItems.reduce((total, item) => total + (data?.orderStatus[item.key] ?? 0), 0),
    [data],
  );

  const statusGradient = useMemo(() => {
    if (!data || totalStatusOrders === 0) return "conic-gradient(#e2e8f0 0 100%)";
    let cursor = 0;
    const segments = statusItems
      .map(item => {
        const value = data.orderStatus[item.key] ?? 0;
        const start = cursor;
        cursor += (value / totalStatusOrders) * 100;
        const color = item.className.includes("emerald") ? "#10b981"
          : item.className.includes("blue") ? "#3b82f6"
          : item.className.includes("amber") ? "#f59e0b"
          : item.className.includes("violet") ? "#8b5cf6"
          : item.className.includes("orange") ? "#f97316"
          : item.className.includes("cyan") ? "#06b6d4"
          : item.className.includes("indigo") ? "#6366f1"
          : "#94a3b8";
        return value > 0 ? color + " " + start + "% " + cursor + "%" : "";
      })
      .filter(Boolean);
    return "conic-gradient(" + segments.join(", ") + ")";
  }, [data, totalStatusOrders]);

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!data) return <LoadingState label="Loading live dashboard…" />;

  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";

  return <div className="mx-auto max-w-7xl space-y-5">
    <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Admin dashboard</p>
        <h3 className="mt-1 text-3xl font-semibold tracking-tight text-navy-900">{greeting}, Admin! 👋</h3>
        <p className="mt-1 text-sm text-slate-600">Here’s what’s happening across your tailoring business today.</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <p className="text-xs text-slate-500">Today</p>
        <p className="mt-0.5 font-semibold text-navy-900">{new Intl.DateTimeFormat("en-KW", { weekday: "long", day: "2-digit", month: "short", year: "numeric" }).format(new Date())}</p>
      </div>
    </section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {cardStyles.map(card => {
        const value = card.key.endsWith("Fils") ? money(data[card.key]) : data[card.key];
        return <article key={card.key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium text-slate-500">{card.label}</p>
            <span className={"flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold " + card.className}>{card.icon}</span>
          </div>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-navy-900">{value}</p>
        </article>;
      })}
    </section>

    <section className="grid items-start gap-4 lg:grid-cols-12">
      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-6">
        <div className="flex items-center justify-between">
          <div><h4 className="font-semibold text-navy-900">Shop performance</h4><p className="mt-0.5 text-xs text-slate-500">Orders and revenue by active shop</p></div>
          <Link to="/shops" className="text-xs font-medium text-blue-700 hover:underline">View shops</Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead><tr className="border-b border-slate-100 text-left text-xs text-slate-500"><th className="pb-3 font-medium">Shop</th><th className="pb-3 font-medium">Orders</th><th className="pb-3 font-medium">Completed</th><th className="pb-3 font-medium">In progress</th><th className="pb-3 text-right font-medium">Revenue</th></tr></thead>
            <tbody>
              {data.shops.map(shop => <tr key={shop.id} className="border-b border-slate-50 last:border-0">
                <td className="py-2.5"><p className="font-medium text-slate-800">{shop.name}</p><p className="text-[11px] text-slate-500">{shop.area}</p></td>
                <td className="py-2.5">{shop.orders}</td>
                <td className="py-2.5 text-emerald-700">{shop.completed}</td>
                <td className="py-2.5 text-blue-700">{shop.inProgress}</td>
                <td className="py-2.5 text-right font-medium">{money(shop.revenueFils)}</td>
              </tr>)}
            </tbody>
          </table>
          {!data.shops.length && <p className="py-8 text-center text-sm text-slate-500">No active shops yet.</p>}
        </div>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3">
        <div className="flex items-center justify-between"><div><h4 className="font-semibold text-navy-900">Order status</h4><p className="mt-0.5 text-xs text-slate-500">Current order distribution</p></div></div>
        <div className="mt-4 flex items-center gap-4">
          <div className="relative h-32 w-32 shrink-0 rounded-full" style={{ background: statusGradient }}>
            <div className="absolute inset-[25%] flex flex-col items-center justify-center rounded-full bg-white">
              <span className="text-2xl font-semibold text-navy-900">{totalStatusOrders}</span>
              <span className="text-[10px] text-slate-500">Orders</span>
            </div>
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            {statusItems.map(item => <div key={item.key} className="flex items-center justify-between gap-2 text-xs">
              <span className="flex min-w-0 items-center gap-2"><span className={"h-2.5 w-2.5 shrink-0 rounded-full " + item.className}></span><span className="truncate text-slate-600">{statusLabels[item.key]}</span></span>
              <span className="font-semibold text-slate-800">{data.orderStatus[item.key] ?? 0}</span>
            </div>)}
          </div>
        </div>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3">
        <div className="flex items-center justify-between"><div><h4 className="font-semibold text-navy-900">Recent activity</h4><p className="mt-0.5 text-xs text-slate-500">Latest order changes</p></div><Link to="/orders" className="text-xs font-medium text-blue-700 hover:underline">View all</Link></div>
        <div className="mt-3 max-h-[300px] space-y-0.5 overflow-y-auto pr-1">
          {data.activity.slice(0, 5).map(item => <Link key={item.id} to={"/orders/" + item.orderId} className="flex gap-2.5 rounded-lg p-2 hover:bg-slate-50">
            <span className={"mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold " + (item.type === "ORDER_CREATED" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700")}>{item.type === "ORDER_CREATED" ? "+" : "↻"}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium text-slate-800">{item.type === "ORDER_CREATED" ? "New order created" : "Order updated"}</span><span className="block truncate text-[11px] text-slate-500">{item.orderNo} · {item.customerName}</span><span className="mt-0.5 block text-[10px] text-slate-400">{dateTime(item.timestamp)}</span></span>
          </Link>)}
          {!data.activity.length && <p className="py-8 text-center text-sm text-slate-500">No recent activity.</p>}
        </div>
      </article>
    </section>

    <section className="grid gap-4 lg:grid-cols-12">
      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-7">
        <div className="flex items-center justify-between"><div><h4 className="font-semibold text-navy-900">Upcoming deliveries</h4><p className="mt-0.5 text-xs text-slate-500">Next scheduled customer orders</p></div><Link to="/orders" className="text-xs font-medium text-blue-700 hover:underline">View all</Link></div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead><tr className="border-b border-slate-100 text-left text-xs text-slate-500"><th className="pb-3 font-medium">Order</th><th className="pb-3 font-medium">Customer</th><th className="pb-3 font-medium">Garment</th><th className="pb-3 font-medium">Delivery</th><th className="pb-3 text-right font-medium">Status</th></tr></thead>
            <tbody>{data.upcomingDeliveries.map(order => <tr key={order.id} className="border-b border-slate-50 last:border-0">
              <td className="py-3"><Link to={"/orders/" + order.id} className="font-medium text-blue-700 hover:underline">{order.orderNo}</Link></td>
              <td className="py-3">{order.customerName}</td><td className="py-3">{order.garment}</td><td className="py-3"><span className="font-medium">{relativeDate(order.deliveryDate!)}</span><span className="ml-1 text-[11px] text-slate-400">{dateTime(order.deliveryDate!)}</span></td>
              <td className="py-3 text-right"><span className={"rounded-full px-2.5 py-1 text-[11px] font-medium " + statusBadge(order.status)}>{statusLabels[order.status]}</span></td>
            </tr>)}</tbody>
          </table>
          {!data.upcomingDeliveries.length && <p className="py-8 text-center text-sm text-slate-500">No upcoming deliveries.</p>}
        </div>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-5">
        <div className="flex items-center justify-between"><div><h4 className="font-semibold text-navy-900">Pending payments</h4><p className="mt-0.5 text-xs text-slate-500">Customers with an outstanding balance</p></div><span className="text-sm font-semibold text-rose-700">{money(data.outstandingFils)}</span></div>
        <div className="mt-4 space-y-2">
          {data.pendingPayments.map(payment => <Link key={payment.id} to={"/orders/" + payment.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
            <span className="min-w-0"><span className="block truncate text-sm font-medium text-slate-800">{payment.customerName}</span><span className="block text-xs text-slate-500">{payment.orderNo}</span></span>
            <span className="text-right"><span className="block text-sm font-semibold text-rose-700">{money(payment.outstandingFils)}</span><span className="block text-[11px] text-slate-400">of {money(payment.totalAmountFils)}</span></span>
          </Link>)}
          {!data.pendingPayments.length && <p className="py-8 text-center text-sm text-slate-500">All payments are settled.</p>}
        </div>
      </article>
    </section>

    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between"><div><h4 className="font-semibold text-navy-900">Top designs</h4><p className="mt-0.5 text-xs text-slate-500">Most frequently attached reusable designs</p></div><Link to="/designs" className="text-xs font-medium text-blue-700 hover:underline">View library</Link></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {data.topDesigns.map(design => <Link key={design.id} to="/designs" className="overflow-hidden rounded-lg border border-slate-100 bg-slate-50 transition hover:-translate-y-0.5 hover:shadow-sm">
          <div className="aspect-[4/3] bg-slate-100">{design.imagePath ? <img src={design.imagePath} alt={design.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-2xl font-semibold text-slate-300">SP</div>}</div>
          <div className="p-3"><p className="truncate text-xs text-slate-500">{design.designNo}</p><p className="mt-1 truncate text-sm font-semibold text-navy-900">{design.name}</p><p className="mt-1 text-xs text-slate-500">{design.orders} order{design.orders === 1 ? "" : "s"} · {design.garment}</p></div>
        </Link>)}
      </div>
      {!data.topDesigns.length && <p className="py-8 text-center text-sm text-slate-500">Design usage will appear here as orders are linked to designs.</p>}
    </section>
  </div>;
}
