import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { Icon, type IconName } from "../components/Icons";
import { useCountUp } from "../hooks/useCountUp";
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

const statusItems: Array<{ key: OrderStatus; className: string; color: string }> = [
  { key: "DELIVERED", className: "bg-emerald-500", color: "#10b981" },
  { key: "STITCHING", className: "bg-blue-500", color: "#3b82f6" },
  { key: "PENDING", className: "bg-amber-400", color: "#fbbf24" },
  { key: "READY", className: "bg-violet-500", color: "#8b5cf6" },
  { key: "QUALITY_CHECK", className: "bg-orange-400", color: "#fb923c" },
  { key: "MEASUREMENT", className: "bg-cyan-500", color: "#06b6d4" },
  { key: "CUTTING", className: "bg-indigo-500", color: "#6366f1" },
  { key: "CANCELLED", className: "bg-slate-400", color: "#94a3b8" },
];

const cardStyles: ReadonlyArray<{ key: "orders" | "paidFils" | "pending" | "ready" | "delayed" | "outstandingFils"; label: string; icon: IconName; gradient: string; chip: string }> = [
  { key: "orders", label: "Total orders", icon: "orders", gradient: "from-blue-50 via-white to-white", chip: "from-blue-500 to-blue-700 shadow-blue-500/40" },
  { key: "paidFils", label: "Payments received", icon: "wallet", gradient: "from-emerald-50 via-white to-white", chip: "from-emerald-400 to-emerald-600 shadow-emerald-500/40" },
  { key: "pending", label: "Pending orders", icon: "clock", gradient: "from-amber-50 via-white to-white", chip: "from-amber-400 to-orange-500 shadow-amber-500/40" },
  { key: "ready", label: "Ready for delivery", icon: "check", gradient: "from-violet-50 via-white to-white", chip: "from-violet-400 to-violet-600 shadow-violet-500/40" },
  { key: "delayed", label: "Delayed orders", icon: "alert", gradient: "from-rose-50 via-white to-white", chip: "from-rose-400 to-rose-600 shadow-rose-500/40" },
  { key: "outstandingFils", label: "Outstanding payments", icon: "payments", gradient: "from-slate-100 via-white to-white", chip: "from-slate-500 to-slate-700 shadow-slate-500/40" },
];

function StatValue({ value, isMoney }: { value: number; isMoney: boolean }) {
  const animated = useCountUp(value);
  return <>{isMoney ? money(animated) : Math.round(animated).toLocaleString()}</>;
}

function StatusDonut({ counts, total }: { counts: Array<{ color: string; value: number }>; total: number }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 120); return () => clearTimeout(t); }, []);
  const r = 52;
  const c = 2 * Math.PI * r;
  let cursor = 0;
  return (
    <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#eef3fa" strokeWidth="16" />
      {total > 0 && counts.map((seg, i) => {
        if (seg.value <= 0) return null;
        const len = (seg.value / total) * c;
        const start = cursor;
        cursor += len;
        return <circle key={i} cx="70" cy="70" r={r} fill="none" stroke={seg.color} strokeWidth="16" strokeLinecap="butt"
          strokeDasharray={(ready ? Math.max(len - 2, 0) : 0) + " " + c}
          strokeDashoffset={-start}
          style={{ transition: "stroke-dasharray 1.1s cubic-bezier(.22,1,.36,1) " + i * 90 + "ms" }} />;
      })}
    </svg>
  );
}

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

  const maxRevenue = useMemo(() => Math.max(1, ...(data?.shops ?? []).map(shop => shop.revenueFils)), [data]);

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!data) return <LoadingState label="Loading live dashboard…" />;

  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";

  const rowDelay = (n: number) => ({ animationDelay: 120 + n * 60 + "ms" });

  return <div className="mx-auto max-w-7xl space-y-6">
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f3a6e] via-[#1554b8] to-[#2f86f6] p-6 text-white shadow-lift sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 animate-blob rounded-full bg-white/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 animate-blob rounded-full bg-cyan-300/20 blur-3xl [animation-delay:-6s]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-brand-100/80">Admin dashboard</p>
          <h3 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{greeting}, Admin <span className="inline-block origin-[70%_70%] animate-float">👋</span></h3>
          <p className="mt-2 max-w-xl text-sm text-brand-100/90">Here’s what’s happening across your tailoring business today.</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-5 py-3.5 backdrop-blur-md">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20"><Icon name="clock" className="h-5 w-5" /></span>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-brand-100/80">Today</p>
            <p className="font-semibold">{new Intl.DateTimeFormat("en-KW", { weekday: "long", day: "2-digit", month: "short", year: "numeric" }).format(new Date())}</p>
          </div>
        </div>
      </div>
    </section>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      {cardStyles.map((card, index) => {
        const isMoney = card.key.endsWith("Fils");
        return <article key={card.key} style={{ animationDelay: 100 + index * 70 + "ms" }} className={"group relative animate-fade-up overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-br p-4 shadow-soft " + card.gradient}>
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold text-slate-500">{card.label}</p>
            <span className={"flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 " + card.chip}><Icon name={card.icon} className="h-[18px] w-[18px]" /></span>
          </div>
          <p className="mt-4 text-2xl font-extrabold tracking-tight text-navy-900 tabular-nums"><StatValue value={data[card.key]} isMoney={isMoney} /></p>
          <span className={"absolute inset-x-0 bottom-0 h-1 origin-left animate-grow-x bg-gradient-to-r " + card.chip.split(" shadow")[0]} style={{ animationDelay: 400 + index * 70 + "ms" }} />
        </article>;
      })}
    </section>

    <section className="grid items-start gap-4 lg:grid-cols-12">
      <article className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-soft lg:col-span-6">
        <div className="flex items-center justify-between">
          <div><h4 className="font-bold text-navy-900">Shop performance</h4><p className="mt-0.5 text-xs text-slate-500">Orders and revenue by active shop</p></div>
          <Link to="/shops" className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50">View shops →</Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead><tr className="border-b border-slate-100 text-left text-xs text-slate-500"><th className="pb-3 font-medium">Shop</th><th className="pb-3 font-medium">Orders</th><th className="pb-3 font-medium">Completed</th><th className="pb-3 font-medium">In progress</th><th className="pb-3 text-right font-medium">Revenue</th></tr></thead>
            <tbody>
              {data.shops.map((shop, i) => <tr key={shop.id} style={rowDelay(i)} className="animate-fade-up border-b border-slate-50 last:border-0">
                <td className="py-3"><p className="font-semibold text-slate-800">{shop.name}</p><p className="text-[11px] text-slate-500">{shop.area}</p></td>
                <td className="py-3 font-medium">{shop.orders}</td>
                <td className="py-3 font-medium text-emerald-700">{shop.completed}</td>
                <td className="py-3 font-medium text-blue-700">{shop.inProgress}</td>
                <td className="py-3 text-right">
                  <span className="font-semibold">{money(shop.revenueFils)}</span>
                  <span className="ml-auto mt-1.5 block h-1.5 w-full max-w-[120px] overflow-hidden rounded-full bg-slate-100 sm:ml-auto">
                    <span className="block h-full origin-left animate-grow-x rounded-full bg-gradient-to-r from-brand-400 to-brand-600" style={{ width: Math.max(4, (shop.revenueFils / maxRevenue) * 100) + "%", animationDelay: 300 + i * 90 + "ms" }} />
                  </span>
                </td>
              </tr>)}
            </tbody>
          </table>
          {!data.shops.length && <p className="py-8 text-center text-sm text-slate-500">No active shops yet.</p>}
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-soft lg:col-span-3">
        <div><h4 className="font-bold text-navy-900">Order status</h4><p className="mt-0.5 text-xs text-slate-500">Current order distribution</p></div>
        <div className="mt-5 flex flex-col items-center gap-5">
          <div className="relative h-40 w-40 shrink-0">
            <StatusDonut total={totalStatusOrders} counts={statusItems.map(item => ({ color: item.color, value: data.orderStatus[item.key] ?? 0 }))} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-navy-900 tabular-nums"><StatValue value={totalStatusOrders} isMoney={false} /></span>
              <span className="text-[11px] font-medium text-slate-500">Orders</span>
            </div>
          </div>
          <div className="w-full space-y-1.5">
            {statusItems.map(item => <div key={item.key} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-xs transition-colors hover:bg-slate-50">
              <span className="flex min-w-0 items-center gap-2"><span className={"h-2.5 w-2.5 shrink-0 rounded-full " + item.className}></span><span className="truncate text-slate-600">{statusLabels[item.key]}</span></span>
              <span className="font-bold text-slate-800">{data.orderStatus[item.key] ?? 0}</span>
            </div>)}
          </div>
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-soft lg:col-span-3">
        <div className="flex items-center justify-between"><div><h4 className="font-bold text-navy-900">Recent activity</h4><p className="mt-0.5 text-xs text-slate-500">Latest order changes</p></div><Link to="/orders" className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50">View all</Link></div>
        <div className="relative mt-3 max-h-[360px] space-y-0.5 overflow-y-auto pr-1">
          {data.activity.slice(0, 5).map((item, i) => <Link key={item.id} to={"/orders/" + item.orderId} style={rowDelay(i)} className="flex animate-slide-right gap-3 rounded-xl p-2.5 hover:bg-brand-50/70">
            <span className={"mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold " + (item.type === "ORDER_CREATED" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700")}>{item.type === "ORDER_CREATED" ? "+" : "↻"}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-slate-800">{item.type === "ORDER_CREATED" ? "New order created" : "Order updated"}</span><span className="block truncate text-[11px] text-slate-500">{item.orderNo} · {item.customerName}</span><span className="mt-0.5 block text-[10px] text-slate-400">{dateTime(item.timestamp)}</span></span>
          </Link>)}
          {!data.activity.length && <p className="py-8 text-center text-sm text-slate-500">No recent activity.</p>}
        </div>
      </article>
    </section>

    <section className="grid gap-4 lg:grid-cols-12">
      <article className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-soft lg:col-span-7">
        <div className="flex items-center justify-between"><div><h4 className="font-bold text-navy-900">Upcoming deliveries</h4><p className="mt-0.5 text-xs text-slate-500">Next scheduled customer orders</p></div><Link to="/orders" className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50">View all</Link></div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead><tr className="border-b border-slate-100 text-left text-xs text-slate-500"><th className="pb-3 font-medium">Order</th><th className="pb-3 font-medium">Customer</th><th className="pb-3 font-medium">Garment</th><th className="pb-3 font-medium">Delivery</th><th className="pb-3 text-right font-medium">Status</th></tr></thead>
            <tbody>{data.upcomingDeliveries.map((order, i) => <tr key={order.id} style={rowDelay(i)} className="animate-fade-up border-b border-slate-50 last:border-0">
              <td className="py-3"><Link to={"/orders/" + order.id} className="font-semibold text-brand-600 hover:underline">{order.orderNo}</Link></td>
              <td className="py-3">{order.customerName}</td><td className="py-3">{order.garment}</td><td className="py-3"><span className="font-semibold">{relativeDate(order.deliveryDate!)}</span><span className="ml-1 text-[11px] text-slate-400">{dateTime(order.deliveryDate!)}</span></td>
              <td className="py-3 text-right"><span className={"rounded-full px-2.5 py-1 text-[11px] font-semibold " + statusBadge(order.status)}>{statusLabels[order.status]}</span></td>
            </tr>)}</tbody>
          </table>
          {!data.upcomingDeliveries.length && <p className="py-8 text-center text-sm text-slate-500">No upcoming deliveries.</p>}
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-soft lg:col-span-5">
        <div className="flex items-center justify-between"><div><h4 className="font-bold text-navy-900">Pending payments</h4><p className="mt-0.5 text-xs text-slate-500">Customers with an outstanding balance</p></div><span className="rounded-full bg-rose-50 px-3 py-1 text-sm font-bold text-rose-700">{money(data.outstandingFils)}</span></div>
        <div className="mt-4 space-y-2">
          {data.pendingPayments.map((payment, i) => <Link key={payment.id} to={"/orders/" + payment.id} style={rowDelay(i)} className="group flex animate-fade-up items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 hover:border-brand-200 hover:bg-brand-50/50 hover:shadow-soft">
            <span className="min-w-0"><span className="block truncate text-sm font-semibold text-slate-800">{payment.customerName}</span><span className="block text-xs text-slate-500">{payment.orderNo}</span></span>
            <span className="text-right"><span className="block text-sm font-bold text-rose-700">{money(payment.outstandingFils)}</span><span className="block text-[11px] text-slate-400">of {money(payment.totalAmountFils)}</span></span>
          </Link>)}
          {!data.pendingPayments.length && <p className="py-8 text-center text-sm text-slate-500">All payments are settled.</p>}
        </div>
      </article>
    </section>

    <section className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-soft">
      <div className="flex items-center justify-between"><div><h4 className="font-bold text-navy-900">Top designs</h4><p className="mt-0.5 text-xs text-slate-500">Most frequently attached reusable designs</p></div><Link to="/designs" className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50">View library →</Link></div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {data.topDesigns.map((design, i) => <Link key={design.id} to="/designs" style={rowDelay(i)} className="group animate-fade-up overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-soft transition duration-300 hover:-translate-y-1.5 hover:border-brand-200 hover:shadow-lift">
          <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-brand-50 to-slate-100">{design.imagePath ? <img src={design.imagePath} alt={design.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-2xl font-bold text-brand-200">SP</div>}</div>
          <div className="p-3"><p className="truncate text-xs text-slate-500">{design.designNo}</p><p className="mt-1 truncate text-sm font-bold text-navy-900">{design.name}</p><p className="mt-1 text-xs text-slate-500">{design.orders} order{design.orders === 1 ? "" : "s"} · {design.garment}</p></div>
        </Link>)}
      </div>
      {!data.topDesigns.length && <p className="py-8 text-center text-sm text-slate-500">Design usage will appear here as orders are linked to designs.</p>}
    </section>
  </div>;
}
