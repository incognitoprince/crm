import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { Icon } from "../components/Icons";
import { PinIcon, SpoolIcon, ShearsIcon, SeamRipperIcon, WarningTagIcon, SkeinButtonIcon, ButtonBadge } from "../components/AtelierIcons";
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
  { key: "DELIVERED", className: "bg-[#244F41]", color: "#244F41" },
  { key: "STITCHING", className: "bg-[#B5892E]", color: "#B5892E" },
  { key: "PENDING", className: "bg-[#A83830]", color: "#A83830" },
  { key: "READY", className: "bg-[#6F8294]", color: "#6F8294" },
  { key: "QUALITY_CHECK", className: "bg-[#B97854]", color: "#B97854" },
  { key: "MEASUREMENT", className: "bg-[#C5BCA8]", color: "#C5BCA8" },
  { key: "CUTTING", className: "bg-[#5C5852]", color: "#5C5852" },
  { key: "CANCELLED", className: "bg-[#8A8377]", color: "#8A8377" },
];

const cardStyles = [
  { key: "orders", label: "Total orders", IconComponent: PinIcon, tone: "#B5892E" },
  { key: "paidFils", label: "Payments received", IconComponent: SpoolIcon, tone: "#244F41" },
  { key: "pending", label: "Pending orders", IconComponent: ShearsIcon, tone: "#B5892E" },
  { key: "ready", label: "Ready for delivery", IconComponent: SeamRipperIcon, tone: "#244F41" },
  { key: "delayed", label: "Delayed orders", IconComponent: WarningTagIcon, tone: "#A83830" },
  { key: "outstandingFils", label: "Outstanding payments", IconComponent: SkeinButtonIcon, tone: "#5C5852" },
] as const;

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

  return <div className="crm-layout-bg mx-auto max-w-7xl space-y-6">
    <section className="atelier-card relative overflow-hidden p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#B5892E]/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-[#244F41]/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:radial-gradient(#B5892E_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#8A8377]">Admin dashboard</p>
          <h3 className="atelier-serif mt-2 text-3xl font-bold tracking-tight text-[#1E1C1A] sm:text-4xl">{greeting}, Admin <span className="inline-block origin-[70%_70%] animate-float">👋</span></h3>
          <p className="mt-2 max-w-xl text-sm text-[#5C5852]">Here’s what’s happening across your tailoring business today.</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-[#DED6C6] bg-[#EFE9DC] px-5 py-3.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B5892E]/15 text-[#5C5852]"><Icon name="clock" className="h-5 w-5" /></span>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#8A8377]">Today</p>
            <p className="font-semibold text-[#1E1C1A]">{new Intl.DateTimeFormat("en-KW", { weekday: "long", day: "2-digit", month: "short", year: "numeric" }).format(new Date())}</p>
          </div>
        </div>
      </div>
    </section>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      {cardStyles.map((card, index) => {
        const isMoney = card.key.endsWith("Fils");
        const MetricIcon = card.IconComponent;
        return <article key={card.key} style={{ animationDelay: 100 + index * 70 + "ms" }} className="atelier-card group relative animate-fade-up overflow-hidden p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold text-[#5C5852]">{card.label}</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFE9DC] transition-transform duration-300 group-hover:rotate-3 group-hover:scale-110"><MetricIcon className="h-7 w-7" {...(card.key === "paidFils" ? { color: card.tone } : {})} /></span>
          </div>
          <p className="atelier-serif mt-4 text-2xl font-bold tracking-tight text-[#1E1C1A] tabular-nums"><StatValue value={data[card.key]} isMoney={isMoney} /></p>
          <span className="absolute inset-x-5 bottom-2 h-px bg-[#B5892E]/35" />
        </article>;
      })}
    </section>

    <section className="grid items-start gap-4 lg:grid-cols-12">
      <article className="atelier-card atelier-card-kraft p-5 lg:col-span-6">
        <div className="flex items-center justify-between">
          <div><h4 className="atelier-serif font-bold text-[#1E1C1A]">Shop performance</h4><p className="mt-0.5 text-xs text-slate-500">Orders and revenue by active shop</p></div>
          <Link to="/shops" className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50">View shops →</Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead><tr className="border-b border-[#D5CCB9] text-left text-xs text-[#5C5852]"><th className="pb-3 font-medium">Shop</th><th className="pb-3 font-medium">Orders</th><th className="pb-3 font-medium">Completed</th><th className="pb-3 font-medium">In progress</th><th className="pb-3 text-right font-medium">Revenue</th></tr></thead>
            <tbody>
              {data.shops.map((shop, i) => <tr key={shop.id} style={rowDelay(i)} className="atelier-row animate-fade-up">
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

      <article className="atelier-card p-5 lg:col-span-3">
        <div><h4 className="font-bold text-navy-900">Order status</h4><p className="mt-0.5 text-xs text-slate-500">Current order distribution</p></div>
        <div className="mt-5 flex flex-col items-center gap-5">
          <div className="relative h-40 w-40 shrink-0">
            <StatusDonut total={totalStatusOrders} counts={statusItems.map(item => ({ color: item.color, value: data.orderStatus[item.key] ?? 0 }))} />
            <div className="atelier-donut-center absolute inset-[22px] flex flex-col items-center justify-center">
              <span className="atelier-serif text-3xl font-bold text-[#1E1C1A] tabular-nums"><StatValue value={totalStatusOrders} isMoney={false} /></span>
              <span className="text-[11px] font-medium text-[#5C5852]">Orders</span>
            </div>
          </div>
          <div className="w-full space-y-1.5">
            {statusItems.map(item => <div key={item.key} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-xs transition-colors hover:bg-[#EFE9DC]">
              <span className="flex min-w-0 items-center gap-2"><ButtonBadge color={item.color} size={14} /><span className="truncate text-slate-600">{statusLabels[item.key]}</span></span>
              <span className="font-bold text-slate-800">{data.orderStatus[item.key] ?? 0}</span>
            </div>)}
          </div>
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-soft lg:col-span-3">
        <div className="flex items-center justify-between"><div><h4 className="font-bold text-navy-900">Recent activity</h4><p className="mt-0.5 text-xs text-slate-500">Latest order changes</p></div><Link to="/orders" className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50">View all</Link></div>
        <div className="atelier-thread-line relative mt-3 max-h-[360px] space-y-0.5 overflow-y-auto pr-1">
          {data.activity.slice(0, 5).map((item, i) => <Link key={item.id} to={"/orders/" + item.orderId} style={rowDelay(i)} className="flex animate-slide-right gap-3 rounded-xl p-2.5 hover:bg-brand-50/70">
            <span className="relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FAF7F0] ring-2 ring-[#DED6C6]"><SpoolIcon color={item.type === "ORDER_CREATED" ? "#244F41" : "#B5892E"} className="h-6 w-6" /></span>
            <span className="min-w-0 flex-1"><span className="atelier-activity-divider block truncate text-xs font-semibold text-[#1E1C1A]">{item.type === "ORDER_CREATED" ? "New order created" : "Order updated"}</span><span className="block truncate text-[11px] text-slate-500">{item.orderNo} · {item.customerName}</span><span className="mt-0.5 block text-[10px] text-slate-400">{dateTime(item.timestamp)}</span></span>
          </Link>)}
          {!data.activity.length && <p className="py-8 text-center text-sm text-slate-500">No recent activity.</p>}
        </div>
      </article>
    </section>

    <section className="grid gap-4 lg:grid-cols-12">
      <article className="atelier-card p-5 lg:col-span-7">
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
          {!data.upcomingDeliveries.length && <div className="py-7 text-center"><span className="atelier-swatch-empty">No upcoming deliveries.</span></div>}
        </div>
      </article>

      <article className="atelier-card p-5 lg:col-span-5">
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

    <section className="atelier-card p-5">
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
